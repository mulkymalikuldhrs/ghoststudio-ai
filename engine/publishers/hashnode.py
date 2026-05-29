"""
hashnode.py — Hashnode API publisher.
"""

import requests
from publishers.base import BasePublisher, PublishResult


class HashnodePublisher(BasePublisher):
    """Publish to Hashnode via GraphQL API."""

    def __init__(self):
        super().__init__("hashnode")

    def check_auth(self):
        try:
            self._require_credential("api_key")
            self._require_credential("publication_id")
            return True
        except ValueError:
            return False

    def publish(self, title, body, content_type="article", options=None):
        opts = options or {}
        api_key = self._get_credential("api_key")
        pub_id = self._get_credential("publication_id")

        url = "https://gql.hashnode.com/"

        headers = {
            "Authorization": api_key,
            "Content-Type": "application/json",
        }

        mutation = """
        mutation PublishPost($input: PublishPostInput!) {
            publishPost(input: $input) {
                post {
                    id
                    url
                    title
                }
            }
        }
        """

        variables = {
            "input": {
                "publicationId": pub_id,
                "title": title,
                "contentMarkdown": body,
                "isRepublished": opts.get("is_republished", False),
                "tags": [{"id": t} for t in opts.get("tags", [])],
                "slug": opts.get("slug", ""),
                "metaTags": {
                    "description": opts.get("description", ""),
                    "image": opts.get("cover_image", ""),
                },
                "settings": {
                    "delisted": opts.get("delisted", False),
                    "disableComments": opts.get("disable_comments", False),
                },
            }
        }

        payload = {
            "query": mutation,
            "variables": variables,
        }

        try:
            resp = requests.post(url, json=payload, headers=headers, timeout=60)
            if resp.status_code == 200:
                data = resp.json()
                if "errors" in data:
                    err = data["errors"][0]["message"][:300]
                    return PublishResult.fail(f"GraphQL error: {err}")
                post = data.get("data", {}).get("publishPost", {}).get("post", {})
                return PublishResult.ok(
                    url=post.get("url", ""),
                    post_id=post.get("id", "")
                )
            else:
                return PublishResult.fail(f"HTTP {resp.status_code}: {resp.text[:300]}", resp.status_code)

        except requests.exceptions.RequestException as e:
            return PublishResult.fail(f"Request failed: {str(e)[:200]}")
