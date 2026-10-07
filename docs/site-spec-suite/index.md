# RentMate site specification suite

**Version:** 0.2 — revised draft for team review
**Prepared:** 7 October 2026  
**Status:** Records the user’s latest decisions; still requires team sign-off before implementation.
**Project authority:** `../GENAI SDG interim draft.pdf`; product details in `../../PRD.md`; technical/build context in `../build-plans.md` and `../../TEAM-BRIEF.md`. This draft intentionally proposes in-app chat and an optional gender eligibility filter, which conflict with current `PRD.md` scope and must be reconciled before build.

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
- The landing page says “7 thoughtful questions.” Earlier project documents specify a 12-question demo path and the original deck a 22-question reference. The user has since directed a clearer two-part “About me” / “What I’m looking for” contract; exact final wording/count remains for team sign-off.
- The user confirmed synthetic profiles, eight Hong Kong universities plus guest/demo, optional gender identity plus a separate strict roommate-gender filter, scalar-only compatibility scoring, optional MBTI decoration, persistent in-app chat deleted on close, and domain eligibility checks.
- Domain allowlisting does not prove mailbox ownership. The eight institution labels are known; exact university-domain strings must be verified from official sources before implementation.
- Current project PRD/interim report remain authoritative until formal reconciliation. The latest user choices conflict with current PRD requirements for chat and gender; the revised suite records them as proposed scope changes, not build authorization.

## Review gate — resolve before build

The revised suite records these user-directed product decisions; the team still needs to ratify them against the current PRD before implementation:

1. Use synthetic profiles and a guest/demo route; offer a university path with domain syntax/allowlist validation for eight Hong Kong universities. A matching domain is eligibility, not proof of mailbox ownership; no “verified” state until Auth confirms the mailbox.
2. Implement a real `/trust` page that explains email eligibility vs verification, synthetic data, listing limits, chat retention/deletion, gender-data controls and score boundaries.
3. Replace the vague single quiz with two explicit blocks: **About me** (lifestyle/personality and optional identity) and **What I’m looking for** (roommate and housing constraints). Do not freeze the older 12-question count; exact labels/scales still need team sign-off.
4. Keep optional self-described gender separate from explicit roommate-gender categories. The latter is a strict filter before scoring; no “same gender as me” combined option and no gender input to compatibility score.
5. Compatibility is deterministic weighted similarity over soft lifestyle/personality/scalar metrics only. MBTI is optional profile decoration, not a score/filter by default.
6. “Save to chat” creates a persistent account conversation; explicit close deletes conversation and messages. Guest demo uses clearly labelled local synthetic chat. No third-party messaging vendor is required.
7. Retain Figma aesthetic and use highly legible sans-serif for all questions, labels, answers and controls; preserve serif for display headings.

**Open before implementation:** verify exact official email domains for the eight institutions; choose Auth confirmation mode; freeze field scales and weights; approve privacy/visibility for gender categories; choose guest browser storage; define message limits/report handling; and reconcile the chat + gender-filter scope against `PRD.md`, which currently disallows both. The exact Figma Q7 wording and HEX design tokens also remain unverified.

## Six-box sign-off

- [ ] Feature list read and approved — `product-requirements.md`
- [ ] Fixed technical choices and integrations — `technical-requirements.md`
- [ ] Every page/action/error mapped — `app-flow.md`
- [ ] Design brief matches the liked reference — `design-brief.md`
- [ ] Data, storage and access boundaries approved — `database-schema.md`
- [ ] Build sequence and sign-off points approved — `implementation-plan.md`

All six boxes should be checked by the team before implementation begins. Changes to the agreed project scope should be recorded in the PRD and project memory after approval.
