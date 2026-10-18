---
# ============================================================================
# CONTRACT PLAN — CP.calculate_match.v2  (schema cp_version 1)
#
# The deterministic score. v1 forbade MBTI from influencing the score; the owner
# overruled that ("MBTI is just a scoring preference"), so v2 adds MBTI as ONE
# scored factor over its four binary axes. Gender is STILL excluded from the
# score — it is a HARD filter, handled by CP.filter_eligible_matches.v1, and the
# score is only ever computed on candidates that already passed that gate.
#
# ORACLE PROVENANCE: `contract_derivation`. Expected scores are computed from
# the stated formula + the pinned weights by hand, NOT read from any target.
# ============================================================================
cp_version: 1
id: CP.calculate_match.v2
status: approved

ip_nodes:
  - IP.rentmate.compatibility

edit_tag:
  author: "agent"
  when: "2026-10-13"
  version: 2
  change: "MBTI enters the score as a soft preference (one factor, value = 1 - differing_axes/4 over E/I,S/N,T/F,J/P); gender remains excluded (it is a hard filter upstream); weight table extended to seven equal factors"

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
# Frozen score contract v2 — WEIGHTS (all seven equal, so the mean is the score):
#   sleep_schedule=1, shared_space_habits=1, social_guest_preference=1,
#   noise_preference=1, personal_space_preference=1, bill_splitting_style=1,
#   mbti=1
# Formula: score = round(100 * Σ wᵢ·vᵢ / Σ wᵢ) over SHARED factors only.
#   vᵢ = 1 - |aᵢ - bᵢ|                     for a soft scalar factor
#   v_mbti = 1 - (differing_axes / 4)      over axes E/I, S/N, T/F, J/P
# A factor present on one side only is omitted and the rest renormalized. MBTI
# is omitted when either side's mbti_type is missing or not a well-formed
# 4-letter code (each letter from its own axis pair).
test_oracle:
  inputs:
    - args:
        profile_a: {about_me: {sleep_schedule: 0.5, shared_space_habits: 0.5, social_guest_preference: 0.5, noise_preference: 0.5, personal_space_preference: 0.5, bill_splitting_style: 0.5}, mbti_type: "INTJ"}
        profile_b: {about_me: {sleep_schedule: 0.5, shared_space_habits: 0.5, social_guest_preference: 0.5, noise_preference: 0.5, personal_space_preference: 0.5, bill_splitting_style: 0.5}, mbti_type: "INTJ"}
      note: "identical profiles, all seven shared factors agree -> 100"
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
        profile_b: {gender_identity: "woman", mbti_type: "INTJ", about_me: {sleep_schedule: 0.5}}
      note: "gender invariance: gender differs but is excluded; MBTI is equal and the only shared soft factor agrees -> still 100 (gender is a hard gate upstream, never a weight)"
    - args:
        profile_a: {about_me: {sleep_schedule: 1.0, noise_preference: 0.0}}
        profile_b: {about_me: {sleep_schedule: 0.5, noise_preference: 0.0, social_guest_preference: 1.0}}
      note: "partial overlap: shared = {sleep, noise} -> (0.5 + 1.0)/2 = 0.75 -> 75; social_guest_preference is omitted and renormalized, NOT treated as 0"
    - args:
        profile_a: {mbti_type: "INTJ", about_me: {sleep_schedule: 1.0}}
        profile_b: {mbti_type: "ESFP", about_me: {sleep_schedule: 1.0}}
      note: "MBTI as a scored factor: INTJ vs ESFP differ on all four axes -> v = 1 - 4/4 = 0.0; with sleep agreeing at 1.0 the mean is (1.0 + 0.0)/2 = 0.5 -> 50"
    - args:
        profile_a: {mbti_type: "INTJ"}
        profile_b: {mbti_type: "INFJ"}
      note: "MBTI partial agreement: only T/F differs -> v = 1 - 1/4 = 0.75; MBTI is the only shared factor -> 75"
    - args:
        profile_a: {mbti_type: "INTJ", about_me: {sleep_schedule: 1.0}}
        profile_b: {about_me: {sleep_schedule: 0.5}}
      note: "MBTI omitted (absent on one side) and the rest renormalized: shared = {sleep} -> 0.5 -> 50, NOT (1.0 + 0.0)/2"
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
    - - {kind: outcome, subject: "return.score", op: eq, value: 50}
      - {kind: outcome, subject: "return.status", op: eq, value: "scored"}
    - - {kind: outcome, subject: "return.score", op: eq, value: 75}
      - {kind: outcome, subject: "return.status", op: eq, value: "scored"}
    - - {kind: outcome, subject: "return.score", op: eq, value: 50}
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
  note: "Scores computed by hand from the stated formula and the pinned seven-factor equal-weight table v2. No target exists. Case 4 keeps the gender-invariance property; case 6 is the new MBTI-as-score behaviour (all four axes differing still yields a scored 50, not an omission); case 8 pins that an absent MBTI is renormalized away rather than imputed as 0."

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
  content_sha256: 1918f0d627946c215eb1301b27bfe3ec9790cba40836e963fb7572536b58631e
  body_sha256: 4bb7ecec16beffba9092070908a44c17a1c02ad335ee45daaffc2823836137df
---

# CP: `calculate_match`

## Intent

Turn two profiles into a **deterministic** compatibility score. It refines
`IP.rentmate.compatibility` — the report's focus #1 — and it is deliberately *not*
an AI feature: the report puts GPT-4o-mini on the narrative only, and says matching
and scoring are deterministic.

## The contract, in one paragraph

Compare only the **soft lifestyle / personality / scalar** factors the two profiles
share, each normalized to 0–1, with the pinned weights (all 1.0 in v2). A factor
that only one side has is **omitted and the weights renormalized** — it is not
imputed as zero. If no scored factor is shared, there is no score at all
(`null` / `insufficient_data`) rather than a misleading zero. **MBTI is one of
these factors** — scored as agreement across its four axes. **Gender, smoking,
location, budget, amenities and room size never contribute**: gender and smoking
are *hard filters* applied upstream by `CP.filter_eligible_matches.v1`, so by the
time a pair reaches this function it has already passed them.

## What changed from v1 (and why)

v1 said "gender and MBTI cannot move the score". The owner overruled the MBTI half:
MBTI is a **scoring preference**, best elicited through lifestyle questions rather
than a bare 4-letter code. v2 therefore:

- **adds `mbti` as a seventh equal-weight factor**, value `1 - differing_axes/4`;
- **keeps gender out of the score** — the gender decision moved *upstream* into the
  hard filter, which is where a hard constraint belongs.

## Edge cases the predicates cover

| Predicate | Edge case it guards |
|---|---|
| case 1 → 100 | identical profiles (incl. MBTI) must score full marks |
| case 2 → 0 | opposite extremes of a shared factor score zero, not a positive floor |
| case 3 → `null` | no shared factor ⇒ `insufficient_data`, never a fabricated 0 |
| case 4 → 100 | gender invariance: gender cannot move the score |
| case 5 → 75 | a factor present on only one side is dropped and the rest renormalized |
| case 6 → 50 | MBTI all four axes differing is a *scored* 0, not an omission |
| case 7 → 75 | MBTI partial agreement: 1 of 4 axes differs ⇒ 0.75 |
| case 8 → 50 | an absent MBTI is renormalized away, not imputed as 0 |

## Notes for the two independent implementers

- The return is a mapping with at least `score` and `status`. `score` is an `int`
  0–100 when `status == "scored"`, and `None` when `status == "insufficient_data"`.
- **The weight table is frozen in this CP (v2, seven equal factors).** If the team
  changes the weights, that is a new CP version with recomputed oracle values — not
  a silent edit to this one.
- MBTI parsing: a well-formed `mbti_type` is exactly four characters, position 0 ∈
  {I,E}, 1 ∈ {S,N}, 2 ∈ {T,F}, 3 ∈ {J,P}. Anything else (absent, wrong length,
  unknown letters) ⇒ MBTI is omitted, never scored as 0.
- `matchedFactors` / `frictionFactors` are **deliberately not pinned** by this
  oracle: the suite names the fields but not their semantics (does "matched" mean
  *agreed* or *considered*?). That ambiguity is an open item, and the CP declines
  to guess it into the contract.
