# RentMate — Technical Requirements

**Version:** 0.2 — revised draft for team review · **Prepared:** 7 October 2026 · **Status:** User decisions recorded; team ratification pending  
**Project authority:** `../../PRD.md`, `../build-plans.md`, `../../TEAM-BRIEF.md`; agreed product statement: `../GENAI SDG interim draft.pdf`. This proposal changes current project scope on chat and gender filtering; reconcile and approve before implementation.

## 1. Platform and stack

| Layer | Requirement |
|---|---|
| Client | Existing Vite + React 19 + TypeScript responsive web app; explicit client-side routes. |
| Styling | Keep current prototype direction; existing styles or a lightweight token layer. No new UI library unless approved. |
| Auth / data | Supabase Auth and Postgres. The university path checks syntax and an exact/boundary-matched institutional domain against a server-side allowlist for eight Hong Kong universities. Mailbox confirmation is required before a verified state. RLS is mandatory for account records. |
| Chat | First-party text chat built on existing Supabase Postgres/RLS and Supabase Realtime only if already available. No external chat vendor, attachments or custom video. Closing a thread deletes its records. |
| GenAI | GPT-4o-mini only where needed for a bounded compatibility narrative, cited neighbourhood answer or lower-priority settling-in text. Calls stay in Edge Functions; no provider key reaches browser code. |
| Matching | Pure deterministic TypeScript similarity score over soft lifestyle/personality/scalar inputs only. Gender, MBTI and housing constraints are excluded. Apply explicit hard eligibility filters first. |
| Retrieval | Neighbourhood answers grounded in curated sources with visible citations; cache repeat queries. pgvector if provisioned; otherwise local/JSON fixture retrieval behind the same contract. |
| Demo content | Seeded JSON fixtures for synthetic profiles/listings; no real student records. Guest messages remain synthetic and browser-local; signed-in messages are account-backed. |
| Hosting | Local dev/static build and existing Supabase project are sufficient for the hackathon; localhost is accepted. |
| Viewing | Photo gallery and pre-recorded walkthrough request; optional external meeting handoff for viewing only. It is not a messaging dependency. |

## 2. Routes and runtime modes

Required routes: `/`, `/#how`, `/trust`, `/start`, `/verify`, `/quiz`, `/matches`, `/chat/:conversationId`, `/listings`, `/listings/:id`, `/guide/:district`, `/settling-in` (lower priority).

- **Guest/demo mode:** synthetic fixtures; no email request; no verified account. Keep a persistent “Demo — synthetic data” marker. Quiz answers and demo chat are browser-local; demo messages persist across refresh on that device and are removed when closed or demo storage is cleared. Never imply cross-device/account persistence.
- **University path:** normalize email, validate basic syntax, extract domain, then check against the reviewed server-side institution/domain allowlist. Reject unsupported domains before auth submission. A valid domain establishes institution eligibility only; Supabase Auth confirmation (magic link or OTP) establishes mailbox control. Protected routes remain closed until both checks pass. No client button can set verified state.
- **Eight institutions:** CityU, HKBU, Lingnan University, CUHK, EdUHK, PolyU, HKUST and HKU. Store verified domain mappings in configuration, not hard-coded substring tests in the browser.
- No general real-user rollout is expected for this prototype; any university path is an explicitly labelled test/prototype flow and must not claim production onboarding. No account-deletion journey is required. Conversation close is a separate, explicit deletion action.

## 3. Service boundaries and request contracts

1. `filterEligibleMatches(candidate, requirements)` applies hard constraints before scoring: explicitly selected roommate-gender categories, any explicitly required smoking rule, and agreed housing eligibility constraints. A selected strict filter is never silently relaxed; missing/undisclosed candidate gender does not pass a category filter.
2. `calculateMatch(profileA, profileB)` is a pure deterministic function returning `{ score, matchedFactors, frictionFactors }`. It consumes only soft lifestyle/personality/scalar fields, each normalized to 0–1 with documented weights; gender, MBTI, smoking status, location, budget, amenities and size never contribute. Test identical inputs, opposing high-weight values, excluded-field invariance and missing values.
3. `generateCompatibilityNarrative(pair)` is called server-side with minimum soft metrics only. Output is bounded, neutral and traceable to those fields; it may not claim safety or guaranteed compatibility. The narrative cannot override the score or eligibility.
4. `validateInstitutionEmail(email)` checks syntax, normalizes the domain, and returns supported institution/domain eligibility from a reviewed server-side allowlist. Never use substring matching. Supabase Auth then confirms mailbox ownership; domain match alone never sets `verified=true`.
5. `createConversation(matchId)` and `sendMessage(conversationId, body)` require an authenticated account and eligible match; `closeConversation(conversationId)` transactionally deletes the conversation, memberships and messages. Guest demo equivalents use browser-local synthetic storage, not server tables. Bound body length and request rate; no attachments.
6. `getNeighbourhoodGuide(query, district, locale)` retrieves sourced chunks, generates a concise answer and citation array, caches repeat responses, and returns `notEnoughEvidence` if citations are insufficient.
7. Listings are read from synthetic/static fixtures for the demo. Each listing attribute declares provenance (`fixture`, `poster_supplied`, or `official_source`) and availability; the UI does not infer missing fields.

Example response contracts (names illustrative; freeze in shared types before coding):

```ts
type MatchNarrative = {
  summary: string
  fitReasons: string[]
  frictionPoints: string[]
  source: 'quiz_answers'
  generatedAt: string
}

type GuideAnswer = {
  answer: string
  citations: Array<{ title: string; url: string; publisher?: string; accessedAt?: string }>
  cached: boolean
  status: 'grounded' | 'not_enough_evidence'
}
```

## 4. Security, privacy and reliability

- Supabase service-role and model-provider keys remain server-side Edge Function secrets. Never commit secrets or print them in logs.
- Enable RLS on verification, profile, quiz and chat tables. Chat participants can read only their own conversation; users cannot add arbitrary participants or change ownership. Demo fixtures are synthetic and read-only.
- Domain allowlisting is authoritative server-side and uses exact domain or dot-boundary matching. Do not log full submitted addresses. A domain match is eligibility only; email confirmation is required before verified access.
- Persist only the minimum verification attestation/institution/timestamp required. No ID documents, government identifiers or face data. No real users are expected in this demo; avoid production claims.
- Gender identity is optional and sensitive. Restrict reads to the profile owner and narrowly scoped eligibility evaluation; do not expose it in public profile APIs by default. A preference category is separately stored and applied only when explicitly selected. Do not send gender or MBTI to the compatibility model or narrative.
- In-app chat is text-only. Validate membership on every read/write, enforce message length/rate limits, and use a server-side close operation that deletes related messages/memberships/conversation atomically. Do not retain closed-chat backups, logs or AI summaries. Guest demo chat is browser-local and synthetic.
- Do not log quiz answers, access tokens, email confirmation links, chat bodies or AI secrets. Send only necessary soft compatibility factors to narrative generation; omit direct identifiers.
- Factual neighborhood answers require citations; compatibility explanations cite quiz factors; estimates show provenance. No uncited legal advice.
- If Auth, database, chat or model is unavailable, show an explicit typed error. Preserve an unsent message as a local draft and never imply delivery. Never pretend a live verification or AI call succeeded.
- Support keyboard operation, readable text, mobile layouts and user-visible errors. Do not encode trust/verification only in color.

## 5. Non-functional targets

- Demo path reaches a meaningful match without email submission; the structured quiz is split into “About me” and “What I’m looking for.”
- All key screens usable at 360px viewport width and desktop; no horizontal overflow in forms or chat.
- Core demo matching, filters and synthetic chat operate without a third-party messaging service; chat network failures never show a false sent state.
- Strict eligibility filters are deterministic and tested independently from the score. Excluded inputs (gender, MBTI, housing data) cannot change the score.
- Closing a conversation deletes the complete thread and its messages; verify via authorized reads after close.
- `npm run typecheck`, `npm run lint`, `npm run build` pass before code freeze. Vite development alone is not a typecheck.
- Domain validator has positive, negative, malformed-address, lookalike-subdomain and suffix-spoof tests. Domain eligibility cannot set verified status.
- Model calls fail gracefully. Cache guide results where feasible; set and enforce a spend cap before live calls.

## 6. Environment and external dependencies

- Required local variables go in `.env.example` as names only. Secret values stay in ignored `.env` and are not checked into source control.
- Supabase URL and anon key may be used by the client as intended; service-role/model keys remain server-side secrets.
- The server-side university-domain allowlist must be verified against official university sources before enabling the university path. Do not invent domain values or accept email strings based on institution-name text.
- Supabase Auth confirmation and database access must be connected and tested before any UI claims that email verification or account-backed chat is live. Domain validation can be tested without sending email but must be labelled as eligibility-only.
- External sources for rental context, district statistics and transport must be curated/approved; each displayed fact carries source and retrieval date where practicable.
- No third-party messaging account/vendor is required. Supabase remains the existing infrastructure dependency; guest demo chat must still be usable with local synthetic data.

## 7. Open technical choices

| ID | Question | Proposed default | Blocks |
|---|---|---|---|
| T1 | Supabase OTP or magic link after domain eligibility? | Use provider confirmation; neither domain check nor guest demo is a verified identity. | University path and verified state |
| T2 | Exact official domain mapping for each of eight institutions? | Owner verifies each domain from official university sources and stores server-side. | Validator acceptance |
| T3 | Account-backed chat delivery: Supabase Realtime or simple refresh/poll? | Use Realtime only if already available; otherwise explicit refresh/polling is acceptable. No vendor chat service. | Messaging implementation |
| T4 | Guest chat browser store? | IndexedDB if available in existing stack, otherwise localStorage; same-device only, clear on close/reset. | Demo persistence |
| T5 | Scalar mappings and weights for compatibility? | Versioned constants and tests; only soft-personality/scalar fields. Excluded-field invariance required. | Score freeze |
| T6 | Chat deletion semantics under backups/logging? | Do not log bodies; close function deletes active DB rows; document that platform database backup lifecycle is infrastructure-level and not user-visible archive. | Privacy copy/deletion acceptance |
| T7 | Is pgvector ready for demo? | Keep retrieval swappable; use local fixture retrieval if provisioning threatens schedule. | Guide implementation |
| T8 | Model spend cap and cache design? | Owner agrees cap; never cache user-identifying or chat content. | GenAI test calls |

**Scope gate:** Before build, reconcile the in-app chat and gender-filter changes with `../../PRD.md`, which currently says “Connect, do not build” for chat and video and excludes custom chat and gender-based matching. This technical draft records the user’s latest direction but does not silently overwrite that approved project source.
