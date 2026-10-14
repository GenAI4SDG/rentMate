# RentMate (GENAI_sdg)

**Roommate matching and affordable housing for students in Hong Kong** — helping non-local students settle in quickly, with compatible roommates and no agency fee worth a month's rent.

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

---

## Stack

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

## Getting started

There are **two** npm projects in this repo with **different scripts**. Read the
heading before you copy a command.

### The demo app — `Figma/` (this is the product)

```bash
cd Figma
npm install
cp .env.example .env.local   # optional — see below
npm run dev
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

```bash
npm install
npm run dev
```

### The backend — `backend/`

Not a service you run for the demo. See
[`backend/supabase/SETUP.md`](backend/supabase/SETUP.md).

## Checks — run these before every commit

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

## Working on this repo with WorkBuddy

This repo carries its own AI context. Open the repo folder in WorkBuddy and your session inherits it automatically:

- **[`.workbuddy-ai/memory/MEMORY.md`](.workbuddy-ai/memory/MEMORY.md)** — the shared project brain. Update it when you *decide* something, not just when you build something.
- **`.workbuddy-ai/skills/rentmate-conventions/`** — our stack, conventions, ethics rules and scope lock.

> ⚠️ Do not delete `.workbuddy-ai/`. It is project data, not a cache. It **is** committed to git (see `.gitignore`).

## Branching

Remote: `https://github.com/GenAI4SDG/rentMate`

- `main` must always be demo-able
- **One branch per person:** `p1/`, `p2/`, `p3/`
- **One person per file** — AI tools edit files directly, so two people on one file collide
- Tag a working demo every Friday: `git tag demo-w1`
- `.env.example` is committed; `.env` is not
