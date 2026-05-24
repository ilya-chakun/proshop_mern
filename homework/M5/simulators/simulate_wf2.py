#!/usr/bin/env python3
"""
simulate_wf2.py — log generator with sine-wave error rate.

Usage:
    python3 simulate_wf2.py --output logs.json --duration 1800 --period 300
    python3 simulate_wf2.py ... --rps 5 --amplitude 0.10 --baseline 0.05
"""

import argparse, json, math, random, sys, time
from datetime import datetime, timezone
from pathlib import Path

def sine_error_rate(t, period, amplitude, baseline):
    raw = baseline + amplitude * math.sin(2 * math.pi * t / period)
    return max(0.0, min(1.0, raw))

def run(output_path, feature_id, duration, rps, period, amplitude, baseline):
    if not output_path.exists():
        output_path.write_text("[]")
    start = time.time()
    interval = 1.0 / rps

    while time.time() - start < duration:
        t = time.time() - start
        rate = sine_error_rate(t, period, amplitude, baseline)
        status = "error" if random.random() < rate else "success"

        event = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "feature_id": feature_id,
            "status": status,
            "error_rate_now": round(rate, 3),
        }

        try:
            existing = json.loads(output_path.read_text())
        except (json.JSONDecodeError, FileNotFoundError):
            existing = []
        existing.append(event)
        if len(existing) > 10_000:
            existing = existing[-10_000:]
        output_path.write_text(json.dumps(existing, ensure_ascii=False, indent=None))

        if int(t) % 5 == 0 and int(t * rps) % int(rps * 5) == 0:
            print(f"t={int(t)}s rate={rate:.1%} status={status} total_events={len(existing)}")
        time.sleep(interval)

def main():
    p = argparse.ArgumentParser(description="WF2 log generator (sine error rate)")
    p.add_argument("--output", default="logs.json")
    p.add_argument("--feature-id", default="search_v2")
    p.add_argument("--duration", type=float, default=1800)
    p.add_argument("--rps", type=float, default=5)
    p.add_argument("--period", type=float, default=300)
    p.add_argument("--amplitude", type=float, default=0.10)
    p.add_argument("--baseline", type=float, default=0.05)
    args = p.parse_args()

    print(f"simulate_wf2.py — duration={args.duration}s, rps={args.rps}, period={args.period}s")
    print(f"sine: baseline={args.baseline:.1%}, amplitude={args.amplitude:.1%}")
    print(f"Threshold WF2 = 5% — feature toggles approximately every {args.period/2:.0f}s")
    run(Path(args.output), args.feature_id, args.duration, args.rps, args.period, args.amplitude, args.baseline)

if __name__ == "__main__":
    main()
