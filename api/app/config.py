from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field

class Settings(BaseSettings):
    MONGO_URI: str = Field(default="mongodb://localhost:27017/football_prediction")
    JWT_SECRET: str = Field(default="supersecretjwtsecretkeychangeinproduction12345")
    JWT_ALGORITHM: str = Field(default="HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=1440)
    
    DEFAULT_ADMIN_EMAIL: str = Field(default="admin@gmail.com")
    DEFAULT_ADMIN_PASSWORD: str = Field(default="EMP001")
    DEFAULT_ADMIN_NAME: str = Field(default="System Administrator")
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
