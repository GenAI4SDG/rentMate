---
name: rentmate-conventions
description: Project rules and conventions for RentMate, the Hong Kong student housing and roommate-matching platform. Load whenever working on RentMate code, docs, pitch material, or design. Covers stack choices, coding conventions, the ethics rules, and the scope lock.
---

# RentMate — Project Conventions

> ### 🧪 Branch note — `AI-random-bs-go` only
> This is a **solo methodology experiment** on an offshoot branch, not the team's
> working branch. On this branch the md planning docs this skill references
> (`PRD.md`, `TEAM-BRIEF.md`, `docs/site-spec-suite/`, `docs/build-plans.md`,
> `docs/interim-report-reconciliation.md`, `docs/open-decisions.md`,
> `docs/pitch-and-data-pack.md`, `HK_Rental_Platform_Master_Cursor_Spec.md`) were
> **removed on purpose**, and the product spec lives in
> **`vault/ips/IP.rentmate.v2.md`** (intent) + **`vault/cps/`** (contracts). On
> `main` everything below still applies unchanged — restore any file with
> `git checkout main -- <path>`. See `vault/NOTES.md`.

> ### ⚠️ The interim report outranks every markdown file here
> **`docs/GENAI SDG interim draft.pdf`** is the team-agreed statement of this project. Where any md file disagrees with it, the interim report wins. Change log: `docs/interim-report-reconciliation.md`.

**Two documents define this project:** `PRD.md` (the product) and `TEAM-BRIEF.md` (decisions, jobs, calendar, setup). Read the PRD for *what* and *why*, the brief for *what to do next*. This skill is the short version of the rules that must be followed on every task.

## What this project is

RentMate is **roommate matching and affordable housing for students in Hong Kong** — helping non-local students settle in quickly, with compatible roommates and no agency fee worth a month's rent.

Primary users: **non-local students who need to settle housing in Hong Kong quickly.**

**The four focuses, in this order — the agreed frame:**
1. **Compatibility** — we match users by their lifestyle and preferences
2. **Affordability** — no high agency fee that would cost 1 month of rent
3. **Transparency** — chatbot and neighbourhood guide covering the neighbourhood and the condition of the room
4. **Safety** (Trust and Privacy) — all users undergo identity verification; they must be a university student to access the platform

> **Discarded:** the old tagline *"verification is the product"* and the ranking *safety · convenience · transparency*. The report leads with compatibility and does not list convenience at all.

## Scope lock — do not add features

**In scope:** university-email verification as the access gate · lifestyle quiz · roommate matching with a GenAI compatibility narrative · filtered listings with price context and room condition info · sourced neighbourhood guide with citations · cached transparency chatbot · side-by-side comparison · multilingual output · extended flat-viewing meetup · generated settling-in plan.

**Out of scope — refuse to build these:**
HKID verification · acting on reviews · room tours guided by platform employees · dispute settlement · **legal advice** · services for landlords · payment system · 3D construction of the room · **verification of rental listings** (explicitly ruled out by the report) · native mobile app · face scanning · separate social or events platform · generated images of real flats · custom chat or video (connect to **Google Meet** instead).

If a request falls outside this list, say so and ask whether to change the scope — do not silently build it.

## Stack

- **Vite + React + TypeScript** (not Next.js — explicit routing is easier for this team)
- **Supabase** for Auth, Postgres, and **pgvector** for RAG
- **GenAI calls go through Supabase Edge Functions (Deno)** so API keys never reach the client
- **No deployment needed** — organisers confirmed localhost is accepted. Do not spend time on Vercel/Netlify.

**Repo status:** TypeScript migration is **done** (24 Sep) and `npm run typecheck` **passes** (25 Sep). Write `.tsx`, not `.jsx`.

### ⚠️ tsconfig is a Vite config, not a Node config — do not "fix" it back

`tsconfig.json` uses `"module": "esnext"` + `"moduleResolution": "bundler"` + `"types": ["vite/client"]` + `"noEmit": true` + `"include": ["src"]`. This is deliberate.

It previously had `"module": "nodenext"` (a Node setting), which forced explicit `.js` extensions on relative imports. That is why `main.tsx` once read `import App from './App.js'` — a symptom of the wrong setting, not a typo. If you see *"Relative import paths need explicit file extensions"*, **fix `moduleResolution`, not the import.** Also: never re-add `declaration`/`declarationMap` — they conflict with `noEmit`.

**Run `npm run typecheck` before every commit.** Vite does not typecheck, so without this the editor is your only safety net and errors ship silently.

## Deadline — the constraint that governs everything

**Build deadline and submission deadline are the same: ~18 October 2026.** There is no buffer. Treat it as **three weeks of building**.

**🛑 Code freeze: 14 October.** After that it is integration, the demo video, the write-up and submission only.

Practical consequences:
- When asked to add a feature after 14 October, **push back** and say it is post-freeze.
- Prefer a working thin path over a half-built ambitious one. Scope discipline outranks technical ambition here.
- The demo is **live**, so rehearsal matters more than polish. A recorded video is required as backup.

## Sustainability means ENVIRONMENTAL (SDG), not business viability

> ⚠️ **Not backed by the interim report** — the report does not mention sustainability at all. Treat this section as an unconfirmed position; confirm with the team before it goes on a slide.

Organisers confirmed this on 24 September. Do not frame sustainability as a revenue model.

The environmental case, and it is strong — **the matching engine is itself a carbon intervention**:
- Hong Kong buildings are **~90% of electricity consumption** and **over 60% of carbon emissions**. Building occupation is HK's highest-leverage climate lever.
- Shared housing is lower-carbon per person — one air-conditioning system, one fridge, one washing machine shared, not two. AC dominates residential load in HK's climate.
- **Better matching → longer tenancies → fewer moves.** A failed match causes a re-move; moving generates furniture waste and embodied carbon. Our own research flags *disposal responsibility* as one of the top-3 tenancy disputes in Hong Kong — that is the waste stream made visible.
- Faster matching reduces vacancy in a city with a 120,000-bed shortfall.
- SDG 11 targets **11.1** (adequate, safe, affordable housing) and **11.6** (environmental impact of cities); secondarily SDG 12 via resource sharing.

Business viability is worth **one sentence under feasibility only**. The report's revenue direction is **referral fees from licensed rental property agencies** and **licensing from universities** to unlock student verification — *not* "landlords pay for verified-tenant access".

## The four focuses — pitch them in this order

Compatibility → affordability → transparency → safety (trust and privacy).

> **Discarded: the SP1–SP4 tiering.** It is not in the report, and SP1 ("transparent listings **with reviews**") is contradicted by the report's boundary on **acting on reviews** and by the ruling-out of listing verification.

## Hard rules — never violate

> **1. Never put an API key, token, or secret in frontend code.** All model calls go through an Edge Function.
>
> **2. Never generate images of a real flat.** Generate narrative text about living there instead — commute, noise, amenities. Property photography stays authentic and unedited.
>
> **3. Never ship uncited legal or contractual guidance — and give no legal advice.** The report puts legal advice out of scope. Keep to "contract common sense" and sourced factual statements, each with a source link and a visible disclaimer.
>
> **4. Store verification as a boolean attestation only** — never the document. Verification is the **access gate** (university email is sufficient, per the report) and must be PDPO-compliant: purpose-limited, use-limited, clear consent. Delete any source image immediately after OCR.
>
> **5. Never present a model estimate as a measurement.** Every AI output shows a confidence indicator or a source.
>
> **6. Reports on people stay private and human-reviewed.** Never surface a report count on a profile. Review *properties*; report *people*.
>
> **7. Any published aggregate statistic requires a minimum cohort of 5 reports.** Below that, it de-anonymises individuals.
>
> **8. District information uses structured, sourced attributes only** — official statistics, commute times, amenities, noise. Never free-text opinions about an area, and never let the model characterise a neighbourhood's safety.
>
> **9. Demo with synthetic profiles only.** Never real student data.

## Coding conventions

- TypeScript everywhere. No `any` in shared types.
- Commit prefixes: `feat:`, `fix:`, `docs:`, `chore:`
- `.env.example` committed; `.env` gitignored
- `main` must always be demo-able. Remote is `https://github.com/GenAI4SDG/rentMate`. Feature branches **per person**, not per workstream: `p1/`, `p2/`, `p3/`
- Tag a working demo every Friday: `git tag demo-wN`
- **One person per file.** AI tools edit files directly, so two people on one file will collide. P2 owns `src/pages/` and `src/components/`; P3 owns `scripts/` and `corpus/`; P1 owns `supabase/` and `src/lib/`.

## The GenAI framing — be accurate

**Model: GPT-4o-mini**, used only where language generation adds significant value. Core matching and scoring are **deterministic**. Neighbourhood-guide responses are **cached**.

**Genuinely requires GenAI** (lead with these in any pitch):
- **Compatibility narrative** — why two people match, plus friction-point flagging. *The component the report names by model.*
- **Multilingual chatbot / neighbourhood guide** — RAG-grounded in sourced data, with disclaimers and cached responses
- Room size estimation — presented as a **range with a confidence level**, never a measurement
- Scam detection — presented as **"potential concerns"**, never definitive verdicts
- Day-in-the-life text generation
- Multilingual layer

**Not GenAI — never claim otherwise:**
- The lifestyle quiz (a form)
- The matching score (a deterministic weighted arithmetic sum)

Describe the matching honestly as "weighted scoring with an LLM-generated narrative". **Never cut the compatibility narrative** — it is focus #1 and the only GenAI component the report names.

> **Discarded:** the multimodal **listing audit** and **cited legal RAG** as the headline GenAI credentials. The report rules out verification of rental listings and puts legal advice out of scope.

## Evidence — cite accurately

Strong (n=41 survey, 20 Sep 2026): verified profiles 73% (#1 of 12 features) · compatibility matching 68% · trust verification 68% with only 2/41 detractors.

**The report's two individual-level findings:** **66%** of students are stressed about the shared expense of housing · **68%** gave up their preferred location for lack of a roommate.

**Structural:** 46% of first-batch Top Talent Pass holders left Hong Kong, housing friction a major factor · 120,000-bed shortfall projected by 2028 · R&VD index at a record **210.3** · 5,100 student bed spaces in commercial conversion.

> ⚠️ The 66% and 68% figures are the same survey items earlier drafts recorded as "expense stress — 27 detractors" and "gave up a location — 28 detractors" (27/41 = 66%; 28/41 = 68%). The report turns **detractor counts into headline percentages**. Check the question wording in `docs/SURVEY.pdf` before citing either — a detractor count and an agreement rate are not the same claim.

Caveats that must travel with any citation of our data: **51% of respondents live in a dormitory**, so reported housing pain is largely anticipated, not experienced. n=41, single self-selected survey — not generalisable.

## Where things live

Repo root is the Vite app (`src/`, `public/`, `package.json`). **Only two documents sit at the root** — everything else is `docs/`.

**The agreed position — read this first:**
- **`docs/GENAI SDG interim draft.pdf`** — the team-agreed interim report. **It outranks every md file here.** 23 questions: problem and scope, proposed solution, teamwork, progress, challenges, resources, learnings.
- `docs/interim-report-reconciliation.md` — the change log: every conflict found between the report and the md files, and what was discarded.

**The two working documents:**
- **`PRD.md`** (repo root) — **the product.** Problem, users, scope with depth levels, feature requirements F1–F8, the GenAI split, ethics rules, judging alignment, success metrics, risks. Read this before any product or scope question.
- **`TEAM-BRIEF.md`** (repo root) — **the working document.** Decisions already made, open decisions (D1–D8), what each person does, the build calendar, repo setup, shared-brain mechanics. Read this before starting work.

Reference only — no immediate action:
- `docs/hk-rental-partner-research.html` — market research with sources
- `docs/rentmate-scope-lock.html` — judging scorecard, design tensions, demo narrative
- `docs/rentmate-implementation-methods.html` — strategy routes and PCV validation
- `docs/build-plans.md` — the detailed per-feature build plans (files, scripts, Supabase boundary, acceptance tests) and the full dependency map. **Go here when you need file-level detail that `TEAM-BRIEF.md` §4–5 only summarises.**
- `docs/pitch-and-data-pack.md` — the full data pack (every citable number with its caveat) and the six-beat pitch structure. **Go here for slide work.**
- `docs/open-decisions.md` — a shorter decision list; its remaining live items are the AI spending cap and the demo logistics
- `docs/interim-report-reconciliation.md` — what changed when the md files were reconciled to the interim report
- `docs/GenAI.pdf`, `docs/SURVEY.pdf` — original project deck and raw survey data
- `.workbuddy-ai/memory/MEMORY.md` — project facts; **update it when you decide something**

> **Do not create new root-level documents.** The team rejected a sprawl of overlapping files. Product content goes in `PRD.md`, working content goes in `TEAM-BRIEF.md`, reference material goes in `docs/`.

## Working style expected here

- Be candid about what is validated versus assumed. This team values critical honesty over reassurance.
- Flag scope creep explicitly rather than accommodating it.
- When a request conflicts with a rule above, say which rule and why, then propose an alternative that works.
