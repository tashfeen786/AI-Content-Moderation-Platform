import random
from datetime import datetime
from app.core.database import get_db

# 6 Categories as per requirement
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
    In real scenario, this would call a HuggingFace model or external API.
    """
    db = get_db()
    
    # 1. Get current active policies
    policies_cursor = db["policy_configs"].find({"isEnabled": True})
    policies = await policies_cursor.to_list(length=6)
    
    # If no policies configured, use defaults
    if not policies:
        policies = [
            {"category": cat, "threshold": 70, "enforcement": "Auto-Block"} 
            for cat in CATEGORIES
        ]
    
    # 2. Simulate AI results (Mock)
    category_breakdown = []
    overall_outcome = "Approved"  # Assume clean initially
    
    for cat in CATEGORIES:
        # Random confidence (for mock)
        confidence = random.randint(20, 95)
        result = "Detected" if confidence > 60 else "Clean"
        reasoning = f"Mock AI: {result} with {confidence}% confidence"
        
        # Find policy for this category
        policy = next((p for p in policies if p["category"] == cat), None)
        
        # Determine outcome based on policy
        if policy and result == "Detected" and confidence >= policy.get("threshold", 70):
            if policy.get("enforcement") == "Auto-Block":
                overall_outcome = "Blocked"
            elif policy.get("enforcement") == "Flag-for-Review":
                # Agar pehle se Blocked nahi hai toh Flag karo
                if overall_outcome != "Blocked":
                    overall_outcome = "Flagged"
        
        category_breakdown.append({
            "category": cat,
            "result": result,
            "confidence": confidence,
            "reasoning": reasoning
        })
    
    # 3. Save Verdict
    verdict = {
        "image_id": image_id,
        "overall_outcome": overall_outcome,
        "category_breakdown": category_breakdown,
        "generated_at": datetime.utcnow(),
        "policy_snapshot": policies  # Saving snapshot of active policies
    }
    
    await db["verdicts"].insert_one(verdict)
    
    # 4. Update image status
    await db["images"].update_one(
        {"_id": image_id},
        {"$set": {"verdict_status": overall_outcome}}
    )
    
    # 5. Check if all images in this submission are processed
    submission = await db["submissions"].find_one({"_id": submission_id})
    if submission:
        image_ids = submission.get("image_ids", [])
        # Count how many have verdict status (not "Pending")
        processed_count = await db["images"].count_documents({
            "_id": {"$in": image_ids},
            "verdict_status": {"$ne": "Pending"}
        })
        total_images = len(image_ids)
        
        # If all processed, update submission status
        if processed_count == total_images:
            await db["submissions"].update_one(
                {"_id": submission_id},
                {"$set": {"status": "Completed"}}
            )