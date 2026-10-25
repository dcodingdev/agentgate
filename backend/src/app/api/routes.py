"""API routes: POST /runs, GET /runs/{id}/stream, POST /runs/{id}/resume, GET /runs/{id}/state."""

import logging
from fastapi import APIRouter, HTTPException, status
from fastapi.responses import StreamingResponse

from app.api.schemas import (
    CreateRunRequest,
    CreateRunResponse,
    ResumeBody,
    ResumeRunResponse,
    RunStateResponse,
)
from app.services.agent_service import agent_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/runs", tags=["Runs"])


@router.post(
    "",
    response_model=CreateRunResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create and start a new SWE agent run",
)
async def create_run(request: CreateRunRequest) -> CreateRunResponse:
    """Initialize an autonomous SWE resolution workflow for a GitHub issue."""
    try:
        thread_id = await agent_service.start_run(
            issue_url=request.issue_url,
            repo=request.repo,
            issue_title=request.issue_title or "",
            issue_description=request.issue_description or "",
        )
        return CreateRunResponse(
            thread_id=thread_id,
            status="pending",
            stream_url=f"/runs/{thread_id}/stream",
        )
    except Exception as exc:
        logger.exception("Failed to initialize run: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Unable to start agent run: {exc}",
        )


@router.get(
    "/{run_id}/stream",
    summary="Stream real-time run execution events via SSE",
)
async def stream_run(run_id: str) -> StreamingResponse:
    """Subscribe to Server-Sent Events (SSE) representing agent execution progress."""
    return StreamingResponse(
        agent_service.stream_events(run_id),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.post(
    "/{run_id}/resume",
    response_model=ResumeRunResponse,
    summary="Resume a paused Human-In-The-Loop (HITL) run",
)
async def resume_run(run_id: str, body: ResumeBody) -> ResumeRunResponse:
    """Submit human approval or revision feedback for a paused SWE run."""
    try:
        result = await agent_service.resume_run(
            thread_id=run_id,
            approved=body.approved,
            feedback=body.feedback,
        )
        return ResumeRunResponse(
            thread_id=run_id,
            status=result["status"],
            message="Decision recorded; agent execution resumed.",
        )
    except Exception as exc:
        logger.exception("Failed to resume run %s: %s", run_id, exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Unable to resume run: {exc}",
        )


@router.get(
    "/{run_id}/state",
    response_model=RunStateResponse,
    summary="Get current run state and checkpoint data",
)
async def get_run_state(run_id: str) -> RunStateResponse:
    """Retrieve full checkpoint state, pending graph nodes, and database metadata."""
    state_data = await agent_service.get_run_state(run_id)
    metadata = state_data.get("metadata") or {}

    return RunStateResponse(
        thread_id=run_id,
        status=metadata.get("status", "unknown"),
        risk_score=metadata.get("risk_score", 0.0),
        pr_url=metadata.get("pr_url"),
        next_steps=state_data.get("next_steps", []),
        metadata=metadata,
        values=state_data.get("values", {}),
    )
