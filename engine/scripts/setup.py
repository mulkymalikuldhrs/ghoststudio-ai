#!/usr/bin/env python3
"""
setup.py — First-time setup for AI Media Engine.
Creates directories, initializes database, and runs interactive configuration.
"""

import sys
import os
import json
from pathlib import Path

# Add parent to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config import load_config, save_config, CONFIG_PATH
from memory import MemorySystem
from scheduler import SchedulerQueue


def main():
    print("=" * 60)
    print("AI MEDIA ENGINE — Setup")
    print("=" * 60)

    # Create directories
    base = os.path.expanduser("~/Desktop/ai-media-engine")
    for d in ["agents", "publishers", "scripts", "data"]:
        Path(os.path.join(base, d)).mkdir(parents=True, exist_ok=True)
    print(f"✓ Directories created under {base}")

    # Create default config if not exists
    config_path = Path(CONFIG_PATH)
    if not config_path.exists():
        cfg = load_config()
        save_config(cfg)
        print(f"✓ Default config created at {config_path}")
    else:
        print(f"• Config already exists at {config_path}")

    # Initialize databases
    cfg = load_config()
    mem_db = cfg.get("memory_db_path", "")
    sched_db = cfg.get("scheduler_db_path", "")

    if mem_db:
        Path(mem_db).parent.mkdir(parents=True, exist_ok=True)
        mem = MemorySystem(mem_db)
        mem.close()
        print(f"✓ Memory database initialized at {mem_db}")

    if sched_db:
        Path(sched_db).parent.mkdir(parents=True, exist_ok=True)
        sched = SchedulerQueue(sched_db)
        sched.close()
        print(f"✓ Scheduler database initialized at {sched_db}")

    # Run interactive setup
    from scripts.auto_publish import cmd_setup
    import argparse

    class Args:
        func = cmd_setup

    cmd_setup(Args())

    print("\n" + "=" * 60)
    print("Setup complete!")
    print("=" * 60)
    print("\nQuick start:")
    print("  cd ~/Desktop/ai-media-engine")
    print("  python scripts/auto_publish.py status")
    print("  python scripts/auto_publish.py generate 'Your topic here'")
    print("  python scripts/auto_publish.py run 'Your topic' --platform medium wordpress")
    print("\nCron example (daily at 8 AM):")
    print("  0 8 * * * cd ~/Desktop/ai-media-engine && python scripts/auto_publish.py run 'daily content' --platform wordpress --count 1 >> data/cron.log 2>&1")
    print()


if __name__ == "__main__":
    main()
