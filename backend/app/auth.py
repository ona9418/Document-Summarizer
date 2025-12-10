from fastapi import APIRouter, HTTPException, Form
from fastapi.responses import JSONResponse
from google.cloud import firestore
from datetime import datetime
from passlib.context import CryptContext
import os

# Password Hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

router = APIRouter()
GCP_PROJECT_ID = "document-summarizer-476701" 

try:
    db = firestore.Client(project=GCP_PROJECT_ID)
except Exception as e:
    print(f"Warning: Firestore failed in auth.py: {e}")
    db = None

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

@router.post("/register")
async def register_user(user_id: str = Form(...), password: str = Form(...)):
    if not db:
        return JSONResponse(content={"message": "Database unavailable"}, status_code=503)
    
    user_ref = db.collection("users").document(user_id)
    if user_ref.get().exists:
        raise HTTPException(status_code=400, detail="User ID already exists. Please login.")

    # Save user with HASHED password
    user_ref.set({
        "user_id": user_id,
        "password_hash": get_password_hash(password),
        "created_at": datetime.utcnow(),
        "last_login": datetime.utcnow()
    })
    
    return JSONResponse(content={"message": "Account created successfully", "user_id": user_id}, status_code=200)

@router.post("/login")
async def login_user(user_id: str = Form(...), password: str = Form(...)):
    if not db:
        # Fallback for offline testing
        return JSONResponse(content={"message": "Offline Mode", "user_id": user_id}, status_code=200)

    user_ref = db.collection("users").document(user_id)
    user_doc = user_ref.get()

    if not user_doc.exists:
        raise HTTPException(status_code=401, detail="User not found. Please register.")

    user_data = user_doc.to_dict()
    stored_hash = user_data.get("password_hash")

    # Verify Password
    if not stored_hash or not verify_password(password, stored_hash):
        raise HTTPException(status_code=401, detail="Incorrect password.")

    # Update last login
    user_ref.update({"last_login": datetime.utcnow()})
    
    return JSONResponse(content={"message": "Login successful", "user_id": user_id}, status_code=200)