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

- **Safe local environment guidance** — Docker MongoDB setup plus placeholder-only `.env.example` rules to prevent accidental secret commits.
- **AI workflow constraints** — inspect the codebase before editing, prefer minimal reviewable changes, and avoid broad rewrites or dependency upgrades in this legacy project.
- **Human-written repo conventions** — this is a public homework fork, docs must stay beginner-friendly, and `docs/lessons/` acts as a knowledge-transfer log for future sessions.
- **Copilot-specific behavior** — inspect nearby files first, follow existing patterns, and never suggest committing `.env` or secrets.
- **Shared JavaScript standards** — `docs/coding-standards.md` was linked from both rules files to encourage JSDoc, explicit validation, and safer plain-JS practices without converting the repo to TypeScript.

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
| Manual order with payment | Place order → PayPal sandbox checkout | ✅ Historical manual verification recorded on 2026-04-25; not re-run during this final CLI audit |

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
- Final audit follow-up: `frontend/src/store.js` now uses the guarded persisted-state parser for `paymentMethod` as well as `cartItems`, `userInfo`, and `shippingAddress`.

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
- **Final PR URL:** https://github.com/ilya-chakun/proshop_mern/pull/11
- **Safety:** `.env` was not committed, and only safe placeholders were kept in docs and `.env.example`.

---

## Nice-to-have documentation

- **Architecture document created:** `docs/architecture.md`
- **ADR folder created:** `docs/adr/`
- **ADRs added:** 3
- **Current docs PR:** https://github.com/ilya-chakun/proshop_mern/pull/12

### Deliverables

| Item | Status | Notes |
|------|--------|-------|
| Mermaid architecture diagram | ✅ yes | Added to `docs/architecture.md` based on static code inspection of the current codebase |
| ADR 0001 | ✅ yes | Single Express server for API plus production static hosting |
| ADR 0002 | ✅ yes | Redux plus thunk with `localStorage` persistence for shared client state |
| ADR 0003 | ✅ yes | JWT bearer auth with `protect` and `admin` middleware |

### Scope and safety notes

- The architecture diagram and ADRs were inferred from inspected project files, including backend routes, controllers, models, middleware, frontend routing, Redux store setup, and checkout/payment screens.
- The work was documentation-only; no application source code or dependencies were changed.
- Only safe placeholder configuration values are referenced; `.env` was not committed.
- GitHub Mermaid rendering was **not** verified on github.com after pushing, so that confirmation is not claimed here.

---

## Nice-to-have: Characterization tests

- **Selected function:** `cartReducer`
- **Source file:** `frontend/src/reducers/cartReducers.js`
- **Experiment folder:** `docs/m2-char-tests/`
- **Files created:**
  - `docs/m2-char-tests/original.js`
  - `docs/m2-char-tests/characterization.test.js`
  - `docs/m2-char-tests/refactored.js`
  - `docs/m2-char-tests/reflection.md`
- **Test command used:** `./frontend/node_modules/.bin/jest docs/m2-char-tests/characterization.test.js --runInBand`
- **Test result:** ✅ pass — 22 characterization tests passed for both the original copy and the refactored copy
- **Safety note:** the work stayed isolated under `docs/m2-char-tests/`; production application behavior was not changed.

---

## Extra: Docker Compose

- **Docker Compose added:** yes
- **Services:** `mongo`, `backend`, `frontend`
- **Seeder service:** included as a one-off Compose step before backend startup
- **Verification commands used:**
  - `docker compose config`
  - `docker compose up --build`
  - `curl -i http://localhost:5001/api/products`
  - `curl -I http://localhost:3000`
  - `docker compose down`
- **URLs checked:**
  - `http://localhost:5001/api/products`
  - `http://localhost:3000`
- **Limitations:**
  - The backend still listens on container port `5000`, but Compose publishes it on host port `5001` because this project already documents the macOS AirPlay conflict on host port `5000`.
  - The frontend Docker image rewrites its internal dev proxy to the Compose `backend` service so the host-side proxy setting remains unchanged for manual local setup.
  - During verification, the legacy `NODE_OPTIONS=--openssl-legacy-provider` wrapper failed inside the Dockerized frontend, so the frontend image now rewrites its internal start/build scripts for Node 16 while leaving the host-side package file unchanged.
  - If the standalone `mongo` container from the manual setup is already running, it must be stopped before Compose can claim host port `27017`.
- **Safety:** `.env` was not committed, only safe placeholder values were added to Docker and documentation files, and no dependency upgrades were made.
