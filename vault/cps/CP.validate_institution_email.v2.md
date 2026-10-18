---
# ============================================================================
# CONTRACT PLAN — CP.validate_institution_email.v2  (schema cp_version 1)
#
# v2 IS A PROSE RECONCILIATION, NOT A SEMANTIC CHANGE. The five oracle cases and
# the matching rule are carried over from v1 UNCHANGED — the shipped code has
# always implemented exactly this semantics. What v2 corrects is the false
# context v1 was written in, after the owner's 2026-10-14 decisions:
#
#   1. v1 deferred mailbox confirmation to "Supabase Auth as a separate, later
#      step". THERE IS NO LATER STEP. The student flow has no Auth of any kind —
#      no password, no OTP, no session — and `student_verifications` was dropped,
#      so nothing is stored to attest eligibility either. The claim is deleted,
#      not deferred: eligibility is the whole check, and U8 (IP.rentmate.v3)
#      records that even it is a UX affordance, not a security control.
#   2. v1 described a "server-side allowlist ... eight entries". The allowlist in
#      the shipped build is CLIENT-SIDE configuration: 12 institutions / 41 email
#      domains in `Figma/src/lib/institutions.ts`, English + Chinese names.
#   3. v1 cited `docs/site-spec-suite/technical-requirements.md` — removed from
#      this branch with the rest of the unratified suite. Sources are re-pinned
#      to the shipped code and the owner's decisions.
#
# ORACLE PROVENANCE: `contract_derivation`. Expected values continue to be
# computed from the stated matching semantics, NOT transcribed from any target;
# they were additionally re-verified against the shipped `validateInstitutionEmail`
# and all five cases agree (see oracle_origin.note).
# ============================================================================
cp_version: 1
id: CP.validate_institution_email.v2
status: approved

ip_nodes:
  - IP.rentmate.safety

edit_tag:
  author: "agent"
  when: "2026-10-18"
  version: 2
  change: "reconciled against the shipped code after the 2026-10-14 decisions: the allowlist is client-side configuration (12 institutions / 41 domains in Figma/src/lib/institutions.ts), not a server-side eight-entry table; the dead claim that mailbox confirmation is 'Supabase Auth's separate, later step' is deleted outright (no student Auth exists); 'sign-up path' restated as the /verify eligibility gate; dangling site-spec-suite citations replaced with shipped-code sources. The signature, the five oracle cases and the matching semantics are UNCHANGED — the contract did not drift, its context did."

# --- the contract -----------------------------------------------------------
signature:
  name: validate_institution_email
  parameters:
    - {name: email, type: "str"}
  returns: "InstitutionEligibility"

preconditions:
  - {kind: type_check, subject: "email", expected_type: "str"}

postconditions:
  - {kind: outcome, subject: "return.eligible", op: "is_type", value: "bool"}

# Analysed and genuinely empty: pure, offline, no I/O (the allowlist ships in the
# client bundle as configuration). The soft CP_EFFECTS_ALL_EMPTY warning is
# expected and accepted — a security claim like "no substring matching" is a
# *behavioural* assertion, and it is pinned by oracle cases 4 and 5, not by a
# general predicate no checker could evaluate (SPEC.md §3).
effects:
  concurrency: []
  security: []
  reliability: []
  backward_compat: []

mutations: []

# --- test oracle (R1: inputs[i] pairs with expected[i]) ---------------------
# ILLUSTRATIVE allowlist for these cases (two entries, for the oracle only):
#   cuhk.edu.hk -> "CUHK" ; hku.hk -> "HKU"
# Both entries are members of the shipped 12-institution / 41-domain table, so
# every case here is also satisfiable against production configuration.
test_oracle:
  inputs:
    - {args: {email: "student@cuhk.edu.hk"}, note: "positive: exact allowlisted domain (allowlist: cuhk.edu.hk->CUHK, hku.hk->HKU)"}
    - {args: {email: "student@gmail.com"}, note: "negative: well-formed address, domain not in the allowlist"}
    - {args: {email: "not-an-email"}, note: "malformed: no domain to resolve"}
    - {args: {email: "student@mail.cuhk.edu.hk.evil.com"}, note: "lookalike: allowlisted domain as a non-terminal label -> must NOT match"}
    - {args: {email: "student@notcuhk.edu.hk"}, note: "suffix spoof: allowlisted string as a substring of a different domain -> must NOT match"}
  expected:
    - - {kind: outcome, subject: "return.eligible", op: is_true}
      - {kind: outcome, subject: "return.institution", op: eq, value: "CUHK"}
    - - {kind: outcome, subject: "return.eligible", op: is_false}
      - {kind: outcome, subject: "return.institution", op: is_none}
    - - {kind: outcome, subject: "return.eligible", op: is_false}
    - - {kind: outcome, subject: "return.eligible", op: is_false}
    - - {kind: outcome, subject: "return.eligible", op: is_false}

provenance:
  drafted_by: "agent"
  source_revision: ""

oracle_origin:
  mode: contract_derivation
  tool: ""
  source_span: ""
  revision: ""
  sha: ""
  note: "Expected values derived from the stated matching semantics (syntax check, domain normalization, exact/dot-boundary allowlist match, never substring) — the same derivation as v1, carried over unchanged. Cases 4 and 5 pin the two spoof classes. Unlike v1, an implementation now exists (Figma/src/lib/institutions.ts, validateInstitutionEmail: exact lookup in a lowercased domain index, split-on-single-@ syntax gate); the five cases were re-run against it on 2026-10-18 and all agree. The two-entry allowlist is an illustrative fixture, not the production list."

production_scale:
  data_size: "one email string per call; the allowlist is a client-side constant in the shipped build — 12 institutions / 41 domains (the two-entry oracle fixture is illustrative only)"
  concurrency: "single-threaded; pure, no I/O"
  latency_budget: "sub-millisecond; runs client-side once at the /verify eligibility gate"

# approval: written ONLY by cp_tool.py approve.
approval:
  by: agent-auto (G-8 human boundary NOT exercised)
  when: '2026-10-18'
  attest_readability: true
  attest_minimalism: true
  attest_debuggability: true
  content_sha256: 5ab221c1d2592741ffc0c8b9b5072a76884abca03c579af762d4ab657223984e
  body_sha256: 0c065879df06349b2a2ce9dee964714cef2438933a74fd4f88452ce958b3c1c6
---

# CP: `validate_institution_email`

## Intent

Decide whether an email address makes its owner **eligible** for the university
path, by checking its syntax and matching its domain against a reviewed
allowlist. It refines `IP.rentmate.safety`: this is the platform's access gate.

## The contract, in one paragraph

Normalize the address, extract the domain, and match it against an allowlist
using **exact or dot-boundary** comparison — never substring matching. A match
establishes **eligibility only**, and in this build eligibility is the *whole* of
the check: there is no mailbox confirmation to defer to, because the student
flow has **no Auth of any kind** — no password, no OTP, no session, and the
`student_verifications` table was dropped, so nothing is stored to attest a pass
either (IP.rentmate.v3, focus `safety`; U8 records that the gate is a UX
affordance, not a security control, since any allowlisted address passes). The
return never carries a `verified` claim.

## What changed from v1 (and why)

| v1 said | v2 states, because that is what ships |
|---|---|
| the allowlist is a **server-side** table of **eight entries** | the allowlist is **client-side** configuration — `Figma/src/lib/institutions.ts`, 12 institutions / 41 email domains |
| a match is not mailbox verification "because Supabase Auth confirmation is a separate, later step" | there is **no later step** — no student Auth exists; the claim is deleted rather than left implying a confirmation that never comes |
| called on the **sign-up path** | there is no sign-up; the check runs once at the **`/verify` eligibility gate** |
| semantics cited from `docs/site-spec-suite/technical-requirements.md` | sources re-pinned to the shipped code; the suite was removed from this branch |

The **oracle is unchanged**: five cases, same semantics. The contract did not
drift — only the prose around it did, and prose that outlives the decision it
describes is exactly what a version bump exists to fix.

## Edge cases the predicates cover

| Predicate | Edge case it guards |
|---|---|
| case 1 → `true` / `"CUHK"` | positive: exact allowlisted domain resolves its institution |
| case 2 → `false` | negative: valid address, unsupported domain |
| case 3 → `false` | malformed address must not crash and must not be eligible |
| case 4 → `false` | lookalike: allowlisted domain as a non-terminal label |
| case 5 → `false` | suffix spoof: allowlisted string as a substring of a foreign domain |

## Notes for the two independent implementers

- The return is a mapping with at least `eligible: bool` and `institution: str|None`.
  On `eligible == false`, `institution` is `None`. (The shipped TypeScript names
  this type `VerificationResult` and additionally returns `domain`; same fields,
  different name — the CP does not pin the name.)
- **Never use substring matching.** `notcuhk.edu.hk` and `mail.cuhk.edu.hk.evil.com`
  must both be rejected; case 5 and case 4 are the tests that say so.
- The **allowlist is configuration, not contract.** Adding or removing an
  institution changes configuration, not this CP. The two oracle entries exist
  only to pin the *semantics*; the shipped table is in
  `Figma/src/lib/institutions.ts`. A malformed address is a `false`, never a
  raised exception.
