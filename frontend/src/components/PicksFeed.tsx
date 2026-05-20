"use client";

import { useState, useMemo } from "react";
import { useLivePicks } from "@/hooks/useLivePicks";
import PickCard from "./PickCard";
import type { Source } from "@/types/pick";

const ALL_SOURCES: Source[] = ["reddit", "twitter", "discord"];

export default function PicksFeed() {
  const { picks, connected } = useLivePicks();
  const [activeFilters, setActiveFilters] = useState<Set<Source>>(new Set(ALL_SOURCES));
  const [search, setSearch] = useState("");

  const toggleFilter = (source: Source) => {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      next.has(source) ? next.delete(source) : next.add(source);
      return next;
    });
  };

  const filtered = useMemo(() => {
    return picks.filter(
      (p) =>
        activeFilters.has(p.source) &&
        (search === "" ||
          p.content.toLowerCase().includes(search.toLowerCase()) ||
          p.author.toLowerCase().includes(search.toLowerCase()))
    );
  }, [picks, activeFilters, search]);

  return (
    <div className="flex flex-col gap-5">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Source toggles */}
        <div className="flex items-center gap-1.5">
          {ALL_SOURCES.map((src) => {
            const active = activeFilters.has(src);
            const labels: Record<Source, string> = { reddit: "Reddit", twitter: "X", discord: "Discord" };
            const colors: Record<Source, { on: string; off: string }> = {
              reddit: { on: "bg-orange-500/15 text-orange-300 ring-1 ring-orange-500/30", off: "text-zinc-600 hover:text-zinc-400" },
              twitter: { on: "bg-sky-500/15 text-sky-300 ring-1 ring-sky-500/30", off: "text-zinc-600 hover:text-zinc-400" },
              discord: { on: "bg-indigo-500/15 text-indigo-300 ring-1 ring-indigo-500/30", off: "text-zinc-600 hover:text-zinc-400" },
            };
            return (
              <button
                key={src}
                onClick={() => toggleFilter(src)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                  active ? colors[src].on : colors[src].off
                }`}
              >
                {labels[src]}
              </button>
            );
          })}
        </div>

        {/* Search */}
        <input
          type="text"
          placeholder="search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="ml-auto w-36 bg-transparent border-b border-zinc-700 focus:border-zinc-500 text-sm text-zinc-300 placeholder-zinc-600 focus:outline-none pb-0.5 transition-colors"
        />

        {/* Live indicator */}
        <div className="flex items-center gap-1.5">
          <span className={`h-1.5 w-1.5 rounded-full ${connected ? "bg-green-500" : "bg-zinc-600"}`} />
          <span className="text-xs text-zinc-600">{connected ? "live" : "offline"}</span>
        </div>
      </div>

      {/* Feed */}
      <div className="flex flex-col">
        {filtered.length === 0 ? (
          <p className="text-center text-zinc-600 text-sm py-16">
            {connected ? "nothing yet" : "connecting..."}
          </p>
        ) : (
          filtered.map((pick) => <PickCard key={pick.id} pick={pick} />)
        )}
      </div>
    </div>
  );
}

