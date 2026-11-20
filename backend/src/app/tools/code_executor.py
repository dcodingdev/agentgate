"""Agent-facing code execution tools: apply_patch, run_tests, read_logs."""

import asyncio
import concurrent.futures
import logging
from typing import Any, Dict
# pyrefly: ignore[missing-import]
from langchain_core.tools import tool
from app.execution.e2b_sandbox import run_command, run_command_sync
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
    cmd = (
        f'([ -d "{target_dir}" ] || sudo mkdir -p "{target_dir}" && sudo chown -R $(id -u):$(id -g) "{target_dir}" 2>/dev/null || mkdir -p "{target_dir}" 2>/dev/null || true) && '
        f'cd {target_dir} && printf "%s" "{escaped_patch}" | git apply --whitespace=fix -'
    )

    result = run_command_sync(sandbox_id, cmd, timeout=60)

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

    cmd = (
        f'([ -d "{target_dir}" ] || sudo mkdir -p "{target_dir}" && sudo chown -R $(id -u):$(id -g) "{target_dir}" 2>/dev/null || mkdir -p "{target_dir}" 2>/dev/null || true) && '
        f"cd {target_dir} && {test_command}"
    )

    result = run_command_sync(sandbox_id, cmd, timeout=180)

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

    result = run_command_sync(sandbox_id, cmd, timeout=30)

    return result.get("stdout") or result.get("stderr") or "Empty log file."


@tool
def search_code(sandbox_id: str, query: str, target_dir: str = "/repo") -> str:
    """Search repository code for symbols, function definitions, or keywords inside the sandbox."""
    logger.info("Searching code in sandbox %s: '%s'", sandbox_id, query)

    # Sanitize query
    clean_query = query.replace("'", "").replace('"', "")
    cmd = (
        f'([ -d "{target_dir}" ] || sudo mkdir -p "{target_dir}" && sudo chown -R $(id -u):$(id -g) "{target_dir}" 2>/dev/null || mkdir -p "{target_dir}" 2>/dev/null || true) && '
        f"cd {target_dir} && "
        f"(grep -rn --exclude-dir='.git' --exclude-dir='__pycache__' '{clean_query}' . 2>/dev/null | head -n 30 "
        f"|| echo 'No code matches found for {clean_query}')"
    )

    result = run_command_sync(sandbox_id, cmd, timeout=30)
    return result.get("stdout") or result.get("stderr") or f"No code matches found for {clean_query}."


@tool
def read_repo_file(sandbox_id: str, file_path: str, target_dir: str = "/repo") -> str:
    """Read repository files or documentation inside the sandbox."""
    logger.info("Reading repository file in sandbox %s: %s", sandbox_id, file_path)

    clean_path = file_path.replace("..", "").lstrip("/")
    cmd = (
        f'([ -d "{target_dir}" ] || sudo mkdir -p "{target_dir}" && sudo chown -R $(id -u):$(id -g) "{target_dir}" 2>/dev/null || mkdir -p "{target_dir}" 2>/dev/null || true) && '
        f"cd {target_dir} && (head -n 200 '{clean_path}' 2>/dev/null || echo 'File not found: {clean_path}')"
    )

    result = run_command_sync(sandbox_id, cmd, timeout=30)
    return result.get("stdout") or result.get("stderr") or f"File not found: {clean_path}."
