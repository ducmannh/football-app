"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Trophy,
  Calendar,
  Search,
  LayoutGrid,
  CheckCircle2,
  Clock,
  Radio,
  RefreshCw,
  ChevronDown,
  Check,
  Flame,
} from "lucide-react";
import { League, MatchItem, Team } from "@/types/football";
import { getFullLeagueFixtures, getLeagues } from "@/lib/actions/match";
import { LeagueBar } from "@/components/league-bar";
import { cn } from "@/lib/utils";

interface FullFixturesHubProps {
  leagues?: League[];
  initialLeagueCode?: string;
  onSelectMatch: (matchId: string) => void;
  onSelectTeam?: (teamId: string) => void;
}

export function FullFixturesHub({
  leagues: initialLeagues = [],
  initialLeagueCode = "PL",
  onSelectMatch,
  onSelectTeam,
}: FullFixturesHubProps) {
  const [leaguesList, setLeaguesList] = useState<League[]>(initialLeagues);
  const [selectedLeague, setSelectedLeague] = useState<string>(initialLeagueCode);
  const [selectedRound, setSelectedRound] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [searchTeam, setSearchTeam] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [isRoundDropdownOpen, setIsRoundDropdownOpen] = useState<boolean>(false);
  const roundDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (roundDropdownRef.current && !roundDropdownRef.current.contains(event.target as Node)) {
        setIsRoundDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch leagues if not provided from parent
  useEffect(() => {
    if (initialLeagues && initialLeagues.length > 0) {
      setLeaguesList(initialLeagues);
      return;
    }
    getLeagues().then((data) => {
      setLeaguesList(data as League[]);
    });
  }, [initialLeagues]);

  const [leagueData, setLeagueData] = useState<{
    league: League | null;
    seasonName: string;
    rounds: string[];
    matches: MatchItem[];
    teams: Team[];
    totalMatches: number;
    finishedCount: number;
    scheduledCount: number;
    liveCount: number;
    totalGoals: number;
  }>({
    league: null,
    seasonName: "2026/2027",
    rounds: [],
    matches: [],
    teams: [],
    totalMatches: 0,
    finishedCount: 0,
    scheduledCount: 0,
    liveCount: 0,
    totalGoals: 0,
  });

  // Fetch full fixtures whenever league or search changes + background polling
  useEffect(() => {
    let isMounted = true;

    async function loadFixtures(isBackground = false) {
      if (!isBackground) setLoading(true);
      try {
        const res = await getFullLeagueFixtures({
          leagueCode: selectedLeague,
          seasonName: "2026/2027",
          status: selectedStatus,
          round: selectedRound,
          searchTeam,
        });

        if (isMounted) {
          setLeagueData({
            league: res.league as unknown as League,
            seasonName: res.seasonName || "2026/2027",
            rounds: res.rounds || [],
            matches: (res.matches || []) as unknown as MatchItem[],
            teams: (res.teams || []) as unknown as Team[],
            totalMatches: res.totalMatches || 0,
            finishedCount: res.finishedCount || 0,
            scheduledCount: res.scheduledCount || 0,
            liveCount: res.liveCount || 0,
            totalGoals: res.totalGoals || 0,
          });
        }
      } catch (error) {
        console.error("Lỗi khi tải toàn bộ lịch đấu:", error);
      } finally {
        if (isMounted && !isBackground) setLoading(false);
      }
    }

    loadFixtures(false);

    // Silent background polling every 30s
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") {
        loadFixtures(true);
      }
    }, 30000);

    return () => {
      isMounted = false;
      clearInterval(timer);
    };
  }, [selectedLeague, selectedRound, selectedStatus, searchTeam]);

  // Group matches by round for presentation
  const groupedMatches = useMemo(() => {
    const groups: Record<string, MatchItem[]> = {};
    for (const m of leagueData.matches) {
      const roundKey = m.round || "Khác";
      if (!groups[roundKey]) {
        groups[roundKey] = [];
      }
      groups[roundKey].push(m);
    }
    return groups;
  }, [leagueData.matches]);

  // Find currently active / nearest upcoming round
  const currentActiveRound = useMemo(() => {
    if (!leagueData.rounds || leagueData.rounds.length === 0) return null;
    // Look for first round with LIVE matches, or first round with SCHEDULED matches
    for (const r of leagueData.rounds) {
      const matchesInRound = leagueData.matches.filter((m) => m.round === r);
      if (matchesInRound.some((m) => m.status === "LIVE" || m.status === "SCHEDULED")) {
        return r;
      }
    }
    return leagueData.rounds[0] || null;
  }, [leagueData.rounds, leagueData.matches]);

  // Jump to round
  const jumpToRound = (roundName: string) => {
    setSelectedRound(roundName);
    const element = document.getElementById(`round-${roundName.replace(/\s+/g, "-")}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const currentLeagueObj = leagueData.league || leaguesList.find((l) => l.code === selectedLeague) || {
    code: "PL",
    name: "Premier League",
    shortName: "Ngoại Hạng Anh",
    country: "England",
    logo: "https://media.api-sports.io/football/leagues/39.png",
    type: "LEAGUE",
    flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
  };
  const progressPercent = leagueData.totalMatches > 0
    ? Math.round((leagueData.finishedCount / leagueData.totalMatches) * 100)
    : 0;

  // Format date helper in VN Time
  const formatMatchTime = (dateInput: string | Date) => {
    const d = new Date(dateInput);
    return new Intl.DateTimeFormat("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
      timeZone: "Asia/Ho_Chi_Minh",
    }).format(d);
  };

  const formatRoundDateRange = (matchesInRound: MatchItem[]) => {
    if (!matchesInRound || matchesInRound.length === 0) return "";
    const dates = matchesInRound.map((m) => new Date(m.matchDate).getTime()).sort((a, b) => a - b);
    const firstDate = new Intl.DateTimeFormat("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      timeZone: "Asia/Ho_Chi_Minh",
    }).format(new Date(dates[0]));
    const lastDate = new Intl.DateTimeFormat("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      timeZone: "Asia/Ho_Chi_Minh",
    }).format(new Date(dates[dates.length - 1]));
    return `${firstDate} - ${lastDate}`;
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 1. League Navigation Bar (Chọn giải theo Đất Nước 2 tầng, bỏ các nút 'Tất cả') */}
      <div className="rounded-3xl border border-border/80 bg-card/60 backdrop-blur-xl shadow-md overflow-hidden">
        <LeagueBar
          leagues={leaguesList}
          selectedLeague={selectedLeague}
          hideAllOption={true}
          onSelectLeague={(code) => {
            setSelectedLeague(code);
            setSelectedRound("ALL");
          }}
        />
      </div>

      {/* 2. League Hero & Season Progress Overview Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-950/40 via-card to-card border border-border/80 p-5 sm:p-7 shadow-xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          {/* League Info */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl bg-white p-2 flex items-center justify-center flex-shrink-0 shadow-xl border border-black/10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={currentLeagueObj.logo}
                alt={currentLeagueObj.name}
                className="w-full h-full object-contain"
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
                  {currentLeagueObj.name}
                </span>
                <span className="text-lg">{currentLeagueObj.flag}</span>
              </div>
              <p className="text-xs sm:text-sm font-semibold text-muted-foreground flex items-center gap-2">
                <span>Mùa giải {leagueData.seasonName}</span>
                <span>•</span>
                <span className="text-emerald-500 font-bold">
                  {currentLeagueObj.type === "CUP" ? "Giải Đấu Cúp" : "Giải Vô Địch Quốc Gia"}
                </span>
              </p>
            </div>
          </div>

          {/* Season Stats Badge Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 w-full md:w-auto">
            <div className="bg-secondary/60 border border-border/80 rounded-2xl p-2.5 text-center">
              <p className="text-[10px] font-bold text-muted-foreground uppercase">Tổng số trận</p>
              <p className="text-base sm:text-lg font-black text-foreground font-mono">
                {leagueData.totalMatches}
              </p>
            </div>

            <div className="bg-emerald-500/10 border border-emerald-500/25 rounded-2xl p-2.5 text-center">
              <p className="text-[10px] font-bold text-emerald-500 uppercase">Đã thi đấu</p>
              <p className="text-base sm:text-lg font-black text-emerald-500 font-mono">
                {leagueData.finishedCount}
              </p>
            </div>

            <div className="bg-secondary/60 border border-border/80 rounded-2xl p-2.5 text-center">
              <p className="text-[10px] font-bold text-muted-foreground uppercase">Sắp diễn ra</p>
              <p className="text-base sm:text-lg font-black text-foreground font-mono">
                {leagueData.scheduledCount}
              </p>
            </div>

            <div className="bg-amber-500/10 border border-amber-500/25 rounded-2xl p-2.5 text-center">
              <p className="text-[10px] font-bold text-amber-500 uppercase">Tổng bàn thắng</p>
              <p className="text-base sm:text-lg font-black text-amber-500 font-mono">
                {leagueData.totalGoals}
              </p>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-5 pt-4 border-t border-border/60">
          <div className="flex items-center justify-between text-xs font-bold mb-1.5">
            <span className="text-muted-foreground">Tiến độ mùa giải</span>
            <span className="text-emerald-500 font-mono font-black">{progressPercent}% Hoàn thành</span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-secondary/80 overflow-hidden border border-border/60">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* 3. Streamlined Filter Bar (Chỉ gồm: Lọc Trạng thái, Chọn Vòng đấu, Tìm CLB) */}
      <div className="relative z-30 bg-card/85 border border-border/80 rounded-3xl p-3 sm:p-4 backdrop-blur-xl shadow-md">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* 1. Status Filter Buttons: Tất cả, Trực tiếp, Đã đá, Sắp đá */}
          <div className="flex items-center bg-secondary/80 p-1 rounded-2xl border border-border/80 overflow-x-auto no-scrollbar flex-shrink-0 shadow-inner">
            {[
              { key: "ALL", label: "Tất cả", icon: LayoutGrid },
              { key: "LIVE", label: "Trực tiếp", icon: Radio, isLive: true },
              { key: "FINISHED", label: "Đã đá", icon: CheckCircle2 },
              { key: "SCHEDULED", label: "Sắp đá", icon: Clock },
            ].map((st) => {
              const Icon = st.icon;
              const isSelected = selectedStatus === st.key;
              return (
                <button
                  key={st.key}
                  type="button"
                  onClick={() => setSelectedStatus(st.key)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap active:scale-95",
                    isSelected
                      ? st.isLive
                        ? "bg-rose-500 text-white font-black shadow-md shadow-rose-500/25 scale-[1.02]"
                        : "bg-emerald-500 text-white font-black shadow-md shadow-emerald-500/25 scale-[1.02]"
                      : "text-muted-foreground hover:text-foreground hover:bg-card/50"
                  )}
                >
                  <Icon
                    className={cn(
                      "w-3.5 h-3.5 flex-shrink-0",
                      st.isLive && (isSelected ? "text-white animate-pulse" : "text-rose-500 animate-pulse")
                    )}
                  />
                  <span>{st.label}</span>
                </button>
              );
            })}
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1 md:justify-end">
            {/* 2. Ô chọn vòng đấu (Custom Luxury Dropdown) */}
            {leagueData.rounds.length > 0 && (
              <div ref={roundDropdownRef} className="relative flex-shrink-0 z-50">
                <button
                  type="button"
                  onClick={() => setIsRoundDropdownOpen(!isRoundDropdownOpen)}
                  className={cn(
                    "w-full sm:w-auto flex items-center justify-between gap-2.5 px-3.5 py-2 rounded-2xl border text-xs font-bold transition-all cursor-pointer shadow-2xs active:scale-95",
                    isRoundDropdownOpen
                      ? "bg-secondary border-emerald-500 ring-2 ring-emerald-500/20 text-foreground"
                      : selectedRound !== "ALL"
                      ? "bg-emerald-500/10 hover:bg-emerald-500/15 border-emerald-500/40 text-emerald-500 dark:text-emerald-400 font-extrabold"
                      : "bg-secondary/80 hover:bg-secondary border-border/80 text-foreground hover:border-emerald-500/40 font-bold"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 flex items-center justify-center flex-shrink-0 text-xs">
                      📅
                    </div>
                    <span className="truncate max-w-[140px] sm:max-w-none">
                      {selectedRound === "ALL"
                        ? `Tất cả các vòng (${leagueData.rounds.length})`
                        : selectedRound}
                    </span>
                    {selectedRound === currentActiveRound && (
                      <span className="text-[10px] px-1 py-0.2 rounded-md bg-amber-500/15 text-amber-500 font-black border border-amber-500/30">
                        🔥
                      </span>
                    )}
                  </div>
                  <ChevronDown
                    className={cn(
                      "w-3.5 h-3.5 text-muted-foreground transition-transform duration-200",
                      isRoundDropdownOpen && "rotate-180 text-emerald-500"
                    )}
                  />
                </button>

                {/* Popover Floating Menu */}
                {isRoundDropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-[calc(100vw-3rem)] sm:w-80 max-h-96 bg-card/95 backdrop-blur-2xl border border-border/90 rounded-3xl shadow-2xl p-3 z-50 animate-in fade-in-0 zoom-in-95 duration-150 flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between px-2 pb-2 mb-2 border-b border-border/60">
                      <span className="text-xs font-black text-foreground uppercase tracking-wider">
                        Chọn Vòng Đấu
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-secondary text-muted-foreground border border-border/60">
                        {leagueData.rounds.length} vòng
                      </span>
                    </div>

                    {/* Quick Shortcut: Vòng hiện tại */}
                    {currentActiveRound && (
                      <button
                        type="button"
                        onClick={() => {
                          jumpToRound(currentActiveRound);
                          setIsRoundDropdownOpen(false);
                        }}
                        className="w-full mb-2 flex items-center justify-between px-3 py-2 rounded-2xl bg-gradient-to-r from-amber-500/15 to-orange-500/10 hover:from-amber-500/25 hover:to-orange-500/20 text-amber-500 border border-amber-500/30 text-xs font-black transition-all cursor-pointer shadow-2xs active:scale-98"
                      >
                        <div className="flex items-center gap-2">
                          <Flame className="w-3.5 h-3.5 animate-bounce" />
                          <span>Vòng hiện tại ({currentActiveRound})</span>
                        </div>
                        <span className="text-[10px] text-amber-600 dark:text-amber-400 font-mono">Xem ngay →</span>
                      </button>
                    )}

                    {/* Scrollable list */}
                    <div className="overflow-y-auto space-y-1.5 max-h-60 pr-1 scrollbar-thin">
                      {/* Option: Tất cả các vòng */}
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedRound("ALL");
                          setIsRoundDropdownOpen(false);
                        }}
                        className={cn(
                          "w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border",
                          selectedRound === "ALL"
                            ? "bg-emerald-500 text-white border-emerald-400 font-black shadow-sm"
                            : "hover:bg-secondary text-foreground border-transparent hover:border-border/60"
                        )}
                      >
                        <span className="flex items-center gap-2">
                          <span>🏆</span>
                          <span>Tất cả các vòng ({leagueData.rounds.length})</span>
                        </span>
                        {selectedRound === "ALL" && <Check className="w-4 h-4" />}
                      </button>

                      {/* Grid of rounds */}
                      <div className="grid grid-cols-2 gap-1.5 pt-1">
                        {leagueData.rounds.map((r) => {
                          const isSelected = selectedRound === r;
                          const isCurrent = currentActiveRound === r;
                          return (
                            <button
                              key={r}
                              type="button"
                              onClick={() => {
                                jumpToRound(r);
                                setIsRoundDropdownOpen(false);
                              }}
                              className={cn(
                                "flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border text-left",
                                isSelected
                                  ? "bg-emerald-500 text-white border-emerald-400 font-black shadow-sm"
                                  : isCurrent
                                  ? "bg-amber-500/10 text-amber-500 border-amber-500/30 hover:bg-amber-500/20"
                                  : "bg-secondary/50 hover:bg-secondary text-muted-foreground hover:text-foreground border-border/60 hover:border-emerald-500/40"
                              )}
                            >
                              <span className="truncate">{r}</span>
                              {isSelected ? (
                                <Check className="w-3.5 h-3.5 flex-shrink-0" />
                              ) : isCurrent ? (
                                <span className="text-[10px] flex-shrink-0">🔥</span>
                              ) : null}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 3. Ô tìm câu lạc bộ */}
            <div className="relative flex-1 sm:max-w-[260px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                placeholder="Tìm theo tên CLB..."
                value={searchTeam}
                onChange={(e) => setSearchTeam(e.target.value)}
                className="w-full pl-9 pr-7 py-2 text-xs bg-secondary/80 border border-border/80 rounded-2xl focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-foreground placeholder:text-muted-foreground font-semibold"
              />
              {searchTeam && (
                <button
                  type="button"
                  onClick={() => setSearchTeam("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-secondary text-muted-foreground hover:text-foreground flex items-center justify-center text-[10px] cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Matches List Grouped by Round */}
      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center gap-3 text-muted-foreground">
          <RefreshCw className="w-8 h-8 animate-spin text-emerald-500" />
          <p className="text-sm font-semibold">Đang tải toàn bộ lịch thi đấu {currentLeagueObj.shortName}...</p>
        </div>
      ) : Object.keys(groupedMatches).length === 0 ? (
        <div className="py-20 text-center bg-card/60 border border-border/70 rounded-3xl p-8 backdrop-blur-xl">
          <div className="w-14 h-14 rounded-2xl bg-secondary mx-auto flex items-center justify-center text-muted-foreground mb-3">
            <Trophy className="w-7 h-7" />
          </div>
          <h3 className="font-extrabold text-base text-foreground">Không có trận đấu nào</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            Không tìm thấy trận đấu nào phù hợp với bộ lọc {selectedRound !== "ALL" ? `"${selectedRound}"` : ""} của bạn.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedMatches).map(([roundName, roundMatches]) => {
            const dateRange = formatRoundDateRange(roundMatches);
            const finishedInRound = roundMatches.filter((m) => m.status === "FINISHED").length;

            return (
              <div
                key={roundName}
                id={`round-${roundName.replace(/\s+/g, "-")}`}
                className="space-y-3 scroll-mt-24"
              >
                {/* Round Header Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-3 py-2.5 rounded-2xl bg-card/80 border border-border/80 shadow-xs backdrop-blur-md">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 flex items-center justify-center flex-shrink-0 font-black text-xs">
                      ⚽
                    </div>
                    <div>
                      <h3 className="text-sm sm:text-base font-black text-foreground">
                        {roundName}
                      </h3>
                      {dateRange && (
                        <p className="text-[11px] font-semibold text-muted-foreground">
                          Thời gian: {dateRange}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs font-bold">
                    <span className="px-2.5 py-1 rounded-xl bg-secondary text-muted-foreground font-mono text-[11px]">
                      {roundMatches.length} Trận
                    </span>
                    {finishedInRound === roundMatches.length ? (
                      <span className="px-2.5 py-1 rounded-xl bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 text-[11px] font-black">
                        Đã xong
                      </span>
                    ) : finishedInRound > 0 ? (
                      <span className="px-2.5 py-1 rounded-xl bg-amber-500/15 text-amber-500 border border-amber-500/30 text-[11px] font-black">
                        Đang diễn ra ({finishedInRound}/{roundMatches.length})
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-xl bg-secondary text-muted-foreground text-[11px]">
                        Chưa đá
                      </span>
                    )}
                  </div>
                </div>

                {/* Match Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {roundMatches.map((m) => {
                    const isFinished = m.status === "FINISHED";
                    const isLive = m.status === "LIVE";
                    const hasPen = m.homePenaltyScore !== null && m.awayPenaltyScore !== null;
                    const goalsInMatch = (m.events || []).filter((e) => e.type === "GOAL" || e.type === "PENALTY_SCORED");

                    return (
                      <div
                        key={m.id}
                        onClick={() => onSelectMatch(m.id)}
                        className={cn(
                          "group relative p-3.5 sm:p-4 rounded-3xl border transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md active:scale-[0.99]",
                          isLive
                            ? "bg-card border-rose-500/40 hover:border-rose-500"
                            : "bg-card/70 hover:bg-card border-border/70 hover:border-border"
                        )}
                      >
                        {/* Top Match Info Row */}
                        <div className="flex items-center justify-between text-[11px] font-bold text-muted-foreground mb-3">
                          <div className="flex items-center gap-2">
                            <Clock className="w-3 h-3 text-emerald-500" />
                            <span className="font-mono text-foreground font-semibold">
                              {formatMatchTime(m.matchDate)}
                            </span>
                          </div>

                          {/* Status Badge */}
                          <div>
                            {isLive ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400 font-mono font-black text-[10px] animate-pulse border border-rose-500/30">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                {m.minute || "LIVE"}
                              </span>
                            ) : isFinished ? (
                              <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground font-bold px-2 py-0.5 rounded-md bg-secondary/60">
                                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                FT
                              </span>
                            ) : (
                              <span className="text-[10px] font-semibold text-muted-foreground/80">
                                Sắp đấu
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Teams & Score Row */}
                        <div className="space-y-2">
                          {/* Home Team */}
                          <div className="flex items-center justify-between gap-2">
                            <div
                              onClick={(e) => {
                                if (onSelectTeam) {
                                  e.stopPropagation();
                                  onSelectTeam(m.homeTeam.id);
                                }
                              }}
                              className="flex items-center gap-2.5 min-w-0 flex-1 group/team hover:opacity-80 transition-opacity"
                            >
                              <div className="w-6 h-6 rounded-lg bg-white p-0.5 flex items-center justify-center flex-shrink-0 shadow-2xs border border-black/10">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={m.homeTeam.logo}
                                  alt={m.homeTeam.name}
                                  className="w-full h-full object-contain"
                                />
                              </div>
                              <span
                                className={cn(
                                  "text-xs sm:text-sm font-extrabold truncate",
                                  isFinished && m.homeScore > m.awayScore
                                    ? "text-foreground font-black"
                                    : "text-foreground/90"
                                )}
                              >
                                {m.homeTeam.name}
                              </span>
                            </div>

                            {/* Score / Dash */}
                            <div className="font-mono font-black text-sm sm:text-base px-2">
                              {isFinished || isLive ? (
                                <span
                                  className={cn(
                                    m.homeScore > m.awayScore
                                      ? "text-foreground font-black"
                                      : "text-muted-foreground"
                                  )}
                                >
                                  {m.homeScore}
                                </span>
                              ) : (
                                <span className="text-muted-foreground/40">-</span>
                              )}
                            </div>
                          </div>

                          {/* Away Team */}
                          <div className="flex items-center justify-between gap-2">
                            <div
                              onClick={(e) => {
                                if (onSelectTeam) {
                                  e.stopPropagation();
                                  onSelectTeam(m.awayTeam.id);
                                }
                              }}
                              className="flex items-center gap-2.5 min-w-0 flex-1 group/team hover:opacity-80 transition-opacity"
                            >
                              <div className="w-6 h-6 rounded-lg bg-white p-0.5 flex items-center justify-center flex-shrink-0 shadow-2xs border border-black/10">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={m.awayTeam.logo}
                                  alt={m.awayTeam.name}
                                  className="w-full h-full object-contain"
                                />
                              </div>
                              <span
                                className={cn(
                                  "text-xs sm:text-sm font-extrabold truncate",
                                  isFinished && m.awayScore > m.homeScore
                                    ? "text-foreground font-black"
                                    : "text-foreground/90"
                                )}
                              >
                                {m.awayTeam.name}
                              </span>
                            </div>

                            {/* Score / Dash */}
                            <div className="font-mono font-black text-sm sm:text-base px-2">
                              {isFinished || isLive ? (
                                <span
                                  className={cn(
                                    m.awayScore > m.homeScore
                                      ? "text-foreground font-black"
                                      : "text-muted-foreground"
                                  )}
                                >
                                  {m.awayScore}
                                </span>
                              ) : (
                                <span className="text-muted-foreground/40">-</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Bottom Extra Info (HT / Penalty / Stadium / Goalscorers) */}
                        {(m.homeHalfTimeScore !== null || hasPen || m.stadium || goalsInMatch.length > 0) && (
                          <div className="mt-3 pt-2.5 border-t border-border/50 flex items-center justify-between text-[10px] text-muted-foreground font-medium">
                            <div className="flex items-center gap-2 truncate">
                              {m.homeHalfTimeScore !== null && m.awayHalfTimeScore !== null && isFinished && (
                                <span className="font-mono font-bold bg-secondary/80 px-1.5 py-0.5 rounded-md">
                                  HT {m.homeHalfTimeScore}-{m.awayHalfTimeScore}
                                </span>
                              )}

                              {hasPen && (
                                <span className="font-mono font-bold text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded-md">
                                  PEN {m.homePenaltyScore}-{m.awayPenaltyScore}
                                </span>
                              )}

                              {m.stadium && (
                                <span className="truncate max-w-[140px] text-muted-foreground/80">
                                  🏟️ {m.stadium}
                                </span>
                              )}
                            </div>

                            <span className="text-emerald-500 font-bold group-hover:translate-x-0.5 transition-transform flex-shrink-0">
                              Chi tiết →
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
