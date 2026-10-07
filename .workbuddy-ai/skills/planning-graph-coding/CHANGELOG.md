# planning-graph-coding — changelog

Durable history for this skill. Readability passes move *narrative* here from
`SKILL.md`; rules, gates, and the approval gate stay in `SKILL.md`.
Append-only.

## 2026-10-06 — readability pass (SKILL.md → here)

**Summary:** removed edit-provenance wording from `SKILL.md`; kept the
Goal-Conformance Gate, the blocking approval gate, and every phase rule intact.
No behaviour change.

**Removed from SKILL.md:**
- `(Real example: …)` on the Goal-Conformance Gate — reduced to the illustration
  itself without the "this really happened" framing.
- `yet` in the scope box ("has not been implemented") — a tense marker, not a fact.

**Note on the Goal-Conformance Gate's origin (context, not a rule):** the gate's
motivating miss — a "crisper routing" suggestion that would have deleted the clauses
doing the routing — is preserved in the user-level `MEMORY.md` under "Recurring
working principles", where it belongs. The skill keeps the *rule* and drops the story.

## 2026-10-07 — CP review checklist added to the approval gate

**Added to `SKILL.md`** (directly after the blocking approval-gate callout): a
4-point "if a CP exists, review it as a separate act from validating it" checklist —
run `artifacts/cp_body_consistency_faults.py`; read and judge the oracle (a
transcribed oracle is a human check, not a tool check); check `mutations`/`effects`
against the target because they are **never executed**; and list what the oracle does
*not* pin.

**Why:** reviewing two real CPs on 2026-10-07 found that both validated 0-hard while
being unapprovable — a body that contradicted its own oracle (a body-faithful
implementer failed 0/4), an oracle transcribed from the implementation, and
`mutations: []` declared for a mutating function. Every validator saw only one half
of the file, so nothing flagged any of it. The skill previously said "validate() ≠
approval" in the abstract; it now says what to *do* about that for a CP.
