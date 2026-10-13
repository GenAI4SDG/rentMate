---
# ============================================================================
# CONTRACT PLAN — CP.calculate_match.v1  (schema cp_version 1)
#
# The deterministic score. From docs/site-spec-suite/technical-requirements.md
# §3.2. This CP IS the "frozen versioned score contract" the suite's own open
# item T5/D3 asks for: the weight table below is pinned here, with tests.
#
# ORACLE PROVENANCE: `contract_derivation`. Expected scores are computed from
# the stated formula + the pinned weights by hand, NOT read from any target.
# ============================================================================
cp_version: 1
id: CP.calculate_match.v1
status: approved

ip_nodes:
  - IP.rentmate.compatibility

edit_tag:
  author: "agent"
  when: "2026-10-13"
  version: 1
  change: "initial contract for the deterministic weighted-similarity score: shared soft factors only, renormalized; gender/MBTI/housing excluded; frozen equal-weight table v1"

# --- the contract -----------------------------------------------------------
signature:
  name: calculate_match
  parameters:
    - {name: profile_a, type: "Profile"}
    - {name: profile_b, type: "Profile"}
  returns: "MatchResult"

preconditions:
  - {kind: type_check, subject: "profile_a", expected_type: "Profile"}
  - {kind: type_check, subject: "profile_b", expected_type: "Profile"}

postconditions:
  - {kind: outcome, subject: "return.status", op: "is_type", value: "str"}

# Analysed and genuinely empty: pure, deterministic, in-memory, no I/O, no state.
# The soft CP_EFFECTS_ALL_EMPTY warning is expected and accepted (SPEC.md §3).
effects:
  concurrency: []
  security: []
  reliability: []
  backward_compat: []

mutations: []

# --- test oracle (R1: inputs[i] pairs with expected[i]) ---------------------
# Frozen score contract v1 — WEIGHTS (all six equal, so the mean is the score):
#   sleep_schedule=1, shared_space_habits=1, social_guest_preference=1,
#   noise_preference=1, personal_space_preference=1, bill_splitting_style=1
# Formula: score = round(100 * Σ wᵢ·(1-|aᵢ-bᵢ|) / Σ wᵢ) over SHARED factors only.
test_oracle:
  inputs:
    - args:
        profile_a: {about_me: {sleep_schedule: 0.5, shared_space_habits: 0.5, social_guest_preference: 0.5, noise_preference: 0.5, personal_space_preference: 0.5, bill_splitting_style: 0.5}}
        profile_b: {about_me: {sleep_schedule: 0.5, shared_space_habits: 0.5, social_guest_preference: 0.5, noise_preference: 0.5, personal_space_preference: 0.5, bill_splitting_style: 0.5}}
      note: "identical profiles, all six shared factors agree -> 100"
    - args:
        profile_a: {about_me: {sleep_schedule: 0.0}}
        profile_b: {about_me: {sleep_schedule: 1.0}}
      note: "one shared factor at opposite extremes -> 1-|0-1| = 0 -> 0"
    - args:
        profile_a: {about_me: {sleep_schedule: 0.5}}
        profile_b: {about_me: {noise_preference: 0.5}}
      note: "no shared scored factor -> score null, status insufficient_data"
    - args:
        profile_a: {gender_identity: "man", mbti_type: "INTJ", about_me: {sleep_schedule: 0.5}}
        profile_b: {gender_identity: "woman", mbti_type: "ESFP", about_me: {sleep_schedule: 0.5}}
      note: "excluded-field invariance: gender and MBTI differ, the only shared soft factor agrees -> still 100"
    - args:
        profile_a: {about_me: {sleep_schedule: 1.0, noise_preference: 0.0}}
        profile_b: {about_me: {sleep_schedule: 0.5, noise_preference: 0.0, social_guest_preference: 1.0}}
      note: "partial overlap: shared = {sleep, noise} -> (0.5 + 1.0)/2 = 0.75 -> 75; social_guest_preference is omitted and renormalized, NOT treated as 0"
  expected:
    - - {kind: outcome, subject: "return.score", op: eq, value: 100}
      - {kind: outcome, subject: "return.status", op: eq, value: "scored"}
    - - {kind: outcome, subject: "return.score", op: eq, value: 0}
      - {kind: outcome, subject: "return.status", op: eq, value: "scored"}
    - - {kind: outcome, subject: "return.score", op: is_none}
      - {kind: outcome, subject: "return.status", op: eq, value: "insufficient_data"}
    - - {kind: outcome, subject: "return.score", op: eq, value: 100}
      - {kind: outcome, subject: "return.status", op: eq, value: "scored"}
    - - {kind: outcome, subject: "return.score", op: eq, value: 75}
      - {kind: outcome, subject: "return.status", op: eq, value: "scored"}

provenance:
  drafted_by: "agent"
  source_revision: ""

oracle_origin:
  mode: contract_derivation
  tool: ""
  source_span: ""
  revision: ""
  sha: ""
  note: "Scores computed by hand from the stated formula and the pinned equal-weight table v1 (technical-requirements.md §3.2). No target exists; case 5's 75 in particular distinguishes renormalization over shared factors (75) from treating a missing factor as 0 (50)."

production_scale:
  data_size: "one profile pair per call; each profile is a small JSON object (tens of fields)"
  concurrency: "single-threaded; pure, no I/O"
  latency_budget: "sub-millisecond per pair; called once per eligible candidate"

# approval: written ONLY by cp_tool.py approve.
approval:
  by: agent-auto (G-8 human boundary NOT exercised)
  when: '2026-10-13'
  attest_readability: true
  attest_minimalism: true
  attest_debuggability: true
  content_sha256: b951a1509051120d571b525fe91005b99f1bb7f28bd2f269d6ff1535723067ca
---

# CP: `calculate_match`

## Intent

Turn two profiles into a **deterministic** compatibility score. It refines
`IP.rentmate.compatibility` — the report's focus #1 — and it is deliberately *not*
an AI feature: the report puts GPT-4o-mini on the narrative only, and says matching
and scoring are deterministic.

## The contract, in one paragraph

Compare only the **soft lifestyle/personality/scalar** factors the two profiles
share, each normalized to 0–1, with the pinned weights (all 1.0 in v1). A factor
that only one side has is **omitted and the weights renormalized** — it is not
imputed as zero. If no scored factor is shared, there is no score at all
(`null` / `insufficient_data`) rather than a misleading zero. **Gender, MBTI,
smoking status, location, budget, amenities and room size never contribute.**

## Edge cases the predicates cover

| Predicate | Edge case it guards |
|---|---|
| case 1 → 100 | identical profiles must score full marks |
| case 2 → 0 | opposite extremes of a shared factor score zero, not a positive floor |
| case 3 → `null` | no shared factor ⇒ `insufficient_data`, never a fabricated 0 |
| case 4 → 100 | excluded-field invariance: gender/MBTI cannot move the score |
| case 5 → 75 | a factor present on only one side is dropped and the rest renormalized |

## Notes for the two independent implementers

- The return is a mapping with at least `score` and `status`. `score` is an `int`
  0–100 when `status == "scored"`, and `None` when `status == "insufficient_data"`.
- **The weight table is frozen in this CP (v1, all six equal).** If the team changes
  the weights, that is a new CP version with recomputed oracle values — not a silent
  edit to this one.
- `matchedFactors` / `frictionFactors` are **deliberately not pinned** by this
  oracle: the suite names the fields but not their semantics (does "matched" mean
  *agreed* or *considered*?). That ambiguity is an open item for the team, and the
  CP declines to guess it into the contract.
