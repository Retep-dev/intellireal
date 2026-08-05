"""
IntelliReal - FastAPI Application Entry Point
Financial Intelligence Platform powered by NVIDIA NIM + LangChain.
"""

import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import get_settings
from api.health import router as health_router
from api.documents import router as documents_router
from api.chat import router as chat_router

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(name)-25s | %(levelname)-7s | %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger("intellireal")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown events."""
    settings = get_settings()
    logger.info("=" * 60)
    logger.info("  IntelliReal — Financial Intelligence Platform")
    logger.info("=" * 60)
    logger.info(f"  Environment: {settings.app_env}")
    logger.info(f"  LLM Model:   {settings.nvidia_model}")
    logger.info(f"  Embed Model: {settings.nvidia_embed_model}")
    logger.info(f"  NVIDIA Key:  {'configured' if settings.nvidia_api_key else 'MISSING'}")
    logger.info(f"  Supabase:    {'configured' if settings.supabase_url else 'MISSING'}")
    logger.info("=" * 60)

    yield

    logger.info("IntelliReal shutting down...")


# Create FastAPI app
app = FastAPI(
    title="IntelliReal API",
    description="Financial Intelligence Platform — AI-powered document analysis with multi-agent RAG",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS middleware
settings = get_settings()
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(health_router, prefix="/api")
app.include_router(documents_router, prefix="/api")
app.include_router(chat_router, prefix="/api")


@app.get("/")
async def root():
    """Root endpoint — API info."""
    return {
        "name": "IntelliReal API",
        "version": "0.1.0",
        "description": "Financial Intelligence Platform",
        "docs": "/docs",
        "health": "/api/health",
    }
