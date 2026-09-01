"use server";

import { prisma } from "@/lib/prisma";
import { ingestAllSeasons, cleanDatabase, SyncResult } from "@/lib/services/football-sync";
import { revalidateTag } from "next/cache";

export interface DatabaseSummary {
  teamsCount: number;
  playersCount: number;
  matchesCount: number;
  standingsCount: number;
  seasonsCount: number;
  leaguesCount: number;
  liveMatchesCount: number;
}

export async function getDatabaseSummary(): Promise<DatabaseSummary> {
  try {
    const [
      teamsCount,
      playersCount,
      matchesCount,
      standingsCount,
      seasonsCount,
      leaguesCount,
      liveMatchesCount,
    ] = await Promise.all([
      prisma.team.count(),
      prisma.player.count(),
      prisma.match.count(),
      prisma.standing.count(),
      prisma.season.count(),
      prisma.league.count(),
      prisma.match.count({ where: { status: "LIVE" } }),
    ]);

    return {
      teamsCount,
      playersCount,
      matchesCount,
      standingsCount,
      seasonsCount,
      leaguesCount,
      liveMatchesCount,
    };
  } catch (e) {
    console.error("Error getting database summary:", e);
    return {
      teamsCount: 0,
      playersCount: 0,
      matchesCount: 0,
      standingsCount: 0,
      seasonsCount: 0,
      leaguesCount: 0,
      liveMatchesCount: 0,
    };
  }
}

export async function triggerSync(options?: {
  clean?: boolean;
  seasons?: string[];
}): Promise<SyncResult> {
  try {
    const res = await ingestAllSeasons(options);
    try {
      revalidateTag("seasons", "max");
      revalidateTag("leagues", "max");
      revalidateTag("standings", "max");
      revalidateTag("stats", "max");
      revalidateTag("matches", "max");
    } catch {
      // ignore
    }
    return res;
  } catch (error) {
    console.error("Lỗi triggerSync server action:", error);
    return {
      success: false,
      message: `Đồng bộ thất bại: ${String(error)}`,
      cleaned: false,
      seasonsCount: 0,
      leaguesCount: 0,
      teamsCount: 0,
      playersCount: 0,
      matchesCount: 0,
      standingsCount: 0,
      statsCount: 0,
      timestamp: new Date().toISOString(),
    };
  }
}

export async function triggerCleanDatabase(): Promise<{ success: boolean; message: string }> {
  try {
    await cleanDatabase();
    try {
      revalidateTag("seasons", "max");
      revalidateTag("leagues", "max");
      revalidateTag("standings", "max");
      revalidateTag("stats", "max");
      revalidateTag("matches", "max");
    } catch {
      // ignore
    }
    return {
      success: true,
      message: "Đã dọn dẹp sạch toàn bộ dữ liệu trong cơ sở dữ liệu!",
    };
  } catch (error) {
    console.error("Lỗi triggerCleanDatabase:", error);
    return {
      success: false,
      message: `Lỗi khi dọn dẹp: ${String(error)}`,
    };
  }
}
