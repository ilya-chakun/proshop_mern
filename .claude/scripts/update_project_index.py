#!/usr/bin/env python3
"""Update project-index.json last_updated timestamp and filesystem_tree.

Standalone script — run manually or via post-tool hook:
  python3 .opencode/scripts/update_project_index.py

Watches for changes in WATCH_PATHS and updates the project index.
"""

from __future__ import annotations

import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent
INDEX_PATH = ROOT / "project-index.json"

WATCH_PATHS = (
    "backend/",
    "frontend/src/",
    "ai/mcp-feature-flags/",
    "ai/mcp-search-docs/",
    "ai/rag/",
)

# Max depth for filesystem_tree generation
MAX_DEPTH = 4


def _build_tree(base: Path, depth: int = 0) -> dict | str:
    """Recursively build a directory tree dict, up to MAX_DEPTH."""
    if depth >= MAX_DEPTH or not base.is_dir():
        return str(base.name)

    tree = {}
    try:
        entries = sorted(base.iterdir(), key=lambda p: (not p.is_dir(), p.name))
    except PermissionError:
        return "permission denied"

    for entry in entries:
        if entry.name.startswith(".") or entry.name == "node_modules":
            continue
        if entry.is_dir():
            tree[entry.name + "/"] = _build_tree(entry, depth + 1)
        else:
            tree[entry.name] = entry.name
    return tree


def update_index() -> None:
    """Update the project-index.json file."""
    if not INDEX_PATH.exists():
        print(f"[update-index] ERROR: {INDEX_PATH} not found", file=sys.stderr)
        sys.exit(1)

    with INDEX_PATH.open("r", encoding="utf-8") as f:
        data = json.load(f)

    # Update timestamp
    data["last_updated"] = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

    # Rebuild filesystem_tree for watched paths
    fs_tree = {}
    for watch_path in WATCH_PATHS:
        full_path = ROOT / watch_path
        if full_path.exists():
            key = watch_path.rstrip("/") + "/"
            parts = key.split("/")
            # Build nested structure
            current = fs_tree
            for part in parts[:-2]:  # all but last empty string and dir name
                k = part + "/"
                if k not in current:
                    current[k] = {}
                current = current[k]
            dir_name = parts[-2] + "/"
            current[dir_name] = _build_tree(full_path, depth=1)

    if fs_tree:
        data["filesystem_tree"] = fs_tree

    with INDEX_PATH.open("w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
        f.write("\n")

    print(f"[update-index manual] Updated {INDEX_PATH} at {data['last_updated']}")


if __name__ == "__main__":
    os.chdir(ROOT)
    update_index()
