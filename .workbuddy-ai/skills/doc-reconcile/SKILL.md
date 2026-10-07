---
name: doc-reconcile
description: "Reconcile a repo's markdown docs against git history and the working tree, and report where the prose has drifted from the code — use when the user asks to check docs for staleness, wants a docs-vs-commits audit, before a team meeting, or when a doc claim is suspected of being wrong. Reports only; never edits docs unless the user explicitly asks. Strict skill (light-mode default): run on explicit request, or after a batch of merges / a material code change that touches documented behaviour."
agent_created: true
---

# doc-reconcile — find where the docs lie

## Light mode (default)

**Strict skill.** Run it only when the user names it, or when its full task finishes:
a batch of merges / a material code change that touches documented behaviour, or a doc
claim suspected wrong. Otherwise do not load, audit against, or quote it. The contract
and every skill's trigger live in one place — the `light-mode` skill.

Docs drift from code quietly: prose describes behaviour that changed, numbers go
stale, a file is renamed and the summary keeps the old name. The drift is usually
found by accident rather than by looking. This skill looks on purpose.

> ## 🔧 Bind before using — the names in this file are NOT universal
> This skill's body was written against one example repo (a TS/Next.js project:
> `docs/ARCHITECTURE.md`, `BUGFIXLOG.md`, `repo_map.py`, `npm` gates). **None of those
> names transfer.** The *method* transfers; the file list and gate commands do not.
> Before any run, complete Step 0 below to bind the real doc set and tooling:
> - **Docs:** glob *this* repo's real `.md` set — do not trust the example table further down.
> - **Tooling:** `git` + `Glob`/`Grep` + the repo's real gate (Python → `pytest -q`;
>   **not** `npm run typecheck/test/lint`). There is no `repo_map.py` unless the repo ships one.
> - **Range anchor:** a `> **Verified against:**` line if present; else "docs as last
>   committed .. HEAD + uncommitted tree".

**Core rule: this skill REPORTS. It never edits a `.md` file unless the user asks.**

**State the scope you compared — every run, as a note to the user.** Before any
report, list the exact doc set you bound in Step 0 (the descriptive set, minus the
declarative docs you excluded). This is the **anti-bloat check**: the user sees the
whole doc set at a glance, so a "new doc" idea can be judged against it for
duplication *before* anything is written. **Do not create a doc that duplicates one
already in this set — amend the existing doc instead.** Surface this scope line at the
top of your report (Step 7) too.

> ## 🔧 Step 0 for ANY repo — bind the skill before using it
>
> Answer these five, then proceed. Five minutes here prevents re-deriving scope
> from scratch (which is the most common way this pass goes wrong).
>
> **0. Which docs are DECLARATIVE? Find them first — and exclude them.**
> A declarative doc is the user's statement of intent (a `README` saying what the
> thing is *for*, a `prototype_spec.md` marked *authoritative*, a brief). Everything
> else — `STATUS.md`, `AUDIT.md`, `ARCHITECTURE.md`, `TESTING.md`, `TRACEABILITY.md`,
> changelogs — is **descriptive**: an AI-written claim about what the code
> currently *is*.
>
> **Do not assume there is only one.** The count is not the rule. A repo may carry
> **several declarative docs** (a product brief *and* a system/behaviour spec). Find
> *every* declarative doc, exclude **each** of them, and reconcile the rest.
>
> **The rule: reconcile the descriptive docs against the code. NEVER reconcile a
> declarative doc against the code.** A declarative doc is authoritative by
> construction; "it describes something not built" is the *point*, not drift. If you
> find yourself "fixing" an intent doc, the architecture has been inverted. Mark each
> declarative doc as such if it isn't already recognisable (a `Status:` / `Type:` /
> `authoritative` marker) — and say so if it is unmarked.
>
> **A declarative doc is not uniformly declarative — the exclusion is per-*claim*, not
> per-file.** A design-of-record spec commonly carries an embedded **descriptive**
> section: a status/gate table (`[built]`/`[partial]`/`[planned]`), a coverage matrix,
> a "what ships today" column. Those cells are fact-claims about the code and they
> drift like any other. **Reconcile those cells; exclude only the intent prose around
> them.** Measured case (2026-10-07): this repo's most authoritative doc was excluded
> wholesale, and its §9 gate-status column drifted — a gate marked `[planned]` had
> shipped — for two days because nothing checked it. Excluding a doc is not the same
> as excluding every claim inside it; if you exclude a spec, say which sections you
> nonetheless read as descriptive.
>
> **KIND ≠ how it was written.** Two independent labels:
> - **Write-time provenance** (marked in the doc): `AI-gen` / `AI-edited` / `temp` /
>   `for-human-review` / `for-AI-use`.
> - **Skill-run role** (decided here): **declarative** / **descriptive** /
>   **historical**.
>
> **Conversion rule — the one that bites:** an `AI-gen` or `AI-edited` doc **must be
> human-checked before it may be flagged declarative** — because the rest of the repo
> may already be treating it as an authoritative guide. Until a human signs off, a
> generated doc is **descriptive by default**: reconcile it. (Skipping this cuts both
> ways — you either "fix" an unconfirmed AI draft as if it were intent, or you
> *exclude* a repo-wide authoritative guide and never check it.)
>
> If the repo has **no** declarative doc at all, that is a finding worth reporting in
> itself: a reader has no statement of intent to anchor against. **A declaration that
> is a *hypothesis to be tested* counts** — for a research/experiment repo the intent
> *is* the thing under test, and it is declarative (do not reconcile it against the
> code as if it were a fact-claim).
>
> 1. **Which docs are in scope?** List the descriptive set — every hand-written `.md`
>    a newcomer would trust as fact about the code. Exclude the declarative docs (0),
>    generated output (`repomix-output.xml`, snapshot renders, `*.tsbuildinfo`), and
>    treat `.workbuddy-ai/` as tooling, not documentation.
> 2. **What measures the tree?** If the repo ships a mapper (`repo_map.py` /
>    `build_map.py`), use it — do not re-derive. If it does **not**, measure
>    directly: `git log`, `git status`, `Glob`/`Grep`. The method survives without
>    the script; only step 0's shortcut is lost.
> 3. **What are the gates, and how are they run?** Node → `npm run
>    typecheck|test|lint`. Python → `pytest -q` in the venv. Whatever it is, the
>    doc's claim about colour *and number* must match a real run.
> 4. **What is the range anchor?** If a doc carries a `> **Verified against:**`
>    line, that date is the anchor and the range is `<date>`..`HEAD`. If not,
>    default to "docs as last committed" .. `HEAD`, **plus the uncommitted working
>    tree** — and confirm with `git log --format="%h %ad %s" --date=short -- <docs>`.
>    **Report the anchor's staleness.** Run `git log --oneline <anchor>..HEAD | wc -l`.
>    A distance of more than ~1 commit is the usual cause of rot in the doc's quoted
>    counts and line numbers (the doc was last re-derived that many commits ago);
>    flag the distance in the report, and re-stamp the `Verified against:` line at
>    the end of the pass.
> 5. **Which doc is authoritative?** A content change to a spec/contract (not a
>    typo) needs the user's say-so first. Never auto-create docs — amend in place.
>
> **Rules that transfer to every repo:**
> - **Historical snapshots are NOT drift.** A dated status line ("144 passed as of
>    <date>") records what was true *then* and is correct as written. Only a
>    **live** claim — present-tense, no date — is drift. When unsure, report it as
>    *"dated snapshot, likely history"* and let the user decide; never silently edit it.
> - **Never hardcode a count in a summary.** Re-run the gate and quote the number
>    you observe; a stale number in a re-entry doc actively misleads.
> - **Counts stated as *prose estimates* are auditable too.** The rule above is
>    written for gate results, but it bites harder on plain numbers: a doc saying
>    "~8,400 of ~8,500 files" or "~21 files" is making a claim one `os.walk` settles.
>    Such numbers have been found drifted by hundreds. Sweep every number in the doc
>    set, not just the ones a test prints.
> - **Cross-skill seam:** `drift-check`'s `bless` writes `drift_baseline.json`
>    **beside the doc**, keyed on the directory — so blessing sibling docs in one
>    folder silently overwrites each other. If a pass ends by blessing baselines for
>    several docs in the same directory, pass an explicit
>    `--baseline drift_baseline.<DOC>.json` per doc (see `drift-check` step 3).

That is not a formality. The failure this skill exists to prevent is AI-written docs
that describe the code from *summaries* instead of from the *files* — producing a
doc set carrying one stale claim in many copies. An agent that rewrites docs
regenerates exactly that failure, faster. Output is a list of claims to verify, each
with the evidence needed to settle it. **A human edits — or explicitly asks.**

## Start here: run the repo's measurement first

Do not begin by reading files. If the repo *has* a measurement, re-deriving it by
hand is how this pass gets slow and incomplete. **If it does not, that is fine —
skip to step 1 and measure with `git` + `Glob`/`Grep` directly.** The rest of this
section describes the measurement one particular repo happened to ship; read it as
*an instance of the pattern*, not a prerequisite.

> **The instance:** a repo shipping `repo_map.py` + `build_map.py`.

```bash
# 1. Measure the tree and re-verify the gates in one shot
python .workbuddy-ai/scratch/analysis/repo_map.py --check

# 2. Rebuild the rendered map (this is what a human reads)
python .workbuddy-ai/scratch/analysis/build_map.py
```

`repo_map.py` prints the totals, the orphan list, the unresolved imports and the gate
results, and writes `.workbuddy-ai/scratch/analysis/report.json`. `build_map.py` renders
that into `repo-map.html` — a six-tab page (graph / entry points / workflows / doc-vs-code
drift / seams / all files) that a human can use directly.

**Caution — `repo-map.html` is a REPORT, not a doc.** It is regenerated, never hand-edited,
and it does not replace `docs/`. It feeds step 4 below by giving you the file list, the
line counts, the in/out degrees and the gate colours without you having to compute them.

The map's builder also holds a hand-maintained `DRIFT` table. **That table is the drift
history.** Read it first: it already names the divergences found on the previous pass. If a
row is still true, this pass should not re-discover it — it should confirm or retire it.

| Artifact | Path | Use |
|---|---|---|
| Measurement script | `.workbuddy-ai/scratch/analysis/repo_map.py` | gives you the numbers |
| Renderer | `.workbuddy-ai/scratch/analysis/build_map.py` | holds the `DRIFT` table |
| Measured data | `.workbuddy-ai/scratch/analysis/report.json` | machine-readable facts |
| Rendered map | `.workbuddy-ai/scratch/analysis/repo-map.html` | what the human reads |

> **Treat `.workbuddy-ai/` as tooling, not as documentation.** The "ignore generated
> noise" rule in step 2 still applies to it.

## Scope

> **The table below is ONE repo's example, not universal** — a Next.js/TypeScript
> project whose docs live in `docs/`. Bind your repo's real set with a glob first (the
> 🔧 block above / Step 0), then read these rows as the *shape* of a doc set. If the
> repo has no `docs/` dir, the list is wrong and the tooling may not exist: adapt or
> skip it, and say which parts did not transfer.

Docs to audit (this is the whole set — see `MEMORY.md`):

| Doc | Describes |
|---|---|
| `docs/ARCHITECTURE.md` | file responsibilities, wire protocol, invariants — **the living half** |
| `docs/BUGFIXLOG.md` | **the volatile half** — open defects, fix tables, the refactor queue, commit state, DRIFT records |
| `docs/PLAN.md` | status, blockers, roles, the 28-week schedule, decisions |
| `docs/TESTING.md` | runner, test layers, the edge-case matrix |
| `README.md` | quickstart, repo map |
| `AGENTS.md` | contributor/agent rules |
| `components/README.md` | component conventions |

> **The split (`ARCHITECTURE.md` living / `BUGFIXLOG.md` volatile).** When a defect
> closes, an item lands, or a commit position changes, **the edit belongs in `BUGFIXLOG.md`**, not
> `ARCHITECTURE.md`. A drift finding of the form "the doc says X is open and it is done" is a
> `BUGFIXLOG.md` finding. `ARCHITECTURE.md` should only change when a **file's responsibility, the
> wire protocol, or an invariant** changes — if a pass finds itself editing it for a status
> reason, the split is being violated.

## Procedure

### 1. Establish the commit range

Ask if unclear, else default to everything since the docs were last verified.

```bash
# The docs carry a "Verified against" line; find the commit it names, else:
git log --format="%h %ad %an %s" --date=short -20
```

`docs/ARCHITECTURE.md` opens with a `> **Verified against:**` line naming a date. That is
the anchor. The range is `<that date>` .. `HEAD`. **Also report the anchor's
distance** (`git log --oneline <anchor>..HEAD | wc -l`) — a non-trivial distance
explains why the doc's numbers may be stale and is itself a finding to surface
(see Step 0.4 for the why).

### 2. List what the commits actually touched

```bash
git log --format="%h|%an|%ad|%s" --date=short <range>
for c in $(git log --format=%h <range>); do
  echo "--- $c $(git log -1 --format=%s $c)"
  git show --stat --format="" $c
done
```

Ignore generated/vendored noise: `package-lock.json`, `.next/`, `repomix-output.xml`,
`tsconfig.tsbuildinfo`, `.workbuddy-ai/`.

### 3. For each touched file, find every doc claim about it

For each real source file the commits touched, grep the doc set for its name AND for
prose describing its behaviour. Both matter — the drift is usually in the prose, not the
path.

```bash
grep -rn "python_worker\|GUI_handler\|page.tsx" docs/ README.md AGENTS.md
```

### 4. Check the claim, not the path

This is where the value is. For each claim, open the file and verify. The drift
classes seen in this repo so far:

| Class | Example found | How to catch it |
|---|---|---|
| **Doc describes a deleted file** | `ARCHITECTURE.md` documented a separate GUI endpoint; it was deleted in `742f503` while `page.tsx` still referenced it | `git log --oneline -- <path>` — see step 4a |
| **Doc describes a renamed file** | `ARCHITECTURE.md` §3 named `easy_loader_temp.ts`; it is now `buffer_utils.ts` | `repo_map.py` node list — the old name is simply absent |
| **Doc misses a file entirely** | `useProjectViewerRuntime.ts` (331 lines) was split out of `page.tsx` and appeared in no doc | `repo_map.py` — a file with high in/out degree that no doc names |
| **Size/line-count claim** | `ARCHITECTURE.md` called the demo GUI "~30 lines" after it grew to 64; §2 still says "~1,168 lines across 20 files" when the tree has twice that | `repo_map.py` totals vs the doc's number |
| **Behaviour claim** | Docs said `timeout_test.py` was an `input()` prompt; it is `time.sleep(100)` | read the file |
| **"Exists / missing" claim** | A pairing table listed 2 `_ok` counterparts while 3 existed | `ls` the directory / `repo_map.py` |
| **Quoted metric** | "32 lint errors" quoted as current | `repo_map.py --check` re-runs the gates |
| **Route-set claim** | `ARCHITECTURE.md` §3 Layer D documented `/api/demo1`; the real routes are `/api/projects` + `/api/projects/[project]` | `ls app/api/` — the route is the route |
| **Orphaned-but-documented route** | `/api/test-scripts` exists, is documented as live, and no page fetches it | `repo_map.py` orphan list, then `grep -rn` for the fetch |
| **Stale cross-reference** | Inserting `§6.9` silently moved two `§6.9`/`§6.10` links to the wrong sections | see step 5 below |

### 4a. Confirm every documented path exists — and check *history*, not the index

A doc can describe a file that is not there. **There are two very different reasons, and
they need opposite advice.** Do not confuse them:

```bash
# DOES IT EXIST ON DISK?  (index + working tree)
git ls-files --error-unmatch <path>

# WAS IT EVER TRACKED?  (history)   ← this is the one that matters
git log --oneline --all -- <path>
```

| Outcome | Meaning | Advice |
|---|---|---|
| `git log` has commits, file absent | **Deleted.** | **Report the divergence and stop.** Three ways it can resolve, and only a human can pick: (a) the file was removed by mistake → `git checkout <last-good-sha> -- <path>`; (b) **the file was removed on purpose and the doc is the thing that is stale** → fix the doc, change nothing in the code; (c) the deletion was right *and* the dependent code still references it → the code needs the follow-up, not the doc alone. |
| `git log` empty | **Never committed.** Only ever existed on someone's disk. | **Cannot** be restored. Must be re-created. Nothing to recover. |

> **Do not prescribe the fix. Report the divergence.** A reconciliation pass can only establish
> that a doc and the code disagree — it **cannot know which one is correct**, because intent is
> not in the git history. Reporting "deleted, recoverable, restore it" is wrong whenever the
> author meant to delete it — a divergence, not automatically a defect.

**Do not use `git ls-files` alone to conclude "never committed."** It reads the *index*, so
a file whose deletion is already committed returns "no match" — identical to a file that was
never added. Always run `git log` as well before making a claim about a file's history.

**Also flag to the user:** any commit whose `--stat` shows a deletion the subject does not
mention — that is how a bundled deletion stays hidden.

### 5. Audit cross-references after any section insert

`PLAN.md` and `ARCHITECTURE.md` both number their sections, and both are cross-referenced
from each other. **Inserting or removing a numbered section silently breaks every later
link.**

```bash
grep -on "§6\.[0-9]*\|§[1-9]\b" docs/*.md | sort -u
```

For each hit, confirm the target section actually says what the referring sentence claims.
A link that resolves to *a* section is not the same as a link that resolves to the *right*
section — the failure mode is a valid-looking link pointing at the wrong content.

**Fix the links, not the numbers.** Re-numbering sections to preserve old links is worse
than updating the links: it makes the document's shape hostage to its history.

### 6. Verify quoted gates actually pass

Docs state facts about the build. Check them — this is how the red typecheck on `main`
was found, and how it was later found to have been fixed without the docs noticing.

```bash
python .workbuddy-ai/scratch/analysis/repo_map.py --check   # runs all three, in one go
```

Or individually:

```bash
npm run typecheck; echo "typecheck exit: $?"
npm test 2>&1 | tail -5
npm run lint 2>&1 | tail -3
```

Any doc sentence asserting green/red must match reality. **`npm run typecheck` returning
non-zero makes every "green" claim in every doc false** — and the inverse is now true too:
a doc claiming RED when the gate is green wastes a teammate's evening.

**Compare against the doc's *number*, not just its colour.** A doc that says "32 lint
errors" while the real count is 28 is wrong even though both are "red."

### 7. Report

Open with the **bound doc set** line from the scope-discipline rule above (the
anti-bloat check: here are the N docs compared, so no duplicate doc gets proposed).
Then output a table. No prose preamble, no restating what the docs say.

```
| Doc | Line | Claim | Reality | Evidence |
|---|---|---|---|---|
| ARCHITECTURE.md | §3 Layer D | "~30-line HTML string" | 64 lines, now has light/dark CSS | historical file in `ff00083` |
```

Then, separately, a short list of **claims that could not be checked** and why (e.g. it
needs a running browser). Do not guess at those — an unverifiable claim is not a
verified-clean claim, and silently dropping it is how drift survives.

## Traps specific to this repo

- **Read the file, don't trust a summary — including this doc's own summary.** A full
  read of the 15-file demo corpus found four doc claims wrong.
- **A commit subject can lie about its own scope.** `ff00083` is titled "Fixed an issue
  with black word on balck background" and added 34 lines. Always read `--stat`, never
  the subject alone.
- **A merge commit can carry real content.** `0d4898c` looks like noise; it added
  `timeout_test_ok.py`.
- **The working tree can change mid-session.** A teammate's concurrent edits can
  replace a component and split a source file *while an audit is running*, so early
  reads go stale. Re-check mtimes (`stat -c "%y %n" <files>`) before drawing
  conclusions, and re-run the measurement if anything looks inconsistent.
- **Distinguish a stale *summary* from a stale *line comment*.** These are not the same
  artifact and must not be collapsed:
  - A **summary** ("this file does X") is a claim about behaviour. It rots when the code
    changes, and it is what this skill audits.
  - A **line comment** ("increment the counter") is a claim about one statement. **It is
    falsified only if that line actually changes** — not by refactoring elsewhere. The
    repo owner has stated plainly that per-line plaintext comments do *not* go false on
    their own, and they are valued.
  - So: **do not report per-line comments as drift**, and do not treat "the file now does
    something different" as making an untouched line's comment wrong. Flag a line comment
    only when its own line changed and the comment no longer matches it.
  - Corollary: the failure mode this repo actually suffered was *prose describing code from
    summaries instead of from the files*. That is a summary problem, not a comments problem.
- **`.workbuddy-ai/` is not documentation** in the sense this skill audits — it is agent
  memory and tooling, and is expected to be denser and more current than the docs. Do not
  flag the docs for "missing" something only memory records.
- **D-numbered defects are permanent** (`BUGFIXLOG.md` §2 open / §6 closed; rationale in `ARCHITECTURE.md` §6). A defect moving from open to closed is not drift; a defect **disappearing** is.
- **A defect can be retired without being closed.** A defect written as "fails to render
  the GUI; is CORS on?" can become obsolete in its *premise* when the code grows a
  GUI-transpile path the doc never mentioned. The defect may still be open — an obsolete
  premise is its own kind of drift worth reporting.
- **A deleted handover note stays deleted.** If a handover-style note is dropped from the
  repo root, its replacement is the regenerated `repo-map.html` from step 0. If such a note
  ever reappears, its claims about the code are auditable like any doc's, and when it goes
  stale, delete it rather than annotate it.
- **Do not propose new docs.** If a finding seems to need one, propose amending an
  existing doc instead. The doc set is **7 files** (`docs/` holds 5 `.md`, plus `README.md` and
  `AGENTS.md` at the root); `docs/ARCHITECTURE.structure.md` is a generated snapshot, exempt
  from the tally. Adding one means removing one.

## When the user wants the findings applied

Hand them the table and let them choose. If they ask the agent to make the edit anyway,
**edit in place** in the existing doc — never create a file, and mark the
`> **Verified against:**` line in `ARCHITECTURE.md` with the new date and HEAD hash.

When applying edits, also **update the `DRIFT` table in
`.workbuddy-ai/scratch/analysis/build_map.py`**: delete the rows you fixed rather than
annotating them. That table is the drift history, and a fixed row left in place becomes
the next pass's false positive.
