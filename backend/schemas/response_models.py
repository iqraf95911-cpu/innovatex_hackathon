"""Pydantic response models matching the agent output specs."""

from pydantic import BaseModel
from typing import Optional


# --- Issue Classification ---

class IssueClassification(BaseModel):
    classification: str
    priority: str
    suggested_labels: list[str]
    reasoning: str
    confidence_score: float


class ClassifiedIssue(BaseModel):
    issue_number: int
    issue_title: str
    analysis: IssueClassification


# --- Assignee Recommendation ---

class AssigneeCandidate(BaseModel):
    developer_name: str
    score: float
    reasoning: str


class AssigneeRecommendation(BaseModel):
    issue_number: int
    issue_title: str
    recommended_assignees: list[AssigneeCandidate]


# --- PR Intelligence ---

class PRIntelligence(BaseModel):
    summary: str
    risk_level: str
    review_checklist: list[str]


class AnalyzedPR(BaseModel):
    pr_number: int
    pr_title: str
    analysis: PRIntelligence


# --- Reviewer Recommendation ---

class ReviewerCandidate(BaseModel):
    developer_name: str
    confidence_score: float
    reasoning: str


class ReviewerRecommendation(BaseModel):
    pr_number: int
    pr_title: str
    suggested_reviewers: list[ReviewerCandidate]


# --- Workload Analysis ---

class DeveloperWorkload(BaseModel):
    developer_name: str
    open_issues: int
    pending_reviews: int
    load_score: int


class WorkloadAnalysis(BaseModel):
    developer_workload: list[DeveloperWorkload]
    ai_recommendation: str


# --- Aggregated Responses ---

class IssueAnalysisResponse(BaseModel):
    repo: str
    issues_analyzed: int
    classifications: list[ClassifiedIssue]
    assignee_recommendations: list[AssigneeRecommendation]


class PRAnalysisResponse(BaseModel):
    repo: str
    prs_analyzed: int
    pr_intelligence: list[AnalyzedPR]
    reviewer_recommendations: list[ReviewerRecommendation]


class WorkloadResponse(BaseModel):
    repo: str
    analysis: WorkloadAnalysis
