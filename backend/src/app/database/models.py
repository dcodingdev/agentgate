"""Run metadata model and database schemas."""

from datetime import datetime, timezone
from typing import Optional
from pydantic import BaseModel, Field


CREATE_RUN_METADATA_TABLE = """
CREATE TABLE IF NOT EXISTS run_metadata (
    thread_id VARCHAR(64) PRIMARY KEY,
    issue_url TEXT NOT NULL,
    repo VARCHAR(255) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'pending',
    risk_score FLOAT DEFAULT 0.0,
    pr_url TEXT,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_run_metadata_repo ON run_metadata(repo);
CREATE INDEX IF NOT EXISTS idx_run_metadata_status ON run_metadata(status);
"""


class RunMetadata(BaseModel):
    """Run metadata record representing a SWE agent session."""

    thread_id: str = Field(description="Unique session/thread identifier")
    issue_url: str = Field(description="GitHub issue target URL")
    repo: str = Field(description="Target repository (owner/repo)")
    status: str = Field(
        default="pending",
        description="Run status: pending, running, paused_hitl, completed, failed, rejected",
    )
    risk_score: float = Field(default=0.0, description="Evaluated risk score (0.0 to 1.0)")
    pr_url: Optional[str] = Field(default=None, description="Created Pull Request URL")
    error_message: Optional[str] = Field(default=None, description="Failure reason if applicable")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
