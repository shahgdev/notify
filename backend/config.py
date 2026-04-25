from pydantic_settings import BaseSettings
import os

class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    OPENAI_API_KEY: str
    GEMINI_API_KEY: str
    S3_BUCKET_NAME: str = "notify-lectures"
    STORAGE_TYPE: str = "local"
    UPLOAD_DIR: str = "./uploads"

    class Config:
        env_file = os.path.join(os.path.dirname(__file__), ".env")

settings = Settings()
