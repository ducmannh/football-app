"use client";

import React from "react";
import { Calendar, Radio, BarChart3, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { NavTab } from "@/components/navbar";

interface MobileBottomNavProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  selectedStatus: string;
  onSelectStatus: (status: string) => void;
  liveCount: number;
  onScrollToTop: () => void;
}

export function MobileBottomNav({
  activeTab,
  onSelectTab,
  selectedStatus,
  onSelectStatus,
  liveCount,
  onScrollToTop,
}: MobileBottomNavProps) {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-background/90 backdrop-blur-xl border-t border-border/80 px-2 py-1.5 shadow-2xl safe-area-bottom">
      <nav className="flex items-center justify-around">
        {/* 1. Matches */}
        <button
          type="button"
          onClick={() => {
            onSelectTab("MATCHES");
            onSelectStatus("ALL");
            onScrollToTop();
          }}
          className={cn(
            "flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all duration-200 cursor-pointer relative",
            activeTab === "MATCHES" && selectedStatus !== "LIVE"
              ? "text-emerald-500 font-bold scale-105"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Calendar className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Lịch đấu</span>
          {activeTab === "MATCHES" && selectedStatus !== "LIVE" && (
            <span className="w-1 h-1 rounded-full bg-emerald-500 mt-0.5" />
          )}
        </button>

        {/* 2. Live Matches */}
        <button
          type="button"
          onClick={() => {
            onSelectTab("MATCHES");
            onSelectStatus("LIVE");
            onScrollToTop();
          }}
          className={cn(
            "flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all duration-200 cursor-pointer relative",
            activeTab === "MATCHES" && selectedStatus === "LIVE"
              ? "text-rose-500 font-bold scale-105"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <div className="relative">
            <Radio className="w-5 h-5 mb-0.5" />
            {liveCount > 0 && (
              <span className="absolute -top-1 -right-2 px-1 py-0.2 rounded-full bg-rose-500 text-white text-[9px] font-extrabold animate-pulse">
                {liveCount}
              </span>
            )}
          </div>
          <span className="text-[10px]">Trực tiếp</span>
          {activeTab === "MATCHES" && selectedStatus === "LIVE" && (
            <span className="w-1 h-1 rounded-full bg-rose-500 mt-0.5" />
          )}
        </button>

        {/* 3. Standings (BXH) */}
        <button
          type="button"
          onClick={() => {
            onSelectTab("STANDINGS");
            onScrollToTop();
          }}
          className={cn(
            "flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all duration-200 cursor-pointer relative",
            activeTab === "STANDINGS"
              ? "text-blue-500 font-bold scale-105"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <BarChart3 className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Xếp hạng</span>
          {activeTab === "STANDINGS" && (
            <span className="w-1 h-1 rounded-full bg-blue-500 mt-0.5" />
          )}
        </button>

        {/* 4. Stats Hub */}
        <button
          type="button"
          onClick={() => {
            onSelectTab("STATS");
            onScrollToTop();
          }}
          className={cn(
            "flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all duration-200 cursor-pointer relative",
            activeTab === "STATS"
              ? "text-amber-500 font-bold scale-105"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Users className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Thống kê</span>
          {activeTab === "STATS" && (
            <span className="w-1 h-1 rounded-full bg-amber-500 mt-0.5" />
          )}
        </button>
      </nav>
    </div>
  );
}
