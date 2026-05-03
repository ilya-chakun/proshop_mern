from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from tempfile import NamedTemporaryFile

from fastmcp import FastMCP

FEATURES_PATH = (
    Path(__file__).resolve().parent.parent.parent / "backend" / "features.json"
)
ALLOWED_STATES = {"Disabled", "Testing", "Enabled"}

mcp = FastMCP("feature-flags")


def _load() -> dict:
    with FEATURES_PATH.open("r", encoding="utf-8") as fh:
        return json.load(fh)


def _save(data: dict) -> None:
    FEATURES_PATH.parent.mkdir(parents=True, exist_ok=True)
    with NamedTemporaryFile("w", encoding="utf-8", dir=FEATURES_PATH.parent, delete=False) as tmp:
        json.dump(data, tmp, indent=2, ensure_ascii=False)
        tmp.write("\n")
        temp_path = Path(tmp.name)
    temp_path.replace(FEATURES_PATH)


def _get(name: str, data: dict) -> dict:
    if name not in data:
        raise ValueError(f"Feature '{name}' not found")
    return data[name]


def _today() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%d")


def _deps_state(feature: dict, all_features: dict) -> dict[str, str]:
    return {dep: _get(dep, all_features)["status"] for dep in feature.get("dependencies", [])}


@mcp.tool()
def get_feature_info(feature_name: str) -> dict:
    """Read the current state of a feature flag in proshop_mern.

    WHEN TO CALL:
    - User asks about current status, traffic %, or dependencies of a
      specific feature ("проверь search_v2", "что с stripe_alternative").
    - BEFORE changing state — to see the baseline.
    - AFTER changing state — to confirm the change.

    WHEN NOT TO CALL:
    - User asks WHAT a feature DOES (purpose, business logic) →
      use search_project_docs (different MCP server).
    - User wants a LIST of all features — this tool returns ONE feature.

    INPUT: feature_name — exact key from features.json
           (e.g. "search_v2", not display name).

    OUTPUT: dict with status, traffic_percentage, last_modified,
    dependencies, dependencies_state.

    EXAMPLES:
      get_feature_info("search_v2")
        → {"status": "Testing", "traffic_percentage": 15,
           "dependencies": [], "dependencies_state": {}, ...}

      get_feature_info("semantic_search")
        → {"status": "Disabled", "dependencies": ["search_v2"],
           "dependencies_state": {"search_v2": "Testing", ...}}
    """
    data = _load()
    feature = _get(feature_name, data)
    return {
        "name": feature_name,
        "display_name": feature["name"],
        "status": feature["status"],
        "traffic_percentage": int(feature["traffic_percentage"]),
        "last_modified": feature["last_modified"],
        "dependencies": list(feature.get("dependencies", [])),
        "dependencies_state": _deps_state(feature, data),
    }


@mcp.tool()
def set_feature_state(feature_name: str, state: str) -> dict:
    """Change the status of a feature flag.

    WHEN TO CALL:
    - User explicitly requests a state change ("переведи в Testing",
      "включи фичу X", "отключи Y").
    - After verifying current state via get_feature_info.

    WHEN NOT TO CALL:
    - To change traffic percentage → use adjust_traffic_rollout.
    - To search docs about the feature → use search_project_docs.

    CRITICAL CONSTRAINTS — you MUST honor:
    - state MUST be exactly one of: "Disabled", "Testing", "Enabled" (case-sensitive).
    - You CANNOT set state="Enabled" if ANY dependency is in "Disabled".
      The tool raises ValueError listing the blocking deps. Resolve by first
      calling set_feature_state on those deps to move them to Testing or Enabled.
    - Setting state="Disabled" automatically resets traffic_percentage to 0.

    INPUT:
    - feature_name: exact key from features.json
    - state: "Disabled" | "Testing" | "Enabled"

    OUTPUT: {feature_name, previous_state, new_state,
             dependencies_state, last_modified}.

    EXAMPLES:
      set_feature_state("search_v2", "Testing") → success.
      set_feature_state("semantic_search", "Enabled") when search_v2 is Disabled
        → ValueError: "Cannot enable 'semantic_search': dependencies in
           Disabled state: ['search_v2']..."
    """
    if state not in ALLOWED_STATES:
        raise ValueError("State must be one of: Disabled, Testing, Enabled")

    data = _load()
    feature = _get(feature_name, data)
    deps = _deps_state(feature, data)
    blocking = [name for name, dep_state in deps.items() if dep_state == "Disabled"]
    if state == "Enabled" and blocking:
        raise ValueError(
            f"Cannot enable '{feature_name}': dependencies in Disabled state: {blocking}"
        )

    previous_state = feature["status"]
    feature["status"] = state
    if state == "Disabled":
        feature["traffic_percentage"] = 0
    feature["last_modified"] = _today()
    _save(data)

    return {
        "feature_name": feature_name,
        "previous_state": previous_state,
        "new_state": state,
        "dependencies_state": deps,
        "last_modified": feature["last_modified"],
    }


@mcp.tool()
def adjust_traffic_rollout(feature_name: str, percentage: int) -> dict:
    """Adjust traffic rollout percentage (0–100) for a feature.

    WHEN TO CALL:
    - User wants to roll out traffic gradually ("трафик 25%", "30 процентов").
    - After feature is in Testing or Enabled state.

    WHEN NOT TO CALL:
    - To CHANGE STATE — use set_feature_state first.
    - This tool ONLY adjusts the traffic NUMBER.

    CRITICAL CONSTRAINTS — you MUST honor:
    - percentage MUST be an integer 0–100 inclusive.
    - HARD LOCK: percentage > 0 is IMPOSSIBLE while status == "Disabled".
      You MUST call set_feature_state to move it out of Disabled FIRST.

    INPUT:
    - feature_name: exact key from features.json
    - percentage: integer 0–100

    OUTPUT: {feature_name, traffic_percentage, status, last_modified}.

    EXAMPLES:
      adjust_traffic_rollout("search_v2", 25) → success.
      adjust_traffic_rollout("semantic_search", 10) when Disabled
        → ValueError "Cannot set traffic > 0 on Disabled feature..."
    """
    if not isinstance(percentage, int) or not 0 <= percentage <= 100:
        raise ValueError("percentage must be an integer between 0 and 100")

    data = _load()
    feature = _get(feature_name, data)
    if feature["status"] == "Disabled" and percentage > 0:
        raise ValueError(f"Cannot set traffic > 0 on Disabled feature '{feature_name}'")

    feature["traffic_percentage"] = percentage
    feature["last_modified"] = _today()
    _save(data)
    return {
        "feature_name": feature_name,
        "traffic_percentage": feature["traffic_percentage"],
        "status": feature["status"],
        "last_modified": feature["last_modified"],
    }


@mcp.tool()
def list_features() -> list[dict]:
    """List all feature flags as a compact summary.

    WHEN TO CALL:
    - User asks for an overview / list of features ("какие есть фичи",
      "show all features", "покажи все флаги").
    - You need to find a feature by partial name or by status before
      drilling into one feature with get_feature_info.

    WHEN NOT TO CALL:
    - User asks about ONE specific feature → use get_feature_info.
    - User wants to mutate state → use set_feature_state /
      adjust_traffic_rollout.
    - Do NOT read backend/features.json directly via the file system —
      always go through this tool.

    INPUT: none.

    OUTPUT: list of {name, status, traffic_percentage}, one entry per
    feature, in insertion order from features.json.

    EXAMPLE:
      list_features()
        → [{"name": "search_v2", "status": "Testing", "traffic_percentage": 15},
           {"name": "semantic_search", "status": "Disabled", "traffic_percentage": 0},
           ...]
    """
    data = _load()
    return [
        {
            "name": name,
            "status": feat.get("status"),
            "traffic_percentage": feat.get("traffic_percentage", 0),
        }
        for name, feat in data.items()
    ]


if __name__ == "__main__":
    mcp.run()
