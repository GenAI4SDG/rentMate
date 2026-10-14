# RentMate — UI change plan (owner's 14 Oct review)

**Status: LANDED.** The nineteen items below were all implemented on 14 Oct, in
the order listed at the bottom, plus a follow-up backend pass. The text below is
kept as written — it is the work order, and it is the record of what the problem
was before the fix. What actually shipped, and the three decisions that were
resolved, are in **"What landed"** immediately below.

---

## What landed

| # | Item | Where it lives now |
| --- | --- | --- |
| 1 | District step before listings, mock AI tips while scanning | `App.tsx` `district-step` / `district-card` / `listing-tips` |
| 2 | 400–1000 sq ft | whole flat (see decision D1) — `lib/listings.ts`, `lib/quiz.ts` |
| 3 | Household price cap | `householdCeiling()` in `lib/listings.ts`, applied to every filter |
| 4 | Dead map filters | five real filters in `App.tsx` (`withinBudget`, `withinTravelLimit`, `nearMtrOnly`, `mustHavesOnly`, bedrooms) |
| 5 | Personal shortlist, separate from the chat | `lib/personalStore.ts` + `lib/homesApi.ts` |
| 6 | Find conversations by listing; listing status | `thread-filters`, `status-pill`, `STATUS_LABEL` |
| 7 | Suggest-a-time widget deleted | replaced by `Book with agent` + free-text chat |
| 8 | Common-sense check moved to the point of commitment | `viewing-checklist` in the Messages tab |
| 9 | Red-dot viewing reminders | `red-dot`, `viewing-reminder`, `portrait-reminder`, `hook-reminder` |
| 10 | No auto-dragging matches into a conversation | `react()` → `startChat()`; their reply is no longer injected |
| 11 | Page no longer jumps on reject | `advance(scroll = false)` |
| 12 | Per-listing walkthrough | `roomsFor()` derives rooms from the flat's own sq ft + bedrooms |
| 13 | AR removed | gone from `App.tsx` and `index.css` |
| 14 | New questions: roommates / cook at home / 5 must-haves / free-text line | `lib/quiz.ts` |
| 15 | Paired questions on one page | `group` field + `QUIZ_PAGES` |
| 16 | Flat size stops blocking anyone | `flatSizeWarning()` / `flatSizeWarningForHome()`; `others-panel` replaces the hidden list |
| 17 | Smug empty state deleted | `empty-state-card` + `FILTER_ADVICE` |
| 18 | "Score" language removed | `fitPhrase()` replaces `scoreLabel()` |
| 19 | Log out, and "Start over" out of the nav bar | `profile-menu` + typed RESET confirmation |

**Verified:** `npx tsc --noEmit` clean, `npm run build` clean, dev server serves.
There is no `typecheck` or `lint` script in `Figma/package.json` — only
`dev`/`build`/`preview`/`format` — so the typecheck is run as `npx tsc --noEmit`.

**Follow-up backend pass** (the collision lock was released, so this is now in
scope): `backend/supabase/migrations/20261014150000_rentmate_homes.sql` moves the
listing pool into Postgres (240 rows) and mirrors saved homes / notes /
attachments / viewings onto the server, with `lib/homesApi.ts` wiring it up and
degrading to the local path when no project is configured. See `SETUP.md`.

---

## The three decisions, resolved

- **D1 — "400–1000 sq ft" is the whole flat**, not the room. Your call, 14 Oct:
  *"yes, 400-1000 for the whole flat; it's also easiest to actually grab from a
  listing if we had data."* Quiz options are 400 / 600 / 800 / 1000; the demo
  cast was rescaled to match.
- **D2 — the cap is `budget × (n+1)`**, where `n` is the number of roommates you
  said you'd accept. Your call: *"yes budget x(n+1)"*. One roommate therefore
  means two incomes.
- **D3 — cook-at-home is UNSCORED.** Your call: *"sure"*. It sits in the bonding
  section, feeds hooks and listing suggestions, and does **not** touch
  `SOFT_FACTORS` or the frozen `CP.calculate_match.v2` contract.
- **D4 — personal state went to localStorage *and* Postgres.** The original
  proposal was localStorage only, because RLS is off and there is no auth. That
  is still the honest read for real data; for synthetic demo data the tables were
  added anyway so saved homes survive a cleared browser and reach the other
  person in the conversation. Both are written — localStorage first, Postgres as
  a best-effort mirror.

**Collision note:** this session was scoped to `Figma/src/` while another session
owned `vault/`, `docs/`, `README.md`, `SUBMISSION_REPORT.md`, `FEATURE_LEDGER.md`
and `backend/supabase/SETUP.md`. That lock was released on 14 Oct, which is why
the backend migration and `SETUP.md` above are now in the diff.
`FEATURE_LEDGER.md` still has a stale row: removing AR (item 13) deletes one of
the two "cosmetic credibility" entries. Flagged, not edited.

---

## A. The browse-and-shortlist flow (your items 1, 4, 5, 6)

1. **District first, then AI tips while you scan.** Today the flats tab opens
   straight on a 25-row list (`App.tsx:1627`, `.flats-browser`) and the
   AI-demo panels sit at the bottom of the *Matches* tab (`App.tsx:1395+`).
   Reorder to match what you asked for:
   - A **district step** — one card per target area, sorted by estimated commute
     from your campus (`commuteMinutes`, `lib/matching.ts:152`), carrying the
     existing `areaGuides.ts` vibe + reputation line. This is the "filtered
     locations based on the distance" step.
   - Then the listing list, with **1–2 mock AI comments per listing card**
     (`GenBadge`-labelled, pre-written, seeded off the listing id) so the tips
     appear *while you scan*, not after you have picked.

2. **⚠ Room-size numbers — 400–1000 sq ft.** You are right that 60 sq ft is
   absurd. Two separate numbers are in play and I want to be sure which you
   meant:
   - `lib/listings.ts:93` — flat size, currently 410–599 sq ft.
   - `lib/quiz.ts:370` + `lib/demoData.ts` — *room* size, currently 60–150 sq ft
     (demo cast sits at 65–120).
   **I will read "400–1000 sq ft" as the whole flat** and retune both
   (quiz options → 400 / 600 / 800 / 1000 sq ft · "Any — I'm flexible";
   demo cast scaled to match; listing `details` spread across 400–1000).
   A 400 sq ft *bedroom* does not exist in a Hong Kong student share, so if you
   genuinely meant the room, say so and I will use 60–150 → 80 / 100 / 120 / 150.

3. **The price cap is the real bug — listings ignore your budget entirely.**
   `LISTINGS` (`lib/listings.ts:91`) is generated as `12800 + ((i*850) % 7200)`,
   i.e. every flat lands $12.8k–$20k no matter what you answered. Fix:
   - New quiz question **"How many roommates are you OK with?"** (1 / 2 / 3 / 4+).
   - **Household ceiling = your monthly budget × (1 + roommates wanted).**
     You said "you + your roommate's budget total" — so 1 roommate = ×2, 2 = ×3.
     ⚠ **DECISION:** confirm the ×(n+1) reading; the literal "budget × number of
     roommates" would make 1 roommate = ×1, which leaves you looking for a whole
     flat on one person's budget.
   - `LISTINGS` regenerated to spread ~$9k–$32k so the cap actually filters
     instead of returning 0 or all 25.
   - Every listing card shows **"your share ≈ $X"** next to the total, using the
     household size. That is the number a student actually compares.

4. **The map filters are dead buttons.** `App.tsx:1646` — `2 bedrooms`,
   `Under $20K`, `Near MTR`, `3D tour` are `<button>` with no handler. They get
   real state: bedrooms, price ≤ household ceiling, commute ≤ your limit, area
   multi-select. The result count (`App.tsx:1668`) reflects them.

5. **⚠ "Why is it available without any pair?" — split shared from personal.**
   Today `shortlist` (`App.tsx:964`) is one array rendered as "Flat shortlist"
   in the chat sidebar and described as saved *together*
   (`App.tsx:1618` "No flats saved together yet"). Your shopping-cart reading is
   better. Two distinct things:
   - **`Saved homes`** — a personal tab, yours alone, survives across chats,
     holds your own notes/tags per listing. Nothing is tied to a person.
   - **Attached listings** — per-conversation refs, created by an explicit
     **"Send this listing to the chat"** action on any card.
   - ⚠ **DECISION:** persist to `localStorage` keyed by email, or to Supabase?
     There is no auth and RLS is off, so Supabase means a new table anyone with
     the anon key can read. localStorage is the honest demo choice; it also
     means saved homes survive a reload (they do not today — it is component
     state). I will go localStorage unless you want the table.

6. **Find conversations by listing, and know when a listing goes.**
   - Listing tags per conversation + a filter chip row on the Messages tab
     (All · per listing · Unread).
   - A **status pill** on each listing — `Available` / `Viewing booked` /
     `Taken` — surfaced in the conversation header and in Saved homes, with a
     "this listing was taken" line in the thread. Demo-only status you can flip.

---

## B. Chat and viewing (your items 7, 10, 11, 18, 19)

7. **Kill the suggest-a-time widget.** `App.tsx:1511-1530` — four hardcoded
   slots (`Sat 10:00`…) writing a canned sentence into the chat. Replaced by:
   normal free-text chat, plus one **"Book a viewing with the listing agency"**
   button per listing (clearly badged demo, no fake confirmation).

8. **Move the common-sense check to the moment you commit.** `SAFETY_NOTES`
   currently renders as an AI panel on the Matches tab (`App.tsx:1415`). Move it
   into a **confirm-you-read-this step** that appears when you and someone agree
   to go see a place: checkbox per caution, then "Confirm we've both read this".

9. **Red-dot reminders on a person.** New: an agreed viewing creates a record
   (who · which listing · when). It shows as a red dot on that person in the
   chat list and on their card, plus a panel with **how to get there** (MTR line
   + walk stub, honestly labelled an estimate) and **local spaces to check the
   vibe** first (cafés / parks / wet market, from `areaGuides.ts`).

10. **Stop auto-dragging matches into the conversation.** `react()`
    (`App.tsx:1065`) currently synthesises *their* reply into the thread the
    instant you react. New sequence: **react → land on the conversation page →
    the app nudges you to suggest a listing** (picker from Saved homes). Their
    reply stops being injected as if they had already said it.

11. **Rejecting a listing jumps the page to the top.** `advance()`
    (`App.tsx:1082`) calls `window.scrollTo({top: 0})` on every pass. Scroll
    preserved on pass; the card swaps in place.

---

## C. The 3D tour (your items 8, 9)

12. **Every listing shows the identical walkthrough.** `roomViews`
    (`App.tsx:107`) is one fixed 4-room array used for every `tourFlat`. Make it
    **deterministic per listing** — rooms, dimensions and image set derived from
    the listing id and its sq ft — and keep the *"Illustrative mock · not a real
    3D scan"* caption on every view, not just the living-room label
    (`App.tsx:2013`).

13. **Remove AR entirely.** Delete `tourMode`, `arActive`, `arError`,
    `placedItem`, `arVideoRef`, the `AR room check` tab (`App.tsx:1947`) and the
    whole camera/`getUserMedia` branch. Nothing else depends on it.
    Note: this removes one of the two "cosmetic credibility" rows in
    `FEATURE_LEDGER.md` — that file is the other session's, so flagging rather
    than editing.

---

## D. Quiz and the gate (your items 14, 15, 16, 17)

14. **New questions.**
    - **How many roommates are you OK with?** → drives the household price cap
      (item 3).
    - **Do you cook at home?** → ⚠ **DECISION:** scored or not? Adding it to
      `SOFT_FACTORS` (`lib/matching.ts:57`) changes the frozen
      `CP.calculate_match.v2` contract and its 8/8 oracle in `vault/`. My
      proposal: keep it **unscored**, in the bonding section, feeding hooks and
      listing suggestions only — no contract change. Say the word if you want it
      scored and I will coordinate with the vault session.
    - **Pick 5 must-haves in a home** (multi-select: own bathroom · window ·
      lift · washer · near MTR · pet-friendly · furnished · study desk ·
      air-con · quiet street). Filters Saved homes; shown as "you both want X"
      badges. Not a people-filter.

15. **Pair the same-topic questions onto one page.** `gender_identity` +
    `gender_preference` on one screen; `belief_system` + `belief_preference` on
    one screen (`lib/quiz.ts:254-316`). The `Quiz` component
    (`App.tsx:519`) renders one question per step off a flat index, so it needs
    a **page** grouping. Progress bar recounts by page. Still 14 questions, now
    on 12 screens.

16. **"Their room is less than X" stops being a blocker.** `roomSizeReason`
    (`lib/matching.ts:273`) is currently wired into `filterReasons` and hides
    people outright. Change to:
    - Removed from the **gate** (no longer hides anyone).
    - Kept as a **warning**: when someone proposes a listing inside *their*
      range but outside *yours*, you get an inline notice — "this is within
      their budget, over yours — you may not want to take it".
    - The hidden panel (`App.tsx:1343`) becomes an **"Others" section**: a
      browsable list of people who did not clear, with the reason and a
      one-tap "loosen this filter" link. Gender, belief, smoking, commute and
      budget stay hard.

---

## E. Copy, account, empty state (your items 2, 3, 12, 13)

17. **Delete the smug empty state.** `App.tsx:1308` — *"Nobody cleared your
    non-negotiables. That's the filters working, not a bug."* Replaced with a
    real answer to "what do I do now": how many people were filtered out, which
    single filter would let the most of them through, a one-tap **loosen it**
    action, and a link to Others. Never "that's the filters working".

18. **Strip explicit "score" language from the UI.** Today: `scoreLabel`
    (`App.tsx:96`), `.hook-score` (745), "cleared your non-negotiables" (1367),
    "Connected · X% match" (1479), `.modal-score` (1850-1860), "Scoring your
    answers…" (1305), and the quiz blurb "These feed the score"
    (`lib/quiz.ts:34`). All become plain-language fit wording — "how much you
    have in common", "a good fit", "compatible".
    ⚠ **Note, not a blocker:** the number is the deterministic part of the
    judged "technical component". I will remove it from every user-facing
    surface and keep the factor computation underneath; if you want zero trace
    of it anywhere including the pitch, that is a `vault/` change and belongs to
    the other session.

19. **Log out, and "Start over" out of the nav bar.** Today the profile chip is
    a pure readout (`App.tsx:1250` — deliberately, because the Figma export
    wired your own avatar to "start over") and **Start over** sits in the header
    as a bare button (`App.tsx:1258`) with no confirmation. New:
    - Profile chip becomes a **menu**:
      **Edit my answers** (reopens the quiz pre-filled) · **Saved homes** ·
      **Log out** (returns to the verify screen; your profile row is untouched)
      · **Reset account** (behind a typed confirmation — this is the one that
      deletes your answers).
    - "Start over" is removed from the nav bar entirely.

---

## Order I will work in

1. `lib/listings.ts` — price band, bedrooms, sq ft, per-listing rooms, mock tips
2. `lib/quiz.ts` + `Quiz` component — new questions, paired pages, size options
3. `lib/matching.ts` — room size out of the gate, Others bucket
4. `lib/demoData.ts` — rescale room sizes to match
5. `App.tsx` — districts-first browse, Saved homes tab, listing→chat, tags,
   chat/viewing rewrite, AR removal, profile menu, empty state, scroll fix
6. `index.css` — new components
7. `npm run typecheck` + `npm run lint` + `npm run build`

**Nothing outside `Figma/src/` is touched in this session.**

---

# RentMate — UI change plan, pass 3 (owner's second review, 14 Oct)

**Status: proposal written before any edit, then worked in this order.**

## A. Things that are bugs, not preferences

1. **The backend was never connected.** `Figma/.env.local` sets
   `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. This is
   a **Vite** app: it only exposes variables prefixed `VITE_`. So
   `isSupabaseConfigured` is `false`, `backendMode` is `"local"`, and **nothing
   has ever been written to Postgres** — no profile row, no saved homes, no
   messages. That is why logging out and back in looks like lost data: the only
   copy is the one in this browser. Fix: rename the two variables.
2. **"Log out" does not log out.** `onLogout` in `App.tsx` sets the screen back
   to Home but never calls `forgetAccount()`, so the remembered email survives
   and the very next mount walks straight back into the account.
3. **Signing back in always re-runs the quiz.** The Verify screen never asks
   whether that email already has an account, so an existing profile is ignored
   and you answer twenty questions again. It should restore the row and say so.
4. **"Next" throws away a profile and bounces the page.** The biggest button on
   the match card is `advance(true)` — it discards the person *and* scrolls to
   the top. Both are wrong.
5. **"How you think" is unreadable.** `.quiz-section-note b` never sets a
   colour, so the section label inherits a muted tone against a near-white card.
6. **Discarded people come straight back.** There is no record of who you
   passed on, so the deck is the same list every time.
7. **"Send to chat" silently picks a conversation.** It pushes the home into
   whichever chat happens to be open, from both the Homes tab and the Messages
   rail — so from Homes it can post into a thread you are not looking at.

## B. What you asked for

8. **The areas question becomes the AI area suggester.** Today the AI
   neighbourhood guide sits on the *Homes* district step; the owner's IP put it
   on the "where would you live" question. Selecting a district in the quiz now
   surfaces that district's vibe + community reputation, as you pick.
   Also: `AREA_GUIDES` only covers 9 of the 17 selectable districts — the other
   8 get written so no pick is silent.
9. **Study year and major become real.** They are not fields anywhere — the demo
   cast bakes them into the `school` string (`"CUHK · Year 2 · Sociology"`), and
   the quiz never asks, so your own profile has no year and no major. Two new
   quiz questions, two new `Profile` fields, two new columns, shown on your own
   account chip.
10. **Match card actions re-cut:**
    - **Say hi** takes the big primary button and goes straight to the chat.
    - **Not for me** takes the slot "Full profile" used to occupy.
    - **See profile** takes the slot the reaction buttons occupied; the reaction
      chips move up into the hook bubble so react→chat still works.
    - No scroll on either action.
11. **The deck always has someone in it.** Tier 1 = eligible, un-discarded.
    When tier 1 empties, tier 2 = the people you passed on plus the people your
    non-negotiables exclude, under a banner saying the top recommendations are
    exhausted. Discarding removes from tier 1 immediately.
12. **A real Hong Kong map.** The current one is a hand-drawn schematic with
    percentage-positioned dots. Replaced with Leaflet + OpenStreetMap tiles at
    real coordinates: drag to pan, wheel to zoom, pins keep their status styling.
13. **Left result rows lose the AI notes.** The listing notes stay in the detail
    panel (where you actually read them) and out of the scan list; the row is
    re-laid out so the price, the share and the actions stop overlapping.
14. **Send to chat opens a picker.** A small modal listing your conversations;
    you choose who gets it. Same control in the Homes tab and the Messages rail.
15. **Listing status stops being a dropdown.** A dropdown let you declare a flat
    "taken" for no reason. It becomes **Book a viewing with the agent**, which
    sets the status to viewing and posts the agent's reply; and the agent then
    writes back when a booking falls through — hardcoded examples seeded into
    the demo account's saved page so the flow is visible.
16. **Deleted:** "No grid, no swiping. Each card opens with one real thing you
    two have in common — react to it and the conversation has already started."

## C. Deliberately NOT done

- The 3D viewer is left alone ("abit awkward but whatever").
- Nothing in `vault/`, `docs/`, `README.md`, `SUBMISSION_REPORT.md` or
  `FEATURE_LEDGER.md`.

## Order I will work in

1. `.env.local` (1) → `lib/api.ts` + `App.tsx` logout/sign-in (2, 3)
2. `lib/areaGuides.ts`, `lib/quiz.ts`, `lib/matching.ts`, migration (8, 9)
3. `App.tsx` — quiz panel, match card, deck tiers, hero copy, homes rows,
   send picker, booking, agent updates (5, 6, 7, 10, 11, 13, 14, 15, 16)
4. `lib/hkMap.tsx` + `App.tsx` map swap (12)
5. `index.css`, then `npx tsc --noEmit`, `npm run build`, `npm run smoke`
