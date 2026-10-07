# RentMate — Database Schema and Data Boundaries

**Version:** 0.2 — revised draft for team review · **Prepared:** 7 October 2026 · **Status:** User decisions recorded; team ratification pending  
**Security note:** This describes a proposed prototype boundary, not a production privacy/compliance review. It adds sensitive optional gender data and in-app chat; approve the schema/access policy and reconcile the existing PRD scope conflict before wiring Supabase.

## 1. Principles

1. The university path checks email format and supported institutional domain, then requires mailbox confirmation before verified access. Domain eligibility alone is not verification. No HKID, face scan or student-card storage.
2. Keep the smallest useful record. Do not duplicate email if Supabase Auth owns it; do not log addresses or message bodies.
3. Guest/demo visitors use synthetic fixtures and browser-local answers/chat only; they never write personal records to account tables.
4. Account profile, identity, preferences and chat are private user data. RLS limits each account to its own records and explicit conversation participants.
5. Gender identity is optional and stored separately from strict roommate-gender preference; neither enters compatibility scoring. Minimize visibility and access because identity is sensitive.
6. Listing statements are not verification records. Provenance must not create a “verified property” implication.
7. Hard eligibility filters (including explicit gender preference) run before deterministic soft-metric scoring. Persist match results only if the user saves them and the team approves retention.
8. A saved account conversation persists until the user closes it. Close deletes conversation, participants and messages. No account-deletion flow is included because real users are not expected in this prototype.

## 2. System-of-record inventory

| Data | Store | Demo treatment | Access |
|---|---|---|---|
| Email and auth state | Supabase Auth | Never requested in guest demo | Supabase-managed; never in fixtures |
| Domain eligibility / verification summary | `student_verifications` | No write; demo banner only | Server-controlled; owner may read status |
| About-me profile + preferences | `user_profiles`, `quiz_answers` | Synthetic fixture/local browser state | Owner read/write through RLS |
| Gender identity / filter | Separate optional fields in `user_profiles` | Synthetic only; never infer a real person | Owner-only by default; narrowly scoped server eligibility query |
| Synthetic roommate profiles | `src/fixtures/profiles.json` | Public demo fixtures; fictional | Read-only; no real personal data |
| Account conversations/messages | `conversations`, `conversation_members`, `messages` | Guest equivalent stays browser-local | Participants only; close deletes all related rows |
| Synthetic/manual listings | `src/fixtures/listings.json` for prototype | Labelled, never verified | Read-only; no real student data |
| Match score/narrative | Computed from eligible profile pair; Edge Function for text | Labelled synthetic pair/fallback | Return only to requester; no persistence by default |
| Guide corpus/citations/cache | Curated sources and retrieval cache | Public factual sources only | Read-only query; no personal identifiers/chat in cache keys |
| Private user report | Not public content | Do not submit real reports in demo | Human process/contact only unless secure report workflow is approved |

## 3. Proposed tables

The following account tables are proposed for the university path; guest/demo profiles, quiz state and messages remain browser-local synthetic data and do not populate them.

### `student_verifications`

| Column | Type | Rules |
|---|---|---|
| `user_id` | `uuid` | Primary key; FK to `auth.users(id)` |
| `verified` | `boolean` | `false` by default; only trusted Auth/server flow can set true |
| `institution` | `text` nullable | Canonical institution resolved from server-side domain allowlist |
| `domain_eligible_at` | `timestamptz` nullable | Set after valid syntax + supported-domain check; this is not mailbox verification |
| `verified_at` | `timestamptz` nullable | Set only after successful mailbox confirmation and eligibility check |
| `created_at`, `updated_at` | `timestamptz` | Server maintained |

No source document, student number, HKID, face image, access token, confirmation link or uploaded image is stored here. The eight institution-to-domain mappings are configuration, not user-provided claims.

### `quiz_answers`

| Column | Type | Rules |
|---|---|---|
| `user_id` | `uuid` | Primary key; FK to `auth.users(id)` |
| `answers` | `jsonb` | Versioned schema with distinct `aboutMe` and `lookingFor` blocks |
| `schema_version` | `smallint` | Explicit question-contract revisions |
| `completed` | `boolean` | False until required fields validate; optional identity/MBTI do not block completion |
| `updated_at` | `timestamptz` | Server maintained |

**Proposed `user_profiles` table:** `user_id uuid` primary/FK; `gender_identity text nullable` (controlled options plus optional self-description only if approved); `mbti_type text nullable` with four-letter validation; `created_at/updated_at`. RLS owner-only. Gender identity is not publicly readable by default, and neither field is passed to score/narrative generation. If privacy review prefers one profile row inside `quiz_answers`, keep the same access boundary and separate JSON paths.

Draft TypeScript shape (freeze alongside `src/lib/types.ts`):

```ts
type AboutMe = {
  sleepSchedule: number // normalized 0..1; optional varies state represented explicitly
  sharedSpaceHabits: number // 0..1
  socialGuestPreference: number // 0..1
  noisePreference: number // 0..1
  personalSpacePreference: number // 0..1
  communicationStyle?: 'direct' | 'cool_off' | 'written_agreement'
  billSplittingStyle: number // 0..1, with human-readable anchors
  smokingStatus?: 'non_smoker' | 'smoker' | 'prefer_not_to_say'
}

type LookingFor = {
  roommateGenderCategories?: Array<'woman' | 'man' | 'non_binary' | 'self_described'>
  anyGender: boolean // true disables the strict gender filter
  smokingRule?: 'required_non_smoking' | 'preference_non_smoking' | 'no_preference'
  householdRhythm?: 'quiet_private' | 'friendly_shared' | 'student_oriented' | 'flexible'
  districts?: string[]
  maxWalkToMtrMinutes?: 5 | 10 | 15 | null
  mustHaveAmenities?: string[]
  minRoomSizeSqFt?: number | null
  maxMonthlyRentHKD: number
}

type OptionalProfileDecorations = {
  genderIdentity?: 'woman' | 'man' | 'non_binary' | 'self_described' | 'prefer_not_to_say'
  genderSelfDescription?: string // only if approved; tightly restricted
  mbtiType?: string // profile decoration only, never score/filter
}

type MatchResult = {
  eligible: boolean
  score: number | null // soft metrics only; null when no shared scored inputs
  status: 'scored' | 'insufficient_data' | 'ineligible'
  matchedFactors: string[]
  frictionFactors: string[]
}
```

**Proposed chat tables:** `conversations(id uuid, created_by uuid, created_at timestamptz, closed_at timestamptz nullable)`; `conversation_members(conversation_id uuid, user_id uuid, profile_id text, joined_at timestamptz)`; `messages(id uuid, conversation_id uuid, sender_user_id uuid, body text, created_at timestamptz)`. Constrain message body length, index by `(conversation_id, created_at)`, RLS-read only for current members, and authorize sends only for an active member. Guest demo never writes these rows. `closeConversation` must transactionally delete messages, members and conversation; no soft-delete/archive state.

The question wording, scalar anchors/weights, gender-category UX and retention details remain proposals. Version and test the schema before implementation; never use unset fields as inferred preferences.

### Listings (prototype fixture shape, not a database table)

Each demo record includes `id`, `district`, `rentMonthlyHKD`, `roomType`, `amenities[]`, `roomSizeSqFt?`, `mtrWalkMinutes?`, `conditionNotes`, `photos[]`, `provenance` and `demoLabel`. Each relevant value is tagged as synthetic fixture, poster-provided or official-source. Missing values remain absent and render as “Not provided”. No `verifiedListing` field is permitted.

## 4. RLS and function access

- Enable RLS on every account table (`student_verifications`, `user_profiles`, `quiz_answers`, `conversations`, `conversation_members`, `messages`).
- `SELECT/UPDATE` on profile and quiz rows require `auth.uid() = user_id`; no user may read another person’s gender identity or answers through direct table access.
- Verification summary is owner-readable; writes are denied to ordinary client roles and performed only by trusted Auth/Edge Function logic.
- Chat reads require active membership; message insertion requires `sender_user_id = auth.uid()` and active membership; users cannot modify membership or add a participant from the browser. The server validates that a matched synthetic/real profile may be contacted.
- Close operation validates ownership/membership and deletes thread rows atomically. No user-selectable archive/deleted flag; confirm the delete action in UI first.
- No public policies on real-user records. Do not expose service-role access to browser code.
- Demo fixtures/local chat are separate from account tables; no names/emails/IDs copied from real people.
- Edge Functions validate identity, allowlisted fields and output limits; never trust client-supplied `verified=true`, institution or chat membership.

## 5. Retention and deletion

- Guest/demo answers and chat: browser-local synthetic state. Closing a demo conversation deletes that conversation/messages from local storage; clearing demo data resets all local state. No server persistence.
- Account-backed quiz/profile/chat: persistent within the account. A conversation and its messages are retained until the user explicitly closes it; close deletes conversation, membership and message rows rather than archiving them.
- The prototype does not expect real users and has no account-deletion flow. Do not add or promise one without a separately approved requirement. This does not weaken the explicit delete-on-close chat behavior.
- Verification summary: retain only the minimum attestation/institution/timestamps required by the university path. Avoid production retention claims while the prototype has no real-user onboarding plan.
- AI prompt/response logs: do not retain emails, gender identity, MBTI or chat bodies. Debug only with synthetic fixtures or redacted traces.
- No raw verification documents are accepted by this schema. Infrastructure backups may have their own lifecycle; do not surface closed chats through normal application access or logs.

## 6. Decisions required

| ID | Question | Proposed default |
|---|---|---|
| D1 | Which exact email domains map to each of the eight supported universities? | Verify against official university sources; server-side allowlist, no guessed values. |
| D2 | Supabase OTP or magic link after domain check? | Provider-confirmed mailbox ownership before verified status. |
| D3 | Final scalar anchors/weights and optional response semantics? | Product/GenAI owner freezes a versioned score contract with tests before implementation. |
| D4 | Privacy display for gender identity and treatment of self-described/undisclosed identity in strict filter? | Owner-only identity by default; selected filter is not silently relaxed; approve category behavior before build. |
| D5 | Guest demo storage implementation and reset copy? | Browser-local synthetic data, same-device only, clear-on-close/reset. |
| D6 | Ratify conflict with `PRD.md`: in-app chat instead of connect-only; optional gender identity and strict matching filter instead of gender out of scope? | Product/scope owner updates the project source of truth before implementation. |
