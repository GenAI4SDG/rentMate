# RentMate — Feature Build Plans

**Purpose:** for each feature in scope, exactly what to build, what it depends on, and the files/scripts needed. Written so that **each feature can be built solo by one person without waiting on another.**
**Status:** aligned to the team-agreed interim report · 1 October 2026
**Companion:** `docs/pitch-and-data-pack.md` (what we say) · `TEAM-BRIEF.md` (why)

> ⚠️ **`docs/GENAI SDG interim draft.pdf` is the agreed statement of this project and outranks this page.** Conflicts have been removed. Change log: `docs/interim-report-reconciliation.md`.
>
> **The four focuses, in order:** compatibility · affordability · transparency · safety (trust and privacy). **Listing verification is ruled out.** GenAI = **GPT-4o-mini** for the compatibility narrative and the cached neighbourhood guide; matching and scoring are deterministic.

---

## 0. The independence rule

The single most important structural decision, and it is a scheduling decision not a technical one.

> **Features must not depend on each other's code.** Each teammate must be able to build, run and demonstrate their feature alone, on day one, without waiting for anyone else.

Two mechanisms make that true:

1. **A shared data contract, frozen before any feature is built.** A single file — `src/lib/types.ts` — defines what a `Profile`, `Listing`, `Verification`, `QuizAnswers` and `AuditResult` look like. Everyone codes against those types. Nobody waits to see anyone's implementation.
2. **Two features use Supabase; the rest are stateless.** Fewer Supabase touchpoints means fewer people blocked on P1's schema.

### 0.1 The Supabase boundary — decided once, early

| Feature | Uses Supabase? | Why |
|---|---|---|
| **F1 Verification** | ✅ **Auth + one table** | Focus #4 — the access gate. It must persist. |
| **F2 Quiz** | ✅ **One table** | Feeds matching and the settling-in plan; needs to persist. |
| **F3 Matching** | ✅ **Read-only query** | Reads profiles + quiz answers. No new writes. |
| **F4 Listing layer** | ⚠️ **Nothing at build time** | Stateless. Listings live in a JSON file. The RAG corpus for the neighbourhood guide goes in pgvector *only* as a thin retrieval call, and can be stubbed with a local JSON index if it slips. |
| **F5 Chat / video** | ❌ **None** | Connect to third-party (Google Meet). |
| **F6 Meetup** | ❌ **None** | A scheduling handoff, no persistence. |
| **F7 Settling-in plan** | ❌ **None** | Generated from quiz answers already in the client. |
| **F8 Multilingual** | ❌ **None** | A display layer. |

**What this buys us:** F4, F6, F7 and F8 — four of eight features — are buildable by someone with **zero Supabase access**. That is two people working productively from day one with no coordination. The Supabase surface is **one schema, decided once**, owned by one person.

### 0.2 What must be frozen before anyone writes feature code

| # | Contract | Where it lives | Owner | Why it blocks others |
|---|---|---|---|---|
| C1 | **Type definitions** — `Profile`, `Listing`, `Verification`, `QuizAnswers`, `AuditResult`, `MatchResult` | `src/lib/types.ts` | P1 | Every feature imports these |
| C2 | **Database schema** | `supabase/migrations/0001_init.sql` | P1 | F1/F2/F3 cannot persist without it |
| C3 | **Fixtures** — 8–10 profiles, 8 listings | `src/fixtures/*.json` | P3 | F3/F4 cannot demo without data |
| C4 | **Edge Function signatures** — request/response shape | `supabase/functions/README.md` | P1 + P3 | Lets frontend and GenAI work in parallel |

> **Rule:** these four are frozen in the first working session. Everything after is solo work.

---

## 1. Standing setup — do this first, once

Do this *before* feature work. It takes an hour and unblocks everything.

### 1.0 Fix the known breakage

`src/App.tsx` is currently **0 bytes** and `npm run typecheck` fails with three errors. This blocks P2 from making any progress and the failure is silent because Vite does not typecheck.

```bash
# Confirm the breakage
cd C:/Users/Trinity/Programmes/GENAI_sdg
node node_modules/typescript/bin/tsc --noEmit
```

Expected output right now:

```
src/main.tsx(3,8): error TS2307: Cannot find module './index.css' or its corresponding type declarations.
src/main.tsx(4,8): error TS1192: Module '"../App"' has no default export.
src/main.tsx(6,12): error TS2345: Argument of type 'HTMLElement | null' is not assignable to parameter of type 'Container'.
```

**Fix, in order:**

| # | Action | File |
|---|---|---|
| 1 | Write a minimal `App` component with a **default export** | `src/App.tsx` |
| 2 | Add `/// <reference types="vite/client" />` so `.css` imports resolve | `src/vite-env.d.ts` (new) |
| 3 | Guard the root element instead of passing `HTMLElement \| null` | `src/main.tsx` |
| 4 | Add the typecheck script | `package.json` |

`package.json` — add to `"scripts"`:

```json
"typecheck": "tsc --noEmit"
```

`src/vite-env.d.ts` — new file:

```ts
/// <reference types="vite/client" />
```

`src/main.tsx` — replace the root acquisition:

```tsx
const rootEl = document.getElementById('root')
if (!rootEl) throw new Error('Root element #root not found in index.html')
createRoot(rootEl).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

> **Why this matters:** `"strict": true` is already confirmed set in `tsconfig.json`. TypeScript only helps if typecheck actually runs — otherwise the editor is the only thing checking, and errors ship.

### 1.1 Install the stack

```bash
npm install react-router-dom @supabase/supabase-js
npm install -D tailwindcss @tailwindcss/vite
```

| Tool | Purpose | Owner |
|---|---|---|
| `react-router-dom` | Explicit routing | P2 |
| `@supabase/supabase-js` | Already installed ✅ | P1 |
| `tailwindcss` + `@tailwindcss/vite` | Styling — **no custom CSS from scratch** | P2 |

Recommended for the starter decision: rather than migrating to Supabase's quickstart template (which would mean redoing the TypeScript migration we just finished), **wire auth into our existing scaffold** using Supabase's quickstart as the reference. Same learning, no rework.

### 1.2 Repo hygiene

The remote already exists at `https://github.com/GenAI4SDG/rentMate` and `main` tracks `origin/main`. Confirmed:

```bash
git remote -v
# origin  https://github.com/GenAI4SDG/rentMate (fetch)
# origin  https://github.com/GenAI4SDG/rentMate (push)
```

**Corrections already applied (25 Sep):** three doc lines were stale and are now fixed — `MEMORY.md` had claimed no git remote (it is `github.com/GenAI4SDG/rentMate`), the skill had said "Deploy frontend on Vercel or Netlify" (organisers accept localhost), and branches were listed as `ws1/ws2/ws3` (now per-person `p1/`, `p2/`, `p3/`). No action needed.

```bash
# Branch per person
git checkout -b p1/platform
git checkout -b p2/frontend
git checkout -b p3/genai

# Tag the working demo every Friday
git tag demo-w1 && git push origin demo-w1
```

### 1.3 Standing scripts checklist

| Script | Command | When |
|---|---|---|
| Dev server | `npm run dev` | Always |
| **Typecheck** | `npm run typecheck` | **Before every commit** |
| Lint | `npm run lint` | Before every PR |
| Build | `npm run build` | Before the Friday demo |

---

## 2. Feature plans

Each plan is self-contained. A person can take one and work without reading the others.

---

### F1 — Student Verification 🔒 *(focus #4 — the access gate)*

**Owner:** P1 · **Supabase: yes (Auth + 1 table)** · **Blocks:** F2, F3

#### What it does
University email verification. Returns a verification state: `verified` / `pending` / `declined`. **All users must be a university student to access the platform** — the report states university email is sufficient.

#### Hard rules
- **Store a boolean attestation only.** Fields: `verified`, `institution`, `verified_at`. **Never the document.** The report requires verification to be PDPO-compliant: purpose-limited, use-limited, clear consent.
- **Delete any uploaded image immediately after OCR.** Not later, immediately.
- **Student-card OCR is optional and unconfirmed by the interim report** — the report relies on university email alone. Build it only if time allows.

#### Dependencies
- C2 (schema) — must be frozen first
- C4 (Edge Function signature) — P1 defines, P3 consumes

#### Files

| Path | Purpose | Owner |
|---|---|---|
| `supabase/migrations/0001_init.sql` | `verifications` table + RLS | P1 |
| `supabase/functions/verify-student/index.ts` | Signed-URL intake → OCR → attestation → delete | P1 |
| `src/pages/SignIn.tsx` | Email + password, Supabase Auth | P2 |
| `src/pages/VerifyStudent.tsx` | Upload UI, state machine (idle → uploading → pending → verified/declined) | P2 |
| `src/lib/supabaseClient.ts` | Client init from env vars | P1 |

#### Schema sketch

```sql
create table verifications (
  user_id       uuid primary key references auth.users(id) on delete cascade,
  verified      boolean not null default false,
  institution   text,
  verified_at   timestamptz,
  created_at    timestamptz not null default now()
);
alter table verifications enable row level security;
```

#### Acceptance test
Sign in with a university email → state goes `pending` → `verified` → **an unverified account is held at the gate**. If OCR is built: check the storage bucket is empty (image deleted) and the `verifications` row contains no document data.

---

### F2 — Lifestyle + Housing Quiz *(focus #1 feeder)*

**Owner:** P1 (schema) + P2 (UI) · **Supabase: yes (1 table)** · **Depends on:** F1

#### What it does
Collects lifestyle (roommate compatibility) and housing (listing matching) answers.

#### The decision that matters
**Cut 22 questions to ~12 on the demo path.** The deck's full spec stays in `docs/GenAI.pdf` §11–13 as the design reference, but a 22-question wall at signup hurts real completion and eats build time.

Recommended split:
- **At onboarding (6):** sleep schedule, cleanliness, guests, noise, shared spaces, conflict style — the High-weight lifestyle items
- **At browse time (6):** preferred districts, room type, budget, MTR proximity, move-in timing, lease length — the High/Critical housing items

#### Files

| Path | Purpose | Owner |
|---|---|---|
| `supabase/migrations/0002_quiz.sql` | `quiz_answers` table (JSONB) | P1 |
| `src/fixtures/quizQuestions.ts` | The ~12 questions, weights included | P3 |
| `src/pages/QuizOnboarding.tsx` | 6 lifestyle questions | P2 |
| `src/pages/QuizHousing.tsx` | 6 housing questions | P2 |
| `src/components/QuestionCard.tsx` | Shared question renderer | P2 |

#### Schema sketch

```sql
create table quiz_answers (
  user_id     uuid primary key references auth.users(id) on delete cascade,
  answers     jsonb not null default '{}'::jsonb,
  completed   boolean not null default false,
  updated_at  timestamptz not null default now()
);
```

#### Acceptance test
Complete all 12 → row in `quiz_answers` with 12 keys → refresh the page and answers persist.

---

### F3 — Roommate Matching + Compatibility Narrative *(focus #1 — Compatibility)*

**Owner:** P3 (scoring + narrative) + P2 (UI) · **Supabase: read-only** · **Depends on:** F1, F2, C3

#### What it does
Weighted match scoring across the seeded pool, plus a GenAI narrative explaining each match and flagging friction points.

#### Be honest about what is and is not GenAI
- **The score is arithmetic.** `(A1×3 + A2×3 + A3×2 + A4×2 + A5×1 + A7×2 + A8×1 + C2×3) / max × 100`
- **The narrative is GenAI.** Explaining *why* two people match, and where they will clash, is genuine LLM work.
- Script line: **"weighted scoring, with an LLM-generated narrative."**

#### Also implement the two deck filters
- Budget filter: `|A.budget − B.budget| < 20%`
- Area filter: at least one overlapping preferred district

#### Files

| Path | Purpose | Owner |
|---|---|---|
| `src/lib/matching.ts` | Pure function: `scoreMatch(a, b) → number`. **No Supabase import** — testable in isolation | P3 |
| `supabase/functions/match-narrative/index.ts` | LLM narrative + friction flags | P3 |
| `src/fixtures/profiles.json` | 8–10 seeded profiles | P3 |
| `src/pages/Matches.tsx` | Match list + narrative cards | P2 |

#### Acceptance test
`scoreMatch()` returns 0–100 and is **unit-testable without a database**. Given two identical profiles it returns 100; given opposite sleep schedules it drops measurably. Run the narrative on the same pair twice and get consistent output.

---

### F4 — The Listing Layer + Neighbourhood Guide *(focus #3 — Transparency)*

**Owner:** P3 (guide + chatbot) + P2 (UI) · **Supabase: none at build time** · **Depends on:** C3 only

**Listing verification is ruled out by the interim report** — do not build an audit that claims to verify a flat. What remains is the transparency layer: accurate listing information, and a chatbot plus neighbourhood guide covering **the neighbourhood and the condition of the room**.

#### What it does

| Sub-feature | What it does | Genuine GenAI? |
|---|---|---|
| **Filters** | District, budget, room type, MTR proximity, furnished/unfurnished | No |
| **Room condition info** | What the room and building are actually like — layout, furnishing, condition | No |
| **Price context** | Listing rent vs R&VD district data | Data lookup |
| **Neighbourhood guide** | Sourced facts with visible citations | **Yes** (RAG) |
| **Transparency chatbot** | Answers questions about a district or a room, grounded in the corpus, **cached** | **Yes** |
| **Scam awareness** | Flags **potential concerns** — never definitive verdicts | Yes — error-prone |
| **Day-in-the-life narrative** | Commute, noise, what's open at 11pm — **text only** | Yes |
| **Side-by-side comparison** | Two listings compared (**1st to cut, per the 2am rule**) | Partly |

#### Hard rules for this feature
- **Never claim to verify a listing.** The report rules it out.
- **No legal advice.** "Contract common sense" and sourced factual statements only.
- **Never generate images of a real flat.** Narrative text only.
- **Never present a size estimate as a measurement.** Range + confidence level on screen, always.
- **Every neighbourhood fact carries a citation.** No free-text opinions about an area, ever.
- **Cache chatbot responses** — the report names caching as the cost control.

#### The decoupling win
This feature **does not need Supabase and does not need the app to exist.**
- The corpus can be assembled as plain text/Markdown
- Retrieval can be tested **locally in a Python notebook**, before any Edge Function exists
- The frontend then calls a finished function

P3 can start this on day one, in parallel with everything else.

#### Files

| Path | Purpose | Owner |
|---|---|---|
| `src/fixtures/listings.json` | Listings — **manually collected + synthetic** for the prototype | P3 |
| `corpus/` | The HK source corpus — rent data, tenancy terms, district facts, transport | P3 |
| `scripts/ingest_corpus.py` | Chunk + embed + push to pgvector | P3 |
| `supabase/functions/neighbourhood-guide/index.ts` | RAG + citations + response cache | P3 |
| `src/pages/Listings.tsx` | Filtered list | P2 |
| `src/pages/ListingDetail.tsx` | Listing info + price context + guide | P2 |
| `src/components/GuidePanel.tsx` | Guide + citations renderer | P2 |
| `src/components/GuideChat.tsx` | Transparency chatbot | P2 |

#### Data-collection route (from the report)
A **scraper** locates listings; then **cold-call flat owners** to upload photos of rooms with a **standard reference object** and the **floor plan with dimensions**. A **landlord listing submission form** supports real listing creation. Partnerships are the post-hackathon route to more listings.

#### Acceptance test
Filter a listing → price context shows against R&VD data → the neighbourhood guide shows at least 3 citations → the chatbot answers a district question from the corpus and serves a cached response on repeat → **the app works with Supabase switched off.**

---

### F5 — Chat + Video *(connect, do not build)*

**Owner:** P2 · **Supabase: none** · **Depends on:** F3

#### What it does
Connects to **existing platforms such as Google Meet** for live viewing. Chat and video are not built in-house.

#### The detail that matters
Video calling may be affected by low-bandwidth connections. The report's mitigation is **alternative viewing methods** — **photo galleries** and **pre-recorded video walkthrough requests** — offered whenever a live session is not feasible.

#### Files

| Path | Purpose |
|---|---|
| `src/components/VideoHandoff.tsx` | Hands off to Google Meet |
| `src/components/PhotoGallery.tsx` | Alternative viewing — photo gallery |
| `src/components/WalkthroughRequest.tsx` | Alternative viewing — pre-recorded video request |
| `src/pages/Chat.tsx` | Route wrapper |

#### Acceptance test
From a matched pair, a live session hands off to Google Meet; a photo gallery and a pre-recorded walkthrough request are both reachable without live video.

---

### F6 — Extended Flat-Viewing Meetup *(our belonging feature)*

**Owner:** P4 (design) + P2 (stub) · **Supabase: none** · **Depends on:** F4

#### What it does
Extends step 5 of the existing user flow — *"arrange meet roommate to see the flat together."*

**The reframe:** instead of building a social platform, make it *"meet your roommate, plus two other verified pairs looking in the same district this month."* Same logistics, same safety framing, **no new cold-start**, and belonging arrives as a by-product of a task users already want to do.

#### Files

| Path | Purpose | Owner |
|---|---|---|
| `src/pages/ViewingMeetup.tsx` | Scheduling handoff + "two other pairs in this district" | P2 |
| `docs/settling-in-plan-spec.md` | Content design for F7 | P4 |

#### Acceptance test
From a matched pair, a user can propose a viewing, see two other verified pairs in the same district, and reach a scheduling handoff. No calendar backend.

---

### F7 — Generated Settling-In Plan *(cheap, high-value)*

**Owner:** P4 (design) + P3 (generation) · **Supabase: none** · **Depends on:** F2 only

#### What it does
Turns quiz data into a personalised three-week arrival plan: *"your first three weeks in Hung Hom, for someone who cooks and sleeps early."*

**Why this is the right belonging feature:** GenAI-native, needs no users to be useful, zero physical-safety risk, and it maps directly onto the theme.

#### Files

| Path | Purpose | Owner |
|---|---|---|
| `supabase/functions/settling-plan/index.ts` | Generation from quiz answers | P3 |
| `src/components/SettlingPlanCard.tsx` | Display | P2 |

#### Acceptance test
Two different quiz profiles produce two visibly different plans.

---

### F8 — Multilingual Layer

**Owner:** P2 · **Supabase: none** · **Depends on:** nothing

#### What it does
Every generated output in the user's first language. **Ship English + Chinese.** The report anticipates content validation for **Mandarin, Korean, Japanese and French**, so claim multilingual capability on the strength of the architecture — not on a built locale count.

#### Files

| Path | Purpose |
|---|---|
| `src/lib/i18n.ts` | Locale selection + pass-through to Edge Functions |
| `src/components/LanguageToggle.tsx` | UI toggle |

#### Acceptance test
Toggle to Chinese → the district brief and settling-in plan come back in Chinese.

---

## 3. Dependency map

```
        [C1 types.ts] [C2 schema] [C3 fixtures] [C4 edge signatures]
                │           │            │              │
                └───────────┴────────────┴──────────────┘
                                    │
              ┌─────────────────────┼─────────────────────┐
              │                     │                     │
         F1 Verification       F4 Listing Layer      F7 Settling-in
         (P1, Supabase)        (P3, NO Supabase)     (P3, NO Supabase)
              │                     │                     │
              ▼                     ▼                     │
         F2 Quiz               F6 Meetup                 │
         (P1+P2)               (P4+P2)                   │
              │                                           │
              ▼                                           │
         F3 Matching ──────────────────────────────────────┘
         (P3+P2)
              │
              ▼
         F5 Chat/Video
         (P2)

    F8 Multilingual — depends on nothing, applies everywhere
```

**Reading the map:** F4, F7 and F8 have **no upstream dependency on F1** and require **no Supabase access**. That is three features that can begin on day one with zero coordination. This is what makes solo work possible.

---

## 4. Ownership summary — one person per file

| Person | Owns | Supabase access needed? |
|---|---|---|
| **P1** | `supabase/migrations/*`, `supabase/functions/verify-student/`, `src/lib/supabaseClient.ts`, `src/lib/types.ts` | ✅ Yes — owns it |
| **P2** | `src/pages/*`, `src/components/*`, `src/App.tsx` | ⚠️ Read the client, no schema work |
| **P3** | `corpus/*`, `scripts/*.py`, `src/fixtures/*`, `src/lib/matching.ts`, `supabase/functions/{neighbourhood-guide,match-narrative,settling-plan}/` | ⚠️ Own functions, not schema |
| **P4** | `docs/pitch-and-data-pack.md`, `TEAM-BRIEF.md`, ethics content, `docs/*-spec.md` | ❌ None |

> **The rule that prevents conflict:** one person per file. WorkBuddy and other AI tools edit files directly — two people on one file will collide. P2 owns every file under `src/pages/` and `src/components/`; P3 owns everything under `scripts/` and `corpus/`. The only shared file is `src/lib/types.ts`, frozen once by P1.

---

## 5. Where Supabase is genuinely required

Deliberately small. Decided once, early, so only one person is ever blocked on it.

| Requirement | Feature | Owner |
|---|---|---|
| Auth (email/password) | F1 | P1 |
| `verifications` table | F1 | P1 |
| `quiz_answers` table | F2 | P1 |
| Read query across profiles | F3 | P1 |
| pgvector for corpus retrieval | F4 (**stubbable**) | P1 + P3 |

**Two things to note:**

1. **F4's pgvector dependency is stubbable.** If pgvector setup slips, P3 swaps a local JSON index behind the same function signature. The feature still demos. Do not let pgvector block the neighbourhood guide.
2. **Everything else touches nothing.** F5, F6, F7 and F8 require no database at all.

---

## 6. Immediate actions

| # | Action | Owner | Blocking? |
|---|---|---|---|
| 1 | Fix `App.tsx`, add `vite-env.d.ts`, guard root, add `typecheck` script | P1 | **Yes — blocks P2** |
| 2 | Freeze C1–C4 (types, schema, fixtures, edge signatures) | P1 + P3 | **Yes — blocks everyone** |
| 3 | Wire Supabase client + env vars, create the project, invite the other three | P1 | Yes — blocks F1/F2 |
| 4 | Install `react-router-dom`, `tailwindcss` | P2 | Yes — blocks P2 |
| 5 | Write 8–10 profiles + 8 listings as fixtures | P3 | Yes — blocks F3/F4 |
| 6 | Start the corpus and the local retrieval test | P3 | No — solo, day one |
| 7 | Agree the **AI spending cap** (the model is settled: GPT-4o-mini) | P3 | Yes — blocks all GenAI |
| 8 | Fix the three stale doc lines (remote, deploy, branch names) | P4 | No |

---

*Companion documents: `docs/pitch-and-data-pack.md` (scope + data for the pitch) · `TEAM-BRIEF.md` (decisions and context) · `docs/rentmate-scope-lock.html` (judging scorecard)*
