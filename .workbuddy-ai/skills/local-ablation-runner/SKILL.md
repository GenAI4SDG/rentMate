---
name: local-ablation-runner
description: Run a bounded, one-factor-at-a-time ablation on a local CPU experiment harness without losing results to tool timeouts. Use when the user approves a multi-config experiment (e.g. "run these N variants across seeds") on this machine, especially for the AI_prgm DoorKey/MiniGrid harness. Covers parameterising the variant axis, the ~10-minute command batching rule, background-launch pitfalls on Windows, the guard_run.py wall-clock/stall wrapper, the torch single-thread rule for policy evaluation, the Kaggle handoff (including the Windows-illegal-filename trap), and the map-disjoint evaluation discipline.
agent_created: true
---

# Local ablation runner

Run a multi-config experiment locally, one factor at a time, without losing data to
timeouts or reaped background processes.

## When to use

- The user approves an ablation with 2+ configurations across multiple seeds.
- The work is a **directional screen**, not a final result.
- Compute is local CPU and each config takes minutes.

## Hard constraints (learned the hard way)

1. **One config per command, ≤ ~10 minutes each.** The Bash tool kills long runs.
   A useful calibration for `cap_test.py` on this machine:
   `--updates 60 --eval-every 5 --seeds 0 1 2` ≈ **10 minutes per config**.
   If a single config would exceed ~9 minutes, split by seed instead.
2. **Detached processes get reaped.** `setsid nohup ... &`, `disown`, and plain
   `nohup ... &` all died — no Python process survived the tool call.
   Do NOT rely on them. Use the Bash tool's own `run_in_background: true` and wait
   with `TaskOutput`, one config at a time.
3. **`rm -rf` on a locked output dir silently fails on Windows.** If a previous run
   is still holding files, `ls` will still show the old directory. Move it aside
   (`mv outputs/X outputs/X_aborted`) instead, or use a fresh output path.
4. **Always smoke-test first** (<5 min) before the real run, per project convention.
5. **Call `torch.set_num_threads(1)` (+ `set_num_interop_threads(1)`) before any script
   that evaluates a loaded policy.** Measured: with default threading, replaying a
   453→64→7 MLP over ~5k episodes ran **3.6 h without finishing**; single-threaded the
   identical job completes in **5 min** (~27x). Torch's inter-op pool dominates the cost
   at this tensor size. This bites *evaluation*, not training (training already sets it).
6. **Never pipe a long background run through `tail`** — it buffers and you see nothing
   until the process exits. Redirect to a file (`> out.txt 2>&1`) and read the file, so
   partial progress is visible if the run is killed.
7. **Wrap every background run in `scripts/guard_run.py`.** A background task only
   notifies on *completion*, so a hung or pathological job never reports back — one ran
   3.6 h for work that takes 5 min. The guard kills on a wall-clock cap and on a
   no-output stall, and prints a heartbeat so progress is answerable without waiting:
   ```bash
   python <skill>/scripts/guard_run.py --expected 5m --hard 15m --stall 5m \
     --log outputs/run_<key>.log -- \
     .venv/Scripts/python.exe cap_test.py --updates 60 ... --configs <one-key>
   ```
   Exit codes: `0` ok, `124` wall-clock exceeded, `125` stalled. **Set `--expected` to
   your honest estimate and `--hard` to ~2–3x it** — if `--expected` is wrong the guard
   still bounds the damage, and the warning tells you the estimate was bad.
8. **Verify a background job actually started — but NOT via a process listing.** Observed
   2026-10-07: a `run_in_background` launch reported `Status: running` for 1m17s while
   nothing had spawned — the `--log` file stayed at 0 bytes and no run directory was
   created. On a later launch the job was genuinely running while
   `Get-CimInstance Win32_Process | Where-Object { $_.Name -like '*python*' }` returned
   **empty** — the sandbox hides its child processes from that query. **A process listing
   is therefore not a reliable liveness signal in either direction; do not use it to
   decide.** The reliable signal is the output file:
   ```bash
   # after ~60s, the log must be non-empty and its size must grow
   ls -la outputs/<run>/<run>.log && sleep 20 && ls -la outputs/<run>/<run>.log
   ```
   Use the guard's `--log` (always pass it) or redirect stdout to a file. If it is still
   0 bytes after a minute, the job did not start: kill the task and **run in the
   foreground** with `-u` (unbuffered) and output redirected to a file.
9. **Prefer foreground for anything under ~20 minutes.** A short job does not need
   backgrounding at all; foreground gives you the exit code, the output, and no orphan
   state. Background only jobs that genuinely exceed the foreground timeout — and for
   those, the log file is your only live view (6, 8), so check it once rather than
   polling the task repeatedly.
10. **One run per process for multi-seed batches.** Observed 2026-10-07: a single process
   doing 6 runs (2 configs × 3 seeds, 200 updates each) completed 4 then **froze for 17
   minutes on one update** after ~900 checkpoint files (~316 MB) had accumulated. The
   guard's no-output detector fired and killed it — correctly, but the batch lost its 5th
   and 6th runs. Launch each `(config, seed)` as its own guarded process:
   ```bash
   # sequential, but independent: a stall costs one run, not the batch
   guard_run.py ... -- python -u cap_test.py --seeds 2 --configs A > a.txt 2>&1
   guard_run.py ... -- python -u cap_test.py --seeds 2 --configs B > b.txt 2>&1
   ```
   Independent processes also start with fresh memory and a fresh checkpoint directory.
11. **To tell a real freeze from a guard misfire, compare output-file mtimes.** A `--stall`
   kill is only evidence of a hang if the artifacts stopped being written. Check the last
   few checkpoint/output files:
   ```bash
   ls -lt --time-style='+%H:%M:%S' outputs/<run>/checkpoints/ | head -8
   ```
   In the 2026-10-07 case, checkpoints sat at `13:02:37`, `13:02:41`, then `13:19:48` —
   a 17-minute gap between two updates that normally take 4 s. That proved the freeze was
   real, rather than the guard misreading a buffered pipe. **Do this before blaming the
   guard or the harness.**
12. **Size `--hard` from the SLOWEST arm, not a representative one.** Observed 2026-10-07:
   two configs ran on the same env and split, but one pinned the episode step limit while
   the other solved quickly and terminated early — so the slow arm consumed **~10.2k env
   steps per update against the fast arm's ~2.4k**, a 4x difference that is a property of
   the config, not of noise. A `--hard 40m` cap calibrated on the fast arm killed the slow
   arm at u194/200 and *looked* like a hang. Two habits follow:
   - Estimate the cap from the **per-update env-step count**, not from wall-clock of a
     single pilot run. If `environment_steps_update` differs between arms, the caps must
     differ too.
   - When a run is killed near the end, **a truncated run is still a result.** Before
     re-running, check whether the diagnostic curve already answers the question: if the
     arm sat at 0.000 on 38/38 scheduled evaluations, a completed run would only have
     converted it into a recorded null. Report the row as **diagnostic-only / truncated**
     and say why — do not silently drop it, and do not report it as if complete.
   - Corollary for the *adverse* arm: a null is cheap to accept and expensive to
     re-derive. A *positive* arm must always be run to completion.

## Procedure

1. **Parameterise the axis.** Make the thing you are ablating a constructor/kwarg
   argument threaded from the config dict, with defaults reproducing current behaviour.
   Verify defaults are unchanged before running anything:
   ```bash
   .venv/Scripts/python.exe -c "
   import gymnasium as gym, minigrid
   from harness_ppo_v2 import ShapedRewardWrapper
   e = ShapedRewardWrapper(gym.make('MiniGrid-DoorKey-8x8-v0'))
   assert (e.step_penalty, e.distance_coefficient) == (-0.01, 0.05)"
   ```

2. **Add named configs, one factor changed each.** Put them in the harness's config
   dict (e.g. `all_configs` in `cap_test.py`). Do not merge two changes into one
   config — the whole point is attribution.

3. **Remove any hardcoded `choices=[...]` on the config CLI flag** and replace it with
   an explicit unknown-key error, or the new configs will be rejected by argparse.

4. **Smoke, then run each config in its own background command** (wrapped in the guard
   from constraint 7, so a runaway is killed instead of silently burning hours):
   ```
   Bash(run_in_background=true):
   cd _ALL_NEW && ../.venv/Scripts/python.exe <skill>/scripts/guard_run.py \
     --expected 10m --hard 25m --stall 5m --log outputs/run_<key>.log -- \
     ../.venv/Scripts/python.exe cap_test.py \
     --updates 60 --eval 16 --eval-every 5 --final-eval 16 \
     --discovery-seeds 500 --seeds 0 1 2 --split-seed 0 \
     --configs <one-key> --threads 1 --output-dir outputs/<study>
   ```
   Then `TaskOutput(task_id)` and wait. Launch the next config only after the
   previous returns.

5. **Analyse per seed, both halves.** Always report: final-eval solve by seed,
   diagnostic solve first→second half, and the mechanism metric (e.g.
   `door_open_fraction`). A single aggregate mean hides non-reproduction.

6. **Write a consolidated JSON summary** next to the runs so the result survives
   without re-parsing every JSONL.

## Reporting discipline

- Compare against the **matched random baseline** on the same map set. Being below
  random is a real outcome and must be stated.
- State the power limit: 16-map evaluations give a 95% CI of roughly ±0.25, so
  differences under ~0.15 between configs are not resolvable.
- Call it a screen unless seeds reproduce the effect. Small-N wins are directional.
- A falsified hypothesis is a result. Record it with the same weight as a confirmed one,
  and record *why* it failed.

## Reading the JSONL

Records are typed: `run_metadata`, `checkpoint`, `final_evaluation`, `run_summary`.
Use `record_type` (not `type`). Metrics live on `checkpoint` records; `final_evaluation`
carries `used_for_selection` — if that is ever true, the run is contaminated.

`run_metadata` is the authority for the map pools (`train_map_seeds`,
`diagnostic_eval_map_seeds`, `final_eval_map_seeds`) and the logged random baseline.
Use those exact seeds to compute a matched baseline locally — do not assume a pool.

## Kaggle handoff (when a run is too big for local CPU)

- Package as a **script kernel**; the CLI uploads only the configured `code_file`, so
  embed companion modules as a base64 ZIP and materialise them at runtime.
- The user must push with their own logged-in CLI. After it completes:
  `kaggle kernels status <id>`, then `kaggle kernels output <id> -p <dir>`.
- **Do not put `:` in a config name.** Checkpoint filenames embed the config name, and
  `kaggle kernels output` writes the raw name via `os.path.join(dir, raw_name)`. On
  Windows a `:` is illegal, so **every checkpoint silently becomes a 0-byte stub**
  truncated at the colon while `diagnostics.jsonl` and the log download fine. Symptom:
  a `checkpoints/` dir containing one 0-byte file whose name stops mid-word.
  Fix for existing runs: fetch through the API and sanitise the local name
  (`fetch_checkpoints.py` pattern — `ApiListKernelSessionOutputRequest` + `requests.get(item.url)`).
  Fix for future runs: no colons in config names.
- Kaggle installs `minigrid` fresh; do **not** force `gymnasium` to the local version
  (minigrid 3.1.0 accepts `gymnasium>=0.28.1`, so leave Kaggle's preinstalled one alone).

## Verifying a downloaded checkpoint actually loaded

Re-run the harness's own evaluation function on the checkpoint and check it reproduces
the logged numbers (e.g. `final_eval_solve`). If the exact re-run disagrees with the
JSONL, the load is wrong — do not proceed to new measurements on it.
