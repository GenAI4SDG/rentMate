# RentMate — Demo user guide

**Audience:** teammates, judges, anyone running the hackathon demo
**Time:** ~5 minutes to set up · ~3 minutes to walk through the product

---

## What you are demoing

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

---

## Before the demo (once per machine)

### 1. Install Node.js

**Node.js 20+**, and **22** matches `.mise.toml`. Check:

```bash
node -v
npm -v
```

### 2. Run the app

```bash
cd Figma
npm install
npm run dev
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

---

## Demo script (3 minutes)

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
