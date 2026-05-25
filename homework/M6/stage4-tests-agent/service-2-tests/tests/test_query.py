"""Tests for ai/rag/query.py.

All external dependencies (Qdrant, SentenceTransformer, CrossEncoder)
are mocked at import time to enable fast, isolated testing.
"""

from __future__ import annotations

import math
import sys
from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest

# Mock heavy external deps BEFORE importing rag.query
sys.modules["qdrant_client"] = MagicMock()
sys.modules["qdrant_client.models"] = MagicMock()
sys.modules["sentence_transformers"] = MagicMock()

# Add parent dirs so we can import
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from rag.query import (  # noqa: E402
    _tokenize,
    _rrf_fuse,
    _bm25_search,
    _stable_key,
    search,
)


# --- Unit tests for pure functions ---


class TestTokenize:
    def test_basic_english(self):
        """Tokenizes English text into lowercase words."""
        tokens = _tokenize("Hello World 123")
        assert tokens == ["hello", "world", "123"]

    def test_unicode_russian(self):
        """Tokenizes Russian text correctly."""
        tokens = _tokenize("Привет мир")
        assert tokens == ["привет", "мир"]

    def test_special_chars_stripped(self):
        """Special characters are not included as tokens."""
        tokens = _tokenize("hello! world? $money")
        assert tokens == ["hello", "world", "money"]

    def test_empty_string(self):
        """Empty string returns empty list."""
        assert _tokenize("") == []


class TestStableKey:
    def test_format(self):
        assert _stable_key("docs/readme.md", 3) == "docs/readme.md::3"

    def test_negative_chunk(self):
        assert _stable_key("file.md", -1) == "file.md::-1"


class TestRrfFuse:
    def test_merges_two_result_sets(self):
        """RRF fusion merges results from two sets, deduplicating by key."""
        set1 = [
            {"key": "a::0", "score": 0.9, "content": "doc A", "source_file": "a", "type": "md", "chunk_index": 0, "last_modified": "", "id": "1", "dense_score": 0.9},
            {"key": "b::0", "score": 0.8, "content": "doc B", "source_file": "b", "type": "md", "chunk_index": 0, "last_modified": "", "id": "2", "dense_score": 0.8},
        ]
        set2 = [
            {"key": "b::0", "score": 5.0, "content": "doc B", "source_file": "b", "type": "md", "chunk_index": 0, "last_modified": "", "id": "2", "bm25_score": 5.0},
            {"key": "c::0", "score": 3.0, "content": "doc C", "source_file": "c", "type": "md", "chunk_index": 0, "last_modified": "", "id": "3", "bm25_score": 3.0},
        ]
        results = _rrf_fuse([set1, set2], top_k=10)
        keys = [r["key"] for r in results]
        assert "a::0" in keys
        assert "b::0" in keys
        assert "c::0" in keys
        # b::0 appears in both sets, should have highest fused score
        b_result = next(r for r in results if r["key"] == "b::0")
        assert b_result["score"] > 0

    def test_empty_sets(self):
        """RRF with empty input returns empty list."""
        assert _rrf_fuse([[], []], top_k=5) == []

    def test_respects_top_k(self):
        """RRF returns at most top_k results."""
        items = [{"key": f"k::{i}", "score": float(i), "content": "", "source_file": "", "type": "", "chunk_index": i, "last_modified": "", "id": str(i)} for i in range(10)]
        results = _rrf_fuse([items], top_k=3)
        assert len(results) == 3


class TestBm25Search:
    """BM25 tests with mocked corpus."""

    @pytest.fixture(autouse=True)
    def mock_corpus(self):
        corpus = [
            {"id": "1", "key": "a::0", "source_file": "a.md", "type": "md", "content": "mongodb database setup", "chunk_index": 0, "last_modified": "", "tokens": _tokenize("mongodb database setup")},
            {"id": "2", "key": "b::0", "source_file": "b.md", "type": "md", "content": "react frontend components", "chunk_index": 0, "last_modified": "", "tokens": _tokenize("react frontend components")},
            {"id": "3", "key": "c::0", "source_file": "c.md", "type": "adr", "content": "mongodb vs postgres decision", "chunk_index": 0, "last_modified": "", "tokens": _tokenize("mongodb vs postgres decision")},
        ]
        with patch("rag.query._load_corpus", return_value=corpus):
            with patch("rag.query._filter_corpus", return_value=corpus):
                yield corpus

    def test_matching_query(self):
        """BM25 returns documents matching query terms."""
        results = _bm25_search("mongodb", top_k=5)
        assert len(results) >= 1
        sources = [r["source_file"] for r in results]
        assert "a.md" in sources

    def test_no_match(self):
        """BM25 returns empty list for non-matching query."""
        results = _bm25_search("zzzznonexistent", top_k=5)
        assert results == []

    def test_empty_query(self):
        """Empty query returns empty (no tokens to match)."""
        results = _bm25_search("", top_k=5)
        assert results == []

    def test_scores_are_positive(self):
        """All returned BM25 scores are positive."""
        results = _bm25_search("mongodb database", top_k=5)
        for r in results:
            assert r["score"] > 0
            assert r["bm25_score"] > 0


class TestSearchIntegration:
    """Integration tests with all external deps mocked."""

    def test_invalid_mode_raises(self):
        """Unknown search mode raises ValueError."""
        with patch("rag.query._dense_search", return_value=[]):
            with patch("rag.query._bm25_search", return_value=[]):
                with pytest.raises(ValueError, match="Unknown search mode"):
                    search("test", mode="invalid_mode")

    def test_dense_mode_returns_results(self):
        """Dense mode returns only dense results."""
        fake_results = [{"key": "a::0", "score": 0.9, "content": "test", "source_file": "a", "type": "md", "chunk_index": 0, "last_modified": "", "id": "1", "dense_score": 0.9}]
        with patch("rag.query._dense_search", return_value=fake_results):
            results = search("test query", top_k=1, mode="dense")
            assert len(results) == 1
            assert results[0]["key"] == "a::0"
