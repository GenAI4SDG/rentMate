---
name: kaggle-kernel-runner
description: Run, verify, and fetch Kaggle work from the CLI — pushing notebooks as kernels, submitting competition files, downloading outputs, and diagnosing silent API failures. Use whenever the task touches Kaggle (kernels push/status/output, competitions submit/submissions, datasets create) for this user, especially the gemma4-developer-agent and DoorKey PPO projects. Covers the CLI's location and credential rule, the enforced submission filename, the forward-slash dataset-upload bug, how to surface error bodies the CLI swallows, the cp312-vs-image-python mismatch that breaks in-process harness installs, and the verify-before-you-spend discipline.
agent_created: true
---

# Kaggle kernel runner

Drive Kaggle from the CLI without losing a run, a submission slot, or an hour to a
silent failure.

## When to use

- Pushing a notebook as a Kaggle kernel, or fetching its output.
- Submitting to a competition, or checking whether today's slot is open.
- Creating a dataset to feed a kernel.
- Any Kaggle call that returned a bare "400 Client Error".

## Environment

- **The CLI lives in `AI_prgm/.venv`**, not in `kaggle-gemma4/.venv-eval`:
  `C:/Users/Trinity/Programmes/AI_prgm/.venv/Scripts/python.exe -m kaggle` (v2.2.4).
- Credentials sit at `~/.kaggle/credentials.json`. **The CLI reads them; never print
  or `cat` them.** Test auth through a command that only prints success/failure.
- `kaggle kernels push` triggers a run immediately. `kernels output` downloads the
  **log** for a finished kernel, not the notebook.

## Hard traps (all paid for)

1. **Competition submissions are filename-enforced.** `gemma-4-developer-agent`
   rejects any upload not named exactly `submission.zip` (HTTP 400
   `FAILED_PRECONDITION`). Copy the arm zip to `submission.zip` before submitting —
   the competition's own name for the file is not the name of your artifact.
2. **The CLI swallows the reason.** It prints only `400 Client Error for url: …`.
   The body holds the actual message. **Patch `requests.Session.send` to print any
   non-2xx body before the SDK raises** — otherwise you are guessing at the cause.
3. **`kaggle datasets create -p <forward/slash/path>` fails with `Errno 2`.** The
   resumable-upload temp filename is built by replacing `os.path.sep` and `:` only
   (`ResumableUploadContext.get_upload_info_file_path`), so a `C:/...` path leaves stray
   `/` and the "filename" becomes a nested path. Two workarounds, only one of which is
   safe:
   - Passing a **backslash** path (i.e. run it through PowerShell) — but see trap 19:
     PowerShell may not have credentials.
   - **Correct fix:** monkeypatch it in-process before uploading —
     `ResumableUploadContext.get_upload_info_file_path = lambda self, p: os.path.join(self._temp_dir, re.sub(r"[^A-Za-z0-9._-]", "_", p) + ".json")`.
   **`no_resume=True` is NOT a workaround:** under it `upload_initiated()` returns early
   without setting `start_blob_upload_response`, so the next call dies with
   `AttributeError: 'NoneType' object has no attribute 'create_url'`.
4. **Never pipe a long run through `tail`** — it buffers until exit. Redirect to a
   file and read the file, so partial progress survives a kill.
5. **No `:` in any name that becomes a filename.** Windows silently writes 0-byte
   stubs while other outputs download fine.
6. **`kernel-metadata.json` has no `docker_image` field.** `valid_push_kernel_types`
   is only `["script", "notebook"]`, so you cannot swap the base image from the CLI.
7. **`datasets create --dir-mode` defaults to `skip`, which skips folders ENTIRELY** —
   `_upload_file_or_folder` prints *"Skipping folder: X"* and moves on. Pointing
   `-p` at a folder of subfolders therefore uploads only the top-level *files*, and
   the result looks like a successful upload. Pass `--dir-mode zip|tar` to include
   folders.
8. **Never assume the shape of a dataset you did not just list.** Query it first:
   `kaggle datasets files <owner>/<slug> --page-size 200 --format csv`. A dataset
   built from arm zips came back with the zips **expanded** into loose files, and a
   consumer that globbed `**/<name>.zip` died on its first cell. **Accept both
   forms** (archive or directory) rather than betting on one.
9. **`kernels output` returns nothing until the kernel finishes.** While it is
   `RUNNING` you get an empty directory and exit code 0 — indistinguishable from a
   successful fetch. Poll `kernels status` to `COMPLETE`/`ERROR` first.
10. **A dataset mounts at `/kaggle/input/datasets/<owner>/<slug>/`**, not
   `/kaggle/input/<slug>/`. Globbing recursively under `/kaggle/input` is immune;
   a hard-coded path is not.
11. **A check that greps for a bug will be broken by the comment describing it.** This
   has now happened twice on this project (`task.task_id`, `len(adapters)`). When the
   check is about what code *does*, walk the AST. Reserve string matching for text
   that is never quoted.
12. **`machine_shape` decides far more than speed — it can forbid internet.** For a
   competition kernel, Kaggle may reject a non-default accelerator with internet on:
   *"Internet cannot be enabled for this competition with the current accelerator."*
   Set it in `kernel-metadata.json` (`"machine_shape": "NvidiaL4"`) or via
   `kernels push --accelerator`. Values (Sep 2026): `NvidiaTeslaT4` (default, GPU
   T4 ×2), `NvidiaTeslaA100`, `NvidiaL4`, `NvidiaL4X1`, `NvidiaH100`,
   `NvidiaRtxPro6000`, `TpuV5E8`, `TpuV6E8` — some restricted to specific
   competitions. **The default is T4 ×2**, so an unset `machine_shape` silently means
   a 64 KB-shared-memory, 16 GB-per-GPU Turing part.
13. **`--no-run` may not exist in the installed CLI** (2.2.4 rejects it as an unknown
   argument). Do not build a probe around it without checking `kernels push --help`;
   an argparse failure returns exit code 2 and looks nothing like an API rejection.
14. **Never infer the GPU count from the accelerator's name.** `machine_shape:
   "NvidiaL4"` grants **four** L4s — verified by a probe run whose log printed
   `GPU 0..3: NVIDIA L4`. The list contains both `NvidiaL4` and `NvidiaL4X1`, so the
   naming reads like a count suffix, but plain `NvidiaL4` is the multi-GPU part. For a
   competition whose official environment is 4×L4, that is the whole point. **Print
   `nvidia-smi -L` in the kernel's first cell** and read it from the log; it costs
   nothing and it is the difference between "the hardware cannot host this" and "the
   dependencies cannot be delivered".
15. **The internet ban is accelerator-wide, not model-specific.** L4, A100 and
   RtxPro6000 were all rejected with the same `FAILED_PRECONDITION`. A
   competition-attached kernel therefore has internet only on the default T4. **You cannot
   escape this by detaching** — see trap 22: detaching forfeits the accelerator instead.
16. **`datasets create --help` names the wrong metadata file.** It says
   `datasets-metadata.json`; the CLI requires **`dataset-metadata.json`** (singular).
   The wrong name fails with "Metadata file not found", not a schema error.
17. **`datasets create`/`version` convert tabular files to CSV by default.** A
   `tasks.jsonl` becomes CSV and whatever consumed it breaks silently downstream. Pass
   `-t/--keep-tabular` (CLI) or `convert_to_csv=False` (Python API).
18. **`--dir-mode zip` does not keep a directory a directory.** It uploads
   `snapshots/` as `snapshots.zip`, so what mounts is a zip, not the layout the code
   expects. Zip the directory yourself (with the directory name inside the archive) and
   upload with `--dir-mode skip`, or unpack it at runtime.
19. **Bash and PowerShell do not share Kaggle credentials.** Bash had them;
   PowerShell reported "Authentication required". Trap 3 pushes you toward PowerShell
   for uploads — where auth may be missing. Check auth in the shell you are about to
   use. Also: **auth can expire mid-session** — writes begin failing with
   `Authentication required` or `401 ... StartBlobUpload` while some reads still
   succeed, so a green read is not proof the write path works. Re-run `kaggle auth
   login`.
20. **Kaggle EXPANDS an uploaded `<dir>.zip` into a directory NAMED AFTER the archive.**
   So a zip that already carried a `<dir>/` root mounts as `<dir>/<dir>/…` — one
   redundant level, and every path handed to a consumer sits one level too high.
   Verified by *listing* the dataset (`snapshots/snapshots/*.tgz`). Decide deliberately
   whether the archive root carries the directory name, and de-nest defensively at
   runtime (collapse only when the sole entry is a same-named directory).
21. **The Python API's fields are snake_case, and `ref` is an `int`.** This is a property
   of every `kagglesdk` object, not just submissions: the JSON says `publicScore` /
   `errorDescription` / `numAllowedNow`, the **Python attribute is `public_score` /
   `error_description` / `num_allowed_now`**. Two consequences, both silent:
   `getattr(s, 'publicScore', None)` returns `None` for *every* submission and reads
   exactly like "no score was recorded"; and `s.ref == '56896914'` never matches because
   `ref` is an `int`. Print `type(x).__name__` and `dir(x)` once before trusting any
   filter or defaulted attribute over these objects. Read a value from the object, never
   from the field name you remember.
22. **`machine_shape` is honoured ONLY for competition-attached kernels.** Verified by a
   controlled probe — identical notebook, identical `machine_shape: "NvidiaL4"`, identical
   internet setting; the ONLY difference was `competition_sources`:
   - **detached → 2 × Tesla T4** (cc 7.5)
   - **competition attached → 4 × NVIDIA L4** (cc 8.9)

   So `NvidiaL4` / `NvidiaTeslaA100` / `NvidiaH100` are **competition-only accelerators**,
   and internet was never the variable. **L4 and internet are mutually exclusive.**
   An earlier conclusion of mine — "detach and `L4 + internet` becomes legal" — was WRONG,
   and wrong in the worst way: the detached push was *accepted* and then silently ran on
   T4. A silent downgrade is far more expensive than a rejection, because nothing fails
   until ~16 minutes later, as `Required: 98304, Hardware limit: 65536` deep inside vLLM.
   Needing both a modern GPU *and* PyPI means **competition attached + internet OFF +
   fully offline provisioning**. Always print `nvidia-smi -L` in the first cell (trap 14)
   so the assigned accelerator is a measured fact rather than an assumption.
23. **A new kernel's slug comes from its TITLE, not its `id`.** Pushing
   `"id": "tests1234/gemma4-gpuprobe"` with `"title": "Gemma4 GPU Probe"` created the slug
   `tests1234/gemma4-gpu-probe`. Every later call against the id you wrote then fails with
   `Permission 'kernels.get' was denied`, which reads like an authentication or
   private-kernel problem rather than a naming one. The push prints
   *"Your kernel title does not resolve to the specified id"* — read that line, and take
   the slug from the notebook URL.
24. **`kernels_output()` downloads EVERY output file, so a kernel that emits a multi-GB
   artifact will hang your client.** `api.kernels_output(slug, path=...)` pulls the whole
   output set; on a kernel publishing an 11 GiB tarball it ran until the tool killed it
   (`SIGTERM`), with nothing to show. Two ways out, both cheaper than the download:
   - `api.kernels_output(slug, path=..., file_pattern=r'\.log$')` — the `file_pattern`
     regex filters what is fetched.
   - **Best: read the log with no download at all.** `list_kernel_session_output` returns
     the log inline and the output files as URL + `fileName`:
     ```python
     from kagglesdk.kernels.types.kernels_api_service import ApiListKernelSessionOutputRequest
     with api.build_kaggle_client() as kaggle:
         req = ApiListKernelSessionOutputRequest()
         req.user_name, req.kernel_slug = owner, slug
         resp = kaggle.kernels.kernels_api_client.list_kernel_session_output(req)
     for e in json.loads(resp.log):        # [{"stream_name": ..., "data": ...}, ...]
         print(e["stream_name"], e["data"], end="")
     ```
     Note the field names are `fileName` here (camelCase) while the log is a **JSON string**
     you must `json.loads` yourself — see trap 21 for the naming split. `resp.files` entries
     carry **no size field**, so to learn an artifact's byte count read it from the log
     (`VENV_TARBALL_BYTES 12128942080`) rather than from the API.
   A related, useful fact: **`kernel_sources` accepts a kernel that only ever ran once**, and
   the push reports it back as `invalidKernelSources: []`. Check that list — an invalid
   source is otherwise a silent empty mount at runtime.
   And a kernel can publish a large artifact at all: an 11.30 GiB tar written to
   `/kaggle/working` succeeded and was published, so `/kaggle/working` is not the 1–2 GiB
   sandbox people assume.
25. **A notebook image is not the official sandbox image, and `ensurepip` is a common casualty.**
   On Debian/Ubuntu `python3.12-venv` is a **5.7 KB** package whose `ensurepip` ships **no
   `_bundled/`** directory: Debian patches it to read its wheels from `/usr/share/python-wheels/`,
   supplied by the *separate* `python3-pip-whl` and `python3-setuptools-whl` packages. So installing
   `python3.12-venv` alone leaves `-m ensurepip` failing with `returned non-zero exit status 1`, and
   `-m venv` failing with *"ensurepip is not available … apt install python3.12-venv"* — which names
   the wrong fix. **`apt-get install -y --no-install-recommends python3.12-venv` pulls all three.**
   Anything that calls `venv.create(with_pip=True)` in-process — a common way for a harness to build
   a per-task sandbox — dies on this. Verify the fix by **creating a venv and running pip in it**,
   never by checking that a directory exists. Probe first for *any* `ensurepip` in the image
   (`/usr/lib/python3*/ensurepip`, `/usr/local/lib/python3*/ensurepip`, `/opt/**/ensurepip`); in the
   Kaggle image the answer was **none at all**, so nothing could be copied and the fix had to be
   relayed from an internet-enabled kernel.
   Corollary: **read the official image definition rather than assuming it matches.** Here
   `data/docker/Dockerfile.sandbox` said `python:3.13-slim` — a source build with `ensurepip` intact
   — while the notebook image was Debian-based with it split out. **The same Python minor version is
   not the same environment.**

26. **A session log's line count is NOT an event count — a child process's output can appear 2–3×.**
   Notebook cells that launch a subprocess with `subprocess.run([...])` and **no** `capture_output`
   let the child inherit the notebook's stdout/stderr fd; the notebook's own `print()`s go through
   the kernel's cell-output path. Under Kaggle's papermill runner
   (`log_output=True, stdout_file=sys.stdout`) those two paths can both reach the log, so **the
   child's output is duplicated while the notebook's own output is not**. Observed: a 138-line log
   where lines 11–45 (notebook prints: `ENVIRONMENT_GATE=PASS`, `snapshot archives found: 129`, the
   submission file list) each appeared **once**, while everything from the child onward
   (`evaluating N task(s)`, `[1/2] <id>`, `vLLM server started`, the LiteLLM warnings) appeared
   **2–3×** — the LiteLLM retry lines 3×, because that logger emits per attempt *and* per duplicate
   stream.
   **Do not conclude "the notebook ran the runner twice"** and do not read "2× `evaluating 2 task(s)`"
   as 4 tasks. Verify against **single-emit markers**: the runner printed `runner exit code: 1`
   exactly once, and the `---` separators appeared as one pair. Count those, not log lines.
   Corollary: **put exactly one unambiguous end-marker in any long-running child** (an exit-code
   line, or a `run_summary.json` written at the end) and read *that* for status; a log's repetition
   is a plumbing artifact, and a "did it finish?" question answered by counting lines is answered
   wrongly.

27. **`kernels_logs()` returns an EMPTY string while a session is still RUNNING, so a live kernel and
   a kernel that never ran look identical.** The persisted log blob only exists once the session
   ends. And the method is **`api.kernels_logs(kernel)`** — there is no
   `api.list_kernel_session_output` on `KaggleApi`; that name is only the internal call site
   (`kaggle_api_extended.py:6694`). To see progress mid-run you need
   **`api.kernels_logs_stream(kernel)`**, which proxies the live SSE feed while the session is up and
   falls back to the persisted blob afterwards. Two further details:
   - **`response.log` is JSON, not text** — a list of `{stream_name, time, data}` records, one per
     line, with newlines escaped. Grep over a raw dump is useless; format it to `[stdout] …` first.
     Drop the per-record trailing `""` from `split("\n")` **per record** — dropping only the last one
     globally inserts a blank line after every line of output.
   - **The SSE endpoint may be blocked by a proxy** (`ProxyError('Unable to connect to proxy',
     RemoteDisconnected(...))` on `/v1/kernels/logs/stream/...`). That is an environment limitation,
     not a bad kernel id. Catch it and fall back to `log` after the run ends; do not let it look like
     a crash.
   Reusable tool built for exactly this: `kaggle-gemma4/kfetch.py` — `log` (inline, no download),
   `files` (list without downloading), `get <regex>` (download only matching files), `stream`.

## Read the competition's own `HARNESS_README.md` before emulating it

Competitions often ship their environment definition in the data. Fetch it directly
rather than inferring from logs:

```bash
kaggle competitions files  -c <competition> --page-size 200 --format csv
kaggle competitions download -c <competition> -f HARNESS_README.md -p <dir>
kaggle competitions download -c <competition> -f docker/Dockerfile.public -p <dir>
```

For gemma4 this gave the whole scored contract: **4 × L4, `tensor_parallel_size=4`,
`gpu_memory_utilization=0.80`, `max_model_len=32768`**, the W4A16 weight footprint
(~4.5 GB/GPU), and the fact that **container setup is excluded from the agent's time
budget**. It also confirmed a prompt fix independently. An emulator that guesses at
these values produces numbers that cannot be compared to the leaderboard.

## The image-Python mismatch (the one that costs a whole run)

**The Kaggle image's default `python3` may not be the interpreter a prebuilt
wheelhouse was compiled for.** In the gemma4 competition the official wheelhouse is
**cp312** while the image's `python3` is **3.13**, so an in-process
`pip install` dies with *"`apache_tvm_ffi-…-cp312-…whl` is not a supported wheel on
this platform"* — inside seconds, before any GPU work.

Rules that follow:

- **Match the wheelhouse's `cpXX` tag to the interpreter.** Check the failing wheel
  name: `cp312-cp312` means CPython 3.12 only. `py3-none-any` and `cp38-abi3` are
  fine on newer Pythons; the rest are not.
- **Never install into `sys.executable` and then import in the same process** if the
  tags do not match. Build a **venv on the matching interpreter** (the gemma4 image
  ships `/usr/bin/python3.12`) and run the work as a **subprocess** from it.
- **A notebook is not a bad home for this.** Keep the notebook as the control panel
  and put the harness in a real `.py` file that the notebook writes out and executes
  with the venv python. That is what `kernel/baseline.ipynb` does, and what
  `kernel-eval/eval_local.ipynb` was rebuilt to do.
- **Generate the notebook; do not hand-edit it.** Embedding a script as a string
  inside `.ipynb` JSON is where the backslash-escape trap bites. A generator with a
  **round-trip assertion** (the embedded literal must evaluate back to the file)
  makes staleness impossible. Verify with a script, not by eye.

## Static checks are not execution (the one that costs the most runs)

A verifier that compiles the notebook, walks its AST, and asserts a string appears is
**not evidence that anything runs**. In this project a green verifier passed three
times while the kernel failed three times in a row — each failure one step further
along:

| Failure | What the verifier had proved |
| :--- | :--- |
| wheelhouse `cp312` vs image `python3` 3.13 | the notebook parses |
| bundle `.zip` glob vs an unpacked dataset | the notebook parses |
| `len(AdapterManifest)` — not a list | the notebook parses, and *a different* code path works |

The fix is to **drive the real code locally up to the first thing that needs the
accelerator**. Most harnesses separate cleanly: imports, config construction, task
loading and sampling need no GPU. Stub only the accelerator boundary.

For the gemma4 eval this is `tests/verify_runner_api.py`:

- load the runner with `importlib`, so its module globals can be patched;
- replace the server-start function with a stub returning a fake server;
- **subclass** the real evaluator (so its `__init__` — and therefore every config
  keyword — still runs) and raise a sentinel `BaseException` from the one method that
  needs a GPU. `except Exception` cannot swallow a `BaseException`, so the sentinel
  proves you reached that line;
- assert the sentinel fired. Anything else means the run died earlier.

That test validates `load_tasks`, the sampler, model discovery, adapter discovery,
`build_submission_limits`, the **entire config keyword set** and the evaluator's
constructor — in about a second, with no GPU.

Corollary: when a task's own checks live in a *different* file from the thing being
run, check the wiring. `validate_directory` + `compile_submission` were real calls
against real packages — they simply were not the calls the runner made.

## Loop

1. **Verify locally before pushing.** Compile the notebook's code cells, run the
   project's verifier, and check the embedded payload matches its source file. If a
   step depends on the shape of an attached dataset, simulate it against a fake
   input tree — that catches a wrong glob for free. If any code will run on the
   remote host, drive it locally up to the accelerator boundary first.
2. Push. **Confirm the version number incremented** — a push that silently no-ops
   looks identical to success.
3. Poll `kernels status`. `RUNNING` → `COMPLETE` / `ERROR`.
4. On `ERROR`, **fetch the log first** (`kernels output`) and read the traceback
   before changing anything. The failing cell number is in it.
5. Score/fetch locally from the downloaded artifacts.

## Discipline

- **One factor per run.** A confounded day is a wasted measurement.
- **Smoke-test small first** (2–3 items) — but note the setup cost is fixed, so the
  smoke test earns its keep by failing *early and cheaply*, not by being fast.
- **State the power limit** rather than reading a small-N difference as signal.
- **A notebook run is not the scored run.** Different hardware and image; report it
  as diagnosis, never as a predicted score.
- **Re-verify a downloaded artifact** against its logged numbers before trusting it.
