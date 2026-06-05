# M7 — Report (Privacy-Routing AI Assistant)

> Reviewer-facing summary of what was built and changed for the M7 homework,
> plus exactly how to run and verify it. Beginner-friendly: a new developer
> should be able to reproduce everything below in ~30 minutes.

---

## 1. What M7 delivers

A **privacy-aware shop assistant** for ProShop. Every user message is routed by
a small rules layer **before** any model call:

- If the message contains **PII** (email, phone, etc.) or a **private-data
  intent** (e.g. "show *my* orders") → it is handled **🔒 locally** and the PII
  is masked in the audit log — nothing private leaves the machine.
- Otherwise (public catalog questions) → it goes to the **☁️ cloud** route.

Every turn is persisted to an **audit log** that an admin can review at
**Admin → Assistant Logs**, showing route, reason, model, latency, and
masked-PII fields.

> Note: in this homework setup **both routes point at the same local Ollama**
> (`qwen3:8b-q8_0`) because there is no cloud API key — see `0-deploy.md`. The
> routing *decision* is still real; the badge shows where a turn *would* go.

---

## 2. Work done in this session

### 2.1 Bug fix — chat returned HTTP 500 in the UI

**Symptom:** sending any message in the chat widget failed with a generic
"Sorry — something went wrong.", while `curl` worked fine.

**Two independent root causes were found and fixed:**

| # | Root cause | Fix | File |
|---|-----------|-----|------|
| A | **Stale JWT after a DB reseed.** Reseeding gives users new `_id`s; the browser still held an old token (valid signature, but the user no longer exists). `protect` set `req.user = null`, then `runAssistant` threw → instant 500 on every message. | Added a **null-user guard** after `User.findById` → now returns **401** (so the frontend can redirect to login) instead of crashing with 500. | `backend/middleware/authMiddleware.js` |
| B | **Slow local model.** The "thinking" model can take 60–80s for agentic turns; the provider's hard 60s timeout guaranteed a 500. | Made the timeout **configurable**: `timeoutMs = Number(process.env.ASSISTANT_TIMEOUT_MS) \|\| 60000`, and set `ASSISTANT_TIMEOUT_MS=240000` in `.env`. | `backend/assistant/providers/openaiCompatible.js` |

**Verification**
- Stale token → **401 in 0.025s** (was a 5ms 500 crash); fresh login → 200.
- "what products under $100" agentic turn → **HTTP 200 at ~78s** (previously a
  guaranteed 500 at the old 60s cap).
- **jest: 69/69 passing** after both fixes.
- Documented as **"Issue 5"** in `homework/lessons/start_app_troubleshooting.md`.

### 2.2 New — live E2E video demo (`homework/M7/e2e/`)

A real Playwright walkthrough of the running app (`:3000 → :5001 → local
Ollama`), recorded as **video + per-step screenshots**, mimicking a human
reviewer:

1. Sign in as **John** (regular user).
2. Open the **Shop Assistant** and ask three questions:
   | Question | Route |
   |----------|-------|
   | `привет какие есть товары` | ☁️ cloud |
   | `мне нужен телефон` | ☁️ cloud |
   | `show my orders for john@example.com` | 🔒 local (email + intent masked) |
3. Log out, sign in as **Admin**.
4. Open **Admin → Assistant Logs** and **slowly scroll the full audit
   history**, pausing on the summary cards and the masked-PII row (~16s on the
   dashboard so it reads as a real review, not a single frame).

---

## 3. How to run

```bash
# 0. Prereqs: Docker Mongo up, local Ollama serving qwen3:8b-q8_0
docker start mongo                 # or: docker run -d -p 27017:27017 --name mongo mongo:7

# 1. Install + seed
npm install && npm install --prefix frontend
npm run data:import

# 2. Start the app (backend :5001 + frontend :3000)
npm run dev

# 3. (optional) Record the E2E demo
node homework/M7/e2e/run-e2e-demo.mjs
```

> If the chat shows a 500/“something went wrong”, **log out and back in** — your
> browser may still hold a pre-reseed token (see §2.1-A and Issue 5 in the
> troubleshooting runbook).

---

## 4. How to verify (reviewer checklist)

- [ ] **Routing:** public questions show ☁️ **cloud**; a message containing an
      email or "my orders" shows 🔒 **local**.
- [ ] **PII masking:** in **Admin → Assistant Logs**, the local turn shows
      `email:j***@example.com` and `intent:my-data` (raw email never stored).
- [ ] **Audit log:** every turn is persisted with route, reason, model, latency.
- [ ] **No 500s:** chat replies succeed even on slow (~60–80s) local answers.
- [ ] **Tests:** `npm test` (run from `backend` config) → **69/69 pass**.
- [ ] **Demo artifacts:** see `homework/M7/e2e/artifacts/` (below).

---

## 5. Artifacts

`homework/M7/e2e/artifacts/`

| File | What |
|------|------|
| `m7-e2e-demo.mp4` | Full screen recording (~172s), incl. the long dashboard history scroll |
| `m7-e2e-demo.webm` | Native Playwright recording |
| `01..10-*.png` | One screenshot per step (login → 3 answers → admin logs) |
| `11-logs-summary-cards.png` | Audit summary cards (Total / Local / Cloud / Saved) |
| `12-logs-history-bottom.png` | Scrolled-through history (local + cloud rows in detail) |
| `13-logs-local-row-highlight.png` | The 🔒 local masked-PII row in focus |

---

## 6. Files changed / added this session

**Changed**
- `backend/middleware/authMiddleware.js` — null-user → 401 guard.
- `backend/assistant/providers/openaiCompatible.js` — configurable timeout.
- `homework/lessons/start_app_troubleshooting.md` — added "Issue 5" + stale-token note.
- `.env` (gitignored) — `ASSISTANT_TIMEOUT_MS=240000`.

**Added**
- `homework/M7/e2e/run-e2e-demo.mjs` — live Playwright video demo.
- `homework/M7/e2e/README.md` — how to run the demo.
- `homework/M7/e2e/artifacts/*` — video + screenshots.
- `homework/M7/report.md` — this file.

---

## 7. Related M7 docs

- `homework/M7/PLAN.md` — full milestone plan.
- `homework/M7/HOW-TO-TEST.md` — detailed manual + automated test guide.
- `homework/M7/0-deploy.md` — local-only deployment notes (cloud-as-local).
- `homework/M7/dz2/writeup-dz2.md` — prompt-injection / structural-attack writeup.
- `homework/lessons/start_app_troubleshooting.md` — runbook (Issues 1–5).
