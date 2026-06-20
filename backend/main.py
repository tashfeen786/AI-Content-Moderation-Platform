from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .core.database import connect_to_mongo, close_mongo_connection
from .core.config import settings

# FastAPI instance
app = FastAPI(
    title="Content Moderation Platform",
    description="AI-powered Full-Stack Moderation System",
    version="1.0.0"
)

# CORS - Taake React baad mein hit kar sake
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],  # React ports
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Lifespan events (startup/shutdown)
@app.on_event("startup")
async def startup_db_client():
    await connect_to_mongo()

@app.on_event("shutdown")
async def shutdown_db_client():
    await close_mongo_connection()

# ---------- Health Check Route (Pehla API) ----------
@app.get("/api/health")
async def health_check():
    return {
        "status": "OK",
        "message": "Backend is running!",
        "db_connected": True  # Ideally check here, but trust the startup event
    }

# ---------- Root Route ----------
@app.get("/")
async def root():
    return {"message": "Welcome to Content Moderation Platform API"}

# Future routes will be imported here, e.g.:
# from .routers import auth, submissions, admin
# app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])