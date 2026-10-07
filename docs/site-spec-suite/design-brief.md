# RentMate — Design Brief

**Version:** 0.2 — revised draft for team review · **Prepared:** 7 October 2026 · **Status:** User decisions recorded; team ratification pending

## 1. Design objective

Retain the current Figma demo’s editorial, warm, Hong Kong student-life character. Make the product feel considered and human without losing practical clarity in a housing decision. The interface must make it immediately obvious what is synthetic, what is student-email verified, what is listing-supplied, and what is AI-generated.

## 2. Reference observations

The published landing page uses a darkened full-bleed Hong Kong campus/transport photograph, oversized editorial serif headline with italic emphasis, restrained coral/orange CTA, compact navigation and clean supporting sans text. The tone is confident but approachable: “Meet your kind of people.” / “Roommates, matched differently.” Preserve this character rather than replacing it with a generic dashboard template.

Exact typeface names, design tokens, image rights and original Figma component variables were not available from the published page. Treat all descriptions below as direction, not extracted Figma values. The team should confirm actual tokens from its editable Figma file before final styling.

## 3. Visual system

- **Color:** retain the dark ink/forest image-overlay treatment, warm neutral canvas, coral/orange primary action and understated muted supporting colors visible in the reference. Sample exact HEX values from Figma before shipping; do not infer them from a compressed screenshot. Avoid using coral or green alone to communicate status.
- **Typography:** preserve the display serif for hero and selected section headlines. Use an ordinary, highly legible system sans-serif (e.g., system UI/Segoe UI/Arial) for navigation, all questions, choices, budgets, captions, error messages and buttons. Do not use display serif, script, ultra-light, all-caps tracking or italic styling for quiz content.
- **Question sizing:** target 18px body/question text on desktop and at least 16px on mobile; labels at least 16px; line-height at least 1.45. Supporting text may be smaller only if comfortably readable and high contrast.
- **Buttons:** one primary CTA per view; coral/orange with clear contrast, descriptive text, at least 44×44px touch target, visible keyboard focus and clear disabled state.
- **Photography:** use authentic, appropriately licensed student/city imagery; overlay text with a stable dark scrim. Never synthesize or retouch images of actual rental rooms.
- **Shape and layout:** editorial, spacious, restrained radii; cards support comparison rather than crowd the screen. Keep the experience mobile-first and easy to scan.

## 4. Component rules

| Component | Rule |
|---|---|
| Navigation | Logo/home, How it works, Trust & safety, Find my matches. On mobile, keep all destinations reachable without dead links. |
| Quiz card | Label the two stages “About me” and “What I’m looking for”; one prompt with concise help, readable choices and explicit progress. Keep question typography consistent. |
| Selectable option | Entire label/card clickable; selected state uses border/icon plus text/status, not color alone. Strict filter choices must be explicit and understandable. |
| Preference slider | Display exact value/range and keyboard-adjustable controls; HKD for rent. |
| Email validator | Show separate states for malformed, unsupported domain, domain eligible, pending confirmation and mailbox confirmed. Never let a color/badge imply domain eligibility equals verification. |
| Profile decoration | Optional MBTI badge uses a small, low-emphasis chip; omit if absent. Do not present it as science-backed, score-driving or required. Gender identity is not shown unless the user chooses visibility/it is necessary to communicate a selected filter. |
| Listing card | Photo, rent/month, district, room type, approximate MTR walk and provenance labels. Do not imply independent verification. |
| Match card | Weighted compatibility label; fit/friction sections sourced from soft factors; synthetic-data notice; optional MBTI decoration. No “AI score” or safe/unsafe verdict. |
| Chat thread | Clear participant/context, readable message bubbles, sent/failed states, retry and an explicit “Close and delete conversation” action with confirmation. Do not make close look like archive. Guest mode must be visibly local/synthetic. |
| Trust notice | Short, contextual, expandable detail; domain eligibility, mailbox verification and listing assurance remain distinct. |
| Error/empty state | Human, direct wording; explain condition and next action. Do not rely on red/green-only signals. |

## 5. Page composition

- **Landing:** preserve hero photo, display-serif heading, warm CTA and compact proof points. Replace unsupported count/verified claims with wording accurate to implemented behavior. Include the trust destination visibly.
- **Trust page:** quiet, readable editorial surface with a clear title, short sections (“What we verify”, “What we don’t”, “Your data”, “Demo data”, “AI and matching”, “Report a concern”). No shield/badge that suggests a listing is verified.
- **Entry/verification:** simple university-path vs guest-demo choice. Make “Explore demo” a first-class button. Email states distinguish syntax/domain eligibility from actual mailbox confirmation and never imply a verified student on domain match alone.
- **Quiz:** calm single-column flow split into “About me” and “What I’m looking for.” Keep display serif out of questions/controls. Separate gender identity from strict roommate preference; show an explanatory note before applying the filter. MBTI is optional and skippable.
- **Matches/listings:** legible cards show eligibility result separately from soft compatibility score. Fit/friction reasons refer only to soft profile factors. Listing cards emphasize price, commute, room condition and provenance.
- **Chat:** first-party text conversation with calm reading layout, clear delivery/error status, and an explicit destructive close/delete confirmation. Do not use a vendor logo or imply messages remain after closing.

## 6. Accessibility and responsive behavior

- Contrast meets WCAG 2.2 AA for normal text and controls (4.5:1; large text 3:1); verify the actual Figma palette rather than assuming.
- Semantic headings, labelled fields, fieldset/legend for grouped choices, accessible status announcements and logical focus order.
- Full keyboard support, visible focus, no hover-only explanations, reduced motion respected.
- Reflow at 320–360px without horizontal scrolling. Test 200% zoom. Avoid long italic display text at small widths.
- Provide text alternatives for meaningful photos; decorative hero photo has empty alt if it adds no unique information.
- Never communicate demo, pending, verified, cached, sourced or unavailable status with color alone.

## 7. Content and tone

Warm, concise, non-judgmental. Avoid “perfect match”, “safe flat”, “verified listing”, “AI decides”, “guaranteed compatible” and unsupported population/security claims. Prefer:

- “Weighted compatibility: 82/100”
- “This match shares your preference for a quiet home; discuss guest frequency before deciding.”
- “Student email verified” only after the real verification event
- “Demo profile — synthetic data” for fixtures
- “Room size provided by listing poster; not independently verified.”
- “Approx. 8 minutes’ walk to MTR (listing-provided/estimated).”

## 8. Design sign-off checklist

- [ ] Exact Figma colors/type tokens confirmed by the team.
- [ ] Question font is readable sans-serif across every quiz state.
- [ ] “About me” and “What I’m looking for” are visibly distinct; gender identity and strict roommate filter are separate; no “same gender as me” combined option.
- [ ] MBTI is optional, decorative and non-scoring; omission looks intentional.
- [ ] Domain eligibility and mailbox-confirmed states are visually distinct; no premature verified badge.
- [ ] Chat sent/failed states and destructive close-and-delete confirmation are clear; close cannot be mistaken for archive.
- [ ] Trust & safety page matches landing-page visual language and explains retention/deletion and sensitive preferences.
- [ ] Demo vs university path and synthetic vs supplied listing data are distinguishable without color alone.
- [ ] Keyboard, contrast, 360px mobile and 200% zoom checks pass.

**Scope note:** The current project PRD still excludes gender filtering and custom in-app chat. This visual direction follows the latest user instruction and must not be treated as build-authorized until that project scope conflict is ratified.
