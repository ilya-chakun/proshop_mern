# Notes: wf1-halucinations.mov

**Duration:** ~93s (1 min 33s)  
**Resolution:** 3024×1964  
**Type:** Demo of hallucination guard / invalid input handling in WF1

## Scenes Observed (from frame extraction)

### 1. Simulator with --include-invalid Flag
- Terminal showing `simulate_wf1.py --include-invalid` running
- Every ~7th request sends traffic_percentage = -50 (invalid negative value)
- HTTP responses visible — 4xx errors or structured error messages

### 2. n8n WF1 — Switch Node Fallback Branch
- Shows the Switch node routing invalid/unknown actions to fallback
- Fallback path leads to error response node
- Demonstrates that hallucinated actions don't reach the API

### 3. AI Agent Handling Invalid Requests
- AI Agent receives an ambiguous or invalid request
- Agent's reasoning visible in execution data (Verbose mode)
- Agent correctly refuses to execute invalid traffic values
- Returns structured error: "Invalid traffic_percentage: must be 0-100"

### 4. Execution Results Comparison
- Side-by-side or sequential view of:
  - Valid request → successful execution → 200 response
  - Invalid request → caught by guard → error response
- No actual API calls made for invalid inputs

## Key Takeaways
- Hallucination guard is a key differentiator — shows robustness
- The `--include-invalid` flag is purpose-built for this demo
- Important to show both the REJECTION and the REASON in the screencast
- ~1.5 min focused segment — good pacing for this topic
