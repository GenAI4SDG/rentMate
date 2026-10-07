#!/usr/bin/env python3
"""memory_audit.py — scan memory files for truncation signals and open-loop candidates.

Usage:
    python memory_audit.py <path> [<path> ...]
    python memory_audit.py --help

Each <path> may be a file or a directory (scanned recursively for .md/.txt/.markdown).
Prints a markdown report with file:line references. The script only *surfaces*
candidates; it never decides whether an item was resolved — that judgment stays with
the agent and the user.

Two classes of signal:
  TRUNCATION SIGNALS   — content that was cut off, dangling, or marker-indicated.
  OPEN-LOOP CANDIDATES — a decision/intent word with no follow-through evidence
                         (the agent must judge resolution separately).
"""
import sys
import re
from pathlib import Path

TRUNCATION_PATTERNS = [
    (re.compile(r"truncated", re.IGNORECASE), "literal 'truncated' marker"),
    (re.compile(r"\(\s*\.\.\.\s*truncated\s*\)", re.IGNORECASE), "'(... truncated)' marker"),
    (re.compile(r"user memory truncated", re.IGNORECASE), "'user memory truncated' marker"),
    (re.compile(r"\bTBC\b", re.IGNORECASE), "TBC marker"),
    (re.compile(r"to be continued", re.IGNORECASE), "'to be continued' marker"),
    (re.compile(r"cut off", re.IGNORECASE), "'cut off' marker"),
    (re.compile(r"\[\s*\.\.\.\s*\]"), "'[...]' placeholder"),
]

INTENT_PATTERNS = [
    (re.compile(r"\bTODO\b"), "TODO"),
    (re.compile(r"\bTBD\b"), "TBD"),
    (re.compile(r"\bFIXME\b"), "FIXME"),
    (re.compile(r"\bpending\b", re.IGNORECASE), "pending"),
    (re.compile(r"\bunresolved\b", re.IGNORECASE), "unresolved"),
    (re.compile(r"\bopen question", re.IGNORECASE), "open question"),
    (re.compile(r"\bblocked\b", re.IGNORECASE), "blocked"),
    (re.compile(r"\bfor review\b", re.IGNORECASE), "for review"),
    (re.compile(r"\bdefer(?:red)?\b", re.IGNORECASE), "deferred"),
    (re.compile(r"\bnext (?:session|time)\b", re.IGNORECASE), "next session/time"),
    (re.compile(r"\bwill (?:do|handle|fix|implement)\b", re.IGNORECASE), "will (do/handle/...)"),
    (re.compile(r"\bplan to\b", re.IGNORECASE), "plan to"),
    (re.compile(r"\bshould (?:be|do|be done|be fixed)\b", re.IGNORECASE), "should ..."),
    (re.compile(r"\bto be done\b", re.IGNORECASE), "to be done"),
    (re.compile(r"\bdecided\b", re.IGNORECASE), "decided"),
    (re.compile(r"\bthe user wants\b", re.IGNORECASE), "the user wants"),
]

OVERSIZE_LINES = 250
TEXT_EXTS = {".md", ".markdown", ".txt", ".text"}


def iter_files(paths):
    for p in paths:
        p = Path(p)
        if p.is_dir():
            for f in sorted(p.rglob("*")):
                if f.is_file() and f.suffix.lower() in TEXT_EXTS:
                    yield f
        elif p.is_file():
            yield p


def _next_meaningful_line(lines, start_idx):
    for j in range(start_idx, min(start_idx + 3, len(lines))):
        if lines[j].strip():
            return lines[j].strip()
    return None


def scan_file(path):
    """Return (n_lines, trunc_hits, intent_hits) or (None, error_str)."""
    try:
        text = path.read_text(encoding="utf-8", errors="replace")
    except Exception as e:  # noqa: BLE001
        return (None, f"could not read: {e}")
    lines = text.splitlines()
    n = len(lines)
    trunc_hits = []
    intent_hits = []
    for i, line in enumerate(lines, start=1):
        stripped = line.strip()
        for pat, label in TRUNCATION_PATTERNS:
            if pat.search(line):
                trunc_hits.append((i, label, stripped))
        for pat, label in INTENT_PATTERNS:
            if pat.search(line):
                intent_hits.append((i, label, stripped))
        # Dangling list-intro: a non-heading line ending with ':'/'—' whose next
        # meaningful line is a heading or EOF.
        if stripped and not stripped.startswith("#") and (stripped.endswith(":") or stripped.endswith("—")):
            nxt = _next_meaningful_line(lines, i)
            if nxt is None or nxt.startswith("#"):
                trunc_hits.append((i, "possible dangling list-intro (no following items)", stripped))
    return (n, trunc_hits, intent_hits)


def main(argv):
    if not argv or argv[0] in ("-h", "--help"):
        print(__doc__)
        return 0
    files = list(iter_files(argv))
    if not files:
        print("No files found for the given paths.")
        return 0

    total_trunc = total_intent = 0
    oversized = []
    print("# Memory Audit Report\n")
    for f in files:
        res = scan_file(f)
        if res[0] is None:
            print(f"## {f}\n- ERROR: {res[1]}\n")
            continue
        n, trunc_hits, intent_hits = res
        if n > OVERSIZE_LINES:
            oversized.append((f, n))
        if not trunc_hits and not intent_hits:
            continue
        print(f"## {f}  ({n} lines)\n")
        if trunc_hits:
            print("### TRUNCATION SIGNALS")
            for ln, label, text in trunc_hits:
                print(f"- L{ln} [{label}]: {text[:160]}")
            print()
            total_trunc += len(trunc_hits)
        if intent_hits:
            print("### OPEN-LOOP CANDIDATES")
            for ln, label, text in intent_hits:
                print(f"- L{ln} [{label}]: {text[:160]}")
            print()
            total_intent += len(intent_hits)

    if oversized:
        print("## Oversized / at-risk files (>250 lines — host may truncate injected summary)")
        for f, n in oversized:
            print(f"- {f}  ({n} lines)")
        print()

    print(
        "## Summary\n"
        f"- Files scanned: {len(files)}\n"
        f"- Truncation signals: {total_trunc}\n"
        f"- Open-loop candidates: {total_intent}"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
