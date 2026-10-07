#!/usr/bin/env python3
"""extract_structure.py - snapshot and diff the heading structure of a document.

Usage:
  python extract_structure.py DOC [--out SNAPSHOT]   Write/refresh the snapshot, report empty sections.
  python extract_structure.py DOC --diff SNAPSHOT    Compare current headings against a snapshot.

Exit codes: 0 = ok / structure matches (diff mode)
            1 = differences found (diff mode only)
            2 = error (unreadable file, no headings, missing snapshot)

Markdown files (.md/.markdown/.txt) are parsed directly. For other formats,
write the snapshot manually in the same format (see SKILL.md) and use --diff.
"""

import argparse
import re
import sys
from datetime import datetime
from pathlib import Path

HEADING_RE = re.compile(r"^(#{1,6})\s+(.*?)\s*#*\s*$")
FENCE_RE = re.compile(r"^\s*(```|~~~)")
SNAP_RE = re.compile(r"^\s*-\s*(?:\[[ xX]\]\s*)?H([1-6]):\s*(.+?)\s*$")


def parse_markdown(path):
    """Return (headings, direct) where headings is a list of dicts
    {level, title, line} and direct[i] is True when heading i has
    non-blank content of its own before the next heading."""
    lines = Path(path).read_text(encoding="utf-8-sig").splitlines()
    headings = []
    direct = []
    in_fence = False
    cur = -1
    for i, raw in enumerate(lines, 1):
        if FENCE_RE.match(raw):
            in_fence = not in_fence
            continue
        if in_fence:
            if cur >= 0 and raw.strip():
                direct[cur] = True
            continue
        m = HEADING_RE.match(raw)
        if m:
            headings.append({"level": len(m.group(1)), "title": m.group(2).strip(), "line": i})
            direct.append(False)
            cur += 1
        elif cur >= 0 and raw.strip():
            direct[cur] = True
    return headings, direct


def default_snapshot_path(doc_path):
    p = Path(doc_path)
    return p.with_name(p.stem + ".structure.md")


def write_snapshot(doc_path, snap_path, headings, direct):
    out = [
        f"# Structure snapshot: {Path(doc_path).name}",
        f"Source: {Path(doc_path).resolve()}",
        f"Saved: {datetime.now().isoformat(timespec='seconds')}",
        "",
    ]
    for h, filled in zip(headings, direct):
        indent = "  " * (h["level"] - 1)
        check = "x" if filled else " "
        out.append(f"{indent}- [{check}] H{h['level']}: {h['title']}")
    Path(snap_path).write_text("\n".join(out) + "\n", encoding="utf-8")


def parse_snapshot(path):
    items = []
    for line in Path(path).read_text(encoding="utf-8-sig").splitlines():
        m = SNAP_RE.match(line)
        if m:
            items.append((int(m.group(1)), m.group(2).strip()))
    return items


def report_extract(headings, direct):
    print("OUTLINE:")
    empty_leaves = []
    bare_parents = []
    for i, h in enumerate(headings):
        is_parent = i + 1 < len(headings) and headings[i + 1]["level"] > h["level"]
        status = "filled" if direct[i] else "EMPTY"
        print(f"  {'  ' * (h['level'] - 1)}H{h['level']} {h['title']} (line {h['line']}) [{status}]")
        if not direct[i]:
            (bare_parents if is_parent else empty_leaves).append(h)
    print()
    if empty_leaves:
        print("EMPTY SECTIONS (must be filled):")
        for h in empty_leaves:
            print(f"  - H{h['level']}: {h['title']} (line {h['line']})")
    else:
        print("EMPTY SECTIONS: none")
    if bare_parents:
        print()
        print("NO DIRECT CONTENT (parent headings; add a 1-2 sentence lead-in or leave intentionally):")
        for h in bare_parents:
            print(f"  - H{h['level']}: {h['title']} (line {h['line']})")


def run_diff(current, saved):
    def by_title(items):
        d = {}
        for lvl, t in items:
            d.setdefault(t, []).append(lvl)
        return d

    cur, sav = by_title(current), by_title(saved)
    added = sorted(set(cur) - set(sav))
    removed = sorted(set(sav) - set(cur))
    releveled = sorted(t for t in set(cur) & set(sav) if sorted(cur[t]) != sorted(sav[t]))

    if added:
        print("ADDED (in doc, not in snapshot):")
        for t in added:
            print(f"  + H{sorted(cur[t])[0]}: {t}")
    if removed:
        print("REMOVED (in snapshot, not in doc):")
        for t in removed:
            print(f"  - H{sorted(sav[t])[0]}: {t}")
    if releveled:
        print("LEVEL CHANGED:")
        for t in releveled:
            print(f"  ~ {t}: H{sorted(sav[t])[0]} -> H{sorted(cur[t])[0]}")
    if not (added or removed or releveled):
        print("Structure matches snapshot. No differences.")
        return 0
    print(f"\nSUMMARY: {len(added)} added, {len(removed)} removed, {len(releveled)} level-changed")
    return 1


def main():
    ap = argparse.ArgumentParser(description="Snapshot and diff document heading structure.")
    ap.add_argument("doc", help="Path to the document (Markdown).")
    ap.add_argument("--out", help="Snapshot output path (default: <docname>.structure.md next to DOC).")
    ap.add_argument("--diff", metavar="SNAPSHOT", help="Compare DOC headings against SNAPSHOT instead of writing one.")
    args = ap.parse_args()

    try:
        headings, direct = parse_markdown(args.doc)
    except OSError as e:
        print(f"ERROR: cannot read {args.doc}: {e}", file=sys.stderr)
        return 2
    if not headings:
        print(f"ERROR: no ATX headings (# .. ######) found in {args.doc}", file=sys.stderr)
        return 2

    if args.diff:
        try:
            saved = parse_snapshot(args.diff)
        except OSError as e:
            print(f"ERROR: cannot read snapshot {args.diff}: {e}", file=sys.stderr)
            return 2
        current = [(h["level"], h["title"]) for h in headings]
        return run_diff(current, saved)

    snap_path = args.out or default_snapshot_path(args.doc)
    write_snapshot(args.doc, snap_path, headings, direct)
    print(f"SNAPSHOT WRITTEN: {snap_path}\n")
    report_extract(headings, direct)
    return 0


if __name__ == "__main__":
    sys.exit(main())
