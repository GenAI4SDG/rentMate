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
- **Seven hard filters run before scoring and are shown.** Gender/identity,
  belief system, target area, commute limit from your campus, budget, room size,
  and smoking gate candidates. The app explicitly tells you **who it hid and
  why** — the part most apps hide. Every hard question carries an explicit
  "no preference" option, and an unanswered filter never silently rejects.
- **Soft compatibility (lifestyle + MBTI) is scored but never gates.** Conflated,
  as decided.
- **Chat is inside the app, and only inside the app.** Real, persisted,
  real-time. Contact details are never exchanged, and either side can **report**
  or **end a connection**, which hides the conversation for both.
- **Curated demo cast.** Interactive users with real *place stories*, reachable
  via `demo@cuhk.edu.hk` (or `admin@…`), so the main screen shows living,
  narratable matches without any backend or API.

---

## 4. How it works (user flow)

1. **Email** — enter a university email. It is checked **client-side** against a
   12-institution / 41-domain allowlist, and it becomes the account key for
   everything after. No sign-up, no password, no OTP. *Domain-only* — see §7.
   Returning users are recognised by that email: their saved row is reloaded on
   mount, so they land straight in the workspace rather than re-taking the quiz.
2. **Quiz** — **14 questions** build a profile. Two composite soft questions
   cover all six lifestyle scalars; two composite "how you think" questions
   infer MBTI from behaviour; one question seeds the icebreaker vocabulary; and
   **nine are eligibility filters** (gender identity + preference, belief system
   + preference, target areas, commute, budget, room size, smoking).
3. **Matches** — hard gate → deterministic score (0–100) → icebreaker hooks +
   cached narrative. Plus a per-district neighbourhood guide and a
   "before you sign" safety list, both cited.
4. **Messages** — real two-way chat over Supabase Realtime when a backend is
   configured, local-only otherwise. Report / end-connection / propose a viewing
   time are all in the chat header.
5. **Admin** — signing in with an `admin@` local part adds a read-only **Review**
   tab listing every report and every ended connection.

---

## 5. Architecture

- **Frontend:** Vite 8 + React 19 + TypeScript, exported from a Figma Make
  project.
- **Backend:** Supabase — Postgres + Realtime only. **No Supabase Auth, no Edge
  Function in the running path.** The score is computed **client-side** in
  `lib/matching.ts`; `calculate_match_score` survives in SQL purely as a
  reference mirror of the contract and is never invoked.
- **RLS is disabled** on all four tables, because with no `auth.users` there is
  no `auth.uid()` to key a policy on and an enabled policy would block every
  row. Stated as a limitation, not hidden — see §10.
- **Local fallback:** with no Supabase project configured, **everything** (score,
  hooks, narrative, chat) runs in-browser. `npm run dev` always shows a working
  demo — there is no hard dependency on the network being set up.

---

## 6. Design decisions worth challenging

- **HARD vs SOFT split.** HARD: gender/identity, belief, target area, commute,
  room size, budget, smoking. SOFT / conflated: the six lifestyle scalars +
  MBTI. (Owner's call. An earlier v1 *forbade* MBTI from scoring; v2 adds it as
  one of seven equal-weight factors. v2 is what shipped, and it is unchanged.)
- **Campus auto-anchors target areas.** The institution sets the commute anchor
  from a `district` field, so *"is this area right for me?"* is computed, not
  entered by hand.
- **Email IS the account key.** No auth layer at all. Cheap, and it removes the
  sign-up wall that kills walk-up demos — but it means nothing server-side
  attests that the address belongs to the answerer.
- **Composite questions instead of a long quiz.** The owner set a 12-question
  boundary; the shipped quiz is **14**. Keeping all nine eligibility filters (the
  product's differentiator) plus the bonding question leaves two slots for the
  soft block, so one option now writes three soft factors or two type axes at
  once. The matcher's input is unchanged — verified, not assumed: 6/6 soft
  factors, 4/4 type axes, 16/16 reachable types, 16/16 lifestyle vectors. The
  two extra questions are recorded as an open question, not rounded away.
- **Real-time AI is OFF.** No model is called anywhere. Every AI-shaped feature
  is pre-written and **badged "AI · demo" in the UI** — the neighbourhood guide,
  the listing check, the viewing scheduler, the narrative and the hook deck. The
  hooks were always local and model-free.
- **The 3D walkthrough is a labelled cosmetic stub.** It is a flat stock-photo
  drag panorama, captioned *"Illustrative mock · not a real 3D scan"* in the UI.
  It exists because it makes the listings credible in a pitch, and it is
  marketed as what it is.

---

## 7. Honesty ledger — real vs synthesised (read this first)

**REAL / actually implemented and validated:**

- Domain allowlist + exact, dot-boundary match (no substring test — `cuhk.edu.hk.evil.com`
  and `notcuhk.edu.hk` both fail).
- The deterministic score **contract** (`CP.calculate_match.v2`): seven
  equal-weight factors (six lifestyle scalars + MBTI as `1 − differing_axes/4`),
  renormalised over *shared* factors only, and `null` (not a fake 0) when nothing
  is shared. Validated against an 8-case oracle — **8/8 pass**, re-run after the
  quiz trim.
- The hard-gate logic and the *"who was hidden and why"* view — **seven**
  filters, not the two the SQL mirror historically checked.
- **Real in-app chat.** `messages` persisted to Postgres, delivered over
  Supabase Realtime (`postgres_changes` filtered on `conversation_id`), with
  client-generated ids so an optimistic append and the echo dedupe.
- **Real moderation.** `reports` and `blocks` are real tables; a block hides the
  conversation for **both** sides (the query matches either column), which is
  the mechanism that makes "lose contact when the premise is gone" true rather
  than aspirational. Reports are **readable**: an `admin@` local part surfaces a
  Review queue. There is no suspend/ban/resolution, and the screen says so.
- **The account reloads.** On mount the app restores the profile for the last
  email this browser used — the Supabase row when configured, a local mirror
  otherwise. **No sessions**: no token, no cookie, no Auth. Verified that all six
  soft factors, the MBTI type, all seven `looking_for` filters, interests,
  budget and areas survive the round trip, and that an unknown email loads
  nothing.
- The auth-free Supabase schema: `roommate_profiles` keyed on **email**, plus
  `messages`, `reports`, `blocks`. `tsc --noEmit` clean; production build green.
- Two safety nets found and fixed while writing this report: a copy-paste bug in
  the SQL mirror's MBTI validation (it checked side B's fourth axis twice and
  never side A's), and a header that still claimed the backend scored matches.
  never side A's), and a header that still claimed the backend scored matches.

**SYNTHESISED / mocked — do NOT present as real:**

- **All candidate profiles and the listings data.** There is **no public
  per-listing Hong Kong rental API** (data.gov.hk / R&VD publish only aggregate
  statistics; 28Hse / Centadata expose no API). Listings are synthetic, anchored
  on a district-average rent table.
- **Every "AI" feature.** The narrative, the hook deck, the district guides, the
  safety notes and the viewing scheduler are pre-written. Districts and the
  *kinds* of places are real; the guide text is not retrieved from any forum.
- **The conversation replies** to hook reactions — hardcoded strings.
- **Verification is domain-only.** No email is sent, no OTP, and **nothing is
  stored to attest it** — the `student_verifications` table was dropped. It does
  not prove the user is a student or that the mailbox exists, and a judge should
  probe it.
- **The 3D walkthrough** — stock photos on a drag surface, captioned as a mock.
- **One safety note is a placeholder.** The eighth "before you sign" item is
  marked for an official source the owner will supply; it is labelled as such in
  the data, not silently presented as cited.

---

## 8. Validation status

- `npx tsc --noEmit` → **0 errors**. (The app previously did *not* typecheck at
  all — a malformed type literal slipped through because Vite/esbuild strips
  types without checking.)
- `npm run build` → green (69 modules, ~321 KB JS / ~101 KB gzip + ~65 KB CSS).
  Shippable.
- `vault/checks/matching_ts_check.ts` → **8/8** against the
  `CP.calculate_match.v2` oracle. Re-run after the quiz trim specifically to
  prove the composite questions did not change the matcher's input.
- End-to-end demo pipeline (quiz → profile → hard gate → score → hooks),
  run through a bundled script: the profile still carries **all six soft
  factors, a full four-letter MBTI, and every `looking_for` constraint**;
  the gate still hides on commute and smoking; scores are real.
- Quiz shape verified mechanically rather than by eye: 14 questions
  (2 lifestyle + 2 thinking + 1 bonding + 9 eligibility), 3 soft factors per
  composite option, 2 type axes per composite option.
- IP/CP vault: `ip_tool.py validate` **0 hard / 0 soft** on
  `IP.rentmate.v3`; `cp_tool.py validate` **0 hard** / 3 soft (the declared,
  accepted `CP_EFFECTS_ALL_EMPTY`); `ip_tool.py link` clean with 3 orphans
  reported; Project Graph rebuilt **0 hard / 0 soft**, coverage ok, staleness ok.

---

## 9. Hackathon framing

The hackathon judges the **idea and the narrative** over the stack. RentMate leans
into that: it is a UX/narrative play (the icebreaker hook) backed by a genuinely
validated scoring contract.

We are **not** claiming a novel ML model, a real 3D tour, or verified student
identities, and we say so in the product as well as here. The defensible claims
are: a deterministic score you can inspect, seven explicit eligibility filters
the user can watch working, in-app chat with report and block, and no agency fee.

---

## 10. Known limitations & scope risks

- **RLS is disabled with no Auth.** Anyone holding the anon key can read and
  write every row in `roommate_profiles`, `messages`, `reports` and `blocks`.
  Fine over synthetic demo data; **not** fine for real students. The fix is a
  real auth model, not a policy patch.
- **The client-side domain gate is not a security control.** It is a UX
  affordance; any allowlisted address passes, including one that is not the
  answerer's.
- **The 14-vs-12 question boundary** (§6) — two over the owner's stated number,
  carried as an open question rather than quietly redefined.
- **No Edge Function in the running path.** The `compatibility` function still
  exists as a reference artifact and is not invoked by the app; do not present
  server-side scoring.
- **The SQL score mirror is reference-only** and, after the fix above, matches
  the TypeScript on all four MBTI axes. The app never calls it.
- **All data is synthetic** (no per-listing HK rental API exists).
- **One safety note lacks its official source** until the owner supplies it.

---

## 11. What we want the evaluator to assess

1. Is the **icebreaker-hook UX** actually a defensible differentiator, or does it
   just dress up a grid?
2. Are the **seven hard filters** sensible — especially **belief as a hard
   filter** (ethics / privacy implications)?
3. Does the **honesty ledger** hold up? Anything we are implicitly presenting as
   real that isn't?
4. Is **"no model, labelled demo stubs"** the right call for this hackathon, or
   does it under-sell the submission?
5. Any **gap between the validated contract (CP)** and what the UI actually does?
6. **Runnability:** can a fresh session stand the project up from `SETUP.md`?
7. Is the domain-only, client-side email gate a fatal weakness for this
   hackathon, or acceptable given the "explain why at the hackathon" stance?

---

## 12. Pointers (for a reviewer who wants to dig)

| Concern | File |
| --- | --- |
| Scoring contract | `vault/cps/CP.calculate_match.v2.md`, `vault/ips/IP.rentmate.v3.md` |
| Score + hard gate | `Figma/src/lib/matching.ts` |
| Hook engine | `Figma/src/lib/hooks.ts` |
| Institution allowlist | `Figma/src/lib/institutions.ts` |
| Quiz / profile builder | `Figma/src/lib/quiz.ts` |
| Chat + moderation data layer | `Figma/src/lib/api.ts` |
| Labelled demo content | `Figma/src/lib/areaGuides.ts`, `Figma/src/lib/safetyNotes.ts` |
| Demo data + curated cast | `Figma/src/lib/demoData.ts` |
| DB schema (auth-free) | `backend/supabase/migrations/20261013233000_roommate_matching.sql` |
| Setup guide | `backend/supabase/SETUP.md` |
| Oracle test | `vault/checks/matching_ts_check.ts` |

**Run it:** `cd Figma && npm install && npm run dev` (local demo, no backend) or
follow `SETUP.md` for the Supabase path — including how to see real two-browser
chat.
