"use server";

import { prisma } from "@/lib/prisma";
import { MatchStatus, Prisma } from "@/generated/prisma/client";

export async function getLeagues() {
  try {
    return await prisma.league.findMany({
      orderBy: { order: "asc" },
      include: {
        _count: {
          select: {
            matches: {
              where: {
                status: MatchStatus.LIVE,
              },
            },
          },
        },
      },
    });
  } catch (error) {
    console.error("Error fetching leagues:", error);
    return [];
  }
}

let lastLiveSyncTime = 0;

export async function syncLiveMatchesFromEspn(): Promise<void> {
  const now = Date.now();
  // Throttle to once every 15 seconds
  if (now - lastLiveSyncTime < 15000) return;
  lastLiveSyncTime = now;

  try {
    const allTeams = await prisma.team.findMany();
    const teamMap = new Map<string, string>();
    for (const t of allTeams) {
      teamMap.set(t.name.toLowerCase().trim(), t.id);
      teamMap.set(t.shortName.toLowerCase().trim(), t.id);
    }

    const processEvents = async (events: any[]) => {
      for (const ev of events) {
        const comp = ev.competitions ? ev.competitions[0] : null;
        const competitors = comp?.competitors || ev.competitors || [];
        const h = competitors.find((c: any) => c.homeAway === "home") || competitors[0];
        const a = competitors.find((c: any) => c.homeAway === "away") || competitors[1];
        if (!h || !a) continue;

        const hName = (h.team?.displayName || h.team?.name || h.displayName || h.name || "").toLowerCase().trim();
        const aName = (a.team?.displayName || a.team?.name || a.displayName || a.name || "").toLowerCase().trim();

        let homeTeamId = teamMap.get(hName);
        let awayTeamId = teamMap.get(aName);

        if (!homeTeamId) {
          const found = allTeams.find(t => t.name.toLowerCase().includes(hName) || hName.includes(t.name.toLowerCase()));
          if (found) homeTeamId = found.id;
        }
        if (!awayTeamId) {
          const found = allTeams.find(t => t.name.toLowerCase().includes(aName) || aName.includes(t.name.toLowerCase()));
          if (found) awayTeamId = found.id;
        }

        if (!homeTeamId || !awayTeamId) continue;

        const rawState = comp?.status?.type?.state || ev.status;
        let status: MatchStatus = MatchStatus.SCHEDULED;
        if (rawState === "in") status = MatchStatus.LIVE;
        else if (rawState === "post") status = MatchStatus.FINISHED;

        const homeScore = parseInt(h.score || "0", 10);
        const awayScore = parseInt(a.score || "0", 10);
        const displayClock = comp?.status?.displayClock || ev.clock || ev.displayClock || (status === MatchStatus.LIVE ? "Đang đá" : null);

        // Tỉ số Hiệp 1 (HT)
        const hLinescore = h.linescores?.[0]?.displayValue ?? h.linescores?.[0]?.value;
        const aLinescore = a.linescores?.[0]?.displayValue ?? a.linescores?.[0]?.value;
        const homeHalfTimeScore = hLinescore != null ? parseInt(hLinescore, 10) : null;
        const awayHalfTimeScore = aLinescore != null ? parseInt(aLinescore, 10) : null;

        // Tỉ số Penalty (nếu có)
        const hPen = h.shootoutScore ?? (h.linescores?.length > 2 ? h.linescores?.[2]?.displayValue : null);
        const aPen = a.shootoutScore ?? (a.linescores?.length > 2 ? a.linescores?.[2]?.displayValue : null);
        const homePenaltyScore = hPen != null ? parseInt(hPen, 10) : null;
        const awayPenaltyScore = aPen != null ? parseInt(aPen, 10) : null;

        const eventDate = ev.date ? new Date(ev.date) : new Date();

        // Match with database within +/- 2 days of the event date
        const existing = await prisma.match.findFirst({
          where: {
            homeTeamId,
            awayTeamId,
            matchDate: {
              gte: new Date(eventDate.getTime() - 2 * 86400 * 1000),
              lte: new Date(eventDate.getTime() + 2 * 86400 * 1000),
            },
          },
        });

        if (existing) {
          const scoreChanged = existing.homeScore !== homeScore || existing.awayScore !== awayScore || existing.status !== status;

          await prisma.match.update({
            where: { id: existing.id },
            data: {
              homeScore,
              awayScore,
              status,
              minute: displayClock,
              ...(homeHalfTimeScore !== null ? { homeHalfTimeScore } : {}),
              ...(awayHalfTimeScore !== null ? { awayHalfTimeScore } : {}),
              ...(homePenaltyScore !== null ? { homePenaltyScore } : {}),
              ...(awayPenaltyScore !== null ? { awayPenaltyScore } : {}),
            },
          });

          // 1. Tự động đồng bộ chi tiết chuyên sâu cho trận Live hoặc vừa thay đổi tỷ số
          if (status === MatchStatus.LIVE || (status === MatchStatus.FINISHED && scoreChanged)) {
            try {
              const { fetchAndSyncLiveMatchDetail } = await import("@/lib/services/match-detail-service");
              await fetchAndSyncLiveMatchDetail(existing.id);
            } catch (e) {
              console.warn(`Live detail sync failed for match ${existing.id}:`, e);
            }
          }
        }
      }
    };

    // 1. Fetch Global Soccer Header from ESPN Web API
    try {
      const headerRes = await fetch("https://site.web.api.espn.com/apis/v2/scoreboard/header?sport=soccer", {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          "Accept": "application/json",
        },
      });
      if (headerRes.ok) {
        const headerData = await headerRes.json();
        const soccerSports = headerData.sports?.[0];
        for (const lg of soccerSports?.leagues || []) {
          if (lg.events && lg.events.length > 0) {
            await processEvents(lg.events);
          }
        }
      }
    } catch (e) {
      console.warn("ESPN global header sync warning:", e);
    }

    // 2. Fetch specific active tournament scoreboards
    const leagueEspnCodes = [
      "ita.coppa_italia", "ger.dfb_pokal", "eng.1", "esp.1", "ita.1", "ger.1", "fra.1",
      "eng.fa", "eng.league_cup", "esp.copa_del_rey", "fra.coupe_de_france",
      "uefa.champions", "uefa.europa", "uefa.europa.conf"
    ];

    await Promise.allSettled(
      leagueEspnCodes.map(async (code) => {
        try {
          const res = await fetch(`https://site.web.api.espn.com/apis/site/v2/sports/soccer/${code}/scoreboard`, {
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
              "Accept": "application/json",
            },
          });
          if (res.ok) {
            const data = await res.json();
            if (data.events && data.events.length > 0) {
              await processEvents(data.events);
            }
          }
        } catch {
          // Ignore individual league network errors
        }
      })
    );
  } catch (err) {
    console.error("Live match sync error:", err);
  }
}

export async function getMatches(params?: {
  date?: string; // YYYY-MM-DD
  leagueCode?: string;
  status?: string; // "ALL" | "LIVE" | "SCHEDULED" | "FINISHED"
  seasonName?: string;
}) {
  try {
    // Synchronize live scores from ESPN
    await syncLiveMatchesFromEspn();

    const where: Prisma.MatchWhereInput = {};

    // Filter by Season
    if (params?.seasonName && params.seasonName !== "ALL") {
      where.season = {
        name: params.seasonName,
      };
    }

    // Filter by Date (Chuẩn xác 100% theo Múi giờ Việt Nam UTC+7 / Asia/Ho_Chi_Minh)
    if (params?.date) {
      const [year, month, day] = params.date.split("-").map(Number);
      // 00:00:00 ngày được chọn theo giờ VN (tương ứng 17:00:00 UTC ngày hôm trước)
      const startOfDayVN = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0) - 7 * 3600 * 1000);
      // 23:59:59.999 ngày được chọn theo giờ VN (tương ứng 16:59:59.999 UTC ngày hôm đó)
      const endOfDayVN = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999) - 7 * 3600 * 1000);

      where.matchDate = {
        gte: startOfDayVN,
        lte: endOfDayVN,
      };
    }

    // Filter by League Code or Country
    if (params?.leagueCode && params.leagueCode !== "ALL") {
      if (params.leagueCode.startsWith("COUNTRY:")) {
        const country = params.leagueCode.replace("COUNTRY:", "");
        where.league = {
          country: country,
        };
      } else {
        where.league = {
          code: params.leagueCode,
        };
      }
    }

    // Filter by Match Status
    if (params?.status && params.status !== "ALL") {
      where.status = params.status as MatchStatus;
    }

    const matches = await prisma.match.findMany({
      where,
      orderBy: [
        { status: "asc" },
        { matchDate: "asc" },
      ],
      include: {
        league: true,
        homeTeam: true,
        awayTeam: true,
        events: {
          orderBy: { minute: "asc" },
          include: {
            player: true,
            assistPlayer: true,
          },
        },
        stats: true,
      },
    });

    return matches;
  } catch (error) {
    console.error("Error fetching matches:", error);
    return [];
  }
}

export async function getFullLeagueFixtures(params: {
  leagueCode: string;
  seasonName?: string;
  status?: string;
  round?: string;
  searchTeam?: string;
}) {
  try {
    // Synchronize live scores from ESPN
    await syncLiveMatchesFromEspn();

    const season = await prisma.season.findFirst({
      where: params.seasonName ? { name: params.seasonName } : { isCurrent: true },
    });
    if (!season) return { league: null, rounds: [], matches: [], teams: [], totalMatches: 0, finishedCount: 0, scheduledCount: 0, liveCount: 0, totalGoals: 0 };

    let league = null;
    let leagueIdFilter: Prisma.StringFilter | string | undefined = undefined;

    if (params.leagueCode.startsWith("COUNTRY:")) {
      const country = params.leagueCode.replace("COUNTRY:", "");
      const countryLeagues = await prisma.league.findMany({
        where: { country: country },
        orderBy: { order: "asc" },
      });
      if (countryLeagues.length > 0) {
        league = countryLeagues[0];
        leagueIdFilter = { in: countryLeagues.map((l) => l.id) } as any;
      }
    } else if (params.leagueCode !== "ALL") {
      league = await prisma.league.findUnique({
        where: { code: params.leagueCode },
      });
      if (league) {
        leagueIdFilter = league.id;
      }
    } else {
      // Default to PL
      league = await prisma.league.findFirst({
        where: { code: "PL" },
      });
      if (league) {
        leagueIdFilter = league.id;
      }
    }

    if (!league) return { league: null, rounds: [], matches: [], teams: [], totalMatches: 0, finishedCount: 0, scheduledCount: 0, liveCount: 0, totalGoals: 0 };

    // 1. Fetch all rounds in chronological order
    const allRoundsRaw = await prisma.match.findMany({
      where: {
        leagueId: leagueIdFilter,
        seasonId: season.id,
      },
      select: { round: true, matchDate: true },
      orderBy: { matchDate: "asc" },
    });

    const seenRounds = new Set<string>();
    const rounds: string[] = [];
    for (const m of allRoundsRaw) {
      if (m.round && !seenRounds.has(m.round)) {
        seenRounds.add(m.round);
        rounds.push(m.round);
      }
    }

    // 2. Build where filter for matches
    const where: Prisma.MatchWhereInput = {
      leagueId: leagueIdFilter,
      seasonId: season.id,
    };

    if (params.status && params.status !== "ALL") {
      where.status = params.status as MatchStatus;
    }

    if (params.round && params.round !== "ALL") {
      where.round = params.round;
    }

    if (params.searchTeam && params.searchTeam.trim()) {
      const q = params.searchTeam.trim();
      where.OR = [
        { homeTeam: { name: { contains: q, mode: "insensitive" } } },
        { homeTeam: { shortName: { contains: q, mode: "insensitive" } } },
        { awayTeam: { name: { contains: q, mode: "insensitive" } } },
        { awayTeam: { shortName: { contains: q, mode: "insensitive" } } },
      ];
    }

    const matches = await prisma.match.findMany({
      where,
      orderBy: [
        { matchDate: "asc" },
      ],
      include: {
        league: true,
        homeTeam: true,
        awayTeam: true,
        events: {
          include: {
            player: true,
            assistPlayer: true,
          },
          orderBy: [{ minute: "asc" }, { extraMinute: "asc" }],
        },
      },
    });

    // 3. Stats for banner
    const allLeagueMatches = await prisma.match.findMany({
      where: { leagueId: league.id, seasonId: season.id },
      select: { status: true, homeScore: true, awayScore: true },
    });

    const totalMatches = allLeagueMatches.length;
    const finishedCount = allLeagueMatches.filter((m) => m.status === "FINISHED").length;
    const liveCount = allLeagueMatches.filter((m) => m.status === "LIVE").length;
    const scheduledCount = allLeagueMatches.filter((m) => m.status === "SCHEDULED").length;
    const totalGoals = allLeagueMatches.reduce((acc, m) => acc + (m.homeScore || 0) + (m.awayScore || 0), 0);

    // 4. Teams in league
    const teams = await prisma.team.findMany({
      where: { leagueId: league.id },
      orderBy: { name: "asc" },
    });

    return {
      league,
      seasonName: season.name,
      rounds,
      matches,
      teams,
      totalMatches,
      finishedCount,
      scheduledCount,
      liveCount,
      totalGoals,
    };
  } catch (error) {
    console.error("Error fetching full league fixtures:", error);
    return { league: null, rounds: [], matches: [], teams: [], totalMatches: 0, finishedCount: 0, scheduledCount: 0, liveCount: 0, totalGoals: 0 };
  }
}

export async function getMatchById(matchId: string) {
  try {
    // 1. Synchronize live match events, stats, lineups from ESPN
    try {
      const { fetchAndSyncLiveMatchDetail } = await import("@/lib/services/match-detail-service");
      await fetchAndSyncLiveMatchDetail(matchId);
    } catch (e) {
      console.warn("Live match detail sync skipped:", e);
    }

    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        league: true,
        season: true,
        homeTeam: {
          include: {
            players: true,
          },
        },
        awayTeam: {
          include: {
            players: true,
          },
        },
        events: {
          orderBy: { minute: "asc" },
          include: {
            player: true,
            assistPlayer: true,
            team: true,
          },
        },
        stats: true,
        lineups: {
          include: {
            player: true,
            team: true,
          },
        },
      },
    });

    if (!match) return null;

    // Fetch Head-to-Head & Recent Form from ESPN API or fallback to DB
    const { fetchEspnH2HAndForm } = await import("@/lib/services/h2h-service");
    const espnH2H = await fetchEspnH2HAndForm(
      match.league.code,
      match.homeTeam.name,
      match.awayTeam.name,
      match.matchDate
    );

    if (espnH2H && espnH2H.h2hMatches.length > 0) {
      return {
        match,
        h2hMatches: espnH2H.h2hMatches,
        h2hSummary: espnH2H.h2hSummary,
        homeRecentForm: espnH2H.homeRecentForm,
        awayRecentForm: espnH2H.awayRecentForm,
      };
    }

    // Fallback: Fetch Head-to-Head matches from local database
    const dbH2hMatches = await prisma.match.findMany({
      where: {
        OR: [
          { homeTeamId: match.homeTeamId, awayTeamId: match.awayTeamId },
          { homeTeamId: match.awayTeamId, awayTeamId: match.homeTeamId },
        ],
        status: MatchStatus.FINISHED,
      },
      orderBy: { matchDate: "desc" },
      take: 5,
      include: {
        homeTeam: true,
        awayTeam: true,
        league: true,
      },
    });

    const homeWins = dbH2hMatches.filter(
      (m) =>
        (m.homeTeamId === match.homeTeamId && m.homeScore > m.awayScore) ||
        (m.awayTeamId === match.homeTeamId && m.awayScore > m.homeScore)
    ).length;

    const awayWins = dbH2hMatches.filter(
      (m) =>
        (m.homeTeamId === match.awayTeamId && m.homeScore > m.awayScore) ||
        (m.awayTeamId === match.awayTeamId && m.awayScore > m.homeScore)
    ).length;

    const draws = dbH2hMatches.filter((m) => m.homeScore === m.awayScore).length;

    return {
      match,
      h2hMatches: dbH2hMatches,
      h2hSummary: {
        summaryText: `${match.homeTeam.name} vs ${match.awayTeam.name}`,
        totalMatches: dbH2hMatches.length,
        homeWins,
        draws,
        awayWins,
      },
    };
  } catch (error) {
    console.error(`Error fetching match with id ${matchId}:`, error);
    return null;
  }
}

export async function getLiveMatchesCount(date?: string) {
  try {
    const where: Prisma.MatchWhereInput = { status: MatchStatus.LIVE };
    if (date) {
      const [year, month, day] = date.split("-").map(Number);
      const startOfDayVN = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0) - 7 * 3600 * 1000);
      const endOfDayVN = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999) - 7 * 3600 * 1000);
      where.matchDate = {
        gte: startOfDayVN,
        lte: endOfDayVN,
      };
    }
    return await prisma.match.count({ where });
  } catch {
    return 0;
  }
}
