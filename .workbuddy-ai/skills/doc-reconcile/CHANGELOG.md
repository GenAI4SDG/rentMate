# doc-reconcile — changelog

Durable history for this skill. Readability passes move *narrative* here from
`SKILL.md`; rules, gates, commands, and warnings stay in `SKILL.md`.
Append-only.

## 2026-10-07 — dedup pass (bloat reduction)

**Change (no rule lost, no behaviour change):**
- The light-mode contract was restated in this skill's frontmatter *and* body. Both are
  now a **one-line pointer** to the `light-mode` skill, which became the single source
  for every strict skill's trigger.
- The "this file's names are not universal" caveat was written **three times** (a 🔧
  block, a "method is portable" paragraph, and the `## Scope` note). Merged to one 🔧
  block at the top plus one contextual note where the example table sits. **−21 lines**
  (427 → 406).

**Why:** the user reported rule bloat — "the sheer number of rules to be followed made
following it a jumbled mess". The duplication was the mechanism: one contract copied six
times, one caveat three times. Deleting copies is the fix; the rules themselves are
unchanged.

## 2026-10-07 — declarative exclusion is per-claim, not per-file

**Change:** Step 0 gained a caveat after "NEVER reconcile a declarative doc against
the code": a declarative doc is **not uniformly declarative**. A design-of-record
spec commonly carries an embedded descriptive section (a status/gate table
`[built]`/`[partial]`/`[planned]`, a coverage matrix, a "what ships today" column)
whose cells are fact-claims about the code. **Reconcile those cells; exclude only the
intent prose around them.**

**Why (measured):** running this skill on the `coding_assistant` repo found the seam.
Its most authoritative doc (`PLANNING_SPEC.md`) was excluded wholesale by the old rule,
and its §9 gate-status column had drifted — a gate marked `[planned]` had shipped —
and sat for two days because the old rule said never to look at that file. The rule
"find every declarative doc and exclude each" was correct about *intent* and wrong
about *embedded claims*; this entry closes that gap. The same run also showed the
skill's count/status/file-set classes **do** fire on this kind of repo (8 findings,
including one — a suite's guard count — that a manual sweep had missed), which is why
the fix is scoped to the exclusion rule rather than to the method.

**Not changed:** the method, the classes, the report-only discipline. The declarative
exclusion still holds for intent content.

## 2026-10-06 — readability pass (SKILL.md → here)

**Summary:** removed process archaeology from `SKILL.md`; kept every rule, gate,
command and warning. No behaviour change.

**Removed from SKILL.md:**
- `(This is the §3.5 portability tidy-up — applied 2026-10-06.)` — edit-provenance
  note, not a rule.
- `(e.g. AI_prgm and video game_draft each legitimately needed two …)` — repo-specific
  anecdote; the rule ("the count is not the rule; find every declarative doc") stayed.
- **Worked example — deleted standalone GUI route, 2026-09-25** (~22 lines): the
  two-wrong-reports-in-sequence story.
- `This exact mistake was made once already (see below)` — pointer into the removed story.

**Also removed in the same pass — concrete evidence, not narrative.** The list above was
incomplete when this entry was first written: the pass had a *third* category that the
"narrative vs rules" framing does not name — **concrete evidence** (measured numbers, dates,
SHAs, repo/file names). These carry no rule, so they were dropped rather than moved, and they
were not recorded here. Recorded now so the manifest is complete:

- `Measured 2026-10-05, those were **9,063/9,120** and **27** — drifted by several hundred and
  by six.` → reduced to "Such numbers have been found drifted by hundreds." **This is the one
  costly removal:** it was the only *quantitative* demonstration that the numeric-drift rule
  bites, and the replacement ("found drifted by hundreds") is not falsifiable in the way a
  dated measurement is. If the rule is ever challenged, re-measure rather than cite this line.
- `The split (…, 2026-10-04)` → date dropped.
- `D20 was written as …` → defect number dropped; the premise example kept.
- `REPO_MAP.md was deleted 2026-10-03 (user call — it was a stale handover note)` → generalised
  to "A deleted handover note stays deleted"; filename and date dropped.
- `On 2026-10-02 a teammate's concurrent edits replaced a component and split page.tsx` →
  generalised; date and filename dropped.
- `repo_map.py` → "the measurement" (deliberate portability de-naming).
- `This has happened once already.` (cross-reference section) → dropped.

**Convention note:** when a later pass moves evidence out, list it under a heading that says so.
"Removed from SKILL.md" is read as a manifest; an incomplete manifest is a doc-vs-reality gap of
exactly the kind this skill exists to find.

**Kept in SKILL.md (the load-bearing parts of the removed story):**
- Do not conclude "never committed" from `git ls-files` alone — read the index only;
  always run `git log` too.
- A file absent from history is a **divergence, not automatically a defect**.
- Never write "restore it" into a report; report the fact and let a human decide.
- Flag any commit whose `--stat` shows a deletion the subject omits.

**Moved here (the full story, for reference only — do not re-derive rules from it):**

> A standalone GUI route was deleted. The first report used `git ls-files`, got no
> match, and claimed "never committed to git; cannot be restored." Wrong:
> `git log --all -- <path>` showed it added in `3d8ef90`, modified in `ff00083`,
> **deleted in `742f503`** — a commit titled "some notes for ai." that also carried
> unrelated doc work, i.e. a deletion swept in by `git add -A`.
>
> The corrected report then said "deleted, recoverable — restore it with
> `git checkout ff00083 -- ...`." Also wrong. The user had deleted it **deliberately**:
> a project's `.py` and `.tsx` are fetched concurrently and a missing `.tsx` is a
> tolerable non-error, so the separate GUI route was redundant. Nothing needed
> restoring; `ARCHITECTURE.md` §3 Layer D was the stale artifact.
>
> Two durable lessons came out of it (both now stated as rules in `SKILL.md`):
> (1) a deletion bundled into an unrelated commit is invisible in `git status` and in
> the commit subject — read `--stat`; (2) recovering a fact is not the same as knowing
> intent — an absent file is a divergence, not a defect.
