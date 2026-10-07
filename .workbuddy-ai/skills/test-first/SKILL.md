---
name: test-first
description: Enforce test-first — write a failing/asserting conformance test BEFORE implementing logic, then implement only to make it pass. Use when implementing features, fixing bugs, or editing skills/agents, especially RL/game/agent logic where bugs hide (RNG-persistence, seeding-leak, train/eval-leak, shape). Complements after-the-fact fault suites; pairs with local-ablation-runner and drift-check.
agent_created: true
---

# Test-first

Write the **red** (failing test) before the **green** (implementation). For any
non-trivial change, the first artifact is a test or conformance assertion that
pins the desired behavior — or the specific bug class you are preventing.
Implementation follows only to make it pass, and the test stays as a regression
guard. Rationale (for this user): this catches RNG-persistence, seeding-leak,
train/eval-leak, and shape bugs *early*, instead of via after-the-fact fault
suites (which remain useful but are downstream of test-first).

## When to use

- New feature, bug fix, refactor.
- Editing a skill/agent (`SKILL.md`, scripts) — the "test" can be a conformance
  check (sample input → expected output, or a `drift-check` claim).
- RL / game / agent logic, where failures are silent (RNG, seeding, leaks, shapes).

## Workflow (Red → Green → Keep)

1. **Pin the contract.** State the expected behavior as an assertion. For bug
   fixes, encode the *bug class* you are preventing, not just the symptom.
2. **Scaffold the failing test.** Use `scripts/scaffold_test.py`, or hand-write.
   Run it — confirm it **FAILS** (red). If it passes, the test is tautological
   or wrong.
3. **Implement the minimum** to make it pass (green). No implementation before red.
4. **Keep the test.** It is now a regression guard — commit it with the code.

## Bug-class checklist (the traps this catches early)

- **RNG-persistence**: fixed seed → identical output; serialized state reproduces
  exactly.
- **Seeding-leak**: random state is not reset/over-shared between calls or across
  train/eval.
- **Train/eval-leak**: no training data reachable from eval; no global mutable
  state shared across episodes.
- **Shape bugs**: tensor/buffer dims are asserted, never assumed.
- **Determinism**: same inputs + same config → same outputs (run twice, diff).

## Quick scaffold

```bash
python scripts/scaffold_test.py --name compute_reward \
    --case "{'step': 1} => 0.5" \
    --bug-class rng --output tests/test_reward.py
pytest tests/test_reward.py     # must be RED first
# ... implement compute_reward ...
pytest tests/test_reward.py     # now GREEN
```

The scaffold emits a `NotImplementedError` stub for the target, so the test is
red until you implement it — that is the point.

## Anti-patterns

- **Test-last** (tests after code) — weaker; you rationalize passing output.
- **Tests that cannot fail** (no assertion, or assert the trivial).
- **Skipping the red confirmation.**

## Pairs with

- `local-ablation-runner` — one-factor experiments.
- `drift-check` — mechanical doc↔code conformance for skills.
