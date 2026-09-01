const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
  "Accept": "application/json",
};

export interface EspnStatCategory {
  name: string;
  displayName: string;
  labels: string[];
  names: string[];
  displayNames: string[];
  statistics: {
    name?: string;
    season?: { displayName: string; name?: string };
    team?: { displayName: string; abbreviation?: string; logos?: { href: string }[] };
    stats: string[];
  }[];
}

export interface EspnGlossaryItem {
  abbreviation: string;
  displayName: string;
}

export interface EspnAthleteStatsResponse {
  categories: EspnStatCategory[];
  glossary: EspnGlossaryItem[];
}

// In-memory cache for fast responsiveness
const espnStatsCache = new Map<string, EspnAthleteStatsResponse>();

export async function fetchEspnAthleteStats(
  playerName: string,
  teamName?: string,
  espnId?: string | null
): Promise<EspnAthleteStatsResponse | null> {
  const cacheKey = `${espnId || playerName.toLowerCase()}_${(teamName || "").toLowerCase()}`;
  if (espnStatsCache.has(cacheKey)) {
    return espnStatsCache.get(cacheKey)!;
  }

  try {
    let athleteId = espnId;

    // If no espnId, try searching player on ESPN
    if (!athleteId) {
      const searchUrl = `https://site.web.api.espn.com/apis/search/v2?query=${encodeURIComponent(playerName)}&limit=10`;
      const res = await fetch(searchUrl, { headers: HEADERS });
      if (res.ok) {
        const data = await res.json();
        const playerResults = data.results?.find((r: any) => r.type === "player")?.contents || [];
        if (playerResults.length > 0) {
          athleteId = playerResults[0]?.id;
          if (teamName && playerResults.length > 1) {
            const match = playerResults.find((p: any) =>
              p.team?.displayName?.toLowerCase().includes(teamName.toLowerCase()) ||
              teamName.toLowerCase().includes(p.team?.displayName?.toLowerCase() || "")
            );
            if (match) athleteId = match.id;
          }
        }
      }
    }

    if (!athleteId) return null;

    // 2. Fetch stats
    const statsUrl = `https://site.web.api.espn.com/apis/common/v3/sports/soccer/athletes/${athleteId}/stats`;
    const stRes = await fetch(statsUrl, { headers: HEADERS });
    if (!stRes.ok) return null;

    const stData = await stRes.json();
    if (stData && Array.isArray(stData.categories) && stData.categories.length > 0) {
      const result: EspnAthleteStatsResponse = {
        categories: stData.categories,
        glossary: stData.glossary || [],
      };
      espnStatsCache.set(cacheKey, result);
      return result;
    }
  } catch (err) {
    console.error(`Failed to fetch ESPN stats for ${playerName}:`, err);
  }

  return null;
}
