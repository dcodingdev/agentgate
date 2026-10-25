"""Request and response schemas for API endpoints."""

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class CreateRunRequest(BaseModel):
    """Payload to initiate an autonomous SWE agent run."""

    issue_url: str = Field(..., description="Target GitHub issue URL", examples=["https://github.com/org/repo/issues/42"])
    repo: str = Field(..., description="Repository in owner/repo format", examples=["org/repo"])
    issue_title: Optional[str] = Field(default="", description="Optional issue title")
    issue_description: Optional[str] = Field(default="", description="Optional issue description or reproduction instructions")


class CreateRunResponse(BaseModel):
    """Response returned upon successful creation of a run."""

    thread_id: str = Field(..., description="Unique thread ID for tracking and streaming")
    status: str = Field(..., description="Initial status of the run")
    stream_url: str = Field(..., description="URL to stream SSE events for this run")


class ResumeBody(BaseModel):
    """Payload to submit Human-In-The-Loop review decisions."""

    approved: bool = Field(..., description="True if change is approved, False to reject or request changes")
    feedback: Optional[str] = Field(default=None, description="Optional revision instructions or comments for the agent")


class ResumeRunResponse(BaseModel):
    """Response returned when a paused run is resumed."""

    thread_id: str = Field(..., description="Thread ID of the resumed run")
    status: str = Field(..., description="Resumed status")
    message: str = Field(..., description="Status description")


class RunStateResponse(BaseModel):
    """Current snapshot of graph state, checkpoint data, and metadata."""

    thread_id: str = Field(..., description="Unique session thread ID")
    status: str = Field(..., description="Current status of the run")
    risk_score: float = Field(default=0.0, description="Evaluated change risk score")
    pr_url: Optional[str] = Field(default=None, description="Created Pull Request URL if completed")
    next_steps: List[str] = Field(default_factory=list, description="Pending graph execution nodes")
    metadata: Optional[Dict[str, Any]] = Field(default=None, description="Database record metadata")
    values: Dict[str, Any] = Field(default_factory=dict, description="Active state variables")


class StreamEvent(BaseModel):
    """Schema representing an individual Server-Sent Event (SSE)."""

    event: str = Field(..., description="Event type: status, node_update, hitl_paused, completed, error")
    data: Dict[str, Any] = Field(..., description="Payload data")
