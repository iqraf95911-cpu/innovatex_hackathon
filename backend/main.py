"""DevIntel AI — FastAPI Backend Entry Point."""

import os
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Load .env from backend directory
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger(__name__)

# Initialize LLM service
from services import llm_service
llm_service.init_llm()

# Initialize GitHub token from env
from services import github_service
token = os.getenv("GITHUB_TOKEN", "")
if token:
    github_service.set_token(token)
    logger.info("GitHub token loaded from environment")
else:
    logger.warning("GITHUB_TOKEN not set — configure via POST /api/ai/config/token")

# Create FastAPI app
app = FastAPI(
    title="DevIntel AI — Multi-Agent Backend",
    description="Autonomous Dev Productivity Assistant powered by LLM agents",
    version="1.0.0",
)

# CORS — allow frontend on port 3000
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---- Register Routes ----
from routes.issues import router as issues_router
from routes.prs import router as prs_router
from routes.workload import router as workload_router
from routes.repository import router as repository_router

app.include_router(issues_router)
app.include_router(prs_router)
app.include_router(workload_router)
app.include_router(repository_router)


# ---- Config Endpoints ----
from pydantic import BaseModel


class TokenConfig(BaseModel):
    github_token: str
    gemini_api_key: str = ""


@app.post("/api/ai/config/token", tags=["Config"])
async def configure_tokens(config: TokenConfig):
    """Set GitHub token and optional Gemini API key at runtime."""
    if config.github_token:
        github_service.set_token(config.github_token)

    if config.gemini_api_key:
        os.environ["GEMINI_API_KEY"] = config.gemini_api_key
        llm_service.init_llm()

    return {
        "github_connected": bool(github_service.get_token()),
        "llm_available": llm_service.is_available(),
    }


@app.get("/api/ai/config/status", tags=["Config"])
async def config_status():
    """Check current configuration status."""
    return {
        "github_connected": bool(github_service.get_token()),
        "llm_available": llm_service.is_available(),
    }


@app.get("/api/ai/health", tags=["Health"])
async def health():
    """Health check endpoint."""
    return {"status": "ok", "service": "DevIntel AI Multi-Agent Backend"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
