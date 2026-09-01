"use client";

import React, { useState, useEffect } from "react";
import { StandingItem, StandingsFilter, League } from "@/types/football";
import { getStandings } from "@/lib/actions/standings";
import { SeasonSelector } from "@/components/season-selector";
import { cn, getCountryFlagUrl } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface StandingsTableProps {
  leagues: League[];
  initialLeagueCode?: string;
  onSelectTeam?: (teamId: string) => void;
}

export function StandingsTable({
  leagues,
  initialLeagueCode = "PL",
  onSelectTeam,
}: StandingsTableProps) {
  const [selectedLeague, setSelectedLeague] = useState<string>(initialLeagueCode);
  const [selectedSeason, setSelectedSeason] = useState<string>("2026/2027");
  const [filter, setFilter] = useState<StandingsFilter>("ALL");
  const [standings, setStandings] = useState<StandingItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const handleSelectLeague = (code: string) => {
    setSelectedLeague(code);
    setLoading(true);
  };

  const handleSelectSeason = (season: string) => {
    setSelectedSeason(season);
    setLoading(true);
  };

  useEffect(() => {
    let isMounted = true;

    getStandings(selectedLeague, selectedSeason).then((data) => {
      if (isMounted) {
        setStandings(data);
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [selectedLeague, selectedSeason]);

  const currentLeague = leagues.find((l) => l.code === selectedLeague);
  const isEuroCup = ["CL", "EL", "ECL"].includes(selectedLeague);

  // Helper for Zone Color and Label
  const getZoneBadgeClass = (zone?: string | null, position?: number) => {
    if (isEuroCup) {
      if (position && position <= 8) return "bg-emerald-500 text-white";
      if (position && position <= 24) return "bg-amber-500 text-white";
      return "bg-secondary text-muted-foreground";
    }

    if (selectedLeague === "BL1") {
      if (position && position <= 4) return "bg-blue-500 text-white";
      if (position === 5) return "bg-orange-500 text-white";
      if (position === 6) return "bg-emerald-500 text-white";
      if (position === 16) return "bg-amber-500 text-white";
      if (position && position >= 17) return "bg-rose-500 text-white";
      return "bg-secondary text-muted-foreground";
    }

    if (selectedLeague === "FL1") {
      if (position && position <= 3) return "bg-blue-500 text-white";
      if (position === 4) return "bg-sky-500 text-white";
      if (position === 5) return "bg-orange-500 text-white";
      if (position === 6) return "bg-emerald-500 text-white";
      if (position === 16) return "bg-amber-500 text-white";
      if (position && position >= 17) return "bg-rose-500 text-white";
      return "bg-secondary text-muted-foreground";
    }

    if (zone === "CL" || (position && position <= 4)) return "bg-blue-500 text-white";
    if (zone === "EL" || position === 5) return "bg-orange-500 text-white";
    if (zone === "ECL" || position === 6) return "bg-emerald-500 text-white";
    if (zone === "RELEGATION" || (position && position >= 18)) return "bg-rose-500 text-white";
    return "bg-secondary text-muted-foreground";
  };

  const getFormBadge = (result: string) => {
    switch (result) {
      case "W":
        return "bg-emerald-500 text-white";
      case "D":
        return "bg-amber-500 text-white";
      case "L":
        return "bg-rose-500 text-white";
      default:
        return "bg-secondary text-muted-foreground";
    }
  };

  const standingsLeagues = leagues.filter(
    (l) => l.type === "LEAGUE" || ["CL", "EL", "ECL"].includes(l.code)
  );

  return (
    <div className="w-full space-y-3 sm:space-y-4">
      {/* 1. League Selector (Slim Swipe on Mobile, Centered Wrap on Desktop) */}
      <div className="w-full overflow-x-auto sm:overflow-visible scrollbar-none py-1">
        <div className="flex sm:flex-wrap items-center justify-start sm:justify-center gap-1.5 sm:gap-2.5 min-w-max sm:min-w-0 px-1 sm:px-0">
          {standingsLeagues.map((l) => {
            const isSelected = selectedLeague === l.code;
            const flagUrl = getCountryFlagUrl(l.country);

            return (
              <button
                key={l.code}
                type="button"
                onClick={() => handleSelectLeague(l.code)}
                className={cn(
                  "flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl text-xs sm:text-[13px] font-bold transition-all duration-200 cursor-pointer border shadow-2xs active:scale-95 whitespace-nowrap flex-shrink-0",
                  isSelected
                    ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white border-emerald-400 shadow-md shadow-emerald-500/25 font-black scale-105"
                    : "bg-card/85 border-border/80 text-muted-foreground hover:text-foreground hover:bg-card hover:border-emerald-500/40"
                )}
              >
                {flagUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={flagUrl}
                    alt={l.country}
                    className="w-3.5 h-2.5 sm:w-4 sm:h-3 object-cover rounded-xs border border-white/20 shadow-2xs flex-shrink-0"
                  />
                )}

                <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-md sm:rounded-lg bg-white p-0.5 flex items-center justify-center flex-shrink-0 shadow-2xs border border-black/10">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={l.logo}
                    alt={l.name}
                    className="w-full h-full object-contain filter drop-shadow-xs"
                  />
                </div>

                {/* Tên ngắn gọn trên điện thoại, tên đầy đủ trên máy tính */}
                <span className="sm:hidden">{l.shortName || l.name}</span>
                <span className="hidden sm:inline">{l.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Top Controls & Header */}
      <div className="rounded-3xl border border-border/80 bg-card/85 backdrop-blur-xl p-3.5 sm:p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 mb-3 border-b border-border/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-2xl bg-white p-1.5 flex items-center justify-center flex-shrink-0 shadow-md border border-black/10">
              <img
                src={currentLeague?.logo || ""}
                alt={currentLeague?.name || ""}
                className="w-full h-full object-contain filter drop-shadow-xs"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-sm sm:text-lg text-foreground">
                  {currentLeague?.name}
                </h3>
                <span className="text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                  {standings.length} đội
                </span>
              </div>
              <p className="text-[10px] sm:text-xs text-muted-foreground font-medium">
                Mùa {selectedSeason} • {selectedSeason === "2026/2027" ? "Đang diễn ra" : "Chung cuộc"}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <SeasonSelector
              selectedSeason={selectedSeason}
              onSelectSeason={handleSelectSeason}
            />

            <div className="flex items-center p-1 rounded-2xl bg-secondary/80 border border-border/80 text-[11px] font-bold">
              {(["ALL", "HOME", "AWAY"] as StandingsFilter[]).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFilter(f)}
                  className={cn(
                    "px-2.5 py-1 rounded-xl transition-all cursor-pointer font-extrabold",
                    filter === f
                      ? "bg-card text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {f === "ALL" ? "Tổng thể" : f === "HOME" ? "Sân nhà" : "Sân khách"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 3. Standings Table Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Loader2 className="w-7 h-7 text-emerald-500 animate-spin" />
            <p className="text-xs text-muted-foreground font-bold">Đang tải dữ liệu bảng xếp hạng...</p>
          </div>
        ) : standings.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-xs font-semibold">
            Chưa có dữ liệu bảng xếp hạng cho giải đấu và mùa giải này.
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-border/60 text-[10px] uppercase tracking-wider text-muted-foreground font-black">
                  <th className="py-2.5 px-2 text-center w-8">#</th>
                  <th className="py-2.5 px-2 sm:px-3">CLB</th>
                  <th className="py-2.5 px-1 sm:px-2 text-center">Trận</th>
                  <th className="py-2.5 px-1 sm:px-2 text-center">T</th>
                  <th className="py-2.5 px-1 sm:px-2 text-center">H</th>
                  <th className="py-2.5 px-1 sm:px-2 text-center">B</th>
                  <th className="py-2.5 px-2 text-center hidden md:table-cell">BT-BB</th>
                  <th className="py-2.5 px-1 sm:px-2 text-center">HS</th>
                  <th className="py-2.5 px-1.5 sm:px-2 text-center font-extrabold text-foreground">Điểm</th>
                  <th className="py-2.5 px-2 text-center hidden sm:table-cell w-36">Phong độ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {standings.map((item) => {
                  const played = filter === "HOME" ? item.homePlayed : filter === "AWAY" ? item.awayPlayed : item.played;
                  const won = filter === "HOME" ? item.homeWon : filter === "AWAY" ? item.awayWon : item.won;
                  const draw = filter === "HOME" ? item.homeDraw : filter === "AWAY" ? item.awayDraw : item.draw;
                  const lost = filter === "HOME" ? item.homeLost : filter === "AWAY" ? item.awayLost : item.lost;
                  const gf = filter === "HOME" ? item.homeGoalsFor : filter === "AWAY" ? item.awayGoalsFor : item.goalsFor;
                  const ga = filter === "HOME" ? item.homeGoalsAgainst : filter === "AWAY" ? item.awayGoalsAgainst : item.goalsAgainst;
                  const gd = gf - ga;
                  const pts = filter === "HOME" ? item.homePoints : filter === "AWAY" ? item.awayPoints : item.points;

                  return (
                    <tr
                      key={item.id}
                      onClick={() => onSelectTeam?.(item.team.id)}
                      className="hover:bg-secondary/40 transition-colors group cursor-pointer"
                    >
                      <td className="py-2.5 px-2 text-center">
                        <span
                          className={cn(
                            "w-5 h-5 rounded-full text-[10px] font-black inline-flex items-center justify-center shadow-2xs",
                            getZoneBadgeClass(item.zone, item.position)
                          )}
                        >
                          {item.position}
                        </span>
                      </td>

                      <td className="py-2.5 px-2 sm:px-3">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className="w-6 h-6 rounded-lg bg-white p-0.5 flex items-center justify-center flex-shrink-0 shadow-xs border border-black/10 group-hover:scale-110 transition-transform">
                            <img
                              src={item.team.logo}
                              alt={item.team.name}
                              className="w-full h-full object-contain"
                              onError={(e) => { (e.target as HTMLElement).style.display = "none"; }}
                            />
                          </div>
                          <span className="font-extrabold text-foreground group-hover:text-emerald-500 transition-colors truncate max-w-[100px] sm:max-w-none">
                            {item.team.name}
                          </span>
                        </div>
                      </td>

                      <td className="py-2.5 px-1 sm:px-2 text-center text-muted-foreground font-semibold">{played}</td>
                      <td className="py-2.5 px-1 sm:px-2 text-center text-emerald-500 font-bold">{won}</td>
                      <td className="py-2.5 px-1 sm:px-2 text-center text-muted-foreground font-semibold">{draw}</td>
                      <td className="py-2.5 px-1 sm:px-2 text-center text-rose-500 font-bold">{lost}</td>
                      <td className="py-2.5 px-2 text-center text-muted-foreground hidden md:table-cell">{gf}:{ga}</td>
                      <td className="py-2.5 px-1 sm:px-2 text-center font-mono font-bold">
                        <span className={gd > 0 ? "text-emerald-500" : gd < 0 ? "text-rose-500" : "text-muted-foreground"}>
                          {gd > 0 ? `+${gd}` : gd}
                        </span>
                      </td>
                      <td className="py-2.5 px-1.5 sm:px-2 text-center font-mono font-black text-xs text-foreground">{pts}</td>
                      {/* Form (Always 5 matches) */}
                      <td className="py-2.5 px-2 text-center hidden sm:table-cell">
                        <div className="flex items-center justify-center gap-1">
                          {(() => {
                            const rawForm =
                              item.formDetails && item.formDetails.length > 0
                                ? item.formDetails
                                : (item.form || "").split("").map((ch, idx) => ({
                                    result: (ch === "W" ? "W" : ch === "L" ? "L" : "D") as "W" | "D" | "L",
                                    score: "",
                                    opponentName: "",
                                    isHome: true,
                                    tooltipText: `Trận ${idx + 1}: ${ch === "W" ? "Thắng" : ch === "L" ? "Thua" : "Hòa"}`,
                                  }));

                            const fiveMatches = rawForm.slice(-5);
                            while (fiveMatches.length < 5) {
                              fiveMatches.push({
                                result: "-" as any,
                                score: "",
                                opponentName: "",
                                isHome: true,
                                tooltipText: "Chưa thi đấu",
                              });
                            }

                            return fiveMatches.map((f, i) => (
                              <span
                                key={i}
                                className={cn(
                                  "w-5 h-5 rounded-md font-black text-[9.5px] flex items-center justify-center shadow-xs cursor-default select-none transition-transform hover:scale-110",
                                  getFormBadge(f.result)
                                )}
                                title={
                                  f.tooltipText ||
                                  (f.result === "W"
                                    ? "Thắng"
                                    : f.result === "D"
                                    ? "Hòa"
                                    : f.result === "L"
                                    ? "Thua"
                                    : "Chưa thi đấu")
                                }
                              >
                                {f.result}
                              </span>
                            ));
                          })()}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* 4. Legend Footer */}
        <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-border/50 flex flex-wrap items-center justify-between gap-2 sm:gap-3 text-[10px] sm:text-[11px] text-muted-foreground font-medium">
          {isEuroCup ? (
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span>Top 1–8: Vào thẳng Vòng 1/8</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span>Top 9–24: Play-off tranh vé 1/8</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-secondary border border-border" />
                <span>Top 25–36: Bị loại</span>
              </span>
            </div>
          ) : selectedLeague === "BL1" ? (
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                <span>Top 1–4: Champions League</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                <span>Top 5: Europa League</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span>Top 6: Conference League</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span>Top 16: Play-off trụ hạng</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span>Top 17–18: Xuống hạng</span>
              </span>
            </div>
          ) : selectedLeague === "FL1" ? (
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                <span>Top 1–3: Champions League</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
                <span>Top 4: Vòng loại C1</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                <span>Top 5: Europa League</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span>Top 6: Conference League</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span>Top 16: Play-off trụ hạng</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span>Top 17–18: Xuống hạng</span>
              </span>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                <span>Top 1–4: Champions League</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                <span>Top 5: Europa League</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span>Top 6: Conference League</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span>Top 18–20: Xuống hạng</span>
              </span>
            </div>
          )}

          <span className="text-[10px] opacity-75 hidden sm:inline">
            * Cập nhật theo thời gian thực
          </span>
        </div>
      </div>
    </div>
  );
}
