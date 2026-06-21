import random
from datetime import datetime
from bson import ObjectId
from app.core.database import get_db

# ---------- REAL AI IMPLEMENTATION ----------
from transformers import pipeline
from PIL import Image
import os

# 1. Load the AI Model (CLIP) - Sirf pehli baar download hoga
try:
    classifier = pipeline("zero-shot-image-classification", 
                          model="openai/clip-vit-base-patch32", 
                          device=-1)  # -1 means CPU (0 means GPU)
    print("✅ CLIP AI Model loaded successfully!")
except Exception as e:
    print(f"⚠️ Error loading CLIP: {e}")
    print("Falling back to Mock AI...")
    classifier = None

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
    REAL AI SCREENING using CLIP (Zero-Shot Image Classification).
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
    
    # 2. Check if AI model is available
    global classifier
    if classifier is None:
        # Fallback to Mock if CLIP failed to load
        return await _run_mock_fallback(submission_id, image_id, image_path, policies, db)
    
    try:
        # 3. Open the image
        image = Image.open(image_path)
        
        # 4. Prepare labels for CLIP (lowercase)
        candidate_labels = [cat.lower() for cat in CATEGORIES]
        # Add negative prompts for better accuracy (optional)
        # candidate_labels = [f"a photo of {cat}" for cat in candidate_labels] 
        # But simple works best for CLIP
        
        # 5. Get predictions from Real AI
        results = classifier(image, candidate_labels)
        
        # 6. Build category breakdown
        category_breakdown = []
        overall_outcome = "Approved"
        
        for idx, cat in enumerate(CATEGORIES):
            # Find the score for this category
            score = 0
            for res in results:
                if res['label'] == cat.lower():
                    score = res['score'] * 100  # Convert to percentage
                    break
            
            # Determine if detected
            confidence = round(score, 2)
            result = "Detected" if confidence > 20 else "Clean"  # Lower threshold for detection
            reasoning = f"CLIP AI: {result} with {confidence}% confidence"
            
            # Find policy for this category
            policy = next((p for p in policies if p["category"] == cat), None)
            
            # Determine outcome based on policy
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
        
        # 7. Save Verdict
        verdict = {
            "image_id": image_id,
            "overall_outcome": overall_outcome,
            "category_breakdown": category_breakdown,
            "generated_at": datetime.utcnow(),
            "policy_snapshot": policies,
            "ai_model": "CLIP (OpenAI)"
        }
        await db["verdicts"].insert_one(verdict)
        
        # 8. Update image status
        await db["images"].update_one(
            {"_id": ObjectId(image_id)},
            {"$set": {"verdict_status": overall_outcome}}
        )
        
        # 9. Check if all images in this submission are processed
        submission = await db["submissions"].find_one({"_id": ObjectId(submission_id)})
        if submission:
            image_ids = submission.get("image_ids", [])
            object_ids = [ObjectId(oid) for oid in image_ids]
            processed_count = await db["images"].count_documents({
                "_id": {"$in": object_ids},
                "verdict_status": {"$ne": "Pending"}
            })
            total_images = len(image_ids)
            
            if processed_count == total_images:
                await db["submissions"].update_one(
                    {"_id": ObjectId(submission_id)},
                    {"$set": {"status": "Completed"}}
                )
                
    except Exception as e:
        print(f"🔥 CLIP AI Error: {e}. Falling back to Mock AI.")
        # Fallback to Mock if AI crashes
        return await _run_mock_fallback(submission_id, image_id, image_path, policies, db)


# ---------- MOCK FALLBACK (Agar AI Load na ho) ----------
async def _run_mock_fallback(submission_id, image_id, image_path, policies, db):
    """Fallback to Mock Random AI if CLIP fails."""
    print("⚠️ Using MOCK AI (Fallback mode)")
    category_breakdown = []
    overall_outcome = "Approved"
    
    for cat in CATEGORIES:
        confidence = random.randint(20, 95)
        result = "Detected" if confidence > 60 else "Clean"
        reasoning = f"Mock AI (Fallback): {result} with {confidence}% confidence"
        
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
    
    verdict = {
        "image_id": image_id,
        "overall_outcome": overall_outcome,
        "category_breakdown": category_breakdown,
        "generated_at": datetime.utcnow(),
        "policy_snapshot": policies,
        "ai_model": "Mock (Fallback)"
    }
    await db["verdicts"].insert_one(verdict)
    await db["images"].update_one(
        {"_id": ObjectId(image_id)},
        {"$set": {"verdict_status": overall_outcome}}
    )
    submission = await db["submissions"].find_one({"_id": ObjectId(submission_id)})
    if submission:
        image_ids = submission.get("image_ids", [])
        object_ids = [ObjectId(oid) for oid in image_ids]
        processed_count = await db["images"].count_documents({
            "_id": {"$in": object_ids},
            "verdict_status": {"$ne": "Pending"}
        })
        if processed_count == len(image_ids):
            await db["submissions"].update_one(
                {"_id": ObjectId(submission_id)},
                {"$set": {"status": "Completed"}}
            )