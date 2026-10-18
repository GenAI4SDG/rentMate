# `vault/` — the RentMate planning artifacts

An **IP + CP artifact set** for RentMate, written to the conventions of the
`coding_assistant` repo (`planning_graph`): same frontmatter schemas, same
validators, same approval mechanics.

This is a **solo methodology run on an offshoot branch** (`AI-random-bs-go`). The
object is to see how the IP → CP → PG → gate pipeline behaves on a real repo — not
to contribute to the team's documents. The team's contradictory md docs were
removed from this branch (see [`NOTES.md`](NOTES.md) §5); the surviving primary sources are
[`docs/GENAI SDG interim draft.pdf`](../docs/GENAI%20SDG%20interim%20draft.pdf) and the `Figma/` export. Nothing is lost —
`main` still holds every file.

## What is here

| Path | What it is |
|---|---|
| [`ips/IP.rentmate.v3.md`](ips/IP.rentmate.v3.md) | **The current intent tree.** RentMate's four focuses, rewritten against the shipped code after the owner's 2026-10-14 decisions (email-as-identity with no Auth and no stored verification; GenAI downgraded to labelled demo content; real in-app chat with moderation; 20-question quiz). **approved** (agent) |
| [`ips/IP.rentmate.v2.md`](ips/IP.rentmate.v2.md) | The previous intent. **Superseded by v3**, kept because v3's diff table is written against it and [`NOTES.md`](NOTES.md) cites it. |
| [`cps/CP.filter_eligible_matches.v2.md`](cps/CP.filter_eligible_matches.v2.md) | Hard-constraint gate — **five families** (gender, belief, smoking, commute/location, budget), each applied in **both directions**; flat size is explicitly *not* a gate (it warns instead). **approved** (agent), current |
| [`cps/CP.calculate_match.v2.md`](cps/CP.calculate_match.v2.md) | The deterministic score; **MBTI is a scored factor**, gender is excluded. **approved** (agent), current |
| [`cps/CP.validate_institution_email.v2.md`](cps/CP.validate_institution_email.v2.md) | The university-email access gate — **client-side** domain match, eligibility only, nothing stored. **approved** (agent), current |
| [`cps/CP.filter_eligible_matches.v1.md`](cps/CP.filter_eligible_matches.v1.md) | **Superseded by v2 (2026-10-18)**: pinned only gender + smoking of the five families the shipped gate implements |
| [`cps/CP.validate_institution_email.v1.md`](cps/CP.validate_institution_email.v1.md) | **Superseded by v2 (2026-10-18)**: described a server-side eight-entry allowlist and an Auth "later step" that do not exist |
| [`PG.rentmate.v3.json`](PG.rentmate.v3.json) | The Project Graph — the CPs abstracted into facts, **built from disk** by [`checks/build_rentmate_pg.py`](checks/build_rentmate_pg.py), never hand-typed |
| [`NOTES.md`](NOTES.md) | The agent's informal views: the drift it found, what the owner overruled, what the methodology is worth, and what was deleted |
| [`checks/rentmate_reference_impls.py`](checks/rentmate_reference_impls.py) | Throwaway harness fixtures — **not product code** (the product is TypeScript) |
| [`checks/build_rentmate_pg.py`](checks/build_rentmate_pg.py) | The PG builder; reuses `coding_assistant/planning_graph/project_graph.py` |
| [`checks/matching_ts_check.ts`](checks/matching_ts_check.ts) | Runs [`Figma/src/lib/matching.ts`](../Figma/src/lib/matching.ts) against **both** oracles: `CP.calculate_match.v2`'s 8 score cases + `CP.filter_eligible_matches.v2`'s 17 filter cases (25/25 on 2026-10-18) |

### The IP→CP split: what it saved, and what it didn't

The IP moved from v2 to v3 without any contract churn: **on 14 Oct all three CPs
still passed every oracle case against the shipped TypeScript** — the 8 score
cases and the 5 filter cases and the 5 email cases all agreed. That is the
split doing its job: an intent change that would otherwise have forced three
contract rewrites cost a prose rewrite instead.

**And then the contracts still went stale anyway — because nobody re-ran them.**
The same 14 Oct decision batch that produced v3 also shipped five hard filters
(not two) and deleted Auth (not deferred it). Both facts were true in the code
and false in two CPs. The v2 rewrites of 2026-10-18 are the correction, found
by re-validating the corpus against the code rather than by trusting the
approvals. Honest ledger of that pass:

- **`CP.calculate_match.v2` — unchanged.** Still in sync; 8/8 re-verified against
  the shipped matcher on 18 Oct. Rewriting a correct contract to look busy is
  how a corpus rots.
- **`CP.filter_eligible_matches.v2` — a real contract change.** v1 pinned two of
  the five shipped families; v2 pins all five, both directions, plus the 14 Oct
  "flat size is not a gate" decision as a regression-guard oracle case, and
  corrects the `smoking_status` representation (v1's string never matched the
  shipped 0..1 scalar). Oracle 5 → 17 cases.
- **`CP.validate_institution_email.v2` — prose only.** The five oracle cases and
  the matching rule were always right; the context around them (server-side
  eight-entry allowlist, Auth "confirmation as a later step", a `sign-up path`)
  described flows that no longer exist.

The v1 files are kept, not deleted, for the same reason v2 of the IP is kept:
the v2 files' "what changed and why" tables are written against them, and
[`NOTES.md`](NOTES.md) cites them. If the two ever disagree about what the
product is, **the higher version wins** — that is the whole point of a version
number. `checks/build_rentmate_pg.py` therefore abstracts the **latest version
per contract** and prints what it skipped, so a superseded file cannot
double-count into the graph.


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
   that is true**: when the three original CPs were written no implementation of
   the roommate flow existed, so no expected value could have been transcribed
   from code. That changed on 2026-10-18: an implementation now exists
   (`Figma/src/lib/matching.ts`, `Figma/src/lib/institutions.ts`), and the v2
   oracles were **cross-checked against it** — 8/8 score cases and 17/17 filter
   cases via `checks/matching_ts_check.ts`, 5/5 email cases via the harness —
   with the cross-check recorded in each `oracle_origin.note`. The expected
   values were still derived from the stated contracts, not transcribed; the
   implementation confirms them, it does not define them.
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

`cp_tool validate` reports 0 hard / 7 soft across the five CP files:

- **`CP_EFFECTS_ALL_EMPTY` × 5** — every effect category is `[]`. That is
  correct for these functions: all five are pure, in-memory, I/O-free, and the
  alternative (inventing a predicate no checker could evaluate) is the failure
  the schema exists to prevent. Each CP states this in a comment above its
  `effects` block.
- **`CP_APPROVAL_LEGACY_HASH` × 2** — the two superseded v1 files still carry
  pre-2026-10-14 approvals with no `body_sha256`, so drift is not provable from
  their stored values. Accepted rather than upgraded: they are **historical
  records**, their content is frozen, and re-signing a superseded contract
  would imply it still matters. The three current CPs were signed (or, for
  `calculate_match.v2`, re-stated) under the current scheme on 2026-10-18, so
  drift on anything live is provable.

## The Project Graph, and one real finding about its schema

[`PG.rentmate.v3.json`](PG.rentmate.v3.json) holds three facts (one per CP), built by
[`checks/build_rentmate_pg.py`](checks/build_rentmate_pg.py) from the CP corpus — never hand-typed, because a
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
PYTHONPATH=. python ip_tool.py validate "$V/ips/IP.rentmate.v3.md"
PYTHONPATH=. python cp_tool.py validate "$V"/cps/*.md
PYTHONPATH=. python ip_tool.py link --ips "$V/ips" --cps "$V/cps"
PYTHONPATH=".;$V/checks" python g1_harness.py "$V/cps/CP.calculate_match.v2.md" \
    --impl a=rentmate_reference_impls.calculate_match_a \
    --impl b=rentmate_reference_impls.calculate_match_b
PYTHONPATH=".;$V/checks" python g1_harness.py "$V/cps/CP.filter_eligible_matches.v2.md" \
    --impl a=rentmate_reference_impls.filter_eligible_matches_a \
    --impl b=rentmate_reference_impls.filter_eligible_matches_b
PYTHONPATH=".;$V/checks" python g1_harness.py "$V/cps/CP.validate_institution_email.v2.md" \
    --impl a=rentmate_reference_impls.validate_institution_email_a \
    --impl b=rentmate_reference_impls.validate_institution_email_b

# the TypeScript matcher against BOTH oracles (run from the repo root)
node --experimental-strip-types "$V/checks/matching_ts_check.ts"   # 25/25 = 8 score + 17 filter

# rebuild the Project Graph from the CP corpus (writes PG.rentmate.v3.json;
# abstracts the latest version per contract, prints what it skipped)
python "$V/checks/build_rentmate_pg.py"
```

`cp_tool.py validate` takes **file arguments**, not a directory.
