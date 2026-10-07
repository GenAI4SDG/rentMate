# RentMate site specification suite

**Version:** 0.1 — draft for review  
**Prepared:** 7 October 2026  
**Status:** Unapproved. This is a design/specification proposal, not authorization to implement it.  
**Project authority:** `../GENAI SDG interim draft.pdf`; product details in `../../PRD.md`; technical/build context in `../build-plans.md` and `../../TEAM-BRIEF.md`.

## The six documents

1. [Product requirements](product-requirements.md) — product promise, users, scope, feature behavior and acceptance criteria.
2. [Technical requirements](technical-requirements.md) — stack, integrations, security, environment and operating constraints.
3. [App flow](app-flow.md) — routes, screens, decisions, errors and destinations for each action.
4. [Design brief](design-brief.md) — direction to preserve from the current Figma demo, components, typography and accessibility.
5. [Database schema](database-schema.md) — proposed records, field boundaries, access rules and retention.
6. [Implementation plan](implementation-plan.md) — sequence, dependencies, sign-off gates and definition of done.

## Evidence and prototype inspection

- The supplied PDF, **Before Anyone Builds Your Site** (7 October 2026), calls for these six documents before building and gives a six-box sign-off checklist.
- Figma demo: https://tag-haven-05580894.figma.site/#how. The visible landing page has the headline “Meet your kind of people.”, a student-community proposition, a “Start matching” CTA, “How it works” and “Trust & safety” navigation, and three explanatory steps.
- Visual direction observed: full-bleed campus/transport photograph under a dark overlay, editorial display serif headline, clean sans-serif body text, restrained coral/orange CTA, compact navigation, and a candid Hong Kong student-life feel. The exact font and color tokens have not been inspected in Figma itself; see the Design Brief.
- The Trust & safety link points to `#trust`, but the published page currently exposes no distinct trust content/section at that target. The visible destination remains the landing-page content. Treat it as a dead-end navigation item until the section/page is implemented.
- “Start matching” opens an email-verification screen. Its interactive state and whether it sends a real email were not tested; no email was submitted.
- The landing page says “7 thoughtful questions.” Existing approved project documents specify a 12-question demo path (six lifestyle + six housing), while the original deck contains a 22-question design reference. The final count and how Q7 maps onto those versions need team confirmation.
- The project PRD and interim report remain authoritative where this draft could otherwise conflict with them. In particular, identity verification is an access gate in the agreed product; demo access must be a clearly marked synthetic-data path, not a false verified account.

## Review gate — resolve before build

Recommended starting decisions (not yet approved):

1. Keep real university-email verification as the access gate for real accounts. Add a clearly labelled **Explore demo** route using seeded synthetic profiles so a judge/user can try the flow without email. Demo mode must never set a real `verified` state or collect real housing data.
2. Implement a real `/trust` page instead of removing the Trust & safety link. Explain the email gate, what is and is not verified, seeded demo data, privacy boundaries, how matching works, and how to report a concern.
3. Keep the required questionnaire at 12 answers: six lifestyle + six housing. Make the housing section explicitly cover community/living style, preferred location, MTR walking distance, amenities, minimum room size and rent budget. Move lease length/move-in timing to optional browse filters. Remove the “same gender as me” option and do not use gender as a match filter.
4. Keep the Figma aesthetic, but use a highly legible sans-serif for all question text, labels, answers and controls; reserve the expressive serif for display headings.

**Open decisions:** what “community type” means to the team; exact Q7 wording/options in the Figma quiz; whether any team has approved changing the 12-question split; whether demo mode is read-only or can retain temporary answers in browser memory. The proposed neutral definition and behaviors are stated in the documents and must be explicitly accepted or revised.

## Six-box sign-off

- [ ] Feature list read and approved — `product-requirements.md`
- [ ] Fixed technical choices and integrations — `technical-requirements.md`
- [ ] Every page/action/error mapped — `app-flow.md`
- [ ] Design brief matches the liked reference — `design-brief.md`
- [ ] Data, storage and access boundaries approved — `database-schema.md`
- [ ] Build sequence and sign-off points approved — `implementation-plan.md`

All six boxes should be checked by the team before implementation begins. Changes to the agreed project scope should be recorded in the PRD and project memory after approval.
