"""
blogger.py — Google Blogger API v3 publisher.
"""

import requests
import json
from publishers.base import BasePublisher, PublishResult


class BloggerPublisher(BasePublisher):
    """Publish to Google Blogger via REST API v3."""

    def __init__(self):
        super().__init__("blogger")

    def check_auth(self):
        try:
            self._require_credential("access_token")
            self._require_credential("blog_id")
            return True
        except ValueError:
            return False

    def publish(self, title, body, content_type="article", options=None):
        opts = options or {}
        access_token = self._get_credential("access_token")
        blog_id = self._get_credential("blog_id")

        url = f"https://www.googleapis.com/blogger/v3/blogs/{blog_id}/posts/"

        data = {
            "kind": "blogger#post",
            "title": title,
            "content": body,
            "labels": opts.get("labels", []),
        }

        if opts.get("published_at"):
            data["published"] = opts["published_at"]

        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json",
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
                err = resp.json().get("error", {}).get("message", resp.text)[:300]
                return PublishResult.fail(f"HTTP {resp.status_code}: {err}", resp.status_code)

        except requests.exceptions.RequestException as e:
            return PublishResult.fail(f"Request failed: {str(e)[:200]}")
