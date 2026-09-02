export interface Season {
  id: string;
  name: string; // e.g. "2024/2025", "2025/2026", "2026/2027"
  isCurrent: boolean;
  startDate: Date | string;
  endDate: Date | string;
}

export interface League {
  id: string;
  code: string;
  name: string;
  shortName: string;
  country: string;
  flag?: string | null;
  logo: string;
  type: string;
  order: number;
  _count?: {
    matches: number;
  };
}

export interface Team {
  id: string;
  name: string;
  shortName: string;
  code?: string | null;
  logo: string;
  stadium?: string | null;
  capacity?: number | null;
  city?: string | null;
  foundedYear?: number | null;
  coach?: string | null;
  website?: string | null;
  primaryColor?: string | null;
  leagueId: string;
  league?: League;
}

export interface Player {
  id: string;
  espnId?: string | null;
  name: string;
  shortName?: string | null;
  number?: number | null;
  position: "GOALKEEPER" | "DEFENDER" | "MIDFIELDER" | "FORWARD" | string;
  avatar?: string | null;
  nationality?: string | null;
  dateOfBirth?: Date | string | null;
  height?: number | null;
  weight?: number | null;
  preferredFoot?: string | null;
  marketValue?: string | null;
  teamId: string;
  team?: Team;
}

export interface MatchEvent {
  id: string;
  matchId: string;
  teamId: string;
  playerId?: string | null;
  assistPlayerId?: string | null;
  minute: number;
  extraMinute?: number | null;
  type: string;
  description?: string | null;
  player?: Player | null;
  assistPlayer?: Player | null;
  team?: Team | null;
}

export interface MatchLineup {
  id: string;
  matchId: string;
  teamId: string;
  playerId: string;
  formation: string;
  isStarting: boolean;
  position: string;
  gridX?: number | null;
  gridY?: number | null;
  jerseyNumber?: number | null;
  player?: Player | null;
  team?: Team | null;
}

export interface MatchStat {
  id: string;
  matchId: string;
  possessionHome: number;
  possessionAway: number;
  shotsHome: number;
  shotsAway: number;
  shotsOnTargetHome: number;
  shotsOnTargetAway: number;
  xGHome: number;
  xGAway: number;
  cornersHome: number;
  cornersAway: number;
  foulsHome: number;
  foulsAway: number;
  yellowCardsHome: number;
  yellowCardsAway: number;
  redCardsHome: number;
  redCardsAway: number;
  savesHome: number;
  savesAway: number;
  passesHome: number;
  passesAway: number;
  passAccuracyHome: number;
  passAccuracyAway: number;
  offsidesHome?: number;
  offsidesAway?: number;
  bigChancesHome?: number;
  bigChancesAway?: number;
  bigChancesMissedHome?: number;
  bigChancesMissedAway?: number;
}

export interface MatchItem {
  id: string;
  leagueId: string;
  seasonId: string;
  homeTeamId: string;
  awayTeamId: string;
  round: string;
  matchDate: Date | string;
  status: "SCHEDULED" | "LIVE" | "FINISHED" | "POSTPONED" | "CANCELLED";
  minute?: string | null;
  homeScore: number;
  awayScore: number;
  homeHalfTimeScore?: number | null;
  awayHalfTimeScore?: number | null;
  homePenaltyScore?: number | null;
  awayPenaltyScore?: number | null;
  extraTimeStatus?: string | null;
  stadium?: string | null;
  referee?: string | null;
  league: League;
  homeTeam: Team;
  awayTeam: Team;
  events?: MatchEvent[];
  stats?: MatchStat | null;
  lineups?: MatchLineup[];
}

export interface H2HMatchItem {
  id: string;
  date: string | Date;
  competitionName: string;
  homeTeamName: string;
  homeTeamLogo: string;
  homeScore: number;
  awayTeamName: string;
  awayTeamLogo: string;
  awayScore: number;
  winner: "home" | "away" | "draw";
}

export interface H2HSummary {
  summaryText: string;
  totalMatches: number;
  homeWins: number;
  draws: number;
  awayWins: number;
}

export interface RecentFormItem {
  id: string;
  date: string;
  result: "W" | "D" | "L";
  score: string;
  opponent: string;
  opponentLogo: string;
  competition: string;
}

export interface MatchDetailData {
  match: MatchItem & {
    homeTeam: Team & { players?: Player[] };
    awayTeam: Team & { players?: Player[] };
  };
  h2hMatches: (MatchItem | H2HMatchItem)[];
  h2hSummary?: H2HSummary;
  homeRecentForm?: RecentFormItem[];
  awayRecentForm?: RecentFormItem[];
}

export interface FormMatchItem {
  result: "W" | "D" | "L";
  score: string;
  opponentName: string;
  opponentShortName?: string;
  opponentLogo?: string;
  isHome: boolean;
  tooltipText: string;
  matchId?: string;
}

export interface StandingItem {
  id: string;
  leagueId: string;
  seasonId: string;
  teamId: string;
  position: number;
  played: number;
  won: number;
  draw: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
  points: number;
  form?: string | null;
  formDetails?: FormMatchItem[];
  homePlayed: number;
  homeWon: number;
  homeDraw: number;
  homeLost: number;
  homeGoalsFor: number;
  homeGoalsAgainst: number;
  homePoints: number;
  awayPlayed: number;
  awayWon: number;
  awayDraw: number;
  awayLost: number;
  awayGoalsFor: number;
  awayGoalsAgainst: number;
  awayPoints: number;
  zone?: string | null;
  team: Team;
  league?: League;
}

export interface PlayerSeasonStatItem {
  id: string;
  playerId: string;
  leagueId: string;
  seasonId: string;
  appearances: number;
  minutesPlayed: number;
  goals: number;
  assists: number;
  penalties: number;
  yellowCards: number;
  redCards: number;
  cleanSheets: number;
  saves: number;
  chancesCreated: number;
  starts?: number;
  shots?: number;
  shotsOnGoal?: number;
  foulsCommitted?: number;
  foulsSuffered?: number;
  offsides?: number;
  player: Player & { team: Team };
  league?: League;
  season?: Season;
}

export interface TeamDisciplinePlayer {
  id: string;
  name: string;
  shortName?: string | null;
  avatar?: string | null;
  number?: number | null;
  position?: string | null;
  yellowCards: number;
  redCards: number;
}

export interface TeamDisciplineItem {
  id: string;
  teamId: string;
  team: Team;
  appearances: number;
  yellowCards: number;
  redCards: number;
  points: number;
  cardedPlayers: TeamDisciplinePlayer[];
}

export interface CompetitionStatItem {
  leagueId: string;
  leagueName: string;
  leagueCode: string;
  leagueLogo: string;
  leagueCountry?: string;
  leagueType: "LEAGUE" | "CUP";
  standing?: StandingItem | null;
  totalMatches: number;
  won: number;
  draw: number;
  lost: number;
  winRate: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
  cleanSheets: number;
  recentForm: Array<{ result: "W" | "D" | "L"; score: string; opponent: string; matchId: string }>;
}

export interface TeamDetailData {
  team: Team & {
    league: League;
    players: Player[];
    standings?: StandingItem[];
  };
  matches: MatchItem[];
  seasonName: string;
  competitionStats: CompetitionStatItem[];
  stats: {
    totalMatches: number;
    won: number;
    draw: number;
    lost: number;
    winRate: number;
    goalsFor: number;
    goalsAgainst: number;
    cleanSheets: number;
  };
}

export interface PlayerDetailData {
  player: Player & {
    team: Team & { league: League };
    stats?: PlayerSeasonStatItem[];
  };
  recentMatches?: MatchItem[];
}

export type StandingsFilter = "ALL" | "HOME" | "AWAY" | "FORM";
