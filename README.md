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
- **RLS is disabled** on all four tables (no `auth.users` ⇒ no `auth.uid()` to key
  a policy on). Demo-only trade, documented in `SETUP.md`.
- **No GenAI API is called anywhere.** Every AI-shaped feature is pre-written
  content badged "AI · demo" in the UI.
- **Chat and video are built in-house and stay in-app** — contact details are
  never exchanged, and there is no Google Meet hand-off.
- **No deployment needed** — organisers accept localhost

> Earlier revisions of this section described Supabase Auth, Edge-Function
> GenAI calls and a Google Meet hand-off. None of those ship. They are kept out
> of the codebase rather than left as aspirational comments.

## Getting started

**Demo UI (recommended):**

```bash
cd Figma
npm install
npm run dev
```

**Root app shell (integration work in progress):**

```bash
npm install
npm run dev
```

**Supabase backend:** see [`backend/README.md`](backend/README.md).

## Checks — run these before every commit

```bash
npm run typecheck   # tsc --noEmit — the important one
npm run lint
npm run build       # before each Friday demo
```

> **Vite does not typecheck.** `npm run dev` will happily serve code with type errors. Without `npm run typecheck` the editor is your only safety net and broken code reaches `main`.

## Working on this repo with WorkBuddy

This repo carries its own AI context. Open the repo folder in WorkBuddy and your session inherits it automatically:

- **`.workbuddy-ai/memory/MEMORY.md`** — the shared project brain. Update it when you *decide* something, not just when you build something.
- **`.workbuddy-ai/skills/rentmate-conventions/`** — our stack, conventions, ethics rules and scope lock.

> ⚠️ Do not delete `.workbuddy-ai/`. It is project data, not a cache. It **is** committed to git (see `.gitignore`).

## Branching

Remote: `https://github.com/GenAI4SDG/rentMate`

- `main` must always be demo-able
- **One branch per person:** `p1/`, `p2/`, `p3/`
- **One person per file** — AI tools edit files directly, so two people on one file collide
- Tag a working demo every Friday: `git tag demo-w1`
- `.env.example` is committed; `.env` is not
