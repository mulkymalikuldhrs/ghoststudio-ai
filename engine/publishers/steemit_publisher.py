"""
Steemit publisher for AI Media Engine.
Publishes articles to Steem blockchain via beem library.
"""
import json
import os
import sys

POSTING_KEY = "5Jz8BVDWNpLnkxryddxW1HNkiKJNz9Duz1gREoqubEKjmbDuNpv"
AUTHOR = "mulkymalikuldhr"
NODES = ["https://api.steemit.com", "https://rpc.steemviz.com"]


def publish(title, body, tags=None):
    """
    Publish article to Steemit.
    Returns (url: str, error: str)
    """
    if tags is None:
        tags = ["ai", "indonesia", "technology"]

    try:
        from beem import Steem
    except ImportError:
        return None, "beem library not installed. Run: pip install beem"

    try:
        stm = Steem(node=NODES, keys=[POSTING_KEY])

        # Format body for Steem (markdown)
        formatted_body = body
        if not body.strip():
            return None, "Empty body"

        # Create permlink from title
        import re
        permlink = title.lower()
        permlink = re.sub(r'[^a-z0-9]+', '-', permlink)
        permlink = permlink.strip('-')
        permlink = f"{permlink}-{__import__('datetime').datetime.utcnow().strftime('%Y%m%d%H%M%S')}"

        # Post
        tx = stm.post(
            title=title,
            body=formatted_body,
            author=AUTHOR,
            tags=tags,
            permlink=permlink
        )

        url = f"https://steemit.com/{tags[0]}/@{AUTHOR}/{permlink}"
        return url, None

    except Exception as e:
        return None, str(e)
