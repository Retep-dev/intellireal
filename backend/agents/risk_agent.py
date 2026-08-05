"""
IntelliReal - Risk Analysis Agent
Identifies and evaluates legal risks, credit liabilities, regulatory threats,
and operational vulnerabilities in financial documents.
Includes automatic fallback model handling for NVIDIA NIM API timeouts.
"""

import logging
from typing import Optional, List
from langchain_nvidia_ai_endpoints import ChatNVIDIA
from langchain_core.messages import SystemMessage, HumanMessage

from config import get_settings
from services.embeddings import EmbeddingService

logger = logging.getLogger(__name__)

RISK_SYSTEM_PROMPT = """You are the Risk Analysis Agent of IntelliReal, a Financial Intelligence Platform.

Your role is to identify, classify, and evaluate risk factors, regulatory concerns, debt liabilities, and operational threats in financial documents (10-K, 10-Q, 8-K, earnings reports).

OUTPUT FORMAT — Always structure your risk evaluation as follows:

## Executive Risk Overview
A 2-3 sentence summary of the primary risk posture and critical vulnerabilities.

## Risk Severity Matrix
| Risk Factor | Severity (High/Med/Low) | Description & Potential Impact | Mitigation / Countermeasures |
|-------------|-------------------------|---------------------------------|------------------------------|
| [Name] | High | [Detailed explanation of risk] | [Company response or disclosure] |

## Specific Risk Categories

### 1. Legal & Regulatory Litigation
- Active lawsuits, regulatory investigations, compliance threats

### 2. Credit, Liquidity & Debt Risk
- Debt maturity schedules, credit agreement covenants, interest rate sensitivity

### 3. Operational & Supply Chain Risk
- Concentration risk, vendor dependencies, cybersecurity vulnerabilities

### 4. Macroeconomic & Market Risk
- Foreign exchange exposure, inflation, commodity price volatility

RULES:
1. ALWAYS cite page numbers: [Page X] or [Source: document_name, Page X].
2. Rate risk severity objectively (High = imminent material financial loss; Med = operational headwind; Low = routine disclosure).
3. If no specific risks are found in a category, state "No material risk disclosed in provided context."

CONTEXT DOCUMENTS:
{context}"""


class RiskAgent:
    """
    Risk Analysis Agent.
    Produces structured risk severity matrices and vulnerability assessments.
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
        Execute risk analysis query against user's documents.
        """
        settings = get_settings()

        search_query = query if query else "risk factors litigation regulatory legal debt credit liquidity threats"

        chunks = await self.embedding_service.search(
            query=search_query,
            user_id=user_id,
            top_k=8,
            document_ids=document_ids,
        )

        if not chunks:
            return {
                "answer": "No relevant financial documents found for risk analysis. Please upload documents first.",
                "chunks": [],
                "agent": "risk",
            }

        context = self._format_context(chunks)
        user_msg = query if query else "Extract and analyze all major risk factors, litigation, and vulnerabilities."

        messages = [
            SystemMessage(content=RISK_SYSTEM_PROMPT.format(context=context)),
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
                    "The NVIDIA AI service timed out while analyzing risk factors. "
                    "Please try rephrasing your risk query or resubmitting."
                )

        return {
            "answer": answer,
            "chunks": chunks,
            "agent": "risk",
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
