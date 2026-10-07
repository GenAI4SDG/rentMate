"""drift_check.py -- turn a confirmed doc into a mechanical check, once, then re-run it.

The pattern this implements (three behaviours, deliberately separated):

    extract   doc-confirmation -> list the *mechanically checkable* claims
    bless     first run -> record observed results as a GOLDEN baseline
    check     later runs -> compare against the baseline; exit 1 on drift

Design rules, learned the hard way:

1. EXTRACT ONLY THE MECHANICAL. A claim is extractable only if a machine can
   decide it without interpretation: a quoted value, a symbol/identifier, a
   command, a file path. Prose meaning is NOT extractable -- and must never be
   guessed, because a generator that invents a check from ambiguous prose has
   become the specification. That inversion is the failure this tool exists to
   avoid.

2. GOLDEN != CORRECT. `bless` records whatever the code did on the first run.
   That captures *current behaviour*, not *correct behaviour*: it catches
   accidental change, never proves intent. Every artefact written by `bless`
   is stamped `"kind": "golden", "proves": "no-change-since-baseline"` so it can
   never be mistaken for a correctness proof.

3. REPORT, NEVER EDIT. Like doc-reconcile: a drift check can prove doc != reality,
   not which side is right. This tool never rewrites the doc or the code.

Claim kinds (v1, deliberately small -- extend only with a matching validator):
    vocabulary   {name, values[]}        must equal the values found in a source
    symbol       {name, present:true}    must be defined in a source
    command      {tool, sub}             subcommand must exist in that module
    path         {path, present:true}    file must exist
(These four are the only kinds `extract_claims` emits and `evaluate` validates.
A fifth kind is NOT implemented: an unknown kind evaluates to ok=False with
"unknown claim kind", so never document one before its validator exists.)

Baseline file (written by `bless`): `drift_baseline.<DOCSTEM>.json` next to the doc,
or wherever `--baseline` says. `check` recomputes and diffs it. The name is keyed on
the doc's stem so sibling docs in one directory do not overwrite each other.

Usage:
    python drift_check.py extract DOC --target DIR [--out claims.json]
    python drift_check.py bless   DOC --target DIR [--baseline B] [--by NAME]
    python drift_check.py check   DOC --target DIR [--baseline B]

Exit codes: extract/bless -> 0 unless a hard error; check -> 1 on any drift.
"""

from __future__ import annotations

import argparse
import ast
import hashlib
import json
import re
import sys
from dataclasses import dataclass, field, asdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional, Sequence, Tuple

SCHEMA = 1


# ---------------------------------------------------------------------------
# Target introspection (generic: works for a dir of .py modules)
# ---------------------------------------------------------------------------

@dataclass
class TargetFacts:
    vocabularies: Dict[str, Tuple[str, ...]] = field(default_factory=dict)
    functions: set = field(default_factory=set)
    cli_subcommands: Dict[str, set] = field(default_factory=dict)  # module -> subs
    files: set = field(default_factory=set)
    texts: Dict[str, str] = field(default_factory=dict)            # name -> source
    # Absolute dirs a `path` claim may be resolved against, in order. A path in
    # a doc is usually written relative to the repo root OR to the doc itself;
    # checking only `--target` (a subdir) produced false "missing" findings.
    roots: List[Path] = field(default_factory=list)


def resolve_path(claim_path: str, tf: TargetFacts) -> Optional[Path]:
    """Resolve a doc-referenced path against the known roots, first hit wins.

    Three passes, cheapest first:

    1. ``root / claim_path`` and ``root / basename`` -- the common case.
    2. a bounded recursive search for the basename under each root. A doc often
       names a file by its bare basename (``h23_census.py``) while it actually
       lives in a subdirectory (``bench/scripts/``). Pass 1 called that
       "missing", which is a false positive: the file exists, the doc just did
       not spell the path. This is the fix for the 2026-10-05 false positives
       on ``h23_census.py`` and ``results.json``.
    3. give up -- report genuinely missing.

    The recursion is depth- and count-bounded so a large tree cannot turn a
    check into a full-disk walk, and it skips VCS/cache dirs.
    """
    import os
    for root in tf.roots:
        p = root / claim_path
        if p.exists():
            return p
        # bare basename directly under the root (e.g. "MEMORY.md")
        p2 = root / os.path.basename(claim_path)
        if p2.exists():
            return p2

    # Pass 2: bounded recursive search for the basename.
    base = os.path.basename(claim_path)
    if not base:
        return None
    skip = {".git", ".venv", "__pycache__", "node_modules", ".mypy_cache",
            ".pytest_cache", ".ruff_cache", ".workbuddy-ai"}
    budget = 20_000  # files examined before giving up
    for root in tf.roots:
        if not root.is_dir():
            continue
        for dirpath, dirnames, filenames in os.walk(root):
            dirnames[:] = [d for d in dirnames if d not in skip]
            for name in filenames:
                budget -= 1
                if budget < 0:
                    return None
                if name == base:
                    return Path(dirpath) / name
    return None


def _iter_py(target: Path) -> List[Path]:
    """Every .py under `target`, RECURSIVELY.

    Non-recursive `glob("*.py")` silently sees only the top level, so a
    package-layout repo (core/*.py, model/*.py) had zero nested modules in
    `tf.files` — every nested `symbol`/`vocabulary`/`command` claim was then
    evaluated against an empty set and blessed as `present: false`. That is a
    false baseline of exactly the "golden != correct" kind this tool warns
    about. Walk the tree, skipping the same noise dirs as `resolve_path`.
    """
    import os
    skip = {".git", ".venv", "venv", "__pycache__", "node_modules",
            ".mypy_cache", ".pytest_cache", ".ruff_cache", ".workbuddy-ai",
            ".tox", "build", "dist", ".eggs"}
    out: List[Path] = []
    if target.is_file():
        return [target] if target.suffix == ".py" else []
    for dirpath, dirnames, filenames in os.walk(target):
        dirnames[:] = [d for d in dirnames if d not in skip and not d.endswith(".egg-info")]
        for name in filenames:
            if name.endswith(".py") and not name.endswith("_faults.py"):
                out.append(Path(dirpath) / name)
    return sorted(out)


def _const_tuple(node: ast.AST) -> Optional[Tuple[str, ...]]:
    if not isinstance(node, ast.Assign) or not isinstance(node.value, (ast.Tuple, ast.List)):
        return None
    vals: List[str] = []
    for e in node.value.elts:
        if isinstance(e, ast.Constant) and isinstance(e.value, str):
            vals.append(e.value)
        else:
            return None
    return tuple(vals)


def read_target(target: Path, doc_path: Optional[Path] = None,
                extra_roots: Sequence[Path] = ()) -> TargetFacts:
    tf = TargetFacts()
    tf.roots = [target.resolve()]
    if doc_path is not None:
        tf.roots.append(doc_path.resolve().parent)
    for r in extra_roots:
        tf.roots.append(Path(r).resolve())
    # the repo root is two levels up from a typical <repo>/<pkg>/ file, but we
    # also walk up from the target so a "planning_graph/PLANNING_SPEC.md" claim
    # resolves against the repo root.
    for base in (target.resolve(), doc_path.resolve().parent if doc_path else None):
        if base is None:
            continue
        for up in (base, *list(base.parents)[:3]):
            if up not in tf.roots:
                tf.roots.append(up)
    for py in _iter_py(target):
        # Key by BOTH the relative path (collision-proof) and the bare basename
        # (what `command` claims name, e.g. "cli.py run"). Basename-only keying
        # let two same-named modules in different dirs silently overwrite.
        try:
            rel = py.relative_to(target.resolve()).as_posix()
        except ValueError:
            rel = py.name
        tf.files.add(py.name)
        tf.files.add(rel)
        src = py.read_text(encoding="utf-8-sig")
        tf.texts[py.name] = src
        tf.texts.setdefault(rel, src)
        try:
            tree = ast.parse(src)
        except SyntaxError:
            continue
        for node in ast.walk(tree):
            if isinstance(node, ast.Assign):
                for t in node.targets:
                    if isinstance(t, ast.Name) and t.id.isupper():
                        tup = _const_tuple(node)
                        if tup is not None:
                            tf.vocabularies[t.id] = tup
            if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
                tf.functions.add(node.name)
            if isinstance(node, ast.Call):
                fn = node.func
                if (isinstance(fn, ast.Attribute) and fn.attr == "add_parser"
                        and node.args and isinstance(node.args[0], ast.Constant)
                        and isinstance(node.args[0].value, str)):
                    tf.cli_subcommands.setdefault(py.name, set()).add(
                        node.args[0].value)
    return tf


# ---------------------------------------------------------------------------
# Claim model
# ---------------------------------------------------------------------------

@dataclass
class Claim:
    kind: str            # vocabulary | symbol | command | path
    key: str             # human id, e.g. "IO_TYPES" or "validate"
    spec: Dict[str, Any] # kind-specific fields
    source: str = ""     # doc anchor / line where the claim came from

    def to_json(self) -> Dict[str, Any]:
        return asdict(self)


# ---------------------------------------------------------------------------
# Extraction: doc -> claims
#
# This is the *doc-confirmation* half. It reads the doc, finds things a machine
# can decide, and returns them. It NEVER invents a claim from prose.
# ---------------------------------------------------------------------------

_VOCAB_DECL_RE = re.compile(
    r"\b(?P<name>[A-Z][A-Z0-9_]{2,})\b\s*[:(]?\s*(?:is|are|=)?\s*"
    r"(?P<values>[a-z_][a-z0-9_]*(?:\s*[/,|]\s*[a-z_][a-z0-9_]*)+)")
_SYMBOL_RE = re.compile(r"`(?P<name>[a-z_][a-z0-9_]*)\(\)?")
_CMD_RE = re.compile(r"(?P<tool>[A-Za-z0-9_]+\.py)\s+(?P<sub>[a-z][a-z0-9-]*)")
_PATH_RE = re.compile(r"`(?P<path>[\w./-]+\.(?:py|md|json|toml|yaml|yml))`")


def extract_claims(doc_text: str, tf: TargetFacts) -> List[Claim]:
    """Extract only claims a machine can decide against `tf`.

    A claim is emitted only when it is verifiable: the name it references must
    exist in the target for us to know what to compare against. If a doc claims
    a vocabulary whose name the target has never heard of, we DO emit it (as a
    `vocabulary` claim with `values=[]`) so `check` can flag it -- but we never
    invent values.
    """
    claims: List[Claim] = []
    seen: set = set()

    # --- vocabularies ------------------------------------------------------
    for m in _VOCAB_DECL_RE.finditer(doc_text):
        name = m.group("name")
        vals = [v.strip() for v in re.split(r"[/,|]", m.group("values")) if v.strip()]
        if len(vals) < 2:
            continue
        key = f"vocabulary:{name}"
        if key in seen:
            continue
        seen.add(key)
        claims.append(Claim("vocabulary", name,
                            {"claimed_values": vals},
                            _anchor(doc_text, m.start())))

    # --- symbols the doc presents as API -----------------------------------
    # Only treat a symbol as a target claim if the target actually defines
    # something by that name OR the symbol looks like this target's API
    # (snake_case, not a stray prose word). We keep it conservative.
    for m in _SYMBOL_RE.finditer(doc_text):
        name = m.group("name")
        key = f"symbol:{name}"
        if key in seen or name in {"e", "g", "i", "n", "x", "s", "json", "open",
                                   "print", "python", "import"}:
            continue
        seen.add(key)
        claims.append(Claim("symbol", name, {"present": True},
                            _anchor(doc_text, m.start())))

    # --- CLI commands ------------------------------------------------------
    for m in _CMD_RE.finditer(doc_text):
        tool, sub = m.group("tool"), m.group("sub")
        key = f"command:{tool}:{sub}"
        if key in seen:
            continue
        seen.add(key)
        claims.append(Claim("command", f"{tool} {sub}",
                            {"tool": tool, "sub": sub},
                            _anchor(doc_text, m.start())))

    # --- paths -------------------------------------------------------------
    for m in _PATH_RE.finditer(doc_text):
        p = m.group("path")
        key = f"path:{p}"
        if key in seen:
            continue
        seen.add(key)
        claims.append(Claim("path", p, {"present": True},
                            _anchor(doc_text, m.start())))

    return claims


def _anchor(text: str, pos: int) -> str:
    line = text.count("\n", 0, pos) + 1
    return f"line {line}"


# ---------------------------------------------------------------------------
# Evaluation: claim -> observed result
# ---------------------------------------------------------------------------

def evaluate(claim: Claim, tf: TargetFacts) -> Dict[str, Any]:
    """Return {"ok": bool, "observed": ..., "detail": str}. Deterministic."""
    k = claim.kind
    if k == "vocabulary":
        actual = list(tf.vocabularies.get(claim.key, ()))
        claimed = claim.spec.get("claimed_values", [])
        missing = [v for v in claimed if v not in actual]
        unknown_name = claim.key not in tf.vocabularies
        return {
            "ok": (not unknown_name) and (not missing),
            "observed": actual,
            "detail": ("name not found in target" if unknown_name
                       else f"missing values: {missing}" if missing
                       else "all claimed values present"),
        }
    if k == "symbol":
        present = claim.key in tf.functions
        return {"ok": present, "observed": present,
                "detail": "defined" if present else "not defined in target"}
    if k == "command":
        tool = claim.spec["tool"]
        sub = claim.spec["sub"]
        subs = tf.cli_subcommands.get(tool)
        if tool not in tf.files:
            return {"ok": False, "observed": None,
                    "detail": f"{tool} is not a target module"}
        if subs is None:
            return {"ok": False, "observed": [],
                    "detail": f"{tool} has no CLI subcommands"}
        ok = sub in subs
        return {"ok": ok, "observed": sorted(subs),
                "detail": "exists" if ok else f"no such subcommand in {tool}"}
    if k == "path":
        found = resolve_path(claim.key, tf)
        return {"ok": found is not None,
                "observed": str(found) if found else None,
                "detail": "present" if found else "missing (searched roots)"}
    return {"ok": False, "observed": None, "detail": f"unknown claim kind {k!r}"}


def evaluate_all(claims: Sequence[Claim], tf: TargetFacts) -> List[Dict[str, Any]]:
    out = []
    for c in claims:
        res = evaluate(c, tf)
        out.append({"claim": c.to_json(), "result": res})
    return out


# ---------------------------------------------------------------------------
# Baseline (bless) and drift (check)
# ---------------------------------------------------------------------------

def doc_hash(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def cmd_extract(args) -> int:
    doc = Path(args.doc).read_text(encoding="utf-8-sig")
    tf = read_target(Path(args.target), doc_path=Path(args.doc))
    claims = extract_claims(doc, tf)
    payload = {"schema": SCHEMA, "doc": str(args.doc), "claims":
               [c.to_json() for c in claims]}
    text = json.dumps(payload, indent=2, sort_keys=True)
    if args.out:
        Path(args.out).write_text(text + "\n", encoding="utf-8")
        print(f"wrote {len(claims)} claims -> {args.out}")
    else:
        print(text)
    print(f"# extracted {len(claims)} mechanically-checkable claims "
          f"(prose claims are ignored by design)", file=sys.stderr)
    return 0


def default_baseline_path(doc_path: Path) -> Path:
    """Where `bless` writes / `check` reads the baseline when `--baseline` is omitted.

    Keyed on the DOC's stem, not on the directory: `drift_baseline.<DOCSTEM>.json`
    beside the doc. The old default (`drift_baseline.json`, a fixed name) was keyed
    on the directory, so blessing two sibling docs in one folder silently
    overwrote the first baseline and a later `check` compared the doc against a
    stranger's baseline -- emitting a page of phantom CLAIM_GONE/CLAIM_ADDED. See
    the fault suite case "sibling baselines do not collide".

    Back-compat: if the stem-keyed file is absent but a legacy fixed-name
    `drift_baseline.json` sits beside the doc, that one is used, so pre-existing
    single-doc baselines keep working.
    """
    stem_keyed = doc_path.with_name(f"drift_baseline.{doc_path.stem}.json")
    legacy = doc_path.with_name("drift_baseline.json")
    if not stem_keyed.exists() and legacy.exists():
        return legacy
    return stem_keyed


def cmd_bless(args) -> int:
    doc_path = Path(args.doc)
    doc = doc_path.read_text(encoding="utf-8-sig")
    tf = read_target(Path(args.target), doc_path=doc_path)
    claims = extract_claims(doc, tf)
    results = evaluate_all(claims, tf)
    baseline = {
        "schema": SCHEMA,
        "kind": "golden",                       # <- NOT a correctness proof
        "proves": "no-change-since-baseline",
        "does_not_prove": "correctness, intent, or that the doc is right",
        "doc": str(doc_path),
        "doc_sha256": doc_hash(doc),
        "blessed_by": args.by or "unknown",
        "blessed_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "target": str(args.target),
        "claims": results,
    }
    out = Path(args.baseline) if args.baseline else default_baseline_path(doc_path)
    out.write_text(json.dumps(baseline, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    bad = [r for r in results if not r["result"]["ok"]]
    print(f"blessed {len(results)} claims -> {out}")
    print(f"# GOLDEN baseline: records what the target does NOW. "
          f"It does NOT prove the doc is correct.")
    if bad:
        print(f"# note: {len(bad)} claim(s) did not hold at bless time "
              f"(recorded as-is, not corrected):")
        for r in bad:
            print(f"#   {r['claim']['key']}: {r['result']['detail']}")
    return 0


def cmd_check(args) -> int:
    doc_path = Path(args.doc)
    doc = doc_path.read_text(encoding="utf-8-sig")
    bpath = Path(args.baseline) if args.baseline else default_baseline_path(doc_path)
    if not bpath.exists():
        print(f"error: no baseline at {bpath}; run `bless` first", file=sys.stderr)
        return 2
    baseline = json.loads(bpath.read_text(encoding="utf-8"))
    tf = read_target(Path(args.target), doc_path=doc_path)
    claims = extract_claims(doc, tf)
    now = {c.key: c for c in claims}

    drifts: List[str] = []

    # 1) the doc itself changed since blessing -> its claims may be stale
    old_doc_hash = baseline.get("doc_sha256")
    if old_doc_hash and old_doc_hash != doc_hash(doc):
        drifts.append(
            f"DOC_CHANGED: {doc_path.name} differs from the blessed revision "
            f"(re-confirm the doc, then re-bless)")

    # 2) each blessed claim still resolves the same way
    for rec in baseline.get("claims", []):
        key = rec["claim"]["key"]
        was_ok = rec["result"]["ok"]
        if key not in now:
            drifts.append(f"CLAIM_GONE: {key} no longer extracted from the doc")
            continue
        res = evaluate(now[key], tf)
        if res["ok"] != was_ok:
            drifts.append(
                f"{'REGRESSED' if was_ok and not res['ok'] else 'NOW_HOLDS'}: "
                f"{key}: was ok={was_ok}, now ok={res['ok']} ({res['detail']})")

    # 3) new claims the doc gained since blessing
    blessed_keys = {r["claim"]["key"] for r in baseline.get("claims", [])}
    for key in now:
        if key not in blessed_keys:
            drifts.append(f"CLAIM_ADDED: {key} (unblessed; re-bless to cover it)")

    print(f"# drift-check: {doc_path.name} vs {args.target}")
    print(f"# baseline: {bpath} (blessed {baseline.get('blessed_at','?')} "
          f"by {baseline.get('blessed_by','?')})")
    print(f"# {len(baseline.get('claims', []))} blessed claims, "
          f"{len(claims)} current claims")
    print()
    if drifts:
        print("## DRIFT DETECTED")
        for d in drifts:
            print("  " + d)
        print()
        print("RESULT: DRIFT")
        return 1
    print("RESULT: no drift (target still consistent with the blessed doc)")
    return 0


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def main(argv: Optional[Sequence[str]] = None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    sub = ap.add_subparsers(dest="cmd", required=True)

    e = sub.add_parser("extract", help="list mechanically-checkable claims from a doc")
    e.add_argument("doc")
    e.add_argument("--target", required=True, help="dir of source modules")
    e.add_argument("--out")
    e.set_defaults(fn=cmd_extract)

    b = sub.add_parser("bless", help="run once; record a GOLDEN baseline (not a proof)")
    b.add_argument("doc")
    b.add_argument("--target", required=True)
    b.add_argument("--baseline")
    b.add_argument("--by")
    b.set_defaults(fn=cmd_bless)

    c = sub.add_parser("check", help="re-run against the baseline; exit 1 on drift")
    c.add_argument("doc")
    c.add_argument("--target", required=True)
    c.add_argument("--baseline")
    c.set_defaults(fn=cmd_check)

    args = ap.parse_args(argv)
    return args.fn(args)


if __name__ == "__main__":
    raise SystemExit(main())
