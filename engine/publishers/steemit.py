"""
steemit.py — Steemit/Steem blockchain publisher via beem library.
"""
import json
from publishers.base import BasePublisher, PublishResult


class SteemitPublisher(BasePublisher):
    """Publish to Steemit/Steem via beem library."""

    def __init__(self):
        super().__init__("steemit")

    def check_auth(self):
        try:
            self._require_credential("posting_key")
            self._require_credential("username")
            return True
        except ValueError:
            return False

    def publish(self, title, body, content_type="article", options=None):
        opts = options or {}
        posting_key = self._get_credential("posting_key")
        username = self._get_credential("username")
        tags = opts.get("tags", ["ai", "indonesia", "technology"])
        if isinstance(tags, str):
            tags = [tags]

        try:
            from beem import Steem
        except ImportError:
            return PublishResult.fail(
                "beem library not installed. Run: pip install beem"
            )

        try:
            stm = Steem(
                node="https://api.steemit.com",
                keys=[posting_key]
            )

            # Generate permlink from title
            import re
            from datetime import datetime
            permlink = title.lower()
            permlink = re.sub(r'[^a-z0-9]+', '-', permlink)
            permlink = permlink.strip('-')
            permlink = f"{permlink}-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}"

            tx = stm.post(
                title=title,
                body=body,
                author=username,
                tags=tags,
                permlink=permlink
            )

            url = f"https://steemit.com/{tags[0]}/@{username}/{permlink}"
            return PublishResult.ok(url=url, post_id=permlink)

        except Exception as e:
            return PublishResult.fail(str(e)[:200])
