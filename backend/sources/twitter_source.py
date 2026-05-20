"""
Twitter/X source — uses Tweepy's filtered stream to receive tweets
in real time from the configured usernames.
"""
import asyncio
from datetime import datetime, timezone

import tweepy
from config import settings
from aggregator import emit
from models import Pick


class PickStreamListener(tweepy.StreamingClient):
    def __init__(self, bearer_token: str, loop: asyncio.AbstractEventLoop, **kwargs):
        super().__init__(bearer_token, **kwargs)
        self._loop = loop
        self._user_cache: dict[str, dict] = {}

    def on_tweet(self, tweet: tweepy.Tweet):
        author_id = tweet.author_id
        username = self._user_cache.get(str(author_id), {}).get("username", str(author_id))
        pick = Pick(
            id=f"twitter_{tweet.id}",
            source="twitter",
            author=f"@{username}",
            author_url=f"https://twitter.com/{username}",
            content=tweet.text,
            url=f"https://twitter.com/{username}/status/{tweet.id}",
            community="Twitter/X",
            timestamp=tweet.created_at or datetime.now(tz=timezone.utc),
        )
        asyncio.run_coroutine_threadsafe(emit(pick), self._loop)

    def on_errors(self, errors):
        print(f"[Twitter] Stream errors: {errors}")


async def _resolve_user_ids(client: tweepy.Client, usernames: list[str]) -> dict[str, str]:
    """Returns {user_id: username} map."""
    result = {}
    if not usernames:
        return result
    resp = client.get_users(usernames=usernames, user_fields=["id", "username"])
    if resp.data:
        for user in resp.data:
            result[str(user.id)] = user.username
    return result


async def run_twitter_stream():
    if not settings.TWITTER_BEARER_TOKEN:
        print("[Twitter] Skipping — TWITTER_BEARER_TOKEN not set.")
        return
    if not settings.TWITTER_USERNAMES:
        print("[Twitter] Skipping — no TWITTER_USERNAMES configured.")
        return

    loop = asyncio.get_event_loop()

    def _stream():
        rest_client = tweepy.Client(bearer_token=settings.TWITTER_BEARER_TOKEN)

        # resolve usernames → IDs
        user_id_map: dict[str, str] = {}
        try:
            resp = rest_client.get_users(
                usernames=settings.TWITTER_USERNAMES,
                user_fields=["id", "username"],
            )
            if resp.data:
                for u in resp.data:
                    user_id_map[str(u.id)] = u.username
        except Exception as e:
            print(f"[Twitter] Failed to resolve usernames: {e}")
            return

        stream = PickStreamListener(
            bearer_token=settings.TWITTER_BEARER_TOKEN,
            loop=loop,
            wait_on_rate_limit=True,
        )
        stream._user_cache = user_id_map

        # Remove old rules then add new ones
        existing = stream.get_rules()
        if existing.data:
            stream.delete_rules([r.id for r in existing.data])

        # Build a rule: "from:user1 OR from:user2 ..."
        from_clauses = " OR ".join(f"from:{u}" for u in settings.TWITTER_USERNAMES)
        stream.add_rules(tweepy.StreamRule(from_clauses))

        stream.filter(
            tweet_fields=["author_id", "created_at", "text"],
            expansions=["author_id"],
        )

    await loop.run_in_executor(None, _stream)
