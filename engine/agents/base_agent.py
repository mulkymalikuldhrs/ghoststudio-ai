"""
Base agent with multi-provider API integration.
Falls back through: OpenRouter/OpenAI-compatible → APIFreeLLM
"""

import json
import time
import requests
from config import load_config


class BaseAgent:
    """Base class for all AI agents. Handles API calls via multiple providers."""

    def __init__(self, agent_name="base"):
        self.agent_name = agent_name
        self.cfg = load_config()

    def _messages_to_prompt(self, messages):
        """Convert messages list to a single prompt string."""
        parts = []
        for msg in messages:
            role = msg.get("role", "user")
            content = msg.get("content", "")
            if role == "system":
                parts.append(f"[System]\n{content}")
            elif role == "user":
                parts.append(f"[User]\n{content}")
            elif role == "assistant":
                parts.append(f"[Assistant]\n{content}")
        return "\n\n".join(parts)

    def _api_call(self, messages, model=None, max_tokens=2048, temperature=0.7):
        """
        Make an API call. Tries OpenRouter/OpenAI-compatible first, then APIFreeLLM.
        Returns (content: str, tokens_used: int, cost_usd: float, error: str)
        """
        config = load_config()
        api_key = config.get("openrouter_api_key", "")
        model = model or config.get("openrouter_model", "openai/gpt-4o")
        base_url = config.get("openrouter_base_url", "")

        # Try OpenRouter/OpenAI-compatible endpoint
        if api_key and base_url:
            content, tokens, cost, error = self._openai_call(
                api_key, base_url, model, messages, max_tokens, temperature
            )
            if content:
                return content, tokens, cost, None
            if error and "401" not in error and "404" not in error:
                # Non-auth errors: return immediately
                return None, 0, 0.0, error

        # Fallback: APIFreeLLM
        return self._apifree_call(messages, max_tokens)

    def _openai_call(self, api_key, base_url, model, messages, max_tokens, temperature):
        """Standard OpenAI-compatible API call."""
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
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

            cost_per_1k = 0.005 if "gpt-4" in model else 0.0005
            cost_usd = (tokens_used / 1000.0) * cost_per_1k

            return content, tokens_used, cost_usd, None

        except requests.exceptions.RequestException as e:
            return None, 0, 0.0, f"API request failed: {str(e)}"
        except (KeyError, IndexError, json.JSONDecodeError) as e:
            return None, 0, 0.0, f"API response parse error: {str(e)}"

    def _apifree_call(self, messages, max_tokens=1024):
        """Fallback to APIFreeLLM."""
        prompt = self._messages_to_prompt(messages)
        api_key = "apf_ih74idjvjf4dcexdw9jaooho"
        api_url = "https://apifreellm.com/api/v1/chat"

        try:
            resp = requests.post(
                api_url,
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json"
                },
                json={"message": prompt},
                timeout=120
            )
            data = resp.json()
            if data.get("success"):
                content = data["response"].strip()
                return content, 0, 0.0, None
            else:
                return None, 0, 0.0, data.get("error", "Unknown API error")
        except Exception as e:
            return None, 0, 0.0, str(e)

    def _build_prompt(self, system_prompt, user_prompt):
        return [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ]

    def generate(self, system_prompt, user_prompt, **kwargs):
        """Convenience method: build prompt and call API."""
        messages = self._build_prompt(system_prompt, user_prompt)
        return self._api_call(messages, **kwargs)
