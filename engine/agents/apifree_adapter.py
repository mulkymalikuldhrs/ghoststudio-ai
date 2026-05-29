"""
APIFreeLLM adapter — replaces base_agent API calls with APIFreeLLM.
"""
import requests
import os

API_KEY = os.environ.get("APIFREELLM_API_KEY", "apf_ih74idjvjf4dcexdw9jaooho")
API_URL = "https://apifreellm.com/api/v1/chat"

def generate_text(prompt, model=None, max_tokens=1024):
    """
    Generate text via APIFreeLLM.
    Returns (content: str, tokens: int, cost: float, error: str)
    """
    try:
        resp = requests.post(
            API_URL,
            headers={
                "Authorization": f"Bearer {API_KEY}",
                "Content-Type": "application/json"
            },
            json={"message": prompt},
            timeout=120
        )
        data = resp.json()
        if data.get("success"):
            return data["response"], 0, 0.0, None
        else:
            return None, 0, 0.0, data.get("error", "Unknown API error")
    except Exception as e:
        return None, 0, 0.0, str(e)
