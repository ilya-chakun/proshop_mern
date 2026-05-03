import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from fastmcp import FastMCP

from rag.query import search

mcp = FastMCP("search-docs")


@mcp.tool()
def search_project_docs(query: str, top_k: int = 5) -> list[dict]:
    """Search proshop_mern documentation by semantic similarity.

    WHEN TO CALL:
    Use this tool whenever the user asks about proshop_mern's WRITTEN
    MATERIALS (architecture, decisions, processes, history):
    - Architecture, design decisions, ADRs ("почему MongoDB", "архитектура").
    - Feature purpose and behavior ("что делает search_v2",
      "зачем нужна semantic_search", "как работает checkout flow").
    - Runbooks and operational procedures.
    - Incidents and postmortems ("что случилось с checkout",
      "последний инцидент").
    - Glossary terms, best practices, dev history.
    - API endpoints documentation.
    - Any "what is X", "how does Y work", "why was Z chosen" question
      about proshop_mern.

    WHEN NOT TO CALL — you MUST distinguish:
    - Current LIVE STATE of feature flags (status, traffic %, dependencies
      AS THEY ARE NOW IN RUNTIME) → use `get_feature_info` from the
      feature-flags MCP server.
    - MUTATING feature state → use `set_feature_state` /
      `adjust_traffic_rollout` from feature-flags MCP server.
    - This tool returns DOCUMENTATION (immutable, written), not runtime state.

    INPUT:
    - query: natural language question, any language (RU/EN both work).
    - top_k: 1–10, default 5.

    OUTPUT: list of {source_file, type, score, content_snippet (300 chars), retrieval_mode},
    sorted by relevance descending.

    EXAMPLES:
      search_project_docs("MongoDB vs Postgres decision")
        → [{"source_file": "adrs/adr-001-mongodb-vs-postgres.md", ...}]
      search_project_docs("checkout incident", top_k=3)
        → [{"source_file": "incidents/...", ...}]
    """
    top_k = max(1, min(top_k, 10))
    raw = search(query=query, top_k=top_k)
    return [
        {
            "source_file": result["source_file"],
            "type": result["type"],
            "score": result["score"],
            "content_snippet": result["content"][:300],
            "retrieval_mode": "hybrid_rerank",
        }
        for result in raw
    ]


if __name__ == "__main__":
    mcp.run()
