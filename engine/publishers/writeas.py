"""
writeas.py — Write.as / WriteFreely API publisher.
"""

import requests
from publishers.base import BasePublisher, PublishResult


class WriteAsPublisher(BasePublisher):
    """Publish to Write.as / WriteFreely via API."""

    def __init__(self):
        super().__init__("writeas")

    def check_auth(self):
        try:
            self._require_credential("token")
            self._require_credential("collection")
            return True
        except ValueError:
            return False

    def publish(self, title, body, content_type="article", options=None):
        opts = options or {}
        token = self._get_credential("token")
        collection = self._get_credential("collection")

        url = f"https://write.as/api/collections/{collection}/posts"

        headers = {
            "Authorization": f"Token {token}",
            "Content-Type": "application/json",
        }

        data = {
            "title": title,
            "body": body,
            "slug": opts.get("slug", ""),
        }

        if opts.get("pinned"):
            data["pinned"] = True

        try:
            resp = requests.post(url, json=data, headers=headers, timeout=60)
            if resp.status_code in (200, 201):
                result = resp.json().get("data", {})
                return PublishResult.ok(
                    url=result.get("url", ""),
                    post_id=result.get("id", "")
                )
            else:
                err = resp.json().get("error", resp.text)[:300]
                return PublishResult.fail(f"HTTP {resp.status_code}: {err}", resp.status_code)

        except requests.exceptions.RequestException as e:
            return PublishResult.fail(f"Request failed: {str(e)[:200]}")
