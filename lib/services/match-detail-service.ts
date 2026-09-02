import { prisma } from "@/lib/prisma";
import { MatchStatus, EventType, Position } from "@/generated/prisma/client";
import { calculateTacticalFormationPositions } from "./tactical-pitch";

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
  "Accept": "application/json",
};

const LEAGUE_ESPN_MAP: Record<string, string> = {
  PL: "eng.1",
  PD: "esp.1",
  SA: "ita.1",
  BL1: "ger.1",
  FL1: "fra.1",
  CL: "uefa.champions",
  FAC: "eng.fa",
  EFL: "eng.league_cup",
  CDR: "esp.copa_del_rey",
  CI: "ita.coppa_italia",
  DFB: "ger.dfb_pokal",
  CDF: "fra.coupe_de_france",
};

export async function fetchAndSyncLiveMatchDetail(matchId: string) {
  try {
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        league: true,
        homeTeam: { include: { players: true } },
        awayTeam: { include: { players: true } },
      },
    });

    if (!match) return null;

    const espnLeague = LEAGUE_ESPN_MAP[match.league.code] || "all";
    const d = new Date(match.matchDate);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const dateStr = `${yyyy}${mm}${dd}`;

    // 1. Search scoreboard for the event ID
    let eventId: string | null = null;

    const scoreboardUrls = [
      `https://site.api.espn.com/apis/site/v2/sports/soccer/${espnLeague}/scoreboard?dates=${dateStr}`,
      `https://site.api.espn.com/apis/site/v2/sports/soccer/scorepanel`,
      `https://site.api.espn.com/apis/site/v2/sports/soccer/all/scoreboard?dates=${dateStr}`,
    ];

    const hName = match.homeTeam.name.toLowerCase().trim();
    const aName = match.awayTeam.name.toLowerCase().trim();

    for (const sUrl of scoreboardUrls) {
      try {
        const sRes = await fetch(sUrl, { headers: HEADERS });
        if (!sRes.ok) continue;
        const sData = await sRes.json();
        const events = sData.events || sData.scores?.flatMap((sc: any) => sc.events || []) || [];

        for (const ev of events) {
          const comp = ev.competitions?.[0];
          const h = comp?.competitors?.find((c: any) => c.homeAway === "home")?.team?.displayName?.toLowerCase() || "";
          const a = comp?.competitors?.find((c: any) => c.homeAway === "away")?.team?.displayName?.toLowerCase() || "";

          if (
            (h.includes(hName) || hName.includes(h)) &&
            (a.includes(aName) || aName.includes(a))
          ) {
            eventId = ev.id;
            break;
          }
        }
        if (eventId) break;
      } catch (e) {
        // continue
      }
    }

    if (!eventId) return null;

    // 2. Fetch full summary from ESPN
    const summaryUrl = `https://site.api.espn.com/apis/site/v2/sports/soccer/${espnLeague}/summary?event=${eventId}`;
    const res = await fetch(summaryUrl, { headers: HEADERS });
    if (!res.ok) return null;

    const data = await res.json();
    const headerComp = data.header?.competitions?.[0];
    if (!headerComp) return null;

    const hComp = headerComp.competitors?.find((c: any) => c.homeAway === "home");
    const aComp = headerComp.competitors?.find((c: any) => c.homeAway === "away");

    const state = headerComp.status?.type?.state;
    let status: MatchStatus = MatchStatus.SCHEDULED;
    if (state === "in") status = MatchStatus.LIVE;
    else if (state === "post") status = MatchStatus.FINISHED;

    const homeScore = parseInt(hComp?.score || "0", 10);
    const awayScore = parseInt(aComp?.score || "0", 10);
    const displayClock = headerComp.status?.displayClock || (status === MatchStatus.LIVE ? "Đang đá" : null);

    // Tỉ số Hiệp 1 (HT)
    const hLinescore = hComp?.linescores?.[0]?.displayValue ?? hComp?.linescores?.[0]?.value;
    const aLinescore = aComp?.linescores?.[0]?.displayValue ?? aComp?.linescores?.[0]?.value;
    const homeHalfTimeScore = hLinescore != null ? parseInt(hLinescore, 10) : null;
    const awayHalfTimeScore = aLinescore != null ? parseInt(aLinescore, 10) : null;

    // Tỉ số Penalty (nếu có)
    const hPen = hComp?.shootoutScore ?? (hComp?.linescores?.length > 2 ? hComp?.linescores?.[2]?.displayValue : null);
    const aPen = aComp?.shootoutScore ?? (aComp?.linescores?.length > 2 ? aComp?.linescores?.[2]?.displayValue : null);
    const homePenaltyScore = hPen != null ? parseInt(hPen, 10) : null;
    const awayPenaltyScore = aPen != null ? parseInt(aPen, 10) : null;

    // Update match main info
    await prisma.match.update({
      where: { id: matchId },
      data: {
        homeScore,
        awayScore,
        status,
        minute: displayClock,
        ...(homeHalfTimeScore !== null ? { homeHalfTimeScore } : {}),
        ...(awayHalfTimeScore !== null ? { awayHalfTimeScore } : {}),
        ...(homePenaltyScore !== null ? { homePenaltyScore } : {}),
        ...(awayPenaltyScore !== null ? { awayPenaltyScore } : {}),
      },
    });

    // 3. Update Match Stats
    const boxscoreTeams = data.boxscore?.teams || [];
    if (boxscoreTeams.length >= 2) {
      const hStats = boxscoreTeams.find((t: any) => t.team?.id === hComp?.id)?.statistics || boxscoreTeams[0]?.statistics || [];
      const aStats = boxscoreTeams.find((t: any) => t.team?.id === aComp?.id)?.statistics || boxscoreTeams[1]?.statistics || [];

      const getStatVal = (stats: any[], name: string) => {
        const item = stats.find((s: any) => s.name?.toLowerCase() === name.toLowerCase() || s.label?.toLowerCase() === name.toLowerCase());
        return item ? parseFloat(item.displayValue || item.value || "0") : 0;
      };

      const possessionHome = Math.round(getStatVal(hStats, "possessionPct") || getStatVal(hStats, "possession") || 50);
      const possessionAway = Math.round(getStatVal(aStats, "possessionPct") || getStatVal(aStats, "possession") || (100 - possessionHome));

      const passesHome = Math.round(getStatVal(hStats, "totalPasses") || getStatVal(hStats, "passes") || 0);
      const passesAway = Math.round(getStatVal(aStats, "totalPasses") || getStatVal(aStats, "passes") || 0);

      const accuratePassesHome = Math.round(getStatVal(hStats, "accuratePasses") || 0);
      const accuratePassesAway = Math.round(getStatVal(aStats, "accuratePasses") || 0);

      const passAccuracyHome = passesHome > 0
        ? Math.round((accuratePassesHome / passesHome) * 100)
        : Math.round((getStatVal(hStats, "passPct") || 0.8) * 100);
      const passAccuracyAway = passesAway > 0
        ? Math.round((accuratePassesAway / passesAway) * 100)
        : Math.round((getStatVal(aStats, "passPct") || 0.8) * 100);

      const shotsHome = Math.round(getStatVal(hStats, "totalShots") || getStatVal(hStats, "shots") || getStatVal(hStats, "shotsSummary") || 0);
      const shotsAway = Math.round(getStatVal(aStats, "totalShots") || getStatVal(aStats, "shots") || getStatVal(aStats, "shotsSummary") || 0);

      const shotsOnTargetHome = Math.round(getStatVal(hStats, "shotsOnTarget") || getStatVal(hStats, "on goal") || 0);
      const shotsOnTargetAway = Math.round(getStatVal(aStats, "shotsOnTarget") || getStatVal(aStats, "on goal") || 0);

      // Cơ hội lớn tạo ra (Big Chances Created)
      const bigChancesHome = Math.max(1, Math.round(shotsOnTargetHome));
      const bigChancesAway = Math.max(1, Math.round(shotsOnTargetAway));

      // Cơ hội lớn bỏ lỡ (Big Chances Missed)
      const bigChancesMissedHome = Math.max(0, bigChancesHome - homeScore);
      const bigChancesMissedAway = Math.max(0, bigChancesAway - awayScore);

      const cornersHome = Math.round(getStatVal(hStats, "wonCorners") || getStatVal(hStats, "corner kicks") || 0);
      const cornersAway = Math.round(getStatVal(aStats, "wonCorners") || getStatVal(aStats, "corner kicks") || 0);

      const foulsHome = Math.round(getStatVal(hStats, "foulsCommitted") || getStatVal(hStats, "fouls") || 0);
      const foulsAway = Math.round(getStatVal(aStats, "foulsCommitted") || getStatVal(aStats, "fouls") || 0);

      const offsidesHome = Math.round(getStatVal(hStats, "offsides") || 0);
      const offsidesAway = Math.round(getStatVal(aStats, "offsides") || 0);

      const yellowCardsHome = Math.round(getStatVal(hStats, "yellowCards") || 0);
      const yellowCardsAway = Math.round(getStatVal(aStats, "yellowCards") || 0);

      const redCardsHome = Math.round(getStatVal(hStats, "redCards") || 0);
      const redCardsAway = Math.round(getStatVal(aStats, "redCards") || 0);

      const savesHome = Math.round(getStatVal(hStats, "saves") || 0);
      const savesAway = Math.round(getStatVal(aStats, "saves") || 0);

      await prisma.matchStat.upsert({
        where: { matchId: matchId },
        create: {
          matchId,
          possessionHome,
          possessionAway,
          passesHome,
          passesAway,
          passAccuracyHome,
          passAccuracyAway,
          bigChancesHome,
          bigChancesAway,
          bigChancesMissedHome,
          bigChancesMissedAway,
          shotsHome,
          shotsAway,
          shotsOnTargetHome,
          shotsOnTargetAway,
          cornersHome,
          cornersAway,
          foulsHome,
          foulsAway,
          offsidesHome,
          offsidesAway,
          yellowCardsHome,
          yellowCardsAway,
          redCardsHome,
          redCardsAway,
          savesHome,
          savesAway,
        },
        update: {
          possessionHome,
          possessionAway,
          passesHome,
          passesAway,
          passAccuracyHome,
          passAccuracyAway,
          bigChancesHome,
          bigChancesAway,
          bigChancesMissedHome,
          bigChancesMissedAway,
          shotsHome,
          shotsAway,
          shotsOnTargetHome,
          shotsOnTargetAway,
          cornersHome,
          cornersAway,
          foulsHome,
          foulsAway,
          offsidesHome,
          offsidesAway,
          yellowCardsHome,
          yellowCardsAway,
          redCardsHome,
          redCardsAway,
          savesHome,
          savesAway,
        },
      });
    }

    // 4. Update Key Events (Bàn thắng, kiến tạo, thẻ phạt, thay người)
    const keyEvents = data.keyEvents || [];
    if (keyEvents.length > 0) {
      await prisma.matchEvent.deleteMany({ where: { matchId } });

      for (const ke of keyEvents) {
        const typeText = (ke.type?.text || "").toLowerCase();
        const rawText = (ke.text || ke.shortText || "").toLowerCase();

        let type: EventType = EventType.GOAL;
        if (rawText.includes("own goal") || typeText.includes("own goal")) type = EventType.OWN_GOAL;
        else if (rawText.includes("penalty") || typeText.includes("penalty")) type = EventType.PENALTY_SCORED;
        else if (typeText.includes("goal")) type = EventType.GOAL;
        else if (typeText.includes("yellow")) type = EventType.YELLOW_CARD;
        else if (typeText.includes("red")) type = EventType.RED_CARD;
        else if (typeText.includes("sub") || typeText.includes("substitution")) type = EventType.SUBSTITUTION;
        else continue;

        // Minute calculation (hỗ trợ phút bù giờ 45'+3', 90'+5', v.v...)
        let minute = 1;
        let extraMinute: number | null = null;
        const clockStr = ke.clock?.displayValue || "";
        const plusMatch = clockStr.match(/(\d+)\s*['’]?\s*\+\s*(\d+)/);
        if (plusMatch) {
          minute = parseInt(plusMatch[1], 10);
          extraMinute = parseInt(plusMatch[2], 10);
        } else {
          const matchNum = clockStr.match(/(\d+)/);
          minute = matchNum ? parseInt(matchNum[1], 10) : (ke.period?.number ? ke.period.number * 45 : 1);
        }
        const teamId = ke.team?.id === hComp?.id ? match.homeTeamId : match.awayTeamId;

        // 1. Scorer / Main Player
        const mainAth = ke.participants?.[0]?.athlete;
        const mainName = mainAth?.displayName || mainAth?.fullName || ke.shortText || "Player";

        let mainPlayer = await prisma.player.findFirst({
          where: {
            OR: [
              ...(mainAth?.id ? [{ espnId: mainAth.id }] : []),
              { name: mainName, teamId },
            ],
          },
        });

        if (!mainPlayer) {
          mainPlayer = await prisma.player.create({
            data: {
              espnId: mainAth?.id || null,
              name: mainName,
              shortName: mainAth?.shortName || mainName,
              number: mainAth?.jersey ? parseInt(mainAth.jersey, 10) : null,
              teamId,
            },
          });
        }

        // 2. Assist Player (Cầu thủ kiến tạo)
        let assistPlayerId: string | null = null;
        if (type === EventType.GOAL) {
          const assistAth = ke.participants?.[1]?.athlete;
          let assistName = assistAth?.displayName || assistAth?.fullName;

          if (!assistName && ke.text) {
            const matchAssist = ke.text.match(/Assisted by ([A-ZÀ-Ỹa-zà-ỹ\s\.\-'\u00C0-\u024F\u1E00-\u1EFF]+?)(?:\s+with|\s+following|\s+after|\s+from|\.|\,|$)/i);
            if (matchAssist?.[1]) {
              assistName = matchAssist[1].trim();
            }
          }

          if (assistName && assistName.length > 2) {
            let assistPlayer = await prisma.player.findFirst({
              where: {
                OR: [
                  ...(assistAth?.id ? [{ espnId: assistAth.id }] : []),
                  { name: assistName, teamId },
                ],
              },
            });

            if (!assistPlayer) {
              assistPlayer = await prisma.player.create({
                data: {
                  espnId: assistAth?.id || null,
                  name: assistName,
                  shortName: assistAth?.shortName || assistName,
                  number: assistAth?.jersey ? parseInt(assistAth.jersey, 10) : null,
                  teamId,
                },
              });
            }
            assistPlayerId = assistPlayer.id;
          }
        }

        await prisma.matchEvent.create({
          data: {
            matchId,
            teamId,
            playerId: mainPlayer.id,
            assistPlayerId,
            type,
            minute,
            extraMinute,
            description: ke.text || ke.shortText || null,
          },
        });
      }
    }

    // 5. Update Lineups & Tactical Pitch Formations
    const rosters = data.rosters || [];
    if (rosters.length >= 2) {
      for (const r of rosters) {
        const isHome = r.team?.id === hComp?.id || r.team?.displayName?.toLowerCase().includes(hName);
        const teamId = isHome ? match.homeTeamId : match.awayTeamId;
        const formation = r.formation || "4-3-3";
        const athleteList = r.roster || [];

        const starters = athleteList.filter((a: any) => a.starter === true);
        const bench = athleteList.filter((a: any) => a.starter !== true);

        const mappedStarters = starters.map((a: any) => ({
          id: a.athlete?.id || "",
          name: a.athlete?.displayName || a.athlete?.fullName || "",
          posAbbr: a.position?.abbreviation,
          posName: a.position?.name,
        }));

        const starterPositions = calculateTacticalFormationPositions(mappedStarters, formation, isHome);

        for (let i = 0; i < starters.length; i++) {
          const a = starters[i];
          const ath = a.athlete || {};
          const playerName = ath.displayName || ath.fullName || "Player";
          const jerseyNumber = a.jersey ? parseInt(a.jersey, 10) : (ath.jersey ? parseInt(ath.jersey, 10) : null);
          
          let pos: Position = Position.MIDFIELDER;
          const pName = (a.position?.name || a.position?.displayName || "").toLowerCase();
          if (pName.includes("goal")) pos = Position.GOALKEEPER;
          else if (pName.includes("defen") || pName.includes("back")) pos = Position.DEFENDER;
          else if (pName.includes("mid") || pName.includes("wing")) pos = Position.MIDFIELDER;
          else if (pName.includes("forw") || pName.includes("strik")) pos = Position.FORWARD;

          let player = await prisma.player.findFirst({
            where: {
              OR: [
                { espnId: ath.id },
                { name: playerName, teamId },
              ],
            },
          });

          if (!player) {
            player = await prisma.player.create({
              data: {
                espnId: ath.id,
                name: playerName,
                shortName: ath.shortName || playerName,
                number: jerseyNumber,
                position: pos,
                teamId,
              },
            });
          }

          const gridPos = starterPositions[i] || { x: 50, y: 50 };

          await prisma.matchLineup.upsert({
            where: {
              matchId_playerId: {
                matchId: match.id,
                playerId: player.id,
              },
            },
            update: {
              teamId,
              formation,
              isStarting: true,
              position: pos,
              jerseyNumber,
              gridX: gridPos.x,
              gridY: gridPos.y,
            },
            create: {
              matchId: match.id,
              teamId,
              playerId: player.id,
              formation,
              isStarting: true,
              position: pos,
              jerseyNumber,
              gridX: gridPos.x,
              gridY: gridPos.y,
            },
          });
        }

        // Bench
        for (const a of bench) {
          const ath = a.athlete || {};
          const playerName = ath.displayName || ath.fullName || "Player";
          const jerseyNumber = a.jersey ? parseInt(a.jersey, 10) : (ath.jersey ? parseInt(ath.jersey, 10) : null);
          
          let pos: Position = Position.MIDFIELDER;
          const pName = (a.position?.name || a.position?.displayName || "").toLowerCase();
          if (pName.includes("goal")) pos = Position.GOALKEEPER;
          else if (pName.includes("defen") || pName.includes("back")) pos = Position.DEFENDER;
          else if (pName.includes("mid") || pName.includes("wing")) pos = Position.MIDFIELDER;
          else if (pName.includes("forw") || pName.includes("strik")) pos = Position.FORWARD;

          let player = await prisma.player.findFirst({
            where: {
              OR: [
                { espnId: ath.id },
                { name: playerName, teamId },
              ],
            },
          });

          if (!player) {
            player = await prisma.player.create({
              data: {
                espnId: ath.id,
                name: playerName,
                shortName: ath.shortName || playerName,
                number: jerseyNumber,
                position: pos,
                teamId,
              },
            });
          }

          await prisma.matchLineup.upsert({
            where: {
              matchId_playerId: {
                matchId: match.id,
                playerId: player.id,
              },
            },
            update: {
              teamId,
              formation,
              isStarting: false,
              position: pos,
              jerseyNumber,
            },
            create: {
              matchId: match.id,
              teamId,
              playerId: player.id,
              formation,
              isStarting: false,
              position: pos,
              jerseyNumber,
            },
          });
        }
      }
    }

    return true;
  } catch (err) {
    console.error("fetchAndSyncLiveMatchDetail error:", err);
    return null;
  }
}
