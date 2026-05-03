# AGENT_PLAN_v3.md — M3 Homework: final executable plan

> **You are an autonomous coding agent (opencode).** Read this file fully before starting. Execute phases in order. After each phase, run its verification block. Stop on failure: write `BLOCKED.md` with diagnosis. Do not improvise around failed verifications. Do not run any of the steps inside `MANUAL_STEPS_v2.md` (that is the human's part).

---

## 0. Host filesystem (verified)

```
/Users/ilyachakun/Desktop/projects/ai-course/
├── aidev-course-materials/    # course repo, READ-ONLY (corpus + features.json source)
│   └── M3/
│       ├── guides/
│       └── project-data/      # features.json, *.md docs, sub-folders
├── m3-homework/                # PREVIOUS WORK — keep as backup, do NOT delete or write to
│   ├── .venv/                  # Python venv (~2.5 GB) — REUSED via absolute path
│   ├── qdrant_storage/         # Qdrant docker volume (already mounted by running container)
│   ├── mcp-feature-flags/server.py
│   ├── mcp-search-docs/server.py
│   ├── rag/{__init__.py,config.py,ingest.py,query.py,test-queries.log}
│   └── ...
└── proshop_mern/               # ★ TARGET REPO ★ user's M2 fork (their personal GitHub remote)
                                # Has: backend/, frontend/, report.md (with ## M2), admin auth flow
```

**Working directory for ALL writes:** `/Users/ilyachakun/Desktop/projects/ai-course/proshop_mern`

**Source for copying assets:** `/Users/ilyachakun/Desktop/projects/ai-course/m3-homework`

**Source for corpus:** `/Users/ilyachakun/Desktop/projects/ai-course/aidev-course-materials/M3/project-data`

**Python interpreter to use everywhere:** `/Users/ilyachakun/Desktop/projects/ai-course/m3-homework/.venv/bin/python`

---

## 1. Hard constraints

| Rule | Detail |
|---|---|
| Stack | Python 3.11, FastMCP, Qdrant, BGE-M3, opencode. No alternatives. |
| Working dir | All writes go inside `/Users/ilyachakun/Desktop/projects/ai-course/proshop_mern`. |
| `m3-homework/` | Read-only backup. Copy from it; never write. |
| `aidev-course-materials/` | Read-only corpus source. |
| `features.json` source of truth | `proshop_mern/backend/features.json`. Backend reads file fresh on every request. MCP server is the only writer. |
| `report.md` location | `proshop_mern/report.md`. Has `## M2` from previous module — append `## M3`, never overwrite `## M2`. |
| Secrets | `.env` must be in `.gitignore`. Never commit secrets. |
| Out of scope | Hybrid search, reranker (Part 4 optional). UI polish (M4). |
| Stop conditions | If any verification fails twice with different fixes, write `BLOCKED.md` and stop. |

---

## 2. Phase index

```
A. Recon                    (~10 min)
B. Migration                (~15 min)
C. Backend integration      (~30 min)
D. Admin Dashboard page     (~30 min)
E. Chunks export            (~10 min)
F. Rules file (AGENTS.md)   (~5 min)
G. opencode.json            (~5 min)
H. report.md skeleton + MANUAL_STEPS_v2.md  (~10 min)
```

---

## Phase A — Recon

**Goal.** Understand proshop_mern's structure so subsequent phases match its conventions. Output: `proshop_mern/.m3-recon.md` (gitignored).

### Commands

```bash
cd /Users/ilyachakun/Desktop/projects/ai-course/proshop_mern

# 1. Top-level layout
ls -la
ls backend/ 2>/dev/null
ls backend/routes/ 2>/dev/null
ls backend/middleware/ 2>/dev/null
ls frontend/src/ 2>/dev/null
ls frontend/src/screens/ 2>/dev/null
ls frontend/src/screens/admin/ 2>/dev/null

# 2. Module style — ESM (import) vs CommonJS (require)
head -5 backend/server.js 2>/dev/null || head -5 backend/index.js 2>/dev/null
grep -l '"type": "module"' backend/package.json 2>/dev/null && echo "backend uses ESM" || echo "backend uses CommonJS"

# 3. Look at how an existing route is registered (use products as the canonical example)
grep -rn "productRoutes\|userRoutes\|orderRoutes" backend/server.js backend/index.js 2>/dev/null | head -10

# 4. Auth middleware
cat backend/middleware/authMiddleware.js 2>/dev/null | head -50

# 5. Frontend route table — search for AdminRoute / PrivateRoute
grep -rn "AdminRoute\|PrivateRoute\|isAdmin" frontend/src/ 2>/dev/null | head -20

# 6. Existing report.md
test -f report.md && echo "report.md exists" && grep -c "^## " report.md && grep "^## " report.md

# 7. Existing rules files
ls AGENTS.md CLAUDE.md .cursorrules .cursor/rules/ 2>/dev/null

# 8. Git remote (must be user's fork, not the original ProshopMern)
git remote -v

# 9. Confirm there is NO existing /api/feature-flags route
grep -rn "feature-flags\|featureFlags" backend/ 2>/dev/null
```

### Write `.m3-recon.md` with findings

Record one short paragraph per question. Be concrete (file names, paths, decorator/middleware names — not "looks like there is auth").

```bash
cat > .m3-recon.md <<'EOF'
# M3 Recon notes (gitignored — used to plan the homework migration)

## Backend layout
- Module style: <ESM | CommonJS>
- Server entry file: <backend/server.js | backend/index.js>
- Routes folder: <backend/routes/>
- Existing routes registered (examples): <productRoutes, userRoutes, orderRoutes>
- Pattern for route registration: <e.g. `app.use('/api/products', productRoutes)`>
- Pattern for route file (export style): <e.g. `export default router` or `module.exports = router`>

## Auth & admin protection
- Middleware file: <backend/middleware/authMiddleware.js>
- Admin guard function name: <e.g. `admin` middleware>
- User flag: <`req.user.isAdmin` boolean>
- Example admin route: <e.g. `router.route('/').get(protect, admin, getOrders)`>

## Frontend layout
- Bundler: <Vite | CRA | Next>
- Screens directory: <frontend/src/screens/admin/>
- Existing admin screens: <OrderListScreen.jsx, ProductListScreen.jsx, UserListScreen.jsx>
- File extension: <.jsx | .tsx | .js>
- Routing style: <react-router-dom v6 (`<Route element={<AdminRoute />}>`) | other>
- AdminRoute component path: <frontend/src/components/AdminRoute.jsx or similar>
- UI library: <react-bootstrap | tailwind | mui>

## report.md
- Exists: <yes/no>
- Has `## M2`: <yes/no>
- Other sections: <list>

## Existing agent rules
- AGENTS.md: <yes/no>
- CLAUDE.md: <yes/no>

## Git remote
- origin: <URL>
- Is fork: <yes/no — should point to ilyachakun's GitHub or similar personal account>

## /api/feature-flags pre-check
- Already exists: <should be NO — confirms we're not duplicating>
EOF
```

### Verification

```bash
test -f .m3-recon.md && echo "[ok] recon written"
test -d backend && test -d frontend && echo "[ok] MERN layout"
test -f report.md && echo "[ok] report.md present" || echo "[note] report.md absent — will create in Phase H"

# Hard stop if proshop_mern looks unusual
test -d backend/routes && test -d frontend/src && echo "[ok] standard layout" || {
  echo "[FAIL] non-standard proshop_mern layout — STOP"
  exit 1
}
```

### Stop condition
- Missing `backend/` or `frontend/` → not standard ProshopMern → write `BLOCKED.md`, stop.
- `git remote -v` shows the original ProshopMern repo and no personal fork → continue (not blocking) but note loudly in BLOCKED.md so user adds their fork before push.

---

## Phase B — Migration from m3-homework

**Goal.** Copy MCP servers and RAG pipeline into `proshop_mern/ai/`. Patch paths so they resolve to the new location and to the corpus in `aidev-course-materials/`.

### Commands

```bash
cd /Users/ilyachakun/Desktop/projects/ai-course/proshop_mern

mkdir -p ai/mcp-feature-flags ai/mcp-search-docs ai/rag

SRC=/Users/ilyachakun/Desktop/projects/ai-course/m3-homework

# Copy MCP servers
cp "$SRC/mcp-feature-flags/server.py"  ai/mcp-feature-flags/server.py
cp "$SRC/mcp-search-docs/server.py"    ai/mcp-search-docs/server.py

# Copy RAG pipeline
cp "$SRC/rag/__init__.py"  ai/rag/__init__.py
cp "$SRC/rag/config.py"    ai/rag/config.py
cp "$SRC/rag/ingest.py"    ai/rag/ingest.py
cp "$SRC/rag/query.py"     ai/rag/query.py

# Reference logs (to cite in report.md later)
cp "$SRC/rag/test-queries.log"  ai/rag/test-queries.log 2>/dev/null || true

# requirements (no reinstall — we reuse the venv)
cp "$SRC/requirements.txt"  ai/requirements.txt 2>/dev/null || true

# .gitignore additions
{
  grep -qxF '.m3-recon.md'   .gitignore 2>/dev/null || echo '.m3-recon.md'
  grep -qxF 'BLOCKED.md'     .gitignore 2>/dev/null || echo 'BLOCKED.md'
  grep -qxF '.opencode/'     .gitignore 2>/dev/null || echo '.opencode/'
  grep -qxF '__pycache__/'   .gitignore 2>/dev/null || echo '__pycache__/'
} >> .gitignore

# /ai README pointer
cat > ai/README.md <<'EOF'
# /ai — M3 homework artifacts

This folder contains the AI/MCP/RAG layer added in Module 3.

- `mcp-feature-flags/` — MCP server for feature flag CRUD (4 tools).
- `mcp-search-docs/`   — MCP server wrapping vector search over project docs.
- `rag/`               — ingest + query + export scripts for the Qdrant vector DB.
- `chunks.jsonl`       — exported chunks (text + metadata), produced by `rag/export_chunks.py`.

## Python interpreter

The venv is **not** in this repo (intentionally — too large to commit). It lives at:

```
/Users/ilyachakun/Desktop/projects/ai-course/m3-homework/.venv/
```

`opencode.json` (at repo root) launches both MCP servers using that absolute python path.

## Quick run

```bash
PYTHON=/Users/ilyachakun/Desktop/projects/ai-course/m3-homework/.venv/bin/python

# Re-ingest (only if Qdrant collection is empty)
$PYTHON -m rag.ingest --recreate

# Direct CLI search (for debug, before going through MCP)
$PYTHON -m rag.query "What database does proshop_mern use?"

# Export all chunks → ai/chunks.jsonl
$PYTHON -m rag.export_chunks
```

## Vector DB

Qdrant runs in Docker (volume mounted at `../m3-homework/qdrant_storage`). The collection is `proshop_docs`. Dashboard at http://localhost:6333/dashboard.
EOF
```

### Patch `ai/rag/config.py` — `PROJECT_DATA_DIR`

The corpus stays in `aidev-course-materials/` — only the path inside config.py changes.

Before patching, view the current file:

```bash
cat ai/rag/config.py
```

Then patch using the str_replace edit (find the exact `PROJECT_DATA_DIR = ...` line and replace):

```python
# new value:
PROJECT_DATA_DIR = (
    Path(__file__).resolve().parent.parent.parent.parent
    / "aidev-course-materials" / "M3" / "project-data"
)
```

Verify the path resolution:

```bash
PYTHON=/Users/ilyachakun/Desktop/projects/ai-course/m3-homework/.venv/bin/python
cd /Users/ilyachakun/Desktop/projects/ai-course/proshop_mern

$PYTHON -c "
import sys; sys.path.insert(0, 'ai')
from rag.config import PROJECT_DATA_DIR, CFG
p = PROJECT_DATA_DIR.resolve()
print('PROJECT_DATA_DIR:', p)
assert p.exists(), f'corpus path does not exist: {p}'
assert (p / 'features.json').exists(), 'features.json not at expected path'
print('CFG.collection_name:', CFG.collection_name)
print('[ok] corpus path resolves')
"
```

### Patch `ai/mcp-search-docs/server.py` — `sys.path`

The search-docs server imports from `rag.query`. Its old path insert pointed at `m3-homework/`. New path: `proshop_mern/ai/`.

```bash
cat ai/mcp-search-docs/server.py
```

Make sure the file contains exactly this near the top (replace the existing `sys.path.insert` line):

```python
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))   # parent.parent = ai/

from rag.query import search
from fastmcp import FastMCP
```

### Verification

```bash
ls ai/mcp-feature-flags/server.py \
   ai/mcp-search-docs/server.py \
   ai/rag/{__init__,config,ingest,query}.py \
   ai/README.md
echo "[ok] files present"

# Venv must still work
PYTHON=/Users/ilyachakun/Desktop/projects/ai-course/m3-homework/.venv/bin/python
$PYTHON -c "import fastmcp, qdrant_client, sentence_transformers, frontmatter, langchain_text_splitters; print('[ok] venv reusable')"

# search-docs server must import cleanly with new sys.path
$PYTHON -c "
import sys
sys.path.insert(0, 'ai')
sys.path.insert(0, 'ai/mcp-search-docs')
import server
print('[ok] search-docs server imports')
"

# Qdrant collection still has data
COUNT=$(curl -sf http://localhost:6333/collections/proshop_docs 2>/dev/null \
  | $PYTHON -c "import json,sys; d=json.load(sys.stdin); print(d['result']['points_count'])" 2>/dev/null || echo 0)
echo "Qdrant points: $COUNT"
[ "$COUNT" -ge 50 ] && echo "[ok] collection alive" || {
  echo "[note] collection empty/missing — re-ingesting now"
  cd ai && $PYTHON -m rag.ingest --recreate && cd ..
}
```

### Stop condition
- venv missing → check `m3-homework/.venv/bin/python` exists. If gone, stop and write BLOCKED.md.
- Corpus path doesn't resolve → wrong number of `.parent` levels in config.py.
- Qdrant container not running → `docker start qdrant`. If absent → recreate per Phase 0 of the previous plan.

---

## Phase C — Backend integration

**Goal.** `backend/features.json` exists. `GET /api/feature-flags` and `GET /api/feature-flags/:name` work. MCP server's `FEATURES_PATH` points at `backend/features.json`. A 4th tool `list_features` is added.

### C.1 — Move features.json into backend

```bash
cd /Users/ilyachakun/Desktop/projects/ai-course/proshop_mern

cp /Users/ilyachakun/Desktop/projects/ai-course/aidev-course-materials/M3/project-data/features.json \
   backend/features.json

PYTHON=/Users/ilyachakun/Desktop/projects/ai-course/m3-homework/.venv/bin/python
$PYTHON -c "
import json
d = json.load(open('backend/features.json'))
print('keys:', len(d))
print('sample:', list(d)[:3])
assert 'search_v2' in d
print('[ok] features.json valid')
"
```

### C.2 — Add the API route

**Read `.m3-recon.md` first** to determine ESM vs CommonJS. Use the matching syntax.

#### If ESM (`"type": "module"` in backend/package.json)

Create `backend/routes/featureFlagsRoutes.js`:

```javascript
import express from 'express';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FEATURES_PATH = path.resolve(__dirname, '..', 'features.json');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const raw = await fs.readFile(FEATURES_PATH, 'utf8');
    res.json(JSON.parse(raw));
  } catch (err) { next(err); }
});

router.get('/:name', async (req, res, next) => {
  try {
    const raw = await fs.readFile(FEATURES_PATH, 'utf8');
    const all = JSON.parse(raw);
    const f = all[req.params.name];
    if (!f) return res.status(404).json({ message: `Feature '${req.params.name}' not found` });
    res.json({ name: req.params.name, ...f });
  } catch (err) { next(err); }
});

export default router;
```

#### If CommonJS (no `"type": "module"`)

```javascript
const express = require('express');
const fs = require('node:fs/promises');
const path = require('node:path');

const FEATURES_PATH = path.resolve(__dirname, '..', 'features.json');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const raw = await fs.readFile(FEATURES_PATH, 'utf8');
    res.json(JSON.parse(raw));
  } catch (err) { next(err); }
});

router.get('/:name', async (req, res, next) => {
  try {
    const raw = await fs.readFile(FEATURES_PATH, 'utf8');
    const all = JSON.parse(raw);
    const f = all[req.params.name];
    if (!f) return res.status(404).json({ message: `Feature '${req.params.name}' not found` });
    res.json({ name: req.params.name, ...f });
  } catch (err) { next(err); }
});

module.exports = router;
```

#### Mount the route in the main server file

Identify the file from recon (likely `backend/server.js`). Find the existing route registrations (e.g. `app.use('/api/products', productRoutes)`) and add right after them:

**ESM:**
```javascript
import featureFlagsRoutes from './routes/featureFlagsRoutes.js';
// ... near other app.use() lines:
app.use('/api/feature-flags', featureFlagsRoutes);
```

**CommonJS:**
```javascript
const featureFlagsRoutes = require('./routes/featureFlagsRoutes.js');
// ... near other app.use() lines:
app.use('/api/feature-flags', featureFlagsRoutes);
```

### C.3 — Patch `ai/mcp-feature-flags/server.py`

Two changes: new `FEATURES_PATH`, and new tool `list_features`.

**Change 1 — `FEATURES_PATH`.** View the current file and replace the existing `FEATURES_PATH = ...` line with:

```python
# 3 levels up: ai/mcp-feature-flags → ai → proshop_mern
FEATURES_PATH = (
    Path(__file__).resolve().parent.parent.parent / "backend" / "features.json"
)
```

**Change 2 — add `list_features` tool.** Append before the `if __name__ == "__main__":` block:

```python
@mcp.tool()
def list_features() -> list[dict]:
    """List all feature flags as a compact summary.

    WHEN TO CALL:
    - User asks for an overview / list of features ("какие есть фичи",
      "show all features", "покажи все флаги").
    - You need to find a feature by partial name or by status before
      drilling into one feature with get_feature_info.

    WHEN NOT TO CALL:
    - User asks about ONE specific feature → use get_feature_info.
    - User wants to mutate state → use set_feature_state /
      adjust_traffic_rollout.
    - Do NOT read backend/features.json directly via the file system —
      always go through this tool.

    INPUT: none.

    OUTPUT: list of {name, status, traffic_percentage}, one entry per
    feature, in insertion order from features.json.

    EXAMPLE:
      list_features()
        → [{"name": "search_v2", "status": "Testing", "traffic_percentage": 15},
           {"name": "semantic_search", "status": "Disabled", "traffic_percentage": 0},
           ...]
    """
    data = _load()
    return [
        {
            "name": name,
            "status": feat.get("status"),
            "traffic_percentage": feat.get("traffic_percentage", 0),
        }
        for name, feat in data.items()
    ]
```

### C.4 — Smoke test the patched MCP server

```bash
cd /Users/ilyachakun/Desktop/projects/ai-course/proshop_mern
PYTHON=/Users/ilyachakun/Desktop/projects/ai-course/m3-homework/.venv/bin/python

cat > ai/mcp-feature-flags/_smoke.py <<'PYEOF'
import sys
sys.path.insert(0, "ai/mcp-feature-flags")
import server as s

# 1) Path resolves to backend/features.json
print("FEATURES_PATH:", s.FEATURES_PATH)
assert s.FEATURES_PATH.exists(), f"missing: {s.FEATURES_PATH}"

# 2) Load works
data = s._load()
assert isinstance(data, dict) and len(data) >= 20

# 3) list_features
fn = getattr(s.list_features, "fn", s.list_features)
items = fn()
assert isinstance(items, list) and items
assert {"name", "status", "traffic_percentage"} <= set(items[0].keys())
print(f"[ok] list_features returned {len(items)} entries")

# 4) get_feature_info on the new path
fn = getattr(s.get_feature_info, "fn", s.get_feature_info)
info = fn("search_v2")
assert info["name"] == "search_v2"
print("[ok] get_feature_info works")

# 5) Tool count
import inspect
tool_count = sum(1 for n in dir(s) if hasattr(getattr(s, n, None), "fn"))
print(f"[ok] {tool_count} MCP tools registered (expected 4)")

print("[ok] smoke passed")
PYEOF

$PYTHON ai/mcp-feature-flags/_smoke.py
rm ai/mcp-feature-flags/_smoke.py
```

### C.5 — Live API check

Start the backend (use whatever the project uses — typical: `npm run server` or `npm run dev` in `backend/`):

```bash
# Identify the start script
cat backend/package.json | grep -A 20 '"scripts"'
```

Run the appropriate command **in a separate terminal** (or background it). Then:

```bash
# Determine the port — check the backend's startup banner. Most ProshopMern projects use 5000.
sleep 3
curl -sf http://localhost:5000/api/feature-flags > /dev/null && echo "[ok] /api/feature-flags 200" \
  || curl -sf http://localhost:8000/api/feature-flags > /dev/null && echo "[ok] /api/feature-flags 200 (8000)" \
  || echo "[FAIL] feature-flags endpoint not responding — check backend logs and port"

# Single-feature endpoint
curl -sf http://localhost:5000/api/feature-flags/search_v2 || true
```

If the server isn't already running and you can't run it without user interaction, skip the live curl check but DO record in the verification block that this manual check is needed.

### Verification

```bash
test -f backend/features.json && echo "[ok] features.json placed"
test -f backend/routes/featureFlagsRoutes.js && echo "[ok] route file exists"
grep -q 'feature-flags' backend/server.js 2>/dev/null && echo "[ok] route mounted in server.js" \
  || grep -q 'feature-flags' backend/index.js 2>/dev/null && echo "[ok] route mounted in index.js" \
  || echo "[FAIL] route not mounted"
grep -c '@mcp.tool()' ai/mcp-feature-flags/server.py | xargs -I{} sh -c '[ {} -eq 4 ] && echo "[ok] 4 MCP tools" || echo "[FAIL] expected 4 tools, got {}"'
```

### Stop condition
- Smoke test fails → fix and retry. After 2 attempts → BLOCKED.md.
- Backend route file syntax error (caught at backend startup) → check ESM/CJS match. After 2 attempts → BLOCKED.md.

---

## Phase D — Admin Dashboard Features page

**Goal.** A new admin-only screen that fetches `/api/feature-flags` and renders a table. Minimal styling.

### D.1 — Determine path and extension

From `.m3-recon.md`:
- Screens dir: `frontend/src/screens/admin/` (typical)
- Extension: `.jsx` (most ProshopMern variants) or `.tsx` (if TypeScript)
- UI lib: `react-bootstrap` (typical)

### D.2 — Create the screen

```bash
cd /Users/ilyachakun/Desktop/projects/ai-course/proshop_mern

# Adjust extension if frontend uses TypeScript
EXT=jsx
mkdir -p frontend/src/screens/admin

cat > frontend/src/screens/admin/FeaturesListScreen.${EXT} <<'JSEOF'
import { useEffect, useState } from 'react';
import { Table, Badge, Container, Spinner, Alert } from 'react-bootstrap';

export default function FeaturesListScreen() {
  const [features, setFeatures] = useState({});
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/feature-flags')
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => { setFeatures(data); setLoading(false); })
      .catch((e) => { setError(e.message); setLoading(false); });
  }, []);

  if (loading) return <Container className="py-3"><Spinner animation="border" /> Loading…</Container>;
  if (error)   return <Container className="py-3"><Alert variant="danger">Error: {error}</Alert></Container>;

  const statusVariant = (s) =>
    s === 'Enabled' ? 'success' : s === 'Testing' ? 'warning' : 'secondary';

  return (
    <Container className="py-3">
      <h1>Feature Flags</h1>
      <Table striped hover responsive>
        <thead>
          <tr>
            <th>Name</th>
            <th>Status</th>
            <th>Traffic %</th>
            <th>Last modified</th>
            <th>Dependencies</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(features).map(([key, f]) => (
            <tr key={key}>
              <td>
                <code>{key}</code>
                <div className="small text-muted">{f.name}</div>
              </td>
              <td><Badge bg={statusVariant(f.status)}>{f.status}</Badge></td>
              <td>{f.traffic_percentage}%</td>
              <td>{f.last_modified}</td>
              <td>
                {(f.dependencies ?? []).length === 0
                  ? <span className="text-muted">—</span>
                  : (f.dependencies ?? []).map((d) => (
                      <code key={d} className="me-1">{d}</code>
                    ))}
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
      <p className="text-muted mt-3">
        <small>
          Source: <code>GET /api/feature-flags</code> → reads <code>backend/features.json</code> on every request.
          Mutated by the feature-flags MCP server (M3 homework).
        </small>
      </p>
    </Container>
  );
}
JSEOF
```

### D.3 — Register the route under admin guard

Find the routing file (typical: `frontend/src/App.jsx` or `frontend/src/main.jsx`) and locate the AdminRoute block. It usually looks like:

```jsx
<Route path="" element={<AdminRoute />}>
  <Route path="/admin/orderlist" element={<OrderListScreen />} />
  <Route path="/admin/productlist" element={<ProductListScreen />} />
  ...
</Route>
```

Add inside that block:

```jsx
<Route path="/admin/featureslist" element={<FeaturesListScreen />} />
```

And add the import at the top of the file:

```jsx
import FeaturesListScreen from './screens/admin/FeaturesListScreen';
```

### D.4 — Add admin nav link in Header

Find `frontend/src/components/Header.jsx` (typical). Look for the existing admin `NavDropdown` (usually contains "Products", "Users", "Orders"). Add right next to those:

```jsx
<LinkContainer to='/admin/featureslist'>
  <NavDropdown.Item>Features</NavDropdown.Item>
</LinkContainer>
```

### Verification

```bash
cd /Users/ilyachakun/Desktop/projects/ai-course/proshop_mern

# File exists
ls frontend/src/screens/admin/FeaturesListScreen.* && echo "[ok] screen file"

# Imported somewhere in routing
grep -rn "FeaturesListScreen" frontend/src/App.* frontend/src/main.* 2>/dev/null | head -5

# Build sanity (if frontend has a build script)
cd frontend
if grep -q '"build"' package.json; then
  npm run build 2>&1 | tail -20 && echo "[ok] frontend builds" || echo "[FAIL] build error — see above"
else
  echo "[note] no build script — skip build check"
fi
cd ..
```

### Stop condition
- Build fails → check imports / JSX syntax. After 2 attempts → BLOCKED.md.

---

## Phase E — Chunks export

**Goal.** `proshop_mern/ai/chunks.jsonl` — every chunk in the Qdrant collection, one JSON per line.

### Commands

```bash
cd /Users/ilyachakun/Desktop/projects/ai-course/proshop_mern

cat > ai/rag/export_chunks.py <<'PYEOF'
"""Export all points from Qdrant collection 'proshop_docs' to chunks.jsonl.

One line per chunk: {"id", "text", "metadata": {source_file, type, last_modified, chunk_index}}.
"""
import json
from pathlib import Path

from qdrant_client import QdrantClient
from rag.config import CFG

OUTPUT = Path(__file__).resolve().parent.parent / "chunks.jsonl"

def main() -> None:
    client = QdrantClient(url=CFG.qdrant_url)

    total = client.count(collection_name=CFG.collection_name, exact=True).count
    print(f"Exporting {total} points from '{CFG.collection_name}' → {OUTPUT}")

    written = 0
    next_offset = None
    with OUTPUT.open("w", encoding="utf-8") as f:
        while True:
            points, next_offset = client.scroll(
                collection_name=CFG.collection_name,
                limit=256,
                offset=next_offset,
                with_payload=True,
                with_vectors=False,
            )
            if not points:
                break
            for p in points:
                payload = dict(p.payload or {})
                text = payload.pop("content", "")
                line = {
                    "id": str(p.id),
                    "text": text,
                    "metadata": payload,
                }
                f.write(json.dumps(line, ensure_ascii=False) + "\n")
                written += 1
            if next_offset is None:
                break

    print(f"[ok] wrote {written} chunks to {OUTPUT}")

if __name__ == "__main__":
    main()
PYEOF

PYTHON=/Users/ilyachakun/Desktop/projects/ai-course/m3-homework/.venv/bin/python
cd ai
$PYTHON -m rag.export_chunks
cd ..
```

### Verification

```bash
test -f ai/chunks.jsonl && echo "[ok] file exists"
LINES=$(wc -l < ai/chunks.jsonl)
echo "lines: $LINES"
[ "$LINES" -ge 50 ] && echo "[ok] chunks count" || echo "[FAIL] too few"

PYTHON=/Users/ilyachakun/Desktop/projects/ai-course/m3-homework/.venv/bin/python
head -1 ai/chunks.jsonl | $PYTHON -c "
import json, sys
d = json.loads(sys.stdin.read())
assert 'id' in d and 'text' in d and 'metadata' in d
assert 'source_file' in d['metadata']
print('[ok] chunk shape valid:', d['metadata'].get('source_file'))
"
```

### Stop condition
- 0 chunks exported → Qdrant empty → run `python -m rag.ingest --recreate` then retry export.

---

## Phase F — Rules file (AGENTS.md)

**Goal.** `proshop_mern/AGENTS.md` exists with two sections instructing opencode how to use the MCP servers. If the file already exists from M2, append; do not overwrite.

### Commands

```bash
cd /Users/ilyachakun/Desktop/projects/ai-course/proshop_mern

# Append marker so we don't double-add on rerun
if [ -f AGENTS.md ] && grep -q "## Searching project documentation (search-docs MCP)" AGENTS.md; then
  echo "[skip] AGENTS.md already has M3 sections"
else
  cat >> AGENTS.md <<'EOF'

## Searching project documentation (search-docs MCP)

When the user asks anything about proshop_mern's product, architecture,
features, design decisions, runbooks, incidents, or history — **call
the `search_project_docs` MCP tool first**. It performs vector search
over the curated documentation corpus and returns the most relevant
chunks with metadata (source_file, type, score, content_snippet).

- This is faster than `grep` / `read` and uses fewer tokens.
- Only fall back to `grep` + `read` if vector search returns nothing
  relevant, or if you need the full file behind a chunk's `source_file`
  metadata.
- **Do NOT start with grep / read across the project** to answer
  product questions — that defeats the purpose of the RAG layer.

## Managing feature flags (feature-flags MCP)

When the user asks about a feature flag's state, or wants to change
one, **always go through the `feature-flags` MCP tools**:

- "какой статус у X" / "is X enabled" → `get_feature_info(X)`.
- "list features", "какие фичи есть" → `list_features()`.
- "включи X" / "переведи Y в Testing" → `set_feature_state(...)`.
- "поставь трафик 25%" → `adjust_traffic_rollout(...)`.

**Never edit `backend/features.json` directly via Edit / Write / Patch.**
The MCP server is the only writer; the backend reads the file fresh
on every API request, and the admin Dashboard page reads through that
API. Manual edits bypass validation (dependency checks, traffic locks)
and may corrupt the file.
EOF
fi
```

### Verification

```bash
test -f AGENTS.md && echo "[ok] AGENTS.md present"
grep -q "search-docs MCP" AGENTS.md && echo "[ok] search section"
grep -q "feature-flags MCP" AGENTS.md && echo "[ok] flags section"
```

---

## Phase G — opencode.json at repo root

**Goal.** Single config at `proshop_mern/opencode.json` registering both servers with absolute paths.

### Commands

```bash
cd /Users/ilyachakun/Desktop/projects/ai-course/proshop_mern

cat > opencode.json <<'EOF'
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "feature-flags": {
      "type": "local",
      "command": [
        "/Users/ilyachakun/Desktop/projects/ai-course/m3-homework/.venv/bin/python",
        "/Users/ilyachakun/Desktop/projects/ai-course/proshop_mern/ai/mcp-feature-flags/server.py"
      ],
      "enabled": true
    },
    "search-docs": {
      "type": "local",
      "command": [
        "/Users/ilyachakun/Desktop/projects/ai-course/m3-homework/.venv/bin/python",
        "/Users/ilyachakun/Desktop/projects/ai-course/proshop_mern/ai/mcp-search-docs/server.py"
      ],
      "enabled": true
    }
  }
}
EOF
```

### Verification

```bash
PYTHON=/Users/ilyachakun/Desktop/projects/ai-course/m3-homework/.venv/bin/python

# Valid JSON
$PYTHON -c "import json; json.load(open('opencode.json')); print('[ok] valid JSON')"

# Both servers import cleanly with the configured python
$PYTHON -c "
import sys
sys.path.insert(0, 'ai/mcp-feature-flags')
import server as s
assert s.FEATURES_PATH.exists()
print('[ok] feature-flags imports + path resolves')
"

$PYTHON -c "
import sys
sys.path.insert(0, 'ai')
sys.path.insert(0, 'ai/mcp-search-docs')
import server
print('[ok] search-docs imports')
"
```

---

## Phase H — report.md skeleton + MANUAL_STEPS_v2.md

**Goal.** Append `## M3` block to `report.md`. Create `MANUAL_STEPS_v2.md` with the 3 prompts the human runs in opencode + push instructions.

### H.1 — Append `## M3` to report.md

Idempotent: only append if not already present.

```bash
cd /Users/ilyachakun/Desktop/projects/ai-course/proshop_mern

# Create file with minimal preamble if it doesn't exist (unlikely — should have M2 already)
if [ ! -f report.md ]; then
  cat > report.md <<'EOF'
# Project Report

This file accumulates per-module homework reports.
EOF
fi

if grep -q "^## M3" report.md; then
  echo "[skip] ## M3 already present in report.md"
else
  cat >> report.md <<'EOF'

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
<FILL: paste the agent transcript from MANUAL_STEPS_v2.md prompt 1 here>

### Search-docs MCP — test queries log
<FILL: paste the agent transcript from MANUAL_STEPS_v2.md prompt 2 here>

### End-to-end (both MCPs in one chat) log
<FILL: paste the agent transcript from MANUAL_STEPS_v2.md prompt 3 here>

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
- `frontend/src/screens/admin/FeaturesListScreen.jsx` — admin Dashboard page
- `AGENTS.md` — rules for opencode (search-docs first; feature-flags MCP for state)
- `opencode.json` — both MCP servers
EOF
  echo "[ok] M3 section appended"
fi
```

### H.2 — Create MANUAL_STEPS_v2.md

```bash
cat > MANUAL_STEPS_v2.md <<'EOF'
# MANUAL_STEPS_v2.md — finishing M3 in opencode

Phases A–H are done by automation. The remaining steps require an
interactive opencode session — the artifacts ARE the agent's tool-call
transcripts, which only happen with a live human-driven chat.

---

## Step 1 — Start backend + opencode

In one terminal, start the backend so the API endpoint is alive:

```bash
cd /Users/ilyachakun/Desktop/projects/ai-course/proshop_mern
# whatever your project uses, e.g.:
npm run dev
# or, if the project has separate scripts:
# cd backend && npm run server
```

Wait for the "Server running on port XXXX" line.

In a second terminal:

```bash
cd /Users/ilyachakun/Desktop/projects/ai-course/proshop_mern
opencode
```

In the opencode TUI, verify both servers show as `●` (green):
- `feature-flags` (4 tools)
- `search-docs`   (1 tool)

If a server is red `×`, click it in the sidebar to read the stderr.

## Step 2 — Sanity check the Dashboard page (not for report)

In a browser:
1. Log in as admin.
2. Navigate to `/admin/featureslist`.
3. You should see all 25 features with status badges.

Keep this tab open — you'll reload it after Step 5.

---

## Step 3 — Prompt 1: feature-flags MCP scenario

In a NEW opencode chat, paste exactly:

```
Проверь состояние фичи search_v2 в proshop_mern feature flags через
feature-flags MCP. Если она в статусе Disabled — переведи в Testing.
Установи трафик на 25%. Подтверди финальное состояние.

После прогона — допиши в report.md в корне репо в секцию
## M3 → ### Feature flags MCP — test scenario log полный лог: какие
tool calls сделал с аргументами, что MCP возвращал на каждом шаге,
итоговое состояние фичи. Markdown, чистым текстом, без скриншотов.
```

The agent should produce a tool-call chain (typically `get_feature_info`
→ optional `set_feature_state` → `adjust_traffic_rollout` →
`get_feature_info` to confirm) and append the log to `report.md`.

---

## Step 4 — Prompt 2: search-docs MCP queries

NEW chat:

```
Через search-docs MCP найди ответы на 3 вопроса по документации proshop_mern:
1) Какая БД используется и почему?
2) Какие фичи зависят от stripe_alternative?
3) Что случилось во время последнего incident с checkout?

После прогона — допиши в report.md в секцию
## M3 → ### Search-docs MCP — test queries log полный лог: каждый
запрос, какие top-K чанки MCP вернул (id / score / source_file /
фрагмент текста), как ты на их основе сформулировал ответ. Markdown.
```

> Note: original course spec says "payment_stripe_v3" but our
> `features.json` has `stripe_alternative`. Question 2 adjusted.

---

## Step 5 — Prompt 3: end-to-end (both MCPs)

NEW chat (clean context — important):

```
Через два MCP (feature-flags + search-docs):
1. Найди в документации proshop_mern что такое фича semantic_search
   и какие у неё зависимости (search-docs MCP).
2. Проверь текущее состояние через feature-flags MCP.
3. Если она в статусе Disabled и все зависимости не в Disabled —
   переведи в Testing, установи трафик 25%.
4. Процитируй из документации зачем эта фича нужна.

После прогона — допиши в report.md в секцию
## M3 → ### End-to-end (both MCPs in one chat) log полный лог:
цепочку tool calls обоих MCP, что вернул search, что вернул
feature-flags, итоговое состояние фичи, цитату из документации.
Markdown.
```

> Why `semantic_search` (not `payment_stripe_v3`): that feature exists
> in our `features.json`, is currently `Disabled`, depends on
> `search_v2` (which becomes `Testing` after Step 3) — so the chain
> naturally completes.

After this prompt: reload the admin Dashboard tab. `semantic_search`
should now show `Testing` / 25%. That confirms live runtime working
end-to-end (MCP → file → API → page).

---

## Step 6 — Fill the reflection section

Open `report.md` and replace each `<FILL: …>` placeholder, especially
**Reflection (5–10 sentences)**. Be specific:
- What the agent got right / wrong in the e2e.
- Whether AGENTS.md rules actually steered behavior (did it reach for
  vector search first, or try grep?).
- Anything that surprised you about chunking quality (look at
  `ai/chunks.jsonl`).

## Step 7 — Pre-commit hygiene

```bash
cd /Users/ilyachakun/Desktop/projects/ai-course/proshop_mern

# What's about to be committed
git status

# Confirm .env is ignored (if you have one)
test -f .env && grep -qxF '.env' .gitignore && echo "[ok] .env ignored"

# Confirm chunks.jsonl is reasonable size (NOT GBs)
ls -lh ai/chunks.jsonl
```

## Step 8 — Commit & push to your fork

```bash
git add .
git status   # last review
git commit -m "M3: feature-flags MCP + RAG search MCP + admin Dashboard + report"
git push
```

If `git push` fails due to remote auth — verify with `git remote -v`
that origin points to your personal fork (not the original ProshopMern
repo). If it doesn't, set it:

```bash
# Replace with your actual fork URL
git remote set-url origin git@github.com:YOUR_USERNAME/proshop_mern.git
git push -u origin main
```

## Step 9 — Submit

Send the GitHub URL of your `proshop_mern` fork to LMS.

The reviewer will:
- Read `report.md` `## M3` section (the three logs + reflection).
- Open `ai/chunks.jsonl` to spot-check chunking quality.
- Look at `opencode.json` and `AGENTS.md` to confirm setup.
- Browse `ai/`, `backend/routes/featureFlagsRoutes.js`, the admin page code.

That's the whole submission.
EOF

echo "[ok] MANUAL_STEPS_v2.md created"
```

### Verification

```bash
test -f report.md && grep -q "^## M3" report.md && echo "[ok] report has M3"
grep -q "^## M2" report.md && echo "[ok] M2 section preserved" || echo "[note] no M2 section — confirm with user if expected"
test -f MANUAL_STEPS_v2.md && echo "[ok] manual steps written"
```

---

## Final agent-side checklist before reporting "done"

```
[ ] Phase A — .m3-recon.md written, MERN layout confirmed
[ ] Phase B — ai/ populated, paths patched, venv reused, Qdrant has ≥50 points
[ ] Phase C — backend/features.json + GET /api/feature-flags + 4th tool list_features + smoke passed
[ ] Phase D — FeaturesListScreen.jsx + admin route + frontend builds (or compiles)
[ ] Phase E — ai/chunks.jsonl ≥50 lines, valid JSONL with text+metadata
[ ] Phase F — AGENTS.md has both MCP rule sections
[ ] Phase G — opencode.json valid, both MCPs import cleanly
[ ] Phase H — report.md has ## M3 (## M2 untouched), MANUAL_STEPS_v2.md exists
[ ] No edits to ../m3-homework/ or ../aidev-course-materials/
[ ] No secrets in committed files
```

When all boxes check: post a single short summary in chat:

```
DONE. Phases A–H complete. See MANUAL_STEPS_v2.md for the 3 opencode
prompts that finalize the homework, then commit + push to your fork.

Files added/modified inside proshop_mern/:
  ai/                                  (new — MCP servers + RAG + chunks)
  backend/features.json                (new)
  backend/routes/featureFlagsRoutes.js (new)
  backend/server.js                    (patched — route mounted)
  frontend/src/screens/admin/FeaturesListScreen.jsx (new)
  frontend/src/App.jsx                 (patched — admin route added)
  frontend/src/components/Header.jsx   (patched — admin nav link)
  AGENTS.md                            (new or appended)
  opencode.json                        (new)
  report.md                            (## M3 appended)
  MANUAL_STEPS_v2.md                   (new)
  .gitignore                           (extended)

Untouched:
  ../m3-homework/                      (kept as backup)
  ../aidev-course-materials/           (read-only source)
  report.md ## M2 section              (preserved)
```

Then **stop**. Do not run any of the manual steps yourself.

---

## Recovery procedures

| Failure | Action |
|---|---|
| Backend won't start after route added | ESM/CJS mismatch most likely. Compare `import` vs `require` style with neighboring route files. |
| `curl /api/feature-flags` returns 500 | `console.log(FEATURES_PATH)` inside the route to verify path resolution. |
| MCP server import fails after path patch | `print(Path(__file__).resolve().parents)` — count levels. ai/mcp-feature-flags/server.py is 3 levels deep from repo root. |
| Frontend build fails | If proshop_mern uses TypeScript, the file should be `.tsx` with proper types. Re-check the recon notes. |
| `chunks.jsonl` empty | Qdrant collection empty. `python -m rag.ingest --recreate` first, then re-export. |
| Qdrant container missing | `docker ps -a` — if stopped: `docker start qdrant`. If actually deleted: re-run docker run from the original Phase 0 of `m3-homework`'s plan. |
| `git push` rejected | `git remote -v` to confirm origin is the user's fork. If it points at the original ProshopMern repo, that's wrong — STOP and instruct the user to set their fork URL. |

## Logging convention

Print clear phase boundaries:

```
============================================================
PHASE C — Backend integration — STARTING
============================================================
... commands ...
============================================================
PHASE C — Backend integration — VERIFIED ✓
============================================================
```
