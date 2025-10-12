import os
from typing import Optional

from fastapi import HTTPException
from openai import OpenAI, AsyncOpenAI
from pinecone import Pinecone
import chromadb
from chromadb.types import Collection


_openai: Optional[OpenAI] = None
_openai_async: Optional[AsyncOpenAI] = None
_chroma_collection: Optional[Collection] = None


def getOpenai() -> OpenAI:
    global _openai
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="OPENAI_API_KEY not configured")
    if _openai is None:
        _openai = OpenAI(api_key=api_key)
    return _openai


def getChromaCollection() -> Collection:
    global _chroma_collection
    host = os.getenv("CHROMA_HOST", "localhost")
    port = os.getenv("CHROMA_PORT", "8000")
    collection_name = os.getenv("CHROMA_COLLECTION_NAME", "simplyphi")
    if not host or not port or not collection_name:
        raise HTTPException(
            status_code=500,
            detail="ChromaDB configuration missing (CHROMA_HOST, CHROMA_PORT, CHROMA_COLLECTION_NAME)",
        )
    if _chroma_collection is None:
        try:
            chroma_client = chromadb.HttpClient(host=host, port=port)
            _chroma_collection = chroma_client.get_or_create_collection(name=collection_name)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to connect to ChromaDB: {e}")
    return _chroma_collection


def getEmbeddingModelName() -> str:
    return os.getenv("OPENAI_EMBEDDING_MODEL", "text-embedding-3-small")


def getChatModelName() -> str:
    return os.getenv("OPENAI_MODEL", "gpt-4o-mini")


def getAsyncOpenai() -> AsyncOpenAI:
    global _openai_async
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="OPENAI_API_KEY not configured")
    if _openai_async is None:
        _openai_async = AsyncOpenAI(api_key=api_key)
    return _openai_async