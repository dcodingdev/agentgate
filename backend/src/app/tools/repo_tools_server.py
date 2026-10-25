"""Custom FastMCP server providing repository risk evaluation and test parsing tools."""

import re
import logging
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)

# Sensitive paths and keywords triggering higher risk
SENSITIVE_PATTERNS = [
    "auth",
    "security",
    "password",
    "migration",
    "payment",
    "secret",
    "config",
    "database",
    "credentials",
]


def parse_test_output_fn(raw_output: str) -> Dict[str, Any]:
    """Parse raw pytest/unittest test runner output into structured metrics."""
    if not raw_output:
        return {
            "status": "failed",
            "passed": 0,
            "failed": 0,
            "errors": 1,
            "summary": "No test output produced",
            "failures": ["Empty test output"],
        }

    passed = 0
    failed = 0
    errors = 0

    # Match pytest summary patterns like "5 passed, 2 failed in 1.2s"
    passed_match = re.search(r"(\d+)\s+passed", raw_output)
    if passed_match:
        passed = int(passed_match.group(1))

    failed_match = re.search(r"(\d+)\s+failed", raw_output)
    if failed_match:
        failed = int(failed_match.group(1))

    error_match = re.search(r"(\d+)\s+error", raw_output)
    if error_match:
        errors = int(error_match.group(1))

    # Match unittest outputs: "FAILED (failures=2, errors=1)" or "OK"
    if "OK" in raw_output and failed == 0 and errors == 0:
        if passed == 0:
            passed = 1
        status = "passed"
    elif failed > 0 or errors > 0:
        status = "failed"
    elif passed > 0:
        status = "passed"
    else:
        status = "passed" if "passed" in raw_output.lower() else "failed"

    # Extract failure lines
    failures = []
    for line in raw_output.splitlines():
        if line.startswith("FAILED ") or line.startswith("ERROR "):
            failures.append(line.strip())

    return {
        "status": status,
        "passed": passed,
        "failed": failed,
        "errors": errors,
        "summary": f"{passed} passed, {failed} failed, {errors} errors",
        "failures": failures[:10],
    }


def compute_risk_score_fn(
    files_changed: List[str],
    diff_lines: int,
    touches_core_logic: bool = False,
    test_coverage_delta: float = 0.0,
) -> Dict[str, Any]:
    """Compute risk score (0.0 to 1.0) and identify risk factors for code changes."""
    score = 0.1  # base risk
    risk_factors: List[str] = []

    # Diff size contribution
    if diff_lines > 500:
        score += 0.4
        risk_factors.append(f"Very large diff size: {diff_lines} lines")
    elif diff_lines > 150:
        score += 0.2
        risk_factors.append(f"Substantial diff size: {diff_lines} lines")
    elif diff_lines > 50:
        score += 0.1

    # Sensitive files detection
    sensitive_touched = []
    for file_path in files_changed:
        lower_path = file_path.lower()
        if any(keyword in lower_path for keyword in SENSITIVE_PATTERNS):
            sensitive_touched.append(file_path)

    if sensitive_touched:
        score += 0.35
        risk_factors.append(f"Modifies sensitive files: {', '.join(sensitive_touched[:3])}")

    # Core logic flag
    if touches_core_logic:
        score += 0.2
        risk_factors.append("Flagged as touching core system logic")

    # Negative test coverage
    if test_coverage_delta < -5.0:
        score += 0.3
        risk_factors.append(f"Severe test coverage drop: {test_coverage_delta:.1f}%")
    elif test_coverage_delta < 0.0:
        score += 0.15
        risk_factors.append(f"Test coverage decreased by: {abs(test_coverage_delta):.1f}%")

    normalized_score = min(max(round(score, 2), 0.0), 1.0)
    is_high_risk = normalized_score >= 0.7

    return {
        "risk_score": normalized_score,
        "is_high_risk": is_high_risk,
        "risk_factors": risk_factors,
    }


# FastMCP / MCPServer Setup
def _get_mcp_server_instance() -> Optional[Any]:
    """Dynamically initialize FastMCP or MCPServer instance across MCP v1 and v2."""
    import importlib

    server_cls = None
    try:
        mod = importlib.import_module("mcp.server.mcpserver")
        server_cls = getattr(mod, "MCPServer", None)
    except Exception:
        pass

    if server_cls is None:
        try:
            mod = importlib.import_module("mcp.server.fastmcp")
            server_cls = getattr(mod, "FastMCP", None)
        except Exception:
            pass

    if server_cls is not None:
        try:
            return server_cls("repo-tools-server")
        except Exception:
            return None
    return None


mcp_server = _get_mcp_server_instance()

if mcp_server is not None:
    @mcp_server.tool()
    def parse_test_output(raw_output: str) -> Dict[str, Any]:
        """Parse raw test suite output into structured results."""
        return parse_test_output_fn(raw_output)

    @mcp_server.tool()
    def compute_risk_score(
        files_changed: List[str],
        diff_lines: int,
        touches_core_logic: bool = False,
        test_coverage_delta: float = 0.0,
    ) -> Dict[str, Any]:
        """Compute risk score and identify risk factors for candidate code change."""
        return compute_risk_score_fn(
            files_changed, diff_lines, touches_core_logic, test_coverage_delta
        )
else:
    def parse_test_output(raw_output: str) -> Dict[str, Any]:
        """Fallback test parser tool."""
        return parse_test_output_fn(raw_output)

    def compute_risk_score(
        files_changed: List[str],
        diff_lines: int,
        touches_core_logic: bool = False,
        test_coverage_delta: float = 0.0,
    ) -> Dict[str, Any]:
        """Fallback risk score tool."""
        return compute_risk_score_fn(
            files_changed, diff_lines, touches_core_logic, test_coverage_delta
        )
