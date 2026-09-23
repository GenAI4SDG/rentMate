# RentMate (GENAI_sdg)

**Verified trust infrastructure for student housing in Hong Kong** — helping non-local students find a verified flat and a compatible flatmate without paying an agent HK$5,000 for a listing they can't verify.

Hackathon entry · Track 3: Smart Living, Culture & Belonging · SDG 11

---

## Start here

| If you want to... | Read |
|---|---|
| Understand the project in 60 seconds | [`TEAM-BRIEF.md`](TEAM-BRIEF.md) §0 |
| Know what we're building and what we're not | [`TEAM-BRIEF.md`](TEAM-BRIEF.md) §4 (scope lock) |
| Know the rules you must not break | [`TEAM-BRIEF.md`](TEAM-BRIEF.md) §6 (ethics) |
| Set up your dev environment | [`TEAM-BRIEF.md`](TEAM-BRIEF.md) §7 |
| Know what to do this week | [`TEAM-BRIEF.md`](TEAM-BRIEF.md) §8 (four-week plan) |
| Understand the judging criteria | [`docs/rentmate-scope-lock.html`](docs/rentmate-scope-lock.html) |
| See the full market research | [`docs/hk-rental-partner-research.html`](docs/hk-rental-partner-research.html) |

**`TEAM-BRIEF.md` is the single source of truth.** If a decision isn't in that document, it isn't decided.

---

## Stack

- **Vite + React + TypeScript** (see `TEAM-BRIEF.md` §7 for the pending JS→TS migration)
- **Supabase** — Auth, Postgres, Storage, Realtime, Edge Functions, pgvector for RAG
- GenAI calls run in **Supabase Edge Functions** so API keys never reach the client
- Chat and video are **embedded** (Jitsi/Whereby), not built

## Getting started

```bash
npm install
npm run dev
```

## Working on this repo with WorkBuddy

This repo carries its own AI context. Open the repo folder in WorkBuddy and your session inherits it automatically:

- **`.workbuddy-ai/memory/MEMORY.md`** — the shared project brain. Update it when you *decide* something, not just when you build something.
- **`.workbuddy-ai/skills/rentmate-conventions/`** — our stack, conventions, ethics rules and scope lock. Auto-loads, so every teammate's assistant gives the same answers.

> ⚠️ Do not delete `.workbuddy-ai/`. It is project data, not a cache. It **is** committed to git (see `.gitignore`).

## Branching

- `main` must always be demo-able
- Feature branches per workstream: `ws1/`, `ws2/`, `ws3/`
- Tag a working demo every Friday: `git tag demo-w1`
- `.env.example` is committed; `.env` is not

## Open questions

Ten questions are pending with the organisers — see [`TEAM-BRIEF.md`](TEAM-BRIEF.md) §9. Several change what we build, so check before starting anything significant.
