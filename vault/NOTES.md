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

1. the **interim report** (`docs/GENAI SDG interim draft.pdf`) — team-agreed, and  
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

- `docs/GENAI SDG interim draft.pdf` — the team-agreed authority;
- `Figma/` — the team-agreed UI source, untouched;
- the other PDFs (`GenAI.pdf`, `SURVEY.pdf`) and the research HTML;
- `README.md`, `docs/demo-user-guide.md`, the app + backend code, `.workbuddy-ai/`.

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

## 7. Open items I am deliberately leaving open

- **U6 — Figma vs the root app, and the hosting consequence.** The team never  
  concluded this. It matters because the root app is a Vite SPA: presenting it  
  on-screen from a laptop means either `npm run dev` locally or **hosting it**  
  (e.g. Vercel) so the link opens anywhere. This is the owner's call, not the  
  methodology's — flagged, not decided.
- **The 66% / 68% figures.** The report's headline percentages are the same survey  
  items earlier drafts logged as detractor counts (27/41, 28/41). Worth checking the  
  wording in `docs/SURVEY.pdf` before either goes on a slide.
- **`matchedFactors` / `frictionFactors` semantics.** The contracts deliberately do  
  not pin whether "matched" means *agreed* or *considered*. Someone should.
