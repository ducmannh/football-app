"use client";

import React, { useState, useEffect } from "react";
import { PlayerSeasonStatItem, League } from "@/types/football";
import {
  getTopScorers,
  getTopAssists,
  getTopCleanSheets,
  getDisciplineStats,
} from "@/lib/actions/stats";
import { SeasonSelector } from "@/components/season-selector";
import { cn, getCountryFlagUrl } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface StatsHubProps {
  leagues: League[];
  initialLeagueCode?: string;
  onSelectPlayer?: (playerId: string) => void;
  onSelectTeam?: (teamId: string) => void;
}

type StatCategory = "SCORERS" | "ASSISTS" | "CLEAN_SHEETS" | "DISCIPLINE";

const COUNTRY_NAMES_VI: Record<string, string> = {
  England: "Anh",
  Spain: "Tây Ban Nha",
  Italy: "Ý",
  Germany: "Đức",
  France: "Pháp",
  Europe: "Châu Âu",
};

export function StatsHub({
  leagues,
  initialLeagueCode = "PL",
  onSelectPlayer,
  onSelectTeam,
}: StatsHubProps) {
  const [selectedLeague, setSelectedLeague] = useState<string>(initialLeagueCode);
  const [selectedSeason, setSelectedSeason] = useState<string>("2026/2027");
  const [category, setCategory] = useState<StatCategory>("SCORERS");
  const [stats, setStats] = useState<PlayerSeasonStatItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const handleSelectLeague = (code: string) => {
    setSelectedLeague(code);
    setLoading(true);
  };

  const handleSelectCategory = (cat: StatCategory) => {
    setCategory(cat);
    setLoading(true);
  };

  const handleSelectSeason = (season: string) => {
    setSelectedSeason(season);
    setLoading(true);
  };

  useEffect(() => {
    let isMounted = true;

    const fetchStats = async () => {
      let data: PlayerSeasonStatItem[] = [];
      switch (category) {
        case "SCORERS":
          data = await getTopScorers(selectedLeague, 20, selectedSeason);
          break;
        case "ASSISTS":
          data = await getTopAssists(selectedLeague, 20, selectedSeason);
          break;
        case "CLEAN_SHEETS":
          data = await getTopCleanSheets(selectedLeague, 20, selectedSeason);
          break;
        case "DISCIPLINE":
          data = await getDisciplineStats(selectedLeague, 20, selectedSeason);
          break;
      }
      if (isMounted) {
        setStats(data);
        setLoading(false);
      }
    };

    fetchStats();

    return () => {
      isMounted = false;
    };
  }, [selectedLeague, category, selectedSeason]);

  const currentLeague = leagues.find((l) => l.code === selectedLeague);

  // Top 3 Podium
  const top1 = stats[0];
  const top2 = stats[1];
  const top3 = stats[2];

  const getCategoryTitle = () => {
    switch (category) {
      case "SCORERS":
        return "Bảng Xếp Hạng Vua Phá Lưới (Top Scorers)";
      case "ASSISTS":
        return "Bảng Xếp Hạng Vua Kiến Tạo (Top Assists)";
      case "CLEAN_SHEETS":
        return "Thủ Môn Giữ Sạch Lưới Xuất Sắc (Clean Sheets)";
      case "DISCIPLINE":
        return "Thống Kê Thẻ Phạt & Kỷ Luật (Discipline Hub)";
    }
  };

  const getMainStatValue = (item: PlayerSeasonStatItem) => {
    switch (category) {
      case "SCORERS":
        return item.goals;
      case "ASSISTS":
        return item.assists;
      case "CLEAN_SHEETS":
        return item.cleanSheets;
      case "DISCIPLINE":
        return item.yellowCards + item.redCards * 3;
    }
  };

  const getMainStatLabel = () => {
    switch (category) {
      case "SCORERS":
        return "Bàn thắng";
      case "ASSISTS":
        return "Kiến tạo";
      case "CLEAN_SHEETS":
        return "Trận sạch lưới";
      case "DISCIPLINE":
        return "Điểm phạt";
    }
  };

  // Chỉ lấy 8 giải đấu chính thức (5 giải VĐQG + 3 Cúp Châu Âu giống Bảng Xếp Hạng)
  const statsLeagues = leagues.filter(
    (l) => l.type === "LEAGUE" || ["CL", "EL", "ECL"].includes(l.code)
  );

  return (
    <div className="w-full space-y-4">
      {/* 1. League Filter (100% Identical in Size & Style to Standings Tab) */}
      <div className="w-full overflow-x-auto sm:overflow-visible scrollbar-none py-1">
        <div className="flex sm:flex-wrap items-center justify-start sm:justify-center gap-1.5 sm:gap-2.5 min-w-max sm:min-w-0 px-1 sm:px-0">
          {statsLeagues.map((l) => {
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
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = "none";
                    }}
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

      {/* 2. Category Switcher Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <button
          type="button"
          onClick={() => handleSelectCategory("SCORERS")}
          className={cn(
            "flex items-center justify-center gap-2 p-3 rounded-2xl border font-bold text-xs sm:text-sm transition-all cursor-pointer shadow-xs active:scale-95",
            category === "SCORERS"
              ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white border-emerald-400 shadow-md shadow-emerald-500/20 font-black"
              : "bg-card/80 border-border/80 text-muted-foreground hover:text-foreground hover:bg-card"
          )}
        >
          <span className="text-base">👟</span>
          <span>Vua Phá Lưới</span>
        </button>

        <button
          type="button"
          onClick={() => handleSelectCategory("ASSISTS")}
          className={cn(
            "flex items-center justify-center gap-2 p-3 rounded-2xl border font-bold text-xs sm:text-sm transition-all cursor-pointer shadow-xs active:scale-95",
            category === "ASSISTS"
              ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-blue-400 shadow-md shadow-blue-500/20 font-black"
              : "bg-card/80 border-border/80 text-muted-foreground hover:text-foreground hover:bg-card"
          )}
        >
          <span className="text-base">🎯</span>
          <span>Vua Kiến Tạo</span>
        </button>

        <button
          type="button"
          onClick={() => handleSelectCategory("CLEAN_SHEETS")}
          className={cn(
            "flex items-center justify-center gap-2 p-3 rounded-2xl border font-bold text-xs sm:text-sm transition-all cursor-pointer shadow-xs active:scale-95",
            category === "CLEAN_SHEETS"
              ? "bg-gradient-to-r from-amber-500 to-orange-600 text-white border-amber-400 shadow-md shadow-amber-500/20 font-black"
              : "bg-card/80 border-border/80 text-muted-foreground hover:text-foreground hover:bg-card"
          )}
        >
          <span className="text-base">🧤</span>
          <span>Găng Tay Vàng</span>
        </button>

        <button
          type="button"
          onClick={() => handleSelectCategory("DISCIPLINE")}
          className={cn(
            "flex items-center justify-center gap-2 p-3 rounded-2xl border font-bold text-xs sm:text-sm transition-all cursor-pointer shadow-xs active:scale-95",
            category === "DISCIPLINE"
              ? "bg-gradient-to-r from-rose-500 to-red-600 text-white border-rose-400 shadow-md shadow-rose-500/20 font-black"
              : "bg-card/80 border-border/80 text-muted-foreground hover:text-foreground hover:bg-card"
          )}
        >
          <span className="text-base">🟨</span>
          <span>Kỷ Luật / Phạt</span>
        </button>
      </div>

      {/* 3. Main Stats Hub Card */}
      <div className="bg-card/85 backdrop-blur-xl border border-border/80 rounded-2xl sm:rounded-3xl p-3.5 sm:p-6 shadow-xl space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-border/60">
          <div>
            <h2 className="text-base sm:text-xl font-black text-foreground">
              {getCategoryTitle()}
            </h2>
            <p className="text-xs text-muted-foreground font-medium">
              {currentLeague?.name} • Mùa giải {selectedSeason}
            </p>
          </div>

          <div className="flex items-center gap-2 self-stretch sm:self-auto justify-between sm:justify-end">
            {/* Season Selector Dropdown */}
            <SeasonSelector
              selectedSeason={selectedSeason}
              onSelectSeason={handleSelectSeason}
            />

            <div className="text-xs font-bold text-emerald-500 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20 whitespace-nowrap">
              {stats.length} Cầu thủ
            </div>
          </div>
        </div>

        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-3 text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
            <p className="text-xs font-bold">Đang tải số liệu thống kê...</p>
          </div>
        ) : stats.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground text-sm font-medium">
            Chưa có số liệu thống kê cho hạng mục này.
          </div>
        ) : (
          <>
            {/* Top 3 Podium (Vinh danh Top 3) */}
            {top1 && (
              <div className="grid grid-cols-3 gap-2 sm:gap-4 pt-4 pb-2 items-end">
                {/* Top 2 (Silver) */}
                {top2 ? (
                  <div
                    onClick={() => onSelectPlayer?.(top2.playerId)}
                    className="flex flex-col items-center p-3 sm:p-4 rounded-2xl bg-secondary/50 border border-border/70 text-center relative group hover:border-slate-400 transition-colors cursor-pointer"
                    title={`Xem hồ sơ ${top2.player.name}`}
                  >
                    <div className="w-6 h-6 rounded-full bg-slate-300 text-slate-800 text-xs font-black flex items-center justify-center mb-2 shadow-xs">
                      2
                    </div>
                    <div className="relative w-12 h-12 sm:w-16 sm:h-16 rounded-full overflow-hidden border-2 border-slate-300 shadow-md bg-white mb-2 group-hover:scale-105 transition-transform">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={top2.player.avatar || "/placeholder.png"}
                        alt={top2.player.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = "none";
                        }}
                      />
                    </div>
                    <h3 className="font-extrabold text-xs sm:text-sm text-foreground group-hover:text-emerald-500 transition-colors truncate max-w-full">
                      {top2.player.shortName || top2.player.name}
                    </h3>
                    <div
                      onClick={(e) => {
                        if (onSelectTeam) {
                          e.stopPropagation();
                          onSelectTeam(top2.player.teamId);
                        }
                      }}
                      className="flex items-center gap-1 mt-1 text-[10px] text-muted-foreground hover:text-emerald-500 transition-colors cursor-pointer"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={top2.player.team.logo}
                        alt={top2.player.team.name}
                        className="w-3.5 h-3.5 object-contain"
                      />
                      <span className="truncate">{top2.player.team.shortName}</span>
                    </div>
                    <div className="mt-2 font-mono font-black text-base sm:text-xl text-foreground">
                      {getMainStatValue(top2)}
                    </div>
                  </div>
                ) : (
                  <div />
                )}

                {/* Top 1 (Gold) */}
                <div
                  onClick={() => onSelectPlayer?.(top1.playerId)}
                  className="flex flex-col items-center p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-gradient-to-b from-amber-500/15 via-amber-500/5 to-card border-2 border-amber-400/70 text-center relative shadow-lg shadow-amber-500/10 -translate-y-2 group cursor-pointer"
                  title={`Xem hồ sơ ${top1.player.name}`}
                >
                  <div className="w-7 h-7 rounded-full bg-amber-400 text-amber-950 text-xs font-black flex items-center justify-center mb-2 shadow-md animate-bounce">
                    👑 1
                  </div>
                  <div className="relative w-14 h-14 sm:w-20 sm:h-20 rounded-full overflow-hidden border-3 border-amber-400 shadow-xl bg-white mb-2 group-hover:scale-105 transition-transform">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={top1.player.avatar || "/placeholder.png"}
                      alt={top1.player.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = "none";
                      }}
                    />
                  </div>
                  <h3 className="font-black text-xs sm:text-base text-foreground group-hover:text-amber-500 transition-colors truncate max-w-full">
                    {top1.player.name}
                  </h3>
                  <div
                    onClick={(e) => {
                      if (onSelectTeam) {
                        e.stopPropagation();
                        onSelectTeam(top1.player.teamId);
                      }
                    }}
                    className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground font-semibold hover:text-emerald-500 transition-colors cursor-pointer"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={top1.player.team.logo}
                      alt={top1.player.team.name}
                      className="w-4 h-4 object-contain"
                    />
                    <span className="truncate">{top1.player.team.name}</span>
                  </div>
                  <div className="mt-2 font-mono font-black text-xl sm:text-3xl text-amber-500">
                    {getMainStatValue(top1)}
                  </div>
                  <span className="text-[10px] text-muted-foreground font-bold">
                    {getMainStatLabel()}
                  </span>
                </div>

                {/* Top 3 (Bronze) */}
                {top3 ? (
                  <div
                    onClick={() => onSelectPlayer?.(top3.playerId)}
                    className="flex flex-col items-center p-3 sm:p-4 rounded-2xl bg-secondary/50 border border-border/70 text-center relative group hover:border-amber-700/50 transition-colors cursor-pointer"
                    title={`Xem hồ sơ ${top3.player.name}`}
                  >
                    <div className="w-6 h-6 rounded-full bg-amber-700 text-amber-100 text-xs font-black flex items-center justify-center mb-2 shadow-xs">
                      3
                    </div>
                    <div className="relative w-12 h-12 sm:w-16 sm:h-16 rounded-full overflow-hidden border-2 border-amber-700/60 shadow-md bg-white mb-2 group-hover:scale-105 transition-transform">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={top3.player.avatar || "/placeholder.png"}
                        alt={top3.player.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = "none";
                        }}
                      />
                    </div>
                    <h3 className="font-extrabold text-xs sm:text-sm text-foreground group-hover:text-emerald-500 transition-colors truncate max-w-full">
                      {top3.player.shortName || top3.player.name}
                    </h3>
                    <div
                      onClick={(e) => {
                        if (onSelectTeam) {
                          e.stopPropagation();
                          onSelectTeam(top3.player.teamId);
                        }
                      }}
                      className="flex items-center gap-1 mt-1 text-[10px] text-muted-foreground hover:text-emerald-500 transition-colors cursor-pointer"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={top3.player.team.logo}
                        alt={top3.player.team.name}
                        className="w-3.5 h-3.5 object-contain"
                      />
                      <span className="truncate">{top3.player.team.shortName}</span>
                    </div>
                    <div className="mt-2 font-mono font-black text-base sm:text-xl text-foreground">
                      {getMainStatValue(top3)}
                    </div>
                  </div>
                ) : (
                  <div />
                )}
              </div>
            )}

            {/* 4. Detailed Ranking Table */}
            <div className="w-full overflow-x-auto pt-2">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="text-muted-foreground font-black text-[10px] sm:text-xs uppercase border-b border-border/50 pb-2">
                    <th className="py-2.5 px-2 w-10 text-center">#</th>
                    <th className="py-2.5 px-2">Cầu thủ</th>
                    <th className="py-2.5 px-2">Câu Lạc Bộ</th>
                    <th className="py-2.5 px-2 text-center w-14 sm:w-20">Trận</th>
                    <th className="py-2.5 px-2 text-center w-16 sm:w-24 font-black text-foreground">
                      {category === "SCORERS"
                        ? "Bàn thắng"
                        : category === "ASSISTS"
                        ? "Kiến tạo"
                        : category === "CLEAN_SHEETS"
                        ? "Sạch lưới"
                        : "Thẻ vàng/đỏ"}
                    </th>
                    {category === "SCORERS" && (
                      <>
                        <th className="py-2.5 px-2 text-center w-14 sm:w-20 hidden sm:table-cell">Penalty</th>
                        <th className="py-2.5 px-2 text-center w-20 sm:w-28 hidden sm:table-cell">Phút/Bàn</th>
                      </>
                    )}
                    {category === "ASSISTS" && (
                      <th className="py-2.5 px-2 text-center w-20 sm:w-28 hidden sm:table-cell">Tạo cơ hội</th>
                    )}
                    {category === "CLEAN_SHEETS" && (
                      <th className="py-2.5 px-2 text-center w-20 sm:w-28 hidden sm:table-cell">Cứu thua</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30 font-medium">
                  {stats.map((item, index) => {
                    const minsPerGoal =
                      item.goals > 0 ? Math.round(item.minutesPlayed / item.goals) : 0;

                    return (
                      <tr
                        key={item.id}
                        onClick={() => onSelectPlayer?.(item.playerId)}
                        className="hover:bg-secondary/60 transition-colors group cursor-pointer"
                        title={`Xem hồ sơ ${item.player.name}`}
                      >
                        {/* Rank */}
                        <td className="py-2.5 px-2 text-center">
                          <span
                            className={cn(
                              "inline-flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded-full font-black text-[10px] sm:text-xs",
                              index === 0
                                ? "bg-amber-400 text-amber-950 font-extrabold"
                                : index === 1
                                ? "bg-slate-300 text-slate-900 font-bold"
                                : index === 2
                                ? "bg-amber-700 text-amber-100 font-bold"
                                : "bg-secondary text-muted-foreground"
                            )}
                          >
                            {index + 1}
                          </span>
                        </td>

                        {/* Player */}
                        <td className="py-2.5 px-2">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full overflow-hidden bg-white border border-border/80 flex-shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={item.player.avatar || "/placeholder.png"}
                                alt={item.player.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLElement).style.display = "none";
                                }}
                              />
                            </div>
                            <div className="truncate">
                              <p className="font-bold text-foreground group-hover:text-emerald-500 transition-colors truncate">
                                {item.player.name}
                              </p>
                              <p className="text-[10px] text-muted-foreground">
                                #{item.player.number || "-"} • {item.player.position}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Team */}
                        <td
                          className="py-2.5 px-2"
                          onClick={(e) => {
                            if (onSelectTeam) {
                              e.stopPropagation();
                              onSelectTeam(item.player.teamId);
                            }
                          }}
                        >
                          <div className="flex items-center gap-1.5 truncate hover:text-emerald-500 transition-colors">
                            <div className="w-5 h-5 rounded-md bg-white p-0.5 flex items-center justify-center flex-shrink-0 shadow-2xs border border-black/10">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={item.player.team.logo}
                                alt={item.player.team.name}
                                className="w-full h-full object-contain"
                              />
                            </div>
                            <span className="text-muted-foreground font-semibold truncate group-hover:text-foreground">
                              {item.player.team.name}
                            </span>
                          </div>
                        </td>

                        {/* Appearances */}
                        <td className="py-2.5 px-2 text-center text-muted-foreground font-semibold">
                          {item.appearances}
                        </td>

                        {/* Main Stat */}
                        <td className="py-2.5 px-2 text-center font-mono font-black text-sm sm:text-base text-foreground">
                          {category === "DISCIPLINE" ? (
                            <div className="flex items-center justify-center gap-1.5">
                              <span className="text-amber-500 font-bold">{item.yellowCards}🟨</span>
                              {item.redCards > 0 && (
                                <span className="text-rose-500 font-bold">{item.redCards}🟥</span>
                              )}
                            </div>
                          ) : (
                            <span className="text-emerald-500">
                              {getMainStatValue(item)}
                            </span>
                          )}
                        </td>

                        {/* Sub Stats */}
                        {category === "SCORERS" && (
                          <>
                            <td className="py-2.5 px-2 text-center text-muted-foreground font-semibold hidden sm:table-cell">
                              {item.penalties}
                            </td>
                            <td className="py-2.5 px-2 text-center text-muted-foreground font-mono hidden sm:table-cell">
                              {minsPerGoal > 0 ? `${minsPerGoal}'` : "-"}
                            </td>
                          </>
                        )}
                        {category === "ASSISTS" && (
                          <td className="py-2.5 px-2 text-center text-muted-foreground font-semibold hidden sm:table-cell">
                            {item.chancesCreated}
                          </td>
                        )}
                        {category === "CLEAN_SHEETS" && (
                          <td className="py-2.5 px-2 text-center text-muted-foreground font-semibold hidden sm:table-cell">
                            {item.saves}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
