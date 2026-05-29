"""
failsafe.py — 8-Layer Failsafe System
Translation of ghoststudio-ai failsafe.ts to Python.
"""

import time
import hashlib
import json
import threading
from datetime import datetime, timedelta
from config import load_config


class FailsafeError(Exception):
    """Base failsafe exception."""
    pass


class QualityGateError(FailsafeError):
    """Content failed quality check."""
    pass


class DuplicateContentError(FailsafeError):
    """Duplicate content detected."""
    pass


class RateLimitError(FailsafeError):
    """Rate limit exceeded."""
    pass


class BudgetLimitError(FailsafeError):
    """Budget limit reached."""
    pass


class ErrorThresholdReached(FailsafeError):
    """Error threshold exceeded."""
    pass


class FailsafeSystem:
    """
    8-layer failsafe system:
    1. Safe Mode       — blocks all publishing when enabled
    2. Review Mode     — queues content for manual review instead of auto-publishing
    3. Dry Run         — logs actions without executing them
    4. Error Threshold — stops after N consecutive errors
    5. Quality Gate    — rejects content below quality score
    6. Duplicate Detect— rejects duplicate content
    7. Rate Limit      — limits actions per time window
    8. Budget Limiter  — stops when daily/monthly budget exceeded
    """

    def __init__(self, config=None):
        self.config = config or load_config()
        self.fs_config = self.config.get("failsafe", {})
        self._error_count = 0
        self._error_lock = threading.Lock()
        self._rate_buckets = {}
        self._rate_lock = threading.Lock()
        self._daily_stats = {"api_calls": 0, "publishes": 0, "cost_usd": 0.0}
        self._daily_reset = datetime.now().date()

    # ── Layer 1: Safe Mode ─────────────────────────────────────

    def check_safe_mode(self):
        """If safe mode is on, block all publish actions."""
        if self.fs_config.get("safe_mode", True):
            raise FailsafeError("[Failsafe Layer 1] SAFE MODE: Publishing is disabled. "
                                "Set failsafe.safe_mode=false to enable.")

    # ── Layer 2: Review Mode ───────────────────────────────────

    def check_review_mode(self):
        """If review mode is on, content needs manual approval."""
        if self.fs_config.get("review_mode", True):
            return False  # signal: needs review
        return True       # signal: can auto-publish

    # ── Layer 3: Dry Run ───────────────────────────────────────

    def is_dry_run(self):
        """If dry run is on, simulate without side effects."""
        return self.fs_config.get("dry_run", False)

    # ── Layer 4: Error Threshold ───────────────────────────────

    def record_error(self):
        """Record an error and check threshold."""
        with self._error_lock:
            self._error_count += 1
            threshold = self.fs_config.get("error_threshold", 5)
            if self._error_count >= threshold:
                raise ErrorThresholdReached(
                    f"[Failsafe Layer 4] ERROR THRESHOLD: {self._error_count} consecutive errors "
                    f"(max {threshold}). Aborting."
                )

    def record_success(self):
        """Reset error count on success."""
        with self._error_lock:
            self._error_count = 0

    def reset_error_count(self):
        with self._error_lock:
            self._error_count = 0

    # ── Layer 5: Quality Gate ─────────────────────────────────

    def check_quality_gate(self, score, min_score=None):
        """Check if content quality meets threshold."""
        if not self.fs_config.get("quality_gate_enabled", True):
            return True
        threshold = min_score if min_score is not None else self.fs_config.get("quality_min_score", 0.6)
        if score < threshold:
            raise QualityGateError(
                f"[Failsafe Layer 5] QUALITY GATE: Score {score:.2f} < threshold {threshold:.2f}. "
                f"Content rejected."
            )
        return True

    # ── Layer 6: Duplicate Detection ──────────────────────────

    def check_duplicate(self, content_hash, memory_system=None):
        """Check for duplicate content using memory system."""
        if not self.fs_config.get("duplicate_detection", True):
            return True
        if memory_system and memory_system.is_duplicate(content_hash):
            raise DuplicateContentError(
                f"[Failsafe Layer 6] DUPLICATE: Content hash {content_hash[:16]}... already exists."
            )
        return True

    @staticmethod
    def compute_content_hash(title, body, platform=None):
        """Compute a hash for duplicate detection."""
        raw = f"{title}||{body}||{platform or ''}"
        return hashlib.sha256(raw.encode("utf-8")).hexdigest()

    # ── Layer 7: Rate Limit ───────────────────────────────────

    def check_rate_limit(self, action_type="publish"):
        """Rate limit per minute."""
        max_per_minute = self.fs_config.get("rate_limit_per_minute", 10)
        now = time.time()
        minute = int(now // 60)

        with self._rate_lock:
            key = (action_type, minute)
            count = self._rate_buckets.get(key, 0)
            if count >= max_per_minute:
                raise RateLimitError(
                    f"[Failsafe Layer 7] RATE LIMIT: {count} {action_type} actions in current minute "
                    f"(max {max_per_minute})."
                )
            self._rate_buckets[key] = count + 1
            # Clean old buckets
            for k in list(self._rate_buckets.keys()):
                if k[1] < minute - 2:
                    del self._rate_buckets[k]

    # ── Layer 8: Budget Limiter ───────────────────────────────

    def _ensure_daily_reset(self):
        today = datetime.now().date()
        if today != self._daily_reset:
            self._daily_stats = {"api_calls": 0, "publishes": 0, "cost_usd": 0.0}
            self._daily_reset = today

    def track_api_call(self, cost_usd=0.0):
        """Track API call towards budget limits."""
        self._ensure_daily_reset()
        limits = self.config.get("budget_limits", {})
        if not self.fs_config.get("budget_limiter", True):
            return

        self._daily_stats["api_calls"] += 1
        self._daily_stats["cost_usd"] += cost_usd

        daily_calls_limit = limits.get("daily_api_calls", 100)
        monthly_budget = limits.get("monthly_api_budget_usd", 50.0)

        if self._daily_stats["api_calls"] > daily_calls_limit:
            raise BudgetLimitError(
                f"[Failsafe Layer 8] BUDGET: {self._daily_stats['api_calls']} API calls today "
                f"(max {daily_calls_limit})."
            )

    def track_publish(self):
        """Track publish operation towards daily limit."""
        self._ensure_daily_reset()
        limits = self.config.get("budget_limits", {})
        daily_publishes_limit = limits.get("daily_publishes", 20)
        self._daily_stats["publishes"] += 1

        if self._daily_stats["publishes"] > daily_publishes_limit:
            raise BudgetLimitError(
                f"[Failsafe Layer 8] BUDGET: {self._daily_stats['publishes']} publishes today "
                f"(max {daily_publishes_limit})."
            )

    def get_daily_stats(self):
        self._ensure_daily_reset()
        return dict(self._daily_stats)

    # ── Combined Check ────────────────────────────────────────

    def preflight(self, action_type="publish", memory_system=None,
                  content_hash=None, quality_score=None):
        """
        Run all applicable failsafe checks before an action.
        Returns: (passed: bool, needs_review: bool, error_msg: str)
        """
        try:
            # Layer 1
            self.check_safe_mode()
        except FailsafeError as e:
            return False, False, str(e)

        # Layer 2
        can_auto = self.check_review_mode()

        # Layer 3 (no-op, caller checks is_dry_run)

        # Layer 7
        try:
            self.check_rate_limit(action_type)
        except FailsafeError as e:
            return False, False, str(e)

        # Layer 5
        if quality_score is not None:
            try:
                self.check_quality_gate(quality_score)
            except FailsafeError as e:
                return False, False, str(e)

        # Layer 6
        if content_hash and memory_system:
            try:
                self.check_duplicate(content_hash, memory_system)
            except FailsafeError as e:
                return False, False, str(e)

        # Layer 8
        try:
            if action_type == "publish":
                self.track_publish()
            else:
                self.track_api_call()
        except FailsafeError as e:
            return False, False, str(e)

        return True, (not can_auto), None


# Singleton
_failsafe_instance = None

def get_failsafe():
    global _failsafe_instance
    if _failsafe_instance is None:
        _failsafe_instance = FailsafeSystem()
    return _failsafe_instance
