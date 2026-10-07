# RentMate (GENAI_sdg)

**Roommate matching and affordable housing for students in Hong Kong** — helping non-local students settle in quickly, with compatible roommates and no agency fee worth a month's rent.

Hackathon entry · Track 3: Smart Living, Culture & Belonging · SDG 11

> ### ⚠️ The interim report is authoritative
> **`docs/GENAI SDG interim draft.pdf`** is the team-agreed statement of this project. Where any markdown file disagrees with it, the interim report wins. Change log: `docs/interim-report-reconciliation.md`.

---

## Start here

Two documents. Everything else is reference.

| If you want to... | Read |
|---|---|
| **Know the agreed position** — the team's interim report, which outranks everything else here | [`docs/GENAI SDG interim draft.pdf`](docs/GENAI%20SDG%20interim%20draft.pdf) |
| **See what changed** when the md files were reconciled to it | [`docs/interim-report-reconciliation.md`](docs/interim-report-reconciliation.md) |
| **Understand the product** — what we're building, for whom, what's in and out of scope, the GenAI split, the ethics rules | [`PRD.md`](PRD.md) |
| **Know what to do next** — decisions already made, what's still open, your job, the calendar, setup | [`TEAM-BRIEF.md`](TEAM-BRIEF.md) |
| See the full market research with sources | [`docs/hk-rental-partner-research.html`](docs/hk-rental-partner-research.html) |
| See the judging scorecard and demo narrative | [`docs/rentmate-scope-lock.html`](docs/rentmate-scope-lock.html) |
| See the longer-term strategy routes | [`docs/rentmate-implementation-methods.html`](docs/rentmate-implementation-methods.html) |
| Read the original deck and raw survey | [`docs/GenAI.pdf`](docs/GenAI.pdf) · [`docs/SURVEY.pdf`](docs/SURVEY.pdf) |

**Reading order for a new teammate:** `PRD.md` §1–5 → `TEAM-BRIEF.md` §4 (your job) → `TEAM-BRIEF.md` §6 (setup). That is all you need to start.

**Key dates:** build + submission both **~18 October** · **code freeze 14 October**.

---

## Stack

- **Vite + React + TypeScript** ✅ (migrated 24 Sep, typecheck passing 25 Sep)
- **Supabase** — Auth, Postgres, Edge Functions, pgvector for RAG
- GenAI calls run in **Supabase Edge Functions** so API keys never reach the client
- Chat and video are **not built in-house** — the app connects to **Google Meet**, with photo galleries and pre-recorded video walkthrough requests as alternatives
- **No deployment needed** — organisers accept localhost

## Getting started

```bash
npm install
npm run dev
```

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
- **`.workbuddy-ai/skills/rentmate-conventions/`** — our stack, conventions, ethics rules and scope lock. Auto-loads, so every teammate's assistant gives the same answers.

> ⚠️ Do not delete `.workbuddy-ai/`. It is project data, not a cache. It **is** committed to git (see `.gitignore`).

## Branching

Remote: `https://github.com/GenAI4SDG/rentMate`

- `main` must always be demo-able
- **One branch per person:** `p1/`, `p2/`, `p3/`
- **One person per file** — AI tools edit files directly, so two people on one file collide
- Tag a working demo every Friday: `git tag demo-w1`
- `.env.example` is committed; `.env` is not

## Organiser questions

All ten were answered on 24 September — full table in [`TEAM-BRIEF.md`](TEAM-BRIEF.md) §3. Only the pitch-deck and interim-report requirements are still outstanding.
