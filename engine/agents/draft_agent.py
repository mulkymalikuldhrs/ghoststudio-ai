"""
draft_agent.py — Generate master articles and faceless video scripts.
"""

from agents.base_agent import BaseAgent


class DraftAgent(BaseAgent):
    """Generates original content (articles & video scripts) via OpenRouter."""

    def __init__(self):
        super().__init__("draft")

    def generate_article(self, topic, tone="professional", language="id",
                         keywords=None, word_count=800):
        """Generate a master article on the given topic."""
        kw_text = ", ".join(keywords) if keywords else topic
        sys_prompt = (
            f"You are a professional content writer. Write in {language}. "
            f"Tone: {tone}. Create original, well-researched content. "
            f"Use proper formatting with headings, paragraphs, and bullet points."
        )
        user_prompt = (
            f"Write a {word_count}-word article about: {topic}\n\n"
            f"Keywords to include: {kw_text}\n\n"
            f"Structure: compelling headline, engaging introduction, "
            f"informative body with subheadings, actionable conclusion. "
            f"Return ONLY the article content with HTML formatting."
        )
        return self.generate(sys_prompt, user_prompt, max_tokens=4096, temperature=0.8)

    def generate_video_script(self, topic, duration_seconds=60, language="id", tone="casual"):
        """Generate a faceless video script."""
        sys_prompt = (
            f"You are a video script writer for faceless YouTube/TikTok/Reels content. "
            f"Write in {language}. Tone: {tone}. "
            f"Format: [SCENE] description, [VO] voiceover text, "
            f"[SFX] sound effects, [VISUAL] visual cues."
        )
        user_prompt = (
            f"Write a {duration_seconds}-second video script about: {topic}\n\n"
            f"Include: hook (first 3s), main content, call-to-action. "
            f"Return ONLY the script."
        )
        return self.generate(sys_prompt, user_prompt, max_tokens=2048, temperature=0.8)

    def regenerate_with_feedback(self, original, feedback):
        """Regenerate content based on feedback."""
        sys_prompt = "You are a content editor improving an article based on feedback."
        user_prompt = f"Original:\n{original}\n\nFeedback:\n{feedback}\n\nRewrite the article."
        return self.generate(sys_prompt, user_prompt, max_tokens=4096, temperature=0.7)
