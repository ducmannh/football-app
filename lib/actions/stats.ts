"use server";

import { prisma } from "@/lib/prisma";
import { PlayerSeasonStatItem } from "@/types/football";

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
