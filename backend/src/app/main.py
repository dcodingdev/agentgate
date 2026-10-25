"""FastAPI application entry point with lifespan management."""

import logging
from contextlib import asynccontextmanager
from typing import AsyncGenerator
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import router as runs_router
from app.config import get_settings
from app.database.connection import close_db, init_db
from app.tools.mcp_client import close_mcp_client, init_mcp_client
from app.agents.graph import build_graph

# Configure structured logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s - %(message)s",
)
logger = logging.getLogger("agentgate")


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Lifespan context manager for database, checkpointer, MCP, and graph initialization."""
    settings = get_settings()
    logger.info("Initializing AgentGate backend (Debug: %s)...", settings.debug)

    # 1. Initialize PostgreSQL Connection Pool & Checkpointer
    pool, checkpointer = await init_db()

    # 2. Initialize MultiServer MCP Client
    await init_mcp_client()

    # 3. Assemble and compile StateGraph with checkpointer
    graph = build_graph(checkpointer=checkpointer)
    app.state.graph = graph
    app.state.pool = pool
    app.state.checkpointer = checkpointer

    logger.info("AgentGate initialization complete. Ready to receive requests.")
    yield

    # Teardown on shutdown
    logger.info("Shutting down AgentGate backend...")
    await close_mcp_client()
    await close_db()
    logger.info("AgentGate shutdown complete.")


# Initialize FastAPI app
app = FastAPI(
    title="AgentGate API",
    description="Autonomous SWE Agent system with LangGraph, MCP, E2B Sandbox, and HITL guardrails.",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount routes under both /api/v1 and root prefixes
app.include_router(runs_router, prefix="/api/v1")
app.include_router(runs_router)


@app.get("/health", tags=["System"])
async def health_check() -> dict:
    """Service health check endpoint."""
    return {"status": "healthy", "service": "agentgate-backend", "version": "0.1.0"}


@app.get("/", tags=["System"])
async def root() -> dict:
    """Service root endpoint."""
    return {
        "message": "Welcome to AgentGate SWE Agent Backend",
        "docs_url": "/docs",
        "health_url": "/health",
    }


if __name__ == "__main__":
    import uvicorn

    settings = get_settings()
    uvicorn.run(
        "app.main:app",
        host=settings.fastapi_host,
        port=settings.fastapi_port,
        reload=settings.debug,
    )
