"""
tiktok.py — TikTok publisher via browser automation.
"""

from publishers.base import BasePublisher, PublishResult


class TikTokPublisher(BasePublisher):
    """
    Upload to TikTok via browser automation.
    NOTE: TikTok has no official public upload API.
    Uses browser automation via Playwright.
    Install: pip install playwright && playwright install
    Requires a pre-recorded video file.
    """

    def __init__(self):
        super().__init__("tiktok")
        self._playwright_available = False
        self._check_playwright()

    def _check_playwright(self):
        try:
            import playwright
            self._playwright_available = True
        except ImportError:
            self._playwright_available = False

    def check_auth(self):
        try:
            self._require_credential("email")
            self._require_credential("password")
            return True
        except ValueError:
            return False

    def publish(self, title, body, content_type="video_short", options=None):
        """
        Upload a video to TikTok.
        content_type should be 'video_short'.
        body is the video script/text content (used as caption).
        options.video_path: path to mp4 file.
        """
        if not self._playwright_available:
            return PublishResult.fail(
                "Playwright not installed. Run: pip install playwright && playwright install chromium"
            )

        opts = options or {}
        video_path = opts.get("video_path", "")
        if not video_path:
            return PublishResult.fail(
                "No video_path provided. TikTok requires a pre-recorded video file."
            )

        email = self._get_credential("email")
        password = self._get_credential("password")
        caption = body[:2200] if len(body) > 2200 else body  # TikTok caption limit

        try:
            from playwright.sync_api import sync_playwright

            with sync_playwright() as p:
                browser = p.chromium.launch(headless=True)
                context = browser.new_context()
                page = context.new_page()

                # Login
                page.goto("https://www.tiktok.com/login/phone-or-email", timeout=30000)
                page.wait_for_timeout(3000)

                # Switch to email login if needed
                try:
                    page.click('div:has-text("Log in with email")')
                    page.wait_for_timeout(2000)
                except:
                    pass

                page.fill('input[name="username"]', email)
                page.fill('input[name="password"]', password)
                page.click('button[type="submit"]')
                page.wait_for_timeout(8000)

                # Upload video
                page.goto("https://www.tiktok.com/upload", timeout=30000)
                page.wait_for_timeout(3000)

                # Upload file
                file_input = page.locator('input[type="file"]')
                file_input.set_input_files(video_path)
                page.wait_for_timeout(10000)  # Wait for upload processing

                # Fill caption
                caption_input = page.locator('div[contenteditable="true"]')
                if caption_input:
                    caption_input.fill(caption)
                    page.wait_for_timeout(2000)

                # Set settings
                if opts.get("allow_comments") is False:
                    page.click('span:has-text("Allow comments")')
                if opts.get("allow_duet") is True:
                    page.click('span:has-text("Allow duet")')

                # Post
                if opts.get("auto_publish", True):
                    page.click('button:has-text("Post")')
                    page.wait_for_timeout(5000)

                page_url = page.url
                browser.close()

                return PublishResult.ok(
                    url=page_url,
                    post_id="tiktok_auto"
                )

        except Exception as e:
            return PublishResult.fail(f"TikTok browser automation failed: {str(e)[:300]}")
