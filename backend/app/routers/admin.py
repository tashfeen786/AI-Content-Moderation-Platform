from fastapi import APIRouter, Depends, HTTPException, status
from bson import ObjectId
from datetime import datetime
from typing import List

from app.core.database import get_db
from app.schemas.admin import PolicyUpdate, PolicyResponse, AppealReview, AppealResponse
from app.utils.dependencies import get_current_admin_user
from app.routers.submissions import get_current_user

router = APIRouter(prefix="/admin", tags=["Admin"])

# --- CONSTANTS ---
CATEGORIES = [
    "Graphic Violence",
    "Hate Symbols",
    "Self-Harm",
    "Extremist Propaganda",
    "Weapons & Contraband",
    "Harassment & Humiliation"
]

# ==========================================
# 1. POLICY CONFIGURATION APIs
# ==========================================

@router.get("/policies", response_model=List[PolicyResponse])
async def get_policies(admin_user: dict = Depends(get_current_admin_user)):
    """Get all moderation policies."""
    db = get_db()
    policies = await db["policy_configs"].find().to_list(length=10)
    
    # If no policies exist, create defaults
    if not policies:
        default_policies = []
        for cat in CATEGORIES:
            doc = {
                "category": cat,
                "isEnabled": True,
                "threshold": 70,
                "enforcement": "Auto-Block",
                "updatedAt": datetime.utcnow()
            }
            await db["policy_configs"].insert_one(doc)
            default_policies.append(doc)
        return default_policies
    
    return policies

@router.put("/policies/{category}")
async def update_policy(category: str, update_data: PolicyUpdate, admin_user: dict = Depends(get_current_admin_user)):
    """Update a specific category policy."""
    if category not in CATEGORIES:
        raise HTTPException(status_code=400, detail="Invalid category")
    
    db = get_db()
    result = await db["policy_configs"].update_one(
        {"category": category},
        {"$set": {
            "isEnabled": update_data.isEnabled,
            "threshold": update_data.threshold,
            "enforcement": update_data.enforcement,
            "updatedAt": datetime.utcnow(),
            "updatedBy": admin_user["email"]
        }},
        upsert=True
    )
    
    if result.matched_count == 0 and result.upserted_id is None:
        raise HTTPException(status_code=500, detail="Failed to update policy")
    
    return {"message": f"Policy for '{category}' updated successfully"}

# ==========================================
# 2. USER APPEAL SUBMISSION API (Public/User)
# ==========================================

@router.post("/appeals", tags=["Appeals"])
async def submit_appeal(
    appeal_data: dict,
    current_user: dict = Depends(get_current_user)
):
    """User submits an appeal against a submission."""
    db = get_db()
    submission_id = appeal_data.get("submission_id")
    justification = appeal_data.get("justification")
    
    if not submission_id or not justification:
        raise HTTPException(status_code=400, detail="submission_id and justification required")
    
    try:
        obj_id = ObjectId(submission_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid submission ID")
    
    # Check if submission exists and belongs to user
    submission = await db["submissions"].find_one({"_id": obj_id})
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    
    if str(submission["user_id"]) != str(current_user["_id"]):
        raise HTTPException(status_code=403, detail="You can only appeal your own submissions")
    
    # Check if verdict is Flagged or Blocked
    images = await db["images"].find({"submission_id": submission_id}).to_list(length=10)
    verdict_statuses = [img.get("verdict_status") for img in images]
    if not any(v in ["Flagged", "Blocked"] for v in verdict_statuses):
        raise HTTPException(status_code=400, detail="Only Flagged or Blocked submissions can be appealed")
    
    # Check if appeal already exists
    existing = await db["appeals"].find_one({"submission_id": submission_id, "status": "Pending"})
    if existing:
        raise HTTPException(status_code=400, detail="An appeal is already pending for this submission")
    
    # Create appeal
    appeal_doc = {
        "submission_id": submission_id,
        "user_id": current_user["_id"],
        "user_email": current_user["email"],
        "justification": justification,
        "status": "Pending",
        "admin_response": None,
        "created_at": datetime.utcnow(),
        "resolved_at": None
    }
    result = await db["appeals"].insert_one(appeal_doc)
    
    return {"appeal_id": str(result.inserted_id), "status": "Pending", "message": "Appeal submitted successfully"}

# ==========================================
# 3. ADMIN APPEALS MANAGEMENT APIs
# ==========================================

@router.get("/appeals", response_model=List[AppealResponse])
async def get_appeals(status_filter: str = None, admin_user: dict = Depends(get_current_admin_user)):
    """Get all appeals (Admin only). Filter by status: Pending, Accepted, Rejected."""
    db = get_db()
    query = {}
    if status_filter:
        query["status"] = status_filter
    
    appeals_cursor = db["appeals"].find(query).sort("created_at", -1)
    appeals = await appeals_cursor.to_list(length=100)
    
    # Convert ObjectId to string and datetime to isoformat
    for a in appeals:
        a["id"] = str(a["_id"])
        a["_id"] = str(a["_id"])
        if "resolved_at" in a and a["resolved_at"]:
            a["resolved_at"] = a["resolved_at"].isoformat()
        a["created_at"] = a["created_at"].isoformat()
    
    return appeals

@router.put("/appeals/{appeal_id}/review")
async def review_appeal(
    appeal_id: str,
    review_data: AppealReview,
    admin_user: dict = Depends(get_current_admin_user)
):
    """Admin accepts or rejects an appeal."""
    db = get_db()
    try:
        obj_id = ObjectId(appeal_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid appeal ID")
    
    appeal = await db["appeals"].find_one({"_id": obj_id})
    if not appeal:
        raise HTTPException(status_code=404, detail="Appeal not found")
    
    if appeal["status"] != "Pending":
        raise HTTPException(status_code=400, detail="Appeal is already resolved")
    
    # Update appeal status
    await db["appeals"].update_one(
        {"_id": obj_id},
        {"$set": {
            "status": review_data.status,
            "admin_response": review_data.admin_response,
            "resolved_at": datetime.utcnow(),
            "resolved_by": admin_user["email"]
        }}
    )
    
    # If Accepted: Override submission verdict to Approved
    if review_data.status == "Accepted":
        submission_id = appeal["submission_id"]
        await db["images"].update_many(
            {"submission_id": submission_id},
            {"$set": {"verdict_status": "Approved"}}
        )
        await db["submissions"].update_one(
            {"_id": ObjectId(submission_id)},
            {"$set": {"status": "Completed"}}
        )
    
    return {"message": f"Appeal {review_data.status} successfully", "appeal_id": appeal_id}

# ==========================================
# 4. ADMIN ANALYTICS APIs
# ==========================================

@router.get("/analytics/overview")
async def get_analytics_overview(admin_user: dict = Depends(get_current_admin_user)):
    """Get platform-wide stats: total submissions, verdict distribution, etc."""
    db = get_db()
    
    total_submissions = await db["submissions"].count_documents({})
    
    pipeline_outcome = [
        {"$group": {"_id": "$verdict_status", "count": {"$sum": 1}}}
    ]
    verdict_cursor = db["images"].aggregate(pipeline_outcome)
    verdict_list = await verdict_cursor.to_list(length=10)
    verdict_distribution = [{"outcome": item["_id"] or "Pending", "count": item["count"]} for item in verdict_list]
    
    total_appeals = await db["appeals"].count_documents({})
    pending_appeals = await db["appeals"].count_documents({"status": "Pending"})
    accepted_appeals = await db["appeals"].count_documents({"status": "Accepted"})
    rejected_appeals = await db["appeals"].count_documents({"status": "Rejected"})
    
    return {
        "total_submissions": total_submissions,
        "verdict_distribution": verdict_distribution,
        "appeals": {
            "total": total_appeals,
            "pending": pending_appeals,
            "accepted": accepted_appeals,
            "rejected": rejected_appeals
        }
    }

@router.get("/analytics/user-ranking")
async def get_user_ranking(admin_user: dict = Depends(get_current_admin_user)):
    """Rank users by submission count and violation count."""
    db = get_db()
    
    # Submissions per user
    pipeline_submissions = [
        {"$group": {"_id": "$user_id", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 10}
    ]
    sub_cursor = db["submissions"].aggregate(pipeline_submissions)
    sub_data = await sub_cursor.to_list(length=10)
    
    # ---------- YAHAN FIX HAI ----------
    # Violations per user (Blocked/Flagged images)
    pipeline_violations = [
        {"$match": {"verdict_status": {"$in": ["Blocked", "Flagged"]}}},
        {"$addFields": {"submission_oid": {"$toObjectId": "$submission_id"}}},
        {"$lookup": {"from": "submissions", "localField": "submission_oid", "foreignField": "_id", "as": "sub"}},
        {"$unwind": "$sub"},
        {"$group": {"_id": "$sub.user_id", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 10}
    ]
    # -------------------------------
    
    viol_cursor = db["images"].aggregate(pipeline_violations)
    viol_data = await viol_cursor.to_list(length=10)
    
    # Resolve user emails
    user_ids = set()
    for item in sub_data:
        user_ids.add(item["_id"])
    for item in viol_data:
        user_ids.add(item["_id"])
    
    users = await db["users"].find({"_id": {"$in": list(user_ids)}}).to_list(length=20)
    user_map = {str(u["_id"]): u["email"] for u in users}
    
    # Build response
    result = []
    all_user_ids = set([str(d["_id"]) for d in sub_data] + [str(d["_id"]) for d in viol_data])
    for uid in all_user_ids:
        sub_count = next((d["count"] for d in sub_data if str(d["_id"]) == uid), 0)
        viol_count = next((d["count"] for d in viol_data if str(d["_id"]) == uid), 0)
        result.append({
            "user_id": uid,
            "user_email": user_map.get(uid, "Unknown"),
            "submission_count": sub_count,
            "violation_count": viol_count
        })
    
    result.sort(key=lambda x: x["submission_count"], reverse=True)
    return result