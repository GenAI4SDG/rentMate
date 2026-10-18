---
# ============================================================================
# CONTRACT PLAN — CP.filter_eligible_matches.v2  (schema cp_version 1)
#
# v2 IS A CONTRACT CHANGE, NOT A PROSE ONE. The shipped gate has FIVE hard
# constraint families; v1 pinned only two (gender, smoking). Rewritten against
# the shipped code and the owner's 2026-10-14 decisions:
#
#   1. FIVE families now: gender, belief, smoking, commute/location, budget —
#      each applied in BOTH directions (your requirement can hide them, theirs
#      can hide you). The gate is the product's differentiator: the app shows
#      WHY someone was hidden, per person, so the oracle pins each family.
#   2. FLAT SIZE IS NOT A GATE. The owner overruled it on 14 Oct ("why is this
#      a blocking criteria?"). A conflicting flat-size preference now raises a
#      warning when a home is suggested — oracle case 16 is the regression
#      guard that it can never hide a person again.
#   3. Representation fix: v1 oracle used `smoking_status: "non_smoker"` (a
#      string); the shipped matcher reads the 0..1 scalar `smoking_status: 1`.
#      v2 uses the shipped representation so the oracle is executable against
#      the real implementation, not just against v1's two formulations.
#   4. v1 cited `docs/site-spec-suite/technical-requirements.md` — removed from
#      this branch with the rest of the unratified suite. Sources re-pinned to
#      the shipped code (Figma/src/lib/matching.ts) and IP.rentmate.v3 F3.
#
# ORACLE PROVENANCE: `contract_derivation`, now cross-checked against an
# existing implementation — see oracle_origin.note.
# ============================================================================
cp_version: 1
id: CP.filter_eligible_matches.v2
status: approved

ip_nodes:
  - IP.rentmate.compatibility

edit_tag:
  author: "agent"
  when: "2026-10-18"
  version: 2
  change: "extended from the two families v1 pinned (gender, smoking) to the five the shipped gate implements (gender, belief, smoking, commute/location, budget), each applied in both directions; flat size declared NOT a gate (14 Oct owner decision — it warns via flatSizeWarning instead) with a regression-guard oracle case; smoking_status corrected to the 0..1 scalar the shipped matcher reads; oracle extended 5 -> 17 cases; dangling site-spec-suite citation replaced with shipped-code sources"

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
# The Profile fields this contract reads (shipped types, Figma/src/lib/matching.ts):
#   gender_identity: "man"|"woman"|"nonbinary"|"prefer_not_to_say"|null
#   belief_system: str|null
#   area: str|null                      # district the person wants to live in
#   campus_district: str|null           # district of the person's institution
#   budget_min, budget_max: int|null    # monthly rent, HKD
#   flat_size: int|null                 # whole-flat sq ft — a PREFERENCE, never a gate
#   about_me.smoking_status: number     # 0..1 scalar; 1 = non-smoking
#   looking_for: { any_gender, roommate_gender_categories, any_belief,
#                  belief_systems, max_commute_minutes, budget_max,
#                  flat_size_min, smoking_rule }
#
# The commute ESTIMATE model is part of this contract: minutes =
# round(10 + haversine_km(centroid_a, centroid_b) * 2.4) over the 17-district
# centroid table DISTRICT_COORDS in Figma/src/lib/matching.ts. The oracle's two
# location cases are chosen so the verdict is robust to centroid imprecision
# (~13 min inside a 30 limit; ~62 min far outside it) — the exact minutes are
# NOT pinned by this oracle, only the gate verdict is.
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
        profile_a: {gender_identity: "woman", about_me: {smoking_status: 1}, looking_for: {any_gender: true, smoking_rule: "required_non_smoking"}}
        profile_b: {gender_identity: "woman", about_me: {smoking_status: 0}, looking_for: {any_gender: true, smoking_rule: "no_preference"}}
      note: "explicit smoking constraint is hard: a requires non-smoking (smoking_status 1), b's status is 0 — v1's string 'non_smoker' is replaced by the shipped 0..1 scalar"
    - args:
        profile_a: {gender_identity: "woman", looking_for: {any_gender: true, belief_systems: ["buddhist"]}}
        profile_b: {gender_identity: "man", belief_system: "buddhist"}
      note: "belief happy path: a asked for a shared belief system and b's stated belief matches — no gender constraint on either side"
    - args:
        profile_a: {gender_identity: "woman", looking_for: {any_gender: true, belief_systems: ["buddhist"]}}
        profile_b: {gender_identity: "man", belief_system: "christian"}
      note: "belief mismatch: b's stated belief is outside a's selected systems"
    - args:
        profile_a: {gender_identity: "woman", looking_for: {any_gender: true, belief_systems: ["buddhist"]}}
        profile_b: {gender_identity: "man"}
      note: "undisclosed belief never satisfies a stated belief requirement (same no-silent-relaxation property as gender case 3)"
    - args:
        profile_a: {gender_identity: "woman", belief_system: "christian"}
        profile_b: {gender_identity: "man", looking_for: {any_gender: true, belief_systems: ["buddhist"]}}
      note: "bidirectionality: THEM's belief requirement excludes YOU — the pair fails even though a stated nothing"
    - args:
        profile_a: {looking_for: {any_gender: true, max_commute_minutes: 30, budget_max: 10000}, campus_district: "Sha Tin"}
        profile_b: {gender_identity: "woman", area: "Tai Wai"}
      note: "location within limit (~13 estimated min, Sha Tin <-> Tai Wai) — and b states no budget at all, so silence on the other side passes (never silently excludes)"
    - args:
        profile_a: {looking_for: {any_gender: true, max_commute_minutes: 30}, campus_district: "Sha Tin"}
        profile_b: {gender_identity: "woman", area: "Tuen Mun"}
      note: "location over limit (~62 estimated min past the 30 min cap) — the commute estimate is a contract parameter, not a journey quote"
    - args:
        profile_a: {looking_for: {any_gender: true, max_commute_minutes: 30}, campus_district: "Sha Tin"}
        profile_b: {gender_identity: "woman", area: "Atlantis"}
      note: "unknown district on the other side: the estimate is undefined, and an undefined estimate never silently excludes"
    - args:
        profile_a: {gender_identity: "woman", looking_for: {any_gender: true, budget_max: 10000}}
        profile_b: {gender_identity: "man", budget_min: 12000}
      note: "budget: the other side's stated floor (12000) is above your ceiling (10000)"
    - args:
        profile_a: {gender_identity: "woman", looking_for: {any_gender: true, budget_max: 10000}}
        profile_b: {gender_identity: "man", budget_max: 11000}
      note: "budget floor fallback: b stated no budget_min, so b's budget_max (11000) stands in as the floor and exceeds the ceiling"
    - args:
        profile_a: {gender_identity: "man", budget_min: 12000}
        profile_b: {gender_identity: "woman", looking_for: {any_gender: true, budget_max: 10000}}
      note: "budget bidirectionality: THEIR ceiling (10000) excludes you because YOUR floor is 12000 — the mirror of case 13"
    - args:
        profile_a: {gender_identity: "woman", looking_for: {any_gender: true, flat_size_min: 600}}
        profile_b: {gender_identity: "man", flat_size: 300}
      note: "flat size is NOT a gate: a 300 sq ft preference against a 600 sq ft ask still passes — it warns when a HOME is suggested, it never hides a person (14 Oct regression guard)"
    - args:
        profile_a: {gender_identity: "woman", about_me: {smoking_status: 0}}
        profile_b: {gender_identity: "man", looking_for: {any_gender: true, smoking_rule: "required_non_smoking"}}
      note: "smoking bidirectionality: THEM requires a smoke-free home and YOUR status is 0"
  expected:
    - - {kind: outcome, subject: "return", op: eq, value: true}
    - - {kind: outcome, subject: "return", op: eq, value: false}
    - - {kind: outcome, subject: "return", op: eq, value: false}
    - - {kind: outcome, subject: "return", op: eq, value: true}
    - - {kind: outcome, subject: "return", op: eq, value: false}
    - - {kind: outcome, subject: "return", op: eq, value: true}
    - - {kind: outcome, subject: "return", op: eq, value: false}
    - - {kind: outcome, subject: "return", op: eq, value: false}
    - - {kind: outcome, subject: "return", op: eq, value: false}
    - - {kind: outcome, subject: "return", op: eq, value: true}
    - - {kind: outcome, subject: "return", op: eq, value: false}
    - - {kind: outcome, subject: "return", op: eq, value: true}
    - - {kind: outcome, subject: "return", op: eq, value: false}
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
  note: "Expected booleans derived from the stated five-family filter contract (explicit constraints only, both directions, never silently relaxed, undisclosed never satisfies a stated requirement, unknown location/budget never excludes, flat size is not a gate). Unlike v1, an implementation now exists — Figma/src/lib/matching.ts (filterReasons / filterEligible) — and all 17 cases were re-run against it on 2026-10-18 and agree; two independently written Python formulations agree via g1_harness. The commute estimate model (10 min boarding + 2.4 min/km, haversine over the 17-district centroid table) is pinned in the CP prose; the oracle pins only the two verdicts that are robust to centroid imprecision."

production_scale:
  data_size: "one profile pair per call; each profile is a small JSON object (tens of fields)"
  concurrency: "single-threaded; pure, no I/O"
  latency_budget: "sub-millisecond per pair; called once per candidate in a client-side loop"

# approval: written ONLY by cp_tool.py approve.
approval:
  by: agent-auto (G-8 human boundary NOT exercised)
  when: '2026-10-18'
  attest_readability: true
  attest_minimalism: true
  attest_debuggability: true
  content_sha256: a2670dbab2245df6f31ecd8abaf908036459a85d218be018904ed3fb8730d609
  body_sha256: 2355c2877a35d84092f4a8d73b0a1f51c473e823cdc2aa075724ab64997ad034
---

# CP: `filter_eligible_matches`

## Intent

Decide, **before any scoring**, whether two profiles are allowed to be matched at
all — by applying each participant's *explicit* hard constraints to the other's
profile. It refines `IP.rentmate.compatibility`: compatibility is meaningless if
the candidate should never have been considered. The gate is the product's
differentiator — the app shows *which* constraint hid *whom*, in both
directions — so every family is pinned by this oracle rather than argued in
prose.

## The contract, in one paragraph

Each side may state hard constraints in **five families — gender, belief,
smoking, commute/location, budget**. A constraint is applied **only when it is
explicitly stated**; a missing or undisclosed value is not a wildcard, and it is
never silently relaxed to make a match succeed. Every family is evaluated in
**both directions**: the seeker's requirement is applied to the other profile,
and the other's requirement to the seeker, and the pair is eligible only if no
family fires in either direction. Gender identity (an optional, sensitive
field) is compared against the *other* person's selected roommate-gender
categories — the two are separate fields, and there is no combined "same gender
as me" option. **Flat size is not one of them**: it is a preference that warns
when a *home* is suggested outside it, and it must never hide a person.

## What changed from v1 (and why)

| v1 pinned | v2 states, because that is what ships |
|---|---|
| two families (gender, smoking) | **five** — belief, commute/location and budget were in the product but in no contract |
| "undisclosed gender does not pass" | the same no-silent-relaxation rule now covers belief, and the unknown-commute / unknown-budget branches are pinned as *pass* |
| no statement about flat size | **flat size is not a gate** — the owner overruled it on 14 Oct; case 16 is the regression guard |
| `smoking_status: "non_smoker"` (string) | the shipped 0..1 scalar (`1` = non-smoking), so the oracle is executable against the real matcher |
| semantics cited from `site-spec-suite` | sources re-pinned to `Figma/src/lib/matching.ts` and IP.rentmate.v3 F3 |

## Edge cases the predicates cover

| # | Expected | Edge case it guards |
|---|---|---|
| 1 | `true` | the happy path: mutual category match, both directions |
| 2 | `false` | one direction fails ⇒ the pair is ineligible (both must pass) |
| 3 | `false` | undisclosed gender must not satisfy a stated category |
| 4 | `true` | `any_gender: true` genuinely disables the filter (it is not a "missing" value) |
| 5 | `false` | an explicit smoking constraint is hard, even when the other side is neutral |
| 6 | `true` | belief happy path: a stated belief inside the other's selected systems |
| 7 | `false` | belief mismatch: a stated belief outside the selected systems |
| 8 | `false` | undisclosed belief never satisfies a stated belief requirement |
| 9 | `false` | **bidirectionality**: their belief requirement excludes you, though you stated nothing |
| 10 | `true` | location inside the stated commute limit; silence on the other side passes |
| 11 | `false` | location outside the stated commute limit (estimate is a contract parameter) |
| 12 | `true` | unknown district ⇒ undefined estimate ⇒ never silently excludes |
| 13 | `false` | budget: their stated floor is above your ceiling |
| 14 | `false` | budget floor fallback: with no `budget_min`, their `budget_max` stands in |
| 15 | `false` | budget bidirectionality: their ceiling excludes your floor |
| 16 | `true` | **flat size is not a gate** — the 14 Oct regression guard |
| 17 | `false` | smoking bidirectionality: their smoke-free requirement excludes your status |

## Notes for the two independent implementers

- The return is a plain `bool`. Any algorithm is fine; only the result is
  constrained. (The shipped TypeScript additionally exposes an instrumented
  variant, `filterReasons`, that returns the *reasons* per side instead of a
  boolean; this CP pins the boolean, and the reason strings are deliberately
  **not** pinned.)
- **Never relax a stated filter.** If a field the filter needs is absent, the
  filter fails for that direction — it does not pass and it does not raise.
  The exception is *commute* and *budget*, where an **undefined estimate or an
  unstated budget on the other side passes**: unknown must not exclude, it just
  cannot fire.
- `any_gender: true` / `any_belief: true` and an absent categories/systems list
  are different states: the first means "no constraint", the second means "not
  stated" — the second also means "no constraint this pair", but never a
  wildcard match against an undisclosed identity.
- The commute estimate (`round(10 + haversine_km * 2.4)` over the 17-district
  centroid table) is a **contract parameter**, reproduced in the harness
  fixtures; the oracle pins only verdicts that are robust to centroid
  imprecision. `flatSizeWarning` is the other half of the 14 Oct decision and
  is likewise not pinned here — it is prose, not a predicate.
- **The weight table of the score is untouched by this CP.** Nothing here
  contributes to `CP.calculate_match.v2`; these five families exist only to
  decide who reaches the score at all.
