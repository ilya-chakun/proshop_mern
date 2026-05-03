from __future__ import annotations

from dataclasses import dataclass

from rag.query import search


@dataclass(frozen=True)
class EvalCase:
    query: str
    relevant_sources: tuple[str, ...]
    note: str


CASES = (
    EvalCase(
        query="Почему выбрали MongoDB вместо PostgreSQL?",
        relevant_sources=(
            "adrs/adr-001-mongodb-vs-postgres.md",
            "dev-history.md",
        ),
        note="DB decision / rationale",
    ),
    EvalCase(
        query="Какие фичи зависят от stripe_alternative? apple_pay dependencies",
        relevant_sources=(
            "feature-flags-spec.md",
            "features/payments.md",
        ),
        note="Dependency lookup",
    ),
    EvalCase(
        query="Последний incident checkout payment outage что случилось?",
        relevant_sources=(
            "runbooks/incident-response.md",
            "incidents/i-001-paypal-double-charge.md",
        ),
        note="Latest checkout incident",
    ),
)


def _metrics(mode: str, top_k: int = 5) -> dict:
    reciprocal_ranks = []
    recalls = []
    top_hits = []

    for case in CASES:
        results = search(query=case.query, top_k=top_k, mode=mode, candidate_pool=25)
        first_relevant_rank = 0
        relevant_sources = set(case.relevant_sources)
        for rank, result in enumerate(results, start=1):
            if result["source_file"] in relevant_sources:
                first_relevant_rank = rank
                break

        reciprocal_ranks.append(0 if first_relevant_rank == 0 else 1 / first_relevant_rank)
        recalls.append(1 if first_relevant_rank else 0)
        top_hits.append(results[0]["source_file"] if results else "—")

    count = len(CASES)
    return {
        "mode": mode,
        "mrr": sum(reciprocal_ranks) / count,
        "recall_at_5": sum(recalls) / count,
        "top_hits": top_hits,
    }


def main() -> None:
    print("| Mode | MRR | Recall@5 | Top-1 hits |")
    print("|---|---:|---:|---|")
    for mode in ("dense", "hybrid", "hybrid_rerank"):
        metrics = _metrics(mode)
        joined_hits = "<br>".join(metrics["top_hits"])
        print(
            f"| `{mode}` | {metrics['mrr']:.2f} | {metrics['recall_at_5']:.2f} | {joined_hits} |"
        )


if __name__ == "__main__":
    main()
