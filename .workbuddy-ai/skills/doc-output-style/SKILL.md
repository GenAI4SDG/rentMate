---
name: doc-output-style
description: "Reading-and-writing style for the documents WorkBuddy PRODUCES for the user (reports, specs, READMEs, briefs, analysis, SOPs, handoffs) — not for chat replies and not for skill docs. Governs: substance over narration, dated one-line facts instead of 'X was originally Y, so Z' history, no unmaintainable stories, and dropping off-topic detail to memory rather than into the document. Use when writing or editing a document deliverable, when the user asks for a doc to be clearer/less verbose, or says 'make this readable', 'cut the narration', 'this doc is unmaintainable', 'too much backstory'. Distinct from `tight-mode` (chat replies) and from skill-doc conventions."
agent_created: true
---

# Doc Output Style — how to write the documents you hand over

## Scope (read first — this is the one that gets confused)

| Governs | Not this skill |
|---|---|
| Documents **produced for the user**: reports, specs, READMEs, briefs, analyses, SOPs, handoffs, research write-ups | **Chat replies** → `tight-mode` |
| | **Skill docs** (`SKILL.md` and friends) → their own convention |
| | **Memory / logs** → the memory rules |

If the artifact is a *deliverable file the user will read and maintain*, this skill
applies. If it is a conversational answer, it does not.

## The two problems this skill kills

1. **Narration instead of content.** The doc tells the story of how it came to be
   ("this section originally said X, then Y changed, therefore Z") instead of just
   stating Z.
2. **Unmaintainable history.** The reader must reconstruct the current truth from a
   chain of superseded statements — and the next editor cannot tell which sentence
   still binds.

Both make a document *longer while making it less true*, because a superseded claim
left in place reads as a live claim.

## Rule 1 — State the fact, not the road to it

- ❌ `The timeout was originally 30s, but we found tests flaked, so it was raised.
  Later it was lowered again to 10s after re-benchmarking.`
- ✅ `Timeout: 10s (raised during flake investigation; lowered after re-benchmark).`
- ✅ Or, if the history is genuinely needed: a **dated one-line log entry**, below.

The current value is the deliverable. The history is context — and context has a
budget.

## Rule 2 — Dated one-line facts over prose archaeology

When a change matters enough to record in the document, record it as a line, not a
paragraph:

```
2026-10-06: assertion in §3 was wrong ("~8,400 files") → corrected to 9,063; checker added
2026-09-25: deleted route was deliberate, not a defect → §3 rewritten as "absent = divergence"
```

Pattern: `DDMMYYYY: <wrong/old assertion or event> [<tag>] → <correction/decision>`.
Only keep the entry if it changes what a reader would do — a change nobody needs to
act on belongs in the project's changelog, not the doc body.

## Rule 3 — Relevance decides what stays in the doc

Ask of every paragraph: **does a reader of the CURRENT document need this?**

- **Yes** → keep, in the shortest form that is still unambiguous.
- **No, but useful for troubleshooting or editing** → move to a log/notes file that
  travels with the artifact, not into the body.
- **No, and only of historical interest** → **memory**, not the document. Docs carry
  durable project truth; obsolete or off-topic detail goes to memory or a changelog.
- **Superseded by a later statement in the same doc** → **delete it.** Two statements
  where one is dead is the failure mode this skill exists to prevent.

## Rule 4 — Readability is the goal; brevity is a side effect

- Never drop a fact, warning, caveat, or safety note to shorten a doc.
- Cut *narration, hedging, restatement, and dead history* — not substance.
- Prefer structure a reader can scan: headings, tables, bullets for enumerations.
- If a doc got shorter and lost nothing actionable, it got better. If it got shorter
  and a reader can no longer act safely, it got worse.

## Rule 5 — Say what is true now, once

- One live statement per fact. No "previously…" unless the change is itself the point.
- Numbers, paths, and names must match reality at write time.
- Where a claim is a current quantity, tie it to its source rather than freezing a
  number in prose.

## Relationship to the other style skills

| Skill | Governs | Trigger |
|---|---|---|
| `doc-output-style` (this) | documents produced **for** the user | writing/editing a deliverable doc |
| `tight-mode` | **chat replies** | every reply; "tight mode" for max |
| skill-doc convention (user's) | `SKILL.md` files | editing a skill |

They are independent and can all apply in one turn: a tight chat reply *announcing* a
cleanly written document is the normal combination.
