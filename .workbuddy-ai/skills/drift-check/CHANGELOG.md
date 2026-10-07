# drift-check — changelog

Durable history for this skill. Readability passes move *narrative* here from
`SKILL.md`; rules, warnings, and commands stay in `SKILL.md`.
Append-only.

## 2026-10-06 — readability pass (SKILL.md → here)

**Summary:** removed incidental edit-provenance and incident-notes from `SKILL.md`;
kept every rule, warning, command, and limitation. No behaviour change.

**Removed from SKILL.md:**
- `(since 2026-10-05)` on the recursive-scan rule — the rule states the current
  behaviour; the date added nothing.
- `(both hit in a real pass)` on the two-traps note.
- `This was hit for real on 2026-10-05 (three sibling docs) and cost a full round of
  false findings.` — incident anecdote on the ordering trap.
- `now` / `Before this fix` in the basename-resolution limitation — a fix-narrative
  where the limitation itself is the durable fact.

**Background worth keeping for context (not a rule):** the `drift-check` fixes
recorded in the removed notes are covered by the regression record, not by prose —
per this repo's convention, "the fault suite in `scripts/faults.py` is the regression
record — every fix should have a case there" (from the package CHANGELOG). The four
claim kinds (`vocabulary` / `symbol` / `command` / `path`) and the `golden` baseline
semantics are unchanged.

## 2026-10-07 — fault suite 24 → 26 cases (two `resolve_path` regressions)

**Summary:** mutation testing found that **both `resolve_path` fixes were present and
correct but covered by no case at all** — reverting either left the suite green. Two
regression cases added; no production-code change.

**Method (this is the durable part):** a passing fault suite proves the code *works*;
it does **not** prove a fix is *guarded*. A case that passes both with and without the
fix is not a regression case. So each fix was reverted in a scratch copy and the suite
re-run — only the mutation separates guarded from merely-present. Re-runnable:
`agent-eval-plans/scripts/driftcheck-mutation-probe.py`.

**Before:** `_iter_py` recursion and `default_baseline_path` stem-keying were caught
(exit 1). `resolve_path` pass-2 recursion and the doc-dir/ancestor `roots` were **not**
(exit 0).

**Added cases:**
- `nested bare-basename path seen -> ok` — doc names a file by bare basename while it
  lives in a subdirectory (`bench/scripts/h23_census.py`). The 2026-10-05
  false-positive class; fails if `resolve_path` regresses to pass-1-only.
- `doc-relative path across directories -> ok` — doc in `docs/`, `--target` = `src/`,
  claim relative to the doc. Every pre-existing fixture put the doc *beside* the
  target, making the extra roots redundant, so this was untestable before.

**Trap recorded in the new case's comment:** dropping *only* the explicit doc-dir
append is a **no-op** — the ancestor-walk below re-adds it. Both halves must regress
together for the case to mean anything. Caught because the positive probe's output
didn't change; the suite alone reports exit 0 either way.

**After:** all four code sites mutation-guarded (exit 1 when reverted).
