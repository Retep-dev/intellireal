"""
IntelliReal - Research Agent
Answers factual questions about financial documents using RAG with precise citations.
Includes automatic fallback model handling for NVIDIA NIM API timeouts.
"""

import logging
from typing import Optional, List
from langchain_nvidia_ai_endpoints import ChatNVIDIA
from langchain_core.messages import SystemMessage, HumanMessage

from config import get_settings
from services.embeddings import EmbeddingService

logger = logging.getLogger(__name__)

RESEARCH_SYSTEM_PROMPT = """You are the Research Agent of IntelliReal, a Financial Intelligence Platform.

Your role is to answer factual questions about financial documents with precision and thoroughness.

CAPABILITIES:
- Answer specific questions about SEC filings (10-K, 10-Q, 8-K)
- Extract key data points (revenue, expenses, margins, guidance)
- Compare data across different documents or time periods
- Identify specific sections, risk factors, and disclosures

RULES:
1. ALWAYS cite your sources using [Source: document_name, Page X].
2. Use exact numbers from the documents — NEVER estimate or round unless the source does.
3. If information is not in the provided context, say "This information is not available in the uploaded documents."
4. When asked to compare, create a structured comparison (table or bullet list).
5. Distinguish between facts stated in the documents vs. your analytical interpretation.
6. For financial metrics, always include the time period (Q1 2024, FY 2023, etc.).

CONTEXT DOCUMENTS:
{context}"""


class ResearchAgent:
    """
    Research Agent for factual financial Q&A.
    Specializes in precise data extraction and citation-based answers.
    """

    def __init__(self, embedding_service: EmbeddingService):
        settings = get_settings()
        self.embedding_service = embedding_service

        self.llm = ChatNVIDIA(
            model=settings.nvidia_model,
            api_key=settings.nvidia_api_key,
            temperature=0.05,
            max_tokens=settings.llm_max_tokens,
        )

    async def run(
        self,
        query: str,
        user_id: str,
        document_ids: Optional[List[str]] = None,
    ) -> dict:
        """
        Execute research query against user's documents.
        """
        settings = get_settings()

        # Retrieve relevant chunks
        chunks = await self.embedding_service.search(
            query=query,
            user_id=user_id,
            top_k=6,
            document_ids=document_ids,
        )

        if not chunks:
            return {
                "answer": "No relevant documents found. Please upload financial documents first.",
                "chunks": [],
                "agent": "research",
            }

        # Build context
        context = self._format_context(chunks)

        messages = [
            SystemMessage(content=RESEARCH_SYSTEM_PROMPT.format(context=context)),
            HumanMessage(content=query),
        ]

        try:
            response = self.llm.invoke(messages)
            answer = response.content
        except Exception as e:
            logger.warning(f"Primary model ({settings.nvidia_model}) error/timeout: {e}. Retrying with fast model...")
            try:
                # Fallback to faster 8b model if 70b endpoint times out
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
                    "The NVIDIA AI service timed out while generating a response. "
                    "Please try rephrasing your question or switching to the **Summary Agent** tab."
                )

        return {
            "answer": answer,
            "chunks": chunks,
            "agent": "research",
        }

    def _format_context(self, chunks: List[dict]) -> str:
        """Format chunks into labeled context blocks, trimmed for fast inference."""
        parts = []
        for i, chunk in enumerate(chunks):
            meta = chunk.get("metadata", {})
            text = chunk.get("text", "")[:1200]  # Trim chunk length for fast execution
            parts.append(
                f"[Document {i+1}: {meta.get('filename', 'Unknown')} | "
                f"Page {meta.get('page_number', '?')}]\n"
                f"{text}"
            )
        return "\n\n---\n\n".join(parts)
