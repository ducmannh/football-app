"use client";

import React from "react";
import { cn, formatRound } from "@/lib/utils";
import { Clock, MapPin, ChevronRight } from "lucide-react";
import { MatchItem } from "@/types/football";

interface MatchCardProps {
  match: MatchItem;
  onOpenDetail: (matchId: string) => void;
  onSelectTeam?: (teamId: string) => void;
  onSelectPlayer?: (playerId: string) => void;
}

function getScorerName(e: any): string {
  if (e.player?.name) return e.player.name;
  if (e.player?.shortName) return e.player.shortName;
  if (e.description) {
    const ogMatch = e.description.match(/Own Goal by ([^,\.]+)/i);
    if (ogMatch && ogMatch[1]) {
      return ogMatch[1].trim();
    }
    const playerMatch = e.description.match(/([A-ZÀ-Ỹa-zà-ỹ\s\.\-'\u00C0-\u024F\u1E00-\u1EFF]+)\s*\([^\)]+\)/);
    if (playerMatch && playerMatch[1]) {
      const raw = playerMatch[1].replace(/Goal!|Substitution,|Yellow Card|Red Card/gi, "").trim();
      const parts = raw.split(".");
      const candidate = (parts[parts.length - 1] || "").trim();
      if (candidate.length > 2 && candidate.length < 35 && !candidate.toLowerCase().includes("half begins")) {
        return candidate;
      }
    }
  }
  return "Bàn thắng";
}

function OwnGoalIcon({ className = "w-3 h-3" }: { className?: string }) {
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

function normalizeTeamText(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s*fc\s*|\s*afc\s*|\s*cf\s*|\s*sc\s*|\s*rc\s*|\s*ac\s*|\s*as\s*|\s*ss\s*|\s*1\.\s*|\s*vfb\s*/gi, "")
    .trim();
}

function getGoalBeneficiary(e: any, match: MatchItem): "home" | "away" | null {
  const rawDesc = e.description || "";
  const desc = normalizeTeamText(rawDesc);

  const isOG =
    e.type === "OWN_GOAL" ||
    desc.includes("own goal") ||
    desc.includes("phan luoi") ||
    desc.includes("(og)") ||
    desc.includes(" og");

  const isGoal =
    e.type === "GOAL" ||
    e.type === "PENALTY_SCORED" ||
    isOG ||
    desc.includes("goal!");

  if (!isGoal) return null;

  const homeName = normalizeTeamText(match.homeTeam.name);
  const awayName = normalizeTeamText(match.awayTeam.name);
  const homeShort = normalizeTeamText(match.homeTeam.shortName || "");
  const awayShort = normalizeTeamText(match.awayTeam.shortName || "");

  if (isOG) {
    // 1. If match ended with one team scoring 0, then only the other team can have goals!
    if (match.awayScore === 0 && match.homeScore > 0) return "home";
    if (match.homeScore === 0 && match.awayScore > 0) return "away";

    // 2. Parse Committer team from "Own Goal by <Player>, <Team>." or "<Player> (<Team>) Own Goal"
    const m1 = rawDesc.match(/own goal by [^,\.\(]+(?:,\s*|\s*\()([^,\.\)]+)/i);
    const m2 = rawDesc.match(/([^\(\)]+)\s*\(([^,\.\)]+)\)\s*own goal/i);
    const committerRaw = m1?.[1] || m2?.[2];

    if (committerRaw) {
      const c = normalizeTeamText(committerRaw);
      const isCommitterHome = (homeName && (c.includes(homeName) || homeName.includes(c))) ||
        (homeShort && (c.includes(homeShort) || homeShort.includes(c)));
      const isCommitterAway = (awayName && (c.includes(awayName) || awayName.includes(c))) ||
        (awayShort && (c.includes(awayShort) || awayShort.includes(c)));

      if (isCommitterHome && !isCommitterAway) return "away";
      if (isCommitterAway && !isCommitterHome) return "home";
    }

    // 3. Check player's team in database if available
    if (e.player?.teamId) {
      if (e.player.teamId === match.homeTeamId) return "away";
      if (e.player.teamId === match.awayTeamId) return "home";
    }

    // 4. Default: If event.teamId was set to awayTeamId, OG goes to home
    if (e.teamId === match.awayTeamId) return "home";
    if (e.teamId === match.homeTeamId) return "away";

    return "home";
  }

  // Regular Goal / Penalty
  if (e.teamId === match.homeTeamId) return "home";
  if (e.teamId === match.awayTeamId) return "away";

  if (desc.includes(`(${homeName})`) || (homeShort && desc.includes(`(${homeShort})`))) return "home";
  if (desc.includes(`(${awayName})`) || (awayShort && desc.includes(`(${awayShort})`))) return "away";

  return null;
}

export function MatchCard({
  match,
  onOpenDetail,
  onSelectTeam,
}: MatchCardProps) {
  const isLive = match.status === "LIVE";
  const isFinished = match.status === "FINISHED";
  const isScheduled = match.status === "SCHEDULED";

  // Format Kickoff Time
  const matchDate = new Date(match.matchDate);
  const timeStr = matchDate.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });

  // Tách biệt danh sách ghi bàn chính xác: 1 bàn thắng chỉ thuộc về DUY NHẤT 1 bên
  const homeGoals = match.events?.filter((e) => getGoalBeneficiary(e, match) === "home") || [];
  const awayGoals = match.events?.filter((e) => getGoalBeneficiary(e, match) === "away") || [];

  const hasGoals = homeGoals.length > 0 || awayGoals.length > 0;

  return (
    <div
      onClick={() => onOpenDetail(match.id)}
      className={cn(
        "group relative rounded-2xl sm:rounded-3xl border transition-all duration-300 hover:shadow-2xl hover:-translate-y-0.5 active:scale-[0.99] cursor-pointer overflow-hidden p-3 sm:p-5",
        isLive
          ? "bg-gradient-to-br from-card via-card/95 to-rose-950/20 border-rose-500/40 shadow-lg shadow-rose-500/5 hover:border-rose-500/80"
          : "bg-card/85 backdrop-blur-xl border-border/80 hover:border-emerald-500/60 hover:shadow-emerald-500/10"
      )}
    >
      {/* Subtle Glow Aura behind Card */}
      {isLive && (
        <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
      )}

      {/* Top Header: Round + Status / Kickoff */}
      <div className="flex items-center justify-between gap-2 pb-2.5 mb-2.5 sm:pb-3 sm:mb-3 border-b border-border/50 text-[11px] sm:text-xs">
        <div className="flex items-center gap-1.5 sm:gap-2 text-muted-foreground font-medium truncate">
          <span className="font-bold text-foreground/90">{formatRound(match.round)}</span>
          {match.stadium && (
            <>
              <span className="hidden sm:inline">•</span>
              <span className="hidden sm:flex items-center gap-1 truncate text-[11px] opacity-80">
                <MapPin className="w-3 h-3 text-emerald-500 flex-shrink-0" />
                <span className="truncate">{match.stadium}</span>
              </span>
            </>
          )}
        </div>

        {/* Status Badge */}
        <div className="flex-shrink-0">
          {isLive && (
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-rose-500/15 border border-rose-500/40 text-rose-600 dark:text-rose-400 font-black text-[11px] sm:text-xs shadow-xs animate-pulse">
              <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-rose-500" />
              <span>{match.minute || "LIVE"}</span>
            </div>
          )}

          {isFinished && (
            <div className="flex items-center gap-1 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-secondary/80 text-muted-foreground font-bold text-[11px] sm:text-xs border border-border">
              <span>Hết giờ (FT)</span>
            </div>
          )}

          {isScheduled && (
            <div className="flex items-center gap-1 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-bold text-[11px] sm:text-xs">
              <Clock className="w-3 h-3" />
              <span>{timeStr}</span>
            </div>
          )}
        </div>
      </div>

      {/* Symmetrical 3-Part Match Center (100% Mathematically Centered) */}
      <div className="flex items-center justify-between gap-1.5 sm:gap-4 py-1 w-full">
        {/* Left Side: Home Team (flex-1) */}
        <div
          onClick={(e) => {
            if (onSelectTeam) {
              e.stopPropagation();
              onSelectTeam(match.homeTeamId);
            }
          }}
          className="flex-1 min-w-0 flex items-center justify-end gap-1.5 sm:gap-3 text-right group/team cursor-pointer"
          title={`Xem hồ sơ ${match.homeTeam.name}`}
        >
          <div className="min-w-0 flex-1 flex flex-col justify-center">
            <h3 className="font-black text-xs sm:text-base text-foreground group-hover/team:text-emerald-500 transition-colors truncate">
              {/* Full name on larger screens, readable on mobile */}
              <span className="hidden sm:inline">{match.homeTeam.name}</span>
              <span className="sm:hidden">{match.homeTeam.shortName || match.homeTeam.name}</span>
            </h3>
            <span className="text-[10px] text-muted-foreground font-medium hidden sm:block">
              Chủ nhà
            </span>
          </div>

          <div className="w-8 h-8 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-white p-1 sm:p-1.5 flex items-center justify-center flex-shrink-0 shadow-md border border-black/10 group-hover/team:scale-110 transition-transform">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={match.homeTeam.logo}
              alt={match.homeTeam.name}
              className="w-full h-full object-contain filter drop-shadow-xs"
              onError={(e) => {
                (e.target as HTMLElement).style.display = "none";
              }}
            />
          </div>
        </div>

        {/* Center: Score Display (Fixed Width, Absolute Geometric Center) */}
        <div className="w-20 sm:w-36 flex-shrink-0 flex flex-col items-center justify-center text-center">
          {isScheduled ? (
            <div className="flex items-center justify-center px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg sm:rounded-xl bg-secondary/90 border border-border text-muted-foreground text-[11px] sm:text-xs font-black tracking-wider shadow-xs">
              VS
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <div className="flex items-center justify-center gap-1 font-mono text-lg sm:text-3xl font-black tracking-tight text-foreground">
                <span
                  className={cn(
                    ((match.homeScore > match.awayScore) ||
                      (match.homeScore === match.awayScore && (match.homePenaltyScore ?? 0) > (match.awayPenaltyScore ?? 0))) && isFinished
                      ? "text-emerald-500 font-extrabold"
                      : "text-foreground"
                  )}
                >
                  {match.homeScore}
                </span>
                <span className="text-muted-foreground/60 text-sm sm:text-xl font-light">
                  -
                </span>
                <span
                  className={cn(
                    ((match.awayScore > match.homeScore) ||
                      (match.homeScore === match.awayScore && (match.awayPenaltyScore ?? 0) > (match.homePenaltyScore ?? 0))) && isFinished
                      ? "text-emerald-500 font-extrabold"
                      : "text-foreground"
                  )}
                >
                  {match.awayScore}
                </span>
              </div>

              {match.homePenaltyScore != null && match.awayPenaltyScore != null && (
                <span className="px-1.5 py-0.5 mt-1 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-extrabold text-[8.5px] sm:text-[10px] tracking-tight whitespace-nowrap shadow-2xs">
                  🎯 {match.homePenaltyScore > match.awayPenaltyScore ? (match.homeTeam.shortName || match.homeTeam.name) : (match.awayTeam.shortName || match.awayTeam.name)} thắng {match.homePenaltyScore}-{match.awayPenaltyScore} (Pen)
                </span>
              )}

              {match.homeHalfTimeScore !== null &&
                match.awayHalfTimeScore !== null &&
                !isScheduled &&
                match.homePenaltyScore === null && (
                  <span className="text-[9px] sm:text-[10px] text-muted-foreground font-semibold mt-0.5">
                    (HT {match.homeHalfTimeScore}-{match.awayHalfTimeScore})
                  </span>
                )}
            </div>
          )}
        </div>

        {/* Right Side: Away Team (flex-1) */}
        <div
          onClick={(e) => {
            if (onSelectTeam) {
              e.stopPropagation();
              onSelectTeam(match.awayTeamId);
            }
          }}
          className="flex-1 min-w-0 flex items-center justify-start gap-1.5 sm:gap-3 text-left group/team cursor-pointer"
          title={`Xem hồ sơ ${match.awayTeam.name}`}
        >
          <div className="w-8 h-8 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-white p-1 sm:p-1.5 flex items-center justify-center flex-shrink-0 shadow-md border border-black/10 group-hover/team:scale-110 transition-transform">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={match.awayTeam.logo}
              alt={match.awayTeam.name}
              className="w-full h-full object-contain filter drop-shadow-xs"
              onError={(e) => {
                (e.target as HTMLElement).style.display = "none";
              }}
            />
          </div>

          <div className="min-w-0 flex-1 flex flex-col justify-center">
            <h3 className="font-black text-xs sm:text-base text-foreground group-hover/team:text-emerald-500 transition-colors truncate">
              <span className="hidden sm:inline">{match.awayTeam.name}</span>
              <span className="sm:hidden">{match.awayTeam.shortName || match.awayTeam.name}</span>
            </h3>
            <span className="text-[10px] text-muted-foreground font-medium hidden sm:block">
              Đội khách
            </span>
          </div>
        </div>
      </div>

      {/* Goal Scorers Row (Hiển thị mỗi cầu thủ ghi bàn thành một dòng riêng biệt) */}
      {hasGoals && (
        <div className="mt-2.5 pt-2 sm:mt-3 sm:pt-2.5 border-t border-border/40 flex items-start justify-between gap-1.5 sm:gap-3 text-[10px] sm:text-[11px] text-muted-foreground">
          {/* Home Scorers (Căn phải dưới tên Đội nhà - mỗi bàn thắng 1 dòng) */}
          <div className="flex-1 flex flex-col items-end gap-1 text-right min-w-0">
            {homeGoals.map((e) => {
              const name = getScorerName(e);
              const isPen =
                e.type === "PENALTY_SCORED" ||
                (e.description && (e.description.toLowerCase().includes("penalty") || e.description.toLowerCase().includes("phạt đền")));
              const isOG =
                e.type === "OWN_GOAL" ||
                (e.description && (e.description.toLowerCase().includes("own goal") || e.description.toLowerCase().includes("phản lưới")));
              const tag = isPen ? " (P)" : isOG ? " (OG)" : "";

              return (
                <div
                  key={e.id}
                  className="flex items-center gap-1 justify-end font-medium leading-tight text-foreground/90"
                >
                  <span className={cn("break-words", isOG && "text-rose-500 font-semibold")}>
                    {name} {e.minute}&apos;{tag}
                  </span>
                  {isOG ? (
                    <OwnGoalIcon className="w-3 h-3 flex-shrink-0" />
                  ) : (
                    <span className="text-[10px] sm:text-xs flex-shrink-0">⚽</span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Center Action (Chi tiết >) */}
          <div className="w-14 sm:w-24 flex-shrink-0 flex items-center justify-center text-center self-center py-1">
            <span className="text-[10px] sm:text-[11px] text-emerald-500 font-bold flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform whitespace-nowrap">
              Chi tiết <ChevronRight className="w-3 h-3" />
            </span>
          </div>

          {/* Away Scorers (Căn trái dưới tên Đội khách - mỗi bàn thắng 1 dòng) */}
          <div className="flex-1 flex flex-col items-start gap-1 text-left min-w-0">
            {awayGoals.map((e) => {
              const name = getScorerName(e);
              const isPen =
                e.type === "PENALTY_SCORED" ||
                (e.description && (e.description.toLowerCase().includes("penalty") || e.description.toLowerCase().includes("phạt đền")));
              const isOG =
                e.type === "OWN_GOAL" ||
                (e.description && (e.description.toLowerCase().includes("own goal") || e.description.toLowerCase().includes("phản lưới")));
              const tag = isPen ? " (P)" : isOG ? " (OG)" : "";

              return (
                <div
                  key={e.id}
                  className="flex items-center gap-1 justify-start font-medium leading-tight text-foreground/90"
                >
                  {isOG ? (
                    <OwnGoalIcon className="w-3 h-3 flex-shrink-0" />
                  ) : (
                    <span className="text-[10px] sm:text-xs flex-shrink-0">⚽</span>
                  )}
                  <span className={cn("break-words", isOG && "text-rose-500 font-semibold")}>
                    {name} {e.minute}&apos;{tag}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
