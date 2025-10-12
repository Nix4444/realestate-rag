## Real Estate RAG Assistant

An end‑to‑end Retrieval‑Augmented Generation (RAG) app for real estate. Upload your property data (CSV or JSON), chat with it, and get grounded answers from your own dataset.

### What you can do
- **Upload data**: Drop a CSV or JSON of properties (rows = properties, columns = attributes)
- **Chat**: Ask natural questions; the assistant retrieves relevant rows and answers with specifics
- **Stay grounded**: Answers are built from your data (no invented facts)

## Tech stack
- **Frontend**: Next.js (App Router), React, Tailwind
- **Backend**: FastAPI (Python 3.11), Tortoise ORM, Uvicorn
- **Database (user + chats)**: PostgreSQL
- **Vector store (embeddings)**: ChromaDB (HTTP server)
- **LLM**: OpenAI `gpt-4o-mini`
- **Embeddings**: OpenAI `text-embedding-3-small`

## How it works (at a glance)
1. You sign up/sign in. Auth uses an HTTP‑only cookie `access_token`.
2. You create a new chat and upload a CSV/JSON file of properties.
3. The backend parses your file, creates OpenAI embeddings, and upserts them into ChromaDB with metadata.
4. When you ask a question, the query is embedded and run against ChromaDB to retrieve relevant rows.
5. The LLM receives your question plus the retrieved context and streams the answer back.

## Repo layout
- `frontend/` — Next.js app UI and chat experience
- `backend/` — FastAPI app, auth, vectorization, and streaming chat

## Prerequisites
- Node.js 18+ (Next.js 15)
- Python 3.11+
- PostgreSQL 14+ (local or remote)
- ChromaDB server (HTTP) on port `8000`
- OpenAI API key

## Environment variables

### Backend (`backend/.env`)
```bash
# Application & Database
DATABASE_URL=postgres://postgres:postgres@localhost:5432/realestate_rag
JWT_SECRET=replace-with-a-long-random-secret

# OpenAI
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini
OPENAI_EMBEDDING_MODEL=text-embedding-3-small

# ChromaDB
CHROMA_HOST=localhost
CHROMA_PORT=8000
CHROMA_COLLECTION_NAME=simplyphi

# Performance knobs (safe defaults)
EMBED_BATCH_SIZE=100
EMBED_CONCURRENCY=3
EMBED_RETRIES=6
EMBED_RETRY_BASE_MS=500
MAX_CHUNK_TEXT_CHARS=2000
CHROMA_UPSERT_BATCH=100
```

### Frontend (`frontend/.env.local`)
```bash
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Setup

### 1) Start PostgreSQL
- Create a database named `realestate_rag` (or adjust `DATABASE_URL`).

### 2) Start ChromaDB (HTTP server)
- With Docker (recommended):
```bash
docker run -p 8000:8000 ghcr.io/chroma-core/chroma:latest
```
- Or via Python:
```bash
pip install -U chromadb
chroma run --host 0.0.0.0 --port 8000
```

### 3) Backend
```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -U pip
pip install .

# Apply DB migrations
aerich upgrade  # if this errors on first run, try: aerich init -t config.TORTOISE_ORM && aerich upgrade

# Run the API
uvicorn main:app --reload --port 3001
```

The API will allow CORS from `http://localhost:3000` and exposes:
- `POST /auth/signup` — create account
- `POST /auth/login` — sets `access_token` cookie
- `POST /auth/logout` — clears cookie
- `GET /app/chats` — list your chats
- `POST /app/newChat` — create chat + upload file (CSV/JSON)
- `GET /app/chats/{chat_id}/messages` — list messages
- `POST /app/chats/{chat_id}/messages/stream` — stream assistant reply

### 4) Frontend
```bash
cd frontend
npm install
npm run dev
```

Visit `http://localhost:3000`.

## Using the app
1. Go to `http://localhost:3000/signin` and create an account.
2. Start a new chat and upload your real estate data as CSV/JSON.
   - CSV: header row + rows of properties
   - JSON: an array of objects (or a single object)
3. Ask questions like “Show me modern flats under 500k in Bristol.”
4. The answer streams in and cites details grounded in your uploaded data.

## Data format tips
- Keep a header row with clear names: `address`, `price`, `bedrooms`, `bathrooms`, `property_type_full_description`, etc.
- Use consistent types (numbers for `price`, integers for `bedrooms`, etc.).
- Large free‑text fields are fine; they improve retrieval quality.

## Troubleshooting
- **Cookie/auth not working**: Ensure frontend uses `NEXT_PUBLIC_API_URL` that matches backend and that you access via `http://localhost:3000`. Cookies are HTTP‑only and require `credentials: 'include'` (already set in the app).
- **Chroma errors**: Verify ChromaDB is running on `CHROMA_HOST:CHROMA_PORT` and that `CHROMA_COLLECTION_NAME` exists (it will be created automatically).
- **OpenAI errors**: Confirm `OPENAI_API_KEY` is set and network egress is allowed.
- **Migrations**: If `aerich upgrade` fails on first run, run `aerich init -t config.TORTOISE_ORM` once, then `aerich upgrade`.

## Notes
- This is a developer‑friendly starter. Feel free to tighten auth, CORS, and cookie `secure` flags for production.
- Model defaults can be changed via `OPENAI_MODEL` and `OPENAI_EMBEDDING_MODEL` without code changes.


