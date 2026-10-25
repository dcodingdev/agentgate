"""Agent-facing code execution tools: apply_patch, run_tests, read_logs."""

import logging
from typing import Any, Dict
from langchain_core.tools import tool
from app.execution.e2b_sandbox import run_command
from app.tools.repo_tools_server import parse_test_output_fn

logger = logging.getLogger(__name__)


@tool
def apply_patch(sandbox_id: str, patch_content: str, target_dir: str = "/repo") -> str:
    """Apply a unified diff patch to repository files inside the sandbox."""
    logger.info("Applying patch to sandbox %s in %s", sandbox_id, target_dir)

    # Sanitize patch content to prevent basic command injection if piped
    escaped_patch = patch_content.replace('"', '\\"')
    cmd = f'cd {target_dir} && printf "%s" "{escaped_patch}" | git apply --whitespace=fix -'

    import asyncio

    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            # Already inside an event loop, run directly or via future
            result = asyncio.run_coroutine_threadsafe(
                run_command(sandbox_id, cmd), loop
            ).result(timeout=60)
        else:
            result = asyncio.run(run_command(sandbox_id, cmd))
    except RuntimeError:
        result = asyncio.run(run_command(sandbox_id, cmd))

    if result["exit_code"] == 0:
        return f"Patch successfully applied in {target_dir}."
    else:
        return f"Failed to apply patch: {result['stderr'] or result['stdout']}"


@tool
def run_tests(
    sandbox_id: str, test_command: str = "pytest -v", target_dir: str = "/repo"
) -> Dict[str, Any]:
    """Execute the test suite in the sandbox and return structured test metrics."""
    logger.info("Running tests in sandbox %s: %s", sandbox_id, test_command)

    cmd = f"cd {target_dir} && {test_command}"

    import asyncio

    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            result = asyncio.run_coroutine_threadsafe(
                run_command(sandbox_id, cmd), loop
            ).result(timeout=180)
        else:
            result = asyncio.run(run_command(sandbox_id, cmd))
    except RuntimeError:
        result = asyncio.run(run_command(sandbox_id, cmd))

    combined_output = (result.get("stdout") or "") + "\n" + (result.get("stderr") or "")
    parsed = parse_test_output_fn(combined_output)
    parsed["raw_output"] = combined_output
    parsed["exit_code"] = result["exit_code"]
    return parsed


@tool
def read_logs(sandbox_id: str, log_path: str = "/repo/test.log") -> str:
    """Read execution log files from within the sandbox."""
    logger.info("Reading logs from sandbox %s: %s", sandbox_id, log_path)

    cmd = f"cat {log_path} 2>/dev/null || echo 'Log file not found: {log_path}'"

    import asyncio

    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            result = asyncio.run_coroutine_threadsafe(
                run_command(sandbox_id, cmd), loop
            ).result(timeout=30)
        else:
            result = asyncio.run(run_command(sandbox_id, cmd))
    except RuntimeError:
        result = asyncio.run(run_command(sandbox_id, cmd))

    return result.get("stdout") or result.get("stderr") or "Empty log file."
