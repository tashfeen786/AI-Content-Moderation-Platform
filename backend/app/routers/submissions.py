from fastapi import APIRouter, File, UploadFile, HTTPException, Depends, status, BackgroundTasks
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from datetime import datetime
from typing import List
import os
import uuid
import aiofiles
from bson import ObjectId

from app.core.database import get_db
from app.utils.security import verify_token
from app.services.screening import run_mock_screening

router = APIRouter(prefix="/submissions", tags=["Submissions"])
security = HTTPBearer()

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    payload = verify_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token"
        )
    db = get_db()
    user = await db["users"].find_one({"email": payload.get("sub")})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    return user

@router.post("/upload")
async def upload_images(
    background_tasks: BackgroundTasks,
    files: List[UploadFile] = File(...),
    current_user: dict = Depends(get_current_user)
):
    if not files or len(files) == 0:
        raise HTTPException(status_code=400, detail="At least one image is required")
    if len(files) > 5:
        raise HTTPException(status_code=400, detail="Maximum 5 images allowed")
    
    db = get_db()
    
    # 1. Create submission
    submission = {
        "user_id": current_user["_id"],
        "user_email": current_user["email"],
        "submitted_at": datetime.utcnow(),
        "status": "Processing",
        "total_images": len(files),
        "image_ids": []
    }
    submission_result = await db["submissions"].insert_one(submission)
    submission_id = str(submission_result.inserted_id)
    
    saved_images = []
    
    # 2. Save images & create image records
    for file in files:
        ext = os.path.splitext(file.filename)[1]
        unique_name = f"{uuid.uuid4()}{ext}"
        file_path = os.path.join(UPLOAD_DIR, unique_name)
        
        async with aiofiles.open(file_path, "wb") as out_file:
            content = await file.read()
            await out_file.write(content)
        
        image_doc = {
            "submission_id": submission_id,
            "filename": file.filename,
            "file_path": file_path,
            "file_size": os.path.getsize(file_path),
            "verdict_status": "Pending",
            "uploaded_at": datetime.utcnow()
        }
        image_result = await db["images"].insert_one(image_doc)
        image_id = str(image_result.inserted_id)
        saved_images.append({"id": image_id, "filename": file.filename, "status": "Pending"})
        
        # 3. TRIGGER BACKGROUND SCREENING for this image
        background_tasks.add_task(
            run_mock_screening, 
            submission_id, 
            image_id, 
            file_path
        )
    
    # Update submission with image ids
    await db["submissions"].update_one(
        {"_id": submission_result.inserted_id},
        {"$set": {"image_ids": [img["id"] for img in saved_images]}}
    )
    
    return {
        "submission_id": submission_id,
        "status": "Processing",
        "images": saved_images,
        "message": f"Successfully uploaded {len(files)} images. Screening started in background."
    }

@router.get("/{submission_id}/status")
async def get_submission_status(
    submission_id: str,
    current_user: dict = Depends(get_current_user)
):
    db = get_db()
    try:
        obj_id = ObjectId(submission_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid submission ID format")
    
    submission = await db["submissions"].find_one({"_id": obj_id})
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    
    # Ensure user owns this submission
    if str(submission["user_id"]) != str(current_user["_id"]):
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Get all images
    images_cursor = db["images"].find({"submission_id": submission_id})
    images = await images_cursor.to_list(length=10)
    
    image_id_strings = [str(img["_id"]) for img in images]
    verdicts_cursor = db["verdicts"].find({"image_id": {"$in": image_id_strings}})
    verdicts = await verdicts_cursor.to_list(length=10)
    
    # --- FIX: Serialize verdicts properly (convert ObjectId & datetime) ---
    verdict_map = {}
    for v in verdicts:
        verdict_map[v["image_id"]] = {
            "overall_outcome": v["overall_outcome"],
            "category_breakdown": v["category_breakdown"],
            "generated_at": v["generated_at"].isoformat() if "generated_at" in v else None,
            "policy_snapshot": v.get("policy_snapshot")
        }
    # -----------------------------------------------------------------
    
    result_images = []
    for img in images:
        img_id = str(img["_id"])
        result_images.append({
            "id": img_id,
            "filename": img["filename"],
            "status": img["verdict_status"],
            "verdict": verdict_map.get(img_id, None)
        })
    
    return {
        "submission_id": submission_id,
        "status": submission["status"],
        "submitted_at": submission["submitted_at"].isoformat() if "submitted_at" in submission else None,
        "images": result_images
    }


@router.get("/history")
async def get_user_history(current_user: dict = Depends(get_current_user)):
    """
    Get all submissions for the currently logged-in user.
    """
    db = get_db()
    
    # Fetch submissions for this user, newest first
    submissions_cursor = db["submissions"].find(
        {"user_id": current_user["_id"]}
    ).sort("submitted_at", -1)
    
    submissions = await submissions_cursor.to_list(length=50)
    
    result = []
    for sub in submissions:
        sub_id_str = str(sub["_id"])
        
        # Fetch images linked to this submission
        images_cursor = db["images"].find({"submission_id": sub_id_str})
        images = await images_cursor.to_list(length=10)
        
        img_list = []
        for img in images:
            img_list.append({
                "id": str(img["_id"]),
                "filename": img.get("filename", "unknown"),
                "status": img.get("verdict_status", "Pending")
            })
        
        result.append({
            "submission_id": sub_id_str,
            "status": sub.get("status", "Processing"),
            "submitted_at": sub["submitted_at"].isoformat(),
            "images": img_list
        })
    
    return result