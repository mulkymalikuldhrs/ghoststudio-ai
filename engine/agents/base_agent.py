"""
Base agent with OpenRouter API integration.
"""

import json
import time
import requests
from config import load_config


class BaseAgent:
    """Base class for all AI agents. Handles OpenRouter API calls."""

    def __init__(self, agent_name="base"):
        self.agent_name = agent_name
        self.cfg = load_config()

    def _api_call(self, messages, model=None, max_tokens=2048, temperature=0.7):
        """
        Make an OpenRouter API call.
        Returns (content: str, tokens_used: int, cost_usd: float, error: str)
        """
        config = load_config()
        api_key = config.get("openrouter_api_key", "")
        if not api_key:
            return None, 0, 0.0, "OpenRouter API key not configured. Set OPENROUTER_API_KEY env var."

        model = model or config.get("openrouter_model", "openai/gpt-4o")
        base_url = config.get("openrouter_base_url", "https://openrouter.ai/api/v1")

        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://github.com/nousresearch/ai-media-engine",
            "X-Title": "AI Media Engine",
        }

        payload = {
            "model": model,
            "messages": messages,
            "max_tokens": max_tokens,
            "temperature": temperature,
        }

        try:
            resp = requests.post(
                f"{base_url}/chat/completions",
                headers=headers,
                json=payload,
                timeout=120
            )
            resp.raise_for_status()
            data = resp.json()

            choice = data["choices"][0]
            content = choice["message"]["content"].strip()
            usage = data.get("usage", {})
            tokens_used = usage.get("total_tokens", 0)

            # Estimate cost: ~$0.01 per 1K tokens for GPT-4o
            cost_per_1k = 0.005 if "gpt-4" in model else 0.0005
            cost_usd = (tokens_used / 1000.0) * cost_per_1k

            return content, tokens_used, cost_usd, None

        except requests.exceptions.RequestException as e:
            return None, 0, 0.0, f"API request failed: {str(e)}"
        except (KeyError, IndexError, json.JSONDecodeError) as e:
            return None, 0, 0.0, f"API response parse error: {str(e)}"

    def _build_prompt(self, system_prompt, user_prompt):
        return [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ]

    def generate(self, system_prompt, user_prompt, **kwargs):
        """Convenience method: build prompt and call API."""
        messages = self._build_prompt(system_prompt, user_prompt)
        return self._api_call(messages, **kwargs)
