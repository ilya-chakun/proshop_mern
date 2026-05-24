# Notes: wf1-stress-test-reload-UI-after-n8n-changed.mov

**Duration:** ~54s (54 seconds)  
**Resolution:** 3024×1964  
**Type:** Stress test + UI live reload after n8n workflow modifies feature state

## Scenes Observed (from frame extraction)

### 1. Initial Dashboard State
- Admin panel showing feature flags in their current state
- e.g., `search_v2` at status=Testing, traffic=15%

### 2. Stress Test — Rapid Requests
- Terminal running simulator with short interval (rapid-fire requests)
- Multiple webhook calls in quick succession
- n8n processing them — some queued, all handled

### 3. n8n Modifies Feature State
- One of the workflow executions changes feature state via API
- e.g., rollout to 50%, or rollback to 0%
- Execution completes successfully

### 4. Browser UI Reload
- Return to admin panel in browser
- Page refreshed (F5 or auto-poll)
- Feature flag status NOW reflects the change made by n8n
- Visual confirmation: badge color changed, traffic % updated

## Key Takeaways
- Demonstrates the full loop: n8n changes state → UI reflects it
- Shows system handles rapid concurrent requests without breaking
- Short video (54s) — focused on one specific scenario
- Important proof that the backend API is the single source of truth
- Dashboard reads from the same `features.json` that n8n writes to via API
