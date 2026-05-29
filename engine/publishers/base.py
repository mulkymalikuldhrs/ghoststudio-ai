"""
base.py — Base publisher class with auth, rate-limit backoff, error handling, retry.
"""

import time
import json
import random
from abc import ABC, abstractmethod
from config import load_config, get_credential
from failsafe import get_failsafe, FailsafeError
from memory import get_memory


class PublishResult:
    """Result of a publish operation."""

    def __init__(self, success=False, url="", post_id="", error_msg="",
                 response_time_ms=0, status_code=0):
        self.success = success
        self.url = url
        self.post_id = post_id
        self.error_msg = error_msg
        self.response_time_ms = response_time_ms
        self.status_code = status_code

    def to_dict(self):
        return {
            "success": self.success,
            "url": self.url,
            "post_id": self.post_id,
            "error_msg": self.error_msg,
            "response_time_ms": self.response_time_ms,
            "status_code": self.status_code,
        }

    @classmethod
    def ok(cls, url="", post_id=""):
        return cls(success=True, url=url, post_id=post_id)

    @classmethod
    def fail(cls, error_msg, status_code=0):
        return cls(success=False, error_msg=error_msg, status_code=status_code)


class BasePublisher(ABC):
    """Abstract base class for all platform publishers."""

    def __init__(self, platform_name):
        self.platform = platform_name
        self.cfg = load_config()
        self.failsafe = get_failsafe()
        self.memory = get_memory()
        self.max_retries = self.cfg.get("max_retries", 3)
        self.retry_delay = self.cfg.get("retry_delay_seconds", 10)

    @abstractmethod
    def publish(self, title, body, content_type="article", options=None):
        """
        Publish content to the platform.
        Must return a PublishResult.
        """
        pass

    @abstractmethod
    def check_auth(self):
        """Check if credentials are configured and valid."""
        pass

    def pre_publish_checks(self, title, body, content_type="article", quality_score=None):
        """Run failsafe checks before publishing."""
        content_hash = self.failsafe.compute_content_hash(title, body, self.platform)

        passed, needs_review, error = self.failsafe.preflight(
            action_type="publish",
            memory_system=self.memory,
            content_hash=content_hash,
            quality_score=quality_score,
        )

        if not passed:
            return None, error

        return content_hash, None

    def publish_with_retry(self, title, body, content_type="article", options=None):
        """Publish with retry logic and rate-limit backoff."""
        if self.failsafe.is_dry_run():
            self.memory.log_platform_action(
                self.platform, "publish_dry_run", success=True
            )
            return PublishResult.ok(url="[DRY_RUN]", post_id="dry_run")

        # Pre-checks
        content_hash, error = self.pre_publish_checks(title, body, content_type,
                                                       options.get("quality_score") if options else None)
        if content_hash is None:
            self.failsafe.record_error()
            return PublishResult.fail(error)

        last_error = None
        for attempt in range(self.max_retries):
            try:
                start = time.time()
                result = self.publish(title, body, content_type, options)
                elapsed = int((time.time() - start) * 1000)
                result.response_time_ms = elapsed

                # Log to memory
                self.memory.log_platform_action(
                    self.platform,
                    "publish",
                    success=result.success,
                    response_time_ms=elapsed,
                    error_msg=result.error_msg,
                )

                if result.success:
                    self.failsafe.record_success()
                    # Log content
                    self.memory.log_content(
                        content_hash=content_hash,
                        title=title,
                        platform=self.platform,
                        content_type=content_type,
                        status="published",
                        tokens_used=options.get("tokens_used", 0) if options else 0,
                        cost_usd=options.get("cost_usd", 0.0) if options else 0.0,
                    )
                    return result
                else:
                    last_error = result.error_msg
                    self.failsafe.record_error()

            except FailsafeError as e:
                return PublishResult.fail(str(e))
            except Exception as e:
                last_error = str(e)
                self.failsafe.record_error()

            # Retry with exponential backoff
            if attempt < self.max_retries - 1:
                delay = self.retry_delay * (2 ** attempt) + random.uniform(0, 5)
                time.sleep(delay)

        return PublishResult.fail(
            f"All {self.max_retries} attempts failed. Last error: {last_error}"
        )

    def _get_credential(self, key=None):
        """Get credential for this platform."""
        return get_credential(self.platform, key)

    def _require_credential(self, key, label=None):
        """Require a credential or raise."""
        val = self._get_credential(key)
        if not val:
            raise ValueError(
                f"{label or key} not configured for {self.platform}. "
                f"Set credentials.{self.platform}.{key} in engine_config.json"
            )
        return val
