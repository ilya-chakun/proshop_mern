# Notes: wf1-autopilots-components.mov

**Duration:** ~91s (1 min 31s)  
**Resolution:** 3024×1964  
**Type:** Focused demo of WF1 AI Agent "autopilot" sub-components

## Scenes Observed (from frame extraction)

### 1. n8n WF1 Canvas — Full View
- Workflow open in n8n editor showing all nodes
- Webhook → Switch node with 4 rule branches + fallback
- Each branch leads to HTTP Request nodes (check/test/rollout/rollback)
- AI Agent node connected to fallback/complex actions

### 2. AI Agent Node — Expanded Sub-nodes
- AI Agent node clicked open showing connected sub-nodes:
  - **AI Language Model** (Anthropic Claude) — the LLM provider
  - **Window Buffer Memory** — conversation memory with sessionKey
  - **AI Tool** nodes — HTTP Request tools for feature flag API
  - **AI Output Parser** — structured output parsing
- Each sub-node has its own configuration panel

### 3. Sub-node Configuration Details
- Language Model: model selection, temperature, max tokens
- Memory: session key set to `{{ $json.feature_id }}`
- Tools: configured with API endpoints and authentication headers
- Output Parser: JSON schema for structured responses

### 4. Execution Flow Demonstration
- Shows a test execution flowing through the AI Agent path
- Intermediate steps visible (Verbose mode enabled)
- AI reasoning visible in execution data

## Key Takeaways
- This video focuses specifically on the AI Agent architecture
- Good reference for how to present the "autopilot" components
- Shows the importance of explaining each sub-node's role
- 1.5 min — could be one segment of our larger screencast
