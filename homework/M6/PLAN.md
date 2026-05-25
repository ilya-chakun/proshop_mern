# M6 Plan — Agent-Controller Homework

## Step 0 — My Fork Map

| What | My Fork |
|------|---------|
| MCP feature-flags server | `ai/mcp-feature-flags/server.py` (Python) |
| MCP search-docs server | `ai/mcp-search-docs/server.py` (Python) |
| RAG module | `ai/rag/` (Python: ingest.py, query.py, config.py) |
| Feature flags config | `backend/features.json` |
| Backend controllers | `backend/controllers/` (JS, ES Modules) |
| Backend middleware | `backend/middleware/` (JS) |
| Backend routes | `backend/routes/` (JS, includes `featureFlagsRoutes.js`) |
| Test framework (Python) | pytest |
| Test framework (JS) | jest |
| Mutation tool (Python) | mutmut |
| AI agent rules file | `AGENTS.md` + `opencode.json` (OpenCode, NOT Claude Code) |
| Existing docs folder | `homework/` (main docs surface — adr, architecture, coding-standards, lessons, M2-M5 plans) |
| Existing ADRs | `homework/adr/0001-single-express-server-and-react-build.md`, `0002-redux-thunk-and-localstorage-client-state.md`, `0003-jwt-bearer-auth-and-role-middleware.md` |
| Root-level docs | `AGENTS.md`, `DESIGN.md`, `FINDINGS.md`, `README.md`, `report.md` |
| AI-related docs | `ai/README.md` |
| Copilot instructions | `.github/copilot-instructions.md` |
| Other homework docs | `homework/architecture.md`, `homework/coding-standards.md`, `homework/lessons/` (6 lesson files), `homework/m3/`, `homework/m2-char-tests/`, `homework/M4/`, `homework/M5/` |

### Adaptation: OpenCode instead of Claude Code

| Claude Code concept | OpenCode equivalent | Notes |
|---------------------|---------------------|-------|
| `.claude/agents/*.md` | `.opencode/docs/` (cached prompts) | Создадим `.claude/agents/` для формальной сдачи |
| `.claude/settings.json` hooks | Нет прямого аналога | OpenCode не поддерживает PostToolUse hooks. Скрипт `update_project_index.py` будет standalone-only. Для сдачи: создадим `.claude/settings.json` с конфигом хуков как reference, пометим что мы на OpenCode |
| `/plan` mode (Shift+Tab+Tab) | Commander/Worker/Reviewer agents | OpenCode использует multi-agent orchestration |
| `Task` tool spawning sub-agents | `delegate_task` / `call_agent` | Функционально эквивалентно |
| Agent Team (`CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS`) | Parallel `delegate_task` calls | |

### Key differences from example repo

- MCP servers live under `ai/` not `mcp/` or top-level
- Both MCP servers are Python (not mixed Python/Node)
- RAG is Python (`ai/rag/`) not Node.js
- No `docs/` folder at root — docs are in `homework/` subfolders
- No `project-index.json` yet
- No `.claude/` folder yet
- Credentials in `homework/M5/credentials/` are LOCAL ONLY (gitignored) — NOT a security finding

---

## Pre-requisites (before Stage 1)

> **🔴 Fix #1, #2**: Agent files and scripts don't exist locally yet.

- [ ] **P0.1** Create `.claude/agents/` with 3 review agent definitions for grading compatibility.
  Source: cached prompts in `.opencode/docs/raw_githubusercontent_com_Serg1kk_aidev-course-materials_main_M6_agents_*.md`.
  Copy content into:
  - `.claude/agents/security-mate.md`
  - `.claude/agents/performance-mate.md`
  - `.claude/agents/architecture-mate.md`

- [ ] **P0.2** Create `.claude/agents/legacy-auditor-mate.md` and `.claude/agents/test-writer-mate.md` (for Stage 3/4).

- [ ] **P0.3** `update_project_index.py` — write from scratch (NOT copy from `aidev-course-materials/`).
  The course repo example is cached in `.opencode/docs/` as reference, but `aidev-course-materials/` is NOT cloned locally.
  Adapt WATCH_PATHS to: `("backend/", "frontend/src/", "ai/mcp-feature-flags/", "ai/mcp-search-docs/", "ai/rag/")`.

- [ ] **P0.4** Create `homework-m6/` deliverables folder structure (all 4 stage subdirs).

> **🟡 Fix #3**: OpenCode execution model.
> Throughout this plan, all "agent prompts" are executed via `delegate_task(agent: "Worker", prompt: "<full prompt text>")`.
> We do NOT spawn agents from .md files — OpenCode doesn't support that.
> `.claude/agents/*.md` exist solely as grading artifacts.

> **🟡 Fix #5**: `docs-audit.template.md` is cached in `.opencode/docs/raw_githubusercontent_com_..._temp.md`.
> We'll read the cached version when executing S3.2.

> **🟡 Fix #8**: Stage 5 is our addition (not in the assignment). Marked as OPTIONAL/BONUS.

> **🟢 Fix #9**: `docs/` does not exist at root. Stage 3 creates it from scratch.
> All `docs/specs/`, `docs/adr/` paths in Stage 3 refer to NEW directories created during that stage.

---

## Stage 1 — Multi-Agent Code Review (~1.5-2h)

### Scope

Files to review:
- `backend/controllers/*.js` (userController, productController, orderController, featureFlagController)
- `backend/middleware/*.js` (authMiddleware, errorMiddleware)
- `backend/routes/*.js` (all 5 route files)
- `backend/server.js`
- `backend/utils/generateToken.js`
- `backend/models/*.js`
- `ai/mcp-feature-flags/server.py`
- `ai/mcp-search-docs/server.py`
- `ai/rag/*.py` (query.py, ingest.py, config.py)

Out of scope: `frontend/`, `node_modules/`, `uploads/`, `tests/`, `__tests__/`, `scripts/`, `frontend/public/`, `homework/`

### Steps

- [ ] **S1.1** Security review -> `homework-m6/stage1-code-review/security-review.md` + `security-findings.jsonl`
  - Target: >= 5 findings (aim 8-20) with file:line, severity (HIGH/MEDIUM/LOW), OWASP category, fix approach
  - Each finding must have: file:line, severity, OWASP code, evidence snippet, recommendation

  **Prompt template (adapted for our fork):**
  ```
  PROJECT CONTEXT
  - Repo: proshop_mern fork (MERN e-commerce + MCP/RAG/feature-flags layers from M3-M5)
  - Stack: Node + Express + Mongoose + MongoDB + React + Python MCP servers + Python RAG
  - Agent rules file: AGENTS.md (read first)
  - ADRs at homework/adr/ (read first)
  - Auth model: JWT-based, password hashing via bcrypt

  SCOPE
  - backend/controllers/*.js, backend/middleware/*.js, backend/routes/*.js
  - ai/mcp-feature-flags/server.py
  - ai/mcp-search-docs/server.py
  - ai/rag/*.py
  - Out of scope: tests/, __tests__/, scripts/, frontend/public/, node_modules/

  OUTPUTS
  - JSONL findings: homework-m6/stage1-code-review/security-findings.jsonl
  - Human summary: homework-m6/stage1-code-review/security-review.md

  CONSTRAINTS
  - Read-only. Aim for 8-20 quality findings.
  ```

- [ ] **S1.2** Performance review -> `homework-m6/stage1-code-review/performance-review.md` + `performance-findings.jsonl`
  - Target: >= 5 findings with estimated impact (+Xms p95 or +XMB memory), fix approach
  - Min 1 finding about N+1 / blocking I/O / memory

  **Prompt template:**
  ```
  PROJECT CONTEXT
  - Same as S1.1.
  - Runtime models: Node.js event loop (Express) + Python sync (MCP servers).
  - Known hot paths: /api/orders, /api/products (list), MCP feature-flag endpoint.

  SCOPE
  - Same files as S1.1.
  - Also check: N+1 patterns, missing pagination, blocking I/O, missing caching.

  OUTPUTS
  - homework-m6/stage1-code-review/performance-findings.jsonl
  - homework-m6/stage1-code-review/performance-review.md

  Reference findings from security-review.md if there is overlap (e.g. ReDoS).
  ```

- [ ] **S1.3** Architecture review -> `homework-m6/stage1-code-review/architecture-review.md` + `architecture-findings.jsonl`
  - Target: >= 5 findings with criticality (C1/C2/C3), ADR references, 1-2 new ADR proposals
  - Must read `homework/adr/` first and reference existing ADRs
  - Must read existing docs (AGENTS.md, homework/architecture.md) first

  **Prompt template:**
  ```
  PROJECT CONTEXT
  - Same as S1.1.
  - Layering convention: controller → model (Mongoose). MCP and RAG live in ai/ with own structure.
  - Read homework/adr/*.md FIRST if exists.

  SCOPE
  - Same files as S1.1.

  OUTPUTS
  - homework-m6/stage1-code-review/architecture-findings.jsonl
  - homework-m6/stage1-code-review/architecture-review.md
  - Propose 1-2 new ADRs if you find undocumented architectural decisions.

  Cross-reference security-review.md and performance-review.md.
  ```

- [ ] **S1.4** Synthesis -> `homework-m6/stage1-code-review/synthesis.md`
  - Read all 3 review files
  - Group by SEVERITY (HIGH / MEDIUM / LOW sections)
  - HIGH severity must contain >= 2 findings
  - De-duplicate cross-mate findings
  - Mark cross-mate observations (min 1 finding flagged by >= 2 mates)
  - "Recommended fix order" — top 5
  - **"Top-3 для Stage 2"** — explicit table: `# | File:line | Issue | Recommended fix | Effort`
  - Total token usage estimate (for cost awareness)

### Deliverables
```
homework-m6/stage1-code-review/
  security-review.md
  security-findings.jsonl
  performance-review.md
  performance-findings.jsonl
  architecture-review.md
  architecture-findings.jsonl
  synthesis.md
```

### Stage 1 Checklist (from homework spec)
- [ ] security-review.md: >= 5 findings, each has file:line + severity + OWASP category + fix approach
- [ ] performance-review.md: >= 5 findings, each has estimated impact, min 1 about N+1/blocking I/O/memory
- [ ] architecture-review.md: >= 5 findings, existing ADRs referenced, 1-2 new ADR proposals, criticality C1/C2/C3
- [ ] synthesis.md: grouped by severity, HIGH >= 2, Top-3 table, cross-mate observations >= 1, token usage estimate

---

## Stage 2 — Fix Top-3 (~1.5-2h)

Depends on: Stage 1 synthesis.md Top-3 list

> **🟡 Fix #4**: Top-3 selection criteria (applied AFTER Stage 1 produces synthesis.md):
> 1. Prioritize HIGH severity findings
> 2. Prefer findings that span multiple review dimensions (cross-mate)
> 3. Prefer findings with clear, bounded fixes (< 200 lines)
> 4. Mix: at least 1 security + 1 non-security finding

### Steps (repeat for each of 3 findings)

- [ ] **S2.1** Characterization tests BEFORE fix (pin current behavior)
  - pytest for Python files, jest for JS files
  - Save to `homework-m6/stage2-fix-top3/tests/`
  - Tests MUST pass on current code — if they don't, fix the TEST not the code
  - Min 3 tests per finding: happy path + 1 edge case + 1 error path

  **Prompt template per finding:**
  ```
  Read homework-m6/stage1-code-review/synthesis.md. Take finding #N.
  For the affected file (e.g. ai/mcp-feature-flags/server.py), generate
  characterization tests that pin down CURRENT behavior — even if it's wrong.

  Use pytest (Python) or jest (JS). Save to homework-m6/stage2-fix-top3/tests/
  test-<finding-N-short-name>.py (or .js).

  Run the tests. They MUST pass on current code. If they don't — fix the test,
  not the code (we're capturing current behavior).
  ```

- [ ] **S2.2** Apply fix with explicit constraints
  ```
  Now apply the fix for finding #N. Use this approach:
  [paste recommended_fix from synthesis.md]

  Constraints (Do NOT):
  - Do NOT change the public API of this file
  - Do NOT modify error handling logic
  - Do NOT remove existing logging
  - Do NOT touch any other files unless explicitly required
  - Do NOT add new dependencies

  After applying the fix, re-run the characterization tests from Step 2.1.
  ALL tests must still pass. If any fail — STOP and explain why.
  ```
  - Each fix < 200 lines of changes

- [ ] **S2.3** Document each fix in `homework-m6/stage2-fix-top3/fix-N-<topic>.md`
  - Original finding (copy from synthesis.md)
  - What I changed (git diff)
  - Why this approach (2-3 sentences trade-offs)
  - Test status (output showing all tests passing)
  - Lessons learned (1-2 sentences about what was non-obvious)

- [ ] **S2.4** Git commit each fix separately: `fix(<scope>): ...`
  - Test commit should be BEFORE fix commit (visible in git history)

### Deliverables
```
homework-m6/stage2-fix-top3/
  fix-1-<topic>.md
  fix-2-<topic>.md
  fix-3-<topic>.md
  tests/
    test-<finding-1>.{py|js}
    test-<finding-2>.{py|js}
    test-<finding-3>.{py|js}
```

### Stage 2 Checklist (from homework spec)
- [ ] 3 fix-N files exist with: original finding, diff, reasoning, test status, lessons learned
- [ ] tests/ folder has tests for all 3 findings
- [ ] Tests written BEFORE fixes (visible in commit history)
- [ ] All tests pass on original code AND on fixed code
- [ ] Min 3 tests per finding (happy + edge + error)
- [ ] No fix changes public API signatures or response shapes
- [ ] No fix adds new dependencies
- [ ] Each fix < 200 lines
- [ ] Each fix has separate git commit with conventional message
- [ ] All committed and pushed

---

## Stage 3 — Legacy Audit + Living Docs (~2.5-3.5h)

### Steps

- [ ] **S3.1** Discovery — walk project structure, identify all docs surfaces
  - Known docs surfaces:
    - `homework/adr/` — 3 ADR files (0001, 0002, 0003)
    - `homework/architecture.md` — architecture overview
    - `homework/coding-standards.md` — coding standards
    - `homework/lessons/` — 6 lesson files from M2-era debugging
    - `homework/m2-char-tests/` — characterization test examples
    - `homework/m3/` — M3 agent plan and manual steps
    - `homework/M4/` — M4 plan + README
    - `homework/M5/` — M5 plan, lessons, simulators, test results, video recordings
    - Root: `AGENTS.md`, `DESIGN.md`, `FINDINGS.md`, `README.md`, `report.md`
    - `.github/copilot-instructions.md`
    - `ai/README.md`

- [ ] **S3.2** Existing Docs Audit (Phase 1.5)
  - Classify each doc/folder: ✅ ACCURATE / 🔄 PARTIALLY ACCURATE / 📦 HISTORICAL / ❌ STALE
  - Use template from `docs-audit.template.md` (cached in .opencode/docs/)
  - Output: `homework-m6/stage3-living-docs/docs-audit.md`

- [ ] **S3.3** Write plan: `homework-m6/stage3-living-docs/00-plan.md`
  - Full TODO list referencing docs-audit.md verdicts
  - Checkboxes updated as work progresses

- [ ] **S3.4** Per-module reverse engineering (4-step pattern) on 2 modules
  - **Module 1**: `ai/mcp-feature-flags/server.py` (237 lines, MCP feature flags server)
  - **Module 2**: `ai/rag/query.py` (290 lines, RAG query engine)
  - ~~`ai/mcp-search-docs/server.py`~~ — only 67 lines, too small for meaningful 4-step analysis (🟡 Fix #6)
  - These same modules reused in Stage 4 for test generation

  **4-step pattern per module:**
  ```
  Apply 4-step reverse engineering on <module-path>.
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

  Combine all 4 into docs/specs/<module>-spec.md with sections:
  1. # Overview (Step 1)
  2. ## Decision Table (Step 2)
  3. ## Sequence Diagram (Step 3 — mermaid block)
  4. ## Edge Cases (Step 4)
  5. ## Open Questions
  6. ## Suggested Characterization Tests
  ```

  - Each spec must have all 6 sections
  - Mermaid diagrams must render in GitHub preview
  - Edge Cases >= 10 per module

- [ ] **S3.5** Create `project-index.json` in repo root
  - Must contain:
    - `name`, `type`, `description`
    - `tech_stack` — backend, frontend, database, additions
    - `subprojects` — >= 3 annotated entries: backend, ai/mcp-feature-flags, ai/mcp-search-docs, ai/rag, frontend
    - `system_folders` — `.opencode/`, `homework/`, `uploads/`
    - `root_files` — annotated
    - `hard_rules` — >= 5, including "ALWAYS read project-index.json FIRST"
    - `ai_routing` — >= 1 entry (e.g. feature_flag_questions -> MCP)
    - `filesystem_tree` — depth 4, all key folders
    - `last_updated` — today's ISO timestamp
  - Must be valid JSON (`python3 -m json.tool < project-index.json`)

- [ ] **S3.6** Create `update_project_index.py`
  - Adapt WATCH_PATHS to: `("backend/", "frontend/src/", "ai/mcp-feature-flags/", "ai/mcp-search-docs/", "ai/rag/")`
  - Place in `.opencode/scripts/` AND `.claude/scripts/` (for submission compatibility)
  - Must be executable (`chmod +x`)
  - Standalone test: `python3 .opencode/scripts/update_project_index.py` -> `[update-index manual] ...`

- [ ] **S3.7** Update AGENTS.md with 2 new sections at the top:
  ```markdown
  ## ⭐ START HERE — repo navigation

  **ALWAYS read `project-index.json` FIRST** at the start of every session.
  It contains: subprojects, system_folders, hard_rules, filesystem_tree.
  This file is faster than find / tree / ls, accurate, and machine-readable.

  ## ⭐ Keeping project-index.json current — MANDATORY

  **ALWAYS** update `project-index.json` when creating/deleting/renaming files or folders.
  How: `python3 .opencode/scripts/update_project_index.py`
  For 4-step legacy analysis on new modules: see docs/specs/ for past examples.
  ```

- [ ] **S3.8** Archive old docs (only 📦 HISTORICAL and ❌ STALE per audit verdicts)
  - > **🟡 Fix #7**: Docs live in `homework/`, not `docs/`. Archive scope:
  -   Only `homework/` items marked 📦 or ❌ move to `homework/archived-2026-05-25/`
  -   Root files (AGENTS.md, DESIGN.md, FINDINGS.md, README.md) stay at root — NEVER archive
  -   ADRs (`homework/adr/`) are NEVER archived — copy into new `docs/adr/`
  -   ✅ ACCURATE docs stay in place; 🔄 PARTIALLY ACCURATE docs get updated in place or copied to `docs/`

- [ ] **S3.9** Copy everything to submission folder

### Deliverables
```
homework-m6/stage3-living-docs/
  00-plan.md                   (with checkbox progress)
  docs-audit.md                (verdict per doc: ✅/🔄/📦/❌)
  project-index.json           (copy from root)
  update_project_index.py      (copy from scripts)
  docs-new/                    (copy of new docs/)
    README.md                  (index)
    specs/                     (*-spec.md per module)
    adr/                       (copied from homework/adr/)
    architecture/              (high-level overview)
  docs-archived/               (old docs that were 📦/❌)
  AGENTS.md                    (copy with 2 new sections)
```

### Stage 3 Checklist (from homework spec)
- [ ] 00-plan.md exists with checked-off subtasks
- [ ] docs-audit.md exists with verdict per existing doc (✅/🔄/📦/❌)
- [ ] project-index.json exists and is valid JSON
- [ ] project-index.json has: last_updated (today), subprojects >= 3, system_folders, hard_rules >= 5, ai_routing >= 1, filesystem_tree
- [ ] update_project_index.py exists, is executable, works standalone
- [ ] WATCH_PATHS adapted to my fork
- [ ] docs-new/ contains README + specs + adr + architecture
- [ ] Min 2 module spec files in docs-new/specs/
- [ ] Each spec has 6 sections: Overview / Decision Table / Sequence Diagram / Edge Cases / Open Questions / Suggested Tests
- [ ] Mermaid diagrams render in GitHub preview
- [ ] Edge Cases >= 10 per module
- [ ] AGENTS.md has "START HERE" section added
- [ ] AGENTS.md has "Keeping project-index.json current" section added
- [ ] docs-archived-YYYY-MM-DD/ created (only 📦/❌ items, ✅/🔄 preserved in new structure)

### Hook (OpenCode adaptation note)
OpenCode (`opencode.json`) does not support PostToolUse hooks like Claude Code.
- We create `.claude/settings.json` with the hook config as a reference artifact
- We note in submission that we're on OpenCode and hooks run standalone via `update_project_index.py`
- This item is marked OPTIONAL in the homework — acceptable to skip
- No hook-screenshot.png (cannot demonstrate in OpenCode)

---

## Stage 4 — Tests Agent (~1-1.5h)

### Steps

- [ ] **S4.1** Create `test-writer-mate.md` agent definition
  - Adapt from course materials template (cached in `.opencode/docs/`)
  - Place in `.claude/agents/` (for submission) + reference in `.opencode/docs/`
  - Must contain (checklist from homework):
    - YAML frontmatter (name, description, model: claude-opus-4-7, tools)
    - ROLE-LOCK section (only Write test code, never production code)
    - Strong test principles section (not `assert not None`)
    - Template for 4 test types per function: happy / edges / error / security
    - Anti-patterns to AVOID section (no try-catch wrappers, no mocking everything)
    - Size <= 250 lines

- [ ] **S4.2** Generate tests for Service 1: `ai/mcp-feature-flags/server.py`
  - >= 5 tests: 1 happy path + 2-3 edge cases + 1-2 error paths + (opt) 1 security
  - Use pytest
  - Reference spec from Stage 3: `docs/specs/mcp-feature-flags-spec.md`
  - Assertions check VALUES not aliveness (`assert result['status'] == 'Enabled'` not `assert result is not None`)
  - No try-catch wrappers, no trivial tests, realistic test data

  **Prompt template:**
  ```
  Service 1: ai/mcp-feature-flags/server.py
  Reference spec: docs/specs/mcp-feature-flags-spec.md

  Write tests covering:
  - All public functions/endpoints from spec
  - Top 10 edge cases from spec's Edge Cases section
  - 2-3 security tests if applicable

  Output to ai/mcp-feature-flags/__tests__/test_server.py
  Use pytest. Match the project's existing test style.
  ```

- [ ] **S4.3** Generate tests for Service 2: `ai/rag/query.py`
  - >= 5 tests: 1 happy path + 2-3 edge cases + 1-2 error paths
  - Use pytest
  - Reference spec from Stage 3: `docs/specs/rag-query-spec.md`
  - Same quality requirements as S4.2

- [ ] **S4.4** Run all tests, capture output
  ```bash
   pytest ai/mcp-feature-flags/__tests__/ -v
   pytest ai/rag/tests/ -v
  ```
  - If tests fail: determine if test is wrong or code is buggy
  - If test wrong -> fix test
  - If code buggy -> document as next finding (don't fix code)
  - Capture output for coverage-report

- [ ] **S4.5** (Optional, senior bonus) Mutation testing with mutmut
  ```bash
  pip install mutmut==3.5.0
  cd ai/mcp-feature-flags/
  mutmut run --paths-to-mutate server.py
  mutmut results
  ```
  - Target MSI > 70%
  - If lower, strengthen assertions on survived mutants:
  ```
  Read the survived mutants for ai/mcp-feature-flags/server.py.
  For each surviving mutant, identify which test SHOULD have caught it.
  Strengthen the assertions in that test. Output as patch.
  ```
  - Record starting MSI -> `homework-m6/stage4-tests-agent/starting_msi.txt`
  - Record final MSI -> `homework-m6/stage4-tests-agent/final_msi.txt`
  - Write 1-2 paragraph analysis of which mutations survived most

- [ ] **S4.6** Copy to submission folder

### Deliverables
```
homework-m6/stage4-tests-agent/
  test-writer-mate.md              (copy of agent definition)
  service-1-tests/                 (MCP feature flags tests)
  service-2-tests/                 (RAG query engine tests)
  coverage-report.png              (test run output/screenshot)
  # Optional (senior bonus):
  starting_msi.txt
  final_msi.txt
```

### Stage 4 Checklist (from homework spec)
- [ ] `.claude/agents/test-writer-mate.md` exists in fork
- [ ] `homework-m6/stage4-tests-agent/test-writer-mate.md` copy exists
- [ ] test-writer-mate.md has: YAML frontmatter, ROLE-LOCK, strong test principles, 4 test types template, anti-patterns, <= 250 lines
- [ ] service-1-tests/ and service-2-tests/ exist with tests
- [ ] Per service >= 5 tests: happy + edges + errors + (opt) security
- [ ] Assertions check VALUES not just aliveness
- [ ] No try-catch wrappers, no trivial tests, realistic test data
- [ ] All tests pass on current code
- [ ] coverage-report.png shows test runner stats
- [ ] If failing tests -> explained in README why
- [ ] (Bonus) mutmut results, starting/final MSI, analysis

---

## Stage 5 — Final Submission Preparation (OUR ADDITION, not in assignment)

- [ ] **S5.1** Verify all deliverables exist in `homework-m6/` with correct structure
- [ ] **S5.2** Ensure all git commits are clean (conventional commits)
- [ ] **S5.3** Push to remote
- [ ] **S5.4** Create submission summary for Telegram (#m6-submission + name)

### Final submission structure
```
homework-m6/
├── stage1-code-review/
│   ├── security-review.md
│   ├── security-findings.jsonl
│   ├── performance-review.md
│   ├── performance-findings.jsonl
│   ├── architecture-review.md
│   ├── architecture-findings.jsonl
│   └── synthesis.md
├── stage2-fix-top3/
│   ├── fix-1-<topic>.md
│   ├── fix-2-<topic>.md
│   ├── fix-3-<topic>.md
│   └── tests/
│       ├── test-<finding-1>.{py|js}
│       ├── test-<finding-2>.{py|js}
│       └── test-<finding-3>.{py|js}
├── stage3-living-docs/
│   ├── 00-plan.md
│   ├── docs-audit.md
│   ├── project-index.json
│   ├── update_project_index.py
│   ├── docs-new/
│   │   ├── README.md
│   │   ├── specs/
│   │   ├── adr/
│   │   └── architecture/
│   ├── docs-archived/
│   └── AGENTS.md
└── stage4-tests-agent/
    ├── test-writer-mate.md
    ├── service-1-tests/
    ├── service-2-tests/
    ├── coverage-report.png
    ├── starting_msi.txt          (optional)
    └── final_msi.txt             (optional)
```

---

## Notes & Decisions

- **OpenCode adaptation**: `.claude/agents/` created for grading compatibility. Agent prompts also cached in `.opencode/docs/`.
- **Agent prompts**: Fetched from `https://github.com/Serg1kk/aidev-course-materials/tree/main/M6/agents` and cached. All 5 agents: security-mate, performance-mate, architecture-mate, legacy-auditor-mate, test-writer-mate.
- **Python MCP servers**: Both MCP servers are Python -> pytest for Stage 2 (Python files) and Stage 4.
- **No docs/ folder at root**: Stage 3 creates `docs/` with specs, adr (from homework/adr/), architecture.
- **Credentials note**: `homework/M5/credentials/` is local-only (gitignored), not a security finding.
- **JSONL findings**: Required by checklist — included in Stage 1.
- **4-step reverse engineering**: `ai/mcp-feature-flags/server.py` and `ai/rag/query.py` — same modules in Stage 4 for tests.
- **Hooks**: OpenCode has no PostToolUse hooks. `.claude/settings.json` created as reference. update_project_index.py runs standalone only. Marked optional in homework.
- **Mutation testing**: Added as optional S4.5 with mutmut (Python). Target MSI > 70%.
- **Prompt templates**: Included from homework spec for each stage — adapted with our fork paths.

---

## Full Existing Docs Inventory (for Stage 3 audit)

| Path | Type | Notes |
|------|------|-------|
| `homework/adr/0001-single-express-server-and-react-build.md` | ADR | M2-era |
| `homework/adr/0002-redux-thunk-and-localstorage-client-state.md` | ADR | M2-era |
| `homework/adr/0003-jwt-bearer-auth-and-role-middleware.md` | ADR | M2-era |
| `homework/architecture.md` | Architecture overview | M2-era |
| `homework/coding-standards.md` | Coding standards | M2-era |
| `homework/lessons/` (6 files) | Dev lessons | 2026-04-25 debugging logs |
| `homework/m2-char-tests/` | Characterization tests | M2 homework |
| `homework/m3/AGENT_PLAN_v3.md` | Agent plan | M3 homework |
| `homework/m3/MANUAL_STEPS_v2.md` | Manual steps | M3 homework |
| `homework/M4/PLAN_M4.md` | M4 plan | M4 homework |
| `homework/M4/README.md` | M4 readme | M4 homework |
| `homework/M5/PLAN_M5.md` | M5 plan | M5 homework |
| `homework/M5/lessons.md` | M5 lessons | M5 homework |
| `homework/M5/test_results.md` | M5 test results | M5 homework |
| `homework/M5/simulators/` | Workflow simulators | M5 homework |
| `homework/M5/video-recording/` | Screencast recordings | M5 homework |
| `homework/start_app_troubleshooting.md` | Troubleshooting guide | M2-era |
| `AGENTS.md` | AI agent rules (root) | Active, maintained |
| `DESIGN.md` | Design notes (root) | M4-era |
| `FINDINGS.md` | Initial audit findings (root) | M2-era |
| `README.md` | Project overview (root) | Active |
| `report.md` | Homework report (root) | M2-era |
| `.github/copilot-instructions.md` | Copilot config | Active |
| `ai/README.md` | AI folder readme | M3-era |
