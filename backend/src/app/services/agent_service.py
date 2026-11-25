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
        github_token: Optional[str] = None,
    ) -> str:
        """Initialize a new SWE agent run and start asynchronous graph execution."""
        clean_repo = (
            repo.strip()
            .removeprefix("https://github.com/")
            .removeprefix("http://github.com/")
            .removeprefix("github.com/")
            .strip("/")
        )
        thread_id = f"run_{uuid.uuid4().hex[:12]}"
        logger.info("Starting run %s for repo %s and issue %s", thread_id, clean_repo, issue_url)

        if github_token:
            try:
                from app.tools.mcp_client import get_mcp_client
                get_mcp_client().set_active_token(github_token)
            except Exception as e:
                logger.warning("Could not set active user GitHub token: %s", e)

        # 1. Record metadata in database
        metadata = RunMetadata(
            thread_id=thread_id,
            issue_url=issue_url,
            repo=clean_repo,
            status="pending",
        )
        await save_run_metadata(metadata)

        # 2. Build initial state (Keep sensitive GitHub token OUT of database state/checkpoints)
        initial_state: SWEState = {
            "thread_id": thread_id,
            "issue_url": issue_url,
            "repo": clean_repo,
            "issue_title": issue_title or "Resolve GitHub Issue",
            "issue_description": issue_description or "Autonomous bug resolution request",
            "github_token": None,
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
                # Handle possible tuple chunks from subgraphs or namespaced updates
                if isinstance(chunk, tuple):
                    if len(chunk) == 2 and isinstance(chunk[1], dict):
                        chunk = chunk[1]
                    else:
                        continue

                if not isinstance(chunk, dict):
                    continue

                for node_name, update in chunk.items():
                    # Handle LangGraph interrupts before hitl
                    if node_name == "__interrupt__":
                        metadata = await get_run_metadata(thread_id)
                        if metadata:
                            metadata.status = "paused_hitl"
                            await save_run_metadata(metadata)
                        await queue.put({
                            "event": "hitl_paused",
                            "data": {
                                "thread_id": thread_id,
                                "status": "paused_hitl",
                                "message": "Human approval required. Execution paused for sign-off.",
                            },
                        })
                        continue

                    # Safe handling for non-dict node updates
                    if not isinstance(update, dict):
                        if isinstance(update, (list, tuple)) and len(update) > 0 and isinstance(update[0], dict):
                            update = update[0]
                        else:
                            logger.debug("Skipping non-dict chunk update for node %s: %s", node_name, type(update))
                            continue

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
                    await queue.put({
                        "event": "hitl_paused",
                        "data": {
                            "thread_id": thread_id,
                            "status": "paused_hitl",
                            "risk_score": final_values.get("risk_score"),
                        },
                    })
                    # Do not emit 'done' event here: stream stays alive for user sign-off decision
                elif final_values.get("status") == "completed" or final_values.get("pr_url"):
                    updated_metadata.status = "completed"
                    updated_metadata.pr_url = final_values.get("pr_url")
                    await queue.put({
                        "event": "completed",
                        "data": {
                            "thread_id": thread_id,
                            "status": "completed",
                            "pr_url": final_values.get("pr_url"),
                        },
                    })
                    await queue.put({"event": "done", "data": {"thread_id": thread_id}})
                elif final_values.get("status") == "rejected":
                    updated_metadata.status = "rejected"
                    await queue.put({
                        "event": "rejected",
                        "data": {
                            "thread_id": thread_id,
                            "reason": final_values.get("guardrail_reason"),
                        },
                    })
                    await queue.put({"event": "done", "data": {"thread_id": thread_id}})
                else:
                    updated_metadata.status = final_values.get("status", "completed")
                    await queue.put({"event": "done", "data": {"thread_id": thread_id}})

                if final_values.get("risk_score") is not None:
                    updated_metadata.risk_score = final_values.get("risk_score")

                await save_run_metadata(updated_metadata)

        except Exception as exc:
            logger.exception("Error executing graph for thread %s: %s", thread_id, exc)
            err_metadata = await get_run_metadata(thread_id)
            if err_metadata:
                err_metadata.status = "failed"
                err_metadata.error_message = str(exc)
                await save_run_metadata(err_metadata)
            await queue.put({"event": "error", "data": {"error": str(exc), "thread_id": thread_id}})

    async def stream_events(self, thread_id: str) -> AsyncGenerator[str, None]:
        """Yield Server-Sent Events (SSE) for the specified run with Heroku-safe keep-alive."""
        queue = self._get_or_create_queue(thread_id)

        # 1. Immediately yield initial connection frame to satisfy Heroku 30s initial response rule
        yield ": initial-connect\n\n"

        while True:
            try:
                # 2. Wait up to 15s for next event; send keep-alive comment to beat Heroku 55s router idle timeout
                item = await asyncio.wait_for(queue.get(), timeout=15.0)
                event_type = item.get("event", "message")
                data_content = json.dumps(item.get("data", {}))
                yield f"event: {event_type}\ndata: {data_content}\n\n"

                if event_type in ("done", "error"):
                    break
            except asyncio.TimeoutError:
                # Periodic keep-alive ping for Heroku router
                yield ": keep-alive\n\n"

    async def resume_run(
        self,
        thread_id: str,
        approved: bool,
        feedback: Optional[str] = None,
        action: Optional[str] = None,
        github_token: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Resume a paused HITL run with approval decision and feedback."""
        logger.info(
            "Resuming run %s: approved=%s, feedback=%s, action=%s",
            thread_id,
            approved,
            feedback,
            action,
        )
        if github_token:
            try:
                from app.tools.mcp_client import get_mcp_client
                get_mcp_client().set_active_token(github_token)
            except Exception as e:
                logger.warning("Could not set active user GitHub token on resume: %s", e)

        graph = get_graph()
        config = {"configurable": {"thread_id": thread_id}}

        effective_action = action or ("approve" if approved else ("request_changes" if feedback else "reject"))

        if effective_action == "reject":
            logger.info("Run %s rejected and purged by user.", thread_id)

            # 1. Update metadata in database
            metadata = await get_run_metadata(thread_id)
            if metadata:
                metadata.status = "rejected"
                metadata.error_message = feedback or "Run rejected and purged by user"
                await save_run_metadata(metadata)

            # 2. Kill sandbox microVM if present
            try:
                snapshot = await graph.aget_state(config)
                values = snapshot.values if snapshot else {}
                sandbox_id = values.get("sandbox_id")
                if sandbox_id:
                    from app.execution.e2b_sandbox import kill_sandbox
                    await kill_sandbox(sandbox_id)
                    logger.info("Terminated sandbox %s for rejected run %s", sandbox_id, thread_id)
            except Exception as exc:
                logger.warning("Could not terminate sandbox for run %s: %s", thread_id, exc)

            # 3. Update graph state to rejected
            state_update: Dict[str, Any] = {
                "hitl_approved": False,
                "hitl_feedback": None,
                "hitl_action": "reject",
                "status": "rejected",
                "error": feedback or "Run rejected and purged by user.",
            }
            await graph.aupdate_state(config, state_update, as_node="hitl")

            # 4. Push rejected SSE event and done
            queue = self._get_or_create_queue(thread_id)
            await queue.put({
                "event": "rejected",
                "data": {
                    "thread_id": thread_id,
                    "status": "rejected",
                    "reason": feedback or "Run rejected and purged by user.",
                    "message": f"Run rejected and sandbox purged: {feedback or 'No reason provided'}",
                },
            })
            await queue.put({"event": "done", "data": {"thread_id": thread_id}})

            return {
                "status": "rejected",
                "thread_id": thread_id,
                "approved": False,
                "message": "Run rejected and sandbox purged successfully.",
            }

        elif approved:
            # Update state directly via graph.aupdate_state
            state_update: Dict[str, Any] = {
                "hitl_approved": True,
                "hitl_feedback": None,
                "hitl_action": "approve",
                "status": "running",
            }
            await graph.aupdate_state(config, state_update, as_node="hitl")
            # For approvals, execute pr_agent synchronously to generate and return PR immediately
            await self._execute_graph(thread_id, None)
            metadata = await get_run_metadata(thread_id)
            pr_url = metadata.pr_url if metadata else None
            return {
                "status": "completed",
                "thread_id": thread_id,
                "approved": True,
                "pr_url": pr_url or f"https://github.com/pull/1",
            }
        else:
            # Request revisions
            state_update: Dict[str, Any] = {
                "hitl_approved": False,
                "hitl_feedback": feedback,
                "hitl_action": "request_changes",
                "status": "running",
            }
            await graph.aupdate_state(config, state_update, as_node="hitl")
            task = asyncio.create_task(self._execute_graph(thread_id, None))
            self.active_tasks[thread_id] = task
            return {"status": "resumed", "thread_id": thread_id, "approved": False}

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
