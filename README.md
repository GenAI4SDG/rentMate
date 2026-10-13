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
| **Know what the product is meant to be** — the validated intent tree | [`vault/ips/IP.rentmate.v2.md`](vault/ips/IP.rentmate.v2.md) |
| **See the agent's honest take** — the drift found, what was overruled, what was deleted | [`vault/NOTES.md`](vault/NOTES.md) |
| **See the contracts** (deterministic functions, with test oracles) | [`vault/cps/`](vault/cps/) |
| **Run the hackathon demo** | [`docs/demo-user-guide.md`](docs/demo-user-guide.md) — start in the **`Figma/`** app |
| Read the original deck and raw survey | [`docs/GenAI.pdf`](docs/GenAI.pdf) · [`docs/SURVEY.pdf`](docs/SURVEY.pdf) |

**Key dates:** build + submission both **~18 October** · **code freeze 14 October**.

---

## Stack

- **Vite + React + TypeScript** ✅ (migrated 24 Sep, typecheck passing 25 Sep)
- **Supabase** — Auth, Postgres, Edge Functions, pgvector for RAG
- GenAI calls run in **Supabase Edge Functions** so API keys never reach the client
- Chat and video are **not built in-house** — the app connects to **Google Meet**
- **No deployment needed** — organisers accept localhost

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
