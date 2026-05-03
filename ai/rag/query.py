from __future__ import annotations

import argparse

from qdrant_client import QdrantClient, models
from sentence_transformers import SentenceTransformer

from rag.config import CFG

_MODEL: SentenceTransformer | None = None
_CLIENT: QdrantClient | None = None


def _get_model() -> SentenceTransformer:
    global _MODEL
    if _MODEL is None:
        _MODEL = SentenceTransformer(CFG.model_name)
    return _MODEL


def _get_client() -> QdrantClient:
    global _CLIENT
    if _CLIENT is None:
        _CLIENT = QdrantClient(url=CFG.qdrant_url)
    return _CLIENT


def search(query: str, top_k: int = CFG.default_top_k, type_filter: str | None = None) -> list[dict]:
    """Returns list of {score, source_file, type, content, chunk_index}, sorted desc by score."""
    model = _get_model()
    client = _get_client()
    qvec = model.encode(query, normalize_embeddings=True)
    qfilter = None
    if type_filter:
        qfilter = models.Filter(
            must=[models.FieldCondition(key="type", match=models.MatchValue(value=type_filter))]
        )
    response = client.query_points(
        collection_name=CFG.collection_name,
        query=qvec.tolist(),
        limit=top_k,
        query_filter=qfilter,
        with_payload=True,
        with_vectors=False,
    )
    results: list[dict] = []
    for point in response.points:
        payload = point.payload or {}
        results.append(
            {
                "score": point.score,
                "source_file": payload.get("source_file", ""),
                "type": payload.get("type", "unknown"),
                "content": payload.get("content", ""),
                "chunk_index": payload.get("chunk_index", -1),
            }
        )
    return results


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("query")
    parser.add_argument("--top-k", type=int, default=CFG.default_top_k)
    parser.add_argument("--type", dest="type_filter")
    args = parser.parse_args()
    results = search(query=args.query, top_k=args.top_k, type_filter=args.type_filter)
    for idx, hit in enumerate(results, start=1):
        print("=" * 60)
        print(
            f"[{idx}] score={hit['score']:.4f}  type={hit['type']}  "
            f"source={hit['source_file']}  chunk={hit['chunk_index']}"
        )
        print("-" * 60)
        print(hit["content"][:400])
    if results:
        print("=" * 60)


if __name__ == "__main__":
    main()
