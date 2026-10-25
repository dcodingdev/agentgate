"""PostgreSQL connection pool and LangGraph PostgresSaver checkpointer setup."""

import logging
from typing import Optional
from contextlib import asynccontextmanager
from psycopg_pool import AsyncConnectionPool
from langgraph.checkpoint.base import BaseCheckpointSaver
from langgraph.checkpoint.memory import MemorySaver

from app.config import get_settings
from app.database.models import CREATE_RUN_METADATA_TABLE, RunMetadata

logger = logging.getLogger(__name__)

_pool: Optional[AsyncConnectionPool] = None
_checkpointer: Optional[BaseCheckpointSaver] = None
_fallback_memory_store: dict[str, RunMetadata] = {}


async def init_db() -> tuple[Optional[AsyncConnectionPool], BaseCheckpointSaver]:
    """Initialize Postgres connection pool and checkpointer with fallback."""
    global _pool, _checkpointer
    settings = get_settings()

    try:
        logger.info("Connecting to PostgreSQL at %s", settings.database_url)
        _pool = AsyncConnectionPool(
            conninfo=settings.database_url,
            min_size=2,
            max_size=20,
            open=False,
        )
        await _pool.open()

        # Initialize run metadata table
        async with _pool.connection() as conn:
            await conn.execute(CREATE_RUN_METADATA_TABLE)
            await conn.commit()

        # Attempt to initialize PostgresSaver for LangGraph
        try:
            import importlib

            _pg_aio = importlib.import_module("langgraph.checkpoint.postgres.aio")
            AsyncPostgresSaver = getattr(_pg_aio, "AsyncPostgresSaver")

            saver = AsyncPostgresSaver(_pool)
            await saver.setup()
            _checkpointer = saver
            logger.info("PostgreSQL checkpointer initialized successfully.")
        except Exception as exc:
            logger.warning("Could not setup AsyncPostgresSaver (%s). Falling back to MemorySaver.", exc)
            _checkpointer = MemorySaver()

    except Exception as exc:
        logger.warning(
            "PostgreSQL connection failed (%s). Running with MemorySaver and in-memory store for metadata.",
            exc,
        )
        _pool = None
        _checkpointer = MemorySaver()

    return _pool, _checkpointer


def get_db_pool() -> Optional[AsyncConnectionPool]:
    """Return active psycopg connection pool."""
    return _pool


def get_checkpointer() -> BaseCheckpointSaver:
    """Return active LangGraph checkpointer."""
    global _checkpointer
    if _checkpointer is None:
        _checkpointer = MemorySaver()
    return _checkpointer


async def close_db() -> None:
    """Close connection pool gracefully."""
    global _pool
    if _pool is not None:
        await _pool.close()
        _pool = None
        logger.info("PostgreSQL connection pool closed.")


async def save_run_metadata(metadata: RunMetadata) -> None:
    """Save or update run metadata record."""
    if _pool is not None:
        try:
            async with _pool.connection() as conn:
                query = """
                INSERT INTO run_metadata (thread_id, issue_url, repo, status, risk_score, pr_url, error_message, created_at, updated_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (thread_id) DO UPDATE SET
                    status = EXCLUDED.status,
                    risk_score = EXCLUDED.risk_score,
                    pr_url = EXCLUDED.pr_url,
                    error_message = EXCLUDED.error_message,
                    updated_at = EXCLUDED.updated_at;
                """
                await conn.execute(
                    query,
                    (
                        metadata.thread_id,
                        metadata.issue_url,
                        metadata.repo,
                        metadata.status,
                        metadata.risk_score,
                        metadata.pr_url,
                        metadata.error_message,
                        metadata.created_at,
                        metadata.updated_at,
                    ),
                )
                await conn.commit()
                return
        except Exception as exc:
            logger.error("Failed to persist run metadata to Postgres: %s", exc)

    _fallback_memory_store[metadata.thread_id] = metadata


async def get_run_metadata(thread_id: str) -> Optional[RunMetadata]:
    """Fetch run metadata record by thread ID."""
    if _pool is not None:
        try:
            async with _pool.connection() as conn:
                async with conn.cursor() as cur:
                    await cur.execute(
                        "SELECT thread_id, issue_url, repo, status, risk_score, pr_url, error_message, created_at, updated_at FROM run_metadata WHERE thread_id = %s;",
                        (thread_id,),
                    )
                    row = await cur.fetchone()
                    if row:
                        return RunMetadata(
                            thread_id=row[0],
                            issue_url=row[1],
                            repo=row[2],
                            status=row[3],
                            risk_score=row[4],
                            pr_url=row[5],
                            error_message=row[6],
                            created_at=row[7],
                            updated_at=row[8],
                        )
        except Exception as exc:
            logger.error("Failed to read run metadata from Postgres: %s", exc)

    return _fallback_memory_store.get(thread_id)
