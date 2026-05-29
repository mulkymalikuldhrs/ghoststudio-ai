"""
youtube.py — YouTube API publisher (videos & Shorts).
Uses YouTube Data API v3 via OAuth 2.0.
"""

import requests
import json
from publishers.base import BasePublisher, PublishResult


class YouTubePublisher(BasePublisher):
    """
    Upload to YouTube via Data API v3.
    Requires OAuth 2.0 credentials.
    For Shorts, set content_type='video_short' and options.short=True.
    """

    def __init__(self):
        super().__init__("youtube")

    def check_auth(self):
        try:
            self._require_credential("access_token")
            return True
        except ValueError:
            return False

    def publish(self, title, body, content_type="video", options=None):
        opts = options or {}
        access_token = self._get_credential("access_token")

        # For video uploads, YouTube uses multipart resumable upload
        # This is a simplified version using the API for metadata-only operations
        # For actual video upload, you need the video file and chunks upload

        video_path = opts.get("video_path", "")
        is_short = opts.get("short", False) or content_type == "video_short"

        if not video_path:
            # Return instructions for video upload
            return PublishResult.fail(
                "YouTube video upload requires a video file. "
                "Set options.video_path to the mp4 file path. "
                "Full resumable upload is available via google-api-python-client."
            )

        # Try uploading with requests (simplified resumable upload)
        try:
            # Step 1: Get resumable upload URL
            metadata = {
                "snippet": {
                    "title": title,
                    "description": body[:5000],
                    "tags": opts.get("tags", []),
                    "categoryId": opts.get("category_id", "22"),  # 22 = People & Blogs
                },
                "status": {
                    "privacyStatus": opts.get("privacy_status", "public"),
                    "selfDeclaredMadeForKids": opts.get("for_kids", False),
                }
            }

            if is_short:
                metadata["status"]["selfDeclaredMadeForKids"] = False

            headers = {
                "Authorization": f"Bearer {access_token}",
                "Content-Type": "application/json",
                "X-Upload-Content-Length": str(opts.get("file_size", 0)),
                "X-Upload-Content-Type": "video/*",
            }

            # Initiate resumable session
            resp = requests.post(
                "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status",
                headers=headers,
                json=metadata,
                timeout=30,
            )

            if resp.status_code == 200:
                upload_url = resp.headers.get("Location", "")
                if not upload_url:
                    return PublishResult.fail("No upload URL received from YouTube")

                # Step 2: Upload video file
                with open(video_path, "rb") as f:
                    video_data = f.read()

                upload_headers = {
                    "Content-Length": str(len(video_data)),
                    "Content-Type": "video/*",
                }

                upload_resp = requests.put(
                    upload_url,
                    headers=upload_headers,
                    data=video_data,
                    timeout=600,  # 10 min for upload
                )

                if upload_resp.status_code in (200, 201):
                    result = upload_resp.json()
                    video_id = result.get("id", "")
                    return PublishResult.ok(
                        url=f"https://youtu.be/{video_id}",
                        post_id=video_id
                    )
                else:
                    return PublishResult.fail(
                        f"Upload failed: HTTP {upload_resp.status_code}: {upload_resp.text[:200]}",
                        upload_resp.status_code
                    )
            else:
                err = resp.json().get("error", {}).get("message", resp.text)[:300]
                return PublishResult.fail(
                    f"Init failed: HTTP {resp.status_code}: {err}", resp.status_code
                )

        except IOError as e:
            return PublishResult.fail(f"File error: {str(e)[:200]}")
        except requests.exceptions.RequestException as e:
            return PublishResult.fail(f"Request failed: {str(e)[:200]}")
