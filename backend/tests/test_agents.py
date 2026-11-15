"""Tests for agent routing, risk calculation logic, and graph assembly."""

# pyrefly: ignore[missing-import]
import pytest
# pyrefly: ignore[missing-import]
from langgraph.graph import END
from app.agents.routing import (
    route_after_guardrail,
    route_after_supervisor,
    route_after_verify,
    route_after_reviewer,
    route_after_hitl,
)
from app.tools.repo_tools_server import compute_risk_score_fn
from app.agents.graph import build_graph
# pyrefly: ignore[missing-import]
from langgraph.checkpoint.memory import MemorySaver


def test_route_after_guardrail():
    """Verify guardrail conditional edge transitions."""
    # When passed
    state_pass = {"guardrail_passed": True}
    assert route_after_guardrail(state_pass) == "supervisor"

    # When rejected
    state_fail = {"guardrail_passed": False, "guardrail_reason": "Not allowed"}
    assert route_after_guardrail(state_fail) == END


def test_route_after_supervisor():
    """Verify supervisor dynamic decision routing and Send fan-out."""
    # When research is required -> fans out with LangGraph Send
    research_fan = route_after_supervisor({"supervisor_decision": "research"})
    assert isinstance(research_fan, list)
    assert len(research_fan) == 3
    assert [s.node for s in research_fan] == ["issue_analysis", "code_search", "docs_lookup"]

    # When no research findings yet -> defaults to parallel research
    default_fan = route_after_supervisor({})
    assert isinstance(default_fan, list)
    assert [s.node for s in default_fan] == ["issue_analysis", "code_search", "docs_lookup"]

    # Other transitions return direct node strings
    assert route_after_supervisor({"supervisor_decision": "fix_test"}) == "fix_test"
    assert route_after_supervisor({"supervisor_decision": "reviewer"}) == "reviewer"
    assert route_after_supervisor({"supervisor_decision": "escalate_to_human"}) == "hitl"


def test_route_after_verify():
    """Verify test verification routing based on outcomes and retry count."""
    # Tests passed -> proceed to reviewer
    state_pass = {"test_results": {"status": "passed"}}
    assert route_after_verify(state_pass) == "reviewer"

    # Tests failed, retry allowed -> routes to supervisor for strategic decision
    state_retry = {
        "test_results": {"status": "failed"},
        "test_attempts": 1,
        "max_test_attempts": 3,
    }
    assert route_after_verify(state_retry) == "supervisor"

    # Tests failed, max attempts exceeded -> hard code guard routes to HITL
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

    # Rejected with revision feedback -> routes to supervisor to adapt approach
    state_revision = {"hitl_approved": False, "hitl_feedback": "Please fix null check"}
    assert route_after_hitl(state_revision) == "supervisor"

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
        "issue_analysis",
        "code_search",
        "docs_lookup",
        "aggregate_research",
        "research",
        "fix_test",
        "verify",
        "reviewer",
        "hitl",
        "pr_agent",
    }
    assert expected_nodes.issubset(set(graph.nodes.keys()))


def test_parallel_research_nodes_execution():
    """Verify issue_analysis, code_search, docs_lookup, and aggregate_research."""
    from app.agents.nodes import (
        issue_analysis_node,
        code_search_node,
        docs_lookup_node,
        aggregate_research_node,
    )

    state = {
        "thread_id": "test_thread",
        "repo": "acme/api",
        "issue_title": "Fix token memory leak in session",
        "issue_description": "Session object retains memory on timeout",
        "sandbox_id": "sbx_test",
    }

    res_issue = _run_node(issue_analysis_node(state))
    assert "issue_analysis_result" in res_issue
    assert "token memory leak" in res_issue["issue_analysis_result"].lower()

    res_code = _run_node(code_search_node(state))
    assert "code_search_result" in res_code
    assert "files_changed" in res_code
    assert len(res_code["files_changed"]) > 0

    res_docs = _run_node(docs_lookup_node(state))
    assert "docs_lookup_result" in res_docs

    # Test Aggregator joining parallel worker outputs
    combined_state = {**state, **res_issue, **res_code, **res_docs}
    res_agg = _run_node(aggregate_research_node(combined_state))
    assert "research_findings" in res_agg
    assert "Issue Analysis" in res_agg["research_findings"]
    assert "Code Search" in res_agg["research_findings"]
    assert "Documentation" in res_agg["research_findings"]
    assert res_agg["files_changed"] == res_code["files_changed"]


def test_llm_factory_initialization():
    """Verify LLM client factory configures model for configured providers."""
    from app.agents.llm import get_llm

    llm = get_llm()
    assert llm is not None
    assert hasattr(llm, "model_name")


def _run_node(coro):
    """Run non-awaiting coroutine synchronously without event loop sockets."""
    try:
        coro.send(None)
    except StopIteration as e:
        return e.value
    raise RuntimeError("Coroutine suspended unexpectedly")


def test_supervisor_node_decision_making():
    """Verify supervisor dynamic decision logic for various lifecycle states."""
    from app.agents.nodes import supervisor_node

    # 1. Initial state -> research
    initial_res = _run_node(supervisor_node({"thread_id": "t1", "sandbox_id": "sbx_1"}))
    assert initial_res["supervisor_decision"] == "research"

    # 2. Early escalation for database migration
    escalate_res = _run_node(supervisor_node({
        "thread_id": "t2",
        "sandbox_id": "sbx_1",
        "issue_title": "Run database migration for new column",
    }))
    assert escalate_res["supervisor_decision"] == "escalate_to_human"

    # 3. Incorporating human feedback
    feedback_res = _run_node(supervisor_node({
        "thread_id": "t3",
        "sandbox_id": "sbx_1",
        "research_findings": "Found bug",
        "hitl_feedback": "Please re-investigate the token expiry handling",
    }))
    assert feedback_res["supervisor_decision"] == "research"

    # 4. Verified tests passed -> reviewer
    passed_res = _run_node(supervisor_node({
        "thread_id": "t4",
        "sandbox_id": "sbx_1",
        "research_findings": "Found bug",
        "test_results": {"status": "passed"},
    }))
    assert passed_res["supervisor_decision"] == "reviewer"
