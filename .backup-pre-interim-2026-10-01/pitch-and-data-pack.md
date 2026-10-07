# RentMate — Pitch Outline & Source Data

**Purpose:** one place with the full planned scope, the numbers you are allowed to say, and the numbers you are not. Everything here is traceable to a source in the repo.
**Status:** draft for the kickoff meeting · 25 September 2026
**Owner:** P4 (scope guardian + pitch)

---

## 0. How to read this document

Three rules govern every number below.

1. **Every figure carries a source.** If a claim has no source column, it does not go on a slide.
2. **Validated and assumed are labelled differently.** Our own survey is `n=41, self-selected, 51% live in a dormitory` — so most of the reported pain is *anticipated*, not *experienced*. Cite it, but cite the caveat in the same breath. Judges reward this.
3. **Do not average conflicting figures.** Where two sources disagree, show both. See §5.

**The framing sentence — use it verbatim everywhere:**

> RentMate is verified trust infrastructure for student housing in Hong Kong. Compatibility matching is how we deliver it. **Verification is the product.**

This is not a marketing line. It is the fix for three judging criteria at once (§6).

---

## 1. The full planned scope

### 1.1 In scope — and how deep we go

| # | Feature | Depth | Rationale |
|---|---|---|---|
| F1 | **Student verification** (university email + student-card OCR) | **Build properly** | It *is* the differentiator. Must look real on stage. |
| F2 | **Lifestyle + housing quiz** | **Build properly** | Feeds everything downstream. Split: lifestyle at signup, housing/budget when browsing. |
| F3 | **Roommate matching + compatibility narrative** | **Build, on seeded profiles** | Flow and narrative real; the profile pool is seeded. Say so out loud. |
| F4 | **Listing layer** — filters, multimodal audit, price fairness vs R&VD, district brief with citations, comparison | **Build deepest** | Our demo centrepiece and our only unambiguous GenAI credential. |
| F5 | **In-app chat + video** | **Embed** (Jitsi / Whereby) | Gate video behind mutual match — it is a safety control, not a feature. |
| F6 | **Extended flat-viewing meetup** | **Stub, lean on it** | This *is* our belonging feature. Extend step 5 of the existing flow. |
| F7 | **Generated settling-in plan** | **Build** (cheap, high value) | Turns quiz data into belonging-as-information. No cold-start, zero safety risk. |
| F8 | **Multilingual output layer** | **Build, English + Chinese** | Near-zero cost, works across every other feature. |

### 1.2 Deliberately cut — do not reintroduce

| Cut | Why |
|---|---|
| Separate social/events platform | Conflicts with priority #1 (safety+privacy), needs its own cold-start, largest unforced build cost. Replaced by F7 + F6. |
| 3D room reconstruction | Weeks of work alone. Replaced by photo analysis + AI description. |
| Face scanning | Privacy. Replaced by university email verification. |
| Payments | Out of scope for a hackathon. Users pay landlords directly. |
| Landlord portal | Extra user type. Landlords list via a form if needed. |
| Native mobile app | No time. Responsive web. |
| Generated images of real flats | **Hard rule.** See §7. |
| Reviews of people | We report people, review properties. See §7. |

### 1.3 The four selling points, tiered

| Tier | Content | Pitch treatment |
|---|---|---|
| **Tier 1 — core positioning** | SP1 verified listings + SP2 verified persons | Lead here. This is what RentMate *is*. |
| **Tier 2 — originality + community/health criterion** | SP3 GenAI guidebook, senior mentors, one extended meetup | Describe, don't build beyond F6+F7. Weakest evidence in our survey. |
| **Tier 3 — side asset, never a headline** | SP4 complaints/reviews packaged as regulator data | Internal design note only. One sentence in the ethics section. |

---

## 2. The pitch structure

Five minutes. Six beats. Each beat is mapped to the judging criterion it earns.

| Beat | Time | Content | Criterion earned |
|---|---|---|---|
| 1 | 45s | **The problem, in our own numbers** | ① Framing |
| 2 | 90s | **Live listing audit** — the centrepiece | ③ GenAI |
| 3 | 45s | **Verification + quiz** | ② Demo, ⑤ Ethics |
| 4 | 60s | **Matching, honestly framed** | ② Demo |
| 5 | 60s | **Grounded brief + settling-in plan** | ④ Impact, ⑤ Ethics |
| 6 | 30s | **Ethics + sustainability close** | ⑤ Ethics, ④ Feasibility |

### Beat 1 — The problem (45s)

Lead with the two hardest-to-argue numbers, then the market, then the health framing.

- **73%** want verified profiles (30 of 41) — our #1 of 12 features
- **68%** rate trust verification critical; **only 2 of 41** rated it unimportant
- **17 of 41** name privacy as their #1 dissatisfaction with shared living — *ahead of* finding a roommate (12) and rent being too high (11)
- **120,000** projected student-hostel bed shortfall by 2028
- **207.4** private residential rental index, Jul 2026 — 9 consecutive records, **+5.07% YoY**
- Land on health: housing is the **biggest stressor** for arriving students (deck, n=41 survey, and the 46% talent non-renewal rate)

> **The caveat you must say:** *"Our survey is n=41 and self-selected, with 51% of respondents in dormitories — so much of this pain is anticipated rather than lived. We cite it as a signal, not as proof."*

### Beat 2 — Live listing audit (90s)

**This is the demo's wow-moment and it must be real.** Take a real Hong Kong listing with real photos. Run the multimodal audit live. Show:

- Estimated room size vs **advertised** size (this attacks "the room was half the size advertised" directly)
- Price vs **R&VD** data for that district
- Red-flag detection — stock photos, text/photo mismatch
- Confidence indicator on screen, always

Nothing else in the demo needs to carry this much weight. It works with one user, needs no cold-start, and is unambiguously GenAI.

### Beat 3 — Verification + quiz (45s)

- University email verification → student-card OCR via vision model
- **State plainly: we store a boolean attestation only, never the document.** The source image is deleted immediately after OCR. Say this explicitly — it is a strength, not a footnote.
- Quiz on screen, **short**. Cut the 22-question spec to ~12 on the demo path.

### Beat 4 — Matching, honestly framed (60s)

- Run the flow on the seeded profile pool
- **Say the words: "these profiles are seeded for the demo."** It buys credibility. Judges respect acknowledged simulation far more than a fake live pool.
- Show the GenAI compatibility narrative and friction-point flagging
- Describe the scoring accurately: **"weighted scoring, with an LLM-generated narrative"**

### Beat 5 — Grounded brief + settling-in plan (60s)

- District brief with **visible citations** on every claim
- Personalised three-week settling-in plan generated from quiz data — *"your first three weeks in Hung Hom, for someone who cooks and sleeps early"*
- This is where **culture and belonging** land — as information, not as a social network

### Beat 6 — Ethics + sustainability close (30s)

Four sentences, in this order:

1. **Report people, review properties.** Reports stay private and human-reviewed; a report count never appears on a profile.
2. **Attestation, not documents.** We never store identity papers.
3. **Minimum cohort of 5** before any derived statistic is published — below that, aggregation de-anonymises people.
4. **Sustainability:** better matching → longer tenancies → fewer moves, in a city where **buildings are ~90% of electricity consumption and over 60% of carbon emissions**.

Then one line on the revenue direction: verified-tenant access for landlords and operators — *shift who pays to who benefits.*

---

## 3. Data pack — the numbers you may cite

### 3.1 Our own survey (validated, with caveats)

Source: `docs/SURVEY.pdf` · n=41 · collected 20 Sep 2026 · average completion 3:59

| Finding | Figure | Strength |
|---|---|---|
| Verified profiles wanted | **30/41 = 73%** — #1 of 12 features | **Strong** |
| Compatibility matching wanted | **28/41 = 68%** | Strong |
| Trust verification important | **28/41 = 68%**, only **2/41** low | **Strong** |
| Apartment searching | 24/41 = 59% | Moderate |
| Rent splitting tools | 18/41 = 44% | Moderate |
| Review system | 16/41 = 39% | Moderate |
| In-app messaging | 11/41 = 27% | Weak |
| Privacy = #1 dissatisfaction | **17/41 = 41%** | Strong |
| Finding a suitable roommate | 12/41 = 29% | Moderate |
| Rent too high | 11/41 = 29% | Moderate |
| Loneliness | 6/41 = 15% | Weak |
| Reviews of previous roommates important | 16/41 promoters | Moderate |
| Compatible-roommate-by-habits usefulness | 14 promoters / 18 passives / 9 detractors | **Weak — net neutral** |
| Gave up a location for lack of roommate | 5 promoters / 28 detractors | **Weak — treat as noise** |
| Shared-expense stress | 27 detractors | Weak |

**Demographics:** age 18–21 = 25/41 · international university student = 24/41 · **dormitory = 21/41 (51%)** · local resident with co-living demand = 12/41 · living with parent = 11/41

**The two caveats that must travel with any citation:**

1. **51% live in a dormitory**, so reported housing pain is largely anticipated, not experienced.
2. n=41, single, self-selected survey. **Not generalisable.**

### 3.2 Market data (external, sourced)

Source: `docs/hk-rental-partner-research.html`

| Figure | Value | Source |
|---|---|---|
| Private residential rental index | **207.4** (Jul 2026) — all-time record, 9 straight months | R&VD |
| YoY rent growth | **+5.07%** | R&VD |
| Student hostel bed shortfall by 2028 | **120,000** | Development Bureau, Feb 2026 |
| Non-local students in the open rental market | **~70,000** (only ~20,000 campus beds exist) | Sing Tao / industry |
| Full-time non-local students 2024/25 | **79,000**, up from ~40,000 four years earlier | — |
| Top Talent Pass first-batch non-renewal | **46%** (only 54% of 13,678 applied to renew) | ImmD, 2026 |
| — Category A (high income) renewal | **77%** | ImmD |
| — Category C (recent graduate) renewal | **40%** | ImmD |
| Agent commission | Half a month's rent **from each side** = 1 month total | Industry practice |
| — Student-reported agent fees | **HK$5,000–10,000** | Deck |
| Cash-to-move-in convention | 2 months deposit + 1 month advance | Industry |
| — On a HK$18,000 flat | **HK$65,000–75,000** before furniture | Industry |
| Buildings share of HK electricity | **~90%** | HKSAR Carbon Neutrality Office |
| Buildings share of HK carbon | **over 60%** | HKSAR Carbon Neutrality Office |
| HKU exchange students per year | ~5,000 | Deck |
| Average student rent | HK$4,500–7,000/month (shared room) | Deck |
| Police anti-scam hotline | **18222** | HK Police |

**Verified scam typologies** (documented in research, usable as evidence):

| Type | Mechanism | Target |
|---|---|---|
| Fake landlord "abroad" | Claims overseas, can't allow viewing, demands deposit first | Students & newcomers |
| Fake agent / "no commission" bait | Social-media account, induces up to a full year's prepayment | Mainland students |
| Cloned rental site | Near-identical domain, harvests card credentials | General public |
| Forged owner authorisation | Fake power-of-attorney legitimises an illegal sublet | Tenants & owners |
| Deposit withholding | Denies tenancy existed — no written contract | Informal tenants |
| Unlicensed bed-space let | Illegal and unsafe subdivision | Low-income tenants |

> **Documented case:** a tenant paid **HK$21,000** (2 months deposit + 1 month rent) to an "agent" quoting a genuine registered licence number — the agency had no such listing.

### 3.3 Our validation score

| Metric | Value | Source |
|---|---|---|
| PCV total | **18/24** — "Strong opportunity" | `docs/rentmate-implementation-methods.html` |
| Current-solution pain | 10/12 | Same |
| Our improvement | 8/12 | Same |
| Points left on the table | **Price and Performance** — both supply-gated | Same |

---

## 4. What goes on which slide

| Slide | Claim | Evidence |
|---|---|---|
| 1. Problem | Arriving students cannot verify a flat or a person | Survey 73% / 68%; police-documented fraud typologies |
| 2. Scale | The housing deficit is structural, not cyclical | 120,000-bed shortfall; 207.4 index; +5.07% YoY |
| 3. Cost of failure | Opacity, fraud, and a health cost | HK$21,000 case; 睇樓紙 double-commission; housing as top stressor |
| 4. Insight | **It is a matching problem, not a volume problem** | Record rents *and* landlord difficulty finding tenants |
| 5. Solution | Verification is the product; matching is the mechanism | Trust verification 68%, only 2/41 detractors |
| 6. Demo | Live listing audit | Real listing, real R&VD comparison |
| 7. GenAI | Multimodal audit + cited RAG | See §6 |
| 8. Ethics | Attestation, report-vs-review, cohort ≥5 | See §7 |
| 9. Sustainability | Buildings = 90% of electricity, >60% carbon | Carbon Neutrality Office |
| 10. Impact | Better matching → longer tenancies → fewer moves | Disposal responsibility = top-3 HK tenancy dispute |

---

## 5. Where sources disagree — show both, never average

| Question | Position A | Position B | What to say |
|---|---|---|---|
| Rent growth outlook | **+2–3%** (CBRE) | **+5%** (agents) | "Forecasters disagree — CBRE says 2–3%, agents say 5%. We plan for the low end." |
| Student shortfall scale | ~70,000 non-local students in the open market today | 120,000-bed shortfall projected by 2028 | Report both; they measure different things (today's flow vs future stock). |
| "Sustainability" meaning | We initially assumed **business viability** | Organisers confirmed **environmental (SDG)** | **Our error. Corrected.** Do not frame sustainability as a revenue model. |
| Naming the housing problem | "Shortage" | **"Mismatch"** — ~17,000 private completions/year, but designed for sale, not for students | Lead with **mismatch**; it is more accurate and more defensible. |

---

## 6. The GenAI slide — get this exactly right

**Criterion 3 requires a technical component that requires GenAI.** Here is the honest split.

| Component | Genuinely GenAI? | Pitch treatment |
|---|---|---|
| Multimodal listing audit — photos → dimensions, condition, red flags | **Yes, strongly** | **Lead with this.** Multimodal, cannot be rules-based. |
| Cited RAG over the HK corpus — R&VD, EAA, Lands Tribunal, stamp duty, tenancy terms, district stats | **Yes, strongly** | **Lead with this.** Grounding + citation. |
| Compatibility narrative + friction-point flagging | Partly | Say it exactly: *"weighted scoring, LLM-generated narrative."* |
| Day-in-the-life narrative | Yes | Keep — text only, never images |
| Multilingual layer | Yes | Cheap win, broad demonstration |
| The quiz | **No** — it is a form | Keep it, never call it AI |
| The matching score | **No** — weighted arithmetic | Keep it, never call it the GenAI credential |
| Room size estimation | Yes, but error-prone | **Never present an estimate as a measurement.** Confidence bands. |

> **The one thing to remember:** our weakest criterion is not framing or ethics — it is that our headline technical claim did not originally require GenAI. Promoting the audit and the RAG layer, and demoting the weighted score, raises **three of five criteria at once**.

---

## 7. Non-negotiable ethics rules for the pitch

These are already decided. The pitch must state them, because a strong ethics section is the cheapest way to outscore a better prototype.

| Rule | Why it matters on stage |
|---|---|
| **Never put an API key in frontend code** | Not a slide point, but a code-review failure that costs the demo |
| **Never generate images of real flats** | Generating plausible images of a real property a student will sign a lease on is misinformation |
| **Never ship uncited legal guidance** | Every generated legal statement carries a source + visible disclaimer |
| **Store a boolean attestation, never the document** | PDPO exposure that would end the project |
| **Never present an estimate as a measurement** | Confidence indicator or source on every AI output |
| **Reports on people stay private and human-reviewed** | Retaliatory reports; no appeal path; never a count on a profile |
| **Minimum cohort of 5 for any published aggregate** | Below that, "aggregate" data identifies individuals |
| **District info = structured sourced attributes only** | Never free-text opinions; never let the model characterise an area's safety |
| **Synthetic profiles only in the demo** | Organisers confirmed this is fine |

---

## 8. Open items

| # | Item | Owner | Status |
|---|---|---|---|
| 8.1 | Pitch deck requirements from organisers | P4 | ⛔ Blocked |
| 8.2 | Interim report requirements | P4 | ⛔ Blocked |
| 8.3 | Who presents live | All | 🔲 Decide at kickoff |
| 8.4 | Demo video recording — target 15–16 Oct, after code freeze | P4 | 🔲 |
| 8.5 | P3's carbon impact number | P3 | 🔲 |
| 8.6 | Positioning sentence locked | All | 🔲 Confirm |

---

*Companion documents: `TEAM-BRIEF.md` (decisions) · `docs/build-plans.md` (build plans) · `docs/rentmate-scope-lock.html` (judging scorecard) · `docs/hk-rental-partner-research.html` (full market research)*
