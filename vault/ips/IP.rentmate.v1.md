---
# ============================================================================
# INTENT PLAN — IP.rentmate.v1  (schema ip_version 1)
#
# Captured from THE AUTHORITY: `docs/GENAI SDG interim draft.pdf` (team-agreed,
# 8 pages / 23 questions), as reconciled into PRD.md / TEAM-BRIEF.md /
# docs/build-plans.md on 2026-10-01 (docs/interim-report-reconciliation.md).
#
# DRAFTED BY AN AGENT, NOT BY A HUMAN. The repo convention is that an IP is
# human-authored intent (spec-capture). Here the owner delegated the drafting
# and waived the signature; the G-8 human boundary was NOT exercised. That gap
# is declared in vault/README.md, never papered over.
# ============================================================================
ip_version: 1
id: IP.rentmate.v1
status: approved

edit_tag:
  author: "agent"
  when: "2026-10-13"
  version: 1
  change: "initial intent capture: RentMate's four focuses as an intent tree, read from the interim report; three deterministic capabilities get CPs, the rest are declared orphans"

problem_statement:
  problem: "Non-local students arriving in Hong Kong cannot settle housing quickly: an agency fee worth a month's rent, listings they cannot trust, and roommates they cannot assess before committing. The repository itself disagrees about what the product is, so the build has drifted from the statement the team actually agreed."
  intended_behavior: "A student proves they are a university student, answers a structured profile-and-preference quiz, and receives a deterministic compatibility score with a plain-language explanation, alongside sourced neighbourhood information — with no agency fee, and with no listing verification promised."
  high_impact_components: "The eligibility filter and the compatibility score (both deterministic, and neither may let gender or MBTI influence the score); the university-email eligibility check (eligibility is NOT verification); and the GenAI boundary (GPT-4o-mini writes narrative only, never the score)."

nodes:
  # --- root -----------------------------------------------------------------
  - id: IP.rentmate
    intent: "A Hong Kong student-housing service that matches non-local students with compatible roommates and removes the agency fee, gated on university-student eligibility."
    parent: null
    children:
      - IP.rentmate.compatibility
      - IP.rentmate.affordability
      - IP.rentmate.transparency
      - IP.rentmate.safety

  # --- the four focuses (interim report, in the report's order) -------------
  - id: IP.rentmate.compatibility
    intent: "Match students to each other by lifestyle and preferences, deterministically."
    parent: IP.rentmate
    children: []
    # refined by: CP.filter_eligible_matches.v1, CP.calculate_match.v1

  - id: IP.rentmate.affordability
    intent: "Keep the cost of finding a room below the agency fee of one month's rent."
    parent: IP.rentmate
    children: []
    # ORPHAN by intent: no CP yet (declared, not silently dropped)

  - id: IP.rentmate.transparency
    intent: "Tell a student what a neighbourhood and a room are actually like, with sources."
    parent: IP.rentmate
    children: []
    # ORPHAN by intent: no CP yet

  - id: IP.rentmate.safety
    intent: "Admit only verified university students, and keep their identity data private."
    parent: IP.rentmate
    children: []
    # refined by: CP.validate_institution_email.v1

provenance:
  drafted_by: "agent"
  source: "spec-capture from docs/GENAI SDG interim draft.pdf (team-agreed); reconciliation in docs/interim-report-reconciliation.md"
  note: "Nodes are stated as INTENT (what the team wants), not as mechanisms — the mechanism lives in each CP's contract."
approval:
  by: agent-auto (G-8 human boundary NOT exercised)
  when: '2026-10-13'
  attest_readability: true
  attest_minimalism: true
  attest_debuggability: true
  content_sha256: 67c73da6c52fd999f581589556d8d19625fa94297195689bbcb8e0e72ea17f6f
  body_sha256: cc405dfb1156e90ebd9f22994a23cbae0bd051b0f9654c4d8620f7bb51755a2a
---

# IP: RentMate — the four focuses above the contracts

## Vision (verbatim)

> "**RentMate** — Roommate matching and affordable housing for students in Hong Kong
> — helping non-local students settle in quickly, with compatible roommates and no
> agency fee worth a month's rent." — `README.md`

> "**The four focuses, in order:** compatibility · affordability · transparency ·
> safety (trust and privacy). **Listing verification is ruled out.**" — `docs/build-plans.md`

## Why this IP exists

The repository had no single artifact saying *what the product is*. Instead three
incompatible statements coexist: the interim report (authoritative), the
`docs/site-spec-suite/` draft (unratified, adds in-app chat + a gender filter), and
`HK_Rental_Platform_Master_Cursor_Spec.md` (a landlord/tenant property marketplace,
which is what `backend/supabase/` was actually built against). The intent tree above
is the top of the correctness boundary the CPs are checked against; the reconciliation
of those three is a separate, non-normative note.

## Scope

**In scope (intent):** the four focuses named by the interim report, in the report's order.

**Out of scope (the report's own boundary list):** HKID verification · acting on
reviews · employee-guided room tours · dispute settlement · legal advice · services
for landlords · a payment system · 3D construction of the room.

## Notes

- **Two figures are flagged, not carried as intent.** The report's headline **66%**
  and **68%** are the *same* survey items earlier drafts recorded as detractor counts
  (27/41 and 28/41) — `docs/interim-report-reconciliation.md` §2 and
  `docs/open-decisions.md` both say so. The report re-expresses detractor counts as
  agreement percentages. This is recorded here as a caveat, never as a node.
- **Deliberately flat.** Node ids are two levels only (`IP.<scope>.<node>`); a
  deeper id fails the tool's `NODE_ID_RE`. `IP.rentmate.safety` carries the
  university-eligibility mechanism rather than a third-level node.
- **Orphans are the point.** `affordability` and `transparency` are stated intent
  that no CP refines *yet* — `ip_tool.py link` reports them, which is exactly the
  "we meant to build it" visibility the IP exists to provide.
