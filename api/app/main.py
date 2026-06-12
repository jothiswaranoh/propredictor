import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import connect_to_mongo, close_mongo_connection
from app.exceptions import register_exception_handlers
from app.routers import auth, user, admin

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup actions
    logger.info("Initializing application resources...")
    await connect_to_mongo()
    yield
    # Shutdown actions
    logger.info("Cleaning up application resources...")
    await close_mongo_connection()

app = FastAPI(
    title="Football Match Prediction API",
    description="Production-ready FastAPI backend for Football Match Prediction system.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware for development compatibility with React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust this in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Exception handlers
register_exception_handlers(app)

# Include routers
app.include_router(auth.router)
app.include_router(user.router)
app.include_router(admin.router)

@app.get("/health", tags=["Health"])
async def health_check():
    """
    Health check endpoint for container environments.
    """
    return {"status": "healthy"}
