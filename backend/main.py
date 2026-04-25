from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
import uvicorn
import logging
from fastapi.staticfiles import StaticFiles

try:
    from backend.database import engine, Base
    from backend.routes import lecture
    from backend.models import user_lecture
    from backend.config import settings
except ImportError:
    from database import engine, Base
    from routes import lecture
    from models import user_lecture
    from config import settings

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create tables
try:
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables created successfully.")
except Exception as e:
    logger.error(f"Error creating database tables: {e}")

app = FastAPI(title="Notify API")

# Ensure upload directory exists
if not os.path.exists(settings.UPLOAD_DIR):
    os.makedirs(settings.UPLOAD_DIR)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

try:
    from backend.routes import lecture, subject
except ImportError:
    from routes import lecture, subject

app.include_router(lecture.router)
app.include_router(subject.router)

@app.get("/")
async def root():
    return {"message": "Notify AI Lecture Recorder API"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8099)
