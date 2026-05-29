"""
humanic_agent.py — Humanize AI-generated content to bypass AI detectors.
"""

from agents.base_agent import BaseAgent


class HumanicAgent(BaseAgent):
    """Humanize content: add personality, remove AI clichés, vary sentence structure."""

    def __init__(self):
        super().__init__("humanic")

    def humanize(self, content, platform="medium", style="conversational"):
        """Rewrite content to sound more human and natural."""
        sys_prompt = (
            "You are a humanization expert. Your job is to rewrite AI-generated content "
            "so it reads like a human wrote it. Rules:\n"
            "1. Remove AI clichés: 'delve', 'landscape', 'testament', 'game-changer', 'evolve'\n"
            "2. Vary sentence length — mix short and long sentences\n"
            "3. Add personality: opinions, mild humor, personal anecdotes\n"
            "4. Use contractions (it's, don't, can't, won't)\n"
            "5. Avoid robotic transitions like 'Furthermore', 'Moreover', 'In conclusion'\n"
            "6. Add natural flow — not everything needs a transition word\n"
            "7. Vary paragraph lengths — some single-sentence paragraphs\n"
            "8. Use active voice predominantly\n"
            "9. Add occasional rhetorical questions or direct reader address\n"
            "10. Keep all factual information intact\n"
            f"Platform: {platform}. Style: {style}."
        )
        user_prompt = f"Humanize this content:\n\n{content}"
        return self.generate(sys_prompt, user_prompt, max_tokens=4096, temperature=0.85)

    def add_story_hook(self, content):
        """Add an engaging story-based hook at the beginning."""
        sys_prompt = (
            "You are a storytelling expert. Add a compelling personal story or anecdote "
            "as a hook at the beginning of the content, then transition smoothly into the "
            "main content. Keep the rest of the content intact. Max 150 words for the hook."
        )
        user_prompt = f"Add a story hook to this content:\n\n{content}"
        return self.generate(sys_prompt, user_prompt, max_tokens=4096, temperature=0.8)

    def simplify_language(self, content, reading_level="intermediate"):
        """Simplify content for broader audience."""
        sys_prompt = (
            f"Simplify this content to {reading_level} reading level. "
            "Use shorter sentences, simpler vocabulary, and clear explanations. "
            "Remove jargon unless absolutely necessary and explain it when used."
        )
        user_prompt = f"Simplify:\n\n{content}"
        return self.generate(sys_prompt, user_prompt, max_tokens=4096, temperature=0.6)
