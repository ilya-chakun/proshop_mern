from __future__ import annotations

import argparse
import math
import re
from typing import Iterable

from qdrant_client import QdrantClient, models
from sentence_transformers import CrossEncoder, SentenceTransformer

from rag.config import CFG

_MODEL: SentenceTransformer | None = None
_CLIENT: QdrantClient | None = None
_RERANKER: CrossEncoder | None = None
_CORPUS: list[dict] | None = None


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


def _get_reranker() -> CrossEncoder:
    global _RERANKER
    if _RERANKER is None:
        _RERANKER = CrossEncoder(CFG.reranker_model_name, trust_remote_code=True)
    return _RERANKER


def _stable_key(source_file: str, chunk_index: int) -> str:
    return f"{source_file}::{chunk_index}"


def _tokenize(text: str) -> list[str]:
    return re.findall(r"\w+", text.lower(), flags=re.UNICODE)


def _load_corpus() -> list[dict]:
    global _CORPUS
    if _CORPUS is not None:
        return _CORPUS

    client = _get_client()
    records: list[dict] = []
    next_offset = None
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
      for point in points:
          payload = dict(point.payload or {})
          source_file = payload.get("source_file", "")
          chunk_index = int(payload.get("chunk_index", -1))
          content = payload.get("content", "")
          records.append(
              {
                  "id": str(point.id),
                  "key": _stable_key(source_file, chunk_index),
                  "source_file": source_file,
                  "type": payload.get("type", "unknown"),
                  "content": content,
                  "chunk_index": chunk_index,
                  "last_modified": payload.get("last_modified", ""),
                  "tokens": _tokenize(content),
              }
          )
      if next_offset is None:
          break
    _CORPUS = records
    return _CORPUS


def _filter_corpus(type_filter: str | None = None) -> list[dict]:
    corpus = _load_corpus()
    if not type_filter:
        return corpus
    return [record for record in corpus if record["type"] == type_filter]


def _dense_search(
    query: str,
    top_k: int,
    type_filter: str | None = None,
) -> list[dict]:
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
        source_file = payload.get("source_file", "")
        chunk_index = int(payload.get("chunk_index", -1))
        results.append(
            {
                "id": str(point.id),
                "key": _stable_key(source_file, chunk_index),
                "score": float(point.score),
                "dense_score": float(point.score),
                "source_file": source_file,
                "type": payload.get("type", "unknown"),
                "content": payload.get("content", ""),
                "chunk_index": chunk_index,
                "last_modified": payload.get("last_modified", ""),
            }
        )
    return results


def _bm25_search(query: str, top_k: int, type_filter: str | None = None) -> list[dict]:
    corpus = _filter_corpus(type_filter)
    if not corpus:
        return []

    query_tokens = _tokenize(query)
    if not query_tokens:
        return []

    doc_count = len(corpus)
    avgdl = sum(len(record["tokens"]) for record in corpus) / max(doc_count, 1)
    term_doc_freq: dict[str, int] = {}
    for record in corpus:
        for token in set(record["tokens"]):
            term_doc_freq[token] = term_doc_freq.get(token, 0) + 1

    k1 = 1.5
    b = 0.75
    scored: list[dict] = []
    for record in corpus:
        term_freq: dict[str, int] = {}
        for token in record["tokens"]:
            term_freq[token] = term_freq.get(token, 0) + 1

        score = 0.0
        doc_len = max(len(record["tokens"]), 1)
        for token in query_tokens:
            freq = term_freq.get(token, 0)
            if freq == 0:
                continue
            doc_freq = term_doc_freq.get(token, 0)
            idf = math.log(1 + ((doc_count - doc_freq + 0.5) / (doc_freq + 0.5)))
            denom = freq + k1 * (1 - b + b * (doc_len / max(avgdl, 1)))
            score += idf * ((freq * (k1 + 1)) / denom)

        if score <= 0:
            continue

        scored.append(
            {
                "id": record["id"],
                "key": record["key"],
                "score": score,
                "bm25_score": score,
                "source_file": record["source_file"],
                "type": record["type"],
                "content": record["content"],
                "chunk_index": record["chunk_index"],
                "last_modified": record["last_modified"],
            }
        )

    scored.sort(key=lambda item: item["score"], reverse=True)
    return scored[:top_k]


def _rrf_fuse(result_sets: Iterable[list[dict]], top_k: int) -> list[dict]:
    fused: dict[str, dict] = {}
    rrf_k = CFG.rrf_k

    for result_set in result_sets:
        for rank, item in enumerate(result_set, start=1):
            key = item["key"]
            existing = fused.get(key)
            if existing is None:
                existing = dict(item)
                existing["score"] = 0.0
                fused[key] = existing
            existing["score"] += 1.0 / (rrf_k + rank)
            if "dense_score" in item:
                existing["dense_score"] = item["dense_score"]
            if "bm25_score" in item:
                existing["bm25_score"] = item["bm25_score"]

    ranked = sorted(fused.values(), key=lambda item: item["score"], reverse=True)
    return ranked[:top_k]


def _rerank(query: str, candidates: list[dict], top_k: int) -> list[dict]:
    if not candidates:
        return []
    reranker = _get_reranker()
    pairs = [(query, candidate["content"]) for candidate in candidates]
    scores = reranker.predict(pairs)
    rescored = []
    for candidate, score in zip(candidates, scores):
        item = dict(candidate)
        item["score"] = float(score)
        item["rerank_score"] = float(score)
        rescored.append(item)
    rescored.sort(key=lambda item: item["score"], reverse=True)
    return rescored[:top_k]


def search(
    query: str,
    top_k: int = CFG.default_top_k,
    type_filter: str | None = None,
    mode: str = CFG.default_search_mode,
    candidate_pool: int = CFG.hybrid_candidate_pool,
) -> list[dict]:
    """Returns ranked chunks from dense, hybrid, or hybrid+r rerank search."""
    candidate_pool = max(top_k, candidate_pool)
    dense_results = _dense_search(query=query, top_k=candidate_pool, type_filter=type_filter)

    if mode == "dense":
        return dense_results[:top_k]

    bm25_results = _bm25_search(query=query, top_k=candidate_pool, type_filter=type_filter)
    hybrid_results = _rrf_fuse((dense_results, bm25_results), top_k=candidate_pool)

    if mode == "hybrid":
        return hybrid_results[:top_k]

    if mode == "hybrid_rerank":
        return _rerank(query=query, candidates=hybrid_results, top_k=top_k)

    raise ValueError(f"Unknown search mode: {mode}")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("query")
    parser.add_argument("--top-k", type=int, default=CFG.default_top_k)
    parser.add_argument("--type", dest="type_filter")
    parser.add_argument(
        "--mode",
        choices=["dense", "hybrid", "hybrid_rerank"],
        default=CFG.default_search_mode,
    )
    parser.add_argument("--candidate-pool", type=int, default=CFG.hybrid_candidate_pool)
    args = parser.parse_args()
    results = search(
        query=args.query,
        top_k=args.top_k,
        type_filter=args.type_filter,
        mode=args.mode,
        candidate_pool=args.candidate_pool,
    )
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
