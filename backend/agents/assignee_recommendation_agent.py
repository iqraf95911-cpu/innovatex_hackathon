"""Assignee Recommendation Agent — recommends developers for issue assignment."""

from services import llm_service
from utils.scoring_utils import score_assignee


async def recommend(issue_data: dict, contributors: list[dict]) -> dict:
    """Recommend assignees using hybrid scoring + LLM reasoning.

    Returns:
        {
            "recommended_assignees": [
                {"developer_name": "", "score": 0, "reasoning": ""}
            ]
        }
    """
    if not contributors:
        return {"recommended_assignees": []}

    issue_title = issue_data.get("title", "")
    issue_body = issue_data.get("body", "") or ""
    issue_labels = [l.get("name", "") for l in issue_data.get("labels", [])]

    # Step 1: Rule-based scoring
    scored = []
    for c in contributors:
        score = score_assignee(c, issue_labels, [])
        scored.append({
            "developer_name": c.get("login", "unknown"),
            "score": score,
            "total_commits": c.get("total_commits", 0),
        })

    # Sort by score descending, take top 3
    scored.sort(key=lambda x: x["score"], reverse=True)
    top_candidates = scored[:3]

    # Step 2: LLM enrichment for reasoning
    if llm_service.is_available() and top_candidates:
        candidates_text = "\n".join(
            f"- {c['developer_name']}: score={c['score']}, commits={c['total_commits']}"
            for c in top_candidates
        )
        prompt = f"""You are a engineering team assistant. For each candidate, provide a brief reasoning
for why they should be assigned to this issue.

Issue: {issue_title}
Description: {issue_body[:300]}
Labels: {', '.join(issue_labels) or 'none'}

Top Candidates (by contribution score):
{candidates_text}

Respond with ONLY a JSON object:
{{
    "recommended_assignees": [
        {{"developer_name": "<name>", "score": <score>, "reasoning": "<1-2 sentence reasoning>"}}
    ]
}}"""
        result = await llm_service.generate(prompt, expect_json=True)
        if result and isinstance(result, dict) and "recommended_assignees" in result:
            return result

    # Fallback — generate simple reasoning
    return {
        "recommended_assignees": [
            {
                "developer_name": c["developer_name"],
                "score": c["score"],
                "reasoning": f"Has {c['total_commits']} total commits. Activity-based score: {c['score']}/100."
            }
            for c in top_candidates
        ]
    }
