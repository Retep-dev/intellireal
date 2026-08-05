"""
IntelliReal - Document API
Upload, list, and manage financial documents.
"""

import uuid
import logging
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException
from supabase import Client

from config import get_settings
from auth.supabase_auth import get_current_user_id, get_dev_user_id, get_supabase_client
from models.schemas import (
    DocumentUploadResponse,
    DocumentListResponse,
    DocumentMetadata,
    DocumentType,
)
from services.document_parser import DocumentParser
from services.chunker import DocumentChunker
from services.embeddings import EmbeddingService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/documents", tags=["documents"])

# Initialize services
parser = DocumentParser()
chunker = DocumentChunker()
embedding_service = EmbeddingService()


def _get_user_dependency():
    """Return the appropriate auth dependency based on environment."""
    settings = get_settings()
    if settings.app_env == "development":
        return get_dev_user_id
    return get_current_user_id


@router.post("/upload", response_model=DocumentUploadResponse)
async def upload_document(
    file: UploadFile = File(...),
    document_type: DocumentType = Form(DocumentType.OTHER),
    company: Optional[str] = Form(None),
    ticker: Optional[str] = Form(None),
    user_id: str = Depends(_get_user_dependency()),
):
    """
    Upload and process a financial document.
    
    1. Validates file type
    2. Stores file in Supabase Storage
    3. Parses text content
    4. Chunks the text
    5. Embeds chunks in ChromaDB
    """
    # Validate file type
    if not file.filename:
        raise HTTPException(status_code=400, detail="Filename is required")

    ext = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else ""
    supported = ["pdf", "docx", "xlsx", "csv", "txt", "html", "htm"]

    if ext not in supported:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: .{ext}. Supported: {', '.join(supported)}"
        )

    # Read file
    file_bytes = await file.read()
    file_size = len(file_bytes)
    document_id = str(uuid.uuid4())

    logger.info(f"Uploading: {file.filename} ({file_size} bytes) for user {user_id}")

    try:
        # Step 1: Store in Supabase Storage (if configured)
        settings = get_settings()
        if settings.supabase_url and settings.supabase_service_key:
            try:
                supabase: Client = get_supabase_client()
                storage_path = f"{user_id}/{document_id}/{file.filename}"
                supabase.storage.from_("documents").upload(
                    path=storage_path,
                    file=file_bytes,
                    file_options={"content-type": file.content_type or "application/octet-stream"},
                )
                logger.info(f"Stored in Supabase: {storage_path}")
            except Exception as e:
                logger.warning(f"Supabase storage failed (continuing without): {e}")

        # Step 2: Parse document
        parsed = parser.parse(file_bytes, file.filename)

        # Step 3: Chunk the text with extra metadata
        extra_meta = {
            "document_type": document_type.value,
            "company": company,
            "ticker": ticker,
            "file_size": file_size,
        }
        chunks = chunker.chunk_document(
            pages=parsed.pages,
            document_id=document_id,
            filename=file.filename,
            extra_metadata=extra_meta,
        )

        # Step 4: Embed and store in ChromaDB
        num_embedded = await embedding_service.embed_chunks(chunks, user_id)

        # Step 5: Store document metadata in Supabase DB
        if settings.supabase_url and settings.supabase_service_key:
            try:
                supabase: Client = get_supabase_client()
                supabase.table("documents").insert({
                    "id": document_id,
                    "user_id": user_id,
                    "filename": file.filename,
                    "document_type": document_type.value,
                    "file_size": file_size,
                    "num_chunks": num_embedded,
                    "company": company,
                    "ticker": ticker,
                    "status": "processed",
                }).execute()
            except Exception as e:
                logger.warning(f"DB metadata insert failed (continuing): {e}")

        return DocumentUploadResponse(
            id=document_id,
            filename=file.filename,
            document_type=document_type,
            file_size=file_size,
            num_chunks=num_embedded,
            status="processed",
            created_at=datetime.utcnow(),
        )

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Upload failed: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to process document: {str(e)}")


@router.get("/", response_model=DocumentListResponse)
async def list_documents(
    user_id: str = Depends(_get_user_dependency()),
):
    """List all documents for the current user."""
    settings = get_settings()

    documents = []

    if settings.supabase_url and settings.supabase_service_key:
        try:
            supabase: Client = get_supabase_client()
            result = supabase.table("documents") \
                .select("*") \
                .eq("user_id", user_id) \
                .order("created_at", desc=True) \
                .execute()

            for doc in result.data:
                documents.append(
                    DocumentMetadata(
                        id=doc["id"],
                        filename=doc["filename"],
                        document_type=doc.get("document_type", "other"),
                        file_size=doc.get("file_size", 0),
                        num_chunks=doc.get("num_chunks", 0),
                        company=doc.get("company"),
                        ticker=doc.get("ticker"),
                        filing_type=doc.get("filing_type"),
                        period=doc.get("period"),
                        status=doc.get("status", "processed"),
                        created_at=doc.get("created_at", datetime.utcnow()),
                    )
                )
        except Exception as e:
            logger.warning(f"Failed to fetch documents from Supabase: {e}")

    # Fallback: get unique documents from ChromaDB if Supabase DB returns empty/error
    if not documents:
        chroma_docs = await embedding_service.get_documents_from_chroma(user_id)
        for doc in chroma_docs:
            documents.append(
                DocumentMetadata(
                    id=doc["id"],
                    filename=doc["filename"],
                    document_type=doc.get("document_type", "other"),
                    file_size=doc.get("file_size", 0),
                    num_chunks=doc.get("num_chunks", 0),
                    company=doc.get("company"),
                    ticker=doc.get("ticker"),
                    status=doc.get("status", "processed"),
                    created_at=doc.get("created_at", datetime.utcnow()),
                )
            )

    return DocumentListResponse(documents=documents, total=len(documents))


@router.delete("/{document_id}")
async def delete_document(
    document_id: str,
    user_id: str = Depends(_get_user_dependency()),
):
    """Delete a document and its embeddings."""
    # Delete from ChromaDB
    deleted_count = await embedding_service.delete_document_chunks(document_id, user_id)

    # Delete from Supabase
    settings = get_settings()
    if settings.supabase_url and settings.supabase_service_key:
        try:
            supabase: Client = get_supabase_client()
            supabase.table("documents") \
                .delete() \
                .eq("id", document_id) \
                .eq("user_id", user_id) \
                .execute()
        except Exception as e:
            logger.warning(f"Failed to delete from Supabase: {e}")

    return {"deleted": True, "chunks_removed": deleted_count}
