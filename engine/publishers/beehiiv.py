"""
beehiiv.py — Beehiiv API publisher.
"""

import requests
from publishers.base import BasePublisher, PublishResult


class BeehiivPublisher(BasePublisher):
    """Publish to Beehiiv via their REST API."""

    def __init__(self):
        super().__init__("beehiiv")

    def check_auth(self):
        try:
            self._require_credential("api_key")
            self._require_credential("publication_id")
            return True
        except ValueError:
            return False

    def publish(self, title, body, content_type="article", options=None):
        opts = options or {}
        api_key = self._get_credential("api_key")
        pub_id = self._get_credential("publication_id")

        url = f"https://api.beehiiv.com/v2/publications/{pub_id}/posts"

        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }

        data = {
            "title": title,
            "content": body,
            "type": "default",
            "status": opts.get("status", "draft"),
        }

        if opts.get("audience", "all") in ("free", "premium"):
            data["audience"] = opts["audience"]
        if opts.get("tags"):
            data["tags"] = opts["tags"]
        if opts.get("preview_text"):
            data["preview_text"] = opts["preview_text"]

        try:
            resp = requests.post(url, json=data, headers=headers, timeout=60)
            if resp.status_code in (200, 201):
                result = resp.json()
                post_data = result.get("data", {})
                return PublishResult.ok(
                    url=post_data.get("url", ""),
                    post_id=post_data.get("id", "")
                )
            else:
                err = resp.json().get("error", resp.text)[:300]
                return PublishResult.fail(f"HTTP {resp.status_code}: {err}", resp.status_code)

        except requests.exceptions.RequestException as e:
            return PublishResult.fail(f"Request failed: {str(e)[:200]}")
