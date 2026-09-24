# RentMate — Team Brief

**The single source of truth.** If it isn't in this document, it isn't decided.
Last updated: 24 September 2026 · Owner: _[assign one person]_ · Status: **scope locked · organiser requirements answered · TypeScript migrated · 24 days to submission**
(note: Ctrl Shift V to view)

> **⏰ Deadline: ~18 October 2026. Build deadline and submission deadline are the same — there is no buffer.**
> Treat **14 October as code freeze**. The last days are for the demo video, write-up and submission, not for building.
---

## 0. Read this first (60 seconds)

**What we're building.** RentMate — verified trust infrastructure for student housing in Hong Kong. We help non-local students find a verified flat and a compatible flatmate, in one place, without paying an agent HK$5,000 for a listing we can't verify.

**Why it wins.** Our own survey (n=41) is unambiguous: **73% want verified profiles** (the #1 answer of 12 features) and **68% rate trust verification critical**, with only 2 of 41 rating it unimportant. Nobody in Hong Kong currently offers an institution-backed way to know a listing is real and a person is who they say they are. The market gap is documented: forged owner authorisation, cloned rental sites, deposit-before-viewing scams, fake listings used as bait.

**The one thing that could sink us.** Our GenAI claim. Our matching engine is a weighted arithmetic formula — that is a spreadsheet, not GenAI. If we pitch "AI matching" and a judge reads the code, we lose points on a criterion that explicitly requires GenAI. **Fix: lead with the multimodal listing audit and the cited RAG layer.** Those genuinely cannot be built without GenAI.

**What we are NOT building.** Native mobile app · 3D room reconstruction · face scanning · payments · landlord portal · separate social/events platform · generated images of real flats.

**Our three non-negotiable priorities**, in order: **1. Safety and privacy · 2. Convenience (all in one app) · 3. Transparency (accurate information).**

**What changed on 24 September** — three things that alter the plan:
1. **"Sustainability" means environmental (SDG), not business viability.** This brief previously assumed the opposite and recommended leading with a revenue model. That was wrong. See §6 for the corrected environmental argument — it is now one of our strongest points, not a gap.
2. **GenAI inclusion is a hard requirement.** Organisers confirmed any GenAI inclusion is expected and there is no technology blacklist. Our GenAI component is not optional garnish — it is a scored requirement.
3. **TypeScript migration is complete.** Repo is on `.tsx` with `tsconfig.json`, `typescript`, `@types/*`, `@typescript-eslint/*` and `@supabase/supabase-js` installed.

---

## 1. The problem

Hong Kong has more people looking for homes than at any point on record, and the worst tools to find them with.

**The demand is structural, not cyclical.**

| Fact | Figure | Source |
|---|---|---|
| Professionals attracted via talent schemes since late 2022 | 270,000+ | InvestHK |
| Non-local students (2024/25) | 79,000 → expected >100,000 in 2026/27 | CBRE / industry |
| Campus hostel beds available | ~20,000 | Industry |
| Projected student hostel bed shortfall by 2028 | **120,000** | Development Bureau, Feb 2026 |
| Private residential rent index, Jul 2026 | **207.4 — all-time record, 9 straight monthly rises, +5.07% YoY** | R&VD |
| First-batch Top Talent Pass holders who did **not** renew | **46%** (only 54% applied) | ImmD, 2026 |

**And the tools are broken.** The three most-litigated issues in HK residential leasing are furnishing, deposit return, and disposal responsibility. The 睇樓紙 (Form 4 agency agreement) creates double-commission traps. Fraud is concentrated in exactly the cheapest channels — social platforms and owner-direct listings — in six documented patterns: fake landlord "abroad", fake agent/"no commission" bait, cloned rental sites, forged owner authorisation, deposit withholding, and unlicensed bed-space lets.

**Why this matters for our theme.** Our theme lists *health*. Roughly **70% of exchange students name housing their biggest stressor** (our deck's own figure — anecdotal but consistent). That is a mental-health claim, not a logistics claim. We should frame it that way.

**The gap, stated precisely.** Existing platforms solve housing **OR** roommates — never both. 28Hse and Nestia do listings with no matching and no verification. Flatmate.com does matching but isn't HK-specific and has no listings. Facebook groups do both chaotically with no trust layer at all. **No one combines listings + matching + verification + student-focused pricing.**

---

## 2. The four selling points

These are **tiered**, not equal. Confirmed by the team on 24 September. Pitch them in this order and with these weights.

### Tier 1 — Core product positioning (SP1 + SP2)

This is what RentMate *is*. Spend the most pitch time here and build it first.

| # | Selling point | Evidence strength | Notes |
|---|---|---|---|
| 1 | Full, transparent flat listings with reviews | **Moderate** | Listings demand strong (59% picked apartment searching). Reviews only 39% — and the review corpus needs completed tenancies we won't have. Build the listing transparency; be modest about reviews. |
| 2 | Fast habits-based filtering of verified persons via student ID | **Strong** | Our best-evidenced claim. Verified profiles 73% (#1 of 12), compatibility matching 68% (#2), trust verification 68% with only 2/41 detractors. **Lead the whole pitch with this.** |

> **Positioning statement.** RentMate is **verified trust infrastructure for student housing**, delivered through compatibility matching. Compatibility is the *mechanism*; verification is the *product*. Use this sentence everywhere.

### Tier 2 — Originality and the community/mental-health play (SP3)

This is our bid for **originality and value**, and it is how we earn the **community / mental-health** marking criterion. It is also the least evidenced part of the design.

| # | Selling point | Evidence strength | Notes |
|---|---|---|---|
| 3 | Gen-AI legal and cultural guidebook + senior mentors + real-world meetups | **Unvalidated** | Zero direct survey evidence. Strongly grounded in market research (furnishing/deposit/disposal disputes, 睇樓紙 traps, 46% talent churn, information inequality). Deliver as **information + one extended meetup**, not a social network — see §4. |

### Tier 3 — Side asset, not a headline (SP4)

| # | Selling point | Evidence strength | Notes |
|---|---|---|---|
| 4 | Complaints and reviews packaged as data for regulators or other groups | **Unvalidated — internal design note only** | Confirmed 24 Sep: this is a **side note**, not a selling point. Do not put it on a slide as a headline. It survives as a design principle (aggregate pattern intelligence) with the guardrails in §6. |

> **Note on SP4.** Because it is no longer a headline claim, the earlier objection to it (that an anonymous complaint to your own landlord is self-defeating) is now just an internal design constraint rather than a positioning problem. Keep reports private and human-reviewed; keep the aggregate data behind the minimum-cohort threshold. Then it is a legitimate long-term data asset without needing to be pitched.

### Evidence caveat that must travel with all of this

**51% of survey respondents live in a dormitory**, so their reported housing pain is largely *anticipated*, not experienced. Weight Q11–Q13 heavily; discount Q6–Q9 and Q14–Q18. n=41, single self-selected survey — not generalisable.

---

## 3. Evidence base — what we know vs. what we assume

**Know (primary data, n=41, 20 Sep 2026):**
- 88% aged 18–25; 59% international university students; **51% currently in a dormitory**
- Co-living demand: 44% yes, 29% maybe
- Top-3 features: verified profiles **30 (73%)**, compatibility matching **28 (68%)**, apartment searching **24 (59%)**, rent splitting 18, review system 16, in-app messaging 11
- Trust verification importance: **28 promoters / 11 passives / 2 detractors**
- Top dissatisfaction with shared living: **privacy 17**, finding a roommate 12, rent too high 11, finding a flat 9, location 9, loneliness 6
- App comfort is *low*: only 3 promoters vs 15 detractors
- Weak signals (treat as noise): expense stress (27 detractors = low), gave up a location (28 detractors = rare), task tracking (11/19/11)

**Assume (secondary, directional only):**
- "70% of exchange students name housing their biggest stressor" — flagged anecdotal in our own deck
- HK$5,000–10,000 typical agent fee; HK$4,500–7,000/month for a shared room
- 2 months' deposit + 1 month advance convention (~HK$65,000–75,000 on an HK$18k flat)

**Three caveats that must not be forgotten:**
1. **51% of our sample lives in a dormitory** — so their reported housing pain is *anticipated*, not *experienced*. Weight Q11–Q13 heavily; discount Q6–Q9 and Q14–Q18.
2. **Privacy is the #1 complaint** — and we are a shared-living product. Position as "find the least-bad flatmate fast, and get your own space" — not "community living".
3. **n=41, single survey, self-selected.** Not generalisable. Surveys are the weakest form of validation.

---

## 4. Scope lock

**The decision rule:** if it is not on the demo path, it does not get built.

| Feature | Decision | Reasoning |
|---|---|---|
| Login + student ID verification | **Build properly** | Our differentiator. Must look real. |
| Lifestyle quiz | **Build properly** | Feeds everything. Split it: lifestyle at onboarding, housing/budget when browsing. |
| Roommate matching + chat + video | **Build, seeded data** | Keep flow + narrative. **Embed Jitsi/Whereby — do not build chat or video.** Gate video behind mutual match. |
| Filtered listings + GenAI context + comparison | **Build deepest** | **This is our demo.** Works with one user, real data, strongest GenAI credential. |
| Arrange meetup to view flat | **Stub, lean on it** | Extend into our belonging feature instead of building a separate one. |
| Separate social hangout platform | **CUT** | Conflicts with priority #1, needs its own cold-start, largest unforced build cost. Replace with a GenAI-generated settling-in plan. |
| Native mobile, 3D reconstruction, face scanning, payments, landlord portal | **Already cut** | Our deck made these calls correctly. Do not let them creep back. |

**The belonging feature, resolved.** Belonging ships as **information + one extended meetup**, not as a social network:
- Generate a personalised settling-in plan from quiz data we already collect — "your first three weeks in Hung Hom, for someone who cooks and sleeps early"
- Extend step 5: "meet your roommate **and two other verified pairs looking in this district**"
- Zero new cold-start, zero physical safety risk, still satisfies "culture and belonging"

---

## 5. GenAI architecture

**The honest split.** Weighted scoring is arithmetic. The narrative on top is GenAI. Say both out loud — candour reads as competence.

**Promote these two to the front of the pitch — they genuinely require GenAI:**

1. **Multimodal listing audit.** Photos/video → estimated real room dimensions with confidence intervals, condition assessment, furniture inventory, stock-photo detection, text-vs-photo mismatch, and price comparison against R&VD rental data. This is genuinely multimodal and cannot be rules-based. It attacks the documented "room was half the size advertised" pain.
2. **Cited RAG over a Hong Kong corpus.** Retrieval over R&VD rental data, EAA guidelines, Lands Tribunal procedure, stamp duty rules, standard tenancy terms, official district statistics and transport data. **Citations on every claim.** Grounding + citation is what makes this defensible as GenAI *and* ethically safe.

**Also GenAI:** the compatibility narrative and friction-point flagging · day-in-the-life text generation (grounded in real commute/transit data) · a multilingual layer across all outputs (cheap win, high impact for our exact audience).

**Stop calling these AI:** the quiz (a form) and the matching score (a weighted sum). Keep them — they work — but they are not our GenAI credential.

### Two hard technical rules

> **1. Never generate images of a real flat.** If "visualise daily life" means synthesising pictures of a property someone is about to sign a lease on, that is misinformation and an ethics-criterion landmine. Generate the *narrative* — commute, noise, what's open at 11pm, nearest supermarket. Keep property photography authentic and unedited.
>
> **2. Never ship uncited legal guidance.** Every generated contract or legal statement carries a source link and a visible disclaimer. This is a hackathon prototype, not legal advice.

---

## 6. Ethics rules — non-negotiable

These are not nice-to-haves. Criterion 5 is "sustainability and ethics", and these are the cheapest points in the competition to win.

**✅ What we already got right — say these out loud:**
- **Report people, review properties.** A permanent public reputation score on *people* is defamation-adjacent, retaliatory, and has no fair appeal path. Reviews on *properties* are standard consumer protection. This is the right ethical line.
- **Video unlocked only after mutual match.** That is a safety control, not a feature.

**⚠️ Four gaps to close:**

| Gap | The risk | The rule |
|---|---|---|
| District reviews can stigmatise communities | Free-text opinions encode class and racial bias, depress property values, harm residents. Our deck's note about flagging "which areas are more dangerous" is exactly this risk. | Use **structured, sourced attributes only** — official crime statistics, commute times, amenities, noise. Cite the source. Let users filter, not editorialise. |
| Aggregate data can de-anonymise | "Aggregate" data from three complaints in one building identifies those three tenants. | **Minimum cohort threshold: never publish any derived statistic from fewer than 5 reports.** Collect consent at submission. |
| Student ID storage | Holding scans creates serious PDPO exposure and breach liability. | Store **the verification result only** — a boolean plus institution and timestamp. **Delete the source image immediately after OCR.** |
| Reporting can be weaponised | Retaliatory reports after a deposit dispute; reports on people carry reputational harm. | Reports stay **private, human-reviewed, and never surfaced as a count on a profile.** |

**Selling Point 4 — reframed.** "Send your anonymised complaint to your landlord" cannot work: your landlord knows who you are, and anonymity removes the leverage that makes a complaint credible. Authorities need an identified complainant. The two reframes that *do* work:
- **① Aggregate pattern intelligence** — anonymise across many tenants to surface "this agency has 7 unresolved deposit disputes" or "this building has 3 unlicensed-bed-space reports". Genuinely new information no individual can produce.
- **② Templated escalation** — generate the correctly-cited, correctly-addressed complaint or EAA/18222 filing for the tenant to send **under their own name**, with evidence assembled for them. We remove the effort and the legal ignorance, not the identity.

**Sustainability — corrected 24 September.** Organisers confirmed "sustainability" refers to the **SDG / environmental** dimension. An earlier version of this brief wrongly assumed business viability and recommended leading with a revenue model. Disregard that. The environmental case below is genuinely strong, and the best part is that **it is delivered by our core product rather than bolted on.**

### The environmental argument for RentMate

**The context — why housing is Hong Kong's highest-leverage climate lever.**

| Fact | Figure | Source |
|---|---|---|
| Share of Hong Kong's electricity consumption attributable to buildings | **~90%** | HKSAR Carbon Neutrality Office |
| Share of Hong Kong's carbon emissions from buildings | **over 60%** | HKSAR Carbon Neutrality Office / HK2050isNow |

In a city where buildings are 90% of electricity and over 60% of carbon, **how people occupy buildings matters more than almost anything else**. That is our lever.

**The mechanism — three steps, all defensible:**

1. **Shared housing is lower-carbon per person.** Two students in one flat share one air-conditioning system, one fridge, one washing machine, and one set of common space instead of two. In Hong Kong's subtropical climate, **air conditioning is the dominant residential electricity load** — so consolidating two single-occupancy households into one shared flat removes an entire cooling system from the grid. Research on household size consistently finds per-capita energy and carbon falling as household size rises.

2. **Better matching means longer tenancies, which means fewer moves.** This is the original insight and it is the one to lead with, because it makes *the matching engine itself* an environmental intervention. A failed roommate match causes someone to move again — and moving generates furniture waste and embodied carbon. Our own market research already flags **disposal responsibility as one of the three most-litigated tenancy issues in Hong Kong** — that is the waste stream, made visible. A good match that lasts a full academic year avoids an entire second move.

3. **Faster matching reduces vacancy.** Empty rooms still consume common-area energy and represent wasted embodied carbon in a city with a 120,000-bed shortfall. Filling them faster is straightforwardly better.

**The pitch line.** *Hong Kong's buildings produce over 60% of the city's carbon, and the single biggest determinant of residential energy use is how many people share a flat. RentMate makes shared living work better and last longer — so more students choose it, and fewer of them move twice.*

**SDG mapping.** SDG 11 (Sustainable Cities and Communities) — target **11.1** adequate, safe and affordable housing, and target **11.6** reducing the environmental impact of cities. Secondarily SDG 12 (responsible consumption) via resource sharing.

**Business viability is still worth one sentence** — under *feasibility* (criterion 4), not sustainability. Keep it short: landlords and operators pay for verified-tenant access, because they absorb the vacancy and tenant risk that verification reduces. Do not build a pitch section on it.

---

## 7. Tech stack and conventions

### Stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | **Vite + React + TypeScript** ✅ | Simpler to reason about than Next.js for a team new to React. Explicit routing, no server-component magic. **Migrated 24 Sep.** |
| Backend / DB | **Supabase** | Gives us Auth, Postgres, Storage, Realtime and Edge Functions out of the box. Removes most backend work. |
| Auth | Supabase Auth — university email (magic link / OAuth) | Aligns with our student-ID verification rail. |
| Vector search | **Supabase pgvector** | Built in. Gives us RAG with **no extra infrastructure**. Major win. |
| GenAI calls | **Supabase Edge Functions (Deno)** | **API keys must never reach the client.** Non-negotiable. |
| Chat / video | **Embed Jitsi or Whereby** | Do not build either. |
| Hosting | **Not required** — localhost accepted | Organisers confirmed localhost is fine for the demo (24 Sep). Saves us deploy and CORS debugging. Keep a static `npm run build` working as a fallback. |

> **✅ TypeScript migration — DONE (24 September).**
> Repo is on `.tsx` with `tsconfig.json`, `typescript`, `@types/react`, `@types/react-dom`, `@typescript-eslint/*` and `@supabase/supabase-js` installed.
>
> **One thing still missing — add it today:**
> ```json
> "typecheck": "tsc --noEmit"
> ```
> Add that to `package.json` scripts and run it before every commit and every Friday demo. This is what makes the migration worth having — without running it, TypeScript only helps you inside the editor and broken types still reach `main`. Also confirm `tsconfig.json` has `"strict": true`; strict mode is where most of the value lives.
>
> **Why TypeScript mattered here:** `supabase gen types typescript` generates types from our database schema, making every query type-checked. If we rename a column or misspell a field, the editor tells us immediately instead of us debugging a silent `undefined` in week 3. That is the single best safety net available to a team new to Supabase, and it only works with TypeScript.

### The skill-gap problem — and how to survive it

Nobody on the team has real experience with React or Supabase. In a four-week build that is a genuine risk. Five mitigations:

1. **Week 1 is a learning week, and it is not optional.** Everyone completes Supabase's official React quickstart before writing project code. Budget two days.
2. **Start from a template, never from scratch.** Use an official Supabase + Vite starter. Do not scaffold auth, routing or DB clients by hand.
3. **Keep the demo path razor-thin.** One happy path, fully working, beats five half-features. Hardcode or mock anything off the path — and label it as mocked in the demo.
4. **Never put an LLM API key in the frontend.** Route every model call through an Edge Function. This is the single most common hackathon security failure.
5. **Supabase Studio is your debugging tool.** Inspect tables and auth state directly in the browser instead of writing debug code.

### Conventions

- **TypeScript everywhere.** No `any` in shared types.
- **All AI outputs render with a source or a confidence indicator.** Never present a model estimate as a measurement.
- **Every listing-related AI claim must be traceable** to a photo, a document, or a public dataset.
- **Commit messages:** `feat:`, `fix:`, `docs:`, `chore:` prefixes.
- **Never commit** API keys, `.env`, or real student data. Use `.env.example`. Demo with synthetic profiles only.

---

## 8. The plan — 24 days to 18 October

**The hard constraint:** build deadline and submission deadline are the **same**, on **~18 October 2026**. There is no submission buffer. So the honest read is that we have **three weeks of building, not three and a half.**

> ### 🛑 Code freeze: 14 October. Non-negotiable.
> Everything after 14 October is integration, the demo video, the write-up and submission. If a feature is not working on 14 October, **it is not in the demo.** Teams lose hackathons by shipping a broken feature at 2am instead of a working one at midnight.

**Weekly rhythm:** each block ends with a **working demo**, however ugly. If Friday's demo doesn't run, the next block starts by fixing it.

### Block 1 — 24–30 Sep: Foundations
- **Everyone completes the Supabase + React quickstart (2 days).** This is not optional and it is not wasted time.
- Add `npm run typecheck` to `package.json` and confirm `"strict": true` in `tsconfig.json`
- **Freeze the feature list in writing** ← scope discipline is won or lost here
- Assemble the HK RAG corpus: R&VD rental data, EAA guidance, tenancy terms, stamp duty, district statistics. **Organisers have provided no datasets, so this is on us** — start now, it is slower than it looks.
- Supabase project created; schema drafted; auth skeleton working
- First page rendered end to end

### Block 2 — 1–7 Oct: Verification, quiz, matching
- Auth, student-card OCR, university email verification (**store attestation only**)
- Quiz, weighted scoring, GenAI compatibility narrative
- **Build the seeded profile set now** so the matching demo is rehearsable early
- GenAI calls working through Edge Functions, keys server-side
- Milestone: a user can sign up, verify, take the quiz, and see matched profiles

### Block 3 — 8–13 Oct: The listing layer (our demo centrepiece)
- Filters, multimodal listing audit, price-fairness check against R&VD data
- District briefs **with visible citations**; commute and transit data (external APIs are permitted — arrange them now if we want them)
- Side-by-side comparison, multilingual layer
- **This block decides our technical score. Protect it.** If Block 2 overruns, cut from Block 4, never from here.

### Block 4 — 14–18 Oct: Integration, ethics, submission
- 14 Oct: **code freeze**
- Embed chat and video; wire the extended meetup and settling-in plan
- Write the ethics and sustainability section (SDG framing — see §6)
- **Record the demo video.** Organisers recommend a video backup, and with a live demo and no buffer it is essential insurance — a dead laptop on the day costs us everything.
- Rehearse the live demo **at least three times**, once with someone deliberately interrupting
- 18 Oct: **submit**

### Workstreams — mapped to our 4 people

| Person | Owns | Notes |
|---|---|---|
| **P1** | **WS1 Platform** — Supabase, schema, auth, Edge Functions | Also owns the RAG corpus ingestion pipeline |
| **P2** | **WS2 Frontend** — React, design system, all screens | Owns the demo path screens |
| **P3** | **WS3 GenAI** — corpus, prompts, vision audit, RAG, evals | Owns the GenAI requirement — our scored criterion |
| **P4** | **WS4 Product & Ethics + WS5 Demo & Pitch** — scope guardian, ethics doc, demo script, video | Load-bearing, not spare capacity |

> **The single most important role is WS4 — the scope guardian (P4).** One person must have explicit authority to say "that is not on the demo path, we are not building it." In a three-week build, scope discipline predicts success better than technical skill. If nobody owns this, the project fails in week 3.

**Team size:** we have 4; the requirement is 3–5, so we are compliant. Cross-team collaboration is permitted but not the default — treat it as an option if we get stuck on something specific, not as a plan.

---

## 9. Organiser answers — resolved 24 September

All ten questions answered. Recorded here so nobody re-asks. **Bold = what it changes for us.**

| # | Question | Answer | What it changes |
|---|---|---|---|
| 1 | Mandated or forbidden technologies? Required GenAI provider? | **Any GenAI inclusion is expected. No blacklist** on tech or cloud providers. | **GenAI is a scored requirement, not garnish.** Confirms §5 — the GenAI component must be load-bearing. No provider constraints, so pick the best model for each job. |
| 2 | Deployed URL required, or is localhost OK? | **localhost is fine.** | Saves deploy and CORS debugging. Do not spend time on Vercel/Netlify. Keep `npm run build` working as a fallback. |
| 3 | Judging format — duration, Q&A, code review? | **Live demo.** A video is recommended as backup. Non-software projects don't even need a software demo. | **Record a video.** With a live demo and no submission buffer, a dead laptop costs us everything. Also means rehearsal matters more than polish. |
| 4 | External APIs permitted? (Maps, transit, R&VD open data) | **No blacklist. If we can arrange it, that's good.** | Maps/transit and R&VD open data are fair game and materially strengthen the district briefs and price-fairness check. **Start arranging access in Block 1.** |
| 5 | Synthetic profiles acceptable for the demo? | **Yes, no blacklist.** | No privacy blocker on demo data. Use synthetic profiles throughout. |
| 6 | Team size? Cross-team collaboration? | **We have 4; requirement is 3–5. Collaboration allowed but not the default.** | We're compliant. Workstreams mapped to 4 people in §8. Treat collaboration as a targeted unblock, not a plan. |
| 7 | Submission vs. build deadline — how much buffer? | **Same deadline, in 3.5 weeks (~18 Oct).** | ⚠️ **The biggest constraint.** Three weeks of building, not three and a half. Code freeze 14 Oct. See §8. |
| 8 | Pre-approved datasets available? | **None provided. We source our own.** | Corpus assembly is entirely on us and is slower than it looks. **Start in Block 1.** |
| 9 | IP and code ownership? | **Probably ours** (and it's largely AI-produced anyway). | Not a blocker. No action. |
| 10 | Does "sustainability" mean environmental or business viability? | **Environmental — it's about the SDG.** | ⚠️ **Corrects an earlier wrong assumption in this brief.** See §6 for the environmental argument. Business viability now sits under *feasibility* only. |

### The three answers that actually change our build

1. **Q10 — sustainability is environmental.** Our earlier plan treated this as a business-model gap. It isn't a gap at all: §6 sets out why **better roommate matching is itself a carbon intervention**, which means our core product *is* the sustainability story. That is a much stronger pitch than a revenue slide.
2. **Q7 — no submission buffer.** Three weeks of building. Everything else in the plan bends around this.
3. **Q1 + Q3 — GenAI is required and the demo is live.** Our GenAI component must be genuinely load-bearing (§5), and we need a recorded video as insurance.

---

## 10. How we work together

### The shared brain: commit `.workbuddy-ai/`

Our WorkBuddy workspace folder holds two things that make the whole team's AI context identical:

```
.workbuddy-ai/
├── memory/
│   ├── MEMORY.md          ← curated project facts. THE shared brain.
│   └── YYYY-MM-DD.md      ← daily work log
└── skills/
    └── rentmate-conventions/
        └── SKILL.md       ← our rules, auto-loaded by every teammate's session
```

**Commit both folders to the repo.** Then:
- Every teammate opens the repo in WorkBuddy and inherits the same project context automatically
- `MEMORY.md` is where decisions live — update it when you decide something, not just when you build something
- The `rentmate-conventions` skill encodes our stack, conventions and ethics rules, so **every teammate's AI gives the same answers** instead of five different ones
- This is how you "compress context": you stop re-explaining the project in chat, because it's in the repo

> ⚠️ **Do not delete `.workbuddy-ai/`.** It is project data, not a cache. Add `.workbuddy-ai/memory/*.md` to git, and keep any secrets out of it.

### Working in WorkBuddy as a team

| Need | Use |
|---|---|
| Shared project context | `.workbuddy-ai/memory/MEMORY.md` — commit it |
| Consistent conventions across the team | The `rentmate-conventions` project skill |
| A big task done end-to-end | **Agent mode** — it edits files and runs commands |
| Reviewing a plan before committing to it | **Plan mode** — think first, execute after approval |
| Just asking questions, no file changes | **Ask mode** |
| Deep research or multi-step exploration | Ask for a research pass before building |
| Recurring progress checks | **Automations** — e.g. a weekly digest of what changed in the repo |

**Practical tips:**
- **One person per file.** WorkBuddy edits files directly; two people editing one file will conflict. Split by workstream, not by task.
- **Write the decision into `MEMORY.md` before you write the code.** Future sessions — yours and your teammates' — only know what's in those files.
- **Ask for a plan first on anything over a day's work.** Plan mode is cheaper than undoing.
- **Paste real errors, not summaries.** "It doesn't work" gets a generic answer; a stack trace gets a fix.
- **Point at files by path.** "Look at `src/lib/matching.ts`" beats describing the file.

### GitHub workflow

- `main` is always demo-able. Never commit broken code to it.
- Feature branches: `ws1/auth-verification`, `ws3/listing-audit`
- Small PRs, one reviewer minimum. Even a two-line review catches the API-key-in-frontend mistake.
- **Tag a working demo every Friday:** `git tag demo-w1`. When something breaks in week 4, you can go back to a known-good state.
- `.env.example` committed, `.env` gitignored. Check this before the first push.

### Immediate next actions

| # | Action | Owner | By |
|---|---|---|---|
| 3 | Assign a scope guardian (WS4) — non-negotiable | | Today |
| 4 | Everyone completes the Supabase + React quickstart | All | Day 3 |
| 5 | Lock the quiz questions | WS3 | Day 4 |
| 6 | Freeze the feature list, in writing, in this repo | WS4 | Day 5 |
| 7 | Assemble the HK RAG corpus | WS3 | Day 6 |
| 8 | Deploy a "hello world" page end to end | WS1 | Day 7 |

---

## Appendix — reference documents

| Document | What it is | When to read it |
|---|---|---|
| `rentmate-scope-lock.html` | Judging-criteria scorecard, the three design tensions, ethics gaps, demo script | Before any planning discussion |
| `rentmate-implementation-methods.html` | The three implementation routes and full PCV validation (18/24) | If we revisit strategy |
| `hk-rental-partner-research.html` | Full Hong Kong market research briefing with sources | When writing the problem framing |
| `GenAI.pdf` | Original project deck — problem breakdown, AI components, quiz spec | Reference for feature detail |
| `SURVEY.pdf` | Raw survey results, n=41 | When citing evidence |

---

**PCV score: 18/24 — Strong opportunity.** Our weakest dimensions are Price and Performance, both gated by supply-side liquidity, which a four-week prototype cannot resolve and should not pretend to. Be honest about that in the pitch; judges reward candour.
