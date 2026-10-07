---
name: planning-graph-coding
description: "Decompose a task into a validated graph of role-based steps, expand one node at a time, implement surgically, verify against declared contracts, and enforce the Goal-Conformance Gate before any change. Strict skill (light-mode default): run on explicit request, or when starting a genuinely multi-step / ambiguous / high-cost build. For a single one-file tweak use mini-worker instead."
agent_created: true
---

# Planning-Graph Coding Workflow

This skill encodes the coding-agent methodology that the `planning_graph` toolkit
is built to drive. Use it to run *any* non-trivial coding task as a small,
validated plan instead of free-form edits.

## Light mode (default)

**Strict skill.** Run it only when the user names it, or when its full task starts: a
genuinely multi-step / ambiguous / high-cost coding task where traceability and
verification matter. A single one-file tweak is not a full task — use `mini-worker`.
Otherwise do not load, audit against, or quote it. The contract and every skill's
trigger live in one place — the `light-mode` skill. The Goal-Conformance Gate and the
human approval gate stay intact for any run that does go strict.

> **Scope — read before using.** This skill encodes the **legacy planning-step
> prototype** (LOD0–LOD2, the 17-field `Step`, `validate()`), which is the
> *appendix* of `planning_graph/PLANNING_SPEC.md`. It is **not** the newer
> IP/CP/PG/KG architecture described in the spec body, which is a design that
> has **not been implemented**. Two consequences:
>
> - `validate()` and `layer1_report().reviewable` are **wiring checks, not
>   correctness checks and not plan approval.** A plan that passes them is
>   *well-formed*, nothing more. Never describe a `validate()` pass as
>   "validated", "verified", or "approved".
> - Correctness is decided by **non-LLM** evidence (tests, type checks,
>   executable predicates) against a **human-approved** contract — never by the
>   agent's own reading of its work. Where this skill says "verify", it means a
>   mechanical check, not the model judging itself.

It borrows two hard disciplines:

- **One change, one file (from `mini-worker`).** Implementation is always
  file-local, surgical, and validated narrowly. No scope creep, no multi-file
  sprawl unless the plan explicitly calls for it. Keep inline pseudocode
  comments as the review trail.
- **Keep docs honest (from `doc-reconcile`).** Documentation is reconciled
  against the actual code, not regenerated. Default to *reporting* divergence
  (Doc | Line | Claim | Reality | Evidence) and only editing docs **in place,
  when the user asks** — never autonomously rewriting, never creating new doc
  files. `Memory.md` is separate: it is promoted to as you go.

## When to use

- The task has more than one step, or its requirements are ambiguous enough to
  need a plan.
- You want traceability: why X was chosen over Y, which edge cases were handled,
  what is safe to drop.
- Bug-fix / feature / refactor / "design first" requests where a wrong first
  move is expensive.

Do **not** use it for a single, unambiguous one-file tweak — that is just
`mini-worker` directly.

## The workflow (5 phases)

### Phase 0 — Frame the task
Capture the problem statement, the codebase context you actually need (not the
whole repo), and any ranked candidate approaches. When this is a known codebase,
locate candidates with a code-subgraph / local-subgraph view rather than grepping
the whole tree.

### Phase 1 — Plan as a graph (LOD0)
Lay out **one LOD0 node per required role**. A plan is reviewable only when all
of these roles are present (drop the optional one, but name it):

```
literature -> organization -> evaluation -> decision -> design
           -> implementation -> verification -> refactor  (+ optional release)
```

For a bug fix these map to: survey prior art -> locate candidates -> establish
contracts -> hypothesize -> decide -> plan fix -> edit -> verify -> split scope
creep.

Each LOD0 step must state, at minimum:
- `id` (stable, e.g. `S.locate`), `name`, `domain`, `lod: LOD0`
- `process` — imperative, >=3 words, specific
- `input_type` / `output_type` — from the closed IO vocabulary
  (none/text/json/file/artifact_ref/file_set/code/graph/embedding/score/bool/decision/void)
- `depends_on` — other step ids (must exist in the graph)
- `privacy` — `public <= team <= secret <= user_private_local`
- `guards` — at least one `edge_case` for implementation/verification steps
- `status` — start as `proposed`

Define the **interfaces first** (input/output types + depends_on); everything
downstream is validated against them.

### Phase 2 — Think the three axes (forced reasoning)
For every step, answer three things before implementing:

1. **Guardrails (Axis 1).** Enumerate edge cases: boundary, duplicate, missing,
   ordering, partial failure, ownership, aliasing, oracle. An
   `implementation`/`verification` step with zero `edge_case` is a warning, not a
   pass.
2. **Memory & compute (Axis 2).** State which tier holds what: `context-window`
   (must be in the prompt) vs `retrievable` (pulled on demand) vs `disk` vs
   `external`. A step that claims the whole repo belongs in `context-window`
   fails review.
3. **Reusable -> Memory.md (Axis 3).** If the step encodes a pattern worth
   reusing, mark `reusable=True` and `promotes_to="Memory.md#<anchor>"`. These
   become the consistency layer other tasks look up instead of re-deriving.

#### The Goal-Conformance Gate (run before executing *any* change)

Every change is made *for a reason*. A change that works against the goal that
motivated it — or against the project's established conventions/invariants — is a
bad change even when it looks plausible in isolation. So, before implementing:

1. **State the declared goal** — the concrete outcome the change is meant to
   achieve, not the change itself. If none is stated or derivable, label it
   `goal unknown` and ask; do not invent one.
2. **Check alignment** against that goal **and** against the codebase's actual
   conventions/invariants. Classify: `serves the goal` / `conflicts with the goal`
   / `goal unknown`. (A change that shortens a trigger description for "crisper
   routing" **removes** the clauses that do the routing — it conflicts with its own
   goal.)
3. **Act on the verdict.** `serves` -> proceed. `conflicts` or `unknown` -> **do
   not apply the change, and do not substitute a plausible fallback.** Report the
   proposal + the goal + *why* it conflicts + the value/caveats of doing it anyway,
   then **wait for approval.** This brackets the agent's own suggestions too.

### Phase 3 — Validate the plan
If the `planning_graph` toolkit is available in the repo, run it; otherwise do
the same checks by hand:

- No dangling dependencies (every `depends_on` points at a real step).
- No dependency cycle.
- Privacy lattice: a step never reads an artifact more restricted than its own
  clearance.
- IO handoff: a producer's `output_type` is assignable to every consumer's
  `input_type`.
- Every required LOD0 role is present -> the plan is "reviewable".

Toolkit commands (when present in `planning_graph/`):
```bash
python planning_graph.py validate <plan.json>   # hard/soft findings
python planning_graph.py report   <plan.json>   # layer-1 reviewability
python -c "import json,render; g=__import__('planning_graph').PlanningGraph.from_dict(json.load(open('<plan.json>'))); open('plan.md','w').write(render.render_markdown(g))"
```

> **STOP — the approval gate (mandatory, before Phase 4).**
> `validate()` and `report` prove the plan's *wiring* is consistent. They do
> **not** prove the plan is correct, complete, or the right thing to build.
> **Present the plan (the LOD0 graph + the rendered review packet) to the human
> and get explicit approval before writing any code.** Do not infer approval
> from a clean `validate()`, from your own confidence, or from silence. State
> plainly what the checks do *not* cover. If the human has not approved, stop —
> Phase 4 does not begin.
>
> There is no CP (machine-checkable contract) in this legacy workflow, so the
> human approval of the plan **is** the correctness boundary. Treat it as
> blocking, not advisory.

**If a CP exists, review it as a separate act from validating it.** A CP can
validate 0-hard and still be unapprovable, because every validator sees only one
half of the file:

1. Run the checks, then run the CP body/oracle consistency suite:
   `PYTHONPATH=. python artifacts/cp_body_consistency_faults.py` (needs
   `cp_tool.py` on the path; it covers "body cites an op the oracle never uses"
   and "body claims wording is unpinned while `eq` pins it").
2. **Read the oracle yourself and judge it.** If its expected values were
   transcribed from the implementation rather than derived from the contract, no
   tool can tell whether the CP states the intended behaviour — that judgement is
   the attestation. Say so out loud rather than approving silently.
3. Check `mutations` and `effects` against what the target really does. They are
   **never executed** — only `test_oracle` is — so a wrong one is invisible to
   every check. Never fill them with shape-valid filler to clear
   `CP_EFFECTS_ALL_EMPTY`; explain the emptiness in the body instead.
4. Ask what the oracle does *not* pin, and put that list in the CP body. An
   unpinned behaviour that is only in the code is a gap the CP is hiding.

Then, and only then, ask for the human attestation.

### Phase 4 — Execute one node at a time (mini-worker discipline)
Work the **frontier**: a step is "next" iff `status=proposed` and all
`depends_on` are `done`. For each:

1. **State the goal** — name the single step and, crucially, the single target
   file it edits. If it would touch more than one file or carry a second
   independent goal, stop and re-plan (split the node).
2. **Outline inline** — add concise pseudocode comments at the change site as
   implementation notes. Keep them in the finished source; they are the review
   trail.
3. **Implement surgically** in that one file. No unrelated refactors,
   abstractions, or new files.
4. **Fractal expand if needed** — if the node is too coarse, `expand(parent,
   decompose, codebase, budget)` into children whose `output_type` matches the
   parent artifact, whose `input_type` matches what the parent exposes, and whose
   `privacy` does not exceed the parent's. Then implement the children one at a
   time.
5. **Validate narrowly** — run the narrowest test/check for that step only.
   Report (don't fix) any unrelated failure you happen to see.
6. **Verify** the `proof_obligations` / `edge_case`s you declared. Mark the step
   `done` only when its contract holds.
   *Caveat, stated so it is not glossed over:* in this legacy workflow a step's
   `guards` are **prose**, not an executable contract. "The contract holds" must
   therefore mean a **mechanically run check** (a test, a type check, a command
   whose output you show) — not your own reading that the code looks right. If
   no mechanical check exists for the step, say so and mark it `done` **with
   that caveat attached**; do not upgrade "I believe it works" into "verified".

### Phase 5 — Document & promote (doc-reconcile discipline)
After a batch of steps (and at the end), make the living docs *honest* — do not
make them *fresh*:

- **Promote reusable knowledge to `Memory.md`.** Append a short, stable-anchor
  note for each `reusable=True` step (pattern, minimal patch template, scope-trim
  rule). Do it as you go, not in a separate pass. `Memory.md` is agent
  memory/tooling, so promoting to it does not need a separate ask.
- **Reconcile project docs; do not regenerate them (`doc-reconcile`).** After
  editing code, check that the doc claims you touched still match reality:
  - Run a reconciliation pass: for each file you changed, find the doc claims
    about it (architecture / PLAN / README / TESTING) and verify against the
    file, not against a summary.
  - **Report divergence only, by default.** Output a table —
    `| Doc | Line | Claim | Reality | Evidence |` — plus a separate list of claims
    you could not verify (never silently drop them). Do **not** prescribe the
    fix direction: a reconciliation pass can only prove the doc and code
    disagree, not which side is correct. Let the human decide.
  - **Only edit docs when the user explicitly asks.** When they do: edit **in
    place** in the existing doc (never create a new file), and update the
    `> **Verified against:**` anchor line with the new date/HEAD. Do not flag
    per-line comments as drift — only stale *summaries* and *behaviour claims*.
  - Never propose new doc files; amend an existing one (the doc set is
    conventionally capped).
- If a step was wrong, **re-plan by superseding, never deleting**:
  `mark_superseded(old, new, reason)`. The history stays in the graph; the
  changelog and the todo list are *views* computed from status, not second files.

## Re-planning hygiene
- `prune(keep)` drops everything not reachable from `keep` (backwards along
  depends_on/refines), marking dropped steps `abandoned`. "Discard what's not
  immediately relevant" = `prune([focus])`.
- A todo list is generated from the frontier; never hand-maintained.
- `superseded` nodes keep their reason and edge so the decision trail survives.

## Closed vocabularies (don't extend casually)
DOMAINS, IO_TYPES, PRIVACY, LOD, GUARD_KINDS / GUARD_ACTIONS, MEMORY_TIERS,
STEP_STATUS, EDGE_KINDS, PATHWAY_KINDS. If you truly need a new value, add it to
the vocabulary and to the validator in one move.
