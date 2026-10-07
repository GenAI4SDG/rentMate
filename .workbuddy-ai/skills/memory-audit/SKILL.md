---
name: memory-audit
description: "Scan user-level and workspace memory for (a) truncation/incompleteness signals and (b) decisions or intentions discussed but never acted on, then produce a grouped, file:line-referenced review report. Report-only — never edits memory unless explicitly asked. Strict skill (light-mode default): run on explicit request ('review my memory', 'find open loops'), or on a scheduled / pre-cleanup memory review."
agent_created: true
---

# Memory-Audit

Review the user's memory stores for two failure modes that accumulate silently:
**truncations** (content cut off or dangling) and **discussed-but-not-acted states**
(open loops — decisions or intentions recorded but never followed through). Produce a
grouped, `file:line`-referenced report for the user to review. The point is a memory that
cannot quietly rot: stale or half-written notes get surfaced on demand so the user can
close, act on, or consciously defer them.

## Light mode (default)

**Strict skill.** Run it only when the user names it ("review my memory", "audit my
notes", "find open loops / truncated entries", "what did we discuss but never do"), or
when its full task is in view: a periodic memory review the user scheduled, or a
pre-archive/cleanup pass over memory. Incidental memory writes are not a full task.
Otherwise do not load, audit against, or quote it. The contract and every skill's trigger
live in one place — the `light-mode` skill.

## What to scan (scope)

Default scope (no extra instruction needed beyond "review my memory"):
- User-level: `~/.workbuddy-ai/MEMORY.md`
- Current workspace: `<workspace>/.workbuddy-ai/memory/` (MEMORY.md + daily `YYYY-MM-DD.md`)

Wider scope ("full audit"): also scan every workspace under the projects directory and,
optionally, search conversation history via the `conversation_search` tool for intentions
discussed in past chats that never reached memory or action.

## Procedure

1. **Decide scope** per above. Prefer the deterministic scanner for the mechanical pass.
2. **Run the scanner** on the target files/dirs:
   ```
   python <skill>/scripts/memory_audit.py <path> [<path> ...]
   ```
   It prints two sections — `TRUNCATION SIGNALS` and `OPEN-LOOP CANDIDATES` — each with
   `file:line` and the offending line. It also flags oversized files (>250 lines) that a
   host may truncate when injecting into context.
3. **Judge the open-loop candidates.** For each candidate intent/decision line, check
   later in the same file, the daily logs, and recent commits for resolution evidence. If
   none is found, mark it **open** and write one line: the intended action + a suggested
   next step. If resolved, note the evidence so the audit closes the loop.
4. **Cross-reference (optional, full audit).** Use `conversation_search` for the key open
   items to see whether they were discussed again and what was decided.
5. **Produce the review report** (markdown) grouped as:
   - **A. Truncations** — file:line, what is missing/dangling, suggested fix.
   - **B. Open loops / unacted decisions** — file:line, intended action, suggested next
     step, age if inferable from dates in the file.
   - **C. Oversized / at-risk files** — flagged for summarization.
   - **D. Summary** — counts + recommended actions (close / act / defer / rewrite).
6. **Report only.** Do NOT edit memory files unless the user explicitly asks. Present the
   report and let the user decide what to close, act on, or defer. Autonomous memory
   rewrites risk dropping information the user meant to keep.

## Notes / boundaries

- The scanner is mechanical; the *judgment* of whether an item was acted on stays with the
  agent + user. The script never decides "resolved".
- `decided` / `the user wants` lines are decisions, not necessarily open loops — flag them
  only when no follow-through evidence exists.
- Truncation markers the scanner keys on: `truncated`, `(… truncated)`,
  `(user memory truncated)`, `TBC`, `to be continued`, `cut off`, `[...]`, and list-intros
  (a line ending `:`/`—` with no following items before the next heading or EOF).
- Intent markers the scanner keys on: `TODO`, `TBD`, `FIXME`, `pending`, `unresolved`,
  `open question`, `blocked`, `for review`, `defer(red)`, `next session/time`, `will
  (do/handle/...)`, `plan to`, `should ...`, `to be done`, `decided`, `the user wants`.
