"""
steemit.py — Steemit/Steem blockchain publisher via Steem RPC.
"""

import requests
import json
from publishers.base import BasePublisher, PublishResult


class SteemitPublisher(BasePublisher):
    """Publish to Steemit/Steem via RPC API."""

    def __init__(self):
        super().__init__("steemit")

    def check_auth(self):
        try:
            self._require_credential("posting_key")
            self._require_credential("username")
            return True
        except ValueError:
            return False

    def _get_permlink(self, title):
        """Generate a permlink from title."""
        import re
        permlink = title.lower()
        permlink = re.sub(r'[^a-z0-9]+', '-', permlink)
        permlink = permlink.strip('-')
        permlink = permlink[:200]
        if not permlink:
            permlink = "post"
        return permlink

    def publish(self, title, body, content_type="article", options=None):
        opts = options or {}
        posting_key = self._get_credential("posting_key")
        username = self._get_credential("username")

        # Using Steem RPC endpoint
        rpc_url = opts.get("rpc_url", "https://api.steemit.com")

        permlink = opts.get("permlink", self._get_permlink(title))
        tags = opts.get("tags", ["blog"])
        if isinstance(tags, str):
            tags = [tags]
        # First tag is the main category
        main_tag = tags[0] if tags else "blog"
        json_metadata = {
            "tags": tags,
            "app": "ai-media-engine/1.0",
            "format": "html",
        }

        # Comment (post) operation
        operations = [[
            "comment",
            {
                "parent_author": "",
                "parent_permlink": main_tag,
                "author": username,
                "permlink": permlink,
                "title": title,
                "body": body,
                "json_metadata": json.dumps(json_metadata),
            }
        ]]

        # Use Steem's broadcast_transaction_synchronous
        # Note: This is a simplified version. Full implementation needs
        # proper transaction signing. For production, use beem or steem Python lib.
        try:
            # First try via broadcast_json (simplified - some APIs accept this)
            payload = {
                "jsonrpc": "2.0",
                "method": "condenser_api.broadcast_json",
                "params": [json.dumps(operations)],
                "id": 1,
            }

            resp = requests.post(rpc_url, json=payload, timeout=30)
            if resp.status_code == 200:
                result = resp.json()
                if "error" in result:
                    return PublishResult.fail(
                        f"Steem API error: {result['error'].get('message', 'unknown')}"
                    )
                url = f"https://steemit.com/{main_tag}/@{username}/{permlink}"
                return PublishResult.ok(url=url, post_id=permlink)
            else:
                return PublishResult.fail(
                    f"HTTP {resp.status_code}: {resp.text[:200]}", resp.status_code
                )

        except requests.exceptions.RequestException as e:
            return PublishResult.fail(f"Request failed: {str(e)[:200]}")
