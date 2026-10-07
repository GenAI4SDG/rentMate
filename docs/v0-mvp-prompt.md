# v0 / Vercel prompt — RentMate MVP

Copy everything in the block below into v0. It describes only layout and behaviour; no background or rationale.

---

```
Build a complete MVP web app called RentMate — roommate matching and affordable housing for university students in Hong Kong. Next.js App Router, TypeScript, Tailwind, shadcn/ui, lucide-react icons, light theme, mobile-first responsive. English-first, with an EN / 中文 toggle in the header that switches every string and all generated content.

All data is mocked in local fixtures — no backend, no API keys. Seed 10 student profiles, 8 listings, and a small neighbourhood corpus. Any screen showing seeded data displays a small "Demo data — seeded profiles" badge.

GLOBAL SHELL
Sticky top bar: logo, nav (Matches · Listings · Plan · Profile), language toggle, verification-status pill. On desktop a persistent left sidebar; on mobile a bottom tab bar. A dismissible amber banner sits under the bar: "Prototype — not a licensed estate agency. No legal advice. Estimates are ranges, not measurements."

1. SIGN IN / VERIFY (the gate)
Split screen. Left: email + password; a university-domain email is required. Right: verification panel — upload a student-card image, or a secondary "Verify with university email only" button. States idle → pending → verified shown as a 3-step progress stepper. Unverified users are blocked from every other route and redirected here with "Verify your student status to continue." On success, a green "Verified student" card shows institution and timestamp only, captioned "We store a verification result only — never your document."

2. ONBOARDING QUIZ — 6 questions, one per screen, progress bar 1/6
Sleep schedule · cleanliness · guests · noise tolerance · shared-space use · conflict style. Each screen: question, single-select cards or a 5-point scale, Back / Next. Auto-advance on select, animated slide transition.

3. MATCHES
Responsive 2-column grid of match cards. Each card: avatar, name, university, 0–100 score ring, top-3 shared traits as chips, and an expandable "Why you match" panel holding the generated compatibility narrative plus a visually separate "Possible friction" block with amber warning chips. Filter row above: budget ±20% slider, district multi-select. Clicking a card opens a profile drawer with full quiz answers and a "Propose a viewing" button.

4. HOUSING QUIZ — 6 questions, shown once before Listings
Preferred districts (multi-select) · room type · monthly budget (HK$ slider) · max MTR walk time · move-in date · lease length.

5. LISTINGS
Sticky filter bar: district select, budget range slider, room type, MTR proximity, furnished toggle, sort. Responsive grid (2-up desktop, 1-up mobile) of listing cards: photo, HK$ rent, district, room size, "MTR 4 min" chip, furnished badge, and a "Price vs district" indicator (below / at / above market) colour-coded red-for-up, green-for-down per HK convention. Each card has a compare checkbox (max 2); a "Compare selected" bar slides up at the bottom.

6. LISTING DETAIL
Two columns on desktop, stacked on mobile. Left: photo gallery with thumbnails, a room-condition panel (layout, advertised size, furnishing, condition notes), amenities, and a "Request pre-recorded walkthrough" button. Right, stacked cards:
 (a) Price context — rent vs R&VD district median as a small bar chart, with a source line.
 (b) Neighbourhood guide — sections for rent levels, transport, amenities and tenancy norms, each claim carrying a numbered superscript citation, ending in a "Sources" list of at least 3 links.
 (c) Scam awareness — a "Potential concerns" list, worded as possibilities, each with an explanatory tooltip.
 (d) Day-in-the-life — short descriptive text on commute, noise and late-night options.
A floating "Ask about this area" button opens a right-side chat drawer with 3 suggested questions, streamed answers, inline citations, and a "cached response" tag on repeat queries. Every size estimate renders as a range with a visible confidence band — never a single number.

7. COMPARE (max 2 listings)
Side-by-side table: photo, rent, size, MTR, furnishing, price-vs-district, condition. Highlight the better value in each row.

8. SETTLING-IN PLAN
A generated three-week plan from quiz answers, as a vertical timeline with Week 1 / 2 / 3 sections, each holding 3–4 task cards (icon, title, one-line detail). "Regenerate" button and a district selector. Two different quiz profiles must produce visibly different plans.

9. VIEWING MEETUP
From a matched pair: a scheduling panel with proposed date and time, a "Join live on Google Meet" primary button, and a fallback row with "Photo gallery" and "Request pre-recorded walkthrough". Below it, "Two other verified pairs looking in this district this month" as 2 anonymised cards.

10. PROFILE / SETTINGS
Verification state, editable quiz answers, language preference, and a small ethics panel restating: attestation not documents · no legal advice · no listing verification · minimum cohort of 5 for any published aggregate.

INTERACTION RULES
Skeleton loaders on every async panel. AI output streams in with a shimmer. Every generated block carries either a citation or a confidence indicator. Empty states state the next action. Keyboard-accessible with WCAG AA contrast. All currency in HK$ with thousands separators.
```

---

## Notes for the team

- v0 emits **Next.js**; our repo is **Vite + React**. Either accept the Next.js output as a separate design prototype, or replace `Next.js App Router` with `Vite + React + TypeScript` in the first line if you want it to drop into this repo.
- Data is mocked deliberately — no Supabase wiring, so it runs with no keys. Swapping the fixtures for real queries is a later step.
- The prompt is written to the agreed interim report: compatibility first, affordability second, transparency third, safety as the gate. **Listing verification and legal advice are deliberately absent** — both are out of scope.
