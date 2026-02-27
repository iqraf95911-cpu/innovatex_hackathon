"""Workload Analysis Agent — analyzes developer workload and provides balancing recommendations."""

from services import llm_service
from utils.scoring_utils import calculate_load_score


async def analyze(issue_counts: dict[str, int], review_counts: dict[str, int],
                  contributors: list[dict]) -> dict:
    """Analyze developer workload across issues and PR reviews.

    Returns:
        {
            "developer_workload": [
                {"developer_name": "", "open_issues": 0, "pending_reviews": 0, "load_score": 0}
            ],
            "ai_recommendation": ""
        }
    """
    # Collect all known developers
    all_devs = set(issue_counts.keys()) | set(review_counts.keys())
    for c in contributors:
        all_devs.add(c.get("login", ""))
    all_devs.discard("")

    # Build workload list
    workload = []
    for dev in sorted(all_devs):
        open_issues = issue_counts.get(dev, 0)
        pending_reviews = review_counts.get(dev, 0)
        load = calculate_load_score(open_issues, pending_reviews)
        workload.append({
            "developer_name": dev,
            "open_issues": open_issues,
            "pending_reviews": pending_reviews,
            "load_score": load,
        })

    # Sort by load descending
    workload.sort(key=lambda x: x["load_score"], reverse=True)

    # Generate AI recommendation
    recommendation = await _generate_recommendation(workload)

    return {
        "developer_workload": workload,
        "ai_recommendation": recommendation,
    }


async def _generate_recommendation(workload: list[dict]) -> str:
    """Generate workload balancing recommendation."""
    if not workload:
        return "No developer activity data available."

    # Try LLM
    if llm_service.is_available():
        workload_text = "\n".join(
            f"- {w['developer_name']}: {w['open_issues']} open issues, "
            f"{w['pending_reviews']} pending reviews, load_score={w['load_score']}"
            for w in workload[:10]
        )
        prompt = f"""You are an engineering manager analyzing team workload.

Developer Workload:
{workload_text}

Load Score Formula: (open_issues × 2) + pending_reviews

Provide a concise (2-3 sentence) recommendation for balancing the team's workload.
Consider who is overloaded and who has capacity. Be specific with names.

Respond with ONLY a plain text recommendation (no JSON, no markdown)."""

        result = await llm_service.generate(prompt, expect_json=False)
        if result and isinstance(result, str):
            return result

    # Fallback — rule-based recommendation
    if len(workload) == 0:
        return "No workload data available."

    overloaded = [w for w in workload if w["load_score"] >= 6]
    underloaded = [w for w in workload if w["load_score"] <= 2]

    parts = []
    if overloaded:
        names = ", ".join(w["developer_name"] for w in overloaded[:3])
        parts.append(f"High workload detected for: {names} (load score ≥ 6).")

    if underloaded:
        names = ", ".join(w["developer_name"] for w in underloaded[:3])
        parts.append(f"Available capacity: {names} (load score ≤ 2) — consider redistributing tasks.")

    if not parts:
        avg_load = sum(w["load_score"] for w in workload) / len(workload)
        parts.append(f"Team workload is relatively balanced. Average load score: {avg_load:.1f}.")

    return " ".join(parts)
