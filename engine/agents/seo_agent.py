"""
seo_agent.py — SEO optimization for content.
"""

from agents.base_agent import BaseAgent


class SEOAgent(BaseAgent):
    """Optimize content for search engines."""

    def __init__(self):
        super().__init__("seo")

    def analyze_seo(self, content, keywords=None):
        """Analyze SEO strength of content and return suggestions."""
        kw_text = ", ".join(keywords) if keywords else "auto-detect"
        sys_prompt = (
            "You are an SEO expert. Analyze the given content and provide:\n"
            "1. Overall SEO score (0-100)\n"
            "2. Keyword density analysis\n"
            "3. Heading structure quality\n"
            "4. Meta description suggestion\n"
            "5. Readability score (Flesch)\n"
            "6. Top 3 improvements needed\n"
            "Return as structured JSON."
        )
        user_prompt = f"Analyze this content for SEO. Target keywords: {kw_text}\n\n{content}"
        return self.generate(sys_prompt, user_prompt, max_tokens=2048, temperature=0.3)

    def optimize_article(self, content, keywords=None, platform="web"):
        """Rewrite content with SEO improvements while preserving meaning."""
        kw_text = ", ".join(keywords) if keywords else "auto-detect"
        sys_prompt = (
            f"Optimize this article for SEO on {platform}. Rules:\n"
            "1. Improve title tag (include primary keyword near beginning)\n"
            "2. Add H2/H3 subheadings with keywords naturally\n"
            "3. Optimize meta description (150-160 chars)\n"
            "4. Improve keyword placement (first 100 words, headings, alt-text opportunities)\n"
            "5. Add internal/external linking suggestions in brackets\n"
            "6. Improve readability: short paragraphs, bullet points, numbered lists\n"
            "7. Add a FAQ section if appropriate\n"
            "8. Preserve all factual information and original meaning\n"
            "Return the optimized content with HTML formatting."
        )
        user_prompt = f"SEO optimize this content. Keywords: {kw_text}\n\n{content}"
        return self.generate(sys_prompt, user_prompt, max_tokens=4096, temperature=0.5)

    def generate_meta(self, content, max_length=160):
        """Generate SEO meta description."""
        sys_prompt = (
            f"Generate a compelling meta description (max {max_length} chars) "
            "that includes target keywords and encourages clicks. Return ONLY the description."
        )
        user_prompt = f"Content:\n\n{content[:2000]}"
        return self.generate(sys_prompt, user_prompt, max_tokens=256, temperature=0.5)

    def suggest_tags(self, content, max_tags=10):
        """Suggest SEO tags/keywords for content."""
        sys_prompt = (
            f"Suggest up to {max_tags} relevant tags/keywords for this content. "
            "Return as a JSON array of strings."
        )
        user_prompt = f"Content:\n\n{content[:2000]}"
        return self.generate(sys_prompt, user_prompt, max_tokens=512, temperature=0.4)
