# ProShop MERN — Homework Report

## Rules diff

**Primary AI agent:** OpenCode CLI
**Main editor:** WebStorm
**Additional AI assistant:** GitHub Copilot

### Rules files created

| File | Purpose |
|------|---------|
| `AGENTS.md` | OpenCode AI agent rules for the legacy MERN codebase |
| `.github/copilot-instructions.md` | GitHub Copilot behavior guidance |

### What was manually added beyond generic auto-generated rules

- **Safe local environment guidance** — Docker MongoDB setup and placeholder-only
  `.env.example` rules to prevent accidental secret commits.
- **AI-agent workflow rules** — requiring project inspection before edits,
  avoiding large rewrites or dependency upgrades in this legacy codebase.
- **Human-written conventions** — that this is a public homework fork with
  clean commit expectations, beginner-friendly docs, and `docs/lessons/`
  as a knowledge-transfer log for future AI-agent sessions.
- **Copilot-specific behavioral constraints** — telling Copilot to inspect
  nearby files first, never suggest committing secrets, and avoid
  architecture changes.
- **Documentation structure** — establishing `docs/report.md` as the single
  homework report and `docs/lessons/` for investigation logs.
- Added `docs/coding-standards.md` and linked it from both agent rules files
  to guide AI assistants toward strongly typed JavaScript practices without
  converting the legacy project to TypeScript.

---

## Local startup and README

I ran the project locally using Docker MongoDB and `npm run dev`.

### Setup details

- **MongoDB:** Docker container `mongo` (image `mongo:7`) on `localhost:27017`
- **Backend:** Express server on port 5001 (port 5000 conflicts with macOS AirPlay)
- **Frontend:** React dev server on port 3000 (proxying API requests to backend)
- **Database seed:** `npm run data:import` — imported 3 users and 6 products

### Verification

| Check | URL / Command | Result |
|-------|---------------|--------|
| Backend API | `curl http://localhost:5001/api/products` | ✅ 200 — returns JSON product data |
| Frontend | `curl -I http://localhost:3000` | ✅ 200 — React app loads |
| Database seeded | `npm run data:import` | ✅ "Data Imported!" |
| Manual order with payment | Place order → PayPal sandbox checkout | ✅ Order placed and paid successfully |

### Documentation updated

| Item | Status |
|------|--------|
| README.md updated with full setup guide | ✅ yes |
| `.env.example` updated with safe placeholders | ✅ yes |
| `docs/start_app_troubleshooting.md` created | ✅ yes |
| `docs/lessons/2026-04-25-local-startup-readme.md` created | ✅ yes |

### Startup caveats

- **Port 5000 conflict:** macOS 12+ uses port 5000 for AirPlay Receiver. The project is configured to use port 5001 instead.
- **jsonwebtoken upgrade:** Previously upgraded from 8.5.1 → 9.0.3 to fix Node.js 25 compatibility (SlowBuffer removal). Done in prior commit.
- **OpenSSL legacy provider:** Required for `react-scripts@3.4.3` on Node 17+. Already configured in `frontend/package.json`.

---

## Findings and Fixes

- **`FINDINGS.md` created:** yes
- **Findings documented:** 4
- **Findings fixed:** 4

### Fixed findings

| Finding | Branch | Fix commit | Status update commit | PR |
|---------|--------|------------|----------------------|----|
| #1 — unauthenticated upload endpoint | `fix/finding-1-upload-auth` | `ca153e6` | `5efffc9` | https://github.com/ilya-chakun/proshop_mern/pull/7 |
| #2 — unsafe localStorage parsing on startup | `fix/finding-2-safe-localstorage` | `a0015bb` | `681b05c` | https://github.com/ilya-chakun/proshop_mern/pull/8 |
| #3 — frontend build fails on modern Node/OpenSSL | `fix/finding-3-openssl-build` | `6a207ef` | `abe3f12` | https://github.com/ilya-chakun/proshop_mern/pull/9 |
| #4 — checkout forgets saved payment method after reload | `fix/finding-4-restore-payment-method` | `b3f00a2` | `9ed8170` | https://github.com/ilya-chakun/proshop_mern/pull/10 |

### Assessment PR

- `audit/findings-block-3`: https://github.com/ilya-chakun/proshop_mern/pull/6

### Verification notes

- `CI=true npm test --prefix frontend -- --watchAll=false` reports that no frontend tests are currently committed.
- `CI=true npm test --prefix frontend -- --watchAll=false --passWithNoTests` passes for the frontend-safe fixes.
- `npm run build --prefix frontend` initially failed with `ERR_OSSL_EVP_UNSUPPORTED`, which became Finding #3.
- `npm run build --prefix frontend` passes after the build-script fix, with existing React Hook warnings still reported by the legacy codebase.

### Scope note

- The findings work was limited to Block 3 only.
- Fixes were kept minimal and stacked on top of the assessment branch.
- No dependency upgrades, large rewrites, secrets, or `.env` changes were included.

---

## Block 3 — Findings and fixes integration

- **Final integration branch:** `integration/block-3-findings-fixes`
- **Assessment branch:** `audit/findings-block-3`
- **Fix branches merged:**
  - `fix/finding-1-upload-auth`
  - `fix/finding-2-safe-localstorage`
  - `fix/finding-3-openssl-build`
  - `fix/finding-4-restore-payment-method`
- **Findings documented:** 4
- **Findings fixed:** 4
- **Fixed finding numbers:** 1, 2, 3, 4
- **Local verification commands run:**
  - `npm run data:import`
  - `npm run dev`
  - `curl -i http://localhost:5001/api/products`
  - `curl -I http://localhost:3000`
  - `CI=true npm test --prefix frontend -- --watchAll=false --passWithNoTests`
  - `npm run build --prefix frontend`
- **Final PR URL:** to be added after PR creation
- **Safety:** `.env` was not committed, and only safe placeholders were kept in docs and `.env.example`.
