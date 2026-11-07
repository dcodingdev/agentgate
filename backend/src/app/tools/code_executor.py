"""Agent-facing code execution tools: apply_patch, run_tests, read_logs."""

import asyncio
import concurrent.futures
import logging
from typing import Any, Dict
from langchain_core.tools import tool
from app.execution.e2b_sandbox import run_command
from app.tools.repo_tools_server import parse_test_output_fn

logger = logging.getLogger(__name__)


def _run_sync(coro: Any, timeout: float = 60.0) -> Any:
    """Safely run an async coroutine from synchronous code, preventing event loop deadlocks."""
    try:
        loop = asyncio.get_running_loop()
    except RuntimeError:
        loop = None

    if loop is not None and loop.is_running():
        with concurrent.futures.ThreadPoolExecutor(max_workers=1) as executor:
            future = executor.submit(asyncio.run, coro)
            return future.result(timeout=timeout)
    return asyncio.run(coro)


@tool
def apply_patch(sandbox_id: str, patch_content: str, target_dir: str = "/repo") -> str:
    """Apply a unified diff patch to repository files inside the sandbox."""
    logger.info("Applying patch to sandbox %s in %s", sandbox_id, target_dir)

    # Sanitize patch content to prevent basic command injection if piped
    escaped_patch = patch_content.replace('"', '\\"')
    cmd = f'cd {target_dir} && printf "%s" "{escaped_patch}" | git apply --whitespace=fix -'

    result = _run_sync(run_command(sandbox_id, cmd), timeout=60)

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

    result = _run_sync(run_command(sandbox_id, cmd), timeout=180)

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

    result = _run_sync(run_command(sandbox_id, cmd), timeout=30)

    return result.get("stdout") or result.get("stderr") or "Empty log file."
