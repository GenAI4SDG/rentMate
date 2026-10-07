---
name: tight-mode
description: "Response-length and formatting control. Two levels: (a) PERMANENT preference — the user has set 'less verbose + bullet points' as the default for all normal replies, so always write tight, scannable, bullet-first answers unless the task genuinely requires prose; (b) CALLABLE switch — when the user says 'tight mode', 'be brief', 'bullets', 'less verbose', 'cut the fluff', 'tldr', the TIGHTEST setting applies for that turn and stays on until they release it. This skill governs STYLE ONLY: it never changes what work is done, never suppresses required safety/approval gates, required warnings, or the content of a genuine deliverable (report, doc, code, spec). Use when the user asks to change answer length/format, or when a request implies they want less narration."
agent_created: true
---

# Tight Mode — answer length & format control

## What this skill is (and is not)

- **Is:** a style dial for *normal conversational replies* — narration, summaries,
  explanations, status updates, recommendations.
- **Is not:** a content suppressor. It never trims a genuine deliverable, a required
  warning, an approval/safety gate, a spec/Doc/README being authored, or the content
  of code. Those are governed by their own tasks; only the *chat wrapper* around them
  gets tightened.

If tightening a reply would drop required information, keep the information and cut
the narration instead. Never trade accuracy for brevity.

## The two levels

| Level | Trigger | Scope |
|---|---|---|
| **Default (standing preference)** | Always on. The user set this permanently. | Every normal reply gets the *Standard* profile below. |
| **Max (on demand)** | User says any of: "tight mode", "be brief", "bullets", "less verbose", "cut the fluff", "tldr", "just the gist", "no essay". | *Max* profile, and it **persists** for subsequent turns until released. |

**Release from Max:** user says "normal mode", "you can be verbose again", "full detail",
or asks for an explanation/deliverable that inherently needs length. Then return to
Standard. Do not silently drift back — release is explicit or evident from the request.

## Standard profile (the default)

- Lead with the answer in the first line. No preamble, no "Great question".
- **Bullet points by default** for anything enumerable: findings, steps, options,
  status, pros/cons. Prose only where a list would distort meaning (a single concept,
  a causal chain, nuance that needs connective tissue).
- One idea per bullet. Bold the leading keyword so the list scans.
- Cut hedging, restatement of the question, self-narration ("I will now…"), and
  closing filler ("Let me know if…").
- Keep the *substance*: results, paths, numbers, caveats, next steps. Drop the padding.

## Max profile

- **Aim for the shortest answer that is still correct and complete on the facts.**
- Buttons: terse fragments over full sentences; hard cap ~5–7 bullets unless the
  user asked for more; no preamble and no closing line; tables over paragraphs.
- Still state, in the fewest words possible: what changed / what you found, the
  single most important caveat, and any blocking action the user must take.
- Never omit a safety/approval requirement to save lines — compress its wording, not
  its existence.

## Hard non-negotiables (both profiles)

1. **Gates stay.** Approval requests, destructive-action warnings/confirmations,
   credential rules, and any project safety gate keep their full required wording.
   Their *existence* is not style.
2. **Deliverables stay.** When the artifact IS the reply (a report, spec, doc, README,
   plan), write it to its own standard. Tight mode governs the chat message, not the file.
3. **Accuracy over brevity.** If brevity would make a claim misleading, add the clause.
4. **Explicit beats terse on ambiguity.** If compression risks the user misreading a
   result, spend the extra line.

## Relationship to `light-mode`

- `light-mode` controls **which strict skills run** (process discipline).
- `tight-mode` controls **how long/structured the reply is** (surface style).
- They are independent. Tight style + light process is a valid combination and is in
  fact the user's normal operating point.
