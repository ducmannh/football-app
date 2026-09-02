"use client";

import React from "react";
import { Trophy, Radio, BarChart3, Users } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

export type NavTab = "MATCHES" | "FULL_FIXTURES" | "STANDINGS" | "STATS";

interface NavbarProps {
  liveCount: number;
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
}

export function Navbar({ liveCount, activeTab, onSelectTab }: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/70 bg-background/85 backdrop-blur-2xl transition-colors">
      <div className="max-w-4xl mx-auto px-3 sm:px-4 h-16 flex items-center justify-between gap-2 sm:gap-4">
        {/* Left: Brand Logo & Tagline */}
        <div
          onClick={() => onSelectTab("MATCHES")}
          className="flex items-center gap-2.5 sm:gap-3 cursor-pointer select-none group flex-shrink-0"
        >
          <div className="relative flex items-center justify-center w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-emerald-400 text-white shadow-lg shadow-emerald-500/25 group-hover:scale-105 transition-transform flex-shrink-0">
            <Trophy className="w-5 h-5 drop-shadow" />
            <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-black text-base sm:text-lg tracking-tight bg-gradient-to-r from-emerald-500 via-teal-400 to-amber-400 bg-clip-text text-transparent">
                FOOTBALL HUB
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground hidden lg:block leading-tight">
              Lịch thi đấu, BXH & Thống kê Châu Âu
            </p>
          </div>
        </div>

        {/* Center: Premium Segmented Navigation Tabs (No text wrapping, sleek pill) */}
        <nav className="hidden md:flex items-center bg-secondary/80 p-1 rounded-2xl border border-border/80 shadow-inner">
          <button
            type="button"
            onClick={() => onSelectTab("MATCHES")}
            className={cn(
              "flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs sm:text-[13px] font-bold transition-all duration-200 cursor-pointer whitespace-nowrap active:scale-95",
              activeTab === "MATCHES"
                ? "bg-card text-emerald-500 dark:text-emerald-400 shadow-md font-black border border-border/80"
                : "text-muted-foreground hover:text-foreground hover:bg-card/50"
            )}
          >
            <span>⚽</span>
            <span>Lịch & Tỉ số</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectTab("FULL_FIXTURES")}
            className={cn(
              "flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs sm:text-[13px] font-bold transition-all duration-200 cursor-pointer whitespace-nowrap active:scale-95",
              activeTab === "FULL_FIXTURES"
                ? "bg-card text-emerald-500 dark:text-emerald-400 shadow-md font-black border border-border/80"
                : "text-muted-foreground hover:text-foreground hover:bg-card/50"
            )}
          >
            <span>📅</span>
            <span>Lịch toàn giải</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectTab("STANDINGS")}
            className={cn(
              "flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs sm:text-[13px] font-bold transition-all duration-200 cursor-pointer whitespace-nowrap active:scale-95",
              activeTab === "STANDINGS"
                ? "bg-card text-emerald-500 dark:text-emerald-400 shadow-md font-black border border-border/80"
                : "text-muted-foreground hover:text-foreground hover:bg-card/50"
            )}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Bảng xếp hạng</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectTab("STATS")}
            className={cn(
              "flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs sm:text-[13px] font-bold transition-all duration-200 cursor-pointer whitespace-nowrap active:scale-95",
              activeTab === "STATS"
                ? "bg-card text-emerald-500 dark:text-emerald-400 shadow-md font-black border border-border/80"
                : "text-muted-foreground hover:text-foreground hover:bg-card/50"
            )}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Thống kê</span>
          </button>
        </nav>

        {/* Right: Live Count Pill + Theme Toggle */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {liveCount > 0 && (
            <button
              type="button"
              onClick={() => onSelectTab("MATCHES")}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full bg-rose-500/15 border border-rose-500/35 text-rose-600 dark:text-rose-400 text-xs font-black animate-pulse shadow-sm cursor-pointer hover:bg-rose-500/25 transition-colors whitespace-nowrap active:scale-95"
            >
              <Radio className="w-3.5 h-3.5 flex-shrink-0" />
              <span>
                {liveCount} <span className="hidden sm:inline">Trận</span> LIVE
              </span>
            </button>
          )}

          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
