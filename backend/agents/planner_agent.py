"""Planner Agent — orchestrates workflow based on request type.

The planner contains NO LLM prompts. It only orchestrates
the flow between GitHub service and specialized agents.
"""

from services import github_service
from agents import (
    issue_classification_agent,
    assignee_recommendation_agent,
    pr_intelligence_agent,
    reviewer_recommendation_agent,
    workload_analysis_agent,
)


async def analyze_issues(owner: str, repo: str) -> dict:
    """Orchestrate issue analysis pipeline.

    Flow:
    1. Fetch issues from GitHub
    2. Call Issue Classification Agent for each issue
    3. Fetch contributor data
    4. Call Assignee Recommendation Agent for each issue
    5. Aggregate structured output
    """
    # Step 1: Fetch issues
    issues = await github_service.get_issues(owner, repo, state="open", per_page=10)

    if not issues:
        return {
            "repo": f"{owner}/{repo}",
            "issues_analyzed": 0,
            "classifications": [],
            "assignee_recommendations": [],
        }

    # Step 2: Classify each issue
    classifications = []
    for issue in issues:
        analysis = await issue_classification_agent.classify(
            issue_title=issue.get("title", ""),
            issue_body=issue.get("body", ""),
        )
        classifications.append({
            "issue_number": issue.get("number", 0),
            "issue_title": issue.get("title", ""),
            "analysis": analysis,
        })

    # Step 3: Fetch contributors
    contributors = await github_service.get_contributors(owner, repo)

    # Step 4: Recommend assignees for each issue
    assignee_recs = []
    for issue in issues:
        rec = await assignee_recommendation_agent.recommend(
            issue_data=issue,
            contributors=contributors,
        )
        assignee_recs.append({
            "issue_number": issue.get("number", 0),
            "issue_title": issue.get("title", ""),
            **rec,
        })

    # Step 5: Aggregate
    return {
        "repo": f"{owner}/{repo}",
        "issues_analyzed": len(issues),
        "classifications": classifications,
        "assignee_recommendations": assignee_recs,
    }


async def analyze_prs(owner: str, repo: str) -> dict:
    """Orchestrate PR analysis pipeline.

    Flow:
    1. Fetch PRs from GitHub
    2. For each PR, fetch changed files
    3. Call PR Intelligence Agent
    4. Fetch contributor file history
    5. Call Reviewer Recommendation Agent
    6. Aggregate output
    """
    # Step 1: Fetch PRs
    pulls = await github_service.get_pulls(owner, repo, state="all", per_page=10)

    if not pulls:
        return {
            "repo": f"{owner}/{repo}",
            "prs_analyzed": 0,
            "pr_intelligence": [],
            "reviewer_recommendations": [],
        }

    # Step 2 & 3: Analyze each PR
    pr_analyses = []
    pr_files_map = {}
    for pr in pulls:
        pr_number = pr.get("number", 0)

        # Fetch files changed
        try:
            files = await github_service.get_pr_files(owner, repo, pr_number)
            file_paths = [f.get("filename", "") for f in files]
        except Exception:
            file_paths = []

        pr_files_map[pr_number] = file_paths

        analysis = await pr_intelligence_agent.analyze(
            pr_title=pr.get("title", ""),
            pr_description=pr.get("body", "") or "",
            files_changed_count=pr.get("changed_files", len(file_paths)),
            file_paths=file_paths,
        )
        pr_analyses.append({
            "pr_number": pr_number,
            "pr_title": pr.get("title", ""),
            "analysis": analysis,
        })

    # Step 4: Fetch contributors
    contributors = await github_service.get_contributors(owner, repo)

    # Step 5: Recommend reviewers for each PR
    reviewer_recs = []
    for pr in pulls:
        pr_number = pr.get("number", 0)
        changed_files = pr_files_map.get(pr_number, [])
        pr_author = pr.get("user", {}).get("login", "")

        rec = await reviewer_recommendation_agent.recommend(
            changed_files=changed_files,
            contributors=contributors,
            pr_author=pr_author,
        )
        reviewer_recs.append({
            "pr_number": pr_number,
            "pr_title": pr.get("title", ""),
            **rec,
        })

    # Step 6: Aggregate
    return {
        "repo": f"{owner}/{repo}",
        "prs_analyzed": len(pulls),
        "pr_intelligence": pr_analyses,
        "reviewer_recommendations": reviewer_recs,
    }


async def analyze_workload(owner: str, repo: str) -> dict:
    """Orchestrate workload analysis pipeline.

    Flow:
    1. Fetch open issues (assigned) + open PRs (pending review)
    2. Fetch contributors
    3. Call Workload Analysis Agent
    4. Return structured load scores
    """
    # Step 1: Gather workload data
    issue_counts = await github_service.get_user_issues(owner, repo)
    review_counts = await github_service.get_pending_reviews(owner, repo)

    # Step 2: Fetch contributors
    contributors = await github_service.get_contributors(owner, repo)

    # Step 3: Analyze
    result = await workload_analysis_agent.analyze(
        issue_counts=issue_counts,
        review_counts=review_counts,
        contributors=contributors,
    )

    return {
        "repo": f"{owner}/{repo}",
        "analysis": result,
    }
