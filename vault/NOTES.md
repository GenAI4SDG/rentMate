# Notes on the RentMate methodology run

*Informal. This is the agent's own read of the repo and of how the `coding_assistant`  
methodology behaved on it — written because the owner asked for views rather than  
another formal artifact. Not a spec, not approved by anyone, not authoritative.  
The authoritative artifacts are the IP + CPs in `ips/` and `cps/`; this note is  
commentary on them.*

---

## 1. What this run actually is

A **solo experiment on an offshoot branch** (`AI-random-bs-go`), not a team  
contribution. The question being asked is not "does RentMate ship" but **"does the  
IP → CP → PG → gate pipeline do anything useful on a real, messy repo?"** Everything  
below is in that spirit. If a claim here turns out to matter for the team, it should  
be re-derived on `main`, not trusted because it is written down here.

## 2. The thing the repo was actually suffering from

The project had **three incompatible statements of itself**, all committed:

1. the **interim report** ([`docs/GENAI SDG interim draft.pdf`](../docs/GENAI%20SDG%20interim%20draft.pdf)) — team-agreed, and  
   the one the owner treats as authority;
2. the **`docs/site-spec-suite/` draft** — unratified, and it quietly added an  
   in-app chat and a *strict gender filter* that the report does not mention;
3. **`HK_Rental_Platform_Master_Cursor_Spec.md`** — a landlord/tenant property  
   marketplace, which is what `backend/supabase/` was actually built against.

None of them is "wrong" exactly. The problem is that **nothing said which one wins**,  
so the build drifted. That is the failure mode the IP is supposed to prevent: one  
artifact that states the intent, with everything else checked against it.

The honest verdict on the methodology here: **it found the drift fast and cheaply.**  
`ip_tool.py link` reported the two focuses no CP covers; `cp_tool.py validate`  
reported where the contracts were silent; the reconciliation pass surfaced the three  
statements in one sitting. That is real value, and it is the part of the pipeline I  
would keep.

## 3. What I'd keep vs. what is overkill for a three-week hackathon

| Part of the pipeline                               | Verdict                                                                                                                                                                                      |
| -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **IP as the single stated intent**                 | **Keep.** This is the whole point. Cheap, and it is the thing the repo lacked.                                                                                                               |
| **CP contracts for the deterministic functions**   | **Keep, selectively.** Worth it for `filter_eligible_matches`, `calculate_match`, `validate_institution_email` — pure functions with real edge cases. Not worth it for the LLM-facing parts. |
| **Oracle + two independent implementations (G-1)** | **Keep for the score.** It is what caught that "renormalize" ≠ "impute 0".                                                                                                                   |
| **PG (project graph) + coverage/staleness**        | **Mostly ceremony here.** Useful as a checklist; the coverage numbers were never going to change a decision at this scale.                                                                   |
| **G-8 human comprehension gate**                   | **Not exercised** (the owner waived it). Declared, not faked.                                                                                                                                |
| **Full doc-reconciliation discipline**             | **Overkill.** See §5.                                                                                                                                                                        |

## 4. The owner's decisions, and where they overruled the docs

These are the substantive calls that v2 encodes:

- **Gender is a HARD filter.** It gates candidates *before* scoring and never
  contributes a number. This overrides both the `site-spec-suite` framing (which
  treated a stated gender preference as a filter — consistent, actually) and, more
  importantly, v1's blanket claim that "gender cannot influence the score": gender
  cannot influence the *score*, but it absolutely can *exclude*. Those are different
  claims and v1 conflated them.
- **MBTI is a SOFT scoring preference.** It is one scored factor
  (`1 - differing_axes/4`), not a gate and not a label shown to the user. It is best
  elicited **through lifestyle questions** rather than asking for a 4-letter code —
  so the quiz does double duty.
- **12 questions is the demo boundary.** Between "too clunky/slow" and "not thought
  through enough". The report's spec had 22; the earlier demo had 7.
- **Don't build on Figma.** The owner would rather the agent not work in `Figma/`.

## 4b. The 2026-10-14 decisions that made it v3

The owner came back with a second batch, and three of them are **downgrades from
what v2 promised**. Recording them plainly, because the temptation with a
methodology run is to describe the plan rather than the artifact:

- **Auth is gone entirely.** No Supabase Auth, no password, no OTP. The email is
  the account key, checked **client-side** against an institution allowlist. The
  `student_verifications` table that v2's safety node rested on was dropped, so
  **no verification is stored anywhere** — not even the boolean attestation v2
  promised. RLS is switched off on every table, because with no `auth.uid()` an
  enabled policy would block every row. Both facts are declared in the IP as open
  questions (U7, U8) rather than buried.
- **The GenAI narrative is not a model.** v2 named GPT-4o-mini as the one GenAI
  component never to cut. **No model is called anywhere in the shipped app.** The
  narrative and the neighbourhood guide are pre-written content derived
  deterministically from the profiles, and the UI badges them "AI · demo". This
  was a reliability trade the owner accepted knowingly. The honest version of the
  pitch is "shaped like the real feature, pre-written" — and the IP now says so
  instead of repeating the promise.
- **Real chat, with moderation.** In-app only, persisted, over Realtime, with
  report and block. Contact details are never exchanged anywhere in the product,
  which is the mechanism that makes "lose contact when the premise of finding a
  room together is gone" true rather than aspirational.

Two more, both cosmetic-stub decisions: the 3D walkthrough is a flat stock-photo
drag panorama explicitly labelled "Illustrative mock · not a real 3D scan", and
the viewing scheduler is four hardcoded slots with a demo badge.

### The quiz drift, found and fixed

The owner's boundary was **12 questions**. The quiz on disk had **20** — and my
own note from the previous session claimed it had 12, which was simply wrong.
Fixing it honestly meant reconciling three constraints that do not fit: the
12-question boundary, all nine eligibility filters (the product's
differentiator — "we show you who we hid and why"), and all six soft factors plus
MBTI (the score).

The resolution: **composite questions.** One option now writes concrete 0..1
values for three soft factors, or fixes two type axes at once, so the matcher's
input is *unchanged* — all six soft factors, a full four-letter type, all sixteen
types reachable — while the questionnaire drops from 20 to **14**. Verified
mechanically rather than assumed: 6/6 soft factors, 4/4 axes, 16/16 types, 16/16
lifestyle vectors, and all eight oracle cases still pass.

Fourteen is still two over the owner's boundary, and the IP records that as an
open question (U9) rather than rounding it down to "about twelve". **The one
thing a methodology run must never do is quietly redefine the owner's number to
match the artifact.**

> **14 Oct 2026 — the compression did not hold.** The owner's own review passes
> added six questions back (`roommate_count`, `must_haves`, `cook_at_home`,
> `about_you_line`, `study_year`, `major`) and reframed `room_size` as
> `flat_size`. The build is **20** again. The v3 compression above stands as the
> record of what was attempted; U9 carries the current number.

## 5. Why I deleted things, and what survived

The owner said the md docs could go. On this branch they are gone, because leaving  
three contradictory statements in the tree while claiming "the IP is the spec" would  
be self-defeating — the drift would just re-form. **Nothing is lost:** `main` still  
holds every file, and `git checkout main -- <path>` restores any of them here.

**Removed** (the contradictory / unratified prose): `PRD.md`, `TEAM-BRIEF.md`,  
`HK_Rental_Platform_Master_Cursor_Spec.md`, `docs/build-plans.md`,  
`docs/interim-report-reconciliation.md`, `docs/open-decisions.md`,  
`docs/pitch-and-data-pack.md`, `docs/v0-mvp-prompt.md`, `docs/site-spec-suite/`,  
plus this run's own superseded `vault/RECONCILIATION.md` and its drift check.

**Kept** — the primary sources and anything practical:

- [`docs/GENAI SDG interim draft.pdf`](../docs/GENAI%20SDG%20interim%20draft.pdf) — the team-agreed authority;
- `Figma/` — the team-agreed UI source, untouched;
- the other PDFs ([`GenAI.pdf`](../docs/GenAI.pdf), [`SURVEY.pdf`](../docs/SURVEY.pdf)) and the research HTML;
- [`README.md`](../README.md), [`docs/demo-user-guide.md`](../docs/demo-user-guide.md), the app + backend code, `.workbuddy-ai/`.

## 6. Honest caveats

- **The G-8 gate did not run.** Every `approved` in `vault/` means "the agent applied  
  its own five checks", **not** "a human signed". No comprehension artifact exists.
- **No S-9 independence record.** The two implementations of each function were  
  written by one author from one contract — correlated-failure risk is real and  
  unmitigated here.
- **The oracles test agreement with the contract, not with intent.** This is the  
  oracle problem and it is not solved by this run.
- **Deleting docs is only safe because this is an offshoot.** On `main`, the same  
  action would need the team's sign-off.
- **Two of my own earlier claims were wrong, and the IP now says so.** My previous
  session note recorded the quiz as "12 questions"; the file had 20. And v2's
  safety node promised a stored verification boolean that is not implemented —
  there is no such column and no Auth to hang one on. Both are corrected in v3
  rather than left standing. A methodology run that cannot catch its own author's
  stale claims is not doing the job it claims to do.
- **The IP is ahead of the contracts on purpose.** v3 describes chat, moderation,
  the viewing scheduler and the labelled demo content — **none of which has a CP**,
  because none of them is a deterministic function with an oracle. The IP is
  therefore asserting intent about behaviour no contract pins. That gap is visible
  in `ip_tool.py link` as orphans, which is the correct place for it.

## 7. Open items I am deliberately leaving open

- **U7 — RLS disabled with no Auth.** Every table runs with row level security
  off, because there is no `auth.uid()` to key a policy on. Anyone with the anon
  key can read and write every row. Fine for a demo of synthetic data, not fine
  for real students, and the fix is a real auth model rather than a policy patch.
- **U8 — the client-side domain gate is not a security control.** It is a UX
  affordance; any allowlisted address passes, including one that is not the
  answerer's.
- **U9 — the quiz is 20, not the owner's 12.** v3 compressed it 20 → 14 (see
  §4b); the owner's review passes of 14 Oct then added six questions back
  (`roommate_count`, `must_haves`, `cook_at_home`, `about_you_line`,
  `study_year`, `major`) and reframed `room_size` as `flat_size`. Eight over the
  boundary, stated rather than rounded down.
- **U6 — Figma vs the root app, and the hosting consequence. RESOLVED 14 Oct 2026.**
  The product is the **`Figma/`** app; the root Vite shell is a placeholder. The
  hosting question the team never concluded is now answered by the submission
  requirement itself: the deck must carry a clickable link, so a public URL is
  mandatory, and the deploy is static. See [`docs/HOSTING.md`](../docs/HOSTING.md).
- **The 66% / 68% figures.** The report's headline percentages are the same survey  
  items earlier drafts logged as detractor counts (27/41, 28/41). Worth checking the  
  wording in [`docs/SURVEY.pdf`](../docs/SURVEY.pdf) before either goes on a slide.
- **`matchedFactors` / `frictionFactors` semantics.** The contracts deliberately do  
  not pin whether "matched" means *agreed* or *considered*. Someone should.
- **What the pitch may honestly claim.** With no model running and no stored
  verification, "AI-powered matching" and "verified students" are both false as
  written. The defensible claims are: a deterministic score you can inspect, five
  explicit eligibility filters the user can see working (each applied in both
  directions), in-app chat with report and block, and no agency fee. Someone
  should decide which of those is the headline before the deck is written.

