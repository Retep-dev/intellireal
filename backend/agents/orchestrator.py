"""
IntelliReal - Agent Orchestrator
Routes queries to the appropriate agent using LangGraph state management.
"""

import logging
import time
import uuid
from typing import Optional, List

from models.schemas import AgentType, ChatRequest, ChatResponse, Citation
from services.embeddings import EmbeddingService
from agents.research_agent import ResearchAgent
from agents.summary_agent import SummaryAgent

logger = logging.getLogger(__name__)


class AgentOrchestrator:
    """
    Orchestrates agent execution based on query intent.
    
    Phase 1: Simple routing based on explicit agent_type selection.
    Phase 2+: Will use LangGraph for multi-agent collaboration.
    """

    def __init__(self, embedding_service: EmbeddingService):
        self.embedding_service = embedding_service
        self.research_agent = ResearchAgent(embedding_service)
        self.summary_agent = SummaryAgent(embedding_service)

        logger.info("AgentOrchestrator initialized with Research + Summary agents")

    async def process(
        self,
        request: ChatRequest,
        user_id: str,
    ) -> ChatResponse:
        """
        Process a chat request by routing to the appropriate agent.
        
        Args:
            request: ChatRequest with message, agent_type, and optional filters
            user_id: Authenticated user ID
            
        Returns:
            ChatResponse with answer, citations, and metadata
        """
        start_time = time.time()
        conversation_id = request.conversation_id or str(uuid.uuid4())

        logger.info(
            f"Processing request: agent={request.agent_type}, "
            f"user={user_id}, query='{request.message[:50]}...'"
        )

        # Route to the appropriate agent
        agent_map = {
            AgentType.RESEARCH: self.research_agent,
            AgentType.SUMMARY: self.summary_agent,
            # Phase 2 agents will be added here:
            # AgentType.RISK: self.risk_agent,
            # AgentType.TREND: self.trend_agent,
        }

        agent = agent_map.get(request.agent_type)

        if not agent:
            return ChatResponse(
                answer=f"Agent '{request.agent_type}' is not yet available. "
                       f"Available agents: {', '.join(a.value for a in agent_map.keys())}",
                citations=[],
                agent_type=request.agent_type,
                conversation_id=conversation_id,
                processing_time=time.time() - start_time,
            )

        # Execute agent
        try:
            result = await agent.run(
                query=request.message,
                user_id=user_id,
                document_ids=request.document_ids,
            )
        except Exception as e:
            logger.error(f"Agent execution error: {e}")
            return ChatResponse(
                answer=f"An error occurred while processing your request: {str(e)}",
                citations=[],
                agent_type=request.agent_type,
                conversation_id=conversation_id,
                processing_time=time.time() - start_time,
            )

        # Build citations from retrieved chunks
        citations = self._extract_citations(result.get("chunks", []))

        processing_time = time.time() - start_time
        logger.info(
            f"Request completed: {processing_time:.2f}s, "
            f"{len(citations)} citations"
        )

        return ChatResponse(
            answer=result.get("answer", ""),
            citations=citations,
            agent_type=request.agent_type,
            conversation_id=conversation_id,
            processing_time=processing_time,
        )

    def _extract_citations(self, chunks: List[dict]) -> List[Citation]:
        """Extract citation objects from retrieved chunks."""
        citations = []
        for chunk in chunks:
            meta = chunk.get("metadata", {})
            text = chunk.get("text", "")

            citations.append(
                Citation(
                    document_name=meta.get("filename", "Unknown"),
                    page_number=meta.get("page_number"),
                    chunk_index=meta.get("chunk_index", 0),
                    text_excerpt=(text[:300] + "...") if len(text) > 300 else text,
                    relevance_score=chunk.get("similarity_score", 0.0),
                )
            )

        return citations

    def get_available_agents(self) -> List[dict]:
        """Return list of available agents and their descriptions."""
        return [
            {
                "type": AgentType.RESEARCH,
                "name": "Research Agent",
                "description": "Answers factual questions with precise citations from your financial documents.",
                "available": True,
            },
            {
                "type": AgentType.SUMMARY,
                "name": "Financial Summary Agent",
                "description": "Generates structured summaries with KPIs, risk factors, and forward guidance.",
                "available": True,
            },
            {
                "type": AgentType.RISK,
                "name": "Risk Analysis Agent",
                "description": "Identifies and analyzes risk factors, regulatory concerns, and litigation.",
                "available": False,  # Phase 2
            },
            {
                "type": AgentType.TREND,
                "name": "Market Trend Agent",
                "description": "Extracts market trends, sentiment analysis, and competitive positioning.",
                "available": False,  # Phase 2
            },
        ]
