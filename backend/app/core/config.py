from pydantic_settings import BaseSettings
from typing import List, Union, Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "Hive CI/CD"
    API_V1_STR: str = "/api/v1"
    BACKEND_CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:8000"]
    
    # Database
    DATABASE_URL: str = "postgresql://hive:hivepassword@localhost:5432/hive_db"
    
    # Auth
    SECRET_KEY: str = "default_insecure_secret_key_for_development"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # Redis / Queue
    REDIS_URL: Optional[str] = "redis://localhost:6379/0"

    class Config:
        env_file = ".env"
        # Don't error if .env file is missing
        env_file_encoding = 'utf-8'

settings = Settings()
