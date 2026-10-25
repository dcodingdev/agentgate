"""StateGraph assembly, edges, interrupts, and checkpointer compilation."""

import logging
from typing import Optional
from langgraph.graph import END, StateGraph
from langgraph.checkpoint.base import BaseCheckpointSaver
from langgraph.graph.state import CompiledStateGraph

from app.agents.state import SWEState
from app.agents.nodes import (
    guardrail_node,
    supervisor_node,
    research_node,
    fix_test_node,
    verify_node,
    reviewer_node,
    hitl_node,
    pr_agent_node,
)
from app.agents.routing import (
    route_after_guardrail,
    route_after_verify,
    route_after_reviewer,
    route_after_hitl,
)
from app.database.connection import get_checkpointer

logger = logging.getLogger(__name__)


def build_graph(checkpointer: Optional[BaseCheckpointSaver] = None) -> CompiledStateGraph:
    """Build and compile the multi-agent SWE StateGraph with conditional routing and interrupts."""
    logger.info("Building SWE StateGraph...")
    workflow = StateGraph(SWEState)

    # 1. Register agent nodes
    workflow.add_node("guardrail", guardrail_node)
    workflow.add_node("supervisor", supervisor_node)
    workflow.add_node("research", research_node)
    workflow.add_node("fix_test", fix_test_node)
    workflow.add_node("verify", verify_node)
    workflow.add_node("reviewer", reviewer_node)
    workflow.add_node("hitl", hitl_node)
    workflow.add_node("pr_agent", pr_agent_node)

    # 2. Set Entry Point
    workflow.set_entry_point("guardrail")

    # 3. Guardrail conditional routing
    workflow.add_conditional_edges(
        "guardrail",
        route_after_guardrail,
        {
            "supervisor": "supervisor",
            END: END,
        },
    )

    # 4. Supervisor -> Research -> Fix/Test -> Verify
    workflow.add_edge("supervisor", "research")
    workflow.add_edge("research", "fix_test")
    workflow.add_edge("fix_test", "verify")

    # 5. Verification conditional routing (pass -> reviewer, fail -> retry fix_test or hitl)
    workflow.add_conditional_edges(
        "verify",
        route_after_verify,
        {
            "reviewer": "reviewer",
            "fix_test": "fix_test",
            "hitl": "hitl",
        },
    )

    # 6. Reviewer conditional routing (low risk -> pr_agent, high risk -> hitl)
    workflow.add_conditional_edges(
        "reviewer",
        route_after_reviewer,
        {
            "hitl": "hitl",
            "pr_agent": "pr_agent",
        },
    )

    # 7. HITL conditional routing (approve -> pr_agent, reject+feedback -> fix_test, reject -> END)
    workflow.add_conditional_edges(
        "hitl",
        route_after_hitl,
        {
            "pr_agent": "pr_agent",
            "fix_test": "fix_test",
            "hitl": "hitl",
            END: END,
        },
    )

    # 8. PR Agent terminal edge
    workflow.add_edge("pr_agent", END)

    # Compile with checkpointer and HITL interrupt
    active_checkpointer = checkpointer or get_checkpointer()
    compiled = workflow.compile(
        checkpointer=active_checkpointer,
        interrupt_before=["hitl"],
    )

    logger.info("SWE StateGraph assembled and compiled successfully.")
    return compiled


# Cached compiled graph reference
_compiled_graph: Optional[CompiledStateGraph] = None


def get_graph() -> CompiledStateGraph:
    """Retrieve global compiled graph instance."""
    global _compiled_graph
    if _compiled_graph is None:
        _compiled_graph = build_graph()
    return _compiled_graph
