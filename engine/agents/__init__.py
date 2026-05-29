"""
agents/__init__.py — Agent registry.
"""

from .draft_agent import DraftAgent
from .humanic_agent import HumanicAgent
from .seo_agent import SEOAgent
from .repurpose_agent import RepurposeAgent
from .scoring_agent import ScoringAgent
from .memory_agent import MemoryAgent
from .trend_agent import TrendAgent

__all__ = [
    "DraftAgent",
    "HumanicAgent",
    "SEOAgent",
    "RepurposeAgent",
    "ScoringAgent",
    "MemoryAgent",
    "TrendAgent",
]

_agent_registry = {}

def get_agent(name):
    """Get or create an agent by name."""
    if name not in _agent_registry:
        agents = {
            "draft": DraftAgent,
            "humanic": HumanicAgent,
            "seo": SEOAgent,
            "repurpose": RepurposeAgent,
            "scoring": ScoringAgent,
            "memory": MemoryAgent,
            "trend": TrendAgent,
        }
        if name in agents:
            _agent_registry[name] = agents[name]()
    return _agent_registry.get(name)
