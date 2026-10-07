# RentMate — App Flow

**Version:** 0.2 — revised draft for team review · **Prepared:** 7 October 2026 · **Status:** User decisions recorded; team ratification pending

## 1. Route map

```text
/                    Landing
/#how               How it works section
/trust               Trust & safety information
/start               Choose university path or guest demo
/verify              Email syntax/domain eligibility + mailbox-confirmation status
/quiz                “About me” + “What I’m looking for” questionnaire
/matches             Seeded-roommate matches + explanations
/chat/:conversationId In-app text conversation
/listings            Search/filter listings
/listings/:id         Listing detail + viewing choices + area guide
/guide/:district      Sourced neighbourhood guide/chat
/settling-in          Personalised plan (lower priority)
```

Global shell on app routes: RentMate mark, back/home navigation, language toggle when implemented, mode/status badge (“Demo — synthetic data” or “University email confirmed”). “Domain eligible” is not “verified.” Never display verified status for a guest or synthetic profile.

## 2. Primary journey — guest/demo visitor

| Step | Screen/action | Result and next state |
|---|---|---|
| 1 | Landing: choose **Start matching** | Navigate to `/start`; never dead-end. |
| 2 | Choose **Explore demo** | Start a clearly labelled synthetic session; no email requested and no verified account created. |
| 3 | Complete “About me” | Capture soft self-described living-style/scalar answers; gender identity and MBTI are optional. Keep unanswered optional fields unset. |
| 4 | Complete “What I’m looking for” | Enter explicit roommate gender categories, optional smoking deal-breaker, and housing constraints. Explain strict filters; do not silently relax them. |
| 5 | Submit profile | Apply strict eligibility filters, then calculate compatibility score only for eligible synthetic profiles. Go to `/matches`; retain local draft if calculation fails. |
| 6 | Review match | Show weighted score, matched/friction factors, synthetic-data label, optional MBTI decoration and **Save to chat**. MBTI is not part of score. |
| 7 | Open demo chat | Create a local synthetic conversation; messages persist across refresh on that browser/device. Clearly label no real recipient is present. A failed send remains an unsent draft. |
| 8 | Close demo chat | Ask for confirmation; on confirm remove that conversation and messages from demo storage, then return to match. No archive/undo. |
| 9 | Browse homes | Apply housing filters. Empty state identifies limiting constraints and offers user-controlled filter changes. |
| 10 | Inspect listing/viewing options | Show data provenance, area citations and photo/walkthrough options. Optional external meeting link is for viewing only, not chat. |
| 11 | Open Trust & safety | Available from all screens; explains synthetic data, chat limitations and deletion, email/domain checks, gender filter and score boundaries. |

## 3. Primary journey — university path (prototype/test flow)

1. Landing → **Start matching** → `/start` → **Continue with university email**. State that this is a prototype eligibility route, not a promise of production onboarding.
2. Show purpose/privacy copy before collection. Validate email format, normalize domain and check server-side institution allowlist. On malformed or unsupported input, show an inline error and do not send a confirmation request.
3. A supported domain displays **Domain eligible — not verified** and proceeds to Supabase Auth email confirmation (only if configured). Do not unlock the protected account flow or show “verified” until mailbox ownership is confirmed.
4. `/verify` shows pending/expired/success states with resend/change/back. Unsupported institutions receive an honest no-access state, not a generic bypass. Eight institution mappings are configured from official sources; domain strings are not guessed in this spec.
5. On successful ownership confirmation, persist profile and quiz answers to the user’s account, subject to RLS. Proceed through the same matching flow; apply explicit strict eligibility filters before score calculation.
6. **Save to chat** creates an account-backed conversation with the contact and messages retained across sessions. Closing requires confirmation and permanently deletes the conversation and its messages/membership rows.
7. Sign out returns to landing and clears local sensitive state. No account-deletion flow is required for this prototype because real users are not expected; do not imply the project has a production retention/deletion program.

## 4. Every visible action has a destination

| Control | Destination / behavior |
|---|---|
| RentMate logo/home | `/` |
| How it works | `/#how`, scroll to present content |
| Trust & safety | `/trust` and supports direct refresh |
| Start matching / Find my matches | `/start` |
| Explore demo | Start synthetic guest session → `/quiz`; no email |
| Continue with university email | `/verify`; format + domain validation before auth request |
| Back | Previous logical step; preserve in-progress answers |
| Continue quiz | Validate current step; persist account answers or browser-local demo answers |
| See matches | `/matches`; strict filters first, soft score second |
| Save to chat | Create account-backed or local-demo conversation → `/chat/:conversationId` |
| Send message | Persist only on confirmed success; failure shows unsent draft and retry |
| Close conversation | Confirmation → delete conversation/messages/memberships → return to match |
| Browse listings | `/listings` with housing preferences prefilled |
| Listing card | `/listings/:id` |
| Read neighbourhood information | `/guide/:district` or in-page cited panel |
| Viewing meeting link | Optional external viewing handoff only; not used for text chat |
| Photo gallery | Accessible gallery/modal with authentic listing images |
| Request walkthrough | Clearly labelled prototype confirmation; do not transmit unless a backend is approved |
| Report a concern | Private-report explanation and team contact/process; no public post or profile score |

## 5. Page requirements

The following behaviors apply across the named routes. This draft preserves the existing page outline while adding the confirmed chat, email eligibility and two-part profile requirements.

### Landing

- Show current promise and visual identity; avoid unsubstantiated “verified student community” claims before verification works.
- Replace fixed “7 thoughtful questions” unless actual approved count is seven. Preferred copy: “A short, thoughtful quiz” or approved accurate count.
- CTA and nav are operable by keyboard and touch.

### Trust & safety

Include: (1) domain eligibility vs mailbox ownership confirmation; (2) eight supported university institutions, with no claim that domain alone verifies a student; (3) synthetic guest data; (4) listing details are not verified by RentMate; (5) strict gender filter and optional profile identity are separate and private; (6) score uses soft scalar compatibility factors only, MBTI is decoration; (7) account chat persists until closed, and close deletes messages; demo chat is browser-local; (8) no account deletion flow because real users are not expected; (9) report boundary and no legal advice. Do not promise fraud prevention or a “safe match.”

### Quiz

- Two visibly distinct blocks: **About me** (living habits/personality) and **What I’m looking for** (roommate and housing requirements). Do not promise a fixed count until the schema is approved.
- Keep self-reported gender identity separate from the explicit roommate-gender filter; no “same gender as me” choice. Gender selection is optional and never enters the score.
- Required fields should focus on soft/scalar living habits and necessary housing inputs. Make optional identity/MBTI fields skippable; provide “no preference” for optional filters.
- State which roommate preferences are strict filters and that a selected filter can exclude otherwise compatible profiles. Never silently broaden it.
- Use one clear question per screen/card, computer-readable sans-serif copy, readable choices, and progress in numbers rather than color alone. Provide Back and review/edit before submission.

### Matches

- Apply strict eligibility filters before calculating score; show when a strict filter caused zero candidates and let the user change it explicitly.
- Profile cards identify synthetic data; do not show gender identity unless disclosed/needed for a selected filter. MBTI may appear as a small optional decoration only.
- Show “Why this may fit” and “Talk about this before moving in” from soft compatibility metrics; no public ratings, safety ranking or identity inference.
- **Chat interaction:** “Save to chat” opens a first-party text thread. Account-backed threads persist until explicit close; guest threads are local and synthetic. Include message status, retry for failed sends, and a confirm-before-delete close action. Closing removes the entire thread and messages.

### Listings and guide

- Filters use documented data only. Label listing-provided vs official-source facts.
- Neighbourhood guide gives citations and an “information, not legal advice” disclaimer if tenancy norms are shown. Do not make neighborhood safety characterisations.

## 6. Failure and empty states

- **Malformed email/unsupported domain:** inline reason; do not send auth request or grant access. A supported domain still shows pending until mailbox confirmation succeeds.
- **Email pending/expired:** resend/change address/back; remain gated and do not call the account verified.
- **No eligible matches:** identify the strict filter responsible; offer a deliberate edit, never silently relax it.
- **No listings:** identify housing constraints and offer user-controlled filter edits; never fabricate supply.
- **AI unavailable:** preserve quiz and show deterministic score with labelled static explanation; guide states evidence is unavailable if retrieval returns none.
- **Chat send failure/offline:** show pending/failed status and retain an unsent local draft; retry without creating duplicate messages.
- **Conversation close failure:** do not report it deleted until the server/local transaction succeeds; retain the thread and allow retry.
- **Demo refresh/storage clear:** fixtures reload; browser-local answers/chat may be cleared; explain this is not account-backed sync.
- **Unknown listing data:** show “Not provided”, never blank spaces or invented values.
- **Broken link/deep link:** route to not-found with home/trust actions. Every header link is tested against a real route or anchor.

## 7. Flow acceptance checks

1. The Trust & safety link works from landing and app pages; direct `/trust` refresh works.
2. Demo reaches synthetic matches without email; no verified label appears. Demo chat survives refresh locally and is deleted on close.
3. Malformed/unsupported emails fail domain validation; supported domains remain unverified until mailbox confirmation succeeds.
4. Quiz distinctly captures “About me” and “What I’m looking for”; gender identity and preference are separate; MBTI is optional decoration only.
5. Gender preference filters candidates strictly before scoring, with no auto-relaxation; changing excluded gender data alone never changes score.
6. Account chat persists after refresh/re-login; closing it deletes messages and conversation rows, and no other user can read them.
7. Back/forward through quiz preserves answers; invalid required answers show text errors.
8. Every listing/viewing action communicates whether it is live, external or simulated; optional meeting links do not carry chat.
