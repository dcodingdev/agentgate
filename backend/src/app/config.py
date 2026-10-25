"""Application configuration using Pydantic Settings."""

from functools import lru_cache
from typing import List
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Central configuration for AgentGate backend."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    # Server settings
    fastapi_host: str = Field(default="0.0.0.0", alias="FASTAPI_HOST")
    fastapi_port: int = Field(default=8000, alias="FASTAPI_PORT")
    debug: bool = Field(default=False, alias="DEBUG")

    # LLM Providers
    openai_api_key: str = Field(default="", alias="OPENAI_API_KEY")
    anthropic_api_key: str = Field(default="", alias="ANTHROPIC_API_KEY")
    model_name: str = Field(default="gpt-4o", alias="MODEL_NAME")

    # Database & Persistence
    database_url: str = Field(
        default="postgresql://postgres:postgres@localhost:5432/agentgate",
        alias="DATABASE_URL",
    )
    postgres_user: str = Field(default="postgres", alias="POSTGRES_USER")
    postgres_password: str = Field(default="postgres", alias="POSTGRES_PASSWORD")
    postgres_db: str = Field(default="agentgate", alias="POSTGRES_DB")
    postgres_port: int = Field(default=5432, alias="POSTGRES_PORT")

    # Execution Sandbox (E2B)
    e2b_api_key: str = Field(default="", alias="E2B_API_KEY")
    e2b_template: str = Field(default="base", alias="E2B_TEMPLATE")

    # Tool Integrations
    github_token: str = Field(default="", alias="GITHUB_TOKEN")
    tavily_api_key: str = Field(default="", alias="TAVILY_API_KEY")

    # Guardrails & Decision Thresholds
    allowed_repos: List[str] = Field(default_factory=lambda: ["*"], alias="ALLOWED_REPOS")
    risk_threshold_high: float = Field(default=0.7, alias="RISK_THRESHOLD_HIGH")
    auto_approve_low_risk: bool = Field(default=False, alias="AUTO_APPROVE_LOW_RISK")

    def is_repo_allowed(self, repo: str) -> bool:
        """Check if repository is allowed by guardrail rules."""
        if "*" in self.allowed_repos:
            return True
        return repo.strip().lower() in [r.strip().lower() for r in self.allowed_repos]


@lru_cache()
def get_settings() -> Settings:
    """Return cached application settings singleton."""
    return Settings()
