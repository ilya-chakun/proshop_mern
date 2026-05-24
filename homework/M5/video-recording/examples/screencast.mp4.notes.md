# Notes: screencast.mp4 .mov

**Duration:** ~191s (3 min 11s)  
**Resolution:** 3638×2226  
**Type:** Full end-to-end demo — the "gold standard" reference screencast

## Scenes Observed (from frame extraction)

### 1. Admin Panel — Feature Flags Dashboard
- Browser shows ProShop admin panel with a dedicated **Features** page
- Table lists feature flags with columns: Name, Status (badge), Traffic %, Actions
- Status badges are color-coded (green=Enabled, yellow=Testing, red=Disabled)
- Action buttons: Toggle, Edit traffic %, details

### 2. n8n Workflow Canvas
- Shows WF1 (manual webhook) open in n8n editor
- Visible nodes: Webhook → Switch → multiple branches (check/test/rollout/rollback)
- AI Agent node expanded with sub-nodes (LLM, Memory, Tools)
- Green checkmarks on successfully executed nodes

### 3. n8n Executions List
- Executions tab showing recent WF1 and WF2 runs
- Each execution shows status (Success/Error), duration, timestamp
- Clicking into an execution shows the data flow through nodes

### 4. Telegram Alerts
- Telegram Web or mobile app showing bot messages
- Messages contain feature status updates: "Feature search_v2 deactivated due to high error rate"
- Re-enable confirmation messages visible
- Formatted with emojis and structured text

### 5. Simulator Running (Terminal)
- Terminal window showing `simulate_wf1.py` or `simulate_wf2.py` output
- HTTP responses visible (200 OK, action results)
- Sine-wave traffic pattern cycling through actions

### 6. Dashboard Status Updated
- Return to admin panel showing updated feature flag states
- Status changed after WF2 intervention (e.g., Disabled after error detection)

## Key Takeaways
- This is the most comprehensive example — covers ALL required scenes
- Shows the full cycle: Dashboard → Simulator → n8n → Telegram → Dashboard
- ~3 min duration is within the 3–5 min target
- High resolution suggests screen recording tool (not Playwright headless)
