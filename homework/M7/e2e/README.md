# M7 · Live E2E Demo (Playwright, video + screenshots)

A real end-to-end walkthrough of the M7 privacy-routing assistant, recorded
against the **running** app (`frontend :3000 → backend :5001 → local Ollama`).
It mirrors a human reviewer clicking through the feature.

## What it does

1. Signs in as **John** (`john@example.com` / `123456`).
2. Opens the floating **Shop Assistant** and asks three questions:
   | Question | Route |
   |----------|-------|
   | `привет какие есть товары` | ☁️ cloud |
   | `мне нужен телефон` | ☁️ cloud |
   | `show my orders for john@example.com` | 🔒 local (email + intent masked) |
3. Logs out, signs in as **Admin** (`admin@example.com` / `123456`).
4. Opens **Admin → Assistant Logs** and shows the persisted audit table
   (summary cards + the masked-PII row).

## Run it

```bash
# Prereqs: app running (npm run dev) and DB seeded (npm run data:import)
node homework/M7/e2e/run-e2e-demo.mjs
```

The local "thinking" model is slow (~10–80 s per answer), so the run takes a
few minutes and the video shows genuine latency (the 🤖 "thinking…" spinner).
If you hit a stale-token 500, log out / log back in first (see
`homework/lessons/start_app_troubleshooting.md`, Issue 5).

## Artifacts (`artifacts/`)

- `m7-e2e-demo.mp4` / `m7-e2e-demo.webm` — full screen recording of the run.
- `01..10-*.png` — one screenshot per step (login, each answer, logs dashboard).

Both videos are the native Playwright recording; the `.mp4` is transcoded with
system `ffmpeg` when available.
