#!/usr/bin/env bash
# stress_test_wf1.sh — Stress test for WF1 webhook (10+ rapid requests)
#
# Usage:
#   ./stress_test_wf1.sh
#   ./stress_test_wf1.sh --include-invalid
#
# Requires: python3, requests package, running n8n with WF1 active
#
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
WEBHOOK_URL="${N8N_WEBHOOK_URL:-http://localhost:5678/webhook}"
API_KEY="${N8N_API_KEY:-532b6cc84bc4f2c4ff54b676baa3b209ab6eccb12c539a5dc25130d15e0d751c}"
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
  --api-key "$API_KEY" \
  --feature-id search_v2 \
  --duration "$DURATION" \
  --interval "$INTERVAL" \
  $EXTRA_FLAGS

echo ""
echo "=== Stress test complete ==="
