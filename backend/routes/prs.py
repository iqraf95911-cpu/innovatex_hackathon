"""Routes for PR analysis endpoints."""

from fastapi import APIRouter, HTTPException
from schemas.request_models import AnalyzePRsRequest
from agents import planner_agent

router = APIRouter(prefix="/api/ai", tags=["Pull Requests"])


@router.post("/analyze-prs")
async def analyze_prs(req: AnalyzePRsRequest):
    """Analyze pull requests for a repository.

    Returns PR intelligence (risk, summary, checklist) and reviewer recommendations.
    """
    try:
        result = await planner_agent.analyze_prs(req.owner, req.repo)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
