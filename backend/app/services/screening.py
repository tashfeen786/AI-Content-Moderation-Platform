import random
from datetime import datetime
from bson import ObjectId  # <-- YEH IMPORT ADD KARO (ZAROORI)
from app.core.database import get_db

CATEGORIES = [
    "Graphic Violence",
    "Hate Symbols",
    "Self-Harm",
    "Extremist Propaganda",
    "Weapons & Contraband",
    "Harassment & Humiliation"
]

async def run_mock_screening(submission_id: str, image_id: str, image_path: str):
    """
    Mock AI Screening function.
    Real scenario: call HuggingFace or external API.
    """
    db = get_db()
    
    # 1. Get active policies
    policies_cursor = db["policy_configs"].find({"isEnabled": True})
    policies = await policies_cursor.to_list(length=6)
    
    if not policies:
        policies = [
            {"category": cat, "threshold": 70, "enforcement": "Auto-Block"} 
            for cat in CATEGORIES
        ]
    
    # 2. Simulate AI results (Mock)
    category_breakdown = []
    overall_outcome = "Approved"
    
    for cat in CATEGORIES:
        confidence = random.randint(20, 95)
        result = "Detected" if confidence > 60 else "Clean"
        reasoning = f"Mock AI: {result} with {confidence}% confidence"
        
        policy = next((p for p in policies if p["category"] == cat), None)
        
        if policy and result == "Detected" and confidence >= policy.get("threshold", 70):
            if policy.get("enforcement") == "Auto-Block":
                overall_outcome = "Blocked"
            elif policy.get("enforcement") == "Flag-for-Review":
                if overall_outcome != "Blocked":
                    overall_outcome = "Flagged"
        
        category_breakdown.append({
            "category": cat,
            "result": result,
            "confidence": confidence,
            "reasoning": reasoning
        })
    
    # 3. Save Verdict (image_id as string)
    verdict = {
        "image_id": image_id,
        "overall_outcome": overall_outcome,
        "category_breakdown": category_breakdown,
        "generated_at": datetime.utcnow(),
        "policy_snapshot": policies
    }
    await db["verdicts"].insert_one(verdict)
    
    # 4. Update image status (FIX: Convert string id to ObjectId)
    await db["images"].update_one(
        {"_id": ObjectId(image_id)},  # <-- YAHAN FIX
        {"$set": {"verdict_status": overall_outcome}}
    )
    
    # 5. Check if all images in this submission are processed (FIX: Convert string id to ObjectId)
    submission = await db["submissions"].find_one({"_id": ObjectId(submission_id)})  # <-- YAHAN FIX
    
    if submission:
        image_ids = submission.get("image_ids", [])
        # Convert string ids to ObjectId for query
        object_ids = [ObjectId(oid) for oid in image_ids]
        processed_count = await db["images"].count_documents({
            "_id": {"$in": object_ids},
            "verdict_status": {"$ne": "Pending"}
        })
        total_images = len(image_ids)
        
        if processed_count == total_images:
            await db["submissions"].update_one(
                {"_id": ObjectId(submission_id)},  # <-- YAHAN FIX
                {"$set": {"status": "Completed"}}
            )