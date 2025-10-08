from fastapi import APIRouter
from middleware.authMiddleware import authMiddleware
from db.models import Chat
from fastapi import HTTPException, Request, Depends, UploadFile, File
import os
import uuid
from openai import OpenAI
import pinecone
from utils.extract import extract_texts_from_file
router = APIRouter(prefix="/app", tags=["app"])

@router.get("/chat")
async def chat(request: Request, user: dict = Depends(authMiddleware)):
    userId = user["id"]
    chats = await Chat.filter(user=userId)
    return chats

@router.post("/chat/create")
async def createChat(title: str, file: UploadFile = File(...), user: dict = Depends(authMiddleware)):

    userId = user["id"]
    filename = file.filename or "uploaded"
    chat = await Chat.create(user=userId, title=title)
    raw = await file.read()
    file_id = uuid.uuid4()
    try:
        texts: list[str] = extract_texts_from_file(filename, file.content_type or "", raw)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    if not texts:
        return {"chatId": str(chat.id), "upserted": 0}

    openai_api_key = os.getenv("OPENAI_API_KEY")
    if not openai_api_key:
        raise HTTPException(status_code=500, detail="OPENAI_API_KEY not configured")
    client = OpenAI(api_key=openai_api_key)
    embedding_model = os.getenv("OPENAI_EMBEDDING_MODEL", "text-embedding-3-small")

    vectors = []
    batch_size = 100
    for i in range(0, len(texts), batch_size):
        chunk = texts[i:i + batch_size]
        resp = client.embeddings.create(model=embedding_model, input=chunk)
        for j, item in enumerate(resp.data):
            vectors.append(
                (
                    f"{chat.id}:{file_id}:{i + j}",
                    item.embedding,
                    {
                        "chat_id": str(chat.id),
                        "user_id": str(userId),
                        "file_id": file_id,
                        "chunk_index": i + j,
                        "source": filename,
                        "text": chunk[j],
                    },
                )
            )

    pinecone_api_key = os.getenv("PINECONE_API_KEY")
    pinecone_env = os.getenv("PINECONE_ENV")
    index_name = os.getenv("PINECONE_INDEX")
    if not pinecone_api_key or not pinecone_env or not index_name:
        raise HTTPException(status_code=500, detail="Pinecone configuration missing (PINECONE_API_KEY, PINECONE_ENV, PINECONE_INDEX)")

    pinecone.init(api_key=pinecone_api_key, environment=pinecone_env)
    index = pinecone.Index(index_name)
    index.upsert(vectors=vectors)

    return {"chatId": str(chat.id), "fileId": file_id, "upserted": len(vectors)}
