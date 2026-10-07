# Project Memory — RentMate (HK rental / roommate matching)

## ⚠️ THE AUTHORITY: the interim report (1 October 2026)

**`docs/GENAI SDG interim draft.pdf`** is the team-reviewed, team-agreed statement of this project. **It outranks every markdown file in this repo.** On 1 October every md file was reconciled to it and conflicting content was removed. Change log: **`docs/interim-report-reconciliation.md`**.

**The four focuses, in order:**
1. **Compatibility** — match users by lifestyle and preferences
2. **Affordability** — no high agency fee that would cost 1 month of rent
3. **Transparency** — chatbot + neighbourhood guide covering the neighbourhood and the condition of the room
4. **Safety** (Trust and Privacy) — all users undergo identity verification; they must be a university student to access the platform

**What the report settled, and what it killed:**

| Report position | What it replaced |
|---|---|
| **Compatibility is focus #1** | The tagline *"verification is the product"* — **discarded** |
| **Affordability is focus #2** ("no high agency fee = 1 month rent") | The rule *"don't say we save students money"* — **discarded** |
| **GPT-4o-mini**, only where language generation adds value (compatibility narrative); **deterministic** matching/scoring; **cached** neighbourhood-guide responses | The open "which model do we pay for" decision — **resolved** |
| **Listing verification is ruled out** — *"rule out verification of rental listings for now"* | The multimodal listing audit as "the demo centrepiece / our GenAI credential" — **discarded** |
| **Google Meet** + photo galleries + pre-recorded video walkthrough requests | Jitsi / Whereby — **discarded** |
| **University email is sufficient** for safety and trust; verification is the **access gate** | Student-card OCR as the rail; unverified users may browse — **discarded** |
| **Boundaries:** HKID verification · acting on reviews · employee-guided room tours · dispute settlement · **legal advice** · services for landlords · payment system · 3D room construction | The earlier cut list — **superseded** |
| **Target:** non-local students settling housing in HK quickly. **Client:** universities / higher-ed institutions. **Revenue:** referral fees from licensed rental agencies + licensing from universities | "Landlords pay for verified-tenant access" — **discarded** |
| **R&VD index 210.3** (record high) · **5,100** student bed spaces in commercial conversion | 207.4 — **superseded** |
| **66%** stressed about shared housing expense · **68%** gave up preferred location | "27 detractors / 28 detractors — weak, treat as noise" — **promoted to headline** |
| **Student community** is an objective; community moderation is critical | "Belonging ships as information + one meetup, not a social platform" — **softened** |
| Multilingual content validation for **Mandarin, Korean, Japanese, French** | "English + Chinese only" — **widened** |
| **Team = two groups** (research & design; technical development); weekly online meetings | — |

**Not in the report — kept but flagged as unconfirmed:** the environmental sustainability argument (90% electricity / >60% carbon), the "mismatch not shortage" framing, the ~70% health framing, the PCV 18/24 score, and all the repo/TypeScript engineering detail.

> ⚠️ **Integrity flag on the two promoted figures.** 66% = 27/41 and 68% = 28/41 — the same survey items earlier drafts recorded as *detractor counts* and explicitly labelled "weak, treat as noise". The report re-expresses them as headline percentages. **Check the question wording in `docs/SURVEY.pdf` before either goes on a slide.** The team values critical honesty; this is the one place where the report may be over-reading its own data.

## Repository — THE canonical location

**`C:\Users\Trinity\Programmes\GENAI_sdg`** — this is the shared team repo (the one VS Code has open). All project work happens here.

- Vite + **React 19** scaffold, `package.json` name `genai-sdg`
- Git commits: `init_empty` → `initial instructions and data` → `change to typescript` → `update markdown and tsx file format`
- **Remote IS configured:** `https://github.com/GenAI4SDG/rentMate`, `main` tracks `origin/main` (confirmed 25 Sep)
- **TypeScript — migration DONE (24 Sep), and typecheck now PASSES (25 Sep).**

### ⚠️ tsconfig was wrong — fixed 25 Sep

The original `tsconfig.json` was a **Node** config (`"module": "nodenext"`, `"types": []`, `rootDir`/`outDir`/`declaration` set, no `include`). Wrong for a Vite browser app. It caused three cascading errors and silently broke `App.tsx` (0 bytes) and `main.tsx` (which had a `'./App.js'` workaround for the wrong setting).

**Fixed to:** `"module": "esnext"` + `"moduleResolution": "bundler"` + `"lib": ["ES2022","DOM","DOM.Iterable"]` + `"types": ["vite/client"]` + `"noEmit": true` + `"include": ["src"]` + dropped `declaration`/`declarationMap`.

**Verified:** `tsc --noEmit` exit 0 · `vite build` succeeds · `eslint .` clean.

**Lesson for the team:** the `'./App.js'` import in a `.tsx` file was a *symptom*, not a typo. When TS complains about import extensions in a Vite project, check `moduleResolution` before editing the import.

> ⚠️ The WorkBuddy workspace at `C:\Users\Trinity\WorkBuddy AI\2026-09-19-14-44-57` was only the scratch space where the documents were drafted. The repo above is where everything now lives.

### Repo layout

```
GENAI_sdg/
├── PRD.md                     ← THE PRODUCT. Requirements, scope, GenAI split, ethics
├── TEAM-BRIEF.md              ← THE WORKING DOC. Decisions, open items, jobs, calendar, setup
├── README.md                  ← orientation, points at PRD + TEAM-BRIEF
├── docs/                      ← reference: market research, judging scorecard,
│                                 build-plans.md, pitch-and-data-pack.md, source PDFs
├── .workbuddy-ai/             ← shared AI context (COMMITTED)
│   ├── memory/MEMORY.md
│   └── skills/rentmate-conventions/SKILL.md
├── src/ public/ package.json  ← the Vite app
```

## ⏰ Deadline — build and submission are the SAME

**~18 October 2026.** No submission buffer. Effectively **three weeks of building**, not 3.5.

**🛑 Code freeze: 14 October.** Everything after is integration, demo video, write-up, submission. If a feature isn't working on 14 Oct it isn't in the demo.

## ✅ TypeScript — migration DONE (24 Sep) · tsconfig FIXED (25 Sep)

Repo is on `.tsx` with `tsconfig.json`, `typescript`, `@types/react`, `@types/react-dom`, `@typescript-eslint/*`, and `@supabase/supabase-js` all installed.

**`"typecheck": "tsc --noEmit"` is now in `package.json` scripts.** Run it before every commit and every Friday demo.

**`App.tsx` was 0 bytes and is now a real app shell** (default export, so `main.tsx` resolves). `src/vite-env.d.ts` added. Root element guarded in `main.tsx`. See the tsconfig warning above for the root cause.

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

> ⚠️ **(unconfirmed by the interim report)** — the report does not mention sustainability at all. Kept because it answers the "sustainability and ethics" criterion, but **confirm with the team before it goes on a slide**.

An earlier version of the brief assumed "sustainability" meant business viability and recommended leading with a revenue model. **That was wrong.** It means the SDG / environmental dimension.

**The corrected environmental argument (now a strength, not a gap):**
- **Context**: Hong Kong buildings = **~90% of electricity consumption** and **over 60% of carbon emissions** (HKSAR Carbon Neutrality Office). So building occupation is HK's highest-leverage climate lever.
- **Mechanism 1**: Shared housing is lower-carbon per person — one AC system, one fridge, one washing machine shared. AC is the dominant residential load in HK's subtropical climate.
- **Mechanism 2 (the original insight)**: **Better matching → longer tenancies → fewer moves.** A failed match causes a re-move, and moving generates furniture waste + embodied carbon. Our own research flags *disposal responsibility* as one of the top-3 tenancy disputes in HK — that's the waste stream, visible. **The matching engine is itself an environmental intervention.**
- **Mechanism 3**: Faster matching reduces vacancy in a city with a 120,000-bed shortfall.
- **SDG mapping**: SDG 11 targets 11.1 (adequate, safe, affordable housing) and 11.6 (environmental impact of cities); secondarily SDG 12 via resource sharing.

Business viability survives as **one sentence under feasibility only**. **Superseded revenue direction (report): referral fees from licensed rental property agencies + licensing from universities** to unlock student verification — *not* "landlords/operators pay for verified-tenant access". Do not build a pitch section on it.

## Selling points — SUPERSEDED by the four focuses

> **The SP1–SP4 tiering below is discarded** (1 Oct 2026). The interim report frames the project as **four focuses in order: compatibility · affordability · transparency · safety (trust and privacy)**. SP1 ("transparent listings **with reviews**") is contradicted by the report's boundary on **acting on reviews** and by the ruling-out of listing verification. Kept here only as a record of what was previously decided.

- **Tier 1 — core positioning: SP1 + SP2.** Verified listings + verified persons. Lead the pitch here.
- **Tier 2 — originality + community/mental-health criterion: SP3.** GenAI guidebook + senior mentors + meetups. Least evidenced, so deliver as *information + one extended meetup*, not a social network.
- **Tier 3 — side asset, NOT a headline: SP4.** Complaints/reviews packaged as regulator data. Internal design note only; keep reports private and human-reviewed, aggregate data behind the min-cohort threshold. Because it's no longer a headline claim, the earlier "self-defeating" objection is now just an internal constraint.

## Team composition and roles (confirmed 24 Sep)

**4 people.** Requirement is 3–5, so we're compliant.

| Person | Background | Role | Notes |
|---|---|---|---|
| **P1** | Coder, **no web experience** | Platform — Supabase, schema, auth, Edge Functions, env vars, demo fallback caching | Also owns corpus ingestion into pgvector |
| **P2** | Coder, **no web experience** | Frontend — React, the 4 screens, component library, AI-output display | The visible half |
| **P3** | Data-analytics + business minor | GenAI & Data — corpus, embeddings, retrieval, prompts, audit accuracy, **impact quantification** | Can work independently of the web app (see decoupling note) |
| **P4** | Medical student (year 1) | Product & Ethics + Demo & Pitch — **scope guardian**, ethics section, **health framing**, demo script, video | Runs user interviews |

### ⚠️ The critical path risk

**Two beginner coders building React + Supabase + GenAI in three weeks is genuinely tight.** Stack is still the right call (switching now costs days we don't have) — the mitigation is ruthless scope, not a stack change.

Key mitigations:
- **Demo path thinned to 4 screens**: (1) sign in + verify student, (2) lifestyle quiz, (3) matched roommates **with the GenAI compatibility narrative**, (4) listing detail with the neighbourhood guide and price context. Everything else is described, not built.
- **Starter template with auth pre-wired** (Supabase's official React quickstart), not our bare scaffold
- **Tailwind + shadcn/ui** — no custom CSS from scratch (biggest hidden time sink for beginners)
- Mandatory 2-day learning sprint in Block 1
- **The 2am cut order**: comparison → multilingual → chat → settling-in plan. **Never cut the compatibility narrative** — it is focus #1 and the only GenAI component the report names by model (GPT-4o-mini). *(Superseded: the earlier rule "never cut the listing audit" — listing verification is ruled out.)*

### ⭐ The decoupling insight (biggest scheduling win)

**P3 does not need to wait for React to exist.** Corpus, embeddings, retrieval and prompt iteration can all be built and tested independently — in a Python notebook, or directly in Supabase Studio with SQL. The coders then just call a finished Edge Function. This takes the GenAI work off the critical path and makes P3 productive from day one.

### Why the non-coders are load-bearing, not spare capacity

- **P3's impact quantification task**: estimate residential energy/carbon avoided if N students shift from single-occupancy to shared housing, grounded in the HK figure (buildings = ~90% electricity, >60% carbon). Turns the environmental claim from an assertion into a number. **Data-analytics job, not a coding job.**
- **P4 (medical)**: (1) the health framing — housing stress as a psychosocial determinant of student mental health, earning the community/mental-health criterion with evidence; (2) the ethics section — medical training covers consent, anonymity, minimum cohort sizes and avoiding stigmatisation, mapping almost 1:1 onto our ethics rules; (3) user interviews — clinical communication is trained interviewing.

**If anyone leaves the kickoff meeting without a defined workstream, the role assignment has failed.**

## Planning documents — TWO at root, rest in `docs/` (restructured 26 Sep)

The team said the long decision lists were unusable — nobody wants to read ~70 decisions across several documents. **Keep documents short and bulleted.** Any agenda is a reference, never followed in order.

**Restructure performed 26 Sep:** six overlapping documents at the root were collapsed into two. The four redundant files were **moved (not deleted) into `docs/`** so nothing was lost.

| File | What it is | Status |
|---|---|---|
| **`docs/GENAI SDG interim draft.pdf`** | **The team-agreed interim report.** 23 questions covering problem and scope, proposed solution, teamwork, progress, challenges, resources, learnings. **Outranks every md file.** | **Authority** |
| `docs/interim-report-reconciliation.md` | Change log — every conflict found between the report and the md files, and what was discarded | Reference |
| **`PRD.md`** | **The product.** Problem, users, scope with depth levels, F1–F8 requirements, GenAI split, ethics rules, judging alignment, metrics, risks. Deliberately contains **no meeting tasks or person assignments.** | **Primary — root** |
| **`TEAM-BRIEF.md`** | **The working document.** Decisions made (14), open decisions D1–D8, jobs per person, build calendar, repo setup, shared-brain mechanics, citable evidence. Deliberately contains **no product scope or feature requirements** — those are in the PRD. | **Primary — root** |
| `docs/build-plans.md` | Formerly `FEATURE-PLANS.md`. File-level build plans, Supabase boundary, dependency map, acceptance tests | Reference |
| `docs/pitch-and-data-pack.md` | Formerly `PITCH-OUTLINE.md`. Full data pack with every caveat, six-beat pitch structure | Reference |
| `docs/open-decisions.md` | Formerly `OPEN-DECISIONS.md`. Superseded by `TEAM-BRIEF.md` §2 | Superseded |
| `docs/rentmate-scope-lock.html` · `docs/rentmate-implementation-methods.html` · `docs/hk-rental-partner-research.html` · `docs/GenAI.pdf` · `docs/SURVEY.pdf` | Judging scorecard · strategy routes + PCV 18/24 · market research · original deck · raw survey | Reference |

**The split rule going forward:** product content → `PRD.md`. Working content (decisions, jobs, dates, setup) → `TEAM-BRIEF.md`. Neither duplicates the other. **Do not create new root-level documents.**

> **Note for future sessions:** the user asked for the PRD with people/meeting content excluded, and then for `TEAM-BRIEF.md` to hold everything actionable with everything else removed. Respect that separation — do not let scope creep back into the brief or job lists creep into the PRD.

**Deleted 25 Sep (permission granted to remove outdated files):** `PLANNING.md` (superseded by `FEATURE-PLANS.md` + `OPEN-DECISIONS.md`) and `MEETING-1-AGENDA.md` (team confirmed agendas are reference-only and will not be followed in order).

## What this project is

**RentMate** — AI-powered roommate matching + affordable housing for students and international newcomers in Hong Kong.

- Hackathon entry, **Track 3: Smart Living, Culture & Belonging**, **SDG 11** (Sustainable Cities and Communities)
- Social issue framing: equitable access to housing information and roommate matching for youth and international newcomers through a trusted digital community
- End goal stated in the deck: *"Fast onboarding → find a roommate and a house in days, not weeks"* — **(unconfirmed by the interim report)**

## Key files

- `GenAI.pdf` — project deck: 6-problem breakdown, target users (primary: non-local students; secondary: existing tenants with spare rooms, landlords, university housing offices), market data, 3 solution approaches (MatchFirst / TrustFirst / AllInOne), AI component list, scope-control list, and the 22-question quiz spec (Section A lifestyle ×10, Section B housing ×8, Section C budget ×4)
- `SURVEY.pdf` — nomination survey, n=41, collected 20 Sep 2026
- `hk-rental-partner-research.html` — HK rental market research briefing
- `rentmate-implementation-methods.html` — 3 implementation methods + PCV validation

## Judging criteria and priorities

- **Judging criteria**: (1) convincing framing of problem, (2) prototype/demo, (3) appropriate technical component **requiring GenAI**, (4) feasibility and impact, (5) **sustainability and ethics**
- **Scorecard** (assessed in `docs/rentmate-scope-lock.html`): criterion 1 Strong; criteria 2 and 3 **At risk**; criteria 4 and 5 Mixed
- **Team's stated priorities** — *superseded by the report's four focuses* (compatibility · affordability · transparency · safety). The old ranking (1 safety+privacy, 2 convenience, 3 transparency) is **discarded**: the report does not list convenience at all.

## Established technical decisions

- Verification rail: **university email is sufficient** for safety and trust (report). All users must be a university student **to access the platform**. Student-card OCR via vision model is an addition, **unconfirmed by the report**. HKID verification and face scanning are out of scope. LLM (GPT-4o-mini) for the compatibility narrative.
- Delivery: **responsive web app, not native mobile** (deck's scope decision). English-first UI, chatbot answers in any language.
- Verification data stored as a **boolean attestation, never the source document** — PDPO exposure.
- **No deploy needed** — organisers accept localhost. Skip Vercel/Netlify.

## Conventions

- Working documents live in the repo as **Markdown**; deeper analyses are **self-contained HTML** in `docs/`, light theme, no external dependencies, print-friendly.
- **Keep team-facing documents short.** The team rejected long decision lists — anything for them is bullets, under half an A4 page. Agendas are reference only and will never be followed in order or word-for-word.
- When sources disagree on figures, **report both rather than averaging**.
- Distinguish clearly between *validated* and *assumed* claims; the user values critical honesty over reassurance.
- The user edits repo files directly in VS Code — **read before editing**, and expect their changes.

## Recommended sequencing (longer-term, if the project continues past the hackathon)

Stage 1 Trust utility → Stage 2 Campus rail → Stage 3 Operator hybrid. See `docs/rentmate-implementation-methods.html`.

## Team collaboration mechanism

- `TEAM-BRIEF.md` (repo root) is the single source of truth for decisions.
- **Commit `.workbuddy-ai/memory/` and `.workbuddy-ai/skills/` to the repo** so every teammate's WorkBuddy session inherits identical context. This is the "compress context" mechanism.
- `.workbuddy-ai/skills/rentmate-conventions/SKILL.md` is a **project-level skill** encoding stack, conventions, ethics rules and scope lock — auto-loads for teammates.
- `.gitignore` written to keep memory+skills but exclude secrets and local session state.
- **One person per file** — WorkBuddy edits files directly, so parallel edits conflict. Split by workstream.
- Tag a working demo every Friday: `git tag demo-wN`.

## Deliverables in the repo

| File                                                 | What it is                                              |
| ---------------------------------------------------- | ------------------------------------------------------- |
| `PRD.md`                                             | **THE PRODUCT** — problem, users, scope, F1–F8 requirements, GenAI split, ethics, judging alignment, metrics, risks |
| `TEAM-BRIEF.md`                                      | **THE WORKING DOC** — decisions made, open D1–D8, jobs per person, build calendar, repo setup, shared-brain mechanics, citable evidence |
| `README.md`                                          | Repo orientation; reading order for a new teammate      |
| `docs/build-plans.md`                                | File-level build plans and the Supabase boundary (was `FEATURE-PLANS.md`) |
| `docs/pitch-and-data-pack.md`                        | Full data pack + six-beat pitch structure (was `PITCH-OUTLINE.md`) |
| `docs/open-decisions.md`                             | Superseded decision list (was `OPEN-DECISIONS.md`)      |
| `.workbuddy-ai/skills/rentmate-conventions/SKILL.md` | Project skill for team-wide convention consistency      |
| `docs/rentmate-scope-lock.html`                      | Judging scorecard, tensions, ethics gaps, demo script   |
| `docs/rentmate-implementation-methods.html`          | 3 implementation routes + PCV validation (18/24)        |
| `docs/hk-rental-partner-research.html`               | HK market research with sources                         |
| `docs/GenAI.pdf`, `docs/SURVEY.pdf`                  | Original project deck and raw survey data               |
