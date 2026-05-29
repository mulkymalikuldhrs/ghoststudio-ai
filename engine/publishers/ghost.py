"""
ghost.py — Ghost CMS Admin API publisher.
"""

import requests
import json
from publishers.base import BasePublisher, PublishResult


class GhostPublisher(BasePublisher):
    """Publish to Ghost CMS via Admin API (Content API key)."""

    def __init__(self):
        super().__init__("ghost")

    def check_auth(self):
        try:
            self._require_credential("url")
            self._require_credential("admin_api_key")
            return True
        except ValueError:
            return False

    def publish(self, title, body, content_type="article", options=None):
        opts = options or {}
        site_url = self._get_credential("url").rstrip("/")
        api_key = self._get_credential("admin_api_key")

        # Ghost Admin API endpoint
        url = f"{site_url}/ghost/api/admin/posts/"

        data = {
            "posts": [{
                "title": title,
                "html": body,
                "status": opts.get("status", "published"),
                "feature_image": opts.get("feature_image", ""),
                "featured": opts.get("featured", False),
                "meta_title": opts.get("meta_title", ""),
                "meta_description": opts.get("meta_description", ""),
                "tags": [{"name": t} for t in opts.get("tags", [])],
            }]
        }

        headers = {
            "Authorization": f"Ghost {api_key}",
            "Content-Type": "application/json",
        }

        try:
            resp = requests.post(url, json=data, headers=headers, timeout=60)
            if resp.status_code in (200, 201):
                post = resp.json().get("posts", [{}])[0]
                return PublishResult.ok(
                    url=post.get("url", ""),
                    post_id=post.get("id", "")
                )
            else:
                err = resp.json().get("errors", [{}])[0].get("message", resp.text)[:300]
                return PublishResult.fail(f"HTTP {resp.status_code}: {err}", resp.status_code)

        except requests.exceptions.RequestException as e:
            return PublishResult.fail(f"Request failed: {str(e)[:200]}")
