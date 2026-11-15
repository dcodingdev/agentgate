"""Tests for code_executor, test-output parsing, and MCP client/tool wrappers."""

import pytest
from app.tools.repo_tools_server import parse_test_output_fn
from app.tools.code_executor import apply_patch, run_tests, read_logs
from app.tools.mcp_client import MultiServerMCPClient
from app.tools.mcp_tools import get_tools_for_node, RESEARCH_TOOLS, FIX_TEST_TOOLS


def test_parse_pytest_output():
    """Verify regex parsing of various test runner outputs."""
    # Test passing output
    passing_output = "========================= 8 passed in 0.35s ========================="
    res_pass = parse_test_output_fn(passing_output)
    assert res_pass["status"] == "passed"
    assert res_pass["passed"] == 8
    assert res_pass["failed"] == 0

    # Test failure output
    failing_output = (
        "FAILED tests/test_core.py::test_leak - AssertionError: assert False\n"
        "==================== 1 failed, 7 passed in 0.88s ===================="
    )
    res_fail = parse_test_output_fn(failing_output)
    assert res_fail["status"] == "failed"
    assert res_fail["failed"] == 1
    assert res_fail["passed"] == 7
    assert len(res_fail["failures"]) >= 1

    # Empty test output
    res_empty = parse_test_output_fn("")
    assert res_empty["status"] == "failed"
    assert res_empty["errors"] == 1


def test_code_executor_tools():
    """Verify tool execution with mock sandbox environment."""
    sandbox_id = "test_sbx_123"

    # Test apply patch
    patch_diff = "--- a/test.py\n+++ b/test.py\n@@ -1 +1 @@\n-old\n+new"
    patch_result = apply_patch.invoke(
        {"sandbox_id": sandbox_id, "patch_content": patch_diff, "target_dir": "/repo"}
    )
    assert "successfully applied" in patch_result.lower()

    # Test run tests
    test_result = run_tests.invoke(
        {"sandbox_id": sandbox_id, "test_command": "pytest", "target_dir": "/repo"}
    )
    assert isinstance(test_result, dict)
    assert "status" in test_result
    assert test_result["status"] == "passed"

    # Test read logs
    log_content = read_logs.invoke(
        {"sandbox_id": sandbox_id, "log_path": "/repo/test.log"}
    )
    assert isinstance(log_content, str)


def test_mcp_client_lifecycle():
    """Verify MultiServerMCPClient connection, dispatch, and teardown."""
    client = MultiServerMCPClient()
    client.connect_all_sync()
    assert "filesystem" in client.connected_servers

    # Call tool on github server
    gh_result = client.call_tool_sync(
        "github", "get_issue", {"repo": "test/repo", "issue_id": 42}
    )
    assert gh_result.get("issue_id") == 42

    client.disconnect_all_sync()
    assert len(client.connected_servers) == 0


def test_node_tool_subsets():
    """Verify per-node tool configurations including parallel research nodes."""
    issue_tools = get_tools_for_node("issue_analysis")
    assert any(t.name == "fetch_github_issue" for t in issue_tools)

    code_tools = get_tools_for_node("code_search")
    assert any(t.name == "search_code" for t in code_tools)
    assert any(t.name == "read_repo_file" for t in code_tools)

    docs_tools = get_tools_for_node("docs_lookup")
    assert any(t.name == "read_repo_file" for t in docs_tools)

    research_tools = get_tools_for_node("research")
    assert len(research_tools) > 0
    assert any(t.name == "fetch_github_issue" for t in research_tools)
    assert any(t.name == "read_logs" for t in research_tools)

    fix_tools = get_tools_for_node("fix_test")
    assert any(t.name == "apply_patch" for t in fix_tools)
    assert any(t.name == "run_tests" for t in fix_tools)

    verify_tools = get_tools_for_node("verify")
    assert any(t.name == "run_tests" for t in verify_tools)
