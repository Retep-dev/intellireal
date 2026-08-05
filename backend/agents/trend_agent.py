"""
IntelliReal - Market Trend Agent
Extracts market trends, segment performance, margin expansion/compression,
and management forward guidance trajectories.
Includes automatic fallback model handling for NVIDIA NIM API timeouts.
"""

import logging
from typing import Optional, List
from langchain_nvidia_ai_endpoints import ChatNVIDIA
from langchain_core.messages import SystemMessage, HumanMessage

from config import get_settings
from services.embeddings import EmbeddingService

logger = logging.getLogger(__name__)

TREND_SYSTEM_PROMPT = """You are the Market Trend Agent of IntelliReal, a Financial Intelligence Platform.

Your role is to analyze financial trends, YoY metrics, business segment growth trajectories, margin behavior, and management guidance sentiment.

OUTPUT FORMAT — Always structure your trend analysis as follows:

## Executive Trend Summary
A 2-3 sentence analysis of historical YoY momentum and management sentiment.

## YoY Financial Metric Trajectory
| Metric | Previous Period | Current Period | Trajectory (↑/↓/→) | Growth % | Driver / Cause |
|--------|-----------------|----------------|--------------------|----------|----------------|
| Revenue | $X.XB | $X.XB | ↑ | +X.X% | [Primary revenue driver] |
| Operating Margin | X.X% | X.X% | ↓ | -X.X% | [Cost or margin driver] |

## Segment Performance & Growth Drivers
- **Segment 1**: Revenue, growth rate, and strategic developments
- **Segment 2**: Performance highlights and competitive dynamics

## Forward Guidance & Outlook Sentiment
- Management revenue guidance, capex plans, and outlook tone (Bullish / Neutral / Cautious)

## Market & Macro Positioning
- Industry tailwinds, competitive threats, market share dynamics

RULES:
1. ALWAYS cite page numbers: [Page X] or [Source: document_name, Page X].
2. Use precise trajectory indicators: ↑ (Growth > 3%), ↓ (Decline > -3%), → (Flat/Stable).
3. If figures are not present, state "Not disclosed in provided context."

CONTEXT DOCUMENTS:
{context}"""


class TrendAgent:
    """
    Market Trend Agent.
    Produces structured YoY trend comparisons and guidance sentiment analysis.
    """

    def __init__(self, embedding_service: EmbeddingService):
        settings = get_settings()
        self.embedding_service = embedding_service

        self.llm = ChatNVIDIA(
            model=settings.nvidia_model,
            api_key=settings.nvidia_api_key,
            temperature=0.1,
            max_tokens=settings.llm_max_tokens,
        )

    async def run(
        self,
        query: str,
        user_id: str,
        document_ids: Optional[List[str]] = None,
    ) -> dict:
        """
        Execute market trend analysis query against user's documents.
        """
        settings = get_settings()

        search_query = query if query else "market trends YoY growth revenue guidance outlook margin segment performance"

        chunks = await self.embedding_service.search(
            query=search_query,
            user_id=user_id,
            top_k=8,
            document_ids=document_ids,
        )

        if not chunks:
            return {
                "answer": "No relevant financial documents found for trend analysis. Please upload documents first.",
                "chunks": [],
                "agent": "trend",
            }

        context = self._format_context(chunks)
        user_msg = query if query else "Analyze financial trends, segment performance, and forward guidance trajectory."

        messages = [
            SystemMessage(content=TREND_SYSTEM_PROMPT.format(context=context)),
            HumanMessage(content=user_msg),
        ]

        try:
            response = self.llm.invoke(messages)
            answer = response.content
        except Exception as e:
            logger.warning(f"Primary model ({settings.nvidia_model}) error/timeout: {e}. Retrying with fast model...")
            try:
                fallback_llm = ChatNVIDIA(
                    model="meta/llama-3.1-8b-instruct",
                    api_key=settings.nvidia_api_key,
                    temperature=0.1,
                    max_tokens=2048,
                )
                response = fallback_llm.invoke(messages)
                answer = response.content
            except Exception as fallback_err:
                logger.error(f"Fallback LLM also failed: {fallback_err}")
                answer = (
                    "The NVIDIA AI service timed out while analyzing market trends. "
                    "Please try resubmitting your request."
                )

        return {
            "answer": answer,
            "chunks": chunks,
            "agent": "trend",
        }

    def _format_context(self, chunks: List[dict]) -> str:
        parts = []
        for i, chunk in enumerate(chunks):
            meta = chunk.get("metadata", {})
            text = chunk.get("text", "")[:1200]
            parts.append(
                f"[Document {i+1}: {meta.get('filename', 'Unknown')} | "
                f"Page {meta.get('page_number', '?')}]\n"
                f"{text}"
            )
        return "\n\n---\n\n".join(parts)
