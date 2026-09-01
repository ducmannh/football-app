"use client";

import React from "react";
import { Radio, ChevronRight } from "lucide-react";
import { MatchItem } from "@/types/football";

interface LiveTickerProps {
  liveMatches: MatchItem[];
  onSelectMatch: (matchId: string) => void;
}

export function LiveTicker({ liveMatches, onSelectMatch }: LiveTickerProps) {
  if (!liveMatches || liveMatches.length === 0) return null;

  return (
    <div className="w-full bg-gradient-to-r from-rose-500/10 via-amber-500/10 to-emerald-500/10 border-b border-rose-500/20 py-2.5 px-3 sm:px-6">
      <div className="max-w-4xl mx-auto flex items-center gap-3 overflow-x-auto scrollbar-none">
        {/* Badge */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-500 text-white font-bold text-xs uppercase tracking-wider shadow-sm flex-shrink-0 animate-pulse">
          <Radio className="w-3.5 h-3.5" />
          <span>TRỰC TIẾP</span>
        </div>

        {/* Live Match Cards Strip */}
        <div className="flex items-center gap-3">
          {liveMatches.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => onSelectMatch(m.id)}
              className="flex items-center gap-3 px-3.5 py-1.5 rounded-xl bg-card/90 hover:bg-card border border-rose-500/30 hover:border-rose-500/60 shadow-sm transition-all duration-200 cursor-pointer flex-shrink-0 group"
            >
              {/* League tag */}
              <span className="text-[10px] font-bold text-muted-foreground uppercase">
                {m.league.shortName}
              </span>

              {/* Teams & Score */}
              <div className="flex items-center gap-2 text-xs font-semibold">
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded-md bg-white p-0.5 flex items-center justify-center border border-black/10 shadow-xs flex-shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={m.homeTeam.logo}
                      alt={m.homeTeam.name}
                      className="w-full h-full object-contain filter drop-shadow-xs"
                    />
                  </div>
                  <span>{m.homeTeam.shortName}</span>
                </div>

                <div className="px-2 py-0.5 rounded-md bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-400 font-extrabold text-xs sm:text-sm tracking-wider">
                  {m.homeScore} - {m.awayScore}
                </div>

                <div className="flex items-center gap-1.5">
                  <span>{m.awayTeam.shortName}</span>
                  <div className="w-5 h-5 rounded-md bg-white p-0.5 flex items-center justify-center border border-black/10 shadow-xs flex-shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={m.awayTeam.logo}
                      alt={m.awayTeam.name}
                      className="w-full h-full object-contain filter drop-shadow-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Minute */}
              <span className="text-[11px] font-bold text-rose-500 bg-rose-500/10 px-1.5 py-0.5 rounded">
                {m.minute || "LIVE"}
              </span>

              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-rose-500 transition-colors" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
