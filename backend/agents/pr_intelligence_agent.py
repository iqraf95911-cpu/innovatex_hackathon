"""PR Intelligence Agent — analyzes PRs for risk, summary, and review checklists."""

from services import llm_service
from utils.scoring_utils import calculate_pr_risk


async def analyze(pr_title: str, pr_description: str, files_changed_count: int,
                  file_paths: list[str] | None = None) -> dict:
    """Analyze a PR for risk, generate summary and review checklist.

    Returns:
        {
            "summary": "...",
            "risk_level": "Low" | "Medium" | "High",
            "review_checklist": ["...", "..."]
        }
    """
    paths = file_paths or []
    risk_level = calculate_pr_risk(files_changed_count, paths)

    # Try LLM for intelligent summary + checklist
    if llm_service.is_available():
        files_text = ", ".join(paths[:15]) if paths else "not available"
        prompt = f"""You are a senior code reviewer. Analyze this pull request and provide a structured review.

PR Title: {pr_title}
PR Description: {pr_description or 'No description'}
Files Changed: {files_changed_count}
File Paths: {files_text}
Computed Risk Level: {risk_level}

Respond with ONLY a JSON object:
{{
    "summary": "<2-3 sentence summary of what this PR does>",
    "risk_level": "{risk_level}",
    "review_checklist": [
        "<specific review item 1>",
        "<specific review item 2>",
        "<specific review item 3>"
    ]
}}

The review_checklist should contain 3-5 specific, actionable items based on the files changed."""

        result = await llm_service.generate(prompt, expect_json=True)
        if result and isinstance(result, dict):
            result["risk_level"] = risk_level  # Keep rule-based risk
            return result

    # Fallback — generate checklist based on file patterns
    checklist = _generate_checklist(paths, files_changed_count)

    return {
        "summary": f"PR '{pr_title}' modifies {files_changed_count} file(s). {pr_description[:150] if pr_description else 'No description provided.'}",
        "risk_level": risk_level,
        "review_checklist": checklist,
    }


def _generate_checklist(file_paths: list[str], files_changed: int) -> list[str]:
    """Generate a basic review checklist from file patterns."""
    checklist = []

    if files_changed > 10:
        checklist.append("Large PR — consider splitting into smaller focused changes")

    path_text = " ".join(file_paths).lower()

    if any(ext in path_text for ext in [".test.", "_test.", "spec."]):
        checklist.append("Verify test coverage is adequate for the changes")
    else:
        checklist.append("Add unit tests for new/modified logic")

    if any(p in path_text for p in ["config", ".env", "settings"]):
        checklist.append("Review configuration changes for security implications")

    if any(p in path_text for p in ["migration", "schema", "model"]):
        checklist.append("Check database migration is backward-compatible")

    if any(p in path_text for p in ["api", "route", "endpoint"]):
        checklist.append("Verify API contract — check request/response schemas")

    if any(p in path_text for p in ["auth", "security", "token", "password"]):
        checklist.append("Security-sensitive code — review for vulnerabilities")

    if not checklist:
        checklist = [
            "Review code quality and adherence to team conventions",
            "Check for proper error handling",
            "Verify no debug code or console logs remain",
        ]

    return checklist[:5]
