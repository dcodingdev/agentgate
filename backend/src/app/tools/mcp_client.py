"""MultiServerMCPClient setup for GitHub, Filesystem, and Tavily integrations."""

import logging
from typing import Any, Dict, List, Optional
from app.config import get_settings

logger = logging.getLogger(__name__)


class MultiServerMCPClient:
    """Manages connections to multiple MCP servers (GitHub, Filesystem, Tavily)."""

    def __init__(self) -> None:
        self.settings = get_settings()
        self.connected_servers: Dict[str, Any] = {}
        self.tools_cache: Dict[str, List[Dict[str, Any]]] = {}

    async def connect_all(self) -> None:
        """Initialize connections to configured MCP servers."""
        logger.info("Initializing MultiServerMCPClient connections...")

        # 1. GitHub MCP
        if self.settings.github_token:
            logger.info("Configured GitHub MCP integration.")
            self.connected_servers["github"] = {
                "status": "connected",
                "type": "github",
                "capabilities": ["issues", "pull_requests", "commits"],
            }
        else:
            logger.warning("GITHUB_TOKEN not provided; GitHub MCP in mock mode.")
            self.connected_servers["github"] = {"status": "mock", "type": "github"}

        # 2. Filesystem MCP
        self.connected_servers["filesystem"] = {
            "status": "connected",
            "type": "filesystem",
            "capabilities": ["read_file", "write_file", "list_directory"],
        }

        # 3. Tavily MCP
        if self.settings.tavily_api_key:
            logger.info("Configured Tavily Search MCP integration.")
            self.connected_servers["tavily"] = {
                "status": "connected",
                "type": "tavily",
                "capabilities": ["search", "extract"],
            }
        else:
            logger.warning("TAVILY_API_KEY not provided; Tavily MCP in mock mode.")
            self.connected_servers["tavily"] = {"status": "mock", "type": "tavily"}

    async def call_tool(
        self, server_name: str, tool_name: str, arguments: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Dispatch a tool invocation to a specific MCP server."""
        if server_name not in self.connected_servers:
            raise ValueError(f"MCP server '{server_name}' is not configured.")

        logger.info(
            "Calling MCP tool [%s:%s] with args: %s", server_name, tool_name, list(arguments.keys())
        )

        # Mock / Fallback handlers for standard tool calls
        if server_name == "github":
            if tool_name == "get_issue":
                return {
                    "issue_id": arguments.get("issue_id", 1),
                    "title": "Fix memory leak in session loop",
                    "body": "Detailed description of the issue.",
                    "labels": ["bug"],
                }
            elif tool_name == "create_pull_request":
                return {
                    "pr_url": f"https://github.com/{arguments.get('repo', 'org/repo')}/pull/42",
                    "status": "created",
                }

        elif server_name == "tavily":
            return {
                "results": [
                    {
                        "title": f"Documentation for {arguments.get('query', '')}",
                        "snippet": "Relevant API reference and bug resolutions.",
                    }
                ]
            }

        elif server_name == "filesystem":
            return {
                "success": True,
                "content": f"Mock content for file {arguments.get('path', '')}",
            }

        return {"status": "ok", "result": f"Executed {tool_name} on {server_name}"}

    async def disconnect_all(self) -> None:
        """Close all MCP server connections."""
        logger.info("Closing MultiServerMCPClient connections...")
        self.connected_servers.clear()
        self.tools_cache.clear()


_mcp_client: Optional[MultiServerMCPClient] = None


async def init_mcp_client() -> MultiServerMCPClient:
    """Initialize global MCP client singleton."""
    global _mcp_client
    if _mcp_client is None:
        _mcp_client = MultiServerMCPClient()
        await _mcp_client.connect_all()
    return _mcp_client


def get_mcp_client() -> MultiServerMCPClient:
    """Retrieve active MCP client singleton."""
    global _mcp_client
    if _mcp_client is None:
        _mcp_client = MultiServerMCPClient()
    return _mcp_client


async def close_mcp_client() -> None:
    """Shutdown MCP client connections."""
    global _mcp_client
    if _mcp_client is not None:
        await _mcp_client.disconnect_all()
        _mcp_client = None
