# RentMate — Submission Evaluation Brief (mockup / external-review draft)

> **How to use this document.** This is a self-contained brief written so an
> *independent* review session can evaluate the RentMate hackathon submission
> without prior context. Read it critically. **Section 7 (Honesty ledger) is the
> most important part** — it separates what is really implemented from what is
> synthesised for the demo. Section 11 lists the specific questions we want
> answered.

---

## 1. One-line summary

RentMate is a Hong Kong **student roommate-matching** web app that opens every
match with a single, real shared detail — *"you both love 24-hour cha chaan teng"*
— instead of a ranked grid or a swipe. The thesis: the failure mode of roommate
apps is the cold start (a grid of strangers you have no reason to message), and a
conversation hook beats a compatibility number.

This is a deliberate **idea/narrative play**, because the hackathon's deciding
criteria favour the concept and the story over technical depth. The scoring
engine behind it, however, is a genuinely validated contract — not hand-waving.

---

## 2. The problem

Finding a flatmate in Hong Kong is high-stakes and still done on fragmented
Facebook / WhatsApp groups. Existing matching tools present a **ranked grid of
strangers**. The real friction is not the score — it is that nobody knows what to
*say first*. RentMate's differentiator is the **icebreaker hook**, not the match
percentage.

---

## 3. The product — key differentiator

- **No grid, no swipe.** Each match is a one-card "hook deck": one real thing you
  two share, plus reaction buttons (*wait, rlly?!* / *same* / *pass*) that seed a
  cached conversation.
- **Hard filters run before scoring and are shown.** Gender/identity, belief
  system, target location (commute from your *verified campus*), room size, price
  range, and smoking gate candidates. The app explicitly tells you **who it hid
  and why** — the part most apps hide.
- **Soft compatibility (lifestyle + MBTI) is scored but never gates.** Conflated,
  as decided.
- **Curated demo cast.** Six interactive users with real *place stories*,
  reachable via `demo@cuhk.edu.hk` (or `admin@…`), so the main screen shows
  living, narratable matches without any backend or API.

---

## 4. How it works (user flow)

1. **Verify** — enter your university email. We check the domain against a
   12-institution / 41-domain allowlist. *Domain-only* — see §7.
2. **Quiz** — 12 questions build a profile: six lifestyle scalars, an inferred
   MBTI, hard-filter preferences (belief, target areas, max commute, budget, room
   size, smoking), and a multi-select interests question.
3. **Matches** — hard gate → deterministic score (0–100) → icebreaker hooks +
   cached narrative.
4. **Messages** — reacting to a hook seeds a local conversation. *Simulated* — see
   §7.

---

## 5. Architecture

- **Frontend:** Vite 8 + React 19 + TypeScript + Tailwind v4, exported from a
  Figma Make project.
- **Backend:** Supabase — Postgres + Row Level Security and one Edge Function
  (`compatibility`) that runs the deterministic score in SQL
  (`public.calculate_match_score`). *No Supabase Auth / OTP*: verification is
  domain-only (see §6/§7).
- **Local fallback:** with no Supabase project configured, **everything** (score,
  hooks, narrative) runs in-browser. `npm run dev` always shows a working demo —
  there is no hard dependency on the network being set up.

---

## 6. Design decisions worth challenging

- **HARD vs SOFT split.** HARD: gender/identity, belief system, target location
  (commute from verified campus), target size, price range, smoking. SOFT /
  conflated: lifestyle + MBTI. (Owner's call. An earlier v1 *forbade* MBTI from
  scoring; v2 adds it as one of seven equal-weight factors. v2 is what shipped.)
- **Campus auto-anchors target areas.** Verifying your institution sets the
  commute anchor from a `district` field on each institution, so *"is this area
  right for me?"* is computed, not entered by hand.
- **Domain-only verification.** We check only that the email domain matches a
  known institution — no ID upload, no mailbox proof, and **no email is ever sent**
  (no OTP). Defensible for a demo; a judge may probe it.
- **Real-time AI is OFF.** The match narrative is hardcoded / cached; the edge
  function no longer calls a model (free-API-key crash risk during a live demo).
  The icebreaker hooks were always local and model-free.
- **In-app chat is a local simulation** seeded by reactions, not real two-way
  messaging.

---

## 7. Honesty ledger — real vs synthesised (read this first)

**REAL / actually implemented and validated:**

- Domain allowlist + exact, dot-boundary match (no substring test — `cuhk.edu.hk.evil.com`
  and `notcuhk.edu.hk` both fail).
- The deterministic score **contract** (`CP.calculate_match.v2`): seven
  equal-weight factors (six lifestyle scalars + MBTI as `1 − differing_axes/4`),
  renormalised over *shared* factors only, and `null` (not a fake 0) when nothing
  is shared. Validated against an 8-case oracle — **8/8 pass**.
- The hard-gate logic and the *"who was hidden and why"* view.
- The Supabase schema (`student_verifications`, `roommate_profiles`,
  `quiz_answers`, `match_results`) + RLS policies + the SQL score function.
- `tsc --noEmit` clean; production build green.

**SYNTHESISED / mocked — do NOT present as real:**

- **All candidate profiles and the listings data.** There is **no public
  per-listing Hong Kong rental API** (data.gov.hk / R&VD publish only aggregate
  statistics; 28Hse / Centadata expose no API). Listings are synthetic, anchored
  on a district-average rent table.
- **The narrative sentences** and the **demo cast's place stories / replies** —
  written for the demo. Districts and the *kinds* of places are real; the people
  are not.
- **The conversation replies** to hook reactions — hardcoded strings.
- **Verification is domain-only** — no email is sent, no OTP. It does not prove
  the user is a student or that the mailbox exists.

---

## 8. Validation status

- `npx tsc --noEmit` → **0 errors**. (The app previously did *not* typecheck at
  all — a malformed type literal slipped through because Vite/esbuild strips
  types without checking.)
- `npm run build` → 67 modules, ~312 KB JS (97 KB gzip) + 62 KB CSS. Shippable.
- `vault/checks/matching_ts_check.ts` → **8/8** against the
  `CP.calculate_match.v2` oracle.
- End-to-end demo pipeline (quiz → profile → hard gate → score → hooks), run via a
  bundled script: real scores produced (e.g. 100 / 78 / 70 / 60 / 59), correct
  name handling, the gate correctly hid a smoker and an over-commute candidate,
  and hooks + cached reactions populated.

---

## 9. Hackathon framing

The hackathon judges the **idea and the narrative** over the stack. RentMate leans
into that: it is a UX/narrative play (the icebreaker hook) backed by a genuinely
validated scoring contract and a real, deployable backend. We are **not** claiming
a novel ML model — and we say so.

---

## 10. Known limitations & scope risks

- The **3D/AR room tour** and **in-app chat** are inherited from the Figma export
  and are **out of scope** per the team's interim report. They are present but not
  core; flagged, not removed.
- No email is sent (verification is domain-only), so Supabase's 2-emails/hour
  sender cap does **not** apply — walk-up users on throwaway accounts work freely.
- The edge function re-checks only gender + smoking in its hard gate; belief /
  location / budget / size are enforced in the frontend. The frontend filters
  *before* calling the function, so there is no mismatch — but it is a divergence
  worth noting.
- The code comment in `institutions.ts` previously said "35 domains"; the
  implemented table has **41**. (Corrected while writing this report.)

---

## 11. What we want the evaluator to assess

1. Is the **icebreaker-hook UX** actually a defensible differentiator, or does it
   just dress up a grid?
2. Are the **HARD/SOFT boundaries** sensible — especially **belief as a hard
   filter** (ethics / privacy implications)?
3. Does the **honesty ledger** hold up? Anything we are implicitly presenting as
   real that isn't?
4. Any **gap between the validated contract (CP)** and what the UI actually does?
5. **Runnability:** can a fresh session stand the project up from `SETUP.md`?
6. Is the domain-only verification a fatal weakness for this hackathon, or
   acceptable given the "explain why at the hackathon" stance?

---

## 12. Pointers (for a reviewer who wants to dig)

| Concern | File |
| --- | --- |
| Scoring contract | `vault/cps/CP.calculate_match.v2.md`, `vault/ips/IP.rentmate.v2.md` |
| Score + hard gate | `Figma/src/lib/matching.ts` |
| Hook engine | `Figma/src/lib/hooks.ts` |
| Institution allowlist | `Figma/src/lib/institutions.ts` |
| Quiz / profile builder | `Figma/src/lib/quiz.ts` |
| Demo data + curated cast | `Figma/src/lib/demoData.ts` |
| Data layer + fallback | `Figma/src/lib/api.ts`, `Figma/src/lib/supabase.ts` |
| DB schema + RLS + SQL score | `backend/supabase/migrations/20261013233000_roommate_matching.sql` |
| Edge function | `backend/supabase/functions/compatibility/index.ts` |
| Setup guide | `backend/supabase/SETUP.md` |
| Oracle test | `vault/checks/matching_ts_check.ts` |

**Run it:** `cd Figma && npm install && npm run dev` (local demo, no backend) or
follow `SETUP.md` for the Supabase path.
