---
name: spec-capture
description: Author the initial spec / problem-statement doc at the start of a project or feature, before any planning or coding. Locks the user's vision in their own words so the model cannot reinterpret intent, freezes a glossary so concepts cannot drift, sets an explicit out-of-scope and a simplicity budget to control over-engineering, and bounds edge-case enumeration to real failures to stop loophole-hunting. The spec is the single source of truth; downstream skills (planning-graph-coding, mini-worker, doc-reconcile) build against the approved spec. Trigger when the user says "write a spec", "define the problem", "scope this", "before we build", or starts a new project/feature.
agent_created: true
---

# Spec-Capture — freeze intent before anything gets built

This skill runs *first*: it turns a vague idea into an approved spec doc whose entire
job is to make the four classic failures of AI-assisted design impossible.

| Failure this skill kills | How |
|---|---|
| Model reinterprets your intent | Vision is quoted **verbatim**; any restatement is labeled "my interpretation" and must be confirmed before it enters the spec |
| Concept drifts as terms shift meaning | A **frozen glossary** pins every domain term; later uses must match or the glossary is revised on purpose |
| Over-engineering creeps in | An explicit **out-of-scope** + a **simplicity budget**; the simplest design that meets the spec wins, added abstraction needs a stated reason |
| Loophole-hunting bloats the spec | Edge cases are **bounded** and each tied to a real, concrete failure — speculative ones go to a parking lot, not the spec |

**Core rule (from `doc-reconcile`): this skill REPORTS proposed spec edits; it never silently rewrites the spec.** The user approves the spec before any planning or coding starts, and approves every later revision. An unapproved spec blocks downstream work.

## When to use
- Start of a project or feature, before `planning-graph-coding` or `mini-worker`.
- User says "write a spec", "define the problem", "scope this", "before we build",
  "what are we actually building".
- Any moment intent looks fuzzy or terms are being used loosely.

Related: `prompt-back` is the lightweight, task-level version of this intake
discipline — it asks for Goal / Context / Constraints / Format and blocks until
the user answers. Use `prompt-back` for everyday underspecified requests;
escalate here when its intake reveals a multi-session project.

Do NOT use mid-implementation for a code-level contract — that is the CP layer in
`planning-graph-coding`. This skill owns the *human* spec above the plan.

## The spec doc skeleton (what this skill produces)
A single markdown file (`docs/SPEC.md` or equivalent), versioned:

- **S0 Vision** — the user's words, verbatim, attributed. The anchor everything else is checked against.
- **S1 Problem statement** — what is broken / missing / needed, in the user's terms.
- **S2 In scope** — numbered, crisp, each item observable.
- **S3 Out of scope** — explicit. This is the over-engineering fence.
- **S4 Glossary** — frozen definitions; one line each. A term used in S2/S5/S6 must be defined here.
- **S5 Success criteria** — observable and falsifiable ("clicking X shows Y"), never "good UX" or "clean".
- **S6 Edge cases** — bounded; each tied to a real failure the user has hit or a test can trigger. Speculative ones -> S10 parking lot.
- **S7 Simplicity budget** — the simplest design that meets S5 wins. List the abstractions you are *not* adding (no caching, no plugin system, no multi-tenant, ...) unless each is justified by an S5 criterion.
- **S8 Open questions** — the only place uncertainty is allowed to live; each has an owner and a blocker.
- **S9 Intent-change log** — versioned: who/when/why for every change to S0/S2/S3/S4.
- **S10 Parking lot** — speculative edge cases / future ideas explicitly *not* in this version.

## Workflow

### Phase A — Capture (interview lightly, quote verbatim, never improve)
1. Ask the smallest set of questions needed to write S0-S2. Prefer the user's exact phrasing.
   Structure the interview around the four high-signal parts (the `prompt-back`
   intake): **Goal** -> S0/S1, **Context** -> S1, **Constraints** -> S3/S7,
   **Format / success shape** -> S5. Ask ONE batched questionnaire, never a
   drip-feed, and never fill a missing part by guessing — an unconfirmed guess
   goes to S8 as a labeled interpretation (rule 3 below).
2. Write S0 Vision as a **direct quote** of the user's words, attributed. Do not paraphrase,
   do not "tighten", do not add a benefit the user did not state.
3. Anything you are tempted to restate gets written as `> INTERPRETATION (model): ...`
   in S8 Open questions, and does NOT enter the spec until the user confirms it.

### Phase B — Pin (freeze the meaning so it can't drift)
1. Build S4 Glossary: every noun in S1-S3 that could be ambiguous gets one line.
   Definitions are frozen at this version; using a term differently later is an S9 revision.
2. Write S5 Success criteria as falsifiable checks. If you can't write a test or a
   yes/no observation for a criterion, it is not a criterion — it is an open question.
3. Write S3 Out of scope deliberately. Name the abstractions you are refusing.

### Phase C — Pressure-test (controlled, not a rabbit hole)
1. Enumerate edge cases for S6, **bounded to real failures**: each must be a failure the
   user has actually seen, or one a concrete test could trigger. Cap the list (e.g. top N).
   Anything speculative -> S10 parking lot, with one line on why it is deferred.
2. Run the **simplest-design check**: for every proposed component/abstraction in S7, ask
   "which S5 criterion fails without it?" If none, strike it and move it to S7's
   "not adding" list. (Benchmark-first: don't add caching/concurrency/plugins without an
   S5 reason.)

### Phase D — Approve (human gate, blocking)
Present S0, S2, S3, S4, S5 to the user and get explicit approval. The spec is **not done**
until approved. No planning (`planning-graph-coding`) and no implementation (`mini-worker`)
proceeds against an unapproved spec.

### Phase E — Maintain (spec is the source of truth)
- The approved spec version is the single source of truth. If a later plan/doc/code
  disagrees with the spec, the spec wins *until the spec is revised on purpose*.
- Any change to S0/S2/S3/S4 is an S9 intent-change-log entry: who/when/why, and bumps
  the version. Never edit the spec silently — propose the diff, let the user approve
  (the `doc-reconcile` discipline, applied to the spec itself).
- Reconcile downstream artifacts to the spec: when code or docs drift, run
  `doc-reconcile` against the spec's frozen glossary and S5 success criteria, report
  divergence, let the human decide direction.

## Hard rules (these are what make the four failures impossible)
- **Verbatim rule.** S0 Vision is the user's exact words. Restatements live in S8 as
  labeled interpretations until confirmed. Violating this *is* the "reinterpret intent"
  failure.
- **Glossary-freeze rule.** A term's meaning is fixed at its version. Using it differently
  is an S9 revision, not a quiet edit. Violating this *is* conceptual drift.
- **Out-of-scope rule.** S3 is mandatory and named. Anything not in S2 and not in S8 is
  out of scope by default. Violating this *is* over-engineering.
- **Real-failure rule.** S6 edge cases are tied to concrete failures; the rest go to S10.
  Violating this *is* loophole-hunting.
- **Approval rule.** Unapproved spec -> no downstream work. Re-approve on every S9 revision.

## Handoff
Once the spec is approved, hand off to:
- `planning-graph-coding` — decompose S2 into the LOD0 plan / contracts.
- `mini-worker` — implement one node, one file, surgical.
- `doc-reconcile` — later, audit that docs/code still match the spec's frozen glossary
  and S5 success criteria.
