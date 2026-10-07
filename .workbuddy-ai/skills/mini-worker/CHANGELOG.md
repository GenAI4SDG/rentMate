# mini-worker — changelog

Durable history for this skill. Readability passes move *narrative* here from
`SKILL.md`; rules, constraints, and warnings stay in `SKILL.md`.
Append-only.

## 2026-10-06 — resolve a stale in-doc contradiction

**Summary:** removed a "Resolving a contradictory instruction" subsection that
narrated a conflict already resolved in the rule itself. No behaviour change.

**Problem:** `SKILL.md` carried a subsection describing two mutually exclusive
rules from *an early draft* — "keep the pseudocode comments" vs. "do not leave
pseudocode comments in the finished source" — and explaining which one won. But the
draft no longer existed: the Constraints list already stated the winning rule
unambiguously. The subsection was therefore archaeology that *recreated* the
contradiction it claimed to resolve, and a reader could mistake it for a live one.

**Removed from SKILL.md:**
- Section `### Resolving a contradictory instruction` (an earlier draft's conflict
  plus the resolution rationale).

**Kept in SKILL.md (the actual rule):**
- Pseudocode comments **stay** in the finished source as implementation notes.
- User instruction overrides the default (added inline to the same bullet, so the
  precedence is stated where the rule lives).

**Note:** no git history holds the original earlier draft — this skill was never
committed in the `agent-eval-plans` package until checkpoint `f4fd1c8` (2026-10-06),
and the `kaggle-gemma4/submission-skills/mini-worker` copy is a *different*
(competition-harness) skill, not this one.
