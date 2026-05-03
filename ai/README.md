# /ai — M3 homework artifacts

This folder contains the AI/MCP/RAG layer added in Module 3.

- `mcp-feature-flags/` — MCP server for feature flag CRUD (4 tools).
- `mcp-search-docs/`   — MCP server wrapping hybrid+r reranked search over project docs.
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

# Compare dense vs hybrid vs hybrid+r rerank
$PYTHON -m rag.evaluate_optional

# Export all chunks → ai/chunks.jsonl
$PYTHON -m rag.export_chunks
```

## Vector DB

Qdrant runs in Docker (volume mounted at `../m3-homework/qdrant_storage`). The collection is `proshop_docs`. Dashboard at http://localhost:6333/dashboard.
