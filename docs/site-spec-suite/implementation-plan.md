# RentMate — Implementation Plan

**Version:** 0.2 — revised draft for team review · **Prepared:** 7 October 2026 · **Status:** User decisions recorded; team ratification pending
**Schedule constraint from project brief:** code freeze 14 October 2026; submission approximately 18 October 2026. This plan does not authorize code changes before the team signs off the suite.

## 1. Delivery rule

Build the smallest end-to-end journey that works on the demo machine. Resolve the remaining schema/implementation details and ratify the scope changes before code. The prototype path uses synthetic data and a guest route; the university path may validate an allowlisted email domain, but domain match alone is not mailbox verification. The user-directed in-app chat and gender eligibility filter conflict with the current `PRD.md` (“connect, do not build” chat and gender filters out of scope); update/approve the source of truth before implementing those scope changes.

## 2. Stage plan and sign-offs

| Stage | Target | Deliverable | Sign-off / exit test |
|---|---|---|---|
| 0. Approve suite and scope delta | 7–8 Oct | Record user decisions; verify eight official university domains; freeze two-part form, scalar score contract and chat delete semantics; reconcile PRD conflicts. | Six-document checklist signed and source-of-truth updated before chat/gender implementation. |
| 1. Repair the front door | 8–9 Oct | Landing CTA; `/start`; working `/trust`; university-domain validator; guest route; responsive shell/copy. | Demo reaches quiz without email; malformed/unsupported domains fail; eligible domain is not labelled verified; Trust route works. |
| 2. Quiz and data contract | 9–10 Oct | Typed “About me” / “What I’m looking for” schema, readable controls, optional gender identity/MBTI, strict preference filters, local demo state. | Gender identity and preference are separate; strict filters never auto-relax; MBTI optional/non-scoring; typecheck passes. |
| 3. Compatibility centrepiece | 10–11 Oct | Pure weighted score over soft scalar lifestyle/personality factors; seeded profiles; bounded narrative; eligibility-first flow. | Exact fixtures produce predictable scores; changing gender/MBTI/housing alone leaves score unchanged; model fallback works. |
| 4. Housing transparency | 11–12 Oct | Listing fixtures, filters, details, provenance, cited guide/cache. | No invented facts; empty filters recover; citations or explicit unavailable response. |
| 5. In-app chat and viewing | 12–13 Oct | Account-backed text chat on Supabase; guest-local synthetic chat; delete-on-close; gallery/walkthrough and optional viewing-only meeting link. | Message persists to account/local guest store as specified; send errors are honest; close deletes the full thread; no external messaging vendor. |
| 6. Usability / hardening | 13 Oct | Test internal/demo users where available; rehearse on demo machine; record backup. | Main journey completes; test domain spoofing, RLS isolation, thread deletion and failure paths. No real students required. |
| 7. Code freeze | 14 Oct | Freeze scope; integration, copy fixes and safe bug fixes only. | `npm run typecheck`, `npm run lint`, `npm run build`; demo path rehearsed end-to-end. |
| 8. Submission prep | 15–18 Oct | Rehearsals, backup demo and presentation/submission. | Demo and backup available; no mock presented as live functionality. |

Dates after code freeze are governed by the existing project brief; if the current team calendar differs, update this plan before execution.

## 3. Dependency sequence

```text
Ratify PRD scope delta + verify official domain allowlist
                         ↓
Freeze quiz/profile/chat types, score contract and routes
                         ↓
Landing /start /trust + domain validator ─────────────┐
                         ↓                             │
Two-part quiz + synthetic fixtures                    │
                         ↓                             │
Hard eligibility filters → soft scalar score/narrative│
                         ↓                             │
Listings + cited guide + account/local chat           │
                         ↓                             │
Delete-on-close + accessibility / QA ◄────────────────┘
```

Decouple the stable guest demo from optional infrastructure: synthetic fixtures and browser-local chat must support the demo if Supabase/Auth/Realtime or the model endpoint is unavailable. The guest path never simulates a successful email verification. Account-backed chat must not claim persistence until Supabase writes succeed.

## 4. Priority and cut order

**P0 — protect:** guest demo entry; trust destination; domain syntax/allowlist validator; readable two-part quiz; eligibility-first filters; deterministic soft-metric matching; synthetic profiles; housing filters/provenance; chat send/retention/close-delete flow in the demo; no false verification claims.

**P1 — deliver if P0 is stable and the scope delta is approved:** Supabase Auth mailbox confirmation; account-backed chat with RLS and delete-on-close; optional gender identity/filter; persistent profile/quiz; guide citations/cache; viewing alternatives.

**P2 — first to defer:** MBTI decoration, settling-in generator, Chinese translation, side-by-side listing comparison, optional map/transport integrations. MBTI must not displace chat, quiz clarity or score correctness.

No feature can be called complete if a local simulation appears to be a live account operation. In-app chat/gender changes remain blocked until the team updates/approves the project PRD.

## 5. Work ownership boundary

Retain the existing team split in `TEAM-BRIEF.md`; do not create a new organizational plan in this specification:

- Product/research/design owner: approve quiz wording, trust page copy, test questions, and scope changes.
- Frontend owner: landing, app flow, reusable quiz controls, match/listing surfaces and responsive states.
- Platform owner: Supabase Auth, RLS, verification-state boundary, environment configuration and shared types.
- GenAI/data owner: synthetic fixtures, deterministic scoring, compatibility narrative, guide corpus/cache and output audit.

Continue the “one person per file” rule and name the actual owner before the first implementation PR.

## 6. Test and release checklist

Run these checks before treating the prototype path as complete. Account-backed features require a connected Supabase environment; browser-local demo tests must be clearly labelled and kept separate.

### Functional

- [ ] Guest reaches a synthetic match without email; demo badge appears on relevant screens.
- [ ] Email syntax/domain validator passes supported-domain cases and rejects malformed, unsupported, free-mail, suffix-spoof and substring-spoof cases.
- [ ] Domain eligibility alone cannot grant verified status; mailbox confirmation is required before protected account access.
- [ ] Every visible nav/CTA has an implemented destination; `/trust` works on direct refresh.
- [ ] Quiz separates “About me” from “What I’m looking for”; identity and strict gender preference are separate; MBTI is optional.
- [ ] Strict gender preference removes ineligible candidates before scoring; if no candidates remain, the filter is not silently relaxed.
- [ ] Compatibility score uses only soft/personality/scalar factors; excluded-field invariance tests cover gender, MBTI and housing data.
- [ ] Quiz back/continue, validation, refresh and empty states match demo vs account persistence.
- [ ] Guest chat survives refresh locally, sends only to synthetic demo context and is deleted on close.
- [ ] Account chat persists after refresh/re-login; cross-user reads fail; close deletes the thread and messages.
- [ ] Filters use documented listing facts; missing data is “Not provided”; no supply is fabricated.
- [ ] Area-guide citations are visible and grounded; unsupported claims are withheld.
- [ ] Viewing handoff/gallery/walkthrough are accurately labelled; no third-party messaging service is required.

### Safety, privacy, accessibility

- [ ] RLS prevents cross-user profile, quiz and chat reads; client cannot self-verify or alter chat participants.
- [ ] Gender identity is optional and access-restricted; no gender or MBTI enters score/narrative; strict filter behavior is disclosed.
- [ ] Closing a conversation deletes active conversation/message rows; chat bodies are not logged or included in model prompts.
- [ ] No student ID/HKID/document/face data is requested or stored.
- [ ] No API secrets in browser bundle or committed files.
- [ ] Question font, contrast, visible keyboard focus, semantic labels, 360px mobile and 200% zoom pass.
- [ ] Demo content cannot be mistaken for a live verified community, real recipient or verified listing.

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
