# RentMate

**Roommate matching and affordable housing for students in Hong Kong** — compatible flatmates, transparent listings, and a trust layer so newcomers avoid agency fees and scam-heavy channels.

Hackathon entry · Track 3: Smart Living, Culture & Belonging · SDG 11

> ### ⚠️ Branch note (`AI-random-bs-go`)
> This is a **solo methodology experiment**, not the team's working branch. The
> team's planning docs (`PRD.md`, `TEAM-BRIEF.md`, `docs/site-spec-suite/`, …) were
> **removed here on purpose** — they had drifted into three contradictory statements
> of the product, and this branch replaces them with a validated intent tree in
> [`vault/`](vault/). **`main` still holds every removed file**; restore any with
> `git checkout main -- <path>`.
>
> The surviving primary sources are the team-agreed interim report and the `Figma/`
> export. See [`vault/NOTES.md`](vault/NOTES.md) for the reasoning.

---

## Start here

| If you want to... | Read |
|---|---|
| **Know the agreed position** — the team's interim report | [`docs/GENAI SDG interim draft.pdf`](docs/GENAI%20SDG%20interim%20draft.pdf) |
| **Know what the product is meant to be** — the validated intent tree | [`vault/ips/IP.rentmate.v3.md`](vault/ips/IP.rentmate.v3.md) |
| **Know what actually ships vs. what is a demo stub** — the honesty ledger | [`SUBMISSION_REPORT.md`](SUBMISSION_REPORT.md) §7 |
| **See the agent's honest take** — the drift found, what was overruled, what was deleted | [`vault/NOTES.md`](vault/NOTES.md) |
| **See the contracts** (deterministic functions, with test oracles) | [`vault/cps/`](vault/cps/) |
| **Run the hackathon demo** | [`docs/demo-user-guide.md`](docs/demo-user-guide.md) — start in the **`Figma/`** app |
| **Put it on a public URL** — the deck needs a clickable link | [`docs/HOSTING.md`](docs/HOSTING.md) |
| **Set up or repair the database** | [`backend/supabase/SETUP.md`](backend/supabase/SETUP.md) |
| Read the original deck and raw survey | [`docs/GenAI.pdf`](docs/GenAI.pdf) · [`docs/SURVEY.pdf`](docs/SURVEY.pdf) |

**Key dates:** build + submission both **~18 October** · **code freeze 14 October**.
| | |
|---|---|
| **Hackathon** | GENAI for SDG · **Track 3 — Smart Living, Culture & Belonging** |
| **SDG** | **11** — Sustainable cities and communities |
| **Status** | **Entry granted** · demo-ready build on `main` (localhost accepted by organisers) |
| **Team repo** | [GenAI4SDG/rentMate](https://github.com/GenAI4SDG/rentMate) |

**Four focuses (pitch order):** compatibility → affordability → transparency → safety (university-gated access).

Product authority for scope and ethics: [`docs/GENAI SDG interim draft.pdf`](docs/GENAI%20SDG%20interim%20draft.pdf) · details in [`PRD.md`](PRD.md).

---

## What works today

**What the shipped build actually uses** (as of 14 Oct — see
[`SUBMISSION_REPORT.md`](SUBMISSION_REPORT.md) §7 for the full ledger):

- **Vite + React 19 + TypeScript** ✅ typecheck clean, production build green
- **Supabase — Postgres + Realtime only.** Chat is persisted and delivered live.
- **No Supabase Auth.** The email is the account key, checked client-side
  against an institution allowlist. No password, no OTP, no session.
- **RLS is disabled** on all eight tables (no `auth.users` ⇒ no `auth.uid()` to key
  a policy on). Demo-only trade, documented in [`SETUP.md`](backend/supabase/SETUP.md).
- **No GenAI API is called anywhere.** Every AI-shaped feature is pre-written
  content badged "AI · demo" in the UI.
- **Chat and video are built in-house and stay in-app** — contact details are
  never exchanged, and there is no Google Meet hand-off.
- **Hosted as static files.** The organisers accept a localhost build, but the
  submission deck needs a **clickable link**, so a public URL is required —
  see [`docs/HOSTING.md`](docs/HOSTING.md). The app is `dist/` plus assets; no
  server process is deployed.

> Earlier revisions of this section described Supabase Auth, Edge-Function
> GenAI calls and a Google Meet hand-off. None of those ship. They are kept out
> of the codebase rather than left as aspirational comments.
The **main demo** lives in **`Figma/`** (React 19 + Vite, port **8443**). It serves **two audiences**:

- **Student tenants** — verify email (demo gate) → lifestyle quiz → seeded roommate matches with a **compatibility summary** → messages with Google Meet / viewing-meetup shortcuts → **Find a flat** on OpenStreetMap with **price context** → **My plan** settling-in checklist → **Ask Rent Mate** assistant.
- **Landlords / flat owners** — real **Supabase Auth** sign-up / sign-in → dashboard to **add, mark rented, relist and remove** listings (server-verified ownership). Seed owner **testing** has 50 listings.

There are **two** npm projects in this repo with **different scripts**. Read the
heading before you copy a command.

### The demo app — `Figma/` (this is the product)
The AI features run on a **rule-based placeholder** behind a single provider interface (`Figma/src/lib/genai/`); set `VITE_GENAI_MODE=api` to plug in a real LLM backend without touching the UI.

**`backend/`** — Supabase Postgres (HK rental schema, RLS), **map API** (`backend/server`, port **3001**), and **Edge Function stubs** for a future rental chatbot and agreement review. With env + seed, the map shows **50 Hong Kong listings**; the home page can load **12 amenities** live from Supabase.

Root **`src/`** is a thin shell for later merge of the Figma UI — not the judge path.

---

## Feature checklist (planned vs built)

Aligned to [`docs/pitch-and-data-pack.md`](docs/pitch-and-data-pack.md) §1.1. Legend: ✅ demo-ready · 🟡 partial / prototype · ⬜ not wired in app yet.

| ID | Feature | Status | Notes |
|----|---------|--------|--------|
| **F1** | Student verification (university email) | 🟡 | Domain check + session in browser; **not** Supabase Auth / mailbox proof |
| **F2** | Lifestyle + housing quiz | ✅ | 7-question flow in `Figma/src/App.tsx` |
| **F3** | Roommate matching + **compatibility narrative** | 🟡 | Seeded profiles; weighted score (not AI); narrative is a **rule-based placeholder** in the UI — LLM swap-in ready (`VITE_GENAI_MODE=api`) |
| **F4** | Listing layer + neighbourhood transparency | 🟡 | **Real** map listings, nearby POIs, **district price context** (vs. median of listings); mock 3D tour; official R&VD data not integrated |
| **F4+** | Landlord list & manage on map | ✅ | Supabase Auth, create / mark rented / relist / remove, ownership enforced server-side, seed owner **testing** (hackathon extension) |
| **F5** | Chat + video | 🟡 | In-app **demo** messaging + **Google Meet** handoff; no real-time delivery between users |
| **F6** | Extended flat-viewing meetup | 🟡 | “Propose a viewing meetup” shortcut in chat; no group scheduling yet |
| **F7** | Generated settling-in plan | 🟡 | **My plan** tab, personalised from quiz answers (placeholder generator) |
| **F8** | Multilingual layer | 🟡 | DB amenities EN/中文; UI mostly English |
| — | **Supabase schema + RLS** | ✅ | Migrations under `backend/supabase/migrations/` |
| — | **GenAI rental chatbot** | 🟡 | “Ask Rent Mate” widget live with a rule-based FAQ placeholder; Edge Function stub + `OPENAI_API_KEY` needed for the real model |
| — | **Deploy + CI** | ✅ | `render.yaml`, `Figma/vercel.json`, GitHub Actions build/test; auto-redeploy on push |
| — | **Agreement AI review** | 🟡 | Edge Function stub only |
| — | **Roommate data in Postgres** | ⬜ | Quiz/matches still client demo data, not HK rental tables |

**Demo honesty:** Say aloud that **roommate profiles are seeded**; **map listings** are real when the map API is running and seed has been applied.

---

## Quick start

### Judges / teammates (UI only)

```bash
cd Figma
npm install
cp .env.example .env.local   # optional — see below
npm run dev
# → http://localhost:8443
```

Opens on **<http://localhost:8443>** (not 5173 — `Figma/vite.config.ts` sets
`port: 8443` with `strictPort: true`, so if 8443 is taken the server **fails**
rather than picking another port).

Sign in as **`demo@cuhk.edu.hk`** for the curated cast, or any
`@<hk-institution>.edu.hk` address from the allowlist for the generic pool.

**No backend is required.** With `.env.local` absent or blank the app runs in
**local mode** — the whole flow works, data lives in the browser. To connect
Supabase, put these in `Figma/.env.local` and restart:

```
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<publishable / anon key>
```

> **The `VITE_` prefix is mandatory.** Vite silently ignores `NEXT_PUBLIC_*`
> names, which makes the app fall back to local mode with no error. The header
> shows which mode you are in — if it says `local` when you expected `supabase`,
> the variables did not reach the build.

### The root app shell — repo root (integration placeholder)

A five-file stub, not the product. Only run this if you are working on the
integration shell.
Optional: `Figma/.env.local` from `Figma/.env.example` for the **Live database check** on the home page.

### Full stack (map + 50 HK pins)

See **[`docs/demo-user-guide.md`](docs/demo-user-guide.md)** — env files, `supabase db push`, map API, `npm run seed:listings`, owner sign-in.

### Public URL (Vercel + Render)

**Start here:** **[`docs/go-live.md`](docs/go-live.md)** — hackathon checklist (~15 min).  
Full setup, GenAI notes, and troubleshooting: **[`docs/demo-user-guide.md`](docs/demo-user-guide.md)** (*Put it online*).

Host **UI** from `Figma/` and **map API** from `backend/server/`. Set **`VITE_MAP_API_URL`** when building the frontend. Optional one-shot: [`render.yaml`](render.yaml) on Render Blueprint.

```bash
# Terminal 1
cd backend/server && npm install && npm run dev

# Terminal 2
cd Figma && npm run dev
```

### The backend — `backend/`

Not a service you run for the demo. See
[`backend/supabase/SETUP.md`](backend/supabase/SETUP.md).

## Stack

| Layer | Choice |
|-------|--------|
| Frontend | Vite 8, React 19, TypeScript (`Figma/`) |
| Backend | Supabase (Auth, Postgres, Storage, Edge Functions) |
| Map | Leaflet, OSM tiles, Express map API, Nominatim / Overpass |
| GenAI (target) | GPT-4o-mini in Edge Functions — compatibility narrative + grounded chatbot (keys server-side only) |
| Demo | **localhost** (organiser-confirmed); no deploy required |

---

## Repository map

| Path | Role |
|------|------|
| [`Figma/`](Figma/) | Hackathon demo UI |
| [`backend/supabase/`](backend/supabase/) | Migrations, Edge Functions |
| [`backend/server/`](backend/server/) | Map API, geocode, listing CRUD, seed scripts |
| [`docs/demo-user-guide.md`](docs/demo-user-guide.md) | Setup, troubleshooting, demo script |
| [`backend/README.md`](backend/README.md) | Supabase + map API reference |
| [`TEAM-BRIEF.md`](TEAM-BRIEF.md) | Decisions, roles, calendar |
| [`PRD.md`](PRD.md) | Full product requirements |

---

## Development

**From the repo root:**

```bash
npm run typecheck   # tsc --noEmit — the important one
npm run lint        # eslint
```

**From `Figma/`:**

```bash
npm run build       # before each Friday demo
npm run smoke       # 51 assertions on the invariants TS cannot see
npx tsc --noEmit    # there is no typecheck script in Figma/
```

> **`Figma/package.json` has only `dev`, `build`, `preview`, `format` and
> `smoke`.** `npm run typecheck` and `npm run lint` exist at the **root** only,
> so running them inside `Figma/` fails with "Missing script". Typechecking the
> app is `npx tsc --noEmit` from `Figma/`.

> **Vite does not typecheck.** `npm run dev` will happily serve code with type errors. Without a typecheck the editor is your only safety net and broken code reaches `main`.

## Hosting

The submission deck needs a **clickable link**, so the app has to be reachable on
a public URL — localhost cannot go in a slide.

```bash
cd Figma
npm run build          # produces Figma/dist/
```

Then upload `Figma/dist/` to any static host. Full instructions, including the
three things that silently break a deploy, are in
[`docs/HOSTING.md`](docs/HOSTING.md). The two that catch people:

- **Env vars are baked in at build time, and `.env.local` is gitignored** — a
  host that builds from Git produces a local-mode app unless you set
  `VITE_SUPABASE_*` in its dashboard. Building locally and uploading `dist/`
  sidesteps this entirely.
- **Subpath hosting needs `FIGMA_PUBLIC_URL`** — e.g. GitHub Pages at
  `/rentMate/` requires `FIGMA_PUBLIC_URL=/rentMate npm run build`, or every
  asset 404s.

> ⚠️ The anon key ships inside the bundle and RLS is off, so **anyone with the
> link can read and write every row**. That is acceptable only because the data
> is synthetic. Do not put a real person's details in this database while the
> link is public.
# Figma app
cd Figma && npm run build

# Map API tests
cd backend/server && npm test
```

Before sharing `main`: run `npm run build` in `Figma/` (Vite does not typecheck on `dev`).

**Secrets:** only `*.env.example` is committed — copy to `.env.local`. Never commit keys.

**Branching:** `main` stays demo-able · one person per file · remote `GenAI4SDG/rentMate`.

- **[`.workbuddy-ai/memory/MEMORY.md`](.workbuddy-ai/memory/MEMORY.md)** — the shared project brain. Update it when you *decide* something, not just when you build something.
- **`.workbuddy-ai/skills/rentmate-conventions/`** — our stack, conventions, ethics rules and scope lock.

## Reference (optional)

## Branching

Remote: `https://github.com/GenAI4SDG/rentMate`

- `main` must always be demo-able
- **One branch per person:** `p1/`, `p2/`, `p3/`
- **One person per file** — AI tools edit files directly, so two people on one file collide
- Tag a working demo every Friday: `git tag demo-w1`
- `.env.example` is committed; `.env` is not
Market research, judging scorecard, build plans: `docs/*.html`, [`docs/build-plans.md`](docs/build-plans.md), [`docs/pitch-and-data-pack.md`](docs/pitch-and-data-pack.md). Site spec draft: `docs/site-spec-suite/`.
