"""
memory.py — SQLite-based memory system with reinforcement learning.
Tracks content performance, platform history, and learns from failures/successes.
"""

import sqlite3
import json
import time
import threading
from pathlib import Path
from config import load_config


class MemorySystem:
    """Persistent memory using SQLite. Thread-safe."""

    def __init__(self, db_path=None):
        if db_path is None:
            cfg = load_config()
            db_path = cfg.get("memory_db_path", "~/Desktop/ai-media-engine/data/memory.db")
        self.db_path = str(Path(db_path).expanduser())
        Path(self.db_path).parent.mkdir(parents=True, exist_ok=True)
        self._local = threading.local()
        self._init_db()

    def _get_conn(self):
        if not hasattr(self._local, "conn") or self._local.conn is None:
            self._local.conn = sqlite3.connect(self.db_path)
            self._local.conn.row_factory = sqlite3.Row
        return self._local.conn

    def _init_db(self):
        conn = self._get_conn()
        conn.executescript("""
            CREATE TABLE IF NOT EXISTS content_log (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                content_hash TEXT UNIQUE,
                title TEXT,
                platform TEXT,
                content_type TEXT DEFAULT 'article',
                status TEXT DEFAULT 'draft',
                score REAL DEFAULT 0.0,
                engagement_score REAL DEFAULT 0.0,
                tokens_used INTEGER DEFAULT 0,
                cost_usd REAL DEFAULT 0.0,
                error_msg TEXT,
                created_at INTEGER DEFAULT (strftime('%s','now')),
                published_at INTEGER,
                metadata TEXT DEFAULT '{}'
            );

            CREATE TABLE IF NOT EXISTS platform_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                platform TEXT NOT NULL,
                action TEXT NOT NULL,
                success INTEGER DEFAULT 1,
                response_time_ms INTEGER DEFAULT 0,
                error_msg TEXT,
                content_id INTEGER,
                created_at INTEGER DEFAULT (strftime('%s','now'))
            );

            CREATE TABLE IF NOT EXISTS content_strategy (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                platform TEXT NOT NULL,
                topic TEXT,
                tone TEXT,
                template TEXT,
                success_rate REAL DEFAULT 0.0,
                avg_engagement REAL DEFAULT 0.0,
                runs INTEGER DEFAULT 0,
                last_used INTEGER,
                metadata TEXT DEFAULT '{}'
            );

            CREATE TABLE IF NOT EXISTS quality_scores (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                content_id INTEGER,
                score REAL,
                readability REAL,
                seo_score REAL,
                originality REAL,
                platform_fit REAL,
                created_at INTEGER DEFAULT (strftime('%s','now'))
            );

            CREATE INDEX IF NOT EXISTS idx_content_hash ON content_log(content_hash);
            CREATE INDEX IF NOT EXISTS idx_platform ON content_log(platform);
            CREATE INDEX IF NOT EXISTS idx_platform_history ON platform_history(platform, created_at);
        """)
        conn.commit()

    # ── Content Log ──────────────────────────────────────────────

    def log_content(self, content_hash, title, platform, content_type="article",
                    status="draft", score=0.0, tokens_used=0, cost_usd=0.0,
                    error_msg=None, metadata=None):
        conn = self._get_conn()
        try:
            conn.execute("""
                INSERT OR REPLACE INTO content_log
                    (content_hash, title, platform, content_type, status,
                     score, tokens_used, cost_usd, error_msg, metadata)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (content_hash, title, platform, content_type, status,
                  score, tokens_used, cost_usd, error_msg,
                  json.dumps(metadata or {})))
            conn.commit()
            return conn.execute("SELECT last_insert_rowid()").fetchone()[0]
        except sqlite3.IntegrityError:
            return None

    def update_content_status(self, content_id, status, score=None,
                               engagement_score=None, error_msg=None):
        conn = self._get_conn()
        fields = ["status=?"]
        values = [status]
        if score is not None:
            fields.append("score=?")
            values.append(score)
        if engagement_score is not None:
            fields.append("engagement_score=?")
            values.append(engagement_score)
        if error_msg is not None:
            fields.append("error_msg=?")
            values.append(error_msg)
        if status == "published":
            fields.append("published_at=strftime('%s','now')")
        values.append(content_id)
        conn.execute(f"UPDATE content_log SET {', '.join(fields)} WHERE id=?",
                     values)
        conn.commit()

    def get_content_by_hash(self, content_hash):
        conn = self._get_conn()
        row = conn.execute("SELECT * FROM content_log WHERE content_hash=?",
                           (content_hash,)).fetchone()
        if row:
            return dict(row)
        return None

    def get_recent_content(self, platform=None, limit=20, offset=0):
        conn = self._get_conn()
        if platform:
            rows = conn.execute(
                "SELECT * FROM content_log WHERE platform=? ORDER BY created_at DESC LIMIT ? OFFSET ?",
                (platform, limit, offset)
            ).fetchall()
        else:
            rows = conn.execute(
                "SELECT * FROM content_log ORDER BY created_at DESC LIMIT ? OFFSET ?",
                (limit, offset)
            ).fetchall()
        return [dict(r) for r in rows]

    # ── Platform History ────────────────────────────────────────

    def log_platform_action(self, platform, action, success=True,
                             response_time_ms=0, error_msg=None, content_id=None):
        conn = self._get_conn()
        conn.execute("""
            INSERT INTO platform_history
                (platform, action, success, response_time_ms, error_msg, content_id)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (platform, action, 1 if success else 0,
              response_time_ms, error_msg, content_id))
        conn.commit()

    def get_platform_stats(self, platform, since_days=7):
        conn = self._get_conn()
        cutoff = int(time.time()) - (since_days * 86400)
        row = conn.execute("""
            SELECT
                COUNT(*) as total,
                SUM(CASE WHEN success=1 THEN 1 ELSE 0 END) as successes,
                SUM(CASE WHEN success=0 THEN 1 ELSE 0 END) as failures,
                AVG(response_time_ms) as avg_response_ms
            FROM platform_history
            WHERE platform=? AND created_at>=?
        """, (platform, cutoff)).fetchone()
        return dict(row) if row else {"total": 0, "successes": 0, "failures": 0, "avg_response_ms": 0}

    # ── Content Strategy ────────────────────────────────────────

    def update_strategy(self, platform, topic, tone, success_rate, avg_engagement):
        conn = self._get_conn()
        existing = conn.execute(
            "SELECT id, runs FROM content_strategy WHERE platform=? AND topic=? AND tone=?",
            (platform, topic, tone)
        ).fetchone()
        now = int(time.time())
        if existing:
            runs = existing["runs"] + 1
            conn.execute("""
                UPDATE content_strategy
                SET success_rate=?, avg_engagement=?, runs=?, last_used=?
                WHERE id=?
            """, (success_rate, avg_engagement, runs, now, existing["id"]))
        else:
            conn.execute("""
                INSERT INTO content_strategy (platform, topic, tone, success_rate, avg_engagement, runs, last_used)
                VALUES (?, ?, ?, ?, ?, 1, ?)
            """, (platform, topic, tone, success_rate, avg_engagement, now))
        conn.commit()

    def get_best_strategy(self, platform, top_n=3):
        conn = self._get_conn()
        rows = conn.execute("""
            SELECT * FROM content_strategy
            WHERE platform=? AND runs>=2
            ORDER BY success_rate DESC, avg_engagement DESC
            LIMIT ?
        """, (platform, top_n)).fetchall()
        return [dict(r) for r in rows]

    # ── Quality Scores ──────────────────────────────────────────

    def save_quality_scores(self, content_id, score, readability,
                             seo_score, originality, platform_fit):
        conn = self._get_conn()
        conn.execute("""
            INSERT INTO quality_scores
                (content_id, score, readability, seo_score, originality, platform_fit)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (content_id, score, readability, seo_score, originality, platform_fit))
        conn.commit()

    # ── Duplicate Detection ─────────────────────────────────────

    def is_duplicate(self, content_hash, platform=None):
        conn = self._get_conn()
        if platform:
            row = conn.execute(
                "SELECT id FROM content_log WHERE content_hash=? AND platform=?",
                (content_hash, platform)
            ).fetchone()
        else:
            row = conn.execute(
                "SELECT id FROM content_log WHERE content_hash=?",
                (content_hash,)
            ).fetchone()
        return row is not None

    def get_platform_performance(self, platform):
        """Get aggregate performance data for a platform."""
        conn = self._get_conn()
        rows = conn.execute("""
            SELECT
                AVG(score) as avg_score,
                AVG(engagement_score) as avg_engagement,
                COUNT(*) as total_posts,
                SUM(CASE WHEN status='published' THEN 1 ELSE 0 END) as published
            FROM content_log WHERE platform=?
        """, (platform,)).fetchall()
        return [dict(r) for r in rows]

    def close(self):
        if hasattr(self._local, "conn") and self._local.conn:
            self._local.conn.close()
            self._local.conn = None


# Singleton
_memory_instance = None

def get_memory():
    global _memory_instance
    if _memory_instance is None:
        _memory_instance = MemorySystem()
    return _memory_instance
