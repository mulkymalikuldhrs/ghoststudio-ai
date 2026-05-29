"""
instagram.py — Instagram Reels/Posts publisher via browser automation.
"""

from publishers.base import BasePublisher, PublishResult


class InstagramPublisher(BasePublisher):
    """
    Upload to Instagram (Reels/posts) via browser automation.
    NOTE: Instagram has no official content upload API for individuals.
    Uses browser automation via Playwright.
    Install: pip install playwright && playwright install
    """

    def __init__(self):
        super().__init__("instagram")
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
            self._require_credential("username")
            self._require_credential("password")
            return True
        except ValueError:
            return False

    def publish(self, title, body, content_type="video_short", options=None):
        """
        Upload to Instagram.
        content_type: 'video_short' (Reel) or 'image' (post).
        body: caption text.
        options.media_path: path to image/video file.
        """
        if not self._playwright_available:
            return PublishResult.fail(
                "Playwright not installed. Run: pip install playwright && playwright install chromium"
            )

        opts = options or {}
        media_path = opts.get("media_path", "")
        if not media_path:
            return PublishResult.fail(
                "No media_path provided. Instagram requires an image or video file."
            )

        username = self._get_credential("username")
        password = self._get_credential("password")
        caption = body[:2200]

        is_reel = content_type == "video_short" or opts.get("is_reel", False)

        try:
            from playwright.sync_api import sync_playwright

            with sync_playwright() as p:
                browser = p.chromium.launch(headless=True)
                context = browser.new_context()
                page = context.new_page()

                # Login
                page.goto("https://www.instagram.com/accounts/login/", timeout=30000)
                page.wait_for_timeout(3000)

                page.fill('input[name="username"]', username)
                page.fill('input[name="password"]', password)
                page.click('button[type="submit"]')
                page.wait_for_timeout(8000)

                # Dismiss "Save Info" dialog if appears
                try:
                    page.click('button:has-text("Not Now")')
                    page.wait_for_timeout(2000)
                except:
                    pass

                # Dismiss notifications dialog
                try:
                    page.click('button:has-text("Not Now")')
                    page.wait_for_timeout(2000)
                except:
                    pass

                if is_reel:
                    # Create Reel
                    page.goto("https://www.instagram.com/reels/new/", timeout=30000)
                    page.wait_for_timeout(3000)
                else:
                    # Create Post
                    page.click('svg[aria-label="New post"]')
                    page.wait_for_timeout(2000)

                # Upload media
                file_input = page.locator('input[type="file"]')
                if file_input:
                    file_input.set_input_files(media_path)
                    page.wait_for_timeout(5000)
                else:
                    return PublishResult.fail("Could not find file input element")

                # Next/Continue buttons
                for _ in range(3):  # Multiple next steps
                    try:
                        page.click('div[role="button"]:has-text("Next")')
                        page.wait_for_timeout(2000)
                    except:
                        try:
                            page.click('div[role="button"]:has-text("Continue")')
                            page.wait_for_timeout(2000)
                        except:
                            pass

                # Write caption
                caption_area = page.locator('[aria-label="Write a caption..."]')
                if caption_area:
                    caption_area.fill(caption)
                    page.wait_for_timeout(2000)

                # Share
                if opts.get("auto_publish", True):
                    page.click('div[role="button"]:has-text("Share")')
                    page.wait_for_timeout(5000)

                page_url = page.url
                browser.close()

                return PublishResult.ok(
                    url=f"https://www.instagram.com/{username}/",
                    post_id="instagram_auto"
                )

        except Exception as e:
            return PublishResult.fail(f"Instagram browser automation failed: {str(e)[:300]}")
