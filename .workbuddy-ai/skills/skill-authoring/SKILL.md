---
name: skill-authoring
description: "The full lifecycle for authoring, revising, auditing, and packaging a skill: decide create vs update, draft the contract, decide which of today's conventions it must honor (fault suite, report-only, sync, duplication policy, light-mode trigger — each conditional, never boilerplate), then package and sync. Use when a user wants to create a new skill, rewrite or correct an existing one, review a skill for drift/bloat, or decide whether a rule belongs in a skill at all. Strict skill (light-mode default): run on explicit request ('make a skill', 'edit this skill', 'review my skills'), or when its full task is in view — a skill is being created, materially changed, or audited. A one-line typo fix is not a full task; just edit. Otherwise do not load, audit against, or quote it."
agent_created: true
---

# Skill-Authoring — create, revise, audit, package

Supersedes the split between `skill-creator` (create only) and `skill-update-spec` (update
only). One entry point for the whole lifecycle, because the same judgment — *what earns its
place in this skill* — governs all four modes.

`skill-creator` is still the **mechanical** tool for scaffolding and packaging
(`scripts/init_skill.py`, `scripts/package_skill.py`) and the reference for skill anatomy.
Use this skill for the **decisions**; call `skill-creator`'s scripts for the file I/O.

## Light mode (default)

**Strict skill.** Run it only when the user names it ("make a skill", "edit this skill",
"review my skills", "why is this skill bloated"), or when its full task is in view: a skill
is being **created**, **materially changed**, or **audited**. A typo fix, a one-line wording
change, or a question *about* skills is not a full task — just answer or edit. Otherwise do
not load, audit against, or quote it. The contract and every skill's trigger live in one
place — the `light-mode` skill.

---

## Step 0 — Decide the mode (and whether a skill is even the right answer)

| Mode | When |
|---|---|
| **Create** | a genuinely new capability, repeatable, with a trigger no existing skill owns |
| **Revise** | an existing skill does the wrong thing, misses a case, or has drifted |
| **Audit** | the user suspects bloat, duplication, or drift across skills — *report first* |
| **Retire/merge** | two skills own one trigger, or a skill's trigger never fires |

**Before any of these: does this need to be a skill?** Run the sufficiency ladder and stop at
the first rung that holds:

1. Is it a one-off task? → do it; don't skillify it.
2. Is it a rule already owned by an existing skill? → put it there, don't add a parallel skill.
3. Can it be one line in an existing skill's body? → that. A new skill is not free: it costs
   discovery ("which skill do I call?") and a trigger that must be maintained.
4. Only then: a new skill, with its own distinct trigger.

## Step 1 — Establish the contract (before writing a word)

Answer these from evidence, not assumption. If a mode is Create, the answers come from the
user's concrete examples (what they would type to invoke it). If Revise/Audit, read the
target first.

- **Trigger** — the exact phrases and the *situation* that should load it, and the situations
  that must NOT (the do-NOT-use clauses are what do the routing).
- **Full task** — what completion point makes it run. Every strict skill defines this.
- **Output** — what it produces (a report, an edit, a file). And its direction: does it
  **report only** or may it **edit**?
- **Boundary** — what it does *not* do, and which neighbouring skill owns that.

## Step 2 — The conventions gate (conditional, not boilerplate)

Today's conclusions are a **checklist to run, not a template to paste**. For each item,
decide whether it applies; if it does not, say so in one line and move on. Do not add a
section to a skill that does not need it — that is exactly the rule bloat this repo fights.

| Convention | Applies when | Does NOT apply when |
|---|---|---|
| **Fault suite or it's not done** | the skill ships a **script** (`scripts/*.py`) — a validator/checker that can silently pass. Then: every bundled script gets a fault suite, and **the suite must go red when the fix is reverted**. A case that passes both with and without the fix is not a case. | the skill is markdown-only (a method/style). There is nothing mechanical to fault-test — say so rather than inventing one. |
| **Report-only default** | the skill **touches the user's files** (memory, docs, code). | the skill's whole purpose is to produce a file (a generator). |
| **Sync discipline** | the skill is `agent_created` in `~/.workbuddy-ai/skills/`. Then the **live directory is the source of truth**; the package is a downstream snapshot refreshed by re-copying. Never debug inside the package. | the skill is marketplace/third-party — not yours to sync. |
| **Duplication policy** | a rule appears in more than one skill. See "Duplication" below. | — |
| **Light-mode trigger** | the skill is **strict** — heavy, with a real cost when loaded off-target. Then its frontmatter `description` and its own Light-mode section both carry the trigger. | the skill is light/always-cheap. `mini-worker` is the worked example: it is a bounded one-file procedure with no ceremony to suppress, so it has **no** light-mode section and needs none. Adding one would be boilerplate. |

### Duplication — the deliberate kind, and the accidental kind

The user's 2026-10-07 ruling: **some duplication is intentional** — *in case only one file is
loaded*. So "deduplicate everywhere" is wrong; it would leave a standalone load without its
rule. The working split:

- **A load-bearing rule stays local.** Each skill keeps a short, self-contained restatement of
  any rule it *must have to function alone* (e.g. a strict skill's own light-mode default and
  trigger). A pointer is not a substitute — if the skill is loaded alone, the pointer dangles.
- **Only the long form is centralized.** Rationale, cross-skill tables, and long explanations
  live in one owning skill; others point at it.
- **Guard divergence, don't prevent duplication.** Copies are kept true by `drift-check`, not by
  deleting them.
- **The merge test.** Merging two skills reduces the **count**, not the **rules**. A 600-line
  merged skill is not less to follow than two 300-line ones. Merge only for *discovery* (one
  entry point), never as a claimed rule reduction. This is the Lever A / Lever B split in
  `agent-eval-plans/skill-package/CONSOLIDATION-PROPOSAL.md`.

## Step 3 — Draft (anatomy + writing style)

Follow `skill-creator`'s anatomy (SKILL.md + optional `scripts/` `references/` `assets/`) and
progressive disclosure (metadata → body → resources). Two things `skill-creator` does not
stress that matter here:

- **The frontmatter `description` is the router.** Put the trigger phrases *in it* — that is
  what the host matches on. A description that only says what the skill is, not when to use
  it, will not load.
- **`agent_created: true`** in frontmatter, or the skill cannot be revised later.

Write the body in imperative form. Keep the *contract* (trigger, full task, output direction,
hard rules) in the body; move long reference material to `references/`.

## Step 4 — Fault-test the scripts (if any)

If Step 2 said a fault suite applies: write it, then **prove it can fail** — revert the fix in
a scratch copy and confirm the suite goes red. Record the case. (This is the discipline that
found two unguarded `drift-check` fixes on 2026-10-07.) If the skill is markdown-only, state
that explicitly so a reader does not mistake its absence for an omission.

## Step 5 — Package and sync (if the skill is yours)

1. **Edit the live skill** in `~/.workbuddy-ai/skills/<name>/` — never the package copy.
2. **Refresh the package** by re-copying live → package (`cp -r src/. dst/`; never
   `rm -rf dst`). Verify with `diff -r`.
3. **Append a CHANGELOG entry** — by *why it changed*, not just what. If the skill has a
   `references/changelog.md`, use that; otherwise the package CHANGELOG.
4. **Version**: bump only when **user-facing behavior or the contract changes** (trigger,
   guardrails, output shape). A surgical edit that preserves behavior gets a dated changelog
   line, no bump — a per-edit version bump is ceremony the changelog already covers.

## Step 6 — Verify against the contract

Read the finished skill and check it against Step 1's contract: does the trigger in the
description match the body? Is the full task stated? Is the output direction (report vs edit)
unambiguous? Prefer an executable check (a fault case) over a mental walkthrough where one
exists. Report what changed, file by file.

---

## Hard rules

1. **Sufficiency before addition.** Every added step must clear the Step-0 ladder. A step that
   restates another is waste — this is the jumbled-rulebook failure in one line.
2. **Conventions are conditional.** Run the Step-2 gate; never paste all five into every skill.
   State the ones that do not apply and why. `mini-worker` needs no light-mode section.
3. **Duplication is managed, not erased.** Load-bearing rules stay local; only long forms are
   centralised; `drift-check` guards divergence.
4. **Count reduction is not rule reduction.** Merge for discovery, not to claim less to follow.
5. **Report-only unless the skill's job is to edit.** A skill that touches user files states
   its direction in the body.
6. **A script without a fault suite is a liability.** If it ships scripts, prove they can fail;
   if it ships none, say so.
7. **Live directory is the source of truth.** Never debug or fix a skill inside the package.
8. **Never change a skill's conceptual core without explicit user approval.** A plausible
   improvement that alters what the skill *is* is a redefinition, not an edit — report it and
   wait. (This is the Goal-Conformance Gate, owned by `planning-graph-coding`.)

## Integration

- `skill-creator` (bundled) — the **mechanical** tool: `init_skill.py` scaffolds, `package_skill.py`
  validates+packages. Use it for file I/O; use this skill for the decisions. Also the reference
  for marketplace-skill editing (`userModified: true`).
- `skill-update-spec` — the older update-only process. **Now a specialised path**: its 10-section
  spec sheet is the heavyweight option when an update is large or contested. This skill is the
  default; reach for the spec sheet when the change is risky enough to want it written down.
- `light-mode` — owns the strict/light contract and every strict skill's trigger. A new strict
  skill registers its trigger there **and** restates it locally (load-bearing-duplication rule).
- `drift-check` — keeps duplicated rules true across skills. When two skills carry the same
  rule, that is what stops them diverging.
- `planning-graph-coding` — owns the Goal-Conformance Gate applied in Hard rule 8.
- `skills-security-check` — run before installing any skill that ships executable content.

## Changelog

- **2026-10-07** — Created. Supersedes the create/update split (`skill-creator` /
  `skill-update-spec`) with one lifecycle skill, and folds in today's conclusions as a
  **conditional** gate (fault-suite-or-it's-not-done, report-only default, sync discipline,
  duplication management, light-mode-trigger-only-if-appropriate) rather than boilerplate.
