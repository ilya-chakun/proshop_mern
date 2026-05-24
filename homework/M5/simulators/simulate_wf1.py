#!/usr/bin/env python3
"""
simulate_wf1.py — dispatcher for WF1 manual trigger workflow.

Usage:
    python3 simulate_wf1.py --webhook-url http://localhost:5678/webhook --api-key XXX
    python3 simulate_wf1.py ... --duration 120 --interval 10
    python3 simulate_wf1.py ... --include-invalid
"""

import argparse, json, math, os, sys, time
from datetime import datetime
import requests

def run(webhook_url, api_key, feature_id, duration, interval, include_invalid):
    start = time.time()
    headers = {"Content-Type": "application/json", "X-API-Key": api_key}
    actions_cycle = ["check", "test", "rollout", "check", "rollback", "check"]
    iteration = 0

    while time.time() - start < duration:
        t = time.time() - start
        traffic_percentage = int(50 + 40 * math.sin(2 * math.pi * t / 60))
        action = actions_cycle[iteration % len(actions_cycle)]

        payload = {"feature_id": feature_id, "action": action}
        if action == "rollout":
            payload["traffic_percentage"] = traffic_percentage
        elif action in ("test", "rollback"):
            payload["target_state"] = "Testing" if action == "test" else "Disabled"

        if include_invalid and iteration > 0 and iteration % 7 == 0:
            payload["traffic_percentage"] = -50
            payload["action"] = "rollout"
            print(f"[{datetime.now().isoformat()}] [INVALID test] payload={payload}")
        else:
            print(f"[{datetime.now().isoformat()}] action={action} payload={payload}")

        try:
            r = requests.post(f"{webhook_url}/feature-control", headers=headers, json=payload, timeout=30)
            data = r.json() if r.headers.get("content-type", "").startswith("application/json") else {"raw": r.text}
            print(f"  → status={r.status_code} success={data.get('success')} message={data.get('message')}")
        except requests.exceptions.RequestException as e:
            print(f"  → network error: {e}", file=sys.stderr)

        iteration += 1
        time.sleep(interval)

def main():
    p = argparse.ArgumentParser(description="WF1 dispatcher simulator")
    p.add_argument("--webhook-url", required=True)
    p.add_argument("--api-key", default=os.environ.get("N8N_API_KEY", ""))
    p.add_argument("--feature-id", default="search_v2")
    p.add_argument("--duration", type=float, default=120)
    p.add_argument("--interval", type=float, default=10)
    p.add_argument("--include-invalid", action="store_true")
    args = p.parse_args()

    if not args.api_key:
        sys.exit("X-API-Key not set: use --api-key or env N8N_API_KEY")

    print(f"Starting simulate_wf1.py — duration={args.duration}s, interval={args.interval}s")
    run(args.webhook_url, args.api_key, args.feature_id, args.duration, args.interval, args.include_invalid)
    print("---\nDone.")

if __name__ == "__main__":
    main()
