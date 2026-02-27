"""Routes for workload analysis endpoints."""

from fastapi import APIRouter, HTTPException
from schemas.request_models import AnalyzeWorkloadRequest
from agents import planner_agent

router = APIRouter(prefix="/api/ai", tags=["Workload"])


@router.post("/analyze-workload")
async def analyze_workload(req: AnalyzeWorkloadRequest):
    """Analyze developer workload for a repository.

    Returns per-developer load scores and AI-generated balancing recommendations.
    """
    try:
        result = await planner_agent.analyze_workload(req.owner, req.repo)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
