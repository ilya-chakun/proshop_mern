from dataclasses import dataclass
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PROJECT_DATA_DIR = (
    Path(__file__).resolve().parent.parent.parent.parent
    / "aidev-course-materials" / "M3" / "project-data"
)


@dataclass(frozen=True)
class RAGConfig:
    model_name: str = "BAAI/bge-m3"
    reranker_model_name: str = "BAAI/bge-reranker-v2-m3"
    vector_size: int = 1024
    qdrant_url: str = "http://localhost:6333"
    collection_name: str = "proshop_docs"
    chunk_size: int = 1600
    chunk_overlap: int = 320
    default_top_k: int = 5
    default_search_mode: str = "hybrid_rerank"
    hybrid_candidate_pool: int = 25
    rrf_k: int = 60
    embed_batch_size: int = 32
    upsert_batch_size: int = 64


CFG = RAGConfig()
