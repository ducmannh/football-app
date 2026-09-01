"use client";

import React, { useState, useEffect } from "react";
import { getMatchById } from "@/lib/actions/match";
import {
  X,
  MapPin,
  Flame,
  Shirt,
  BarChart3,
  History,
  Shield,
  Loader2,
  Clock,
  RotateCw,
} from "lucide-react";
import { cn, formatRound } from "@/lib/utils";
import { MatchDetailData, MatchEvent, MatchLineup, MatchItem } from "@/types/football";
import { getClubManager } from "@/lib/services/club-managers";
import { calculateTacticalFormationPositions } from "@/lib/services/tactical-pitch";

// Biểu tượng Bàn Phản Lưới Nhà (Quả bóng màu đỏ nổi bật phân biệt hoàn toàn với bàn thắng thông thường)
function OwnGoalIcon({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center justify-center shrink-0 select-none", className)}>
      <svg viewBox="0 0 24 24" className="w-full h-full drop-shadow-xs" fill="none">
        <circle cx="12" cy="12" r="10" className="fill-rose-600 stroke-rose-400" strokeWidth="1.5" />
        <polygon points="12,7 15.8,9.8 14.3,14.2 9.7,14.2 8.2,9.8" className="fill-white" />
        <line x1="12" y1="7" x2="12" y2="2" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
        <line x1="15.8" y1="9.8" x2="20.5" y2="7.5" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
        <line x1="14.3" y1="14.2" x2="18.5" y2="18" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
        <line x1="9.7" y1="14.2" x2="5.5" y2="18" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
        <line x1="8.2" y1="9.8" x2="3.5" y2="7.5" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    </span>
  );
}

interface MatchDetailModalProps {
  matchId: string | null;
  onClose: () => void;
  onSelectTeam?: (teamId: string) => void;
  onSelectPlayer?: (playerId: string) => void;
}

export function MatchDetailModal({
  matchId,
  onClose,
  onSelectTeam,
  onSelectPlayer,
}: MatchDetailModalProps) {
  const [data, setData] = useState<MatchDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPitchVertical, setIsPitchVertical] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "timeline" | "lineup" | "stats" | "h2h"
  >("timeline");

  useEffect(() => {
    if (!matchId) return;

    let isMounted = true;
    setLoading(true);

    async function loadMatch() {
      try {
        const res = await getMatchById(matchId as string);
        if (isMounted) {
          setData(res as unknown as MatchDetailData);
          setLoading(false);
        }
      } catch (err) {
        console.error("Error loading match detail:", err);
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadMatch();

    return () => {
      isMounted = false;
    };
  }, [matchId]);

  const match = data?.match;
  const h2hMatches = data?.h2hMatches || [];
  const h2hSummary = data?.h2hSummary;
  const homeRecentForm = data?.homeRecentForm || [];
  const awayRecentForm = data?.awayRecentForm || [];

  // Tính toán Tổng quan H2H chuẩn xác theo danh tính đội A và đội B
  const activeH2hSummary = React.useMemo(() => {
    if (!match?.homeTeam?.name || !match?.awayTeam?.name) return h2hSummary;
    if (!h2hMatches || h2hMatches.length === 0) return h2hSummary;

    const teamAName = match.homeTeam.name.toLowerCase();
    const teamBName = match.awayTeam.name.toLowerCase();

    let homeWins = 0;
    let awayWins = 0;
    let draws = 0;

    for (const h of h2hMatches as any[]) {
      const isEspnFormat = Boolean(h.homeTeamName);
      const hName = (isEspnFormat ? h.homeTeamName : h.homeTeam?.name || "").toLowerCase();
      const aName = (isEspnFormat ? h.awayTeamName : h.awayTeam?.name || "").toLowerCase();

      const isHomeTeamA = hName.includes(teamAName) || teamAName.includes(hName);
      const isAwayTeamA = aName.includes(teamAName) || teamAName.includes(aName);
      const isHomeTeamB = hName.includes(teamBName) || teamBName.includes(hName);
      const isAwayTeamB = aName.includes(teamBName) || teamBName.includes(aName);

      if (h.homeScore > h.awayScore) {
        if (isHomeTeamA) homeWins++;
        else if (isHomeTeamB) awayWins++;
      } else if (h.awayScore > h.homeScore) {
        if (isAwayTeamA) homeWins++;
        else if (isAwayTeamB) awayWins++;
      } else {
        draws++;
      }
    }

    return {
      summaryText: h2hSummary?.summaryText || `${match.homeTeam.name} vs ${match.awayTeam.name}`,
      totalMatches: h2hMatches.length,
      homeWins,
      draws,
      awayWins,
    };
  }, [h2hMatches, h2hSummary, match]);

  if (!matchId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 md:p-6 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-4xl h-[92vh] sm:h-auto sm:max-h-[90vh] flex flex-col rounded-t-3xl sm:rounded-3xl border border-border bg-card/95 backdrop-blur-2xl shadow-2xl text-foreground overflow-hidden">
        {/* Mobile Pull Bar Indicator */}
        <div className="sm:hidden w-12 h-1.5 bg-muted-foreground/30 rounded-full mx-auto mt-2.5 mb-1" />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng chi tiết trận đấu"
          className="absolute top-3.5 right-3.5 z-20 p-2 sm:p-2.5 rounded-full bg-background/80 hover:bg-secondary text-muted-foreground hover:text-foreground transition-all cursor-pointer border border-border shadow-sm active:scale-95"
        >
          <X className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        {loading || !match ? (
          <div className="flex flex-col items-center justify-center min-h-[380px] gap-3">
            <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
            <p className="text-sm text-muted-foreground font-medium">
              Đang tải dữ liệu trận đấu...
            </p>
          </div>
        ) : (
          <>
            {/* Header Scoreboard */}
            <div className="relative bg-gradient-to-b from-emerald-950/30 via-card/90 to-card p-4 sm:p-8 border-b border-border/60">
              {/* League & Round Tag */}
              <div className="flex items-center justify-center gap-2 mb-3 sm:mb-6 pr-8 sm:pr-0">
                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-white p-0.5 shadow-sm border border-black/10 flex items-center justify-center flex-shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={match.league.logo}
                    alt={match.league.name}
                    className="w-full h-full object-contain filter drop-shadow-xs"
                  />
                </div>
                <span className="text-[11px] sm:text-sm font-extrabold text-foreground/90 uppercase tracking-wider truncate">
                  {match.league.name} • {formatRound(match.round)}
                </span>
              </div>

              {/* Symmetrical 3-Part Match Center (100% Mathematically Centered) */}
              <div className="flex items-center justify-between gap-1.5 sm:gap-4 py-1 w-full">
                {/* Left: Home Team (flex-1) */}
                <div
                  onClick={() => onSelectTeam?.(match.homeTeamId)}
                  className="flex-1 min-w-0 flex items-center justify-end gap-1.5 sm:gap-3 text-right cursor-pointer group/team"
                  title={`Xem hồ sơ ${match.homeTeam.name}`}
                >
                  <div className="min-w-0 flex-1 flex flex-col justify-center">
                    <h2 className="text-xs sm:text-xl font-black text-foreground group-hover/team:text-emerald-500 transition-colors truncate">
                      <span className="hidden sm:inline">{match.homeTeam.name}</span>
                      <span className="sm:hidden">{match.homeTeam.shortName || match.homeTeam.name}</span>
                    </h2>
                    <p className="text-[10px] text-muted-foreground font-medium">
                      Chủ nhà
                    </p>
                  </div>

                  <div className="w-10 h-10 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-white p-1 sm:p-2 flex items-center justify-center border border-black/10 shadow-md flex-shrink-0 group-hover/team:scale-110 transition-transform">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={match.homeTeam.logo}
                      alt={match.homeTeam.name}
                      className="w-full h-full object-contain filter drop-shadow-xs"
                    />
                  </div>
                </div>

                {/* Center: Score & Status (Fixed Width, Absolute Center) */}
                <div className="w-18 sm:w-32 flex-shrink-0 flex flex-col items-center justify-center text-center">
                  {match.status === "SCHEDULED" ? (
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-muted-foreground">
                        VS
                      </span>
                      <div className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-extrabold text-[11px] sm:text-xs whitespace-nowrap shadow-xs">
                        {new Date(match.matchDate).toLocaleTimeString("vi-VN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <div className="font-mono text-xl sm:text-4xl font-black tracking-tight text-foreground">
                        {match.homeScore} : {match.awayScore}
                      </div>
                      {match.homePenaltyScore != null && match.awayPenaltyScore != null ? (
                        <div className="flex flex-col items-center mt-1">
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-extrabold text-[10px] sm:text-xs tracking-tight shadow-2xs">
                            Pen {match.homePenaltyScore} - {match.awayPenaltyScore}
                          </span>
                          <span className="text-[9px] sm:text-[10px] text-muted-foreground font-semibold mt-0.5 whitespace-nowrap">
                            {match.homePenaltyScore > match.awayPenaltyScore ? (match.homeTeam.shortName || match.homeTeam.name) : (match.awayTeam.shortName || match.awayTeam.name)} thắng
                          </span>
                        </div>
                      ) : match.status === "LIVE" ? (
                        <span className="mt-0.5 px-2 sm:px-3 py-0.5 rounded-full bg-rose-500 text-white font-black text-[9px] sm:text-xs animate-pulse shadow-sm">
                          {match.minute || "LIVE"}
                        </span>
                      ) : (
                        <span className="mt-0.5 px-2 py-0.2 rounded-full bg-secondary text-muted-foreground font-bold text-[9px] sm:text-xs border border-border">
                          {match.extraTimeStatus === "AET" ? "FT (AET)" : "FT"}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Right: Away Team (flex-1) */}
                <div
                  onClick={() => onSelectTeam?.(match.awayTeamId)}
                  className="flex-1 min-w-0 flex items-center justify-start gap-1.5 sm:gap-3 text-left cursor-pointer group/team"
                  title={`Xem hồ sơ ${match.awayTeam.name}`}
                >
                  <div className="w-10 h-10 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-white p-1 sm:p-2 flex items-center justify-center border border-black/10 shadow-md flex-shrink-0 group-hover/team:scale-110 transition-transform">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={match.awayTeam.logo}
                      alt={match.awayTeam.name}
                      className="w-full h-full object-contain filter drop-shadow-xs"
                    />
                  </div>

                  <div className="min-w-0 flex-1 flex flex-col justify-center">
                    <h2 className="text-xs sm:text-xl font-black text-foreground group-hover/team:text-emerald-500 transition-colors truncate">
                      <span className="hidden sm:inline">{match.awayTeam.name}</span>
                      <span className="sm:hidden">{match.awayTeam.shortName || match.awayTeam.name}</span>
                    </h2>
                    <p className="text-[10px] text-muted-foreground font-medium">
                      Đội khách
                    </p>
                  </div>
                </div>
              </div>

              {/* Match Meta Information */}
              <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-5 mt-3 sm:mt-5 text-[10px] sm:text-xs text-muted-foreground">
                <span className="flex items-center gap-1 font-bold text-foreground/90">
                  <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-500 flex-shrink-0" />
                  <span>
                    {new Date(match.matchDate).toLocaleDateString("vi-VN", {
                      weekday: "short",
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })}{" "}
                    •{" "}
                    {new Date(match.matchDate).toLocaleTimeString("vi-VN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </span>
                {match.stadium && (
                  <span className="flex items-center gap-1 truncate">
                    <MapPin className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-500 flex-shrink-0" />
                    <span className="truncate">{match.stadium}</span>
                  </span>
                )}
                {match.referee && (
                  <span className="flex items-center gap-1 truncate">
                    <Shield className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-500 flex-shrink-0" />
                    <span className="truncate">Trọng tài: {match.referee}</span>
                  </span>
                )}
              </div>
            </div>

            {/* Segmented Grid Tabs (Evenly Distributed 4 Columns) */}
            <div className="grid grid-cols-4 border-b border-border/70 bg-card/60 px-1 sm:px-4">
              <button
                type="button"
                onClick={() => setActiveTab("timeline")}
                className={cn(
                  "flex items-center justify-center gap-1 sm:gap-1.5 py-2.5 sm:py-3 px-1 text-[11px] sm:text-sm font-bold border-b-2 transition-all cursor-pointer truncate",
                  activeTab === "timeline"
                    ? "border-emerald-500 text-emerald-500 font-black"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                <span className="truncate">Diễn biến</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("lineup")}
                className={cn(
                  "flex items-center justify-center gap-1 sm:gap-1.5 py-2.5 sm:py-3 px-1 text-[11px] sm:text-sm font-bold border-b-2 transition-all cursor-pointer truncate",
                  activeTab === "lineup"
                    ? "border-emerald-500 text-emerald-500 font-black"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                <Shirt className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                <span className="truncate">Đội hình</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("stats")}
                className={cn(
                  "flex items-center justify-center gap-1 sm:gap-1.5 py-2.5 sm:py-3 px-1 text-[11px] sm:text-sm font-bold border-b-2 transition-all cursor-pointer truncate",
                  activeTab === "stats"
                    ? "border-emerald-500 text-emerald-500 font-black"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                <BarChart3 className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                <span className="truncate">Thống kê</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("h2h")}
                className={cn(
                  "flex items-center justify-center gap-1 sm:gap-1.5 py-2.5 sm:py-3 px-1 text-[11px] sm:text-sm font-bold border-b-2 transition-all cursor-pointer truncate",
                  activeTab === "h2h"
                    ? "border-emerald-500 text-emerald-500 font-black"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                <History className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                <span className="truncate">Đối đầu</span>
              </button>
            </div>

            {/* Tab Contents Area */}
            <div className="flex-1 min-h-0 overflow-y-auto p-3.5 sm:p-6 space-y-4">
              {/* TAB 1: TIMELINE (CHỈ HIỂN THỊ BÀN THẮNG + KIẾN TẠO VÀ THẺ PHẠT) */}
              {activeTab === "timeline" && (
                <div className="space-y-2.5">
                  {(() => {
                    const keyEvents = (match.events || []).filter(
                      (e) =>
                        e.type === "GOAL" ||
                        e.type === "PENALTY_SCORED" ||
                        e.type === "OWN_GOAL" ||
                        e.type === "YELLOW_CARD" ||
                        e.type === "RED_CARD"
                    );

                    if (keyEvents.length === 0) {
                      return (
                        <div className="text-center py-12 text-muted-foreground text-sm font-medium">
                          Chưa có bàn thắng hoặc thẻ phạt nào trong trận đấu.
                        </div>
                      );
                    }

                    return keyEvents.map((event: MatchEvent) => {
                      const rawDesc = event.description || "";
                      const desc = rawDesc
                        .toLowerCase()
                        .normalize("NFD")
                        .replace(/[\u0300-\u036f]/g, "")
                        .replace(/\s*fc\s*|\s*afc\s*|\s*cf\s*|\s*sc\s*|\s*rc\s*|\s*ac\s*|\s*as\s*|\s*ss\s*|\s*1\.\s*|\s*vfb\s*/gi, "")
                        .trim();
                      const homeName = match.homeTeam.name
                        .toLowerCase()
                        .normalize("NFD")
                        .replace(/[\u0300-\u036f]/g, "")
                        .replace(/\s*fc\s*|\s*afc\s*|\s*cf\s*|\s*sc\s*|\s*rc\s*|\s*ac\s*|\s*as\s*|\s*ss\s*|\s*1\.\s*|\s*vfb\s*/gi, "")
                        .trim();
                      const awayName = match.awayTeam.name
                        .toLowerCase()
                        .normalize("NFD")
                        .replace(/[\u0300-\u036f]/g, "")
                        .replace(/\s*fc\s*|\s*afc\s*|\s*cf\s*|\s*sc\s*|\s*rc\s*|\s*ac\s*|\s*as\s*|\s*ss\s*|\s*1\.\s*|\s*vfb\s*/gi, "")
                        .trim();
                      const homeShort = (match.homeTeam.shortName || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
                      const awayShort = (match.awayTeam.shortName || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

                      const isPen =
                        event.type === "PENALTY_SCORED" ||
                        desc.includes("penalty") ||
                        desc.includes("phat den") ||
                        desc.includes("converts the penalty");
                      const isOG =
                        event.type === "OWN_GOAL" ||
                        desc.includes("own goal") ||
                        desc.includes("phan luoi") ||
                        desc.includes("(og)") ||
                        desc.includes(" og");

                      // Bàn phản lưới nhà (OG) được tính và hiển thị ở cột của đội hưởng lợi bàn thắng
                      let isHome = event.teamId === match.homeTeamId;

                      if (isOG) {
                        if (match.awayScore === 0 && match.homeScore > 0) {
                          isHome = true;
                        } else if (match.homeScore === 0 && match.awayScore > 0) {
                          isHome = false;
                        } else {
                          const m1 = rawDesc.match(/own goal by [^,\.\(]+(?:,\s*|\s*\()([^,\.\)]+)/i);
                          const m2 = rawDesc.match(/([^\(\)]+)\s*\(([^,\.\)]+)\)\s*own goal/i);
                          const committerRaw = m1?.[1] || m2?.[2];

                          if (committerRaw) {
                            const c = committerRaw
                              .toLowerCase()
                              .normalize("NFD")
                              .replace(/[\u0300-\u036f]/g, "")
                              .replace(/\s*fc\s*|\s*afc\s*|\s*cf\s*|\s*sc\s*|\s*rc\s*|\s*ac\s*|\s*as\s*|\s*ss\s*|\s*1\.\s*|\s*vfb\s*/gi, "")
                              .trim();
                            const isCommitterHome =
                              (homeName && (c.includes(homeName) || homeName.includes(c))) ||
                              (homeShort && (c.includes(homeShort) || homeShort.includes(c)));
                            const isCommitterAway =
                              (awayName && (c.includes(awayName) || awayName.includes(c))) ||
                              (awayShort && (c.includes(awayShort) || awayShort.includes(c)));

                            if (isCommitterHome && !isCommitterAway) isHome = false;
                            if (isCommitterAway && !isCommitterHome) isHome = true;
                          } else if (event.player?.teamId) {
                            if (event.player.teamId === match.homeTeamId) isHome = false;
                            if (event.player.teamId === match.awayTeamId) isHome = true;
                          } else {
                            isHome = event.teamId !== match.homeTeamId;
                          }
                        }
                      }

                      const isGoal =
                        event.type === "GOAL" || isPen || isOG;
                      const isYellow = event.type === "YELLOW_CARD";
                      const isRed = event.type === "RED_CARD";

                      return (
                        <div
                          key={event.id}
                          className={cn(
                            "flex items-center gap-2.5 sm:gap-3.5 p-3 rounded-2xl border transition-all",
                            isHome
                              ? "bg-secondary/30 border-border/70 flex-row"
                              : "bg-secondary/30 border-border/70 flex-row-reverse text-right"
                          )}
                        >
                          {/* Phút thi đấu */}
                          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center font-mono font-black text-xs text-emerald-600 dark:text-emerald-400 flex-shrink-0 shadow-2xs">
                            {event.minute}&apos;
                          </div>

                          {/* Biểu tượng */}
                          <div className="text-lg sm:text-xl flex-shrink-0 flex items-center justify-center">
                            {isOG ? (
                              <div className="flex items-center gap-1">
                                <OwnGoalIcon className="w-5 h-5" />
                              </div>
                            ) : isPen ? (
                              "🎯"
                            ) : isGoal ? (
                              "⚽"
                            ) : isYellow ? (
                              "🟨"
                            ) : isRed ? (
                              "🟥"
                            ) : null}
                          </div>

                          {/* Chi tiết cầu thủ */}
                          <div
                            onClick={() => {
                              if (event.playerId && onSelectPlayer) {
                                onSelectPlayer(event.playerId);
                              }
                            }}
                            className={cn(
                              "flex-1 min-w-0 flex flex-col justify-center",
                              event.playerId ? "cursor-pointer group/player" : ""
                            )}
                          >
                            <div className={cn("flex items-center gap-1.5 flex-wrap", !isHome && "justify-end")}>
                              <span className="text-xs sm:text-sm font-black text-foreground group-hover/player:text-emerald-500 transition-colors">
                                {event.player?.name || "Cầu thủ"}
                              </span>

                              {isPen && (
                                <span className="text-[11px] sm:text-xs font-bold text-amber-500">
                                  (P)
                                </span>
                              )}

                              {isOG && (
                                <span className="text-[11px] sm:text-xs font-bold text-rose-500">
                                  (OG)
                                </span>
                              )}

                              {isGoal && !isOG && !isPen && event.assistPlayer && (
                                <span className="text-[11px] sm:text-xs font-semibold text-muted-foreground">
                                  ({event.assistPlayer.name})
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              )}

              {/* TAB 2: LINEUPS (Tactical Pitch Graphic, Starting XI, Subs, Bench) */}
              {activeTab === "lineup" && (
                <div className="space-y-5 sm:space-y-6">
                  {/* 1. Tactical Formation Header */}
                  {(() => {
                    const sortStarters = (list: MatchLineup[]) => {
                      const order: Record<string, number> = {
                        GOALKEEPER: 0,
                        DEFENDER: 1,
                        MIDFIELDER: 2,
                        FORWARD: 3,
                      };
                      return [...list].sort((a, b) => {
                        const pA = order[a.position] ?? 2;
                        const pB = order[b.position] ?? 2;
                        if (pA !== pB) return pA - pB;
                        return (a.gridY ?? 50) - (b.gridY ?? 50);
                      });
                    };

                    const homeStarters = sortStarters(
                      (match.lineups || []).filter(
                        (l) => l.isStarting && l.teamId === match.homeTeamId
                      )
                    );
                    const awayStarters = sortStarters(
                      (match.lineups || []).filter(
                        (l) => l.isStarting && l.teamId === match.awayTeamId
                      )
                    );
                    const homeBench = (match.lineups || []).filter(
                      (l) => !l.isStarting && l.teamId === match.homeTeamId
                    );
                    const awayBench = (match.lineups || []).filter(
                      (l) => !l.isStarting && l.teamId === match.awayTeamId
                    );
                    const substitutions = (match.events || []).filter(
                      (e) => e.type === "SUBSTITUTION"
                    );

                    const homeFormation =
                      homeStarters[0]?.formation || "4-3-3";
                    const awayFormation =
                      awayStarters[0]?.formation || "4-3-3";

                    // Helper tính toán các sự kiện của một cầu thủ (Bàn thắng, phản lưới, kiến tạo, thẻ phạt, thay người)
                    const getPlayerEvents = (playerId?: string | null, playerName?: string | null) => {
                      const events = match.events || [];
                      if (events.length === 0) {
                        return {
                          goals: [],
                          ownGoals: [],
                          assists: [],
                          yellowCards: [],
                          redCards: [],
                          subbedOut: null,
                          subbedIn: null,
                        };
                      }

                      const normalize = (s: string) =>
                        s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

                      const isMatch = (ePlayerId?: string | null, ePlayerName?: string | null) => {
                        if (playerId && ePlayerId && playerId === ePlayerId) return true;
                        if (playerName && ePlayerName) {
                          const p1 = normalize(playerName);
                          const p2 = normalize(ePlayerName);
                          return p1 === p2 || p1.includes(p2) || p2.includes(p1);
                        }
                        return false;
                      };

                      const isOwnGoalEvent = (e: MatchEvent) => {
                        if (e.type === "OWN_GOAL") return true;
                        if (e.description) {
                          const desc = e.description.toLowerCase();
                          return (
                            desc.includes("own goal") ||
                            desc.includes("phản lưới") ||
                            desc.includes("(og)") ||
                            desc.includes(" og") ||
                            desc.includes("og.") ||
                            desc.includes("og,")
                          );
                        }
                        return false;
                      };

                      // 1. Bàn thắng thông thường & penalty
                      const goals = events.filter(
                        (e) =>
                          (e.type === "GOAL" || e.type === "PENALTY_SCORED") &&
                          !isOwnGoalEvent(e) &&
                          isMatch(e.playerId, e.player?.name)
                      );

                      // 2. Bàn phản lưới nhà (Own Goal)
                      const ownGoals = events.filter(
                        (e) => isOwnGoalEvent(e) && isMatch(e.playerId, e.player?.name)
                      );

                      // 3. Kiến tạo (Assists)
                      const assists = events.filter(
                        (e) =>
                          (e.type === "GOAL" || e.type === "PENALTY_SCORED") &&
                          isMatch(e.assistPlayerId, e.assistPlayer?.name)
                      );

                      // 4. Thẻ vàng
                      const yellowCards = events.filter(
                        (e) => e.type === "YELLOW_CARD" && isMatch(e.playerId, e.player?.name)
                      );

                      // 5. Thẻ đỏ
                      const redCards = events.filter(
                        (e) =>
                          (e.type === "RED_CARD" || e.type === "YELLOW_TO_RED") &&
                          isMatch(e.playerId, e.player?.name)
                      );

                      // 6. Rời sân (Subbed Out) - Hỗ trợ cả assistPlayerId và phân tích description
                      const subbedOut = events.find((e) => {
                        if (e.type !== "SUBSTITUTION") return false;
                        if (isMatch(e.assistPlayerId, e.assistPlayer?.name)) return true;
                        if (playerName && e.description) {
                          const parts = e.description.split(/replaces/i);
                          if (parts.length > 1) {
                            const replacedName = parts[1].replace(/\.$/, "").trim();
                            if (isMatch(null, replacedName)) return true;
                          }
                        }
                        return false;
                      });

                      // 7. Vào sân (Subbed In) - Hỗ trợ cả playerId và phân tích description
                      const subbedIn = events.find((e) => {
                        if (e.type !== "SUBSTITUTION") return false;
                        if (isMatch(e.playerId, e.player?.name)) return true;
                        if (playerName && e.description) {
                          const parts = e.description.split(/replaces/i);
                          if (parts.length > 1) {
                            const dotParts = parts[0].split(".");
                            const inName = dotParts[dotParts.length - 1].replace(/Substitution,/i, "").trim();
                            if (isMatch(null, inName)) return true;
                          }
                        }
                        return false;
                      });

                      return {
                        goals,
                        ownGoals,
                        assists,
                        yellowCards,
                        redCards,
                        subbedOut,
                        subbedIn,
                      };
                    };

                    // Helper trích xuất tên người vào sân & người rời sân cho sự kiện thay người
                    const getSubNames = (sub: MatchEvent) => {
                      let inName = sub.player?.name;
                      let outName = sub.assistPlayer?.name;
                      if ((!inName || !outName) && sub.description) {
                        const parts = sub.description.split(/replaces/i);
                        if (parts.length > 1) {
                          if (!outName) {
                            outName = parts[1].replace(/\.$/, "").trim();
                          }
                          if (!inName) {
                            const dotParts = parts[0].split(".");
                            inName = dotParts[dotParts.length - 1].replace(/Substitution,/i, "").trim();
                          }
                        }
                      }
                      return {
                        inName: inName || "Vào sân",
                        outName: outName || "Rời sân",
                      };
                    };

                    // Helper render từng dòng cầu thủ trong danh sách Đội hình chính & Dự bị
                    const renderPlayerRow = (l: MatchLineup, isBench = false) => {
                      const pEvents = getPlayerEvents(l.playerId, l.player?.name);

                      return (
                        <div
                          key={l.id}
                          onClick={() => onSelectPlayer?.(l.playerId)}
                          className="flex items-center justify-between py-1.5 px-2 rounded-xl hover:bg-secondary/70 cursor-pointer transition-colors text-xs group"
                        >
                          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-wrap flex-1">
                            <span className="w-5 h-5 rounded-md bg-secondary/80 text-muted-foreground font-mono font-bold text-[10px] sm:text-[11px] flex items-center justify-center flex-shrink-0">
                              {l.jerseyNumber || l.player?.number || "•"}
                            </span>

                            <span className="font-bold text-foreground truncate group-hover:text-emerald-500 max-w-[130px] sm:max-w-[180px]">
                              {l.player?.name}
                            </span>

                            {/* Icon Bàn Thắng (Goals) */}
                            {pEvents.goals.length > 0 && (
                              <span
                                className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-black text-[10px] flex-shrink-0 shadow-2xs"
                                title={`Ghi ${pEvents.goals.length} bàn: ${pEvents.goals.map((g) => `${g.minute}'`).join(", ")}`}
                              >
                                ⚽{pEvents.goals.length > 1 ? `x${pEvents.goals.length}` : ""} {pEvents.goals.map((g) => `${g.minute}'`).join(", ")}
                              </span>
                            )}

                            {/* Icon Phản Lưới Nhà (Own Goals) */}
                            {pEvents.ownGoals.length > 0 && (
                              <span
                                className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-md bg-rose-500/15 border border-rose-500/35 text-rose-600 dark:text-rose-400 font-black text-[10px] flex-shrink-0 shadow-2xs"
                                title={`Phản lưới nhà (OG): ${pEvents.ownGoals.map((o) => `Phút ${o.minute}'`).join(", ")}`}
                              >
                                <OwnGoalIcon className="w-3 h-3" />
                                <span>(OG) {pEvents.ownGoals.map((o) => `${o.minute}'`).join(", ")}</span>
                              </span>
                            )}

                            {/* Icon Kiến Tạo (Assists) */}
                            {pEvents.assists.length > 0 && (
                              <span
                                className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-md bg-teal-500/10 border border-teal-500/30 text-teal-600 dark:text-teal-400 font-black text-[10px] flex-shrink-0 shadow-2xs"
                                title={`Kiến tạo ${pEvents.assists.length} lần: ${pEvents.assists.map((a) => `${a.minute}'`).join(", ")}`}
                              >
                                👟{pEvents.assists.length > 1 ? `x${pEvents.assists.length}` : ""} {pEvents.assists.map((a) => `${a.minute}'`).join(", ")}
                              </span>
                            )}

                            {/* Icon Thẻ Vàng (Yellow Cards) */}
                            {pEvents.yellowCards.length > 0 && (
                              <span
                                className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-amber-500/10 border border-amber-500/30 text-amber-500 font-bold text-[10px] flex-shrink-0 shadow-2xs"
                                title={`Thẻ vàng: ${pEvents.yellowCards.map((y) => `Phút ${y.minute}'`).join(", ")}`}
                              >
                                🟨 {pEvents.yellowCards.map((y) => `${y.minute}'`).join(", ")}
                              </span>
                            )}

                            {/* Icon Thẻ Đỏ (Red Cards) */}
                            {pEvents.redCards.length > 0 && (
                              <span
                                className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-rose-500/10 border border-rose-500/30 text-rose-500 font-bold text-[10px] flex-shrink-0 shadow-2xs"
                                title={`Thẻ đỏ: ${pEvents.redCards.map((r) => `Phút ${r.minute}'`).join(", ")}`}
                              >
                                🟥 {pEvents.redCards.map((r) => `${r.minute}'`).join(", ")}
                              </span>
                            )}

                            {/* Icon Rời Sân Cho Đội Hình Chính (Subbed Out) */}
                            {!isBench && pEvents.subbedOut && (
                              <span
                                className="inline-flex items-center gap-0.5 text-[9.5px] text-rose-500 font-bold bg-rose-500/10 border border-rose-500/25 px-1.5 py-0.2 rounded-full flex-shrink-0 whitespace-nowrap shadow-2xs"
                                title={`Rời sân phút ${pEvents.subbedOut.minute}'`}
                              >
                                🔄🔴 {pEvents.subbedOut.minute}&apos;
                              </span>
                            )}

                            {/* Icon Vào Sân Cho Ghế Dự Bị (Subbed In) */}
                            {isBench && pEvents.subbedIn && (
                              <span
                                className="inline-flex items-center gap-0.5 text-[9.5px] text-emerald-500 font-bold bg-emerald-500/10 border border-emerald-500/25 px-1.5 py-0.2 rounded-full flex-shrink-0 whitespace-nowrap shadow-2xs"
                                title={`Vào sân phút ${pEvents.subbedIn.minute}'`}
                              >
                                🔄🟢 Vào sân {pEvents.subbedIn.minute}&apos;
                              </span>
                            )}
                          </div>

                          <span className="text-[9px] sm:text-[10px] text-muted-foreground font-semibold flex-shrink-0 ml-1 uppercase bg-secondary/80 px-1.5 py-0.5 rounded-md border border-border/50">
                            {l.position}
                          </span>
                        </div>
                      );
                    };

                    return (
                      <>
                        {/* Tactical Pitch Graphic */}
                        <div className="space-y-2.5">
                          {/* Sơ đồ chiến thuật & Huấn luyện viên 2 đội - Card thông tin sang trọng */}
                          <div className="rounded-2xl border border-border/80 bg-card/60 backdrop-blur-md p-2.5 sm:p-3.5 shadow-sm space-y-2.5">
                            {/* Thanh điều khiển trên cùng: Tiêu đề & Nút xoay sân */}
                            <div className="flex items-center justify-between gap-2 border-b border-border/50 pb-2">
                              <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-muted-foreground">
                                <span>📋</span> Sơ đồ chiến thuật
                              </div>
                              <button
                                type="button"
                                onClick={() => setIsPitchVertical(!isPitchVertical)}
                                className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground text-xs font-bold border border-border/80 transition-all shadow-xs"
                                title="Chuyển đổi xoay dọc / xoay ngang"
                              >
                                <RotateCw className={cn("w-3.5 h-3.5 transition-transform text-emerald-500", !isPitchVertical && "rotate-90")} />
                                <span>{isPitchVertical ? "Sân Dọc" : "Sân Ngang"}</span>
                              </button>
                            </div>

                            {/* Thông tin 2 Đội & Huấn luyện viên - 2 Cột Đối Xứng Tuyệt Đẹp */}
                            <div className="grid grid-cols-2 gap-2 sm:gap-4">
                              {/* Đội Nhà */}
                              <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 bg-secondary/30 rounded-xl p-2 border border-red-500/20">
                                <img
                                  src={match.homeTeam.logo}
                                  alt={match.homeTeam.name}
                                  className="w-7 h-7 sm:w-8 sm:h-8 object-contain flex-shrink-0"
                                />
                                <div className="flex flex-col min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-red-500 dark:text-red-400 font-black text-xs sm:text-sm truncate">
                                      {match.homeTeam.shortName || match.homeTeam.name}
                                    </span>
                                    <span className="px-1.5 py-0.2 rounded bg-red-500/10 text-red-500 border border-red-500/30 text-[9px] sm:text-[10px] font-black flex-shrink-0">
                                      {homeFormation}
                                    </span>
                                  </div>
                                  <div className="text-[10px] sm:text-xs text-muted-foreground font-semibold truncate flex items-center gap-1 mt-0.5">
                                    <span className="text-emerald-500 font-bold">HLV:</span>
                                    <span className="text-foreground font-medium truncate">{match.homeTeam.coach || getClubManager(match.homeTeam.name)}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Đội Khách */}
                              <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 justify-end text-right bg-secondary/30 rounded-xl p-2 border border-blue-500/20">
                                <div className="flex flex-col min-w-0 items-end">
                                  <div className="flex items-center gap-1.5">
                                    <span className="px-1.5 py-0.2 rounded bg-blue-500/10 text-blue-500 border border-blue-500/30 text-[9px] sm:text-[10px] font-black flex-shrink-0">
                                      {awayFormation}
                                    </span>
                                    <span className="text-blue-500 dark:text-blue-400 font-black text-xs sm:text-sm truncate">
                                      {match.awayTeam.shortName || match.awayTeam.name}
                                    </span>
                                  </div>
                                  <div className="text-[10px] sm:text-xs text-muted-foreground font-semibold truncate flex items-center gap-1 mt-0.5">
                                    <span className="text-emerald-500 font-bold">HLV:</span>
                                    <span className="text-foreground font-medium truncate">{match.awayTeam.coach || getClubManager(match.awayTeam.name)}</span>
                                  </div>
                                </div>
                                <img
                                  src={match.awayTeam.logo}
                                  alt={match.awayTeam.name}
                                  className="w-7 h-7 sm:w-8 sm:h-8 object-contain flex-shrink-0"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Sân bóng cỏ xanh - Chế độ Xoay Dọc / Xoay Ngang To Đẹp Chuẩn Google */}
                          <div
                            className={cn(
                              "relative w-full rounded-2xl sm:rounded-3xl bg-gradient-to-b from-[#2d5a37] via-[#35683e] to-[#254b2e] border-2 border-emerald-500/50 p-2 sm:p-5 overflow-hidden shadow-2xl pitch-stripes transition-all duration-300",
                              isPitchVertical
                                ? "max-w-xl sm:max-w-2xl mx-auto min-h-[620px] sm:min-h-[780px] aspect-[9/13.5] sm:aspect-[9/13]"
                                : "aspect-[16/10] sm:aspect-[16/9]"
                            )}
                          >
                            {/* Pitch Inner Border */}
                            <div className="absolute inset-2 sm:inset-3 border-2 border-white/40 rounded-2xl pointer-events-none" />

                            {isPitchVertical ? (
                              <>
                                {/* Vertical Pitch Markings */}
                                <div className="absolute top-1/2 left-2 sm:left-3 right-2 sm:right-3 h-0.5 bg-white/40 -translate-y-1/2 pointer-events-none" />
                                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 sm:w-36 sm:h-36 border-2 border-white/40 rounded-full pointer-events-none" />
                                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-white/70 rounded-full pointer-events-none" />

                                {/* Top Goal Area (Away) */}
                                <div className="absolute top-2 sm:top-3 left-[20%] right-[20%] h-16 sm:h-24 border-b-2 border-l-2 border-r-2 border-white/40 rounded-b-2xl pointer-events-none" />
                                <div className="absolute top-2 sm:top-3 left-[34%] right-[34%] h-8 sm:h-12 border-b-2 border-l-2 border-r-2 border-white/40 rounded-b-xl pointer-events-none" />
                                <div className="absolute top-[18%] left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-white/60 rounded-full pointer-events-none" />

                                {/* Bottom Goal Area (Home) */}
                                <div className="absolute bottom-2 sm:bottom-3 left-[20%] right-[20%] h-16 sm:h-24 border-t-2 border-l-2 border-r-2 border-white/40 rounded-t-2xl pointer-events-none" />
                                <div className="absolute bottom-2 sm:bottom-3 left-[34%] right-[34%] h-8 sm:h-12 border-t-2 border-l-2 border-r-2 border-white/40 rounded-t-xl pointer-events-none" />
                                <div className="absolute bottom-[18%] left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-white/60 rounded-full pointer-events-none" />
                              </>
                            ) : (
                              <>
                                {/* Horizontal Pitch Markings */}
                                <div className="absolute left-1/2 top-2 sm:top-3 bottom-2 sm:bottom-3 w-0.5 bg-white/40 -translate-x-1/2 pointer-events-none" />
                                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 sm:w-36 sm:h-36 border-2 border-white/40 rounded-full pointer-events-none" />
                                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-white/70 rounded-full pointer-events-none" />

                                {/* Left / Right Goal Boxes */}
                                <div className="absolute left-2 sm:left-3 top-1/4 bottom-1/4 w-10 sm:w-20 border-r-2 border-t-2 border-b-2 border-white/40 rounded-r-2xl pointer-events-none" />
                                <div className="absolute right-2 sm:right-3 top-1/4 bottom-1/4 w-10 sm:w-20 border-l-2 border-t-2 border-b-2 border-white/40 rounded-l-2xl pointer-events-none" />
                              </>
                            )}

                            {/* Players on Pitch */}
                            {(() => {
                              const startingLineups = (match.lineups || []).filter((l) => l.isStarting);
                              if (startingLineups.length === 0) return null;

                              const homeStarters = startingLineups.filter((l) => l.teamId === match.homeTeamId);
                              const awayStarters = startingLineups.filter((l) => l.teamId === match.awayTeamId);

                              const homeFormation = homeStarters[0]?.formation || "4-3-3";
                              const awayFormation = awayStarters[0]?.formation || "4-3-3";

                              const homeCalculated = calculateTacticalFormationPositions(
                                homeStarters.map((l) => ({
                                  id: l.playerId,
                                  name: l.player?.name || "",
                                  posAbbr: l.position,
                                  posName: l.position,
                                })),
                                homeFormation,
                                true
                              );

                              const awayCalculated = calculateTacticalFormationPositions(
                                awayStarters.map((l) => ({
                                  id: l.playerId,
                                  name: l.player?.name || "",
                                  posAbbr: l.position,
                                  posName: l.position,
                                })),
                                awayFormation,
                                false
                              );

                              const coordsMap: Record<string, { x: number; y: number }> = {};
                              homeStarters.forEach((l, idx) => {
                                coordsMap[l.id] = (l.gridX !== undefined && l.gridX !== null && l.gridX > 0)
                                  ? { x: l.gridX, y: l.gridY ?? 50 }
                                  : (homeCalculated[idx] || { x: 20, y: 50 });
                              });
                              awayStarters.forEach((l, idx) => {
                                coordsMap[l.id] = (l.gridX !== undefined && l.gridX !== null && l.gridX > 0)
                                  ? { x: l.gridX, y: l.gridY ?? 50 }
                                  : (awayCalculated[idx] || { x: 80, y: 50 });
                              });

                              return startingLineups.map((lineup: MatchLineup) => {
                                const isHome = lineup.teamId === match.homeTeamId;
                                const coord = coordsMap[lineup.id] || { x: 50, y: 50 };
                                const rawX = coord.x;
                                const rawY = coord.y;

                                  // Tính toán vị trí Dọc (Vertical) hoặc Ngang (Horizontal) chuẩn Sofascore/Google Sports
                                  let posX = rawX;
                                  let posY = rawY;

                                  if (isPitchVertical) {
                                    posX = rawY; // Cánh trái (LB/LW) luôn ở bên trái (15..22%), Cánh phải (RB/RW) luôn ở bên phải (78..85%)
                                    posY = 100 - rawX; // Đội nhà ở nửa dưới (93% -> 56%), Đội khách ở nửa trên (7% -> 44%)
                                  }

                                  const pEvents = getPlayerEvents(lineup.playerId, lineup.player?.name);
                                  const goalsCount = pEvents.goals.length;
                                  const ownGoalsCount = pEvents.ownGoals.length;
                                  const assistsCount = pEvents.assists.length;
                                  const hasYellow = pEvents.yellowCards.length > 0;
                                  const hasRed = pEvents.redCards.length > 0;
                                  const subbedOut = pEvents.subbedOut;

                                  // Tính điểm số Rating mô phỏng thực tế
                                  let ratingNum = 6.6;
                                  if (goalsCount > 0) ratingNum += goalsCount * 1.1;
                                  if (ownGoalsCount > 0) ratingNum -= ownGoalsCount * 1.2;
                                  if (assistsCount > 0) ratingNum += assistsCount * 0.7;
                                  if (hasYellow) ratingNum -= 0.4;
                                  if (hasRed) ratingNum -= 1.8;
                                  if (isHome && match.homeScore > match.awayScore) ratingNum += 0.5;
                                  if (!isHome && match.awayScore > match.homeScore) ratingNum += 0.5;
                                  const rating = Math.min(9.8, Math.max(5.1, ratingNum)).toFixed(1);

                                  return (
                                    <div
                                      key={lineup.id}
                                      onClick={() => onSelectPlayer?.(lineup.playerId)}
                                      style={{
                                        left: `${posX}%`,
                                        top: `${posY}%`,
                                      }}
                                      className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group cursor-pointer z-10 select-none"
                                      title={
                                        subbedOut
                                          ? `${lineup.player?.name} ➔ Rời sân phút ${subbedOut.minute}'`
                                          : lineup.player?.name
                                      }
                                    >
                                      {/* Portrait Avatar / Jersey Circle with Badges */}
                                      <div className="relative">
                                        {/* Subbed Out Badge (Top Left Red Pill) */}
                                        {subbedOut && (
                                          <div
                                            className="absolute -top-1.5 -left-2 px-1.5 py-0.2 rounded-full bg-rose-600 border border-white flex items-center justify-center text-[7.5px] sm:text-[9px] text-white shadow-md z-20 font-black gap-0.5"
                                            title={`Rời sân phút ${subbedOut.minute}'`}
                                          >
                                            <span>🔄</span>
                                            <span>{subbedOut.minute}&apos;</span>
                                          </div>
                                        )}

                                        {/* Card Badge (Top Right Yellow / Red Card) */}
                                        {hasRed ? (
                                          <div
                                            className="absolute -top-1 -right-1 w-3 h-4 bg-rose-600 border border-white rounded-[2px] shadow-md z-20"
                                            title="Thẻ đỏ"
                                          />
                                        ) : hasYellow ? (
                                          <div
                                            className="absolute -top-1 -right-1 w-3 h-4 bg-amber-400 border border-black/30 rounded-[2px] shadow-md z-20"
                                            title="Thẻ vàng"
                                          />
                                        ) : null}

                                        {/* Avatar Frame */}
                                        <div
                                          className={cn(
                                            "w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl flex items-center justify-center font-black text-xs sm:text-sm text-white border-2 shadow-xl overflow-hidden transition-transform duration-200 group-hover:scale-115 relative",
                                            isHome
                                              ? "bg-gradient-to-br from-red-600 to-red-900 border-white/80 shadow-red-950/60"
                                              : "bg-gradient-to-br from-blue-600 to-blue-900 border-white/80 shadow-blue-950/60"
                                          )}
                                        >
                                          {lineup.player?.avatar ? (
                                            <img
                                              src={lineup.player.avatar}
                                              alt={lineup.player.name}
                                              className="w-full h-full object-cover"
                                            />
                                          ) : (
                                            <div className="flex flex-col items-center justify-center">
                                              <span className="font-mono font-black text-[11px] sm:text-xs">
                                                {lineup.jerseyNumber || lineup.player?.number || "•"}
                                              </span>
                                            </div>
                                          )}
                                        </div>

                                        {/* Goal Badge (Bottom Left of Avatar) */}
                                        {goalsCount > 0 && (
                                          <div
                                            className="absolute -bottom-1 -left-2 flex items-center bg-black/90 border border-white/40 rounded-full px-1 py-0.2 text-[8px] sm:text-[9.5px] font-black text-white shadow-md z-20"
                                            title={`Ghi ${goalsCount} bàn`}
                                          >
                                            ⚽{goalsCount > 1 ? goalsCount : ""}
                                          </div>
                                        )}

                                        {/* Own Goal Badge (Bottom Left - Quả bóng màu đỏ nổi bật) */}
                                        {ownGoalsCount > 0 && (
                                          <div
                                            className="absolute -bottom-1 -left-2 flex items-center gap-0.5 bg-gradient-to-r from-rose-700 to-rose-900 border border-white rounded-full px-1.5 py-0.2 text-[8px] sm:text-[9px] font-black text-white shadow-md z-20"
                                            title={`Phản lưới nhà (${ownGoalsCount})`}
                                          >
                                            <OwnGoalIcon className="w-2.5 h-2.5" />
                                            <span>OG</span>
                                          </div>
                                        )}

                                        {/* Assist Badge (Bottom Right of Avatar) */}
                                        {assistsCount > 0 && (
                                          <div
                                            className="absolute -bottom-1 -right-2 flex items-center bg-teal-800/90 border border-white/40 rounded-full px-1 py-0.2 text-[8px] sm:text-[9.5px] font-black text-white shadow-md z-20"
                                            title={`Kiến tạo ${assistsCount} lần`}
                                          >
                                            👟{assistsCount > 1 ? assistsCount : ""}
                                          </div>
                                        )}

                                        {/* Rating Pill (Bottom Center) */}
                                        <div
                                          className={cn(
                                            "absolute -bottom-1.5 left-1/2 -translate-x-1/2 px-1.5 py-0.2 rounded-full text-[8.5px] sm:text-[10px] font-black shadow-md border border-black/30 z-20 whitespace-nowrap",
                                            parseFloat(rating) >= 7.5
                                              ? "bg-emerald-500 text-white"
                                              : parseFloat(rating) >= 6.5
                                                ? "bg-emerald-600 text-white"
                                                : parseFloat(rating) >= 6.0
                                                  ? "bg-amber-400 text-slate-950"
                                                  : "bg-rose-500 text-white"
                                          )}
                                        >
                                          {rating}
                                        </div>
                                      </div>

                                      {/* Player Name Text (Number + Short Name) */}
                                      <div className="mt-2 flex flex-col items-center">
                                        <span className="text-white text-[8.5px] sm:text-[11px] font-extrabold drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] max-w-[70px] sm:max-w-[110px] truncate text-center tracking-tight group-hover:text-emerald-300">
                                          {lineup.jerseyNumber || lineup.player?.number}{" "}
                                          {lineup.player?.shortName || lineup.player?.name}
                                        </span>

                                        {/* Badges / Subbed Info Under Name */}
                                        <div className="flex items-center gap-1 flex-wrap justify-center mt-0.5 max-w-[90px] sm:max-w-[130px]">
                                          {goalsCount > 0 && (
                                            <span className="text-[7px] sm:text-[8px] text-emerald-300 font-black bg-black/85 px-1 py-0.2 rounded shadow-xs">
                                              ⚽ {pEvents.goals.map((g) => `${g.minute}'`).join(", ")}
                                            </span>
                                          )}
                                          {ownGoalsCount > 0 && (
                                            <span className="text-[7.5px] sm:text-[8.5px] text-rose-100 font-black bg-rose-950/90 border border-rose-500/70 px-1.5 py-0.5 rounded shadow-xs flex items-center gap-1">
                                              <OwnGoalIcon className="w-2.5 h-2.5" />
                                              <span>(OG) {pEvents.ownGoals.map((o) => `${o.minute}'`).join(", ")}</span>
                                            </span>
                                          )}
                                          {assistsCount > 0 && (
                                            <span className="text-[7px] sm:text-[8px] text-cyan-300 font-black bg-black/85 px-1 py-0.2 rounded shadow-xs">
                                              👟 {pEvents.assists.map((a) => `${a.minute}'`).join(", ")}
                                            </span>
                                          )}
                                          {subbedOut && (
                                            <span className="text-[7px] sm:text-[8px] text-rose-300 font-bold bg-black/85 px-1 py-0.2 rounded shadow-xs flex items-center gap-0.5">
                                              🔄🔴 {subbedOut.minute}&apos;
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                });
                            })() || (
                              <div className="absolute inset-0 flex items-center justify-center text-white/80 text-xs sm:text-sm font-bold text-center px-4">
                                Đội hình xuất phát sẽ được cập nhật trước giờ bóng lăn 45 phút.
                              </div>
                            )}
                          </div>
                        </div>

                        {/* 2. Đội Hình Xuất Phát (Starting XI) - Card Đôi Sang Trọng */}
                        <div className="rounded-2xl border border-border/80 p-3.5 sm:p-5 bg-card/60 backdrop-blur-md space-y-3.5">
                          <h4 className="font-black text-xs sm:text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                            <span>🌟</span> Đội Hình Xuất Phát (Starting XI)
                          </h4>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-5">
                            {/* Home Starting XI Card */}
                            <div className="rounded-2xl border border-red-500/25 bg-secondary/20 p-3 sm:p-4 space-y-2.5 flex flex-col justify-between">
                              <div className="space-y-2">
                                <div className="flex items-center justify-between pb-2 border-b border-red-500/20">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <img src={match.homeTeam.logo} alt={match.homeTeam.name} className="w-5 h-5 sm:w-6 sm:h-6 object-contain flex-shrink-0" />
                                    <span className="font-black text-xs sm:text-sm text-red-500 dark:text-red-400 truncate">{match.homeTeam.name}</span>
                                  </div>
                                  <span className="px-1.5 py-0.2 rounded bg-red-500/10 text-red-500 border border-red-500/30 text-[9.5px] font-black flex-shrink-0">
                                    {homeFormation}
                                  </span>
                                </div>

                                <div className="space-y-1">
                                  {homeStarters.map((l) => renderPlayerRow(l, false))}
                                </div>
                              </div>

                              {/* Home Coach Card Footer */}
                              <div className="pt-2.5 mt-2 border-t border-red-500/20 bg-card/60 rounded-xl p-2.5 flex items-center justify-between shadow-xs">
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-semibold">
                                  <span>👔</span>
                                  <span>Huấn luyện viên:</span>
                                </div>
                                <span className="text-foreground font-black text-xs sm:text-sm truncate ml-2">
                                  {match.homeTeam.coach || getClubManager(match.homeTeam.name)}
                                </span>
                              </div>
                            </div>

                            {/* Away Starting XI Card */}
                            <div className="rounded-2xl border border-blue-500/25 bg-secondary/20 p-3 sm:p-4 space-y-2.5 flex flex-col justify-between">
                              <div className="space-y-2">
                                <div className="flex items-center justify-between pb-2 border-b border-blue-500/20">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <img src={match.awayTeam.logo} alt={match.awayTeam.name} className="w-5 h-5 sm:w-6 sm:h-6 object-contain flex-shrink-0" />
                                    <span className="font-black text-xs sm:text-sm text-blue-500 dark:text-blue-400 truncate">{match.awayTeam.name}</span>
                                  </div>
                                  <span className="px-1.5 py-0.2 rounded bg-blue-500/10 text-blue-500 border border-blue-500/30 text-[9.5px] font-black flex-shrink-0">
                                    {awayFormation}
                                  </span>
                                </div>

                                <div className="space-y-1">
                                  {awayStarters.map((l) => renderPlayerRow(l, false))}
                                </div>
                              </div>

                              {/* Away Coach Card Footer */}
                              <div className="pt-2.5 mt-2 border-t border-blue-500/20 bg-card/60 rounded-xl p-2.5 flex items-center justify-between shadow-xs">
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-semibold">
                                  <span>👔</span>
                                  <span>Huấn luyện viên:</span>
                                </div>
                                <span className="text-foreground font-black text-xs sm:text-sm truncate ml-2">
                                  {match.awayTeam.coach || getClubManager(match.awayTeam.name)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* 3. Thay Người Trong Trận (Substitutions) */}
                        {(() => {
                          const homeSubs = substitutions.filter(
                            (s) => s.teamId === match.homeTeamId
                          );
                          const awaySubs = substitutions.filter(
                            (s) => s.teamId === match.awayTeamId
                          );

                          if (homeSubs.length === 0 && awaySubs.length === 0) return null;

                          return (
                            <div className="rounded-2xl border border-border/80 p-3.5 sm:p-5 bg-card/60 backdrop-blur-md space-y-3.5">
                              <h4 className="font-black text-xs sm:text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                <span>🔄</span> Lượt Thay Người Trong Trận (Substitutions)
                              </h4>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-5">
                                {/* Home Substitutions Card */}
                                <div className="rounded-2xl border border-red-500/25 bg-secondary/20 p-3 sm:p-4 space-y-2.5">
                                  <div className="flex items-center gap-2 pb-2 border-b border-red-500/20">
                                    <img src={match.homeTeam.logo} alt={match.homeTeam.name} className="w-5 h-5 sm:w-6 sm:h-6 object-contain flex-shrink-0" />
                                    <span className="font-black text-xs sm:text-sm text-red-500 dark:text-red-400 truncate">{match.homeTeam.name}</span>
                                  </div>
                                  <div className="space-y-2">
                                    {homeSubs.length > 0 ? (
                                      homeSubs.map((sub) => {
                                        const subNames = getSubNames(sub);
                                        return (
                                          <div
                                            key={sub.id}
                                            className="flex items-center gap-2 p-2 rounded-xl bg-card/70 border border-border/70 text-xs shadow-xs"
                                          >
                                            <span className="font-mono font-black text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/25 text-[11px] flex-shrink-0">
                                              {sub.minute}&apos;
                                            </span>
                                            <div className="flex-1 min-w-0 flex items-center gap-1.5 flex-wrap">
                                              <span className="text-emerald-500 font-bold flex items-center gap-1">
                                                🔄🟢 {subNames.inName}
                                              </span>
                                              <span className="text-muted-foreground text-[10px]">➔</span>
                                              <span className="text-rose-500 font-bold flex items-center gap-1">
                                                🔴 {subNames.outName}
                                              </span>
                                            </div>
                                          </div>
                                        );
                                      })
                                    ) : (
                                      <p className="text-xs text-muted-foreground italic px-2 py-1">Không có lượt thay người</p>
                                    )}
                                  </div>
                                </div>

                                {/* Away Substitutions Card */}
                                <div className="rounded-2xl border border-blue-500/25 bg-secondary/20 p-3 sm:p-4 space-y-2.5">
                                  <div className="flex items-center gap-2 pb-2 border-b border-blue-500/20">
                                    <img src={match.awayTeam.logo} alt={match.awayTeam.name} className="w-5 h-5 sm:w-6 sm:h-6 object-contain flex-shrink-0" />
                                    <span className="font-black text-xs sm:text-sm text-blue-500 dark:text-blue-400 truncate">{match.awayTeam.name}</span>
                                  </div>
                                  <div className="space-y-2">
                                    {awaySubs.length > 0 ? (
                                      awaySubs.map((sub) => {
                                        const subNames = getSubNames(sub);
                                        return (
                                          <div
                                            key={sub.id}
                                            className="flex items-center gap-2 p-2 rounded-xl bg-card/70 border border-border/70 text-xs shadow-xs"
                                          >
                                            <span className="font-mono font-black text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/25 text-[11px] flex-shrink-0">
                                              {sub.minute}&apos;
                                            </span>
                                            <div className="flex-1 min-w-0 flex items-center gap-1.5 flex-wrap">
                                              <span className="text-emerald-500 font-bold flex items-center gap-1">
                                                🔄🟢 {subNames.inName}
                                              </span>
                                              <span className="text-muted-foreground text-[10px]">➔</span>
                                              <span className="text-rose-500 font-bold flex items-center gap-1">
                                                🔴 {subNames.outName}
                                              </span>
                                            </div>
                                          </div>
                                        );
                                      })
                                    ) : (
                                      <p className="text-xs text-muted-foreground italic px-2 py-1">Không có lượt thay người</p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })()}

                        {/* 4. Băng Ghế Dự Bị (Bench / Substitutes) */}
                        <div className="rounded-2xl border border-border/80 p-3.5 sm:p-5 bg-card/60 backdrop-blur-md space-y-3.5">
                          <h4 className="font-black text-xs sm:text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                            <span>💺</span> Băng Ghế Dự Bị (Substitutes)
                          </h4>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-5">
                            {/* Home Bench Card */}
                            <div className="rounded-2xl border border-red-500/25 bg-secondary/20 p-3 sm:p-4 space-y-2">
                              <div className="flex items-center gap-2 pb-2 border-b border-red-500/20">
                                <img src={match.homeTeam.logo} alt={match.homeTeam.name} className="w-5 h-5 sm:w-6 sm:h-6 object-contain flex-shrink-0" />
                                <span className="font-black text-xs sm:text-sm text-red-500 dark:text-red-400 truncate">{match.homeTeam.name}</span>
                              </div>
                              <div className="space-y-1">
                                {homeBench.length > 0 ? (
                                  homeBench.map((l) => renderPlayerRow(l, true))
                                ) : (
                                  <p className="text-xs text-muted-foreground italic px-2 py-1">Đang cập nhật...</p>
                                )}
                              </div>
                            </div>

                            {/* Away Bench Card */}
                            <div className="rounded-2xl border border-blue-500/25 bg-secondary/20 p-3 sm:p-4 space-y-2">
                              <div className="flex items-center gap-2 pb-2 border-b border-blue-500/20">
                                <img src={match.awayTeam.logo} alt={match.awayTeam.name} className="w-5 h-5 sm:w-6 sm:h-6 object-contain flex-shrink-0" />
                                <span className="font-black text-xs sm:text-sm text-blue-500 dark:text-blue-400 truncate">{match.awayTeam.name}</span>
                              </div>
                              <div className="space-y-1">
                                {awayBench.length > 0 ? (
                                  awayBench.map((l) => renderPlayerRow(l, true))
                                ) : (
                                  <p className="text-xs text-muted-foreground italic px-2 py-1">Đang cập nhật...</p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* 5. Chú Thích Biểu Tượng (Legend) */}
                        <div className="rounded-2xl border border-border/70 bg-card/40 p-3 flex flex-wrap items-center justify-center gap-3 sm:gap-5 text-[10.5px] sm:text-xs text-muted-foreground font-semibold">
                          <span className="flex items-center gap-1.5">
                            <span>⚽</span> Bàn thắng
                          </span>
                          <span className="flex items-center gap-1.5">
                            <OwnGoalIcon className="w-3.5 h-3.5" />
                            <span className="text-rose-500 font-bold">Phản lưới (OG)</span>
                          </span>
                          <span className="flex items-center gap-1.5">
                            <span>👟</span> Kiến tạo
                          </span>
                          <span className="flex items-center gap-1.5">
                            <span>🟨</span> Thẻ vàng
                          </span>
                          <span className="flex items-center gap-1.5">
                            <span>🟥</span> Thẻ đỏ
                          </span>
                          <span className="flex items-center gap-1.5">
                            <span className="text-emerald-500 font-bold">🔄🟢</span> Vào sân
                          </span>
                          <span className="flex items-center gap-1.5">
                            <span className="text-rose-500 font-bold">🔄🔴</span> Rời sân
                          </span>
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}

              {/* TAB 3: MATCH STATS - Chuẩn Google Sports & Sofascore */}
              {activeTab === "stats" && (
                <div className="space-y-4">
                  {match.stats ? (
                    <div className="rounded-2xl border border-border/80 bg-card/60 backdrop-blur-md p-4 sm:p-6 shadow-sm max-w-xl mx-auto space-y-4">
                      {/* Header Thống Kê (100% Căn giữa hoàn hảo) */}
                      <div className="flex items-center justify-between pb-3 border-b border-border/60">
                        {/* Left: Home Team */}
                        <div className="flex-1 flex items-center justify-start gap-2 min-w-0">
                          <img
                            src={match.homeTeam.logo}
                            alt={match.homeTeam.name}
                            className="w-7 h-7 sm:w-8 sm:h-8 object-contain shrink-0"
                          />
                          <span className="font-black text-xs sm:text-sm text-red-500 truncate">
                            {match.homeTeam.shortName || match.homeTeam.name}
                          </span>
                        </div>

                        {/* Center: Title (Luôn ở chính giữa tuyệt đối) */}
                        <h4 className="shrink-0 px-2 font-black text-xs sm:text-sm uppercase tracking-wider text-foreground text-center">
                          THỐNG KÊ
                        </h4>

                        {/* Right: Away Team */}
                        <div className="flex-1 flex items-center justify-end gap-2 min-w-0">
                          <span className="font-black text-xs sm:text-sm text-blue-500 truncate text-right">
                            {match.awayTeam.shortName || match.awayTeam.name}
                          </span>
                          <img
                            src={match.awayTeam.logo}
                            alt={match.awayTeam.name}
                            className="w-7 h-7 sm:w-8 sm:h-8 object-contain shrink-0"
                          />
                        </div>
                      </div>

                      {/* 10 Chỉ Số Thống Kê Chuẩn Xác */}
                      <div className="divide-y divide-border/30 space-y-0.5">
                        {/* 1. Số lần sút */}
                        <div className="flex items-center justify-between py-2 sm:py-2.5">
                          <div className="w-14 sm:w-16 flex justify-start">
                            <span className={cn("text-xs sm:text-sm font-black px-2.5 py-0.5 rounded-full", match.stats.shotsHome > match.stats.shotsAway ? "bg-red-600 text-white" : "text-foreground")}>
                              {match.stats.shotsHome}
                            </span>
                          </div>
                          <span className="text-xs sm:text-sm font-semibold text-muted-foreground text-center flex-1">
                            Số lần sút
                          </span>
                          <div className="w-14 sm:w-16 flex justify-end">
                            <span className={cn("text-xs sm:text-sm font-black px-2.5 py-0.5 rounded-full", match.stats.shotsAway > match.stats.shotsHome ? "bg-blue-600 text-white" : "text-foreground")}>
                              {match.stats.shotsAway}
                            </span>
                          </div>
                        </div>

                        {/* 2. Sút trúng đích */}
                        <div className="flex items-center justify-between py-2 sm:py-2.5">
                          <div className="w-14 sm:w-16 flex justify-start">
                            <span className={cn("text-xs sm:text-sm font-black px-2.5 py-0.5 rounded-full", match.stats.shotsOnTargetHome > match.stats.shotsOnTargetAway ? "bg-red-600 text-white" : "text-foreground")}>
                              {match.stats.shotsOnTargetHome}
                            </span>
                          </div>
                          <span className="text-xs sm:text-sm font-semibold text-muted-foreground text-center flex-1">
                            Sút trúng đích
                          </span>
                          <div className="w-14 sm:w-16 flex justify-end">
                            <span className={cn("text-xs sm:text-sm font-black px-2.5 py-0.5 rounded-full", match.stats.shotsOnTargetAway > match.stats.shotsOnTargetHome ? "bg-blue-600 text-white" : "text-foreground")}>
                              {match.stats.shotsOnTargetAway}
                            </span>
                          </div>
                        </div>

                        {/* 3. Cơ hội lớn tạo ra */}
                        <div className="flex items-center justify-between py-2 sm:py-2.5">
                          <div className="w-14 sm:w-16 flex justify-start">
                            <span className={cn("text-xs sm:text-sm font-black px-2.5 py-0.5 rounded-full", (match.stats.bigChancesHome ?? 0) > (match.stats.bigChancesAway ?? 0) ? "bg-red-600 text-white" : "text-foreground")}>
                              {match.stats.bigChancesHome ?? 0}
                            </span>
                          </div>
                          <span className="text-xs sm:text-sm font-semibold text-muted-foreground text-center flex-1">
                            Cơ hội lớn tạo ra
                          </span>
                          <div className="w-14 sm:w-16 flex justify-end">
                            <span className={cn("text-xs sm:text-sm font-black px-2.5 py-0.5 rounded-full", (match.stats.bigChancesAway ?? 0) > (match.stats.bigChancesHome ?? 0) ? "bg-blue-600 text-white" : "text-foreground")}>
                              {match.stats.bigChancesAway ?? 0}
                            </span>
                          </div>
                        </div>

                        {/* 4. Cơ hội lớn bỏ lỡ */}
                        <div className="flex items-center justify-between py-2 sm:py-2.5">
                          <div className="w-14 sm:w-16 flex justify-start">
                            <span className={cn("text-xs sm:text-sm font-black px-2.5 py-0.5 rounded-full", (match.stats.bigChancesMissedHome ?? 0) > (match.stats.bigChancesMissedAway ?? 0) ? "bg-red-600 text-white" : "text-foreground")}>
                              {match.stats.bigChancesMissedHome ?? 0}
                            </span>
                          </div>
                          <span className="text-xs sm:text-sm font-semibold text-muted-foreground text-center flex-1">
                            Cơ hội lớn bỏ lỡ
                          </span>
                          <div className="w-14 sm:w-16 flex justify-end">
                            <span className={cn("text-xs sm:text-sm font-black px-2.5 py-0.5 rounded-full", (match.stats.bigChancesMissedAway ?? 0) > (match.stats.bigChancesMissedHome ?? 0) ? "bg-blue-600 text-white" : "text-foreground")}>
                              {match.stats.bigChancesMissedAway ?? 0}
                            </span>
                          </div>
                        </div>

                        {/* 5. Kiểm soát bóng */}
                        <div className="flex items-center justify-between py-2 sm:py-2.5">
                          <div className="w-14 sm:w-16 flex justify-start">
                            <span className={cn("text-xs sm:text-sm font-black px-2 py-0.5 rounded-full", match.stats.possessionHome > match.stats.possessionAway ? "bg-red-600 text-white" : "text-foreground")}>
                              {match.stats.possessionHome}%
                            </span>
                          </div>
                          <span className="text-xs sm:text-sm font-semibold text-muted-foreground text-center flex-1">
                            Kiểm soát bóng
                          </span>
                          <div className="w-14 sm:w-16 flex justify-end">
                            <span className={cn("text-xs sm:text-sm font-black px-2 py-0.5 rounded-full", match.stats.possessionAway > match.stats.possessionHome ? "bg-blue-600 text-white" : "text-foreground")}>
                              {match.stats.possessionAway}%
                            </span>
                          </div>
                        </div>

                        {/* 4. Lượt chuyền bóng */}
                        <div className="flex items-center justify-between py-2 sm:py-2.5">
                          <div className="w-14 sm:w-16 flex justify-start">
                            <span className={cn("text-xs sm:text-sm font-black px-2 py-0.5 rounded-full", match.stats.passesHome > match.stats.passesAway ? "bg-red-600 text-white" : "text-foreground")}>
                              {match.stats.passesHome}
                            </span>
                          </div>
                          <span className="text-xs sm:text-sm font-semibold text-muted-foreground text-center flex-1">
                            Lượt chuyền bóng
                          </span>
                          <div className="w-14 sm:w-16 flex justify-end">
                            <span className={cn("text-xs sm:text-sm font-black px-2 py-0.5 rounded-full", match.stats.passesAway > match.stats.passesHome ? "bg-blue-600 text-white" : "text-foreground")}>
                              {match.stats.passesAway}
                            </span>
                          </div>
                        </div>

                        {/* 5. Tỷ lệ chuyền bóng chính xác */}
                        <div className="flex items-center justify-between py-2 sm:py-2.5">
                          <div className="w-14 sm:w-16 flex justify-start">
                            <span className={cn("text-xs sm:text-sm font-black px-2 py-0.5 rounded-full", match.stats.passAccuracyHome > match.stats.passAccuracyAway ? "bg-red-600 text-white" : "text-foreground")}>
                              {match.stats.passAccuracyHome}%
                            </span>
                          </div>
                          <span className="text-xs sm:text-sm font-semibold text-muted-foreground text-center flex-1">
                            Tỷ lệ chuyền bóng chính xác
                          </span>
                          <div className="w-14 sm:w-16 flex justify-end">
                            <span className={cn("text-xs sm:text-sm font-black px-2 py-0.5 rounded-full", match.stats.passAccuracyAway > match.stats.passAccuracyHome ? "bg-blue-600 text-white" : "text-foreground")}>
                              {match.stats.passAccuracyAway}%
                            </span>
                          </div>
                        </div>

                        {/* 6. Phạm lỗi */}
                        <div className="flex items-center justify-between py-2 sm:py-2.5">
                          <div className="w-14 sm:w-16 flex justify-start">
                            <span className={cn("text-xs sm:text-sm font-black px-2.5 py-0.5 rounded-full", match.stats.foulsHome > 0 ? "bg-red-600 text-white" : "text-foreground")}>
                              {match.stats.foulsHome}
                            </span>
                          </div>
                          <span className="text-xs sm:text-sm font-semibold text-muted-foreground text-center flex-1">
                            Phạm lỗi
                          </span>
                          <div className="w-14 sm:w-16 flex justify-end">
                            <span className="text-xs sm:text-sm font-black px-2.5 py-0.5 rounded-full text-foreground">
                              {match.stats.foulsAway}
                            </span>
                          </div>
                        </div>

                        {/* 7. Thẻ vàng */}
                        <div className="flex items-center justify-between py-2 sm:py-2.5">
                          <div className="w-14 sm:w-16 flex justify-start">
                            <span className={cn("text-xs sm:text-sm font-black px-2.5 py-0.5 rounded-full", match.stats.yellowCardsHome > 0 ? "bg-red-600 text-white" : "text-foreground")}>
                              {match.stats.yellowCardsHome}
                            </span>
                          </div>
                          <span className="text-xs sm:text-sm font-semibold text-muted-foreground text-center flex-1">
                            Thẻ vàng
                          </span>
                          <div className="w-14 sm:w-16 flex justify-end">
                            <span className="text-xs sm:text-sm font-black px-2.5 py-0.5 rounded-full text-foreground">
                              {match.stats.yellowCardsAway}
                            </span>
                          </div>
                        </div>

                        {/* 8. Thẻ đỏ */}
                        <div className="flex items-center justify-between py-2 sm:py-2.5">
                          <div className="w-14 sm:w-16 flex justify-start">
                            <span className="text-xs sm:text-sm font-black px-2.5 py-0.5 rounded-full text-foreground">
                              {match.stats.redCardsHome}
                            </span>
                          </div>
                          <span className="text-xs sm:text-sm font-semibold text-muted-foreground text-center flex-1">
                            Thẻ đỏ
                          </span>
                          <div className="w-14 sm:w-16 flex justify-end">
                            <span className="text-xs sm:text-sm font-black px-2.5 py-0.5 rounded-full text-foreground">
                              {match.stats.redCardsAway}
                            </span>
                          </div>
                        </div>

                        {/* 9. Việt vị */}
                        <div className="flex items-center justify-between py-2 sm:py-2.5">
                          <div className="w-14 sm:w-16 flex justify-start">
                            <span className={cn("text-xs sm:text-sm font-black px-2.5 py-0.5 rounded-full", (match.stats.offsidesHome ?? 0) > 0 ? "bg-red-600 text-white" : "text-foreground")}>
                              {match.stats.offsidesHome ?? 0}
                            </span>
                          </div>
                          <span className="text-xs sm:text-sm font-semibold text-muted-foreground text-center flex-1">
                            Việt vị
                          </span>
                          <div className="w-14 sm:w-16 flex justify-end">
                            <span className="text-xs sm:text-sm font-black px-2.5 py-0.5 rounded-full text-foreground">
                              {match.stats.offsidesAway ?? 0}
                            </span>
                          </div>
                        </div>

                        {/* 10. Phạt góc */}
                        <div className="flex items-center justify-between py-2 sm:py-2.5">
                          <div className="w-14 sm:w-16 flex justify-start">
                            <span className={cn("text-xs sm:text-sm font-black px-2.5 py-0.5 rounded-full", match.stats.cornersHome > match.stats.cornersAway ? "bg-red-600 text-white" : "text-foreground")}>
                              {match.stats.cornersHome}
                            </span>
                          </div>
                          <span className="text-xs sm:text-sm font-semibold text-muted-foreground text-center flex-1">
                            Phạt góc
                          </span>
                          <div className="w-14 sm:w-16 flex justify-end">
                            <span className={cn("text-xs sm:text-sm font-black px-2.5 py-0.5 rounded-full", match.stats.cornersAway > match.stats.cornersHome ? "bg-blue-600 text-white" : "text-foreground")}>
                              {match.stats.cornersAway}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground text-sm font-medium">
                      Thống kê trận đấu sẽ được cập nhật khi trận đấu bắt đầu.
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: HEAD TO HEAD (H2H) - Chuẩn Google Sports & Sofascore */}
              {activeTab === "h2h" && (
                <div className="space-y-4 max-w-2xl mx-auto">
                  {/* 1. Tổng Quan Lịch Sử Đối Đầu (H2H Summary Card) */}
                  {activeH2hSummary && activeH2hSummary.totalMatches > 0 && (
                    <div className="rounded-2xl border border-border/80 bg-card/60 backdrop-blur-md p-4 sm:p-5 shadow-sm space-y-3.5">
                      <div className="flex items-center justify-between border-b border-border/50 pb-2.5">
                        <div className="flex items-center gap-2">
                          <span className="text-base">⚔️</span>
                          <h4 className="font-black text-xs sm:text-sm uppercase tracking-wider text-foreground">
                            Tổng Quan Đối Đầu ({activeH2hSummary.totalMatches} trận gần nhất)
                          </h4>
                        </div>
                      </div>

                      {/* 3 Khối Thắng - Hòa - Thắng */}
                      <div className="grid grid-cols-3 gap-2 sm:gap-3 text-center">
                        {/* Home Wins */}
                        <div className="rounded-xl bg-red-500/10 border border-red-500/25 p-2.5 sm:p-3">
                          <div className="text-lg sm:text-2xl font-black text-red-500">
                            {activeH2hSummary.homeWins}
                          </div>
                          <div className="text-[10px] sm:text-xs font-bold text-red-500/80 truncate">
                            {match.homeTeam.shortName || match.homeTeam.name} thắng
                          </div>
                        </div>

                        {/* Draws */}
                        <div className="rounded-xl bg-secondary/60 border border-border/80 p-2.5 sm:p-3">
                          <div className="text-lg sm:text-2xl font-black text-foreground">
                            {activeH2hSummary.draws}
                          </div>
                          <div className="text-[10px] sm:text-xs font-bold text-muted-foreground">
                            Hòa
                          </div>
                        </div>

                        {/* Away Wins */}
                        <div className="rounded-xl bg-blue-500/10 border border-blue-500/25 p-2.5 sm:p-3">
                          <div className="text-lg sm:text-2xl font-black text-blue-500">
                            {activeH2hSummary.awayWins}
                          </div>
                          <div className="text-[10px] sm:text-xs font-bold text-blue-500/80 truncate">
                            {match.awayTeam.shortName || match.awayTeam.name} thắng
                          </div>
                        </div>
                      </div>

                      {/* Segmented Progress Bar */}
                      <div className="w-full h-2.5 rounded-full bg-secondary/80 overflow-hidden flex gap-1 p-0.5">
                        <div
                          style={{
                            width: `${(activeH2hSummary.homeWins / activeH2hSummary.totalMatches) * 100}%`,
                          }}
                          className="h-full bg-red-500 rounded-full transition-all duration-500"
                          title={`${match.homeTeam.name} thắng ${activeH2hSummary.homeWins} trận`}
                        />
                        <div
                          style={{
                            width: `${(activeH2hSummary.draws / activeH2hSummary.totalMatches) * 100}%`,
                          }}
                          className="h-full bg-slate-400 dark:bg-slate-600 rounded-full transition-all duration-500"
                          title={`Hòa ${activeH2hSummary.draws} trận`}
                        />
                        <div
                          style={{
                            width: `${(activeH2hSummary.awayWins / activeH2hSummary.totalMatches) * 100}%`,
                          }}
                          className="h-full bg-blue-500 rounded-full transition-all duration-500"
                          title={`${match.awayTeam.name} thắng ${activeH2hSummary.awayWins} trận`}
                        />
                      </div>
                    </div>
                  )}

                  {/* 2. Phong Độ 5 Trận Gần Nhất (Hiển thị gần nhất từ trái sang phải) */}
                  {(homeRecentForm.length > 0 || awayRecentForm.length > 0) && (
                    <div className="rounded-2xl border border-border/80 bg-card/60 backdrop-blur-md p-4 sm:p-5 shadow-sm space-y-3">
                      <h4 className="font-black text-xs sm:text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                        <span>📈</span> Phong Độ 5 Trận Gần Nhất
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        {/* Home Form */}
                        <div className="rounded-xl border border-red-500/20 bg-secondary/20 p-3 space-y-2">
                          <div className="flex items-center gap-2 pb-1.5 border-b border-border/50">
                            <img src={match.homeTeam.logo} alt={match.homeTeam.name} className="w-5 h-5 object-contain" />
                            <span className="font-bold text-xs sm:text-sm text-foreground truncate">{match.homeTeam.name}</span>
                          </div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {[...homeRecentForm]
                              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                              .map((g, idx) => (
                                <div
                                  key={idx}
                                  className="group relative"
                                  title={`${g.result === 'W' ? 'Thắng' : g.result === 'L' ? 'Thua' : 'Hòa'} ${g.score} vs ${g.opponent} (${g.competition})`}
                                >
                                  <div
                                    className={cn(
                                      "w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center font-black text-xs text-white shadow-xs cursor-pointer transition-transform hover:scale-110",
                                      g.result === "W"
                                        ? "bg-emerald-600"
                                        : g.result === "L"
                                          ? "bg-rose-600"
                                          : "bg-amber-500"
                                    )}
                                  >
                                    {g.result}
                                  </div>
                                </div>
                              ))}
                          </div>
                        </div>

                        {/* Away Form */}
                        <div className="rounded-xl border border-blue-500/20 bg-secondary/20 p-3 space-y-2">
                          <div className="flex items-center gap-2 pb-1.5 border-b border-border/50">
                            <img src={match.awayTeam.logo} alt={match.awayTeam.name} className="w-5 h-5 object-contain" />
                            <span className="font-bold text-xs sm:text-sm text-foreground truncate">{match.awayTeam.name}</span>
                          </div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {[...awayRecentForm]
                              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                              .map((g, idx) => (
                                <div
                                  key={idx}
                                  className="group relative"
                                  title={`${g.result === 'W' ? 'Thắng' : g.result === 'L' ? 'Thua' : 'Hòa'} ${g.score} vs ${g.opponent} (${g.competition})`}
                                >
                                  <div
                                    className={cn(
                                      "w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center font-black text-xs text-white shadow-xs cursor-pointer transition-transform hover:scale-110",
                                      g.result === "W"
                                        ? "bg-emerald-600"
                                        : g.result === "L"
                                          ? "bg-rose-600"
                                          : "bg-amber-500"
                                    )}
                                  >
                                    {g.result}
                                  </div>
                                </div>
                              ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 3. Lịch Sử Đối Đầu Chi Tiết (Past Encounters) */}
                  <div className="rounded-2xl border border-border/80 bg-card/60 backdrop-blur-md p-4 sm:p-5 shadow-sm space-y-3">
                    <h4 className="font-black text-xs sm:text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      <span>📜</span> Lịch Sử Các Trận Đối Đầu Trực Tiếp
                    </h4>

                    {h2hMatches.length > 0 ? (
                      <div className="space-y-2">
                        {h2hMatches.map((h2h: any) => {
                          const isEspnFormat = Boolean(h2h.homeTeamName);
                          const homeName = isEspnFormat ? h2h.homeTeamName : h2h.homeTeam?.name;
                          const homeLogo = isEspnFormat ? h2h.homeTeamLogo : h2h.homeTeam?.logo;
                          const awayName = isEspnFormat ? h2h.awayTeamName : h2h.awayTeam?.name;
                          const awayLogo = isEspnFormat ? h2h.awayTeamLogo : h2h.awayTeam?.logo;
                          const rawCompName = isEspnFormat ? h2h.competitionName : h2h.league?.name;
                          const compName = (rawCompName || "Giải Đấu")
                            .replace(/^\d{4}(-\d{2,4})?\s+/gi, "")
                            .replace(/English\s+/gi, "")
                            .replace(/Spanish\s+/gi, "")
                            .replace(/Italian\s+/gi, "")
                            .replace(/German\s+/gi, "")
                            .replace(/French\s+/gi, "")
                            .replace(/UEFA\s+/gi, "")
                            .replace(/LaLiga/gi, "La Liga")
                            .trim();
                          const dateStr = new Date(h2h.date || h2h.matchDate).toLocaleDateString("vi-VN");

                          const teamAName = match.homeTeam.name.toLowerCase();
                          const teamBName = match.awayTeam.name.toLowerCase();
                          const hNameLower = (homeName || "").toLowerCase();
                          const aNameLower = (awayName || "").toLowerCase();

                          const isHomeTeamA = hNameLower.includes(teamAName) || teamAName.includes(hNameLower);
                          const isAwayTeamA = aNameLower.includes(teamAName) || teamAName.includes(aNameLower);

                          const isHomeWon = h2h.homeScore > h2h.awayScore;
                          const isAwayWon = h2h.awayScore > h2h.homeScore;
                          const isDraw = h2h.homeScore === h2h.awayScore;

                          // Team A (Chủ nhà hiện tại) = Đỏ | Team B (Đội khách hiện tại) = Xanh
                          const homeScoreColor = isHomeWon
                            ? isHomeTeamA
                              ? "text-red-500 font-black"
                              : "text-blue-500 font-black"
                            : "text-foreground";

                          const awayScoreColor = isAwayWon
                            ? isAwayTeamA
                              ? "text-red-500 font-black"
                              : "text-blue-500 font-black"
                            : "text-foreground";

                          const homeNameColor = isHomeWon
                            ? isHomeTeamA
                              ? "text-red-500 font-black"
                              : "text-blue-500 font-black"
                            : isDraw
                              ? "text-foreground font-bold"
                              : "text-muted-foreground";

                          const awayNameColor = isAwayWon
                            ? isAwayTeamA
                              ? "text-red-500 font-black"
                              : "text-blue-500 font-black"
                            : isDraw
                              ? "text-foreground font-bold"
                              : "text-muted-foreground";

                          return (
                            <div
                              key={h2h.id}
                              className="flex items-center justify-between p-3 sm:p-3.5 rounded-xl border border-border/70 bg-secondary/30 hover:bg-secondary/50 transition-colors text-xs gap-2"
                            >
                              {/* Ngày & Giải Đấu - Hiển thị trọn vẹn, không cắt ... */}
                              <div className="flex flex-col min-w-0 flex-shrink-0 w-28 sm:w-36">
                                <span className="font-mono text-muted-foreground text-[10px] sm:text-[11px] whitespace-nowrap">
                                  {dateStr}
                                </span>
                                <span className="text-[10px] sm:text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                                  {compName}
                                </span>
                              </div>

                              {/* Match Scoreboard */}
                              <div className="flex-1 flex items-center justify-center gap-2 sm:gap-3 min-w-0">
                                {/* Home Team */}
                                <div className="flex items-center gap-1.5 flex-1 justify-end min-w-0">
                                  <span className={cn("truncate text-right text-xs sm:text-sm", homeNameColor)}>
                                    {homeName}
                                  </span>
                                  {homeLogo && (
                                    <img src={homeLogo} alt={homeName} className="w-5 h-5 sm:w-6 sm:h-6 object-contain flex-shrink-0" />
                                  )}
                                </div>

                                {/* Score Pill */}
                                <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-card border border-border/80 shadow-xs font-mono font-black text-xs sm:text-sm flex-shrink-0">
                                  <span className={homeScoreColor}>
                                    {h2h.homeScore}
                                  </span>
                                  <span className="text-muted-foreground">-</span>
                                  <span className={awayScoreColor}>
                                    {h2h.awayScore}
                                  </span>
                                </div>

                                {/* Away Team */}
                                <div className="flex items-center gap-1.5 flex-1 justify-start min-w-0">
                                  {awayLogo && (
                                    <img src={awayLogo} alt={awayName} className="w-5 h-5 sm:w-6 sm:h-6 object-contain flex-shrink-0" />
                                  )}
                                  <span className={cn("truncate text-left text-xs sm:text-sm", awayNameColor)}>
                                    {awayName}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-10 text-muted-foreground text-sm font-medium">
                        Chưa có dữ liệu lịch sử đối đầu giữa 2 câu lạc bộ.
                      </div>
                    )}
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

// Comparison Bar Component for Match Stats
function StatComparisonBar({
  label,
  valHome,
  valAway,
  homePercent,
}: {
  label: string;
  valHome: string | number;
  valAway: string | number;
  homePercent: number;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs font-semibold text-foreground">
        <span className="font-mono">{valHome}</span>
        <span className="text-muted-foreground font-medium text-[10px] sm:text-[11px]">{label}</span>
        <span className="font-mono">{valAway}</span>
      </div>

      <div className="w-full h-2 rounded-full bg-secondary/80 overflow-hidden flex">
        <div
          style={{ width: `${Math.max(5, Math.min(95, homePercent))}%` }}
          className="h-full bg-emerald-500 transition-all duration-500 rounded-l-full"
        />
        <div
          style={{ width: `${100 - Math.max(5, Math.min(95, homePercent))}%` }}
          className="h-full bg-indigo-500 transition-all duration-500 rounded-r-full"
        />
      </div>
    </div>
  );
}
