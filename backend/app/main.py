from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .core.database import connect_to_mongo, close_mongo_connection
from .routers import auth, submissions  # <-- Yeh line dono routers import kar rahi hai

app = FastAPI(
    title="Content Moderation Platform",
    description="AI-powered Full-Stack Moderation System",
    version="1.0.0"
)

# CORS (React frontend ko allow karne ke liye)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Lifespan Events (Startup/Shutdown)
@app.on_event("startup")
async def startup_db_client():
    await connect_to_mongo()

@app.on_event("shutdown")
async def shutdown_db_client():
    await close_mongo_connection()

# ---------- SAB ROUTERS YAHAN REGISTER HONGE ----------
app.include_router(auth.router, prefix="/api")
app.include_router(submissions.router, prefix="/api")  # <-- Image upload wala router

# ---------- Health Check Routes (Public) ----------
@app.get("/api/health")
async def health_check():
    return {"status": "OK", "message": "Backend is running!"}

@app.get("/")
async def root():
    return {"message": "Welcome to Content Moderation Platform API"}