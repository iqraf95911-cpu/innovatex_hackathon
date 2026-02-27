"""Scoring utilities for rule-based agent logic."""

from utils.constants import (
    BUG_KEYWORDS, FEATURE_KEYWORDS, REFACTOR_KEYWORDS, QUESTION_KEYWORDS,
    CORE_MODULE_PATHS, LOAD_WEIGHT_ISSUES, LOAD_WEIGHT_REVIEWS,
)


def classify_issue_rule_based(title: str, body: str) -> dict:
    """Rule-based issue classification using keyword matching."""
    text = f"{title} {body}".lower()

    scores = {
        "Bug": sum(1 for kw in BUG_KEYWORDS if kw in text),
        "Feature": sum(1 for kw in FEATURE_KEYWORDS if kw in text),
        "Refactor": sum(1 for kw in REFACTOR_KEYWORDS if kw in text),
        "Question": sum(1 for kw in QUESTION_KEYWORDS if kw in text),
    }

    classification = max(scores, key=scores.get) if max(scores.values()) > 0 else "Feature"
    total = sum(scores.values()) or 1
    confidence = round(min(scores[classification] / total, 1.0), 2)

    # Priority heuristic
    priority = "Medium"
    urgent_words = ["critical", "urgent", "blocker", "asap", "production", "hotfix", "security"]
    low_words = ["minor", "typo", "cosmetic", "nice to have", "low"]
    if any(w in text for w in urgent_words):
        priority = "High"
    elif any(w in text for w in low_words):
        priority = "Low"

    # Suggested labels
    labels = [classification.lower()]
    if priority == "High":
        labels.append("priority:high")
    if "security" in text:
        labels.append("security")
    if "ui" in text or "frontend" in text:
        labels.append("frontend")
    if "api" in text or "backend" in text:
        labels.append("backend")

    return {
        "classification": classification,
        "priority": priority,
        "suggested_labels": labels,
        "reasoning": f"Keyword analysis: highest match for '{classification}' ({scores[classification]} hits)",
        "confidence_score": confidence,
    }


def score_assignee(contributor: dict, issue_labels: list[str], file_paths: list[str]) -> float:
    """Score a contributor for issue assignment based on activity and file match."""
    score = 0.0

    # Commit volume (normalized)
    commits = contributor.get("total_commits", 0)
    score += min(commits / 50, 1.0) * 40  # max 40 pts for commit volume

    # Recency — recent weeks activity
    weeks = contributor.get("weeks", [])
    if weeks:
        recent = weeks[-1] if len(weeks) > 0 else {}
        recent_commits = recent.get("commits", 0)
        score += min(recent_commits / 10, 1.0) * 30  # max 30 pts for recency

    # File path match (if contributor files known)
    contributor_files = contributor.get("files", [])
    if contributor_files and file_paths:
        matches = sum(1 for f in file_paths if any(cf in f for cf in contributor_files))
        score += min(matches / len(file_paths), 1.0) * 30  # max 30 pts for file match

    return round(score, 1)


def calculate_pr_risk(files_changed: int, file_paths: list[str]) -> str:
    """Determine PR risk level based on file count and paths."""
    risk_score = 0

    # File count risk
    if files_changed > 20:
        risk_score += 3
    elif files_changed > 10:
        risk_score += 2
    elif files_changed > 5:
        risk_score += 1

    # Core module risk
    core_hits = sum(
        1 for fp in file_paths
        for cp in CORE_MODULE_PATHS
        if cp.lower() in fp.lower()
    )
    risk_score += min(core_hits, 3)

    if risk_score >= 4:
        return "High"
    elif risk_score >= 2:
        return "Medium"
    return "Low"


def score_reviewer(contributor: dict, changed_files: list[str]) -> float:
    """Score a contributor as potential reviewer based on file ownership."""
    score = 0.0

    # File ownership match
    contributor_files = contributor.get("files", [])
    if contributor_files and changed_files:
        matches = sum(
            1 for cf in changed_files
            if any(owned in cf for owned in contributor_files)
        )
        ownership = matches / max(len(changed_files), 1)
        score += ownership * 50  # max 50 pts

    # Total commits (expertise proxy)
    commits = contributor.get("total_commits", 0)
    score += min(commits / 100, 1.0) * 30  # max 30 pts

    # Recent activity
    weeks = contributor.get("weeks", [])
    if weeks:
        recent = weeks[-1] if weeks else {}
        score += min(recent.get("commits", 0) / 5, 1.0) * 20  # max 20 pts

    return round(score, 1)


def calculate_load_score(open_issues: int, pending_reviews: int) -> int:
    """Calculate developer workload score."""
    return (open_issues * LOAD_WEIGHT_ISSUES) + (pending_reviews * LOAD_WEIGHT_REVIEWS)
