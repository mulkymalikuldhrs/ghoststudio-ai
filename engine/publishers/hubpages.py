"""
hubpages.py — HubPages publisher (browser automation stub).
"""

from publishers.base import BasePublisher, PublishResult


class HubPagesPublisher(BasePublisher):
    """
    Publish to HubPages.
    NOTE: HubPages has no official public API.
    Uses browser automation via Selenium/Playwright.
    Install: pip install playwright && playwright install
    """

    def __init__(self):
        super().__init__("hubpages")
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
                page.goto("https://hubpages.com/login", timeout=30000)
                page.fill('input[name="email"]', email)
                page.fill('input[name="password"]', password)
                page.click('button[type="submit"]')
                page.wait_for_timeout(5000)

                # Navigate to create hub
                page.goto("https://hubpages.com/my/new", timeout=30000)
                page.wait_for_timeout(3000)

                # Fill title
                page.fill('input[name="title"]', title)
                page.wait_for_timeout(1000)

                # Fill body (using the editor)
                page.fill('div[contenteditable="true"]', body)
                page.wait_for_timeout(2000)

                # Set category if provided
                if opts.get("category"):
                    page.select_option('select[name="category"]', opts["category"])

                # Publish or save draft
                if opts.get("auto_publish", False):
                    page.click('button:has-text("Publish")')
                else:
                    page.click('button:has-text("Save Draft")')
                page.wait_for_timeout(3000)

                page_url = page.url
                browser.close()

                return PublishResult.ok(
                    url=page_url,
                    post_id="hubpages_auto"
                )

        except Exception as e:
            return PublishResult.fail(f"Browser automation failed: {str(e)[:300]}")

    def publish_stub(self, title, body, content_type="article", options=None):
        """Stub implementation for when Playwright is not available."""
        return PublishResult.fail(
            "HubPages requires browser automation. Install playwright:\n"
            "  pip install playwright\n"
            "  playwright install chromium\n\n"
            "Then configure credentials in engine_config.json:\n"
            "  credentials.hubpages.email and credentials.hubpages.password"
        )
