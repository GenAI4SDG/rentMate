# Changelog

## v1.1 — 2026-10-03
**Summary:** Named the four-part high-signal intake (Goal / Context / Constraints / Format) explicitly in Phase A, and cross-linked the new `prompt-back` skill for task-level requests.
**Reason:** User requested a "prompt me back, don't guess my intent until I've answered" behavior. The general task-level version was built as the new `prompt-back` skill; spec-capture's interview now uses the same explicit intake structure instead of leaving the question content implicit, and the two skills point to each other (task-level vs project-scale intake).
**Changes:**
- Phase A step 1: interview is now structured around the four parts (Goal -> S0/S1, Context -> S1, Constraints -> S3/S7, Format -> S5); one batched questionnaire; unconfirmed guesses go to S8 as labeled interpretations.
- "When to use": added the `prompt-back` relationship and the escalation direction (everyday requests -> prompt-back, multi-session projects -> spec-capture).
