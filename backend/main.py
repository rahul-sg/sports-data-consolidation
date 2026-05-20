"""
FastAPI entry point.

Starts all source streams as background tasks and exposes a WebSocket
endpoint that the Next.js frontend connects to for live picks.
"""
import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from aggregator import manager, broadcast_worker
from sources.reddit_source import run_reddit_stream
from sources.twitter_source import run_twitter_stream
from sources.discord_source import run_discord_bot


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Start all background tasks
    tasks = [
        asyncio.create_task(broadcast_worker(), name="broadcast_worker"),
        asyncio.create_task(run_reddit_stream(), name="reddit"),
        asyncio.create_task(run_twitter_stream(), name="twitter"),
        asyncio.create_task(run_discord_bot(), name="discord"),
    ]
    print("[backend] All source tasks started.")
    yield
    for t in tasks:
        t.cancel()


app = FastAPI(title="Sports Picks Aggregator", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health():
    return {"status": "ok", "connected_clients": len(manager.active)}


@app.websocket("/ws/picks")
async def websocket_picks(ws: WebSocket):
    await manager.connect(ws)
    try:
        while True:
            # Keep the connection alive; we only push data, never receive
            await ws.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(ws)
