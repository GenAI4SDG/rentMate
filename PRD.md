# RentMate — Product Requirements Document

**Product:** RentMate — roommate matching and affordable housing for students in Hong Kong  
**Version:** v1.1 (hackathon scope)  
**Date:** 1 October 2026 — aligned to the team-agreed interim report  
**Build deadline / submission:** ~18 October 2026 · **Code freeze: 14 October 2026**  
**Track:** 3 — Smart Living, Culture & Belonging · **SDG 11**

> ### ⚠️ Authority
>
> **`docs/GENAI SDG interim draft.pdf` is the agreed statement of this project and outranks this document.**  
> Everything in this PRD that contradicted the interim report has been corrected. What the report does not cover is marked **(unconfirmed by the interim report)** — treat those as assumptions, not agreed positions. The full change log is `docs/interim-report-reconciliation.md`.

---

## 1. Product summary

RentMate is a responsive web application that helps non-local students settle into Hong Kong quickly — finding an **accessible flat** and **compatible roommates** in one place, without paying an agency fee worth a month's rent.

**The four focuses — stated in this order, as agreed:**

| # | Focus                          | What it means                                                                                     |
| - | ------------------------------ | ------------------------------------------------------------------------------------------------- |
| 1 | **Compatibility**              | We match users by their lifestyle and preferences                                                 |
| 2 | **Affordability**              | No high agency fee that would cost 1 month of rent                                                |
| 3 | **Transparency**               | Chatbot and neighbourhood guide covering the neighbourhood and the condition of the room          |
| 4 | **Safety** — Trust and Privacy | All users undergo identity verification; they must be a university student to access the platform |

Compatibility leads. Affordability and transparency are what make the platform worth using. Safety — trust and privacy — is the condition of entry.

### What makes it different

The Hong Kong market solves housing **or** roommates — never both, and never with a trust layer. Listing portals (28Hse, Nestia, House730, Spacious, Squarefoot) offer no matching and no verification. Matching platforms (Flatmate.com, SpareRoom, Roomster) are not Hong Kong-specific and carry no listings. Facebook and Xiaohongshu groups do both chaotically with the highest fraud density of any channel. **No one combines listings + matching + verification + student-focused pricing.**

### Product priorities (used to resolve every trade-off)

The four focuses above, in the agreed order — **compatibility, affordability, transparency, safety** — are the tie-breakers. Safety is also a hard gate: it is the condition of entry, so nothing ships that weakens it, even where a lower-numbered focus would gain.

> **Discarded:** the earlier ranking *1. Safety and privacy · 2. Convenience · 3. Transparency*. The interim report does not list "convenience" as a focus and does put compatibility and affordability ahead of transparency.

---

## 2. Problem statement

**The pain point, in the report's words.** For university students the long commute time is a big issue, and **finding an accessible flat with compatible roommates is the first problem they encounter in university**.

**The demand is structural, not cyclical.**

| Fact                                                                                               | Figure                                | Source             |
| -------------------------------------------------------------------------------------------------- | ------------------------------------- | ------------------ |
| Private Domestic Rental Index — record high, driven by heavy seasonal student and talent demand    | **210.3**                             | R\&VD              |
| Student bed spaces investors are supplying through commercial conversions                          | **5,100**                             | Development Bureau |
| Projected student hostel bed shortfall by 2028                                                     | **120,000**                           | Development Bureau |
| First-batch Top Talent Pass holders who left Hong Kong — housing friction a major factor           | **46%**                               | ImmD               |
| Professionals attracted via talent schemes since late 2022 **(unconfirmed by the interim report)** | 270,000+                              | InvestHK           |
| Non-local students 2024/25 **(unconfirmed by the interim report)**                                 | 79,000 → expected >100,000 in 2026/27 | CBRE / industry    |
| Campus hostel beds available **(unconfirmed by the interim report)**                               | ~20,000                               | Industry           |

**The problem, in two levels — as the report divides it.**

| Level          | Evidence                                                                                                                                                                                                        |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Individual** | **66%** of students are stressed about the shared expense of housing · **68%** gave up their preferred location because they had no roommate                                                                    |
| **Structural** | **46%** of first-batch Top Talent Pass holders left Hong Kong, with housing friction a major factor · a **120,000-bed shortfall** projected by 2028 because of insufficient residential vacancy across campuses |

**It affects Hong Kong's reputation and students' quality of life.** Hong Kong has promoted its education to non-local students in recent years, and rents are high at the same time.

**And the tools are broken.** The three most-litigated issues in Hong Kong residential leasing are **furnishing, deposit return, and disposal responsibility**. The 睇樓紙 (Form 4 agency agreement) creates double-commission traps. Fraud is concentrated in exactly the cheapest channels — social platforms and owner-direct listings — in six documented patterns:

| Scam typology                     | Mechanism                                                          | Primary target       |
| --------------------------------- | ------------------------------------------------------------------ | -------------------- |
| Fake landlord "abroad"            | Claims to be overseas, cannot allow viewing, demands deposit first | Students & newcomers |
| Fake agent / "no commission" bait | Social-media account induces up to a full year's prepayment        | Mainland students    |
| Cloned rental site                | Near-identical domain harvests card credentials                    | General public       |
| Forged owner authorisation        | Fake power-of-attorney legitimises an illegal sublet               | Tenants & owners     |
| Deposit withholding               | Denies tenancy existed — no written contract                       | Informal tenants     |
| Unlicensed bed-space let          | Illegal and unsafe subdivision                                     | Low-income tenants   |

> **The police confirm the gap.** The Hong Kong Police Anti-Deception Coordination Centre has flagged **rising rental scams targeting students**, highlighting the lack of a secure, trusted marketplace.

**The gap, stated precisely:** existing platforms solve housing **OR** roommates, never both, and none of them verify either side. Physical supply is growing — but the market lacks a **centralised, verified platform** to match incoming students with suitable housing and roommates.

> **(unconfirmed by the interim report)** — two framings carried over from earlier drafts, kept because the report neither uses nor rejects them. Confirm before they go on a slide.
>
> - *"Hong Kong does not have a volume problem, it has a **matching** problem"* — the report uses **shortfall** and **lack of a centralised platform** instead.
> - *Housing as the biggest stressor for arriving students (~70% of exchange students)* — the report frames the significance in terms of **cost, reputation and quality of life**, not mental health.

---

## 3. Target users and client

**Target audience (report):** **non-local students who need to settle housing in Hong Kong quickly.**

**Client — the group paying for the solution (report):** **universities or higher-education institutions in Hong Kong.** They may want to connect the service to their school portal so people can find their own places. **Local and non-local students with housing needs, and landlords,** are also named.

**Revenue direction (report):** **referral fees from licensed rental property agencies**, and **licensing from universities** — to unlock identity verification for their students.

| Segment                                          | Role                                                                  | Primary need                                                                                 |
| ------------------------------------------------ | --------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| **Non-local university students**                | Primary user                                                          | Settle housing in Hong Kong quickly, with compatible roommates and an affordable flat        |
| **Local students with housing need**             | Same journey                                                          | Same, without the visa friction                                                              |
| **Landlords**                                    | Supply listings                                                       | Reach students directly                                                                      |
| **Universities / higher-education institutions** | The client — verification rail and distribution                       | A service they can connect to their school portal, and student verification they can license |
| International newcomers / talent-scheme arrivals | Same journey, different visa **(unconfirmed by the interim report)**  | No local credit history, no guarantor, cannot view in person before arriving                 |
| Existing tenants with a spare room               | Supplies supply-side matching **(unconfirmed by the interim report)** | Fill a room with someone compatible                                                          |

**Job to be done:** *"Let me settle into Hong Kong quickly — with a compatible flatmate and a flat I can actually afford and get to."*

### Primary user journey (demo path)

1. Sign in → verify student status
2. Answer the lifestyle quiz
3. See matched roommates with an explanation of each match
4. Browse listings, filtered by budget and district
5. Read the sourced neighbourhood brief and a personalised settling-in plan
6. Propose a viewing with the matched roommate

---

## 4. Value proposition

### 4.1 The four focuses — the agreed frame

The interim report states four focuses. They are not a tiering; they are the product, in order.

| # | Focus                          | What we deliver                                                                    | Evidence                                                                                                           |
| - | ------------------------------ | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| 1 | **Compatibility**              | Matching by lifestyle and preferences, with an explanation of each match           | Compatibility matching **68%** wanted; verified profiles **73%** — our #1 of 12 features                           |
| 2 | **Affordability**              | No high agency fee that would cost 1 month of rent                                 | Agent commission is **half a month's rent from each side** — a month in total; students report **HK$5,000–10,000** |
| 3 | **Transparency**               | Chatbot and neighbourhood guide — the neighbourhood, and the condition of the room | Apartment searching **59%**; privacy the #1 dissatisfaction with shared living, **17 of 41**                       |
| 4 | **Safety** — Trust and Privacy | Identity verification: users must be a university student to access the platform   | Trust verification **68%**, with only **2 of 41** rating it unimportant                                            |

> **Discarded: the SP1–SP4 tiering.** It is not in the interim report, and two of its claims are contradicted by it — SP1's "transparent listings **with reviews**" (the report puts **acting on reviews** out of scope, and rules out listing verification), and the rule against saying the product saves students money (the report makes **affordability focus #2**).

### 4.2 Evidence integrity — requirements, not suggestions

Every quantitative claim in the product and the pitch carries a source and a caveat. Three caveats travel with any citation of our survey:

1. **51% of respondents live in a dormitory** — so reported housing pain is largely *anticipated*, not *experienced*.
2. **n=41, one survey, self-selected** — a signal, not proof. Not generalisable.
3. **The report's two individual-level findings are now load-bearing.** **66%** of students are stressed about the shared expense of housing, and **68%** gave up their preferred location because they had no roommate. These are the same survey items that earlier drafts recorded as "expense stress — 27 detractors" and "gave up a location — 5 promoters / 28 detractors" (27 of 41 = 66%; 28 of 41 = 68%). The interim report re-expresses those **detractor counts as headline percentages** and promotes them from "noise" to structural evidence. ⚠️ **Check the wording of those two questions in `docs/SURVEY.pdf` before citing them on a slide** — a detractor count and an agreement rate are not the same claim.
4. **Weight the trust and verification findings heavily; discount the softer signals.** The trust findings survive the "anticipated pain" critique because fear and risk can be assessed without experience.


**R-01** — Every AI output must render with a source or a confidence indicator. A model estimate is never presented as a measurement.  
**R-02** — Where two sources disagree on a figure, both are shown. Figures are never averaged.

### 4.3 Positioning rules

| Do say                                                     | Do not say                                                              |
| ---------------------------------------------------------- | ----------------------------------------------------------------------- |
| "Match with compatible roommates, and skip the agency fee" | "Verification is the product" — the report leads with **compatibility** |
| "Find the least-bad flatmate fast, and get your own space" | "Community living"                                                      |
| "No agency fee that costs you a month's rent"              | "We are a licensed estate agency" — this is a student community tool    |
| "Better matching → longer tenancies → fewer moves"         | "We are a property agency"                                              |

> **Discarded:** the rule *"Do not say 'We save students money' (cost is a one-off; opacity is systemic)"*. The interim report makes **affordability focus #2** — "no high agency fee that would cost 1 month of rent" — so the fee is a claim we lead with, not one we avoid.

> **Why the privacy positioning matters** *(unconfirmed by the interim report, but consistent with focus 4)*: privacy is the #1 dissatisfaction with shared living (**17 of 41**), ahead of finding a roommate (12) and rent being too high (11). The product must filter on **personal space preferences**, and a listing that honestly shows room size and layout directly answers this complaint.

---

## 5. Scope

**The decision rule:** if it is not on the demo path, it does not get built.

### 5.1 In scope — with explicit depth

| ID     | Feature                                                                              | Depth                         | Requirement                                                                                                                                                             |
| ------ | ------------------------------------------------------------------------------------ | ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **F1** | Student verification (university email)                                              | **Build properly**            | Verification is the gate — all users must be a university student **to access the platform**. The report states university email is sufficient.                         |
| **F2** | Lifestyle + housing quiz                                                             | **Build properly**            | Feeds everything downstream. Split: lifestyle at onboarding, housing/budget when browsing.                                                                              |
| **F3** | Roommate matching + compatibility narrative                                          | **Build, on seeded profiles** | The report's **focus #1**. Flow and narrative are real; the profile pool is seeded and must be labelled as such.                                                        |
| **F4** | Listing layer — filters, price context, sourced neighbourhood brief, condition notes | **Build**                     | Transparency — **focus #3**. **Listing verification is ruled out**; the sourced brief is the deliverable, not an audit.                                                 |
| **F5** | Chat + video                                                                         | **Connect, do not build**     | Link to existing platforms such as **Google Meet**, plus photo galleries and pre-recorded video walkthrough requests when live video is not feasible.                   |
| **F6** | Extended flat-viewing meetup                                                         | **Stub, lean on it**          | The student-community objective. Extend the existing "view the flat together" step.                                                                                     |
| **F7** | Generated settling-in plan                                                           | **Build** (cheap, high value) | Turns quiz data into belonging-as-information. No cold-start, zero safety risk.                                                                                         |
| **F8** | Multilingual output layer                                                            | **Build**                     | The report anticipates content validation for **Mandarin, Korean, Japanese and French**. Ship English + Chinese, and claim the architecture rather than a locale count. |

### 5.2 Out of scope — do not reintroduce

The first block is the **report's own boundary list**, quoted verbatim.

| Cut                                         | Why                                                                                           |
| ------------------------------------------- | --------------------------------------------------------------------------------------------- |
| **HKID verification**                       | Report boundary. University email is the rail.                                                |
| **Acting on reviews**                       | Report boundary. No review-enforcement process.                                               |
| **Room tours guided by platform employees** | Report boundary.                                                                              |
| **Dispute settlement**                      | Report boundary.                                                                              |
| **Legal advice**                            | Report boundary. We keep "contract common sense" only.                                        |
| **Services for landlords**                  | Report boundary. Landlords may submit listings via a form; we do not build services for them. |
| **Payment system**                          | Report boundary. Users pay landlords directly.                                                |
| **3D construction of the room**             | Report boundary.                                                                              |
| **Verification of rental listings**         | Explicitly ruled out — *"rule out verification of rental listings for now"*.                  |
| Separate social / events platform           | Needs its own cold-start; largest unforced build cost. Replaced by F6 + F7.                   |
| Face scanning                               | Privacy. University email is the rail.                                                        |
| Native mobile app                           | No time. Responsive web only.                                                                 |
| Generated images of real flats              | **Hard rule.** See §8.                                                                        |
| Public reviews of people                    | **Hard rule.** Report people, review properties. See §8.                                      |
| Custom chat / video implementation          | Connect to third-party instead.                                                               |

### 5.3 Cut order when time runs short

If the build overruns, cut in this order — and stop:

1. Side-by-side comparison
2. Multilingual layer
3. Chat and video
4. Settling-in plan

> **Never cut the compatibility matching and its narrative.** It is the report's focus #1 and the one GenAI component the report names by model (GPT-4o-mini).

---

## 6. Functional requirements

Priority key: **P0** = demo path, cannot ship without it · **P1** = stated in the pitch, should be visible · **P2** = describe only.

### F1 — Student verification 🔒 *(focus #4 — Safety: Trust and Privacy)*

| ID   | Requirement                                                                                                                                                                  | Priority                                                                          |
| ---- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| F1.1 | User signs in with university email; account state is `unverified` / `pending` / `verified` / `declined`                                                                     | P0                                                                                |
| F1.2 | **Verification is the access gate** — all users undergo identity verification, and must be a university student **to access the platform**                                   | P0                                                                                |
| F1.3 | The report states **university email is sufficient** to provide safety and trust                                                                                             | P0                                                                                |
| F1.4 | The verification record stores **only** a boolean attestation, the institution, and a timestamp. Verification is PDPO-compliant: purpose-limited, use-limited, clear consent | P0                                                                                |
| F1.5 | The verification state is visible on the user's own profile so the flow is demonstrable                                                                                      | P1                                                                                |
| F1.6 | **Student-card OCR** via a vision model, with the uploaded image deleted immediately after OCR                                                                               | P1 — *(unconfirmed by the interim report; the report relies on university email)* |

**Acceptance:** sign in → verify → state moves `pending` → `verified` → an unverified account is held at the gate and cannot reach the platform.

### F2 — Lifestyle + housing quiz *(focus #1 feeder)*

| ID   | Requirement                                                                                                                             | Priority |
| ---- | --------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| F2.1 | **Lifestyle block (6 questions) at onboarding:** sleep schedule, cleanliness, guests, noise tolerance, shared-space use, conflict style | P0       |
| F2.2 | **Housing block (6 questions) at browse time:** preferred districts, room type, budget, MTR proximity, move-in timing, lease length     | P0       |
| F2.3 | Answers persist across sessions                                                                                                         | P0       |
| F2.4 | Questions carry weights so the matching score is computed from the same source of truth                                                 | P0       |
| F2.5 | The full 22-question specification in the original deck stays as a **design reference only**, not on the demo path                      | P1       |

> **Design intent:** a 22-question wall at signup damages real completion and eats build time. Twelve questions on the demo path, split across two moments, is the requirement.

**Acceptance:** complete all 12 → answers persist on refresh → matching consumes them.

### F3 — Roommate matching + compatibility narrative *(focus #1 — Compatibility)*

| ID   | Requirement                                                                                            | Priority |
| ---- | ------------------------------------------------------------------------------------------------------ | -------- |
| F3.1 | Weighted score across the seeded pool, 0–100, computed from quiz weights                               | P0       |
| F3.2 | Filters applied before scoring: budget within a ±20% band; at least one overlapping preferred district | P0       |
| F3.3 | **GenAI narrative** explaining *why* two people match, plus explicit **friction-point flagging**       | P0       |
| F3.4 | The score must be described in-product and on stage as **weighted scoring**, never as "AI"             | P0       |
| F3.5 | The demo profile pool is seeded and **labelled as seeded in the UI and in the script**                 | P0       |
| F3.6 | The matching function is a pure function, unit-testable with no database                               | P1       |

**Honest split to state out loud:** *"weighted scoring, with an LLM-generated narrative."* The score is arithmetic; the explanation and the friction flagging are GenAI. Candour reads as competence; overclaiming reads as inexperience.

**Acceptance:** identical profiles score 100; opposite sleep schedules drop measurably; the narrative runs twice on the same pair and stays consistent.

### F4 — The listing layer and neighbourhood guide *(focus #3 — Transparency)*

**Listing verification is out of scope** — the report rules it out explicitly (*"rule out verification of rental listings for now"*). What remains is the transparency layer: accurate listing information, and a chatbot plus neighbourhood guide that tells a student about **the neighbourhood and the condition of the room**.

| ID   | Sub-feature                           | Requirement                                                                                                                                   | Priority          |
| ---- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ----------------- |
| F4.1 | **Filtered listings**                 | Filter by district, budget, room type, MTR proximity, furnished/unfurnished                                                                   | P0                |
| F4.2 | **Room condition information**        | What the room and building are actually like — layout, size as advertised, furnishing, condition. **Not an AI verification of the listing.**  | P0                |
| F4.3 | **Price context**                     | Listing rent against R\&VD district rental data, shown as a comparison                                                                        | P0                |
| F4.4 | **Sourced neighbourhood guide (RAG)** | Retrieved facts on rent levels, transport, amenities, tenancy norms, official district statistics. **Minimum 3 visible citations per brief.** | P0                |
| F4.5 | **Transparency chatbot**              | Answers questions about the neighbourhood and the condition of a room, grounded in the corpus, **with cached responses** to control API cost  | P0                |
| F4.6 | **Scam awareness**                    | Flags **potential concerns** — never definitive verdicts. False positives and false negatives are expected and must be labelled as such       | P1                |
| F4.7 | **Day-in-the-life narrative**         | Commute, noise, what is open at 11pm — **text only**                                                                                          | P1                |
| F4.8 | **Side-by-side comparison**           | Two listings compared                                                                                                                         | P2 — first to cut |

**Corpus requirement.** Retrieval runs over a curated Hong Kong corpus: R\&VD rental data, EAA guidance, tenancy terms, official district statistics, transport data. **Legal advice is out of scope** — the corpus supports "contract common sense" and sourced factual statements only. No datasets are provided by the organisers — the corpus is ours to assemble and it is slower than it looks.

**Cost requirement.** Neighbourhood-guide responses are **cached**. Core matching and scoring use **deterministic algorithms**. GPT-4o-mini is called only where language generation adds significant value.


**Listing-data requirement.** Listings come from a **scraper** plus **cold-calling flat owners** to upload photos of rooms with a **standard reference object** and the **floor plan with dimensions**, combined with synthetic data for the prototype. A **landlord listing submission form** supports real listing creation; partnerships are the post-hackathon route to more listings.

**Acceptance:** filter a listing → price compares against R\&VD data → the neighbourhood guide shows at least 3 citations → the chatbot answers a district question from the corpus with a cached response.

### F5 — Chat + video *(connect, do not build)*

| ID   | Requirement                                                                                                                                     | Priority |
| ---- | ----------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| F5.1 | Connect to **existing platforms such as Google Meet** for live viewing — no custom video implementation                                         | P1       |
| F5.2 | **Alternative viewing methods** when live video is not feasible: **photo galleries** and **pre-recorded video walkthrough requests**            | P0       |
| F5.3 | Video calling may be affected by low-bandwidth connections — the alternative methods are the mitigation, not a fallback we improvise on the day | P0       |

**Acceptance:** from a matched pair, a live session hands off to Google Meet, and a photo gallery plus a pre-recorded walkthrough request are both reachable without live video.

### F6 — Extended flat-viewing meetup *(the belonging feature)*

| ID   | Requirement                                                                                                         | Priority |
| ---- | ------------------------------------------------------------------------------------------------------------------- | -------- |
| F6.1 | From a matched pair, a user can propose a viewing and reach a scheduling handoff                                    | P1       |
| F6.2 | The meetup extends to *"meet your roommate, plus two other verified pairs looking in the same district this month"* | P1       |
| F6.3 | No calendar backend and no events system — this replaces a separate social product                                  | P1       |

**Why this shape:** a separate social platform would work against the **safety** focus, need its own cold-start, and add an events data source, RSVP flows, a moderation queue, a no-show problem and physical safety risk. The extended meetup delivers the student-community objective as a by-product of a task users already want to do.

### F7 — Generated settling-in plan

| ID   | Requirement                                                                                                           | Priority |
| ---- | --------------------------------------------------------------------------------------------------------------------- | -------- |
| F7.1 | Generates a personalised three-week arrival plan from quiz data already collected                                     | P1       |
| F7.2 | Output is specific and situated — e.g. *"your first three weeks in Hung Hom, for someone who cooks and sleeps early"* | P1       |
| F7.3 | Two different quiz profiles must produce visibly different plans                                                      | P1       |

**Why this is the right belonging feature:** GenAI-native, useful with zero other users, zero physical-safety risk, and it maps directly onto the theme's culture-and-belonging criterion.

### F8 — Multilingual layer

| ID   | Requirement                                                                                                                 | Priority |
| ---- | --------------------------------------------------------------------------------------------------------------------------- | -------- |
| F8.1 | User-selectable output language; every generated output respects it                                                         | P1       |
| F8.2 | **Ship English + Chinese.** Claim multilingual capability on the strength of the architecture, not on a built locale count. | P1       |

---

## 7. GenAI requirements

**Organisers confirmed any GenAI inclusion is expected, with no technology blacklist.** This makes the GenAI component a **scored requirement, not garnish**. Criterion 3 explicitly requires a technical component that *requires* GenAI.

### 7.1 The honest split — this table governs the pitch

| Component                                                                        | Genuinely GenAI?             | Product and pitch treatment                                                                                                                                |
| -------------------------------------------------------------------------------- | ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Compatibility narrative** — why two people match, plus friction-point flagging | **Yes**                      | **The component the report names by model.** Generated with **GPT-4o-mini**, grounded in quiz data. Prompts tested so it does not overstate compatibility. |
| **Multilingual chatbot / neighbourhood guide**                                   | **Yes**                      | **RAG-grounded** in sourced data, with disclaimers. Responses **cached** to control cost.                                                                  |
| **Room size estimation**                                                         | Yes — but error-prone        | **Never present an estimate as a measurement.** Present a **range with a confidence level**.                                                               |
| **Scam detection**                                                               | Yes — but error-prone        | Present as **"potential concerns"**, never definitive verdicts. False positives and false negatives are expected.                                          |
| Multilingual output layer                                                        | Yes                          | Cheap win, applies across the whole product                                                                                                                |
| Day-in-the-life narrative                                                        | Yes                          | Keep — text only, never images                                                                                                                             |
| The quiz                                                                         | **No** — it is a form        | Keep it. Never call it AI.                                                                                                                                 |
| The matching score                                                               | **No** — weighted arithmetic | **Deterministic algorithms**, per the report. Never put it forward as the GenAI credential.                                                                |

> **Discarded:** the promotion of a **multimodal listing audit** and **cited legal RAG** to headline GenAI credentials. The report rules out verification of rental listings and puts legal advice out of scope. The GenAI story now rests on the compatibility narrative and the grounded, cached multilingual chatbot.

### 7.2 Architectural requirements

| ID   | Requirement                                                                                                                                    |
| ---- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| G-01 | All model calls are routed server-side. **An API key must never reach the client.** This is the single most common hackathon security failure. |
| G-02 | Prompts and model selection live in a reviewable location, not inlined across components                                                       |
| G-03 | Every generated output carries either a citation or a confidence indicator — no bare claims                                                    |
| G-04 | The RAG layer cites a real, retrievable source on every legal or factual claim                                                                 |
| G-05 | The audit pipeline is separable from the rest of the app so it can be tested and demonstrated in isolation                                     |
| G-06 | A spending cap is set before any model experimentation begins                                                                                  |

### 7.3 Model-call inventory

**Model: GPT-4o-mini, used only where language generation adds significant value.** Core matching and scoring are deterministic. Neighbourhood-guide responses are cached.

| Call                              | Model                    | Input                                    | Output                                             | Grounding                            |
| --------------------------------- | ------------------------ | ---------------------------------------- | -------------------------------------------------- | ------------------------------------ |
| **Compatibility narrative**       | **GPT-4o-mini**          | Two quiz profiles                        | Explanation of the match + friction flags          | Quiz answers only                    |
| **Neighbourhood guide / chatbot** | GPT-4o-mini              | District or room question + user context | Sourced facts on transport, amenities, rent, norms | RAG corpus, ≥3 citations, **cached** |
| Room size estimation              | vision                   | Listing photos                           | Size **range** + confidence level                  | Photo evidence only                  |
| Scam detection                    | vision + rules           | Listing text + photos                    | "Potential concerns" flags                         | Photo/text evidence only             |
| Day-in-the-life                   | GPT-4o-mini              | Listing + commute data                   | Descriptive text                                   | Real transit and amenity data        |
| Settling-in plan                  | GPT-4o-mini              | Quiz answers + district                  | Three-week plan                                    | Quiz + district data                 |
| Multilingual pass                 | GPT-4o-mini              | Any of the above                         | Same content, target language                      | Pass-through                         |
| Matching score                    | **none — deterministic** | Two quiz profiles                        | 0–100 score                                        | Arithmetic                           |

---

## 8. Trust, safety, privacy and ethics requirements

These are **non-negotiable**, and criterion 5 ("sustainability and ethics") is one of the cheapest places to outscore a better prototype.

### 8.1 What the design already gets right — state these out loud

- **Report people, review properties.** A permanent public reputation score on *people* is defamation-adjacent, retaliatory, and has no fair appeal path.
- **We do not act on reviews.** The report puts **acting on reviews** out of scope. We surface information; we do not run a review-enforcement process. **Community moderation is manual during the prototype**, moving to automated spam detection, threshold-based content hiding and verified-student-only posting at larger scale.
- **The platform is a student community tool, not a licensed property agency.** It does not negotiate leases, execute contracts, process payments, or give legal advice. EAA licensing would be explored only if commercialised.

### 8.2 Mandatory rules

| ID   | Rule                                                                                                                                                                                                      | Risk if violated                                                                                |
| ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| E-01 | **Store the verification result only** — a boolean, the institution and a timestamp. Delete the source image immediately after OCR.                                                                       | Serious PDPO exposure and breach liability                                                      |
| E-02 | **Never generate images of a real flat.** Narrative text only; property photography stays authentic and unedited.                                                                                         | Generating plausible images of a property someone is about to sign a lease on is misinformation |
| E-03 | **Never ship uncited legal guidance.** Every generated contract or legal statement carries a source link and a visible disclaimer.                                                                        | Not legal advice — but presented as if it were                                                  |
| E-04 | **Never present an estimate as a measurement.** A confidence indicator or a source on every AI output.                                                                                                    | A confidently wrong number destroys the trust being sold                                        |
| E-05 | **Minimum cohort threshold of 5.** No derived statistic is published from fewer than 5 reports. Consent is collected at submission.                                                                       | "Aggregate" data from three complaints in one building identifies those three tenants           |
| E-06 | **Reports on people stay private, human-reviewed, and never surface as a count on a profile.**                                                                                                            | Retaliatory reports after a deposit dispute; no appeal path                                     |
| E-07 | **District information is structured, sourced attributes only** — official crime statistics, commute times, amenities, noise. Never free-text opinion; never let the model characterise an area's safety. | Free-text opinions encode class and racial bias, depress property values, and harm residents    |
| E-08 | **Synthetic profiles only in the demo.**                                                                                                                                                                  | Organiser-confirmed acceptable; no real student data                                            |
| E-09 | **A visible disclaimer sits on every legal or guidance surface.**                                                                                                                                         | Users mistaking a prototype for a service                                                       |

### 8.3 Environmental sustainability — the product argument

> **(unconfirmed by the interim report)** — the report does not mention sustainability at all. This section is kept because it is the strongest answer we have for the "sustainability and ethics" criterion, but it is **not** an agreed position. Confirm it with the team before it goes on a slide.

Organisers confirmed "sustainability" means the **SDG / environmental** dimension, not business viability.

| Fact                                                          | Figure       | Source                                       |
| ------------------------------------------------------------- | ------------ | -------------------------------------------- |
| Hong Kong's electricity consumption attributable to buildings | **~90%**     | HKSAR Carbon Neutrality Office               |
| Hong Kong's carbon emissions from buildings                   | **over 60%** | HKSAR Carbon Neutrality Office / HK2050isNow |

In a city where buildings are ~90% of electricity and over 60% of carbon, how people occupy buildings matters more than almost anything else. Three mechanisms, all defensible:


1. **Shared housing is lower-carbon per person.** Two students in one flat share one air-conditioning system, one fridge, one washing machine. In Hong Kong's subtropical climate, **air conditioning is the dominant residential load** — consolidating two single-occupancy households removes an entire cooling system from the grid.
2. **Better matching → longer tenancies → fewer moves.** *This is the original insight and the one to lead with.* A failed roommate match causes someone to move again, and moving generates furniture waste and embodied carbon. **Disposal responsibility is one of the three most-litigated tenancy issues in Hong Kong** — that is the waste stream, made visible. The matching engine is itself an environmental intervention.
3. **Faster matching reduces vacancy.** Empty rooms still consume common-area energy and waste embodied carbon in a city with a 120,000-bed shortfall.

**The pitch line:** *Hong Kong's buildings produce over 60% of the city's carbon, and the single biggest determinant of residential energy use is how many people share a flat. RentMate makes shared living work better and last longer — so more students choose it, and fewer of them move twice.*

**SDG mapping:** SDG 11 (Sustainable Cities and Communities) — target 11.1 (adequate, safe, affordable housing) and target 11.6 (environmental impact of cities). Secondarily SDG 12 via resource sharing.

### 8.4 Business viability — one sentence only

Business viability belongs under *feasibility*, not sustainability. The report's revenue direction: **referral fees from licensed rental property agencies**, and **licensing from universities** to unlock identity verification for their students. Keep it to one sentence. **Do not build a pitch section on this.**

> **Discarded:** *"landlords and operators pay for verified-tenant access."* That is not the report's revenue model.

---

## 9. Non-functional requirements

| ID   | Requirement                                                                                                              |
| ---- | ------------------------------------------------------------------------------------------------------------------------ |
| N-01 | Responsive web application. No native mobile.                                                                            |
| N-02 | Mobile-width layout must be demoable — the target user is on a phone                                                     |
| N-03 | Single-page application with explicit routing                                                                            |
| N-04 | Runs locally for the demo; a static production build must also succeed as a fallback                                     |
| N-05 | Strict typing throughout; no untyped escape hatches in shared code                                                       |
| N-06 | A typecheck pass is required before every commit — the dev server does not typecheck                                     |
| N-07 | The listing layer must remain demoable with the database unavailable                                                     |
| N-08 | No secret, API key, or real student data is ever committed. A committed example env file defines the required variables. |
| N-09 | English-first UI; all generated content respects the user's selected output language                                     |
| N-10 | Cold-start tolerance: every feature except F3 and F5 must deliver value to a **single** user on first use                |
| N-11 | Accessibility: every AI output must be readable as text, not conveyed by colour alone                                    |

**Performance expectations for the demo, not production:** every generated output must return within a live-demo-viable time. Where a model call risks exceeding it, a cached result is an acceptable and preferable fallback — **and must be labelled in the demo script as cached.**

---

## 10. Judging alignment

| Criterion                                 | Current assessment | What this PRD does about it                                                                                                                                                     |
| ----------------------------------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ① Convincing framing of the problem       | **Strong**         | §2 — real primary data plus documented market evidence: the two-level individual/structural split, the 210.3 index, the 5,100 bed spaces, and the police anti-deception warning |
| ② Prototype / demo                        | **At risk**        | §5.1 depth levels, §5.3 cut order, N-10 single-user value. The demo centrepiece (F4) needs no cold-start.                                                                       |
| ③ Technical component **requiring GenAI** | **At risk**        | §7.1 — the compatibility narrative and the grounded, cached multilingual chatbot carry the claim. The weighted score is stated honestly as deterministic arithmetic.            |
| ④ Feasibility and impact                  | **Mixed**          | §5 depth levels plus §5.3 cut order. The impact story is strong; feasibility depends on scope discipline.                                                                       |
| ⑤ Sustainability and ethics               | **Mixed**          | §8 — four ethics gaps closed, plus the corrected environmental argument, which the core product delivers rather than bolts on                                                   |

**The single most valuable set of moves:** make the **compatibility narrative** the centre of the GenAI story (it is focus #1 *and* the only model the report names), ground and cache the multilingual chatbot, state the matching score as deterministic arithmetic, and drop the separate social feature. That raises three of five criteria at once.

**Validation score:** PCV **18/24** — "Strong opportunity". *(unconfirmed by the interim report.)* The two points left on the table are **Price** and **Performance**, both gated by supply-side liquidity, which a prototype cannot resolve and should not pretend to.

---

## 11. Open decisions

These block work and are not yet settled.

| ID     | Decision                                                                                                                                                                              | Why it is urgent                                                                             |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| **D1** | ~~Which AI model do we pay for?~~ **Resolved by the interim report: GPT-4o-mini**, used only where language generation adds significant value. **Still open: the hard spending cap.** | The cap blocks model experimentation                                                         |
| **D2** | Do we commit the current state of the repo?                                                                                                                                           | No working demo is tagged yet; a broken laptop currently costs a week                        |
| **D3** | Which single machine is the demo machine?                                                                                                                                             | A demo that works on one machine cannot be handed to a presenter                             |
| **D4** | Who presents live, and who records the backup video?                                                                                                                                  | The demo is live and there is no submission buffer. A dead laptop with no video scores zero. |
| **D5** | Do we include maps and transport data in the neighbourhood guide?                                                                                                                     | Strengthens F4.4 and F4.7. Permitted by the organisers, but costs time to arrange.           |
| **D6** | Pitch deck and interim report requirements                                                                                                                                            | Organisers have not sent them. Packaging is blocked; underlying work is not.                 |
| **D7** | ~~Is the positioning sentence confirmed?~~ **Removed** — the tagline is not in the interim report and has been discarded.                                                             | —                                                                                            |
| **D8** | The carbon impact number for the pitch                                                                                                                                                | *(unconfirmed — §8.3 is not backed by the interim report)*                                   |

---

## 12. Risks and mitigations

| Risk                                                                            | Severity | Mitigation                                                                                                                                                       |
| ------------------------------------------------------------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **The headline technical claim does not require GenAI**                         | **High** | §7.1. The compatibility narrative and the grounded, cached chatbot carry the claim; the weighted score is stated as deterministic arithmetic                     |
| **Two-sided matching cannot be demoed with no real users**                      | **High** | Seeded profile pool, labelled as seeded in both UI and script. Make the **compatibility narrative** the wow-moment — it needs only two profiles, not a live pool |
| **Room size estimation is confidently wrong on stage**                          | **High** | Present a **range with a confidence level**, never a point measurement. State the error margin out loud                                                          |
| **Scope creep**                                                                 | **High** | §5.2 is an explicit refusal list. Every request outside §5.1 gets the question "is this on the demo path?"                                                       |
| **Corpus assembly is slower than it looks, and organisers provide no datasets** | Medium   | Start in the first block. Constrain the corpus to a defensible subset rather than attempting completeness                                                        |
| **Vector search setup slips and blocks the centrepiece**                        | Medium   | F4 is architecturally decoupled — a local index behind the same function signature is a valid substitution                                                       |
| **Demo infrastructure failure on the day**                                      | Medium   | Recorded backup video, single rehearsed demo machine, three full rehearsals including one with a deliberate interruption                                         |
| **Ethics claims presented without the compliance behind them**                  | Medium   | §8.2 rules are implementation requirements, not slide copy                                                                                                       |
| **A feature is half-built at code freeze**                                      | Medium   | §5.3 cut order. Ship a working subset at midnight rather than a broken feature at 2am                                                                            |

### Kill criteria — decide these now, before being invested

- Fewer than 8 of 20 interviews describe the verification/transparency problem as acute → the core thesis is wrong.
- Fewer than 2 of 5 landlords would pay for verified-tenant access → no revenue path.
- Students consistently prefer the Facebook groups they already use despite knowing the risks → the trust gap is not painful enough to change behaviour.
- Fewer than 5 of 20 would attend a mentor meetup → drop the mentor element from the pitch rather than defend an unsupportable claim.

---

## 13. Success metrics

### Demo-success metrics (what a good demo must show)

| # | Metric                                                                                        | Target             |
| - | --------------------------------------------------------------------------------------------- | ------------------ |
| 1 | **Compatibility narrative** generated for a matched pair, grounded in quiz data               | 100% of rehearsals |
| 2 | Neighbourhood guide displays **≥3 visible citations**                                         | Every brief shown  |
| 3 | Verification flow: user verified as a university student, and held at the gate until verified | Demonstrated live  |
| 4 | Two distinct quiz profiles produce two visibly different matches and settling-in plans        | Demonstrated live  |
| 5 | Room size shown as a **range with a confidence level**, never a point measurement             | Every estimate     |
| 6 | Demo runs end-to-end on the named demo machine                                                | 100% of rehearsals |

### Product-impact metrics (what would prove the thesis beyond the hackathon)

| Metric                                                                                | Why it matters                                                                               |
| ------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Time from sign-up to a booked viewing                                                 | The stated product goal: "days, not weeks"                                                   |
| Share of listings where advertised size ≠ estimated size within band                  | Quantifies the transparency gap the product attacks                                          |
| Median tenancy duration among matched pairs                                           | The environmental claim rests on *longer tenancies, fewer moves* — this is the measure of it |
| Share of users who verify before browsing                                             | Whether verification is genuinely adopted as the entry gate                                  |
| Interview evidence: post-market students describing the verification problem as acute | The single largest evidence gap in the current dataset                                       |

---

## 14. Assumptions and dependencies

**Assumptions**

- Organisers accept localhost for the demo, and a recorded video as backup (confirmed).
- Synthetic profiles are acceptable demo data (confirmed).
- External APIs — maps, transit, R\&VD open data — are permitted and arrangeable (confirmed).
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

| Term                 | Meaning                                                                                                                                |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| **Attestation**      | The boolean verification result. Never the source document.                                                                            |
| **Audit**            | The GenAI analysis of a listing's photos for **size range, condition and potential scam concerns**. Not a verification of the listing. |
| **睇樓紙 (Form 4)**     | The agency viewing agreement that creates double-commission exposure.                                                                  |
| **Minimum cohort**   | The threshold of 5 reports below which no derived statistic may be published.                                                          |
| **PCV**              | Perceived Created Value — the validation framework scoring this opportunity 18/24.                                                     |
| **RAG**              | Retrieval-augmented generation — retrieved, citable grounding for generated text.                                                      |
| **Seeded profiles**  | Synthetic demo profiles, always labelled as such.                                                                                      |
| **The four focuses** | Compatibility · Affordability · Transparency · Safety (Trust and Privacy) — the agreed frame in §4.1.                                  |

---

*This PRD consolidates the product definition — problem statement, evidence base, scope lock, GenAI split, ethics rules and judging alignment. It deliberately contains **no meeting tasks, schedules, or person assignments**; those live in `TEAM-BRIEF.md`.*

**The document split, so nothing drifts:**

- **`PRD.md` (this document)** — what the product is and why. Nothing about who does it or when.
- **`TEAM-BRIEF.md`** — decisions already made, open decisions, jobs, the build calendar, and repo setup. Nothing about product scope.
- **`docs/`** — reference only: market research, judging scorecard, strategy routes, the original deck and survey, plus `docs/build-plans.md` and `docs/pitch-and-data-pack.md` for file-level and slide-level detail.

Where this document and an older document disagree, **this document is correct** on product questions; on decisions, `TEAM-BRIEF.md` holds.
