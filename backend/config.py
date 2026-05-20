from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    # Reddit
    REDDIT_CLIENT_ID: str = ""
    REDDIT_CLIENT_SECRET: str = ""
    REDDIT_USER_AGENT: str = "sports-picks-aggregator/1.0"
    REDDIT_SUBREDDITS: List[str] = ["sportsbetting", "sportsbook"]
    REDDIT_USERS: List[str] = []  # specific reddit usernames to follow

    # Twitter/X
    TWITTER_BEARER_TOKEN: str = ""
    TWITTER_USERNAMES: List[str] = []  # twitter usernames to track (no @)

    # Discord
    DISCORD_BOT_TOKEN: str = ""
    DISCORD_CHANNEL_IDS: List[str] = []  # channel IDs to monitor

    # Server
    BACKEND_PORT: int = 8000
    FRONTEND_URL: str = "http://localhost:3000"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
