"""Issue Classification Agent — classifies issues by type, priority, and labels."""

from services import llm_service
from utils.scoring_utils import classify_issue_rule_based


async def classify(issue_title: str, issue_body: str) -> dict:
    """Classify an issue using LLM (with rule-based fallback).

    Returns:
        {
            "classification": "Bug" | "Feature" | "Refactor" | "Question",
            "priority": "Low" | "Medium" | "High",
            "suggested_labels": [...],
            "reasoning": "...",
            "confidence_score": 0.0-1.0
        }
    """
    # Try LLM first
    if llm_service.is_available():
        prompt = f"""You are a GitHub issue classifier for an engineering team.

Analyze this issue and respond with ONLY a JSON object (no markdown, no explanation):

Issue Title: {issue_title}
Issue Body: {issue_body or "No description provided"}

Required JSON format:
{{
    "classification": "<Bug|Feature|Refactor|Question>",
    "priority": "<Low|Medium|High>",
    "suggested_labels": ["label1", "label2"],
    "reasoning": "<brief explanation>",
    "confidence_score": <0.0 to 1.0>
}}

Rules:
- classification MUST be exactly one of: Bug, Feature, Refactor, Question
- priority MUST be exactly one of: Low, Medium, High
- suggested_labels should include relevant tags like "frontend", "backend", "security", "priority:high"
- confidence_score is your confidence from 0.0 to 1.0"""

        result = await llm_service.generate(prompt, expect_json=True)
        if result and isinstance(result, dict):
            # Validate required fields
            valid_classifications = {"Bug", "Feature", "Refactor", "Question"}
            valid_priorities = {"Low", "Medium", "High"}
            if (result.get("classification") in valid_classifications and
                    result.get("priority") in valid_priorities):
                return result

    # Fallback to rule-based
    return classify_issue_rule_based(issue_title, issue_body or "")
