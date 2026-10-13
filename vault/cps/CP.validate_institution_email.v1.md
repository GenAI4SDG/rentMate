---
# ============================================================================
# CONTRACT PLAN — CP.validate_institution_email.v1  (schema cp_version 1)
#
# The access gate (report focus #4). From
# docs/site-spec-suite/technical-requirements.md §3.4 and §2.
#
# ORACLE PROVENANCE: `contract_derivation`. The expected values are derived from
# the stated matching semantics (exact / dot-boundary domain match against a
# server-side allowlist) with a TWO-ENTRY ILLUSTRATIVE allowlist; nothing was
# read from a target. The production eight-entry allowlist is CONFIGURATION and
# is deliberately NOT frozen here — see the note below and suite open items
# T2/D1 ("Do not invent domain values").
# ============================================================================
cp_version: 1
id: CP.validate_institution_email.v1
status: approved

ip_nodes:
  - IP.rentmate.safety

edit_tag:
  author: "agent"
  when: "2026-10-13"
  version: 1
  change: "initial contract for the university-email eligibility check: syntax + exact/dot-boundary allowlist match; eligibility is not verification"

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

# Analysed and genuinely empty: pure, offline, no I/O (the allowlist is
# server-side config). The soft CP_EFFECTS_ALL_EMPTY warning is expected and
# accepted — a security claim like "no substring matching" is a *behavioural*
# assertion, and it is pinned by oracle cases 4 and 5, not by a general
# predicate no checker could evaluate (SPEC.md §3).
effects:
  concurrency: []
  security: []
  reliability: []
  backward_compat: []

mutations: []

# --- test oracle (R1: inputs[i] pairs with expected[i]) ---------------------
# ILLUSTRATIVE allowlist for these cases (two entries, for the oracle only):
#   cuhk.edu.hk -> "CUHK" ; hku.hk -> "HKU"
# The production list is eight institutions and MUST be verified against official
# university sources before the university path is enabled (suite §6, T2, D1).
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
  note: "Expected values derived from the stated matching semantics (technical-requirements.md §3.4: syntax check, domain normalization, exact/dot-boundary allowlist match, never substring). Cases 4 and 5 pin the two spoof classes the suite names; the allowlist itself is an illustrative two-entry fixture, not the production list."

production_scale:
  data_size: "one email string per call; the allowlist is a small server-side table (eight entries in production)"
  concurrency: "single-threaded; pure, no I/O"
  latency_budget: "sub-millisecond; called on the sign-up path"

# approval: written ONLY by cp_tool.py approve.
approval:
  by: agent-auto (G-8 human boundary NOT exercised)
  when: '2026-10-13'
  attest_readability: true
  attest_minimalism: true
  attest_debuggability: true
  content_sha256: 4b6f1fdab498c145f23588f6ad10f326b2ba3ee1aae483ce0f26968bc8ed508d
---

# CP: `validate_institution_email`

## Intent

Decide whether an email address makes its owner **eligible** for the university
path, by checking its syntax and matching its domain against a reviewed allowlist.
It refines `IP.rentmate.safety`: this is the platform's access gate (focus #4).

## The contract, in one paragraph

Normalize the address, extract the domain, and match it against a server-side
allowlist using **exact or dot-boundary** comparison — never substring matching.
A match establishes **eligibility only**; it is *not* verification of mailbox
ownership (Supabase Auth confirmation is a separate, later step). The return never
carries a `verified` claim.

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
  On `eligible == false`, `institution` is `None`.
- **Never use substring matching.** `notcuhk.edu.hk` and `mail.cuhk.edu.hk.evil.com`
  must both be rejected; case 5 and case 4 are the tests that say so.
- The **allowlist is configuration, not contract.** The two entries used by the
  oracle exist only to pin the *semantics*. Do not hard-code the eight production
  domains from this file — they must be verified from official university sources
  first (suite §6). A malformed address is a `false`, never a raised exception.
