"""
Central aggregator — receives picks from all sources and broadcasts
them to all connected WebSocket clients.
"""
import asyncio
import json
from typing import Set
from fastapi import WebSocket
from models import Pick


class ConnectionManager:
    def __init__(self):
        self.active: Set[WebSocket] = set()

    async def connect(self, ws: WebSocket):
        await ws.accept()
        self.active.add(ws)

    def disconnect(self, ws: WebSocket):
        self.active.discard(ws)

    async def broadcast(self, pick: Pick):
        payload = pick.model_dump_json()
        dead: Set[WebSocket] = set()
        for ws in self.active:
            try:
                await ws.send_text(payload)
            except Exception:
                dead.add(ws)
        self.active -= dead


manager = ConnectionManager()
pick_queue: asyncio.Queue[Pick] = asyncio.Queue()


async def broadcast_worker():
    """Drains the pick queue and broadcasts to all WS clients."""
    while True:
        pick = await pick_queue.get()
        await manager.broadcast(pick)


async def emit(pick: Pick):
    """Called by each source to submit a new pick."""
    await pick_queue.put(pick)
