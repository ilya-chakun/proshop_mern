# HOW-TO-TEST — M7 Privacy-Routing AI Assistant

A step-by-step manual verification guide. Run these to confirm **every rubric
block is covered**. Each section maps to a graded item in
`m7_homework_requirements.md` (Критерии оценки).

> **TL;DR — one command proves the whole `[AUTO]` core:**
> ```bash
> npm run m7:verify
> ```
> Exit `0` = all 7 automated stages (A–G) green. Exit `1` = a stage failed,
> exit `2` = a `[LIVE]` stage is pending. Read the printed stage banner for the
> exact reason.
>
> **Fully local — no cloud key needed.** Everything in this guide (including the
> `[LIVE]` runs in §9) runs on a **local** Ollama model. No rubric point requires a
> real cloud API call; without `OPENROUTER_API_KEY`, cloud-routed turns run on the
> local model labelled `cloud`, so you can verify the entire homework 100% on-device.

---

## 0. One-time setup (~5 min)

```bash
# from repo root
npm install
npm install --prefix frontend

# Mongo for the live app (tests use in-memory Mongo, no Docker needed)
docker run -d -p 27017:27017 --name mongo mongo:7

# copy env placeholders (fill real values only for LIVE runs)
cp .env.example .env
```

Nothing here needs real secrets to pass the automated suite — tests use
`mongodb-memory-server` and a deterministic `MockProvider`.

---

## 1. Rubric: **Часть 0 — local model endpoint** (2 pts) · `[LIVE]`

**What's graded:** working OpenAI-compatible endpoint + hardware note + explicit quant.

```bash
# 1. read the deploy note (path, model+quant, endpoint, hardware, real log)
cat homework/M7/0-deploy.md
```

**Manual live check (requires Ollama running):**
```bash
# Ollama.app (cask) already serves on :11434; or start the CLI daemon:
ollama serve &                       # start local endpoint (skip if app is running)
ollama pull qwen3:8b-q8_0           # EXPLICIT non-default quant (Q4 default breaks tools)
# confirm OpenAI-compatible endpoint answers:
curl http://localhost:11434/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"model":"qwen3:8b-q8_0","messages":[{"role":"user","content":"hi"}]}'
```
✅ Pass = `0-deploy.md` has all 5 fields **and** a captured real request/response
transcript (not the "PENDING LIVE RUN" placeholder). *This is already done — the
file holds a verbatim real call showing `finish_reason:tool_calls` + token usage.*

---

## 2. Rubric: **Роутер (heart)** (5 pts) · `[AUTO]`

**What's graded:** correctly routes 6–10 queries; dashboard tracking; router is
lightweight (no GPU).

```bash
# PII detector unit tests (regex: email/phone/card+Luhn/postal/intent)
npm test -- --testPathPattern=pii        # 22+ cases, PII vs clean

# router decision tests (PII -> local, clean -> cloud, with reason)
npm test -- --testPathPattern=router

# end-to-end: every demo query routed + asserted against expectedRoute
npm run m7:demo
cat homework/M7/demo/transcript.json     # see route + reason + latency + cost per turn
```

**Lightweight-router proof:** open `backend/assistant/pii.js` and
`backend/assistant/router.js` — pure regex/string ops, **zero** model calls, no
GPU. The route decision is visible in code (not hidden in config), satisfying
the anti-pattern check.

✅ Pass = all demo turns land on the expected route; private (PII) turns show
`cost = $0.00`.

---

## 3. Rubric: **Assistant with DB access** (2 pts) · `[AUTO]`

**What's graded:** answers from the store DB (products / my orders), greets by name.

```bash
# tool layer: getProducts / getMyOrders / getMyProfile against seeded memory-Mongo
npm test -- --testPathPattern=tools

# full agent loop (provider tool-call -> DB tool -> grounded answer)
npm test -- --testPathPattern=assistant
```

**Manual UI check:**
```bash
npm run dev                              # backend :5001 + frontend :3000
# log in (john@example.com / 123456), open the chat widget (bottom-right),
# ask: "what products do you have?"  -> lists seeded Electronics
# ask: "where is my order?"          -> scoped to John only
# the assistant greets "John" by name (from req.user, not model args)
```
✅ Pass = answers come from seeded data; never leaks another user's orders.

---

## 4. Rubric: **Admin dashboard** (part of Router 5 pts) · `[AUTO]`

**What's graded:** admin page reads `chatlogs` → table with message / PII / route /
model / answer / latency / cost.

```bash
# chatlog persistence: route, masked PII, model, latency, cost columns
npm test -- --testPathPattern=chatlog

# regenerate the dashboard screenshot proof
node homework/M7/demo/screenshot-dashboard.mjs
open homework/M7/demo/dashboard.png
```

**Manual UI check:** log in as admin (`admin@example.com / 123456`) →
**Admin ▸ Assistant Logs**. PII column shows **masked** values; private rows = `$0.00`.

✅ Pass = every demo turn appears as a row with all columns populated.

---

## 5. Rubric: **Разбор DZ1** (1 pt) · `[AUTO]`

```bash
cat homework/M7/writeup-dz1.md
```
✅ Pass = covers what entities force local routing, $ saved, why the router needs no GPU.

---

## 6. Rubric: **DZ2 — attack & defense** (bonus +4) · `[AUTO]` mock / `[LIVE]` real

**What's graded:** reproducible injection (+1.5), ≥2 defense layers incl. ≥1
deterministic (+1.5), OWASP/lethal-trifecta writeup (+1).

```bash
# runs BOTH builds: vulnerable (broad access) vs secure (scoped tools)
node homework/M7/dz2/attack.mjs

# expected: vulnerable build leaks 2/2 (direct + indirect via poisoned review),
#           secure build leaks 0/2 (forged userId ignored; getAllUsers absent)
cat homework/M7/dz2/before-structural.json   # "before" leak log
cat homework/M7/dz2/after.json               # "after" airtight log
cat homework/M7/dz2/writeup-dz2.md           # OWASP LLM01/LLM06 + trifecta analysis
```

This is also wired as **stage G** of `npm run m7:verify` (asserts
`before.leaks > 0` and `after.leaks === 0`).

> **Structural vs live injection.** `attack.mjs` uses a deterministic
> `MockProvider` that *always* obeys the injection, so the "before" build leaks
> **2/2** every run — a stable, reproducible proof of the vulnerability and the
> fix. The real-model run (§9, `attack-live.mjs` → `before-live.json`) is
> *probabilistic*: a real LLM may refuse some attacks. Our captured live run leaked
> **1/2** (direct attack leaked `jane@example.com`; the indirect/poisoned-review
> attack was declined) — which is exactly *why* the durable defense is the
> deterministic, server-side **scoped-tool** layer, not prompt hardening.

✅ Pass = vulnerable leaks, secure refuses/scopes, writeup maps the analysis.

---

## 7. Frontend builds & component test · `[AUTO]`

```bash
# production build (treats the new code as shippable)
SKIP_PREFLIGHT_CHECK=true npm run build --prefix frontend

# chat widget render/submit test (jsdom)
SKIP_PREFLIGHT_CHECK=true CI=true npm test --prefix frontend -- \
  --watchAll=false --testPathPattern=ChatWidget
```
✅ Pass = build exits 0; ChatWidget test 3/3 green.

---

## 8. Full automated gate (covers §2–§7 in one shot)

```bash
npm run m7:verify
```
Stages: **A** fixtures · **B** backend jest+supertest · **C** memory-Mongo seed ·
**D** router→route · **E** ChatLog cost/PII-mask · **F** ChatWidget jsdom ·
**G** DZ2 attack. Exit `0` = everything green.

---

## 9. LIVE verification — real local model (`[LIVE]`, already captured)

These reproduce the `[LIVE]` artifacts on a real model. **Local only** — Ollama
must be up (`qwen3:8b-q8_0`); **no OpenRouter key required** (cloud-routed turns
run on the local model labelled `cloud`). Each run is slow (a real LLM); the
runners default to a 240 s per-call timeout.

```bash
# prerequisite: Ollama serving on :11434 with the model pulled
ollama pull qwen3:8b-q8_0

# 9a. Live demo — all 8 frozen queries through the REAL model
node homework/M7/demo/run-demo-live.mjs
cat homework/M7/demo/transcript-live.json        # 5 local / 3 cloud, real tool calls + usage
cat homework/M7/demo/chatlogs-live-dump.json     # genuine ChatLog rows (mode:'live'), PII masked

# 9b. Live prompt-injection — vulnerable build, real model
node homework/M7/dz2/attack-live.mjs
cat homework/M7/dz2/before-live.json             # real-model leak log (observed 1/2)
```

**What to expect (matches the committed artifacts):**
- `transcript-live.json`: 8 turns, **5 local / 3 cloud**, real `getProducts` /
  `getMyOrders` / `getMyProfile` tool calls, real token usage; every local turn
  has its PII **masked**.
- `before-live.json`: `security:'vuln'`, **`leaks: 1`** — the direct attack
  exfiltrates `jane@example.com`; the indirect one is declined (probabilistic, see §6).

✅ Pass = the live runs complete and the JSON shows real model output (`mode:'live'`,
real `usage` token counts), PII masked on local turns, and ≥1 leak in the vuln build.

> **Tuning (optional):** override defaults via env, e.g.
> `LOCAL_MODEL_NAME`, `LOCAL_MODEL_BASE_URL`, `LOCAL_MODEL_TIMEOUT_MS`,
> `MONGOMS_VERSION`. To exercise a **real cloud** leg instead of the local
> fallback, set `OPENROUTER_API_KEY` (one-line swap; not needed for any points).

---

## Coverage map (rubric → where it's proven)

| Rubric block | Pts | Proven by |
|---|---|---|
| Часть 0 — local endpoint | 2 | `0-deploy.md` real log (`[LIVE]`) + §1 |
| Роутер + dashboard tracking | 5 | §2, §4, `m7:verify` D/E |
| Assistant with DB | 2 | §3, `m7:verify` B |
| Разбор DZ1 | 1 | §5 `writeup-dz1.md` |
| DZ2 Attack | +1.5 | §6 `attack.mjs` before-log + §9 live `before-live.json` |
| DZ2 Defense | +1.5 | §6 scoped tools after-log |
| DZ2 Разбор | +1 | §6 `writeup-dz2.md` |

> **`[LIVE]`-gated items** (need a running real model — **all already captured**,
> re-verify via §9): Часть 0 real call log (`0-deploy.md`),
> `demo/transcript-live.json` + `demo/chatlogs-live-dump.json`, real dashboard rows,
> `dz2/before-live.json`. All run on the **local** model; see `PLAN.md` for the exact tasks.
