"""Tool lookup helpers and per-node tool subsets."""

import logging
from typing import Any, Dict, List
# pyrefly: ignore[missing-import]
from langchain_core.tools import BaseTool, tool
from app.tools.code_executor import _run_sync, apply_patch, read_logs, run_tests
from app.tools.mcp_client import get_mcp_client
from app.tools.repo_tools_server import compute_risk_score_fn

logger = logging.getLogger(__name__)


@tool
def search_web(query: str) -> str:
    """Search developer documentation and technical references via Tavily MCP."""
    client = get_mcp_client()
    res = _run_sync(client.call_tool("tavily", "search", {"query": query}), timeout=15)
    return str(res.get("results", res))


@tool
def fetch_github_issue(repo: str, issue_number: int) -> Dict[str, Any]:
    """Fetch issue details and discussions via GitHub MCP."""
    client = get_mcp_client()
    return _run_sync(
        client.call_tool("github", "get_issue", {"repo": repo, "issue_id": issue_number}),
        timeout=15,
    )


@tool
def create_pull_request(repo: str, title: str, head_branch: str, body: str) -> str:
    """Create a pull request with the verified patch on GitHub."""
    client = get_mcp_client()
    res = _run_sync(
        client.call_tool(
            "github",
            "create_pull_request",
            {"repo": repo, "title": title, "head": head_branch, "body": body},
        ),
        timeout=15,
    )
    return res.get("pr_url", f"https://github.com/{repo}/pull/mock-pr")


@tool
def evaluate_patch_risk(files_changed: List[str], diff_lines: int) -> Dict[str, Any]:
    """Calculate the risk score of the patch using repo tools."""
    return compute_risk_score_fn(files_changed=files_changed, diff_lines=diff_lines)


# Per-node tool subsets
RESEARCH_TOOLS: List[BaseTool] = [fetch_github_issue, search_web, read_logs]
FIX_TEST_TOOLS: List[BaseTool] = [apply_patch, run_tests, read_logs]
VERIFY_TOOLS: List[BaseTool] = [run_tests, read_logs]
REVIEWER_TOOLS: List[BaseTool] = [evaluate_patch_risk]
PR_TOOLS: List[BaseTool] = [create_pull_request]


def get_tools_for_node(node_name: str) -> List[BaseTool]:
    """Retrieve specific tool subsets available to a node."""
    mapping = {
        "research": RESEARCH_TOOLS,
        "fix_test": FIX_TEST_TOOLS,
        "verify": VERIFY_TOOLS,
        "reviewer": REVIEWER_TOOLS,
        "pr_agent": PR_TOOLS,
    }
    return mapping.get(node_name, [])
