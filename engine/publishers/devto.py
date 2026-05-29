"""
devto.py — DEV.to API publisher.
"""

import requests
from publishers.base import BasePublisher, PublishResult


class DevToPublisher(BasePublisher):
    """Publish to dev.to via their API."""

    def __init__(self):
        super().__init__("devto")

    def check_auth(self):
        try:
            self._require_credential("api_key")
            return True
        except ValueError:
            return False

    def publish(self, title, body, content_type="article", options=None):
        opts = options or {}
        api_key = self._get_credential("api_key")

        url = "https://dev.to/api/articles"

        headers = {
            "api-key": api_key,
            "Content-Type": "application/json",
        }

        data = {
            "article": {
                "title": title,
                "body_markdown": body,
                "published": opts.get("published", True),
                "tags": (opts.get("tags", []) or [])[:4],  # Max 4 tags
                "series": opts.get("series", ""),
                "description": opts.get("description", ""),
                "canonical_url": opts.get("canonical_url", ""),
                "main_image": opts.get("main_image", ""),
            }
        }

        try:
            resp = requests.post(url, json=data, headers=headers, timeout=60)
            if resp.status_code in (200, 201):
                result = resp.json()
                return PublishResult.ok(
                    url=result.get("url", ""),
                    post_id=str(result.get("id", ""))
                )
            else:
                err = resp.json().get("error", resp.text)[:300]
                return PublishResult.fail(f"HTTP {resp.status_code}: {err}", resp.status_code)

        except requests.exceptions.RequestException as e:
            return PublishResult.fail(f"Request failed: {str(e)[:200]}")
