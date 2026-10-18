# RentMate

**Roommate matching and affordable housing for students in Hong Kong** — compatible flatmates, transparent listings, and a trust layer so newcomers avoid agency fees and scam-heavy channels.

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

The **main demo** lives in **`Figma/`** (React 19 + Vite, port **8443**). It serves **two audiences**:

- **Student tenants** — verify email (demo gate) → lifestyle quiz → seeded roommate matches with a **compatibility summary** → messages with Google Meet / viewing-meetup shortcuts → **Find a flat** on OpenStreetMap with **price context** → **My plan** settling-in checklist → **Ask Rent Mate** assistant.
- **Landlords / flat owners** — real **Supabase Auth** sign-up / sign-in → dashboard to **add, mark rented, relist and remove** listings (server-verified ownership). Seed owner **testing** has 50 listings.

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
npm run dev
# → http://localhost:8443
```

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

---

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

```bash
# Figma app
cd Figma && npm run build

# Map API tests
cd backend/server && npm test
```

Before sharing `main`: run `npm run build` in `Figma/` (Vite does not typecheck on `dev`).

**Secrets:** only `*.env.example` is committed — copy to `.env.local`. Never commit keys.

**Branching:** `main` stays demo-able · one person per file · remote `GenAI4SDG/rentMate`.

---

## Reference (optional)

Market research, judging scorecard, build plans: `docs/*.html`, [`docs/build-plans.md`](docs/build-plans.md), [`docs/pitch-and-data-pack.md`](docs/pitch-and-data-pack.md). Site spec draft: `docs/site-spec-suite/`.
