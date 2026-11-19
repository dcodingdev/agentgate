"""Tool lookup helpers and per-node tool subsets."""

import logging
from typing import Any, Dict, List
# pyrefly: ignore[missing-import]
from langchain_core.tools import BaseTool, tool
from app.tools.code_executor import apply_patch, read_logs, run_tests, search_code, read_repo_file
from app.tools.mcp_client import get_mcp_client
from app.tools.repo_tools_server import compute_risk_score_fn

logger = logging.getLogger(__name__)


@tool
def fetch_github_issue(repo: str, issue_number: int, github_token: str = "") -> Dict[str, Any]:
    """Fetch issue details and discussions via GitHub MCP."""
    client = get_mcp_client()
    args: Dict[str, Any] = {"repo": repo, "issue_id": issue_number}
    if github_token:
        args["github_token"] = github_token
    return client.call_tool_sync("github", "get_issue", args)


@tool
def create_pull_request(repo: str, title: str, head_branch: str, body: str, github_token: str = "") -> str:
    """Create a pull request with the verified patch on GitHub."""
    client = get_mcp_client()
    args: Dict[str, Any] = {"repo": repo, "title": title, "head": head_branch, "body": body}
    if github_token:
        args["github_token"] = github_token
    res = client.call_tool_sync(
        "github",
        "create_pull_request",
        args,
    )
    return res.get("pr_url", f"https://github.com/{repo}/pull/mock-pr")


@tool
def evaluate_patch_risk(files_changed: List[str], diff_lines: int) -> Dict[str, Any]:
    """Calculate the risk score of the patch using repo tools."""
    return compute_risk_score_fn(files_changed=files_changed, diff_lines=diff_lines)


# Per-node tool subsets
ISSUE_ANALYSIS_TOOLS: List[BaseTool] = [fetch_github_issue, read_logs]
CODE_SEARCH_TOOLS: List[BaseTool] = [search_code, read_repo_file, read_logs]
DOCS_LOOKUP_TOOLS: List[BaseTool] = [read_repo_file, read_logs]
RESEARCH_TOOLS: List[BaseTool] = [fetch_github_issue, search_code, read_repo_file, read_logs]
FIX_TEST_TOOLS: List[BaseTool] = [apply_patch, run_tests, read_logs]
VERIFY_TOOLS: List[BaseTool] = [run_tests, read_logs]
REVIEWER_TOOLS: List[BaseTool] = [evaluate_patch_risk]
PR_TOOLS: List[BaseTool] = [create_pull_request]


def get_tools_for_node(node_name: str) -> List[BaseTool]:
    """Retrieve specific tool subsets available to a node."""
    mapping = {
        "issue_analysis": ISSUE_ANALYSIS_TOOLS,
        "code_search": CODE_SEARCH_TOOLS,
        "docs_lookup": DOCS_LOOKUP_TOOLS,
        "aggregate_research": [],
        "research": RESEARCH_TOOLS,
        "fix_test": FIX_TEST_TOOLS,
        "verify": VERIFY_TOOLS,
        "reviewer": REVIEWER_TOOLS,
        "pr_agent": PR_TOOLS,
    }
    return mapping.get(node_name, [])
