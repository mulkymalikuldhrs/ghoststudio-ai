"""
wordpress.py — WordPress XML-RPC / REST API publisher.
"""

import requests
from publishers.base import BasePublisher, PublishResult


class WordPressPublisher(BasePublisher):
    """Publish to self-hosted WordPress via REST API."""

    def __init__(self):
        super().__init__("wordpress")

    def check_auth(self):
        try:
            url = self._require_credential("url")
            self._require_credential("username")
            self._require_credential("password")
            return True
        except ValueError:
            return False

    def publish(self, title, body, content_type="article", options=None):
        opts = options or {}
        site_url = self._get_credential("url").rstrip("/")
        username = self._get_credential("username")
        password = self._get_credential("password")

        api_url = f"{site_url}/wp-json/wp/v2/posts"

        data = {
            "title": title,
            "content": body,
            "status": opts.get("status", "publish"),
            "categories": opts.get("categories", []),
            "tags": opts.get("tags", []),
            "slug": opts.get("slug", ""),
        }

        if opts.get("excerpt"):
            data["excerpt"] = opts["excerpt"]

        try:
            resp = requests.post(
                api_url,
                auth=(username, password),
                json=data,
                timeout=60,
                headers={"Content-Type": "application/json"}
            )

            if resp.status_code in (200, 201):
                result = resp.json()
                return PublishResult.ok(
                    url=result.get("link", ""),
                    post_id=str(result.get("id", ""))
                )
            else:
                err = resp.json().get("message", resp.text)[:300]
                return PublishResult.fail(f"HTTP {resp.status_code}: {err}", resp.status_code)

        except requests.exceptions.RequestException as e:
            return PublishResult.fail(f"Request failed: {str(e)[:200]}")
