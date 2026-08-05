"""
IntelliReal - Chat API
RAG-powered financial Q&A with multi-agent support.
"""

import logging
from fastapi import APIRouter, Depends
from config import get_settings
from auth.supabase_auth import get_current_user_id, get_dev_user_id
from models.schemas import ChatRequest, ChatResponse, AgentType
from services.embeddings import EmbeddingService
from agents.orchestrator import AgentOrchestrator

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/chat", tags=["chat"])

# Initialize services
embedding_service = EmbeddingService()
orchestrator = AgentOrchestrator(embedding_service)


def _get_user_dependency():
    settings = get_settings()
    if settings.app_env == "development":
        return get_dev_user_id
    return get_current_user_id


@router.post("/", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    user_id: str = Depends(_get_user_dependency()),
):
    """
    Send a message to IntelliReal's AI agents.
    
    Agents:
    - research: Factual Q&A with citations
    - summary: Structured financial summaries
    - risk: Risk analysis (Phase 2)
    - trend: Market trend analysis (Phase 2)
    """
    logger.info(
        f"Chat request: agent={request.agent_type}, "
        f"user={user_id}, message='{request.message[:80]}...'"
    )

    response = await orchestrator.process(request, user_id)
    return response


@router.get("/agents")
async def list_agents():
    """List available AI agents and their capabilities."""
    return orchestrator.get_available_agents()
