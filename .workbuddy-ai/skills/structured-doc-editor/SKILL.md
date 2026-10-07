---
name: structured-doc-editor
description: This skill should be used when editing, filling in, expanding, or finalizing a structured document (report, spec, thesis, proposal, SOP, README) whose section outline must stay under explicit control. It first saves a snapshot of all headings/subtitles, then ensures every snapshotted section gets filled in, and requires a full explanation in chat before any sub-section is added, removed, renamed, or merged. Trigger on requests like "edit my structured doc", "fill in all the sections", "make sure every section is complete", "keep the structure intact while editing", or any document edit where the outline acts as a contract.
agent_created: true
---

# Structured Doc Editor

## Overview

Edit structured documents under outline control: snapshot every heading before touching content, fill each section until none are left empty, and explain every structural change (sub-sections added, removed, renamed, re-leveled, or merged) in chat as it happens. Content may evolve freely; the structure may never change silently.

## When to use

- Editing, completing, expanding, or polishing a document that has (or should have) a stable section structure.
- The user mentions saving/locking the outline, tracking sections, filling empty sections, or wanting explanations when sections change.

Do NOT use for free-form writing, documents created from scratch (no structure to protect yet), or pure format conversion.

## Core rules (never skip)

1. **Snapshot before editing.** Never modify content before the structure snapshot exists on disk and the outline has been shown in chat.
2. **The snapshot is the source of truth.** It lives next to the document as `<docname>.structure.md`. Re-baseline it only when the user explicitly asks.
3. **Every section must be filled.** A section counts as filled when it contains substantive content (paragraph, list, table — not just deeper sub-headings). Track status via the checkboxes in the snapshot.
4. **Explain every structural change in chat, BEFORE applying it.** Adding, removing, renaming, re-leveling, or merging any heading relative to the snapshot requires the explanation block defined in Step 3.
5. **Removals that discard content need explicit confirmation.** If removing a section would delete or orphan existing text, explain and WAIT for the user's confirmation. Prefer proposing a merge target over deletion.
6. **Keep the snapshot in sync.** After any accepted structural change, update the snapshot in the same session and re-run the diff to prove doc and snapshot match.

## Workflow

### Step 1 — Snapshot the structure

For Markdown docs, run (any Python 3.8+; prefer the managed runtime):

    python scripts/extract_structure.py <doc>

This writes `<docname>.structure.md` next to the document and prints the outline with per-section fill status: `EMPTY` sections (must be filled) and parent headings with no direct content.

For non-Markdown docs (.docx/.wps/.pdf), extract the headings via the appropriate office/PDF skill and write the snapshot manually in the exact format described under "Snapshot format". The rest of the workflow is identical.

Then post the outline in chat as a compact tree and flag which sections are currently empty.

### Step 2 — Fill every section

Work through the snapshot top to bottom:

- Fill empty sections from the user's materials, the surrounding document context, or research when the user asked for it.
- If a section cannot be filled from available information, ask the user for the missing input instead of inventing content. If the user wants a placeholder, insert a clearly marked one (e.g. `> TODO: ...`) and leave the checkbox unticked.
- Parent headings that only introduce subsections: prefer adding a 1-2 sentence lead-in; if the user wants them bare, leave the checkbox unticked and note it.
- After filling a section, tick its checkbox in the snapshot (`- [ ]` → `- [x]`).

Editing already-filled sections (rewriting, tightening, correcting, reformatting) is always allowed without explanation — only structural changes trigger Rule 4.

### Step 3 — Structural changes require explanation in chat

Whenever the edit would add, remove, rename, re-level, or merge a heading relative to the snapshot, post this block in chat BEFORE editing:

    **Structural change proposal**
    - Change: add | remove | rename | re-level | merge
    - Section: <heading> (under <parent>)
    - Reason: <why the document is better with this change>
    - Content impact: <what happens to existing text; for removals: merged into X / deleted>
    - Snapshot: will be updated after applying

- Additions, renames, and re-levels with no content loss: explain, then proceed (the user's standing instruction counts as approval unless they object in chat).
- Removals or merges that discard text: explain, then WAIT for explicit confirmation before editing.
- After applying: update the snapshot, then verify with:

      python scripts/extract_structure.py <doc> --diff <docname>.structure.md

  It must print "Structure matches snapshot." before the session ends.

### Step 4 — Final report

End every editing session with a compact report in chat:

- Sections filled this session (list), and any still empty with the reason
- Every structural change made, each with its one-line reason
- Confirmation that document and snapshot are in sync (diff clean)

## Snapshot format

Plain Markdown, one line per heading, checkbox = filled status, indentation mirrors heading depth:

    # Structure snapshot: report.md
    Source: C:\path\to\report.md
    Saved: 2026-10-03T16:50:00

    - [x] H1: Introduction
      - [ ] H2: Background
      - [x] H2: Objectives

`scripts/extract_structure.py --diff` parses exactly the `- [ ] H<n>: Title` lines — keep this format intact when editing the snapshot by hand.

## Script reference

`scripts/extract_structure.py` (stdlib-only Python):

- `python scripts/extract_structure.py DOC [--out SNAP]` — write/refresh the snapshot; print the outline, empty sections, and parent headings lacking direct content. Checkboxes in a refreshed snapshot reflect the current fill status, so refresh only when re-baselining (otherwise tick boxes by hand to preserve progress).
- `python scripts/extract_structure.py DOC --diff SNAP` — print ADDED / REMOVED / LEVEL-CHANGED headings between document and snapshot. Exit codes: 0 = match, 1 = differences found, 2 = error (unreadable file, no headings).
