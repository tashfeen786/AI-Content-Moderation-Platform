from fastapi import APIRouter, HTTPException, status
from datetime import timedelta
from app.schemas.auth import UserRegister, UserLogin, Token, UserResponse
from app.models.user import UserInDB
from app.utils.security import hash_password, verify_password, create_access_token
from app.core.database import get_db
from app.core.config import settings

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=Token)
async def register(user_data: UserRegister):
    db = get_db()
    users_collection = db["users"]
    
    # 1. Check if user already exists
    existing_user = await users_collection.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # 2. Hash password and create user dict
    hashed_pw = hash_password(user_data.password)
    new_user = UserInDB(
        name=user_data.name,
        email=user_data.email,
        hashed_password=hashed_pw,
        role="user"  # Default
    )
    
    # 3. Insert into MongoDB
    result = await users_collection.insert_one(new_user.model_dump())
    
    # 4. Create JWT token
    access_token = create_access_token(
        data={"sub": user_data.email, "role": "user"}
    )
    
    # 5. Return token + user info
    return Token(
        access_token=access_token,
        user=UserResponse(
            id=str(result.inserted_id),
            name=user_data.name,
            email=user_data.email,
            role="user"
        )
    )

@router.post("/login", response_model=Token)
async def login(user_data: UserLogin):
    db = get_db()
    users_collection = db["users"]
    
    # 1. Find user by email
    db_user = await users_collection.find_one({"email": user_data.email})
    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )
    
    # 2. Verify password
    if not verify_password(user_data.password, db_user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )
    
    # 3. Create JWT token
    access_token = create_access_token(
        data={"sub": db_user["email"], "role": db_user["role"]}
    )
    
    # 4. Return token + user info
    return Token(
        access_token=access_token,
        user=UserResponse(
            id=str(db_user["_id"]),
            name=db_user["name"],
            email=db_user["email"],
            role=db_user["role"]
        )
    )