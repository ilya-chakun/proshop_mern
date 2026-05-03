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
- **Documentation structure** — establishing `report.md` at repo root as the
  submission report and `docs/lessons/` as the place for investigation notes.
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
| #4 — checkout forgets saved payment method after reload because `paymentMethod` is persisted separately from the reducer default state shape | `fix/finding-4-restore-payment-method` | `b3f00a2` | `9ed8170` | https://github.com/ilya-chakun/proshop_mern/pull/10 |

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

---

## M3 — RAG / MCP: Feature Flags + Documentation Search

### Stack choice
- **MCP framework**: FastMCP (Python). Decorator + type hints — fastest path to a working stdio MCP server.
- **Vector DB**: Qdrant local (Docker). Free, fast, native sparse vectors for future Part 4.
- **Embeddings**: BGE-M3 (self-hosted via sentence-transformers). Best Russian quality (MIRACL 67.8 vs 44 for OpenAI 3-small), runs locally, 1024 dim.
- **Chunking**: LangChain `RecursiveCharacterTextSplitter`, 1600 chars / 320 overlap, markdown-aware separators (`## ###`, `\n\n`, …).
- **IDE**: opencode (TUI). Both MCPs configured in `./opencode.json` with absolute paths to the venv Python in `../m3-homework/.venv`.
- **Backend integration**: `backend/features.json` is the live runtime source. `GET /api/feature-flags` reads the file on every request. The admin Dashboard page (`/admin/featureslist`) reads via this API.

### Pipeline numbers
- Files in corpus: <FILL after running ingest>
- Chunks in `proshop_docs` collection: <FILL — see `ai/chunks.jsonl` line count>
- Type distribution: <FILL>
- Ingest runtime (incl. first model download): <FILL minutes>

### Feature flags MCP — test scenario log
1. `feature-flags_get_feature_info({"feature_name":"search_v2"})`

   Returned:

   ```json
   {
     "name": "search_v2",
     "display_name": "New Search Algorithm",
     "status": "Testing",
     "traffic_percentage": 15,
     "last_modified": "2026-03-10",
     "dependencies": [],
     "dependencies_state": {}
   }
   ```

   Result: feature was already in `Testing`, so the conditional step "if Disabled → move to Testing" was **not needed** and no `feature-flags_set_feature_state(...)` call was made.

2. `feature-flags_adjust_traffic_rollout({"feature_name":"search_v2","percentage":25})`

   Returned:

   ```json
   {
     "feature_name": "search_v2",
     "traffic_percentage": 25,
     "status": "Testing",
     "last_modified": "2026-05-03"
   }
   ```

   Result: rollout traffic was updated from `15%` to `25%`.

3. `feature-flags_get_feature_info({"feature_name":"search_v2"})`

   Returned:

   ```json
   {
     "name": "search_v2",
     "display_name": "New Search Algorithm",
     "status": "Testing",
     "traffic_percentage": 25,
     "last_modified": "2026-05-03",
     "dependencies": [],
     "dependencies_state": {}
   }
   ```

   Final state confirmed:

   - Feature: `search_v2`
   - Status: `Testing`
   - Traffic: `25%`
   - Dependencies blocking enablement: none

### Search-docs MCP — test queries log
<FILL: paste the agent transcript from docs/m3/MANUAL_STEPS_v2.md prompt 2 here>

### End-to-end (both MCPs in one chat) log
<FILL: paste the agent transcript from docs/m3/MANUAL_STEPS_v2.md prompt 3 here>

### Reflection (5–10 sentences)
<FILL after running the manual prompts. Be concrete:
- What was hard (BGE-M3 download, schema mismatches, opencode reload).
- Surprises (which queries the RAG nailed vs missed, agent behavior vs AGENTS.md rules).
- Did the agent in the e2e call tools in the right order? Did it cite docs correctly?
- What I would change (thresholds, hybrid search, reranker).>

### Artifacts in this repo
- `ai/mcp-feature-flags/server.py` — 4 tools: `get_feature_info`, `set_feature_state`, `adjust_traffic_rollout`, `list_features`
- `ai/mcp-search-docs/server.py` — 1 tool: `search_project_docs`
- `ai/rag/{config,ingest,query,export_chunks}.py` — RAG pipeline
- `ai/chunks.jsonl` — all chunks with metadata
- `ai/rag/test-queries.log` — direct CLI queries (pre-MCP debug, from prior iteration)
- `backend/features.json` — live runtime feature flags
- `backend/routes/featureFlagsRoutes.js` — `GET /api/feature-flags`
- `frontend/src/screens/FeaturesListScreen.js` — admin Dashboard page
- `AGENTS.md` — rules for opencode (search-docs first; feature-flags MCP for state)
- `opencode.json` — both MCP servers

---

## Reflection

### Manual time vs AI-assisted time

The most obvious manual-time saver in this homework was the repetitive scaffolding around the two MCP servers, the Qdrant export, and the admin page wiring. The remaining manual work is intentionally concentrated in the interactive opencode prompts, because the submission needs real tool-call transcripts rather than reconstructed notes. That split kept the mechanical setup automated while preserving the human-in-the-loop evidence required by the assignment.

### Architectural quirk / “magic function” worth calling out

Finding #4 turned out to be a good example of a legacy architectural quirk rather than a single obviously broken function. The bug was not only that `frontend/src/store.js` forgot to rehydrate `paymentMethod`; it also reflected the awkward reducer shape captured in `docs/m2-char-tests/reflection.md`, where `paymentMethod` is introduced later and is not part of the explicit default state. That mismatch made checkout state feel “magical” and easy to lose across reloads until the store bootstrap was aligned with the persisted data.

### Where AI went wrong and how it was corrected

The biggest AI mistake in this round was report placement: an intermediate M3 draft briefly diverged from the final submission location, which conflicted with the updated spec that expects `report.md` at the repo root. The fix was to consolidate everything into a single merged root report and update the manual instructions so all new MCP transcripts are appended there. Another process mistake was an incomplete startup instruction; it was corrected by making the manual steps explicitly require MongoDB startup, seed import, `/mcp` verification, and preflight API checks before the live MCP prompts.
