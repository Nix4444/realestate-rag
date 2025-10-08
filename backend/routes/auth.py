from fastapi import APIRouter
from db.models import User
import os
from dotenv import load_dotenv
import bcrypt
import jwt
load_dotenv()
router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/signup")
async def signup(email: str, password: str):
    hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
    try:
        user = await User.create(email=email, password=hashed_password.decode('utf-8'))
        return {"message": "Signup successful"}
    except Exception as e:
        return {"message": "Failed to signup", "error": "User Already Exists"}

@router.post("/login")
async def login(email:str, password:str):
    user = await User.get(email=email)
    if not user:
        return {"message": "Failed to login", "error": "User Not Found"}
    if not bcrypt.checkpw(password.encode('utf-8'), user.password.encode('utf-8')):
        return {"message": "Failed to login", "error": "Invalid Password"}
    token = jwt.encode({"id": user.id}, os.getenv("JWT_SECRET"), algorithm="HS256")
    return {"message": "Login successful", "token": f"Bearer {token}"}

