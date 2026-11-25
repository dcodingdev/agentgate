"""Application configuration using Pydantic Settings."""

import json
from functools import lru_cache
from typing import Any, List, Union
# pyrefly: ignore[missing-import]
from pydantic import Field, field_validator
# pyrefly: ignore[missing-import]
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Central configuration for AgentGate backend."""

    model_config = SettingsConfigDict(
        env_file=(".env", "backend/.env"),
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    # Environment & Server settings
    env: str = Field(default="development", alias="ENV")
    fastapi_host: str = Field(default="0.0.0.0", alias="FASTAPI_HOST")
    fastapi_port: int = Field(default=8000, alias="FASTAPI_PORT")
    debug: bool = Field(default=False, alias="DEBUG")

    # CORS Settings (Accepts comma-separated list or JSON array)
    cors_origins: List[str] = Field(default_factory=lambda: ["*"], alias="CORS_ORIGINS")

    # LLM Providers (Active Real Keys)
    gemini_api_key: str = Field(default="", alias="GEMINI_API_KEY")
    grok_api_key: str = Field(default="", alias="GROK_API_KEY")
    model_name: str = Field(default="gemini-flash-3.8", alias="MODEL_NAME")

    # Database & Persistence
    database_url: str = Field(
        default="postgresql://postgres:postgres@localhost:5433/agentgate",
        alias="DATABASE_URL",
    )
    postgres_user: str = Field(default="postgres", alias="POSTGRES_USER")
    postgres_password: str = Field(default="postgres", alias="POSTGRES_PASSWORD")
    postgres_db: str = Field(default="agentgate", alias="POSTGRES_DB")
    postgres_port: int = Field(default=5433, alias="POSTGRES_PORT")

    # Execution Sandbox (E2B)
    e2b_api_key: str = Field(default="", alias="E2B_API_KEY")
    e2b_template: str = Field(default="base", alias="E2B_TEMPLATE")

    # Tool Integrations
    github_token: str = Field(default="", alias="GITHUB_TOKEN")

    # Guardrails & Decision Thresholds
    allowed_repos: List[str] = Field(default_factory=lambda: ["*"], alias="ALLOWED_REPOS")
    max_retries: int = Field(default=3, alias="MAX_RETRIES")
    risk_threshold_high: float = Field(default=0.7, alias="RISK_THRESHOLD_HIGH")
    auto_approve_low_risk: bool = Field(default=False, alias="AUTO_APPROVE_LOW_RISK")

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, v: Any) -> List[str]:
        if isinstance(v, str):
            v = v.strip()
            if v.startswith("[") and v.endswith("]"):
                try:
                    return json.loads(v)
                except Exception:
                    pass
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        if isinstance(v, list):
            return v
        return ["*"]

    @field_validator("allowed_repos", mode="before")
    @classmethod
    def parse_allowed_repos(cls, v: Any) -> List[str]:
        if isinstance(v, str):
            v = v.strip()
            if v.startswith("[") and v.endswith("]"):
                try:
                    return json.loads(v)
                except Exception:
                    pass
            return [repo.strip() for repo in v.split(",") if repo.strip()]
        if isinstance(v, list):
            return v
        return ["*"]

    def is_repo_allowed(self, repo: str) -> bool:
        """Check if repository is allowed by guardrail rules."""
        if "*" in self.allowed_repos:
            return True
        return repo.strip().lower() in [r.strip().lower() for r in self.allowed_repos]


@lru_cache()
def get_settings() -> Settings:
    """Return cached application settings singleton."""
    return Settings()
