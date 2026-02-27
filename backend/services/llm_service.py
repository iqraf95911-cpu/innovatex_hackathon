"""LLM service — Google Gemini integration with graceful fallback."""

import os
import json
import logging

logger = logging.getLogger(__name__)

_model = None


def init_llm():
    """Initialize the Gemini model if API key is available."""
    global _model
    api_key = os.getenv("GEMINI_API_KEY", "")
    if not api_key:
        logger.warning("GEMINI_API_KEY not set — agents will use rule-based fallbacks")
        return

    try:
        import google.generativeai as genai
        genai.configure(api_key=api_key)
        _model = genai.GenerativeModel("gemini-1.5-flash")
        logger.info("Gemini LLM initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize Gemini: {e}")
        _model = None


def is_available() -> bool:
    """Check if LLM is available."""
    return _model is not None


async def generate(prompt: str, expect_json: bool = True) -> str | dict | None:
    """Generate a response from the LLM.

    Args:
        prompt: The prompt to send to the LLM.
        expect_json: If True, attempt to parse the response as JSON.

    Returns:
        Parsed JSON dict if expect_json, raw string otherwise, or None on failure.
    """
    if not _model:
        return None

    try:
        response = _model.generate_content(prompt)
        text = response.text.strip()

        if expect_json:
            # Clean markdown code fences if present
            if text.startswith("```"):
                lines = text.split("\n")
                text = "\n".join(lines[1:-1]) if len(lines) > 2 else text
            text = text.strip().strip("`").strip()
            if text.startswith("json"):
                text = text[4:].strip()

            return json.loads(text)

        return text

    except json.JSONDecodeError as e:
        logger.warning(f"LLM returned non-JSON response: {e}")
        return None
    except Exception as e:
        logger.error(f"LLM generation failed: {e}")
        return None
