# RentMate — AI brief. quite inaccurate.

**What we're building, what we're doing about it, and when.**

> **Everything that describes the *product* lives in [`PRD.md`](PRD.md).** Problem, users, scope, feature requirements, the GenAI split, ethics rules, judging alignment. This document does not repeat it.
>
> **This document is only the working document:** the decisions already made, what is still open, what each person does, the calendar, and the setup facts you need before writing code.

**Last updated:** 26 September 2026 · **Status:** building · **Code freeze 14 October** · **Submission ~18 October**

---

## 0. Read this first (60 seconds)

**The product.** A web app that helps non-local students in Hong Kong find a verified flat and a compatible flatmate without paying an agent HK$5,000 for a listing they cannot verify.

**The positioning sentence, used verbatim everywhere:**

> RentMate is verified trust infrastructure for student housing in Hong Kong. Compatibility matching is how we deliver it. **Verification is the product.**

**The time.** Build deadline and submission deadline are the **same** — no buffer. That is **three weeks of building**, not three and a half.

**What kills this project.** Two things, both avoidable:

1. **The GenAI claim.** If we pitch "AI matching" and the implementation is a weighted sum, we lose the one criterion that explicitly requires GenAI. **Lead with the listing audit and the cited RAG layer.**
2. **Scope creep.** Eight features is already more than three weeks. Anything not on the demo path does not get built.

**Reading order:** `PRD.md` §1–5 (what and why) → `TEAM-BRIEF.md` §4 (my job) → the relevant section of §5.

---

## 1. Decisions already made — do not re-litigate

| #  | Decision                                                                                                                                                                 | What it constrains                                                                                                                                                                         |
| -- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1  | **Positioning:** verified trust infrastructure, delivered through matching                                                                                               | Not "a roommate-matching app". Not "community living" — the #1 complaint about shared living is privacy (17/41). Position as *"find the least-bad flatmate fast, and get your own space."* |
| 2  | **Selling points are tiered** — Tier 1 SP1+SP2 (verified listings, verified persons), Tier 2 SP3 (guidebook/mentors), Tier 3 SP4 (complaints → data, internal note only) | Pitch time is allocated by tier. SP4 never appears as a headline.                                                                                                                          |
| 3  | **Scope is locked** to eight features, with an explicit refusal list and a defined cut order                                                                             | See `PRD.md` §5. New feature requests get one question: *is this on the demo path?*                                                                                                        |
| 4  | **The GenAI split is stated honestly** — the audit and the RAG layer are the credential; the quiz and the matching score are not GenAI                                   | Never claim the weighted score is AI. Say *"weighted scoring, with an LLM-generated narrative."*                                                                                           |
| 5  | **Verification rail is university email + student-card OCR**                                                                                                             | Face scanning and 3D reconstruction are out — the deck ruled them out and that call was right.                                                                                             |
| 6  | **Store a boolean attestation, never the document.** Delete the source image immediately after OCR                                                                       | PDPO exposure. Non-negotiable.                                                                                                                                                             |
| 7  | **Report people, review properties.** Reports stay private and human-reviewed, never counted on a profile                                                                | The right ethical line and the strongest ethics talking point.                                                                                                                             |
| 8  | **Video is gated behind a mutual match**                                                                                                                                 | A safety control, not a feature. Lead with it in the safety section.                                                                                                                       |
| 9  | **Sustainability means ENVIRONMENTAL (SDG), not business viability**                                                                                                     | Corrected on 24 Sep. The matching engine is itself a carbon intervention. Business viability is one sentence under feasibility only.                                                       |
| 10 | **Belonging ships as information + one extended meetup**, not a social platform                                                                                          | No separate events app. No new cold-start. No physical-safety risk.                                                                                                                        |
| 11 | **Matching uses seeded profiles and says so**                                                                                                                            | Judges respect acknowledged simulation far more than a fake live pool.                                                                                                                     |
| 12 | **Responsive web, not native mobile.** No deploy — localhost is accepted                                                                                                 | Do not spend time on Vercel/Netlify.                                                                                                                                                       |
| 13 | **Chat and video are embedded** (Jitsi/Whereby), never built                                                                                                             |                                                                                                                                                                                            |
| 14 | **Synthetic profiles only in the demo**                                                                                                                                  | Organiser-confirmed. No real student data, ever.                                                                                                                                           |

---

## 2. Open decisions — settle these first

Numbered so we can just refer to "D3".

### Before anyone writes feature code

| #      | Decision                                                                                                                                                                          | Why it's urgent                                              | Proposal                                                                      |
| ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ | ----------------------------------------------------------------------------- |
| **D1** | **Which AI model do we pay for, and what is the hard spending cap?**                                                                                                              | Every AI feature is blocked until this number exists         | —                                                                             |
| **D2** | **Where does data live, and who may touch it?** Three things persist — who is verified, quiz answers, and the roommate matches. Everything else stores nothing and reads nothing. | If left open, everyone waits on whoever sets up the database | Agree the boundary; one person owns the database, three build without waiting |
| **D3** | **Who owns which files?**                                                                                                                                                         | Two AI tools editing one file silently overwrite each other  | Whole features per person, in separate folders — see §4                       |

### Before the first Friday demo

| #      | Decision                                                      | Why it matters                                                                       | Proposal                                                  |
| ------ | ------------------------------------------------------------- | ------------------------------------------------------------------------------------ | --------------------------------------------------------- |
| **D4** | **Do we commit what we have?**                                | There is no working demo tagged, and a broken laptop currently costs a week          | Commit now                                                |
| **D5** | **Which single machine is the demo machine?**                 | A demo that works on one machine cannot be handed to a presenter                     | Name it today, use it for every rehearsal                 |
| **D6** | **Who presents live, and who records the backup video?**      | The demo is live with no submission buffer. A dead laptop with no video scores zero. | Separate people — the video is insurance, not a formality |
| **D7** | **Do we add maps and transport data to the district briefs?** | Strengthens F4.6 and F4.7. Permitted by organisers, but costs time to arrange.       | Decide rather than drift                                  |

### Whenever the organisers reply

| #      | Decision                                    | Why it waits                                                                               |
| ------ | ------------------------------------------- | ------------------------------------------------------------------------------------------ |
| **D8** | **Pitch deck and interim report structure** | Requirements not yet received. The underlying work is not blocked — only the packaging is. |

> **D1 is the one nobody owns yet.** Whoever holds the AI budget picks the provider. Decide it first, or all GenAI work stalls.

---

## 3. Organiser answers — resolved 24 Sep, do not re-ask

| #  | Question                                          | Answer                                                                  | What it changes                                                                      |
| -- | ------------------------------------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| 1  | Mandated/forbidden tech? Required GenAI provider? | **Any GenAI inclusion expected. No blacklist.**                         | GenAI is a **scored requirement, not garnish**. No provider constraints.             |
| 2  | Deployed URL or localhost?                        | **localhost is fine.**                                                  | Skip deploy and CORS debugging entirely.                                             |
| 3  | Judging format?                                   | **Live demo.** Video recommended as backup.                             | **Record a video.** Rehearsal matters more than polish.                              |
| 4  | External APIs permitted?                          | **No blacklist. Arranging access is good.**                             | Maps/transit and R\&VD open data are fair game. Arrange in Block 1.                  |
| 5  | Synthetic profiles acceptable?                    | **Yes.**                                                                | No demo-data privacy blocker.                                                        |
| 6  | Team size / cross-team collaboration?             | **4 people** (requirement 3–5). Collaboration allowed, not the default. | We're compliant. Treat collaboration as a targeted unblock.                          |
| 7  | Submission vs build deadline?                     | **Same, ~18 Oct.**                                                      | ⚠️ **The biggest constraint.** Three weeks of building. Code freeze 14 Oct.          |
| 8  | Pre-approved datasets?                            | **None. We source our own.**                                            | Corpus assembly is entirely on us and is slower than it looks. **Start in Block 1.** |
| 9  | IP ownership?                                     | **Probably ours.**                                                      | Not a blocker.                                                                       |
| 10 | "Sustainability" — environmental or business?     | **Environmental — it's the SDG.**                                       | ⚠️ Corrects an earlier wrong assumption. Business viability moves under feasibility. |

---

## 4. What each person does

Listed so nobody has to ask. Work in any order; **one person per file.**

| Person                           | Owns                                                                                                           | Their first tasks                                                                                                                                                                                                                                                          |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **P1 — Platform**                | `supabase/migrations/*`, `supabase/functions/verify-student/`, `src/lib/supabaseClient.ts`, `src/lib/types.ts` | 1. Create the one file that defines our data shapes, so everyone codes against the same definitions — **this blocks everyone, do it first.** 2. Create the Supabase project and invite the other three. 3. Get auth working end to end.                                    |
| **P2 — Frontend**                | `src/pages/*`, `src/components/*`, `src/App.tsx`                                                               | 1. Install routing and styling libraries. 2. Build the four demo screens: sign-in/verify, quiz, matches, listing detail.                                                                                                                                                   |
| **P3 — GenAI & Data**            | `corpus/*`, `scripts/*.py`, `src/fixtures/*`, `src/lib/matching.ts`, the GenAI functions                       | 1. Write the sample data — 10 fake student profiles and 8 fake flats. **Matching and listings cannot be tested without these.** 2. Assemble the Hong Kong reference corpus the AI answers from. 3. Build and test retrieval locally — this does not need the app to exist. |
| **P4 — Product, Ethics & Pitch** | `PRD.md`, `TEAM-BRIEF.md`, ethics content, appendix specs in `docs/`                                           | 1. Run the user interviews. 2. Own the pitch narrative and demo script. 3. Guard the scope — see below.                                                                                                                                                                    |

### The most important role is scope guardian

One person must have explicit authority to say **"that is not on the demo path, we are not building it."** In a three-week build, scope discipline predicts success better than technical skill. If nobody owns this, the project fails in week 3.

### The rule that prevents conflict

> **One person per file.** AI tools edit files directly; two people on one file will collide. P2 owns everything under `src/pages/` and `src/components/`. P3 owns `scripts/` and `corpus/`. P1 owns `supabase/` and `src/lib/`.
>
> The only shared file is `src/lib/types.ts`, frozen once by P1 before anyone builds.

### Everyone complete a Supabase + React quickstart before writing project code

Two days, and it is not optional. Nobody on the team has real React or Supabase experience. Starting from an official starter template is the mitigation — do not scaffold auth, routing or DB clients by hand.

---

## 5. The build — critical path

Each block ends with a **working demo, however ugly.** If Friday's demo doesn't run, the next block starts by fixing it.

### Block 1 — 24–30 Sep · Foundations

**Everyone:** complete the Supabase + React quickstart (2 days).  
**Then:** freeze the data contracts • create the Supabase project • draft the schema • auth skeleton working • start the RAG corpus • first page rendered end to end • **freeze the feature list.**

> Scope discipline is won or lost in this block.


### Block 2 — 1–7 Oct · Verification, quiz, matching

Auth, student-card OCR, university email verification **storing attestation only** • the ~12-question quiz • weighted scoring • GenAI compatibility narrative • **build the seeded profile set now** so the matching demo is rehearsable early • GenAI calls working server-side with keys out of the client.  
**Milestone:** a user can sign up, verify, take the quiz, and see matched profiles.

### Block 3 — 8–13 Oct · The listing layer (the demo centrepiece)

Filters • multimodal listing audit • price-fairness check against R\&VD data • district briefs with visible citations • side-by-side comparison • multilingual layer.

> **This block decides the technical score. Protect it.** If Block 2 overruns, cut from Block 4 — never from here.

### Block 4 — 14–18 Oct · Integration, ethics, submission

**14 Oct: code freeze.** After that: wire chat and video, the extended meetup, the settling-in plan • write the ethics and sustainability section • **record the demo video** • rehearse the live demo at least three times, once with someone deliberately interrupting • **18 Oct: submit.**

> **If a feature is not working on 14 October it is not in the demo.** Teams lose hackathons by shipping a broken feature at 2am instead of a working one at midnight.

---

## 6. Before you write code — repo setup

### Stack

| Layer        | Choice                                                                      |
| ------------ | --------------------------------------------------------------------------- |
| Frontend     | **Vite + React + TypeScript** — migrated 24 Sep, `typecheck` passing 25 Sep |
| Backend / DB | **Supabase** — Auth, Postgres, Edge Functions, pgvector for RAG             |
| GenAI calls  | **Supabase Edge Functions** so API keys never reach the client              |
| Chat / video | **Embed Jitsi or Whereby**                                                  |
| Hosting      | **Not required** — localhost accepted                                       |

### Commands

```bash
npm install
npm run dev
```

| Script                  | When                                        |
| ----------------------- | ------------------------------------------- |
| `npm run dev`           | Always                                      |
| **`npm run typecheck`** | **Before every commit** — the important one |
| `npm run lint`          | Before every PR                             |
| `npm run build`         | Before each Friday demo                     |

> **Vite does not typecheck.** `npm run dev` will happily serve code with type errors. Without `npm run typecheck` the editor is your only safety net and broken code reaches `main`.

### ⚠️ The tsconfig trap — it is a Vite config, do not "fix" it back

`tsconfig.json` uses `"module": "esnext"` + `"moduleResolution": "bundler"` + `"types": ["vite/client"]` + `"noEmit": true` + `"include": ["src"]`. **This is deliberate.**

It was originally a **Node** config (`"module": "nodenext"`), which forced explicit `.js` extensions on relative imports in a Vite browser app. That is why `main.tsx` once read `import App from './App.js'`, and why `App.tsx` sat empty. Both were **symptoms, not typos**.

> If TypeScript complains *"Relative import paths need explicit file extensions"*, **fix `moduleResolution`, not the import.** Never re-add `declaration` / `declarationMap` — they conflict with `noEmit`.

**Why TypeScript matters here:** generated types from the database schema make every query type-checked. Rename a column or misspell a field and the editor says so immediately, instead of a silent `undefined` in week 3.

### Branching

Remote: `https://github.com/GenAI4SDG/rentMate`

```bash
git checkout -b p1/platform
git checkout -b p2/frontend
git checkout -b p3/genai
```

- `main` must always be demo-able — never commit broken code
- Small PRs, one reviewer minimum. Even a two-line review catches the API-key-in-frontend mistake.
- **Tag a working demo every Friday:** `git tag demo-w1 && git push origin demo-w1`
- `.env.example` committed, `.env` gitignored. Check this before the first push.
- Commit prefixes: `feat:`, `fix:`, `docs:`, `chore:`

---

## 7. Working together

**The shared brain.** `.workbuddy-ai/` is committed to the repo. Every teammate who opens the repo in WorkBuddy inherits the same project context automatically:

- **`.workbuddy-ai/memory/MEMORY.md`** — where decisions live. **Update it when you decide something, not just when you build something.**
- **`.workbuddy-ai/skills/rentmate-conventions/`** — the stack, conventions, ethics rules and scope lock, auto-loaded. This is why every teammate's assistant gives the same answers instead of five different ones.

> ⚠️ **Do not delete `.workbuddy-ai/`.** It is project data, not a cache.

**Practical habits**

- **Write the decision into `MEMORY.md` before you write the code.** Future sessions — yours and your teammates' — only know what is in those files.
- **Paste real errors, not summaries.** "It doesn't work" gets a generic answer; a stack trace gets a fix.
- **Point at files by path.** "Look at `src/lib/matching.ts`" beats describing it.
- **Ask for a plan first on anything over a day's work.** Cheaper than undoing.
- **Be candid about validated vs assumed.** This team values critical honesty over reassurance.

---

## 8. Evidence — the numbers we may cite

Full data pack, with every caveat, is `PRD.md` §4.2. The short version:

**Strong.** Verified profiles **73%** (30 of 41, #1 of 12 features) · compatibility matching **68%** · trust verification **68%** with only **2 of 41** detractors · privacy as #1 dissatisfaction **17 of 41**.

**Weak — treat as noise.** Expense stress (27 detractors) · gave up a location (28 detractors) · task tracking.

**The two caveats that must travel with every citation:**

1. **51% of respondents live in a dormitory** — so reported housing pain is largely *anticipated*, not *experienced*.
2. **n=41, one survey, self-selected.** A signal, not proof. Not generalisable.

**Where sources disagree, show both — never average.** Rent growth: CBRE says +2–3%, agents say +5%. Report both.

---

## 9. Appendix — reference documents

| Document                                    | What it is                                                                                                          | When to read it                       |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| `PRD.md`                                    | **The product.** Problem, users, scope, feature requirements, GenAI split, ethics rules, judging alignment, metrics | Before any product or scope question  |
| `README.md`                                 | Repo orientation and setup                                                                                          | First time in the repo                |
| `docs/hk-rental-partner-research.html`      | Full Hong Kong market research with sources                                                                         | When writing problem framing          |
| `docs/rentmate-scope-lock.html`             | Judging-criteria scorecard, design tensions, demo script narrative                                                  | Before a pitch discussion             |
| `docs/rentmate-implementation-methods.html` | Three implementation routes and the PCV validation (18/24)                                                          | If we revisit longer-term strategy    |
| `docs/GenAI.pdf`                            | Original project deck — problem breakdown, AI components, the full 22-question quiz spec                            | Feature detail and the quiz reference |
| `docs/SURVEY.pdf`                           | Raw survey results, n=41                                                                                            | When citing evidence                  |

**PCV score: 18/24 — Strong opportunity.** The two points left on the table are **Price** and **Performance**, both gated by supply-side liquidity, which a three-week prototype cannot resolve and should not pretend to. Be honest about that in the pitch; judges reward candour.
