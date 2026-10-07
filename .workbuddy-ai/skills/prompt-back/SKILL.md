---
name: prompt-back
description: "Ask one compact questionnaire before acting, when a request is underspecified. Leads by echoing back the MOST AMBITIOUS workable reading of the idea, goal, and target audience — labelled as an interpretation, so it can be confirmed or corrected in one word. Requires that a confirmation request carry the expected behaviour, the current implemented structure / convention, and the terminology + reference doc — because without those the user cannot have a meaningful discussion with you. Strict skill (light-mode default): run when the user explicitly asks ('ask me first', 'prompt me back', 'don't guess'), or when a non-trivial request is genuinely missing goal / context / constraint / format such that proceeding would invent requirements. For a trivial question or a complete brief, just execute."
agent_created: true
---

# Prompt-Back — ask for the high-signal prompt before acting

## Overview

Turn an underspecified request into a high-signal brief BEFORE producing anything. The core
discipline: guesses may be offered as labeled questions, but never acted on until the user
confirms. The user's intent is only known when the user has stated it.

Two things this skill does that a plain "what do you want?" does not:

1. **It leads with the most ambitious reading, played back.** Not the safest, narrowest
   interpretation — the strongest one the request could plausibly mean. If the user wants
   less, they say so in one word. If they wanted more and you quietly assumed less, the miss
   is invisible and the work is wasted.
2. **It comes with the ground the discussion will happen on.** A confirmation request is only
   answerable if the user can see what behaviour is expected, how the thing is currently
   built, and what the words mean. A bare "is this what you want?" pushes the burden back
   onto the user and cannot start a real discussion.

## Light mode (default)

**Strict skill.** Run it only when the user names it ("ask me first", "prompt me back",
"don't guess"), or when its full task arrives: a non-trivial request actually missing
goal / context / constraint / format, such that proceeding would invent requirements. A
trivial question or a complete brief is not a full task — just execute. Otherwise do not
load, audit against, or quote it. The contract and every skill's trigger live in one
place — the `light-mode` skill.

## When to use

Trigger when BOTH are true:
1. The request is non-trivial (a deliverable, a decision, multi-step work — not a lookup or chat).
2. At least one of the four parts is missing or ambiguous, and proceeding would mean inventing it.

Also trigger on explicit requests: "ask me first", "clarify before you start", "don't guess", "prompt me back".

Do NOT trigger when:
- The question is trivial, conversational, or a simple lookup.
- The user's message already carries the four parts (a complete brief) — just execute.
- The context is known from earlier in the conversation (continuing work).
- The user says "just go", "use your judgment", "your call" — proceed, stating assumptions.

## The four intake parts

| Part | Question to answer | Example of "missing" |
|------|--------------------|-----------------------|
| Goal | What outcome, in one line? | "help me with my resume" — do what to it? |
| Context | Who is it for? What background, files, materials? | which job, which resume |
| Constraints | Length, tone, must-haves, what to avoid? | one page? formal? |
| Format | Deliverable shape + an example if one exists | docx? bullet summary? match a template? |

**Context carries an extra obligation.** "Who is it for" is not only the *audience* — for
work on an existing artefact it is the artefact's own convention. See "Ground the
confirmation" below: behaviour, structure, and terminology are part of Context, and a
request that omits them is missing Context even if the audience is obvious.

## Lead with the most ambitious reading

Before writing the questionnaire, form the **most ambitious workable interpretation** of
what is being asked: the version that would deliver the most value if it succeeded, while
still being compatible with what is actually knowable from the conversation and the repo.

- **Ambitious, not invented.** The reading must be defensible from context. "Rebuild the
  whole project" is not an ambitious reading of "tidy this file" — it is a different request.
- **Ambitious, not padded.** Ambition means a stronger *goal* (a real capability, a merged
  doc, an actual measurement), not more wordcount or more scope bolted on.
- **State it first, and label it.** It is an interpretation, not a decision. The user must
  be able to say "yes" or "no, smaller" without re-explaining their request.

Playback format — one block, before the questionnaire:

```
My reading (most ambitious workable version — correct me if it's too strong):
- Idea:      <what I take the underlying idea to be>
- Goal:      <the strongest outcome I think you want>
- Audience:  <who consumes it / who it must convince / what artefact convention it must match>
```

Then the questionnaire follows, and every part that the playback already covered is offered
as a labeled guess rather than asked open-endedly.

## Ground the confirmation (required whenever the interpretation is played back)

**A confirmation request without the current ground is not answerable.** If you ask the user
to confirm an interpretation, you must also supply the three things that let them discuss it
with you. Without them the user is being asked to react to your wording about their own
system from memory — which is not a discussion.

Every confirmation request MUST carry:

| # | Item | What to state | Why it is required |
|---|------|---------------|--------------------|
| 1 | **Expected behaviour** | What should happen after the change — the observable outcome, including what should happen at the edges (falsification conditions, error paths). | Confirming a goal without its expected behaviour confirms nothing testable. |
| 2 | **Current implemented structure / convention** | How it works today: the real files/paths, the existing naming and layout, the established pattern the change must fit. Cite paths and line numbers, not a description of them. | A change proposed against a structure the user cannot see is a change they cannot evaluate. "It fits the convention" states the conclusion and hides the evidence. |
| 3 | **Terminology + reference doc** | The exact term(s) this request hinges on, as the project already defines them, and the doc that owns each definition (spec, STATUS, glossary, ADR). Flag any term you are using that the project has *not* defined. | Undefined or re-defined terms are how a discussion silently becomes two different discussions. The reference doc is what makes "the same word" checkable. |

Rules for this block:

- **Quote, don't paraphrase.** Behaviour and terminology come from the artefact or doc; if you
  are inferring them, label them as inferred and say from where.
- **Name the gaps.** Any of the three you could not establish is stated as a gap and becomes a
  question — never silently filled with a plausible default.
- **This block is the difference between asking and interrogating.** It is the cost of a good
  prompt-back, and it is not optional.

Playback block, so the whole thing reads as one message:

```
Ground for this request (so we're discussing the same thing):
- Expected behaviour: <observable outcome + edge behaviour>
- Current structure:  <paths:lines of what exists; the convention it follows>
- Terminology:        <term = project's definition, per <doc path>>
- Gaps:               <anything I could not establish — these become questions below>
```

## Workflow

### Step 1 — Triage (silent)

Check the request against the trigger rules. If any exemption applies, skip this skill entirely and just do the task. Never ask questions for their own sake.

### Step 2 — Ask (one compact message)

Post ONE message containing, in order: the **most ambitious reading** playback, the
**ground** block, and the questionnaire.

    My reading (most ambitious workable version — correct me if it's too strong):
    - Idea / Goal / Audience: <...>

    Ground for this request:
    - Expected behaviour / Current structure / Terminology + reference doc / Gaps: <...>

    Questions (answer any that apply):
    1. Goal: <labeled guess — reply "ok" to accept, or name the smaller target>
    2. Context: <what's missing: audience / background / files>
    3. Constraints: <what's missing: length / tone / must-haves / avoid-list>
    4. Format: <what's missing: deliverable shape; paste an example if you have one>

Rules for the questionnaire:
- Ask only what's missing — never re-ask what the user already stated.
- Where a sensible default exists, offer it as a LABELED guess ("My guess: X — reply 'ok' to accept") so the user can answer with one word. A labeled guess is a question, not a decision.
- Maximum ~5 questions total (the playback and ground blocks are not questions). If more seem needed, the request is really a project — hand off to `spec-capture` instead.
- The ONLY output allowed in this step is this message. No partial deliverable, no "draft while you answer".

### Step 3 — Wait (blocking)

Stop after posting. Do not produce the deliverable, do not start a plan built on assumptions, do not pre-answer on the user's behalf. The next move belongs to the user.

### Step 4 — Execute

Once the user answers:
- For large tasks: echo the completed brief back in one compact block (Goal / Context /
  Constraints / Format, plus which reading was confirmed), then execute in the same turn
  unless the user asked for a separate confirmation.
- For ordinary tasks: execute immediately, no echo needed.
- Ask a second round ONLY if the answers introduced a genuinely new ambiguity — never as a stalling tactic.

### If the interpretation was accepted but the work is a *new idea* — propose, then research

Discovering the right idea is a different job from executing a known one, and it has its own
gate. When the confirmed reading amounts to **deciding on a new idea** (a design choice, an
approach selection, a feature direction, a research direction) rather than performing known
work:

1. **Ask permission first.** Do not start the literature work off your own initiative. State
   the idea, what would be researched, and ask whether to proceed. An accepted interpretation
   is approval of the *frame*, not of an unbounded research task.
2. **On approval, plan it.** Produce a short plan — what question the review must answer, which
   sources/venues/prior art to sweep, the inclusion/exclusion boundary, and how the result will
   be judged. Keep it proportionate to the idea; this is not a grant proposal.
3. **Then do the literature review.** Prior art, what already exists, what was tried and failed,
   and where the idea is genuinely distinct — with citations, not impressions.
4. **Then write the hypothesis and the pre-testing requirements.** A falsifiable hypothesis, the
   predictions that distinguish it, the cheapest experiment that could falsify it, the baselines
   it must be compared against, and the pre-registered decision rule ("if X, then proceed; if
   not, stop"). Pre-testing requirements mean what must be true *before* the real test is worth
   running — data, environment validity, controls, measurement instrument, compute budget.
5. **Stop at the write-up.** Report the hypothesis and the pre-testing requirements for the
   user's decision. Do not launch the experiment — that is a separate approval.

Sequence, explicitly: **propose → permission → plan → literature review → hypothesis +
pre-testing requirements → report.** Skipping straight from a confirmed idea to implementation
is the failure this gate exists to catch. (For a full multi-step build, the plan half hands off
to `planning-graph-coding` — see Integration.)

### Escape hatch

If the user replies "just go" / "your call" / "surprise me": proceed immediately, and open the deliverable with a short "Assumptions I used" block listing each guessed part — including which ambitious reading you took. That block converts guesses into stated, correctable decisions.

## Hard rules

1. **Never proceed on an unconfirmed assumption.** Guesses live inside questions or in a stated-assumptions block — nowhere else.
2. **Lead with the most ambitious workable reading, labelled as an interpretation.** Under-reading is the failure this prevents; it is invisible and it wastes the work. Never present it as decided.
3. **Never ask for confirmation without the ground.** Expected behaviour + current implemented structure/convention + terminology & reference doc are mandatory in any confirmation request. A confirmation without them is not a discussion, it is a quiz. Gaps in the ground are reported as gaps, never filled silently.
4. **Ambitious must stay honest.** The reading must be defensible from what is actually known. Ambition is a stronger goal, not an invented one and not more volume.
5. **One message, not a drip-feed.** Playback + ground + questionnaire together.
6. **Respect stated context.** Re-asking something the user already told you is worse than guessing.
7. **Trivial requests are exempt.** Asking "what's your goal?" about a simple question is an abuse of this skill.
8. **The user can always skip.** "Just go" is a valid answer and must be honored instantly.
9. **A new idea stops at a written hypothesis.** Never go from a confirmed idea to implementation: propose, get permission, plan, review the literature, write the hypothesis + pre-testing requirements, then report and wait.

## Integration

- `spec-capture` — the project-scale version of this discipline. When the intake reveals a
  multi-session project (vision, scope, glossary), hand off: prompt-back collects the four
  parts, spec-capture deepens them into S0–S10. Everyday task requests stay here; "before we
  build" requests go there.
- `planning-graph-coding` — receives the confirmed brief. Its Phase 1 already includes a
  `literature` role; the new-idea gate above feeds it. Do not run both procedures at once: this
  skill settles *what* is being asked, that skill decides *how* to build it.
- `drift-check` — owns whether the terminology and reference doc you cited are still true. If
  the ground block depends on a doc claim you cannot verify this turn, cite the doc and say it
  is unverified rather than asserting it.
- `adjacent-ideas` — the natural next step when the user accepts an ambitious reading but wants
  options rather than a commitment to one. **Also propose it during triage** when the request's
  subject shows the readiness signals: no todos/backlog, no user storyline/path, no usability, or
  an incompleteness that blocks its intended first use. Those mean the missing work is *ideas*,
  not execution — see that skill's "When to call it" section. Propose, then let the user agree;
  never run it unprompted.

## Changelog

- **2026-10-07 (b)** — Integration note only: during triage, propose `adjacent-ideas` when the
  subject has no todos/backlog, no user storyline/path, no usability, or is too incomplete to use
  end-to-end. Propose, never auto-run.
- **2026-10-07** — Added the "most ambitious reading" playback, the mandatory "ground the
  confirmation" block (expected behaviour / current structure / terminology + reference doc),
  the new-idea gate (propose → permission → plan → literature review → hypothesis +
  pre-testing requirements → report), and the `Ground for this request` step-template.
  Earlier versions asked for the four parts only and led with no interpretation at all.
