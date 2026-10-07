---
name: drift-check
description: "Turn a confirmed doc into a mechanical check — extract claims a machine can verify, bless a golden baseline, then re-check for drift. Do NOT auto-generate behavioural tests from prose. Strict skill (light-mode default): run on explicit request, or when a confirmed document's factual claims must stay true as the code changes / a periodic drift check is wanted."
agent_created: true
---

# Drift-Check

Convert a confirmed document into a check that runs itself. The point is a doc
that *cannot silently rot*: its factual claims become mechanically verifiable, a
first run records what is true today, and every later run reports what changed.

## Light mode (default)

**Strict skill.** Run it only when the user names it, or when its full task finishes: a
confirmed document's factual claims must stay true as the code changes, or a periodic /
scheduled drift check is wanted. Incidental edits with no confirmed doc under watch are
not a full task. Otherwise do not load, audit against, or quote it. The contract and
every skill's trigger live in one place — the `light-mode` skill.

## The three behaviours (kept deliberately separate)

| Behaviour | Command | What it means |
|---|---|---|
| Build the check from the doc | `extract` | List the claims a machine can decide. Nothing is invented from prose. |
| Run once to record reality | `bless` | Store observed results as a **golden baseline**. |
| Check it periodically | `check` | Re-run and diff against the baseline; exit 1 on drift. |

## The two rules that make this safe

**1. Extract only the mechanical.** A claim is extractable only if a machine can
decide it with no interpretation: a quoted value list, a symbol/identifier, a
command, a file path. **Prose meaning is never extractable.**
If a doc says something ambiguous, do not generate a check from it — a generator
that invents semantics has become the specification, and then the check tests
the generator, not the doc. Surface the ambiguity to the human instead.

**2. Golden is not correct.** `bless` records whatever the code does *now*. It
captures **current behaviour**, not **correct behaviour**: it catches accidental
change and never proves intent. Every baseline is stamped
`"kind": "golden", "proves": "no-change-since-baseline"`. Never report a clean
`check` as "the code is correct" — report it as "no change since the blessed
baseline".

A third rule, inherited from `doc-reconcile`: **report, never edit.** Drift-check
can prove `doc != reality`, not which side is right. It never rewrites the doc or
the code. The human decides.

## Workflow

**Each run states what it compares.** `extract` / `bless` / `check` act on exactly one
`DOC` bound to one `--target`. State both up front — the doc path and the target dir —
so the user knows precisely which doc was checked and against which tree. This keeps
the compared set visible and pre-empts redundant re-checks or duplicate docs (broken
docs are worse than none, but documentation bloat is also bad — see the scope note).

### 1. Confirm the doc is the intended spec — and know which KIND it is
Do not bless a draft. The doc must be one the human has confirmed is intended
(if authoring it, use `spec-capture` first and pass its approval gate). Blessing
an unconfirmed doc freezes the wrong thing.

**Then classify the doc — this decides whether you should bless its claims at all:**

- **Declarative** (the user's statement of intent: a brief, a `prototype_spec`
  marked *authoritative*, a `README` saying what the thing is *for*). A `path` or
  `symbol` claim here means **"planned"**, not "exists". **Do not bless it as
  must-exist** — that would freeze the *intent* as *current reality* and report the
  unbuilt work as drift on every subsequent run. **Declarative docs are the wrong
  input for drift-check**; the human-approved form of a declarative claim is a **CP**,
  not a golden baseline.
- **Descriptive** (AI-written fact about the code as it is now: `STATUS.md`,
  `AUDIT.md`, `ARCHITECTURE.md`, `TESTING.md`). **This is the correct input.**
- **Historical** (a dated snapshot: "144 passed as of 2026-10-03"). Bless only if
  the human wants the *record* pinned; otherwise it is history, not a live claim.

Classify **each** doc you are pointed at. A repo may carry **more than one
declarative doc** (e.g. a product brief *and* a behaviour spec); the count is not
the rule — the *kind* is. Never bless a declarative doc, whether it is the only one
or one of several.

**KIND is a different axis from how the doc was *written*.** Two independent labels:

- **Write-time provenance** (what the doc *is*, marked in the doc): `AI-gen`,
  `AI-edited`, `temp`, `for-human-review`, `for-AI-use`. These are lifecycle labels
  and stay with the doc.
- **Skill-run role** (what the doc is *for* at check time): **declarative** /
  **descriptive** / **historical**. This is a classification *you* make when you run.

**The conversion rule — this is the one that bites:** an `AI-gen` or `AI-edited` doc
**must be human-checked before it may be treated as declarative.** Until a human has
signed off, an AI-written doc is *descriptive by default*, even if the rest of the
repo is already using it as the authoritative guide. Two failure modes follow from
missing this: (a) you bless an AI draft as if it were the confirmed intent, freezing
a hallucination; (b) you *exclude* it as "declarative" and never check it, so a
repo-wide authoritative guide goes unverified. Before treating any AI-authored doc as
declarative, ask: **has a human checked it?** If not, it is descriptive (check it),
or it needs the `spec-capture` approval gate first.

When in doubt, ask which kind the doc is — blessing the wrong kind produces either
a false baseline (declarative → everything reports drift) or a frozen record
(historical → nothing ever reports drift).

### 2. Extract the checkable claims
```bash
python scripts/drift_check.py extract DOC --target DIR --out claims.json
```
Read `claims.json`. It contains only mechanically decidable claims, each with the
doc line it came from. **Review the list with the human:** confirm nothing
important was dropped, and that nothing is being "checked" that shouldn't be. A
claim the extractor cannot parse is a signal the doc is not precise enough — fix
the doc, then re-extract. Do not hand-add a claim you had to interpret.

> **Two traps when eyeballing the claims yourself:**
> 1. **`path` claims are DOC-RELATIVE.** A doc citing `` `test_travel.py` `` means
>    `tests/test_travel.py`. The tool's `resolve_path` tries `--target`, the doc's
>    own directory, and up to 3 parent roots, plus a bounded recursive basename
>    search — so it resolves them. A hand-rolled `os.path.exists()` probe does NOT,
>    and will report a page of false "missing" paths. **Trust `evaluate`, not your
>    own probe.**
> 2. **Symbol/vocab/command claims are scanned RECURSIVELY.** In a package layout
>    (`core/`, `model/`) a non-recursive scan returns an empty symbol set — and
>    `bless` would then record `present:false` for symbols that genuinely exist: a
>    false golden baseline. If a doc's symbols all come back "absent" on a repo you
>    know defines them, suspect the walk before the doc. (Guarded by a nested-module
>    case in `scripts/faults.py`.)

### 3. Bless the baseline
```bash
python scripts/drift_check.py bless DOC --target DIR --by "your name"
```
Writes `drift_baseline.json` beside the doc. Claims that do **not** hold at bless
time are recorded *as-is*, with a note — never silently corrected. If the human
expected such a claim to hold, that is a real finding: doc and code already
disagree, and it is the human's call which is wrong.

> **⚠️ Bless ONE doc at a time — sibling docs share a default filename.** The
> default output is `doc_path.with_name("drift_baseline.json")`, i.e. it is keyed on
> the **directory**, not the doc. Blessing `STATUS.md`, `CHANGELOG.md` and `AUDIT.md`
> in the same folder therefore **silently overwrites** each baseline in turn: only
> the last one survives, and `check` on the others compares them against a foreign
> baseline — producing a page of spurious `CLAIM_GONE`/`CLAIM_ADDED`. The failure is
> quiet and looks like real drift. **Whenever a doc set shares one directory (the
> common case — several `.md` at a repo root), pass an explicit baseline per doc:**
>
> ```bash
> python scripts/drift_check.py bless STATUS.md --target DIR \
>     --baseline drift_baseline.STATUS.json --by "your name"
> python scripts/drift_check.py check  STATUS.md --target DIR \
>     --baseline drift_baseline.STATUS.json
> ```
>
> Ordering trap: `bless A; bless B; check A` looks like it should work and does not —
> `check A` reads `drift_baseline.json`, which now holds B's claims.

### 4. Check on demand or on a schedule
```bash
python scripts/drift_check.py check DOC --target DIR --baseline drift_baseline.DOC.json
```
Exit 0 = no drift; exit 1 = drift. Detects four things:

- `DOC_CHANGED` — the doc was edited after blessing; its claims may be stale, so
  re-confirm and re-bless.
- `REGRESSED` / `NOW_HOLDS` — a blessed claim stopped holding, or started.
- `CLAIM_GONE` — a claim is no longer extractable from the doc.
- `CLAIM_ADDED` — the doc gained a claim since blessing (unblessed).

To check periodically, create an automation that runs the `check` command against
the doc and reports drift, or wire it into a git hook / CI step.

## What this skill is not

- **Not a behavioural test generator.** It checks *structural/factual* claims
  (does this symbol exist, is this value in the vocabulary, does this command or
  file exist). It does not and must not generate tests that assert program
  behaviour from prose.
- **Not a correctness proof.** A green `check` means "no drift since baseline".
- **Not a doc editor.** It never rewrites docs, per doc-reconcile discipline.

## Claim kinds (v1)

```
vocabulary  {name, claimed_values[]}  must match values found in the target
symbol      {name, present:true}      must be defined in the target
command     {tool, sub}               the subcommand must exist in that module
path        {path, present:true}      the file must exist (searched roots)
```

Extend the vocabulary only as a deliberate change: add the claim kind **and** its
validator in `scripts/drift_check.py` in the same edit, and add a case to a fault
suite proving it is caught. An unvalidated claim kind is a claim the tool cannot
keep honest.

## Known limitations (read before trusting a "missing")

- **Bare basenames are resolved recursively, with a bound.** `resolve_path` falls
  back to a depth-bounded `os.walk` for the basename, because a doc often names a
  file by bare basename (``h23_census.py``) while it lives in a subdirectory
  (``bench/scripts/``). Without that fallback such a claim reports "missing
  (searched roots)" — a false positive. If you still see "missing", check whether
  the file exists at all before blaming the doc.
- **A `symbol` claim is satisfied only by a `def`.** A doc naming something that
  is a *method* or *attribute* rather than a module-level function (e.g.
  ``np.tanh``) is extracted as a symbol claim but will never be found, so it is
  recorded as "not defined in target" at bless time. That is an extractor limit,
  not doc drift — do not "fix" the doc for it. If a real function of that name
  ever appears, the claim flips to holding (a benign NOW_HOLDS).
- **Path claims pointing at generated outputs** (e.g. a ``results.json`` a tool
  writes at run time) will resolve only if the file happens to exist when the
  check runs. Bless such a doc when the artifact is present, or expect a
  spurious "missing".
