"""
scoring_agent.py — Quality scoring for content.
"""

from agents.base_agent import BaseAgent
import json


class ScoringAgent(BaseAgent):
    """Score content quality across multiple dimensions."""

    def __init__(self):
        super().__init__("scoring")

    def score_content(self, content, platform="medium", keywords=None):
        """
        Score content quality.
        Returns dict with: overall_score, readability, seo_score, originality, platform_fit
        """
        sys_prompt = (
            "You are a content quality assessor. Score the given content on a scale of 0.0 to 1.0 "
            "across these dimensions:\n"
            "1. overall_score — overall quality\n"
            "2. readability — how easy it is to read\n"
            "3. seo_score — keyword optimization and structure\n"
            "4. originality — unique perspective and fresh ideas\n"
            "5. platform_fit — how well it matches the target platform\n\n"
            f"Target platform: {platform}\n"
            "Return ONLY a valid JSON object with these 5 numeric fields. "
            "No markdown, no explanation."
        )
        user_prompt = (
            f"Score this content:\n\n{content[:4000]}\n\n"
            f"Target keywords: {keywords or 'N/A'}"
        )
        result, tokens, cost, error = self.generate(
            sys_prompt, user_prompt, max_tokens=512, temperature=0.2
        )
        if error or not result:
            return {"overall_score": 0.5, "readability": 0.5, "seo_score": 0.5,
                    "originality": 0.5, "platform_fit": 0.5, "error": error}

        # Try to parse JSON from the response
        try:
            # Clean the response
            clean = result.strip()
            if clean.startswith("```"):
                clean = clean.split("\n", 1)[1]
                if clean.endswith("```"):
                    clean = clean[:-3]
            scores = json.loads(clean)
            # Ensure all keys exist
            defaults = {"overall_score": 0.5, "readability": 0.5,
                        "seo_score": 0.5, "originality": 0.5, "platform_fit": 0.5}
            defaults.update(scores)
            return defaults
        except (json.JSONDecodeError, ValueError):
            # Fallback: try to extract numbers
            import re
            nums = re.findall(r"0\.\d+|1\.0", result)
            if len(nums) >= 5:
                return {
                    "overall_score": float(nums[0]),
                    "readability": float(nums[1]),
                    "seo_score": float(nums[2]),
                    "originality": float(nums[3]),
                    "platform_fit": float(nums[4]),
                }
            return {"overall_score": 0.6, "readability": 0.6, "seo_score": 0.6,
                    "originality": 0.6, "platform_fit": 0.6}

    def compare_versions(self, original, rewritten):
        """Compare original vs rewritten content quality."""
        sys_prompt = (
            "Compare these two versions of content and rate which is better (1 or 2) "
            "on quality, engagement, clarity. Return JSON with winner, reasoning."
        )
        user_prompt = f"VERSION 1:\n{original[:2000]}\n\nVERSION 2:\n{rewritten[:2000]}"
        return self.generate(sys_prompt, user_prompt, max_tokens=1024, temperature=0.3)
