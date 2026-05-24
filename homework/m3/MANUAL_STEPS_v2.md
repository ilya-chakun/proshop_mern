# MANUAL_STEPS_v2.md — finishing M3 in opencode

Phases A–H are done by automation. The remaining steps require an
interactive opencode session — the artifacts ARE the agent's tool-call
transcripts, which only happen with a live human-driven chat.

---

## Step 1 — Start the app correctly, then open a fresh opencode session

Use the **manual local setup from `README.md`** for these M3 checks.
Do **not** mix it with `docker compose up` in parallel.

### 1A. Make sure MongoDB is running

```bash
docker start mongo
# if the container does not exist yet:
# docker run -d -p 27017:27017 --name mongo mongo:7
```

### 1B. Seed the sample data

```bash
cd /Users/ilyachakun/Desktop/projects/ai-course/proshop_mern
npm run data:import
```

Expected result: `Data Imported!`

### 1C. Start the app

```bash
cd /Users/ilyachakun/Desktop/projects/ai-course/proshop_mern
npm run dev
```

Wait for the backend/frontend startup lines.

### 1D. Preflight verification before continuing

```bash
# Backend should return product JSON
curl http://localhost:5001/api/products

# Frontend should respond
curl -I http://localhost:3000
```

If `/api/products` returns `500` or there are no products, stop and check:
- MongoDB is running
- `npm run data:import` succeeded
- `.env` points at `mongodb://localhost:27017/proshop`
- you are not simultaneously running the Compose stack for the same app

In a second terminal:

```bash
cd /Users/ilyachakun/Desktop/projects/ai-course/proshop_mern
opencode
```

Open a **new session / new chat** so the MCP config is loaded fresh.

In the opencode TUI, run:

```text
/mcp
```

Verify both servers are available and healthy:
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

## Step 3 — Optional debug check: test vector search directly before MCP

This is a quick sanity check from the updated spec. It helps if the
search-docs MCP answers look suspicious later.

```bash
cd /Users/ilyachakun/Desktop/projects/ai-course/proshop_mern/ai
/Users/ilyachakun/Desktop/projects/ai-course/m3-homework/.venv/bin/python -m rag.query "What database does proshop_mern use?" --top-k 3
/Users/ilyachakun/Desktop/projects/ai-course/m3-homework/.venv/bin/python -m rag.query "Which features depend on stripe_alternative?" --top-k 3
/Users/ilyachakun/Desktop/projects/ai-course/m3-homework/.venv/bin/python -m rag.query "checkout incident" --top-k 3
```

Look for sensible `score=...`, `source=...`, and chunk text before moving on.

---

## Step 4 — Prompt 1: feature-flags MCP scenario

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
`get_feature_info` to confirm) and append the log to root `report.md`.

After the prompt finishes, verify that progress was saved:

```bash
git diff -- report.md
```

---

## Step 5 — Prompt 2: search-docs MCP queries

NEW chat:

```
Через search-docs MCP найди ответы на 3 вопроса по документации proshop_mern:
1) Какая БД используется и почему?
2) Какие фичи зависят от stripe_alternative?
3) Что случилось во время последнего incident с checkout?

После прогона — допиши в report.md в корне репо в секцию
## M3 → ### Search-docs MCP — test queries log полный лог: каждый
запрос, какие top-K чанки MCP вернул (id / score / source_file /
фрагмент текста), как ты на их основе сформулировал ответ. Markdown.
```

> Note: original course spec says "payment_stripe_v3" but our
> `features.json` has `stripe_alternative`. Question 2 adjusted.

After the prompt finishes, verify that progress was saved:

```bash
git diff -- report.md
```

---

## Step 6 — Prompt 3: end-to-end (both MCPs)

NEW chat (clean context — important):

```
Через два MCP (feature-flags + search-docs):
1. Найди в документации proshop_mern что такое фича semantic_search
   и какие у неё зависимости (search-docs MCP).
2. Проверь текущее состояние через feature-flags MCP.
3. Если она в статусе Disabled и все зависимости не в Disabled —
   переведи в Testing, установи трафик 25%.
4. Процитируй из документации зачем эта фича нужна.

После прогона — допиши в report.md в корне репо в секцию
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

Then verify the report update too:

```bash
git diff -- report.md
```

---

## Step 7 — Fill the reflection section

Open `report.md` and replace each `<FILL: …>` placeholder, especially
the M3 reflection subsection. Be specific:
- What the agent got right / wrong in the e2e.
- Whether AGENTS.md rules actually steered behavior (did it reach for
  vector search first, or try grep?).
- Anything that surprised you about chunking quality (look at
  `ai/chunks.jsonl`).

## Step 8 — Pre-commit hygiene

```bash
cd /Users/ilyachakun/Desktop/projects/ai-course/proshop_mern

# What's about to be committed
git status

# Review the report changes explicitly
git diff -- report.md

# Confirm .env is ignored (if you have one)
test -f .env && grep -qxF '.env' .gitignore && echo "[ok] .env ignored"

# Confirm chunks.jsonl is reasonable size (NOT GBs)
ls -lh ai/chunks.jsonl
```

## Step 9 — Commit & push to your fork

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

## Step 10 — Submit

Send the GitHub URL of your `proshop_mern` fork to LMS.

The reviewer will:
- Read root `report.md` `## M3` section (the three logs + reflection).
- Open `ai/chunks.jsonl` to spot-check chunking quality.
- Look at `opencode.json` and `AGENTS.md` to confirm setup.
- Browse `ai/`, `backend/routes/featureFlagsRoutes.js`, the admin page code.

That's the whole submission.
