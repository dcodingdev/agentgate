"""Pure Python conditional routing functions for StateGraph edge transitions."""

import logging
from typing import List, Optional, Union
# pyrefly: ignore[missing-import]
from langgraph.graph import END
# pyrefly: ignore[missing-import]
from langgraph.types import Send
from app.agents.state import SWEState
from app.config import get_settings

logger = logging.getLogger(__name__)


def route_after_guardrail(state: SWEState) -> str:
    """Route after guardrail check: proceed to supervisor if approved, else abort."""
    if state.get("guardrail_passed", False):
        logger.info("Guardrail check passed. Routing to supervisor.")
        return "supervisor"

    logger.warning("Guardrail check failed: %s. Routing to END.", state.get("guardrail_reason"))
    return END


def route_after_supervisor(state: SWEState) -> Union[str, List[Send]]:
    """Route based on supervisor strategic judgment (hybrid decision-making).

    When research is required, fans out in parallel using LangGraph Send:
    - issue_analysis: examines issue context, stack traces, and GitHub discussion
    - code_search: searches codebase for candidate symbols and files
    - docs_lookup: retrieves architecture guidelines and documentation
    """
    decision = state.get("supervisor_decision")
    logger.info("Evaluating supervisor strategic decision: %s", decision)

    if decision == "escalate_to_human":
        logger.info("Supervisor decided early escalation to human. Routing to hitl.")
        return "hitl"

    if decision == "reviewer":
        logger.info("Supervisor decided code is verified. Routing to reviewer.")
        return "reviewer"

    if decision == "fix_test":
        logger.info("Supervisor decided to apply patch. Routing to fix_test.")
        return "fix_test"

    if decision == "research" or not state.get("research_findings"):
        logger.info(
            "Supervisor requested research. Dispatching parallel workers via Send "
            "(issue_analysis, code_search, docs_lookup)."
        )
        return [
            Send("issue_analysis", state),
            Send("code_search", state),
            Send("docs_lookup", state),
        ]

    return "fix_test"


def route_after_verify(state: SWEState) -> str:
    """Route after test verification: code enforces retry cap, supervisor decides retries."""
    test_results = state.get("test_results") or {}
    status = test_results.get("status", "failed")
    attempts = state.get("test_attempts", 1)
    max_attempts = state.get("max_test_attempts", 3)

    if status == "passed":
        logger.info("Tests verified successfully. Routing to reviewer.")
        return "reviewer"

    # HARD CODE ENFORCEMENT: Max retry cap exceeded -> immediate HITL escalation
    if attempts >= max_attempts:
        logger.warning(
            "Tests failed after %d attempts (max %d). Hard code guard: Escalating to hitl.",
            attempts,
            max_attempts,
        )
        return "hitl"

    logger.info(
        "Tests failed (attempt %d of %d). Routing to supervisor for adaptive decision.",
        attempts,
        max_attempts,
    )
    return "supervisor"


def route_after_reviewer(state: SWEState, risk_threshold: Optional[float] = None) -> str:
    """Route after review: if risk exceeds threshold or hitl_required is set, route to hitl."""
    settings = get_settings()
    threshold = risk_threshold if risk_threshold is not None else settings.risk_threshold_high

    risk_score = state.get("risk_score", 0.0)
    hitl_required = state.get("hitl_required")

    if risk_score >= threshold or hitl_required is True:
        logger.info(
            "Human approval required (score: %.2f >= %.2f, hitl_required: %s). Routing to hitl.",
            risk_score,
            threshold,
            hitl_required,
        )
        return "hitl"

    if hitl_required is False:
        logger.info(
            "Low risk change (score: %.2f < %.2f). Routing directly to pr_agent.",
            risk_score,
            threshold,
        )
        return "pr_agent"

    if not settings.auto_approve_low_risk:
        logger.info("Auto-approve disabled for low risk changes. Routing to hitl.")
        return "hitl"

    logger.info(
        "Low risk change (score: %.2f < %.2f). Routing directly to pr_agent.",
        risk_score,
        threshold,
    )
    return "pr_agent"


def route_after_hitl(state: SWEState) -> str:
    """Route after human intervention: PR agent if approved, supervisor if feedback given, else abort."""
    action = state.get("hitl_action")
    status = state.get("status")

    if action == "reject" or status == "rejected":
        logger.warning("HITL run was explicitly rejected. Terminating graph.")
        return END

    approved = state.get("hitl_approved")
    feedback = state.get("hitl_feedback")

    if approved is True or action == "approve":
        logger.info("HITL approval granted. Routing to pr_agent.")
        return "pr_agent"

    if (approved is False or action == "request_changes") and feedback and action != "reject":
        logger.info("HITL requested revisions with feedback: %s. Routing to supervisor.", feedback)
        return "supervisor"

    if approved is False:
        logger.warning("HITL rejected change without revision request. Routing to END.")
        return END

    # When paused waiting for input
    logger.info("Awaiting human decision in HITL node.")
    return "hitl"
