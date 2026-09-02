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
  ChevronDown,
  Check,
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
  const [matchFilter, setMatchFilter] = useState<"all" | "finished" | "upcoming">("all");
  const [matchLeagueFilter, setMatchLeagueFilter] = useState<string>("ALL");
  const [isLeagueDropdownOpen, setIsLeagueDropdownOpen] = useState(false);

  useEffect(() => {
    if (!teamId) return;

    let isMounted = true;
    setLoading(true);

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

  const team = data?.team;
  const stats = data?.stats;
  const matches = data?.matches || [];
  const players = team?.players || [];

  const uniqueLeagues = React.useMemo(() => {
    if (!matches || matches.length === 0) return [];
    const map = new Map<string, { id: string; name: string; shortName: string; logo: string }>();
    for (const m of matches) {
      if (m.league && !map.has(m.league.id)) {
        map.set(m.league.id, {
          id: m.league.id,
          name: m.league.name,
          shortName: m.league.shortName || m.league.name,
          logo: m.league.logo,
        });
      }
    }
    return Array.from(map.values());
  }, [matches]);

  const displayMatches = React.useMemo(() => {
    let list = [...matches];
    if (matchLeagueFilter !== "ALL") {
      list = list.filter((m) => m.leagueId === matchLeagueFilter);
    }

    if (matchFilter === "finished") {
      return list
        .filter((m) => m.status === "FINISHED")
        .sort((a, b) => new Date(b.matchDate).getTime() - new Date(a.matchDate).getTime());
    } else if (matchFilter === "upcoming") {
      return list
        .filter((m) => m.status !== "FINISHED")
        .sort((a, b) => new Date(a.matchDate).getTime() - new Date(b.matchDate).getTime());
    } else {
      // "all": kết hợp đã đấu (mới nhất trước) và sắp tới (gần nhất trước)
      const finished = list
        .filter((m) => m.status === "FINISHED")
        .sort((a, b) => new Date(b.matchDate).getTime() - new Date(a.matchDate).getTime());
      const upcoming = list
        .filter((m) => m.status !== "FINISHED")
        .sort((a, b) => new Date(a.matchDate).getTime() - new Date(b.matchDate).getTime());
      return [...finished, ...upcoming];
    }
  }, [matches, matchFilter, matchLeagueFilter]);

  if (!teamId) return null;

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
                <div className="space-y-4">
                  {/* Filter controls */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl bg-secondary/30 border border-border/60">
                    {/* Status Segmented Buttons */}
                    <div className="flex items-center gap-1.5 p-1 rounded-xl bg-background/80 border border-border/60 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={() => setMatchFilter("all")}
                        className={cn(
                          "flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                          matchFilter === "all"
                            ? "bg-emerald-500 text-white shadow-xs"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        Tất cả ({matches.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setMatchFilter("finished")}
                        className={cn(
                          "flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                          matchFilter === "finished"
                            ? "bg-emerald-500 text-white shadow-xs"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        Kết quả ({matches.filter((m) => m.status === "FINISHED").length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setMatchFilter("upcoming")}
                        className={cn(
                          "flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                          matchFilter === "upcoming"
                            ? "bg-emerald-500 text-white shadow-xs"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        Lịch đấu ({matches.filter((m) => m.status !== "FINISHED").length})
                      </button>
                    </div>

                    {/* Custom Luxury Competition Filter Dropdown */}
                    {uniqueLeagues.length > 1 && (
                      <div className="relative">
                        {/* Dropdown Trigger Button */}
                        <button
                          type="button"
                          onClick={() => setIsLeagueDropdownOpen(!isLeagueDropdownOpen)}
                          className={cn(
                            "w-full sm:w-auto flex items-center justify-between gap-2.5 px-3 py-1.5 rounded-xl bg-background/90 hover:bg-secondary/80 border text-xs font-bold transition-all shadow-2xs cursor-pointer select-none",
                            isLeagueDropdownOpen
                              ? "border-emerald-500 ring-2 ring-emerald-500/20 text-foreground"
                              : matchLeagueFilter !== "ALL"
                              ? "border-emerald-500/40 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10"
                              : "border-border/80 text-foreground"
                          )}
                        >
                          <div className="flex items-center gap-2 truncate">
                            {matchLeagueFilter === "ALL" ? (
                              <>
                                <span className="text-xs">🏆</span>
                                <span className="truncate">Tất cả giải đấu ({uniqueLeagues.length})</span>
                              </>
                            ) : (
                              (() => {
                                const selected = uniqueLeagues.find((l) => l.id === matchLeagueFilter);
                                return (
                                  <>
                                    {selected?.logo && (
                                      <div className="w-4 h-4 rounded bg-white p-0.5 flex items-center justify-center flex-shrink-0 shadow-2xs border border-black/10">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                          src={selected.logo}
                                          alt=""
                                          className="w-full h-full object-contain"
                                        />
                                      </div>
                                    )}
                                    <span className="truncate">{selected?.name || "Giải đấu"}</span>
                                  </>
                                );
                              })()
                            )}
                          </div>
                          <ChevronDown
                            className={cn(
                              "w-3.5 h-3.5 text-muted-foreground transition-transform duration-200 flex-shrink-0",
                              isLeagueDropdownOpen && "rotate-180 text-emerald-500"
                            )}
                          />
                        </button>

                        {/* Dropdown Menu Popover */}
                        {isLeagueDropdownOpen && (
                          <>
                            {/* Backdrop overlay */}
                            <div
                              className="fixed inset-0 z-40"
                              onClick={() => setIsLeagueDropdownOpen(false)}
                            />

                            {/* Menu content */}
                            <div className="absolute right-0 top-full mt-1.5 z-50 w-64 p-1.5 rounded-2xl bg-card/95 backdrop-blur-2xl border border-border shadow-2xl space-y-1 animate-in fade-in zoom-in-95 duration-150">
                              {/* Tất cả giải đấu option */}
                              <button
                                type="button"
                                onClick={() => {
                                  setMatchLeagueFilter("ALL");
                                  setIsLeagueDropdownOpen(false);
                                }}
                                className={cn(
                                  "w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer text-left group",
                                  matchLeagueFilter === "ALL"
                                    ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shadow-2xs"
                                    : "hover:bg-secondary text-foreground"
                                )}
                              >
                                <div className="flex items-center gap-2.5">
                                  <span className="text-sm">🏆</span>
                                  <span>Tất cả giải đấu</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="px-2 py-0.5 rounded-full bg-secondary text-[10px] text-muted-foreground font-extrabold">
                                    {matches.length}
                                  </span>
                                  {matchLeagueFilter === "ALL" && (
                                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                                  )}
                                </div>
                              </button>

                              {/* Unique Leagues list */}
                              {uniqueLeagues.map((l) => {
                                const count = matches.filter((m) => m.leagueId === l.id).length;
                                const isSelected = matchLeagueFilter === l.id;

                                return (
                                  <button
                                    key={l.id}
                                    type="button"
                                    onClick={() => {
                                      setMatchLeagueFilter(l.id);
                                      setIsLeagueDropdownOpen(false);
                                    }}
                                    className={cn(
                                      "w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer text-left group",
                                      isSelected
                                        ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shadow-2xs"
                                        : "hover:bg-secondary text-foreground"
                                    )}
                                  >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                      <div className="w-5 h-5 rounded-md bg-white p-0.5 flex items-center justify-center flex-shrink-0 shadow-2xs border border-black/10">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                          src={l.logo}
                                          alt={l.name}
                                          className="w-full h-full object-contain"
                                        />
                                      </div>
                                      <span className="truncate">{l.name}</span>
                                    </div>

                                    <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                                      <span className="px-2 py-0.5 rounded-full bg-secondary text-[10px] text-muted-foreground font-extrabold">
                                        {count}
                                      </span>
                                      {isSelected && (
                                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                                      )}
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Render Matches List */}
                  {displayMatches.length > 0 ? (
                    <div className="space-y-3">
                      {displayMatches.map((m: MatchItem) => {
                        const isHome = m.homeTeamId === team.id;
                        const isFinished = m.status === "FINISHED";
                        const isLive = m.status === "LIVE";

                        let outcomeType: "win" | "draw" | "loss" | "none" = "none";
                        const hasPen = m.homePenaltyScore !== null && m.awayPenaltyScore !== null;
                        const teamPen = isHome ? m.homePenaltyScore : m.awayPenaltyScore;
                        const oppPen = isHome ? m.awayPenaltyScore : m.homePenaltyScore;

                        if (isFinished) {
                          const teamScore = isHome ? m.homeScore : m.awayScore;
                          const oppScore = isHome ? m.awayScore : m.homeScore;
                          if (hasPen && teamPen != null && oppPen != null) {
                            outcomeType = teamPen > oppPen ? "win" : "loss";
                          } else {
                            if (teamScore > oppScore) outcomeType = "win";
                            else if (teamScore < oppScore) outcomeType = "loss";
                            else outcomeType = "draw";
                          }
                        }

                        return (
                          <div
                            key={m.id}
                            onClick={() => onSelectMatch?.(m.id)}
                            className={cn(
                              "flex flex-col p-3 sm:p-4 rounded-2xl border transition-all cursor-pointer group shadow-2xs hover:shadow-md",
                              outcomeType === "win"
                                ? "border-emerald-500/30 bg-emerald-500/5 hover:border-emerald-500/50 hover:bg-emerald-500/10"
                                : outcomeType === "loss"
                                ? "border-rose-500/30 bg-rose-500/5 hover:border-rose-500/50 hover:bg-rose-500/10"
                                : outcomeType === "draw"
                                ? "border-amber-500/30 bg-amber-500/5 hover:border-amber-500/50 hover:bg-amber-500/10"
                                : "border-border/80 bg-secondary/30 hover:border-emerald-500/40 hover:bg-secondary/60"
                            )}
                          >
                            {/* Top info row: League, Round, Date/Time */}
                            <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-border/40 text-[11px] text-muted-foreground">
                              <div className="flex items-center gap-2">
                                <div className="w-5 h-5 rounded-md bg-white p-0.5 flex items-center justify-center flex-shrink-0 shadow-2xs border border-black/10">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={m.league.logo}
                                    alt={m.league.name}
                                    className="w-full h-full object-contain"
                                  />
                                </div>
                                <span className="font-bold text-foreground">
                                  {m.league.name || m.league.shortName}
                                </span>
                                <span className="px-2 py-0.5 rounded-md bg-secondary text-[10px] font-extrabold text-foreground border border-border/60">
                                  {m.round}
                                </span>
                              </div>

                              <div className="flex items-center gap-1.5 font-medium">
                                <span>
                                  {new Date(m.matchDate).toLocaleDateString("vi-VN", {
                                    weekday: "short",
                                    day: "2-digit",
                                    month: "2-digit",
                                    year: "numeric",
                                  })}
                                </span>
                              </div>
                            </div>

                            {/* Main match row: Home vs Away */}
                            <div className="flex items-center justify-between gap-2 sm:gap-4">
                              {/* Home Team */}
                              <div className="flex-1 flex items-center gap-2.5 min-w-0">
                                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-white p-1 flex items-center justify-center flex-shrink-0 shadow-2xs border border-black/10">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={m.homeTeam.logo}
                                    alt={m.homeTeam.name}
                                    className="w-full h-full object-contain"
                                  />
                                </div>
                                <span
                                  className={cn(
                                    "text-xs sm:text-sm truncate",
                                    m.homeTeamId === team.id
                                      ? "font-black text-emerald-500 dark:text-emerald-400"
                                      : "font-semibold text-foreground"
                                  )}
                                >
                                  {m.homeTeam.name}
                                </span>
                              </div>

                              {/* Center: Score / Outcome / Time */}
                              <div className="flex flex-col items-center justify-center flex-shrink-0 px-2 min-w-[90px] sm:min-w-[120px]">
                                {isFinished ? (
                                  <div className="flex flex-col items-center">
                                    <div className="flex items-center gap-1.5">
                                      <span
                                        className={cn(
                                          "px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider",
                                          outcomeType === "win"
                                            ? "bg-emerald-500 text-white"
                                            : outcomeType === "loss"
                                            ? "bg-rose-500 text-white"
                                            : "bg-amber-500 text-white"
                                        )}
                                      >
                                        {outcomeType === "win"
                                          ? "THẮNG"
                                          : outcomeType === "loss"
                                          ? "THUA"
                                          : "HÒA"}
                                      </span>
                                      <span className="font-mono font-black text-sm sm:text-base text-foreground tracking-tight">
                                        {m.homeScore} - {m.awayScore}
                                      </span>
                                    </div>
                                    {hasPen && teamPen != null && oppPen != null && (
                                      <span
                                        className={cn(
                                          "text-[10px] font-bold mt-0.5",
                                          teamPen > oppPen
                                            ? "text-emerald-500"
                                            : "text-rose-500"
                                        )}
                                      >
                                        Pen ({m.homePenaltyScore}-{m.awayPenaltyScore})
                                      </span>
                                    )}
                                  </div>
                                ) : isLive ? (
                                  <div className="flex flex-col items-center">
                                    <span className="px-2.5 py-0.5 rounded-full bg-rose-500 text-white font-black text-[10px] animate-pulse">
                                      LIVE {m.minute || ""}
                                    </span>
                                    <span className="font-mono font-black text-sm sm:text-base text-foreground mt-0.5">
                                      {m.homeScore} - {m.awayScore}
                                    </span>
                                  </div>
                                ) : (
                                  <div className="flex flex-col items-center">
                                    <span className="px-3 py-1 rounded-xl bg-secondary font-mono text-xs font-extrabold text-foreground border border-border/80 shadow-2xs">
                                      {new Date(m.matchDate).toLocaleTimeString("vi-VN", {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })}
                                    </span>
                                    <span className="text-[10px] text-muted-foreground font-semibold mt-0.5">
                                      {isHome ? "Sân nhà" : "Sân khách"}
                                    </span>
                                  </div>
                                )}
                              </div>

                              {/* Away Team */}
                              <div className="flex-1 flex items-center justify-end gap-2.5 min-w-0 text-right">
                                <span
                                  className={cn(
                                    "text-xs sm:text-sm truncate",
                                    m.awayTeamId === team.id
                                      ? "font-black text-emerald-500 dark:text-emerald-400"
                                      : "font-semibold text-foreground"
                                  )}
                                >
                                  {m.awayTeam.name}
                                </span>
                                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-white p-1 flex items-center justify-center flex-shrink-0 shadow-2xs border border-black/10">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={m.awayTeam.logo}
                                    alt={m.awayTeam.name}
                                    className="w-full h-full object-contain"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground text-sm font-medium">
                      Chưa có dữ liệu trận đấu phù hợp với bộ lọc.
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
