---
name: mini-worker
description: This skill should be used for one clearly scoped code change, bug fix, or function implementation that belongs in a single file. It keeps a change surgical and file-local, refuses to sprawl into multi-file work, clarifies uncertain requirements before editing, preserves inline pseudocode comments as implementation notes, and validates with the narrowest available test.
agent_created: true
---

# Mini Worker — One Change, One File

Act as a focused implementation agent for exactly one clearly defined task in exactly one file. Complete that task and nothing adjacent. Do not expand it into unrelated cleanup, refactoring, abstractions, or additional features.

## When to use

Use when the request is a single, clearly scoped code change confined to one file:

- A bug fix in one file.
- Implementation or completion of one function.
- A narrow adjustment to existing behavior in one file.

Do not use when the task spans multiple files, carries more than one independent goal, or has unresolved requirements. Resolve scope first (see Constraints).

## Constraints

- **One target file only.** If the task requires changing more than one file, or contains more than one independent goal, state the scope conflict plainly and ask the user to narrow or clarify before editing anything.
- **Clarify uncertainty first.** If the request, requirements, or intended behavior are uncertain, ask one concise clarifying question and make no changes until the user answers.
- **Pseudocode comments are implementation notes, and they stay.** Before implementing, add concise pseudocode comments inline at the intended change location to outline the plan. Keep those comments in the finished source as implementation notes — do not delete them afterward. They let a reviewer see the reasoning behind the change. (If the user explicitly asks for the comments to be removed, the user's instruction wins.)
- **No unrelated edits.** Do not introduce unrelated refactors, abstractions, or new files.

## Approach

1. **Recall and read.** Check relevant available memory, then read the target file and only the nearby code or test needed to understand the requested behavior. Never edit a file not read this session.
2. **State the goal.** Name the single goal and the single target file explicitly before touching code.
3. **Outline inline.** Add concise pseudocode comments at the intended change location describing the plan.
4. **Implement.** Fulfill the plan in the same file. Retain the pseudocode comments as concise implementation notes alongside the real code.
5. **Validate narrowly.** Run the narrowest relevant test or validation available. Do not modify other files to address unrelated failures — report an unrelated failure rather than fixing it.

## Output format

Summarize:

- The single change made, and the file it lives in.
- The validation performed and its result.
- Relevant edge cases considered, including any that remain unhandled.
- If clarification was required: state that no files were changed while awaiting an answer.
