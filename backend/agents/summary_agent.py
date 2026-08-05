"""
IntelliReal - Financial Summary Agent
Generates structured financial summaries of uploaded documents.
"""

import logging
from typing import Optional, List
from langchain_nvidia_ai_endpoints import ChatNVIDIA
from langchain_core.messages import SystemMessage, HumanMessage

from config import get_settings
from services.embeddings import EmbeddingService

logger = logging.getLogger(__name__)

SUMMARY_SYSTEM_PROMPT = """You are the Financial Summary Agent of IntelliReal.

Your role is to generate comprehensive, structured summaries of financial documents.

OUTPUT FORMAT — Always structure your summary as follows:

## Executive Summary
A 2-3 sentence overview of the document's key message.

## Key Financial Metrics
| Metric | Value | Change (YoY) |
|--------|-------|---------------|
| Revenue | $X.XB | +X% |
| Net Income | $X.XB | +X% |
| EPS | $X.XX | +X% |
(Include all available metrics)

## Business Highlights
- Key achievements, product launches, market developments

## Risk Factors
- Top 3-5 risk factors mentioned in the document

## Forward Guidance
- Any forward-looking statements or projections

## Notable Items
- Unusual charges, one-time events, regulatory issues

RULES:
1. ALWAYS cite page numbers: [Page X]
2. Use exact figures from the document — never approximate.
3. If a section has no relevant info, write "Not disclosed in this document."
4. Highlight significant changes (>10% YoY) with ↑ or ↓ indicators.

CONTEXT DOCUMENTS:
{context}"""


class SummaryAgent:
    """
    Financial Summary Agent.
    Produces structured summaries with KPIs, risks, and guidance extraction.
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
        Generate a financial summary for the specified documents.
        
        If no specific query, generates a comprehensive summary.
        If query specifies focus areas, tailors the summary accordingly.
        """
        # For summaries, we want broader context — retrieve more chunks
        chunks = await self.embedding_service.search(
            query=query or "financial summary key metrics revenue profit loss risk",
            user_id=user_id,
            top_k=12,  # Summary agent needs more context
            document_ids=document_ids,
        )

        if not chunks:
            return {
                "answer": "No documents available to summarize. Please upload financial documents first.",
                "chunks": [],
                "agent": "summary",
            }

        context = self._format_context(chunks)

        # Determine user intent
        user_msg = query if query else "Generate a comprehensive financial summary of the uploaded documents."

        messages = [
            SystemMessage(content=SUMMARY_SYSTEM_PROMPT.format(context=context)),
            HumanMessage(content=user_msg),
        ]

        try:
            response = self.llm.invoke(messages)
            answer = response.content
        except Exception as e:
            logger.error(f"Summary Agent error: {e}")
            answer = f"Summary Agent encountered an error: {str(e)}"

        return {
            "answer": answer,
            "chunks": chunks,
            "agent": "summary",
        }

    def _format_context(self, chunks: List[dict]) -> str:
        parts = []
        for i, chunk in enumerate(chunks):
            meta = chunk.get("metadata", {})
            parts.append(
                f"[Document {i+1}: {meta.get('filename', 'Unknown')} | "
                f"Page {meta.get('page_number', '?')}]\n"
                f"{chunk['text']}"
            )
        return "\n\n---\n\n".join(parts)
