"""
vocal.py — Vocal.media publisher (browser automation stub).
"""

from publishers.base import BasePublisher, PublishResult


class VocalPublisher(BasePublisher):
    """
    Publish to Vocal.media.
    NOTE: Vocal has no official public API.
    Uses browser automation via Selenium/Playwright.
    Install: pip install playwright && playwright install
    """

    def __init__(self):
        super().__init__("vocal")
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

    def publish(self, title, body, content_type="article", options=None):
        if not self._playwright_available:
            return PublishResult.fail(
                "Playwright not installed. Run: pip install playwright && playwright install chromium"
            )

        opts = options or {}
        email = self._get_credential("email")
        password = self._get_credential("password")

        try:
            from playwright.sync_api import sync_playwright

            with sync_playwright() as p:
                browser = p.chromium.launch(headless=True)
                context = browser.new_context()
                page = context.new_page()

                # Login
                page.goto("https://vocal.media/login", timeout=30000)
                page.fill('input[name="email"]', email)
                page.fill('input[name="password"]', password)
                page.click('button[type="submit"]')
                page.wait_for_timeout(5000)

                # Navigate to create story
                page.goto("https://vocal.media/stories/new", timeout=30000)
                page.wait_for_timeout(3000)

                # Fill title
                page.fill('input[name="title"]', title)
                page.wait_for_timeout(1000)

                # Fill body
                page.fill('div[contenteditable="true"]', body)
                page.wait_for_timeout(2000)

                # Set tags if provided
                if opts.get("tags"):
                    for tag in opts["tags"][:5]:
                        page.fill('input[name="tags"]', tag)
                        page.press('input[name="tags"]', "Enter")
                        page.wait_for_timeout(500)

                # Submit
                if opts.get("auto_publish", False):
                    page.click('button:has-text("Publish")')
                else:
                    page.click('button:has-text("Save Draft")')
                page.wait_for_timeout(3000)

                page_url = page.url
                browser.close()

                return PublishResult.ok(
                    url=page_url,
                    post_id="vocal_auto"
                )

        except Exception as e:
            return PublishResult.fail(f"Browser automation failed: {str(e)[:300]}")
