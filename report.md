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
- Files in corpus: **47** markdown files processed from `aidev-course-materials/M3/project-data`.
- Chunks in `proshop_docs` collection: **399** (matches exported `ai/chunks.jsonl`).
- Type distribution: **runbook 54, feature 76, api 36, adr 34, architecture 28, incident 21, page 30, glossary 15, dev-history 18, best-practices 36, feature-flags-spec 36, features-analysis-ru 15**.
- Ingest runtime: **63.39 s (~1.1 min)** for a reproducible `--recreate` re-run with the model already cached locally; the very first run was longer because BGE-M3 weights had to be downloaded before indexing started.

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
> Note: `search-docs` MCP returns `source_file / type / score / content_snippet`, but not chunk `id`.
> For this log I preserved the exact MCP query results and then matched them to the same Qdrant hits for the
> same query to recover `id` for each returned chunk.

#### Query 1 (initial)

`search_project_docs({"query":"Какая БД используется и почему?","top_k":5})`

Top-K returned:

| Rank | id | score | source_file | Fragment |
|---|---|---:|---|---|
| 1 | `a53fe208-7895-4dfe-a186-875d8daf2c73` | 0.5577 | `runbooks/db-seed-and-reset.md` | `# Database Seed and Reset Runbook ... Manage database state through seeding sample data...` |
| 2 | `a7ada8fb-5504-410f-8dd7-c36b3fbc9d19` | 0.5505 | `adrs/adr-001-mongodb-vs-postgres.md` | `Use **MongoDB** via the **Mongoose** ODM as the sole database for the application...` |
| 3 | `78394dd3-a2e8-4728-85b9-3ce960a9d726` | 0.5428 | `adrs/adr-003-jwt-vs-session.md` | `Express-Session with MongoDB Session Store...` |
| 4 | `5c42ea31-5949-4173-bad6-31a367aad2ba` | 0.5339 | `adrs/adr-001-mongodb-vs-postgres.md` | `PostgreSQL was the team's existing experience base... Reason not chosen: The team wanted to build MongoDB experience...` |
| 5 | `82d913e0-f244-4f2a-a80b-c39118942ee9` | 0.5211 | `best-practices.md` | `Mongoose Schema Design Best Practices...` |

How I used it:

- Hit #2 gave the direct answer: the project uses **MongoDB via Mongoose**.
- Hit #4 added the decision rationale and trade-off against PostgreSQL.
- Hits #1, #3, #5 were related background, but weaker for the exact “why” question.
- Because the initial wording still pulled in some generic DB material, I refined the query once.

#### Query 1 (refined for the final answer)

`search_project_docs({"query":"Почему выбрали MongoDB вместо PostgreSQL?","top_k":5})`

Top-K returned:

| Rank | id | score | source_file | Fragment |
|---|---|---:|---|---|
| 1 | `5c42ea31-5949-4173-bad6-31a367aad2ba` | 0.6841 | `adrs/adr-001-mongodb-vs-postgres.md` | `PostgreSQL ... Full ACID compliance ... Reason not chosen: The team wanted to build MongoDB experience...` |
| 2 | `71ba0881-3e4c-4fa8-a24e-f8af1e9e5852` | 0.6680 | `dev-history.md` | `Decision 1: MongoDB over PostgreSQL ... variable attributes ... MongoDB's flexible document model handles this naturally.` |
| 3 | `7f09c9ab-3274-4ca0-8699-1801227a6692` | 0.6483 | `adrs/adr-001-mongodb-vs-postgres.md` | `The product entity was anticipated to have variable attributes ... This variability was the central argument for a document store.` |
| 4 | `c25e55aa-915d-40a9-8624-1e3758f52a14` | 0.5948 | `adrs/adr-001-mongodb-vs-postgres.md` | `No ACID transactions by default...` |
| 5 | `a7e58edf-dd37-482b-8ed7-03f4a91d2723` | 0.5895 | `dev-history.md` | `The initial goal was to prove out a full MERN stack (MongoDB...)` |

Formulated answer:

- **БД: MongoDB, через Mongoose.**
- **Почему:** команда ожидала переменные атрибуты у каталога товаров и поэтому выбрала document model; плюс это был осознанный learning goal по MERN/MongoDB.
- **Важная оговорка из документации:** задним числом авторы признают, что PostgreSQL + JSONB тоже подошёл бы, а его ACID-гарантии даже помогли бы избежать части проблем с order/inventory consistency.

#### Query 2 (initial)

`search_project_docs({"query":"Какие фичи зависят от stripe_alternative?","top_k":5})`

Top-K returned:

| Rank | id | score | source_file | Fragment |
|---|---|---:|---|---|
| 1 | `471fd351-3cf8-4e9f-9db1-8e19c0b77742` | 0.6760 | `feature-flags-spec.md` | ``stripe_alternative` — Stripe as Alternative Payment Processor ... **Dependencies:** None.` |
| 2 | `314d7021-3396-4af5-b657-f8b262b4262e` | 0.6610 | `adrs/adr-004-paypal-vs-stripe.md` | `Stripe is now the team's preferred payment processor for new projects...` |
| 3 | `1dea206d-99a1-459d-ad47-0895361b311c` | 0.6260 | `features-analysis-ru.md` | `stripe_alternative — Stripe как альтернативная оплата ...` |
| 4 | `3c7e5f7c-92fc-40f5-8cb7-c7226cc6782f` | 0.5880 | `adrs/adr-004-paypal-vs-stripe.md` | `Migration Path ...` |
| 5 | `e057bf44-2275-48b7-ba0c-a656c4986131` | 0.5497 | `adrs/adr-005-bootstrap-vs-tailwind.md` | `Alternatives Considered` |

How I used it:

- The initial query mostly returned chunks about `stripe_alternative` itself, not its dependents.
- That was not enough to answer the question reliably, so I refined the query toward dependencies.

#### Query 2 (refined for the final answer)

`search_project_docs({"query":"Какие фичи зависят от stripe_alternative? apple_pay dependencies","top_k":5})`

Top-K returned:

| Rank | id | score | source_file | Fragment |
|---|---|---:|---|---|
| 1 | `471fd351-3cf8-4e9f-9db1-8e19c0b77742` | 0.6986 | `feature-flags-spec.md` | ``stripe_alternative` ... enables the Stripe payment path ... **Dependencies: None.`` |
| 2 | `314d7021-3396-4af5-b657-f8b262b4262e` | 0.6752 | `adrs/adr-004-paypal-vs-stripe.md` | `Stripe is now the team's preferred payment processor...` |
| 3 | `3c7e5f7c-92fc-40f5-8cb7-c7226cc6782f` | 0.6640 | `adrs/adr-004-paypal-vs-stripe.md` | `Migration Path ...` |
| 4 | `1dea206d-99a1-459d-ad47-0895361b311c` | 0.6488 | `features-analysis-ru.md` | `stripe_alternative — Stripe как альтернативная оплата ...` |
| 5 | `1b3e81df-7201-4ba1-9393-ce40d881195a` | 0.6329 | `feature-flags-spec.md` | ``apple_pay` ... Payment processor: Stripe (requires `stripe_alternative` to be in Testing or Enabled) ... **Dependencies:** `stripe_alternative` must be active.` |

Formulated answer:

- В retrieved docs явно нашлась **одна зависимая фича: `apple_pay`**.
- Основание: chunk `1b3e81df-7201-4ba1-9393-ce40d881195a` прямо говорит, что `apple_pay` requires `stripe_alternative` to be active.
- Для самого `stripe_alternative` в spec указано `Dependencies: None`, то есть это базовая фича, а не зависимая.
- Других фич с явной зависимостью от `stripe_alternative` в top-K и в сопутствующих retrieved chunks не surfaced.

#### Query 3 (initial)

`search_project_docs({"query":"Что случилось во время последнего incident с checkout?","top_k":5})`

Top-K returned:

| Rank | id | score | source_file | Fragment |
|---|---|---:|---|---|
| 1 | `8398ee0d-4020-46ef-86c1-a61e2b9aeafa` | 0.6162 | `runbooks/incident-response.md` | `Issue: Payment processing failing for 5% of users ... Root cause identified: expired PayPal creds ...` |
| 2 | `18fb5ae7-6f86-472d-9619-42c354cca7c6` | 0.6054 | `runbooks/incident-response.md` | `Incident Postmortem: PayPal Payment Processor Outage ... Date: 2024-04-15 ... 10 minutes ... root cause identified: PayPal credentials expired April 15` |
| 3 | `087b3358-ddb6-4fa8-9451-85d4b2e1c3ff` | 0.5948 | `feature-flags-spec.md` | `express_checkout ...` |
| 4 | `6c6e86b9-cf61-46ff-9e66-1d36fa2b98ff` | 0.5793 | `incidents/i-001-paypal-double-charge.md` | `First onApprove callback ... Second onApprove fires ... stock decremented again ...` |
| 5 | `c97384fa-ea36-450f-bf7b-512812246bc9` | 0.5714 | `runbooks/incident-response.md` | `Declare the incident ... Checkout payment processing failing for PayPal users` |

How I used it:

- The initial query surfaced two different checkout-related incidents: the newer **2024 PayPal outage** and the older **2023 sandbox double-callback**.
- Because the question said **"последний incident"**, I refined the query to emphasize recency and outage context.

#### Query 3 (refined for the final answer)

`search_project_docs({"query":"Последний incident checkout payment outage что случилось?","top_k":5})`

Top-K returned:

| Rank | id | score | source_file | Fragment |
|---|---|---:|---|---|
| 1 | `18fb5ae7-6f86-472d-9619-42c354cca7c6` | 0.6435 | `runbooks/incident-response.md` | `Incident Postmortem: PayPal Payment Processor Outage ... Date: 2024-04-15 ... 14:26 Root cause identified: PayPal credentials expired April 15 ... 14:32 all-clear.` |
| 2 | `8398ee0d-4020-46ef-86c1-a61e2b9aeafa` | 0.6030 | `runbooks/incident-response.md` | `Issue: Payment processing failing for 5% of users. Rollback in progress ... Root cause identified: expired PayPal creds.` |
| 3 | `6c6e86b9-cf61-46ff-9e66-1d36fa2b98ff` | 0.5824 | `incidents/i-001-paypal-double-charge.md` | `First onApprove callback ... Second onApprove fires ... stock decremented again ...` |
| 4 | `c97384fa-ea36-450f-bf7b-512812246bc9` | 0.5796 | `runbooks/incident-response.md` | `Checkout payment processing failing for PayPal users` |
| 5 | `c1230f27-c19d-4647-91c6-ce0b3d2a8afc` | 0.5743 | `incidents/i-002-mongo-connection-pool-exhaustion.md` | `MongoDB Connection Pool Exhaustion ...` |

Formulated answer:

- **Последний checkout incident в документации — PayPal Payment Processor Outage от 2024-04-15.**
- Что случилось: checkout начал падать с `401 Unauthorized`, пользователи жаловались "Can't checkout", команда быстро нашла причину — **истекли PayPal credentials**.
- Воздействие: около **10 минут checkout failures**, примерно **150 orders delayed**, без потери выручки; после renewal credentials и redeploy flow восстановили к 14:32 UTC.
- Старый incident `i-001` про double-callback PayPal тоже surfaced в поиске, но он **не последний по времени**.

#### Final answers used for the task

1. **Какая БД используется и почему?**
   - Используется **MongoDB** через **Mongoose**.
   - Причины из документации: ожидались переменные атрибуты товаров, document model казалась естественной; плюс команда хотела набрать опыт именно с MongoDB/MERN.
   - Hindsight из ADR: PostgreSQL + JSONB тоже подошёл бы, а по consistency для order/inventory мог быть даже лучше.

2. **Какие фичи зависят от `stripe_alternative`?**
   - Явно задокументированная зависимая фича: **`apple_pay`**.

3. **Что случилось во время последнего incident с checkout?**
   - Последний задокументированный checkout incident — **PayPal Payment Processor Outage** 2024-04-15.
   - Причина: **expired PayPal credentials**.
   - Эффект: около **10 минут** checkout не работал, примерно **150 заказов задержались**, затем credentials обновили и checkout восстановили.

### End-to-end (both MCPs in one chat) log

> Note on scenario choice: the original course text uses `payment_stripe_v3`, but that exact flag is not present in this project dataset/runtime config. I used `semantic_search` for the end-to-end proof instead because it exists both in the documentation corpus and in `backend/features.json`, so the same MCP flow could be demonstrated honestly against real project data.

#### Prompt

> 1. Найди в документации proshop_mern что такое фича `semantic_search` и какие у неё зависимости.
> 2. Проверь текущее состояние через feature-flags MCP.
> 3. Если она в статусе Disabled и все зависимости не в Disabled — переведи в Testing, установи трафик 25%.
> 4. Процитируй из документации зачем эта фича нужна.

#### Tool-call chain

1. **search-docs MCP** — `search_project_docs({"query":"что такое фича semantic_search и какие у неё зависимости","top_k":5})`

   Returned:

   ```json
   [
     {
       "source_file": "feature-flags-spec.md",
       "type": "feature-flags-spec",
       "score": 0.64462674,
       "content_snippet": "#### `semantic_search` — Semantic Vector Search\n**Default state:** Disabled\n\nExtends `search_v2` with embedding-based retrieval. Product embeddings are pre-computed and stored; at query time, the user's search string is embedded and matched by cosine similarity. Dramatically improves discoverability"
     },
     {
       "source_file": "features-analysis-ru.md",
       "type": "features-analysis-ru",
       "score": 0.5353188,
       "content_snippet": "| # | Ключ / Название | Статус / % | Сегменты | Стратегия | Обновлено | Зависит от | Код в репо | Сложность | Приоритет | M4 Figma |\n|---|---|---|---|---|---|---|---|---|---|---|\n| 1 | `search_v2` — Новый алгоритм поиска | 🧪 Testing / 15% | beta_users, internal | Канарейка | 2026-03-10 | — | ⚠️ Сомн"
     },
     {
       "source_file": "feature-flags-spec.md",
       "type": "feature-flags-spec",
       "score": 0.5135308,
       "content_snippet": "### Search & Discovery\n\n#### `search_v2` — New Search Algorithm\n**Default state:** Testing (15%)\n\nThe current product search in `productController.getProducts` uses MongoDB `$regex` on the product name field only. `search_v2` replaces this with a hybrid BM25 + TF-IDF ranking pipeline that indexes `n"
     },
     {
       "source_file": "feature-flags-spec.md",
       "type": "feature-flags-spec",
       "score": 0.50497997,
       "content_snippet": "**Return value on success:**\n\nReturns the updated feature object after the write, plus a `warnings` array (empty if none):\n\n```json\n{\n  \"feature_id\": \"semantic_search\",\n  \"name\": \"Semantic Vector Search\",\n  \"status\": \"Testing\",\n  \"traffic_percentage\": 10,\n  \"last_modified\": \"2026-04-27\",\n  \"warnings"
     },
     {
       "source_file": "features/catalog.md",
       "type": "feature",
       "score": 0.4986912,
       "content_snippet": "## Feature 2: Product Search\n\n### Назначение\nПолнотекстовый поиск по названию товара через URL-параметр. Persona: покупатель, знает что ищет.\n\n### User flow\n1. Пользователь вводит текст в SearchBox в хедере.\n2. Нажимает Enter или кликает «Search».\n3. Редирект на `/search/:keyword`.\n4. HomeScreen пол"
     }
   ]
   ```

   What I used from docs:

   - Main hit: `feature-flags-spec.md`.
   - Feature meaning: `semantic_search` extends `search_v2` with embedding-based retrieval.
   - Documented dependency: `search_v2`.
   - Important doc caveat: docs say `search_v2` should be `"Enabled"` first.

2. **feature-flags MCP** — `feature-flags_get_feature_info({"feature_name":"semantic_search"})`

   Returned:

   ```json
   {
     "name": "semantic_search",
     "display_name": "Semantic Vector Search",
     "status": "Disabled",
     "traffic_percentage": 0,
     "last_modified": "2026-02-14",
     "dependencies": ["search_v2"],
     "dependencies_state": {"search_v2": "Testing"}
   }
   ```

   Decision:

   - Feature was `Disabled`.
   - Dependency `search_v2` was **not** `Disabled` (`Testing`), so the conditional step could proceed.

3. **feature-flags MCP** — `feature-flags_set_feature_state({"feature_name":"semantic_search","state":"Testing"})`

   Returned:

   ```json
   {
     "feature_name": "semantic_search",
     "previous_state": "Disabled",
     "new_state": "Testing",
     "dependencies_state": {"search_v2": "Testing"},
     "last_modified": "2026-05-03"
   }
   ```

4. **feature-flags MCP** — `feature-flags_adjust_traffic_rollout({"feature_name":"semantic_search","percentage":25})`

   Returned:

   ```json
   {
     "feature_name": "semantic_search",
     "traffic_percentage": 25,
     "status": "Testing",
     "last_modified": "2026-05-03"
   }
   ```

5. **feature-flags MCP** — `feature-flags_get_feature_info({"feature_name":"semantic_search"})`

   Final confirmation returned:

   ```json
   {
     "name": "semantic_search",
     "display_name": "Semantic Vector Search",
     "status": "Testing",
     "traffic_percentage": 25,
     "last_modified": "2026-05-03",
     "dependencies": ["search_v2"],
     "dependencies_state": {"search_v2": "Testing"}
   }
   ```

#### Final state

- Feature: `semantic_search`
- Status: `Testing`
- Traffic: `25%`
- Dependency chain observed in docs/runtime: `semantic_search` → `search_v2`
- Dependency runtime state during rollout: `search_v2 = Testing`

#### Documentation quote: why this feature exists

From `feature-flags-spec.md`:

> "Extends `search_v2` with embedding-based retrieval. Product embeddings are pre-computed and stored; at query time, the user's search string is embedded and matched by cosine similarity. Dramatically improves discoverability for natural-language queries (\"something warm to wear for a hike\") that keyword search cannot handle."

#### Dependency quote from documentation

From `feature-flags-spec.md`:

> "**Dependencies:** `search_v2` must be `\"Enabled\"` first. If `search_v2` is still in Testing, semantic search results and keyword results will be inconsistent across user sessions."

#### Note on runtime vs docs

- **Documentation requirement:** `search_v2` should be `Enabled` first.
- **Runtime MCP rule actually enforced by `feature-flags`:** only blocked when a dependency is `Disabled`.
- Therefore the rollout here was allowed because runtime state was `search_v2 = Testing`, even though the docs describe that as a potentially inconsistent setup.

### Reflection (5–10 sentences)
I used FastMCP + Python for both servers because it was the shortest path from the assignment contract to a working stdio MCP setup, and I used local Qdrant + BGE-M3 because that stack is cheap, reproducible, and strong on Russian queries. The hardest practical part was not the tool wrappers themselves, but keeping the retrieval pipeline, exported chunks, runtime feature state, and final report all synchronized after repeated reruns. One useful surprise was that the search-docs MCP was good enough to surface the right ADRs and incident notes with only light query refinement, but it still benefited from clearer query phrasing for dependency-style questions. Another important finding was that the end-to-end agent mostly called tools in the right order: docs first for meaning and dependencies, then runtime feature inspection, then mutation, then final confirmation. The semantic search quote from the docs also made the result easy to justify because it clearly explains that the feature extends `search_v2` with embedding-based retrieval for natural-language discovery. At the same time, the workflow exposed a real mismatch between documentation rules and runtime enforcement: docs say `search_v2` should already be Enabled, while the MCP logic only blocks on Disabled dependencies. If I iterated on this further, I would improve query logging, add stricter consistency checks between docs and runtime validation, and then test hybrid retrieval plus reranking as the next quality step.

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
