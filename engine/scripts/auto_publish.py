#!/usr/bin/env python3
"""
auto_publish.py — CLI entry point for AI Media Engine.
Cron-ready: can be called from crontab with arguments.

Usage:
    python auto_publish.py generate "topic" --platform medium wordpress
    python auto_publish.py publish --platform medium --file content.html
    python auto_publish.py queue list
    python auto_publish.py run "topic" --count 3 --platform medium wordpress
    python auto_publish.py status
    python auto_publish.py schedule "topic" --platform medium --at "2026-06-01 10:00"
    python auto_publish.py trend --niche technology
    python auto_publish.py setup --interactive
"""

import sys
import os
import json
import time
import argparse
from datetime import datetime

# Add parent to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from core import get_engine, AIMediaEngine
from config import load_config, save_config
from scheduler import get_scheduler
from memory import get_memory
from failsafe import get_failsafe
from publishers import list_publishers, get_publisher
from agents.trend_agent import TrendAgent
from agents.draft_agent import DraftAgent
from agents.scoring_agent import ScoringAgent


def cmd_generate(args):
    """Generate an article or video script."""
    engine = get_engine()
    topic = " ".join(args.topic)

    if args.video:
        title, script_data = engine.generate_video_script(
            topic, duration_seconds=args.duration,
            language=args.lang, platform=args.platform[0] if args.platform else "youtube"
        )
        if title:
            print(f"\n{'='*60}")
            print(f"VIDEO SCRIPT: {title}")
            print(f"{'='*60}")
            print(script_data.get("script", ""))
            print(f"\n--- Tokens: {script_data.get('tokens_used', '?')} | Cost: ${script_data.get('cost_usd', 0):.4f} ---")
        else:
            print(f"Error: {script_data.get('error', 'Unknown error')}")
    else:
        title, body, scores, meta = engine.generate_article(
            topic, tone=args.tone, language=args.lang,
            keywords=args.keywords, word_count=args.words,
            platform=args.platform[0] if args.platform else "medium"
        )
        if title:
            print(f"\n{'='*60}")
            print(f"ARTICLE: {title}")
            print(f"{'='*60}")
            print(f"\n{body[:2000]}...\n")
            if scores:
                print(f"Scores: {json.dumps(scores, indent=2)}")
            print(f"\n--- Tokens: {meta.get('tokens_used', '?')} | Cost: ${meta.get('cost_usd', 0):.4f} ---")

            if args.output:
                output = {
                    "title": title,
                    "body": body,
                    "scores": scores,
                    "metadata": meta,
                    "generated_at": datetime.now().isoformat(),
                }
                with open(args.output, "w") as f:
                    json.dump(output, f, indent=2)
                print(f"\nSaved to: {args.output}")
        else:
            print(f"Error: {meta.get('error', 'Unknown error')}")


def cmd_publish(args):
    """Publish existing content to platform(s)."""
    engine = get_engine()
    platforms = args.platform

    if args.file:
        with open(args.file, "r") as f:
            data = json.load(f) if args.file.endswith(".json") else {"body": f.read()}
        title = data.get("title", args.title or "Untitled Post")
        body = data.get("body", data.get("content", ""))
    else:
        # Read from stdin
        print("Enter title (Ctrl+D to finish): ", end="", file=sys.stderr)
        title = sys.stdin.readline().strip()
        print("Enter body content (Ctrl+D to finish): ", end="", file=sys.stderr)
        body = sys.stdin.read().strip()

    if not body:
        print("Error: No content provided")
        return 1

    for platform in platforms:
        result = engine.publish_to_platform(
            platform, title, body,
            content_type="video_short" if args.video else "article",
        )
        status = "✓" if result.get("success") else "✗"
        url = result.get("url", "")
        err = result.get("error_msg", result.get("error", ""))
        print(f"  {status} {platform}: {url or err}")
        time.sleep(1)


def cmd_queue(args):
    """Manage the publishing queue."""
    scheduler = get_scheduler()

    if args.action == "list":
        stats = scheduler.get_stats()
        print(f"\nQueue Stats:")
        print(f"  Total: {stats.get('total', 0)}")
        print(f"  Queued: {stats.get('queued', stats.get('pending', 0))}")
        print(f"  Processing: {stats.get('processing', 0)}")
        print(f"  Done: {stats.get('done', 0)}")
        print(f"  Failed: {stats.get('failed', 0)}")
        print(f"  Review: {stats.get('review', 0)}")
        print(f"  Cancelled: {stats.get('cancelled', 0)}")

    elif args.action == "pending":
        jobs = scheduler.get_pending_jobs(limit=args.limit or 20)
        if not jobs:
            print("No pending jobs.")
        else:
            for j in jobs:
                sched = datetime.fromtimestamp(j["schedule_at"]).strftime("%Y-%m-%d %H:%M")
                print(f"  #{j['id']} [{j['platform']}] {j['title'][:50]} @ {sched}")

    elif args.action == "process":
        engine = get_engine()
        count = engine.process_queue(max_jobs=args.limit or 5)
        print(f"Processed {count} jobs.")

    elif args.action == "cancel":
        if args.job_id:
            scheduler.cancel_job(args.job_id[0])
            print(f"Cancelled job #{args.job_id[0]}.")

    elif args.action == "stats":
        stats = scheduler.get_stats()
        print(json.dumps(stats, indent=2))


def cmd_run(args):
    """Full autonomous run: generate + publish to multiple platforms."""
    engine = get_engine()
    topic = " ".join(args.topic)
    platforms = args.platform or ["wordpress", "medium", "devto"]

    print(f"\n{'='*60}")
    print(f"AI MEDIA ENGINE — Autonomous Publishing Run")
    print(f"{'='*60}")
    print(f"Topic:     {topic}")
    print(f"Platforms: {', '.join(platforms)}")
    print(f"Count:     {args.count}")
    print(f"Mode:      {args.mode or load_config().get('automation_mode', 'semi')}")
    print(f"{'='*60}\n")

    if args.mode == "dry":
        print("[DRY RUN MODE] No actual publishing will occur")
    elif args.mode:
        cfg = load_config()
        cfg["failsafe"]["dry_run"] = (args.mode == "dry")
        if args.mode == "auto":
            cfg["automation_mode"] = "auto"
        save_config(cfg)

    results = engine.run_auto_publish(topic, platforms, count=args.count)
    print(f"\n{'='*60}")
    print("SESSION COMPLETE")
    print(f"{'='*60}")

    successes = sum(1 for r in results for p, v in r.items()
                    if isinstance(v, dict) and v.get("success"))
    failures = sum(1 for r in results for p, v in r.items()
                   if isinstance(v, dict) and not v.get("success") and p != "_meta")
    print(f"Total sessions: {len(results)}")
    print(f"Successful: {successes}")
    print(f"Failed: {failures}")


def cmd_schedule(args):
    """Schedule content for future publishing."""
    engine = get_engine()
    topic = " ".join(args.topic)

    if args.at:
        # Parse datetime string
        try:
            dt = datetime.strptime(args.at, "%Y-%m-%d %H:%M")
            schedule_at = int(dt.timestamp())
        except ValueError:
            print("Error: Use format 'YYYY-MM-DD HH:MM' for --at")
            return 1
    else:
        schedule_at = int(time.time()) + 3600  # Default: 1 hour from now

    job_id = engine.schedule_content(
        topic=topic,
        platform=args.platform[0],
        schedule_at=schedule_at,
        cron_expr=args.cron,
        content_type="video_short" if args.video else "article",
    )
    if schedule_at > int(time.time()):
        dt_str = datetime.fromtimestamp(schedule_at).strftime("%Y-%m-%d %H:%M")
        print(f"Scheduled job #{job_id}: '{topic}' → {args.platform[0]} @ {dt_str}")
    else:
        print(f"Queued job #{job_id}: '{topic}' → {args.platform[0]} (immediate)")


def cmd_status(args):
    """Show engine status."""
    engine = get_engine()
    status = engine.get_status()

    print(f"\n{'='*60}")
    print(f"AI MEDIA ENGINE STATUS")
    print(f"{'='*60}")
    print(f"Version:          {status['version']}")
    print(f"Mode:             {status['automation_mode']}")
    print(f"Model:            {status['model']}")
    print(f"Safe Mode:        {'ON' if status['safe_mode'] else 'OFF'}")
    print(f"Dry Run:          {'ON' if status['dry_run'] else 'OFF'}")
    print(f"Platforms:        {len(status['platforms_available'])} available")
    print(f"Queue:            {json.dumps(status['queue_stats'])}")
    print(f"Daily API Calls:  {status['daily_stats'].get('api_calls', 0)}")
    print(f"Daily Publishes:  {status['daily_stats'].get('publishes', 0)}")
    print(f"Recent Content:   {status['recent_content']} items")


def cmd_trend(args):
    """Get trending topics."""
    agent = TrendAgent()
    result, tokens, cost, err = agent.get_trending_topics(
        niche=args.niche or "technology",
        count=args.count or 5
    )
    if err:
        print(f"Error: {err}")
        return

    print(f"\n{'='*60}")
    print(f"TRENDING TOPICS IN: {args.niche or 'technology'}")
    print(f"{'='*60}")
    print(result)


def cmd_setup(args):
    """Interactive setup wizard."""
    print(f"\n{'='*60}")
    print("AI MEDIA ENGINE — Setup Wizard")
    print(f"{'='*60}\n")

    config = load_config()

    # OpenRouter API Key
    current = config.get("openrouter_api_key", "")
    if current:
        print(f"OpenRouter API Key: {'***' + current[-4:] if current else 'Not set'}")
        if input("Change? (y/N): ").lower() == "y":
            config["openrouter_api_key"] = input("OpenRouter API Key: ").strip()
    else:
        config["openrouter_api_key"] = input("OpenRouter API Key (get at https://openrouter.ai): ").strip()

    # Model
    model = input(f"Model [{config.get('openrouter_model', 'openai/gpt-4o')}]: ").strip()
    if model:
        config["openrouter_model"] = model

    # Automation mode
    print("\nAutomation Mode:")
    print("  1. manual — Generate only, no auto-publish")
    print("  2. semi   — Generate + publish with confirmations (default)")
    print("  3. auto   — Full autonomous pipeline")
    mode_choice = input("Choice (1-3) [2]: ").strip()
    mode_map = {"1": "manual", "2": "semi", "3": "auto"}
    config["automation_mode"] = mode_map.get(mode_choice, "semi")

    # Language
    lang = input(f"Default language [{config.get('default_language', 'id')}]: ").strip()
    if lang:
        config["default_language"] = lang

    # Failsafe
    print("\nFailsafe Settings:")
    config["failsafe"]["safe_mode"] = input("Safe mode (block publishing) [Y/n]: ").lower() != "n"
    config["failsafe"]["dry_run"] = input("Dry run (no actual publish) [y/N]: ").lower() == "y"
    config["failsafe"]["review_mode"] = input("Review mode (manual approval needed) [Y/n]: ").lower() != "n"

    # Platform credentials
    print("\nPlatform Credentials (press Enter to skip each):")
    platforms = list_publishers()
    for p in platforms:
        if input(f"\nConfigure {p}? (y/N): ").lower() == "y":
            print(f"  Enter credentials for {p}:")
            if "credentials" not in config:
                config["credentials"] = {}
            if p not in config["credentials"]:
                config["credentials"][p] = {}

            if p == "wordpress":
                config["credentials"]["url"] = input("  Site URL: ").strip()
                config["credentials"]["username"] = input("  Username: ").strip()
                config["credentials"]["password"] = input("  Password: ").strip()
            elif p == "medium":
                config["credentials"]["token"] = input("  API Token: ").strip()
            elif p == "devto":
                config["credentials"]["api_key"] = input("  API Key: ").strip()
            elif p == "youtube":
                config["credentials"]["access_token"] = input("  OAuth Access Token: ").strip()
            else:
                # Generic: let user specify key-value pairs
                while True:
                    key = input("  Credential key (or Enter to finish): ").strip()
                    if not key:
                        break
                    val = input(f"  Value for '{key}': ").strip()
                    config["credentials"][p][key] = val

    save_config(config)
    print(f"\n{'='*60}")
    print("Configuration saved to engine_config.json")
    print(f"{'='*60}")


def main():
    parser = argparse.ArgumentParser(
        description="AI Media Engine — Autonomous Content Publishing",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python auto_publish.py generate "AI trends 2025" --platform medium
  python auto_publish.py run "machine learning" --platform wordpress devto --count 3
  python auto_publish.py status
  python auto_publish.py queue process
  python auto_publish.py schedule "SEO tips" --platform medium --at "2026-06-01 10:00"
  python auto_publish.py trend --niche technology
  python auto_publish.py setup --interactive
        """
    )
    subparsers = parser.add_subparsers(dest="command", help="Available commands")

    # generate
    gen = subparsers.add_parser("generate", help="Generate an article or video script")
    gen.add_argument("topic", nargs="+", help="Topic to generate content about")
    gen.add_argument("--platform", "-p", nargs="+", default=[], help="Target platform(s)")
    gen.add_argument("--tone", "-t", default="professional", help="Writing tone")
    gen.add_argument("--lang", "-l", default=None, help="Language (default: from config)")
    gen.add_argument("--keywords", "-k", nargs="+", default=[], help="SEO keywords")
    gen.add_argument("--words", "-w", type=int, default=800, help="Target word count")
    gen.add_argument("--video", action="store_true", help="Generate video script instead")
    gen.add_argument("--duration", type=int, default=60, help="Video duration in seconds")
    gen.add_argument("--output", "-o", help="Save output to JSON file")
    gen.set_defaults(func=cmd_generate)

    # publish
    pub = subparsers.add_parser("publish", help="Publish existing content")
    pub.add_argument("--platform", "-p", nargs="+", required=True, help="Target platform(s)")
    pub.add_argument("--file", "-f", help="File with content (JSON or text)")
    pub.add_argument("--title", "-t", help="Title (required if file is plain text)")
    pub.add_argument("--video", action="store_true", help="Publish as video content")
    pub.set_defaults(func=cmd_publish)

    # queue
    queue = subparsers.add_parser("queue", help="Manage publishing queue")
    queue.add_argument("action", choices=["list", "pending", "process", "cancel", "stats"],
                       help="Queue action")
    queue.add_argument("--job-id", nargs=1, type=int, help="Job ID for cancel")
    queue.add_argument("--limit", "-l", type=int, default=None, help="Max items")
    queue.set_defaults(func=cmd_queue)

    # run
    run = subparsers.add_parser("run", help="Full autonomous publish run")
    run.add_argument("topic", nargs="+", help="Content topic")
    run.add_argument("--platform", "-p", nargs="+", default=[], help="Target platforms")
    run.add_argument("--count", "-c", type=int, default=1, help="Number of sessions")
    run.add_argument("--mode", choices=["dry", "semi", "auto"], help="Override automation mode")
    run.set_defaults(func=cmd_run)

    # schedule
    sched = subparsers.add_parser("schedule", help="Schedule content publishing")
    sched.add_argument("topic", nargs="+", help="Topic to schedule")
    sched.add_argument("--platform", "-p", nargs=1, required=True, help="Target platform")
    sched.add_argument("--at", help="Schedule time (YYYY-MM-DD HH:MM)")
    sched.add_argument("--cron", help="Cron expression for recurring")
    sched.add_argument("--video", action="store_true", help="Video content")
    sched.set_defaults(func=cmd_schedule)

    # status
    st = subparsers.add_parser("status", help="Show engine status")
    st.set_defaults(func=cmd_status)

    # trend
    tr = subparsers.add_parser("trend", help="Get trending topics")
    tr.add_argument("--niche", "-n", default="technology", help="Niche/industry")
    tr.add_argument("--count", "-c", type=int, default=5, help="Number of topics")
    tr.set_defaults(func=cmd_trend)

    # setup
    su = subparsers.add_parser("setup", help="Interactive setup wizard")
    su.add_argument("--interactive", action="store_true", help="Run interactive setup")
    su.set_defaults(func=cmd_setup)

    args = parser.parse_args()

    if args.command is None:
        parser.print_help()
        return 0

    try:
        args.func(args)
    except KeyboardInterrupt:
        print("\nInterrupted.")
        return 130
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
        return 1

    return 0


if __name__ == "__main__":
    sys.exit(main())
