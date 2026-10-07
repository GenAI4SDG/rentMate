---
name: skill-update-spec
description: "Structured specification workflow for updating or refining any existing skill. This skill should be used when a user wants to modify, improve, correct, or evolve a skill they have already created or installed — it forces articulation of WHY a change is needed, WHAT should change, and HOW the agent should interpret intent without drifting or over-correcting. It also enforces a Goal-Conformance Gate: every proposed change is checked against the skill's established goals and how the project actually runs, and a change that conflicts is reported with its value and caveats and held for approval — never applied via a guessed fallback. Triggers include phrases like 'update this skill', 'refine this skill', 'fix skill drift', 'change how this skill behaves', 'the skill is doing X wrong', or when filling out a spec sheet for a skill update."
agent_created: true
---

# Skill Update Spec

## Overview

This skill provides a formal, structured specification workflow for updating any existing skill. Rather than ad-hoc edits that introduce drift or over-correction, it enforces a spec-sheet process: articulate *why* a change is needed, *what* should differ, and *how* the agent should interpret intent — all before touching any files.

The core deliverable is a completed **Skill Update Specification Sheet** (the spec sheet) that serves as the source of truth for the update. Once the spec sheet is filled out and confirmed, the actual file edits become mechanical and safe.

### Sufficiency discipline (pre-write check)

Before adding any step, section, verification, or version bump to this skill (or to a skill you are updating), run the sufficiency ladder and stop at the first rung that holds:

1. Does this need to exist? (a step that only re-states another step is waste)
2. Is it already covered by an existing step or guardrail? → reuse it, do not add a parallel one.
3. Can it be one line, or one changelog entry, instead of a new process?
4. Only then: add the minimum that actually earns its place.

This targets a common failure: low-value steps such as a mental walkthrough used as the default check, or a version bump on every edit.

## When to Use This Skill

Trigger this skill when any of the following occur:

- A user says "update this skill," "refine this skill," "change this skill's behavior," or "fix skill drift"
- A user observes that a skill is misinterpreting intent, over-simplifying, inventing loopholes, or behaving inconsistently
- A user wants to add a new capability or constraint to an existing skill
- A user references a "spec sheet" or "specification" for skill updates
- A user wants to formalize how a skill evolves over time

**Do NOT trigger this skill when:**
- Creating a brand-new skill from scratch (use `skill-creator` for scaffolding, or
  `skill-authoring` for the decisions)
- The change is small or the mode is obvious — `skill-authoring` is the default lifecycle
  skill and covers create/revise/audit without a full spec sheet. Reach for *this* skill's
  10-section spec sheet only when the update is **large or contested** enough to want it
  written down.
- Making a trivial typo fix or one-line correction (just edit directly)
- The user has not yet identified what needs to change (ask them first)

## Workflow

### Step 1: Identify the Target Skill

Determine which skill is being updated:

1. Ask the user which skill they want to update if not already clear.
2. Read the target skill's `SKILL.md` and any bundled resources (`scripts/`, `references/`, `assets/`) to understand the current state before proposing changes.
3. Record the skill's path, current version (if versioned), and scope (user-level vs project-level).

### Step 2: Gather the Update Intent

Ask the user — or extract from their message — the following information:

- **What problem was observed?** (drift, misinterpretation, missing capability, constraint violation)
- **What behavior needs to change?** (be specific: "stop warning about over-engineering when complexity is intentional")
- **What should the skill avoid doing?** (guardrails)
- **Are there new inputs, outputs, or workflow steps to add?**

If the user's description is vague, ask targeted follow-up questions one at a time. Do not guess the intent.

### Step 2b: Goal-Conformance Gate (mandatory — run before proposing any change)

Before turning intent into a proposed change, check that the change actually **serves the goal that
motivated it**, given how the project/skill really works. A plausible change is not a good change if
it works against its own reason for existing.

For **each** proposed change:

1. **State the declared goal** — the concrete outcome the change is meant to achieve (not the change
   itself). If no goal is stated or derivable, label it `goal unknown` and ask; do not invent one.
2. **Check alignment** — read the target skill and the project's actual conventions, then classify:
   - `serves the goal` — the change moves the skill toward the stated outcome without breaking an
     established goal, convention, or invariant.
   - `conflicts with the goal` — the change would undo, weaken, or contradict the goal it is meant to
     serve, or would break a convention/invariant the project relies on. (Example: "simplify the
     trigger description for crisper routing" actually **removes** the do-NOT-use clauses that do the
     routing — it conflicts with its own goal.)
   - `goal unknown` — cannot be judged; ask before proceeding.
3. **Act on the verdict:**
   - `serves the goal` → proceed to the spec sheet.
   - `conflicts with the goal` or `goal unknown` → **do NOT apply the change.** Report, for each such
     item: what was proposed, the declared goal, *why* it conflicts, and the potential
     **value / caveats** of doing it anyway. Then **WAIT for the user's explicit approval.** Never
     substitute a nearest-plausible "fallback" edit just to have done something.

This gate applies to the updating agent's **own** suggestions too — if the agent proposes a change
during the update, it must pass the same check before being applied.

### Step 3: Fill Out the Spec Sheet

Using the template in `references/spec-sheet-template.md`, fill out all 10 sections. Present the completed spec sheet to the user for review and confirmation before proceeding to file edits.

The 10 sections of the spec sheet are:

1. **Skill Name** — the skill being updated
2. **Purpose of the Update** — why this change is needed (observed problem, drifted behavior, new capability, violated constraint) **and the declared goal** the change is meant to serve, each with its Step-2b alignment verdict (`serves the goal` / `conflicts with the goal` / `goal unknown`)
3. **Current Behavior Summary** — how the skill behaves now (strengths, weaknesses, failure modes, misinterpretation patterns)
4. **Desired Updated Behavior** — what the skill *should* do after the update (explicit rules, constraints, priorities, what to avoid)
5. **Input Format** — how the skill is prompted (required fields, optional fields, context structure, example inputs)
6. **Output Format** — the structure of the skill's response (sections, required reasoning, tone, detail level)
7. **Guardrails** — rules preventing drift (no reinterpretation, no scope reduction, no over-simplification, no loophole-inventing, no changing the conceptual core)
8. **Test Cases** — 3-5 prompts to verify the updated skill (normal, edge, stress, misinterpretation, over-engineering cases)
9. **Versioning** — version number, date, summary of changes, reason for changes
10. **Integration Notes** — how this skill interacts with other skills (dependencies, conflicts, overrides, shared context)

### Step 4: Review and Confirm

Present the completed spec sheet to the user and explicitly ask for confirmation. Do not proceed to file edits until the user approves.

If the user requests changes to the spec sheet, update it and re-present.

### Step 5: Apply the Update

Once the spec sheet is confirmed:

1. Re-read the target skill's current `SKILL.md` and relevant bundled files.
2. Map each item in the spec sheet to specific file changes:
   - Section 4 (Desired Behavior) → SKILL.md body edits
   - Section 5 (Input Format) → SKILL.md workflow/input sections
   - Section 6 (Output Format) → SKILL.md output format sections
   - Section 7 (Guardrails) → SKILL.md guardrail/constraint sections
   - Section 8 (Test Cases) → `references/test-cases.md` (optional)
   - Section 9 (Versioning) → append to `references/changelog.md`
   - Section 10 (Integration Notes) → SKILL.md integration section
3. Apply edits using the Edit tool. Make minimal, surgical changes — do not rewrite the entire skill unless the spec sheet explicitly calls for it.
4. If the target skill is a marketplace-installed skill, follow the `skill-creator` guidance for marking `userModified: true` in the skill's marketplace meta file.

### Step 6: Verify

After applying edits:

1. Read the updated `SKILL.md` to confirm changes were applied correctly.
2. Verify against the spec sheet: check the edit against Section 4 (desired behavior) and Section 7 (guardrails). **Prefer an executable check** (e.g. a fault case from Section 8) over a mental walkthrough; a mental walkthrough is only a fallback when no executable check exists — it produces no artifact and cannot fail on its own.
3. Report what was changed, file by file, to the user.

### Step 7: Record the change

Append an entry to `references/changelog.md` (create the file if it does not exist):

```
## <date>
**Summary:** <one-line summary>
**Reason:** <why the change was made>
**Changes:**
- <specific change 1>
- <specific change 2>
```

Increment the version number **only when the update changes user-facing behavior or the skill's contract** (e.g. trigger rules, guardrails, output format). For a trivial surgical edit that preserves behavior, a dated changelog line without a version bump is enough — a per-edit version bump is ceremony the changelog already covers. If the skill has no version yet, start at v1.1 (assuming v1.0 is the original creation).

## Guardrails for This Skill Itself

These guardrails govern how this skill operates when updating other skills:

- **No reinterpretation**: Evaluate the target skill as written. Do not substitute alternative designs or conceptual cores.
- **No scope reduction**: Do not simplify or narrow the skill's scope unless the user explicitly requests simplification.
- **No over-simplification**: Respect intentional complexity. If the user designed something complex on purpose, preserve it.
- **No loophole-inventing**: Identify *real* risks and drift, not hypothetical reinterpretations of the skill's instructions.
- **No guessed fallback**: When a proposed change `conflicts with the goal` or is under-specified (`goal unknown`), do **not** apply a nearest-plausible substitute just to have made an edit. Report it and wait.
- **Return information on conflict, don't act**: The default outcome of a conflicted or ambiguous change is a report (proposal + declared goal + why it conflicts + value/caveats), not an edit. Editing requires explicit user approval.
- **No conceptual core changes**: Never change the fundamental purpose or identity of the target skill unless the user explicitly asks for a redefinition.
- **Minimal edits**: Apply the smallest set of changes that satisfy the spec sheet. Do not refactor unrelated sections.
- **Preserve structure**: Maintain the target skill's existing section organization unless the spec sheet calls for structural changes.
- **Confirm before acting**: Always present the completed spec sheet and get user confirmation before editing files.

## Integration with Other Skills

| Skill | Relationship |
|-------|-------------|
| `skill-authoring` | The **default** full-lifecycle skill (create / revise / audit / package). Use it unless the update is large enough to justify this skill's 10-section spec sheet. This skill is the heavyweight, write-it-down option for a risky or contested update. |
| `skill-creator` | Use `skill-creator` for creating brand-new skills (mechanical scaffolding + packaging). Use this skill for updating existing ones. When applying updates (Step 5), follow `skill-creator`'s editing guidance for marketplace skills. |
| `skills-security-check` | If the update adds scripts or executable content, run a security audit after applying changes. |

## References

- `references/spec-sheet-template.md` — The blank spec sheet template with all 10 sections and guidance for filling each out. Load this when filling out the spec sheet in Step 3.
