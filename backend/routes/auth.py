from fastapi import APIRouter, Response
from pydantic import BaseModel
from db.models import User
import os
from dotenv import load_dotenv
import bcrypt
import jwt
load_dotenv()
router = APIRouter(prefix="/auth", tags=["auth"])


class AuthPayload(BaseModel):
    email: str
    password: str

@router.post("/signup")
async def signup(payload: AuthPayload):
    hashed_password = bcrypt.hashpw(payload.password.encode('utf-8'), bcrypt.gensalt())
    try:
        user = await User.create(email=payload.email, password=hashed_password.decode('utf-8'))
        return {"message": "Signup successful"}
    except Exception as e:
        return {"message": "Failed to signup", "error": "User Already Exists"}

@router.post("/login")
async def login(payload: AuthPayload, response: Response):
    user = await User.get(email=payload.email)
    if not user:
        return {"message": "Failed to login", "error": "User Not Found"}
    if not bcrypt.checkpw(payload.password.encode('utf-8'), user.password.encode('utf-8')):
        return {"message": "Failed to login", "error": "Invalid Password"}
    token = jwt.encode({"id": str(user.id)}, os.getenv("JWT_SECRET"), algorithm="HS256")
    response.set_cookie(
        key="access_token",
        value=token,  # no 'Bearer ' prefix
        httponly=True,
        samesite="lax",
        secure=False,  # set True in production behind HTTPS
        path="/",
        max_age=60 * 60,
    )
    return {"message": "Login successful"}


@router.post("/logout")
async def logout(response: Response):
    response.delete_cookie(
        key="access_token",
        path="/",
    )
    return {"message": "Logout successful"}

