"""
IntelliReal - Application Configuration
Centralized settings management using pydantic-settings.
"""

from pydantic_settings import BaseSettings
from functools import lru_cache
from typing import List


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # App
    app_name: str = "IntelliReal"
    app_env: str = "development"
    app_port: int = 8000
    cors_origins: str = "http://localhost:5173,http://localhost:3000"

    # NVIDIA NIM
    nvidia_api_key: str = ""
    nvidia_model: str = "meta/llama-3.1-70b-instruct"
    nvidia_embed_model: str = "nvidia/nv-embedqa-e5-v5"
    llm_temperature: float = 0.1
    llm_max_tokens: int = 4096

    # Supabase
    supabase_url: str = ""
    supabase_anon_key: str = ""
    supabase_service_key: str = ""

    # ChromaDB
    chroma_persist_dir: str = "./chroma_data"

    # RAG
    chunk_size: int = 1000
    chunk_overlap: int = 200
    top_k_results: int = 5

    @property
    def cors_origin_list(self) -> List[str]:
        """Parse CORS origins from comma-separated string."""
        return [origin.strip() for origin in self.cors_origins.split(",")]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    """Cached settings instance — created once, reused everywhere."""
    return Settings()
