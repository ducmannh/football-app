"use client";

import React, { useState, useEffect } from "react";
import { PlayerSeasonStatItem, TeamDisciplineItem, League } from "@/types/football";
import {
  getTopScorers,
  getTopAssists,
  getTopCleanSheets,
  getTeamDisciplineStats,
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
  const [teamDisciplineStats, setTeamDisciplineStats] = useState<TeamDisciplineItem[]>([]);
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
      if (category === "DISCIPLINE") {
        const teamData = await getTeamDisciplineStats(selectedLeague, selectedSeason);
        if (isMounted) {
          setTeamDisciplineStats(teamData);
          setStats([]);
          setLoading(false);
        }
      } else {
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
        }
        if (isMounted) {
          setStats(data);
          setTeamDisciplineStats([]);
          setLoading(false);
        }
      }
    };

    fetchStats();

    return () => {
      isMounted = false;
    };
  }, [selectedLeague, category, selectedSeason]);

  const currentLeague = leagues.find((l) => l.code === selectedLeague);

  // Top 3 Podium
  const isDiscipline = category === "DISCIPLINE";
  const top1Player = stats[0];
  const top2Player = stats[1];
  const top3Player = stats[2];

  const top1Team = teamDisciplineStats[0];
  const top2Team = teamDisciplineStats[1];
  const top3Team = teamDisciplineStats[2];

  const getCategoryTitle = () => {
    switch (category) {
      case "SCORERS":
        return "Bảng Xếp Hạng Vua Phá Lưới (Top Scorers)";
      case "ASSISTS":
        return "Bảng Xếp Hạng Vua Kiến Tạo (Top Assists)";
      case "CLEAN_SHEETS":
        return "Thủ Môn Giữ Sạch Lưới Xuất Sắc (Clean Sheets)";
      case "DISCIPLINE":
        return "Thống Kê Thẻ Phạt & Kỷ Luật CLB (Discipline Hub)";
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
      default:
        return 0;
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
              {isDiscipline ? `${teamDisciplineStats.length} Câu lạc bộ` : `${stats.length} Cầu thủ`}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-3 text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
            <p className="text-xs font-bold">Đang tải số liệu thống kê...</p>
          </div>
        ) : (isDiscipline ? teamDisciplineStats.length === 0 : stats.length === 0) ? (
          <div className="py-12 text-center text-muted-foreground text-sm font-medium">
            Chưa có số liệu thống kê cho hạng mục này.
          </div>
        ) : (
          <>
            {/* Top 3 Podium */}
            {isDiscipline ? (
              top1Team && (
                <div className="grid grid-cols-3 gap-2 sm:gap-4 pt-4 pb-2 items-end">
                  {/* Top 2 Team (Silver) */}
                  {top2Team ? (
                    <div
                      onClick={() => onSelectTeam?.(top2Team.teamId)}
                      className="flex flex-col items-center p-3 sm:p-4 rounded-2xl bg-secondary/50 border border-border/70 text-center relative group hover:border-slate-400 transition-colors cursor-pointer"
                      title={`Xem CLB ${top2Team.team.name}`}
                    >
                      <div className="w-6 h-6 rounded-full bg-slate-300 text-slate-800 text-xs font-black flex items-center justify-center mb-2 shadow-xs">
                        2
                      </div>
                      <div className="relative w-12 h-12 sm:w-16 sm:h-16 rounded-2xl p-2 bg-white border border-slate-300 shadow-md mb-2 flex items-center justify-center group-hover:scale-105 transition-transform">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={top2Team.team.logo}
                          alt={top2Team.team.name}
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <h3 className="font-extrabold text-xs sm:text-sm text-foreground group-hover:text-emerald-500 transition-colors truncate max-w-full">
                        {top2Team.team.name}
                      </h3>
                      <div className="mt-2 font-mono font-black text-base sm:text-xl text-foreground">
                        {top2Team.points} <span className="text-xs font-normal text-muted-foreground">pts</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground mt-0.5">
                        <span className="text-amber-500">{top2Team.yellowCards}🟨</span>
                        {top2Team.redCards > 0 && <span className="text-rose-500">{top2Team.redCards}🟥</span>}
                      </div>
                    </div>
                  ) : <div />}

                  {/* Top 1 Team (Gold) */}
                  <div
                    onClick={() => onSelectTeam?.(top1Team.teamId)}
                    className="flex flex-col items-center p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-gradient-to-b from-amber-500/15 via-amber-500/5 to-card border-2 border-amber-400/70 text-center relative shadow-lg shadow-amber-500/10 -translate-y-2 group cursor-pointer"
                    title={`Xem CLB ${top1Team.team.name}`}
                  >
                    <div className="w-7 h-7 rounded-full bg-amber-400 text-amber-950 text-xs font-black flex items-center justify-center mb-2 shadow-md animate-bounce">
                      👑 1
                    </div>
                    <div className="relative w-14 h-14 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl p-2.5 bg-white border-3 border-amber-400 shadow-xl mb-2 flex items-center justify-center group-hover:scale-105 transition-transform">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={top1Team.team.logo}
                        alt={top1Team.team.name}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <h3 className="font-black text-xs sm:text-base text-foreground group-hover:text-amber-500 transition-colors truncate max-w-full">
                      {top1Team.team.name}
                    </h3>
                    <div className="mt-2 font-mono font-black text-xl sm:text-3xl text-amber-500">
                      {top1Team.points} <span className="text-xs font-bold text-muted-foreground">điểm</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground mt-0.5">
                      <span className="text-amber-500">{top1Team.yellowCards}🟨</span>
                      {top1Team.redCards > 0 && <span className="text-rose-500">{top1Team.redCards}🟥</span>}
                      <span>• {top1Team.cardedPlayers.length} cầu thủ</span>
                    </div>
                  </div>

                  {/* Top 3 Team (Bronze) */}
                  {top3Team ? (
                    <div
                      onClick={() => onSelectTeam?.(top3Team.teamId)}
                      className="flex flex-col items-center p-3 sm:p-4 rounded-2xl bg-secondary/50 border border-border/70 text-center relative group hover:border-amber-700/50 transition-colors cursor-pointer"
                      title={`Xem CLB ${top3Team.team.name}`}
                    >
                      <div className="w-6 h-6 rounded-full bg-amber-700 text-amber-100 text-xs font-black flex items-center justify-center mb-2 shadow-xs">
                        3
                      </div>
                      <div className="relative w-12 h-12 sm:w-16 sm:h-16 rounded-2xl p-2 bg-white border-2 border-amber-700/60 shadow-md mb-2 flex items-center justify-center group-hover:scale-105 transition-transform">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={top3Team.team.logo}
                          alt={top3Team.team.name}
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <h3 className="font-extrabold text-xs sm:text-sm text-foreground group-hover:text-emerald-500 transition-colors truncate max-w-full">
                        {top3Team.team.name}
                      </h3>
                      <div className="mt-2 font-mono font-black text-base sm:text-xl text-foreground">
                        {top3Team.points} <span className="text-xs font-normal text-muted-foreground">pts</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground mt-0.5">
                        <span className="text-amber-500">{top3Team.yellowCards}🟨</span>
                        {top3Team.redCards > 0 && <span className="text-rose-500">{top3Team.redCards}🟥</span>}
                      </div>
                    </div>
                  ) : <div />}
                </div>
              )
            ) : (
              top1Player && (
                <div className="grid grid-cols-3 gap-2 sm:gap-4 pt-4 pb-2 items-end">
                  {/* Top 2 Player (Silver) */}
                  {top2Player ? (
                    <div
                      onClick={() => onSelectPlayer?.(top2Player.playerId)}
                      className="flex flex-col items-center p-3 sm:p-4 rounded-2xl bg-secondary/50 border border-border/70 text-center relative group hover:border-slate-400 transition-colors cursor-pointer"
                      title={`Xem hồ sơ ${top2Player.player.name}`}
                    >
                      <div className="w-6 h-6 rounded-full bg-slate-300 text-slate-800 text-xs font-black flex items-center justify-center mb-2 shadow-xs">
                        2
                      </div>
                      <div className="relative w-12 h-12 sm:w-16 sm:h-16 rounded-full overflow-hidden border-2 border-slate-300 shadow-md bg-gradient-to-br from-slate-800 to-slate-950 mb-2 group-hover:scale-105 transition-transform flex items-center justify-center">
                        <span className="text-xs sm:text-sm font-black text-slate-300 font-mono select-none pointer-events-none">
                          #{top2Player.player.number || top2Player.player.name.slice(0, 2).toUpperCase()}
                        </span>
                        {top2Player.player.avatar && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={top2Player.player.avatar}
                            alt={top2Player.player.name}
                            className="absolute inset-0 w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = "none";
                            }}
                          />
                        )}
                      </div>
                      <h3 className="font-extrabold text-xs sm:text-sm text-foreground group-hover:text-emerald-500 transition-colors truncate max-w-full">
                        {top2Player.player.shortName || top2Player.player.name}
                      </h3>
                      <div
                        onClick={(e) => {
                          if (onSelectTeam) {
                            e.stopPropagation();
                            onSelectTeam(top2Player.player.teamId);
                          }
                        }}
                        className="flex items-center gap-1 mt-1 text-[10px] text-muted-foreground hover:text-emerald-500 transition-colors cursor-pointer"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={top2Player.player.team.logo}
                          alt={top2Player.player.team.name}
                          className="w-3.5 h-3.5 object-contain"
                        />
                        <span className="truncate">{top2Player.player.team.shortName}</span>
                      </div>
                      <div className="mt-2 font-mono font-black text-base sm:text-xl text-foreground">
                        {getMainStatValue(top2Player)}
                      </div>
                    </div>
                  ) : <div />}

                  {/* Top 1 Player (Gold) */}
                  <div
                    onClick={() => onSelectPlayer?.(top1Player.playerId)}
                    className="flex flex-col items-center p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-gradient-to-b from-amber-500/15 via-amber-500/5 to-card border-2 border-amber-400/70 text-center relative shadow-lg shadow-amber-500/10 -translate-y-2 group cursor-pointer"
                    title={`Xem hồ sơ ${top1Player.player.name}`}
                  >
                    <div className="w-7 h-7 rounded-full bg-amber-400 text-amber-950 text-xs font-black flex items-center justify-center mb-2 shadow-md animate-bounce">
                      👑 1
                    </div>
                    <div className="relative w-14 h-14 sm:w-20 sm:h-20 rounded-full overflow-hidden border-3 border-amber-400 shadow-xl bg-gradient-to-br from-amber-950 to-slate-950 mb-2 group-hover:scale-105 transition-transform flex items-center justify-center">
                      <span className="text-sm sm:text-base font-black text-amber-400 font-mono select-none pointer-events-none">
                        #{top1Player.player.number || top1Player.player.name.slice(0, 2).toUpperCase()}
                      </span>
                      {top1Player.player.avatar && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={top1Player.player.avatar}
                          alt={top1Player.player.name}
                          className="absolute inset-0 w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = "none";
                          }}
                        />
                      )}
                    </div>
                    <h3 className="font-black text-xs sm:text-base text-foreground group-hover:text-amber-500 transition-colors truncate max-w-full">
                      {top1Player.player.name}
                    </h3>
                    <div
                      onClick={(e) => {
                        if (onSelectTeam) {
                          e.stopPropagation();
                          onSelectTeam(top1Player.player.teamId);
                        }
                      }}
                      className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground font-semibold hover:text-emerald-500 transition-colors cursor-pointer"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={top1Player.player.team.logo}
                        alt={top1Player.player.team.name}
                        className="w-4 h-4 object-contain"
                      />
                      <span className="truncate">{top1Player.player.team.name}</span>
                    </div>
                    <div className="mt-2 font-mono font-black text-xl sm:text-3xl text-amber-500">
                      {getMainStatValue(top1Player)}
                    </div>
                    <span className="text-[10px] text-muted-foreground font-bold">
                      {getMainStatLabel()}
                    </span>
                  </div>

                  {/* Top 3 Player (Bronze) */}
                  {top3Player ? (
                    <div
                      onClick={() => onSelectPlayer?.(top3Player.playerId)}
                      className="flex flex-col items-center p-3 sm:p-4 rounded-2xl bg-secondary/50 border border-border/70 text-center relative group hover:border-amber-700/50 transition-colors cursor-pointer"
                      title={`Xem hồ sơ ${top3Player.player.name}`}
                    >
                      <div className="w-6 h-6 rounded-full bg-amber-700 text-amber-100 text-xs font-black flex items-center justify-center mb-2 shadow-xs">
                        3
                      </div>
                      <div className="relative w-12 h-12 sm:w-16 sm:h-16 rounded-full overflow-hidden border-2 border-amber-700/60 shadow-md bg-gradient-to-br from-amber-950 to-slate-950 mb-2 group-hover:scale-105 transition-transform flex items-center justify-center">
                        <span className="text-xs sm:text-sm font-black text-amber-500 font-mono select-none pointer-events-none">
                          #{top3Player.player.number || top3Player.player.name.slice(0, 2).toUpperCase()}
                        </span>
                        {top3Player.player.avatar && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={top3Player.player.avatar}
                            alt={top3Player.player.name}
                            className="absolute inset-0 w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = "none";
                            }}
                          />
                        )}
                      </div>
                      <h3 className="font-extrabold text-xs sm:text-sm text-foreground group-hover:text-emerald-500 transition-colors truncate max-w-full">
                        {top3Player.player.shortName || top3Player.player.name}
                      </h3>
                      <div
                        onClick={(e) => {
                          if (onSelectTeam) {
                            e.stopPropagation();
                            onSelectTeam(top3Player.player.teamId);
                          }
                        }}
                        className="flex items-center gap-1 mt-1 text-[10px] text-muted-foreground hover:text-emerald-500 transition-colors cursor-pointer"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={top3Player.player.team.logo}
                          alt={top3Player.player.team.name}
                          className="w-3.5 h-3.5 object-contain"
                        />
                        <span className="truncate">{top3Player.player.team.shortName}</span>
                      </div>
                      <div className="mt-2 font-mono font-black text-base sm:text-xl text-foreground">
                        {getMainStatValue(top3Player)}
                      </div>
                    </div>
                  ) : <div />}
                </div>
              )
            )}

            {/* 4. Detailed Ranking Table */}
            <div className="w-full overflow-x-auto pt-2">
              {isDiscipline ? (
                /* Team Discipline Table */
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead>
                    <tr className="text-muted-foreground font-black text-[10px] sm:text-xs uppercase border-b border-border/50 pb-2">
                      <th className="py-2.5 px-2 w-10 text-center">#</th>
                      <th className="py-2.5 px-2 min-w-[140px] sm:min-w-[180px]">Câu Lạc Bộ</th>
                      <th className="py-2.5 px-2 text-center w-12 sm:w-16">Trận</th>
                      <th className="py-2.5 px-2 text-center w-14 sm:w-16">Thẻ vàng</th>
                      <th className="py-2.5 px-2 text-center w-14 sm:w-16">Thẻ đỏ</th>
                      <th className="py-2.5 px-2 text-center w-16 sm:w-20 font-black text-foreground">Điểm</th>
                      <th className="py-2.5 px-2 min-w-[200px]">Cầu thủ nhận thẻ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30 font-medium">
                    {(() => {
                      let currentRank = 1;
                      return teamDisciplineStats.map((item, index) => {
                        if (index > 0) {
                          const prevVal = teamDisciplineStats[index - 1].points;
                          const currVal = item.points;
                          if (currVal < prevVal) {
                            currentRank = index + 1;
                          }
                        }
                        const rank = currentRank;

                        return (
                          <tr
                            key={item.id}
                            onClick={() => onSelectTeam?.(item.teamId)}
                            className="hover:bg-secondary/60 transition-colors group cursor-pointer"
                            title={`Xem chi tiết CLB ${item.team.name}`}
                          >
                            {/* Rank */}
                            <td className="py-2.5 px-2 text-center">
                              <span
                                className={cn(
                                  "inline-flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded-full font-black text-[10px] sm:text-xs",
                                  rank === 1
                                    ? "bg-amber-400 text-amber-950 font-extrabold"
                                    : rank === 2
                                    ? "bg-slate-300 text-slate-900 font-bold"
                                    : rank === 3
                                    ? "bg-amber-700 text-amber-100 font-bold"
                                    : "bg-secondary text-muted-foreground"
                                )}
                              >
                                {rank}
                              </span>
                            </td>

                            {/* Club */}
                            <td className="py-2.5 px-2">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-white p-0.5 flex items-center justify-center flex-shrink-0 shadow-2xs border border-black/10">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={item.team.logo}
                                    alt={item.team.name}
                                    className="w-full h-full object-contain"
                                  />
                                </div>
                                <span className="font-bold text-foreground group-hover:text-emerald-500 transition-colors truncate">
                                  {item.team.name}
                                </span>
                              </div>
                            </td>

                            {/* Appearances */}
                            <td className="py-2.5 px-2 text-center text-muted-foreground font-semibold">
                              {item.appearances}
                            </td>

                            {/* Yellow Cards */}
                            <td className="py-2.5 px-2 text-center font-bold text-amber-500">
                              {item.yellowCards}🟨
                            </td>

                            {/* Red Cards */}
                            <td className="py-2.5 px-2 text-center font-bold text-rose-500">
                              {item.redCards > 0 ? `${item.redCards}🟥` : "0"}
                            </td>

                            {/* Discipline Points */}
                            <td className="py-2.5 px-2 text-center font-mono font-black text-sm sm:text-base text-foreground">
                              {item.points}
                            </td>

                            {/* Carded Players List */}
                            <td className="py-2 px-2" onClick={(e) => e.stopPropagation()}>
                              <div className="flex flex-wrap items-center gap-1.5 py-0.5">
                                {item.cardedPlayers.length > 0 ? (
                                  item.cardedPlayers.map((p) => (
                                    <button
                                      key={p.id}
                                      type="button"
                                      onClick={() => onSelectPlayer?.(p.id)}
                                      className="inline-flex items-center gap-1 bg-secondary/80 hover:bg-secondary hover:border-emerald-500/50 border border-border/70 px-2 py-0.5 rounded-lg text-[11px] font-semibold text-foreground hover:text-emerald-500 transition-all cursor-pointer shadow-2xs"
                                      title={`Xem hồ sơ ${p.name}`}
                                    >
                                      <span className="truncate max-w-[110px] sm:max-w-[140px]">{p.shortName || p.name}</span>
                                      {p.yellowCards > 0 && (
                                        <span className="text-amber-500 font-bold">{p.yellowCards}🟨</span>
                                      )}
                                      {p.redCards > 0 && (
                                        <span className="text-rose-500 font-bold">{p.redCards}🟥</span>
                                      )}
                                    </button>
                                  ))
                                ) : (
                                  <span className="text-muted-foreground text-xs italic">Không có thẻ</span>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      });
                    })()}
                  </tbody>
                </table>
              ) : (
                /* Player Statistics Table (Scorers, Assists, Clean Sheets) */
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
                          : "Sạch lưới"}
                      </th>
                      {category === "SCORERS" && (
                        <th className="py-2.5 px-2 text-center w-16 sm:w-20 hidden sm:table-cell">Penalty</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30 font-medium">
                    {(() => {
                      let currentRank = 1;
                      return stats.map((item, index) => {
                        if (index > 0) {
                          const prevVal = getMainStatValue(stats[index - 1]);
                          const currVal = getMainStatValue(item);
                          if (currVal < prevVal) {
                            currentRank = index + 1;
                          }
                        }
                        const rank = currentRank;

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
                                  rank === 1
                                    ? "bg-amber-400 text-amber-950 font-extrabold"
                                    : rank === 2
                                    ? "bg-slate-300 text-slate-900 font-bold"
                                    : rank === 3
                                    ? "bg-amber-700 text-amber-100 font-bold"
                                    : "bg-secondary text-muted-foreground"
                                )}
                              >
                                {rank}
                              </span>
                            </td>

                            {/* Player */}
                            <td className="py-2.5 px-2">
                              <div className="flex items-center gap-2">
                                <div className="relative w-7 h-7 sm:w-8 sm:h-8 rounded-full overflow-hidden bg-gradient-to-br from-emerald-950 to-secondary border border-border/80 flex-shrink-0 shadow-2xs group-hover:scale-105 transition-transform flex items-center justify-center">
                                  <span className="text-[10px] font-black text-emerald-400 font-mono select-none pointer-events-none">
                                    #{item.player.number || item.player.name.slice(0, 2).toUpperCase()}
                                  </span>
                                  {item.player.avatar && (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                      src={item.player.avatar}
                                      alt={item.player.name}
                                      className="absolute inset-0 w-full h-full object-cover"
                                      onError={(e) => {
                                        (e.target as HTMLElement).style.display = "none";
                                      }}
                                    />
                                  )}
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
                              <span className="text-emerald-500">
                                {getMainStatValue(item)}
                              </span>
                            </td>

                            {/* Sub Stats - Only Penalty for SCORERS */}
                            {category === "SCORERS" && (
                              <td className="py-2.5 px-2 text-center text-muted-foreground font-semibold hidden sm:table-cell">
                                {item.penalties || 0}
                              </td>
                            )}
                          </tr>
                        );
                      });
                    })()}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

