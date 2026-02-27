"""Routes for repository analysis endpoints."""

from fastapi import APIRouter, HTTPException
import httpx
from schemas.request_models import AnalyzeRepositoryRequest
from agents import planner_agent

router = APIRouter(prefix="/api/ai", tags=["Repository"])


@router.post("/analyze-repository")
async def analyze_repository(req: AnalyzeRepositoryRequest):
    """Analyze a repository for structure, features, and insights.

    Returns repository overview, key features, technology stack, and recommendations.
    """
    try:
        result = await planner_agent.analyze_repository(req.owner, req.repo)
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
