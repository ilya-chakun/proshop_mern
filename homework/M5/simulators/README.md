# Simulators & Stress Tests

## Files

| File | Description |
|------|-------------|
| `simulate_wf1.py` | WF1 dispatcher — sends webhook requests with sine-wave traffic % |
| `simulate_wf2.py` | WF2 log generator — writes events to `logs.json` with sine error rate |
| `stress_test_wf1.sh` | Stress test wrapper — 10+ rapid requests in 25s |

## Prerequisites

- Python 3.10+ with `requests`: `pip install requests`
- n8n running at `http://localhost:5678` with WF1 active
- Backend running at `http://localhost:5001`

## WF1 Simulator

```bash
# Basic run (2 min, 10s interval, check→test→rollout→rollback cycle)
python3 simulate_wf1.py \
  --webhook-url http://localhost:5678/webhook \
  --api-key <your-key> \
  --duration 120 --interval 10

# With hallucination test (every 7th request sends traffic_percentage=-50)
python3 simulate_wf1.py \
  --webhook-url http://localhost:5678/webhook \
  --api-key <your-key> \
  --include-invalid

# Full options
python3 simulate_wf1.py --help
```

## WF2 Simulator

```bash
# Default (30 min, sine period 5 min, 5 rps)
python3 simulate_wf2.py --output ../data/logs.json

# Quick test (10 min, sine period 2 min — faster toggle cycle)
python3 simulate_wf2.py --output ../data/logs.json --duration 600 --period 120

# Full options
python3 simulate_wf2.py --help
```

## Stress Test

One command, no arguments needed (API key and URL are built-in defaults):

```bash
./stress_test_wf1.sh
```

With hallucination payloads (`traffic_percentage=-50`):

```bash
./stress_test_wf1.sh --include-invalid
```

### Expected results

- All valid requests → **200 OK** (~6-8s each, AI Agent reasoning time)
- Invalid requests (-50) → **400** `{"success":false,"rejected_at":"input-validation"}`
- No 500 errors, no timeouts
- ~4-5 requests processed per 25s window (sequential, n8n waits for AI Agent)
