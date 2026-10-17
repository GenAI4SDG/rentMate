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

- **Student tenants** — verify email (demo gate) → lifestyle quiz → seeded roommate matches → messages → **Find a flat** on an OpenStreetMap.
- **Landlords / flat owners** — demo sign-in (account **testing**) → dashboard to **add listings** and manage pins on the same map.

**`backend/`** — Supabase Postgres (HK rental schema, RLS), **map API** (`backend/server`, port **3001**), and **Edge Function stubs** for a future rental chatbot and agreement review. With env + seed, the map shows **50 Hong Kong listings**; the home page can load **12 amenities** live from Supabase.

Root **`src/`** is a thin shell for later merge of the Figma UI — not the judge path.

---

## Feature checklist (planned vs built)

Aligned to [`docs/pitch-and-data-pack.md`](docs/pitch-and-data-pack.md) §1.1. Legend: ✅ demo-ready · 🟡 partial / prototype · ⬜ not wired in app yet.

| ID | Feature | Status | Notes |
|----|---------|--------|--------|
| **F1** | Student verification (university email) | 🟡 | Domain check + session in browser; **not** Supabase Auth / mailbox proof |
| **F2** | Lifestyle + housing quiz | ✅ | 7-question flow in `Figma/src/App.tsx` |
| **F3** | Roommate matching + **compatibility narrative** | 🟡 | Seeded profiles + static compatibility bars; **no live GPT-4o-mini narrative** in UI yet |
| **F4** | Listing layer + neighbourhood transparency | 🟡 | **Real** map listings (GeoJSON, bbox, geocode, nearby POIs); mock 3D tour; no R&VD price brief / in-app chatbot yet |
| **F4+** | Landlord list & manage on map | ✅ | Entry path + `ListingFormModal` + seed user **testing** (hackathon extension) |
| **F5** | Chat + video | 🟡 | In-app **demo** messaging; **Google Meet** handoff not linked |
| **F6** | Extended flat-viewing meetup | ⬜ | Community beat not implemented as its own flow |
| **F7** | Generated settling-in plan | ⬜ | Not in UI |
| **F8** | Multilingual layer | 🟡 | DB amenities EN/中文; UI mostly English |
| — | **Supabase schema + RLS** | ✅ | Migrations under `backend/supabase/migrations/` |
| — | **GenAI rental chatbot** | 🟡 | Edge Function stub; needs deploy + `OPENAI_API_KEY` + UI hookup |
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

See **[`docs/demo-user-guide.md`](docs/demo-user-guide.md)** — env files, `supabase db push`, map API, `npm run seed:listings`, landlord **testing**.

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
