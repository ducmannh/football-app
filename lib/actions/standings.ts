"use server";

import { prisma } from "@/lib/prisma";
import { StandingItem } from "@/types/football";
import { syncRealStandingsForSeason, ensureSeasonExists } from "@/lib/services/football-sync";
import { unstable_cache } from "next/cache";

/**
 * Lấy Bảng xếp hạng theo mã giải đấu và mùa giải (ví dụ: 2025/2026, 2024/2025, 2023/2024, 2026/2027)
 * Tự động cào dữ liệu thực tế từ internet nếu mùa giải chưa có trong database!
 */
export async function getStandings(
  leagueCode = "PL",
  seasonName?: string
): Promise<StandingItem[]> {
  try {
    return await fetchStandingsFromDB(leagueCode, seasonName);
  } catch (error) {
    console.error("Error fetching standings:", error);
    return [];
  }
}

async function fetchStandingsFromDB(code: string, sName?: string): Promise<StandingItem[]> {
  const league = await prisma.league.findUnique({
    where: { code },
  });

  if (!league) return [];

  let targetSeason = null;
  if (sName) {
    targetSeason = await prisma.season.findUnique({
      where: { name: sName },
    });

    if (!targetSeason) {
      targetSeason = await ensureSeasonExists(sName);
    }
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

  if (!targetSeason) return [];

  let standings = await prisma.standing.findMany({
    where: {
      leagueId: league.id,
      seasonId: targetSeason.id,
    },
    include: {
      team: true,
      league: true,
      season: true,
    },
    orderBy: {
      position: "asc",
    },
  });

  // Nếu chưa có dữ liệu BXH cho mùa này -> Tự động cào tức thì từ ESPN!
  if (standings.length === 0) {
    try {
      await syncRealStandingsForSeason(targetSeason.name, code);
      standings = await prisma.standing.findMany({
        where: {
          leagueId: league.id,
          seasonId: targetSeason.id,
        },
        include: {
          team: true,
          league: true,
          season: true,
        },
        orderBy: {
          position: "asc",
        },
      });
    } catch (err) {
      console.error("Lỗi tự động cào BXH:", err);
    }
  }

  // Cung cấp thông tin phong độ chi tiết (đối thủ, tỉ số, sân nhà/khách) cho từng đội
  const finishedMatches = await prisma.match.findMany({
    where: {
      leagueId: league.id,
      seasonId: targetSeason.id,
      status: "FINISHED",
    },
    include: {
      homeTeam: true,
      awayTeam: true,
    },
    orderBy: {
      matchDate: "asc",
    },
  });

  const enrichedStandings = standings.map((s) => {
    // Nếu đội chưa thi đấu trận nào (played === 0) -> Phong độ rỗng tuyệt đối
    if (s.played === 0) {
      return {
        ...s,
        form: null,
        formDetails: [],
      };
    }

    const teamMatches = finishedMatches.filter(
      (m) => m.homeTeamId === s.teamId || m.awayTeamId === s.teamId
    );

    const teamHomeMatches = finishedMatches.filter((m) => m.homeTeamId === s.teamId);
    const teamAwayMatches = finishedMatches.filter((m) => m.awayTeamId === s.teamId);

    let homePlayed = teamHomeMatches.length;
    let homeWon = teamHomeMatches.filter((m) => m.homeScore > m.awayScore).length;
    let homeDraw = teamHomeMatches.filter((m) => m.homeScore === m.awayScore).length;
    let homeLost = teamHomeMatches.filter((m) => m.homeScore < m.awayScore).length;
    let homeGoalsFor = teamHomeMatches.reduce((acc, m) => acc + m.homeScore, 0);
    let homeGoalsAgainst = teamHomeMatches.reduce((acc, m) => acc + m.awayScore, 0);
    let homePoints = homeWon * 3 + homeDraw;

    let awayPlayed = teamAwayMatches.length;
    let awayWon = teamAwayMatches.filter((m) => m.awayScore > m.homeScore).length;
    let awayDraw = teamAwayMatches.filter((m) => m.awayScore === m.homeScore).length;
    let awayLost = teamAwayMatches.filter((m) => m.awayScore < m.homeScore).length;
    let awayGoalsFor = teamAwayMatches.reduce((acc, m) => acc + m.awayScore, 0);
    let awayGoalsAgainst = teamAwayMatches.reduce((acc, m) => acc + m.homeScore, 0);
    let awayPoints = awayWon * 3 + awayDraw;

    // Fallback if matches list is empty but standing has records
    if (homePlayed === 0 && awayPlayed === 0 && s.played > 0) {
      homePlayed = s.homePlayed || Math.ceil(s.played / 2);
      homeWon = s.homeWon || Math.ceil(s.won / 2);
      homeDraw = s.homeDraw || Math.ceil(s.draw / 2);
      homeLost = s.homeLost || Math.ceil(s.lost / 2);
      homeGoalsFor = s.homeGoalsFor || Math.ceil(s.goalsFor / 2);
      homeGoalsAgainst = s.homeGoalsAgainst || Math.ceil(s.goalsAgainst / 2);
      homePoints = s.homePoints || (homeWon * 3 + homeDraw);

      awayPlayed = s.awayPlayed || (s.played - homePlayed);
      awayWon = s.awayWon || (s.won - homeWon);
      awayDraw = s.awayDraw || (s.draw - homeDraw);
      awayLost = s.awayLost || (s.lost - homeLost);
      awayGoalsFor = s.awayGoalsFor || (s.goalsFor - homeGoalsFor);
      awayGoalsAgainst = s.awayGoalsAgainst || (s.goalsAgainst - homeGoalsAgainst);
      awayPoints = s.awayPoints || (awayWon * 3 + awayDraw);
    }

    const recent5 = teamMatches.slice(-5);

    if (recent5.length > 0) {
      const formDetails = recent5.map((m) => {
        const isHome = m.homeTeamId === s.teamId;
        const opp = isHome ? m.awayTeam : m.homeTeam;
        const teamScore = isHome ? m.homeScore : m.awayScore;
        const oppScore = isHome ? m.awayScore : m.homeScore;
        const teamPen = isHome ? m.homePenaltyScore : m.awayPenaltyScore;
        const oppPen = isHome ? m.awayPenaltyScore : m.homePenaltyScore;

        let result: "W" | "D" | "L" = "D";
        let actionText = "Hòa";

        if (teamScore > oppScore) {
          result = "W";
          actionText = "Thắng";
        } else if (teamScore < oppScore) {
          result = "L";
          actionText = "Thua";
        } else {
          if (teamPen != null && oppPen != null) {
            if (teamPen > oppPen) {
              result = "W";
              actionText = `Thắng Pen (${teamPen}-${oppPen})`;
            } else if (teamPen < oppPen) {
              result = "L";
              actionText = `Thua Pen (${teamPen}-${oppPen})`;
            }
          }
        }

        const venue = isHome ? "Sân nhà" : "Sân khách";
        const scoreStr = `${teamScore} - ${oppScore}`;
        const tooltipText = `${actionText} ${scoreStr} vs ${opp.name} (${venue})`;

        return {
          result,
          score: scoreStr,
          opponentName: opp.name,
          opponentShortName: opp.shortName || opp.name,
          opponentLogo: opp.logo,
          isHome,
          tooltipText,
          matchId: m.id,
        };
      });

      return {
        ...s,
        homePlayed,
        homeWon,
        homeDraw,
        homeLost,
        homeGoalsFor,
        homeGoalsAgainst,
        homePoints,
        awayPlayed,
        awayWon,
        awayDraw,
        awayLost,
        awayGoalsFor,
        awayGoalsAgainst,
        awayPoints,
        form: formDetails.map((f) => f.result).join(""),
        formDetails,
      };
    }

    // Fallback nếu không có trận chi tiết nhưng có chuỗi form (mùa cũ)
    const fallbackFormDetails = (s.form || "").split("").map((ch, idx) => {
      const res = (ch === "W" ? "W" : ch === "L" ? "L" : "D") as "W" | "D" | "L";
      const action = res === "W" ? "Thắng" : res === "L" ? "Thua" : "Hòa";
      return {
        result: res,
        score: "",
        opponentName: "",
        isHome: true,
        tooltipText: `Trận ${idx + 1}: ${action}`,
      };
    });

    return {
      ...s,
      formDetails: fallbackFormDetails,
    };
  });

  return enrichedStandings as unknown as StandingItem[];
}
