"""
IntelliReal - NVIDIA NIM Embeddings Service
Generates text embeddings using NVIDIA NIM API and manages ChromaDB vector storage.
"""

import logging
from typing import List, Optional
import chromadb
from chromadb.config import Settings as ChromaSettings
from langchain_nvidia_ai_endpoints import NVIDIAEmbeddings
from config import get_settings
from services.chunker import TextChunk

logger = logging.getLogger(__name__)


class EmbeddingService:
    """
    Manages embedding generation via NVIDIA NIM and storage in ChromaDB.
    Each user gets their own namespaced collection for multi-tenant isolation.
    """

    def __init__(self):
        settings = get_settings()

        # Initialize NVIDIA NIM embeddings
        self.embeddings = NVIDIAEmbeddings(
            model=settings.nvidia_embed_model,
            api_key=settings.nvidia_api_key,
            truncate="END",
        )

        # Initialize ChromaDB persistent client
        self.chroma_client = chromadb.PersistentClient(
            path=settings.chroma_persist_dir,
            settings=ChromaSettings(anonymized_telemetry=False),
        )

        logger.info(
            f"EmbeddingService initialized: model={settings.nvidia_embed_model}, "
            f"persist_dir={settings.chroma_persist_dir}"
        )

    def _get_collection_name(self, user_id: str) -> str:
        """Generate a collection name scoped to the user."""
        # ChromaDB collection names must be 3-63 chars, alphanumeric + underscores
        safe_id = user_id.replace("-", "_")[:50]
        return f"user_{safe_id}"

    def _get_collection(self, user_id: str) -> chromadb.Collection:
        """Get or create a ChromaDB collection for a user."""
        name = self._get_collection_name(user_id)
        return self.chroma_client.get_or_create_collection(
            name=name,
            metadata={"hnsw:space": "cosine"},
        )

    async def embed_chunks(
        self, chunks: List[TextChunk], user_id: str
    ) -> int:
        """
        Embed text chunks and store in ChromaDB.
        
        Args:
            chunks: List of TextChunk objects to embed
            user_id: User ID for collection namespacing
            
        Returns:
            Number of chunks embedded
        """
        if not chunks:
            return 0

        collection = self._get_collection(user_id)

        # Batch embed texts
        texts = [chunk.text for chunk in chunks]
        ids = [chunk.id for chunk in chunks]
        metadatas = [chunk.to_dict() for chunk in chunks]

        # Generate embeddings via NVIDIA NIM
        embeddings = self.embeddings.embed_documents(texts)

        # Store in ChromaDB
        collection.add(
            ids=ids,
            embeddings=embeddings,
            documents=texts,
            metadatas=metadatas,
        )

        logger.info(
            f"Embedded {len(chunks)} chunks for user {user_id} "
            f"in collection {self._get_collection_name(user_id)}"
        )

        return len(chunks)

    async def search(
        self,
        query: str,
        user_id: str,
        top_k: int = None,
        document_ids: Optional[List[str]] = None,
    ) -> List[dict]:
        """
        Search for relevant chunks using semantic similarity.
        
        Args:
            query: Search query text
            user_id: User ID for collection scoping
            top_k: Number of results to return
            document_ids: Optional filter to specific documents
            
        Returns:
            List of matching chunks with scores
        """
        settings = get_settings()
        top_k = top_k or settings.top_k_results

        collection = self._get_collection(user_id)

        # Generate query embedding
        query_embedding = self.embeddings.embed_query(query)

        # Build where filter for document scoping
        where_filter = None
        if document_ids:
            if len(document_ids) == 1:
                where_filter = {"document_id": document_ids[0]}
            else:
                where_filter = {"document_id": {"$in": document_ids}}

        # Search ChromaDB
        results = collection.query(
            query_embeddings=[query_embedding],
            n_results=top_k,
            where=where_filter,
            include=["documents", "metadatas", "distances"],
        )

        # Format results
        formatted = []
        if results and results["ids"] and results["ids"][0]:
            for i, doc_id in enumerate(results["ids"][0]):
                distance = results["distances"][0][i] if results["distances"] else 0
                # ChromaDB cosine distance: 0 = identical, 2 = opposite
                # Convert to similarity score: 1 - (distance / 2)
                similarity = 1 - (distance / 2)

                formatted.append({
                    "id": doc_id,
                    "text": results["documents"][0][i],
                    "metadata": results["metadatas"][0][i] if results["metadatas"] else {},
                    "similarity_score": round(similarity, 4),
                })

        logger.info(
            f"Search for user {user_id}: query='{query[:50]}...' → "
            f"{len(formatted)} results"
        )

        return formatted

    async def delete_document_chunks(self, document_id: str, user_id: str) -> int:
        """Delete all chunks for a specific document."""
        collection = self._get_collection(user_id)

        # Get IDs of chunks belonging to this document
        results = collection.get(
            where={"document_id": document_id},
            include=[],
        )

        if results and results["ids"]:
            collection.delete(ids=results["ids"])
            logger.info(
                f"Deleted {len(results['ids'])} chunks for document {document_id}"
            )
            return len(results["ids"])

        return 0

    async def get_collection_stats(self, user_id: str) -> dict:
        """Get stats for a user's collection."""
        collection = self._get_collection(user_id)
        count = collection.count()
        return {
            "collection_name": self._get_collection_name(user_id),
            "total_chunks": count,
        }

    async def get_documents_from_chroma(self, user_id: str) -> List[dict]:
        """Fetch list of unique documents from ChromaDB chunk metadatas."""
        from datetime import datetime
        collection = self._get_collection(user_id)
        if collection.count() == 0:
            return []

        results = collection.get(include=["metadatas"])
        docs_map = {}

        if results and results.get("metadatas"):
            for meta in results["metadatas"]:
                doc_id = meta.get("document_id")
                if not doc_id:
                    continue
                if doc_id not in docs_map:
                    docs_map[doc_id] = {
                        "id": doc_id,
                        "filename": meta.get("filename", "Unknown"),
                        "document_type": meta.get("document_type", "other"),
                        "file_size": meta.get("file_size", 0),
                        "num_chunks": 0,
                        "company": meta.get("company"),
                        "ticker": meta.get("ticker"),
                        "status": "processed",
                        "created_at": datetime.utcnow(),
                    }
                docs_map[doc_id]["num_chunks"] += 1

        return list(docs_map.values())

