#!/usr/bin/env python3
"""scaffold_test.py — generate a FAILING (red) pytest from a spec.

Test-first: the generated test FAILS until you implement `NAME`. That is the
point — you pin the contract first, then implement to green. The emitted
function stub raises NotImplementedError so pytest is red out of the box.

Usage:
  python scaffold_test.py --name compute_reward \
      --case "{'step': 1} => 0.5" \
      --bug-class rng --output tests/test_reward.py
  pytest tests/test_reward.py        # RED (NotImplementedError)
  # ... implement compute_reward ...
  pytest tests/test_reward.py        # GREEN

Case format:  INPUT => EXPECTED   (separator is " => ", repeatable with --case).
INPUT/EXPECTED are parsed as JSON, then ast.literal_eval, then kept as str.
"""
from __future__ import annotations

import argparse
import ast
import json
import os


def _coerce(s: str):
    s = s.strip()
    for fn in (json.loads, ast.literal_eval):
        try:
            return fn(s)
        except Exception:
            continue
    return s


def main() -> int:
    p = argparse.ArgumentParser(description=__doc__,
                                formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--name", required=True,
                   help="function/agent entry point to test")
    p.add_argument("--case", action="append", default=[],
                   help="a case 'INPUT => EXPECTED' (repeatable)")
    p.add_argument("--bug-class", default="none",
                   choices=["none", "rng", "seed", "leak", "shape", "determinism"],
                   help="add a bug-class conformance test")
    p.add_argument("--output", help="output path (default <name>_test.py)")
    a = p.parse_args()

    out = a.output or (a.name + "_test.py")
    cases = []
    for c in a.case:
        if "=>" not in c:
            raise SystemExit("case must be 'INPUT => EXPECTED': %r" % c)
        i, e = c.split("=>", 1)
        cases.append((_coerce(i), _coerce(e)))

    L: list[str] = []
    L.append("import pytest")
    if a.bug_class in ("rng", "seed", "determinism"):
        L.append("import random")
    L.append("")
    L.append("")
    L.append("# TODO(test-first): implement %s, then this test goes green." % a.name)
    L.append("def %s(*args, **kwargs):" % a.name)
    L.append('    raise NotImplementedError("test-first: implement %s first")' % a.name)
    L.append("")
    L.append("")

    if cases:
        for idx, (i, e) in enumerate(cases):
            L.append("def test_%s_case_%d():" % (a.name, idx))
            L.append("    assert %s(%r) == %r" % (a.name, i, e))
            L.append("")
    else:
        L.append("def test_%s_smoke():" % a.name)
        L.append("    # replace with a real contract; fails red until implemented")
        L.append("    assert %s(1) is not None" % a.name)
        L.append("")

    if a.bug_class == "rng":
        L.append("def test_%s_rng_persistence():" % a.name)
        L.append("    r1 = random.Random(0)")
        L.append("    r2 = random.Random(0)")
        L.append("    # contract: seeding reproduces output exactly")
        L.append("    out1 = %s(rng=r1)" % a.name)
        L.append("    out2 = %s(rng=r2)" % a.name)
        L.append("    assert out1 == out2  # same seed -> identical output")
        L.append("")
    elif a.bug_class == "seed":
        L.append("def test_%s_seeding_no_leak():" % a.name)
        L.append("    a1 = %s(seed=1)" % a.name)
        L.append("    b1 = %s(seed=2)" % a.name)
        L.append("    a2 = %s(seed=1)" % a.name)
        L.append("    assert a1 == a2  # re-running with same seed must reproduce")
        L.append("    assert a1 != b1  # different seeds must differ")
        L.append("")
    elif a.bug_class == "leak":
        L.append("def test_%s_no_train_eval_leak():" % a.name)
        L.append("    # contract: eval mode must not reach training-only state/globals")
        L.append("    out = %s(mode='eval')" % a.name)
        L.append("    assert out is not None")
        L.append("    # FILL: assert no training-only global is reachable, e.g.")
        L.append("    # assert not hasattr(%s_state, 'train_only_buffer')" % a.name)
        L.append("")
    elif a.bug_class == "shape":
        L.append("def test_%s_output_shape():" % a.name)
        L.append("    out = %s()" % a.name)
        L.append("    assert hasattr(out, 'shape'), 'output must expose .shape'")
        L.append("    assert tuple(out.shape) == (None,), 'FILL IN expected shape'")
        L.append("")
    elif a.bug_class == "determinism":
        L.append("def test_%s_deterministic():" % a.name)
        L.append("    o1 = %s()" % a.name)
        L.append("    o2 = %s()" % a.name)
        L.append("    assert o1 == o2  # same inputs + config -> same output")
        L.append("")

    os.makedirs(os.path.dirname(os.path.abspath(out)), exist_ok=True)
    with open(out, "w", encoding="utf-8") as f:
        f.write("\n".join(L) + "\n")
    print("wrote RED test scaffold -> %s" % out)
    print("next: implement %s, then run: pytest %s" % (a.name, out))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
