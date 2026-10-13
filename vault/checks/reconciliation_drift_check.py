"""Re-verify the SETTLED findings in `vault/RECONCILIATION.md` — mechanically.

The reconciliation is itself a doc about the code, so it rots the same way every
other doc in this repo did. This script turns its settled rows into checks that
can FAIL: if the code moves, the row is stale and this exits non-zero.

It is a LIGHTWEIGHT drift check, not the full `drift-check` skill: no ledger, no
blessed baseline file, just the expected facts encoded here and re-read from disk.

    python vault/checks/reconciliation_drift_check.py
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent.parent

README = REPO / "README.md"
BACKEND_README = REPO / "backend" / "README.md"
MIGRATIONS = REPO / "backend" / "supabase" / "migrations"
FUNCTIONS = REPO / "backend" / "supabase" / "functions"
DEMO = REPO / "Figma" / "src" / "App.tsx"
APP_SRC = REPO / "src"
SUITE_INDEX = REPO / "docs" / "site-spec-suite" / "index.md"


def _read(p: Path) -> str:
    return p.read_text(encoding="utf-8", errors="replace") if p.is_file() else ""


def _migrations_text() -> str:
    return "\n".join(_read(p) for p in sorted(MIGRATIONS.glob("*.sql")))


CHECKS = []


def check(name: str, fn):
    CHECKS.append((name, fn))


# --- R1: README claims pgvector; the migrations create none -----------------
def r1():
    claims = "pgvector" in _read(README)
    has_ext = bool(re.search(r'create\s+extension[^;]*vector', _migrations_text(), re.I))
    if claims and not has_ext:
        return True, "README still claims pgvector; no vector extension exists"
    if claims and has_ext:
        return False, "pgvector NOW exists -> the R1 row is RESOLVED; update RECONCILIATION.md"
    return False, "README no longer claims pgvector -> the R1 row is stale"


# --- R2: nothing invokes the Edge Functions ---------------------------------
def r2():
    hits = 0
    for root in (APP_SRC, REPO / "Figma" / "src", REPO / "backend" / "src"):
        for p in root.rglob("*"):
            if p.is_file() and p.suffix in (".ts", ".tsx", ".js", ".jsx"):
                t = _read(p)
                hits += len(re.findall(r"analyze-agreement|rental-chatbot|functions\.invoke", t))
    if hits == 0:
        return True, "still 0 callers of the Edge Functions"
    return False, f"{hits} caller(s) now -> the R2 row is stale; update RECONCILIATION.md"


# --- R3: backend/README calls them stubs; they call OpenAI ------------------
def r3():
    body = "\n".join(_read(p) for p in sorted(FUNCTIONS.glob("*/index.ts")))
    calls_openai = "openai" in body.lower()
    says_stub = "stub" in _read(BACKEND_README).lower()
    if calls_openai and says_stub:
        return True, "backend/README still says 'stub'; the functions still call OpenAI"
    return False, "backend/README no longer says 'stub', or the functions no longer call OpenAI"


# --- R4: the suite says a 12-question path; the demo has 7 ------------------
def r4():
    n = len(re.findall(r'eyebrow:\s*"', _read(DEMO)))
    says_12 = "12-question" in _read(SUITE_INDEX) or "12 question" in _read(SUITE_INDEX).lower()
    if n == 7 and says_12:
        return True, "demo still has 7 questions; the suite still cites a 12-question path"
    return False, f"demo questions={n}, suite cites 12={says_12} -> the R4 row is stale"


# --- R5: the demo ships a 3D/AR tour and in-app chat ------------------------
def r5():
    demo = _read(DEMO)
    has_3d = 'tourMode' in demo and '"ar"' in demo
    has_chat = "chat-workspace" in demo
    if has_3d and has_chat:
        return True, "demo still ships the 3D/AR tour and the in-app chat"
    return False, "the demo's 3D tour and/or chat is gone -> the R5 row may be RESOLVED"


# --- R6: the frontend does not import Supabase ------------------------------
def r6():
    hits = 0
    for p in list(APP_SRC.rglob("*.ts*")) + list((REPO / "Figma" / "src").rglob("*.ts*")):
        hits += len(re.findall(r"supabase", _read(p), re.I))
    if hits == 0:
        return True, "frontend still imports Supabase 0 times"
    return False, f"{hits} Supabase reference(s) in the frontend -> the R6 row is stale"


for _n, _f in (("R1 pgvector", r1), ("R2 no Edge-Function callers", r2),
               ("R3 'stub' vs OpenAI", r3), ("R4 7 vs 12 questions", r4),
               ("R5 demo 3D tour + chat", r5), ("R6 frontend/Supabase", r6)):
    check(_n, _f)


def main() -> int:
    print(f"reconciliation drift check -- {REPO.name}\n")
    bad = 0
    for name, fn in CHECKS:
        try:
            ok, detail = fn()
        except Exception as exc:                       # a check that cannot run is a FAILURE
            ok, detail = False, f"check raised {type(exc).__name__}: {exc}"
        print(f"  [{'ok  ' if ok else 'DRIFT'}] {name}: {detail}")
        bad += 0 if ok else 1
    print(f"\n{len(CHECKS) - bad}/{len(CHECKS)} settled rows still hold.")
    if bad:
        print("Some RECONCILIATION.md rows are stale -- update them, or the finding "
              "was resolved and the row should be retired.")
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main())
