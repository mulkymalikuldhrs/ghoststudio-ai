"""
core.py — AI Media Engine: main orchestration engine.
Content generation, scoring, multi-platform publishing pipeline.
"""

import time
import json
import hashlib
import threading
from datetime import datetime

from config import load_config, save_config
from failsafe import get_failsafe, FailsafeError
from memory import get_memory, MemorySystem
from scheduler import get_scheduler, SchedulerQueue

from agents import (
    DraftAgent, HumanicAgent, SEOAgent,
    RepurposeAgent, ScoringAgent, MemoryAgent, TrendAgent
)
from publishers import get_publisher, list_publishers


class AIMediaEngine:
    """
    Autonomous Content Engine Core.
    Orchestrates content generation → quality scoring → publishing pipeline.
    """

    def __init__(self):
        self.cfg = load_config()
        self.failsafe = get_failsafe()
        self.memory = get_memory()
        self.scheduler = get_scheduler()
        self._running = False
        self._lock = threading.Lock()

        # Initialize agents
        self.draft = DraftAgent()
        self.humanic = HumanicAgent()
        self.seo = SEOAgent()
        self.repurposer = RepurposeAgent()
        self.scorer = ScoringAgent()
        self.mem_agent = MemoryAgent()
        self.trend = TrendAgent()

    # ── Content Generation Pipeline ────────────────────────────

    def generate_article(self, topic, tone=None, language=None,
                         keywords=None, word_count=800, platform="medium"):
        """
        Full article generation pipeline:
        1. Draft generation → 2. Humanize → 3. SEO optimize → 4. Score
        Returns (title, body, scores, metadata)
        """
        tone = tone or self.cfg.get("default_tone", "professional")
        language = language or self.cfg.get("default_language", "id")

        print(f"[engine] Generating article: '{topic}' ({language}, {tone})")

        # Step 1: Draft
        result1, tokens1, cost1, err1 = self.draft.generate_article(
            topic, tone=tone, language=language,
            keywords=keywords, word_count=word_count
        )
        if err1 or not result1:
            return None, None, None, {"error": f"Draft failed: {err1}"}

        # Extract title from first line if possible
        lines = result1.strip().split("\n", 1)
        title = lines[0].strip().replace("#", "").strip()[:200]
        body = lines[1] if len(lines) > 1 else result1

        print(f"[engine] Draft complete ({tokens1} tokens, ${cost1:.4f})")

        # Step 2: Humanize
        result2, tokens2, cost2, err2 = self.humanic.humanize(
            body, platform=platform
        )
        body = result2 or body  # Fallback to original

        # Step 3: SEO Optimize
        result3, tokens3, cost3, err3 = self.seo.optimize_article(
            body, keywords=keywords, platform=platform
        )
        body = result3 or body

        total_tokens = tokens1 + tokens2 + tokens3
        total_cost = cost1 + cost2 + cost3

        # Step 4: Score
        scores = self._score_content(body, platform, keywords)

        # Track API usage
        try:
            self.failsafe.track_api_call(total_cost)
        except FailsafeError as e:
            print(f"[engine] Budget warning: {e}")

        metadata = {
            "tokens_used": total_tokens,
            "cost_usd": total_cost,
            "language": language,
            "tone": tone,
            "keywords": keywords or [],
            "pipeline": "draft→humanize→seo→score",
        }

        return title, body, scores, metadata

    def generate_video_script(self, topic, duration_seconds=60,
                               language=None, tone="casual", platform="youtube"):
        """Generate a faceless video script."""
        language = language or self.cfg.get("default_language", "id")

        print(f"[engine] Generating video script: '{topic}' ({duration_seconds}s, {platform})")

        result, tokens, cost, err = self.draft.generate_video_script(
            topic, duration_seconds=duration_seconds,
            language=language, tone=tone
        )
        if err or not result:
            return None, {"error": f"Script generation failed: {err}"}

        # Extract title
        lines = result.strip().split("\n", 1)
        title = lines[0].strip().replace("#", "").strip()[:200]
        script = lines[1] if len(lines) > 1 else result

        # Adapt for specific short-form platform if needed
        if platform in ("tiktok", "instagram", "youtube_short"):
            adapted, _, _, _ = self.repurposer.adapt_video_for_short(script, platform)
            script = adapted or script

        print(f"[engine] Script complete ({tokens} tokens, ${cost:.4f})")

        try:
            self.failsafe.track_api_call(cost)
        except FailsafeError as e:
            print(f"[engine] Budget warning: {e}")

        return title, {
            "script": script,
            "duration": duration_seconds,
            "platform": platform,
            "tokens_used": tokens,
            "cost_usd": cost,
        }

    # ── Publishing Pipeline ────────────────────────────────────

    def publish_to_platform(self, platform, title, body,
                             content_type="article", options=None):
        """
        Publish content to a specific platform with full failsafe.
        Returns PublishResult.
        """
        opts = options or {}
        publisher = get_publisher(platform)
        if not publisher:
            return {"success": False, "error": f"Unsupported platform: {platform}"}

        # Quality score check
        quality_score = opts.get("quality_score")
        if quality_score is None and content_type == "article":
            scores = self._score_content(body, platform)
            quality_score = scores.get("overall_score", 0.6)
            opts["quality_score"] = quality_score

        print(f"[engine] Publishing to {platform} (quality: {quality_score:.2f})...")

        result = publisher.publish_with_retry(title, body, content_type, opts)

        print(f"[engine] {'✓' if result.success else '✗'} {platform}: "
              f"{result.url or result.error_msg}")

        return result.to_dict() if hasattr(result, 'to_dict') else result

    def publish_to_multiple(self, title, body, platforms,
                             content_type="article", options=None):
        """Publish same content to multiple platforms."""
        opts = options or {}
        results = {}

        for platform in platforms:
            try:
                results[platform] = self.publish_to_platform(
                    platform, title, body, content_type, opts
                )
            except Exception as e:
                results[platform] = {"success": False, "error": str(e)}

            # Small delay between platforms to avoid rate limits
            time.sleep(2)

        return results

    # ── Full Pipeline: Generate → Adapt → Publish ──────────────

    def create_and_publish(self, topic, platforms, tone=None, language=None,
                           keywords=None, word_count=800, video_mode=False):
        """
        End-to-end: generate master content, adapt for each platform, publish.
        """
        results = {}

        if video_mode:
            # Generate video script
            title, script_data = self.generate_video_script(
                topic, platform=platforms[0] if platforms else "youtube"
            )
            if not title:
                return {"error": script_data.get("error", "Generation failed")}

            # Publish script as description + video metadata
            for platform in platforms:
                body = script_data["script"]
                opts = {
                    "video_path": keywords[0] if isinstance(keywords, list) and keywords else "",
                    "tags": keywords if isinstance(keywords, list) else [],
                    "auto_publish": self.cfg.get("automation_mode") == "auto",
                    "script_metadata": script_data,
                }
                results[platform] = self.publish_to_platform(
                    platform, title, body, content_type="video_short", options=opts
                )
        else:
            # Generate master article
            title, body, scores, meta = self.generate_article(
                topic, tone=tone, language=language,
                keywords=keywords, word_count=word_count
            )
            if not title:
                return {"error": meta.get("error", "Generation failed")}

            # Save to memory
            content_hash = hashlib.sha256(
                f"{title}||{body}".encode()
            ).hexdigest()
            self.memory.log_content(
                content_hash=content_hash,
                title=title,
                platform="master",
                content_type="article",
                status="generated",
                score=scores.get("overall_score", 0.0) if scores else 0.0,
                metadata={"topic": topic, "tone": tone, "language": language}
            )

            if scores:
                self.memory.save_quality_scores(
                    content_id=0,  # Will be updated
                    score=scores.get("overall_score", 0),
                    readability=scores.get("readability", 0),
                    seo_score=scores.get("seo_score", 0),
                    originality=scores.get("originality", 0),
                    platform_fit=scores.get("platform_fit", 0),
                )

            # Adapt and publish for each platform
            for platform in platforms:
                adapted_body = body
                if platform != "master":
                    adapted, _, _, _ = self.repurposer.adapt_for_platform(
                        body, platform, title=title, language=language
                    )
                    adapted_body = adapted or body

                opts = {
                    "tags": keywords if isinstance(keywords, list) else [],
                    "quality_score": scores.get("overall_score", 0.6) if scores else 0.6,
                    "tokens_used": meta.get("tokens_used", 0),
                    "cost_usd": meta.get("cost_usd", 0.0),
                }

                results[platform] = self.publish_to_platform(
                    platform, title, adapted_body, content_type="article", options=opts
                )

                time.sleep(1)

            results["_meta"] = {
                "title": title,
                "scores": scores,
                "tokens_used": meta.get("tokens_used", 0),
                "cost_usd": meta.get("cost_usd", 0.0),
            }

        return results

    # ── Scheduler Integration ──────────────────────────────────

    def process_queue(self, max_jobs=5):
        """Process pending jobs from the scheduler queue."""
        processed = 0
        for _ in range(max_jobs):
            job = self.scheduler.get_next_job()
            if not job:
                break

            print(f"[engine] Processing job #{job['id']}: {job['title']} → {job['platform']}")

            try:
                if job["content_type"] == "video_short":
                    title, script_data = self.generate_video_script(
                        job.get("topic", job["title"]),
                        platform=job["platform"]
                    )
                    if title:
                        opts = {
                            "tags": job.get("tags", []),
                            "auto_publish": self.cfg.get("automation_mode") == "auto",
                        }
                        result = self.publish_to_platform(
                            job["platform"], title,
                            script_data.get("script", ""),
                            content_type="video_short",
                            options=opts
                        )
                    else:
                        self.scheduler.mark_failed(job["id"],
                            script_data.get("error", "Generation failed"))
                        continue
                else:
                    # Article generation + publish
                    result = self.create_and_publish(
                        topic=job.get("topic", job["title"]),
                        platforms=[job["platform"]],
                        tone=job.get("tone", self.cfg.get("default_tone")),
                        language=self.cfg.get("default_language"),
                    )

                if isinstance(result, dict):
                    plat_result = result.get(job["platform"], {})
                    if isinstance(plat_result, dict) and plat_result.get("success"):
                        self.scheduler.mark_done(job["id"], plat_result)
                    else:
                        err = plat_result.get("error", "Unknown error")
                        self.scheduler.mark_failed(job["id"], err)
                elif hasattr(result, 'success') and result.success:
                    self.scheduler.mark_done(job["id"], result.to_dict())
                else:
                    err = getattr(result, 'error_msg', 'Unknown error')
                    self.scheduler.mark_failed(job["id"], err)

            except Exception as e:
                self.scheduler.mark_failed(job["id"], str(e)[:300])

            processed += 1

        return processed

    # ── Internal ───────────────────────────────────────────────

    def _score_content(self, content, platform, keywords=None):
        """Score content quality."""
        scores, _, _, err = self.scorer.score_content(content, platform, keywords)
        if err or not scores:
            return {"overall_score": 0.6}
        return scores

    # ── Stats & Status ─────────────────────────────────────────

    def get_status(self):
        """Get engine status summary."""
        memory_stats = self.memory.get_recent_content(limit=5)
        scheduler_stats = self.scheduler.get_stats()
        failsafe_stats = self.failsafe.get_daily_stats()

        return {
            "version": "1.0.0",
            "automation_mode": self.cfg.get("automation_mode", "semi"),
            "model": self.cfg.get("openrouter_model", ""),
            "platforms_available": list_publishers(),
            "queue_stats": scheduler_stats,
            "daily_stats": failsafe_stats,
            "recent_content": len(memory_stats),
            "safe_mode": self.cfg.get("failsafe", {}).get("safe_mode", True),
            "dry_run": self.cfg.get("failsafe", {}).get("dry_run", False),
        }

    def run_auto_publish(self, topic, platforms=None, count=3):
        """Run an autonomous publishing session."""
        if platforms is None:
            # Auto-select based on what's configured
            platforms = ["wordpress", "medium", "devto"]

        results = []
        for i in range(count):
            print(f"\n{'='*60}")
            print(f"[engine] Session {i+1}/{count}: {topic}")
            print(f"{'='*60}")

            # Get trending angle if available
            trend_data, _, _, _ = self.trend.get_trending_topics(topic, count=1)

            result = self.create_and_publish(topic, platforms)
            results.append(result)

            if i < count - 1:
                delay = 30  # 30s between sessions
                print(f"[engine] Waiting {delay}s before next session...")
                time.sleep(delay)

        return results

    def schedule_content(self, topic, platform, schedule_at=None,
                         cron_expr=None, priority=5, content_type="article"):
        """Schedule content for future publishing."""
        job_id = self.scheduler.add_job(
            platform=platform,
            title=topic,
            content_type=content_type,
            topic=topic,
            schedule_at=schedule_at,
            cron_expr=cron_expr,
            priority=priority,
        )
        return job_id


# Singleton
_engine_instance = None

def get_engine():
    global _engine_instance
    if _engine_instance is None:
        _engine_instance = AIMediaEngine()
    return _engine_instance
