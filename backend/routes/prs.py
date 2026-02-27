"""Routes for PR analysis endpoints."""

from fastapi import APIRouter, HTTPException
import httpx
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
