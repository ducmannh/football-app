"use client";

import React, { useState, useEffect, useCallback } from "react";
import { getLeagues, getMatches, getLiveMatchesCount } from "@/lib/actions/match";
import { Navbar, NavTab } from "@/components/navbar";
import { LeagueBar } from "@/components/league-bar";
import { DateSelector } from "@/components/date-selector";
import { LiveTicker } from "@/components/live-ticker";
import { MatchCard } from "@/components/match-card";
import { MatchDetailModal } from "@/components/match-detail-modal";
import { ClubDetailModal } from "@/components/club-detail-modal";
import { PlayerDetailModal } from "@/components/player-detail-modal";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { StandingsTable } from "@/components/standings-table";
import { StatsHub } from "@/components/stats-hub";
import { FullFixturesHub } from "@/components/full-fixtures-hub";
import {
  Search,
  RefreshCw,
  Radio,
  Clock,
  CheckCircle2,
  Trophy,
} from "lucide-react";
import { cn, getCountryFlagUrl } from "@/lib/utils";
import { League, MatchItem } from "@/types/football";

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<NavTab>("MATCHES");
  const [leagues, setLeagues] = useState<League[]>([]);
  const [matches, setMatches] = useState<MatchItem[]>([]);
  const [liveCount, setLiveCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  // Today's date in YYYY-MM-DD
  const getTodayString = () => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  const [selectedDate, setSelectedDate] = useState<string>(getTodayString());
  const [selectedLeague, setSelectedLeague] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Main data fetcher
  const loadData = useCallback(async (isBackground = false) => {
    if (!isBackground) {
      setLoading(true);
    } else {
      setIsRefreshing(true);
    }

    try {
      const [fetchedLeagues, fetchedMatches, fetchedLiveCount] = await Promise.all([
        getLeagues(),
        getMatches({
          date: selectedDate,
          leagueCode: selectedLeague,
          status: selectedStatus,
        }),
        getLiveMatchesCount(selectedDate),
      ]);

      setLeagues(fetchedLeagues as League[]);
      setMatches(fetchedMatches as unknown as MatchItem[]);
      setLiveCount(fetchedLiveCount);
    } catch (error) {
      console.error("Failed to load football data:", error);
    } finally {
      if (!isBackground) setLoading(false);
      setIsRefreshing(false);
    }
  }, [selectedDate, selectedLeague, selectedStatus]);

  // Load when filters change
  useEffect(() => {
    loadData(false);
  }, [loadData]);

  // Smart Silent Live Polling (Cập nhật 30s ngầm khi có trận Live, không reload hay giật màn hình)
  useEffect(() => {
    // Chỉ tự động cập nhật khi có trận LIVE đang diễn ra
    if (liveCount === 0) return;

    const interval = setInterval(() => {
      // Chỉ fetch ngầm khi người dùng đang mở tab trang web
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        loadData(true);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [liveCount, loadData]);

  // Live Matches list for top ticker
  const liveCountInView = selectedStatus === "ALL"
    ? matches.filter((m) => m.status === "LIVE").length
    : liveCount;
  const liveMatches = matches.filter((m) => m.status === "LIVE");

  // Client-side search filter
  const filteredMatches = matches.filter((m) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      m.homeTeam.name.toLowerCase().includes(q) ||
      m.awayTeam.name.toLowerCase().includes(q) ||
      m.league.name.toLowerCase().includes(q) ||
      m.round.toLowerCase().includes(q)
    );
  });

  // Group filtered matches by League
  const matchesByLeague = filteredMatches.reduce(
    (acc: Record<string, MatchItem[]>, match) => {
      const leagueCode = match.league.code;
      if (!acc[leagueCode]) {
        acc[leagueCode] = [];
      }
      acc[leagueCode].push(match);
      return acc;
    },
    {}
  );

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors pb-20 md:pb-0">
      {/* 1. Header Navbar with Tab Navigation */}
      <Navbar
        liveCount={liveCount}
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          scrollToTop();
        }}
      />

      {/* 2. Top Quick League Bar (Visible on Matches view) */}
      {activeTab === "MATCHES" && (
        <>
          <LeagueBar
            leagues={leagues}
            selectedLeague={selectedLeague}
            onSelectLeague={(code) => setSelectedLeague(code)}
          />

          {/* 3. Horizontal Date Selector */}
          <DateSelector
            selectedDate={selectedDate}
            onSelectDate={(date) => {
              setSelectedDate(date);
              if (selectedStatus === "LIVE") {
                setSelectedStatus("ALL");
              }
            }}
            hasLiveToday={liveCount > 0}
          />

          {/* 4. Live Match Ticker Banner */}
          <LiveTicker
            liveMatches={liveMatches}
            onSelectMatch={(id) => setSelectedMatchId(id)}
          />
        </>
      )}

      {/* 5. Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-2.5 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* Module 1: MATCH CENTER */}
        {activeTab === "MATCHES" && (
          <>
            {/* Controls Toolbar: Search + Status Filter Tabs + Refresh */}
            <div className="flex flex-col gap-2.5 bg-card/75 border border-border/80 p-2.5 sm:p-4 rounded-2xl sm:rounded-3xl backdrop-blur-xl shadow-sm">
              {/* Status Filter Tabs (Scrollable on mobile, compact pills) */}
              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
                <button
                  type="button"
                  onClick={() => setSelectedStatus("ALL")}
                  className={cn(
                    "px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border whitespace-nowrap active:scale-95",
                    selectedStatus === "ALL"
                      ? "bg-foreground text-background border-foreground shadow-xs font-black"
                      : "bg-secondary/70 text-muted-foreground border-transparent hover:text-foreground hover:bg-secondary"
                  )}
                >
                  Tất cả ({matches.length})
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedStatus("LIVE")}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border whitespace-nowrap active:scale-95",
                    selectedStatus === "LIVE"
                      ? "bg-rose-500 text-white border-rose-400 shadow-md shadow-rose-500/20 font-black"
                      : "bg-secondary/70 text-muted-foreground border-transparent hover:text-rose-500 hover:bg-rose-500/10"
                  )}
                >
                  <Radio className="w-3.5 h-3.5" />
                  <span>Trực tiếp</span>
                  {liveCountInView > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full bg-rose-600 text-white text-[10px] font-extrabold">
                      {liveCountInView}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedStatus("SCHEDULED")}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border whitespace-nowrap active:scale-95",
                    selectedStatus === "SCHEDULED"
                      ? "bg-amber-500 text-white border-amber-400 shadow-md shadow-amber-500/20 font-black"
                      : "bg-secondary/70 text-muted-foreground border-transparent hover:text-amber-500 hover:bg-amber-500/10"
                  )}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Sắp đá</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedStatus("FINISHED")}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border whitespace-nowrap active:scale-95",
                    selectedStatus === "FINISHED"
                      ? "bg-indigo-600 text-white border-indigo-400 shadow-md shadow-indigo-500/20 font-black"
                      : "bg-secondary/70 text-muted-foreground border-transparent hover:text-indigo-500 hover:bg-indigo-500/10"
                  )}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Đã kết thúc</span>
                </button>
              </div>

              {/* Bottom Row: Search Input + Refresh Button */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Tìm kiếm câu lạc bộ, giải đấu..."
                    className="w-full pl-9 pr-4 py-2 rounded-xl bg-background/80 border border-border/80 text-xs sm:text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => loadData(true)}
                  disabled={loading || isRefreshing}
                  aria-label="Làm mới dữ liệu"
                  className="p-2.5 rounded-xl border border-border/80 bg-background/80 hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors cursor-pointer flex-shrink-0 shadow-2xs active:scale-95"
                  title="Làm mới dữ liệu"
                >
                  <RefreshCw
                    className={cn("w-4 h-4 text-emerald-500", (loading || isRefreshing) && "animate-spin")}
                  />
                </button>
              </div>
            </div>

            {/* Matches Grouped By League */}
            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3 text-muted-foreground">
                <RefreshCw className="w-8 h-8 animate-spin text-emerald-500" />
                <p className="text-sm font-semibold">Đang tải lịch thi đấu...</p>
              </div>
            ) : filteredMatches.length === 0 ? (
              <div className="py-16 text-center bg-card/60 border border-border/70 rounded-3xl p-8 backdrop-blur-xl">
                <div className="w-12 h-12 rounded-2xl bg-secondary mx-auto flex items-center justify-center text-muted-foreground mb-3">
                  <Trophy className="w-6 h-6" />
                </div>
                <h3 className="font-extrabold text-base text-foreground">
                  Không có trận đấu nào
                </h3>
                <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                  Không tìm thấy trận đấu nào trong ngày này phù hợp với bộ lọc của bạn. Hãy thử chọn ngày khác hoặc đổi bộ lọc giải đấu.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(matchesByLeague).map(([leagueCode, leagueMatches]) => {
                  const leagueInfo = leagueMatches[0].league;
                  const flagUrl = getCountryFlagUrl(leagueInfo.country);

                  return (
                    <div key={leagueCode} className="space-y-2.5">
                      {/* League Header */}
                      <div className="flex items-center justify-between px-1">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-lg bg-white p-0.5 flex items-center justify-center flex-shrink-0 shadow-xs border border-black/10">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={leagueInfo.logo}
                              alt={leagueInfo.name}
                              className="w-full h-full object-contain"
                            />
                          </div>

                          {flagUrl && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={flagUrl}
                              alt={leagueInfo.country}
                              className="w-4 h-3 object-cover rounded-xs shadow-xs"
                            />
                          )}

                          <h2 className="font-black text-sm sm:text-base text-foreground tracking-tight">
                            {leagueInfo.name}
                          </h2>
                          <span className="text-xs text-muted-foreground font-semibold">
                            ({leagueMatches.length} trận)
                          </span>
                        </div>

                        <span className="text-[11px] text-muted-foreground font-medium hidden sm:inline">
                          {leagueInfo.country}
                        </span>
                      </div>

                      {/* Match Cards List */}
                      <div className="grid grid-cols-1 gap-2.5">
                        {leagueMatches.map((match) => (
                          <MatchCard
                            key={match.id}
                            match={match}
                            onOpenDetail={(id) => setSelectedMatchId(id)}
                            onSelectTeam={(teamId) => setSelectedTeamId(teamId)}
                            onSelectPlayer={(playerId) => setSelectedPlayerId(playerId)}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* Module 2: FULL FIXTURES (Toàn Bộ Lịch Đấu Của Giải) */}
        {activeTab === "FULL_FIXTURES" && (
          <FullFixturesHub
            leagues={leagues}
            initialLeagueCode={selectedLeague !== "ALL" ? selectedLeague : "PL"}
            onSelectMatch={(matchId) => setSelectedMatchId(matchId)}
            onSelectTeam={(teamId) => setSelectedTeamId(teamId)}
          />
        )}

        {/* Module 3: STANDINGS (Bảng Xếp Hạng) */}
        {activeTab === "STANDINGS" && (
          <StandingsTable
            leagues={leagues}
            initialLeagueCode={selectedLeague !== "ALL" ? selectedLeague : "PL"}
            onSelectTeam={(teamId) => setSelectedTeamId(teamId)}
          />
        )}

        {/* Module 3: STATS HUB (Thống Kê Cá Nhân) */}
        {activeTab === "STATS" && (
          <StatsHub
            leagues={leagues}
            initialLeagueCode={selectedLeague !== "ALL" ? selectedLeague : "PL"}
            onSelectPlayer={(playerId) => setSelectedPlayerId(playerId)}
            onSelectTeam={(teamId) => setSelectedTeamId(teamId)}
          />
        )}
      </main>

      {/* Match Detail Modal */}
      <MatchDetailModal
        matchId={selectedMatchId}
        onClose={() => setSelectedMatchId(null)}
        onSelectTeam={(teamId) => setSelectedTeamId(teamId)}
        onSelectPlayer={(playerId) => setSelectedPlayerId(playerId)}
      />

      {/* Club Detail Modal */}
      <ClubDetailModal
        teamId={selectedTeamId}
        onClose={() => setSelectedTeamId(null)}
        onSelectPlayer={(playerId) => setSelectedPlayerId(playerId)}
        onSelectMatch={(matchId) => {
          setSelectedTeamId(null);
          setSelectedMatchId(matchId);
        }}
      />

      {/* Player Detail Modal */}
      <PlayerDetailModal
        playerId={selectedPlayerId}
        onClose={() => setSelectedPlayerId(null)}
        onSelectTeam={(teamId) => {
          setSelectedPlayerId(null);
          setSelectedTeamId(teamId);
        }}
        onSelectMatch={(matchId) => {
          setSelectedPlayerId(null);
          setSelectedMatchId(matchId);
        }}
      />

      {/* Mobile Bottom Navigation Bar */}
      <MobileBottomNav
        activeTab={activeTab}
        onSelectTab={(tab) => setActiveTab(tab)}
        selectedStatus={selectedStatus}
        onSelectStatus={(st) => setSelectedStatus(st)}
        liveCount={liveCount}
        onScrollToTop={scrollToTop}
      />
    </div>
  );
}
