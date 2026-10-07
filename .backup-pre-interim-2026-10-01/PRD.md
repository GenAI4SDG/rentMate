# RentMate — Product Requirements Document

**Product:** RentMate — verified trust infrastructure for student housing in Hong Kong
**Version:** v1.0 (hackathon scope)
**Date:** 26 September 2026
**Build deadline / submission:** ~18 October 2026 · **Code freeze: 14 October 2026**
**Track:** 3 — Smart Living, Culture & Belonging · **SDG 11** (secondarily SDG 12)

---

## 1. Product summary

RentMate is a responsive web application that helps non-local students and international newcomers in Hong Kong find a **verified flat** and a **compatible flatmate** in one place, without paying an agent HK$5,000 for a listing they cannot verify.

**The one-sentence definition — use it verbatim everywhere:**

> RentMate is verified trust infrastructure for student housing in Hong Kong. Compatibility matching is how we deliver it. **Verification is the product.**

Compatibility is the *mechanism*. Verification is the *product*. This distinction drives every requirement in this document.

### What makes it different

The Hong Kong market solves housing **or** roommates — never both, and never with a trust layer. Listing portals (28Hse, Nestia, House730, Spacious, Squarefoot) offer no matching and no verification. Matching platforms (Flatmate.com, SpareRoom, Roomster) are not Hong Kong-specific and carry no listings. Facebook and Xiaohongshu groups do both chaotically with the highest fraud density of any channel. **No one combines listings + matching + verification + student-focused pricing.**

### Product priorities (ranked, and used to resolve every trade-off)

1. **Safety and privacy** — default to the more protective option.
2. **Convenience** — everything in one place.
3. **Transparency** — accurate, sourced information.

---

## 2. Problem statement

**The demand is structural, not cyclical.**

| Fact | Figure | Source |
|---|---|---|
| Professionals attracted via talent schemes since late 2022 | 270,000+ | InvestHK |
| Non-local students (2024/25) | 79,000 → expected >100,000 in 2026/27 | CBRE / industry |
| Campus hostel beds available | ~20,000 | Industry |
| Projected student hostel bed shortfall by 2028 | **120,000** | Development Bureau, Feb 2026 |
| Private residential rental index, Jul 2026 | **207.4** — all-time record, 9 straight monthly rises, **+5.07% YoY** | R&VD |
| First-batch Top Talent Pass holders who did **not** renew | **46%** | ImmD, 2026 |

**And the tools are broken.** The three most-litigated issues in Hong Kong residential leasing are **furnishing, deposit return, and disposal responsibility**. The 睇樓紙 (Form 4 agency agreement) creates double-commission traps. Fraud is concentrated in exactly the cheapest channels — social platforms and owner-direct listings — in six documented patterns:

| Scam typology | Mechanism | Primary target |
|---|---|---|
| Fake landlord "abroad" | Claims to be overseas, cannot allow viewing, demands deposit first | Students & newcomers |
| Fake agent / "no commission" bait | Social-media account induces up to a full year's prepayment | Mainland students |
| Cloned rental site | Near-identical domain harvests card credentials | General public |
| Forged owner authorisation | Fake power-of-attorney legitimises an illegal sublet | Tenants & owners |
| Deposit withholding | Denies tenancy existed — no written contract | Informal tenants |
| Unlicensed bed-space let | Illegal and unsafe subdivision | Low-income tenants |

**The gap, stated precisely:** existing platforms solve housing **OR** roommates, never both, and none of them verify either side.

**The framing that must be used:** Hong Kong does not have a *volume* problem, it has a **matching** problem. Record rents coexist with landlords who cannot find trustworthy tenants. Supply is not absent — it is **mismatched** (~17,000 private completions a year, designed for sale, not for students). Leading with "mismatch" is both more accurate and more defensible than "shortage".

**Health framing.** Roughly 70% of exchange students name housing their biggest stressor (our deck's figure — flagged anecdotal). That is a mental-health claim, not a logistics claim, and it earns the theme's *health* / community criterion.

---

## 3. Target users

| Segment | Role | Primary need |
|---|---|---|
| **Non-local university students** (primary) | Main user | A verified flat and a compatible flatmate, fast, without being scammed |
| **International newcomers / talent-scheme arrivals** (secondary) | Same journey, different visa | No local credit history, no guarantor, cannot view in person before arriving |
| **Existing tenants with a spare room** (secondary) | Supplies supply-side matching | Fill a room with someone verified |
| **Landlords and operators** (secondary) | Supplies listings; revenue side | Screen tenants they cannot otherwise vet |
| **University housing / international offices** (institutional, out of build scope) | Credible verification rail and distribution | Better tools for incoming students |

**Job to be done:** *"Let me arrive in Hong Kong with a room and a flatmate already sorted — and let me know, before I pay anything, that the flat is real and the person is who they say they are."*

### Primary user journey (demo path)

1. Sign in → verify student status
2. Answer the lifestyle quiz
3. See matched, verified roommates with an explanation of each match
4. Browse verified listings with a GenAI audit of a real listing
5. Read the sourced district brief and a personalised settling-in plan
6. Propose a viewing with the matched roommate

---

## 4. Value proposition

### 4.1 The four selling points — tiered, not equal

| Tier | Selling point | Evidence | Product treatment |
|---|---|---|---|
| **Tier 1 — core positioning** | **SP1** Transparent listings with reviews · **SP2** Fast habits-based filtering of **verified** persons via student ID | SP1 **Moderate** (59% want apartment searching; reviews only 39%) · SP2 **Strong** (verified profiles **73%** — #1 of 12; compatibility matching 68%; trust verification 68% with only **2 of 41** detractors) | Lead here. Build first. This is what RentMate *is*. |
| **Tier 2 — originality + community/health** | **SP3** Gen-AI legal and cultural guidebook + senior mentors + one real-world meetup | **Unvalidated** — zero direct survey evidence, well-grounded in secondary research | Deliver as **information + one extended meetup**, not a social network |
| **Tier 3 — side asset, never a headline** | **SP4** Complaints and reviews packaged as aggregate data for regulators | **Unvalidated** — internal design note only | One sentence in the ethics section. Never a slide headline. |

### 4.2 Evidence integrity — requirements, not suggestions

Every quantitative claim in the product and the pitch carries a source and a caveat. Three caveats travel with any citation of our survey:

1. **51% of respondents live in a dormitory** — so reported housing pain is largely *anticipated*, not *experienced*.
2. **n=41, one survey, self-selected** — a signal, not proof. Not generalisable.
3. **Weight the trust and verification findings heavily; discount the softer signals.** The trust findings survive the "anticipated pain" critique because fear and risk can be assessed without experience. Expense stress (27 detractors), giving up a location (28 detractors) and task tracking are noise.

**R-01** — Every AI output must render with a source or a confidence indicator. A model estimate is never presented as a measurement.
**R-02** — Where two sources disagree on a figure, both are shown. Figures are never averaged.

### 4.3 Positioning rules

| Do say | Do not say |
|---|---|
| "Verified trust infrastructure for student housing" | "A roommate-matching app" |
| "Find the least-bad flatmate fast, and get your own space" | "Community living" |
| "Better matching → longer tenancies → fewer moves" | "We save students money" (cost is a one-off; opacity is systemic) |

> **Why the privacy positioning matters:** privacy is the #1 dissatisfaction with shared living (**17 of 41**), ahead of finding a roommate (12) and rent being too high (11). RentMate is a shared-living product in a market whose top complaint about shared living is a lack of privacy. The product must filter on **personal space preferences**, and a listing that honestly shows room size and layout directly answers this complaint.

---

## 5. Scope

**The decision rule:** if it is not on the demo path, it does not get built.

### 5.1 In scope — with explicit depth

| ID | Feature | Depth | Requirement |
|---|---|---|---|
| **F1** | Student verification (university email + student-card OCR) | **Build properly** | It is the differentiator. It must look real on stage. |
| **F2** | Lifestyle + housing quiz | **Build properly** | Feeds everything downstream. Split: lifestyle at onboarding, housing/budget when browsing. |
| **F3** | Roommate matching + compatibility narrative | **Build, on seeded profiles** | Flow and narrative are real; the profile pool is seeded and must be labelled as such. |
| **F4** | Listing layer — filters, multimodal audit, price fairness vs R&VD, sourced district brief, comparison | **Build deepest** | The demo centrepiece and the only unambiguous GenAI credential. |
| **F5** | In-app chat + video | **Embed** (Jitsi / Whereby) | Do not build. Video is gated behind a mutual match. |
| **F6** | Extended flat-viewing meetup | **Stub, lean on it** | This *is* the belonging feature. Extend the existing "view the flat together" step. |
| **F7** | Generated settling-in plan | **Build** (cheap, high value) | Turns quiz data into belonging-as-information. No cold-start, zero safety risk. |
| **F8** | Multilingual output layer | **Build, English + Chinese** | Near-zero cost, applies to every other feature. |

### 5.2 Out of scope — do not reintroduce

| Cut | Why |
|---|---|
| Separate social / events platform | Conflicts with priority #1, needs its own cold-start, largest unforced build cost. Replaced by F6 + F7. |
| 3D room reconstruction | Weeks of work. Replaced by photo analysis + AI description. |
| Face scanning | Privacy. Replaced by university email verification. |
| Payments | Out of scope. Users pay landlords directly. |
| Landlord portal | An extra user type. Landlords list via a form if needed. |
| Native mobile app | No time. Responsive web only. |
| Generated images of real flats | **Hard rule.** See §8. |
| Public reviews of people | **Hard rule.** Report people, review properties. See §8. |
| Custom chat / video implementation | Embed third-party. |

### 5.3 Cut order when time runs short

If the build overruns, cut in this order — and stop:

1. Side-by-side comparison
2. Multilingual layer
3. Chat and video
4. Settling-in plan

> **Never cut the listing audit.** It is the GenAI credential, and criterion 3 is scored on it.

---

## 6. Functional requirements

Priority key: **P0** = demo path, cannot ship without it · **P1** = stated in the pitch, should be visible · **P2** = describe only.

### F1 — Student verification 🔒 *(SP2 · the product)*

| ID | Requirement | Priority |
|---|---|---|
| F1.1 | User signs in with university email; account state is `unverified` / `pending` / `verified` / `declined` | P0 |
| F1.2 | User uploads a student card image; a vision model OCRs it and extracts institution and a validity signal | P0 |
| F1.3 | The verification record stores **only** a boolean attestation, the institution, and a timestamp | P0 |
| F1.4 | The uploaded image is **deleted immediately** after OCR — not scheduled, not deferred | P0 |
| F1.5 | Unverified users can browse listings but cannot appear in matching or initiate contact | P1 |
| F1.6 | The verification state is visible on the user's own profile so the flow is demonstrable | P1 |

**Acceptance:** sign in → upload a student card → state moves `pending` → `verified` → the storage bucket is empty → the verification record contains no document data.

### F2 — Lifestyle + housing quiz *(SP2 feeder)*

| ID | Requirement | Priority |
|---|---|---|
| F2.1 | **Lifestyle block (6 questions) at onboarding:** sleep schedule, cleanliness, guests, noise tolerance, shared-space use, conflict style | P0 |
| F2.2 | **Housing block (6 questions) at browse time:** preferred districts, room type, budget, MTR proximity, move-in timing, lease length | P0 |
| F2.3 | Answers persist across sessions | P0 |
| F2.4 | Questions carry weights so the matching score is computed from the same source of truth | P0 |
| F2.5 | The full 22-question specification in the original deck stays as a **design reference only**, not on the demo path | P1 |

> **Design intent:** a 22-question wall at signup damages real completion and eats build time. Twelve questions on the demo path, split across two moments, is the requirement.

**Acceptance:** complete all 12 → answers persist on refresh → matching consumes them.

### F3 — Roommate matching + compatibility narrative *(SP1 + SP2)*

| ID | Requirement | Priority |
|---|---|---|
| F3.1 | Weighted score across the seeded pool, 0–100, computed from quiz weights | P0 |
| F3.2 | Filters applied before scoring: budget within a ±20% band; at least one overlapping preferred district | P0 |
| F3.3 | **GenAI narrative** explaining *why* two people match, plus explicit **friction-point flagging** | P0 |
| F3.4 | The score must be described in-product and on stage as **weighted scoring**, never as "AI" | P0 |
| F3.5 | The demo profile pool is seeded and **labelled as seeded in the UI and in the script** | P0 |
| F3.6 | The matching function is a pure function, unit-testable with no database | P1 |

**Honest split to state out loud:** *"weighted scoring, with an LLM-generated narrative."* The score is arithmetic; the explanation and the friction flagging are GenAI. Candour reads as competence; overclaiming reads as inexperience.

**Acceptance:** identical profiles score 100; opposite sleep schedules drop measurably; the narrative runs twice on the same pair and stays consistent.

### F4 — The listing layer ⭐ *(demo centrepiece · the GenAI credential)*

**This is the feature to build deepest.** It works with a single user, needs no cold-start, and is unambiguously GenAI.

| ID | Sub-feature | Requirement | Priority |
|---|---|---|---|
| F4.1 | **Filtered listings** | Filter by district, budget, room type, MTR proximity, furnished/unfurnished | P0 |
| F4.2 | **Advertised vs estimated size** | Multimodal audit estimates real room dimensions from photos and shows them against the advertised figure. **The headline comparison** — it attacks "the room was half the size advertised". | P0 |
| F4.3 | **Confidence band** | Every size estimate renders with an explicit confidence interval. **Never presented as a measurement.** | P0 |
| F4.4 | **Condition + furniture + red flags** | Condition assessment, furniture inventory, stock-photo detection, text-vs-photo mismatch | P0 |
| F4.5 | **Price fairness check** | Listing rent against R&VD district rental data, shown as a comparison | P0 |
| F4.6 | **Sourced district brief (RAG)** | Retrieved facts on rent levels, transport, amenities, tenancy norms, official district statistics. **Minimum 3 visible citations per brief.** | P0 |
| F4.7 | **Day-in-the-life narrative** | Commute, noise, what is open at 11pm — **text only, grounded in real transit data** | P1 |
| F4.8 | **Side-by-side comparison** | Two listings compared | P2 — first to cut |

**Corpus requirement.** Retrieval runs over a curated Hong Kong corpus: R&VD rental data, EAA guidance, Lands Tribunal procedure, stamp duty rules, standard tenancy terms, official district statistics, transport data. No datasets are provided by the organisers — the corpus is ours to assemble and it is slower than it looks.

**Accuracy requirement.** The audit is tested against 10 listings with known real sizes. An honest 70% with a stated confidence band scores better than a claimed 95% a judge can break.

**Decoupling requirement.** F4 must build and demo with no database and no dependency on F1. Listings live in a JSON fixture file; the corpus is plain text/Markdown; retrieval is testable locally before any server function exists. If vector search setup slips, a local index behind the same function signature is an acceptable substitution — **do not let it block the centrepiece.**

**Acceptance:** audit a listing → estimated size appears with a confidence band → advertised-vs-estimated is visible → price compares against R&VD data → the district brief shows at least 3 citations → **the app works with the database switched off.**

### F5 — Chat + video *(embed, do not build)*

| ID | Requirement | Priority |
|---|---|---|
| F5.1 | Embedded third-party messaging and video (Jitsi or Whereby) — no custom implementation | P1 |
| F5.2 | **Video is locked until a mutual match exists.** The video control does not render at all for an unmatched user | P0 |
| F5.3 | This is framed throughout the product and the pitch as a **safety control, not a feature** | P0 |

**Acceptance:** two matched profiles → video unlocks. One unmatched profile → the video control is absent.

### F6 — Extended flat-viewing meetup *(the belonging feature)*

| ID | Requirement | Priority |
|---|---|---|
| F6.1 | From a matched pair, a user can propose a viewing and reach a scheduling handoff | P1 |
| F6.2 | The meetup extends to *"meet your roommate, plus two other verified pairs looking in the same district this month"* | P1 |
| F6.3 | No calendar backend and no events system — this replaces a separate social product | P1 |

**Why this shape:** a separate social platform would conflict with priority #1 (safety and privacy), need its own cold-start, and add an events data source, RSVP flows, a moderation queue, a no-show problem and physical safety risk. The extended meetup delivers belonging as a by-product of a task users already want to do.

### F7 — Generated settling-in plan

| ID | Requirement | Priority |
|---|---|---|
| F7.1 | Generates a personalised three-week arrival plan from quiz data already collected | P1 |
| F7.2 | Output is specific and situated — e.g. *"your first three weeks in Hung Hom, for someone who cooks and sleeps early"* | P1 |
| F7.3 | Two different quiz profiles must produce visibly different plans | P1 |

**Why this is the right belonging feature:** GenAI-native, useful with zero other users, zero physical-safety risk, and it maps directly onto the theme's culture-and-belonging criterion.

### F8 — Multilingual layer

| ID | Requirement | Priority |
|---|---|---|
| F8.1 | User-selectable output language; every generated output respects it | P1 |
| F8.2 | **Ship English + Chinese.** Claim multilingual capability on the strength of the architecture, not on a built locale count. | P1 |

---

## 7. GenAI requirements

**Organisers confirmed any GenAI inclusion is expected, with no technology blacklist.** This makes the GenAI component a **scored requirement, not garnish**. Criterion 3 explicitly requires a technical component that *requires* GenAI.

### 7.1 The honest split — this table governs the pitch

| Component | Genuinely GenAI? | Product and pitch treatment |
|---|---|---|
| Multimodal listing audit — photos → dimensions, condition, red flags | **Yes, strongly** | **Promote to headline.** Multimodal, cannot be rules-based. |
| Cited RAG over the Hong Kong corpus | **Yes, strongly** | **Promote to headline.** Grounding + citation is what makes it defensible *and* ethically safe. |
| Compatibility narrative + friction-point flagging | **Partly** | State it exactly: *"weighted scoring, LLM-generated narrative."* |
| Day-in-the-life narrative | Yes | Keep — text only, never images |
| Multilingual layer | Yes | Cheap win, broad demonstration across the whole product |
| Room size estimation | Yes — but error-prone | **Never present an estimate as a measurement.** Confidence bands always. |
| The quiz | **No** — it is a form | Keep it. Never call it AI. |
| The matching score | **No** — weighted arithmetic | Keep it. Never put it forward as the GenAI credential. |

### 7.2 Architectural requirements

| ID | Requirement |
|---|---|
| G-01 | All model calls are routed server-side. **An API key must never reach the client.** This is the single most common hackathon security failure. |
| G-02 | Prompts and model selection live in a reviewable location, not inlined across components |
| G-03 | Every generated output carries either a citation or a confidence indicator — no bare claims |
| G-04 | The RAG layer cites a real, retrievable source on every legal or factual claim |
| G-05 | The audit pipeline is separable from the rest of the app so it can be tested and demonstrated in isolation |
| G-06 | A spending cap is set before any model experimentation begins |

### 7.3 Model-call inventory

| Call | Input | Output | Grounding |
|---|---|---|---|
| Vision listing audit | Listing photos | Size estimate + confidence, condition, furniture, red flags | Photo evidence only |
| District brief | District + user context | Sourced facts on transport, amenities, rent, norms | RAG corpus, ≥3 citations |
| Compatibility narrative | Two quiz profiles | Explanation of the match + friction flags | Quiz answers only |
| Day-in-the-life | Listing + commute data | Descriptive text | Real transit and amenity data |
| Settling-in plan | Quiz answers + district | Three-week plan | Quiz + district data |
| Multilingual pass | Any of the above | Same content, target language | Pass-through |

---

## 8. Trust, safety, privacy and ethics requirements

These are **non-negotiable**, and criterion 5 ("sustainability and ethics") is one of the cheapest places to outscore a better prototype.

### 8.1 What the design already gets right — state these out loud

- **Report people, review properties.** A permanent public reputation score on *people* is defamation-adjacent, retaliatory, and has no fair appeal path. Reviews on *properties* are standard consumer protection.
- **Video unlocked only after a mutual match.** A safety control, not a feature.

### 8.2 Mandatory rules

| ID | Rule | Risk if violated |
|---|---|---|
| E-01 | **Store the verification result only** — a boolean, the institution and a timestamp. Delete the source image immediately after OCR. | Serious PDPO exposure and breach liability |
| E-02 | **Never generate images of a real flat.** Narrative text only; property photography stays authentic and unedited. | Generating plausible images of a property someone is about to sign a lease on is misinformation |
| E-03 | **Never ship uncited legal guidance.** Every generated contract or legal statement carries a source link and a visible disclaimer. | Not legal advice — but presented as if it were |
| E-04 | **Never present an estimate as a measurement.** A confidence indicator or a source on every AI output. | A confidently wrong number destroys the trust being sold |
| E-05 | **Minimum cohort threshold of 5.** No derived statistic is published from fewer than 5 reports. Consent is collected at submission. | "Aggregate" data from three complaints in one building identifies those three tenants |
| E-06 | **Reports on people stay private, human-reviewed, and never surface as a count on a profile.** | Retaliatory reports after a deposit dispute; no appeal path |
| E-07 | **District information is structured, sourced attributes only** — official crime statistics, commute times, amenities, noise. Never free-text opinion; never let the model characterise an area's safety. | Free-text opinions encode class and racial bias, depress property values, and harm residents |
| E-08 | **Synthetic profiles only in the demo.** | Organiser-confirmed acceptable; no real student data |
| E-09 | **A visible disclaimer sits on every legal or guidance surface.** | Users mistaking a prototype for a service |

### 8.3 Environmental sustainability — the product argument

Organisers confirmed "sustainability" means the **SDG / environmental** dimension, not business viability.

| Fact | Figure | Source |
|---|---|---|
| Hong Kong's electricity consumption attributable to buildings | **~90%** | HKSAR Carbon Neutrality Office |
| Hong Kong's carbon emissions from buildings | **over 60%** | HKSAR Carbon Neutrality Office / HK2050isNow |

In a city where buildings are ~90% of electricity and over 60% of carbon, how people occupy buildings matters more than almost anything else. Three mechanisms, all defensible:

1. **Shared housing is lower-carbon per person.** Two students in one flat share one air-conditioning system, one fridge, one washing machine. In Hong Kong's subtropical climate, **air conditioning is the dominant residential load** — consolidating two single-occupancy households removes an entire cooling system from the grid.
2. **Better matching → longer tenancies → fewer moves.** *This is the original insight and the one to lead with.* A failed roommate match causes someone to move again, and moving generates furniture waste and embodied carbon. **Disposal responsibility is one of the three most-litigated tenancy issues in Hong Kong** — that is the waste stream, made visible. The matching engine is itself an environmental intervention.
3. **Faster matching reduces vacancy.** Empty rooms still consume common-area energy and waste embodied carbon in a city with a 120,000-bed shortfall.

**The pitch line:** *Hong Kong's buildings produce over 60% of the city's carbon, and the single biggest determinant of residential energy use is how many people share a flat. RentMate makes shared living work better and last longer — so more students choose it, and fewer of them move twice.*

**SDG mapping:** SDG 11 (Sustainable Cities and Communities) — target 11.1 (adequate, safe, affordable housing) and target 11.6 (environmental impact of cities). Secondarily SDG 12 via resource sharing.

### 8.4 Business viability — one sentence only

Business viability belongs under *feasibility*, not sustainability. Keep it to one sentence: **landlords and operators pay for verified-tenant access**, because they absorb the vacancy and tenant risk that verification reduces. Note the elegancy — students currently pay the agent fee, but landlords are the ones who benefit from verification. Shift who pays to who benefits. **Do not build a pitch section on this.**

---

## 9. Non-functional requirements

| ID | Requirement |
|---|---|
| N-01 | Responsive web application. No native mobile. |
| N-02 | Mobile-width layout must be demoable — the target user is on a phone |
| N-03 | Single-page application with explicit routing |
| N-04 | Runs locally for the demo; a static production build must also succeed as a fallback |
| N-05 | Strict typing throughout; no untyped escape hatches in shared code |
| N-06 | A typecheck pass is required before every commit — the dev server does not typecheck |
| N-07 | The listing layer must remain demoable with the database unavailable |
| N-08 | No secret, API key, or real student data is ever committed. A committed example env file defines the required variables. |
| N-09 | English-first UI; all generated content respects the user's selected output language |
| N-10 | Cold-start tolerance: every feature except F3 and F5 must deliver value to a **single** user on first use |
| N-11 | Accessibility: every AI output must be readable as text, not conveyed by colour alone |

**Performance expectations for the demo, not production:** every generated output must return within a live-demo-viable time. Where a model call risks exceeding it, a cached result is an acceptable and preferable fallback — **and must be labelled in the demo script as cached.**

---

## 10. Judging alignment

| Criterion | Current assessment | What this PRD does about it |
|---|---|---|
| ① Convincing framing of the problem | **Strong** | §2 — real primary data plus documented market evidence, with mismatch-not-shortage framing and the health angle |
| ② Prototype / demo | **At risk** | §5.1 depth levels, §5.3 cut order, N-10 single-user value. The demo centrepiece (F4) needs no cold-start. |
| ③ Technical component **requiring GenAI** | **At risk** | §7.1 — promote the multimodal audit and cited RAG to headline; demote the weighted score to its honest role |
| ④ Feasibility and impact | **Mixed** | §5 depth levels plus §5.3 cut order. The impact story is strong; feasibility depends on scope discipline. |
| ⑤ Sustainability and ethics | **Mixed** | §8 — four ethics gaps closed, plus the corrected environmental argument, which the core product delivers rather than bolts on |

**The single most valuable set of moves:** promote the audit and the RAG layer, demote the weighted score, and cut the separate social feature. That raises three of five criteria at once.

**Validation score:** PCV **18/24** — "Strong opportunity". The two points left on the table are **Price** and **Performance**, both gated by supply-side liquidity, which a prototype cannot resolve and should not pretend to.

---

## 11. Open decisions

These block work and are not yet settled.

| ID | Decision | Why it is urgent |
|---|---|---|
| **D1** | Which AI model do we pay for, and what is the hard spending cap? | Every AI feature is blocked until this number exists |
| **D2** | Do we commit the current state of the repo? | No working demo is tagged yet; a broken laptop currently costs a week |
| **D3** | Which single machine is the demo machine? | A demo that works on one machine cannot be handed to a presenter |
| **D4** | Who presents live, and who records the backup video? | The demo is live and there is no submission buffer. A dead laptop with no video scores zero. |
| **D5** | Do we include maps and transport data in the district briefs? | Strengthens F4.6 and F4.7. Permitted by the organisers, but costs time to arrange. |
| **D6** | Pitch deck and interim report requirements | Organisers have not sent them. Packaging is blocked; underlying work is not. |
| **D7** | Is the positioning sentence confirmed? | It is used verbatim everywhere and must be locked |
| **D8** | The carbon impact number for the pitch | Required for Beat 6 of the pitch |

---

## 12. Risks and mitigations

| Risk | Severity | Mitigation |
|---|---|---|
| **The headline technical claim does not require GenAI** | **High** | §7.1. Promote the audit and RAG; demote the weighted score; say the split out loud |
| **Two-sided matching cannot be demoed with no real users** | **High** | Seeded profile pool, labelled as seeded in both UI and script. Make the single-user listing audit the wow-moment instead |
| **Vision size estimation is confidently wrong on stage** | **High** | Confidence bands on every estimate, never a point measurement. Test against 10 known listings and report the real accuracy |
| **Scope creep** | **High** | §5.2 is an explicit refusal list. Every request outside §5.1 gets the question "is this on the demo path?" |
| **Corpus assembly is slower than it looks, and organisers provide no datasets** | Medium | Start in the first block. Constrain the corpus to a defensible subset rather than attempting completeness |
| **Vector search setup slips and blocks the centrepiece** | Medium | F4 is architecturally decoupled — a local index behind the same function signature is a valid substitution |
| **Demo infrastructure failure on the day** | Medium | Recorded backup video, single rehearsed demo machine, three full rehearsals including one with a deliberate interruption |
| **Ethics claims presented without the compliance behind them** | Medium | §8.2 rules are implementation requirements, not slide copy |
| **A feature is half-built at code freeze** | Medium | §5.3 cut order. Ship a working subset at midnight rather than a broken feature at 2am |

### Kill criteria — decide these now, before being invested

- Fewer than 8 of 20 interviews describe the verification/transparency problem as acute → the core thesis is wrong.
- Fewer than 2 of 5 landlords would pay for verified-tenant access → no revenue path.
- Students consistently prefer the Facebook groups they already use despite knowing the risks → the trust gap is not painful enough to change behaviour.
- Fewer than 5 of 20 would attend a mentor meetup → drop SP3 from the pitch rather than defend an unsupportable claim.

---

## 13. Success metrics

### Demo-success metrics (what a good demo must show)

| # | Metric | Target |
|---|---|---|
| 1 | Live listing audit completes on a real Hong Kong listing with a visible confidence band | 100% of rehearsals |
| 2 | District brief displays **≥3 visible citations** | Every brief shown |
| 3 | Verification flow: image uploaded → attested → image confirmed deleted | Demonstrated live |
| 4 | Two distinct quiz profiles produce two visibly different matches and settling-in plans | Demonstrated live |
| 5 | Audit tested against 10 listings of known size, with an honest reported accuracy | Reported, not rounded up |
| 6 | Demo runs end-to-end on the named demo machine without network to the database | 100% of rehearsals |

### Product-impact metrics (what would prove the thesis beyond the hackathon)

| Metric | Why it matters |
|---|---|
| Time from sign-up to a booked viewing | The stated product goal: "days, not weeks" |
| Share of listings where advertised size ≠ estimated size within band | Quantifies the transparency gap the product attacks |
| Median tenancy duration among matched pairs | The environmental claim rests on *longer tenancies, fewer moves* — this is the measure of it |
| Share of users who verify before browsing | Whether verification is genuinely adopted as the entry gate |
| Interview evidence: post-market students describing the verification problem as acute | The single largest evidence gap in the current dataset |

---

## 14. Assumptions and dependencies

**Assumptions**

- Organisers accept localhost for the demo, and a recorded video as backup (confirmed).
- Synthetic profiles are acceptable demo data (confirmed).
- External APIs — maps, transit, R&VD open data — are permitted and arrangeable (confirmed).
- No pre-approved datasets are provided; the corpus is ours to assemble (confirmed).
- IP is ours (confirmed, unblocking).
- The list of open decisions in §11 is the only remaining blocker set.

**Caveats that must travel with any cited figure**

- Our survey is **n=41, single, self-selected, 51% dormitory-dwelling**. Cite it as a signal, not proof.
- Housing-as-biggest-stressor (~70%) is flagged anecdotal in our own source material.
- Where forecasters disagree (e.g. rent growth +2–3% per CBRE vs +5% per agents), both positions are reported, never averaged.

**Outstanding dependencies**

- Pitch deck and interim report requirements from the organisers (§11, D6) — packaging is blocked, work is not.
- Model provider and spending cap (§11, D1) — blocks all GenAI work.

---

## 15. Glossary

| Term | Meaning |
|---|---|
| **Attestation** | The boolean verification result. Never the source document. |
| **Audit** | The multimodal GenAI analysis of a listing's photos. |
| **睇樓紙 (Form 4)** | The agency viewing agreement that creates double-commission exposure. |
| **Minimum cohort** | The threshold of 5 reports below which no derived statistic may be published. |
| **PCV** | Perceived Created Value — the validation framework scoring this opportunity 18/24. |
| **RAG** | Retrieval-augmented generation — retrieved, citable grounding for generated text. |
| **Seeded profiles** | Synthetic demo profiles, always labelled as such. |
| **SP1–SP4** | The four selling points, tiered in §4.1. |

---

*This PRD consolidates the product definition — problem statement, evidence base, scope lock, GenAI split, ethics rules and judging alignment. It deliberately contains **no meeting tasks, schedules, or person assignments**; those live in `TEAM-BRIEF.md`.*

**The document split, so nothing drifts:**
- **`PRD.md` (this document)** — what the product is and why. Nothing about who does it or when.
- **`TEAM-BRIEF.md`** — decisions already made, open decisions, jobs, the build calendar, and repo setup. Nothing about product scope.
- **`docs/`** — reference only: market research, judging scorecard, strategy routes, the original deck and survey, plus `docs/build-plans.md` and `docs/pitch-and-data-pack.md` for file-level and slide-level detail.

Where this document and an older document disagree, **this document is correct** on product questions; on decisions, `TEAM-BRIEF.md` holds.
