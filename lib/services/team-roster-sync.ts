import { prisma } from "@/lib/prisma";
import { Position } from "@/generated/prisma/client";

const LEAGUE_ESPN_MAP: Record<string, string> = {
  PL: "eng.1",
  PD: "esp.1",
  SA: "ita.1",
  BL1: "ger.1",
  FL1: "fra.1",
};

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
  Accept: "application/json",
};

function normalizeName(s?: string | null): string {
  return (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s*fc\s*|\s*afc\s*|\s*cf\s*|\s*sc\s*|\s*rc\s*|\s*ac\s*|\s*as\s*|\s*ss\s*|\s*1\.\s*|\s*vfb\s*/gi, "")
    .trim();
}

async function fetchWithTimeout(url: string, timeoutMs = 5000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { headers: HEADERS, signal: controller.signal });
    clearTimeout(id);
    return res;
  } catch (e) {
    clearTimeout(id);
    return null;
  }
}

const espnTeamsCache = new Map<string, { data: any[]; timestamp: number }>();

/**
 * Đồng bộ đội hình mới nhất từ ESPN cho 1 câu lạc bộ
 */
export async function syncTeamRosterFromEspn(teamId: string, force = false): Promise<{ success: boolean; count: number }> {
  try {
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        league: true,
        players: true,
      },
    });

    if (!team || !team.league) return { success: false, count: 0 };

    // Nếu đã có đủ cầu thủ (> 22) và không ép buộc force thì bỏ qua để tối ưu tốc độ
    if (!force && team.players.length >= 22) {
      return { success: true, count: team.players.length };
    }

    const leagueEspn = LEAGUE_ESPN_MAP[team.league.code?.toUpperCase()] || "eng.1";

    // 1. Tìm ESPN Team ID từ danh sách đội bóng của giải đấu (sử dụng cache nếu còn hạn 1 giờ)
    let espnTeams: any[] = [];
    const cached = espnTeamsCache.get(leagueEspn);
    if (cached && Date.now() - cached.timestamp < 3600000) {
      espnTeams = cached.data;
    } else {
      const teamsRes = await fetchWithTimeout(`https://site.api.espn.com/apis/site/v2/sports/soccer/${leagueEspn}/teams`);
      if (teamsRes && teamsRes.ok) {
        const teamsData = await teamsRes.json();
        espnTeams = teamsData.sports?.[0]?.leagues?.[0]?.teams || [];
        espnTeamsCache.set(leagueEspn, { data: espnTeams, timestamp: Date.now() });
      }
    }

    if (!espnTeams || espnTeams.length === 0) return { success: false, count: 0 };

    const normTarget = normalizeName(team.name);
    const normShort = normalizeName(team.shortName);

    const matched = espnTeams.find((t: any) => {
      const dName = normalizeName(t.team?.displayName);
      const sName = normalizeName(t.team?.shortDisplayName);
      const n = normalizeName(t.team?.name);
      return (
        dName.includes(normTarget) ||
        normTarget.includes(dName) ||
        (normShort && (dName.includes(normShort) || sName.includes(normShort))) ||
        n.includes(normTarget) ||
        normTarget.includes(n)
      );
    });

    if (!matched || !matched.team?.id) {
      return { success: false, count: 0 };
    }

    const espnTeamId = matched.team.id;

    // 2. Tải toàn bộ danh sách cầu thủ thực tế của CLB này
    const rosterRes = await fetchWithTimeout(
      `https://site.api.espn.com/apis/site/v2/sports/soccer/${leagueEspn}/teams/${espnTeamId}/roster`
    );
    if (!rosterRes || !rosterRes.ok) return { success: false, count: 0 };

    const rosterData = await rosterRes.json();
    const athletes = rosterData.athletes || [];
    let syncedCount = 0;

    for (const ath of athletes) {
      const playerName = ath.fullName || ath.displayName;
      if (!playerName) continue;

      let pos: Position = Position.MIDFIELDER;
      const pName = (ath.position?.name || ath.position?.displayName || "").toLowerCase();
      if (pName.includes("goal")) pos = Position.GOALKEEPER;
      else if (pName.includes("defen")) pos = Position.DEFENDER;
      else if (pName.includes("forw") || pName.includes("strik") || pName.includes("wing")) pos = Position.FORWARD;

      const number = ath.jersey ? parseInt(ath.jersey, 10) : null;
      const avatar = ath.headshot?.href || null;
      const nationality = ath.citizenship || ath.birthPlace?.country || null;
      const dateOfBirth = ath.dateOfBirth ? new Date(ath.dateOfBirth) : null;

      const existing = await prisma.player.findFirst({
        where: {
          name: playerName,
          teamId: team.id,
        },
      });

      if (existing) {
        await prisma.player.update({
          where: { id: existing.id },
          data: {
            shortName: ath.displayName || ath.shortName || playerName,
            number: number ?? existing.number,
            position: pos,
            avatar: avatar || existing.avatar,
            nationality: nationality || existing.nationality,
            dateOfBirth: dateOfBirth || existing.dateOfBirth,
          },
        });
      } else {
        await prisma.player.create({
          data: {
            name: playerName,
            shortName: ath.displayName || ath.shortName || playerName,
            number,
            position: pos,
            avatar,
            nationality,
            dateOfBirth,
            teamId: team.id,
          },
        });
      }
      syncedCount++;
    }

    return { success: true, count: syncedCount };
  } catch (error) {
    console.error(`Lỗi khi đồng bộ đội hình cho CLB ${teamId}:`, error);
    return { success: false, count: 0 };
  }
}
