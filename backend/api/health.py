"""
IntelliReal - Health Check API
"""

from fastapi import APIRouter
from models.schemas import HealthResponse
from config import get_settings

router = APIRouter(tags=["health"])


@router.get("/health", response_model=HealthResponse)
async def health_check():
    """Basic health check endpoint."""
    settings = get_settings()

    services = {
        "nvidia_nim": bool(settings.nvidia_api_key),
        "supabase": bool(settings.supabase_url),
        "chromadb": True,  # Always available (local)
    }

    return HealthResponse(
        status="healthy" if all(services.values()) else "degraded",
        version="0.1.0",
        services=services,
    )
