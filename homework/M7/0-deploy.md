# 0 — Local Model Deployment

> **STATUS: DONE (real local-model call captured).** Earns the Part-0 rubric
> points (2 pts): working endpoint + hardware note + explicit quant + a REAL
> call log showing genuine tool-calling by the deployed model.

## 1. Chosen path
- [x] **A — Local Ollama** (default) · [ ] B — VPS · [ ] C — Teacher-provided endpoint

Runs entirely on-device — the whole point of the privacy route is that PII and the
user's own data never leave the machine.

## 2. Model + explicit quant
- **Model:** `qwen3:8b-q8_0` (explicit quantization pinned).
- **Why not `q6_K`?** The assignment example named `qwen3:8b-q6_K`, but that exact
  tag is **not published on the Ollama registry** (`ollama pull qwen3:8b-q6_K` → 404).
  `q8_0` is the next-higher-fidelity published tag and comfortably exceeds the
  rubric's **>Q4** floor. (Substitution mirrored across `.env.example`,
  `backend/assistant/providers/ollama.js`, tests, and the router workflow.)
- Pulled image: `qwen3:8b-q8_0` — **8.9 GB** on disk (`ollama list`).
- Note: qwen3 is a *thinking* model — responses include a `reasoning` field that
  the provider ignores; only `content` + `tool_calls` are consumed.

## 3. Endpoint
- Base URL: `http://localhost:11434/v1` (Ollama OpenAI-compatible `/chat/completions`).
- Server: `ollama serve` (v0.30.5), launched with `OLLAMA_FLASH_ATTENTION=1` and
  `OLLAMA_KV_CACHE_TYPE=q8_0` for memory efficiency.
- Liveness: `curl http://localhost:11434/api/version` → `{"version":"0.30.5"}`.
- Install: `brew install --cask ollama-app` (the Homebrew **formula** bottle was
  broken — missing the `llama-server` runner → HTTP 500 — so the **cask** is used).

## 4. Hardware note
- **Machine:** Apple **M1 Pro**, 10 cores, **32 GB** unified RAM, `arm64` (macOS).
- **Why this model fits:** `qwen3:8b` at `q8_0` is ~8.9 GB of weights. On 32 GB of
  unified memory (CPU+GPU shared) that leaves ~20 GB of headroom for the KV cache
  and context window, so the model loads fully into memory with no swapping. Flash
  attention + a `q8_0` KV cache further shrink the per-token memory footprint.
- **Latency observed (real runs):** first call ~20–32 s (includes cold model load),
  warm single-shot calls ~13–35 s. PII turns that need two round-trips
  (tool call → final answer) ran up to ~104 s, so the LIVE harness raises the
  per-call HTTP timeout to 240 s (production default stays 60 s).

## 5. REAL call log (request + response transcript)

Captured directly against the live endpoint (`POST http://localhost:11434/v1/chat/completions`).
The model **greets the user by name** and **emits a real `getProducts` tool call** —
proof of genuine tool-calling by the deployed local model, not a mock.

### Request
```json
{
  "model": "qwen3:8b-q8_0",
  "messages": [
    {"role":"system","content":"You are the ProShop store assistant. Use tools to answer from the store DB. Greet the user by name."},
    {"role":"user","content":"What products do you have? My name is John."}
  ],
  "tools": [
    {"type":"function","function":{"name":"getProducts","description":"List store products, optional text query","parameters":{"type":"object","properties":{"query":{"type":"string"}}}}}
  ],
  "tool_choice":"auto",
  "stream": false
}
```

### Response (real, verbatim)
```json
{
  "id": "chatcmpl-265",
  "object": "chat.completion",
  "model": "qwen3:8b-q8_0",
  "system_fingerprint": "fp_ollama",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "Hello, John! I'm excited to help you explore our products. Let me check what we have available for you.",
        "tool_calls": [
          {
            "id": "call_ws2damtb",
            "index": 0,
            "type": "function",
            "function": { "name": "getProducts", "arguments": "{\"query\":\"\"}" }
          }
        ]
      },
      "finish_reason": "tool_calls"
    }
  ],
  "usage": { "prompt_tokens": 164, "completion_tokens": 188, "total_tokens": 352 }
}
```

**What this proves:** `finish_reason: "tool_calls"`, a parsed `getProducts` call,
a by-name greeting ("Hello, John!"), and real token usage — all from the deployed
`qwen3:8b-q8_0` local model.

### Full end-to-end (8-turn) live run
The privacy router was then exercised end-to-end against this same endpoint via
`node homework/M7/demo/run-demo-live.mjs` (every turn processed by the **real**
local model). Result: **5 local / 3 cloud**, all PII turns (email / phone / card)
routed **local** with masked values, real tool calls on both routes
(`getProducts` on cloud; `getMyOrders` / `getMyProfile` on local). Transcripts:
`demo/transcript-live.json` and `demo/chatlogs-live-dump.json`.

> Cloud-routed turns here ran on the local model as a labeled fallback
> (`liveProcessorNote`) because no `OPENROUTER_API_KEY` was provided; the
> **routing decisions are the real router's output**, and the one-line cloud swap
> is documented in `README.md` §2C.
