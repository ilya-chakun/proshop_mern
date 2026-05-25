"""Tests for ai/mcp-feature-flags/server.py.

Uses tmp_path fixture to avoid touching real features.json.
All tests operate on isolated copies of feature flag data.
"""

from __future__ import annotations

import json
from pathlib import Path
from unittest.mock import patch

import pytest

# We import the module functions directly; they use _load/_save which
# we patch to use tmp files.
import sys

# Add parent so we can import server module
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from server import (  # noqa: E402
    _get,
    _load,
    _save,
    _today,
    _deps_state,
    FEATURES_PATH,
)

# MCP tool-decorated functions are FunctionTool objects;
# access the underlying callable via .fn
import server as _srv  # noqa: E402

_adjust_traffic_rollout = _srv.adjust_traffic_rollout.fn
_get_feature_info = _srv.get_feature_info.fn
_list_features = _srv.list_features.fn
_set_feature_state = _srv.set_feature_state.fn

SAMPLE_DATA = {
    "search_v2": {
        "name": "New Search",
        "status": "Testing",
        "traffic_percentage": 15,
        "last_modified": "2026-01-01",
        "dependencies": [],
    },
    "semantic_search": {
        "name": "Semantic Search",
        "status": "Disabled",
        "traffic_percentage": 0,
        "last_modified": "2026-01-01",
        "dependencies": ["search_v2"],
    },
}


@pytest.fixture()
def features_file(tmp_path: Path):
    """Create a temporary features.json and patch FEATURES_PATH."""
    fp = tmp_path / "features.json"
    fp.write_text(json.dumps(SAMPLE_DATA, indent=2), encoding="utf-8")
    with patch("server.FEATURES_PATH", fp):
        yield fp


# --- Happy path tests ---


def test__get_feature_info_returns_correct_shape(features_file):
    """_get_feature_info returns dict with all expected keys."""
    result = _get_feature_info("search_v2")
    assert result["name"] == "search_v2"
    assert result["display_name"] == "New Search"
    assert result["status"] == "Testing"
    assert result["traffic_percentage"] == 15
    assert isinstance(result["dependencies"], list)
    assert isinstance(result["dependencies_state"], dict)


def test__list_features_returns_all(features_file):
    """_list_features returns one entry per feature with correct fields."""
    result = _list_features()
    assert len(result) == 2
    names = [f["name"] for f in result]
    assert "search_v2" in names
    assert "semantic_search" in names
    assert all("status" in f for f in result)
    assert all("traffic_percentage" in f for f in result)


def test_set_state_to_testing(features_file):
    """Setting state to Testing succeeds and updates last_modified."""
    result = _set_feature_state("search_v2", "Testing")
    assert result["new_state"] == "Testing"
    assert result["previous_state"] == "Testing"
    assert result["last_modified"] == _today()


# --- Edge case tests ---


def test_set_state_disabled_resets_traffic(features_file):
    """Setting state to Disabled resets traffic_percentage to 0."""
    _set_feature_state("search_v2", "Disabled")
    info = _get_feature_info("search_v2")
    assert info["status"] == "Disabled"
    assert info["traffic_percentage"] == 0


def test_adjust_traffic_boundary_values(features_file):
    """Traffic at boundaries 0 and 100 is valid."""
    _adjust_traffic_rollout("search_v2", 0)
    info = _get_feature_info("search_v2")
    assert info["traffic_percentage"] == 0

    _adjust_traffic_rollout("search_v2", 100)
    info = _get_feature_info("search_v2")
    assert info["traffic_percentage"] == 100


# --- Error path tests ---


def test__get_feature_info_missing_raises(features_file):
    """Non-existent feature raises ValueError."""
    with pytest.raises(ValueError, match="not found"):
        _get_feature_info("nonexistent_feature")


def test_set_state_invalid_state_raises(features_file):
    """Invalid state string raises ValueError."""
    with pytest.raises(ValueError, match="must be one of"):
        _set_feature_state("search_v2", "InvalidState")


def test_set_state_enabled_blocked_by_dependency(features_file):
    """Cannot enable a feature when its dependency is Disabled."""
    # semantic_search depends on search_v2; first disable search_v2
    _set_feature_state("search_v2", "Disabled")
    with pytest.raises(ValueError, match="Cannot enable"):
        _set_feature_state("semantic_search", "Enabled")


def test_adjust_traffic_on_disabled_raises(features_file):
    """Cannot set traffic > 0 on a Disabled feature."""
    _set_feature_state("search_v2", "Disabled")
    with pytest.raises(ValueError, match="Cannot set traffic"):
        _adjust_traffic_rollout("search_v2", 50)


def test_adjust_traffic_negative_raises(features_file):
    """Negative percentage raises ValueError."""
    with pytest.raises(ValueError, match="between 0 and 100"):
        _adjust_traffic_rollout("search_v2", -1)


def test_adjust_traffic_over_100_raises(features_file):
    """Percentage > 100 raises ValueError."""
    with pytest.raises(ValueError, match="between 0 and 100"):
        _adjust_traffic_rollout("search_v2", 101)


# --- Security test ---


def test_save_is_atomic(features_file):
    """_save uses atomic write (temp file + rename), so features_file
    should still be valid JSON even if interrupted."""
    data = json.loads(features_file.read_text(encoding="utf-8"))
    data["search_v2"]["status"] = "Enabled"
    from server import _save as do_save

    with patch("server.FEATURES_PATH", features_file):
        do_save(data)
    reloaded = json.loads(features_file.read_text(encoding="utf-8"))
    assert reloaded["search_v2"]["status"] == "Enabled"
