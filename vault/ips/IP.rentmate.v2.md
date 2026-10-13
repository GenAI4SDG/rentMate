---
# ============================================================================
# INTENT PLAN — IP.rentmate.v2  (schema ip_version 1)
#
# DRAFTED BY AN AGENT, FROM THE OWNER'S STATED INTENT — not transcribed from
# the md docs. This is a SOLO methodology run on an offshoot branch
# (`AI-random-bs-go`): the object of the exercise is to see how the
# IP -> CP -> PG -> gate pipeline behaves on a real project, not to contribute
# to the team's documents. The contradictory md docs the v1 draft reconciled
# against have been REMOVED from this branch (see `vault/NOTES.md`); the
# surviving primary sources are `docs/GENAI SDG interim draft.pdf` and the
# `Figma/` export.
#
# The G-8 human boundary was NOT exercised; the owner waived the signature and
# told the agent to auto-approve. That gap is declared in `vault/README.md`,
# never papered over.
# ============================================================================
ip_version: 1
id: IP.rentmate.v2
status: approved

edit_tag:
  author: "agent"
  when: "2026-10-13"
  version: 2
  change: "rewritten from the owner's stated intent instead of the (now-removed) md docs: gender is a HARD eligibility filter, MBTI is a SOFT scoring preference, the demo quiz is 12 questions; adds the Figma-vs-root hosting open question"

problem_statement:
  problem: "Non-local students arriving in Hong Kong cannot settle housing quickly: an agency fee worth a month's rent, listings they cannot trust, and roommates they cannot assess before committing. The repository itself disagreed about what the product is — a landlord/tenant marketplace, a 'verification is the product' trust utility, and a roommate-matcher all coexisted — so the build drifted from the statement the team actually agreed."
  intended_behavior: "A student proves they are a university student with a university email, answers a ~12-question lifestyle-and-preference quiz, and states any hard roommate constraints (gender, smoking). They receive a deterministic compatibility score with a plain-language, GenAI-written explanation, plus sourced neighbourhood and room information — with no agency fee, and with no promise that listings are verified."
  high_impact_components: "The hard-constraint filter — gender and smoking gate candidates BEFORE scoring and gender must never enter the score; the deterministic compatibility score over soft factors (MBTI is a scored preference, not a filter); the university-email ACCESS gate (eligibility, explicitly NOT verification of a listing or a person); and the GenAI boundary — GPT-4o-mini writes the narrative only, never the score."

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
    intent: "Match students to each other by lifestyle and stated preference. Hard constraints (gender, smoking) gate candidates BEFORE scoring and never enter it; the score itself is deterministic over soft lifestyle factors, with MBTI carried as a soft preference; a GenAI narrative explains the match in plain language. Elicited for the demo by a 12-question quiz."
    parent: IP.rentmate
    children: []
    # refined by: CP.filter_eligible_matches.v1, CP.calculate_match.v2

  - id: IP.rentmate.affordability
    intent: "Keep the cost of finding a room below the agency fee of one month's rent."
    parent: IP.rentmate
    children: []
    # ORPHAN by intent: no CP yet (declared, not silently dropped)

  - id: IP.rentmate.transparency
    intent: "Tell a student what a neighbourhood and a room are actually like, with sources — never an uncited claim, and never a model's opinion of an area."
    parent: IP.rentmate
    children: []
    # ORPHAN by intent: no CP yet

  - id: IP.rentmate.safety
    intent: "Admit only university students (a university email is the gate) and keep their identity data private — verification is stored as a boolean attestation, never the source document."
    parent: IP.rentmate
    children: []
    # refined by: CP.validate_institution_email.v1

provenance:
  drafted_by: "agent"
  source: "owner's stated intent (2026-10-13) over the surviving primary sources: docs/GENAI SDG interim draft.pdf and the Figma/ export. NOT read from the removed md docs."
  note: "Nodes are stated as INTENT (what we want), not as mechanisms — the mechanism lives in each CP's contract. Feature-level detail is prose below, because the schema fixes node ids at two levels."
approval:
  by: agent-auto (G-8 human boundary NOT exercised)
  when: '2026-10-13'
  attest_readability: true
  attest_minimalism: true
  attest_debuggability: true
  content_sha256: 26d4a925498dc692796a3774f7fac3e1c67acc05f1fb737d2a6dcf5abb9ebfd0
  body_sha256: b891c5e787a425165696e963add2c30cd74aba115f381c53b00098864e711489
---

# IP: RentMate — the four focuses above the contracts

## Vision (verbatim)

> "**RentMate** — Roommate matching and affordable housing for students in Hong Kong
> — helping non-local students settle in quickly, with compatible roommates and no
> agency fee worth a month's rent." — `README.md`

> "**The four focuses, in order:** compatibility · affordability · transparency ·
> safety (trust and privacy). **Listing verification is ruled out.**" — interim report

## Why this IP exists, and why it is v2

The repository had no single artifact saying *what the product is*. Three
incompatible statements coexisted — the interim report (team-agreed), the
`docs/site-spec-suite/` draft (unratified; added in-app chat and a strict gender
filter), and `HK_Rental_Platform_Master_Cursor_Spec.md` (a landlord/tenant
marketplace, which is what `backend/supabase/` was actually built against).

**v2 is not a re-transcription of those docs — those docs are gone.** v2 is
written from the owner's *stated* intent, and it differs from v1 where the owner
overruled what the docs said:

| Question | v1 said (from the docs) | v2 says (owner's intent) |
|---|---|---|
| Gender | "neither gender nor MBTI may influence the score" | gender is a **HARD filter** — it gates candidates, and still never enters the score |
| MBTI | "cannot influence the score" | MBTI is a **soft scoring preference** (a scored factor, not a gate) |
| Quiz length | the demo's 7 questions | **12 questions** — "a decent boundary between too clunky/slow and not thought through enough" |
| Where the UI lives | ambiguous (root app vs `Figma/`) | **open** — see Open questions |

## What we need (the feature set, my reading of the intent)

**In scope — the demo path:**
- **F1 · University-email access gate.** A student signs in and proves student
  status with a university email. Eligibility, not verification.
- **F2 · Lifestyle quiz (~12 questions).** The profile that matching runs on —
  sleep, guests, noise, shared space, bills, tidiness, plus the preferences that
  let MBTI be *inferred from behaviour* rather than asked as a 4-letter code.
- **F3 · Hard-constraint filter.** Stated gender and smoking preferences gate
  candidates **before** scoring. This is a predicate, not a weight.
- **F4 · Deterministic compatibility score.** A weighted similarity over the soft
  factors the two profiles share; MBTI enters here as one scored factor.
- **F5 · GenAI compatibility narrative.** GPT-4o-mini explains *why* two people
  match and flags friction points. **The one GenAI component the report names by
  model — never cut.**
- **F6 · Match results with price context.** The matched roommates / listings,
  with cost shown against the no-agency-fee promise.
- **F7 · Sourced neighbourhood guide.** A cached, citation-bearing guide to the
  area and the room's condition.
- **F8 · Privacy & safety.** Verification stored as a boolean attestation only;
  synthetic profiles for the demo; PDPO-shaped (purpose-limited, use-limited).

**Out of scope (refuse to build):** HKID verification · acting on reviews ·
employee-guided room tours · dispute settlement · legal advice · services for
landlords · a payment system · 3D construction of the room · **verification of
rental listings** · native mobile · face scanning · custom chat or video (connect
to Google Meet).

## Open questions (carried, not hidden)

- **U6 — Figma vs the root app, and therefore hosting.** The team has an
  inconclusive discussion about whether the UI continues in `Figma/` or moves
  into the root Vite app. This is not a docs question; it is a build question
  with a deployment consequence: the root app is a Vite SPA, so presenting it
  from a laptop means **either** serving it locally (`npm run dev`) **or**
  hosting it (e.g. Vercel) so the link opens on any screen. Left open here
  because it is the owner's call, not the methodology's.
- **The 66% / 68% figures.** The report's headline percentages are the same
  survey items earlier drafts recorded as *detractor counts* (27/41 and 28/41).
  Recorded as a caveat, never as a node.

## Notes

- **Deliberately flat.** Node ids are two levels only (`IP.<scope>.<node>`); a
  deeper id fails the tool's `NODE_ID_RE`. `IP.rentmate.safety` carries the
  university-eligibility mechanism rather than a third-level node.
- **Orphans are the point.** `affordability` and `transparency` are stated intent
  that no CP refines *yet* — `ip_tool.py link` reports them, which is exactly the
  "we meant to build it" visibility the IP exists to provide.
