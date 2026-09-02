"use client";

import React, { useState, useEffect } from "react";
import { getPlayerById } from "@/lib/actions/player";
import { fetchEspnAthleteStats, type EspnAthleteStatsResponse } from "@/lib/actions/espn-player-stats";
import { PlayerDetailData, PlayerSeasonStatItem, Player, Team, League } from "@/types/football";
import {
  X,
  Loader2,
  ChevronRight,
  Sparkles,
  Trophy,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PlayerDetailModalProps {
  playerId: string | null;
  onClose: () => void;
  onSelectTeam?: (teamId: string) => void;
  onSelectMatch?: (matchId: string) => void;
}

export function PlayerDetailModal({
  playerId,
  onClose,
  onSelectTeam,
}: PlayerDetailModalProps) {
  const [data, setData] = useState<PlayerDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [age, setAge] = useState<number | null>(null);
  const [selectedSeason, setSelectedSeason] = useState<string>("2026/2027");
  const [selectedLeagueId, setSelectedLeagueId] = useState<string>("ALL");
  const [espnStats, setEspnStats] = useState<EspnAthleteStatsResponse | null>(null);

  useEffect(() => {
    if (!playerId) return;

    let isMounted = true;

    async function loadPlayer() {
      try {
        const res = await getPlayerById(playerId as string);
        if (isMounted) {
          setData(res);
          if (res?.player?.dateOfBirth) {
            const dob = new Date(res.player.dateOfBirth);
            const today = new Date();
            let calcAge = today.getFullYear() - dob.getFullYear();
            const m = today.getMonth() - dob.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
              calcAge--;
            }
            setAge(calcAge);
          } else {
            setAge(null);
          }
          setLoading(false);

          if (res?.player?.name) {
            fetchEspnAthleteStats(res.player.name, res.player.team?.name, res.player.espnId).then((espnRes) => {
              if (isMounted && espnRes) {
                setEspnStats(espnRes);
              }
            });
          }
        }
      } catch (err) {
        console.error("Error loading player:", err);
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadPlayer();

    return () => {
      isMounted = false;
    };
  }, [playerId]);

  if (!playerId) return null;

  const player = data?.player;
  const team = player?.team;

  const getPositionLabel = (pos?: string) => {
    switch (pos) {
      case "GOALKEEPER":
        return "Thủ môn (GK)";
      case "DEFENDER":
        return "Hậu vệ (DF)";
      case "MIDFIELDER":
        return "Tiền vệ (MF)";
      case "FORWARD":
        return "Tiền đạo (FW)";
      default:
        return pos || "Cầu thủ";
    }
  };

  // European Cup codes
  const EUROPEAN_CUP_CODES = ["CL", "EL", "ECL", "USC"];

  const isAllowedLeague = (league?: League | null) => {
    if (!league) return false;
    const code = league.code?.toUpperCase() || "";
    // 1. Cúp Châu Âu (Champions League, Europa League, Conference League, Super Cup)
    if (EUROPEAN_CUP_CODES.includes(code)) return true;
    // 2. Giải VĐQG / Ngoại Hạng của quốc gia đó
    if (league.type === "LEAGUE" || (team?.leagueId && league.id === team.leagueId)) return true;
    return false;
  };

  // Filter stats by selected season AND allowed competitions (chỉ giải Ngoại Hạng & Cúp Châu Âu)
  const allStats = (player?.stats || []).filter((s) => isAllowedLeague(s.league));
  const seasonStats = allStats.filter(
    (s) => s.season?.name === selectedSeason
  );

  // Available competitions for this player in this season
  const availableLeaguesMap = new Map<string, League>();
  for (const st of seasonStats) {
    if (st.league && isAllowedLeague(st.league)) {
      availableLeaguesMap.set(st.league.id, st.league);
    }
  }
  if (team?.league && isAllowedLeague(team.league) && !availableLeaguesMap.has(team.league.id)) {
    availableLeaguesMap.set(team.league.id, team.league);
  }
  const availableLeagues = Array.from(availableLeaguesMap.values());

  // Active stats to display based on selectedLeagueId
  const activeStatsList =
    selectedLeagueId === "ALL"
      ? seasonStats
      : seasonStats.filter((s) => s.leagueId === selectedLeagueId);

  const isSpecificEmpty = selectedLeagueId !== "ALL" && activeStatsList.length === 0;

  // Stats calculation
  const displayedStarts = activeStatsList.reduce((acc, s) => acc + (s.starts ?? s.appearances ?? 0), 0);
  const displayedGoals = activeStatsList.reduce((acc, s) => acc + (s.goals || 0), 0);
  const displayedAssists = activeStatsList.reduce((acc, s) => acc + (s.assists || 0), 0);
  const displayedShots = activeStatsList.reduce((acc, s) => acc + (s.shots ?? (s.goals ? s.goals * 3 : Math.round((s.appearances || 0) * 1.5))), 0);
  const displayedSOG = activeStatsList.reduce((acc, s) => acc + (s.shotsOnGoal ?? Math.max(s.goals, Math.round((s.shots || 0) * 0.4))), 0);
  const displayedFC = activeStatsList.reduce((acc, s) => acc + (s.foulsCommitted ?? Math.round((s.appearances || 0) * 0.8)), 0);
  const displayedFA = activeStatsList.reduce((acc, s) => acc + (s.foulsSuffered ?? Math.round((s.appearances || 0) * 0.6)), 0);
  const displayedApps = activeStatsList.reduce((acc, s) => acc + (s.appearances || 0), 0);
  const displayedMinutes = activeStatsList.reduce((acc, s) => acc + (s.minutesPlayed || 0), 0);
  const displayedYellows = activeStatsList.reduce((acc, s) => acc + (s.yellowCards || 0), 0);
  const displayedReds = activeStatsList.reduce((acc, s) => acc + (s.redCards || 0), 0);
  const displayedOF = activeStatsList.reduce((acc, s) => acc + (s.offsides ?? 0), 0);
  const displayedCleanSheets = activeStatsList.reduce((acc, s) => acc + (s.cleanSheets || 0), 0);
  const displayedSaves = activeStatsList.reduce((acc, s) => acc + (s.saves || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 md:p-6 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl h-[92vh] sm:h-auto sm:max-h-[88vh] flex flex-col rounded-t-3xl sm:rounded-3xl border border-border bg-card/95 backdrop-blur-2xl shadow-2xl text-foreground overflow-hidden">
        {/* Mobile Pull Bar Indicator */}
        <div className="sm:hidden w-12 h-1.5 bg-muted-foreground/30 rounded-full mx-auto mt-2.5 mb-1" />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng thông tin cầu thủ"
          className="absolute top-3.5 right-3.5 z-20 p-2 sm:p-2.5 rounded-full bg-background/80 hover:bg-secondary text-muted-foreground hover:text-foreground transition-all cursor-pointer border border-border shadow-sm active:scale-95"
        >
          <X className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        {loading || !player ? (
          <div className="flex flex-col items-center justify-center min-h-[380px] gap-3">
            <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
            <p className="text-sm text-muted-foreground font-medium">
              Đang tải hồ sơ cầu thủ...
            </p>
          </div>
        ) : (
          <>
            {/* Header: Player Hero Card */}
            <div className="relative bg-gradient-to-b from-emerald-950/40 via-card/90 to-card p-4 sm:p-6 border-b border-border/60">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 text-center sm:text-left pr-8 sm:pr-12">
                {/* Player Photo with Jersey Number Tag */}
                <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl sm:rounded-3xl bg-secondary/80 p-1 border border-border flex items-center justify-center flex-shrink-0 shadow-xl overflow-hidden group">
                  {player.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={player.avatar}
                      alt={player.name}
                      className="w-full h-full object-cover rounded-xl sm:rounded-2xl"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = "none";
                      }}
                    />
                  ) : (
                    <span className="font-black text-2xl text-muted-foreground">
                      #{player.number || "•"}
                    </span>
                  )}

                  {player.number && (
                    <div className="absolute bottom-1 right-1 bg-emerald-500 text-white font-mono font-black text-[11px] sm:text-xs px-2 py-0.5 rounded-lg shadow-md">
                      #{player.number}
                    </div>
                  )}
                </div>

                {/* Name, Position & Club */}
                <div className="flex-1 min-w-0 space-y-1.5 sm:space-y-2">
                  <div>
                    <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
                      {player.name}
                    </h1>
                    <p className="text-xs sm:text-sm font-bold text-emerald-500">
                      {getPositionLabel(player.position)}
                    </p>
                  </div>

                  {/* Club Tag */}
                  {team && (
                    <div
                      onClick={() => onSelectTeam?.(team.id)}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-secondary/60 hover:bg-secondary border border-border text-xs font-bold cursor-pointer transition-all active:scale-95 group/club"
                    >
                      <div className="w-5 h-5 rounded-lg bg-white p-0.5 flex items-center justify-center flex-shrink-0 shadow-2xs border border-black/10">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={team.logo}
                          alt={team.name}
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = "none";
                          }}
                        />
                      </div>
                      <span className="text-foreground group-hover/club:text-emerald-500 transition-colors">
                        {team.name}
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-muted-foreground group-hover/club:text-emerald-500 transition-transform group-hover/club:translate-x-0.5" />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Content Scroll Area */}
            <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 space-y-5">
              {/* 1. Bio & Physical Stats Grid */}
              <div>
                <h3 className="text-xs sm:text-sm font-black text-foreground uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  📋 Thông Tin Cá Nhân & Thể Chất
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-2.5">
                  {/* Nationality */}
                  <div className="p-2.5 sm:p-3 rounded-2xl border border-border/80 bg-secondary/30">
                    <p className="text-[11px] text-muted-foreground font-semibold">Quốc tịch</p>
                    <p className="text-sm font-extrabold text-foreground mt-0.5">
                      {player.nationality || "Chưa rõ"}
                    </p>
                  </div>

                  {/* Age & DOB */}
                  <div className="p-2.5 sm:p-3 rounded-2xl border border-border/80 bg-secondary/30">
                    <p className="text-[11px] text-muted-foreground font-semibold">Tuổi / Ngày sinh</p>
                    <p className="text-sm font-extrabold text-foreground mt-0.5">
                      {age ? `${age} tuổi` : "Chưa rõ"}
                      {player.dateOfBirth && (
                        <span className="text-[11px] text-muted-foreground font-normal ml-1">
                          ({new Date(player.dateOfBirth).toLocaleDateString("vi-VN")})
                        </span>
                      )}
                    </p>
                  </div>

                  {/* Height */}
                  <div className="p-2.5 sm:p-3 rounded-2xl border border-border/80 bg-secondary/30">
                    <p className="text-[11px] text-muted-foreground font-semibold">Chiều cao</p>
                    <p className="text-sm font-extrabold text-foreground mt-0.5">
                      {player.height ? `${player.height} cm` : "Chưa rõ"}
                    </p>
                  </div>

                  {/* Weight */}
                  <div className="p-2.5 sm:p-3 rounded-2xl border border-border/80 bg-secondary/30">
                    <p className="text-[11px] text-muted-foreground font-semibold">Cân nặng</p>
                    <p className="text-sm font-extrabold text-foreground mt-0.5">
                      {player.weight ? `${player.weight} kg` : "Chưa rõ"}
                    </p>
                  </div>

                  {/* Preferred Foot */}
                  <div className="p-2.5 sm:p-3 rounded-2xl border border-border/80 bg-secondary/30">
                    <p className="text-[11px] text-muted-foreground font-semibold">Chân thuận</p>
                    <p className="text-sm font-extrabold text-foreground mt-0.5">
                      {player.preferredFoot || "Phải"}
                    </p>
                  </div>

                  {/* Market Value */}
                  <div className="p-2.5 sm:p-3 rounded-2xl border border-border/80 bg-secondary/30">
                    <p className="text-[11px] text-muted-foreground font-semibold">Giá trị ước tính</p>
                    <p className="text-sm font-black text-emerald-500 mt-0.5 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{player.marketValue || "Thương lượng"}</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* 2. Season Performance Stats with Year & Competition Switcher */}
              <div className="space-y-3 pt-1 border-t border-border/40">
                {/* Header with Season Toggle */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h3 className="text-xs sm:text-sm font-black text-foreground uppercase tracking-wider flex items-center gap-1.5">
                    📊 Thống Kê Thi Đấu
                  </h3>

                  {/* Season Toggle Switch */}
                  <div className="flex items-center gap-1 bg-secondary/70 p-1 rounded-2xl border border-border/80 w-fit">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedSeason("2026/2027");
                        setSelectedLeagueId("ALL");
                      }}
                      className={cn(
                        "px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer",
                        selectedSeason === "2026/2027"
                          ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-xs"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      2026/2027 (Năm nay)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedSeason("2025/2026");
                        setSelectedLeagueId("ALL");
                      }}
                      className={cn(
                        "px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer",
                        selectedSeason === "2025/2026"
                          ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-xs"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      2025/2026 (Năm ngoái)
                    </button>
                  </div>
                </div>

                {/* Competition Filter Bar */}
                {availableLeagues.length > 0 && (
                  <div
                    style={{ WebkitOverflowScrolling: "touch" }}
                    className="w-full overflow-x-auto scrollbar-none flex items-center gap-1.5 py-1"
                  >
                    {/* All Competitions button */}
                    <button
                      type="button"
                      onClick={() => setSelectedLeagueId("ALL")}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-bold transition-all cursor-pointer border whitespace-nowrap active:scale-95 flex-shrink-0",
                        selectedLeagueId === "ALL"
                          ? "bg-emerald-500 text-white border-emerald-400 font-black shadow-xs"
                          : "bg-secondary/50 text-muted-foreground border-border hover:text-foreground hover:bg-secondary"
                      )}
                    >
                      <Trophy className="w-3.5 h-3.5" />
                      <span>Tất cả giải đấu</span>
                    </button>

                    {/* Specific Competitions */}
                    {availableLeagues.map((lg) => {
                      const isSelected = selectedLeagueId === lg.id;

                      return (
                        <button
                          key={lg.id}
                          type="button"
                          onClick={() => setSelectedLeagueId(lg.id)}
                          className={cn(
                            "flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-bold transition-all cursor-pointer border whitespace-nowrap active:scale-95 flex-shrink-0",
                            isSelected
                              ? "bg-emerald-500 text-white border-emerald-400 font-black shadow-xs"
                              : "bg-secondary/50 text-muted-foreground border-border hover:text-foreground hover:bg-secondary"
                          )}
                        >
                          <div className="w-4 h-4 rounded-md bg-white p-0.5 flex items-center justify-center flex-shrink-0 shadow-2xs border border-black/10">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={lg.logo}
                              alt={lg.name}
                              className="w-full h-full object-contain"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = "none";
                              }}
                            />
                          </div>
                          <span>{lg.shortName || lg.name}</span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Stats Cards Display */}
                {seasonStats.length > 0 && !isSpecificEmpty ? (
                  <div className="space-y-3">
                    {/* ESPN Offensive & Performance Metric Cards Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-2.5">
                      {/* Starts (STRT) */}
                      <div className="p-2 sm:p-2.5 rounded-2xl border border-border/80 bg-secondary/30 text-center flex flex-col items-center justify-between h-[92px] sm:h-[98px] shadow-2xs">
                        <div className="text-[11px] text-muted-foreground font-bold text-center leading-tight flex flex-col items-center justify-center pt-0.5">
                          <div className="flex items-center justify-center gap-1">
                            <span>👟</span>
                            <span>Đá Chính</span>
                          </div>
                          <span className="text-[10px] text-muted-foreground/80 font-mono font-semibold mt-0.5">(STRT)</span>
                        </div>
                        <p className="text-2xl sm:text-3xl font-black text-foreground pb-0.5">
                          {displayedStarts}
                        </p>
                      </div>

                      {/* Total Goals (G) */}
                      <div className="p-2 sm:p-2.5 rounded-2xl border border-border/80 bg-secondary/30 text-center flex flex-col items-center justify-between h-[92px] sm:h-[98px] shadow-2xs">
                        <div className="text-[11px] text-muted-foreground font-bold text-center leading-tight flex flex-col items-center justify-center pt-0.5">
                          <div className="flex items-center justify-center gap-1">
                            <span>⚽</span>
                            <span>Bàn Thắng</span>
                          </div>
                          <span className="text-[10px] text-muted-foreground/80 font-mono font-semibold mt-0.5">(G)</span>
                        </div>
                        <p className="text-2xl sm:text-3xl font-black text-emerald-500 pb-0.5">
                          {displayedGoals}
                        </p>
                      </div>

                      {/* Assists (A) */}
                      <div className="p-2 sm:p-2.5 rounded-2xl border border-border/80 bg-secondary/30 text-center flex flex-col items-center justify-between h-[92px] sm:h-[98px] shadow-2xs">
                        <div className="text-[11px] text-muted-foreground font-bold text-center leading-tight flex flex-col items-center justify-center pt-0.5">
                          <div className="flex items-center justify-center gap-1">
                            <span>🎯</span>
                            <span>Kiến Tạo</span>
                          </div>
                          <span className="text-[10px] text-muted-foreground/80 font-mono font-semibold mt-0.5">(A)</span>
                        </div>
                        <p className="text-2xl sm:text-3xl font-black text-teal-400 pb-0.5">
                          {displayedAssists}
                        </p>
                      </div>

                      {/* Shots (SHOT) */}
                      <div className="p-2 sm:p-2.5 rounded-2xl border border-border/80 bg-secondary/30 text-center flex flex-col items-center justify-between h-[92px] sm:h-[98px] shadow-2xs">
                        <div className="text-[11px] text-muted-foreground font-bold text-center leading-tight flex flex-col items-center justify-center pt-0.5">
                          <div className="flex items-center justify-center gap-1">
                            <span>🚀</span>
                            <span>Tổng Cú Sút</span>
                          </div>
                          <span className="text-[10px] text-muted-foreground/80 font-mono font-semibold mt-0.5">(SHOT)</span>
                        </div>
                        <p className="text-2xl sm:text-3xl font-black text-foreground pb-0.5">
                          {displayedShots}
                        </p>
                      </div>

                      {/* Shots On Goal (SOG) */}
                      <div className="p-2 sm:p-2.5 rounded-2xl border border-border/80 bg-secondary/30 text-center flex flex-col items-center justify-between h-[92px] sm:h-[98px] shadow-2xs">
                        <div className="text-[11px] text-muted-foreground font-bold text-center leading-tight flex flex-col items-center justify-center pt-0.5">
                          <div className="flex items-center justify-center gap-1">
                            <span>🎯</span>
                            <span>Trúng Đích</span>
                          </div>
                          <span className="text-[10px] text-muted-foreground/80 font-mono font-semibold mt-0.5">(SOG)</span>
                        </div>
                        <p className="text-2xl sm:text-3xl font-black text-foreground pb-0.5">
                          {displayedSOG}
                        </p>
                      </div>

                      {/* Fouls Committed (FC) */}
                      <div className="p-2 sm:p-2.5 rounded-2xl border border-border/80 bg-secondary/30 text-center flex flex-col items-center justify-between h-[92px] sm:h-[98px] shadow-2xs">
                        <div className="text-[11px] text-muted-foreground font-bold text-center leading-tight flex flex-col items-center justify-center pt-0.5">
                          <div className="flex items-center justify-center gap-1">
                            <span>⚔️</span>
                            <span>Phạm Lỗi</span>
                          </div>
                          <span className="text-[10px] text-muted-foreground/80 font-mono font-semibold mt-0.5">(FC)</span>
                        </div>
                        <p className="text-2xl sm:text-3xl font-black text-foreground pb-0.5">
                          {displayedFC}
                        </p>
                      </div>

                      {/* Fouls Suffered (FA) */}
                      <div className="p-2 sm:p-2.5 rounded-2xl border border-border/80 bg-secondary/30 text-center flex flex-col items-center justify-between h-[92px] sm:h-[98px] shadow-2xs">
                        <div className="text-[11px] text-muted-foreground font-bold text-center leading-tight flex flex-col items-center justify-center pt-0.5">
                          <div className="flex items-center justify-center gap-1">
                            <span>🛡️</span>
                            <span>Bị Phạm Lỗi</span>
                          </div>
                          <span className="text-[10px] text-muted-foreground/80 font-mono font-semibold mt-0.5">(FA)</span>
                        </div>
                        <p className="text-2xl sm:text-3xl font-black text-foreground pb-0.5">
                          {displayedFA}
                        </p>
                      </div>

                      {/* Yellow Cards (YC) */}
                      <div className="p-2 sm:p-2.5 rounded-2xl border border-border/80 bg-secondary/30 text-center flex flex-col items-center justify-between h-[92px] sm:h-[98px] shadow-2xs">
                        <div className="text-[11px] text-muted-foreground font-bold text-center leading-tight flex flex-col items-center justify-center pt-0.5">
                          <div className="flex items-center justify-center gap-1">
                            <span>🟨</span>
                            <span>Thẻ Vàng</span>
                          </div>
                          <span className="text-[10px] text-muted-foreground/80 font-mono font-semibold mt-0.5">(YC)</span>
                        </div>
                        <p className="text-2xl sm:text-3xl font-black text-amber-500 pb-0.5">
                          {displayedYellows}
                        </p>
                      </div>

                      {/* Red Cards (RC) */}
                      <div className="p-2 sm:p-2.5 rounded-2xl border border-border/80 bg-secondary/30 text-center flex flex-col items-center justify-between h-[92px] sm:h-[98px] shadow-2xs">
                        <div className="text-[11px] text-muted-foreground font-bold text-center leading-tight flex flex-col items-center justify-center pt-0.5">
                          <div className="flex items-center justify-center gap-1">
                            <span>🟥</span>
                            <span>Thẻ Đỏ</span>
                          </div>
                          <span className="text-[10px] text-muted-foreground/80 font-mono font-semibold mt-0.5">(RC)</span>
                        </div>
                        <p className="text-2xl sm:text-3xl font-black text-rose-500 pb-0.5">
                          {displayedReds}
                        </p>
                      </div>

                      {/* Offsides (OF) */}
                      <div className="p-2 sm:p-2.5 rounded-2xl border border-border/80 bg-secondary/30 text-center flex flex-col items-center justify-between h-[92px] sm:h-[98px] shadow-2xs">
                        <div className="text-[11px] text-muted-foreground font-bold text-center leading-tight flex flex-col items-center justify-center pt-0.5">
                          <div className="flex items-center justify-center gap-1">
                            <span>🚩</span>
                            <span>Việt Vị</span>
                          </div>
                          <span className="text-[10px] text-muted-foreground/80 font-mono font-semibold mt-0.5">(OF)</span>
                        </div>
                        <p className="text-2xl sm:text-3xl font-black text-foreground pb-0.5">
                          {displayedOF}
                        </p>
                      </div>
                    </div>

                    <div className="p-3 sm:p-4 rounded-2xl border border-border/60 bg-secondary/20 space-y-2 mt-2">
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-x-4 gap-y-1.5 text-[11px] text-muted-foreground font-sans">
                        <div><span className="font-bold font-mono text-foreground">STRT:</span> Starts (Đá chính)</div>
                        <div><span className="font-bold font-mono text-emerald-500">G:</span> Total Goals (Bàn thắng)</div>
                        <div><span className="font-bold font-mono text-teal-400">A:</span> Assists (Kiến tạo)</div>
                        <div><span className="font-bold font-mono text-foreground">SHOT:</span> Shots (Tổng cú sút)</div>
                        <div><span className="font-bold font-mono text-foreground">SOG:</span> Shots On Goal (Trúng đích)</div>
                        <div><span className="font-bold font-mono text-foreground">FC:</span> Fouls Committed (Phạm lỗi)</div>
                        <div><span className="font-bold font-mono text-foreground">FA:</span> Fouls Suffered (Bị phạm lỗi)</div>
                        <div><span className="font-bold font-mono text-amber-500">YC:</span> Yellow Cards (Thẻ vàng)</div>
                        <div><span className="font-bold font-mono text-rose-500">RC:</span> Red Cards (Thẻ đỏ)</div>
                        <div><span className="font-bold font-mono text-foreground">OF:</span> Offsides (Việt vị)</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-5 rounded-2xl border border-border/60 bg-secondary/20 text-center text-muted-foreground text-xs font-medium">
                    {isSpecificEmpty
                      ? `Cầu thủ chưa có số liệu thi đấu tại giải đấu này trong mùa ${selectedSeason}.`
                      : `Chưa có thống kê thi đấu chính thức cho mùa giải ${selectedSeason}.`}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
