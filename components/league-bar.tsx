"use client";

import React, { useState, useEffect } from "react";
import { cn, getCountryFlagUrl } from "@/lib/utils";
import { Globe, ChevronRight } from "lucide-react";
import { League } from "@/types/football";

interface LeagueBarProps {
  leagues: League[];
  selectedLeague: string;
  onSelectLeague: (code: string) => void;
  hideAllOption?: boolean;
}

const COUNTRY_NAMES_VI: Record<string, string> = {
  England: "Anh",
  Spain: "Tây Ban Nha",
  Italy: "Ý",
  Germany: "Đức",
  France: "Pháp",
  Europe: "Châu Âu",
};

export function LeagueBar({
  leagues,
  selectedLeague,
  onSelectLeague,
  hideAllOption = false,
}: LeagueBarProps) {
  // Determine active country based on selectedLeague
  const [selectedCountry, setSelectedCountry] = useState<string>(hideAllOption ? "England" : "ALL");

  useEffect(() => {
    if (selectedLeague === "ALL") {
      setSelectedCountry(hideAllOption ? "England" : "ALL");
    } else if (selectedLeague.startsWith("COUNTRY:")) {
      setSelectedCountry(selectedLeague.replace("COUNTRY:", ""));
    } else {
      const found = leagues.find((l) => l.code === selectedLeague);
      if (found) {
        setSelectedCountry(found.country);
      }
    }
  }, [selectedLeague, leagues, hideAllOption]);

  const validLeagues = leagues.filter(
    (l) =>
      l.code !== "USC" &&
      !l.name.toLowerCase().includes("super cup") &&
      !l.name.toLowerCase().includes("siêu cúp")
  );

  // Group leagues by country
  const countryGroups = validLeagues.reduce((acc, league) => {
    const country = league.country || "Khác";
    if (!acc[country]) {
      acc[country] = [];
    }
    acc[country].push(league);
    return acc;
  }, {} as Record<string, League[]>);

  // Country order
  const countriesOrder = ["England", "Spain", "Italy", "Germany", "France", "Europe"];
  const sortedCountries = Object.keys(countryGroups).sort((a, b) => {
    const idxA = countriesOrder.indexOf(a);
    const idxB = countriesOrder.indexOf(b);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    return a.localeCompare(b);
  });

  const activeCountryLeagues = selectedCountry !== "ALL" ? countryGroups[selectedCountry] || [] : [];

  const handleCountryClick = (country: string) => {
    if (country === "ALL") {
      setSelectedCountry("ALL");
      onSelectLeague("ALL");
    } else {
      setSelectedCountry(country);
      if (hideAllOption) {
        const countryLeagues = countryGroups[country] || [];
        const firstLeague = countryLeagues[0];
        onSelectLeague(firstLeague ? firstLeague.code : "PL");
      } else {
        onSelectLeague(`COUNTRY:${country}`);
      }
    }
  };

  return (
    <div className="w-full border-b border-border/50 bg-card/40 backdrop-blur-md transition-all duration-300 overflow-hidden">
      <div className="max-w-5xl mx-auto px-2.5 sm:px-6 py-2.5 space-y-2">
        {/* TẦNG 1: Danh sách Quốc Gia & Châu Âu - Cuộn mượt mà trên mobile */}
        <div
          style={{ WebkitOverflowScrolling: "touch" }}
          className="w-full max-w-full overflow-x-auto overflow-y-hidden scrollbar-none flex items-center justify-start sm:justify-center gap-1.5 sm:gap-2 touch-pan-x overscroll-x-contain py-0.5"
        >
          {/* Tất cả giải đấu button (chỉ hiện khi hideAllOption là false) */}
          {!hideAllOption && (
            <button
              type="button"
              onClick={() => handleCountryClick("ALL")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-bold transition-all duration-200 cursor-pointer border shadow-xs active:scale-95 flex-shrink-0 whitespace-nowrap",
                selectedCountry === "ALL" && selectedLeague === "ALL"
                  ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white border-emerald-400 shadow-md shadow-emerald-500/25 scale-[1.03]"
                  : "bg-card/80 text-muted-foreground border-border hover:text-foreground hover:bg-secondary/70 hover:border-border/80"
              )}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Tất cả giải ({leagues.length})</span>
            </button>
          )}

          {/* Nút Quốc gia */}
          {sortedCountries.map((country) => {
            const countryLeagues = countryGroups[country];
            const isCountryActive = selectedCountry === country;
            const flagUrl = getCountryFlagUrl(country);
            const countryLabel = COUNTRY_NAMES_VI[country] || country;

            return (
              <button
                key={country}
                type="button"
                onClick={() => handleCountryClick(country)}
                className={cn(
                  "group relative flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-bold transition-all duration-200 cursor-pointer border whitespace-nowrap active:scale-95 flex-shrink-0",
                  isCountryActive
                    ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white border-emerald-400 shadow-md shadow-emerald-500/25 scale-[1.03]"
                    : "bg-card/70 text-muted-foreground border-border/70 hover:text-foreground hover:bg-secondary/70 hover:border-emerald-500/40"
                )}
              >
                {/* Flag Image */}
                <div className="w-4 h-3 rounded-xs overflow-hidden shadow-xs border border-black/10 flex-shrink-0 flex items-center justify-center bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={flagUrl}
                    alt={country}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = "none";
                    }}
                  />
                </div>

                <span>{countryLabel}</span>
                <span
                  className={cn(
                    "px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold",
                    isCountryActive ? "bg-white/20 text-white" : "bg-secondary text-muted-foreground"
                  )}
                >
                  {countryLeagues.length}
                </span>
              </button>
            );
          })}
        </div>

        {/* TẦNG 2: Danh Sách Các Giải Đấu & Cúp Của Quốc Gia Đang Chọn - Cuộn mượt mà trên mobile */}
        {selectedCountry !== "ALL" && activeCountryLeagues.length > 0 && (
          <div
            style={{ WebkitOverflowScrolling: "touch" }}
            className="w-full max-w-full flex items-center justify-start sm:justify-center gap-1.5 pt-1.5 border-t border-border/40 overflow-x-auto overflow-y-hidden scrollbar-none animate-fade-in touch-pan-x overscroll-x-contain py-0.5"
          >
            <div className="flex items-center gap-1 text-[11px] font-bold text-muted-foreground flex-shrink-0 pr-1 whitespace-nowrap">
              <span>{COUNTRY_NAMES_VI[selectedCountry] || selectedCountry}:</span>
              <ChevronRight className="w-3 h-3" />
            </div>

            {/* Nút lọc tất cả các giải trong quốc gia này (chỉ hiện khi hideAllOption là false) */}
            {!hideAllOption && (
              <button
                type="button"
                onClick={() => onSelectLeague(`COUNTRY:${selectedCountry}`)}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all duration-200 cursor-pointer border whitespace-nowrap active:scale-95 flex-shrink-0",
                  selectedLeague === `COUNTRY:${selectedCountry}`
                    ? "bg-emerald-500/20 text-emerald-500 border-emerald-500/50 shadow-xs"
                    : "bg-card/60 text-muted-foreground border-border/60 hover:text-foreground hover:bg-secondary/60"
                )}
              >
                <span>
                  🔥 {selectedCountry === "Europe" ? "Tất cả Cúp Châu Âu" : `Tất cả giải ở ${COUNTRY_NAMES_VI[selectedCountry] || selectedCountry}`}
                </span>
              </button>
            )}

            {/* Các giải đấu con của quốc gia */}
            {activeCountryLeagues.map((league) => {
              const isSelected = selectedLeague === league.code;

              return (
                <button
                  key={league.id}
                  type="button"
                  onClick={() => onSelectLeague(league.code)}
                  className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all duration-200 cursor-pointer border whitespace-nowrap active:scale-95 flex-shrink-0",
                    isSelected
                      ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white border-emerald-400 shadow-xs scale-102"
                      : "bg-card/70 text-muted-foreground border-border/70 hover:text-foreground hover:bg-secondary/70"
                  )}
                >
                  {/* Logo giải đấu */}
                  <div className="w-4 h-4 rounded-md bg-white p-0.5 relative flex items-center justify-center shadow-xs border border-black/10 flex-shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={league.logo}
                      alt={league.name}
                      className="w-full h-full object-contain filter drop-shadow-xs"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = "none";
                      }}
                    />
                  </div>

                  <span>{league.shortName}</span>
                  {league.type === "CUP" && (
                    <span className="px-1 py-0.2 rounded bg-amber-500/20 text-amber-500 border border-amber-500/30 text-[9px] font-black uppercase">
                      Cúp
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
