# RentMate — Product Requirements

**Version:** 0.2 — revised draft for team review  
**Prepared:** 7 October 2026  
**Status:** Reflects the user’s latest decisions; still requires team sign-off before implementation.  
**Authority:** `docs/GENAI SDG interim draft.pdf` and `PRD.md` remain project authority until the team ratifies these deliberate scope changes. This draft intentionally proposes in-app chat and controlled gender eligibility filtering, which conflict with the current `PRD.md` scope; reconcile that source document before build.

## S0 — Vision (user words, verbatim)

> “ok we have a figma demo thats in its very early stages, i like the aesthetic. https://tag-haven-05580894.figma.site/#how. refer to @"C:/Users/Trinity/Programmes/Before_Anyone_Builds_Your_Site_261007_211523.pdf" and craft a full spec suite. some initial notes from us: delete the empty link or actually create the 'trust' page. consider doing email verification or leaving it out to let users demo it
> change the font of the questions so its computer-readable
> qn 7: remove the 'same gender as me' option
> more qns: preferred community type, distance to mtr, preferred amenities, size, location. we also need to design the actual features and implementation method”

## S1 — Product and problem

RentMate is a responsive web application to help non-local students settle into Hong Kong, combining compatible-roommate matching, affordable housing discovery, and clear neighbourhood/room information. The agreed focus order is **compatibility, affordability, transparency, safety (trust and privacy)**. University email is the real-user verification rail and access gate. See `../../PRD.md` for the full research case and evidence caveats.

### User roles

| Role | Need in this prototype |
|---|---|
| Non-local student | Set preferences, understand compatible roommate options, find a suitable affordable flat and learn about its location/condition. |
| Local student | Use the same housing and matching journey if seeking accommodation. |
| Demo visitor/judge | Explore the main journey with synthetic data without creating or falsely verifying a real account. |
| Landlord | Longer-term listing submitter; no landlord service portal is in this demo scope. |

## S2 — In scope

1. **Landing and navigation.** Preserve the current visual identity. “Start matching” leads to a usable entry choice; “How it works” reaches real content; “Trust & safety” opens a distinct implemented destination.
2. **Two honest entry paths.** (a) University path: validate the email syntax and institution domain against the configured allowlist for the eight Hong Kong universities below. Domain eligibility is not proof of mailbox ownership; do not display “verified” until an actual email confirmation succeeds. (b) Guest/demo path: no email submission, synthetic profiles, visible “Demo — synthetic data” label, and no real verification badge.
3. **Supported universities.** City University of Hong Kong, Hong Kong Baptist University, Lingnan University, The Chinese University of Hong Kong, The Education University of Hong Kong, The Hong Kong Polytechnic University, The Hong Kong University of Science and Technology, and The University of Hong Kong. Maintain institution-to-domain mappings in a reviewed server-side allowlist; do not guess domains or accept substring matches.
4. **Two-part profile and preferences flow.** Replace the vague fixed 12-question framing with “About me” (how I live) and “What I’m looking for” (roommate and housing requirements). Use the proposed core fields below; optional profile decorations do not block completion. Avoid claiming a final question count in landing copy until the team freezes the form.
5. **Gender handling.** Collect optional self-described gender identity separately from roommate-gender preference. The preference is a strict eligibility filter only when the user explicitly selects categories; “any gender” or no selection means no gender filter. Do not offer “same gender as me” in a combined list. Gender is never a compatibility-score input. Explain that a strict filter can reduce or eliminate results.
6. **Actual matching.** Use synthetic profiles and implement deterministic pair scoring. Only soft lifestyle/personality/scalar metrics contribute to the compatibility score. Hard housing constraints and explicit strict roommate filters determine eligibility before scoring. The score is arithmetic; an optional narrative explains score-driving factors and friction without promising safety or success.
7. **Persistent in-app chat.** A user can save a match to chat; the account retains the contact, conversation and messages until the user closes that conversation. Closing deletes the conversation and its messages, not merely hides or archives them. Build on the existing Supabase stack; do not require a third-party messaging vendor. Guest/demo chat is synthetic and persists locally on that browser/device until closed or demo storage is cleared; it must never be represented as account-backed cross-device history.
8. **Listings and area information.** Browse synthetic/manual demo listings and filter by district, budget, room type, MTR distance and amenities. Show room condition/size as listing-supplied (never verified), price context where sourced, and neighbourhood guide citations. Label synthetic content.
9. **Trust & safety information.** Explain domain eligibility versus mailbox verification, what listings are not verified, synthetic data, gender preference privacy and strict filtering, data retention, score-versus-narrative distinction, in-app chat deletion on close, and concern-reporting boundaries. No legal advice or area safety ratings.
10. **Viewing and settling-in.** Photo gallery and pre-recorded walkthrough request remain available; an external video/meeting link may be an optional viewing handoff, not a chat dependency. Settling-in and generated English/Chinese text are lower priority.

### Proposed questionnaire contract (draft)

This is a structured starting contract, not a claim that the final wording/count is approved. “About me” describes the person; “What I’m looking for” describes desired fit and hard requirements. Questions use readable sans-serif type and “prefer not to say/no preference” where applicable.

| Section / field | Prompt and response shape | Use |
|---|---|---|
| About me — sleep | What is your usual sleep schedule? Slider early-to-late, with “varies” | Soft scalar compatibility input |
| About me — shared-space habits | How do you prefer to keep shared spaces? Slider or ordered choices from tidy-as-you-go to flexible | Soft scalar compatibility input |
| About me — social/guests | How often do you enjoy having guests or socialising at home? 1–5 | Soft scalar compatibility input |
| About me — noise | What level of noise feels comfortable at home? 1–5 | Soft scalar compatibility input |
| About me — personal space | How much personal space or quiet time do you usually want? 1–5 | Soft scalar compatibility input |
| About me — communication | How do you prefer to handle disagreements? Structured choices, optionally mapped to a documented soft comparison | Soft personality input only if scoring semantics are approved |
| About me — bills | How do you prefer to manage shared bills? Track each share closely / agreed split / flexible shared pot | Soft scalar compatibility input; never infer financial reliability |
| About me — smoking | Do you smoke? Yes / no / prefer not to say | Profile context; not scored; only used against an explicitly selected smoking deal-breaker |
| About me — gender identity (optional) | Woman / man / non-binary / self-describe / prefer not to say | Private profile attribute; not scored; exposed only as needed for a selected strict filter and with clear notice |
| About me — MBTI (optional) | Optional 4-letter type or “skip” | Decorative profile badge only by default; not a score/filter input |
| What I’m looking for — roommate gender | Which gender identities are you open to living with? Select one or more explicit categories, or “any gender” | Strict pre-score eligibility filter; no “same as me” choice; unknown/undisclosed identities do not pass a selected category filter |
| What I’m looking for — smoking | Is a non-smoking household a requirement, a preference, or no preference? | Hard filter only when explicitly marked required; otherwise omit from eligibility |
| What I’m looking for — household rhythm | What kind of shared-home rhythm would suit you? Quiet/private / friendly shared spaces / student-oriented / flexible | Soft preference, not demographic filtering |
| What I’m looking for — location | Which Hong Kong districts work for you? Multi-select plus flexible | Listing/roommate eligibility constraint; not score input |
| What I’m looking for — MTR | Maximum acceptable walk to MTR: 5 / 10 / 15 minutes / no preference | Listing filter; label estimate or listing-supplied distance |
| What I’m looking for — amenities | Which amenities are must-haves? Multi-select plus none | Listing eligibility filter only for explicitly selected must-haves |
| What I’m looking for — room size | Minimum private-room size or no minimum | Listing filter; advertised/unknown, never verified |
| What I’m looking for — budget | Maximum monthly rent in HKD | Hard affordability filter; display selected value |

**Compatibility boundary and first scoring contract.** The 0–100 score uses only soft lifestyle/personality/scalar factors: sleep timing, shared-space habits, social/guest preference, noise, personal-space preference and bill-splitting style. Normalize each to 0–1, where closer values mean more similar. Initial unvalidated weights: sleep 20%, shared-space habits 15%, social/guest 15%, noise 15%, personal space 20%, bill splitting 15%. For the dimensions answered by both profiles, calculate `round(100 × Σ(weightᵢ × (1 − |aᵢ − bᵢ|)) ÷ Σ(shared weights))`; missing factors are omitted and remaining weights renormalized. If there is no shared scored factor, return `insufficient_data`, not a fabricated score. Optional categorical communication style may appear in the narrative but is excluded from arithmetic until its scalar mapping is approved. Gender, MBTI, smoking status, district, budget, room size, amenities and other hard eligibility criteria never contribute to the score. Apply each person’s explicitly selected strict requirements against the other person before scoring; never silently relax them. Publish weights in code/tests; they are starting assumptions, not validated evidence.

**MBTI scope.** A small optional text/letter badge on the profile card is the complete first version. If type validation or badge rendering risks the core path, defer it; do not add an MBTI questionnaire or scoring model.

### Q7 treatment

Remove “same gender as me” from the old combined Q7. Replace the conflated question with two independent concepts: (1) optional self-described gender identity in “About me”; and (2) explicit, multi-select roommate-gender eligibility preference in “What I’m looking for.” The latter is a strict pre-score filter, not a compatibility factor. The exact published Figma quiz wording remains unverified; do not claim the current Q7 has been fully inspected.

## S3 — Out of scope

- HKID checks, face scanning, storing student-card images or card OCR.
- Rental-listing verification or any badge that claims a flat, owner, floor plan, room size or rent has been independently verified.
- Legal advice, contract interpretation, lease negotiation, dispute settlement, payment processing, or platform-operated room tours.
- Public ratings or reputation scores for people; public complaint counts; automated decisions based on private reports.
- Nationality, ethnicity, religion or other protected/sensitive traits as roommate filters. Gender identity and an explicit roommate-gender preference are in scope only as separately collected, user-controlled data and a strict eligibility filter; they never affect the compatibility score.
- Native mobile apps, third-party messaging/video integrations as a chat dependency, a social network/events system, or a full landlord portal. In-app text chat is in scope; custom video is not.
- Real student data or real listings represented as verified during the public demo.
- Generated photographs/visuals of real flats; property images remain authentic and unedited.
- A profile deletion/account deletion feature; this prototype does not expect real users. Explicitly closing a conversation still deletes that conversation and its messages as specified.

## S4 — Frozen glossary (v0.1)

The terms below are revised for this v0.2 draft and remain subject to team sign-off.

| Term | Meaning in this draft |
|---|---|
| University path | Email syntax + supported institutional-domain eligibility check; mailbox ownership must be confirmed before a “verified” state is shown. |
| Supported institution | One of the eight named Hong Kong universities, resolved through a reviewed server-side domain allowlist. |
| Demo path | Clearly labelled synthetic profiles/listings; no email collection or real verification attestation. Demo chat is local to the browser/device. |
| Gender identity | Optional self-description stored separately from roommate-gender preference; never a score factor. |
| Strict roommate-gender filter | Explicit selected identity categories determine eligibility before scoring; “any gender”/no selection disables the filter. |
| Compatibility score | Deterministic, weighted similarity across soft lifestyle/personality/scalar metrics only. |
| Compatibility narrative | Optional generated explanation grounded in eligible pair’s submitted soft metrics; it cannot claim safety or guaranteed compatibility. |
| MBTI decoration | Optional profile badge, not a matching score or filter input by default. |
| Saved conversation | Account-backed contact, conversation and messages retained until the user closes that conversation; close deletes the record and messages. |
| Listing-supplied | A claim shown as provided by a poster or fixture; not verified by RentMate. |
| Seeded profile | Synthetic demo profile, visibly labelled as synthetic. |

## S5 — Success criteria (observable)

1. **Explore demo** opens without email collection; profiles/listings are labelled synthetic; demo messages persist locally across refresh and are removed when their conversation is closed or demo storage is cleared.
2. The university email form rejects malformed addresses and unsupported domains before submission. Domain matching uses an exact domain or a dot-boundary subdomain rule against a reviewed server-side allowlist; substring tricks and free-mail domains fail. Domain eligibility alone never displays “verified”; ownership confirmation is required for that badge/access state.
3. The eight supported university labels map to the configured allowlist. An unsupported/unknown domain gets a clear error and cannot proceed as verified.
4. The Trust & safety navigation opens a real `/trust` destination explaining synthetic data, domain vs mailbox verification, chat retention/deletion, gender-data controls, matching boundaries, and listing limitations.
5. The quiz visibly separates “About me” from “What I’m looking for.” Gender identity and roommate-gender preference are separate fields; the latter is a strict filter and there is no “same gender as me” option.
6. Compatibility is deterministic, 0–100, and based only on documented soft lifestyle/personality/scalar factors. Changing only gender, MBTI, housing constraints or listing data does not change an eligible pair’s score. Strict filters run before scoring. MBTI is a non-scoring optional decoration.
7. An account can start a conversation from a match; after refresh/re-login, its contact and messages remain. Closing the conversation removes its conversation, membership and message records; it is not an archive/hide action. Users cannot read another user’s conversation.
8. Listing filters return only eligible results or clearly state no results; room size, MTR distance and listing condition carry provenance/uncertainty labels.
9. Neighbourhood-guide factual claims show citations; uncited facts are omitted or marked unavailable. No legal advice or generated area-safety rating is displayed.
10. The app is responsive and keyboard-operable, with visible focus, labelled controls and text errors not conveyed by color alone.

## S6 — Bounded edge cases

| Trigger | Required behavior |
|---|---|
| Demo user enters /verify or protected route | Keep demo banner; never suggest their identity was verified; do not collect email on demo route. |
| Email is malformed or its domain is unsupported | Reject before submission with a specific, non-enumerating explanation; do not unlock the app. |
| Domain is supported but mailbox ownership is not confirmed | Show eligible/pending only; never show “verified” or unlock protected routes. |
| Quiz skips optional gender/MBTI/preferences | Keep them unset; no inferred gender or MBTI; no gender filter when preference is blank/any. |
| Selected strict gender filter excludes all profiles | Explain that the strict filter caused zero eligible profiles; offer the user a way to change the filter, without silently relaxing it. |
| District/amenity/size/MTR filters return zero listings | Show a plain-language empty state and “clear filters”; never invent a result. |
| Listing lacks a room size, amenity or station distance | Show “not provided”; do not infer or call it verified. |
| Chat send fails or network is unavailable | Preserve unsent text locally as a clearly marked draft; do not claim delivery. Retry without duplicating messages. |
| User closes a conversation | Confirm the destructive action; on confirmation delete the conversation, memberships and messages. Do not leave an archive or recoverable hidden thread. |
| GenAI narrative or cited guide is unavailable | Provide weighted score / static sourced fallback and label the fallback; never fabricate a successful model result. |
| User taps Trust & safety from any page | Always reach `/trust`, including refresh/deep-link. |

## S7 — Simplicity budget

- Reuse the current React/Vite app, Supabase stack and visual direction; do not rebuild the design system or add a third-party chat vendor.
- One quiz renderer and structured question data; render the two blocks from schema rather than bespoke question components.
- Static JSON fixtures for synthetic profiles/listings. No scraping pipeline or property-owner onboarding in the prototype.
- One pure deterministic similarity function over soft scalar inputs; strict eligibility filtering happens before scoring. No multi-agent AI or custom training.
- In-app text chat only: reuse Supabase Auth/Postgres/RLS (and existing Realtime if already enabled); no video calling, message attachments, read receipts, typing indicators, push notifications, search or moderation console.
- Guest demo chat remains local and synthetic; signed-in account conversations persist until explicit close-and-delete.
- MBTI is optional badge-only metadata; defer if it competes with quiz, matching or chat reliability.
- One trust page; no new community feed, reporting case-management suite or moderation automation.
- The guest demo route is separate from institution eligibility and never creates a verified student identity.

## S8 — Open questions (must be resolved before implementation)

The user has resolved the product-direction questions below. The remaining items are implementation details or team ratification gates; they do not silently reverse the stated behavior.

| ID | Question / proposed default | Owner | Blocks |
|---|---|---|---|
| O1 | Confirm the server-side domain registry and exact supported domains for the eight named institutions from official university sources. Never infer the domain list. | Platform owner | Domain validator |
| O2 | Choose whether production university access requires Supabase magic-link or OTP confirmation after domain eligibility passes. Proposed: use provider email confirmation; domain validation alone is not verification. | Platform owner | Verified state/access gate |
| O3 | Approve final exact wording, scalar anchors and pairwise weights for the two-part questionnaire; retain “About me” vs “What I’m looking for.” | Product/design + GenAI owner | Quiz and deterministic score |
| O4 | Ratify privacy/visibility defaults for gender identity and strict roommate-gender filtering, including handling of self-described/undisclosed values. Proposed: optional, minimally exposed, never silently relax a strict filter. | Product/privacy owner | Profile schema and eligibility query |
| O5 | Confirm guest demo chat persistence mechanism (browser local storage vs IndexedDB) and reset/clear wording. Proposed: browser-local, same device only, deleted on close. | Frontend owner | Demo chat behavior |
| O6 | Define message length/rate limits and a bounded abuse-report pathway for in-app chat. Proposed: text-only, no attachments, no public reputation score. | Product/platform | Chat hardening |
| O7 | Reconcile this proposal with `PRD.md` and obtain team approval for two explicit scope changes: in-app text chat (currently “connect, do not build”) and gender as an optional, strict eligibility filter (currently out of scope). | Product/scope owner | Build authorization |
| O8 | Are move-in date and lease duration optional browse filters? Proposed: yes, outside compatibility scoring and required quiz. | Product team | Listing filters |

## S9 — Intent-change log

| Version/date | Change | Approval |
|---|---|---|
| v0.1 — 7 Oct 2026 | Initial draft from the user request, published Figma demo, agreed interim report and existing PRD/build plans. | Draft; pending team review |
| v0.2 — 7 Oct 2026 | Applied user decisions: in-app account-backed chat with delete-on-close; guest synthetic chat; domain allowlisting for eight universities; separate optional gender identity and strict roommate-gender eligibility; compatibility score limited to soft/personality/scalar metrics; optional MBTI badge; split “About me” / “What I’m looking for” questionnaire; no expected real users/account deletion flow. | User direction recorded; team ratification pending because chat and gender filtering conflict with current PRD scope |

Changes to S0, S2, S3 or S4 require a version bump and explicit team approval before downstream implementation. No application code is authorized by this draft.

## S10 — Parking lot

- Real listing partnerships, live university portal integration and post-hackathon rollout.
- Trusted community moderation at scale and complaint analytics.
- Any district-map or external commute-time API not needed for the seeded demo.
- A larger multilingual validation plan (the interim report anticipates Mandarin, Korean, Japanese and French validation; this prototype ships English + Chinese only as existing PRD states).
