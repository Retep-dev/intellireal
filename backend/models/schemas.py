"""
IntelliReal - Pydantic Schemas
Request/response models for API endpoints.
"""

from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


# ============================================
# Enums
# ============================================

class DocumentType(str, Enum):
    SEC_FILING = "sec_filing"
    EARNINGS_REPORT = "earnings_report"
    ANNUAL_REPORT = "annual_report"
    OTHER = "other"


class AgentType(str, Enum):
    RESEARCH = "research"
    SUMMARY = "summary"
    RISK = "risk"
    TREND = "trend"


# ============================================
# Document Schemas
# ============================================

class DocumentUploadResponse(BaseModel):
    id: str
    filename: str
    document_type: DocumentType
    file_size: int
    num_chunks: int
    status: str = "processed"
    created_at: datetime


class DocumentMetadata(BaseModel):
    id: str
    filename: str
    document_type: DocumentType
    file_size: int
    num_chunks: int
    company: Optional[str] = None
    ticker: Optional[str] = None
    filing_type: Optional[str] = None
    period: Optional[str] = None
    status: str = "processed"
    created_at: datetime


class DocumentListResponse(BaseModel):
    documents: List[DocumentMetadata]
    total: int


# ============================================
# Chat / RAG Schemas
# ============================================

class Citation(BaseModel):
    document_name: str
    page_number: Optional[int] = None
    chunk_index: int
    text_excerpt: str
    relevance_score: float = Field(ge=0.0, le=1.0)


class ChatRequest(BaseModel):
    message: str
    agent_type: AgentType = AgentType.RESEARCH
    document_ids: Optional[List[str]] = None
    conversation_id: Optional[str] = None


class ChatResponse(BaseModel):
    answer: str
    citations: List[Citation] = []
    agent_type: AgentType
    thinking: Optional[str] = None
    conversation_id: str
    processing_time: float


# ============================================
# Agent Schemas
# ============================================

class AgentState(BaseModel):
    """State passed between agents in LangGraph."""
    query: str
    context_chunks: List[dict] = []
    agent_outputs: dict = {}
    citations: List[Citation] = []
    final_answer: Optional[str] = None
    current_agent: Optional[AgentType] = None
    user_id: str = ""
    document_ids: List[str] = []


# ============================================
# Health / Status
# ============================================

class HealthResponse(BaseModel):
    status: str = "healthy"
    version: str = "0.1.0"
    services: dict = {}
