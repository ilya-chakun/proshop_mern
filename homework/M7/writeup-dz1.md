# DZ1 — Privacy-Routing Assistant: Analysis

*Generated from the deterministic mock-mode demo (`demo/run-demo.mjs` →
`demo/transcript.json`, `demo/chatlogs-dump.json`). Numbers below are the actual
demo output, not estimates. (Identical copy lives at `demo/writeup-dz1.md`; this
is the canonical §5 location.)*

## What the router does

Every chat turn passes through `backend/assistant/router.js` **before** any model
is called. The router runs a regex/intent PII scan (`backend/assistant/pii.js`)
and decides:

- **PII or private-data intent present → `local`** (on-device model, $0, data
  never leaves the machine).
- **Public catalog / no PII → `cloud`** (cheap hosted model for general help).

## Which entities force `local`

From the 8-turn demo, these detections pinned a turn to the on-device model:

| Entity type | Example trigger (demo) | Route |
|-------------|------------------------|-------|
| `email`     | "My email is jane@example.com — resend my receipt?" | 🔒 local |
| `phone`     | "My phone number is 415-555-0132, did my order ship?" | 🔒 local |
| `card`      | "Is the card 4111 1111 1111 1111 the one saved…?" | 🔒 local |
| private-data `intent` | "Where is my order?", "What's the email on my profile?" | 🔒 local |

Two of the local turns carried **no literal PII string** but expressed
**private-data intent** ("my order", "my profile") — these still route local
because answering them requires the user's own account data, which must not be
shipped to a third-party LLM. Public catalog questions (Airpods, PS4, Logitech
mouse) carried neither PII nor private intent and routed to cloud.

## Cost: $ saved vs an all-cloud system

| Metric | Value |
|--------|-------|
| Total turns | **8** |
| Local (private) | **5** |
| Cloud | **3** |
| Actual cost | **$0.000423** |
| All-cloud baseline | **$0.000626** |
| **Saved by routing** | **$0.000203** (~32%) |

The saving comes entirely from the 5 PII/private turns running **free** on the
local model instead of being billed at cloud token rates. At ProShop's tiny demo
volume the absolute figure is sub-cent, but it scales linearly: the same 5/8
local ratio on, say, 1M turns/month at the demo's per-turn cloud price would save
on the order of **~$25/month** *and* — more importantly — keep every email,
phone number, and card string off the third-party provider entirely.

## Why the router needs no GPU

The routing decision is **pure CPU string/intent matching** (regex + keyword
intent), implemented in `pii.js` / `router.js`. It never invokes a model to
decide where to send a turn. Consequences:

- **Cheap & instant**: classification is sub-millisecond and runs on any host —
  no GPU, no model warm-up, no extra API call.
- **Fail-safe for privacy**: because the gate is deterministic code (not an LLM
  judgement), it cannot be "talked out of" routing PII locally. A turn that
  matches an email/phone/card pattern is *always* kept on-device.
- **Auditable**: each decision stores a plain-text `reason` (e.g. *"LOCAL —
  detected email, intent; must stay on-device"*) in the ChatLog, so an admin can
  see exactly why each turn went where on the dashboard.

## Privacy tradeoff worth noting

The admin audit log (`ChatLog.message`) stores the **raw user message**, while the
`detectedPII` summary stores only **masked** values (`j***@example.com`). This is
intentional per the §3.4 schema: the privacy guarantee is *"PII never crosses the
third-party cloud boundary"* — the first-party MongoDB audit trail is admin-only
and stays on the operator's own infrastructure. If stricter at-rest redaction
were required, masking `message` itself would be the next step.
