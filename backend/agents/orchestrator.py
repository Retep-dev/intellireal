"""
IntelliReal - Agent Orchestrator
Routes queries to the appropriate agent (Research, Summary, Risk, Trend).
"""

import logging
import time
import uuid
from typing import Optional, List

from models.schemas import AgentType, ChatRequest, ChatResponse, Citation
from services.embeddings import EmbeddingService
from agents.research_agent import ResearchAgent
from agents.summary_agent import SummaryAgent
from agents.risk_agent import RiskAgent
from agents.trend_agent import TrendAgent

logger = logging.getLogger(__name__)


class AgentOrchestrator:
    """
    Orchestrates execution across all 4 IntelliReal Financial Agents:
    1. Research Agent — Factual Q&A with precise source citations
    2. Summary Agent — Structured financial summaries & KPI tables
    3. Risk Agent — Risk factor detection & litigation monitoring
    4. Market Trend Agent — YoY growth trajectories & guidance sentiment
    """

    def __init__(self, embedding_service: EmbeddingService):
        self.embedding_service = embedding_service
        self.research_agent = ResearchAgent(embedding_service)
        self.summary_agent = SummaryAgent(embedding_service)
        self.risk_agent = RiskAgent(embedding_service)
        self.trend_agent = TrendAgent(embedding_service)

        logger.info("AgentOrchestrator initialized with 4 active agents: Research, Summary, Risk, Trend")

    async def process(
        self,
        request: ChatRequest,
        user_id: str,
    ) -> ChatResponse:
        """
        Process a chat request by routing to the appropriate agent.
        """
        start_time = time.time()
        conversation_id = request.conversation_id or str(uuid.uuid4())

        logger.info(
            f"Processing request: agent={request.agent_type}, "
            f"user={user_id}, query='{request.message[:50]}...'"
        )

        agent_map = {
            AgentType.RESEARCH: self.research_agent,
            AgentType.SUMMARY: self.summary_agent,
            AgentType.RISK: self.risk_agent,
            AgentType.TREND: self.trend_agent,
        }

        agent = agent_map.get(request.agent_type)

        if not agent:
            # Fallback to research agent if unknown type
            agent = self.research_agent

        try:
            result = await agent.run(
                query=request.message,
                user_id=user_id,
                document_ids=request.document_ids,
            )
        except Exception as e:
            logger.error(f"Agent execution error: {e}")
            return ChatResponse(
                answer=f"An error occurred while processing your request with the {request.agent_type} agent: {str(e)}",
                citations=[],
                agent_type=request.agent_type,
                conversation_id=conversation_id,
                processing_time=time.time() - start_time,
            )

        citations = self._extract_citations(result.get("chunks", []))
        processing_time = time.time() - start_time

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
                "available": True,
            },
            {
                "type": AgentType.TREND,
                "name": "Market Trend Agent",
                "description": "Extracts market trends, segment performance, and growth trajectories.",
                "available": True,
            },
        ]
