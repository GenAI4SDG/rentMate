# RentMate — Implementation Plan

**Version:** 0.1 — draft for review · **Prepared:** 7 October 2026 · **Status:** Unapproved  
**Schedule constraint from project brief:** code freeze 14 October 2026; submission approximately 18 October 2026. This plan does not authorize code changes before the team signs off the suite.

## 1. Delivery rule

Build the smallest end-to-end journey that works on the demo machine. Resolve the specification decisions first, then freeze types and routes. The product must honestly distinguish the real university-email access gate from a synthetic, no-email demo. Do not implement any feature that the approved Product Requirements document and team scope do not authorize.

## 2. Stage plan and sign-offs

| Stage | Target | Deliverable | Sign-off / exit test |
|---|---|---|---|
| 0. Approve suite | 7–8 Oct | Team decisions recorded for O1–O6 and technical D1–D5; question set and exact Q7 confirmed; revised docs/version. | Six-document checklist signed. No open choice blocks the demo path. |
| 1. Repair the front door | 8–9 Oct | Landing CTA; `/start` choice; working `/trust`; responsive shell and correct, non-overstated copy. | Demo reaches quiz without email; Trust link and deep link work; no stale “7 questions” claim. |
| 2. Quiz and data contract | 9–10 Oct | Shared typed quiz definition, accessible sans-serif question components, 12 approved answers, demo in-memory state, Supabase real-user answer persistence if ready. | Q7 gender choice removed; all housing preferences are represented; refresh behavior matches mode; typecheck passes. |
| 3. Compatibility centrepiece | 10–11 Oct | Pure weighted score, seeded profiles, server-side compatibility narrative with neutral fit/friction copy, labelled demo. | Two test profiles yield predictable scores; model unavailable fallback works; no API key in client. |
| 4. Housing transparency | 11–12 Oct | Listing fixtures, filters, details, source labels, sourced guide/citations, cached responses if backend is ready. | No invented listing facts; empty filters recover; guide cites its claims or declines. |
| 5. Viewing and finishing features | 12–13 Oct | Google Meet handoff; gallery and walkthrough request UI; settling-in/language only if core tests pass. | All actions are clearly live/external/simulated; no custom chat/video. |
| 6. Usability / hardening | 13 Oct | Test with 5–10 international students where recruitment is feasible; fix top blockers; rehearse on the named demo machine; record backup video. | Main journey completes without help; collect concrete failures, not feature wishlist. |
| 7. Code freeze | 14 Oct | Freeze working scope; no new features. Integration, copy corrections and safe bug fixes only. | `npm run typecheck`, `npm run lint`, `npm run build`; demo path rehearsed end-to-end. |
| 8. Submission prep | 15–18 Oct | Rehearsals, recorded demo, presentation/story materials and submission. | Live demo and backup are both available; no half-built feature shown as complete. |

Dates after code freeze are governed by the existing project brief; if the current team calendar differs, update this plan before execution.

## 3. Dependency sequence

```text
Approve spec + Q7 + verification modes
             ↓
Freeze shared types, question schema and route map
             ↓
Landing /start /trust ────────────────┐
             ↓                         │
Quiz + synthetic fixtures              │
             ↓                         │
Weighted match + narrative              │
             ↓                         │
Listing filters + sourced guide         │
             ↓                         │
Viewing handoff + usability / QA ◄─────┘
```

Decouple the stable demo from optional infrastructure: static synthetic fixtures must support quiz, matching and listing screens if Supabase or the model endpoint is unavailable. Real email verification must not be simulated as success in demo mode.

## 4. Priority and cut order

**P0 — protect:** working demo entry; trust destination; readable quiz; gender option removed; deterministic matching; visible compatibility narrative or a clearly labelled fixture fallback; seeded profiles; listings with basic filters and provenance labels; no false verification/verification claims.

**P1 — deliver if P0 is stable:** real university-email auth, persistent quiz, guide citations and cache, MTR/amenity/size filters, Meet handoff and viewing alternatives.

**P2 — first to defer:** settling-in generator, Chinese translation, side-by-side listing comparison, optional map/transport integrations. Do not cut Q7 correction or the compatibility narrative to make room for polish.

No feature can be called complete if the fallback looks like a successful live operation while it is actually mocked.

## 5. Work ownership boundary

Retain the existing team split in `TEAM-BRIEF.md`; do not create a new organizational plan in this specification:

- Product/research/design owner: approve quiz wording, trust page copy, test questions, and scope changes.
- Frontend owner: landing, app flow, reusable quiz controls, match/listing surfaces and responsive states.
- Platform owner: Supabase Auth, RLS, verification-state boundary, environment configuration and shared types.
- GenAI/data owner: synthetic fixtures, deterministic scoring, compatibility narrative, guide corpus/cache and output audit.

Continue the “one person per file” rule and name the actual owner before the first implementation PR.

## 6. Test and release checklist

### Functional

- [ ] Demo visitor reaches a match without entering an email; demo and fixtures are visibly synthetic.
- [ ] Real user is held outside protected routes until university email verification succeeds.
- [ ] Every visible nav/CTA has an implemented destination; `/trust` works on direct refresh.
- [ ] Approved question count, labels and options match the frozen schema; no gender choice or gender logic remains.
- [ ] Quiz Back/Continue, validation, refresh and empty states match the selected demo/real persistence mode.
- [ ] Match score is deterministic; AI narrative is labelled and has an outage fallback.
- [ ] Filters use listing facts; missing data is “Not provided”; no match/listing is fabricated.
- [ ] Area guide citations are visible and grounded; unsupported claims are withheld.
- [ ] Meet link-out and alternative viewing actions are clearly marked.

### Safety, privacy, accessibility

- [ ] RLS prevents cross-user quiz reads; client cannot self-verify.
- [ ] No student ID/HKID/document/face data is requested or stored.
- [ ] No API secrets in browser bundle or committed files.
- [ ] Question font, contrast, visible keyboard focus, semantic labels, 360px mobile and 200% zoom pass.
- [ ] Demo content cannot be mistaken for a live verified community or verified listing.

### Engineering / demo

- [ ] `npm run typecheck`
- [ ] `npm run lint`
- [ ] `npm run build`
- [ ] Three complete rehearsals, including a deliberate interruption or network failure.
- [ ] Backup video recorded; demo machine and presenter named.

## 7. Change control

The approved `product-requirements.md` is the functional source of truth for the suite. Any change to scope, access gates, question data, terminology or privacy boundaries requires:

1. A specific proposed change and reason.
2. Approval from the product/scope owner.
3. A version/log update to affected specs and the project memory.
4. Re-run of affected acceptance checks.

Features not listed in the approved requirements are out of scope by default.
