"""
IntelliReal - Text Chunker
Splits parsed documents into overlapping chunks for embedding and retrieval.
Uses recursive character splitting with configurable size and overlap.
"""

import logging
import uuid
from typing import List, Dict
from config import get_settings

logger = logging.getLogger(__name__)


class TextChunk:
    """Represents a single chunk of text with metadata."""

    def __init__(
        self,
        text: str,
        chunk_index: int,
        document_id: str,
        filename: str,
        page_number: int = 1,
        metadata: Dict = None,
    ):
        self.id = str(uuid.uuid4())
        self.text = text
        self.chunk_index = chunk_index
        self.document_id = document_id
        self.filename = filename
        self.page_number = page_number
        self.metadata = metadata or {}

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "text": self.text,
            "chunk_index": self.chunk_index,
            "document_id": self.document_id,
            "filename": self.filename,
            "page_number": self.page_number,
            **self.metadata,
        }


class DocumentChunker:
    """
    Splits documents into overlapping chunks for RAG.
    
    Uses a simple recursive approach:
    1. Split by double newlines (paragraphs)
    2. If still too long, split by single newlines
    3. If still too long, split by sentences
    4. Final fallback: split by characters
    """

    def __init__(self, chunk_size: int = None, chunk_overlap: int = None):
        settings = get_settings()
        self.chunk_size = chunk_size or settings.chunk_size
        self.chunk_overlap = chunk_overlap or settings.chunk_overlap
        self.separators = ["\n\n", "\n", ". ", " "]

    def chunk_document(
        self,
        pages: List[Dict],
        document_id: str,
        filename: str,
        extra_metadata: Dict = None,
    ) -> List[TextChunk]:
        """
        Chunk a parsed document's pages into overlapping text chunks.
        """
        all_chunks = []
        chunk_index = 0
        extra = extra_metadata or {}

        for page_data in pages:
            page_num = page_data.get("page", 1)
            text = page_data.get("text", "").strip()

            if not text:
                continue

            # Split this page's text into chunks
            text_splits = self._recursive_split(text)

            # Merge small splits and apply overlap
            merged = self._merge_with_overlap(text_splits)

            for chunk_text in merged:
                if chunk_text.strip():
                    chunk = TextChunk(
                        text=chunk_text.strip(),
                        chunk_index=chunk_index,
                        document_id=document_id,
                        filename=filename,
                        page_number=page_num,
                        metadata=extra,
                    )
                    all_chunks.append(chunk)
                    chunk_index += 1

        logger.info(
            f"Chunked {filename}: {len(pages)} pages → {len(all_chunks)} chunks "
            f"(size={self.chunk_size}, overlap={self.chunk_overlap})"
        )

        return all_chunks

    def _recursive_split(self, text: str) -> List[str]:
        """Recursively split text using hierarchical separators."""
        if len(text) <= self.chunk_size:
            return [text]

        # Try each separator in order
        for separator in self.separators:
            if separator in text:
                splits = text.split(separator)
                # Re-attach separator to maintain text integrity
                result = []
                for i, split in enumerate(splits):
                    if split.strip():
                        piece = split if separator == " " else split + separator
                        if len(piece) > self.chunk_size:
                            # Recursively split oversized pieces
                            result.extend(self._recursive_split(piece))
                        else:
                            result.append(piece)
                if result:
                    return result

        # Final fallback: hard split by character count
        return [
            text[i : i + self.chunk_size]
            for i in range(0, len(text), self.chunk_size)
        ]

    def _merge_with_overlap(self, splits: List[str]) -> List[str]:
        """Merge small splits into chunk_size pieces with overlap."""
        if not splits:
            return []

        merged = []
        current = ""

        for split in splits:
            # If adding this split keeps us under the limit, accumulate
            if len(current) + len(split) <= self.chunk_size:
                current += split
            else:
                # Save current chunk
                if current.strip():
                    merged.append(current)

                # Start new chunk with overlap from the end of previous
                if self.chunk_overlap > 0 and current:
                    overlap_text = current[-self.chunk_overlap :]
                    current = overlap_text + split
                else:
                    current = split

        # Don't forget the last chunk
        if current.strip():
            merged.append(current)

        return merged
