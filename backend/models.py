from pydantic import BaseModel
from typing import Literal, Optional
from datetime import datetime


class Pick(BaseModel):
    id: str
    source: Literal["reddit", "twitter", "discord"]
    author: str
    author_url: Optional[str] = None
    content: str
    url: Optional[str] = None
    community: Optional[str] = None   # subreddit name, twitter list, discord server name
    channel: Optional[str] = None     # discord channel name
    timestamp: datetime
    raw: Optional[dict] = None        # original raw payload for debugging
