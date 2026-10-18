# Hackathon go-live checklist

Use this page the day you want a **public URL** for judges. Full detail and troubleshooting: **[demo-user-guide.md](./demo-user-guide.md)** (sections *Run locally*, *Put it online*, *Troubleshooting*).

---

## What is already built (good enough to demo)

| Area | Status |
|------|--------|
| Student flow (quiz → matches → narrative → chat → map → plan → assistant) | Demo-ready with **placeholder AI** (labelled in UI) |
| Landlord flow (sign-up, add / rent / remove listings) | Demo-ready with Supabase Auth |
| Map + 50 HK seed listings (`testing@rentmate.local`) | Run seed once against your Supabase project |
| Deploy config | `render.yaml`, `Figma/vercel.json`, GitHub Actions CI |

## What we are **not** claiming for the hackathon (say this aloud)

- Roommate profiles and in-app chat are **seeded / local demo**, not live Postgres messaging.
- Student “verification” is a **`.edu.hk`-style domain check**, not mailbox proof.
- GenAI is **rule-based preview** until you set `VITE_GENAI_MODE=api` and host LLM endpoints.

No need to finish those for entry — focus on a stable public URL and a clear 3-minute story.

---

## Before you deploy (once)

1. **Commit and push** all work to `main` on [GenAI4SDG/rentMate](https://github.com/GenAI4SDG/rentMate). Hosting reads from GitHub; uncommitted files on your laptop are not deployed.
2. **Supabase**
   - `cd backend && supabase link --project-ref YOUR_REF && supabase db push`
   - **Authentication → Providers → Email** → turn **Confirm email** **off** (so owner sign-up works during the demo).
   - Copy **Project URL** + **anon** key (legacy tab) for Vercel; **service_role** / `sb_secret_…` for Render only.
3. **Seed map data** (from your machine, with `backend/server/.env.local`):

   ```bash
   cd backend/server
   npm install
   npm run seed:listings
   ```

---

## Deploy in ~15 minutes (Render + Vercel, free tier)

### A. Map API — [Render](https://dashboard.render.com)

*New → Web Service* → connect GitHub → repo `rentMate`.

| Field | Value |
|-------|--------|
| Root directory | `backend/server` |
| Build | `npm install --include=dev && npm run build` |
| Start | `npm start` |
| Health check | `/api/health` |

**Environment variables** — Render does **not** read your laptop’s `.env.local`. You must add these in the dashboard **before** the service can start:

1. Render → your **map API** service → **Environment** (left sidebar).
2. **Add Environment Variable** for each row below (copy values from local `backend/server/.env.local` or Supabase → Settings → API):

| Name | Notes |
|------|--------|
| `SUPABASE_URL` | `https://xxxx.supabase.co` |
| `SUPABASE_ANON_KEY` | anon `eyJ…` |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role `eyJ…` or `sb_secret_…` |
| `OSM_USER_AGENT` | e.g. `RentMate/1.0 (you@email.com)` |

3. **Save Changes** → Render redeploys automatically (or use **Manual Deploy**).

If the build succeeds but logs show `Missing Supabase credentials`, you skipped this step or used the wrong service (env vars must be on the **API** service, not only the static site).

Open `https://YOUR-SERVICE.onrender.com/api/health` → expect `"ok": true`.

**Shortcut:** Render → *New → Blueprint* → select repo → use root [`render.yaml`](../render.yaml) (creates API + static site together; you still fill secrets in the dashboard).

### B. Website — [Vercel](https://vercel.com)

*Add New → Project* → import `rentMate`.

| Field | Value |
|-------|--------|
| Root directory | `Figma` |
| Build | `npm run build` (Vite — auto) |
| Output | `dist` |

**Environment variables** (required at build time):

| Name | Example |
|------|---------|
| `VITE_SUPABASE_URL` | same as Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | anon key only |
| `VITE_MAP_API_URL` | `https://YOUR-SERVICE.onrender.com` (no trailing slash) |

Do **not** set `VITE_SHOW_DEMO_OWNER` on the public site.

Deploy → note URL e.g. `https://rentmate.vercel.app`.

### C. Wire origins (2 minutes)

1. **Render** → your API service → Environment → add  
   `CORS_ORIGINS=https://YOUR-VERCEL-URL.vercel.app`  
   → save (triggers redeploy).
2. **Supabase** → **Authentication → URL configuration** → **Site URL** = same Vercel URL.

### D. Smoke test

| Check | Pass? |
|-------|--------|
| Vercel site loads | ☐ |
| Home → **Live database check** → 12 amenities | ☐ |
| **Find a flat** → pins in Hong Kong | ☐ |
| Landlord → create account → add listing → pin appears | ☐ |
| Open Render `/api/health` → `"corsRestricted": true` | ☐ |

**Before presenting:** open the Render API URL once (~30 s) so the free tier wakes up.

---

## After go-live: ship fixes

```bash
git add -A && git commit -m "Describe change" && git push origin main
```

Vercel rebuilds the site (~1 min); Render rebuilds the API (~2–3 min). Changing any `VITE_*` variable requires a **new Vercel deploy**.

---

## 3-minute judge script

1. **Problem** — HK students pay agency fees and face scam channels; need compatible roommates + transparent flats (SDG 11).
2. **Student** — tenant path → quiz → open match → read compatibility summary → **Find a flat** → price context → **Ask Rent Mate**.
3. **Landlord** — owner path → sign in → **My listings** / add property on map.
4. **Honesty** — match score is calculated; narrative/assistant/plan are **placeholder GenAI** with production hook (`VITE_GENAI_MODE=api`); roommate chat is demo UI.

---

## If something breaks

See **[demo-user-guide.md → Troubleshooting](./demo-user-guide.md#troubleshooting)** (CORS, empty map, seed 401, slow first load on Render free tier).
