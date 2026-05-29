"""
lokal.py — Generic REST publisher for custom/local platforms.
"""

import requests
from publishers.base import BasePublisher, PublishResult


class LokalPublisher(BasePublisher):
    """Publish to any custom/local REST endpoint."""

    def __init__(self):
        super().__init__("lokal")

    def check_auth(self):
        try:
            self._require_credential("url")
            return True
        except ValueError:
            return False

    def publish(self, title, body, content_type="article", options=None):
        opts = options or {}
        endpoint_url = self._get_credential("url")
        method = opts.get("method", "POST").upper()
        api_key = self._get_credential("api_key")

        headers = {
            "Content-Type": opts.get("content_type", "application/json"),
        }

        if api_key:
            auth_header = opts.get("auth_header", "Authorization")
            auth_prefix = opts.get("auth_prefix", "Bearer")
            headers[auth_header] = f"{auth_prefix} {api_key}"

        # Additional headers from config
        extra_headers = self._get_credential("headers")
        if isinstance(extra_headers, dict):
            headers.update(extra_headers)

        # Build payload based on template
        template = opts.get("template", "standard")
        if template == "standard":
            data = {
                "title": title,
                "body": body,
                "type": content_type,
            }
        elif template == "custom":
            # Use custom mapping from options
            field_map = opts.get("field_map", {"title": "title", "body": "body"})
            data = {
                field_map.get("title", "title"): title,
                field_map.get("body", "body"): body,
            }
        else:
            data = {"title": title, "content": body}

        # Merge extra fields
        extra_fields = opts.get("extra_fields", {})
        if isinstance(extra_fields, dict):
            data.update(extra_fields)

        try:
            if method == "PUT":
                resp = requests.put(endpoint_url, json=data, headers=headers, timeout=60)
            elif method == "PATCH":
                resp = requests.patch(endpoint_url, json=data, headers=headers, timeout=60)
            else:
                resp = requests.post(endpoint_url, json=data, headers=headers, timeout=60)

            if resp.status_code in (200, 201, 202, 204):
                try:
                    result = resp.json()
                except (ValueError, requests.exceptions.JSONDecodeError):
                    result = {"status_code": resp.status_code}

                return PublishResult.ok(
                    url=result.get("url", result.get("link",
                        opts.get("success_url", endpoint_url))),
                    post_id=str(result.get("id", result.get("post_id", "")))
                )
            else:
                return PublishResult.fail(
                    f"HTTP {resp.status_code}: {resp.text[:300]}", resp.status_code
                )

        except requests.exceptions.RequestException as e:
            return PublishResult.fail(f"Request failed: {str(e)[:200]}")
