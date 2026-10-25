"""Agent service: orchestrates run lifecycles, event streaming, and HITL resumption."""

import asyncio
import json
import logging
import uuid
from typing import Any, AsyncGenerator, Dict, Optional

from app.agents.graph import get_graph
from app.agents.state import SWEState
from app.database.connection import get_run_metadata, save_run_metadata
from app.database.models import RunMetadata

logger = logging.getLogger(__name__)


class AgentService:
    """Service layer managing LangGraph SWE runs, persistence, and SSE event dispatch."""

    def __init__(self) -> None:
        self.active_tasks: Dict[str, asyncio.Task] = {}
        self.event_queues: Dict[str, asyncio.Queue] = {}

    def _get_or_create_queue(self, thread_id: str) -> asyncio.Queue:
        if thread_id not in self.event_queues:
            self.event_queues[thread_id] = asyncio.Queue()
        return self.event_queues[thread_id]

    async def start_run(
        self,
        issue_url: str,
        repo: str,
        issue_title: str = "",
        issue_description: str = "",
    ) -> str:
        """Initialize a new SWE agent run and start asynchronous graph execution."""
        thread_id = f"run_{uuid.uuid4().hex[:12]}"
        logger.info("Starting run %s for repo %s and issue %s", thread_id, repo, issue_url)

        # 1. Record metadata in database
        metadata = RunMetadata(
            thread_id=thread_id,
            issue_url=issue_url,
            repo=repo,
            status="pending",
        )
        await save_run_metadata(metadata)

        # 2. Build initial state
        initial_state: SWEState = {
            "thread_id": thread_id,
            "issue_url": issue_url,
            "repo": repo,
            "issue_title": issue_title or "Resolve GitHub Issue",
            "issue_description": issue_description or "Autonomous bug resolution request",
            "test_attempts": 0,
            "max_test_attempts": 3,
            "risk_score": 0.0,
            "risk_reasons": [],
            "status": "running",
            "hitl_approved": None,
            "hitl_feedback": None,
            "messages": [],
        }

        # 3. Launch background execution task
        task = asyncio.create_task(self._execute_graph(thread_id, initial_state))
        self.active_tasks[thread_id] = task

        return thread_id

    async def _execute_graph(
        self, thread_id: str, state_input: Optional[Dict[str, Any]] = None
    ) -> None:
        """Execute or resume graph, pushing stream events to listeners."""
        graph = get_graph()
        config = {"configurable": {"thread_id": thread_id}}
        queue = self._get_or_create_queue(thread_id)

        try:
            metadata = await get_run_metadata(thread_id)
            if metadata:
                metadata.status = "running"
                await save_run_metadata(metadata)

            await queue.put({"event": "status", "data": {"status": "running", "thread_id": thread_id}})

            # Stream graph updates node by node
            async for chunk in graph.astream(state_input, config=config, stream_mode="updates"):
                for node_name, update in chunk.items():
                    event_payload = {
                        "event": "node_update",
                        "data": {
                            "node": node_name,
                            "thread_id": thread_id,
                            "status": update.get("status", "running"),
                            "risk_score": update.get("risk_score"),
                            "pr_url": update.get("pr_url"),
                            "message": str(update.get("messages", [""])[-1]) if update.get("messages") else "",
                        },
                    }
                    await queue.put(event_payload)

            # Check snapshot after stream finishes or pauses
            snapshot = await graph.aget_state(config)
            next_nodes = snapshot.next
            final_values = snapshot.values

            updated_metadata = await get_run_metadata(thread_id)
            if updated_metadata:
                if "hitl" in next_nodes or final_values.get("status") == "paused_hitl":
                    updated_metadata.status = "paused_hitl"
                    await queue.put({"event": "hitl_paused", "data": {"thread_id": thread_id, "risk_score": final_values.get("risk_score")}})
                elif final_values.get("status") == "completed" or final_values.get("pr_url"):
                    updated_metadata.status = "completed"
                    updated_metadata.pr_url = final_values.get("pr_url")
                    await queue.put({"event": "completed", "data": {"thread_id": thread_id, "pr_url": final_values.get("pr_url")}})
                elif final_values.get("status") == "rejected":
                    updated_metadata.status = "rejected"
                    await queue.put({"event": "rejected", "data": {"thread_id": thread_id, "reason": final_values.get("guardrail_reason")}})
                else:
                    updated_metadata.status = final_values.get("status", "completed")

                if final_values.get("risk_score") is not None:
                    updated_metadata.risk_score = final_values.get("risk_score")

                await save_run_metadata(updated_metadata)

            await queue.put({"event": "done", "data": {"thread_id": thread_id}})

        except Exception as exc:
            logger.exception("Error executing graph for thread %s: %s", thread_id, exc)
            err_metadata = await get_run_metadata(thread_id)
            if err_metadata:
                err_metadata.status = "failed"
                err_metadata.error_message = str(exc)
                await save_run_metadata(err_metadata)
            await queue.put({"event": "error", "data": {"error": str(exc), "thread_id": thread_id}})

    async def stream_events(self, thread_id: str) -> AsyncGenerator[str, None]:
        """Yield Server-Sent Events (SSE) for the specified run."""
        queue = self._get_or_create_queue(thread_id)

        while True:
            item = await queue.get()
            event_type = item.get("event", "message")
            data_content = json.dumps(item.get("data", {}))
            yield f"event: {event_type}\ndata: {data_content}\n\n"

            if event_type in ("done", "error"):
                break

    async def resume_run(
        self, thread_id: str, approved: bool, feedback: Optional[str] = None
    ) -> Dict[str, Any]:
        """Resume a paused HITL run with approval decision and feedback."""
        logger.info("Resuming run %s: approved=%s, feedback=%s", thread_id, approved, feedback)
        graph = get_graph()
        config = {"configurable": {"thread_id": thread_id}}

        # Update state directly via graph.aupdate_state
        state_update: Dict[str, Any] = {
            "hitl_approved": approved,
            "hitl_feedback": feedback,
            "status": "running" if approved else ("fix_test" if feedback else "rejected"),
        }
        await graph.aupdate_state(config, state_update, as_node="hitl")

        # Resume execution in background
        task = asyncio.create_task(self._execute_graph(thread_id, None))
        self.active_tasks[thread_id] = task

        return {"status": "resumed", "thread_id": thread_id, "approved": approved}

    async def get_run_state(self, thread_id: str) -> Dict[str, Any]:
        """Fetch current checkpoint state, next steps, and database metadata."""
        graph = get_graph()
        config = {"configurable": {"thread_id": thread_id}}
        metadata = await get_run_metadata(thread_id)

        try:
            snapshot = await graph.aget_state(config)
            values = snapshot.values if snapshot else {}
            next_steps = list(snapshot.next) if snapshot else []
        except Exception:
            values = {}
            next_steps = []

        return {
            "thread_id": thread_id,
            "metadata": metadata.model_dump() if metadata else None,
            "next_steps": next_steps,
            "values": {
                k: v for k, v in values.items() if k not in ("messages",)
            },
        }


# Singleton service instance
agent_service = AgentService()
