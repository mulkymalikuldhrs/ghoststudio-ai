"""
repurpose_agent.py — Adapt content for different platforms.
"""

from agents.base_agent import BaseAgent


PLATFORM_PROFILES = {
    "medium": "Medium-style with engaging title, subtitle, readable paragraphs, 5-min read",
    "wordpress": "WordPress blog format with SEO headings, featured image alt text, category tags",
    "blogger": "Casual blog style, short paragraphs, conversational tone",
    "substack": "Newsletter format: personal greeting, story-driven, call-to-action at end",
    "beehiiv": "Email newsletter: subject line, preview text, concise sections, button CTAs",
    "devto": "Developer-focused: code blocks, technical depth, markdown formatting",
    "hashnode": "Developer blog: technical content, proper headings, code snippets",
    "ghost": "Clean publication format: member-only teaser, engaging narrative",
    "mirrorxyz": "Web3/crypto: on-chain focus, wallet mentions, community building",
    "writeas": "Minimalist: no fluff, pure text, short form",
    "bearblog": "Bear Blog minimal: short, personal, no images needed",
    "hubpages": "HubPages: how-to format with step sections, hub-style tips box",
    "vocal": "Vocal.media: emotional angle, strong narrative, medium-length",
    "telegraph": "Telegraph: clean, minimal, image-centered if applicable",
    "steemit": "Steemit: blockchain rewards focus, longer form, community tags",
    "lokal": "Generic REST: standard HTML with metadata",
    "tiktok": "TikTok script: 15-60s, hook first 3s, trending sounds, on-screen text cues",
    "youtube": "YouTube: 2-10 min script, visual cues, timestamps, CTA subscribe/comment",
    "instagram": "Instagram Reel: 15-30s, fast cuts, trending audio, text overlay points",
}


class RepurposeAgent(BaseAgent):
    """Adapt master content for each platform's specific format."""

    def __init__(self):
        super().__init__("repurpose")

    def adapt_for_platform(self, content, platform, title=None, language="id"):
        """Adapt master content for a specific platform."""
        profile = PLATFORM_PROFILES.get(platform, "Standard format with proper structure")
        sys_prompt = (
            f"You are a content repurposing expert. Adapt the master content for {platform}.\n"
            f"Platform requirements: {profile}\n\n"
            f"Language: {language}\n"
            f"Output format: Return the adapted content ready to publish."
        )
        user_prompt = (
            f"Master Title: {title or 'Untitled'}\n\n"
            f"Master Content:\n{content}\n\n"
            f"Adapt this for {platform} following the platform requirements."
        )
        return self.generate(sys_prompt, user_prompt, max_tokens=4096, temperature=0.7)

    def adapt_video_for_short(self, video_script, platform):
        """Adapt a long-form video script for Shorts/Reels/TikTok."""
        formats = {
            "tiktok": "15-60 seconds, fast-paced, trending hook style",
            "youtube": "YouTube Short: 15-60 seconds, vertical format, high retention",
            "instagram": "Reel: 15-30 seconds, aesthetic, text overlays",
        }
        fmt = formats.get(platform, "Short vertical video format")
        sys_prompt = (
            f"Adapt this video script for {platform} ({fmt}).\n"
            "Keep only the most engaging parts. Start with a strong hook.\n"
            "Format: [VISUAL] description | [VO] voiceover text"
        )
        user_prompt = f"Original script:\n{video_script}\n\nAdapt for {platform}."
        return self.generate(sys_prompt, user_prompt, max_tokens=2048, temperature=0.8)

    def generate_thread(self, content, platform="twitter"):
        """Convert article into a thread (Twitter/X style)."""
        sys_prompt = (
            "Convert this article into a thread. Each tweet should be self-contained "
            "but flow naturally. Include a compelling first tweet as hook. "
            "Use line breaks for readability. End with a discussion prompt."
        )
        user_prompt = f"Create a thread from:\n\n{content}"
        return self.generate(sys_prompt, user_prompt, max_tokens=2048, temperature=0.7)
