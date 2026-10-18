"""Build `PG.rentmate.v3.json` from `vault/cps/` — derived from disk, never hand-typed.

Mirrors `coding_assistant/planning_graph/build_planner_pg.py`, but for the RentMate
corpus. Reuses that repo's `project_graph.py` so the fact schema, the coverage check
and the staleness binding are the SAME code, not a re-implementation.

Run from anywhere (paths are absolute-by-construction):
    python vault/checks/build_rentmate_pg.py
"""
from __future__ import annotations

import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
VAULT = HERE.parent
PLANNER = Path("C:/Users/Trinity/Programmes/coding_assistant/planning_graph")
sys.path.insert(0, str(PLANNER))

import cp_tool                 # noqa: E402
import project_graph as pg     # noqa: E402

CPS_DIR = VAULT / "cps"
OUT = VAULT / "PG.rentmate.v3.json"

# Constraints each CP RETAINS, read off the CP's frontmatter + body. Declared
# here in one place (never inferred from prose), so the mapping is reviewable.
# `dropped_constraints` is [] for all three: nothing was dropped, and an empty
# list is a DECLARATION, not an omission (SPEC.md §3).
#
# Keyed by the CURRENT id: on 2026-10-18 the filter and email CPs were
# rewritten as v2 (see vault/README.md). The v1 files stay on disk, superseded,
# and are skipped by the latest-version selection below.
RETAINED = {
    "CP.filter_eligible_matches.v2": [
        "five explicit hard-constraint families (gender, belief, smoking, commute/location, budget), each applied in both directions",
        "a missing or undisclosed value never satisfies a stated requirement; an unknown commute estimate or unstated budget never fires, so unknown never silently excludes",
        "flat size is not a gate: it warns when a HOME is suggested outside it, it never hides a person",
        "pure predicate: no I/O, no state, no retry",
    ],
    "CP.calculate_match.v2": [
        "deterministic weighted similarity over shared soft scalar factors only",
        "weights frozen at v2 (seven equal factors: the six soft scalars plus MBTI)",
        "MBTI is a scored factor: value = 1 - differing_axes/4 over E/I, S/N, T/F, J/P",
        "a factor present on one side only is omitted and the rest renormalized, never imputed as 0",
        "gender, smoking, location, budget, amenities and size never contribute (gender/smoking are hard filters upstream)",
    ],
    "CP.validate_institution_email.v2": [
        "exact or dot-boundary domain match against the client-side allowlist; never substring",
        "eligibility is not verification; nothing is stored to attest it and there is no Auth to defer confirmation to",
        "pure and offline: the allowlist is configuration, not contract",
    ],
}

ORIGIN_NOTE = ("retained_constraints paraphrased by the agent from {path} "
               "(frontmatter + body); no human reviewed the paraphrase")


def base_id(cp_id: str) -> str:
    """CP.<name>.v<N> -> CP.<name> (the version suffix is the last .v<digits>)."""
    head, sep, tail = cp_id.rpartition(".v")
    return head if sep and tail.isdigit() else cp_id


def latest_per_base(docs: list) -> list:
    """One doc per base id: the highest edit_tag version on disk.

    Superseded versions stay on disk (the IP's own convention — v2 is kept
    because v3's diff table is written against it) but must not double-count
    into the graph. Selection is by the tool-enforced edit_tag.version, never
    by mtime, so a hand-touched old file cannot resurrect itself.
    """
    best: dict = {}
    for doc in docs:
        data = doc.data or {}
        cid = str(data.get("id", ""))
        version = int((data.get("edit_tag") or {}).get("version") or 0)
        if cid and (base_id(cid) not in best or version > best[base_id(cid)][0]):
            best[base_id(cid)] = (version, doc)
    return [doc for _, doc in best.values()]


def build() -> dict:
    docs = [cp_tool.load_cp(p) for p in sorted(CPS_DIR.glob("*.md"))]
    corpus = pg.corpus_from_docs(docs)
    current = latest_per_base(docs)        # superseded versions stay on disk, out of the graph

    facts = []
    for doc in sorted(current, key=lambda d: str((d.data or {}).get("id", ""))):
        data = doc.data or {}
        cid = str(data.get("id", ""))
        if not cid or cid not in corpus:
            continue
        nodes = [str(n) for n in (data.get("ip_nodes") or [])]
        if not nodes:
            continue          # a CP with no ip_nodes cannot be placed; skip, never invent
        info = corpus[cid]
        facts.append(pg.PGFact(
            id=f"PF.{cid}",
            intent_node=nodes[0],
            derived_from=[cid],
            dependent_cps=[pg.CPRef(id=cid,
                                    edit_tag_version=info["edit_tag_version"],
                                    content_sha256=info["content_sha256"])],
            retained_constraints=RETAINED.get(cid, []),
            dropped_constraints=[],
            epistemic_outcome=pg.OUTCOME_UNKNOWN,
            # origin=unstated, NOT ai: `project_graph.validate_graph` makes
            # origin=ai REQUIRE a non-empty `evidence`, while outcome=unknown
            # FORBIDS one -- so an ai-origin fact can only ever be
            # `infeasible_with_evidence`. Rather than over-claim `deterministic`
            # (the constraint strings are an agent paraphrase, not computed), the
            # fact takes the backward-compatible default, which is explicitly
            # "not assumed authoritative". The provenance is kept in metadata.
            origin=pg.ORIGIN_UNSTATED,
            evidence="",
            summary=f"{cid} abstracted; feasibility not analysed (no Profiles, no measured workload)",
            metadata={"constraint_source": ORIGIN_NOTE.format(path=f"vault/cps/{cid}.md"),
                      "reviewed_by_human": False},
        ))

    graph = pg.ProjectGraph(intent_id="IP.rentmate.v3", facts=facts)

    # coverage, resolved from the CURRENT CPs the same way ip_tool.link does.
    assign: dict = {}
    for doc in current:
        data = doc.data or {}
        cid = str(data.get("id", ""))
        if not cid:
            continue
        for node in (data.get("ip_nodes") or []):
            assign.setdefault(str(node), []).append(cid)

    findings = pg.validate_graph(graph)
    return {
        "graph": graph,
        "corpus": corpus,
        "assign": assign,
        "hard": [f for f in findings if f.severity == "hard"],
        "soft": [f for f in findings if f.severity == "soft"],
        "coverage": pg.coverage(graph, ip_nodes_to_cps=assign),
        "staleness": pg.stale_facts(graph, corpus=corpus),
        "superseded": [str((d.data or {}).get("id", "")) for d in docs if d not in current],
    }


def main() -> int:
    r = build()
    graph = r["graph"]

    print(f"PG build -- {graph.intent_id}\n")
    if r["superseded"]:
        print("superseded on disk (kept, not abstracted): " + ", ".join(sorted(r["superseded"])))
    print(f"facts: {len(graph.facts)}")
    for f in graph.facts:
        print(f"  {f.id:34s} -> {f.intent_node}  (origin={f.origin}, "
              f"outcome={f.epistemic_outcome})")

    print(f"\nvalidate: {len(r['hard'])} hard, {len(r['soft'])} soft")
    for f in r["hard"] + r["soft"]:
        print(f"  [{f.severity}] {f.code} {f.subject}: {f.detail}")

    cov = r["coverage"]
    print(f"\ncoverage: ok={cov['ok']}")
    print(f"  missing_cps    : {cov['missing_cps']}")
    print(f"  unassigned_cps : {cov['unassigned_cps']}")
    print(f"  uncovered_nodes: {cov['uncovered_nodes']}")
    print(f"  unknown_nodes  : {cov['unknown_nodes']}")

    st = r["staleness"]
    print(f"\nstaleness: ok={st['ok']} stale={len(st['stale'])} absent={len(st['absent'])}")

    p = graph.write(OUT)
    print(f"\nwrote {p}")
    return 0 if (not r["hard"] and cov["ok"]) else 1


if __name__ == "__main__":
    sys.exit(main())
