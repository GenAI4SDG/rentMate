# RentMate — Pitch Outline & Source Data

**Purpose:** one place with the full planned scope, the numbers you are allowed to say, and the numbers you are not. Everything here is traceable to a source in the repo.
**Status:** aligned to the team-agreed interim report · 1 October 2026
**Owner:** P4 (scope guardian + pitch)

> ⚠️ **`docs/GENAI SDG interim draft.pdf` is the agreed statement of this project and outranks this page.** Conflicts have been removed. Change log: `docs/interim-report-reconciliation.md`.

---

## 0. How to read this document

Three rules govern every number below.

1. **Every figure carries a source.** If a claim has no source column, it does not go on a slide.
2. **Validated and assumed are labelled differently.** Our own survey is `n=41, self-selected, 51% live in a dormitory` — so much of the reported pain is *anticipated*, not *experienced*. Cite it, but cite the caveat in the same breath. Judges reward this.
3. **Do not average conflicting figures.** Where two sources disagree, show both. See §5.

**The four focuses — the agreed frame, in this order:**

| # | Focus | What it means |
|---|---|---|
| 1 | **Compatibility** | We match users by their lifestyle and preferences |
| 2 | **Affordability** | No high agency fee that would cost 1 month of rent |
| 3 | **Transparency** | Chatbot and neighbourhood guide covering the neighbourhood and the condition of the room |
| 4 | **Safety** — Trust and Privacy | All users undergo identity verification; they must be a university student to access the platform |

> **Discarded:** the framing sentence *"RentMate is verified trust infrastructure for student housing in Hong Kong. Compatibility matching is how we deliver it. **Verification is the product.**"* The report leads with **compatibility**, not verification, and the sentence does not appear in it.

---

## 1. The full planned scope

### 1.1 In scope — and how deep we go

| # | Feature | Depth | Rationale |
|---|---|---|---|
| F1 | **Student verification** (university email) | **Build properly** | Verification is the access gate — users must be a university student to use the platform. |
| F2 | **Lifestyle + housing quiz** | **Build properly** | Feeds everything downstream. Split: lifestyle at signup, housing/budget when browsing. |
| F3 | **Roommate matching + compatibility narrative** | **Build, on seeded profiles** | **Focus #1.** Flow and narrative real; the profile pool is seeded. Say so out loud. |
| F4 | **Listing layer + neighbourhood guide** — filters, room condition, price context vs R&VD, sourced brief, cached chatbot, comparison | **Build** | **Focus #3 — transparency.** **Listing verification is ruled out** by the report. |
| F5 | **Chat + video** | **Connect** (Google Meet) | Not built in-house. Plus photo galleries and pre-recorded video walkthrough requests. |
| F6 | **Extended flat-viewing meetup** | **Stub, lean on it** | The student-community objective. Extend step 5 of the existing flow. |
| F7 | **Generated settling-in plan** | **Build** (cheap, high value) | Turns quiz data into belonging-as-information. No cold-start, zero safety risk. |
| F8 | **Multilingual output layer** | **Build** | Report anticipates validation for **Mandarin, Korean, Japanese and French**. Ship English + Chinese; claim the architecture. |

### 1.2 Deliberately cut — do not reintroduce

The first block is the **report's own boundary list**.

| Cut | Why |
|---|---|
| HKID verification | Report boundary. University email is the rail. |
| Acting on reviews | Report boundary. No review-enforcement process. |
| Room tours guided by platform employees | Report boundary. |
| Dispute settlement | Report boundary. |
| Legal advice | Report boundary. "Contract common sense" only. |
| Services for landlords | Report boundary. Landlords may submit listings via a form. |
| Payment system | Report boundary. Users pay landlords directly. |
| 3D construction of the room | Report boundary. |
| **Verification of rental listings** | Explicitly ruled out — *"rule out verification of rental listings for now"*. |
| Separate social/events platform | Needs its own cold-start, largest unforced build cost. Replaced by F7 + F6. |
| Face scanning | Privacy. Replaced by university email verification. |
| Native mobile app | No time. Responsive web. |
| Generated images of real flats | **Hard rule.** See §7. |
| Reviews of people | We report people, review properties. See §7. |

### 1.3 The four focuses — not a tiering

| # | Focus | Pitch treatment |
|---|---|---|
| 1 | **Compatibility** | Lead here. This is the report's first focus. |
| 2 | **Affordability** | Second. "No high agency fee that would cost 1 month of rent." |
| 3 | **Transparency** | Third. Chatbot + neighbourhood guide. |
| 4 | **Safety** — Trust and Privacy | The gate. Identity verification for every user. |

> **Discarded: the SP1–SP4 tiering.** It is not in the report, and two of its claims are contradicted — SP1's "transparent listings **with reviews**" (the report puts **acting on reviews** out of scope and rules out listing verification), and the rule against saying the product saves students money (affordability is **focus #2**).

---

## 2. The pitch structure

Five minutes. Six beats. Each beat is mapped to the judging criterion it earns.

| Beat | Time | Content | Criterion earned |
|---|---|---|---|
| 1 | 45s | **The problem — two levels, in the report's numbers** | ① Framing |
| 2 | 90s | **Compatibility narrative** — the centrepiece | ③ GenAI |
| 3 | 45s | **Verification + quiz** | ② Demo, ⑤ Ethics |
| 4 | 60s | **Matching, honestly framed** | ② Demo |
| 5 | 60s | **Neighbourhood guide + settling-in plan** | ④ Impact, ⑤ Ethics |
| 6 | 30s | **Ethics close** | ⑤ Ethics, ④ Feasibility |

### Beat 1 — The problem (45s)

Lead with the report's two levels, then the market.

- **Individual:** **66%** of students are stressed about the shared expense of housing · **68%** gave up their preferred location for lack of a roommate
- **Structural:** **46%** of first-batch Top Talent Pass holders left Hong Kong, with housing friction a major factor · **120,000-bed** shortfall projected by 2028
- **Market:** Private Domestic Rental Index at a record **210.3**, driven by student and talent demand · **5,100** student bed spaces being supplied through commercial conversions
- **And the police confirm it:** the Hong Kong Police Anti-Deception Coordination Centre has flagged rising rental scams targeting students

> **The caveat you must say:** *"Our survey is n=41 and self-selected, with 51% of respondents in dormitories — so much of this pain is anticipated rather than lived. We cite it as a signal, not as proof."*
>
> ⚠️ **Check the 66% and 68% question wording in `docs/SURVEY.pdf` first.** They are the same items earlier drafts recorded as "27 detractors" and "28 detractors" (27/41 = 66%; 28/41 = 68%).

### Beat 2 — The compatibility narrative (90s)

**This is the demo's wow-moment.** Take two seeded profiles, run the match, and let the model explain — live — *why* they fit and *where they will clash*.

- Show the friction-point flagging, not just the score
- The score is arithmetic; **the narrative is the GenAI**
- Say it exactly: **"weighted scoring, with an LLM-generated narrative."**
- GPT-4o-mini, grounded in quiz data only — prompts tested so it cannot overstate compatibility

It works with two profiles, needs no cold-start, and is the one GenAI component the report names by model.

### Beat 3 — Verification + quiz (45s)

- **University email verification is the access gate** — users must be a university student to use the platform. The report states university email is sufficient.
- **State plainly: we store a boolean attestation only, never the document.** Verification is PDPO-compliant — purpose-limited, use-limited, clear consent.
- Quiz on screen, **short**. Cut the 22-question spec to ~12 on the demo path.

### Beat 4 — Matching, honestly framed (60s)

- Run the flow on the seeded profile pool
- **Say the words: "these profiles are seeded for the demo."** It buys credibility. Judges respect acknowledged simulation far more than a fake live pool.
- Describe the scoring accurately: **deterministic weighted arithmetic** — never "AI matching"

### Beat 5 — Neighbourhood guide + settling-in plan (60s)

- Neighbourhood guide with **visible citations** on every claim
- Cached transparency chatbot answering questions about the neighbourhood and the condition of a room
- Personalised three-week settling-in plan generated from quiz data — *"your first three weeks in Hung Hom, for someone who cooks and sleeps early"*
- This is where **transparency and belonging** land — as information, not as a social network

### Beat 6 — Ethics close (30s)

Three sentences, in this order:

1. **Report people, review properties.** Reports stay private and human-reviewed; a report count never appears on a profile. We do not act on reviews — that is a stated boundary.
2. **Attestation, not documents.** We never store identity papers.
3. **We are a student community tool, not a licensed property agency** — no lease negotiation, no payments, no legal advice. Minimum cohort of 5 before any derived statistic is published.

Then one line on the revenue direction: **referral fees from licensed rental property agencies, and licensing from universities** to unlock student verification.

> **(unconfirmed by the interim report)** — the environmental sustainability close (buildings ~90% of electricity, over 60% of carbon) is not backed by the report. Confirm with the team before using it as a closing beat.

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
| Gave up a location for lack of roommate | 5 promoters / **28 detractors** (28/41 = 68%) | ⚠️ **The report states this as a headline: "68% gave up their preferred location."** Earlier draft called it noise |
| Shared-expense stress | **27 detractors** (27/41 = 66%) | ⚠️ **The report states this as a headline: "66% of students stressed about shared expense."** Earlier draft called it noise |

> ⚠️ **The last two rows are now load-bearing.** The interim report re-expresses these **detractor counts as headline percentages** and promotes them to individual-level findings. **Read the actual question wording in `docs/SURVEY.pdf` before either goes on a slide** — a detractor count and an agreement rate are not the same claim. If the question is negatively worded, a "detractor" may not mean "agrees".

**Demographics:** age 18–21 = 25/41 · international university student = 24/41 · **dormitory = 21/41 (51%)** · local resident with co-living demand = 12/41 · living with parent = 11/41

**The two caveats that must travel with any citation:**

1. **51% live in a dormitory**, so reported housing pain is largely anticipated, not experienced.
2. n=41, single, self-selected survey. **Not generalisable.**

### 3.2 Market data (external, sourced)

Source: `docs/hk-rental-partner-research.html`

| Figure | Value | Source |
|---|---|---|
| **Private Domestic Rental Index — the figure the report uses** | **210.3 — record high** | **R&VD (via the interim report)** |
| Private residential rental index — earlier draft | 207.4 (Jul 2026), 9 straight months | R&VD |
| YoY rent growth | **+5.07%** | R&VD |
| **Student bed spaces being supplied via commercial conversions** | **5,100** | **Development Bureau (via the interim report)** |
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

> **(unconfirmed by the interim report)** — the report does not mention the PCV score.

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
| 1. Problem | Arriving students cannot find an accessible flat with compatible roommates — and cannot trust the market | Survey 73% / 68%; **66%** shared-expense stress; **68%** gave up a location |
| 2. Scale | The deficit is structural, not cyclical | 120,000-bed shortfall; **210.3** index; 5,100 bed spaces in conversion |
| 3. Cost of failure | Opacity and fraud | Police anti-deception warning on student rental scams; HK$21,000 case; 睇樓紙 double-commission |
| 4. Insight | No platform integrates housing, roommate matching, affordable housing and transparent information | Competitor analysis: 28Hse, Nestia, Facebook Groups |
| 5. Solution | The four focuses: compatibility · affordability · transparency · safety | Compatibility 68%; verified profiles 73%; trust verification 68%, only 2/41 detractors |
| 6. Demo | Compatibility narrative for a matched pair | Two seeded profiles, live |
| 7. GenAI | Compatibility narrative (GPT-4o-mini) + grounded, cached chatbot | See §6 |
| 8. Ethics | Attestation, report-vs-review, cohort ≥5, student community tool not an agency | See §7 |
| 9. Sustainability **(unconfirmed by the interim report)** | Buildings = 90% of electricity, >60% carbon | Carbon Neutrality Office |
| 10. Impact | Better matching → longer tenancies → fewer moves **(unconfirmed)** | Disposal responsibility = top-3 HK tenancy dispute |

---

## 5. Where sources disagree — show both, never average

| Question | Position A | Position B | What to say |
|---|---|---|---|
| **Rental index** | **210.3 — record high.** *The figure the interim report uses* | 207.4 (Jul 2026) in the earlier research pack | **Use 210.3.** It is the agreed figure |
| Rent growth outlook | **+2–3%** (CBRE) | **+5%** (agents) | "Forecasters disagree — CBRE says 2–3%, agents say 5%. We plan for the low end." |
| Student shortfall scale | ~70,000 non-local students in the open market today | 120,000-bed shortfall projected by 2028 | Report both; they measure different things (today's flow vs future stock). |
| "Sustainability" meaning | We initially assumed **business viability** | Organisers confirmed **environmental (SDG)** | **Our error. Corrected.** ⚠️ Not backed by the interim report — confirm before use |
| Naming the housing problem | "Shortage" | "Mismatch" | The **interim report uses "shortfall"** and *"the market critically lacks a centralised, verified platform"*. Do not lead with "mismatch" — it is not in the report |
| Video tooling | Google Meet | Jitsi / Whereby | **The report names Google Meet.** Use it |

---

## 6. The GenAI slide — get this exactly right

**Criterion 3 requires a technical component that requires GenAI.** Here is the honest split, per the interim report.

| Component | Genuinely GenAI? | Pitch treatment |
|---|---|---|
| **Compatibility narrative** — why two people match, plus friction-point flagging | **Yes** | **Lead with this.** Generated with **GPT-4o-mini**, grounded in quiz data. Prompt-tested so it cannot overstate compatibility |
| **Multilingual chatbot / neighbourhood guide** | **Yes** | **Lead with this.** RAG-grounded in sourced data, with disclaimers. **Cached** to control cost |
| Room size estimation | Yes — but error-prone | **Never present an estimate as a measurement.** Present a **range with a confidence level** |
| Scam detection | Yes — but error-prone | Present as **"potential concerns"**, never definitive verdicts |
| Day-in-the-life narrative | Yes | Keep — text only, never images |
| Multilingual layer | Yes | Cheap win, broad demonstration |
| The quiz | **No** — it is a form | Keep it, never call it AI |
| The matching score | **No** — deterministic weighted arithmetic | Keep it, never call it the GenAI credential |

> **Discarded:** the **multimodal listing audit** and **cited legal RAG** as the headline credentials. The report rules out verification of rental listings and puts legal advice out of scope. **Never cut the compatibility narrative** — it is the report's focus #1 and the only component the report names by model.

> **The one thing to remember:** our weakest criterion is not framing or ethics — it is that our headline technical claim did not originally require GenAI. Putting the compatibility narrative and the grounded, cached chatbot forward, and stating the weighted score as deterministic arithmetic, raises **three of five criteria at once**.

---

## 7. Non-negotiable ethics rules for the pitch

These are already decided. The pitch must state them, because a strong ethics section is the cheapest way to outscore a better prototype.

| Rule | Why it matters on stage |
|---|---|
| **Never put an API key in frontend code** | Not a slide point, but a code-review failure that costs the demo |
| **Never generate images of real flats** | Generating plausible images of a real property a student will sign a lease on is misinformation |
| **We give no legal advice** | The report puts legal advice out of scope. "Contract common sense" and sourced factual statements only — no uncited legal guidance |
| **We do not verify listings** | The report rules it out. Do not imply the platform vets a flat |
| **Store a boolean attestation, never the document** | PDPO exposure that would end the project. The report states verification is purpose-limited, use-limited and consented |
| **Never present an estimate as a measurement** | Range + confidence level, or a source, on every AI output |
| **Reports on people stay private and human-reviewed** | Retaliatory reports; no appeal path; never a count on a profile. We do not act on reviews |
| **Minimum cohort of 5 for any published aggregate** | Below that, "aggregate" data identifies individuals |
| **District info = structured sourced attributes only** | Never free-text opinions; never let the model characterise an area's safety |
| **State the regulatory position plainly** | The platform is a **student community information tool, not a licensed estate agency** — no lease negotiation, no contract execution, no payments. EAA licensing would be explored only if commercialised |
| **Synthetic profiles only in the demo** | Organisers confirmed this is fine |

---

## 8. Open items

| # | Item | Owner | Status |
|---|---|---|---|
| 8.1 | ~~Pitch deck requirements from organisers~~ | P4 | ✅ Superseded — the interim report was written and agreed |
| 8.2 | ~~Interim report requirements~~ | P4 | ✅ Done — `docs/GENAI SDG interim draft.pdf` |
| 8.3 | Who presents live | All | 🔲 Decide at kickoff |
| 8.4 | Demo video recording — target 15–16 Oct, after code freeze | P4 | 🔲 |
| 8.5 | Carbon impact number | P3 | 🔲 *(unconfirmed — §8.3 of PRD is not backed by the interim report)* |
| 8.6 | ~~Positioning sentence locked~~ | All | ❌ Discarded — the tagline is not in the report |
| 8.7 | **Check the 66% / 68% question wording in `docs/SURVEY.pdf`** | P4 | 🔲 **Do this before Beat 1 goes on a slide** |
| 8.8 | **Confirm the sustainability framing with the team** | P4 | 🔲 The report is silent on it |

---

*Companion documents: `TEAM-BRIEF.md` (decisions) · `docs/build-plans.md` (build plans) · `docs/rentmate-scope-lock.html` (judging scorecard) · `docs/hk-rental-partner-research.html` (full market research)*
