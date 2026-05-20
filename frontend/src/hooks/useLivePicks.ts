"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { Pick } from "@/types/pick";

const WS_URL =
  process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000/ws/picks";

const MAX_PICKS = 200; // cap in-memory

// Demo picks shown when the backend is not connected
const DEMO_PICKS: Pick[] = [
  {
    id: "demo_reddit_1",
    source: "reddit",
    author: "u/SharpBettorPro",
    author_url: "https://reddit.com/user/SharpBettorPro",
    content: "**Lakers -3.5 tonight** — Fade the public, line has been moving our way all day. LeBron is questionable for BOS, Vegas knows something. Taking MAX units on LAL.\n\n🔒 Lock of the week",
    url: "https://reddit.com/r/sportsbetting",
    community: "sportsbetting",
    channel: null,
    timestamp: new Date(Date.now() - 1000 * 60 * 4).toISOString(),
    raw: null,
  },
  {
    id: "demo_twitter_1",
    source: "twitter",
    author: "@CapperKing",
    author_url: "https://twitter.com/CapperKing",
    content: "NFL Sunday card lookin juicy 🍋\n\nChiefs -6.5 ✅\nOver 48.5 Chiefs/Raiders ✅\nDak Prescott over 1.5 TDs ✅\n\nFade at your own risk. 34-18 L52 on NFL sides.",
    url: "https://twitter.com/CapperKing/status/1234567890",
    community: "Twitter / X",
    channel: null,
    timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    raw: null,
  },
  {
    id: "demo_discord_1",
    source: "discord",
    author: "WizardCapper",
    author_url: null,
    content: "🚨 PLAY ALERT 🚨\n\nCeltics ML (-140) — getting great line value, sharp money confirmed on this side per our Pinnacle tracker. 2u play. GG",
    url: "https://discord.com/channels/123/456/789",
    community: "Elite Picks Server",
    channel: "nba-picks",
    timestamp: new Date(Date.now() - 1000 * 60 * 27).toISOString(),
    raw: null,
  },
  {
    id: "demo_reddit_2",
    source: "reddit",
    author: "u/ValueHunter99",
    author_url: "https://reddit.com/user/ValueHunter99",
    content: "Parlay I'm hitting tonight:\n- Nuggets ML\n- Under 224.5 Nuggets/Heat\n- Jokic triple double prop (+280)\n\n+EV at every book I checked. Combined odds around +650.",
    url: "https://reddit.com/r/sportsbook",
    community: "sportsbook",
    channel: null,
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    raw: null,
  },
  {
    id: "demo_discord_2",
    source: "discord",
    author: "TheLegend",
    author_url: null,
    content: "MLB side for today: Dodgers -1.5 RL. Glasnow is dealing, Atlanta's lineup is cold as ice the last 10 days. 1.5u.",
    url: "https://discord.com/channels/111/222/333",
    community: "Sports Picks Hub",
    channel: "mlb-daily",
    timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    raw: null,
  },
  {
    id: "demo_twitter_2",
    source: "twitter",
    author: "@LineMoverAlerts",
    author_url: "https://twitter.com/LineMoverAlerts",
    content: "⚡ LINE MOVE: Cowboys/Eagles total has jumped from 46 to 49 in the last 2 hours. Sharp action on the OVER detected at multiple books. Buying the move.",
    url: "https://twitter.com/LineMoverAlerts/status/9876543210",
    community: "Twitter / X",
    channel: null,
    timestamp: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    raw: null,
  },
];

export function useLivePicks() {
  const [picks, setPicks] = useState<Pick[]>(DEMO_PICKS);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  const connect = useCallback(() => {
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => setConnected(true);
    ws.onclose = () => {
      setConnected(false);
      // Reconnect after 3 s
      setTimeout(connect, 3000);
    };
    ws.onerror = () => ws.close();

    ws.onmessage = (event) => {
      try {
        const pick: Pick = JSON.parse(event.data);
        setPicks((prev) => [pick, ...prev].slice(0, MAX_PICKS));
      } catch {
        // ignore malformed messages
      }
    };
  }, []);

  useEffect(() => {
    connect();
    return () => {
      wsRef.current?.close();
    };
  }, [connect]);

  return { picks, connected };
}
