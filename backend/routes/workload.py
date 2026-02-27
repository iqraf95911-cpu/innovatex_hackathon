"""Routes for workload analysis endpoints."""

from fastapi import APIRouter, HTTPException
import httpx
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
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 404:
            raise HTTPException(
                status_code=404,
                detail=f"Repository '{req.owner}/{req.repo}' not found. Please check the repository name and ensure it exists on GitHub."
            )
        elif e.response.status_code == 403:
            raise HTTPException(
                status_code=403,
                detail="Access forbidden. The repository may be private or your GitHub token lacks permissions."
            )
        elif e.response.status_code == 401:
            raise HTTPException(
                status_code=401,
                detail="GitHub authentication failed. Please check your GitHub token configuration."
            )
        else:
            raise HTTPException(status_code=e.response.status_code, detail=f"GitHub API error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
