"""Reviewer Recommendation Agent — suggests PR reviewers based on file ownership."""

from services import llm_service
from utils.scoring_utils import score_reviewer


async def recommend(changed_files: list[str], contributors: list[dict],
                    pr_author: str = "") -> dict:
    """Recommend reviewers for a PR based on file ownership and activity.

    Returns:
        {
            "suggested_reviewers": [
                {"developer_name": "", "confidence_score": 0, "reasoning": ""}
            ]
        }
    """
    if not contributors:
        return {"suggested_reviewers": []}

    # Step 1: Score each contributor
    scored = []
    for c in contributors:
        login = c.get("login", "unknown")
        # Skip the PR author
        if login == pr_author:
            continue
        confidence = score_reviewer(c, changed_files)
        scored.append({
            "developer_name": login,
            "confidence_score": confidence,
            "total_commits": c.get("total_commits", 0),
        })

    scored.sort(key=lambda x: x["confidence_score"], reverse=True)
    top_reviewers = scored[:3]

    # Step 2: LLM enrichment
    if llm_service.is_available() and top_reviewers:
        reviewers_text = "\n".join(
            f"- {r['developer_name']}: confidence={r['confidence_score']}, commits={r['total_commits']}"
            for r in top_reviewers
        )
        files_text = ", ".join(changed_files[:10])
        prompt = f"""You are an engineering manager selecting code reviewers.

Changed Files: {files_text}

Top Candidate Reviewers:
{reviewers_text}

For each reviewer, provide a brief reasoning for why they're suitable.

Respond with ONLY a JSON object:
{{
    "suggested_reviewers": [
        {{"developer_name": "<name>", "confidence_score": <score>, "reasoning": "<1-2 sentences>"}}
    ]
}}"""
        result = await llm_service.generate(prompt, expect_json=True)
        if result and isinstance(result, dict) and "suggested_reviewers" in result:
            return result

    # Fallback reasoning
    return {
        "suggested_reviewers": [
            {
                "developer_name": r["developer_name"],
                "confidence_score": r["confidence_score"],
                "reasoning": f"Active contributor with {r['total_commits']} commits. Confidence score: {r['confidence_score']}/100."
            }
            for r in top_reviewers
        ]
    }
