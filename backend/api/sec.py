"""
IntelliReal - SEC EDGAR API Endpoint
Pre-seed SEC filings and fetch real 10-K/10-Q documents for any ticker.
"""

import logging
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel

from auth.supabase_auth import get_current_user_id, get_dev_user_id
from config import get_settings
from services.sec_fetcher import SECFetcherService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/sec", tags=["sec"])

sec_service = SECFetcherService()


def _get_user_dependency():
    settings = get_settings()
    if settings.app_env == "development":
        return get_dev_user_id
    return get_current_user_id


class SECFetchRequest(BaseModel):
    ticker: str
    form_type: Optional[str] = "10-K"


@router.post("/fetch")
async def fetch_sec_document(
    request: SECFetchRequest,
    user_id: str = Depends(_get_user_dependency()),
):
    """
    Fetch an SEC filing (10-K, 10-Q, 8-K) by ticker symbol and index into ChromaDB.
    """
    if not request.ticker:
        raise HTTPException(status_code=400, detail="Ticker symbol is required (e.g. AAPL, NVDA)")

    try:
        result = await sec_service.fetch_and_index_filing(
            ticker=request.ticker,
            form_type=request.form_type or "10-K",
            user_id=user_id,
        )
        return result
    except Exception as e:
        logger.error(f"SEC fetch error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch SEC filing: {str(e)}")


@router.post("/preseed")
async def preseed_sec_filings(
    user_id: str = Depends(_get_user_dependency()),
):
    """
    Pre-seed the system with real SEC 10-K filings for Apple (AAPL), NVIDIA (NVDA), and Microsoft (MSFT).
    """
    try:
        results = await sec_service.preseed_sec_filings(user_id=user_id)
        return {
            "message": f"Successfully pre-seeded {len(results)} SEC filings into ChromaDB vector store.",
            "filings": results,
        }
    except Exception as e:
        logger.error(f"Preseed error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to pre-seed SEC filings: {str(e)}")
