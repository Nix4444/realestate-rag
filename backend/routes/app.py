from fastapi import APIRouter
import asyncio
import os
import random
import hashlib
from middleware.authMiddleware import authMiddleware
from db.models import Chat, Message
from utils.serializers import serialize_chat, serialize_message
from fastapi import HTTPException, Depends, UploadFile, File, Form, BackgroundTasks
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import uuid
import json
from utils.extract import extractDataFromFile, getStructuredVectorQuery, generateSemanticQuery
from utils.clients import (
    getOpenai,
    getAsyncOpenai,
    getChromaCollection,
    getEmbeddingModelName,
    getChatModelName,
)
from openai import RateLimitError, APIError, APIConnectionError
router = APIRouter(prefix="/app", tags=["app"])


class CreateChatPayload(BaseModel):
    title: str | None = None


class CreateMessagePayload(BaseModel):
    role: str
    content: str
    history: list[dict] | None = None


 


@router.get("/chats")
async def list_chats(user: dict = Depends(authMiddleware)):
    userId = user["id"]
    chats = await Chat.filter(user_id=userId)
    return [serialize_chat(c) for c in chats]


@router.post("/newChat")
async def newChat(
    title: str | None = Form(None),
    file: UploadFile = File(...),
    user: dict = Depends(authMiddleware),
):
    userId = user["id"]
    chat = await Chat.create(user_id=userId, title=(title or "New chat"))
    filename = file.filename or "uploaded"
    if not (filename.lower().endswith(".csv") or filename.lower().endswith(".json")):
        raise HTTPException(status_code=400, detail="Only .csv or .json files are allowed")
    raw = await file.read()
    file_id = uuid.uuid4()
    try:
        documents: list[dict] = extractDataFromFile(filename, file.content_type or "", raw)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    vectors = []
    if documents:
        asynClient = getAsyncOpenai()
        embedding_model = getEmbeddingModelName()
        texts_to_embed = [json.dumps(doc, sort_keys=True) for doc in documents]

        batch_size = int(os.getenv("EMBED_BATCH_SIZE", "100"))
        batches: list[tuple[int, list[str], list[dict]]] = []
        for i in range(0, len(documents), batch_size):
            text_chunk = texts_to_embed[i : i + batch_size]
            doc_chunk = documents[i : i + batch_size]
            batches.append((i, text_chunk, doc_chunk))

        concurrency = int(os.getenv("EMBED_CONCURRENCY", "3"))
        sem = asyncio.Semaphore(max(1, concurrency))

        async def embed_batch(start_index: int, chunk: list[str], doc_chunk: list[dict]):
            async with sem:
                max_retries = int(os.getenv("EMBED_RETRIES", "6"))
                base_delay_ms = int(os.getenv("EMBED_RETRY_BASE_MS", "500"))
                for attempt in range(max_retries):
                    try:
                        resp = await asynClient.embeddings.create(model=embedding_model, input=chunk)
                        vecs = []
                        for j, item in enumerate(resp.data):
                            text_val = chunk[j]
                            original_doc = doc_chunk[j]
                            metadata = {
                                "chat_id": str(chat.id),
                                "user_id": str(userId),
                                "file_id": str(file_id),
                                "chunk_index": start_index + j,
                                "source": filename,
                            }
                            for key, value in original_doc.items():
                                metadata[key] = value

                            max_text_chars = int(os.getenv("MAX_CHUNK_TEXT_CHARS", "2000"))
                            if isinstance(text_val, str) and len(text_val) > max_text_chars:
                                text_val = text_val[:max_text_chars]

                            metadata["text"] = text_val
                            vecs.append(
                                (
                                    f"{chat.id}:{file_id}:{start_index + j}",
                                    item.embedding,
                                    metadata,
                                )
                            )
                        return vecs
                    except (RateLimitError, APIError, APIConnectionError) as e:
                        if attempt == max_retries - 1:
                            raise
                        delay_ms = (2 ** attempt) * base_delay_ms + random.randint(0, 250)
                        await asyncio.sleep(delay_ms / 1000)

        results = await asyncio.gather(*(embed_batch(start, text_chunk, doc_chunk) for start, text_chunk, doc_chunk in batches))
        vectors = [v for group in results if group for v in group]

        if vectors:
            collection = getChromaCollection()
            ids = [hashlib.sha256(v[0].encode()).hexdigest() for v in vectors]
            embeddings = [v[1] for v in vectors]
            metadatas = [v[2] for v in vectors]
            
            upsert_batch = int(os.getenv("CHROMA_UPSERT_BATCH", "100"))
            for i in range(0, len(vectors), upsert_batch):
                collection.upsert(
                    ids=ids[i : i + upsert_batch],
                    embeddings=embeddings[i : i + upsert_batch],
                    metadatas=metadatas[i : i + upsert_batch],
                )
                print(f"Upserted {len(ids[i:i + upsert_batch])} vectors to Chroma")

    return {"chat": serialize_chat(chat), "fileId": str(file_id), "upserted": len(vectors) if vectors else 0}


@router.get("/chats/{chat_id}/messages")
async def list_messages(chat_id: str, user: dict = Depends(authMiddleware)):
    chat = await Chat.get_or_none(id=chat_id, user_id=user["id"])
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    messages = await Message.filter(chat=chat).order_by("created_at")
    return [serialize_message(m) for m in messages]

@router.post("/chats/{chat_id}/messages/stream")
async def stream_message(
    chat_id: str,
    payload: CreateMessagePayload,
    background_tasks: BackgroundTasks,
    user: dict = Depends(authMiddleware),
):
    chat = await Chat.get_or_none(id=chat_id, user_id=user["id"])
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")

    if payload.role != "USER":
        raise HTTPException(status_code=400, detail="Only USER role allowed for streaming")
    user_msg = await Message.create(chat=chat, role="USER", content=payload.content)

    asynClient = getAsyncOpenai()
    collection = getChromaCollection()


    filters = await getStructuredVectorQuery(payload.content)
    filters =[]
    
    embedding_model = getEmbeddingModelName()
    emb_resp = await asynClient.embeddings.create(model=embedding_model, input=[payload.content])
    query_vec = emb_resp.data[0].embedding

    base_filter = {"chat_id": {"$eq": str(chat.id)}}
    if filters:
        final_filter = {"$and": [base_filter] + filters}
    else:
        final_filter = base_filter
    res = collection.query(
        query_embeddings=[query_vec], n_results=5, where=final_filter
    )
    contexts: list[str] = []
    if res and res.get("metadatas") and res["metadatas"][0]:
        for meta in res["metadatas"][0]:
            text = meta.get("text")
            if text:
                contexts.append(str(text))
    context_text = "\n\n".join(contexts)
    model_name = getChatModelName()
    prompt = f"""You are a helpful real estate assistant that answers questions about properties based on uploaded data.

Below is the relevant property data retrieved from the database:

{context_text if context_text else "No relevant property data found in the database."}

Instructions:
- Answer the user's question using the property data provided above.
- Be specific and cite actual numbers, addresses, prices, and details from the data.
- If the data contains multiple relevant properties, compare or list them.
- Never make up or invent property details that aren't in the provided data.
- If no relevant data is found, clearly state that no matching properties were found in the database.
- include all the keys in your response: type, bedrooms, bathrooms, price, listing_update_date, property_type_full_description, flood_risk, is_new_home, laua, crime_score_weight, address
- Keep your answers natural, clear, and helpful."""

    async def token_stream():
        assistant_accum = []
        safe_history = (payload.history or [])[-5:]
        chat_messages = [
            {"role": "system", "content": prompt},
        ]
        for item in safe_history:
            try:
                role = item.get("role", "USER")
                content = item.get("content", "")
                mapped_role = "assistant" if role == "ASSISTANT" else "user"
                if content:
                    chat_messages.append({"role": mapped_role, "content": content})
            except Exception:
                continue
        chat_messages.append({"role": "user", "content": payload.content})

        stream = await asynClient.chat.completions.create(
            model=model_name,
            messages=chat_messages,
            temperature=0.2,
            stream=True,
        )
        async for event in stream:
            delta = event.choices[0].delta.content if event.choices and event.choices[0].delta else None
            if delta:
                assistant_accum.append(delta)
                yield delta

        final_text = "".join(assistant_accum)

        async def save_assistant():
            assistant_msg = await Message.create(chat=chat, role="ASSISTANT", content=final_text)
            if (not chat.title or chat.title == "New chat") and payload.content.strip():
                chat.title = payload.content.strip()[:32]
                await chat.save()
            return assistant_msg

        background_tasks.add_task(save_assistant)

    return StreamingResponse(token_stream(), media_type="text/plain; charset=utf-8")