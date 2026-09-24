# Project Memory — RentMate (HK rental / roommate matching)

## Repository — THE canonical location

**`C:\Users\Trinity\Programmes\GENAI_sdg`** — this is the shared team repo (the one VS Code has open). All project work happens here.

- Vite + **React 19** scaffold, `package.json` name `genai-sdg`
- Git commits: `init_empty` → `initial instructions and data` → `change to typescript`. **No git remote configured yet.**
- **TypeScript — migration DONE (24 Sep).** See below.

> ⚠️ The WorkBuddy workspace at `C:\Users\Trinity\WorkBuddy AI\2026-09-19-14-44-57` was only the scratch space where the documents were drafted. The repo above is where everything now lives.

### Repo layout

```
GENAI_sdg/
├── README.md                  ← orientation, points to TEAM-BRIEF.md
├── TEAM-BRIEF.md              ← single source of truth for decisions
├── docs/                      ← reference documents + source PDFs
├── .workbuddy-ai/             ← shared AI context (COMMITTED)
│   ├── memory/MEMORY.md
│   └── skills/rentmate-conventions/SKILL.md
├── src/ public/ package.json  ← the Vite app
```

## ⏰ Deadline — build and submission are the SAME

**~18 October 2026.** No submission buffer. Effectively **three weeks of building**, not 3.5.

**🛑 Code freeze: 14 October.** Everything after is integration, demo video, write-up, submission. If a feature isn't working on 14 Oct it isn't in the demo.

## ✅ TypeScript — migration DONE (24 Sep)

Repo is on `.tsx` with `tsconfig.json`, `typescript`, `@types/react`, `@types/react-dom`, `@typescript-eslint/*`, and `@supabase/supabase-js` all installed.

**Still missing — add today:** `"typecheck": "tsc --noEmit"` in `package.json` scripts, and confirm `"strict": true` in `tsconfig.json`. Run typecheck before every commit and every Friday demo — without running it, TS only helps inside the editor.

## Organiser answers (resolved 24 Sep) — full table in TEAM-BRIEF.md §9

| # | Answer | Impact |
|---|---|---|
| 1 | **Any GenAI inclusion expected**; no tech/cloud blacklist | GenAI is a *scored requirement*, not garnish |
| 2 | **localhost is fine** | No deploy work needed. Skip Vercel/Netlify |
| 3 | **Live demo**, video recommended as backup; non-software projects need no demo | Record a video — insurance against a dead laptop |
| 4 | **No API blacklist**; arranging access is good | Maps/transit + R&VD open data are fair game — start in Block 1 |
| 5 | **Synthetic profiles fine** | No demo-data privacy blocker |
| 6 | **4 people** (req. 3–5); collab allowed, not default | Workstreams mapped to 4 people |
| 7 | **Same deadline, 3.5 weeks (~18 Oct)** | ⚠️ Biggest constraint. Code freeze 14 Oct |
| 8 | **No datasets provided** — we source our own | Corpus assembly is fully on us; slower than it looks |
| 9 | IP probably ours | Not a blocker |
| 10 | **"Sustainability" = environmental (SDG)** | ⚠️ Corrects an earlier wrong assumption — see below |

## ⚠️ CORRECTION: sustainability is ENVIRONMENTAL, not business viability

An earlier version of the brief assumed "sustainability" meant business viability and recommended leading with a revenue model. **That was wrong.** It means the SDG / environmental dimension.

**The corrected environmental argument (now a strength, not a gap):**
- **Context**: Hong Kong buildings = **~90% of electricity consumption** and **over 60% of carbon emissions** (HKSAR Carbon Neutrality Office). So building occupation is HK's highest-leverage climate lever.
- **Mechanism 1**: Shared housing is lower-carbon per person — one AC system, one fridge, one washing machine shared. AC is the dominant residential load in HK's subtropical climate.
- **Mechanism 2 (the original insight)**: **Better matching → longer tenancies → fewer moves.** A failed match causes a re-move, and moving generates furniture waste + embodied carbon. Our own research flags *disposal responsibility* as one of the top-3 tenancy disputes in HK — that's the waste stream, visible. **The matching engine is itself an environmental intervention.**
- **Mechanism 3**: Faster matching reduces vacancy in a city with a 120,000-bed shortfall.
- **SDG mapping**: SDG 11 targets 11.1 (adequate, safe, affordable housing) and 11.6 (environmental impact of cities); secondarily SDG 12 via resource sharing.

Business viability survives as **one sentence under feasibility only** (landlords/operators pay for verified-tenant access). Do not build a pitch section on it.

## Selling points are TIERED (confirmed 24 Sep)

- **Tier 1 — core positioning: SP1 + SP2.** Verified listings + verified persons. Lead the pitch here.
- **Tier 2 — originality + community/mental-health criterion: SP3.** GenAI guidebook + senior mentors + meetups. Least evidenced, so deliver as *information + one extended meetup*, not a social network.
- **Tier 3 — side asset, NOT a headline: SP4.** Complaints/reviews packaged as regulator data. Internal design note only; keep reports private and human-reviewed, aggregate data behind the min-cohort threshold. Because it's no longer a headline claim, the earlier "self-defeating" objection is now just an internal constraint.

## What this project is

**RentMate** — AI-powered roommate matching + affordable housing for students and international newcomers in Hong Kong.

- Hackathon entry, **Track 3: Smart Living, Culture & Belonging**, **SDG 11** (Sustainable Cities and Communities)
- Social issue framing: equitable access to housing information and roommate matching for youth and international newcomers through a trusted digital community
- End goal stated in the deck: *"Fast onboarding → find a roommate and a house in days, not weeks"*

## Key files

- `GenAI.pdf` — project deck: 6-problem breakdown, target users (primary: non-local students; secondary: existing tenants with spare rooms, landlords, university housing offices), market data, 3 solution approaches (MatchFirst / TrustFirst / AllInOne), AI component list, scope-control list, and the 22-question quiz spec (Section A lifestyle ×10, Section B housing ×8, Section C budget ×4)
- `SURVEY.pdf` — nomination survey, n=41, collected 20 Sep 2026
- `hk-rental-partner-research.html` — HK rental market research briefing
- `rentmate-implementation-methods.html` — 3 implementation methods + PCV validation

## The 4 agreed selling points (user-defined)

1. Full, transparent flat listings like Airbnb, with reviews
2. Fast logistical / habits-based filtering of verified persons, using student IDs
3. Gen-AI in-depth legal and cultural guidebook, with seniors and real-world meetups
4. Sending complaints (anonymised) to relevant authorities or landlords

**Evidence status**: SP2 strongest (verified profiles 73%, trust verification 68%). SP1 moderate. **SP3 and SP4 have no direct survey evidence — treat as hypotheses.** SP4 as originally worded has a design flaw (anonymity destroys the leverage of a complaint); use the aggregate-intelligence + templated-escalation reframe instead.

## Established technical decisions

- Verification rail: **student ID + university email** (deck's choice). Face scanning and 3D room reconstruction were explicitly ruled OUT of scope by the deck. Student-card OCR via vision model; LLM for compatibility narrative.
- Delivery: **responsive web app, not native mobile** (deck's scope decision). English-first UI, chatbot answers in any language.
- Verification data should be stored as a **boolean attestation, never the source document** — PDPO exposure.

## Conventions

- Deliverables are **self-contained HTML**, light theme, no external dependencies, print-friendly.
- When sources disagree on figures, **report both rather than averaging**.
- Distinguish clearly between *validated* and *assumed* claims; the user values critical honesty over reassurance.

## Recommended sequencing (agreed direction)

Stage 1 Trust utility → Stage 2 Campus rail → Stage 3 Operator hybrid. See `rentmate-implementation-methods.html`.

## Hackathon constraints (confirmed 23 Sep 2026)

- **1 month** to ideate + prototype
- **Judging criteria**: (1) convincing framing of problem, (2) prototype/demo, (3) appropriate technical component requiring GenAI, (4) feasibility and impact, (5) sustainability and ethics
- **Scorecard**: criterion 1 Strong; criteria 2 and 3 **At risk**; criteria 4 and 5 Mixed
- Team's stated priorities: 1 safety+privacy, 2 convenience (all-in-1), 3 transparency

## Tech stack (decided)

Vite + React + TypeScript + Supabase (Auth, Postgres, Storage, Realtime, Edge Functions, **pgvector** for RAG). GenAI calls via Supabase Edge Functions so keys stay server-side. Embed Jitsi/Whereby for chat/video — do not build. Deploy on Vercel/Netlify.

**Known risk**: nobody on the team has real React or Supabase experience. Mitigation: Week 1 is a learning week (Supabase + React quickstart before project code), start from an official starter template, keep the demo path razor-thin.

## Team collaboration mechanism

- `TEAM-BRIEF.md` (repo root) is the single source of truth for decisions.
- **Commit `.workbuddy-ai/memory/` and `.workbuddy-ai/skills/` to the repo** so every teammate's WorkBuddy session inherits identical context. This is the "compress context" mechanism.
- `.workbuddy-ai/skills/rentmate-conventions/SKILL.md` is a **project-level skill** encoding stack, conventions, ethics rules and scope lock — auto-loads for teammates.
- `.gitignore` written to keep memory+skills but exclude secrets and local session state.
- **One person per file** — WorkBuddy edits files directly, so parallel edits conflict. Split by workstream.
- Tag a working demo every Friday: `git tag demo-wN`.

## Roles (workstreams, scale to team size)

WS1 Platform (Supabase/auth/schema/Edge Functions/deploy) · WS2 Frontend (React/design) · WS3 GenAI (corpus/prompts/vision/RAG) · WS4 Product & Ethics (scope guardian) · WS5 Demo & Pitch.  
**WS4 — the scope guardian — is the single most important role.** One person must have authority to reject off-path features.

## Open questions sent to organisers

Mandated/forbidden technologies and GenAI provider · deployed URL required or localhost OK · judging format and whether judges read code · external API permissions · demo data privacy expectations · team size and cross-team collaboration · submission vs build deadline · pre-approved datasets · IP ownership · whether "sustainability" means environmental or business viability.

## Deliverables (all committed in the repo)

| File                                                 | What it is                                              |
| ---------------------------------------------------- | ------------------------------------------------------- |
| `TEAM-BRIEF.md`                                      | Single consolidated team document — the source of truth |
| `README.md`                                          | Repo orientation; points at TEAM-BRIEF.md               |
| `.workbuddy-ai/skills/rentmate-conventions/SKILL.md` | Project skill for team-wide convention consistency      |
| `docs/rentmate-scope-lock.html`                      | Judging scorecard, tensions, ethics gaps, demo script   |
| `docs/rentmate-implementation-methods.html`          | 3 implementation routes + PCV validation (18/24)        |
| `docs/hk-rental-partner-research.html`               | HK market research with sources                         |
| `docs/GenAI.pdf`, `docs/SURVEY.pdf`                  | Original project deck and raw survey data               |
