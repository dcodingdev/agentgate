"""LLM client factory for active providers (Gemini and Grok)."""

import logging
from typing import Any, Optional
# pyrefly: ignore[missing-import]
from langchain_openai import ChatOpenAI
from app.config import get_settings

logger = logging.getLogger(__name__)


def get_llm(model: Optional[str] = None, temperature: float = 0.2) -> Any:
    """Instantiate and return the configured ChatModel (Gemini or Grok)."""
    settings = get_settings()
    target_model = model or settings.model_name or "gemini-flash-3.8"

    # 1. Google Gemini via OpenAI-compatible endpoint
    if settings.gemini_api_key and ("gemini" in target_model.lower() or not settings.grok_api_key):
        logger.info("Initializing ChatOpenAI for Gemini model: %s", target_model)
        return ChatOpenAI(
            base_url="https://generativelanguage.googleapis.com/v1beta/openai/",
            api_key=settings.gemini_api_key,
            model=target_model,
            temperature=temperature,
        )

    # 2. xAI Grok via OpenAI-compatible endpoint
    if settings.grok_api_key:
        logger.info("Initializing ChatOpenAI for Grok model: %s", target_model)
        return ChatOpenAI(
            base_url="https://api.x.ai/v1",
            api_key=settings.grok_api_key,
            model=target_model,
            temperature=temperature,
        )

    # 3. Fallback when keys are missing or during offline tests
    logger.warning("No real LLM provider key available. Using mock chat model.")
    return ChatOpenAI(
        api_key="mock-key",
        model="mock-model",
        temperature=temperature,
    )
