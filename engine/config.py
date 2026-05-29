"""
config.py — Configuration management for AI Media Engine.
Loads from engine_config.json with env var overrides.
"""

import os
import json
import threading
from pathlib import Path

CONFIG_PATH = os.path.expanduser("~/Desktop/ghoststudio-ai/engine/engine_config.json")
_lock = threading.Lock()
_cache = None


def _default_config():
    return {
        "openrouter_api_key": "",
        "openrouter_model": "openai/gpt-4o",
        "openrouter_base_url": "https://openrouter.ai/api/v1",
        "workspace_id": "default",
        "automation_mode": "semi",  # manual | semi | auto
        "default_language": "id",
        "default_tone": "professional",
        "max_articles_per_run": 5,
        "max_retries": 3,
        "retry_delay_seconds": 10,
        "budget_limits": {
            "daily_api_calls": 100,
            "daily_publishes": 20,
            "monthly_api_budget_usd": 50.0
        },
        "failsafe": {
            "safe_mode": True,
            "review_mode": True,
            "dry_run": False,
            "error_threshold": 5,
            "quality_gate_enabled": True,
            "quality_min_score": 0.6,
            "duplicate_detection": True,
            "rate_limit_per_minute": 10,
            "budget_limiter": True
        },
        "credentials": {},
        "memory_db_path": os.path.expanduser("~/Desktop/ai-media-engine/data/memory.db"),
        "scheduler_db_path": os.path.expanduser("~/Desktop/ai-media-engine/data/scheduler.db"),
        "log_level": "INFO"
    }


def load_config(force_reload=False):
    global _cache
    if _cache is not None and not force_reload:
        return _cache

    with _lock:
        cfg = _default_config()
        path = Path(CONFIG_PATH)
        if path.exists():
            try:
                with open(path, "r") as f:
                    user_cfg = json.load(f)
                _deep_merge(cfg, user_cfg)
            except (json.JSONDecodeError, IOError) as e:
                print(f"[config] Warning: could not load config file: {e}")

        # Override from environment variables
        env_map = {
            "OPENROUTER_API_KEY": ("openrouter_api_key", str),
            "OPENROUTER_MODEL": ("openrouter_model", str),
            "AI_MEDIA_AUTOMATION_MODE": ("automation_mode", str),
            "AI_MEDIA_DRY_RUN": ("failsafe.dry_run", _to_bool),
            "AI_MEDIA_SAFE_MODE": ("failsafe.safe_mode", _to_bool),
            "AI_MEDIA_REVIEW_MODE": ("failsafe.review_mode", _to_bool),
            "AI_MEDIA_MAX_ARTICLES": ("max_articles_per_run", int),
            "AI_MEDIA_DEFAULT_LANG": ("default_language", str),
            "AI_MEDIA_LOG_LEVEL": ("log_level", str),
        }
        for env_key, (cfg_key, transform) in env_map.items():
            val = os.environ.get(env_key)
            if val is not None:
                _set_nested(cfg, cfg_key.split("."), transform(val))

        _cache = cfg
        return cfg


def save_config(cfg=None):
    global _cache
    if cfg is None:
        cfg = _cache
    if cfg is None:
        return
    with _lock:
        path = Path(CONFIG_PATH)
        path.parent.mkdir(parents=True, exist_ok=True)
        with open(path, "w") as f:
            json.dump(cfg, f, indent=2)
        _cache = cfg


def _deep_merge(base, override):
    for k, v in override.items():
        if k in base and isinstance(base[k], dict) and isinstance(v, dict):
            _deep_merge(base[k], v)
        else:
            base[k] = v


def _set_nested(cfg, keys, value):
    for k in keys[:-1]:
        if k not in cfg:
            cfg[k] = {}
        cfg = cfg[k]
    cfg[keys[-1]] = value


def _to_bool(v):
    if isinstance(v, bool):
        return v
    return v.lower() in ("1", "true", "yes", "on")


def get_credential(platform, key=None):
    """Get credential for a platform. Returns dict or specific key."""
    cfg = load_config()
    creds = cfg.get("credentials", {}).get(platform, {})
    if key:
        return creds.get(key, "")
    return creds


def set_credential(platform, **kwargs):
    """Set credential(s) for a platform and persist."""
    cfg = load_config()
    if "credentials" not in cfg:
        cfg["credentials"] = {}
    if platform not in cfg["credentials"]:
        cfg["credentials"][platform] = {}
    cfg["credentials"][platform].update(kwargs)
    save_config(cfg)
