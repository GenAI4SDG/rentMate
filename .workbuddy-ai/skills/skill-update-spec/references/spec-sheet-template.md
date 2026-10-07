# Skill Update Specification Sheet Template

Copy this template and fill it out for any skill update. Present the completed sheet to the user for confirmation before applying any file edits.

---

## 1. Skill Name

**Skill:** <name of the skill being updated>
**Path:** <filesystem path to the skill directory>
**Scope:** <user-level or project-level>
**Current version:** <e.g., v1.0, or "unversioned">

---

## 2. Purpose of the Update

Why this update is needed. Address each applicable item:

- **Problem observed:** What specific problem was encountered when using the skill?
- **Behavior drifted:** What did the skill do that it should not have, or fail to do that it should have?
- **New capability desired:** What new behavior should the skill support?
- **Constraints violated:** What guardrails or rules did the skill break?

> Example: "The skill tends to reinterpret my intent when asked to find flaws. It warns about over-engineering even when complexity is intentional. It needs stronger conceptual alignment."

---

## 3. Current Behavior Summary

Describe how the skill behaves now. Be specific and honest:

- **Strengths:** What does the skill do well?
- **Weaknesses:** Where does it fall short?
- **Typical failure modes:** In what situations does it misinterpret intent or produce wrong results?
- **Misinterpretation patterns:** Does it over-simplify, invent loopholes, reduce scope, or change the conceptual core?

> Example: "It identifies loopholes but sometimes invents them. It warns about over-engineering even when complexity is intentional. It proposes alternative designs instead of evaluating the one given."

---

## 4. Desired Updated Behavior

What the skill *should* do after the update. Be explicit and unambiguous:

- **Explicit behavioral rules:** Clear, numbered rules the skill must follow.
- **Constraints:** Hard limits the skill must respect.
- **Priorities:** When rules conflict, which takes precedence?
- **What to avoid:** Explicitly list behaviors the skill must NOT exhibit.

> Example:
> - "Evaluate the design as written, not alternative designs."
> - "Identify real risks only, not hypothetical reinterpretations."
> - "Respect intentional complexity when justified by the user."

---

## 5. Input Format

Define exactly how the skill will be prompted after the update:

- **Required fields:** What must the user provide for the skill to function?
- **Optional fields:** What can the user provide for enhanced behavior?
- **Context structure:** How should context be organized when prompting?
- **Example inputs:** 1-2 concrete examples of how a user would invoke the updated skill.

> Example:
> - `concept_core:` (required) — the core idea or design to evaluate
> - `constraints:` (optional) — known constraints to respect
> - `scope:` (optional) — boundaries of the evaluation
> - `ask_for:` (required) — what the user wants (risks, improvements, alternatives)

---

## 6. Output Format

Define the structure of the skill's response after the update:

- **Sections:** Named sections the output must contain, in order.
- **Required reasoning:** What reasoning must be shown in each section?
- **Required checks:** What checks must the skill perform before producing output?
- **Tone:** What tone should the skill adopt? (analytical, neutral, cautious, direct)
- **Level of detail:** How detailed should each section be?

> Example:
> - **Section 1: Interpretation of Intent** — restate what the user asked for, to confirm alignment
> - **Section 2: Alignment Check** — verify the request matches the skill's scope
> - **Section 3: Real Risks Only** — identify actual risks, not hypothetical ones
> - **Section 4: Improvements Without Reinterpretation** — suggest improvements that respect the conceptual core
> - **Section 5: Optional Alternatives** — only if the user explicitly asked for alternatives

---

## 7. Guardrails

Rules preventing drift. These are hard constraints the updated skill must never violate:

- [ ] No reinterpretation of the user's conceptual core
- [ ] No scope reduction unless explicitly requested
- [ ] No over-simplification of intentional complexity
- [ ] No loophole-inventing (identify real risks only)
- [ ] No proposing alternatives unless explicitly asked
- [ ] No changing the skill's fundamental purpose
- [ ] Other: <add custom guardrails here>

> Example: "Do not simplify unless the user explicitly requests simplification. Do not propose alternatives unless the user asks for alternatives."

---

## 8. Test Cases

Provide 3-5 prompts to verify the updated skill works correctly. Include a mix of:

- **Normal case:** A typical, well-formed invocation.
- **Edge case:** An invocation at the boundary of the skill's scope.
- **Stress case:** A complex, high-density invocation.
- **Misinterpretation case:** An invocation that the old skill would misinterpret — verify the update fixes it.
- **Over-engineering case:** An invocation where the old skill would warn about complexity — verify the update respects intentional complexity.

For each test case, provide:
1. The input prompt
2. The expected behavior
3. What the old skill did wrong (if applicable)

---

## 9. Versioning

Track this update:

- **New version:** <e.g., v1.1>
- **Date:** <YYYY-MM-DD>
- **Summary of changes:** <one-line summary>
- **Reason for changes:** <why this update was made>
- **Previous version:** <e.g., v1.0>

Append this entry to `references/changelog.md` in the target skill's directory.

---

## 10. Integration Notes

How this updated skill interacts with other skills:

- **Dependencies:** Does this skill depend on other skills being installed?
- **Conflicts:** Does this skill conflict with any other skill's behavior?
- **Overrides:** Does this skill override or supersede another skill?
- **Shared context:** Does this skill share context, state, or files with another skill?

> Example: "This skill depends on skill-creator for initial creation. It should not be used simultaneously with skills-security-check unless the update adds executable scripts."
