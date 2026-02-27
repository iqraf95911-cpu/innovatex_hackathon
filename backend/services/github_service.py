"""GitHub API service — async client for fetching repos, issues, PRs, contributors."""

import os
import httpx
from utils.constants import GITHUB_API_BASE

_token: str = os.getenv("GITHUB_TOKEN", "").strip().strip('"').strip("'")


def set_token(token: str):
    global _token
    _token = token.strip().strip('"').strip("'")


def get_token() -> str:
    return _token


def _headers():
    return {
        "Authorization": f"token {_token}",
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "DevIntel-AI",
    }


async def get_issues(owner: str, repo: str, state: str = "open", per_page: int = 20) -> list[dict]:
    """Fetch issues for a repository."""
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{GITHUB_API_BASE}/repos/{owner}/{repo}/issues",
            headers=_headers(),
            params={"state": state, "per_page": per_page, "sort": "updated", "direction": "desc"},
            timeout=30,
        )
        resp.raise_for_status()
        # Filter out pull requests (GitHub returns PRs in issues endpoint)
        return [i for i in resp.json() if "pull_request" not in i]


async def get_pulls(owner: str, repo: str, state: str = "all", per_page: int = 20) -> list[dict]:
    """Fetch pull requests for a repository."""
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{GITHUB_API_BASE}/repos/{owner}/{repo}/pulls",
            headers=_headers(),
            params={"state": state, "per_page": per_page, "sort": "updated", "direction": "desc"},
            timeout=30,
        )
        resp.raise_for_status()
        return resp.json()


async def get_pr_files(owner: str, repo: str, pr_number: int) -> list[dict]:
    """Fetch files changed in a specific PR."""
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{GITHUB_API_BASE}/repos/{owner}/{repo}/pulls/{pr_number}/files",
            headers=_headers(),
            params={"per_page": 100},
            timeout=30,
        )
        resp.raise_for_status()
        return resp.json()


async def get_contributors(owner: str, repo: str) -> list[dict]:
    """Fetch contributor stats for a repository."""
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{GITHUB_API_BASE}/repos/{owner}/{repo}/stats/contributors",
            headers=_headers(),
            timeout=30,
        )
        if resp.status_code == 202:
            # GitHub is computing stats — wait and retry once
            import asyncio
            await asyncio.sleep(2)
            resp = await client.get(
                f"{GITHUB_API_BASE}/repos/{owner}/{repo}/stats/contributors",
                headers=_headers(),
                timeout=30,
            )
        
        # If still 202 or error, try the simpler contributors endpoint with pagination
        if resp.status_code != 200:
            all_contributors = []
            page = 1
            
            # Fetch all pages of contributors (up to 500 to avoid infinite loops)
            while page <= 5:  # Max 5 pages = 500 contributors
                resp = await client.get(
                    f"{GITHUB_API_BASE}/repos/{owner}/{repo}/contributors",
                    headers=_headers(),
                    params={"per_page": 100, "page": page},
                    timeout=30,
                )
                resp.raise_for_status()
                
                page_data = resp.json()
                if not page_data or len(page_data) == 0:
                    break
                
                # Add contributors from this page
                all_contributors.extend([
                    {
                        "login": c.get("login", "unknown"),
                        "avatar_url": c.get("avatar_url", ""),
                        "total_commits": c.get("contributions", 0),
                        "weeks": []
                    }
                    for c in page_data
                ])
                
                # If we got less than 100, we've reached the end
                if len(page_data) < 100:
                    break
                
                page += 1
            
            return all_contributors
        
        resp.raise_for_status()
        data = resp.json()
        if not isinstance(data, list):
            return []
        return [
            {
                "login": c.get("author", {}).get("login", "unknown"),
                "avatar_url": c.get("author", {}).get("avatar_url", ""),
                "total_commits": c.get("total", 0),
                "weeks": c.get("weeks", [])[-4:],  # last 4 weeks
            }
            for c in data
        ]


async def get_assignees(owner: str, repo: str) -> list[dict]:
    """Fetch available assignees for a repository."""
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{GITHUB_API_BASE}/repos/{owner}/{repo}/assignees",
            headers=_headers(),
            params={"per_page": 30},
            timeout=30,
        )
        resp.raise_for_status()
        return resp.json()


async def get_pr_reviews(owner: str, repo: str, pr_number: int) -> list[dict]:
    """Fetch reviews for a specific PR."""
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{GITHUB_API_BASE}/repos/{owner}/{repo}/pulls/{pr_number}/reviews",
            headers=_headers(),
            timeout=30,
        )
        resp.raise_for_status()
        return resp.json()


async def get_user_issues(owner: str, repo: str) -> dict[str, int]:
    """Count open issues assigned to each user."""
    issues = await get_issues(owner, repo, state="open", per_page=100)
    counts: dict[str, int] = {}
    for issue in issues:
        assignees = issue.get("assignees", [])
        for a in assignees:
            login = a.get("login", "")
            counts[login] = counts.get(login, 0) + 1
    return counts


async def get_pending_reviews(owner: str, repo: str) -> dict[str, int]:
    """Count pending PR reviews per user (requested reviewers on open PRs)."""
    prs = await get_pulls(owner, repo, state="open", per_page=50)
    counts: dict[str, int] = {}
    for pr in prs:
        requested = pr.get("requested_reviewers", [])
        for r in requested:
            login = r.get("login", "")
            counts[login] = counts.get(login, 0) + 1
    return counts


async def get_repository(owner: str, repo: str) -> dict:
    """Fetch detailed repository information."""
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{GITHUB_API_BASE}/repos/{owner}/{repo}",
            headers=_headers(),
            timeout=30,
        )
        resp.raise_for_status()
        return resp.json()


async def get_languages(owner: str, repo: str) -> dict:
    """Fetch programming languages used in the repository."""
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{GITHUB_API_BASE}/repos/{owner}/{repo}/languages",
            headers=_headers(),
            timeout=30,
        )
        resp.raise_for_status()
        return resp.json()


async def get_readme(owner: str, repo: str) -> str:
    """Fetch repository README content."""
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.get(
                f"{GITHUB_API_BASE}/repos/{owner}/{repo}/readme",
                headers=_headers(),
                timeout=30,
            )
            resp.raise_for_status()
            data = resp.json()
            # Decode base64 content
            import base64
            content = base64.b64decode(data.get("content", "")).decode("utf-8")
            return content
        except Exception:
            return ""
