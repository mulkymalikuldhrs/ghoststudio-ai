"""
publishers/__init__.py — Publisher factory.
Uses the same pattern as ghoststudio-ai.
"""

from .wordpress import WordPressPublisher
from .medium import MediumPublisher
from .blogger import BloggerPublisher
from .substack import SubstackPublisher
from .beehiiv import BeehiivPublisher
from .devto import DevToPublisher
from .hashnode import HashnodePublisher
from .ghost import GhostPublisher
from .mirrorxyz import MirrorXYZPublisher
from .writeas import WriteAsPublisher
from .bearblog import BearBlogPublisher
from .hubpages import HubPagesPublisher
from .vocal import VocalPublisher
from .telegraph import TelegraphPublisher
from .steemit import SteemitPublisher
from .lokal import LokalPublisher
from .tiktok import TikTokPublisher
from .youtube import YouTubePublisher
from .instagram import InstagramPublisher

PUBLISHER_REGISTRY = {
    "wordpress": WordPressPublisher,
    "medium": MediumPublisher,
    "blogger": BloggerPublisher,
    "substack": SubstackPublisher,
    "beehiiv": BeehiivPublisher,
    "devto": DevToPublisher,
    "hashnode": HashnodePublisher,
    "ghost": GhostPublisher,
    "mirrorxyz": MirrorXYZPublisher,
    "writeas": WriteAsPublisher,
    "bearblog": BearBlogPublisher,
    "hubpages": HubPagesPublisher,
    "vocal": VocalPublisher,
    "telegraph": TelegraphPublisher,
    "steemit": SteemitPublisher,
    "lokal": LokalPublisher,
    "tiktok": TikTokPublisher,
    "youtube": YouTubePublisher,
    "instagram": InstagramPublisher,
}

SUPPORTED_PLATFORMS = sorted(PUBLISHER_REGISTRY.keys())

def get_publisher(platform_name):
    """Get a publisher instance by platform name."""
    cls = PUBLISHER_REGISTRY.get(platform_name.lower())
    if cls:
        return cls()
    return None

def list_publishers():
    """List all available publishers with descriptions."""
    return SUPPORTED_PLATFORMS
