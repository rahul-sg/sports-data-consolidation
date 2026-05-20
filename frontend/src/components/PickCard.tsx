"use client";

import { formatDistanceToNow, format } from "date-fns";
import type { Pick } from "@/types/pick";

const SOURCE_CONFIG: Record<
  Pick["source"],
  { label: string; icon: string; topBar: string; badge: string; avatar: string; link: string }
> = {
  reddit: {
    label: "Reddit",
    icon: "r/",
    topBar: "border-l-2 border-orange-500/60",
    badge: "bg-orange-500/10 text-orange-400 ring-1 ring-orange-500/25",
    avatar: "bg-orange-500/20 text-orange-300",
    link: "text-orange-500/70 hover:text-orange-400",
  },
  twitter: {
    label: "X (Twitter)",
    icon: "@",
    topBar: "border-l-2 border-sky-500/60",
    badge: "bg-sky-500/10 text-sky-400 ring-1 ring-sky-500/25",
    avatar: "bg-sky-500/20 text-sky-300",
    link: "text-sky-500/70 hover:text-sky-400",
  },
  discord: {
    label: "Discord",
    icon: "#",
    topBar: "border-l-2 border-indigo-500/60",
    badge: "bg-indigo-500/10 text-indigo-400 ring-1 ring-indigo-500/25",
    avatar: "bg-indigo-500/20 text-indigo-300",
    link: "text-indigo-500/70 hover:text-indigo-400",
  },
};

function getInitials(name: string) {
  const clean = name.replace(/^[@u\/]+/, "");
  return clean.slice(0, 2).toUpperCase();
}

interface Props {
  pick: Pick;
}

export default function PickCard({ pick }: Props) {
  const cfg = SOURCE_CONFIG[pick.source];
  const date = new Date(pick.timestamp);
  const timeAgo = formatDistanceToNow(date, { addSuffix: true });
  const fullDate = format(date, "MMM d, yyyy · h:mm a");

  const community = pick.channel
    ? `${pick.community ? pick.community + " · " : ""}#${pick.channel}`
    : pick.community ?? "";

  return (
    <article
      className={`bg-zinc-900/60 rounded-xl p-4 mb-3 ${cfg.topBar} hover:bg-zinc-900 transition-colors duration-150`}
    >
      {/* Source + community header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold tracking-wide ${cfg.badge}`}>
            {cfg.label}
          </span>
          {community && (
            <span className="text-xs text-zinc-500 truncate max-w-[180px]">{community}</span>
          )}
        </div>
        <time
          title={fullDate}
          className="text-[11px] text-zinc-600 flex-shrink-0 ml-2"
        >
          {timeAgo}
        </time>
      </div>

      {/* Author + content */}
      <div className="flex gap-3">
        {/* Avatar */}
        <div
          className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center text-[11px] font-bold mt-0.5 ${cfg.avatar}`}
        >
          {getInitials(pick.author)}
        </div>

        <div className="flex-1 min-w-0">
          {/* Author name */}
          <div className="mb-1">
            {pick.author_url ? (
              <a
                href={pick.author_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-semibold text-zinc-100 hover:underline"
              >
                {pick.author}
              </a>
            ) : (
              <span className="text-sm font-semibold text-zinc-100">{pick.author}</span>
            )}
          </div>

          {/* Message content */}
          <p className="text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed break-words">
            {pick.content}
          </p>
        </div>
      </div>

      {/* Footer */}
      {pick.url && (
        <div className="mt-3 pt-3 border-t border-zinc-800 flex items-center justify-between">
          <span className="text-[11px] text-zinc-600">{fullDate}</span>
          <a
            href={pick.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`text-[11px] font-medium transition-colors ${cfg.link}`}
          >
            view original ↗
          </a>
        </div>
      )}
    </article>
  );
}
