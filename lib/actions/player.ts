"use server";

import { prisma } from "@/lib/prisma";
import { PlayerDetailData, PlayerSeasonStatItem, MatchItem, Player, Team, League } from "@/types/football";

export async function getPlayerById(playerId: string): Promise<PlayerDetailData | null> {
  try {
    const player = await prisma.player.findUnique({
      where: { id: playerId },
      include: {
        team: {
          include: {
            league: true,
          },
        },
        stats: {
          include: {
            league: true,
            season: true,
            player: {
              include: {
                team: true,
              },
            },
          },
        },
      },
    });

    if (!player) return null;

    // Lấy các trận gần nhất của đội bóng mà cầu thủ góp mặt
    const recentMatchesRaw = await prisma.match.findMany({
      where: {
        OR: [{ homeTeamId: player.teamId }, { awayTeamId: player.teamId }],
      },
      include: {
        league: true,
        homeTeam: true,
        awayTeam: true,
        events: {
          where: {
            OR: [{ playerId: playerId }, { assistPlayerId: playerId }],
          },
          include: {
            player: true,
            assistPlayer: true,
          },
        },
      },
      orderBy: { matchDate: "desc" },
      take: 6,
    });

    const EUROPEAN_CUP_CODES = ["CL", "EL", "ECL", "USC"];
    const filteredStats = (player.stats || []).filter((s) => {
      const code = s.league?.code?.toUpperCase() || "";
      if (EUROPEAN_CUP_CODES.includes(code)) return true;
      if (s.league?.type === "LEAGUE" || s.leagueId === player.team?.leagueId) return true;
      return false;
    });

    const recentMatches = recentMatchesRaw as unknown as MatchItem[];

    return {
      player: {
        ...player,
        team: player.team as unknown as Team & { league: League },
        stats: filteredStats as unknown as PlayerSeasonStatItem[],
      } as unknown as Player & { team: Team & { league: League }; stats?: PlayerSeasonStatItem[] },
      recentMatches,
    };
  } catch (error) {
    console.error("Lỗi khi lấy thông tin chi tiết cầu thủ:", error);
    return null;
  }
}
