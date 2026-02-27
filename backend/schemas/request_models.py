"""Pydantic request models for API endpoints."""

from pydantic import BaseModel


class AnalyzeIssuesRequest(BaseModel):
    owner: str
    repo: str


class AnalyzePRsRequest(BaseModel):
    owner: str
    repo: str


class AnalyzeWorkloadRequest(BaseModel):
    owner: str
    repo: str



class AnalyzeRepositoryRequest(BaseModel):
    owner: str
    repo: str
