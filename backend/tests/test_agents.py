"""Tests for agent routing, risk calculation logic, and graph assembly."""

import pytest
from langgraph.graph import END
from app.agents.routing import (
    route_after_guardrail,
    route_after_verify,
    route_after_reviewer,
    route_after_hitl,
)
from app.tools.repo_tools_server import compute_risk_score_fn
from app.agents.graph import build_graph
from langgraph.checkpoint.memory import MemorySaver


def test_route_after_guardrail():
    """Verify guardrail conditional edge transitions."""
    # When passed
    state_pass = {"guardrail_passed": True}
    assert route_after_guardrail(state_pass) == "supervisor"

    # When rejected
    state_fail = {"guardrail_passed": False, "guardrail_reason": "Not allowed"}
    assert route_after_guardrail(state_fail) == END


def test_route_after_verify():
    """Verify test verification routing based on outcomes and retry count."""
    # Tests passed
    state_pass = {"test_results": {"status": "passed"}}
    assert route_after_verify(state_pass) == "reviewer"

    # Tests failed, retry allowed
    state_retry = {
        "test_results": {"status": "failed"},
        "test_attempts": 1,
        "max_test_attempts": 3,
    }
    assert route_after_verify(state_retry) == "fix_test"

    # Tests failed, max attempts exceeded -> escalate to HITL
    state_exhausted = {
        "test_results": {"status": "failed"},
        "test_attempts": 3,
        "max_test_attempts": 3,
    }
    assert route_after_verify(state_exhausted) == "hitl"


def test_route_after_reviewer():
    """Verify reviewer routing depending on calculated risk threshold."""
    # High risk
    state_high_risk = {"risk_score": 0.85, "hitl_required": True}
    assert route_after_reviewer(state_high_risk, risk_threshold=0.7) == "hitl"

    # Low risk
    state_low_risk = {"risk_score": 0.3, "hitl_required": False}
    assert route_after_reviewer(state_low_risk, risk_threshold=0.7) == "pr_agent"


def test_route_after_hitl():
    """Verify HITL decision branches."""
    # Approved
    state_approved = {"hitl_approved": True}
    assert route_after_hitl(state_approved) == "pr_agent"

    # Rejected with revision feedback -> retry fix
    state_revision = {"hitl_approved": False, "hitl_feedback": "Please fix null check"}
    assert route_after_hitl(state_revision) == "fix_test"

    # Hard rejected -> abort
    state_rejected = {"hitl_approved": False, "hitl_feedback": None}
    assert route_after_hitl(state_rejected) == END


def test_compute_risk_score_logic():
    """Verify risk calculation with varying diff sizes and sensitive paths."""
    # Low risk change
    low_risk = compute_risk_score_fn(
        files_changed=["docs/index.md"],
        diff_lines=10,
        touches_core_logic=False,
    )
    assert low_risk["risk_score"] < 0.5
    assert low_risk["is_high_risk"] is False

    # High risk change: touches auth and large diff
    high_risk = compute_risk_score_fn(
        files_changed=["src/auth/jwt.py", "database/migrations/001.sql"],
        diff_lines=600,
        touches_core_logic=True,
    )
    assert high_risk["risk_score"] >= 0.7
    assert high_risk["is_high_risk"] is True
    assert any("sensitive" in f.lower() for f in high_risk["risk_factors"])


def test_graph_assembly_structure():
    """Verify StateGraph compiles properly with MemorySaver checkpointer."""
    checkpointer = MemorySaver()
    graph = build_graph(checkpointer=checkpointer)
    assert graph is not None

    # Verify key nodes are registered
    expected_nodes = {
        "guardrail",
        "supervisor",
        "research",
        "fix_test",
        "verify",
        "reviewer",
        "hitl",
        "pr_agent",
    }
    assert expected_nodes.issubset(set(graph.nodes.keys()))
