"use server";

import { prisma } from "@/lib/prisma";
import { PlayerSeasonStatItem, TeamDisciplineItem } from "@/types/football";

async function getTargetSeasonId(sName?: string): Promise<string | null> {
  let targetSeason = null;
  if (sName) {
    targetSeason = await prisma.season.findUnique({
      where: { name: sName },
    });
  }
  if (!targetSeason) {
    targetSeason = await prisma.season.findFirst({
      where: { isCurrent: true },
    });
  }
  if (!targetSeason) {
    targetSeason = await prisma.season.findFirst({
      orderBy: { name: "desc" },
    });
  }
  return targetSeason?.id || null;
}

/**
 * Lấy danh sách Vua phá lưới (Top Scorers) theo giải đấu và mùa giải (Real-Time)
 */
export async function getTopScorers(
  leagueCode = "PL",
  limit = 20,
  seasonName?: string
): Promise<PlayerSeasonStatItem[]> {
  try {
    const league = await prisma.league.findUnique({
      where: { code: leagueCode },
    });
    if (!league) return [];

    const seasonId = await getTargetSeasonId(seasonName);
    if (!seasonId) return [];

    const stats = await prisma.playerSeasonStat.findMany({
      where: {
        leagueId: league.id,
        seasonId,
        goals: { gt: 0 },
      },
      include: {
        player: {
          include: {
            team: true,
          },
        },
        league: true,
        season: true,
      },
      orderBy: [
        { goals: "desc" },
        { assists: "desc" },
        { minutesPlayed: "asc" },
      ],
      take: limit,
    });

    return stats as unknown as PlayerSeasonStatItem[];
  } catch (error) {
    console.error("Error fetching top scorers:", error);
    return [];
  }
}

/**
 * Lấy danh sách Vua kiến tạo (Top Assists) theo giải đấu và mùa giải (Real-Time)
 */
export async function getTopAssists(
  leagueCode = "PL",
  limit = 20,
  seasonName?: string
): Promise<PlayerSeasonStatItem[]> {
  try {
    const league = await prisma.league.findUnique({
      where: { code: leagueCode },
    });
    if (!league) return [];

    const seasonId = await getTargetSeasonId(seasonName);
    if (!seasonId) return [];

    const stats = await prisma.playerSeasonStat.findMany({
      where: {
        leagueId: league.id,
        seasonId,
        assists: { gt: 0 },
      },
      include: {
        player: {
          include: {
            team: true,
          },
        },
        league: true,
        season: true,
      },
      orderBy: [
        { assists: "desc" },
        { goals: "desc" },
        { minutesPlayed: "asc" },
      ],
      take: limit,
    });

    return stats as unknown as PlayerSeasonStatItem[];
  } catch (error) {
    console.error("Error fetching top assists:", error);
    return [];
  }
}

/**
 * Lấy danh sách Giữ sạch lưới (Clean Sheets - Găng tay vàng) theo giải đấu và mùa giải (Real-Time)
 */
export async function getTopCleanSheets(
  leagueCode = "PL",
  limit = 20,
  seasonName?: string
): Promise<PlayerSeasonStatItem[]> {
  try {
    const league = await prisma.league.findUnique({
      where: { code: leagueCode },
    });
    if (!league) return [];

    const seasonId = await getTargetSeasonId(seasonName);
    if (!seasonId) return [];

    const stats = await prisma.playerSeasonStat.findMany({
      where: {
        leagueId: league.id,
        seasonId,
        cleanSheets: { gt: 0 },
      },
      include: {
        player: {
          include: {
            team: true,
          },
        },
        league: true,
        season: true,
      },
      orderBy: [
        { cleanSheets: "desc" },
        { saves: "desc" },
        { minutesPlayed: "asc" },
      ],
      take: limit,
    });

    return stats as unknown as PlayerSeasonStatItem[];
  } catch (error) {
    console.error("Error fetching clean sheets:", error);
    return [];
  }
}

/**
 * Lấy Thống kê Kỷ luật (Thẻ vàng/đỏ) theo giải đấu và mùa giải (Real-Time)
 */
export async function getDisciplineStats(
  leagueCode = "PL",
  limit = 20,
  seasonName?: string
): Promise<PlayerSeasonStatItem[]> {
  try {
    const league = await prisma.league.findUnique({
      where: { code: leagueCode },
    });
    if (!league) return [];

    const seasonId = await getTargetSeasonId(seasonName);
    if (!seasonId) return [];

    const stats = await prisma.playerSeasonStat.findMany({
      where: {
        leagueId: league.id,
        seasonId,
        OR: [
          { yellowCards: { gt: 0 } },
          { redCards: { gt: 0 } },
        ],
      },
      include: {
        player: {
          include: {
            team: true,
          },
        },
        league: true,
        season: true,
      },
      orderBy: [
        { redCards: "desc" },
        { yellowCards: "desc" },
      ],
      take: limit,
    });

    return stats as unknown as PlayerSeasonStatItem[];
  } catch (error) {
    console.error("Error fetching discipline stats:", error);
    return [];
  }
}

const LEAGUE_ESPN_MAP: Record<string, string> = {
  PL: "eng.1",
  EFL: "eng.2",
  PD: "esp.1",
  SA: "ita.1",
  BL1: "ger.1",
  FL1: "fra.1",
  CL: "uefa.champions",
  EL: "uefa.europa",
  ECL: "uefa.europa.conf",
};

const ESPN_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
  "Accept": "text/html,application/json",
};

/**
 * Lấy Thống kê Kỷ luật theo Câu lạc bộ (Team Discipline Hub)
 */
export async function getTeamDisciplineStats(
  leagueCode = "PL",
  seasonName?: string
): Promise<TeamDisciplineItem[]> {
  try {
    const league = await prisma.league.findUnique({
      where: { code: leagueCode },
    });
    if (!league) return [];

    const seasonId = await getTargetSeasonId(seasonName);
    if (!seasonId) return [];

    const currentSeason = await prisma.season.findUnique({ where: { id: seasonId } });
    const targetSeasonName = seasonName || currentSeason?.name || "2026/2027";
    const year = targetSeasonName.startsWith("2026") ? "2026" : targetSeasonName.startsWith("2024") ? "2024" : targetSeasonName.startsWith("2023") ? "2023" : "2025";
    const leagueEspn = LEAGUE_ESPN_MAP[leagueCode] || "eng.1";

    // 1. Lấy toàn bộ sự kiện thẻ phạt từ DB cho giải & mùa này để bóc tách cầu thủ
    const events = await prisma.matchEvent.findMany({
      where: {
        type: { in: ["YELLOW_CARD", "RED_CARD"] },
        match: {
          leagueId: league.id,
          seasonId,
        },
      },
      include: {
        player: true,
        match: true,
      },
    });

    // 2. Thử cào dữ liệu Discipline chính thức từ ESPN
    try {
      const url = `https://www.espn.com/soccer/stats/_/league/${leagueEspn}/season/${year}/view/discipline`;
      const res = await fetch(url, { headers: ESPN_HEADERS, next: { revalidate: 3600 } });
      if (res.ok) {
        const html = await res.text();
        const match = html.match(/window\['__espnfitt__'\]\s*=\s*({[\s\S]*?});/);
        if (match) {
          const fitt = JSON.parse(match[1]);
          const tableRows = fitt.page?.content?.statistics?.tableRows?.[0] || [];
          if (tableRows.length > 0) {
            const results: TeamDisciplineItem[] = [];

            for (const row of tableRows) {
              const teamObj = row[1];
              const p = row[2]?.value ?? 0;
              const yc = row[3]?.value ?? 0;
              const rc = row[4]?.value ?? 0;
              const pts = row[5]?.value ?? (yc * 1 + rc * 3);

              let dbTeam = await prisma.team.findFirst({
                where: {
                  OR: [
                    { name: teamObj.name },
                    { name: { contains: teamObj.name } },
                    { shortName: teamObj.name },
                    { shortName: { contains: teamObj.name } },
                  ],
                },
              });

              if (!dbTeam) {
                dbTeam = await prisma.team.create({
                  data: {
                    name: teamObj.name,
                    shortName: teamObj.name,
                    logo: "https://media.api-sports.io/football/teams/placeholder.png",
                    leagueId: league.id,
                  },
                });
              }

              // Carded players from DB
              const teamEvents = events.filter((e) => {
                if (dbTeam && (e.teamId === dbTeam.id || e.player?.teamId === dbTeam.id)) return true;
                return false;
              });

              const playerCardMap: Record<string, { player: any; yc: number; rc: number }> = {};
              for (const e of teamEvents) {
                if (!e.playerId || !e.player) continue;
                if (!playerCardMap[e.playerId]) {
                  playerCardMap[e.playerId] = { player: e.player, yc: 0, rc: 0 };
                }
                if (e.type === "YELLOW_CARD") playerCardMap[e.playerId].yc++;
                if (e.type === "RED_CARD") playerCardMap[e.playerId].rc++;
              }

              const cardedPlayers = Object.values(playerCardMap)
                .map((item) => ({
                  id: item.player.id,
                  name: item.player.name,
                  shortName: item.player.shortName,
                  avatar: item.player.avatar,
                  number: item.player.number,
                  position: item.player.position,
                  yellowCards: item.yc,
                  redCards: item.rc,
                }))
                .sort((a, b) => b.redCards - a.redCards || b.yellowCards - a.yellowCards);

              results.push({
                id: dbTeam.id,
                teamId: dbTeam.id,
                team: dbTeam,
                appearances: p,
                yellowCards: yc,
                redCards: rc,
                points: pts,
                cardedPlayers,
              });
            }

            return results.sort((a, b) => b.points - a.points || b.redCards - a.redCards || b.yellowCards - a.yellowCards);
          }
        }
      }
    } catch {
      // Fallback below
    }

    // 3. Fallback: Tính từ DB nếu không kết nối được ESPN
    const teams = await prisma.team.findMany({
      where: { leagueId: league.id },
    });

    const matches = await prisma.match.findMany({
      where: {
        leagueId: league.id,
        seasonId,
      },
      include: {
        events: {
          where: {
            OR: [
              { type: "YELLOW_CARD" },
              { type: "RED_CARD" },
            ],
          },
          include: { player: true },
        },
        homeTeam: true,
        awayTeam: true,
      },
    });

    const gamesPlayed: Record<string, number> = {};
    for (const m of matches) {
      if (m.status === "FINISHED") {
        gamesPlayed[m.homeTeamId] = (gamesPlayed[m.homeTeamId] || 0) + 1;
        gamesPlayed[m.awayTeamId] = (gamesPlayed[m.awayTeamId] || 0) + 1;
      }
    }

    const teamCards: Record<string, {
      team: any;
      yellowCards: number;
      redCards: number;
      playerCardMap: Record<string, { player: any; yellowCards: number; redCards: number }>;
    }> = {};

    for (const t of teams) {
      teamCards[t.id] = {
        team: t,
        yellowCards: 0,
        redCards: 0,
        playerCardMap: {},
      };
    }

    for (const m of matches) {
      for (const e of m.events) {
        if (!e.playerId) continue;

        let teamId = e.teamId;
        if (!teamId && e.player?.teamId) {
          teamId = e.player.teamId;
        }

        if (!teamId || !teamCards[teamId]) {
          if (e.player?.teamId === m.homeTeamId) teamId = m.homeTeamId;
          else if (e.player?.teamId === m.awayTeamId) teamId = m.awayTeamId;
          else teamId = m.homeTeamId;
        }

        if (teamCards[teamId]) {
          const isYellow = e.type === "YELLOW_CARD";
          const isRed = e.type === "RED_CARD";

          if (isYellow) teamCards[teamId].yellowCards++;
          if (isRed) teamCards[teamId].redCards++;

          if (!teamCards[teamId].playerCardMap[e.playerId]) {
            teamCards[teamId].playerCardMap[e.playerId] = {
              player: e.player,
              yellowCards: 0,
              redCards: 0,
            };
          }

          if (isYellow) teamCards[teamId].playerCardMap[e.playerId].yellowCards++;
          if (isRed) teamCards[teamId].playerCardMap[e.playerId].redCards++;
        }
      }
    }

    const results: TeamDisciplineItem[] = Object.values(teamCards).map((tc) => {
      const pts = tc.yellowCards * 1 + tc.redCards * 3;
      const cardedPlayers = Object.values(tc.playerCardMap)
        .map((p) => ({
          id: p.player.id,
          name: p.player.name,
          shortName: p.player.shortName,
          avatar: p.player.avatar,
          number: p.player.number,
          position: p.player.position,
          yellowCards: p.yellowCards,
          redCards: p.redCards,
        }))
        .sort((a, b) => b.redCards - a.redCards || b.yellowCards - a.yellowCards);

      return {
        id: tc.team.id,
        teamId: tc.team.id,
        team: tc.team,
        appearances: gamesPlayed[tc.team.id] || 2,
        yellowCards: tc.yellowCards,
        redCards: tc.redCards,
        points: pts,
        cardedPlayers,
      };
    }).sort((a, b) => b.points - a.points || b.redCards - a.redCards || b.yellowCards - a.yellowCards);

    return results;
  } catch (error) {
    console.error("Error fetching team discipline stats:", error);
    return [];
  }
}
