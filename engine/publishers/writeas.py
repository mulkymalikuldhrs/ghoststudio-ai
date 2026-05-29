"""
writeas.py — Write.as / WriteFreely API publisher.
Publishes to personal blog if no collection is specified.
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
            return True
        except ValueError:
            return False

    def publish(self, title, body, content_type="article", options=None):
        opts = options or {}
        token = self._get_credential("token")
        collection = self._get_credential("collection")
        if not collection:
            collection = opts.get("collection", "")

        if collection:
            url = f"https://write.as/api/collections/{collection}/posts"
        else:
            # Post to personal blog
            url = "https://write.as/api/posts"

        headers = {
            "Authorization": token,
            "Content-Type": "application/json",
        }

        data = {
            "title": title,
            "body": body,
        }
        if opts.get("slug"):
            data["slug"] = opts["slug"]

        try:
            resp = requests.post(url, json=data, headers=headers, timeout=60)
            if resp.status_code in (200, 201):
                result = resp.json().get("data", {})
                post_url = result.get("url", "")
                # If posting to personal blog, construct URL
                if not post_url and not collection:
                    post_slug = result.get("slug", "")
                    post_url = f"https://aimediatech.writeas.io/{post_slug}"
                return PublishResult.ok(
                    url=post_url or "",
                    post_id=result.get("id", "")
                )
            else:
                err_text = resp.text[:300]
                try:
                    err_text = resp.json().get("error_msg", err_text)
                except Exception:
                    pass
                return PublishResult.fail(f"HTTP {resp.status_code}: {err_text}", resp.status_code)

        except requests.exceptions.RequestException as e:
            return PublishResult.fail(f"Request failed: {str(e)[:200]}")
