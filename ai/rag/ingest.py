from __future__ import annotations

import argparse
import time
import uuid
from collections import Counter
from pathlib import Path

import frontmatter
from langchain_text_splitters import RecursiveCharacterTextSplitter
from qdrant_client import QdrantClient, models
from sentence_transformers import SentenceTransformer

from rag.config import CFG, PROJECT_DATA_DIR


TYPE_BY_DIR = {
    "adrs": "adr",
    "api": "api",
    "features": "feature",
    "incidents": "incident",
    "pages": "page",
    "runbooks": "runbook",
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--recreate", action="store_true")
    return parser.parse_args()


def _infer_type(rel: str, metadata: dict) -> str:
    explicit = metadata.get("type")
    if explicit:
        return str(explicit)
    top = rel.split("/", 1)[0]
    return TYPE_BY_DIR.get(top, Path(rel).stem)


def _iter_chunks() -> tuple[list[dict], int]:
    splitter = RecursiveCharacterTextSplitter(
        separators=["\n## ", "\n### ", "\n#### ", "\n\n", "\n", ". ", " "],
        chunk_size=CFG.chunk_size,
        chunk_overlap=CFG.chunk_overlap,
        length_function=len,
    )
    payloads: list[dict] = []
    processed_files = 0
    for file in sorted(PROJECT_DATA_DIR.rglob("*.md")):
        rel = file.relative_to(PROJECT_DATA_DIR).as_posix()
        try:
            post = frontmatter.load(file)
        except Exception:
            post = frontmatter.Post(file.read_text(encoding="utf-8"))
        doc_type = _infer_type(rel, post.metadata)
        meta = {
            "source_file": rel,
            "type": doc_type,
            "last_modified": str(post.metadata.get("last_modified", "")),
        }
        body = post.content.strip()
        if not body:
            continue
        chunks = splitter.split_text(body)
        processed_files += 1
        for i, chunk in enumerate(chunks):
            payloads.append({**meta, "content": chunk, "chunk_index": i})
    return payloads, processed_files


def main() -> None:
    args = parse_args()
    started = time.time()
    payloads, processed_files = _iter_chunks()
    texts = [payload["content"] for payload in payloads]
    model = SentenceTransformer(CFG.model_name)
    vectors = model.encode(
        texts,
        normalize_embeddings=True,
        batch_size=CFG.embed_batch_size,
        show_progress_bar=True,
    )
    client = QdrantClient(url=CFG.qdrant_url)
    if args.recreate or not client.collection_exists(CFG.collection_name):
        client.recreate_collection(
            collection_name=CFG.collection_name,
            vectors_config=models.VectorParams(
                size=CFG.vector_size,
                distance=models.Distance.COSINE,
            ),
        )

    for index in range(0, len(payloads), CFG.upsert_batch_size):
        batch_payloads = payloads[index : index + CFG.upsert_batch_size]
        batch_vectors = vectors[index : index + CFG.upsert_batch_size]
        points = [
            models.PointStruct(id=str(uuid.uuid4()), vector=vec.tolist(), payload=payload)
            for vec, payload in zip(batch_vectors, batch_payloads)
        ]
        client.upsert(collection_name=CFG.collection_name, points=points)

    distribution = Counter(payload["type"] for payload in payloads)
    elapsed = time.time() - started
    print(f"files processed: {processed_files}")
    print(f"total chunks: {len(payloads)}")
    print(f"type distribution: {dict(distribution)}")
    print(f"elapsed seconds: {elapsed:.2f}")


if __name__ == "__main__":
    main()
