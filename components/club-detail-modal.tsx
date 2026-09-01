"use client";

import React, { useState, useEffect } from "react";
import { getTeamById } from "@/lib/actions/team";
import { TeamDetailData, Player, MatchItem } from "@/types/football";
import { getCountryFlagUrl, cn } from "@/lib/utils";
import {
  X,
  MapPin,
  Calendar,
  Users,
  Trophy,
  BarChart3,
  Loader2,
  ExternalLink,
  ChevronRight,
  Shield,
} from "lucide-react";

interface ClubDetailModalProps {
  teamId: string | null;
  onClose: () => void;
  onSelectPlayer?: (playerId: string) => void;
  onSelectMatch?: (matchId: string) => void;
}

export function ClubDetailModal({
  teamId,
  onClose,
  onSelectPlayer,
  onSelectMatch,
}: ClubDetailModalProps) {
  const [data, setData] = useState<TeamDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"squad" | "matches" | "stats">("squad");

  useEffect(() => {
    if (!teamId) return;

    let isMounted = true;

    async function loadTeam() {
      try {
        const res = await getTeamById(teamId as string);
        if (isMounted) {
          setData(res);
          setLoading(false);
        }
      } catch (err) {
        console.error("Error loading team:", err);
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadTeam();

    return () => {
      isMounted = false;
    };
  }, [teamId]);

  if (!teamId) return null;

  const team = data?.team;
  const stats = data?.stats;
  const matches = data?.matches || [];
  const players = team?.players || [];

  // Group players by position
  const goalkeepers = players.filter((p) => p.position === "GOALKEEPER");
  const defenders = players.filter((p) => p.position === "DEFENDER");
  const midfielders = players.filter((p) => p.position === "MIDFIELDER");
  const forwards = players.filter((p) => p.position === "FORWARD");

  const currentStanding = team?.standings && team.standings.length > 0 ? team.standings[0] : null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 md:p-6 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-4xl h-[92vh] sm:h-auto sm:max-h-[90vh] flex flex-col rounded-t-3xl sm:rounded-3xl border border-border bg-card/95 backdrop-blur-2xl shadow-2xl text-foreground overflow-hidden">
        {/* Mobile Pull Bar Indicator */}
        <div className="sm:hidden w-12 h-1.5 bg-muted-foreground/30 rounded-full mx-auto mt-2.5 mb-1" />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng thông tin câu lạc bộ"
          className="absolute top-3.5 right-3.5 z-20 p-2 sm:p-2.5 rounded-full bg-background/80 hover:bg-secondary text-muted-foreground hover:text-foreground transition-all cursor-pointer border border-border shadow-sm active:scale-95"
        >
          <X className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        {loading || !team ? (
          <div className="flex flex-col items-center justify-center min-h-[380px] gap-3">
            <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
            <p className="text-sm text-muted-foreground font-medium">
              Đang tải hồ sơ câu lạc bộ...
            </p>
          </div>
        ) : (
          <>
            {/* Header: Club Profile & Branding */}
            <div className="relative bg-gradient-to-b from-emerald-950/40 via-card/90 to-card p-4 sm:p-6 border-b border-border/60">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 text-center sm:text-left pr-8 sm:pr-12">
                {/* Large Club Crest Badge */}
                <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-2xl sm:rounded-3xl bg-white p-2 sm:p-3 flex items-center justify-center border border-black/10 shadow-xl flex-shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={team.logo}
                    alt={team.name}
                    className="w-full h-full object-contain filter drop-shadow-md"
                  />
                </div>

                {/* Team Info & Metadata */}
                <div className="flex-1 min-w-0 space-y-1 sm:space-y-2">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <h1 className="text-xl sm:text-3xl font-black text-foreground tracking-tight">
                      {team.name}
                    </h1>
                    {team.league && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-secondary border border-border text-foreground">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={getCountryFlagUrl(team.league.country)}
                          alt={team.league.country}
                          className="w-3.5 h-2.5 object-cover rounded-xs"
                        />
                        <span>{team.league.shortName}</span>
                      </span>
                    )}
                  </div>

                  {/* Metadata Chips Grid */}
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 sm:gap-3 text-xs text-muted-foreground pt-1">
                    {team.coach && (
                      <span className="flex items-center gap-1 bg-secondary/60 px-2.5 py-1 rounded-xl border border-border/50">
                        <Shield className="w-3.5 h-3.5 text-emerald-500" />
                        <span>HLV: <strong className="text-foreground">{team.coach}</strong></span>
                      </span>
                    )}

                    {team.stadium && (
                      <span className="flex items-center gap-1 bg-secondary/60 px-2.5 py-1 rounded-xl border border-border/50">
                        <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                        <span>{team.stadium} {team.capacity ? `(${team.capacity.toLocaleString()} chỗ)` : ""}</span>
                      </span>
                    )}

                    {team.foundedYear && (
                      <span className="flex items-center gap-1 bg-secondary/60 px-2.5 py-1 rounded-xl border border-border/50">
                        <Calendar className="w-3.5 h-3.5 text-amber-500" />
                        <span>Thành lập: <strong className="text-foreground">{team.foundedYear}</strong></span>
                      </span>
                    )}

                    {team.website && (
                      <a
                        href={team.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-emerald-500 hover:underline bg-emerald-500/10 px-2.5 py-1 rounded-xl border border-emerald-500/20 font-bold"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>Website</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Segmented Navigation Tabs (3 Tabs) */}
            <div className="grid grid-cols-3 border-b border-border/70 bg-card/60 px-2 sm:px-6">
              <button
                type="button"
                onClick={() => setActiveTab("squad")}
                className={cn(
                  "flex items-center justify-center gap-1.5 py-3 px-2 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer truncate",
                  activeTab === "squad"
                    ? "border-emerald-500 text-emerald-500 font-black"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                <span>Đội hình ({players.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("matches")}
                className={cn(
                  "flex items-center justify-center gap-1.5 py-3 px-2 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer truncate",
                  activeTab === "matches"
                    ? "border-emerald-500 text-emerald-500 font-black"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                <span>Lịch đấu & Kết quả</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("stats")}
                className={cn(
                  "flex items-center justify-center gap-1.5 py-3 px-2 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer truncate",
                  activeTab === "stats"
                    ? "border-emerald-500 text-emerald-500 font-black"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                <BarChart3 className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                <span>Thống kê mùa giải</span>
              </button>
            </div>

            {/* Tab Contents Area */}
            <div className="flex-1 min-h-0 overflow-y-auto p-3.5 sm:p-6 space-y-6">
              {/* TAB 1: SQUAD (4 POSITIONS) */}
              {activeTab === "squad" && (
                <div className="space-y-6">
                  {/* Forwards */}
                  <SquadSection
                    title="⚡ Tiền Đạo (Forwards)"
                    players={forwards}
                    onSelectPlayer={onSelectPlayer}
                  />

                  {/* Midfielders */}
                  <SquadSection
                    title="⚙️ Tiền Vệ (Midfielders)"
                    players={midfielders}
                    onSelectPlayer={onSelectPlayer}
                  />

                  {/* Defenders */}
                  <SquadSection
                    title="🛡️ Hậu Vệ (Defenders)"
                    players={defenders}
                    onSelectPlayer={onSelectPlayer}
                  />

                  {/* Goalkeepers */}
                  <SquadSection
                    title="🧤 Thủ Môn (Goalkeepers)"
                    players={goalkeepers}
                    onSelectPlayer={onSelectPlayer}
                  />
                </div>
              )}

              {/* TAB 2: MATCHES & FIXTURES */}
              {activeTab === "matches" && (
                <div className="space-y-3">
                  {matches.length > 0 ? (
                    matches.map((m: MatchItem) => {
                      const isHome = m.homeTeamId === team.id;
                      const opponent = isHome ? m.awayTeam : m.homeTeam;
                      const isFinished = m.status === "FINISHED";
                      const isLive = m.status === "LIVE";

                      let matchOutcome = "text-muted-foreground";
                      const hasPen = m.homePenaltyScore !== null && m.awayPenaltyScore !== null;
                      const teamPen = isHome ? m.homePenaltyScore : m.awayPenaltyScore;
                      const oppPen = isHome ? m.awayPenaltyScore : m.homePenaltyScore;

                      if (isFinished) {
                        const teamScore = isHome ? m.homeScore : m.awayScore;
                        const oppScore = isHome ? m.awayScore : m.homeScore;
                        if (hasPen && teamPen != null && oppPen != null) {
                          if (teamPen > oppPen) matchOutcome = "text-emerald-500 font-black";
                          else matchOutcome = "text-rose-500 font-black";
                        } else {
                          if (teamScore > oppScore) matchOutcome = "text-emerald-500 font-black";
                          else if (teamScore < oppScore) matchOutcome = "text-rose-500 font-black";
                          else matchOutcome = "text-amber-500 font-bold";
                        }
                      }

                      return (
                        <div
                          key={m.id}
                          onClick={() => onSelectMatch?.(m.id)}
                          className="flex items-center justify-between p-3 sm:p-4 rounded-2xl border border-border/80 bg-secondary/30 hover:bg-secondary/60 transition-all cursor-pointer group"
                        >
                          {/* Match Date & League */}
                          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-xl bg-white p-1 flex items-center justify-center flex-shrink-0 shadow-2xs border border-black/10">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={m.league.logo}
                                alt={m.league.name}
                                className="w-full h-full object-contain"
                              />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-foreground truncate">
                                {m.round} • {m.league.shortName}
                              </p>
                              <p className="text-[10px] sm:text-[11px] text-muted-foreground">
                                {new Date(m.matchDate).toLocaleDateString("vi-VN", {
                                  weekday: "short",
                                  day: "2-digit",
                                  month: "2-digit",
                                })}
                              </p>
                            </div>
                          </div>

                          {/* Opponent & Score */}
                          <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0">
                            <div className="flex items-center gap-2 text-right">
                              <span className="text-xs sm:text-sm font-extrabold text-foreground truncate max-w-[120px] sm:max-w-none">
                                {isHome ? "vs" : "@"} {opponent.name}
                              </span>
                              <div className="w-6 h-6 rounded-lg bg-white p-0.5 flex items-center justify-center flex-shrink-0 shadow-2xs border border-black/10">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={opponent.logo}
                                  alt={opponent.name}
                                  className="w-full h-full object-contain"
                                />
                              </div>
                            </div>

                            {/* Score badge */}
                            <div className="w-18 sm:w-28 text-center">
                              {isFinished ? (
                                <span className={cn("px-2.5 py-1 rounded-xl bg-card border border-border font-mono text-xs sm:text-sm flex flex-col items-center", matchOutcome)}>
                                  <span>{m.homeScore} : {m.awayScore}</span>
                                  {hasPen && teamPen != null && oppPen != null && (
                                    <span className={cn("text-[9px] font-black -mt-0.5 tracking-tight whitespace-nowrap", teamPen > oppPen ? "text-emerald-500" : "text-rose-500")}>
                                      {teamPen > oppPen ? "Thắng" : "Thua"} Pen ({m.homePenaltyScore}-{m.awayPenaltyScore})
                                    </span>
                                  )}
                                </span>
                              ) : isLive ? (
                                <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white font-black text-[10px] animate-pulse">
                                  {m.homeScore} : {m.awayScore} ({m.minute || "LIVE"})
                                </span>
                              ) : (
                                <span className="px-2.5 py-1 rounded-xl bg-secondary font-mono text-xs text-muted-foreground font-bold">
                                  {new Date(m.matchDate).toLocaleTimeString("vi-VN", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                              )}
                            </div>

                            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-transform group-hover:translate-x-0.5" />
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-12 text-muted-foreground text-sm font-medium">
                      Chưa có dữ liệu trận đấu cho câu lạc bộ này.
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: SEASON STATS (Mùa Giải 2026/2027 theo từng giải đấu) */}
              {activeTab === "stats" && (
                <div className="space-y-6">
                  {/* Overall Season 2026/2027 Header Card */}
                  <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-card/80 to-card p-4 sm:p-5 shadow-sm space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-border/60">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">🏆</span>
                        <div>
                          <h3 className="text-sm sm:text-base font-black text-foreground">
                            Tổng Quan Mùa Giải {data?.seasonName || "2026/2027"}
                          </h3>
                          <p className="text-[11px] text-muted-foreground font-medium">
                            Thống kê trên tất cả các đấu trường tham dự
                          </p>
                        </div>
                      </div>
                      <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-extrabold text-xs border border-emerald-500/30 shadow-2xs">
                        {data?.seasonName || "2026/2027"}
                      </span>
                    </div>

                    {/* 4 Khối Thống Kê Tổng Hợp */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3.5">
                      <div className="p-3 sm:p-3.5 rounded-xl border border-border/80 bg-secondary/40 text-center">
                        <p className="text-[11px] text-muted-foreground font-bold uppercase tracking-wider">Tỉ lệ Thắng</p>
                        <p className="text-xl sm:text-2xl font-black text-emerald-500 mt-0.5">
                          {stats?.winRate || 0}%
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-0.5 font-semibold">
                          {stats?.won}T • {stats?.draw}H • {stats?.lost}B
                        </p>
                      </div>

                      <div className="p-3 sm:p-3.5 rounded-xl border border-border/80 bg-secondary/40 text-center">
                        <p className="text-[11px] text-muted-foreground font-bold uppercase tracking-wider">Bàn Thắng</p>
                        <p className="text-xl sm:text-2xl font-black text-foreground mt-0.5">
                          {stats?.goalsFor || 0}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-0.5 font-semibold">
                          TB {(stats?.totalMatches ? (stats.goalsFor / stats.totalMatches).toFixed(1) : "0")} bàn/trận
                        </p>
                      </div>

                      <div className="p-3 sm:p-3.5 rounded-xl border border-border/80 bg-secondary/40 text-center">
                        <p className="text-[11px] text-muted-foreground font-bold uppercase tracking-wider">Bàn Thua</p>
                        <p className="text-xl sm:text-2xl font-black text-rose-500 mt-0.5">
                          {stats?.goalsAgainst || 0}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-0.5 font-semibold">
                          Hiệu số: {((stats?.goalsFor || 0) - (stats?.goalsAgainst || 0)) > 0 ? `+${(stats?.goalsFor || 0) - (stats?.goalsAgainst || 0)}` : (stats?.goalsFor || 0) - (stats?.goalsAgainst || 0)}
                        </p>
                      </div>

                      <div className="p-3 sm:p-3.5 rounded-xl border border-border/80 bg-secondary/40 text-center">
                        <p className="text-[11px] text-muted-foreground font-bold uppercase tracking-wider">Sạch Lưới</p>
                        <p className="text-xl sm:text-2xl font-black text-teal-500 mt-0.5">
                          {stats?.cleanSheets || 0}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-0.5 font-semibold">
                          {stats?.totalMatches || 0} trận đã đấu
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Chi Tiết Theo Từng Giải Đấu (Competitions Breakdown) */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-black text-xs sm:text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                        <span>📊</span> Chi Tiết Từng Giải Đấu Mùa 2026/2027 ({data?.competitionStats?.length || 0})
                      </h4>
                    </div>

                    <div className="space-y-3.5">
                      {(data?.competitionStats || []).map((comp) => {
                        const isCup = comp.leagueType === "CUP";

                        return (
                          <div
                            key={comp.leagueId}
                            className="rounded-2xl border border-border/80 bg-card/70 backdrop-blur-md p-4 sm:p-5 shadow-xs hover:border-emerald-500/40 transition-all space-y-3.5"
                          >
                            {/* Competition Header */}
                            <div className="flex flex-wrap items-center justify-between gap-2.5 pb-2.5 border-b border-border/50">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-8 h-8 rounded-xl bg-white p-1 flex items-center justify-center flex-shrink-0 shadow-2xs border border-black/10">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={comp.leagueLogo}
                                    alt={comp.leagueName}
                                    className="w-full h-full object-contain"
                                  />
                                </div>
                                <div className="min-w-0">
                                  <h5 className="font-black text-sm sm:text-base text-foreground truncate">
                                    {comp.leagueName}
                                  </h5>
                                  <p className="text-[10px] sm:text-xs text-muted-foreground font-medium">
                                    {comp.leagueCountry || (isCup ? "Cúp Quốc Gia" : "Giải Đấu")} • Mùa giải 2026/2027
                                  </p>
                                </div>
                              </div>

                              {/* Ranking badge or Cup Knockout badge */}
                              {isCup ? (
                                <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 font-extrabold text-xs shadow-2xs">
                                  <span>🏆</span>
                                  <span>Cup</span>
                                </div>
                              ) : comp.standing ? (
                                <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
                                  <span className="font-black text-xs sm:text-sm">
                                    #{comp.standing.position}
                                  </span>
                                  <span className="text-[10px] font-bold text-muted-foreground">
                                    ({comp.standing.points} điểm)
                                  </span>
                                </div>
                              ) : null}
                            </div>

                            {/* Stat Row */}
                            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3 text-center">
                              <div className="p-2.5 rounded-xl bg-secondary/30 border border-border/50">
                                <p className="text-[10px] text-muted-foreground font-bold">Số trận</p>
                                <p className="text-base sm:text-lg font-black text-foreground">{comp.totalMatches}</p>
                              </div>
                              <div className="p-2.5 rounded-xl bg-secondary/30 border border-border/50">
                                <p className="text-[10px] text-muted-foreground font-bold">
                                  {isCup ? "Thắng - Thua" : "Thắng - Hòa - Thua"}
                                </p>
                                <p className="text-base sm:text-lg font-black text-foreground">
                                  <span className="text-emerald-500">{comp.won}</span>-
                                  {!isCup && <span>{comp.draw}-</span>}
                                  <span className="text-rose-500">{comp.lost}</span>
                                </p>
                              </div>
                              <div className="p-2.5 rounded-xl bg-secondary/30 border border-border/50">
                                <p className="text-[10px] text-muted-foreground font-bold">Tỉ lệ Thắng</p>
                                <p className="text-base sm:text-lg font-black text-emerald-500">{comp.winRate}%</p>
                              </div>
                              <div className="p-2.5 rounded-xl bg-secondary/30 border border-border/50">
                                <p className="text-[10px] text-muted-foreground font-bold">Bàn Thắng/Thua</p>
                                <p className="text-base sm:text-lg font-black text-foreground">
                                  {comp.goalsFor} : {comp.goalsAgainst}
                                </p>
                              </div>
                              <div className="col-span-2 sm:col-span-1 p-2.5 rounded-xl bg-secondary/30 border border-border/50">
                                <p className="text-[10px] text-muted-foreground font-bold">Sạch Lưới</p>
                                <p className="text-base sm:text-lg font-black text-teal-500">{comp.cleanSheets}</p>
                              </div>
                            </div>

                            {/* Recent Form in this competition */}
                            {comp.recentForm && comp.recentForm.length > 0 && (
                              <div className="flex items-center justify-between pt-1 border-t border-border/40 text-xs">
                                <span className="text-[11px] font-bold text-muted-foreground">
                                  Phong độ gần nhất:
                                </span>
                                <div className="flex items-center gap-1.5">
                                  {comp.recentForm.map((f, idx) => (
                                    <div
                                      key={idx}
                                      className="group relative"
                                      title={`${f.result === 'W' ? 'Thắng' : f.result === 'L' ? 'Thua' : 'Hòa'} ${f.score} vs ${f.opponent}`}
                                    >
                                      <div
                                        className={cn(
                                          "w-6 h-6 rounded-md flex items-center justify-center font-black text-[10px] text-white cursor-pointer transition-transform hover:scale-110 shadow-2xs",
                                          f.result === "W"
                                            ? "bg-emerald-600"
                                            : f.result === "L"
                                              ? "bg-rose-600"
                                              : "bg-amber-500"
                                        )}
                                      >
                                        {f.result}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Squad Section Component
function SquadSection({
  title,
  players,
  onSelectPlayer,
}: {
  title: string;
  players: Player[];
  onSelectPlayer?: (playerId: string) => void;
}) {
  if (players.length === 0) return null;

  return (
    <div className="space-y-2.5">
      <h3 className="text-xs sm:text-sm font-black text-foreground uppercase tracking-wider">
        {title} ({players.length})
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3">
        {players.map((p) => (
          <div
            key={p.id}
            onClick={() => onSelectPlayer?.(p.id)}
            className="flex items-center gap-3 p-2.5 sm:p-3 rounded-2xl border border-border/70 bg-secondary/30 hover:bg-secondary/70 hover:border-emerald-500/40 transition-all cursor-pointer group shadow-2xs"
          >
            {/* Player Avatar */}
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-card p-0.5 border border-border/80 flex items-center justify-center flex-shrink-0 overflow-hidden group-hover:scale-105 transition-transform shadow-2xs">
              {p.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={p.avatar}
                  alt={p.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = "none";
                  }}
                />
              ) : (
                <span className="font-bold text-xs text-muted-foreground">
                  #{p.number || "•"}
                </span>
              )}
            </div>

            {/* Name, Number & Country */}
            <div className="flex-1 min-w-0">
              <p className="font-extrabold text-xs sm:text-sm text-foreground truncate group-hover:text-emerald-500 transition-colors">
                {p.name}
              </p>
              <div className="flex items-center gap-2 text-[10px] sm:text-[11px] text-muted-foreground mt-0.5">
                <span className="font-mono font-bold text-emerald-500">#{p.number || "•"}</span>
                {p.nationality && <span>• {p.nationality}</span>}
                {p.marketValue && <span>• {p.marketValue}</span>}
              </div>
            </div>

            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-emerald-500 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}
