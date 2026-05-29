"""
substack.py — Substack publisher via Substack API.
"""

import requests
from publishers.base import BasePublisher, PublishResult


class SubstackPublisher(BasePublisher):
    """Publish to Substack via their internal API."""

    def __init__(self):
        super().__init__("substack")

    def check_auth(self):
        try:
            self._require_credential("cookie")
            self._require_credential("subdomain")
            return True
        except ValueError:
            return False

    def publish(self, title, body, content_type="article", options=None):
        opts = options or {}
        subdomain = self._get_credential("subdomain")
        cookie = self._get_credential("cookie")

        base_url = f"https://{subdomain}.substack.com"
        api_url = f"{base_url}/api/v1/publish"

        headers = {
            "Cookie": cookie,
            "Content-Type": "application/json",
            "User-Agent": "Mozilla/5.0 (compatible; AI-Media-Engine/1.0)",
        }

        data = {
            "title": title,
            "body": body,
            "type": "newsletter",
            "send": False,  # Don't send email by default
        }

        if opts.get("send_email"):
            data["send"] = True
        if opts.get("audience", "everyone") in ("free", "paid"):
            data["audience"] = opts["audience"]

        try:
            resp = requests.post(api_url, json=data, headers=headers, timeout=60)
            if resp.status_code in (200, 201):
                result = resp.json()
                post_id = result.get("id", "")
                url = result.get("canonical_url", f"{base_url}/p/{post_id}")
                return PublishResult.ok(url=url, post_id=str(post_id))
            else:
                return PublishResult.fail(f"HTTP {resp.status_code}: {resp.text[:300]}", resp.status_code)

        except requests.exceptions.RequestException as e:
            return PublishResult.fail(f"Request failed: {str(e)[:200]}")
