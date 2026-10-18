# RentMate — Demo, setup & hosting guide

**Audience:** teammates, judges, anyone running the hackathon demo
**Time:** ~5 minutes to set up · ~3 minutes to walk through the product
**Audience:** teammates, judges, anyone running or deploying the app  
**Time:** ~5 minutes to run locally · ~20 minutes to put it online  

**Hackathon shortcut (public URL only):** [`go-live.md`](./go-live.md)

---

## What the app does

**RentMate** helps Hong Kong students find **compatible roommates** and explore
**affordable flats**, supporting **SDG 11** (sustainable cities and communities).

| Part | Folder | What it shows |
| --- | --- | --- |
| **Interactive app (the product)** | `Figma/` | The full flow — quiz, matching, chat, flats |
| **Root app shell** | repo root `src/` | Five-file placeholder, not the product |
| **Backend** | `backend/` | Supabase schema. Optional for the demo |

For a presentation, run **`Figma/`** only. Mention Supabase if you have pushed
the migrations and want to show the dashboard.

> **Presenting from a slide?** The deck needs a **clickable link**, so deploy
> first — see [`HOSTING.md`](HOSTING.md). A localhost URL cannot go in a deck.
**RentMate** helps Hong Kong **student tenants** find **compatible roommates** and **affordable flats**, and lets **landlords / flat owners** publish and manage listings on a map — SDG 11.

| Audience | Journey |
|----------|---------|
| **Student tenant** | Email gate → quiz → matches with a compatibility summary → messages (+ Google Meet / viewing-meetup shortcuts) → **Find a flat** map with price context → **My plan** settling-in checklist → **Ask Rent Mate** assistant |
| **Landlord / owner** | Create account or sign in → **My listings** (mark rented, relist, remove) → **Add a listing** (address pinned on the map) |

| Part | Folder |
|------|--------|
| Web app (React + Vite) | `Figma/` |
| Map API (Express) + Supabase schema + Edge Function stubs | `backend/` |

---

## Environment files (secrets)

Git ignores all `.env.local` files; only `*.env.example` templates are committed.

**Node.js 20+**, and **22** matches `.mise.toml`. Check:
| Create | Copy from | Used for |
|--------|-----------|----------|
| `Figma/.env.local` | `Figma/.env.example` | Browser: `VITE_SUPABASE_*`, map/GenAI settings |
| `backend/server/.env.local` | `backend/server/.env.example` | Map API, seed, landlord writes — **service_role here only** |

Never put `SUPABASE_SERVICE_ROLE_KEY` or `sb_secret_*` in Figma. Use legacy **service_role** `eyJ…` or **`sb_secret_…`**, not **`sb_publishable_…`**.

---

## Run locally

```bash
# 1. Database (once)
cd backend && supabase link --project-ref YOUR_REF && supabase db push

### 2. Run the app
# 2. Map API (terminal 1) — after creating backend/server/.env.local
cd backend/server        # if you are already in backend/, use: cd server
npm install
npm run dev              # :3001
npm run seed:listings    # once: demo owner "testing" + 50 Hong Kong listings

# 3. Web app (terminal 2) — after creating Figma/.env.local
cd Figma
npm install
npm run dev              # http://localhost:8443  (proxies /api → :3001)
```

Open **<http://localhost:8443>**.

> The port is **8443**, not the Vite default 5173. `Figma/vite.config.ts` sets
> `port: 8443` with `strictPort: true`, so if something else is on 8443 the
> server **exits with an error** instead of moving to the next port. Kill the
> other process rather than expecting a different URL.

### 3. Sign in

| Address | What you get |
| --- | --- |
| **`demo@cuhk.edu.hk`** | The curated cast — named people, place stories, and a pre-seeded saved-homes page with a booked viewing and a cancelled one |
| any `@<hk-institution>.edu.hk` on the allowlist | The generic pool |

There is **no password and no email is sent.** The domain is the whole gate.

### 4. Optional — Supabase

Only if you want real persistence and two-browser chat:

```bash
cd backend/supabase
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

Then put the two variables in `Figma/.env.local` and restart. The **header shows
the mode** — `supabase` or `local`. If it says `local` when you expected
`supabase`, the variables did not reach the build; see
[`../backend/supabase/SETUP.md`](../backend/supabase/SETUP.md).

**The demo works fully in local mode.** Nothing in the walkthrough below needs
the backend.
**Landlord login:** in dev the landlord sign-in has a one-click **“Try the demo owner testing”** button (`testing@rentmate.local`, password `rentmate-testing-demo`, created by the seed). Real owners use **Create an owner account**.

> **Supabase email setting:** owner sign-up works instantly only if **Authentication → Providers → Email → “Confirm email”** is **off**. Leave it on and new owners must click the email link first (Supabase’s built-in mailer is rate-limited to a few emails per hour).

---

## Demo script (~3 min)

1. **Landing** — "Meet your kind of people." Explain SDG 11 and student housing
   in Hong Kong.
2. **Start matching** → enter `demo@cuhk.edu.hk` → continue.
3. **Quiz** — 20 questions across 5 sections (17 screens; some pair two related
   questions). Worth pausing on:
   - **"Which areas would you actually consider?"** — pick two or three and the
     **area guide** appears under each: the vibe and who tends to live there.
     This is the AI area suggester, working as you choose.
   - The progress dots under the card are the screens.
4. **Matches** — the card opens with **one thing you two have in common**.
   - React to the hook, then **Say hi** → straight into the chat.
   - **See profile** shows the full profile; **Not for me** discards.
   - Discard someone and the deck moves on without bouncing the page. Work
     through the deck and it tells you your top recommendations are exhausted,
     then shows people outside your non-negotiables **with the reason why**.
5. **Messages** — send a short message. Discarded people are not here: no
   connection, no conversation.
6. **Find a flat** — the tab has five real filters and a real Hong Kong map
   (drag to pan, scroll to zoom). Open a listing:
   - **Send to chat** → pick which conversation gets it.
   - **Book a viewing with the agent** → the status becomes *viewing booked* and
     the agent replies.
   - **Saved homes** → the demo account already has an agent thread showing a
     **booking that fell through**, which is the point: a status you can trust.
7. **3D walkthrough** — the optional wow moment. It is a labelled mock, so say so.

**Say clearly:** profiles and listings are **synthetic demo data**, and every
AI-shaped feature is **pre-written content** badged "AI · demo". The matching
score is real and deterministic; the narrative around it is not model-generated.
**Student:** Landing → *I’m a student tenant* → `student@cuhk.edu.hk` → quiz → open a match (read **Where you align / Worth talking about**) → **Connect** → try **Start a Google Meet** → **Find a flat** (pick a pin, see price context) → **My plan** → open **Ask Rent Mate** ("How do I spot a scam?").

**Landlord:** Landing → *I’m a landlord or flat owner* → sign in → **Add a listing** → it appears on the map and in **My listings** → **Mark rented** → pin disappears for students.

**Say clearly:** roommate profiles are **seeded**; the match score is a **weighted calculation**; the narrative, assistant and plan are currently a **rule-based placeholder** with the LLM hookup ready (see *GenAI* below); map listings are real database rows.

---

## GenAI: placeholder now, LLM later

All AI features go through one interface (`Figma/src/lib/genai/`):

| Feature | Placeholder today | Real AI later |
|---------|-------------------|---------------|
| Compatibility narrative (match modal) | Built from your quiz answers + the match’s tags | `POST {URL}/narrative` |
| Rental assistant (floating button) | Keyword-matched Hong Kong renting FAQ with disclaimer | `POST {URL}/chat` |
| Settling-in plan (**My plan** tab) | Personalised checklist | `POST {URL}/settling-plan` |

To switch on a real model: build those three endpoints (e.g. Supabase Edge Functions that hold `OPENAI_API_KEY`), return the JSON shapes in `genai/types.ts`, then set **`VITE_GENAI_MODE=api`** and **`VITE_GENAI_API_URL`** and redeploy. If your endpoint fails, the app falls back to the placeholder, so a live demo never breaks. Existing stubs to start from: `backend/supabase/functions/rental-chatbot`, `analyze-agreement`.

---

## Put it online

Three pieces: **Supabase** (already cloud) · **map API** (Node host) · **website** (static host).

```
Browser ─▶ your-site.vercel.app        (Figma/dist, static)
       ├─▶ rentmate-map-api.onrender.com  (/api/*)
       └─▶ xxxx.supabase.co            (Auth + Postgres)
```

### Recommended: Render (API) + Vercel (website), both free

**1. Push the code to GitHub** (`GenAI4SDG/rentMate`).

**2. Deploy the map API on [Render](https://render.com)** → *New → Web Service* → pick the repo:

| Setting | Value |
|---------|--------|
| Root directory | `backend/server` |
| Build command | `npm install --include=dev && npm run build` |
| Start command | `npm start` |
| Health check path | `/api/health` |
| Env vars | `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `OSM_USER_AGENT` |

Note the URL, e.g. `https://rentmate-map-api.onrender.com`. Check `…/api/health` returns `{"ok":true,…}`. (Or use [`render.yaml`](../render.yaml): *New → Blueprint* creates both services at once.)

**3. Deploy the website on [Vercel](https://vercel.com)** → *Add New → Project* → pick the repo:

| Setting | Value |
|---------|--------|
| Root directory | `Figma` |
| Framework / build | Vite · `npm run build` · output `dist` (auto-detected) |
| Env vars (build-time) | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_MAP_API_URL=https://rentmate-map-api.onrender.com` |

You get `https://<project>.vercel.app`. `Figma/vercel.json` already handles page refreshes.

**4. Lock down and finish:**
- On Render, add **`CORS_ORIGINS=https://<project>.vercel.app`** (redeploys the API) so only your site can call it.
- In Supabase → **Authentication → URL Configuration**, set **Site URL** to the Vercel URL.
- Seed once from your laptop if you have not: `cd backend/server && npm run seed:listings`.
- Keep `VITE_SHOW_DEMO_OWNER` **unset** on the public site (otherwise anyone can edit the 50 sample listings through the demo owner).

**5. Verify:** open the site → home page *Live database check* shows 12 amenities → **Find a flat** shows pins → create an owner account → add a listing.

### Updating the live site after it is online

Yes — you can keep changing it. Vercel and Render watch your GitHub repo:

```bash
git add -A && git commit -m "Describe the change" && git push origin main
```

- **Website** (`Figma/`): Vercel rebuilds and swaps in the new version in ~1 minute. Pushing a **branch** gives a private **preview URL** to test before merging.
- **Map API** (`backend/`): Render redeploys in ~2–3 minutes; the first request after idle on the free tier takes ~30 s (it sleeps).
- **Database changes**: add a migration and run `cd backend && supabase db push` — it is separate from code deploys.
- **Env var changes**: Vercel/Render only apply them after a **redeploy** (`VITE_*` values are baked in at build time).
- **Mistake?** Vercel → *Deployments → Promote* an earlier build; Render → *Rollback*.
- `.github/workflows/ci.yml` builds, type-checks and tests every push and PR so a broken change is flagged immediately.

**Other hosts:** Netlify or Cloudflare Pages work for the website (root `Figma`, output `dist`, add an SPA rewrite to `/index.html`); Railway or Fly.io work for the API (same build/start commands).

---

## Backend — what you can test today

| Where | What |
|-------|------|
| Home page → **Backend test** | `amenities` read through Supabase (+ active listing count) |
| `GET /api/health` | API up, Supabase configured, CORS restricted? |
| Landlord dashboard | Auth → create / update / remove listings (ownership enforced) |
| Supabase → Tables | `profiles`, `properties`, `amenities`, storage buckets |

**In the database but not wired to the UI yet:** favourites, viewing requests, conversations/messages, agreement AI (see [`backend/README.md`](../backend/README.md)).

---

## Troubleshooting

| Problem | Fix |
| --- | --- |
| `command not found: npm` | Install Node.js |
| `command not found: vite` | Run `npm install` inside `Figma/` |
| `Port 8443 is already in use` | `strictPort` is on by design — stop the other process, or run `PORT=8444 npm run dev` |
| Blank page | Check the terminal for errors; open the browser console |
| Header says `local` | Expected without env vars. Set `VITE_SUPABASE_*` in `Figma/.env.local` and restart |
| Data disappears between browsers | The app is in local mode — data is per-browser by design |
| `npm run typecheck` → "Missing script" | That script is at the **repo root**. Inside `Figma/` use `npx tsc --noEmit` |
| Map tiles do not load | Needs internet. The app shows an offline notice instead of failing silently |
| Red squiggles on `.sql` files | Disable the **SQL Server (mssql)** extension for this workspace; the files are **PostgreSQL** |

---

## Share with teammates

```bash
git pull origin main
cd Figma && npm install && npm run dev
```

Repo: `https://github.com/GenAI4SDG/rentMate`

Do **not** commit `.env.local` or API keys. `Figma/.env.example` is the template.

---

## More documentation

| Document | Purpose |
| --- | --- |
| [README.md](../README.md) | Project overview and how to run it |
| [HOSTING.md](HOSTING.md) | Put it on a public URL for the deck |
| [backend/supabase/SETUP.md](../backend/supabase/SETUP.md) | Database setup, schema drift, RLS position |
| [backend/README.md](../backend/README.md) | Backend folder layout and what is a stub |
| [demo-user-guide.md](demo-user-guide.md) | This file |
|---------|-----|
| `cd backend/server` from inside `backend/` | Use `cd server` |
| Seed: missing SERVICE_ROLE | Add to **`backend/server/.env.local`** only |
| Seed: 401 / Bearer token | Wrong key — use **service_role** `eyJ…` or **`sb_secret_…`**, not publishable or anon |
| Owner sign-in: “Invalid login credentials” | Wrong password, or the account needs email confirmation (see Supabase email setting above) |
| “Sign in required” / “Invalid or expired session” | Sign out and back in; API needs `SUPABASE_SERVICE_ROLE_KEY` to verify sessions |
| Map empty locally | Map API on :3001? Seed run? Zoom to Hong Kong |
| Map works locally, empty online | Set **`VITE_MAP_API_URL`** at **build** time; redeploy the website |
| Browser console: CORS error online | `CORS_ORIGINS` must exactly match the website origin (no trailing slash) |
| First map load online is slow | Render free tier was asleep — open it a minute before presenting |
| Build OK but **Exited with status 1** / `Missing Supabase credentials` | Add `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` on the **Render API** service → Environment → Save → redeploy |
| Red squiggles on `.sql` files | Disable the **SQL Server (mssql)** extension for this workspace |

---

## More

| Document | Purpose |
|----------|---------|
| [README.md](../README.md) | Overview, checklist, quick start |
| [PRD.md](../PRD.md) · [TEAM-BRIEF.md](../TEAM-BRIEF.md) | Product scope · roles & decisions |
| [backend/README.md](../backend/README.md) | Supabase layout, map API, Edge Functions |

Repo: `https://github.com/GenAI4SDG/rentMate` — never commit `.env.local` or API keys.
