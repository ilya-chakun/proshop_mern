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
ollama serve &                       # start local endpoint
ollama pull qwen3:8b-q8_0           # EXPLICIT non-default quant (Q4 default breaks tools)
# confirm OpenAI-compatible endpoint answers:
curl http://localhost:11434/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"model":"qwen3:8b-q8_0","messages":[{"role":"user","content":"hi"}]}'
```
✅ Pass = `0-deploy.md` has all 5 fields **and** a captured real request/response
transcript (not the "PENDING LIVE RUN" placeholder).

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

## Coverage map (rubric → where it's proven)

| Rubric block | Pts | Proven by |
|---|---|---|
| Часть 0 — local endpoint | 2 | `0-deploy.md` real log (`[LIVE]`) + §1 |
| Роутер + dashboard tracking | 5 | §2, §4, `m7:verify` D/E |
| Assistant with DB | 2 | §3, `m7:verify` B |
| Разбор DZ1 | 1 | §5 `writeup-dz1.md` |
| DZ2 Attack | +1.5 | §6 `attack.mjs` before-log |
| DZ2 Defense | +1.5 | §6 scoped tools after-log |
| DZ2 Разбор | +1 | §6 `writeup-dz2.md` |

> **`[LIVE]`-gated items** (need a running real model, can't be faked):
> Часть 0 real call log (`0-deploy.md`), `demo/transcript-live.json`,
> real dashboard rows, `dz2/before-live.json`. See `PLAN.md` for the exact tasks.
