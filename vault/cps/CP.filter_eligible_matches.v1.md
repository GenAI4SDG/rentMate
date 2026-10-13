---
# ============================================================================
# CONTRACT PLAN — CP.filter_eligible_matches.v1  (schema cp_version 1)
#
# The hard-constraint gate that runs BEFORE any scoring. From
# docs/site-spec-suite/technical-requirements.md §3.1.
#
# ORACLE PROVENANCE: `contract_derivation`. The expected booleans are derived
# from the stated contract, NOT transcribed from a target — the roommate flow
# has no implementation yet (frontend imports Supabase zero times; the backend
# schema serves a different product). Nothing here was read out of code.
# ============================================================================
cp_version: 1
id: CP.filter_eligible_matches.v1
status: approved

ip_nodes:
  - IP.rentmate.compatibility

edit_tag:
  author: "agent"
  when: "2026-10-13"
  version: 1
  change: "initial contract for the pre-scoring hard filter: explicit constraints only, never silently relaxed, undisclosed gender does not pass a selected category"

# --- the contract -----------------------------------------------------------
signature:
  name: filter_eligible_matches
  parameters:
    - {name: profile_a, type: "Profile"}
    - {name: profile_b, type: "Profile"}
  returns: "bool"

preconditions:
  - {kind: type_check, subject: "profile_a", expected_type: "Profile"}
  - {kind: type_check, subject: "profile_b", expected_type: "Profile"}

postconditions:
  - {kind: outcome, subject: "return", op: "is_type", value: "bool"}

# All four categories were analysed and are genuinely empty: this is a pure,
# in-memory predicate with no I/O, no state, and no retry. The soft
# CP_EFFECTS_ALL_EMPTY warning is expected here and is accepted, not silenced
# by inventing an effect that no checker could use (SPEC.md §3).
effects:
  concurrency: []
  security: []
  reliability: []
  backward_compat: []

mutations: []

# --- test oracle (R1: inputs[i] pairs with expected[i]) ---------------------
test_oracle:
  inputs:
    - args:
        profile_a: {gender_identity: "woman", looking_for: {roommate_gender_categories: ["woman"], any_gender: false, smoking_rule: "no_preference"}}
        profile_b: {gender_identity: "woman", looking_for: {roommate_gender_categories: ["woman"], any_gender: false, smoking_rule: "no_preference"}}
      note: "mutual gender-category match, both directions pass"
    - args:
        profile_a: {gender_identity: "man", looking_for: {roommate_gender_categories: ["woman"], any_gender: false, smoking_rule: "no_preference"}}
        profile_b: {gender_identity: "man", looking_for: {roommate_gender_categories: ["woman"], any_gender: false, smoking_rule: "no_preference"}}
      note: "gender mismatch: a's selected category ['woman'] does not contain b's identity 'man'"
    - args:
        profile_a: {gender_identity: "woman", looking_for: {roommate_gender_categories: ["woman"], any_gender: false, smoking_rule: "no_preference"}}
        profile_b: {gender_identity: "prefer_not_to_say", looking_for: {roommate_gender_categories: ["woman"], any_gender: false, smoking_rule: "no_preference"}}
      note: "undisclosed gender must NOT pass a selected category filter (no silent relaxation)"
    - args:
        profile_a: {gender_identity: "man", looking_for: {any_gender: true, smoking_rule: "no_preference"}}
        profile_b: {gender_identity: "woman", looking_for: {any_gender: true, smoking_rule: "no_preference"}}
      note: "any_gender on both sides disables the gender filter"
    - args:
        profile_a: {gender_identity: "woman", about_me: {smoking_status: "non_smoker"}, looking_for: {any_gender: true, smoking_rule: "required_non_smoking"}}
        profile_b: {gender_identity: "woman", about_me: {smoking_status: "smoker"}, looking_for: {any_gender: true, smoking_rule: "no_preference"}}
      note: "explicit smoking constraint is hard: a requires non-smoking, b smokes"
  expected:
    - - {kind: outcome, subject: "return", op: eq, value: true}
    - - {kind: outcome, subject: "return", op: eq, value: false}
    - - {kind: outcome, subject: "return", op: eq, value: false}
    - - {kind: outcome, subject: "return", op: eq, value: true}
    - - {kind: outcome, subject: "return", op: eq, value: false}

provenance:
  drafted_by: "agent"
  source_revision: ""

oracle_origin:
  mode: contract_derivation
  tool: ""
  source_span: ""
  revision: ""
  sha: ""
  note: "Expected booleans derived from the stated filter contract (technical-requirements.md §3.1: hard filters run before scoring; a filter is never silently relaxed; missing/undisclosed gender does not pass a selected category). No target implementation exists, so nothing could be transcribed."

production_scale:
  data_size: "one profile pair per call; each profile is a small JSON object (tens of fields)"
  concurrency: "single-threaded; pure, no I/O"
  latency_budget: "sub-millisecond per pair; called once per candidate in a client-side loop"

# approval: written ONLY by cp_tool.py approve.
approval:
  by: agent-auto (G-8 human boundary NOT exercised)
  when: '2026-10-13'
  attest_readability: true
  attest_minimalism: true
  attest_debuggability: true
  content_sha256: 19e7e46736c026c61de853fd9bc44198e93a23b15ca9e88bd23d06bdf5e51dc6
---

# CP: `filter_eligible_matches`

## Intent

Decide, **before any scoring**, whether two profiles are allowed to be matched at
all — by applying each participant's *explicit* hard constraints to the other's
profile. It refines `IP.rentmate.compatibility`: compatibility is meaningless if the
candidate should never have been considered.

## The contract, in one paragraph

Each side may state hard constraints. A constraint is applied **only when it is
explicitly stated**; a missing or undisclosed value is not a wildcard, and it is
never silently relaxed to make a match succeed. When both sides state a strict
requirement, **both directions** must pass. Gender identity (an optional, sensitive
field) is compared against the *other* person's selected roommate-gender
categories — the two are separate fields, and there is no combined "same gender as
me" option.

## Edge cases the predicates cover

| Predicate | Edge case it guards |
|---|---|
| case 1 → `true` | the happy path: mutual category match, both directions |
| case 2 → `false` | one direction fails ⇒ the pair is ineligible (both must pass) |
| case 3 → `false` | undisclosed gender must not satisfy a stated category |
| case 4 → `true` | `any_gender: true` genuinely disables the filter (it is not a "missing" value) |
| case 5 → `false` | an explicit smoking constraint is hard, even when the other side is neutral |

## Notes for the two independent implementers

- The return is a plain `bool`. Any algorithm is fine; only the result is constrained.
- **Never relax a stated filter.** If a field the filter needs is absent, the filter
  fails — it does not pass and it does not raise.
- `any_gender: true` and an absent `roommate_gender_categories` are different states:
  the first means "no gender constraint", the second means "not stated". The oracle
  pins the first; the second is left to the CP revision that decides it, deliberately
  rather than by guess.
