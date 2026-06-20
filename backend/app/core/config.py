import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    # MongoDB
    MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
    DB_NAME = os.getenv("DB_NAME", "moderation_db")
    
    # JWT
    SECRET_KEY = os.getenv("SECRET_KEY", "your-super-secret-key-change-this")
    ALGORITHM = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 1 day
    
    # Redis (for Queue)
    REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")

settings = Settings()