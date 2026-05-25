M6 — Домашка «Агент-Контролёр»
4 stages, ~7-9 часов общее время, дедлайн перед M7. Применяешь на своём fork proshop_mern.

TL;DR — что нужно сделать
4 stages, ~7-9 часов общее время, дедлайн перед M7.

#	Stage	Что делаем	Время	Что сдаём
1	Multi-Agent Code Review	Запускаем 3 sub-agents последовательно (security → performance → architecture) + final synthesizer → получаем synthesis.md	1.5-2 ч	Все промежуточные review + synthesis.md
2	Fix Top-3	Из synthesis.md берём 3 самых критичных findings, чиним через safe-refactor recipe	1.5-2 ч	3 diff'а + characterization tests прошли
3	Legacy Audit + Living Documentation	Входим в роль legacy-auditor-mate (plan-mode orchestrator) и даём ему PROJECT CONTEXT про твой fork. Он сам walks структуру, аудитит существующую docs/ (✅/🔄/📦/❌), планирует, после approval спавнит security/performance/architecture-mate'ов через Task, делает 4-step reverse engineering на M3-M5, собирает project-index.json + новую docs-структуру + update_project_index.py + секции в корневой конфиг (AGENTS.md/CLAUDE.md). Старые доки — только то что 📦/❌ — архивируем.	2.5-3.5 ч	project-index.json + specs + update_project_index.py + корневой конфиг с секциями + (опц.) hook
4	Tests Agent	Создаём test-writer-mate.md, прогоняем на 2 сервисах из своего кода	1-1.5 ч	Agent definition + сгенерированные тесты + прогон
Все ссылки на агентов и шаблоны — в студ-репо aidev-course-materials/M6/.

Pre-requisites (ДО старта домашки)
[ ] Свой fork proshop_mern с твоим кодом M3-M5 (MCP / RAG / feature flags / dashboard)

[ ] Claude Code установлен, claude --version ≥ v2.1.32

[ ] ANTHROPIC_API_KEY в env или login сделан (claude /login)

[ ] Скопируй mate-агентов в свой fork:

mkdir -p .claude/agents
cp aidev-course-materials/M6/agents/*.md .claude/agents/
# optional, only if you plan to run legacy-auditor with the template:
cp -r aidev-course-materials/M6/agents/templates .claude/agents/templates
Команды cp выше предполагают, что aidev-course-materials/ доступен по этому относительному пути от корня твоего форка. Если он лежит в другом месте — подставь свой путь до него.

Все 5 mate-агентов (security / architecture / performance / legacy-auditor / test-writer) — универсальные, работают на любом репо и любом стеке. Project-specific контекст (имена сервисов, язык, scope из Шага 0) ты передаёшь в spawn-промптах / role-entry (см. Stage 1 и Stage 3).

[ ] Свободный slot времени 7-9 часов на следующие 2 недели

🗺️ Шаг 0 — карта твоего форка (заполни ПЕРЕД стартом)
Важно. Пути и шаблоны ниже написаны на примере одной из эталонных раскладок proshop_mern. Твой форк после M3-M5 почти наверняка устроен иначе — ты сам выбирал имена сервисов, язык и файлы ещё в M3. Это норма, а не «ты что-то сломал». Заполни таблицу один раз — и дальше подставляй СВОИ значения везде, где в шаблонах стоит <...> или пример-путь.

Что	Пример (варианты раскладок)	Твой форк (заполни)
MCP-сервер (папка/файл)	mcp/feature_flags_server.py или mcp-features/index.js	<...>
RAG-сервер (папка/файл)	rag/server.js или mcp-rag/index.js	<...>
Слой feature flags	feature flags/ или backend/features.json	<...>
Язык MCP/RAG	Python или Node/JS	<...>
Test framework	pytest (Python) / jest (JS)	<...>
Mutation tool (опц.)	mutmut (Python) / stryker (JS)	<...>
Файл правил твоего AI-агента	Claude: AGENTS.md / CLAUDE.md (бывает в .claude/) · Cursor: .cursor/rules/*.mdc или .cursorrules · Copilot: .github/copilot-instructions.md · Codex: .codex/ · OpenCode: opencode.json	<...>
Папка существующих docs	docs/ или project-data/	<...>
Папка ADR	docs/adr/ или project-data/adrs/	<...>
Про MCP/RAG-сервисы: их расположение у всех разное — бывают top-level (mcp/, mcp-servers/, mcp-feature-flags/, mcp-rag/, mcp-docs-search/ и десятки других имён), бывают вложены (ai/mcp-*, backend/mcp/, scripts/), на Python или на Node — нередко оба сразу (один сервис на Python, другой на JS, тогда и test framework для них разный). А если до MCP/RAG ты в M3-M5 ещё не дошёл — просто отметь это и ревьюй то, что есть (backend-контроллеры, middleware, routes). Не подгоняй под пример — впиши свою реальность.

Про файл правил агента: где лежат твои правила — зависит от инструмента: Claude — AGENTS.md/CLAUDE.md (иногда в .claude/), Cursor — .cursor/rules/*.mdc или .cursorrules, Copilot — .github/copilot-instructions.md, Codex — .codex/, OpenCode — opencode.json. Везде ниже, где написано «AGENTS.md», читай как «твой главный файл правил». В Stage 3 ты добавишь в него две секции (а если такого файла нет — создашь подходящий твоему агенту). Симлинк ln -s CLAUDE.md AGENTS.md — опционально.

Карта папки сдачи
proshop_mern/homework-m6/
├── stage1-code-review/
│   ├── security-review.md           ← output security-mate
│   ├── performance-review.md        ← output performance-mate
│   ├── architecture-review.md       ← output architecture-mate
│   └── synthesis.md                 ← final synthesizer output
├── stage2-fix-top3/
│   ├── fix-1-<topic>.md             ← description + diff + reasoning
│   ├── fix-2-<topic>.md
│   ├── fix-3-<topic>.md
│   └── tests/                       ← characterization tests (ДО фиксов)
├── stage3-living-docs/
│   ├── 00-plan.md                   ← output /plan brainstorm — что и в каком порядке
│   ├── docs-audit.md                ← ⭐ verdict per existing doc (✅/🔄/📦/❌)
│   ├── project-index.json           ← готовый файл (копия из корня fork)
│   ├── update_project_index.py      ← скрипт обновления (копия из .claude/scripts/)
│   ├── docs-new/                    ← новая структура docs/ (копия из корня fork)
│   │   ├── README.md                ← индекс
│   │   ├── specs/                   ← *-spec.md per module
│   │   ├── adr/                     ← перенесённые из archive важные ADR
│   │   └── architecture/            ← high-level overview
│   ├── docs-archived/               ← старая docs/ как была до stage 3
│   ├── AGENTS.md (или CLAUDE.md)    ← копия корневого конфига с двумя новыми секциями
│   └── hook-screenshot.png          ← (опц.) hook сработал [update-index hook] ✅
└── stage4-tests-agent/
├── test-writer-mate.md          ← новое agent definition (копия из .claude/agents/)
├── service-1-tests/             ← сгенерированные тесты для service 1
├── service-2-tests/             ← сгенерированные тесты для service 2
└── coverage-report.png          ← скриншот прохождения тестов
⭐ Stage 1 — Multi-Agent Code Review (~1.5-2 часа)
🎯 Цель
Прогнать 3 специализированных sub-agents последовательно по своему forked-проекту и получить synthesis.md с топ-findings. Это контрольный документ для Stage 2.

Почему 3 sub-agents, а не один универсальный
Универсальный агент расфокусирован — найдёт ~5-7 проблем
3 специалиста дают 15-30 findings (security + perf + arch)
Final synthesizer группирует, убирает дубли, выставляет приоритеты
В live demo вы видели Agent Team — это production-уровень этого паттерна
Как именно запускать — 3 опции (выбери одну)
Опция A: Sequential через Claude Code (рекомендуется)
В CC сессии запускаешь по очереди:

Важно про универсальность. System prompts всех 5 mate-агентов — полностью project-agnostic. Project-specific контекст (стек, ADR-папка, scope) ты передаёшь в каждом spawn-промпте. Ниже шаблоны содержат PROJECT CONTEXT блок на примере одной из раскладок proshop_mern — подставь свои значения из Шага 0 (имена MCP/RAG-сервисов, язык, реальные пути). У каждого студента они свои — это ожидаемо.

Шаг 1.1 — Security review:

Use the Agent tool to spawn security-mate from .claude/agents/security-mate.md.

PROJECT CONTEXT  (← подставь свои значения из Шага 0)
- Repo: proshop_mern fork (MERN e-commerce + твои MCP / RAG / feature-flags слои из M3-M5)
- Stack: Node + Express + Mongoose + MongoDB + React + <твой MCP-сервер: Python или Node> + <твой RAG-сервер>
- Файл правил агента (read first): <AGENTS.md / CLAUDE.md / .cursor/rules / .github/copilot-instructions.md / .codex/ …>
- ADRs at <твоя ADR-папка: docs/adr/ ИЛИ project-data/adrs/> if present (read first)
- Auth model: JWT-based, password hashing via bcrypt

SCOPE  (← подставь свои реальные пути)
- backend/controllers/*.js, backend/middleware/*.js, backend/routes/*.js
- <твой MCP-сервер>  (например mcp/feature_flags_server.py ИЛИ mcp-features/index.js)
- <твой RAG-сервер>  (например rag/server.js ИЛИ mcp-rag/index.js)
- Out of scope: tests/, __tests__/, scripts/, frontend/public/, node_modules/

OUTPUTS
- JSONL findings: homework-m6/stage1-code-review/security-findings.jsonl
- Human summary (markdown, severity-grouped): homework-m6/stage1-code-review/security-review.md

CONSTRAINTS
- Read-only.
- Aim for 8-20 quality findings.
  Получишь security-review.md. Не переходи дальше пока не прочитаешь.

Шаг 1.2 — Performance review:

Use the Agent tool to spawn performance-mate from .claude/agents/performance-mate.md.

PROJECT CONTEXT
- Same as Step 1.1 (paste the same block).
- Runtime models in scope: Node.js event loop (Express + RAG) + Python sync (MCP server).
- Known hot paths: /api/orders, /api/products (list), MCP feature-flag endpoint.

SCOPE
- Same files as Step 1.1.
- Also check: N+1 patterns, missing pagination, blocking I/O, missing caching.

OUTPUTS
- homework-m6/stage1-code-review/performance-findings.jsonl
- homework-m6/stage1-code-review/performance-review.md

Reference findings from security-review.md if there is overlap (e.g. ReDoS).
Шаг 1.3 — Architecture review:

Use the Agent tool to spawn architecture-mate from .claude/agents/architecture-mate.md.

PROJECT CONTEXT
- Same as Step 1.1.
- Layering convention: controller → service → model (Mongoose). MCP and RAG live in their own folders with their own internal layering.
- Read docs/adr/*.md FIRST if it exists.

SCOPE
- Same files as Step 1.1.

OUTPUTS
- homework-m6/stage1-code-review/architecture-findings.jsonl
- homework-m6/stage1-code-review/architecture-review.md
- Propose 1-2 new ADRs if you find undocumented architectural decisions.

Cross-reference security-review.md and performance-review.md.
Шаг 1.4 — Final synthesizer:

Read all 3 review files (security-review.md, performance-review.md, architecture-review.md).
Synthesize into homework-m6/stage1-code-review/synthesis.md:

1. Group findings by SEVERITY (HIGH / MEDIUM / LOW)
2. Within severity, group related findings (e.g. all auth-related)
3. De-duplicate cross-mate findings (if security and architecture flagged same issue)
4. Add "Recommended fix order" — top 5 to fix first
5. Add "Top-3 for Stage 2 homework" — explicit list with file:line + suggested fix approach
   Опция B: Agent Team (если включил experimental hook)
   Если у тебя CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1 в .claude/settings.local.json:

Spawn an agent team from .claude/agents/ to review my M3-M5 modules.
3 teammates: security-mate, architecture-mate, performance-mate.
Each writes to homework-m6/stage1-code-review/<mate>-review.md.
After all 3 finish, synthesize to synthesis.md (same structure as Option A).
Use peer-to-peer mailbox for cross-category findings.
Опция C: Skills через коммандную последовательность
Если работаешь с другим coding agent (Cursor / Codex) или хочешь чтобы это запускалось в CI:

Запакуй каждого mate'а в shell скрипт: scripts/run-security-review.sh, run-performance-review.sh, run-architecture-review.sh
Каждый скрипт вызывает CC headless: claude -p "$(cat .claude/agents/security-mate.md) Review M3-M5 modules. Output JSON to security-review.md"
Final скрипт synthesize.sh объединяет все 3 reviews
Запускай в нужном порядке: ./scripts/full-review.sh
Что должно появиться в synthesis.md
Пути и номера строк в примере ниже — иллюстративные (на примере одной из раскладок). У тебя будут твои файлы из Шага 0.

# Code Review Synthesis — proshop_mern (homework M6 Stage 1)

**Date:** 2026-MM-DD
**Reviewer:** 3-agent team (security + performance + architecture)
**Scope:** M3-M5 модули (MCP / RAG / feature flags)

## HIGH severity (N findings)

1. **mcp/feature_flags_server.py:42** — Hardcoded JWT secret
    - Source: security-mate
    - Fix approach: move to env var + rotate
    - Estimated effort: 30 min

2. **rag/server.js:78** — N+1 query in /search endpoint
    - Source: performance-mate
    - Fix approach: batch .populate('vector_id')
    - Estimated effort: 1 hour

## MEDIUM severity (N findings)
...

## Top-3 для Stage 2

| # | File:line | Issue | Recommended fix | Effort |
|---|---|---|---|---|
| 1 | mcp/feature_flags_server.py:42 | Hardcoded JWT | Move to env | 30m |
| 2 | rag/server.js:78 | N+1 query | populate batch | 1h |
| 3 | backend/controllers/featureFlagController.js:23 | Direct file write violates AGENTS.md rule | Route through MCP | 30m |

## Cross-mate observations
...
📤 Output Checklist Stage 1 (бинарно — пройдитесь ПЕРЕД переходом на Stage 2)
Файлы
[ ] homework-m6/stage1-code-review/security-review.md существует
[ ] homework-m6/stage1-code-review/performance-review.md существует
[ ] homework-m6/stage1-code-review/architecture-review.md существует
[ ] homework-m6/stage1-code-review/synthesis.md существует
Security review
[ ] ≥ 5 findings в security-review.md
[ ] У каждого finding указан file:line (не общие фразы «в backend есть проблемы»)
[ ] У каждого finding указан severity (HIGH / MEDIUM / LOW)
[ ] У каждого finding указан OWASP category (если применимо)
[ ] У каждого finding указан рекомендуемый fix approach
Performance review
[ ] ≥ 5 findings в performance-review.md
[ ] У каждого finding есть estimated impact (+200ms p95 или +5MB memory)
[ ] Минимум 1 finding касается N+1 / blocking I/O / memory
[ ] У каждого finding указан рекомендуемый fix approach
Architecture review
[ ] ≥ 5 findings в architecture-review.md
[ ] Прочитаны существующие docs/adr/*.md (если есть) и упомянуты в reviews
[ ] Найдены минимум 1-2 предложения новых ADR
[ ] У каждого finding указан criticality (C1 / C2 / C3)
Synthesis.md
[ ] Findings сгруппированы по SEVERITY (HIGH / MEDIUM / LOW секции)
[ ] HIGH severity содержит ≥ 2 finding'а
[ ] Явная секция «Top-3 для Stage 2» с таблицей: file:line / issue / fix approach / effort estimate
[ ] Cross-mate observations отмечены (минимум 1 finding флагнули ≥ 2 разных mate'а)
[ ] Total token usage estimate (для cost awareness)
Recipe-ссылки
6.1-ai-code-review/claude-code-review-setup.md — все 4 способа запуска review
agents/ — готовые mate-агенты (security/architecture/performance/legacy-auditor/test-writer) + README со схемой вызова
6.1-ai-code-review/honest-risks.md — что не делать
⭐ Stage 2 — Fix Top-3 из synthesis.md (~1.5-2 часа)
🎯 Цель
Из homework-m6/stage1-code-review/synthesis.md берём 3 самых критичных findings (из секции «Top-3») и чиним через safe-refactor recipe из Topic 6.3.

Workflow для каждого из 3 fix'ов
Шаг 2.1 — Characterization tests ПЕРЕД фиксом
В CC сессии:

Read homework-m6/stage1-code-review/synthesis.md. Take finding #1 (top of list).
For the affected file (e.g. mcp/feature_flags_server.py), generate
characterization tests that pin down CURRENT behavior — even if it's wrong.

Use pytest if Python, jest if JS. Save to homework-m6/stage2-fix-top3/tests/
test-<finding-1-short-name>.py (or .js).

Run the tests. They MUST pass on current code. If they don't pass — fix the test,
not the code (we're capturing current behavior).
Важно: тесты должны проходить ДО фикса. Это «контрольная» что после фикса вы ничего не сломали.

Шаг 2.2 — Применить фикс с явными «Do NOT»
Now apply the fix for finding #1. Use this approach:

[paste recommended_fix from synthesis.md]

Constraints (Do NOT):
- Do NOT change the public API of this file
- Do NOT modify error handling logic
- Do NOT remove existing logging
- Do NOT touch any other files unless explicitly required
- Do NOT add new dependencies

After applying the fix, re-run the characterization tests from Step 2.1.
ALL tests must still pass. If any fail — STOP and explain why.
Шаг 2.3 — Документация фикса
Create homework-m6/stage2-fix-top3/fix-1-<short-name>.md with:
- Original finding (copy from synthesis.md)
- What I changed (diff)
- Why this approach (explain trade-offs)
- Test status (all tests passing screenshot or output)
- Lessons learned (1-2 sentences)
  Повторить шаги 2.1-2.3 для findings #2 и #3
  Recipe-ссылки
  6.3-legacy-strategies/recipe-risk-mitigation.md — 7 правил безопасного рефактора
  6.3-legacy-strategies/legacy-incidents.md — что бывает когда не пишешь характеризационные тесты
  📤 Output Checklist Stage 2 (бинарно)
  Файлы
  [ ] homework-m6/stage2-fix-top3/fix-1-<short-name>.md существует
  [ ] homework-m6/stage2-fix-top3/fix-2-<short-name>.md существует
  [ ] homework-m6/stage2-fix-top3/fix-3-<short-name>.md существует
  [ ] homework-m6/stage2-fix-top3/tests/ папка содержит тесты для всех 3 finding'ов
  Per fix-N.md содержит
  [ ] Original finding — copy-paste из synthesis.md
  [ ] What I changed — git diff (или скриншот diff'а)
  [ ] Why this approach — 2-3 предложения trade-offs (почему так, а не иначе)
  [ ] Test status — скриншот / output pytest / npm test показывает все тесты passing
  [ ] Lessons learned — 1-2 предложения про неочевидное (что AI пропустил / что я понял)
  Characterization tests
  [ ] Тесты написаны ДО фикса (в commit history видно что test commit раньше fix commit)
  [ ] Все тесты проходят на исходном коде (фиксируют текущее поведение)
  [ ] Все тесты проходят на исправленном коде (фикс ничего не сломал)
  [ ] Минимум 3 теста на каждый finding (happy path + 1 edge case + 1 error path)
  Качество fix'ов
  [ ] Ни один fix не нарушил публичный API (signature функций, response shapes)
  [ ] Ни один fix не добавил новые dependencies
  [ ] Каждый fix < 200 строк изменений
  [ ] Каждый fix имеет отдельный git commit с conventional message: fix(<scope>): ...
  Финал
  [ ] Все 3 fix'а закоммичены и запушены
  [ ] Все характеризационные тесты в CI зелёные (если CI настроен) или локально passing
  ⭐ Stage 3 — Legacy Audit + Living Documentation (через /plan) (~2.5-3.5 часа)
  🎯 Цель
  В CC сессии запустить /plan brainstorm и через него получить полный living documentation pack для своего fork`а:

project-index.json в корне (Layer 8 — машиночитаемая карта)
Новая структура docs/ со spec'ами твоих M3-M5 модулей (Layer 5 — Architecture / Specs)
update_project_index.py для автообновления (Layer 8 maintenance)
(опц.) Claude Code hook на PostToolUse
Обновлённый AGENTS.md с секциями про project-index + 4-step pattern
Старая docs/ папка заархивирована (docs-archived-YYYY-MM-DD/)
Главная идея: project-index.json не делается отдельно — он рождается из планирования audit'а проекта. План main agent'а включает создание индекса как один из шагов.

Почему planning mode
На занятии я объяснил: для multi-step analysis НЕЛЬЗЯ просто говорить «проанализируй всё». Главный агент:

Сначала планирует что и в каком порядке делать
Создаёт TODO с конкретными подзадачами
Прогоняет 4-step паттерн на каждом модуле по очереди
Параллельно собирает project-index.json
В конце создаёт новую docs/ структуру и обновляет AGENTS.md
Это и есть /plan mode в Claude Code (Shift+Tab+Tab или /plan команда).

Workflow
Шаг 3.1 — Найди свою папку с существующими docs (НЕ архивируй вслепую)
У тебя живые docs могут лежать в docs/, в project-data/, или раскиданы по корню — зависит от того, как ты строил M3-M5. Сначала найди их:

cd <your-fork>
ls docs/ 2>/dev/null; ls project-data/ 2>/dev/null   # где твоя живая структура?
⚠️ Не делай git mv docs/ docs-archived/ прямо сейчас. Архивация — это последний шаг (Phase 4), а не первый. Сначала legacy-auditor-mate в Phase 1.5 классифицирует каждый файл (✅/🔄/📦/❌), и только потом архивируется лишь то, что реально устарело (📦/❌). Если заархивируешь всё в начале — потеряешь актуальные доки, которые надо было сохранить. Просто впиши путь к своей docs-папке в Шаг 0.

Шаг 3.2 — Войти в роль legacy-auditor-mate (НЕ через Task!)
⭐ Главное отличие от других стейджей: мы используем специального orchestrator-агента (legacy-auditor-mate) который САМ планирует и запускает sub-agents.

⚠️ КРИТИЧНО: этого агента НЕЛЬЗЯ запускать через Task tool как sub-agent. Почему: sub-agent через Task получает ограниченный набор tools и не может сам спавнить другие sub-agents. А auditor должен спавнить security/performance/architecture mate'ов. Поэтому:

❌ НЕ делай так: Use the Task tool to spawn legacy-auditor-mate
✅ Делай так: в main CC сессии пишешь «Read .claude/agents/legacy-auditor-mate.md and act according to that role» — CC входит в роль auditor'а сам, оставаясь в главной сессии с полным набором tools (включая Task для дочерних спавнов).
Verify что у тебя в .claude/agents/ уже лежат все 5 mate-файлов (после Pre-requisites):

ls .claude/agents/
# security-mate.md
# performance-mate.md
# architecture-mate.md
# legacy-auditor-mate.md  ← orchestrator для этого Stage
# test-writer-mate.md     ← пригодится в Stage 4
Если чего-то нет — пересмотри Pre-requisites выше (там cp aidev-course-materials/M6/agents/*.md .claude/agents/).

Войди в роль auditor'а + активируй plan mode. В main CC сессии:

Включи plan mode: нажми Shift+Tab+Tab (toggle) ИЛИ напиши /plan в начале промпта
Вставь промпт role-entry (контекст ниже подобран под proshop_mern — поправь поля под свой fork если изменил структуру):
/plan

Read .claude/agents/legacy-auditor-mate.md and act according to that role
for the rest of this conversation. Follow your phase workflow.

PROJECT CONTEXT  (← подставь свои значения из Шага 0)
- Repo: proshop_mern fork (MERN e-commerce + твои MCP/RAG/feature-flags слои из M3-M5)
- Type: fullstack-monorepo
- Stack: Node + Express + Mongoose + MongoDB + React + <твой MCP-сервер: Python или Node> + <твой RAG-сервер>
- Subprojects to discover yourself: backend/, frontend/, <твой MCP>, <твой RAG>, possibly others.
  ⚠️ MCP/RAG могут быть top-level, вложены (ai/, backend/, scripts/, .codex/), или вовсе отсутствовать — walk всё дерево, не ограничивайся top-level
- Existing docs: ищи сам — могут быть в docs/, в project-data/, или в корне (audit carefully, don't trash)
- Audit scope: my M3-M5 modules (backend/controllers + <твой MCP> + <твой RAG> + feature-flags layer)
- Output directory: homework-m6/stage3-living-docs/  ← all reports + plan + docs-audit go here
- Extra constraints: keep ADR folder intact (docs/adr/ ИЛИ project-data/adrs/); do not delete characterization tests if present

WORKFLOW EXPECTATIONS
- Phase 1 (DISCOVERY): walk structure, detect stack from manifests, identify subprojects
- Phase 1.5 (EXISTING DOCS AUDIT) ⭐: classify each existing docs/ folder + top-level MD into
  ✅ ACCURATE / 🔄 PARTIALLY ACCURATE / 📦 HISTORICAL / ❌ STALE. Use the template at
  .claude/agents/templates/docs-audit.template.md as your output structure. Write to
  homework-m6/stage3-living-docs/docs-audit.md
- Phase 2 (PLAN): write homework-m6/stage3-living-docs/00-plan.md with full TODO list
  referencing docs-audit.md verdicts
- Phase 3 (DISPATCH): spawn security-mate / performance-mate / architecture-mate via Task tool
  with PROJECT CONTEXT blocks + concrete scope per spawn. Then run 4-step reverse engineering
  per module yourself. Specs пиши в РАБОЧУЮ папку docs/specs/<module>-spec.md в корне форка
  (в submission они попадут как docs-new/specs/ — см. Шаг 3.7).
- Phase 4 (AGGREGATE): synthesize reports + specs into homework-m6/stage3-living-docs/stage3-synthesis.md.
  ⚠️ НЕ перезаписывай homework-m6/stage1-code-review/synthesis.md — это оценённый артефакт Stage 1.
  Build docs-new/ FROM ✅/🔄 existing docs + new specs. Atomic swap В КОНЦЕ: твою живую docs-папку
  (docs/ ИЛИ project-data/) → docs-archived-YYYY-MM-DD/ (архивируй только 📦/❌ по вердиктам Phase 1.5)
- Phase 5 (AUTOMATE): copy update_project_index.py, configure hook, update AGENTS.md

CRITICAL constraints
- Stay in Plan mode for Phase 1, 1.5, 2. Wait for my approval before Phase 3-5.
- Do NOT trash all existing docs — use Phase 1.5 verdicts to decide per item.
- Spawn sub-agents via Task tool — you are the main session and you have full tools.
- Explicitly announce phase transitions.

Reference materials to read in Phase 1
- aidev-course-materials/M6/agents/templates/docs-audit.template.md   ← Phase 1.5 output template
- aidev-course-materials/M6/6.2-living-documentation/multi-level-docs-stack.md
- aidev-course-materials/M6/6.2-living-documentation/keeping-docs-current.md
- aidev-course-materials/M6/6.2-living-documentation/project-index.example.json
- aidev-course-materials/M6/6.3-legacy-strategies/recipe-cc-reverse-engineering.md
- aidev-course-materials/M6/6.2-living-documentation/example-hooks/update_project_index.py
  legacy-auditor-mate (твой main CC в этой роли) выполнит Phase 1 + 1.5 (Existing Docs Audit) + Phase 2 и остановится на запросе approval. Прочитай сначала docs-audit.md (что предлагается сохранить / обновить / архивировать) — это самое важное решение в этом стейдже. Потом 00-plan.md с TODO. Если согласен:

Plan approved. Switch to EXECUTE mode and proceed with Phase 3-5.
Update 00-plan.md with checkbox progress as you complete each TODO.
Auditor сам:

Спавнит security-mate / performance-mate / architecture-mate через Task tool
Получает их reports
Применяет 4-step reverse engineering на каждом модуле
Синтезирует в synthesis.md
Строит project-index.json
Создаёт новую docs/ структуру
Настраивает script + hook
Обновляет AGENTS.md
Если что-то пошло не так — auditor обновит 00-plan.md с пометкой проблемы и спросит тебя. Не пытайся всё делать руками — позволь orchestrator работать.

Шаг 3.3 — Per-module reverse engineering (4-step pattern из 6.3)
CC будет делать это в рамках плана. Для каждого модуля 4 шага:

Промпт-шаблон для каждого модуля (CC делает это автоматически, но проверь output):

Apply 4-step reverse engineering on <module-path> (e.g. mcp/feature_flags_server.py).
Read AGENTS.md first for project conventions.

Step 1 — UNDERSTAND (~2 min):
Describe business logic in plain English:
- What endpoints/functions does it expose?
- What business rules?
- What edge cases?
- What assumptions about data?
  Output: ~300 words markdown.

Step 2 — DECISION TABLE (~2 min):
Generate decision table for all conditional constructs.
Columns: condition, then-action, else-action, edge_case.
Output: 10-15 row markdown table.

Step 3 — MERMAID DIAGRAM (~2 min):
Generate mermaid sequenceDiagram for main flow + 1 error path.
Include all middleware, DB queries, response.

Step 4 — EDGE CASES (~1.5 min):
List ALL edge cases: race conditions, partial failures, malicious input,
auth bypass, privilege escalation.
Output: 15-30 bullet list.

Combine all 4 outputs into docs/specs/<module>-spec.md with sections:
1. # Overview (Step 1)
2. ## Decision Table (Step 2)
3. ## Sequence Diagram (Step 3 — mermaid block)
4. ## Edge Cases (Step 4)
5. ## Open Questions (что осталось неясно)
6. ## Suggested Characterization Tests (на основе edge cases)
Шаг 3.4 — project-index.json и update script (CC делает в рамках плана)
CC сам создаст project-index.json на основе walked структуры репо. Проверь что включено:

name, type, description, tech_stack
subprojects — annotated (mcp, rag, backend, frontend, feature flags)
system_folders — .claude/, docs/, uploads/
root_files — annotated
hard_rules — минимум 5 (включая «ALWAYS read project-index.json FIRST»)
ai_routing — какие MCP-tools для каких вопросов
filesystem_tree — depth 4
last_updated — ISO timestamp
Скрипт update_project_index.py копируется из (папки .claude/scripts/ может ещё не быть — создаём):

mkdir -p .claude/scripts
cp aidev-course-materials/M6/6.2-living-documentation/example-hooks/update_project_index.py \
.claude/scripts/update_project_index.py
chmod +x .claude/scripts/update_project_index.py
Адаптируй WATCH_PATHS в скрипте под СВОИ критичные директории (из Шага 0 — у тебя они называются иначе):

# подставь свои реальные имена папок:
WATCH_PATHS = ("backend/", "frontend/src/", "<твой-mcp>/", "<твой-rag>/", "<твой-feature-flags-путь>/")
# пример для одной из раскладок: ("backend/", "frontend/src/", "mcp-features/", "mcp-rag/", "backend/")
Тест standalone:

python3 .claude/scripts/update_project_index.py
# Должно вывести: [update-index manual] ✅ updated project-index.json
# Или: [update-index manual] no structural change, last_updated NOT bumped
Шаг 3.5 (опционально) — Подключить Claude Code hook
В .claude/settings.json (или settings.local.json) добавь:

{
"hooks": {
"PostToolUse": [
{
"matcher": "Write|Edit|Bash",
"hooks": [
{
"type": "command",
"command": "python3 \"$CLAUDE_PROJECT_DIR/.claude/scripts/update_project_index.py\""
}
]
}
],
"SessionStart": [
{
"hooks": [
{
"type": "command",
"command": "echo '✅ Read project-index.json first for repo structure.'"
}
]
}
]
}
}
Тест: в свежей CC сессии попроси «создай test файл в backend/services/`. На stderr должно появиться:

[update-index hook] triggered by Write on backend/services/test.js
[update-index hook] ✅ updated project-index.json (tree + last_updated)
Скриншот этого момента → homework-m6/stage3-living-docs/hook-screenshot.png.

Шаг 3.6 — Обновить корневой AI-конфиг (AGENTS.md ИЛИ CLAUDE.md) (CC делает в рамках плана)
Добавляй секции в свой файл правил агента из Шага 0 (CLAUDE.md/AGENTS.md, .cursor/rules/, .github/copilot-instructions.md, .codex/, opencode.json…). Нет такого файла — создай подходящий твоему инструменту. Главное — чтобы обе секции реально присутствовали; это и проверяется в чеклисте (никакой diff сдавать не нужно).

CC добавит две секции в начало твоего корневого конфига:

## ⭐ START HERE — repo navigation

**ALWAYS read `project-index.json` FIRST** at the start of every session.

It contains:
- subprojects — annotated map of all subprojects
- system_folders — .claude/, docs/, uploads/ with purpose
- hard_rules — project-wide rules
- filesystem_tree — full directory tree (auto-updated, depth 4)

This file is faster than find / tree / ls, accurate, and machine-readable.

## ⭐ Keeping project-index.json current — MANDATORY

**ALWAYS** update `project-index.json` when:
- Creating a new file or folder
- Deleting / renaming files or folders
- Changing subproject purpose / description

How: `python3 .claude/scripts/update_project_index.py`
Or: auto-fires via PostToolUse hook (see .claude/settings.local.json)

For 4-step legacy analysis on new modules: see docs/specs/ for past examples.
Шаг 3.7 — Скопировать всё в submission папку
mkdir -p homework-m6/stage3-living-docs
cp project-index.json homework-m6/stage3-living-docs/
cp .claude/scripts/update_project_index.py homework-m6/stage3-living-docs/
# твоя НОВАЯ docs-структура (та, что собрал auditor) → docs-new/:
cp -r docs/ homework-m6/stage3-living-docs/docs-new/
mv docs-archived-* homework-m6/stage3-living-docs/docs-archived/  # если ещё не было
# Копию обновлённого файла правил агента — для проверки секций (подставь свой путь из Шага 0):
#   например: cp AGENTS.md ...  |  cp CLAUDE.md ...  |  cp .github/copilot-instructions.md ...  |  cp -r .cursor/rules ...
cp AGENTS.md homework-m6/stage3-living-docs/ 2>/dev/null || cp CLAUDE.md homework-m6/stage3-living-docs/ 2>/dev/null || true
Recipe-ссылки
6.2-living-documentation/multi-level-docs-stack.md — 8 уровней docs
6.2-living-documentation/keeping-docs-current.md — 3 уровня enforcement
6.2-living-documentation/example-hooks/ — готовый скрипт + settings
6.2-living-documentation/hooks-reference/ — все 8 типов hooks + 7 примеров
6.2-living-documentation/project-index.example.json — живой пример
6.3-legacy-strategies/recipe-cc-reverse-engineering.md — 4-step паттерн
📤 Output Checklist Stage 3 (бинарно)
Файлы в submission папке
[ ] homework-m6/stage3-living-docs/00-plan.md (с галочками выполненных подзадач)
[ ] homework-m6/stage3-living-docs/docs-audit.md ⭐ — verdict per existing doc folder/file (✅ ACCURATE / 🔄 PARTIALLY / 📦 HISTORICAL / ❌ STALE)
[ ] homework-m6/stage3-living-docs/project-index.json
[ ] homework-m6/stage3-living-docs/update_project_index.py
[ ] homework-m6/stage3-living-docs/docs-new/ (содержит README + specs + adr + architecture)
[ ] homework-m6/stage3-living-docs/docs-archived/ (старая docs)
[ ] homework-m6/stage3-living-docs/ — копия твоего файла правил агента (AGENTS.md / CLAUDE.md / copilot-instructions.md / …) с новыми секциями
[ ] (опц.) homework-m6/stage3-living-docs/hook-screenshot.png
project-index.json содержит
[ ] Валидный JSON (python3 -m json.tool < project-index.json без ошибок)
[ ] last_updated — сегодняшний ISO timestamp
[ ] subprojects — ≥ 3 annotated entries (mcp, rag, backend минимум)
[ ] system_folders — ключевые отмечены (.claude/, твоя docs-папка docs/ ИЛИ project-data/, uploads/)
[ ] hard_rules — ≥ 5 правил, включая «ALWAYS read project-index.json FIRST»
[ ] ai_routing — минимум 1 routing entry (например feature_flag_questions → MCP)
[ ] filesystem_tree — содержит все ключевые папки fork`а
Per-module specs
[ ] Минимум 2 module spec файла в рабочей docs/specs/ (в submission — docs-new/specs/)
[ ] Каждый spec имеет 4-6 секций: Overview / Decision Table / Sequence Diagram / Edge Cases / Open Questions / Suggested Tests
[ ] Mermaid диаграммы рендерятся (проверить в GitHub preview)
[ ] Edge Cases section содержит ≥ 10 пунктов на модуль
update_project_index.py
[ ] Файл существует в .claude/scripts/
[ ] Executable (-rwxr-xr-x)
[ ] WATCH_PATHS адаптирован под мой fork
[ ] Standalone запуск работает (вывод [update-index manual] ...)
Hook (опционально)
[ ] .claude/settings.json (или .local.json) содержит hooks.PostToolUse
[ ] Hook сработал хотя бы 1 раз (screenshot в submission)
Файл правил агента (AGENTS.md / CLAUDE.md / .cursor/rules / copilot-instructions.md / …)
[ ] Секция «⭐ START HERE» добавлена
[ ] Секция «⭐ Keeping project-index.json current» добавлена
[ ] Размер файла по-прежнему разумный (не разрослось; для односекционных типа copilot-instructions — компактно)
Архив
[ ] docs-archived-YYYY-MM-DD/ создан в корне fork (старые доки docs/ или project-data/ целы)
[ ] Архивировано только устаревшее (📦/❌ по вердиктам Phase 1.5), актуальное (✅/🔄) перенесено в новую структуру
⭐ Stage 4 — Tests Agent (~1-1.5 часа)
🎯 Цель
Использовать отдельного sub-agent для написания тестов + прогнать его на 2 сервисах из своего кода. Это естественное продолжение Stage 3: ты уже знаешь что код делает (через specs из reverse engineering), теперь пиши тесты которые это проверяют.

Почему отдельный test-агент
security-mate / performance-mate / architecture-mate — это review-агенты (find, not fix)
test-writer-mate — это write-агент (генерирует код тестов)
Разделение: review-агенты тестов не пишут, иначе они находят проблемы под свои же тесты (см. Topic 6.4 «Fake test coverage»)
Шаг 4.1 — Проверить что test-writer-mate есть в .claude/agents/
Pre-built универсальный агент уже скопирован в твой fork (по Pre-requisites выше). Verify:

ls -1 .claude/agents/test-writer-mate.md
# должен показать файл
Если файла нет:

cp aidev-course-materials/M6/agents/test-writer-mate.md .claude/agents/
System prompt этого агента — универсальный (любой стек, любой test framework). Project-specific вещи (какой framework, какие конвенции, какой scope) передаются в spawn-промпте.

При желании можешь адаптировать system prompt под свой стек (например, добавить специфику pytest fixtures для своих общих фикстур). Это опционально и не оценивается.

Шаг 4.2 — Запустить test-writer на 2 сервисах
Выбери 2 модуля из своих M3-M5 — лучше всего те, что прошли через Stage 3 reverse engineering (у тебя уже есть spec-файлы для них в docs/specs/).

В CC (подставь свои значения из Шага 0):

Use the Agent tool to spawn test-writer-mate (from .claude/agents/test-writer-mate.md).

Service 1: <твой MCP-сервер>   (например mcp/feature_flags_server.py ИЛИ mcp-features/index.js)
Reference spec: docs/specs/<module>-spec.md

Write tests covering:
- All public functions/endpoints from spec
- Top 10 edge cases from spec's Edge Cases section
- 2-3 security tests if applicable

Output to <твоя test-папка>/<test-файл>
(пример Python: mcp/__tests__/test_feature_flags_server.py
пример JS:     mcp-features/__tests__/index.test.js)

Use <твой test framework: pytest или jest>. Match the project's existing test style.
Если existing test style нет (тестов в проекте ещё не было) — заведи минимальную конвенцию
(папка __tests__/ рядом с сервисом) и придерживайся её для обоих сервисов.
Повтори для service 2 (твой RAG-сервер — например rag/server.js ИЛИ mcp-rag/index.js).

Шаг 4.3 — Прогнать тесты
# Python
pytest mcp/__tests__/ -v

# Node
npm test rag/__tests__/
Если что-то падает — НЕ исправляй код. Прочитай каждый fail:

Если тест неправильный (не отражает реальное поведение) — попроси agent его исправить
Если тест прав, а код кривой — это твой next finding для Stage 2 (но это уже не вашу домашку)
Шаг 4.4 (опционально, для senior) — MSI замер (mutation testing)
Инструмент зависит от твоего стека (Шаг 0).

Если Python (pytest):

pip install mutmut==3.5.0
cd <твоя-mcp-папка>/
mutmut run --paths-to-mutate <твой-сервис>.py
mutmut results
Если Node/JS (jest): mutmut на JS НЕ работает — используй Stryker:

npm install --save-dev @stryker-mutator/core @stryker-mutator/jest-runner
npx stryker init   # один раз, сконфигурирует stryker.conf.json
npx stryker run
Целевая метрика: MSI > 70%. Если меньше — попроси test-writer-mate улучшить assertions:

Read the survived mutants (mutmut/stryker) for <твой-сервис>.
For each surviving mutant, identify which test SHOULD have caught it but didn't.
Strengthen the assertions in that test. Output as patch to existing test file.
Recipe-ссылки
6.4-synthetic-testing/recipe-mini-task.md — детальный 75-минутный workflow
6.4-synthetic-testing/coverage-vs-msi.md — что такое MSI
6.4-synthetic-testing/tools-landscape.md — mutmut / cosmic-ray / Diffblue / PromptFuzz
📤 Output Checklist Stage 4 (бинарно)
Файлы
[ ] .claude/agents/test-writer-mate.md создан в моём fork
[ ] homework-m6/stage4-tests-agent/test-writer-mate.md (копия для submission)
[ ] homework-m6/stage4-tests-agent/service-1-tests/ — тесты для сервиса 1
[ ] homework-m6/stage4-tests-agent/service-2-tests/ — тесты для сервиса 2
[ ] homework-m6/stage4-tests-agent/coverage-report.png — скриншот прохождения тестов
test-writer-mate.md содержит
[ ] YAML frontmatter (name, description, model: claude-opus-4-7, tools)
[ ] ROLE-LOCK секция (только Write test code, никогда production code)
[ ] Strong test principles секция (не assert not None)
[ ] Шаблон 4 типов тестов per функционал: happy / edges / error / security
[ ] Anti-patterns to AVOID секция (no try-catch wrappers, no mocking everything, etc.)
[ ] Размер ≤ 250 строк (compact, не разрастающийся)
Сгенерированные тесты — качество
[ ] 2 сервиса покрыты (минимум) из моих M3-M5 модулей
[ ] Per service ≥ 5 test cases: 1 happy path + 2-3 edge cases + 1-2 error paths + (опц.) 1 security
[ ] Assertions проверяют VALUES: assert response.status == 200 and body['id'] == 42 — НЕ assert response is not None
[ ] Ни одного теста с try-catch wrapper'ом который swallow'ит exceptions
[ ] Ни одного trivial теста assert 2+2 == 4
[ ] Test data реалистичная (не "foo" / "bar" — а production-like values)
Прогон
[ ] Все тесты проходят на текущем коде
[ ] Test runner (pytest / jest) показывает stats в coverage-report.png
[ ] Если есть failing tests — explain в submission README почему (баг в коде vs test wrong assumption)
Bonus (для senior — опционально)
[ ] mutmut запущен на тестируемом модуле
[ ] Starting MSI замерен (starting_msi.txt)
[ ] Assertions улучшены на survived mutants (повторный прогон)
[ ] Final MSI > 70% (final_msi.txt)
[ ] Краткий analysis 1-2 параграфа: какие mutations выживали чаще всего, какие assertions добавили
Cross-stage связи (важно понять)
Stage'ы не изолированы, они цепочка:

Stage 1 (multi-agent review)  → synthesis.md с Top-3 findings
↓
Stage 2 (fix Top-3)           → исправили критичное, characterization tests прошли
↓
Stage 3 (living docs)         → project-index.json + новая docs/ + автообновление
│  (через legacy-auditor-mate как orchestrator)
↓
Stage 4 (tests agent)         → test-writer-mate + защитили тестами 2 сервиса
К концу домашки у тебя:

✅ Понимаешь что нашли AI-агенты ревью (Stage 1)
✅ Исправил критичное (Stage 2)
✅ Задокументировал систему (project-index + specs) + автообновление (Stage 3)
✅ Защитил тестами (Stage 4)
Это полный цикл качества который ты применишь в production-проектах.

Что сдавать (общая папка)
proshop_mern/homework-m6/
├── stage1-code-review/
├── stage2-fix-top3/
├── stage3-living-docs/
└── stage4-tests-agent/
Ссылку на папку / PR — в студенческом Telegram-канале с хэштегом #m6-submission + твоё имя.

Дедлайн
Перед стартом M7 (~2 недели после M6).

Если успеешь — раньше. Если нужно дольше — напиши в чат, согласуем.

Cross-module hooks (что используется откуда)
Из	В Stage	Что используется
M2 (IDE setup)	все	Claude Code установлен + настроен
M3 (MCP)	Stage 1, 4	review своего MCP сервера, его спецификация
M4 (DESIGN.md)	Stage 4	архитектурный контекст для reverse eng
M5 (sub-agents)	Stage 1, 3, 4	паттерн запуска нескольких sub-agents (review-team, auditor-orchestrator, test-writer)
M6 — текущий	все	recipes из 6.1-6.4
Полезные ссылки (студ-репо M6)
README.md — overview модуля
6.1 AI Code Review — recipes, agents, tools-catalog
6.2 Living Documentation — multi-level stack, hooks, project-index
6.3 Legacy Strategies — reverse engineering, risk mitigation, incidents
6.4 Synthetic Testing — recipes, tools, MSI / coverage
❓ FAQ
Q: У меня MCP/RAG называются иначе (и/или на JS), а в ТЗ примеры с mcp/…py. Это норма? A: Да, абсолютно. Каждый строил M3-M5 со своими именами папок и своим стеком — у кого-то mcp/ на Python, у кого-то mcp-features/ на Node, доки в docs/ или в project-data/, корневой конфиг AGENTS.md или CLAUDE.md. Заполни Шаг 0 один раз и подставляй СВОИ значения везде, где видишь <...> или пример-путь. Оценивается работа на ТВОЁМ форке, а не совпадение с примером. Если структуру не знаешь — legacy-auditor-mate в Stage 3 Phase 1 сам её обнаружит и подскажет.

Q: Можно делать стейджи не по порядку? A: Stage 2 требует Stage 1 (synthesis.md). Stage 4 (tests) проще делать после Stage 3 (есть specs модулей). Остальные — в любом порядке.

Q: Что если у меня в M3-M5 мало кода / простой код? A: Возьми чужой код Brad Traversy слоя как backup: backend/controllers/userController.js, orderController.js. Они достаточно сложные.

Q: Можно использовать GPT / Cursor вместо Claude Code? A: Можно, но recipes написаны под Claude Code (Agent tool, hooks). Адаптируй: Cursor — Cmd+K + chat mode, GPT — через ChatGPT app. Submission должна быть та же — папки + файлы.

Q: Что если hook не срабатывает? A: Проверь claude --version ≥ v2.1.32, путь к скрипту, chmod +x, settings.json валидный. Если не получается — пропусти Stage 3 hook часть (это опционально), запускай update_project_index.py руками.

Q: Сколько времени реально потратишь? A: Минимум 7 часов если делаешь честно. Если поверхностно (без characterization tests, без MSI) — 4-5 часов, но reviewer (я) увидит и поставит ниже.

Финал
Отправьте непустой ответ тут, чтобы было понятно что можно проверять. Также ссылку в чат.