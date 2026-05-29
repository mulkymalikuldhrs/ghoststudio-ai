"""
telegraph.py — Telegraph API publisher (telegra.ph).
Uses the Telegraph API: https://telegra.ph/api
"""

import requests
import json
from publishers.base import BasePublisher, PublishResult


class TelegraphPublisher(BasePublisher):
    """Publish to Telegraph (telegra.ph) via their API. No auth needed."""

    def __init__(self):
        super().__init__("telegraph")

    def check_auth(self):
        return True  # No auth required for Telegraph

    def publish(self, title, body, content_type="article", options=None):
        opts = options or {}
        author_name = opts.get("author_name", "AI Media Engine")
        author_url = opts.get("author_url", "")

        # Get access token - Telegraph requires one for createPage
        access_token = opts.get("access_token", "")
        if not access_token:
            access_token = self._get_credential("access_token") or ""

        if not access_token:
            # Create anonymous account on first use
            try:
                resp = requests.post("https://api.telegra.ph/createAccount", json={
                    "short_name": author_name[:32],
                    "author_name": author_name[:128],
                    "author_url": author_url[:512]
                }, timeout=15)
                if resp.status_code == 200 and resp.json().get("ok"):
                    access_token = resp.json()["result"]["access_token"]
                    print(f"      📝 Created Telegraph account with token: {access_token[:10]}...")
                else:
                    return PublishResult.fail(f"Failed to create account: {resp.text[:200]}")
            except Exception as e:
                return PublishResult.fail(f"Account creation failed: {str(e)[:200]}")

        # Telegraph API limits - split long content into multiple paragraphs
        # Maximum 64KB per page, content as array of Node elements
        paragraphs = body.strip().split("\n\n")
        content_nodes = []
        for para in paragraphs:
            para = para.strip()
            if not para:
                continue
            # Handle headers
            if para.startswith("## "):
                content_nodes.append({"tag": "h2", "children": [para[3:]]})
            elif para.startswith("### "):
                content_nodes.append({"tag": "h3", "children": [para[4:]]})
            elif para.startswith("**") and para.endswith("**"):
                content_nodes.append({"tag": "p", "children": [{"tag": "b", "children": [para[2:-2]]}]})
            elif para.startswith("- ") or para.startswith("* "):
                items = para.split("\n")
                list_items = []
                for item in items:
                    item = item.strip()
                    if item.startswith("- ") or item.startswith("* "):
                        list_items.append({"tag": "li", "children": [item[2:]]})
                if list_items:
                    content_nodes.append({"tag": "ul", "children": list_items})
            else:
                # Treat numbered items as paragraphs
                if para[0].isdigit() and ". " in para[:5]:
                    parts = para.split(". ", 1)
                    content_nodes.append({"tag": "p", "children": [parts[1]]})
                else:
                    content_nodes.append({"tag": "p", "children": [para]})

        api_url = "https://api.telegra.ph/createPage"
        data = {
            "access_token": access_token,
            "title": title,
            "author_name": author_name[:128],
            "content": json.dumps(content_nodes),
            "return_content": False,
        }
        if author_url:
            data["author_url"] = author_url[:512]

        try:
            resp = requests.post(api_url, json=data, timeout=30)
            if resp.status_code == 200:
                result = resp.json()
                if result.get("ok"):
                    page = result["result"]
                    return PublishResult.ok(
                        url=page.get("url", ""),
                        post_id=page.get("path", "")
                    )
                else:
                    return PublishResult.fail(f"API error: {result.get('error', 'unknown')}")
            else:
                return PublishResult.fail(f"HTTP {resp.status_code}: {resp.text[:200]}", resp.status_code)
        except requests.exceptions.RequestException as e:
            return PublishResult.fail(f"Request failed: {str(e)[:200]}")
