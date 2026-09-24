---
name: rentmate-conventions
description: Project rules and conventions for RentMate, the Hong Kong student housing and roommate-matching platform. Load whenever working on RentMate code, docs, pitch material, or design. Covers stack choices, coding conventions, the ethics rules, and the scope lock.
---

# RentMate — Project Conventions

Read `TEAM-BRIEF.md` in the repo root for the full context. This skill is the short version that must be followed on every task.

## What this project is

RentMate is **verified trust infrastructure for student housing in Hong Kong**, delivered through compatibility matching. Compatibility is the mechanism; **verification is the product**.

Primary users: non-local university students and international newcomers in Hong Kong.

Three priorities, in order:
1. **Safety and privacy**
2. **Convenience** — everything in one app
3. **Transparency** — accurate, sourced information

## Scope lock — do not add features

**In scope:** student-ID verification · lifestyle quiz · roommate matching with GenAI narrative · filtered listings with multimodal audit · cited district briefs · side-by-side comparison · multilingual output · extended flat-viewing meetup · generated settling-in plan.

**Out of scope — refuse to build these:**
native mobile app · 3D room reconstruction · face scanning · payments · landlord portal · separate social or events platform · generated images of real flats · custom chat or video (embed Jitsi/Whereby instead).

If a request falls outside this list, say so and ask whether to change the scope — do not silently build it.

## Stack

- **Vite + React + TypeScript** (not Next.js — explicit routing is easier for this team)
- **Supabase** for Auth, Postgres, Storage, Realtime, Edge Functions, and **pgvector** for RAG
- **GenAI calls go through Supabase Edge Functions (Deno)** so API keys never reach the client
- Deploy frontend on Vercel or Netlify

**Repo status:** TypeScript migration is **done** (24 Sep) — `.tsx`, `tsconfig.json`, `@types/*` and `@supabase/supabase-js` are all in place. Write `.tsx`, not `.jsx`. Run `npm run typecheck` before committing (add the script if it's missing — it should be `"typecheck": "tsc --noEmit"`). TypeScript matters here specifically because Supabase's generated schema types are our main safety net, and they require TS.

## Deadline — the constraint that governs everything

**Build deadline and submission deadline are the same: ~18 October 2026.** There is no buffer. Treat it as **three weeks of building**.

**🛑 Code freeze: 14 October.** After that it is integration, the demo video, the write-up and submission only.

Practical consequences:
- When asked to add a feature after 14 October, **push back** and say it is post-freeze.
- Prefer a working thin path over a half-built ambitious one. Scope discipline outranks technical ambition here.
- The demo is **live**, so rehearsal matters more than polish. A recorded video is required as backup.

## Sustainability means ENVIRONMENTAL (SDG), not business viability

Organisers confirmed this on 24 September. Do not frame sustainability as a revenue model.

The environmental case, and it is strong — **the matching engine is itself a carbon intervention**:
- Hong Kong buildings are **~90% of electricity consumption** and **over 60% of carbon emissions**. Building occupation is HK's highest-leverage climate lever.
- Shared housing is lower-carbon per person — one air-conditioning system, one fridge, one washing machine shared, not two. AC dominates residential load in HK's climate.
- **Better matching → longer tenancies → fewer moves.** A failed match causes a re-move; moving generates furniture waste and embodied carbon. Our own research flags *disposal responsibility* as one of the top-3 tenancy disputes in Hong Kong — that is the waste stream made visible.
- Faster matching reduces vacancy in a city with a 120,000-bed shortfall.
- SDG 11 targets **11.1** (adequate, safe, affordable housing) and **11.6** (environmental impact of cities); secondarily SDG 12 via resource sharing.

Business viability is worth **one sentence under feasibility only**: landlords and operators pay for verified-tenant access. Never build a pitch section on it.

## Selling points are tiered — pitch them in this order

- **Tier 1 (core positioning): verified listings + verified persons.** This is what RentMate *is*. Lead here.
- **Tier 2 (originality + community/mental-health criterion): the GenAI guidebook, senior mentors, and one extended meetup.** Least evidenced — deliver as *information + one meetup*, never as a social network.
- **Tier 3 (side asset, never a headline): complaints and reviews packaged as regulator data.** Keep it as an internal design note with the guardrails in the rules above.

## Hard rules — never violate

> **1. Never put an API key, token, or secret in frontend code.** All model calls go through an Edge Function.
>
> **2. Never generate images of a real flat.** Generate narrative text about living there instead — commute, noise, amenities. Property photography stays authentic and unedited.
>
> **3. Never ship uncited legal or contractual guidance.** Every generated legal statement carries a source link and a visible disclaimer.
>
> **4. Store student-ID verification as a boolean attestation only** — never the document. Delete the source image immediately after OCR.
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
- `main` must always be demo-able. Feature branches per workstream: `ws1/`, `ws2/`, `ws3/`
- Tag a working demo every Friday: `git tag demo-wN`

## The GenAI framing — be accurate

**Genuinely requires GenAI** (lead with these in any pitch):
- Multimodal listing audit — photos → room dimensions, condition, stock-photo detection, price vs R&VD data
- Cited RAG over the Hong Kong corpus — R&VD data, EAA guidance, Lands Tribunal, stamp duty, tenancy terms, district statistics
- Compatibility narrative and friction-point flagging
- Day-in-the-life text generation
- Multilingual layer

**Not GenAI — never claim otherwise:**
- The lifestyle quiz (a form)
- The matching score (a weighted arithmetic sum)

Describe the matching honestly as "weighted scoring with an LLM-generated narrative".

## Evidence — cite accurately

Strong (n=41 survey, 20 Sep 2026): verified profiles 73% (#1 of 12 features) · compatibility matching 68% · trust verification 68% with only 2/41 detractors.

Weak — treat as noise: expense stress, gave-up-a-location, task tracking.

Caveats that must travel with any citation of our data: **51% of respondents live in a dormitory**, so reported housing pain is largely anticipated, not experienced. n=41, single self-selected survey — not generalisable.

## Where things live

Repo root is the Vite app (`src/`, `public/`, `package.json`). Documents live alongside it:

- `TEAM-BRIEF.md` (repo root) — single source of truth for decisions
- `README.md` (repo root) — orientation and how to work in this repo
- `docs/rentmate-scope-lock.html` — judging criteria, design tensions, ethics gaps, demo script
- `docs/rentmate-implementation-methods.html` — strategy routes and PCV validation
- `docs/hk-rental-partner-research.html` — market research with sources
- `docs/GenAI.pdf`, `docs/SURVEY.pdf` — original project deck and raw survey data
- `.workbuddy-ai/memory/MEMORY.md` — project facts; **update it when you decide something**

## Working style expected here

- Be candid about what is validated versus assumed. This team values critical honesty over reassurance.
- Flag scope creep explicitly rather than accommodating it.
- When a request conflicts with a rule above, say which rule and why, then propose an alternative that works.
