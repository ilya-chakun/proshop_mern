#!/usr/bin/env bash
# stress_test_wf1.sh — Stress test for WF1 webhook (10+ rapid requests)
#
# Usage:
#   ./stress_test_wf1.sh
#   ./stress_test_wf1.sh --include-invalid
#
# API key is read from frontend/.env (REACT_APP_N8N_API_KEY=...)
# Override with env: N8N_API_KEY=xxx ./stress_test_wf1.sh
#
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../../.." && pwd)"
FRONTEND_ENV="${PROJECT_ROOT}/frontend/.env"

# Read API key from frontend/.env if not set
if [[ -z "${N8N_API_KEY:-}" ]] && [[ -f "$FRONTEND_ENV" ]]; then
  N8N_API_KEY=$(grep '^REACT_APP_N8N_API_KEY=' "$FRONTEND_ENV" | cut -d= -f2-)
fi

if [[ -z "${N8N_API_KEY:-}" ]]; then
  echo "Error: API key not found."
  echo "Set N8N_API_KEY env var or add REACT_APP_N8N_API_KEY to frontend/.env"
  exit 1
fi

WEBHOOK_URL="${N8N_WEBHOOK_URL:-http://localhost:5678/webhook}"
DURATION=25
INTERVAL=2
EXTRA_FLAGS=""

if [[ "${1:-}" == "--include-invalid" ]]; then
  EXTRA_FLAGS="--include-invalid"
fi

echo "=== WF1 Stress Test ==="
echo "Webhook: ${WEBHOOK_URL}/feature-control"
echo "Duration: ${DURATION}s, Interval: ${INTERVAL}s"
echo "Include invalid: ${EXTRA_FLAGS:-no}"
echo ""

python3 "${SCRIPT_DIR}/simulate_wf1.py" \
  --webhook-url "$WEBHOOK_URL" \
  --api-key "$N8N_API_KEY" \
  --feature-id search_v2 \
  --duration "$DURATION" \
  --interval "$INTERVAL" \
  $EXTRA_FLAGS

echo ""
echo "=== Stress test complete ==="
