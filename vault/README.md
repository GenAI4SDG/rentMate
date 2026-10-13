# `vault/` — the RentMate planning artifacts

An **IP + CP artifact set** for RentMate, written to the conventions of the
`coding_assistant` repo (`planning_graph`): same frontmatter schemas, same
validators, same approval mechanics.

This is a **solo methodology run on an offshoot branch** (`AI-random-bs-go`). The
object is to see how the IP → CP → PG → gate pipeline behaves on a real repo — not
to contribute to the team's documents. The team's contradictory md docs were
removed from this branch (see `NOTES.md` §5); the surviving primary sources are
`docs/GENAI SDG interim draft.pdf` and the `Figma/` export. Nothing is lost —
`main` still holds every file.

## What is here

| Path | What it is |
|---|---|
| `ips/IP.rentmate.v2.md` | The intent tree: RentMate's four focuses + the owner's decisions (gender = hard filter, MBTI = scored, 12-question quiz). **approved** (agent) |
| `cps/CP.filter_eligible_matches.v1.md` | Hard-constraint gate (gender, smoking) before scoring. **approved** (agent) |
| `cps/CP.calculate_match.v2.md` | The deterministic score; **MBTI is a scored factor**, gender is excluded. **approved** (agent) |
| `cps/CP.validate_institution_email.v1.md` | The university-email access gate. **approved** (agent) |
| `PG.rentmate.v2.json` | The Project Graph — the CPs abstracted into facts, **built from disk** by `checks/build_rentmate_pg.py`, never hand-typed |
| `NOTES.md` | The agent's informal views: the drift it found, what the owner overruled, what the methodology is worth, and what was deleted |
| `checks/rentmate_reference_impls.py` | Throwaway harness fixtures — **not product code** (the product is TypeScript) |
| `checks/build_rentmate_pg.py` | The PG builder; reuses `coding_assistant/planning_graph/project_graph.py` |

## The approval criterion that was applied

Each artifact was approved only after passing **all five** of these. If any had
failed, the artifact would have been left `draft`.

1. **Structural validity** — `ip_tool.py validate` / `cp_tool.py validate` report
   **0 hard findings**.
2. **Link integrity** — `ip_tool.py link` reports no dangling, wrong-scope, or
   duplicate node citations. Orphans are allowed and *reported*: an orphan is
   stated intent no CP refines yet, not an error.
3. **Oracle executability** — `g1_harness.py` runs two independently written
   formulations of each function against the CP's oracle: **both pass every case,
   with no disagreement**. (This proves the oracle is satisfiable; it is *not* a
   G-1 pass — see below.)
4. **Provenance honesty** — `oracle_origin.mode` is `contract_derivation` **and
   that is true**: no implementation of the roommate flow exists, so no expected
   value could have been transcribed from code.
5. **Scope discipline** — no CP asserts a behaviour that belongs to the LLM
   (narrative generation is out of contract on purpose), and where the suite left
   a field ambiguous (`matchedFactors` / `frictionFactors`), the CP **declines to
   pin it** rather than guessing it into the contract.

### What the criterion does NOT cover

- **Intent correctness.** Only a human can judge whether the intent tree is the
  *right* reading of what the team wants. No tool can, and this run did not.
- **Behavioural truth.** The oracles test agreement with *this contract*, never
  agreement with intent (the oracle problem).
- **Implementation independence.** The two formulations were written by one
  author from one contract — the correlated-failure risk G-1's S-9 record exists
  to flag. No independence record was written, deliberately.

## ⚠️ The G-8 gap — declared, not papered over

The repo's convention is that an approval is a **human** act: a reviewer states
verbally that the CP meets the readability / minimalism / debuggability bar, and
only then is it signed. **That did not happen here.**

- Every `approval.by` reads `agent-auto (G-8 human boundary NOT exercised)`.
- No comprehension artifact (`*.g8.json`) exists for any CP. The tool's own
  output says so: *"no answers recorded — this approval is NOT a comprehension
  artifact (SPEC.md §6)."* That absence is the honest record; manufacturing an
  answer file would be exactly the "book-report theater" the design rejects.
- Consequently, every `approved` status in this directory means **"the agent
  applied the five checks above"** — it does **not** mean a human signed, and it
  must not be cited as if one had.

## Known soft findings (accepted, not silenced)

`cp_tool validate` reports `CP_EFFECTS_ALL_EMPTY` on all three CPs: every effect
category is `[]`. That is correct for these functions — all three are pure,
in-memory, I/O-free — and the alternative (inventing a predicate no checker could
evaluate) is the failure the schema exists to prevent. Each CP states this in a
comment above its `effects` block.

## The Project Graph, and one real finding about its schema

`PG.rentmate.v2.json` holds three facts (one per CP), built by
`checks/build_rentmate_pg.py` from the CP corpus — never hand-typed, because a
hand-typed PG could silently disagree with the corpus. It validates **0 hard / 0
soft**, coverage is **ok**, staleness is **ok**.

Building it surfaced a genuine coupling in `project_graph.validate_graph`:
**`origin: ai` requires a non-empty `evidence`, while `outcome: unknown` forbids
one.** So an `ai`-origin fact can only ever be `infeasible_with_evidence` — an
AI-authored fact cannot be recorded as "unknown". The alternative was to claim
`origin: deterministic`, which would be false (the constraint strings are an
agent paraphrase, not a computed value), so the facts take the
backward-compatible `unstated` — explicitly *"not assumed authoritative"* — and
carry their provenance in `metadata.constraint_source` instead. That is a
declared limitation, not a hidden one.

The IP's two uncovered focuses (`affordability`, `transparency`) get **no**
`CoverageDeclaration`. That field means "no CP in this system can express this
node"; these two are merely *not built yet*, and a waiver would be an excuse
rather than a record. They stay visible as orphans in `ip_tool.py link`.

## Reproducing the checks

From `coding_assistant/planning_graph/`, with the managed Python 3.13:

```bash
V=C:/Users/Trinity/Programmes/GENAI_sdg/vault
PYTHONPATH=. python ip_tool.py validate "$V/ips/IP.rentmate.v2.md"
PYTHONPATH=. python cp_tool.py validate "$V"/cps/*.md
PYTHONPATH=. python ip_tool.py link --ips "$V/ips" --cps "$V/cps"
PYTHONPATH=".;$V/checks" python g1_harness.py "$V/cps/CP.calculate_match.v2.md" \
    --impl a=rentmate_reference_impls.calculate_match_a \
    --impl b=rentmate_reference_impls.calculate_match_b

# rebuild the Project Graph from the CP corpus (writes PG.rentmate.v2.json)
python "$V/checks/build_rentmate_pg.py"
```

`cp_tool.py validate` takes **file arguments**, not a directory.
