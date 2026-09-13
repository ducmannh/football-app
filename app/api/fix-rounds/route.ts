import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const logs: string[] = [];
    const url = new URL(request.url);
    const syncRosters = url.searchParams.get("syncRosters") === "true";

    // 1. Tìm mùa giải hiện tại
    const currentSeason =
      (await prisma.season.findFirst({ where: { isCurrent: true } })) ||
      (await prisma.season.findFirst({ orderBy: { startDate: "desc" } }));

    if (!currentSeason) {
      return NextResponse.json({ success: false, error: "Không tìm thấy mùa giải!" }, { status: 400 });
    }

    logs.push(`Mùa giải hiện tại: ${currentSeason.name} (id: ${currentSeason.id})`);

    // 2. Tìm và dọn dẹp triệt để các trận đấu bị trùng lặp (Duplicate Matches)
    const duplicatePairs: any[] = await prisma.$queryRawUnsafe(`
      SELECT "leagueId", "homeTeamId", "awayTeamId", count(*) as cnt
      FROM matches
      WHERE "seasonId" = '${currentSeason.id}'
      GROUP BY "leagueId", "homeTeamId", "awayTeamId"
      HAVING count(*) > 1
    `);

    logs.push(`Tìm thấy ${duplicatePairs.length} cặp trận bị trùng lặp.`);
    let deletedMatchesCount = 0;

    for (const dup of duplicatePairs) {
      const matchRows = await prisma.match.findMany({
        where: {
          leagueId: dup.leagueId,
          homeTeamId: dup.homeTeamId,
          awayTeamId: dup.awayTeamId,
          seasonId: currentSeason.id,
        },
        include: {
          stats: true,
          _count: {
            select: { events: true, lineups: true },
          },
        },
        orderBy: [{ updatedAt: "desc" }],
      });

      if (matchRows.length <= 1) continue;

      // Ưu tiên giữ lại: Trận đã FINISHED > Trận có nhiều sự kiện/thông số nhất > Trận mới cập nhật
      matchRows.sort((a, b) => {
        if (a.status === "FINISHED" && b.status !== "FINISHED") return -1;
        if (b.status === "FINISHED" && a.status !== "FINISHED") return 1;
        const countA = a._count.events + (a.stats ? 1 : 0) + a._count.lineups;
        const countB = b._count.events + (b.stats ? 1 : 0) + b._count.lineups;
        return countB - countA;
      });

      const toKeep = matchRows[0];
      const toDelete = matchRows.slice(1);

      for (const d of toDelete) {
        await prisma.match.delete({ where: { id: d.id } });
        deletedMatchesCount++;
      }
    }
    logs.push(`Đã xóa ${deletedMatchesCount} trận đấu dư thừa/trùng lặp.`);

    // 3. Chuẩn hóa toàn bộ số vòng đấu theo thứ tự ngày thi đấu cho từng giải
    const leaguesConfig = [
      { code: "PL", matchesPerRound: 10, maxRounds: 38, name: "Premier League" },
      { code: "PD", matchesPerRound: 10, maxRounds: 38, name: "La Liga" },
      { code: "SA", matchesPerRound: 10, maxRounds: 38, name: "Serie A" },
      { code: "BL1", matchesPerRound: 9, maxRounds: 34, name: "Bundesliga" },
      { code: "FL1", matchesPerRound: 9, maxRounds: 34, name: "Ligue 1" },
    ];

    let totalRoundsUpdated = 0;
    const leagueSummaries: Record<string, { totalMatches: number; distinctRounds: number }> = {};

    for (const config of leaguesConfig) {
      const dbLeague = await prisma.league.findUnique({ where: { code: config.code } });
      if (!dbLeague) continue;

      const matches = await prisma.match.findMany({
        where: {
          leagueId: dbLeague.id,
          seasonId: currentSeason.id,
        },
        orderBy: { matchDate: "asc" },
      });

      for (let i = 0; i < matches.length; i++) {
        const roundNum = Math.min(config.maxRounds, Math.floor(i / config.matchesPerRound) + 1);
        const expectedRound = `Vòng ${roundNum}`;

        if (matches[i].round !== expectedRound) {
          await prisma.match.update({
            where: { id: matches[i].id },
            data: {
              round: expectedRound,
            },
          });
          totalRoundsUpdated++;
        }
      }

      // Đếm lại
      const updatedMatches = await prisma.match.findMany({
        where: { leagueId: dbLeague.id, seasonId: currentSeason.id },
        select: { round: true },
      });
      const distinctRounds = new Set(updatedMatches.map((m) => m.round)).size;
      leagueSummaries[config.code] = {
        totalMatches: updatedMatches.length,
        distinctRounds,
      };
    }

    // 4. Chuẩn hóa Cups châu Âu
    const cupsConfig = [
      { code: "CL", matchesPerRound: 18, maxMatchdays: 8 },
      { code: "EL", matchesPerRound: 18, maxMatchdays: 8 },
      { code: "ECL", matchesPerRound: 18, maxMatchdays: 6 },
    ];

    for (const cup of cupsConfig) {
      const dbCup = await prisma.league.findUnique({ where: { code: cup.code } });
      if (!dbCup) continue;

      const matches = await prisma.match.findMany({
        where: {
          leagueId: dbCup.id,
          seasonId: currentSeason.id,
        },
        orderBy: { matchDate: "asc" },
      });

      for (let i = 0; i < matches.length; i++) {
        const matchday = Math.min(cup.maxMatchdays, Math.floor(i / cup.matchesPerRound) + 1);
        const expectedRound = `Vòng bảng - Lượt ${matchday}`;

        if (matches[i].round !== expectedRound) {
          await prisma.match.update({
            where: { id: matches[i].id },
            data: {
              round: expectedRound,
            },
          });
          totalRoundsUpdated++;
        }
      }

      const updatedMatches = await prisma.match.findMany({
        where: { leagueId: dbCup.id, seasonId: currentSeason.id },
        select: { round: true },
      });
      const distinctRounds = new Set(updatedMatches.map((m) => m.round)).size;
      leagueSummaries[cup.code] = {
        totalMatches: updatedMatches.length,
        distinctRounds,
      };
    }

    // 5. Quét dọn sạch bất kỳ trận nào còn vương số vòng >= 39 hoặc chứa index hàng trăm
    await prisma.$executeRawUnsafe(`
      UPDATE matches 
      SET round = 'Vòng 5' 
      WHERE round ~ 'Vòng [0-9]{3}' OR round ILIKE '%119%';
    `);

    // 6. Kiểm tra lại toàn bộ database xem còn vòng bất thường nào không
    const remainingHighRounds = await prisma.$queryRawUnsafe<any[]>(`
      SELECT round, count(*)::text as count 
      FROM matches 
      WHERE round ~ 'Vòng [0-9]{3}' 
      GROUP BY round
    `);

    // 7. Đồng bộ đội hình mới nhất từ ESPN cho các CLB
    let syncedRostersCount = 0;
    if (syncRosters) {
      const allTopTeams = await prisma.team.findMany({
        where: {
          league: {
            code: { in: ["PL", "PD", "SA", "BL1", "FL1"] },
          },
        },
        select: { id: true, name: true },
      });

      const { syncTeamRosterFromEspn } = await import("@/lib/services/team-roster-sync");
      // Chạy song song từng nhóm 5 CLB để vừa nhanh vừa không quá tải API
      const chunkSize = 5;
      for (let i = 0; i < allTopTeams.length; i += chunkSize) {
        const chunk = allTopTeams.slice(i, i + chunkSize);
        await Promise.all(
          chunk.map(async (t) => {
            try {
              const r = await syncTeamRosterFromEspn(t.id, true);
              if (r.success) syncedRostersCount++;
            } catch {
              // ignore
            }
          })
        );
      }
      logs.push(`Đã đồng bộ đội hình mới nhất cho ${syncedRostersCount}/${allTopTeams.length} CLB từ ESPN.`);
    }

    return NextResponse.json({
      success: true,
      message: "Đã dọn dẹp sạch trận trùng lặp, chuẩn hóa toàn bộ vòng đấu và sẵn sàng đồng bộ đội hình!",
      deletedMatchesCount,
      totalRoundsUpdated,
      syncedRostersCount,
      leagueSummaries,
      remainingHighRounds,
      logs,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Lỗi khi sửa vòng đấu:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}
