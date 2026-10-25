"""SWEState TypedDict definition for the multi-agent SWE StateGraph."""

from typing import Annotated, Any, Dict, List, Optional
from typing_extensions import TypedDict
from langchain_core.messages import AnyMessage
from langgraph.graph.message import add_messages


class SWEState(TypedDict, total=False):
    """Complete execution state for an autonomous SWE agent run."""

    # Thread and repository metadata
    thread_id: str
    issue_url: str
    repo: str
    issue_title: str
    issue_description: str

    # Execution sandbox
    sandbox_id: Optional[str]

    # Guardrail evaluation
    guardrail_passed: bool
    guardrail_reason: Optional[str]

    # Research phase
    research_findings: Optional[str]

    # Code generation and patch application
    patch_diff: Optional[str]
    files_changed: List[str]

    # Test execution & verification
    test_results: Optional[Dict[str, Any]]
    test_attempts: int
    max_test_attempts: int

    # Review & risk scoring
    risk_score: float
    risk_reasons: List[str]

    # Human-In-The-Loop (HITL) state
    hitl_required: bool
    hitl_approved: Optional[bool]
    hitl_feedback: Optional[str]

    # Final outcome
    pr_url: Optional[str]
    status: str  # pending, running, paused_hitl, completed, failed, rejected
    error: Optional[str]

    # Chat history / LLM message sequence
    messages: Annotated[List[AnyMessage], add_messages]
