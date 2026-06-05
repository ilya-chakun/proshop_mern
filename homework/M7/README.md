# M7 — Privacy-Routing AI Assistant + Prompt-Injection Defense

> Grader's `homework-m7/` maps to this `homework/M7/` directory (repo convention).
> All `[AUTO]` work is complete and gated by `npm run m7:verify` (stages A–G green).
> Items marked **`[LIVE]`** below require a one-time human-run with a real model
> to earn their rubric points; the code + harness for them is finished.

## 1. What this is

A shopping assistant for ProShop that:

1. **Routes** each user message to a **local** model (when PII / private-data
   intent is present) or a **cloud** model (when clean) — privacy by construction,
   decided by CPU-only code (`backend/assistant/router.js`).
2. Answers product / order / profile questions via **session-scoped DB tools**
   and greets the user by name.
3. **Logs** every turn (route, model, cost, latency, masked PII) to an admin
   dashboard (`/admin/assistant-logs`).
4. **(Bonus DZ2)** Demonstrates a prompt-injection **attack** and a deterministic,
   model-independent **architectural defense**.

## 2. Key choices

| Decision | Choice | Why |
|----------|--------|-----|
| Deploy path | **Local Ollama** (`qwen3:8b-q8_0`) | Free, on-device, keeps PII off third-party clouds. Explicit non-default quant (q6_K isn't published on the Ollama registry, so q8_0 — one step up — is used; both clear the >Q4 floor that the homework warns about for tool-calling/Russian). |
| Cloud provider | **OpenRouter** (OpenAI-compatible) | One adapter (`providers/openaiCompatible.js`) serves both local + cloud. |
| Router | **Code, not LLM** (`router.js` + `pii.js`) | Deterministic, GPU-free, fail-safe, auditable — can't be "talked out of" routing PII local. |
| Tool scope | **Session-bound `TRUSTED_UID`** | Model can't widen scope; the primary DZ2 defense (defend *actions*, not *answers*). |
| At-rest logging | Raw `message`, **masked** `detectedPII` | Privacy guarantee = PII never crosses the cloud boundary; first-party audit DB stays on operator infra. |

## 3. How to run

### 3a. Mock mode (no API keys, fully deterministic — what CI runs)

```bash
npm install
npm test                 # backend jest + supertest (ESM)
npm run m7:verify        # full gate: fixtures, backend, seed, router, ChatLog, widget, DZ2
npm run m7:demo          # 8-turn demo → demo/transcript.json + chatlogs-dump.json + dashboard.png
node homework/M7/dz2/attack.mjs   # DZ2 structural attack → before-structural.json + after.json
```

### 3b. Live mode (real models — for the `[LIVE]` rubric points)

```bash
# .env (never committed):
#   PROVIDER_MODE=live
#   OLLAMA_BASE_URL=http://localhost:11434/v1
#   OPENROUTER_API_KEY=sk-or-...        (OPTIONAL — see note below)
ollama pull qwen3:8b-q8_0
npm run dev              # backend :5001 + frontend; log in, open the chat widget
```

> **Fully local by design — cloud is optional.** No rubric point requires a real
> cloud API call: Part 0 (local Ollama), the router decision, real DB tool-calling,
> the DZ1 cost analysis (price-table estimate; local = `$0` exact), and the DZ2
> attack/defense all run on the **local** model. The `cloud` route is the routing
> *decision* (clean turns are labelled cloud-bound) plus the savings math. If
> `OPENROUTER_API_KEY` is unset, cloud-routed turns run on the local model **labelled
> as cloud** — the project operates 100% on-device. Setting the key is a one-line
> swap that upgrades those turns to a genuine remote call; it is **not** needed for
> any score and is intentionally left off here.

### 3c. ⚠️ Go-Live REQUIRED steps (to claim the `[LIVE]` points)

These are the only items not auto-provable; run once on a machine with the model:

1. **Part 0 deploy** — capture a real local-model request/response into
   `0-deploy.md` (§5) and record hardware/RAM. *(T1.4 / T8.6)*
2. **Live transcript** — real local turns appended to
   `demo/transcript-live.json`; refresh the dashboard rows. Cloud-routed turns run
   on the local model (labelled cloud) unless `OPENROUTER_API_KEY` is set. *(T3.4 / T6.4)*
3. **Live injection** — with `PROVIDER_MODE=live ASSISTANT_SECURITY=vuln`, run the
   two `dz2/fixtures.json` attacks and save `dz2/before-live.json`; confirm a real
   model obeys the injection and leaks in vuln, and the secure build refuses. *(T7.2b)*

## 4. Folder map

| Path | Purpose |
|------|---------|
| `PLAN.md` | Full execution plan (M0–M8) with per-task acceptance. |
| `README.md` | This file. |
| `0-deploy.md` | Local-model deploy path + model+quant + REAL call log **`[LIVE]`**. |
| `router/router.js`, `router/pii.js` | Verbatim copies of the live decision logic (visible router). |
| `router/n8n-workflow.json` | STRETCH: n8n mirror of the same decision. |
| `demo/` | Frozen queries + tool-schema, runner, transcripts, `dashboard.png`. |
| `writeup-dz1.md` | DZ1 analysis (entities→local, $ saved, no-GPU). |
| `dz2/` | Bonus: `attack.mjs`, `before-structural.json`, `after.json`, `fixtures.json`, `writeup-dz2.md`. |

App code lives in `backend/assistant/*`, `backend/models/chatLogModel.js`,
`backend/controllers/{assistant,chatLog}Controller.js`,
`backend/routes/{assistant,chatLog}Routes.js`, and
`frontend/src/components/ChatWidget.js` + `frontend/src/screens/AssistantLogsScreen.js`.

## 5. Theory

*The course handouts `THEORY-privacy-routing.md` and `THEORY-injection-defenses.md`
are **not present in this repo** (see §7). The summaries below are written from the
encoded intent in `m7_homework_requirements.md` and our implementation.*

**Privacy routing (3 lines).** Send a turn to a local model whenever it contains
PII or private-data intent, and only public, non-sensitive turns to the cloud —
so sensitive data is never transmitted to a third party. The classifier must be
cheap, deterministic code (regex/intent), not an LLM, so it is fail-safe and
GPU-free. **The deep leak to remember:** the assistant pulls private DB data via
tools — if such a turn ever routed to cloud, the *tool output itself* would leak,
so private-data **intent** (not just literal PII) must force local.

**Injection defenses (3 lines).** Prompt injection (OWASP LLM01) lets attacker
text — direct or planted in product reviews (indirect) — hijack the agent and
exfiltrate other users' data (LLM06). System-prompt hardening is only a
*probabilistic* layer because it lives in the same channel the attacker writes to.
The durable fix is *architectural*: **bind tool scope to the session on the server
and remove broad tools**, so even a fully compromised model can reach nothing it
isn't entitled to — *defend actions, not answers.*

## 6. Verification status

- `npm run m7:verify` → **stages A–G green, exit 0** (fixtures, backend
  jest+supertest, memory-Mongo seed, router→route, ChatLog route/cost/PII-mask,
  ChatWidget jsdom, DZ2 vuln-leaks/secure-airtight).
- `npm test` → backend suite green; `npm run build --prefix frontend` → clean.
- Remaining points are the three **`[LIVE]`** steps in §3c.

## 7. Course handouts status (T0.6)

The assignment references external handouts **not present in this repo**:
`prompts/00-chat-widget.md`, `prompts/01-admin-dashboard.md`,
`prompts/02-n8n-router.md`, `prompts/03-dz2-injection.md`,
`prompts/workflow.placeholder.json`, `setup-guide.md`,
`hardware-model-mapping.md`, `THEORY-privacy-routing.md`,
`THEORY-injection-defenses.md`. The working tree (excluding `node_modules`) was
searched — none found. Work proceeds from the **encoded intent** in
`m7_homework_requirements.md`; if the handouts are added later, drop them in and
re-reconcile. No design decision here contradicts their described intent.
