import { H2HMatchItem, H2HSummary, RecentFormItem } from "@/types/football";

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
  "Accept": "application/json",
};

const LEAGUE_ESPN_MAP: Record<string, string> = {
  PL: "eng.1",
  FAC: "eng.fa",
  EFL: "eng.league_cup",
  PD: "esp.1",
  CDR: "esp.copa_del_rey",
  SA: "ita.1",
  CI: "ita.coppa_italia",
  BL1: "ger.1",
  DFB: "ger.dfb_pokal",
  FL1: "fra.1",
  CDF: "fra.coupe_de_france",
  CL: "uefa.champions",
  EL: "uefa.europa",
  ECL: "uefa.europa.conf",
  USC: "uefa.super_cup",
};

export function cleanTournamentName(name?: string | null): string {
  if (!name) return "Giải Đấu";
  let cleaned = name
    .replace(/^\d{4}(-\d{2,4})?\s+/gi, "") // Bỏ năm '2025-26 ' hoặc '2026 '
    .replace(/English\s+/gi, "")
    .replace(/Spanish\s+/gi, "")
    .replace(/Italian\s+/gi, "")
    .replace(/German\s+/gi, "")
    .replace(/French\s+/gi, "")
    .replace(/UEFA\s+/gi, "")
    .replace(/LaLiga/gi, "La Liga")
    .trim();

  if (cleaned.toLowerCase().includes("club friendly") || cleaned.toLowerCase().includes("friendly")) {
    return "Giao Hữu";
  }

  return cleaned || name;
}

export async function fetchEspnH2HAndForm(
  leagueCode: string,
  homeTeamName: string,
  awayTeamName: string,
  matchDate?: string | Date
): Promise<{
  h2hSummary: H2HSummary;
  h2hMatches: H2HMatchItem[];
  homeRecentForm: RecentFormItem[];
  awayRecentForm: RecentFormItem[];
} | null> {
  try {
    const espnLeague = LEAGUE_ESPN_MAP[leagueCode] || "eng.1";

    let dateParam = "20260810-20260910";
    if (matchDate) {
      const d = new Date(matchDate);
      if (!isNaN(d.getTime())) {
        const start = new Date(d.getTime() - 4 * 86400000).toISOString().slice(0, 10).replace(/-/g, "");
        const end = new Date(d.getTime() + 4 * 86400000).toISOString().slice(0, 10).replace(/-/g, "");
        dateParam = `${start}-${end}`;
      }
    }

    // 1. Search scoreboard for the match event ID
    let scoreUrl = `https://site.api.espn.com/apis/site/v2/sports/soccer/${espnLeague}/scoreboard?dates=${dateParam}`;
    let scoreRes = await fetch(scoreUrl, { 
      headers: HEADERS, 
      signal: AbortSignal.timeout(2000),
      next: { revalidate: 3600 } 
    }).catch(() => null);

    let scoreData = scoreRes && scoreRes.ok ? await scoreRes.json().catch(() => null) : null;
    let events = scoreData?.events || [];

    const normalize = (s: string) =>
      s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s*fc\s*|\s*afc\s*|\s*cf\s*|\s*sc\s*|\s*rc\s*|\s*ac\s*|\s*as\s*|\s*ss\s*|\s*1\.\s*|\s*vfb\s*/gi, "").trim();

    const cleanHome = normalize(homeTeamName);
    const cleanAway = normalize(awayTeamName);

    let foundEvent = events.find((ev: any) => {
      const comp = ev.competitions?.[0];
      const h = normalize(comp?.competitors?.find((c: any) => c.homeAway === "home")?.team?.displayName || "");
      const a = normalize(comp?.competitors?.find((c: any) => c.homeAway === "away")?.team?.displayName || "");
      return (
        (h.includes(cleanHome) || cleanHome.includes(h)) &&
        (a.includes(cleanAway) || cleanAway.includes(a))
      );
    });

    // Fallback: search wide season range if not found in specific round window
    if (!foundEvent && dateParam !== "20260810-20260910") {
      scoreUrl = `https://site.api.espn.com/apis/site/v2/sports/soccer/${espnLeague}/scoreboard?dates=20260810-20260910`;
      scoreRes = await fetch(scoreUrl, { 
        headers: HEADERS, 
        signal: AbortSignal.timeout(2000),
        next: { revalidate: 3600 } 
      }).catch(() => null);

      scoreData = scoreRes && scoreRes.ok ? await scoreRes.json().catch(() => null) : null;
      events = scoreData?.events || [];

      foundEvent = events.find((ev: any) => {
        const comp = ev.competitions?.[0];
        const h = normalize(comp?.competitors?.find((c: any) => c.homeAway === "home")?.team?.displayName || "");
        const a = normalize(comp?.competitors?.find((c: any) => c.homeAway === "away")?.team?.displayName || "");
        return (
          (h.includes(cleanHome) || cleanHome.includes(h)) &&
          (a.includes(cleanAway) || cleanAway.includes(a))
        );
      });
    }

    if (!foundEvent) return null;

    // 2. Fetch match summary from ESPN
    const sumUrl = `https://site.api.espn.com/apis/site/v2/sports/soccer/${espnLeague}/summary?event=${foundEvent.id}`;
    const sumRes = await fetch(sumUrl, { 
      headers: HEADERS, 
      signal: AbortSignal.timeout(1500),
      next: { revalidate: 3600 } 
    }).catch(() => null);
    if (!sumRes || !sumRes.ok) return null;

    const sumData = await sumRes.json().catch(() => null);
    if (!sumData) return null;

    // 3. Parse Head-to-Head series
    const series = sumData.seasonseries?.[0];
    const h2hEvents: H2HMatchItem[] = (series?.events || []).map((ev: any) => {
      const h = ev.competitors?.find((c: any) => c.homeAway === "home");
      const a = ev.competitors?.find((c: any) => c.homeAway === "away");
      const hScore = parseInt(h?.score || "0", 10);
      const aScore = parseInt(a?.score || "0", 10);

      return {
        id: ev.id,
        date: ev.date,
        competitionName: cleanTournamentName(ev.competitionName),
        homeTeamName: h?.team?.displayName || "Đội nhà",
        homeTeamLogo: h?.team?.logo || "",
        homeScore: hScore,
        awayTeamName: a?.team?.displayName || "Đội khách",
        awayTeamLogo: a?.team?.logo || "",
        awayScore: aScore,
        winner: hScore > aScore ? "home" : aScore > hScore ? "away" : "draw",
      };
    });

    // 4. Parse Recent Form for both teams
    const lastFive = sumData.lastFiveGames || [];
    const homeLastFive = lastFive[0]?.events || [];
    const awayLastFive = lastFive[1]?.events || [];

    const homeRecentForm: RecentFormItem[] = homeLastFive
      .map((g: any) => ({
        id: g.id || String(Math.random()),
        date: g.gameDate || new Date().toISOString(),
        result: (g.gameResult || "D") as "W" | "D" | "L",
        score: g.score || "0-0",
        opponent: g.opponent?.displayName || "Đối thủ",
        opponentLogo: g.opponentLogo || g.opponent?.logo || "",
        competition: cleanTournamentName(g.competitionName || g.leagueName),
      }))
      .sort((a: RecentFormItem, b: RecentFormItem) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const awayRecentForm: RecentFormItem[] = awayLastFive
      .map((g: any) => ({
        id: g.id || String(Math.random()),
        date: g.gameDate || new Date().toISOString(),
        result: (g.gameResult || "D") as "W" | "D" | "L",
        score: g.score || "0-0",
        opponent: g.opponent?.displayName || "Đối thủ",
        opponentLogo: g.opponentLogo || g.opponent?.logo || "",
        competition: cleanTournamentName(g.competitionName || g.leagueName),
      }))
      .sort((a: RecentFormItem, b: RecentFormItem) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const teamAName = homeTeamName.toLowerCase().replace(/\s*fc\s*|\s*afc\s*/gi, "").trim();
    const teamBName = awayTeamName.toLowerCase().replace(/\s*fc\s*|\s*afc\s*/gi, "").trim();

    const homeWins = h2hEvents.filter((e) => {
      const h = (e.homeTeamName || "").toLowerCase();
      const a = (e.awayTeamName || "").toLowerCase();
      const isHomeTeamA = h.includes(teamAName) || teamAName.includes(h);
      const isAwayTeamA = a.includes(teamAName) || teamAName.includes(a);

      if (e.homeScore > e.awayScore && isHomeTeamA) return true;
      if (e.awayScore > e.homeScore && isAwayTeamA) return true;
      return false;
    }).length;

    const awayWins = h2hEvents.filter((e) => {
      const h = (e.homeTeamName || "").toLowerCase();
      const a = (e.awayTeamName || "").toLowerCase();
      const isHomeTeamB = h.includes(teamBName) || teamBName.includes(h);
      const isAwayTeamB = a.includes(teamBName) || teamBName.includes(a);

      if (e.homeScore > e.awayScore && isHomeTeamB) return true;
      if (e.awayScore > e.homeScore && isAwayTeamB) return true;
      return false;
    }).length;

    const draws = h2hEvents.filter((e) => e.homeScore === e.awayScore).length;

    return {
      h2hSummary: {
        summaryText: series?.summary || `${homeTeamName} vs ${awayTeamName}`,
        totalMatches: h2hEvents.length,
        homeWins,
        draws,
        awayWins,
      },
      h2hMatches: h2hEvents,
      homeRecentForm,
      awayRecentForm,
    };
  } catch (error) {
    console.error("Error fetching ESPN H2H and form:", error);
    return null;
  }
}
