"""Routes for issue analysis endpoints."""

from fastapi import APIRouter, HTTPException
from schemas.request_models import AnalyzeIssuesRequest
from agents import planner_agent

router = APIRouter(prefix="/api/ai", tags=["Issues"])


@router.post("/analyze-issues")
async def analyze_issues(req: AnalyzeIssuesRequest):
    """Analyze open issues for a repository.

    Returns classified issues with priority, labels, and assignee recommendations.
    """
    try:
        result = await planner_agent.analyze_issues(req.owner, req.repo)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
