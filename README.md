# Sports Picks Aggregator

A real-time feed that pulls sports betting picks from **Reddit**, **Twitter/X**, and **Discord** into a single dark-mode frontend. Posts stream in live via WebSocket — no page refresh needed.

```
backend/   Python · FastAPI · WebSockets
frontend/  Next.js 14 · Tailwind CSS · TypeScript
```

---

## How it works

Each platform runs as an async background task inside FastAPI. When a new post or message arrives it gets normalized into a common `Pick` object and pushed into a queue. The queue broadcasts to all connected WebSocket clients, updating the React frontend in real time.

```
Reddit  ──►
Twitter ──►  FastAPI (aggregator + queue)  ──WebSocket──►  Next.js frontend
Discord ──►
```

---

## Project Structure

```
backend/
├── main.py                  # FastAPI app, lifespan startup, WebSocket endpoint
├── aggregator.py            # asyncio queue + WebSocket broadcaster
├── config.py                # All settings loaded from .env
├── models.py                # Shared Pick pydantic model
├── requirements.txt
├── .env.example             # Copy to .env and fill in your keys
└── sources/
    ├── reddit_source.py     # PRAW streaming integration
    ├── twitter_source.py    # Tweepy v2 filtered stream
    └── discord_source.py    # discord.py bot

frontend/
├── src/
│   ├── app/                 # Next.js app router
│   ├── components/
│   │   ├── PicksFeed.tsx    # Filter bar + feed list
│   │   └── PickCard.tsx     # Individual pick card
│   ├── hooks/
│   │   └── useLivePicks.ts  # WebSocket hook with auto-reconnect
│   └── types/
│       └── pick.ts
└── package.json
```

---

## Prerequisites

- Python 3.11+
- Node.js 20+ (hard requirement from Next.js 14)
- Accounts on Reddit, Twitter/X developer portal, and Discord

---

## 1. Reddit

Reddit's API is **free** for personal/low-volume use.

### Get credentials

1. Log in to Reddit and go to **https://www.reddit.com/prefs/apps**
2. Scroll to the bottom → click **"create another app..."**
3. Fill in:
   - **Name**: anything, e.g. `sports-picks`
   - **Type**: select **script**
   - **Redirect URI**: `http://localhost:8080` (required field but never used)
4. Click **Create app**
5. On the result card:
   - The short string directly **under your app name** → **Client ID** (`REDDIT_CLIENT_ID`)
   - The **secret** field → **Client Secret** (`REDDIT_CLIENT_SECRET`)

### How it works in the code

The backend uses **PRAW** (Python Reddit API Wrapper) and calls `subreddit.stream.submissions()`, which long-polls Reddit for new posts in near-real-time. The stream runs inside a thread executor to avoid blocking the asyncio event loop. If `REDDIT_USERS` is populated, only posts from those specific users are forwarded — otherwise every new post in the configured subreddits is forwarded.

### .env config

```env
REDDIT_CLIENT_ID=your_client_id_here
REDDIT_CLIENT_SECRET=your_client_secret_here
REDDIT_USER_AGENT=sports-picks-aggregator/1.0

# Subreddits to monitor (no "r/"), comma-separated
REDDIT_SUBREDDITS=sportsbetting,sportsbook

# Optional: only show posts from these users (no "u/"), comma-separated
# Leave blank to get all posts from the subreddit
REDDIT_USERS=
```

---

## 2. Twitter / X

> **Cost warning**: The free tier does not include filtered streaming. You need at least the **Basic plan (~$100/month)** to stream real-time tweets from specific accounts. Without it, this connector is automatically skipped on startup.

### Get credentials

1. Go to **https://developer.twitter.com/en/portal/dashboard** and sign in
2. First time? Click **"Sign up for Free Account"** — briefly describe your use case (e.g. "personal sports data aggregation for private use")
3. Click **"+ Create Project"**, give it a name, finish the wizard
4. Inside the project click **"+ Add App"**
5. On your app page → **Keys and Tokens** tab → under **Authentication Tokens** click **Generate** next to **Bearer Token**
   - Copy it right away — this is `TWITTER_BEARER_TOKEN`
6. Upgrade to streaming: go to **Products → Twitter API v2 → Subscribe** → choose **Basic**

### How it works in the code

The backend uses **Tweepy's** `StreamingClient`. On startup it:
1. Resolves your configured usernames to numeric Twitter user IDs via the REST API
2. Deletes leftover stream rules from previous runs
3. Adds a new rule: `from:user1 OR from:user2 OR ...`
4. Opens the stream — every matching tweet calls `on_tweet()`, which emits a Pick

### .env config

```env
TWITTER_BEARER_TOKEN=your_bearer_token_here

# Usernames to track (no @), comma-separated
TWITTER_USERNAMES=CapperKing,LineMoverAlerts,SharpAction
```

---

## 3. Discord

Discord's bot API is **completely free**. You create a bot, invite it to the servers you want to monitor, and configure which specific channels it should listen to.

### Step 1 — Create the bot

1. Go to **https://discord.com/developers/applications** and sign in
2. Click **"New Application"** → name it → **Create**
3. Left sidebar → **"Bot"** → **"Add Bot"** → confirm
4. Scroll down to **"Privileged Gateway Intents"** and enable:
   - ✅ **Message Content Intent** — **this is required**. Without it, every message body arrives empty and no picks will be captured
5. Click **Save Changes**
6. Scroll back up → Token section → **"Reset Token"** → copy it → this is `DISCORD_BOT_TOKEN`

> Keep your bot token private. Anyone with it can control the bot.

### Step 2 — Invite the bot to your servers

Do this for every Discord server you want to monitor:

1. Your app in the developer portal → **"OAuth2" → "URL Generator"**
2. Under **Scopes** check `bot`
3. Under **Bot Permissions** check:
   - `Read Messages / View Channels`
   - `Read Message History`
4. Copy the generated URL at the bottom, open it in a browser, pick the target server, click **Authorize**

### Step 3 — Get channel IDs

The bot only listens to channels you explicitly list — everything else is ignored.

1. In Discord: **User Settings → Advanced → turn on Developer Mode**
2. Right-click any text channel you want → **"Copy Channel ID"**
3. Repeat for every channel across every server

### How it works in the code

The backend runs a `discord.Client`. `on_message` fires for every visible message in every joined server. It checks whether `str(message.channel.id)` is in your `DISCORD_CHANNEL_IDS` list — if yes, it builds a Pick and calls `emit()`. Messages from other bots are ignored.

### .env config

```env
DISCORD_BOT_TOKEN=your_bot_token_here

# Channel IDs to listen to, comma-separated
DISCORD_CHANNEL_IDS=123456789012345678,987654321098765432
```

---

## Running the project

### Backend

```bash
cd backend

# 1. Copy the env template and fill in your credentials
cp .env.example .env

# 2. Create and activate a virtual environment
python -m venv .venv
source .venv/bin/activate      # Windows: .venv\Scripts\activate

# 3. Install Python dependencies
pip install -r requirements.txt

# 4. Start the server
uvicorn main:app --reload --port 8000
```

Any connector whose credentials are blank in `.env` is **skipped** with a log message on startup — so you can run with just Reddit while waiting for your Twitter API approval, for example.

- WebSocket endpoint: `ws://localhost:8000/ws/picks`
- Health / client count: `http://localhost:8000/health`

### Frontend

```bash
cd frontend

cp .env.local.example .env.local
npm install
npm run dev   # runs on http://localhost:3002
```

---

## Full configuration reference

**`backend/.env`**

| Variable | Description | Default |
|---|---|---|
| `REDDIT_CLIENT_ID` | Reddit script app client ID | — |
| `REDDIT_CLIENT_SECRET` | Reddit script app secret | — |
| `REDDIT_USER_AGENT` | Reddit API user agent | `sports-picks-aggregator/1.0` |
| `REDDIT_SUBREDDITS` | Comma-separated subreddits (no r/) | `sportsbetting,sportsbook` |
| `REDDIT_USERS` | Comma-separated usernames to filter by (blank = all) | — |
| `TWITTER_BEARER_TOKEN` | Twitter/X Bearer Token (Basic plan required) | — |
| `TWITTER_USERNAMES` | Comma-separated usernames to follow (no @) | — |
| `DISCORD_BOT_TOKEN` | Discord bot token | — |
| `DISCORD_CHANNEL_IDS` | Comma-separated Discord channel IDs | — |
| `BACKEND_PORT` | FastAPI server port | `8000` |
| `FRONTEND_URL` | Allowed CORS origin | `http://localhost:3000` |

**`frontend/.env.local`**

| Variable | Description | Default |
|---|---|---|
| `NEXT_PUBLIC_WS_URL` | WebSocket URL to connect to | `ws://localhost:8000/ws/picks` |

---

## Gotchas

- **Reddit**: The PRAW stream can silently disconnect on network blips. For production, wrap `run_reddit_stream()` in a retry loop.
- **Twitter/X**: The Basic plan allows only one concurrent filtered stream. Opening a second backend instance will drop the first.
- **Discord**: The bot must be in a server before it can see any messages. Re-invite via a fresh OAuth2 URL if you add a new server later.
- **Channel IDs vs Server IDs**: Always copy from right-clicking the **channel**, not the server name.
- The frontend holds the 200 most recent picks in memory. Oldest picks scroll off as new ones arrive.
- The frontend auto-reconnects to the backend after 3 seconds if the connection drops.
