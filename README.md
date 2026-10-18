# RentMate

**Roommate matching and affordable housing for students in Hong Kong** — compatible flatmates, transparent listings, and a trust layer so newcomers avoid agency fees and scam-heavy channels.

Hackathon entry · Track 3: Smart Living, Culture & Belonging · SDG 11

> ### ⚠️ Branch note
> You are on **`AI-random-bs-go`**. **`main` is the stable trunk** (pre-merge base) —
> all new work is built and tested here first, then merged into `main`. Do not push
> experimental work directly to `main`.
>
> The planning docs that used to live at the repo root (`PRD.md`, `TEAM-BRIEF.md`)
> were removed on this branch on purpose; `main` still holds them. The validated
> intent and contracts now live in [`vault/`](vault/) (quarantined from the product
> and the pitch). See [`vault/NOTES.md`](vault/NOTES.md) for the reasoning.

---

## Read this first: what is real vs. synthesised

The one rule of this repo: **say what is true**. The full ledger is
[`SUBMISSION_REPORT.md`](SUBMISSION_REPORT.md) §7 — read it before any demo.
The short version:

| Real | Synthesised / demo-only |
|---|---|
| University-domain eligibility gate (exact dot-boundary match) | **Every candidate profile** — seeded data |
| The scoring contract `CP.calculate_match.v2` (8/8 oracle) | **Every "AI" feature** — rule-based placeholder, badged in the UI |
| In-app chat persisted to Postgres, delivered over Supabase Realtime | **All listings** — no public HK per-listing API exists; 72 synthetic flats locally, 50 seeded to the DB |
| Report + block (a block hides the chat for **both** sides) | Conversation replies, hook deck, district guides, safety notes |
| Landlord listing CRUD with server-enforced ownership | The 3D walkthrough — stock photos, captioned as a mock |
| The account reloads on mount, **no sessions** | Verification is **domain-only** — no email sent, nothing stored |

`VITE_GENAI_MODE=api` swaps the placeholder for a real LLM backend without
touching the UI — the three endpoints are listed in
[`Figma/src/lib/genai/index.ts`](Figma/src/lib/genai/index.ts).

---

## What the app is

**Two audiences, one app** (`Figma/`, run on port **8443**):

**Students** (the primary path — everything here works offline):

```
/ (Home) → /verify → /quiz → /matches
```

| Route | What happens |
|---|---|
| `/` | Landing. Student CTA leads; the owner CTA is secondary. |
| `/verify` | Email gate — 12 institutions / 41 domains, exact match. No password, no OTP, no session. |
| `/quiz` | 7-question single-choice flow (from `appData.ts`) → answers feed the settling plan and the compatibility narrative. The full 20-question / 17-page engine — sections, multi-select, free text — exists smoke-tested in `lib/quiz.ts` but is **not wired into the app** (known gap, see F2). |
| `/matches` | Hook deck (one real shared detail per match, not a ranked grid) → chat with a **compatibility narrative** → **Find a flat** (Leaflet/OSM map + district price context) → **My plan** settling-in checklist. `demo@` / `admin@` local parts unlock the curated demo cast / review queue. |

**Landlords / flat owners** (secondary path — needs the backend to be *live*, or runs read-only):

```
/landlord-entry → /landlord-dashboard
```

| Route | What happens |
|---|---|
| `/landlord-entry` | Real **Supabase Auth** sign-up/sign-in, **or** the one-click **demo owner** — a local-only sign-in that works with no backend at all (writes the session to the browser; the dashboard then shows the synthetic pool read-only, badged *Demo mode*). |
| `/landlord-dashboard` | Add / mark rented / relist / remove listings, ownership enforced server-side. |

## How it is actually wired

**Supabase — Postgres + Realtime, and Auth for owners only.**

- **Students have no Auth.** The **email is the account key** (`roommate_profiles` PK).
  Profiles, messages, reports and blocks are written directly with the anon client;
  chat is delivered over `postgres_changes`. **RLS is disabled on the eight demo
  tables** — documented, and safe only because the data is synthetic
  ([`backend/supabase/SETUP.md`](backend/supabase/SETUP.md)).
- **Landlords use real Supabase Auth** (`signUp` / `signInWithPassword`) and the map
  API verifies listing ownership on every write.
- **Everything degrades to the browser.** With no `Figma/.env.local` the app runs in
  **local mode** — the whole student flow works from `localStorage`. The **Live
  database check** card on the home page (`#backend`) is the visible signal: it says
  *Not configured* and prints the exact fix when the variables are missing, so a
  silently-ignored env var can never fake a save.

**Map API (`backend/server`, port 3001).** Serves `/api/listings`,
`/api/listings/:id/nearby`, `/api/geocode`, `/api/health`, and the landlord routes.
With env + seed the map shows **50 Hong Kong listings**.

**Offline fallback (no backend required).** When the map API is unreachable the map
falls back to the synthetic pool: pins inside the viewport, the same price/bedroom
filters, district search, and a **"Demo listings · map API offline — retry"** badge
that re-probes when you start the backend. The UI always says which pool you are
looking at — see [`Figma/src/lib/demoListings.ts`](Figma/src/lib/demoListings.ts).

**GenAI.** `VITE_GENAI_MODE=mock` (default) = rule-based placeholder, no keys,
works offline. If the API is down the UI silently falls back to the placeholder, so
a demo never shows an error.

---

## Quick start

### UI only (no backend — this is the judge path)

```bash
cd Figma
npm install
npm run dev          # → http://localhost:8443
```

`port: 8443` is `strictPort` — if it is taken the server **fails** rather than
picking another port. Sign in as **`demo@cuhk.edu.hk`** for the curated cast, or any
`@<institution>.edu.hk` address from the allowlist for the generic pool.

### Full stack (map + 50 HK pins + real Supabase)

See **[`docs/demo-user-guide.md`](docs/demo-user-guide.md)** — env files,
`supabase db push`, the map API, `npm run seed:listings`, owner sign-in.

```bash
cd backend/server && npm install && npm run dev   # terminal 1 — port 3001
cd Figma && npm run dev                           # terminal 2 — port 8443
```

To connect Supabase, put these in `Figma/.env.local` and restart (the `VITE_`
prefix is mandatory — Vite silently ignores `NEXT_PUBLIC_*` names and the app falls
back to local mode with no error):

```
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon key>
```

### Public URL (Vercel + Render)

**Start here:** **[`docs/go-live.md`](docs/go-live.md)** (~15 min checklist).
Full setup and troubleshooting: **[`docs/HOSTING.md`](docs/HOSTING.md)**.
One-shot option: [`render.yaml`](render.yaml) on Render Blueprint — two services,
`rentmate-map-api` (Node) and `rentmate-web` (static, SPA rewrite). Set
**`VITE_MAP_API_URL`** on the site to the API's URL after the first deploy.

---

## Feature checklist

Legend: ✅ demo-ready · 🟡 partial / prototype · ⬜ not wired in app yet.

| ID | Feature | Status | Notes |
|----|---------|--------|-------|
| F1 | Student verification (university email) | 🟡 | Domain gate + email-as-account-key; **not** mailbox proof, and nothing is stored to attest it |
| F2 | Lifestyle + housing quiz | 🟡 | 7 questions wired in `pages/Quiz.tsx` (from `appData.ts`). `lib/quiz.ts` holds the full 20-question / 17-page engine — sections, multi-select, free text, profile round-trip, all smoke-tested — but **nothing imports it**: wiring it up is a known gap, not a shipped feature. |
| F3 | Roommate matching + compatibility narrative | 🟡 | Seeded profiles; deterministic score contract; narrative is a rule-based placeholder, LLM-swap ready |
| F4 | Listing layer + neighbourhood transparency | 🟡 | Real map listings when the API runs, **offline demo fallback** when it doesn't; nearby POIs optional; district price context vs. the loaded pool; mock 3D tour |
| F4+ | Landlord list & manage on map | ✅ | Supabase Auth, create / mark rented / relist / remove, ownership enforced server-side; demo owner signs in locally |
| F5 | Chat | 🟡 | Real in-app messaging (Postgres + Realtime) with optional Google Meet / viewing-meetup shortcuts; no video built in-app |
| F6 | Viewing meetup | 🟡 | Shortcut in chat; no group scheduling |
| F7 | Generated settling-in plan | 🟡 | `My plan`, personalised from quiz answers (placeholder generator) |
| F8 | Multilingual | 🟡 | Amenities EN/中文 in the DB; UI mostly English |
| — | Supabase schema | ✅ | 6 migrations, `2026-03-13` → `2026-10-14` |
| — | Moderation (report / block) | ✅ | Real tables; block hides both sides; review queue is **read-only** — no un-block, no resolution |
| — | GenAI rental chatbot | 🟡 | Rule-based placeholder; Edge Function stubs exist for a real model |
| — | Deploy | ✅ | `render.yaml`, `Figma/vercel.json`, GitHub Actions build |
| — | Roommate data in Postgres | ✅ | `roommate_profiles` keyed on email, upserted when Supabase is configured |

**Demo honesty, say it aloud:** the roommate profiles are **seeded**; the map
listings are real when the map API is running and seeded, and the synthetic demo
pool when it isn't (the badge tells you which); every "AI" feature is pre-written.

---

## Repository map

| Path | Role |
|------|------|
| [`Figma/`](Figma/) | **The product** — React 19 + Vite 8 + TypeScript, pages + router |
| [`Figma/src/pages/`](Figma/src/pages/) | `Home` · `Verify` · `Quiz` · `Matches` (landlord routes render `components/Landlord*`) |
| [`Figma/src/lib/`](Figma/src/lib/) | `quiz`, `matching` (score + hard gates), `listings` (synthetic pool), `demoListings` (offline fallback), `api` (Supabase surface), `landlordApi`, `genai` |
| [`backend/server/`](backend/server/) | Map API — listings, geocode, landlord CRUD, seed scripts (port 3001) |
| [`backend/supabase/`](backend/supabase/) | Migrations, Edge Function stubs, `SETUP.md` |
| [`docs/demo-user-guide.md`](docs/demo-user-guide.md) | Full setup, troubleshooting, demo script |
| [`docs/HOSTING.md`](docs/HOSTING.md) · [`docs/go-live.md`](docs/go-live.md) | Public URL, deploy breakers |
| [`FEATURE_LEDGER.md`](FEATURE_LEDGER.md) | Every feature request and what happened to it — the negative rows matter |
| [`SUBMISSION_REPORT.md`](SUBMISSION_REPORT.md) | External-review brief; §7 = the honesty ledger |
| [`vault/`](vault/) | Intent + contracts (`IP.rentmate.v3`, `CP.*`), quarantined from the product |
| [`src/`](src/) | 5-file integration stub at the repo root — **not** the judge path |

## Development

**From the repo root:**

```bash
npm run typecheck   # tsc --noEmit — the important one
npm run lint        # eslint
```

**From `Figma/`:**

```bash
npm run build       # before each Friday demo — Vite does NOT typecheck
npm run smoke       # 66 assertions on the invariants TS cannot see
npx tsc --noEmit    # there is no typecheck script in Figma/
```

`Figma/package.json` has only `dev`, `build`, `preview`, `format` and `smoke`;
`typecheck`/`lint` exist at the root only, so running them inside `Figma/` fails
with "Missing script".

## Hosting

The deck needs a **clickable link**, so the app has to be reachable publicly:

```bash
cd Figma && npm run build    # → Figma/dist/
```

The two things that silently break a deploy (both covered in
[`docs/HOSTING.md`](docs/HOSTING.md)):

- **Env vars are baked in at build time and `.env.local` is gitignored** — a host
  that builds from Git produces a local-mode app unless `VITE_SUPABASE_*` and
  `VITE_MAP_API_URL` are set in its dashboard. Building locally and uploading
  `dist/` sidesteps this.
- **Subpath hosting needs `FIGMA_PUBLIC_URL`** — e.g. GitHub Pages at `/rentMate/`
  requires `FIGMA_PUBLIC_URL=/rentMate npm run build`, or every asset 404s.

> ⚠️ The anon key ships inside the bundle and RLS is off, so **anyone with the
> link can read and write every row**. Acceptable only because the data is
> synthetic. Do not put a real person's details in this database while public.

## Conventions

- `main` must always be demo-able · one branch per person · **one person per file**
  (AI tools edit files directly, so two people on one file collide) · tag a working
  demo every Friday: `git tag demo-wN`
- `.env.example` is committed; `.env.local` is not. Never commit keys.
- Update [`.workbuddy-ai/memory/MEMORY.md`](.workbuddy-ai/memory/MEMORY.md) when you
  **decide** something, not just when you build something.
- Team repo: [GenAI4SDG/rentMate](https://github.com/GenAI4SDG/rentMate)
