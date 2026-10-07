# skill-update-spec — changelog

Durable history for this skill. **Append-only** — never rewrite or re-word an existing
entry; add a new dated entry instead, even to correct an earlier one. (Stated 2026-10-07
to match the per-skill `CHANGELOG.md` convention; the 2026-10-06 entry was edited in
place before this rule was written.)

## 2026-10-07
**Summary:** Positioned this skill as the heavy, opt-in path now that `skill-authoring` is the default lifecycle skill; corrected the "Do NOT trigger" list.
**Reason:** `skill-authoring` (created this day) covers create/revise/audit as one lifecycle. Without an edit, this skill still read as *the* way to change a skill and still told users to skip to `skill-creator` for creation — both wrong now. Merging was rejected (it would reduce the count, not the rules); the fix is a clear division: `skill-authoring` default, this skill's 10-section spec sheet when the update is large or contested.
**Changes:**
- "Do NOT trigger" list now routes creation and ordinary revisions to `skill-authoring`; states this skill is the heavyweight option for a large/contested update.
- Integration table gains a `skill-authoring` row (default full-lifecycle skill) above the `skill-creator` row.
- No workflow change; the 10-section spec sheet is unchanged.

## v1.1 — 2026-10-04
**Summary:** Added a Goal-Conformance Gate — every proposed skill change must be checked against the skill's *established goals* (and how the project actually runs) before it is applied; a change that conflicts is reported with value/caveats and held for approval instead of being applied via a guessed fallback.
**Reason:** A review pass produced suggestions that were not fully aligned with the projects they targeted, and the agent's instinct was to apply them anyway with a plausible-looking fallback. The missing step was explicitly: *does this change serve the goal that motivated it, given the real constraints?* If not, stop and report — do not guess.
**Changes:**
- New "Step 2b: Goal-Conformance Gate" in the Workflow — state the declared goal, check the change against it and against the project's actual conventions, classify each proposed change as `serves the goal` / `conflicts with the goal` / `goal unknown`, and for conflicts report value + caveats and WAIT (do not apply a fallback).
- New spec-sheet section reference: Section 2 now requires the **established goal** and an **alignment verdict** per proposed change.
- New guardrail: "No guessed fallback" — when a change is rejected-for-conflict or under-specified, return the analysis and wait; never substitute a nearest-plausible edit.
- New guardrail: "Return information on conflict, don't act" — the default outcome of an ambiguous or conflicted change is a report, not an edit.
- Frontmatter `description` extended to name the goal-conformance + report-don't-guess behavior.
- `spec-sheet-template.md` gains a "Declared goal" field and an "Alignment verdict" line in Sections 2 and 4.

## 2026-10-06
**Summary:** Piloted the sufficiency ladder as a pre-write check; condensed Step 6 default mental walkthrough and Step 7 per-edit version bump.
**Reason:** A prior review flagged these as low-value steps that buy little and cannot fail on their own.
**Changes:**
- New `Sufficiency discipline (pre-write check)` subsection after Overview: before adding any step/section/verification/version bump, run the ladder and stop at the first rung that holds.
- Step 6 Verify: replaced the default mental walkthrough with a spec-sheet check that prefers an executable fault case; mental walkthrough is now only a fallback.
- Step 7 renamed to `Record the change`; version increments only on user-facing or contract changes, not every surgical edit.

> **Provenance (moved out of SKILL.md 2026-10-06):** the ladder was piloted from
> `DietrichGebert/ponytail`; the driving review note was
> `eval-notes-efficiency-and-unverified.md` (§B-2a low-value steps, §D). The skill
> body now states the practice without citing the source documents.
