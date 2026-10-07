"""faults.py -- prove drift_check.py catches drift and cannot silently degrade.

Two halves:
  1. UNIT: each claim kind's validator returns the right ok/fail.
  2. LOOP: extract -> bless -> mutate -> check actually reports drift (exit 1).

Run:  python faults.py
Exit: 0 if every case behaves as required; 1 otherwise.
"""

from __future__ import annotations

import sys
import tempfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import drift_check as dc


def _target(tmp: Path, name: str, body: str) -> Path:
    d = tmp / name
    d.mkdir(parents=True, exist_ok=True)
    (d / "mod.py").write_text(body, encoding="utf-8")
    return d


SRC = '''\
MODES = ("a", "b", "c")

def do_thing():
    return 1

def main():
    import argparse
    ap = argparse.ArgumentParser()
    sub = ap.add_subparsers()
    sub.add_parser("run")
    sub.add_parser("stop")
'''

DOC = """\
MODES (a/b/c)
Call `do_thing()` to work.
```bash
python mod.py run
```
See `mod.py`.
"""

fails = 0


def case(name: str, got, want):
    global fails
    if got == want:
        print(f"ok   {name}")
    else:
        fails += 1
        print(f"FAIL {name}: got {got!r}, want {want!r}")


def main() -> int:
    with tempfile.TemporaryDirectory() as td:
        tmp = Path(td)
        good = _target(tmp, "good", SRC)

        # --- unit: vocabulary ------------------------------------------------
        tf = dc.read_target(good)
        ok = dc.Claim("vocabulary", "MODES", {"claimed_values": ["a", "b", "c"]})
        case("vocab present-values -> ok", dc.evaluate(ok, tf)["ok"], True)
        bad = dc.Claim("vocabulary", "MODES", {"claimed_values": ["a", "zzz"]})
        case("vocab missing-value -> fail", dc.evaluate(bad, tf)["ok"], False)
        unknown = dc.Claim("vocabulary", "NOPE", {"claimed_values": ["a"]})
        case("vocab unknown-name -> fail", dc.evaluate(unknown, tf)["ok"], False)

        # --- unit: symbol ----------------------------------------------------
        case("symbol present -> ok",
             dc.evaluate(dc.Claim("symbol", "do_thing", {"present": True}), tf)["ok"], True)
        case("symbol absent -> fail",
             dc.evaluate(dc.Claim("symbol", "ghost", {"present": True}), tf)["ok"], False)

        # --- unit: command ---------------------------------------------------
        case("command present -> ok",
             dc.evaluate(dc.Claim("command", "mod.py run",
                                  {"tool": "mod.py", "sub": "run"}), tf)["ok"], True)
        case("command absent -> fail",
             dc.evaluate(dc.Claim("command", "mod.py explode",
                                  {"tool": "mod.py", "sub": "explode"}), tf)["ok"], False)
        case("command unknown-tool -> fail",
             dc.evaluate(dc.Claim("command", "other.py run",
                                  {"tool": "other.py", "sub": "run"}), tf)["ok"], False)

        # --- unit: path ------------------------------------------------------
        case("path present -> ok",
             dc.evaluate(dc.Claim("path", "mod.py", {"present": True}), tf)["ok"], True)
        case("path absent -> fail",
             dc.evaluate(dc.Claim("path", "nope.py", {"present": True}), tf)["ok"], False)

        # --- regression: nested modules must be seen (recursive walk) --------
        # A package layout (pkg/impl.py) is invisible to a non-recursive
        # `glob("*.py")`, so its symbols were blessed as present:false. This
        # case fails if `_iter_py` ever regresses to top-level-only.
        nested = _target(tmp, "nested", SRC)
        pkg = nested / "pkg"
        pkg.mkdir()
        (pkg / "deep.py").write_text(SRC, encoding="utf-8")
        (nested / "mod.py").unlink()  # only the nested copy remains
        ntf = dc.read_target(nested)
        case("nested symbol seen -> ok",
             dc.evaluate(dc.Claim("symbol", "do_thing", {"present": True}), ntf)["ok"], True)
        case("nested vocabulary seen -> ok",
             dc.evaluate(dc.Claim("vocabulary", "MODES",
                                  {"claimed_values": ["a", "b", "c"]}), ntf)["ok"], True)
        case("nested command seen -> ok",
             dc.evaluate(dc.Claim("command", "deep.py run",
                                  {"tool": "deep.py", "sub": "run"}), ntf)["ok"], True)

        # --- regression: bare basename living in a subdirectory --------------
        # A doc names a file by its bare basename (h23_census.py) while it
        # actually lives in a subdirectory (bench/scripts/). Pass 1
        # (root/claim, root/basename) calls that "missing" -- the 2026-10-05
        # false-positive class. No other fixture has this shape, so this case
        # fails if `resolve_path` ever regresses to pass-1-only.
        deep = tmp / "deeprepo"
        (deep / "bench" / "scripts").mkdir(parents=True)
        (deep / "bench" / "scripts" / "h23_census.py").write_text(SRC, encoding="utf-8")
        (deep / "bench" / "results.json").write_text("{}", encoding="utf-8")
        ddoc = deep / "DOC.md"
        ddoc.write_text("See `h23_census.py` and `results.json`.\n", encoding="utf-8")
        dtf = dc.read_target(deep, doc_path=ddoc)
        case("nested bare-basename path seen -> ok",
             dc.evaluate(dc.Claim("path", "h23_census.py",
                                  {"present": True}), dtf)["ok"], True)

        # --- regression: doc and --target in DIFFERENT directories -----------
        # Every other fixture puts the doc beside the target, so the doc-dir and
        # ancestor roots in `tf.roots` are redundant there and dropping them
        # changes nothing. Here the doc lives in docs/ while --target is src/,
        # so a doc-relative path claim resolves ONLY through those extra roots.
        # NOTE: dropping just the explicit doc-dir append is a NO-OP -- the
        # ancestor-walk below re-adds it. Both halves must regress together for
        # this case to be meaningful.
        split = tmp / "splitrepo"
        (split / "src").mkdir(parents=True)
        (split / "docs").mkdir(parents=True)
        (split / "src" / "mod.py").write_text(SRC, encoding="utf-8")
        (split / "docs" / "notes.md").write_text("notes\n", encoding="utf-8")
        sdoc = split / "docs" / "DOC.md"
        sdoc.write_text("See `notes.md`.\n", encoding="utf-8")
        stf = dc.read_target(split / "src", doc_path=sdoc)
        case("doc-relative path across directories -> ok",
             dc.evaluate(dc.Claim("path", "notes.md", {"present": True}), stf)["ok"], True)

        # --- extraction: prose must NOT become claims ------------------------
        claims = dc.extract_claims(DOC, tf)
        kinds = {c.kind for c in claims}
        keys = {c.key for c in claims}
        case("extract finds vocabulary", "vocabulary" in kinds, True)
        case("extract finds symbol", "do_thing" in keys, True)
        case("extract finds command", "mod.py run" in keys, True)
        case("extract ignores prose words", "work" not in keys and "See" not in keys, True)

        # --- loop: bless then drift -----------------------------------------
        doc = tmp / "DOC.md"
        doc.write_text(DOC, encoding="utf-8")
        base = tmp / "base.json"

        class A:  # tiny args namespaces
            pass
        a = A(); a.doc = str(doc); a.target = str(good); a.baseline = str(base); a.by = "t"
        rc = dc.cmd_bless(a)
        case("bless rc=0", rc, 0)
        case("baseline stamped golden",
             __import__("json").loads(base.read_text())["kind"], "golden")

        c = A(); c.doc = str(doc); c.target = str(good); c.baseline = str(base)
        case("check no-drift rc=0", dc.cmd_check(c), 0)

        # mutate the target: rename a blessed symbol
        (good / "mod.py").write_text(SRC.replace("def do_thing(", "def do_thing_v2("),
                                    encoding="utf-8")
        case("check drift rc=1", dc.cmd_check(c), 1)

        # --- regression: sibling baselines must not collide ------------------
        # Two docs in ONE directory, blessed with the DEFAULT baseline name.
        # The old default (`drift_baseline.json`, keyed on the directory) let the
        # second bless overwrite the first, so checking the first compared it
        # against a stranger's baseline and emitted phantom CLAIM_GONE/CLAIM_ADDED.
        sib = tmp / "sibs"
        sib.mkdir(parents=True, exist_ok=True)
        t2 = _target(tmp, "t2", SRC)
        d_a = sib / "A.md"
        d_b = sib / "B.md"
        d_a.write_text("MODES (a/b/c)\n\nCall `do_thing()` to work.\n", encoding="utf-8")
        d_b.write_text("Call `do_thing()` to work.\n", encoding="utf-8")

        b1 = A(); b1.doc = str(d_a); b1.target = str(t2); b1.baseline = None; b1.by = "t"
        b2 = A(); b2.doc = str(d_b); b2.target = str(t2); b2.baseline = None; b2.by = "t"
        dc.cmd_bless(b1)
        dc.cmd_bless(b2)
        case("sibling baselines coexist (2 files)",
             len(list(sib.glob("drift_baseline*.json"))), 2)
        k1 = A(); k1.doc = str(d_a); k1.target = str(t2); k1.baseline = None
        k2 = A(); k2.doc = str(d_b); k2.target = str(t2); k2.baseline = None
        case("sibling A still clean after blessing B", dc.cmd_check(k1), 0)
        case("sibling B still clean", dc.cmd_check(k2), 0)

    print()
    if fails:
        print(f"RESULT: {fails} case(s) failed")
        return 1
    print("RESULT: all cases passed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
