"""
Reddit source — streams new posts from configured subreddits and/or
from specific users' post histories using PRAW async streaming.
"""
import asyncio
import hashlib
from datetime import datetime, timezone

import praw
from config import settings
from aggregator import emit
from models import Pick


def _make_id(prefix: str, reddit_id: str) -> str:
    return f"reddit_{prefix}_{reddit_id}"


def _submission_to_pick(submission) -> Pick:
    subreddit = submission.subreddit.display_name
    return Pick(
        id=_make_id("post", submission.id),
        source="reddit",
        author=str(submission.author) if submission.author else "[deleted]",
        author_url=f"https://reddit.com/user/{submission.author}" if submission.author else None,
        content=f"**{submission.title}**\n\n{submission.selftext[:1000]}" if submission.selftext else submission.title,
        url=f"https://reddit.com{submission.permalink}",
        community=subreddit,
        timestamp=datetime.fromtimestamp(submission.created_utc, tz=timezone.utc),
    )


def _comment_to_pick(comment, context: str) -> Pick:
    return Pick(
        id=_make_id("comment", comment.id),
        source="reddit",
        author=str(comment.author) if comment.author else "[deleted]",
        author_url=f"https://reddit.com/user/{comment.author}" if comment.author else None,
        content=comment.body[:1000],
        url=f"https://reddit.com{comment.permalink}",
        community=context,
        timestamp=datetime.fromtimestamp(comment.created_utc, tz=timezone.utc),
    )


async def run_reddit_stream():
    """Runs the PRAW stream in a thread executor to avoid blocking the event loop."""
    if not settings.REDDIT_CLIENT_ID or not settings.REDDIT_CLIENT_SECRET:
        print("[Reddit] Skipping — REDDIT_CLIENT_ID / REDDIT_CLIENT_SECRET not set.")
        return

    loop = asyncio.get_event_loop()

    def _stream():
        reddit = praw.Reddit(
            client_id=settings.REDDIT_CLIENT_ID,
            client_secret=settings.REDDIT_CLIENT_SECRET,
            user_agent=settings.REDDIT_USER_AGENT,
        )

        subreddit_str = "+".join(settings.REDDIT_SUBREDDITS) if settings.REDDIT_SUBREDDITS else None

        if subreddit_str:
            sub = reddit.subreddit(subreddit_str)
            for submission in sub.stream.submissions(skip_existing=True):
                # filter by tracked users if any
                if settings.REDDIT_USERS:
                    if submission.author and str(submission.author).lower() in [u.lower() for u in settings.REDDIT_USERS]:
                        pick = _submission_to_pick(submission)
                        asyncio.run_coroutine_threadsafe(emit(pick), loop)
                else:
                    pick = _submission_to_pick(submission)
                    asyncio.run_coroutine_threadsafe(emit(pick), loop)

    await loop.run_in_executor(None, _stream)
