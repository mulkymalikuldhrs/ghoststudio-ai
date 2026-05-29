"""
telegraph.py — Telegraph API publisher (telegra.ph).
Uses the Telegraph API: https://telegra.ph/api
"""

import requests
import json
from publishers.base import BasePublisher, PublishResult


class TelegraphPublisher(BasePublisher):
    """Publish to Telegraph (telegra.ph) via their API. No auth needed."""

    def __init__(self):
        super().__init__("telegraph")

    def check_auth(self):
        return True  # No auth required for Telegraph

    def publish(self, title, body, content_type="article", options=None):
        opts = options or {}
        author_name = opts.get("author_name", "AI Media Engine")
        author_url = opts.get("author_url", "")

        # Convert HTML to Telegraph's Node format (simplified: just use HTML)
        # Telegraph API accepts simple HTML content
        api_url = "https://api.telegra.ph/createPage"

        data = {
            "title": title,
            "author_name": author_name,
            "content": json.dumps([{"tag": "p", "children": [body[:4000]]}]),
            "return_content": False,
        }

        if author_url:
            data["author_url"] = author_url

        try:
            resp = requests.post(api_url, json=data, timeout=30)
            if resp.status_code == 200:
                result = resp.json()
                if result.get("ok"):
                    page = result["result"]
                    return PublishResult.ok(
                        url=page.get("url", ""),
                        post_id=page.get("path", "")
                    )
                else:
                    return PublishResult.fail(f"API error: {result.get('error', 'unknown')}")
            else:
                return PublishResult.fail(f"HTTP {resp.status_code}: {resp.text[:200]}", resp.status_code)

        except requests.exceptions.RequestException as e:
            return PublishResult.fail(f"Request failed: {str(e)[:200]}")
