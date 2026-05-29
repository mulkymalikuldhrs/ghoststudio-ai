"""
memory_agent.py — Memory management agent.
Learns from past content performance to improve future generations.
"""

import json
from agents.base_agent import BaseAgent
from memory import get_memory


class MemoryAgent(BaseAgent):
    """Analyzes past content performance and provides strategic recommendations."""

    def __init__(self):
        super().__init__("memory")
        self.memory = get_memory()

    def analyze_platform_performance(self, platform):
        """Get insights from platform history."""
        stats = self.memory.get_platform_stats(platform)
        best_strategies = self.memory.get_best_strategy(platform)

        return {
            "platform": platform,
            "stats": stats,
            "best_strategies": best_strategies,
        }

    def recommend_topic(self, platform, niche=""):
        """Recommend a topic based on past performance and trends."""
        stats = self.memory.get_platform_stats(platform)
        best = self.memory.get_best_strategy(platform)

        sys_prompt = (
            "You are a content strategy AI. Based on past performance data, "
            "recommend the best topic and tone for the next piece of content. "
            "Return a JSON object with: topic, tone, reasoning."
        )

        context = f"Platform: {platform}\nNiche: {niche}\n"
        if best:
            context += f"Best past strategy: {json.dumps(best[0])}\n"
        context += f"Platform stats: {json.dumps(stats)}\n"

        result, tokens, cost, error = self.generate(
            sys_prompt, context, max_tokens=512, temperature=0.7
        )
        if error:
            return {"topic": f"General {niche or 'trending'} topic",
                    "tone": "professional", "reasoning": error}
        return result

    def log_outcome(self, platform, topic, tone, success_rate, engagement):
        """Log content outcome to improve future recommendations."""
        self.memory.update_strategy(platform, topic, tone, success_rate, engagement)

    def get_learning_summary(self, platform=None):
        """Get a summary of what the system has learned."""
        if platform:
            stats = self.memory.get_platform_stats(platform)
            strategies = self.memory.get_best_strategy(platform)
            return {"platform": platform, "stats": stats, "strategies": strategies}
        else:
            # Aggregate across platforms
            conn = self.memory._get_conn()
            rows = conn.execute("""
                SELECT platform, AVG(score) as avg_score, COUNT(*) as count
                FROM content_log GROUP BY platform ORDER BY count DESC
            """).fetchall()
            return {"all_platforms": [dict(r) for r in rows]}

    def suggest_improvements(self, platform):
        """Based on failure history, suggest improvements."""
        conn = self.memory._get_conn()
        failures = conn.execute("""
            SELECT error_msg, COUNT(*) as count
            FROM platform_history
            WHERE platform=? AND success=0 AND error_msg IS NOT NULL
            GROUP BY error_msg ORDER BY count DESC LIMIT 5
        """, (platform,)).fetchall()

        sys_prompt = (
            "Based on these failure patterns, suggest specific improvements "
            "for publishing on this platform. Be actionable and specific."
        )
        context = f"Platform: {platform}\nFailure patterns:\n"
        for f in failures:
            context += f"- {f['error_msg'][:200]} ({f['count']}x)\n"

        result, tokens, cost, error = self.generate(sys_prompt, context)
        return result or "No suggestions available."
