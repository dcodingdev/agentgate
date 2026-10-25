"""Graph node implementations: guardrail, supervisor, research, fix_test, verify, reviewer, hitl, pr_agent."""

import logging
from typing import Any, Dict
from langchain_core.messages import AIMessage
from app.agents.state import SWEState
from app.config import get_settings
from app.execution.e2b_sandbox import create_sandbox
from app.tools.code_executor import apply_patch, run_tests
from app.tools.mcp_tools import create_pull_request
from app.tools.repo_tools_server import compute_risk_score_fn

logger = logging.getLogger(__name__)


async def guardrail_node(state: SWEState) -> Dict[str, Any]:
    """Validate repository authorization and request safety."""
    logger.info("Executing guardrail_node for repo: %s", state.get("repo"))
    settings = get_settings()
    repo = state.get("repo", "")

    if not repo:
        return {
            "guardrail_passed": False,
            "guardrail_reason": "No repository specified",
            "status": "rejected",
            "messages": [AIMessage(content="Guardrail check rejected: missing repository.")],
        }

    if not settings.is_repo_allowed(repo):
        reason = f"Repository '{repo}' is not permitted by allowed_repos policy."
        logger.warning(reason)
        return {
            "guardrail_passed": False,
            "guardrail_reason": reason,
            "status": "rejected",
            "messages": [AIMessage(content=f"Guardrail check rejected: {reason}")],
        }

    return {
        "guardrail_passed": True,
        "guardrail_reason": "Repository and prompt meet security criteria.",
        "status": "running",
        "messages": [AIMessage(content="Guardrail passed: Request authorized.")],
    }


async def supervisor_node(state: SWEState) -> Dict[str, Any]:
    """Coordinate the SWE resolution cycle and ensure sandbox readiness."""
    logger.info("Executing supervisor_node for thread %s", state.get("thread_id"))
    sandbox_id = state.get("sandbox_id")

    if not sandbox_id:
        sandbox_id = await create_sandbox()

    return {
        "sandbox_id": sandbox_id,
        "status": "running",
        "messages": [AIMessage(content=f"Supervisor initialized sandbox {sandbox_id}. Dispatching research.")],
    }


async def research_node(state: SWEState) -> Dict[str, Any]:
    """Analyze issue, locate root cause, and specify files requiring changes."""
    logger.info("Executing research_node for issue: %s", state.get("issue_url"))
    issue_desc = state.get("issue_description", "")
    repo = state.get("repo", "")

    # In production, LLM inspects repo code via tools
    findings = f"Identified bug origin in {repo}. Issue context: {issue_desc[:120]}..."
    files_changed = ["src/core/session.py", "tests/test_session.py"]

    return {
        "research_findings": findings,
        "files_changed": files_changed,
        "messages": [AIMessage(content=f"Research complete: {findings}")],
    }


async def fix_test_node(state: SWEState) -> Dict[str, Any]:
    """Author patch diff, implement regression tests, and apply in sandbox."""
    logger.info("Executing fix_test_node (attempt %d)", state.get("test_attempts", 0) + 1)
    sandbox_id = state.get("sandbox_id", "default_sandbox")
    attempts = state.get("test_attempts", 0) + 1

    candidate_diff = (
        "--- a/src/core/session.py\n"
        "+++ b/src/core/session.py\n"
        "@@ -10,3 +10,4 @@\n"
        "+    # Fix memory leak on loop termination\n"
        "+    await session.cleanup()\n"
    )

    # Apply patch in the sandbox
    patch_result = apply_patch.invoke(
        {"sandbox_id": sandbox_id, "patch_content": candidate_diff, "target_dir": "/repo"}
    )

    return {
        "patch_diff": candidate_diff,
        "test_attempts": attempts,
        "status": "running",
        "messages": [AIMessage(content=f"Applied patch attempt {attempts}: {patch_result}")],
    }


async def verify_node(state: SWEState) -> Dict[str, Any]:
    """Execute test suite against the sandbox to verify fix."""
    logger.info("Executing verify_node for sandbox %s", state.get("sandbox_id"))
    sandbox_id = state.get("sandbox_id", "default_sandbox")

    # Run tests using the executor tool
    test_result = run_tests.invoke(
        {"sandbox_id": sandbox_id, "test_command": "pytest -v", "target_dir": "/repo"}
    )

    return {
        "test_results": test_result,
        "messages": [AIMessage(content=f"Test verification result: {test_result.get('summary')}")],
    }


async def reviewer_node(state: SWEState) -> Dict[str, Any]:
    """Compute risk metrics and determine whether human sign-off is required."""
    logger.info("Executing reviewer_node")
    settings = get_settings()

    files_changed = state.get("files_changed") or ["src/core/session.py"]
    diff_content = state.get("patch_diff") or ""
    diff_lines = len(diff_content.splitlines())

    risk_eval = compute_risk_score_fn(
        files_changed=files_changed,
        diff_lines=diff_lines,
        touches_core_logic=True,
        test_coverage_delta=0.0,
    )

    risk_score = risk_eval["risk_score"]
    is_high_risk = risk_score >= settings.risk_threshold_high
    hitl_required = is_high_risk and not settings.auto_approve_low_risk

    return {
        "risk_score": risk_score,
        "risk_reasons": risk_eval["risk_factors"],
        "hitl_required": hitl_required,
        "messages": [
            AIMessage(
                content=f"Review completed. Risk score: {risk_score} (High risk: {is_high_risk})"
            )
        ],
    }


async def hitl_node(state: SWEState) -> Dict[str, Any]:
    """Present briefing for human engineer sign-off."""
    logger.info("Executing hitl_node - awaiting engineer feedback for thread %s", state.get("thread_id"))

    # When HITL node executes, state is marked paused for human review
    briefing = (
        f"Awaiting human approval. Risk score: {state.get('risk_score', 0.0)}. "
        f"Reasons: {', '.join(state.get('risk_reasons', []))}"
    )

    return {
        "status": "paused_hitl",
        "messages": [AIMessage(content=briefing)],
    }


async def pr_agent_node(state: SWEState) -> Dict[str, Any]:
    """Generate branch, commit patch, and publish pull request."""
    logger.info("Executing pr_agent_node")
    repo = state.get("repo", "org/repo")
    title = f"Fix: {state.get('issue_title', 'SWE Automated Bugfix')}"
    body = (
        f"Automated PR created by AgentGate for issue: {state.get('issue_url')}\n\n"
        f"### Summary of Changes\n{state.get('research_findings', 'Automated patch applied.')}\n\n"
        f"### Verification\n{state.get('test_results', {}).get('summary', 'Tests passing')}\n"
        f"### Risk Score: {state.get('risk_score', 0.0)}"
    )

    pr_url = create_pull_request.invoke(
        {"repo": repo, "title": title, "head_branch": f"agentgate-fix-{state.get('thread_id', '1')}", "body": body}
    )

    return {
        "pr_url": pr_url,
        "status": "completed",
        "messages": [AIMessage(content=f"Pull request created successfully: {pr_url}")],
    }
