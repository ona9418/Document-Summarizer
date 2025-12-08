from fastapi import APIRouter, HTTPException, Form
from fastapi.responses import JSONResponse
from google.cloud import firestore
from datetime import datetime
import os

# Create a Router to handle auth requests
router = APIRouter()

GCP_PROJECT_ID = "document-summarizer-476701" 

try:
    db = firestore.Client(project=GCP_PROJECT_ID)
except Exception as e:
    print(f"Warning: Firestore failed in auth.py: {e}")
    db = None

@router.post("/login")
async def login_user(user_id: str = Form(...)):
    """
    Checks if a user exists in Firestore. 
    If yes -> Logs them in.
    If no -> Creates a new account automatically.
    """
    if not user_id:
        raise HTTPException(status_code=400, detail="User ID is required")

    if not db:
        # Fallback if DB is offline
        return JSONResponse(
            content={"message": "Login successful (Offline Mode)", "user_id": user_id},
            status_code=200
        )

    try:
        user_ref = db.collection("users").document(user_id)
        user_doc = user_ref.get()

        if user_doc.exists:
            # Update last login
            user_ref.update({"last_login": datetime.utcnow()})
            return JSONResponse(
                content={"message": "Login successful", "user_id": user_id},
                status_code=200
            )
        else:
            # Register new user
            user_ref.set({
                "user_id": user_id,
                "created_at": datetime.utcnow(),
                "last_login": datetime.utcnow()
            })
            return JSONResponse(
                content={"message": "Account created", "user_id": user_id},
                status_code=200
            )

    except Exception as e:
        print(f"Auth Error: {e}")
        raise HTTPException(status_code=500, detail="Authentication failed.")