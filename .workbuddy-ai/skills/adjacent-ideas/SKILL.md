---
name: adjacent-ideas
description: "CALLABLE-ONLY when invoked directly (do NOT auto-run, do NOT apply light-mode suppression) — but the agent MAY PROPOSE it when the subject has no todos/backlog, no user storyline/path, no usability, or is too early-stage/incomplete to use end-to-end; in those cases the missing work is ideas, not execution. Generates a shortlist of exploratory/adjacent ideas and common-sense quality-of-life features for the current project that are consistent with the project's stated intention but are NOT implemented and NOT mentioned in its docs. Every run must first write out the assumptions it is making about the project's goal, the evidence it used, the directives/constraints shaping the list, and what it explicitly excluded — then produce the idea list. Use when the user calls it ('adjacent ideas', 'explore adjacent', 'what else could this do', 'QoL ideas', 'what common-sense features are missing', 'ideas not in the docs', 'what am I not thinking of') or when the readiness signals above fire and the user agrees."
agent_created: true
---

# Adjacent Ideas — missing common-sense & exploratory additions

## When to call it (and when to leave it alone)

This skill is the *right* tool when the missing work is **ideas, not execution**. Concretely,
call it — or propose calling it — when the subject has:

- **no todos / backlog** — nothing is queued, so there is no next step to just go do;
- **no user storyline / path** — no one can describe "a person does X, then Y, and gets Z";
- **no usability** — nobody can use it end-to-end with a concrete intent; or
- **an incompleteness that blocks its own intended first use.**

Those are the signals that an idea pass is the *missing* step rather than a distraction from it.
If one or more fire, say so and run this skill (or ask permission, if the request was really
about something else).

**Do not load it when the work is execution in complete form** — it has a todo list, a defined
path, and someone who can run it and get value. Ideas there are scope creep, not help; stay out
of the way and do not audit against or quote this skill.

**If it is ambiguous**, name the signals you do and do not see, and ask. A one-line question is
cheaper than either failure: overshooting (proposing ideas nobody wanted) or undershooting
(silently fixing something without asking whether that was even the gap).

**Mentioned only in passing** (chat, a vision note, brainstorming) → answer that moment, and
owe nothing afterwards. A passing idea is not a backlog item.

## Invocation contract

- **Callable-only when invoked directly.** Never auto-run. Never load this skill because a
  project "might benefit". It runs when the user asks for it, by name or by one of the trigger
  phrases — **or** when the readiness signals in "When to call it" fire and the user has agreed
  to a proposal. Proposing is allowed; running without agreement is not.
- **Do not apply `light-mode` suppression to it** — it is already opt-in by nature; light
  mode would only add a second gate on something that already requires an explicit call.
- **Report-only.** This skill produces a *list in the chat*. It does NOT implement,
  edit files, write specs, or change the project. Recommendations carry no approval.

## Goal-Conformance Gate (applies to every idea — mandatory)

For each candidate idea, check it against the project's goal **and** its established
conventions/invariants, and classify:

- `serves the goal` → may appear in the list.
- `conflicts with the goal` → excluded, and named in "Excluded / rejected" with the reason.
- `goal unknown` → excluded from the main list; if the idea is high-value, surface it
  under "Needs a goal decision" rather than assuming the goal.

Never substitute a plausible-but-unstated goal. If the project's intention is ambiguous,
that ambiguity belongs in the output, not in a confident-sounding idea.

## Required preamble — write this BEFORE the list

Every run must first output these four blocks, in this order. They are the whole point:
they let the user audit the reasoning and correct the frame.

```
## Assumptions (about the project's goal)
- <what I am taking the project's intention to be; cite the doc/spec/line used>
- <scope I am assuming is in the project>
- <audience / user / consumer I am assuming>
- <any goal I had to infer rather than read>

## Evidence used & its provenance
- Read: <exact files/paths, or "chat context only" if no docs>
- Provenance of each source: <spec/declarative | README | design doc | code> 
- Gaps: <what I could NOT see — missing docs, unreadable files, no spec>

## Directives shaping this list
- Inclusion: <criteria — e.g. "consistent with stated goal", "small QoL", "no new deps">
- Exclusion: <criteria — e.g. "anything requiring a new backend", "out-of-scope items">
- Effort band: <what 'small' means here; what I deliberately did not propose>
- Novelty rule: <how I avoided restating existing/planned features>
- Safety/approval limits: <anything I will not propose without the user's gate>

## Excluded / rejected (and why)
- <idea> — <excluded: conflicts with goal X / already in docs at path Y / out of scope>
- <idea> — <goal unknown: needs a decision>
```

If there are no docs to read, say so plainly (`chat context only`) — do not pretend to
have evidence you lack.

## How to build the list

1. **Read the project's stated intention first.** Prefer the declarative doc (spec /
   problem statement / hypothesis) over README or code. If none exists, say so and
   work from chat context, marking everything as inferred.
2. **Build an inventory of what already exists** — features implemented (from code/docs)
   and features *mentioned/planned* in docs. Both are excluded from the proposal list;
   the second is the trap (a "new" idea that's already in the backlog is noise).
3. **Generate candidates from four lenses:**
   - **Adjacent** — things the same user would obviously want next, one step from the
     current core (the "you built X, so of course you also need Y" class).
   - **QoL / friction** — common-sense conveniences missing: defaults, ergonomics,
     error messages, config, undo, search, export, keyboard/shortcut, empty states,
     notifications, retry/resume, idempotency, migrations, backups, docs/onboarding.
   - **Robustness & hygiene** — things that *should* be common sense but often aren't:
     logging, validation at boundaries, failure recovery, cost/rate guards, secrets
     handling (never print secrets), permissioning, test seams, reproducibility.
   - **Foresight** — cheap decisions now that avoid expensive rework later (naming,
     interfaces, extension points, data-model shape), scoped to low-cost and reversible.
4. **Filter through the Goal-Conformance Gate** and the stated directives. Drop anything
   out-of-scope, conflicting, or goal-unknown (route the last to "needs a decision").
5. **Rank and size.** Each surviving idea gets: a one-line description, the **why**
   (which lens + which goal it serves), and a rough **effort/risk** band. Keep only
   ideas that are genuinely low-friction to state; this is a shortlist, not a roadmap.

## Output shape

```
### Ideas (ranked)

1. **<short name>** — <one line what>
   - Why: <lens> · serves goal: <which stated goal>
   - Effort/risk: <small | medium | large> · <reversible? new dependency?>
2. ...

### Needs a goal decision
- <idea> — blocked because <goal ambiguity>; decide <question> first.

### Deliberately not proposed
- <category> — <reason, e.g. "out of the stated scope", "belongs to a later phase">
```

Cap the main list at roughly 8–12 items. A long list dilutes the signal; if more exist,
say how many were cut and why.

## Hard rules

1. **Never implement.** No edits, no file writes, no "shall I build it?" followed by
   building. The deliverable is the list plus its reasoning.
2. **Never restate existing or already-documented features** as new ideas. Check the
   docs and the code before proposing; state where you checked.
3. **Always emit the four preamble blocks.** A list without its assumptions/directives
   is a failure of this skill, not a shortcut.
4. **Honor the Goal-Conformance Gate.** Conflicting or goal-unknown ideas go in the
   excluded/decision sections, never in the main list.
5. **No invented facts about the project.** Cite paths; if you inferred, label it as
   inferred.
6. **Respect safety & credentials rules.** Never propose or demonstrate anything that
   would surface a secret, and flag any idea that needs an approval gate as such.
7. **Honor the "when to call it" signals.** Firing on a mature project with a live path
   is a misfire, not thoroughness. If the signals say no, say so and stop — do not
   produce a list anyway to justify having loaded the skill.

## Changelog

- **2026-10-07** — Added the "When to call it (and when to leave it alone)" section and
  hard rule 7. The skill previously read as *strictly callable-only, never propose it*;
  the signals now say when it is the *right* recommendation — an early-stage or
  incomplete idea, a project with no todos, no user storyline/path, or no usability —
  and when it must stay out of the way (complete execution work with a live path).
  Ambiguous cases ask rather than guess. The callable-only contract itself is unchanged.

