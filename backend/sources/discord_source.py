"""
Discord source — runs a discord.py bot that listens to configured
channel IDs and forwards messages to the aggregator.
"""
import asyncio
from datetime import timezone

import discord
from config import settings
from aggregator import emit
from models import Pick


class PicksBot(discord.Client):
    async def on_ready(self):
        guilds = ", ".join(g.name for g in self.guilds)
        print(f"[Discord] Logged in as {self.user} | Servers: {guilds}")

    async def on_message(self, message: discord.Message):
        if message.author.bot:
            return

        if str(message.channel.id) not in settings.DISCORD_CHANNEL_IDS:
            return

        pick = Pick(
            id=f"discord_{message.id}",
            source="discord",
            author=message.author.display_name,
            author_url=None,
            content=message.content[:1000],
            url=message.jump_url,
            community=message.guild.name if message.guild else "DM",
            channel=message.channel.name if hasattr(message.channel, "name") else None,
            timestamp=message.created_at.replace(tzinfo=timezone.utc),
        )
        await emit(pick)


async def run_discord_bot():
    if not settings.DISCORD_BOT_TOKEN:
        print("[Discord] Skipping — DISCORD_BOT_TOKEN not set.")
        return
    if not settings.DISCORD_CHANNEL_IDS:
        print("[Discord] Skipping — no DISCORD_CHANNEL_IDS configured.")
        return

    intents = discord.Intents.default()
    intents.message_content = True

    bot = PicksBot(intents=intents)
    await bot.start(settings.DISCORD_BOT_TOKEN)
