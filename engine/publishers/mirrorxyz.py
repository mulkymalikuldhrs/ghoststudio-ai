"""
mirrorxyz.py — Mirror.xyz API publisher (Arweave-based publishing).
"""

import requests
from publishers.base import BasePublisher, PublishResult


class MirrorXYZPublisher(BasePublisher):
    """Publish to Mirror.xyz via their API."""

    def __init__(self):
        super().__init__("mirrorxyz")

    def check_auth(self):
        try:
            self._require_credential("api_key")
            self._require_credential("project_id")
            return True
        except ValueError:
            return False

    def publish(self, title, body, content_type="article", options=None):
        opts = options or {}
        api_key = self._get_credential("api_key")
        project_id = self._get_credential("project_id")

        url = "https://api.mirror.xyz/v1/entries"

        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }

        data = {
            "project": project_id,
            "title": title,
            "body": body,
            "timestamp": opts.get("timestamp", ""),
            "originalVersion": opts.get("original_version", ""),
        }

        try:
            resp = requests.post(url, json=data, headers=headers, timeout=60)
            if resp.status_code in (200, 201):
                result = resp.json()
                return PublishResult.ok(
                    url=result.get("url", ""),
                    post_id=result.get("id", "")
                )
            else:
                err = resp.json().get("error", resp.text)[:300]
                return PublishResult.fail(f"HTTP {resp.status_code}: {err}", resp.status_code)

        except requests.exceptions.RequestException as e:
            return PublishResult.fail(f"Request failed: {str(e)[:200]}")
