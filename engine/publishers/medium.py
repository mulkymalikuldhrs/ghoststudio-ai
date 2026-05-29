"""
medium.py — Medium API publisher.
Uses Medium API v1: https://github.com/Medium/medium-api-docs
"""

import requests
from publishers.base import BasePublisher, PublishResult


class MediumPublisher(BasePublisher):
    """Publish to Medium via their official API."""

    def __init__(self):
        super().__init__("medium")

    def check_auth(self):
        try:
            self._require_credential("token")
            return True
        except ValueError:
            return False

    def _get_author_id(self, token):
        """Get Medium user ID."""
        resp = requests.get(
            "https://api.medium.com/v1/me",
            headers={"Authorization": f"Bearer {token}",
                     "Content-Type": "application/json",
                     "Accept": "application/json"},
            timeout=30
        )
        if resp.status_code == 200:
            return resp.json()["data"]["id"]
        return None

    def publish(self, title, body, content_type="article", options=None):
        opts = options or {}
        token = self._get_credential("token")
        author_id = self._get_credential("author_id") or self._get_author_id(token)

        if not author_id:
            return PublishResult.fail("Could not get Medium author ID. Check token.")

        url = f"https://api.medium.com/v1/users/{author_id}/posts"

        # Format body as Medium markdown if it's HTML
        content_format = opts.get("format", "html")
        tags = opts.get("tags", [])
        canonical_url = opts.get("canonical_url", "")
        publish_status = opts.get("status", "draft")  # draft, unlisted, public

        data = {
            "title": title,
            "contentFormat": content_format,
            "content": body,
            "tags": tags[:5],  # Max 5 tags
            "publishStatus": publish_status,
        }
        if canonical_url:
            data["canonicalUrl"] = canonical_url

        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
            "Accept": "application/json",
        }

        try:
            resp = requests.post(url, json=data, headers=headers, timeout=60)
            if resp.status_code in (200, 201):
                result = resp.json()["data"]
                return PublishResult.ok(
                    url=result.get("url", ""),
                    post_id=result.get("id", "")
                )
            else:
                err = resp.json().get("errors", [{}])[0].get("message", resp.text)[:300]
                return PublishResult.fail(f"HTTP {resp.status_code}: {err}", resp.status_code)

        except requests.exceptions.RequestException as e:
            return PublishResult.fail(f"Request failed: {str(e)[:200]}")
