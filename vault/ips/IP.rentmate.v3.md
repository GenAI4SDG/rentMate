---
# ============================================================================
# INTENT PLAN — IP.rentmate.v3  (schema ip_version 1)
#
# DRAFTED BY AN AGENT, FROM THE OWNER'S STATED INTENT and from the code as it
# now stands. This is a SOLO methodology run on an offshoot branch
# (`AI-random-bs-go`): the object of the exercise is to see how the
# IP -> CP -> PG -> gate pipeline behaves on a real project, not to contribute
# to the team's documents.
#
# v3 IS A CORRECTION, NOT A RE-TRANSCRIPTION. Between v2 and v3 the owner made
# a set of decisions that CHANGED WHAT THE PRODUCT IS, and several of them are
# DOWNGRADES against what v2 promised:
#
#   1. AUTH. v2 promised "verification is stored as a boolean attestation".
#      There is now NO verification and NO Supabase Auth at all. The account
#      key is the email, checked client-side against an institution domain.
#      The `student_verifications` table was DROPPED.
#   2. GENAI. v2 promised "GPT-4o-mini writes the narrative". No model is
#      called anywhere in the shipped app. Every AI-shaped feature is
#      pre-written content, labelled "AI · demo" in the UI.
#   3. CHAT. v2 had no chat. There is now real, persisted in-app chat with
#      report + block moderation, and contact details are never exchanged.
#
# These are stated as intent, not hidden. The G-8 human boundary was NOT
# exercised; the owner waived the signature and told the agent to auto-approve.
# That gap is declared in `vault/README.md`, never papered over.
# ============================================================================
ip_version: 1
id: IP.rentmate.v3
status: approved

edit_tag:
  author: "agent"
  when: "2026-10-14"
  version: 3
  change: "rewritten against the shipped code after the owner's 2026-10-14 decisions: email-as-identity with NO Supabase Auth and NO stored verification (RLS disabled); GenAI downgraded from a live model to hardcoded, explicitly-labelled demo content; new real in-app chat with report/block moderation and no contact-detail exchange; viewing scheduler and neighbourhood guide hardcoded; 3D walkthrough reduced to a labelled cosmetic stub; verification table dropped; quiz at 14 composite questions covering every eligibility filter and every scored factor"

problem_statement:
  problem: "Non-local students arriving in Hong Kong cannot settle housing quickly: an agency fee worth a month's rent, listings they cannot trust, and roommates they cannot assess before committing. The repository itself disagreed about what the product is — a landlord/tenant marketplace, a 'verification is the product' trust utility, and a roommate-matcher all coexisted — so the build drifted from the statement the team actually agreed."
  intended_behavior: "A student enters a university email, which is checked client-side against an institution domain and is the account key for everything that follows. They answer a 14-question questionnaire whose seven eligibility answers exclude people outright and whose soft answers feed a deterministic compatibility score. They then match on a hook deck, talk inside the app (never by exchanging personal contact details), can report or end a connection, and can propose a viewing time. Neighbourhood and safety information is pre-written and cited, and every feature that would be a model in production is labelled as a demo stub."
  high_impact_components: "The seven hard eligibility filters — gender, belief, target area, commute, budget, room size, smoking — all of which gate candidates before scoring and none of which may enter the score; the deterministic compatibility score over the six shared soft lifestyle factors plus MBTI, computed client-side; the in-app chat as the only channel, so contact details are never shared; the moderation pair (report, block) as the safety mechanism; and the GenAI boundary — which in this build is a LABEL, not a model."

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
    intent: "Match students to each other by lifestyle and stated preference, then let them talk inside the app. Hard constraints gate candidates BEFORE scoring and never enter it; the score itself is deterministic over the soft lifestyle factors, with MBTI carried as a soft preference; conversation is in-app only — never by exchanging personal contact details — with report and block available at any point, and an option to propose a viewing time."
    parent: IP.rentmate
    children: []
    # refined by: CP.filter_eligible_matches.v1, CP.calculate_match.v2

  - id: IP.rentmate.affordability
    intent: "Keep the cost of finding a room below the agency fee of one month's rent."
    parent: IP.rentmate
    children: []
    # ORPHAN by intent: no CP yet (declared, not silently dropped)

  - id: IP.rentmate.transparency
    intent: "Tell a student what a neighbourhood and a room are actually like, with sources — never an uncited claim, and never a model's opinion of an area. In this build the guide is pre-written and cited, and the parts that would be a retrieved, cited model answer are labelled as demo stubs."
    parent: IP.rentmate
    children: []
    # ORPHAN by intent: no CP yet

  - id: IP.rentmate.safety
    intent: "Admit only university students, via a university email that is checked client-side against an institution domain and used as the account key — eligibility, explicitly NOT verification of a listing or a person, and nothing is stored to attest it. Keep identity data private, and make the app safe to talk in: report and block end a connection, and contact details are never exchanged."
    parent: IP.rentmate
    children: []
    # refined by: CP.validate_institution_email.v1

provenance:
  drafted_by: "agent"
  source: "owner's stated intent (2026-10-14) against the shipped code in Figma/src and backend/supabase. Every claim below was checked against the implementation, not assumed."
  note: "Nodes are stated as INTENT (what we want), not as mechanisms — the mechanism lives in each CP's contract. Feature-level detail is prose below, because the schema fixes node ids at two levels."
approval:
  by: agent-auto (G-8 human boundary NOT exercised)
  when: '2026-10-14'
  attest_readability: true
  attest_minimalism: true
  attest_debuggability: true
  content_sha256: 5eaf9013cbbaac92b77917ffb152ba3bbfca0ad3b1fca6b0383e59b692978185
  body_sha256: 0b62d60a92f761253620fdac3f7b6dc797b496c71efd9793a02e94d5e283db66
---

# IP: RentMate — the four focuses above the contracts

## Vision (verbatim)

> "**RentMate** — Roommate matching and affordable housing for students in Hong Kong
> — helping non-local students settle in quickly, with compatible roommates and no
> agency fee worth a month's rent." — `README.md`

> "**The four focuses, in order:** compatibility · affordability · transparency ·
> safety (trust and privacy). **Listing verification is ruled out.**" — interim report

## Why this IP exists, and why it is v3

The repository had no single artifact saying *what the product is*. Three
incompatible statements coexisted — the interim report (team-agreed), the
`docs/site-spec-suite/` draft (unratified; added in-app chat and a strict gender
filter), and `HK_Rental_Platform_Master_Cursor_Spec.md` (a landlord/tenant
marketplace, which is what `backend/supabase/` was actually built against).

**v3 is not a re-transcription of those docs — those docs are gone, and v2 was
not a transcription either.** v2 was written from the owner's stated intent.
Between v2 and v3 the owner made a further set of decisions, and the code was
built to match. **Several of those decisions are downgrades from what v2
promised, and they are recorded here rather than quietly absorbed:**

| Question | v2 promised | v3 states, because that is what ships |
|---|---|---|
| Student status | "verification is stored as a boolean attestation" | **nothing is stored.** `student_verifications` was dropped; the only check is a client-side domain test |
| Sign-in | "a student signs in and proves student status with a university email" | **no Supabase Auth at all** — no password, no OTP, no session. The email *is* the account key |
| Row security | implied by the boolean attestation | **RLS is disabled on every table**, because with no `auth.uid()` a policy would block every row |
| The GenAI narrative | "GPT-4o-mini writes the narrative only — the one GenAI component the report names by model, never cut" | **no model is called anywhere.** Every AI-shaped feature is pre-written content carrying an "AI · demo" badge |
| Chat | not mentioned | **real, persisted in-app chat** with report and block |
| Contact details | privacy by design | **never exchanged** — no phone, no socials, chat only, and ending a connection removes it for both sides |
| Quiz length | 12 questions | **14 questions**, all seven eligibility filters kept, soft block compressed |
| 3D walkthrough | "3D construction of the room" out of scope | **a labelled cosmetic stub** — a flat stock-photo drag panorama marked "Illustrative mock · not a real 3D scan" |
| Neighbourhood guide | a cited guide | pre-written and cited for 9 districts; the retrieval is a stub |
| Listing verification | ruled out | still ruled out, and now the *table* is gone too |

### The one thing this IP will not do

**It will not claim a model is running when it is not.** Every feature whose
production form would be a model call is labelled in the UI as a demo stub, and
this document says so in plain words. If a judge or a teammate asks "is that
real AI?", the honest answer for this build is *no — it is pre-written content
shaped like the real feature*. That is the trade the owner accepted for
reliability, and it is stated rather than dressed up.

## What we need (the feature set, as built)

**In scope — the demo path:**

- **F1 · University-email access gate.** A student types a university email. It
  is checked **client-side** against an institution allowlist (`lib/institutions.ts`)
  and becomes the account key for the profile, the matches and the chat. There
  is no sign-up, no password, no OTP, and no server-side check. **Eligibility,
  not verification** — and unlike v2, nothing is stored to attest it either.
- **F2 · Lifestyle questionnaire (14 questions).** Four soft questions
  (`lifestyle` ×2, `thinking` ×2), one bonding question, and **nine eligibility
  questions**. The soft block is *composite*: one option writes concrete 0..1
  values for three factors, or fixes two type axes at once — so the matcher's
  input is unchanged (all six soft factors, a full four-letter type, all sixteen
  types reachable) while the questionnaire stays short. Verified, not assumed.
- **F3 · Hard-constraint filter.** **Seven** eligibility answers gate candidates
  before scoring: gender, belief, target area, commute limit, budget, room size,
  smoking. These are predicates, never weights, and the app shows who they hid
  and why.
- **F4 · Deterministic compatibility score.** A weighted similarity over the
  soft factors the two profiles share, renormalised over shared factors only;
  MBTI is one scored factor. Computed **client-side** in `lib/matching.ts`.
- **F5 · Match narrative and hooks.** Pre-written, and derived deterministically
  from the two profiles (`lib/hooks.ts`) — an icebreaker deck, not a model's
  prose. **This is the feature v2 called GenAI; it is now a labelled demo.**
- **F6 · Match results with price context.** Cost shown against the
  no-agency-fee promise.
- **F7 · In-app chat with moderation.** Persisted `messages`, delivered over
  Supabase Realtime, with **report** and **block** (which ends the connection
  for both sides). No contact details are exchanged anywhere in the product.
- **F8 · Viewing scheduler.** Propose a viewing time from a small set of slots.
  Labelled as a demo stub; no calendar, no confirmation, no notification.
- **F9 · Sourced neighbourhood and safety notes.** Nine district guides and
  eight sourced rental cautions, each with its source named. The eighth safety
  note is an explicit placeholder for an official source the owner will supply.
- **F10 · Privacy.** Synthetic profiles for the curated demo cast, labelled as
  synthetic in the UI. No identity document is ever collected.

**Out of scope (refuse to build):** HKID verification · acting on reviews ·
employee-guided room tours · dispute settlement · legal advice · services for
landlords · a payment system · **verification of rental listings** · native
mobile · face scanning · **any external chat, video or contact-detail sharing** ·
a live model endpoint in the demo build · a real 3D capture of any room.

## Open questions (carried, not hidden)

- **U7 — RLS disabled with no Auth.** Every table runs with row level security
  **off**, because there is no `auth.uid()` to key a policy on and an enabled
  policy would block every row. The consequence is that anyone with the anon
  key can read and write every row. **This is fine for a hackathon demo with
  synthetic data and is not fine for anything real.** It must be fixed before
  this schema ships to actual students, and the fix is a real auth model, not
  a policy patch.
- **U8 — the client-side domain gate is not a security control.** It is a UX
  affordance. A student can type any allowlisted address, including one that is
  not theirs, and there is nothing server-side to catch it.
- **U9 — the 12-question boundary.** The owner set 12 as the demo length. The
  build is **14**: keeping all seven eligibility filters (the product's
  differentiator) plus the bonding question leaves two slots for the soft
  block, and compression below that would drop scored factors. The two extra
  questions are recorded here rather than silently absorbed.
- **U6 — Figma vs the root app, and therefore hosting.** Still the team's open
  question, unchanged from v2.
- **The 66% / 68% figures.** The report's headline percentages are the same
  survey items earlier drafts recorded as *detractor counts* (27/41 and 28/41).
  Recorded as a caveat, never as a node.

## Notes

- **Deliberately flat.** Node ids are two levels only (`IP.<scope>.<node>`); a
  deeper id fails the tool's `NODE_ID_RE`. `IP.rentmate.safety` carries the
  university-eligibility mechanism rather than a third-level node.
- **Orphans are the point.** `affordability` and `transparency` are stated
  intent that no CP refines *yet* — `ip_tool.py link` reports them, which is
  exactly the "we meant to build it" visibility the IP exists to provide.
  `transparency` now has substantial *content* (F9) but still no *contract*,
  because a cited guide is prose, not a deterministic function — so it stays an
  orphan, and calling it covered would be the dishonest reading.
- **The three contracts are unchanged.** `CP.calculate_match.v2`,
  `CP.filter_eligible_matches.v1` and `CP.validate_institution_email.v1` still
  describe the shipped TypeScript, and the matcher still passes all eight oracle
  cases. **The IP moved; the contracts did not need to.** That is the outcome
  the split exists to make cheap: an intent change with no contract churn.
