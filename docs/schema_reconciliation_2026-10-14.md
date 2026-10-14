# RentMate — Schema & Scope Reconciliation against `docs/` (pre-Oct-1 sources)

**Date:** 2026-10-14
**Branch:** `AI-random-bs-go` (offshoot, unpushed)
**Author:** agent
**Trigger:** owner — *"review the schema based on docs/ (pdf sources, before Oct 1st) — it's probably about as authoritative as the pdf I gave you before."*

**Scope of this doc:** reconcile the current backend schema
(`backend/supabase/migrations/20261013233000_roommate_matching.sql`) and the
planned auth-free chat schema (tasks #23–#27) against the authoritative
pre-Oct-1 `docs/` sources **and** the frozen RentMate IP/CP contracts
(`GENAI_sdg/vault/ips/IP.rentmate.v2.md`, `vault/cps/CP.*`). Note: those
contracts are themselves a *separate* methodology experiment on this offshoot
branch — used here only as a frozen spec, not as product code (see the companion
framework-usefulness report).

---

## 1. Sources reviewed (all in `docs/`)

| Source | Type | What it establishes |
|---|---|---|
| `GenAI.pdf` | program brief | 3 candidate solutions (A MatchFirst / B TrustFirst / C AllInOne); **"What You're NOT Building"** scope-control page |
| `SURVEY.pdf` | 41-respondent survey (20/09/2026) | trust verification is the #1 validated need; chat is a weak/optional ask |
| `rentmate-scope-lock.html` | 23 Sep 2026 | **strongest** calls: verification is THE product; GenAI must be load-bearing; 3D already cut; seeded profiles acknowledged |
| `rentmate-implementation-methods.html` | — | PCV 18/24, 4 selling points, verification #1 (73%/68% survey) |
| `hk-rental-partner-research.html` | Sep 2026 | HK is a *matching* problem; fraud concentrated in cheap/direct channels; student bed shortfall |
| `demo-user-guide.md` | — | **stale**: "no login required", 7 questions, local demo — superseded |
| `GENAI SDG interim draft.pdf` | team-agreed authority | relies on prior extraction + `vault/README.md` characterization |

### 1a. The load-bearing points from those sources
- **GenAI.pdf scope-control page** explicitly cuts: *3D room reconstruction*
  ("too complex → photo analysis + AI description"), *face scanning* ("privacy →
  university email only"), and **real-time chat** ("needs moderation → link out to
  Telegram/WhatsApp"). Quiz spec = **22 questions** (A1–A10 lifestyle weighted,
  B1–B8 housing, C1–C4 budget) with a fixed-weight score and filters
  (|Δbudget|<20%, ≥1 overlapping district).
- **SURVEY.pdf Q12** (trust verification importance): **28 promoter / 2
  detractor** — the single strongest signal in the survey. Q11 "most useful
  features": Verified profiles **30**, Compatibility matching **28**, Apartment
  searching 24, Review system 16, **In-app messaging 11**. Open-text Q13:
  "Scam filters", "maybe a chat feature". → Verification is validated #1; chat is
  a *maybe*, not a priority.
- **scope-lock.html**: verification is the product (not matching); GenAI must be
  load-bearing (multimodal listing audit + cited RAG); demote weighted matching to
  an "honest role"; cut separate social hangout; **3D reconstruction ALREADY
  CUT**; **seeded profiles must be acknowledged as simulated**; video via
  Jitsi/Whereby embed behind a mutual match.

---

## 2. Current schema state (as written)

`20261013233000_roommate_matching.sql` defines:

- `student_verifications(user_id uuid → auth.users, email_domain, institution, verified bool, created_at)` + `unique(user_id, email_domain)`
- `roommate_profiles(user_id uuid → auth.users PK, display_name, school, about_me jsonb, looking_for jsonb, gender_identity enum, mbti_type, area text, budget_min/max, …)` + `set_updated_at` trigger
- `quiz_answers(user_id → auth.users, question_id, factor, value, option_index)`
- `match_results(user_id, candidate_id, score, status, narrative, matched_factors, friction_factors)`
- `calculate_match_score(a jsonb, b jsonb)` — SQL mirror of `CP.calculate_match.v2`
- RLS **enabled** on all four tables, with `auth.uid()` / `auth.role() = 'authenticated'` policies.

**Verified mismatch with the app.** `Figma/src/lib/api.ts` `saveProfile`
(`supabase.from("roommate_profiles").upsert({…})`, line 122) sends the fields
`belief_system`, `campus_district`, `target_areas[]`, `interests[]` (lines
127–133). **None of these exist as columns in the migration.** Conversely the
migration carries `area text` and `school text` that the app does not populate.
So the migration is out of sync with the app's profile shape in **both**
directions.

Also verified: `api.ts` contains **no** insert into `student_verifications` and
**no** `messages`/`conversation_id` usage — confirming the verification table is
currently orphaned and real chat (#23–#27) is not yet backed by Supabase.

---

## 3. Divergence register

| # | Area | Doc / contract basis | Current build | Sev | Recommendation |
|---|------|---------------------|---------------|-----|----------------|
| **D1** | Auth model | owner: *"email = identity, no password"*; GenAI.pdf originally had password + card | migration FK `auth.users` on every table | **High** | rewrite PKs to `text` (=email); drop FK |
| **D2** | Profile columns | app needs `campus_district` / `target_areas[]` / `interests[]` / `belief_system` | migration lacks them; has unused `area` / `school` | **High** | add the 4 columns; decide on `area`/`school` |
| **D3** | `student_verifications` | scope-lock: *"store the verification result only — a boolean plus institution and timestamp"* | table defined but `api.ts` never writes it | Med | populate on domain gate **or** drop |
| **D4** | Score dual-source | `CP.calculate_match.v2` is the frozen canonical; scope-lock: *"demote matching to honest role"* | client `matching.ts` + SQL `calculate_match_score` + edge fn all score; AI-off → deterministic narrative | Med | pick one canonical (client); document the rest |
| **D5** | Quiz spec | GenAI.pdf: 22 Q weighted + formula | app: 12 Q; IP/CP: 6 equal-weight + MBTI renormalized | Low | map 12Q → IP/CP factors in code; note supersession |
| **D6** | Simulated 360 "tour" | scope-lock: *"3D reconstruction ALREADY CUT"*; brief: *"3D too complex → photo analysis"* | `App.tsx:1633–1707` draggable **flat stock photo** "360 view" w/ fabricated dims; pulls Unsplash at runtime | Low–Med | remove **or** watermark "illustrative only" |
| **D7** | Real-time chat | GenAI.pdf: *"chat → link out"*; survey chat weak (11/41) | owner chose **real** chat (Supabase Realtime) — #23–#27 | Low | keep (intentional) + note no moderation |
| **D8** | Verification method | brief: password + card + email + verified/pending | domain-only, no password/card/pending | Low | documented lean (aligned with owner) |
| **D9** | RLS vs auth-free | — | RLS `auth.uid()` blocks **all** access under auth-free | **High** | disable RLS **or** service-role-only |
| **D10** | `messages` table | needed for real chat | absent from migration | **High** | add `messages(conversation_id, sender_email, body, created_at)` |

---

## 4. Detailed findings

**D1 — Auth model (BLOCKER for the Supabase path).** Every table references
`auth.users(id)`. The decided product is email-as-identity with **no password and
no Supabase Auth signup** (owner: *"logging in via the same email (no password)
will just give you the same account"*). The migration therefore enforces a model
the app does not use. Under auth-free, `auth.uid()` is always null → RLS (D9)
fails closed. Fix is bundled with D9 in the rewrite below.

**D2 — Profile column mismatch (BLOCKER).** `api.ts:127–133` upserts
`belief_system`, `campus_district`, `target_areas`, `interests`. The migration's
`roommate_profiles` has none of these; it has `area` and `school` instead. When
the Supabase persistence path is live, `upsert` with unknown columns will error.
(The app's district-based commute model — `campus_district` → `target_areas` →
`DISTRICT_COORDS` in `matching.ts` — is sound and matches the market-research
"location-selective" insight, but the migration doesn't persist it.)

**D3 — Orphaned verification table.** The shape (`verified bool` + `institution`
+ `email_domain` + `created_at`) already satisfies scope-lock's *"boolean plus
institution plus timestamp"* principle. But nothing writes it: `requestVerification`
now returns `{mode:"demo"}` and never inserts. Either populate a row on first
domain gate (cheap, honours the principle) or drop the table for the demo.

**D4 — Three score sources, one canonical.** The score is computed in (a) the
client `matching.ts calculateMatch` (the app's live source of truth), (b) the SQL
`calculate_match_score` (a mirror of `CP.calculate_match.v2`), and (c) the
`compatibility` edge function. The IP/CP contract is the frozen canonical and is
implemented client-side; the SQL + edge copies must stay byte-for-byte in sync or
drift. AI is **off** (deterministic `NARRATIVE_FALLBACK`, `scored_with_model:false`),
so the "GenAI narrative" the contract assumed (`F5`, *"never cut"*) is gone — a
post-contract owner decision (see framework report §3.2).

**D5 — Quiz count divergence.** `demo-user-guide.md` says 7 (stale); the app has
12; the brief specifies 22 with fixed weights. The IP/CP set **supersedes** the
brief's weighted scheme with 6 equal-weight factors + MBTI renormalized
(`CP.calculate_match.v2`). The 12-question quiz should be explicitly mapped (in
code comments) to the 6 IP/CP factors + MBTI + HARD constraints, with a note that
the brief's 22-Q weighted formula was superseded.

**D6 — Simulated 360 "tour".** `App.tsx:1633–1707` renders `roomViews` (4 generic
Unsplash photos at `App.tsx:84–109`) as a horizontally-dragged "360 degree view"
with **hardcoded, fabricated dimensions** ("4.2 × 3.6 m", etc.). It is *not* 3D
reconstruction and *not* "photo analysis + AI description" — it is a decorative
CSS panorama of a stock photo, and it pulls external images at runtime (a network
dependency that also conflicts with the "local demo" framing). This contradicts
scope-lock's *"3D reconstruction ALREADY CUT"* and the brief's scope-control.
Severity is low (cosmetic) but it should be removed or clearly watermarked
"illustrative only / not a real scan."

**D7 — Real chat beyond brief scope.** The brief's scope-control says real-time
chat needs moderation and should *link out*; the survey ranks in-app messaging
low (11/41). The owner deliberately chose real in-app chat (option b) — a
justified product bet that strengthens the brief's "connect and act" step, but a
documented divergence. Caveat: on a free Supabase tier with no moderation, this
is an abuse/trust risk worth a one-line limitation note.

**D8 — Verification method lean.** The brief's flow had password + student-card
upload + verified/pending/declined. We kept only the domain gate (no password,
no card, no pending state) — aligned with the owner's *"ONLY the domain name"*
and the brief's own cut of face scanning → email only. A defensible, documented
lean.

---

## 5. Already compliant (record the wins)

- **C1 — Domain-only verification** ✔ (matches owner + brief "email only" + survey trust-verification #1).
- **C2 — Synthetic profiles explicitly labeled in the UI** ✔. `App.tsx:1149–1151`
  *"The curated cast is synthetic — written for this demo. The districts and the
  kinds of places are real; the people are not."*; `:1062` *"Demo mode · scored in
  your browser"*; `:1035` *"Curated demo cast"*. This satisfies scope-lock's
  *"seeded profiles must be acknowledged."*
- **C3 — AI off** (deterministic fallback) — deliberate, owner-directed.
- **C5 — District-based commute model** (`campus_district` → `target_areas` →
  `DISTRICT_COORDS`) matches the market-research "location-selective" finding and
  the brief's area-overlap filter.
- **C6 — HARD/SOFT split** implemented: gender/identity, belief, target location,
  target size, price, smoking = HARD; lifestyle + MBTI = SOFT.

---

## 6. Recommended auth-free schema (concrete rewrite)

```sql
-- student_verifications: attestation only (boolean + domain + institution + ts)
create table if not exists public.student_verifications (
  email          text primary key,
  email_domain   text not null,
  institution    text not null,
  verified       boolean not null default true,
  created_at     timestamptz not null default now()
);

-- roommate_profiles: email = identity (NO auth.users FK)
create table if not exists public.roommate_profiles (
  email           text primary key,
  display_name    text,
  school          text,
  about_me        jsonb not null default '{}'::jsonb,   -- 6 IP/CP soft factors
  looking_for     jsonb not null default '{}'::jsonb,    -- HARD: any_gender, roommate_gender_categories, smoking_rule
  gender_identity public.gender_identity,
  mbti_type       text,
  belief_system   text,          -- NEW
  campus_district text,          -- NEW (from institutions.ts)
  target_areas    text[],        -- NEW
  interests       text[],        -- NEW
  area            text,          -- retained for back-compat? decide
  budget_min      integer check (budget_min is null or budget_min >= 0),
  budget_max      integer check (budget_max is null or budget_max >= budget_min),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create trigger roommate_profiles_updated_at
  before update on public.roommate_profiles
  for each row execute function public.set_updated_at();

-- messages: real in-app chat
create table if not exists public.messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id text not null,
  sender_email    text not null,
  body            text not null,
  created_at      timestamptz not null default now()
);
create index if not exists messages_conv_idx
  on public.messages (conversation_id, created_at);

-- quiz_answers + match_results are orphaned (no app writes; scoring is client-side).
-- DROP them for the demo, OR keep match_results only if you want server scoring.
-- RLS: DISABLE for the auth-free demo (no auth.users → auth.uid() blocks everything).
alter table public.student_verifications disable row level security;
alter table public.roommate_profiles      disable row level security;
alter table public.messages              disable row level security;
```

> If you prefer to keep RLS, replace the `auth.uid()` policies with a single
> service-role-only path (the Edge Functions use the service key) and a permissive
> anon `select` on `roommate_profiles` for the matching pool. For a hackathon demo,
> disabling RLS is simpler and acceptable.

---

## 7. Open questions for the owner

- **Q1 (D6):** Keep the simulated 360 tour (watermark "illustrative only") or cut
  it? Scope-lock says 3D is already cut.
- **Q2 (D7):** Confirm real in-app chat for the submission narrative (it goes
  beyond the brief's "link out" default).
- **Q3 (D1/D9):** Approve the auth-free schema rewrite + RLS-off decision?
- **Q4 (D5):** Annotate the 12-question quiz in `quiz.ts` with its IP/CP factor
  mapping?
- **Q5 (D3):** Populate `student_verifications` on domain gate, or drop it?

---

## 8. Action checklist (maps to tasks)

| Task | Covers | Status |
|---|---|---|
| #23 schema migration rewrite | D1, D2, D3, D9, D10 | pending (needs Q3) |
| #24 `messages` Edge Function | D10 | pending |
| #25 `api.ts` email identity / real-user matching / chat I/O | D1, D7, D10 | pending |
| #26 `App.tsx` Realtime wiring | D7 | pending |
| #27 tsc + build green + docs update | all + honesty ledger | pending |
| NEW — D6 tour decision | D6 | pending (needs Q1) |
| NEW — D5 quiz annotation | D5 | pending (needs Q4) |

*No migration or code was changed by this review. This document is the
reconciliation the owner asked for; the edits above await the owner's answers to
§7.*
