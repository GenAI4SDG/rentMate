# RentMate — doc reconciliation against the code

**Date:** 2026-10-13 · **Method:** the `doc-reconcile` skill, bound to this repo's real doc set.
**Range:** docs as last committed (`c796e38`, `AI-random-bs-go`) .. HEAD + working tree.
**Authority:** `docs/GENAI SDG interim draft.pdf` (team-agreed), per `README.md` and
`docs/interim-report-reconciliation.md`.

**Bound doc set — the descriptive docs compared (anti-bloat check):** `README.md`,
`backend/README.md`, `docs/site-spec-suite/*` (7 files), `docs/demo-user-guide.md`,
`docs/interim-report-reconciliation.md`.
**Excluded as declarative (authoritative by construction, per-claim):** the interim
report PDF; `PRD.md`; `TEAM-BRIEF.md`; `docs/build-plans.md`; `docs/pitch-and-data-pack.md`;
`HK_Rental_Platform_Master_Cursor_Spec.md`. Their *intent* prose is excluded — but their
**status/stack cells are fact-claims about the code and are reconciled below** (the skill's
per-claim rule).
**Excluded as tooling:** `.workbuddy-ai/`. **Excluded as generated:** `dist/`, `node_modules/`.

> ⚠️ **I did not edit any of the team's docs.** The skill's default is to *apply* a settled
> fix, but it also says a content change to a spec/contract needs the owner's say-so first —
> and every doc below is intent-bearing and shared across four people. So the settled rows
> are reported with their fixes written out, ready to apply. Say the word and I will.

---

## 1. Settled findings (verified against the code this run)

| Doc | Claim | Reality | Evidence |
|---|---|---|---|
| `README.md` §Stack | "Supabase — Auth, Postgres, Edge Functions, **pgvector for RAG**" | **No pgvector.** The migrations create exactly one extension, `pgcrypto`. | `grep -rin "vector\|embedding" backend/supabase/migrations/` → 0 hits; only `create extension if not exists "pgcrypto"` (init migration :6) |
| `README.md` §Stack | "GenAI calls run in **Supabase Edge Functions** so API keys never reach the client" | Intent only — **nothing invokes them.** Zero references to either function from any client. | `grep -rn "analyze-agreement\|rental-chatbot\|functions.invoke" src Figma/src backend/src` → 0 |
| `README.md` §Stack | "Chat and video are **not built in-house** — the app connects to Google Meet" | The demo ships a full **in-app chat workspace** (thread list, composer, message state). | `Figma/src/App.tsx:877, 884, 936, 1076–1108` |
| `backend/README.md` §Layout | "Edge Function **stubs** for AI phases"; "`analyze-agreement/` … (Phase 5 **stub**)" | Not stubs — both call OpenAI and handle errors. | `rental-chatbot/index.ts:65`; `analyze-agreement/index.ts:120,144` |
| `backend/README.md` §Roommate matching | "Those tables are **not** in this HK rental spec migration set" | **True.** The migration set defines `profiles, properties, property_images, amenities, property_amenities, favourites, viewing_requests, conversations, messages, notifications, agreements, agreement_reviews, reports, property_view_events, chatbot_usage` — and `user_role ('tenant','landlord','admin')`. | init migration |
| `docs/site-spec-suite/index.md` | "Earlier project documents specify a **12-question** demo path" | The demo implements **7**. | `Figma/src/App.tsx:15–142` — 7 `eyebrow` entries (Home rhythms, Social energy, Conflict style, Daily routine, Personality, Shared space, Match preferences) |
| `docs/site-spec-suite/index.md` | "The landing page says '7 thoughtful questions.'" | **True**, and it matches the code. | `Figma/src/App.tsx:509` `<b>7</b> thoughtful questions` |
| `docs/site-spec-suite/index.md` | "The visible landing page has the headline 'Meet your kind of people.'" | **True.** | `Figma/src/App.tsx:486–488` |
| `docs/site-spec-suite/technical-requirements.md` §2 | "Eight institutions: CityU, HKBU, Lingnan University, CUHK, EdUHK, PolyU, HKUST and HKU" | Count is 8 — internally consistent. | the sentence itself |
| `README.md` §Checks | `npm run typecheck` / `lint` / `build` | **All three green** (exit 0). | ran each this session |

### The one that matters most

**The demo contradicts the authority on two features.** `Figma/src/App.tsx` implements a
**3D/AR room tour** (`tourMode: "3d" | "ar"`, `arActive`, placeable bed/desk/sofa —
:907–908) and the **in-app chat** above. The interim report's boundary list puts
**"3D construction of the room" out of scope**, and its chat rule is **"Connect, do not
build"** → Google Meet (`PRD.md:175,285`; `TEAM-BRIEF.md:180`). So the demo — the thing
judges will see — demonstrates two features the agreed statement excludes.

## 2. Could not be checked here (needs a browser / the published site)

Not "verified clean" — genuinely unverified. Do not read their absence as agreement.

- `site-spec-suite/index.md`: "The **published** page currently exposes no distinct trust
  content/section at that target." The claim is about `tag-haven-05580894.figma.site`, not
  this tree. **In the local demo the target does exist** (`Figma/src/App.tsx:462`
  `href="#trust"` → `:616` `id="trust"`), so the suite may be describing the deployed site
  only. Needs the live URL to settle.
- `site-spec-suite/index.md`: "'Start matching' opens an email-verification screen. Its
  interactive state and whether it sends a real email were not tested."
- `site-spec-suite/index.md`: "The exact font and color tokens have not been inspected in
  Figma itself."
- `site-spec-suite/design-brief.md` and `index.md` Q7 wording — the suite already marks
  these unverified; I did not re-derive them.

## 3. Unsettled — these are the team's decisions, not mine

The skill's real gate: a claim that needs the author's intent is **not** mine to resolve.

| # | The conflict | Who must settle it |
|---|---|---|
| U1 | **Which product is the backend for?** The migration set implements a landlord/tenant property marketplace (from `HK_Rental_Platform_Master_Cursor_Spec.md`, a Next.js/Supabase/OpenAI/Mapbox spec); the authority describes student roommate matching. | The team. Until answered, "it's supposed to use Supabase" is undecidable. |
| U2 | **Chat: in-app or Google Meet?** The authority says connect-don't-build; the demo builds it; `site-spec-suite` proposes building it. | The team (its own `D6`/scope gate already names this). |
| U3 | **Gender: in scope or out?** `site-spec-suite` proposes an optional gender identity + a strict roommate-gender filter; `PRD.md` excludes gender-based matching; the demo's quiz offers "Same gender as me" (:138), which the suite itself forbids. | The team (`D4`/`D6`). |
| U4 | **Is the 3D/AR tour in or out?** The authority excludes 3D room construction; the demo ships it. | The team — it may be the demo's centrepiece, which is a scope question for the authority, not a code bug. |
| U5 | **Which doc wins where `site-spec-suite` and `PRD.md` disagree?** The suite is an unratified v0.2 proposal ("still requires team sign-off"); `PRD.md` is reconciled to the report. | The team. |

## 4. What I did not do

- **Did not edit the team's docs.** Per §"I did not edit any of the team's docs" above.
- **Did not treat `docs/interim-report-reconciliation.md` as drift.** It is a dated record
  of a past reconciliation — history, correct as written.
- **Did not "fix" the demo.** Deleting the 3D tour or the chat is an intent decision (U2/U4),
  not a code fix; the methodology's rule is that a finding *proposes* an intent revision, it
  never applies one.
- **Did not propose new docs.** The fixes above belong in the existing docs.
