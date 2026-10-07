# Interim report is authoritative — what changed in the md files

**Source of truth:** `docs/GENAI SDG interim draft.pdf` (8 pages, 23 questions) — reviewed and agreed by the team.
**Date applied:** 1 October 2026
**Rule from here on:** where any markdown file in this repo disagrees with the interim report, **the interim report wins**. Conflicting text has been removed from the md files.

A backup of every md file as it stood before this reconciliation is in `.backup-pre-interim-2026-10-01/`.

---

## 1. The four focuses (replaces the old positioning)

The interim report states the project's focus as four items, in this order:

| # | Focus | How the report defines it |
|---|---|---|
| 1 | **Compatibility** | We match users by their lifestyle and preferences |
| 2 | **Affordability** | No high agency fee that would cost 1 month of rent |
| 3 | **Transparency** | Chatbot and neighbourhood guide for information about the neighbourhood and the condition of the room |
| 4 | **Safety** — Trust and Privacy | All users undergo identity verification; they must be a university student to access the platform |

**Discarded:**
- The tagline *"RentMate is verified trust infrastructure for student housing in Hong Kong. Compatibility matching is how we deliver it. **Verification is the product.**"* — the report makes **compatibility the first focus**, not a mechanism, and does not contain this sentence.
- The three-priority ranking *1. Safety and privacy · 2. Convenience · 3. Transparency* — replaced by the four focuses above. **"Convenience" does not appear in the report; "Compatibility" and "Affordability" do.**
- The SP1–SP4 tiering as the primary frame (see §5).

---

## 2. Numbers corrected

| Figure | Was in the md files | **Now (interim report)** |
|---|---|---|
| R&VD Private Domestic Rental Index | 207.4 (Jul 2026), 9 straight rises, +5.07% YoY | **210.3 — record high** |
| Students stressed about shared housing expense | "27 detractors — weak, treat as noise" | **66%** — an individual-level finding |
| Students who gave up their preferred location for lack of a roommate | "5 promoters / 28 detractors — weak, treat as noise" | **68%** — an individual-level finding |
| Student bed spaces being supplied via commercial conversions | not present | **5,100** (Development Bureau) |
| Opening pain point | (not stated) | **Long commute time**; finding an accessible flat with compatible roommates is the first problem students hit at university |

Unchanged and still correct: 41 survey respondents · 46% of first-batch Top Talent Pass holders did not renew · 120,000-bed shortfall projected by 2028.

> ⚠️ **Flag for the team, not a contradiction to discard.** The two promoted figures are the same underlying counts that the md files had labelled "weak / noise": 27 of 41 = 66%, and 28 of 41 = 68%. The report re-expresses **detractor counts as headline percentages**. Those two claims are now load-bearing in the problem framing, so the wording behind them should be checked against the raw `SURVEY.pdf` before they go on a slide. See §8.

---

## 3. What is in the GenAI story — and what was cut

The report is explicit about scope:

> *"there is a strong need to limit the scope of our project after ideation, for instance to **rule out verification of rental listings for now**."*

**Discarded:**
- The **multimodal listing audit** as the demo centrepiece and "our only unambiguous GenAI credential". Listing verification is ruled out.
- The instruction *"Never cut the listing audit"* and the cut order built around it.
- The claim that the audit + cited RAG over legal corpora is what earns the GenAI criterion.

**Now authoritative — the GenAI components the report names:**
- **GPT-4o-mini**, used *only* where language generation adds significant value — specifically **compatibility narratives**.
- **Deterministic algorithms** for core matching and scoring.
- **Cached** neighbourhood-guide responses.
- Room-size estimation (presented as a range with confidence, never a measurement).
- Scam detection (presented as "potential concerns", never definitive verdicts).
- Multilingual chatbot (RAG-grounded, disclaimers included).

**Also resolved by the report:** the model choice is no longer an open decision. The report states GPT-4o-mini.

---

## 4. Listing data — how it is actually sourced

| Was in the md files | **Now (interim report)** |
|---|---|
| "8 hand-written synthetic listings — **never scraped**" | A **scraper** to locate listings, then **cold-calling flat owners** to upload photos of rooms with a **standard reference object** and the **floor plan with dimensions** |
| Synthetic listings only | **Manually collected listings combined with synthetic data**; a **landlord listing submission form**; partnerships explored after the hackathon |

---

## 5. Selling points and positioning

The SP1–SP4 tiering is **not** in the report. Two of its claims are contradicted:

- **SP1 "transparent listings with reviews"** — the report's boundary list puts **"acting on reviews"** out of scope, and listing verification is ruled out (§3).
- **Affordability** — the md files carried the rule *"Do not say 'We save students money'"*. The report makes affordability **focus #2** ("no high agency fee that would cost 1 month of rent"). That rule is discarded.

---

## 6. Target users, clients and revenue

| Item | Was in the md files | **Now (interim report)** |
|---|---|---|
| Target audience | Non-local students **plus** international newcomers, existing tenants with a spare room, landlords/operators, university housing offices | **Non-local students who need to settle housing in Hong Kong quickly** |
| Client (who pays) | Landlords and operators paying for verified-tenant access | **Universities / higher-education institutions** (embedding the service in the school portal); local and non-local students with housing need; landlords |
| Revenue | Verified-tenant access for landlords and operators | **Referral fees from licensed rental property agencies** + **licensing from universities** (to unlock identity verification for their students) |

---

## 7. Scope, boundaries and stack

**Boundaries the report states (project will not address):** HKID verification · acting on reviews · room tours guided by platform employees · dispute settlement · legal advice · services for landlords · payment system · 3D construction of the room.

**Discarded or corrected elsewhere:**

| Item | Was | **Now** |
|---|---|---|
| Chat / video | Embed **Jitsi or Whereby** | Connect to existing platforms like **Google Meet**, plus alternative viewing methods — **photo galleries** and **pre-recorded video walkthrough requests** — when live video is not feasible |
| Verification rail | University email **+ student-card OCR**; unverified users may browse listings | **University email is sufficient** to provide safety and trust; all users must be verified as university students **to access the platform** |
| Landlord portal | "Cut — an extra user type" | Landlords are a **client group**; a **landlord listing submission form** is planned |
| Community | "Belonging ships as information + one extended meetup, **not** a social platform" | **Student community** is one of the stated project objectives; **community moderation** is called critical (manual at prototype, later automated spam detection, threshold-based content hiding, verified-student-only posting) |
| Multilingual | Ship English + Chinese only | Report anticipates **Mandarin, Korean, Japanese and French** content validation |
| Legal content | Cited RAG over EAA guidance, Lands Tribunal procedure, stamp duty, tenancy terms | **Legal advice is out of scope**; the report keeps only **"contract common sense"** |
| Team structure | Four named workstreams P1–P4 | Report describes **two groups: research & design, and technical development**, with **weekly online meetings** |

---

## 8. Unconfirmed — kept, but not backed by the report

These are **not contradicted** by the report, but the report does not support them either. They are left in place, flagged, and should be treated as assumptions until the team confirms:

- **Sustainability framing** (buildings ~90% of electricity, over 60% of carbon; matching as a carbon intervention). The report does not mention sustainability at all.
- **"Mismatch, not shortage"** as the problem framing — the report uses *shortfall* and *lack of a centralised platform*.
- **Housing as the biggest stressor (~70% of exchange students)** — a mental-health framing absent from the report.
- **"Days, not weeks"** product goal, the **PCV 18/24** score, the **HK$21,000** documented fraud case, the 睇樓紙 double-commission trap, and the six scam typologies — none appear in the report.
- **The tsconfig / TypeScript trap, branch names, `npm run typecheck`** and the rest of the repo setup detail — engineering facts the report does not cover.

---

## 9. Files edited

| File | Change |
|---|---|
| `PRD.md` | Focuses, figures, GenAI split, scope boundaries, target/client/revenue, video, verification rail |
| `TEAM-BRIEF.md` | Positioning, decisions table, figures, GenAI claim, video, stack |
| `README.md` | Positioning line, chat/video stack |
| `docs/pitch-and-data-pack.md` | Positioning, figures, cut list, GenAI slide, ethics/evidence tables, revenue |
| `docs/build-plans.md` | F4 listing layer, F5 chat/video, model choice, listing fixtures |
| `docs/open-decisions.md` | D3 (model + spend cap) resolved; figures |
