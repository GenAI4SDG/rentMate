# RentMate — Demo & setup guide

**Audience:** teammates, judges, anyone running the hackathon demo  
**Time:** ~5 minutes to set up · ~3 minutes to walk through the product

---

## What you are demoing

**RentMate** helps Hong Kong **student tenants** find **compatible roommates** and explore **affordable flats**, and lets **landlords / flat owners** **list homes on a map**, supporting **SDG 11** (sustainable cities and communities).

| Part | Folder | What it shows |
|------|--------|----------------|
| **Interactive UI (main demo)** | `Figma/` | Full flow — roommate UI uses sample data; map can use real Supabase listings |
| **App shell (future)** | repo root `src/` | Placeholder until Figma UI is merged |
| **Backend** | `backend/` | Supabase schema, map API (`backend/server`), Edge Function stubs |

For a minimal demo, run **`Figma/`** only. Add Supabase + map API when you want the live amenities panel and HK listing pins.

---

## Environment files (secrets)

Git ignores all `.env.local` files; only `*.env.example` templates are committed.

| Create | Copy from | Used for |
|--------|-----------|----------|
| `Figma/.env.local` | `Figma/.env.example` | Browser: `VITE_SUPABASE_*`, map tiles |
| `backend/server/.env.local` | `backend/server/.env.example` | Map API, seed, listing POST — **service_role here only** |

Never put `SUPABASE_SERVICE_ROLE_KEY` or `sb_secret_*` in Figma. For seed, use legacy **service_role** `eyJ…` or **`sb_secret_…`**, not **`sb_publishable_…`**. The map API can fall back to `VITE_SUPABASE_*` from `Figma/.env.local` if server URL/anon are unset.

---

## Setup

### 1. Node.js 20+

```bash
node -v && npm -v
```

### 2. Demo app

```bash
cd Figma
npm install
npm run dev
```

Open **http://localhost:8443**.

### 3. Supabase (amenities panel)

1. Supabase → **Project Settings → API** → Project URL + **anon** key.  
2. `cp Figma/.env.example Figma/.env.local` and paste values.  
3. Restart dev server. Home → **Live database check**: expect **12 amenities** (English + 中文).

### 4. Migrations (if tables empty)

```bash
cd backend
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

Cloud Supabase is enough — no Docker required for `db push`.

### 5. Map API + 50 HK listings (landlord **testing**)

```bash
cd backend/server          # from repo root; if already in backend/, use: cd server
cp .env.example .env.local
# SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY (see Environment above)
npm install
npm run dev                # port 3001 — keep running
npm run seed:listings      # once: landlord "testing" + 50 listings
```

From `backend/`: `npm run seed:listings` also works.

Figma proxies `/api` → `3001`. **Find a flat** and the **landlord dashboard** load pins when the map API is up.

**Map stack (reference):** Leaflet + OSM tiles → Vite proxy → Express (`backend/server`) → Supabase `properties`, Nominatim geocode, Overpass nearby. Main routes: `GET /api/geocode`, `GET /api/listings?bbox=…`, `POST /api/listings`. UI: `FlatsMapExplorer`, `HouseMap`.

---

## Demo script (~3 min)

### Student tenant

1. Landing → **I'm a student tenant** → email e.g. `student@cuhk.edu.hk` → **Quiz** → **Matches** → **Messages**.  
2. **Find a flat** — map pins when seeded; tenants do not see **List a property**.

### Landlord

1. **I'm a landlord or flat owner** → sign in as **testing** / `testing@rentmate.local`.  
2. **Add a listing** or map toolbar **List a property**; **Sign out** returns home.

**Say clearly:** Roommate profiles are **demo UI data**; **map listings** are real rows when seeded.

---

## Backend — what you can test today

| Where | What |
|-------|------|
| Figma home → **Backend test** | PostgREST → `amenities` (+ active `properties` count) |
| Supabase → **Tables** | `profiles`, `properties`, `amenities`, storage buckets |
| SQL | `select count(*) from public.amenities;` → **12** |
| Map + seed | 50 `properties` with lat/lng after `seed:listings` |

**In DB but not full UI yet:** favourites, viewing requests, chat tables, agreement AI — use dashboard/SQL or deploy Edge Functions (`rental-chatbot`, `analyze-agreement`). See [`backend/README.md`](../backend/README.md).

**Judge line:** “The live panel loads **12 amenities** from Postgres with RLS; matching profiles are prototype data; map listings are real when seeded.”

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `cd backend/server` from inside `backend/` | Use `cd server` |
| `Missing script: seed:listings` | Run from `backend/server` or `npm run seed:listings` from `backend/` |
| Seed: missing SERVICE_ROLE | Add to **`backend/server/.env.local`** only |
| Seed: 401 / Bearer token | Wrong key — use **service_role** `eyJ…` or **`sb_secret_…`**, not publishable or anon |
| Map empty | Map API on :3001? Run seed? Zoom to Hong Kong |
| Blank Figma page | Terminal errors; restart `npm run dev` |

---

## Share with teammates

```bash
git pull origin main
cd Figma && npm install && npm run dev
```

Repo: `https://github.com/GenAI4SDG/rentMate` — never commit `.env.local` or API keys.

---

## Other docs (product & team)

| Document | Purpose |
|----------|---------|
| [README.md](../README.md) | Overview, stack, branching |
| [PRD.md](../PRD.md) | Product scope |
| [TEAM-BRIEF.md](../TEAM-BRIEF.md) | Roles, dates, open decisions |
| [backend/README.md](../backend/README.md) | Supabase layout, map API, Edge Functions |

Deep reference (optional): `docs/site-spec-suite/`, `docs/build-plans.md`, `HK_Rental_Platform_Master_Cursor_Spec.md`.
