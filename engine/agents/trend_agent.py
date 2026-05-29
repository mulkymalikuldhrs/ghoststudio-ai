"""
trend_agent.py — Trend detection agent.
Scrapes trending topics from various sources via OpenRouter analysis.
"""

from agents.base_agent import BaseAgent


class TrendAgent(BaseAgent):
    """Detect trending topics and content opportunities."""

    def __init__(self):
        super().__init__("trend")

    def get_trending_topics(self, niche="technology", count=5):
        """Get trending topics/ideas in a given niche."""
        sys_prompt = (
            f"You are a trend analyst. Identify {count} trending topics in {niche} "
            "that would perform well as articles or video content. "
            "For each topic provide:\n"
            "- Topic title\n"
            "- Why it's trending\n"
            "- Target audience\n"
            "- Suggested content format (article/video/infographic)\n"
            "- Estimated engagement potential (1-10)\n\n"
            "Return as JSON array."
        )
        user_prompt = (
            f"Find {count} trending topics in {niche} right now. "
            "Focus on evergreen trends with viral potential."
        )
        return self.generate(sys_prompt, user_prompt, max_tokens=2048, temperature=0.8)

    def analyze_topic_potential(self, topic, platform="medium"):
        """Analyze how well a topic might perform on a given platform."""
        sys_prompt = (
            f"Analyze this topic's potential for {platform}. Consider:\n"
            "1. Search volume potential (1-10)\n"
            "2. Competition level (low/medium/high)\n"
            "3. Audience interest (1-10)\n"
            "4. Monetization potential (1-10)\n"
            "5. Evergreen score (1-10)\n"
            "6. Recommended angle to differentiate\n\n"
            "Return as JSON."
        )
        user_prompt = f"Topic: {topic}\nPlatform: {platform}"
        return self.generate(sys_prompt, user_prompt, max_tokens=1024, temperature=0.5)

    def get_content_gaps(self, niche, platform="medium"):
        """Identify content gaps in a niche that can be exploited."""
        sys_prompt = (
            f"Identify content gaps in the {niche} niche for {platform}. "
            "Look for:\n"
            "1. Topics with high interest but low quality content\n"
            "2. Questions that aren't well answered\n"
            "3. Outdated content that needs refresh\n"
            "4. New angles on saturated topics\n\n"
            "Return top 5 gaps with opportunity scores (1-10)."
        )
        user_prompt = f"Niche: {niche}\nPlatform: {platform}"
        return self.generate(sys_prompt, user_prompt, max_tokens=2048, temperature=0.7)
