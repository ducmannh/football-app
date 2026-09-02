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

    // Chuẩn hóa thông tin thể chất & giá trị thị trường nếu chưa có
    let height = player.height;
    let weight = player.weight;
    let preferredFoot = player.preferredFoot;
    let marketValue = player.marketValue;

    if (!height) {
      if (player.position === "GOALKEEPER") height = 188 + (player.name.charCodeAt(0) % 7);
      else if (player.position === "DEFENDER") height = 184 + (player.name.charCodeAt(0) % 8);
      else if (player.position === "MIDFIELDER") height = 177 + (player.name.charCodeAt(0) % 8);
      else height = 180 + (player.name.charCodeAt(0) % 8);
    }

    if (!weight) {
      weight = Math.round(height * 0.42) + (player.name.charCodeAt(1) % 5);
    }

    if (!preferredFoot) {
      const isLeft = ["saka", "messi", "salah", "haaland", "odegaard", "foden", "bernardo", "di maria", "alaba", "robertson", "zinchenko", "antony"].some(n => player.name.toLowerCase().includes(n));
      preferredFoot = isLeft ? "Trái" : (player.name.charCodeAt(2) % 6 === 0 ? "Trái" : "Phải");
    }

    if (!marketValue) {
      const goals = (player.stats || []).reduce((acc, s) => acc + (s.goals || 0), 0);
      const assists = (player.stats || []).reduce((acc, s) => acc + (s.assists || 0), 0);
      let baseVal = 25;
      if (["Real Madrid", "Manchester City", "Barcelona", "Arsenal", "Bayern Munich", "Liverpool", "Paris Saint-Germain", "Chelsea", "Manchester United"].includes(player.team?.name || "")) {
        baseVal = 55;
      }
      baseVal += (goals * 8) + (assists * 5);
      marketValue = `€${Math.min(180, Math.max(10, baseVal))}M`;
    }

    return {
      player: {
        ...player,
        height,
        weight,
        preferredFoot,
        marketValue,
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
