"""Pure Python conditional routing functions for StateGraph edge transitions."""

import logging
from typing import Optional
from langgraph.graph import END
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


def route_after_verify(state: SWEState) -> str:
    """Route after test verification: proceed to reviewer if passed, loop to fix_test if retries remain."""
    test_results = state.get("test_results") or {}
    status = test_results.get("status", "failed")
    attempts = state.get("test_attempts", 1)
    max_attempts = state.get("max_test_attempts", 3)

    if status == "passed":
        logger.info("Tests verified successfully. Routing to reviewer.")
        return "reviewer"

    if attempts < max_attempts:
        logger.info(
            "Tests failed (attempt %d of %d). Routing back to fix_test.",
            attempts,
            max_attempts,
        )
        return "fix_test"

    logger.warning(
        "Tests failed after %d attempts. Escalating to human-in-the-loop (hitl).",
        attempts,
    )
    return "hitl"


def route_after_reviewer(state: SWEState, risk_threshold: Optional[float] = None) -> str:
    """Route after review: if risk exceeds threshold or hitl_required is set, route to hitl."""
    settings = get_settings()
    threshold = risk_threshold if risk_threshold is not None else settings.risk_threshold_high

    risk_score = state.get("risk_score", 0.0)
    hitl_required = state.get("hitl_required", False)

    if risk_score >= threshold or hitl_required:
        logger.info(
            "High risk change detected (score: %.2f >= %.2f). Routing to hitl.",
            risk_score,
            threshold,
        )
        return "hitl"

    logger.info(
        "Low risk change (score: %.2f < %.2f). Routing directly to pr_agent.",
        risk_score,
        threshold,
    )
    return "pr_agent"


def route_after_hitl(state: SWEState) -> str:
    """Route after human intervention: PR agent if approved, fix_test if feedback given, else abort."""
    approved = state.get("hitl_approved")
    feedback = state.get("hitl_feedback")

    if approved is True:
        logger.info("HITL approval granted. Routing to pr_agent.")
        return "pr_agent"

    if approved is False and feedback:
        logger.info("HITL requested revisions with feedback: %s. Routing to fix_test.", feedback)
        return "fix_test"

    if approved is False:
        logger.warning("HITL rejected change without revision request. Routing to END.")
        return END

    # When paused waiting for input
    logger.info("Awaiting human decision in HITL node.")
    return "hitl"
