---
name: light-mode
description: "Documents the default operating mode for the strict user-authored skills (doc-reconcile, planning-graph-coding, prompt-back, drift-check, task-context-closeout, memory-audit, skill-authoring). Light mode is the default: a strict skill is suppressed unless the user explicitly calls it by name or the work is finishing that skill's defined 'full task'. Use this skill when the user asks about light/strict mode, says 'lighten up', 'skip the ceremony', or wants to know why a heavy skill did or did not run. Do not use it to perform the heavy skill's work itself."
agent_created: true
---

# Light Mode — the default for strict skills

## Rule

Light mode is the **default** for the strict skills. A strict skill runs its full
discipline only when ONE of:

1. **Explicit call** — the user names the skill (e.g. "run doc-reconcile",
   "use planning-graph", "drift-check this doc"). Naming it flips that run to strict.
2. **Finishing a full task** — the current work has reached the completion point
   that the skill itself defines as requiring it (see each skill's "Light mode"
   section). At that point the full discipline applies even though light is default.

In every other case — the skill was not called and no full task is finishing — the
strict skill is **suppressed**: do not load it, do not audit against it, do not quote
its rules. This is deliberate. The strict skills earn their cost on the work they were
built for; loading them on incidental relevance is the bureaucracy to avoid.

## What "full task" means per skill

**This is the single source for every strict skill's trigger.** Each skill's own
SKILL.md now only *points* here — it does not restate the contract. Read the trigger
once, here:

- `doc-reconcile`: after a batch of merges / a material code change that touches
  documented behaviour, or when a doc claim is suspected wrong — not on every edit.
  Reports only; never edits a doc unless asked.
- `planning-graph-coding`: a genuinely multi-step / ambiguous / high-cost build, not a
  one-file tweak (use `mini-worker` for that).
- `prompt-back`: a non-trivial request that is actually missing goal / context /
  constraint / format, not a clear brief.
- `drift-check`: a confirmed doc whose factual claims (vocabulary, symbol, command,
  path) must stay true as code changes, or a periodic/scheduled drift check. Never
  auto-generate behavioural tests from prose.
- `task-context-closeout`: a completed task with a known downstream black-box consumer
  and current permitted docs (its eligibility gate).
- `memory-audit`: a requested memory review — scan user-level + workspace memory for
  truncations and discussed-but-unacted decisions, and report `file:line`. Report-only;
  never edits memory unless asked.
- `skill-authoring`: a skill is being created, materially changed, or audited — not a typo
  fix or a question about skills. Report-only in its Audit mode; edits the named skill in
  Create/Revise.

## Noticing the trigger (the half that was missing)

Rule 2 says a strict skill runs when its full task *finishes* — but nothing said how
to **notice** that it finished, and that is exactly where it failed. Measured case
(2026-10-07): a commit changed a documented count (`g1_faults` 12 → 18 guards). That
is `doc-reconcile`'s own trigger ("a material code change that touches documented
behaviour") and nothing fired, so the drift sat for two days across five docs. The
rule was right; the detection was absent.

The fix is a **boundary check, not a watchdog**. When a task ends, or you commit,
ask the one question per skill that makes its trigger observable:

- `doc-reconcile` — did this change a **documented fact**? a count, a status flip
  (`draft` → `approved`), a file added/renamed/deleted, or a "does not yet / now
  built" capability claim. Cheap test: the diff touches a `.md` **and** the code
  that `.md` describes → reconcile.
- `planning-graph-coding` — is this a multi-step build with an approval point?
- `prompt-back` — is the request actually missing goal/context/constraint/format?
- `drift-check` — must this doc's factual claims stay true as the code changes?
- `task-context-closeout` — is the task done **and** has a downstream black-box consumer?
- `skill-authoring` — is a **skill** being created, materially changed, or audited? (A typo
  fix or a question about skills is not a full task.)

If a signal fires, the full task is finishing — run the skill. If none fires, stay in
light mode. This runs only at a boundary (task end / commit); it adds no per-edit
ceremony.

## Why this exists

The user found the agents had become rulebook-quoting bureaucrats: strict skills loaded
on vaguely related tasks and then had to be internally overridden. Light-by-default keeps
the discipline where it pays off (explicit request, or the skill's own defined
completion) and stays out of the way elsewhere. Strict is preserved as an opt-in, not
removed — the Goal-Conformance Gate and all approval/safety gates stay intact for any
run that does go strict.
