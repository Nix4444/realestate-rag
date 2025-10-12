import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from tortoise.contrib.fastapi import register_tortoise
from config import TORTOISE_ORM
from routes.app import router as app_router
from routes.auth import router as auth_router

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(auth_router)
app.include_router(app_router)
register_tortoise(
    app,
    config=TORTOISE_ORM,
    generate_schemas=False,
    add_exception_handlers=True,
)
@app.get("/health")
def health():
    return {"message": "Health OK"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=3001, reload=True)
