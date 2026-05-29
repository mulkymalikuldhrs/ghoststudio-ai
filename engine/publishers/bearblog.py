"""
bearblog.py — Bear Blog API publisher.
"""

import requests
from publishers.base import BasePublisher, PublishResult


class BearBlogPublisher(BasePublisher):
    """Publish to Bear Blog via their API."""

    def __init__(self):
        super().__init__("bearblog")

    def check_auth(self):
        try:
            self._require_credential("token")
            self._require_credential("domain")
            return True
        except ValueError:
            return False

    def publish(self, title, body, content_type="article", options=None):
        opts = options or {}
        token = self._get_credential("token")
        domain = self._get_credential("domain")

        url = f"https://bearblog.dev/api/{domain}/posts/"

        headers = {
            "Authorization": f"Token {token}",
            "Content-Type": "application/json",
        }

        data = {
            "title": title,
            "body": body,
            "slug": opts.get("slug", ""),
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
