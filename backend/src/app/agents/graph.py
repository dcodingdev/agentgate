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
    issue_analysis_node,
    code_search_node,
    docs_lookup_node,
    aggregate_research_node,
    research_node,
    fix_test_node,
    verify_node,
    reviewer_node,
    hitl_node,
    pr_agent_node,
)
from app.agents.routing import (
    route_after_guardrail,
    route_after_supervisor,
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
    workflow.add_node("issue_analysis", issue_analysis_node)
    workflow.add_node("code_search", code_search_node)
    workflow.add_node("docs_lookup", docs_lookup_node)
    workflow.add_node("aggregate_research", aggregate_research_node)
    workflow.add_node("research", research_node)
    workflow.add_node("fix_test", fix_test_node)
    workflow.add_node("verify", verify_node)
    workflow.add_node("reviewer", reviewer_node)
    workflow.add_node("hitl", hitl_node)
    workflow.add_node("pr_agent", pr_agent_node)

    # 2. Set Entry Point
    workflow.set_entry_point("guardrail")

    # 3. Guardrail conditional routing (code safety gate)
    workflow.add_conditional_edges(
        "guardrail",
        route_after_guardrail,
        {
            "supervisor": "supervisor",
            END: END,
        },
    )

    # 4. Supervisor conditional routing (parallel research via Send, fix_test, reviewer, hitl)
    workflow.add_conditional_edges(
        "supervisor",
        route_after_supervisor,
        [
            "issue_analysis",
            "code_search",
            "docs_lookup",
            "fix_test",
            "reviewer",
            "hitl",
            "research",
        ],
    )

    # 5. Parallel research fan-in to aggregator, then back to supervisor
    workflow.add_edge("issue_analysis", "aggregate_research")
    workflow.add_edge("code_search", "aggregate_research")
    workflow.add_edge("docs_lookup", "aggregate_research")
    workflow.add_edge("aggregate_research", "supervisor")
    workflow.add_edge("research", "supervisor")

    # 6. Fix/Test applies patch and advances to verify
    workflow.add_edge("fix_test", "verify")

    # 7. Verification conditional routing:
    # Passed -> reviewer; Failed under cap -> supervisor; Failed >= max cap -> hitl
    workflow.add_conditional_edges(
        "verify",
        route_after_verify,
        {
            "reviewer": "reviewer",
            "supervisor": "supervisor",
            "hitl": "hitl",
        },
    )

    # 8. Reviewer conditional routing (low risk -> pr_agent, high risk -> hitl)
    workflow.add_conditional_edges(
        "reviewer",
        route_after_reviewer,
        {
            "hitl": "hitl",
            "pr_agent": "pr_agent",
        },
    )

    # 9. HITL conditional routing (approve -> pr_agent, feedback -> supervisor, reject -> END)
    workflow.add_conditional_edges(
        "hitl",
        route_after_hitl,
        {
            "pr_agent": "pr_agent",
            "supervisor": "supervisor",
            "hitl": "hitl",
            END: END,
        },
    )

    # 10. PR Agent terminal edge
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


def export_graph_markdown(output_path: str = "STATEGRAPH.md") -> str:
    """Render and save the compiled StateGraph's Mermaid diagram to a markdown file."""
    graph = get_graph()
    mermaid_syntax = graph.get_graph().draw_mermaid()
    md_content = f"# AgentGate SWE StateGraph Architecture\n\n```mermaid\n{mermaid_syntax}\n```\n"
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(md_content)
    logger.info("Saved LangGraph structure to %s", output_path)
    return md_content


if __name__ == "__main__":
    export_graph_markdown()
