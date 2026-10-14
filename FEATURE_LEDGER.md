# RentMate — feature ledger

Every feature requested by the owner across the `AI-random-bs-go` sessions, and
what actually happened to it. Written because the owner asked and could not
recall the full list; the value of a ledger is the *negative* rows as much as
the positive ones.

**Legend:** ✅ shipped · 🟡 shipped in reduced/stub form · ⛔ deliberately not
built (with the reason) · 📄 documented only

---

## The core product

| Requested | Where it lives | Status |
|---|---|---|
| Quiz builds a profile the matcher runs on | `Figma/src/lib/quiz.ts` | ✅ |
| **Hard filters gate before scoring and are shown** — "who we hid and why" | `lib/matching.ts` `filterReasons`, `App.tsx` hidden panel | ✅ |
| Deterministic compatibility score | `lib/matching.ts` + `CP.calculate_match.v2` | ✅ 8/8 oracle |
| MBTI as a scored soft preference, inferred from behaviour (never a 4-letter code) | `quiz.ts` composite `mbti_*` questions | ✅ |
| Icebreaker-hook deck instead of a ranked grid | `lib/hooks.ts`, `App.tsx` matches tab | ✅ |
| Match narrative in plain language | `lib/hooks.ts` `cachedNarrative` | ✅ |
| Progress bar in the quiz | `App.tsx` `.quiz-progress` | ✅ |
| Price context against the no-agency-fee promise | `lib/listings.ts` | ✅ |
| Curated demo cast with place stories (`demo@` / `admin@`) | `lib/demoData.ts` `CURATED_CAST` | ✅ |

## Auth, verification and the account

| Requested | Where it lives | Status |
|---|---|---|
| Require the correct university **domain** | `lib/institutions.ts`, client-side only | ✅ |
| Everything else Auth-ish → **pitch deck only** | `IP.rentmate.v3.md` §safety | 📄 |
| No Supabase Auth, no password, no OTP, no session | `lib/api.ts`, `lib/supabase.ts` | ✅ |
| **Email IS the account key** | `roommate_profiles` PK = `email` | ✅ |
| Account reloads on mount (no sessions) | `api.ts` `loadAccount`, `App.tsx` effect | ✅ |
| **Drop the verification table** — nothing persisted about verification | migration drops `student_verifications` | ✅ |
| Align `area`/`school` ≈ `campus_district`/`target_areas` | migration + `matching.ts` `Profile` | ✅ |
| Keep identity data private; no ID upload, ever | schema has no document column | ✅ |

## Chat and moderation

| Requested | Where it lives | Status |
|---|---|---|
| **In-app chat** (not external) | `messages` table + Realtime | ✅ |
| **Report** — flags for admin review | `reports` table + `AdminQueue` (`admin@` only) | ✅ read-only queue, no actions |
| **Block / end a connection** — hides it for **both** sides | `blocks` table, `getBlockedEmails` matches either column | ✅ |
| Contact details never exchanged | no phone/social fields exist anywhere | ✅ |
| Optimistic send deduped against the Realtime echo | client-generated message ids | ✅ |
| **"Book a viewing time with your potential roommate"** | `App.tsx` viewing panel, 4 hardcoded slots | 🟡 labelled AI(demo); no calendar/confirmation/notification |
| Un-block, or review/resolve a report | — | ⛔ no UI; the queue is read-only |

## GenAI-labelled content

| Requested | Where it lives | Status |
|---|---|---|
| **Make clear which parts are GenAI** — hardcode if it can't be real | `App.tsx` `GenBadge`, `.gen-demo-badge` | ✅ |
| Neighbourhood guide by vibe + community reputation | `lib/areaGuides.ts`, 9 districts | 🟡 pre-written, badged, **not** scraped from any forum |
| **"Common-sense things to note"** list, official sources, owner to supply | `lib/safetyNotes.ts`, 8 cautions | 🟡 7 sourced (HK Police/ADCC, Lands Dept, R&VD, LegCo); **1 is a placeholder** awaiting the owner's source |
| Narrative/hooks as the "GenAI component" | `lib/hooks.ts` | 🟡 deterministic, not a model |

## Cosmetic credibility for the pitch

| Requested | Where it lives | Status |
|---|---|---|
| **3D walkthrough as a cosmetic stub** — slideshow or sim360 | `App.tsx` tour, stock-photo drag panorama | 🟡 captioned *"Illustrative mock · not a real 3D scan"* |
| AR preview mode | `App.tsx` `arActive` | 🟡 camera stub with an honest error path |

## Scope decisions (asked, then ruled out)

| Requested | Status |
|---|---|
| Quiz expanded to cover **every** hard check | ⛔ — settled: the hard block *is* the eligibility set (9 questions / 7 filters) |
| Quiz at the 22-question brief length | ⛔ — reference material only |
| Messages Edge Function | ⛔ — dropped: with RLS off + the anon client, direct writes to `messages` suffice |
| Supabase Auth / OTP flow | ⛔ — pitch deck only; the domain gate is the product |
| Listing verification | ⛔ — ruled out by the interim report, and now the table is gone too |
| Real GenAI calls in the demo | ⛔ — reliability during a live demo; labelled instead |

## Bugs found and fixed along the way

| Bug | Fix |
|---|---|
| Clicking your own **avatar logged you out** (Figma export wired the chip to "start over") | chip is now an identity readout; restart is an explicit labelled button |
| `saveProfile` never wrote `institution` → real matches showed an empty school | added `institutionName` param |
| SQL mirror validated MBTI axis 4 on side B twice, never side A | corrected to check both sides on all four axes |
| Header claimed "Scored by the Supabase backend" — never true | now says what is true |
| `supabase.ts` header promised Auth + RLS | rewritten to the auth-free model |
| Cache path and Supabase path could disagree on the derived `area` | `normalizeProfile` derives it the same way in both |
| `tsc` errors from the schema rewrite (null guard, missing `area` key) | fixed; `tsc --noEmit` clean, build green |

## Methodology work (offshoot only — **not** in the product or the pitch)

| Requested | Where it lives | Status |
|---|---|---|
| Reconcile the schema against the pre-Oct-1 `docs/` | `docs/schema_reconciliation_2026-10-14.md` | ✅ |
| Framework-usefulness report for `coding_assistant` | `outputs/genai_sdg_framework_usefulness_2026-10-14.md` | ✅ |
| **Rewrite IP/CP to v2/v3** | `vault/ips/IP.rentmate.v3.md` + README/NOTES | ✅ |
| Do the migrations | `backend/supabase/migrations/20261013233000_*.sql` | ✅ |
| Keep IP/CP artifacts out of the product and the pitch | `vault/` is quarantined | ✅ owner instruction honoured |
| Commit the work | — | ⛔ not yet committed; ~15 files pending |

---

## The three things still genuinely open

1. **No un-block and no report resolution.** `blocks` is insert-only from the
   UI and the Review queue is read-only. Ending a connection is permanent.
2. **RLS off with no Auth.** Anyone with the anon key can read and write every
   row. Documented in `SETUP.md` and `IP.rentmate.v3.md` U7; the fix is a real
   auth model, not a policy patch.
3. **The 14-vs-12 question boundary.** Two over the owner's stated number,
   carried as open question U9 rather than quietly absorbed.
