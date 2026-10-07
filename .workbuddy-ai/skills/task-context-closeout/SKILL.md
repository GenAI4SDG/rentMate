---
name: task-context-closeout
description: "Produce a compact continuity capsule after a fresh-perspective artifact/doc consistency pass. Strict skill (light-mode default): run on explicit request, or when a task/subtask is genuinely complete with a known downstream black-box consumer and permitted docs are current (the eligibility gate). For an incomplete or terminal task, just give the normal completion summary."
agent_created: true
---

# Task Context Closeout

## Purpose

Turn a genuinely complete, independently consumable task into a short, trustworthy handoff for the next task. Retain the completed work as a black box: carry forward its stable interface, binding decisions, evidence, limits, and pointers—not the full work log. Keep the default lightweight without weakening any project or user-required gates.

This skill does not replace source files, tests, accepted specs, project documentation, or the user's final-facing summary. Treat those artifacts as authoritative; treat a closeout capsule as an index and continuity aid.

## Light mode (default)

**Strict skill.** Run it only when the user names it, or when its full task completes:
the task/subtask is genuinely done, permitted docs are current, and a known downstream
task can consume the result through a black-box boundary (the eligibility gate). An
incomplete or terminal task is not a full task — just give the normal completion summary.
Otherwise do not load, audit against, or quote it. The contract and every skill's trigger
live in one place — the `light-mode` skill.

## Eligibility gate — all conditions must pass

Before compressing, check all of the following:

1. **Complete boundary:** The requested task or explicitly bounded subtask is finished. Required integration and verification for that boundary are done. Do not label partial, blocked, or merely attempted work complete.
2. **Black-box consumer:** Identify the next task and the concrete output/contract it can consume. The next task must be able to proceed using the named output and its documented interface, without relying on hidden implementation details, undocumented assumptions, or this session's work history. If no next task is known, provide the normal user-facing completion summary; do not manufacture a downstream capsule.
3. **Documentation first:** Make any relevant documentation updates that are authorized by the user and required by the task or the project's rules before closeout. If no document claims to track this task, record that documentation was not applicable and why. If a required update is unauthorized, blocked, or unfinished, do not mark the task closeout-ready; report the blocker and preserve the necessary detailed handoff instead.
4. **No weakened gates:** Preserve approval, safety, test, review, and project-specific requirements. A concise/light closeout changes the amount of narrative, not the standard of correctness or approval. Never infer approval from a passing mechanical check.
5. **Subtask completeness:** For a completed subtask, preserve every decision, interface, dependency, evidence item, caveat, and unresolved issue that the parent or next subtask needs. If that set cannot be stated compactly without losing a consequential detail, the subtask is not yet a black box; keep the richer handoff and defer compression.

If any condition fails, stop before producing a compressed capsule. State which condition failed, what must happen next, and what information must remain available. Do not disguise a blocker as a completed summary.

## Workflow

### 1. Freeze the completion boundary

State in one line what is complete and what is not included. For a subtask, name its parent task or dependency when known. Do not expand scope during closeout.

### 2. Finish permitted documentation work

Identify the existing docs that claim to describe the completed behavior, interface, workflow, or status. Update them only when the user authorized the update or an established project rule permits it. Reconcile each document only along the axes it claims to track: a design/spec may intentionally describe future behavior; a status doc should reflect status; a README may have mechanically checkable paths or commands. Do not run a broad prose audit as ceremony, regenerate docs, or create a new document just to satisfy this skill.

**Delegate, do not re-implement.** When a doc needs an actual reconcile or a mechanical claim check, invoke `doc-reconcile` or `drift-check` **by name** (each defines its own full task); do not re-run their procedure inline here. Before any such call, check the **session ledger** (doc → last check + result, per the efficiency notes): if the relevant doc was already reconciled or drift-checked this session, reference that result and do not pay for the pass twice.

If a document update cannot be made under the applicable authority, report the mismatch or blocker and defer closeout. Never silently choose whether code or documentation should win when they disagree.

### 3. Run a fresh-perspective consistency pass (scoped — do not re-verify)

This pass catches doc/artifact mismatches the task's own verification may have missed. It is **not** a replacement for, or a repeat of, the task's verification — reuse that evidence instead of redoing it:

1. Reconstruct the intended outcome from the accepted request/spec and current contract—not from memory of implementation.
2. Re-open only the **doc's literal claims** this task touched, and compare each against evidence **already produced during the task** (its mechanical checks, accepted-contract results, test/lint output). Do not re-run those checks; cite them.
3. If a claimed check was already run this session by `doc-reconcile` or `drift-check`, reference its result from the session ledger — do not repeat the pass.
4. Record only material agreement, divergence, and claims that could not be verified. Do not call a wiring check, self-review, or unchanged golden baseline proof of correctness.
5. Resolve permitted mismatches before closeout. If unresolved or outside authority, fail the eligibility gate and report it plainly.

This is a disciplined re-read of the doc's claims against existing evidence, not independent human review and not a second verification. Do not overstate its assurance, and never let it become the task's only check.

### 4. Build the minimal complete capsule

Include only information a downstream consumer needs to use the completed result safely. Use this template and omit irrelevant sections, while never omitting a material caveat:

```text
CLOSEOUT — <task/subtask id or short name>
Boundary: <what is complete; what is outside scope>
Black-box input/output: <next task consumes X via contract/interface Y>
Artifacts: <authoritative paths/links and role; point to sources rather than copying them>
Binding decisions: <only choices/invariants the next task must preserve, with rationale if needed>
Evidence: <checks run, outcome, and what they do/do not prove>
Docs: <updated paths and claims checked, or “not applicable” with reason>
Limits/open items: <known caveats, unresolved questions, or “none identified” only after checking>
Next task: <one sentence describing the handoff; no hidden dependency on prior chat>
```

Do not include the full chronology, speculative alternatives that were rejected without downstream relevance, verbose plan restatements, or details already available at a stable artifact pointer. Do retain a decision if dropping its reason could cause the next task to reverse it or violate a goal. Do not copy sensitive values into the capsule; point to the authorized source or omit them.

### 5. Keep persistence distinct

A closeout capsule is task continuity, not automatically durable memory. Promote only stable, reusable knowledge to the appropriate memory location under existing memory rules. Do not duplicate transient task status in long-term memory, and do not let this skill override append-only logs, memory limits, privacy rules, or project-specific persistence conventions.

## Output behavior

- For a black-box-ready task with a known next task, produce the compact capsule and the ordinary concise user-facing completion summary.
- For a complete terminal task with no known next task, provide the ordinary user-facing completion summary only; do not force a capsule.
- For incomplete, blocked, undocumented, or non-black-box work, do not compress. Give a blocker/open handoff containing enough detail to resume safely, clearly marked as not a closeout.
- Keep language factual. Separate verified results from assumptions, unverified claims, and remaining risks.

## Integration

- Work alongside task-specific skills such as `mini-worker`, `planning-graph-coding`, and `doc-reconcile`; do not override their scope, approval, verification, or documentation rules.
- Use `drift-check` when a confirmed document has an applicable mechanical baseline; a passing drift check means no change from baseline, not that the baseline or prose is correct.
- Reconcile a document on the axes it claims to track; do not run a broad closeout audit merely because a task ended.
- Prefer less narration and avoid unnecessary planning/docs, but preserve strict defaults and all explicit gates unless an approved opt-in mode says otherwise.
