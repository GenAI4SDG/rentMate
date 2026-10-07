#!/usr/bin/env python3
"""guard_run.py — run a command with a wall-clock cap and a stall detector.

WHY THIS EXISTS
    A "5-minute" job that actually runs for hours is invisible: a background task only
    notifies on *completion*, so a hung or pathological run never reports back and
    silently burns hours (measured once: 3.6 h for a job that takes 5 min when
    correctly threaded). This wrapper makes the failure loud and bounded.

WHAT IT ENFORCES
    1. --hard      absolute wall-clock limit; the process is killed when exceeded.
    2. --stall     if no new output appears for this long, the process is killed.
    3. --expected  informational; prints a loud warning once the run passes it.
    Plus a periodic heartbeat with elapsed time, so "is it progressing?" is answerable
    without waiting for the end.

USAGE
    python guard_run.py --expected 5m --hard 15m --stall 3m -- python train.py --args

    # defaults: --expected 5m --hard 15m --stall 5m --heartbeat 30s
    python guard_run.py -- python train.py

    # log to a file as well (always recommended for long runs)
    python guard_run.py --log run.log -- python train.py

EXIT CODES
    0    command finished within all limits
    124  killed: wall-clock limit (--hard) exceeded
    125  killed: no output for --stall seconds
    else the command's own exit code
"""
from __future__ import annotations

import argparse
import os
import re
import subprocess
import sys
import threading
import time

_DUR = re.compile(r"(\d+(?:\.\d+)?)\s*([smhd]?)", re.I)
_UNITS = {"": 1, "s": 1, "m": 60, "h": 3600, "d": 86400}


def parse_duration(text: str) -> float:
    """'90' / '90s' / '5m' / '1h30m' -> seconds."""
    total = 0.0
    pos = 0
    for m in _DUR.finditer(text):
        if m.start() != pos:
            raise argparse.ArgumentTypeError(f"cannot parse duration {text!r}")
        total += float(m.group(1)) * _UNITS[m.group(2).lower()]
        pos = m.end()
    if pos != len(text) or total <= 0:
        raise argparse.ArgumentTypeError(f"cannot parse duration {text!r}")
    return total


def fmt(seconds: float) -> str:
    seconds = int(seconds)
    if seconds < 60:
        return f"{seconds}s"
    if seconds < 3600:
        return f"{seconds // 60}m{seconds % 60:02d}s"
    return f"{seconds // 3600}h{(seconds % 3600) // 60:02d}m"


def kill_tree(proc: subprocess.Popen) -> None:
    """Kill the process and its children (Windows needs taskkill /T)."""
    if proc.poll() is not None:
        return
    try:
        if os.name == "nt":
            subprocess.run(["taskkill", "/F", "/T", "/PID", str(proc.pid)],
                           capture_output=True, check=False)
        else:
            proc.terminate()
            try:
                proc.wait(timeout=5)
            except subprocess.TimeoutExpired:
                proc.kill()
    except Exception:
        try:
            proc.kill()
        except Exception:
            pass


def main() -> int:
    ap = argparse.ArgumentParser(description="Run a command under time and stall limits.")
    ap.add_argument("--expected", type=parse_duration, default=parse_duration("5m"),
                    help="informational: warn once elapsed exceeds this (default 5m)")
    ap.add_argument("--hard", type=parse_duration, default=parse_duration("15m"),
                    help="kill after this wall-clock time (default 15m)")
    ap.add_argument("--stall", type=parse_duration, default=parse_duration("5m"),
                    help="kill if no output for this long (default 5m)")
    ap.add_argument("--heartbeat", type=parse_duration, default=parse_duration("30s"),
                    help="how often to print an elapsed-time heartbeat (default 30s)")
    ap.add_argument("--log", default=None, help="also append output to this file")
    ap.add_argument("command", nargs=argparse.REMAINDER,
                    help="-- <command> [args...]")
    args = ap.parse_args()

    command = args.command
    if command and command[0] == "--":
        command = command[1:]
    if not command:
        ap.error("no command given; use: guard_run.py [opts] -- <command> [args...]")

    log_fh = open(args.log, "a", encoding="utf-8", buffering=1) if args.log else None
    state = {"last_output": time.time(), "lines": 0}
    lock = threading.Lock()

    print(f"[guard] expected {fmt(args.expected)} | hard {fmt(args.hard)} | "
          f"stall {fmt(args.stall)}", flush=True)
    print(f"[guard] command: {' '.join(command)}", flush=True)

    started = time.time()
    proc = subprocess.Popen(command, stdout=subprocess.PIPE,
                            stderr=subprocess.STDOUT, bufsize=1,
                            text=True, encoding="utf-8", errors="replace")

    def pump() -> None:
        assert proc.stdout is not None
        for line in proc.stdout:
            with lock:
                state["last_output"] = time.time()
                state["lines"] += 1
            sys.stdout.write(line)
            sys.stdout.flush()
            if log_fh:
                log_fh.write(line)

    reader = threading.Thread(target=pump, daemon=True)
    reader.start()

    verdict = None
    warned = False
    next_beat = started + args.heartbeat

    while True:
        rc = proc.poll()
        if rc is not None:
            break
        now = time.time()
        elapsed = now - started
        with lock:
            since_output = now - state["last_output"]
            lines = state["lines"]

        if elapsed > args.hard:
            verdict = (124, f"wall-clock limit {fmt(args.hard)} exceeded")
            break
        if since_output > args.stall:
            verdict = (125, f"no output for {fmt(args.stall)} "
                            f"(last line was {lines} lines in)")
            break
        if not warned and elapsed > args.expected:
            warned = True
            print(f"[guard] WARNING: passed the expected {fmt(args.expected)} "
                  f"(elapsed {fmt(elapsed)}) — is this job actually progressing?",
                  flush=True)
        if now >= next_beat:
            next_beat = now + args.heartbeat
            print(f"[guard] elapsed {fmt(elapsed)} | {lines} output lines | "
                  f"last output {fmt(since_output)} ago", flush=True)
        time.sleep(0.25)

    elapsed = time.time() - started

    if verdict is not None:
        code, why = verdict
        print(f"\n[guard] KILLING after {fmt(elapsed)}: {why}", flush=True)
        kill_tree(proc)
        reader.join(timeout=5)
        print(f"[guard] exited {code}", flush=True)
        if log_fh:
            log_fh.close()
        return code

    reader.join(timeout=10)
    rc = proc.wait()
    print(f"\n[guard] finished in {fmt(elapsed)} with exit code {rc}", flush=True)
    if log_fh:
        log_fh.close()
    return rc


if __name__ == "__main__":
    sys.exit(main())
