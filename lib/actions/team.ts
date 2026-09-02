"use server";

import { prisma } from "@/lib/prisma";
import { TeamDetailData, MatchItem, StandingItem, Player } from "@/types/football";

export async function getTeamById(teamId: string): Promise<TeamDetailData | null> {
  try {
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        league: true,
        players: {
          orderBy: [
            { position: "asc" },
            { number: "asc" },
          ],
        },
        standings: {
          where: {
            season: { name: "2026/2027" },
          },
          include: {
            team: true,
            league: true,
            season: true,
          },
        },
      },
    });

    if (!team) return null;

    // Lấy tất cả các trận đấu trong mùa giải liên quan đến CLB này
    const matchesRaw = await prisma.match.findMany({
      where: {
        OR: [{ homeTeamId: teamId }, { awayTeamId: teamId }],
      },
      include: {
        league: true,
        homeTeam: true,
        awayTeam: true,
        events: {
          include: {
            player: true,
            assistPlayer: true,
          },
        },
      },
      orderBy: { matchDate: "asc" },
    });

    const rawMatchesList = matchesRaw as unknown as MatchItem[];

    // Chuẩn hóa tên vòng đấu theo từng giải đấu cho CLB này:
    // Với giải VĐQG: trận thứ k trong mùa của CLB luôn là "Vòng k"
    // Với Cúp Châu Âu: trận thứ k là "Vòng bảng - Lượt k"
    const matches = rawMatchesList.map((m) => {
      if (m.league?.type === "LEAGUE" || m.leagueId === team.leagueId) {
        const sameLeagueMatches = rawMatchesList
          .filter((x) => x.leagueId === m.leagueId)
          .sort((a, b) => new Date(a.matchDate).getTime() - new Date(b.matchDate).getTime());
        const matchIndex = sameLeagueMatches.findIndex((x) => x.id === m.id);
        if (matchIndex !== -1) {
          return {
            ...m,
            round: `Vòng ${matchIndex + 1}`,
          };
        }
      } else if (["CL", "EL", "ECL"].includes(m.league?.code?.toUpperCase() || "")) {
        const sameLeagueMatches = rawMatchesList
          .filter((x) => x.leagueId === m.leagueId)
          .sort((a, b) => new Date(a.matchDate).getTime() - new Date(b.matchDate).getTime());
        const matchIndex = sameLeagueMatches.findIndex((x) => x.id === m.id);
        if (matchIndex !== -1) {
          return {
            ...m,
            round: `Vòng bảng - Lượt ${matchIndex + 1}`,
          };
        }
      }
      return m;
    });

    // 1. Nhóm các trận đấu theo từng giải đấu (Competition / League)
    const leagueMap = new Map<string, { league: any; matches: MatchItem[] }>();

    for (const m of matches) {
      const lId = m.leagueId;
      if (!leagueMap.has(lId)) {
        leagueMap.set(lId, { league: m.league, matches: [] });
      }
      leagueMap.get(lId)!.matches.push(m);
    }

    // Luôn đảm bảo giải đấu chính của đội bóng xuất hiện đầu tiên
    if (team.league && !leagueMap.has(team.league.id)) {
      leagueMap.set(team.league.id, { league: team.league, matches: [] });
    }

    const competitionStats = Array.from(leagueMap.values()).map(({ league, matches: compMatches }) => {
      const finished = compMatches.filter((m) => m.status === "FINISHED");
      let won = 0;
      let draw = 0;
      let lost = 0;
      let goalsFor = 0;
      let goalsAgainst = 0;
      let cleanSheets = 0;

      const recentForm: Array<{ result: "W" | "D" | "L"; score: string; opponent: string; matchId: string }> = [];

      for (const m of finished) {
        const isHome = m.homeTeamId === teamId;
        const teamScore = isHome ? m.homeScore : m.awayScore;
        const opponentScore = isHome ? m.awayScore : m.homeScore;
        const opponentName = isHome ? m.awayTeam?.name || "Đối thủ" : m.homeTeam?.name || "Đối thủ";

        const hasShootout = m.homePenaltyScore != null && m.awayPenaltyScore != null;
        const teamPen = isHome ? m.homePenaltyScore : m.awayPenaltyScore;
        const oppPen = isHome ? m.awayPenaltyScore : m.homePenaltyScore;

        goalsFor += teamScore;
        goalsAgainst += opponentScore;

        if (opponentScore === 0) cleanSheets++;

        let res: "W" | "D" | "L" = "D";
        let scoreLabel = `${m.homeScore}-${m.awayScore}`;

        if (hasShootout && teamPen != null && oppPen != null) {
          scoreLabel += ` (Pen ${m.homePenaltyScore}-${m.awayPenaltyScore})`;
          if (teamPen > oppPen) {
            won++;
            res = "W";
          } else {
            lost++;
            res = "L";
          }
        } else {
          if (teamScore > opponentScore) {
            won++;
            res = "W";
          } else if (teamScore === opponentScore) {
            draw++;
            res = "D";
          } else {
            lost++;
            res = "L";
          }
        }

        if (recentForm.length < 5) {
          recentForm.push({
            result: res,
            score: scoreLabel,
            opponent: opponentName,
            matchId: m.id,
          });
        }
      }

      const totalMatches = finished.length;
      const winRate = totalMatches > 0 ? Math.round((won / totalMatches) * 100) : 0;
      const standing = team.standings.find((s) => s.leagueId === league.id) || null;

      return {
        leagueId: league.id,
        leagueName: league.name,
        leagueCode: league.code,
        leagueLogo: league.logo,
        leagueCountry: league.country,
        leagueType: (league.type as "LEAGUE" | "CUP") || "LEAGUE",
        standing: standing as unknown as StandingItem | null,
        totalMatches,
        won,
        draw,
        lost,
        winRate,
        goalsFor,
        goalsAgainst,
        goalDiff: goalsFor - goalsAgainst,
        cleanSheets,
        recentForm,
      };
    });

    // 2. Tính toán thống kê tổng quan toàn bộ mùa giải 2026/2027
    const allFinishedMatches = matches.filter((m) => m.status === "FINISHED");
    let totalWon = 0;
    let totalDraw = 0;
    let totalLost = 0;
    let totalGoalsFor = 0;
    let totalGoalsAgainst = 0;
    let totalCleanSheets = 0;

    for (const m of allFinishedMatches) {
      const isHome = m.homeTeamId === teamId;
      const teamScore = isHome ? m.homeScore : m.awayScore;
      const opponentScore = isHome ? m.awayScore : m.homeScore;

      const hasShootout = m.homePenaltyScore != null && m.awayPenaltyScore != null;
      const teamPen = isHome ? m.homePenaltyScore : m.awayPenaltyScore;
      const oppPen = isHome ? m.awayPenaltyScore : m.homePenaltyScore;

      totalGoalsFor += teamScore;
      totalGoalsAgainst += opponentScore;

      if (opponentScore === 0) totalCleanSheets++;

      if (hasShootout && teamPen != null && oppPen != null) {
        if (teamPen > oppPen) totalWon++;
        else totalLost++;
      } else {
        if (teamScore > opponentScore) totalWon++;
        else if (teamScore === opponentScore) totalDraw++;
        else totalLost++;
      }
    }

    const totalMatches = allFinishedMatches.length;
    const overallWinRate = totalMatches > 0 ? Math.round((totalWon / totalMatches) * 100) : 0;

    return {
      team: {
        ...team,
        players: team.players as unknown as Player[],
        standings: team.standings as unknown as StandingItem[],
      },
      matches,
      seasonName: "2026/2027",
      competitionStats,
      stats: {
        totalMatches,
        won: totalWon,
        draw: totalDraw,
        lost: totalLost,
        winRate: overallWinRate,
        goalsFor: totalGoalsFor,
        goalsAgainst: totalGoalsAgainst,
        cleanSheets: totalCleanSheets,
      },
    };
  } catch (error) {
    console.error("Lỗi khi lấy thông tin chi tiết CLB:", error);
    return null;
  }
}
