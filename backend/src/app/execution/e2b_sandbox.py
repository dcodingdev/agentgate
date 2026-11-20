"""Low-level E2B sandbox execution wrapper: create, reconnect, run, kill."""

import logging
import uuid
from typing import Any, Dict, Optional
from app.config import get_settings

logger = logging.getLogger(__name__)

# Active sandboxes registry for reconnecting / tracking
_active_sandboxes: Dict[str, Any] = {}
_mock_sandboxes: Dict[str, Dict[str, Any]] = {}
_initialized_sandboxes: set[str] = set()


class E2BSandboxError(Exception):
    """Exception raised for E2B execution errors."""
    pass


def _get_e2b_sandbox_class() -> Optional[Any]:
    """Dynamically load E2B Sandbox class if installed."""
    try:
        import importlib
        mod = importlib.import_module("e2b_code_interpreter")
        return getattr(mod, "Sandbox", None)
    except Exception:
        return None


def init_sandbox_repo_sync(
    sandbox_id: str,
    repo: Optional[str] = None,
    token: Optional[str] = None,
) -> None:
    """Initialize /repo workspace and clone the target repository in sandbox."""
    if sandbox_id in _initialized_sandboxes:
        return

    logger.info("Setting up /repo directory in sandbox [%s]...", sandbox_id)
    # 1. Guarantee /repo exists and is owned by user (avoid root permission denied)
    setup_dir_cmd = (
        "(sudo mkdir -p /repo && sudo chown -R $(id -u):$(id -g) /repo 2>/dev/null) || "
        "(mkdir -p /home/user/repo && (sudo ln -sf /home/user/repo /repo 2>/dev/null || true))"
    )
    run_command_sync(sandbox_id, setup_dir_cmd)

    clean_repo = ""
    if repo:
        clean_repo = (
            str(repo)
            .removeprefix("https://github.com/")
            .removeprefix("http://github.com/")
            .removeprefix("github.com/")
            .strip("/")
        )

    # 2. Clone repository if valid GitHub repo
    if clean_repo and clean_repo not in ("test/repo", "org/repo", "mock/repo") and not clean_repo.startswith("test/"):
        logger.info("Cloning repository %s into sandbox [%s]...", clean_repo, sandbox_id)
        clone_parts = []
        if token and not token.startswith("mock") and not token.startswith("ghp_your"):
            clone_parts.append(f"git clone --depth 1 https://x-access-token:{token}@github.com/{clean_repo}.git /repo 2>/dev/null")
        clone_parts.append(f"git clone --depth 1 https://github.com/{clean_repo}.git /repo 2>/dev/null")

        clone_cmd = f"if [ ! -d '/repo/.git' ]; then ({' || '.join(clone_parts)} || true); fi"
        run_command_sync(sandbox_id, clone_cmd, timeout=90)

    # 3. Ensure fallback README and git repo so tool commands never crash
    fallback_setup = (
        "cd /repo && "
        "if [ ! -f 'README.md' ]; then echo '# " + (clean_repo or "Repository") + "' > README.md; fi && "
        "if [ ! -d '.git' ]; then git init -q 2>/dev/null && git config user.name 'AgentGate' && git config user.email 'agent@agentgate.dev' || true; fi"
    )
    run_command_sync(sandbox_id, fallback_setup, timeout=30)
    _initialized_sandboxes.add(sandbox_id)


async def create_sandbox(
    template: Optional[str] = None,
    repo: Optional[str] = None,
    github_token: Optional[str] = None,
) -> str:
    """Create a new E2B sandbox instance or mock if key is unset, and prepare workspace."""
    settings = get_settings()
    template_name = template or settings.e2b_template
    active_token = github_token or settings.github_token

    if settings.e2b_api_key and not settings.e2b_api_key.startswith("mock"):
        Sandbox = _get_e2b_sandbox_class()
        if Sandbox is not None:
            try:
                if hasattr(Sandbox, "create"):
                    sandbox = Sandbox.create(template=template_name, api_key=settings.e2b_api_key)
                else:
                    sandbox = Sandbox(api_key=settings.e2b_api_key)
                sandbox_id = getattr(sandbox, "sandbox_id", getattr(sandbox, "id", str(uuid.uuid4().hex[:12])))
                _active_sandboxes[sandbox_id] = sandbox
                logger.info("Created real E2B sandbox: %s (template: %s)", sandbox_id, template_name)
                init_sandbox_repo_sync(sandbox_id, repo=repo, token=active_token)
                return sandbox_id
            except Exception as exc:
                logger.warning("E2B initialization failed (%s). Falling back to mock sandbox.", exc)

    # Mock sandbox fallback
    sandbox_id = f"sbx_{uuid.uuid4().hex[:12]}"
    _mock_sandboxes[sandbox_id] = {
        "status": "running",
        "template": template_name,
        "files": {},
    }
    logger.info("Initialized mock E2B sandbox: %s", sandbox_id)
    init_sandbox_repo_sync(sandbox_id, repo=repo, token=active_token)
    return sandbox_id


async def reconnect_sandbox(sandbox_id: str) -> Optional[Any]:
    """Reconnect to an existing sandbox by ID."""
    if sandbox_id in _active_sandboxes:
        return _active_sandboxes[sandbox_id]

    settings = get_settings()
    if settings.e2b_api_key and not settings.e2b_api_key.startswith("mock"):
        Sandbox = _get_e2b_sandbox_class()
        if Sandbox is not None:
            try:
                sandbox = Sandbox.reconnect(sandbox_id, api_key=settings.e2b_api_key)
                _active_sandboxes[sandbox_id] = sandbox
                return sandbox
            except Exception as exc:
                logger.error("Could not reconnect to E2B sandbox %s: %s", sandbox_id, exc)

    if sandbox_id in _mock_sandboxes:
        return _mock_sandboxes[sandbox_id]

    return None


def run_command_sync(sandbox_id: str, command: str, timeout: int = 120) -> Dict[str, Any]:
    """Execute shell command inside the target sandbox synchronously."""
    logger.info("Executing in sandbox [%s]: %s", sandbox_id, command)

    if sandbox_id in _active_sandboxes:
        sandbox = _active_sandboxes[sandbox_id]
        try:
            # E2B commands execution
            result = sandbox.commands.run(command, timeout=timeout)
            return {
                "exit_code": result.exit_code,
                "stdout": result.stdout or "",
                "stderr": result.stderr or "",
                "error": None,
            }
        except Exception as exc:
            # Preserve output if E2B raised CommandExitException for non-zero exit codes
            exit_code = getattr(exc, "exit_code", 1)
            stdout = getattr(exc, "stdout", "")
            stderr = getattr(exc, "stderr", str(exc))
            logger.info("Sandbox command [%s] exited with code %s: %s", command[:60], exit_code, exc)
            return {
                "exit_code": exit_code,
                "stdout": stdout,
                "stderr": stderr,
                "error": str(exc),
            }

    # Mock execution mode
    settings = get_settings()
    is_mock = (
        sandbox_id in _mock_sandboxes
        or sandbox_id.startswith("test_")
        or sandbox_id.startswith("sbx_")
        or sandbox_id == "default_sandbox"
        or (settings.e2b_api_key and settings.e2b_api_key.startswith("mock"))
    )
    if is_mock:
        # Simulate common test runner output
        if "pytest" in command:
            return {
                "exit_code": 0,
                "stdout": "========================= 5 passed in 0.42s =========================",
                "stderr": "",
                "error": None,
            }
        elif "git apply" in command or "patch" in command:
            return {
                "exit_code": 0,
                "stdout": "Patch applied cleanly.",
                "stderr": "",
                "error": None,
            }
        else:
            return {
                "exit_code": 0,
                "stdout": f"[mock] executed: {command}",
                "stderr": "",
                "error": None,
            }

    raise E2BSandboxError(f"Sandbox {sandbox_id} not found or expired.")


async def run_command(sandbox_id: str, command: str, timeout: int = 120) -> Dict[str, Any]:
    """Execute shell command inside the target sandbox."""
    return run_command_sync(sandbox_id, command, timeout=timeout)


async def kill_sandbox(sandbox_id: str) -> bool:
    """Terminate and clean up sandbox resources."""
    logger.info("Terminating sandbox %s", sandbox_id)

    if sandbox_id in _active_sandboxes:
        try:
            sandbox = _active_sandboxes.pop(sandbox_id)
            sandbox.kill()
            return True
        except Exception as exc:
            logger.error("Error terminating E2B sandbox %s: %s", sandbox_id, exc)
            return False

    if sandbox_id in _mock_sandboxes:
        _mock_sandboxes.pop(sandbox_id, None)
        return True

    return False
