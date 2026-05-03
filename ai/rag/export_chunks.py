"""Export all points from Qdrant collection 'proshop_docs' to chunks.jsonl.

One line per chunk: {"id", "text", "metadata": {source_file, type, last_modified, chunk_index}}.
"""
import json
from pathlib import Path

from qdrant_client import QdrantClient

from rag.config import CFG

OUTPUT = Path(__file__).resolve().parent.parent / 'chunks.jsonl'


def main() -> None:
    client = QdrantClient(url=CFG.qdrant_url)

    total = client.count(collection_name=CFG.collection_name, exact=True).count
    print(f"Exporting {total} points from '{CFG.collection_name}' → {OUTPUT}")

    written = 0
    next_offset = None
    with OUTPUT.open('w', encoding='utf-8') as output_file:
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
            text = payload.pop('content', '')
            line = {
                'id': str(point.id),
                'text': text,
                'metadata': payload,
            }
            output_file.write(json.dumps(line, ensure_ascii=False) + '\n')
            written += 1
        if next_offset is None:
            break

    print(f'[ok] wrote {written} chunks to {OUTPUT}')


if __name__ == '__main__':
    main()
