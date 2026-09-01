"use client";

import React, { useState, useEffect, useRef } from "react";
import { Season } from "@/types/football";
import { getSeasons } from "@/lib/actions/season";
import { Calendar, ChevronDown, Check, Globe } from "lucide-react";
import { cn } from "@/lib/utils";

interface SeasonSelectorProps {
  selectedSeason: string;
  onSelectSeason: (seasonName: string) => void;
  className?: string;
  showBadge?: boolean;
}

export function SeasonSelector({
  selectedSeason,
  onSelectSeason,
  className,
  showBadge = true,
}: SeasonSelectorProps) {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isMounted = true;
    getSeasons().then((data) => {
      if (isMounted && data.length > 0) {
        setSeasons(data);
      }
    });

    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      isMounted = false;
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const defaultSeasons: Season[] = seasons.length > 0
    ? seasons.filter((s) => s.name === "2026/2027" || s.name === "2025/2026")
    : [
        { id: "s2026", name: "2026/2027", isCurrent: true, startDate: "", endDate: "" },
        { id: "s2025", name: "2025/2026", isCurrent: false, startDate: "", endDate: "" },
      ];

  const getSeasonLabel = (name: string, isCurrent: boolean) => {
    if (name === "2026/2027" || isCurrent) return "Mùa 2026/2027 (Hiện tại)";
    if (name === "2025/2026") return "Mùa 2025/2026 (Năm ngoái)";
    return `Mùa ${name}`;
  };

  const getSeasonShortLabel = (name: string) => {
    return name;
  };

  return (
    <div className={cn("relative inline-block text-left", className)} ref={dropdownRef}>
      {/* Dropdown Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-card hover:bg-secondary/90 text-foreground border border-border/80 shadow-xs font-bold text-xs transition-all cursor-pointer select-none active:scale-95"
      >
        <Calendar className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
        <span className="font-extrabold tracking-tight">
          {getSeasonShortLabel(selectedSeason)}
        </span>
        {showBadge && (
          <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.2 rounded-md bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
            <Globe className="w-2.5 h-2.5" />
            <span>{selectedSeason === "2026/2027" ? "Live" : "Chung cuộc"}</span>
          </span>
        )}
        <ChevronDown
          className={cn(
            "w-3.5 h-3.5 text-muted-foreground transition-transform duration-200",
            isOpen && "rotate-180 text-emerald-500"
          )}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 sm:left-0 sm:right-auto mt-1.5 w-64 rounded-2xl border border-border bg-card/95 backdrop-blur-2xl shadow-xl z-50 p-1.5 space-y-1 animate-fade-in text-foreground">
          <div className="px-2.5 py-1.5 border-b border-border/60">
            <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
              Chọn Mùa Giải BXH
            </p>
          </div>

          <div className="space-y-0.5 custom-scrollbar">
            {defaultSeasons.map((s) => {
              const isSelected = s.name === selectedSeason;
              return (
                <button
                  key={s.id || s.name}
                  type="button"
                  onClick={() => {
                    onSelectSeason(s.name);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer text-left",
                    isSelected
                      ? "bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 font-black shadow-2xs"
                      : "text-foreground hover:bg-secondary"
                  )}
                >
                  <div className="flex flex-col">
                    <span className="text-xs">{getSeasonLabel(s.name, s.isCurrent)}</span>
                    <span className="text-[10px] text-muted-foreground font-normal">
                      {s.name === "2026/2027"
                        ? "Mùa giải hiện tại • Đang diễn ra"
                        : "Mùa giải năm ngoái • BXH chung cuộc"}
                    </span>
                  </div>

                  {isSelected && <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
