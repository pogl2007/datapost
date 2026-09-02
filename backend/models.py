"""Pydantic schemas mirroring the /analyze and /clean response shapes."""
from __future__ import annotations

from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class Issue(BaseModel):
    type: str = Field(
        description=(
            "target_leakage|missing|outlier|imbalance|duplicate|dtype|constant|suspicious"
        )
    )
    severity: str = Field(description="critical|warning|info")
    column: Optional[str] = None
    title: str
    description: str
    fix_code: str
    fix_description: str


class AnalyzeResponse(BaseModel):
    quality_score: int
    issues: List[Issue] = Field(default_factory=list)
    stats: Dict[str, Any] = Field(default_factory=dict)
    sample_data: List[Dict[str, Any]] = Field(default_factory=list)
    summary: str
    ready_for_training: bool
    critical_count: int
    row_count: int
    col_count: int


class CleanRequest(BaseModel):
    file_content_base64: str
    file_name: str
    issues: Optional[List[Dict[str, Any]]] = Field(default_factory=list)
    dataset_id: Optional[str] = None


class CleanResponse(BaseModel):
    cleaned_file_base64: str
    changes_made: List[str] = Field(default_factory=list)


class ErrorResponse(BaseModel):
    detail: str


class ChatMessage(BaseModel):
    role: str = Field(description="user|assistant")
    content: str


class ChatRequest(BaseModel):
    summary: str = ""
    quality_score: Optional[int] = None
    row_count: Optional[int] = None
    col_count: Optional[int] = None
    issues: List[Dict[str, Any]] = Field(default_factory=list)
    stats: Dict[str, Any] = Field(default_factory=dict)
    history: List[ChatMessage] = Field(default_factory=list)
    question: str


class ChatResponse(BaseModel):
    answer: str
