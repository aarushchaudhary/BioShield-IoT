import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy.sql import text

from app.config import settings
from app.database import get_db, SessionLocal
from app.redis_client import get_redis
from app.routers import auth, biometric, users, audit, stats, device

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events."""
    logger.info("Initializing BioShield IoT API...")
    
    # Ping Database
    try:
        db = SessionLocal()
        db.execute(text("SELECT 1"))
        db.close()
        logger.info("Successfully connected to PostgreSQL")
    except Exception as e:
        logger.error(f"Failed connecting to PostgreSQL: {e}")
        
    # Ping Redis
    try:
        r = get_redis()
        if r.ping():
            logger.info("Successfully connected to Redis")
    except Exception as e:
        logger.error(f"Failed connecting to Redis: {e}")
        
    yield
    
    logger.info("BioShield IoT API shutting down.")


app = FastAPI(
    title="BioShield IoT API",
    version="1.0.0",
    description="Cancellable Fingerprint Biometrics Management System",
    lifespan=lifespan
)

# CORS Configuration
cors_origins = settings.cors_origins_list
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins if cors_origins != ["*"] else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Route Attachment
app.include_router(auth.router)
app.include_router(biometric.router)
app.include_router(users.router)
app.include_router(audit.router)
app.include_router(stats.router)
app.include_router(device.router)

@app.get("/health", tags=["Health"])
def health_check():
    """Simple up-time health ping."""
    return {"status": "ok", "environment": settings.ENVIRONMENT}
