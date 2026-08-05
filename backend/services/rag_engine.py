"""
IntelliReal - RAG Engine
Retrieval-Augmented Generation: retrieves relevant chunks, builds context,
and generates cited answers using NVIDIA NIM LLM.
"""

import logging
import time
from typing import List, Optional
from langchain_nvidia_ai_endpoints import ChatNVIDIA
from langchain_core.messages import SystemMessage, HumanMessage

from config import get_settings
from services.embeddings import EmbeddingService
from models.schemas import Citation

logger = logging.getLogger(__name__)


# System prompt for citation-based financial Q&A
RAG_SYSTEM_PROMPT = """You are IntelliReal, an expert financial analyst AI assistant.

RULES:
1. Answer questions ONLY based on the provided context documents.
2. Every claim you make MUST be supported by a citation in the format [Source: document_name, Page X].
3. If the context doesn't contain enough information, say so explicitly — do NOT hallucinate.
4. Use precise financial terminology.
5. When discussing numbers, always include the unit (millions, billions, %, etc.).
6. Structure your response clearly with headers and bullet points when appropriate.
7. If comparing multiple documents, organize the comparison in a table or structured format.

CONTEXT DOCUMENTS:
{context}

Remember: CITE your sources for every factual claim using [Source: document_name, Page X]."""


class RAGEngine:
    """
    Core RAG pipeline: retrieve → build context → generate with citations.
    """

    def __init__(self, embedding_service: EmbeddingService):
        settings = get_settings()
        self.embedding_service = embedding_service

        # Initialize NVIDIA NIM LLM
        self.llm = ChatNVIDIA(
            model=settings.nvidia_model,
            api_key=settings.nvidia_api_key,
            temperature=settings.llm_temperature,
            max_tokens=settings.llm_max_tokens,
        )

        self.top_k = settings.top_k_results
        logger.info(f"RAGEngine initialized: model={settings.nvidia_model}")

    async def query(
        self,
        question: str,
        user_id: str,
        document_ids: Optional[List[str]] = None,
        top_k: int = None,
    ) -> dict:
        """
        Full RAG pipeline: retrieve context → generate cited answer.
        
        Args:
            question: User's question
            user_id: User ID for multi-tenant retrieval
            document_ids: Optional filter to specific documents
            top_k: Number of chunks to retrieve
            
        Returns:
            dict with answer, citations, and metadata
        """
        start_time = time.time()
        top_k = top_k or self.top_k

        # Step 1: Retrieve relevant chunks
        chunks = await self.embedding_service.search(
            query=question,
            user_id=user_id,
            top_k=top_k,
            document_ids=document_ids,
        )

        if not chunks:
            return {
                "answer": "I couldn't find any relevant information in your uploaded documents. "
                          "Please make sure you've uploaded documents and try rephrasing your question.",
                "citations": [],
                "processing_time": time.time() - start_time,
                "chunks_retrieved": 0,
            }

        # Step 2: Build context from retrieved chunks
        context = self._build_context(chunks)

        # Step 3: Generate answer with citations
        answer = await self._generate_answer(question, context)

        # Step 4: Extract citations from retrieved chunks
        citations = self._build_citations(chunks)

        processing_time = time.time() - start_time
        logger.info(
            f"RAG query completed: {len(chunks)} chunks, "
            f"{processing_time:.2f}s"
        )

        return {
            "answer": answer,
            "citations": citations,
            "processing_time": processing_time,
            "chunks_retrieved": len(chunks),
        }

    def _build_context(self, chunks: List[dict]) -> str:
        """Format retrieved chunks into context for the LLM."""
        context_parts = []

        for i, chunk in enumerate(chunks):
            metadata = chunk.get("metadata", {})
            filename = metadata.get("filename", "Unknown")
            page = metadata.get("page_number", "?")
            score = chunk.get("similarity_score", 0)

            context_parts.append(
                f"--- Document: {filename} | Page: {page} | "
                f"Relevance: {score:.2%} ---\n"
                f"{chunk['text']}\n"
            )

        return "\n\n".join(context_parts)

    async def _generate_answer(self, question: str, context: str) -> str:
        """Generate a cited answer using NVIDIA NIM LLM."""
        system_prompt = RAG_SYSTEM_PROMPT.format(context=context)

        messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(content=question),
        ]

        try:
            response = self.llm.invoke(messages)
            return response.content
        except Exception as e:
            logger.error(f"LLM generation error: {e}")
            return (
                f"I encountered an error generating the response: {str(e)}. "
                "Please try again or rephrase your question."
            )

    def _build_citations(self, chunks: List[dict]) -> List[Citation]:
        """Build citation objects from retrieved chunks."""
        citations = []

        for chunk in chunks:
            metadata = chunk.get("metadata", {})

            citation = Citation(
                document_name=metadata.get("filename", "Unknown"),
                page_number=metadata.get("page_number"),
                chunk_index=metadata.get("chunk_index", 0),
                text_excerpt=chunk["text"][:300] + "..." if len(chunk["text"]) > 300 else chunk["text"],
                relevance_score=chunk.get("similarity_score", 0.0),
            )
            citations.append(citation)

        return citations
