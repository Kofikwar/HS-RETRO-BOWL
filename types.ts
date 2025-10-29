

export interface PlayerStats {
  gamesPlayed: number;
  passYds: number;
  passTDs: number;
  rushYds: number;
  rushTDs: number;
  recYds: number;
  recTDs: number;
  tackles: number;
  sacks: number;
  ints: number;
}

export interface Player {
  id: string;
  name: string;
  position: Position;
  year: 'FR' | 'SO' | 'JR' | 'SR';
  attributes: {
    OVR: number;
    Speed: number;
    Strength: number;
    Stamina: number;
    Tackle: number;
    Catch: number;
    Pass: number;
    Block: number;
    Consistency: number;
    Potential: number;
  };
  seasonStats: PlayerStats;
  careerStats: PlayerStats;
  isInjured: number; // Games remaining on injury
  morale: number; // 0-100
  currentStamina: number; // 0-100
}

export type Position = 'QB' | 'RB' | 'WR' | 'TE' | 'OL' | 'DL' | 'LB' | 'DB' | 'K/P';

export interface Recruit extends Omit<Player, 'year' | 'careerStats' | 'isInjured' | 'seasonStats' | 'morale' | 'currentStamina'> {
  cost: number;
}

export interface Team {
  id: number;
  name: string;
  ovr: number;
  roster: Player[];
  record: { wins: number; losses: number; };
  confRecord: { wins: number; losses: number; };
  rivalId?: number;
}

export interface Game {
  week: number;
  opponentId: number;
  isHome: boolean;
  weather?: 'Sunny' | 'Rainy' | 'Snowy';
  isRivalryGame?: boolean;
  result?: {
    opponentId: number;
    myScore: number;
    opponentScore: number;
    summary: string;
    playerStats: {
      myTeam: Record<string, Partial<PlayerStats>>;
      opponentTeam: Record<string, Partial<PlayerStats>>;
    };
  };
  playoffRound?: 'Quarterfinals' | 'Semifinals' | 'Championship';
}

export type OffensivePlaybook = 'Balanced' | 'Spread' | 'Pro-Style' | 'Run Heavy' | 'Air Raid';
export type DefensivePlaybook = '4-3 Defense' | '3-4 Defense' | 'Nickel' | 'Aggressive';

// Expanded OffensivePlay for more variety
export type OffensivePlay = 
  | 'Inside Run' 
  | 'Outside Run'
  | 'Power Run'
  | 'Draw Play'
  | 'Slant' 
  | 'Post' 
  | 'Screen Pass'
  | 'Play Action'
  | 'Hail Mary';


export interface GameStrategy {
    offense: OffensivePlaybook;
    defense: DefensivePlaybook;
}

export type PlayoffMatchup = {
  team1Id: number;
  team2Id: number;
  winnerId?: number;
  game?: Game;
};

export interface SeasonAwards {
    mvp: Player | null;
    allAmerican: Player[];
    bestQB: Player | null;
    bestRB: Player | null;
    bestWR: Player | null;
    bestTE: Player | null;
    bestOL: Player | null;
    bestDL: Player | null;
    bestLB: Player | null;
    bestDB: Player | null;
    bestKP: Player | null;
}

export interface Sponsor {
    id: string;
    name: string;
    weeklyPayout: number;
    duration: number; // in seasons
}

export interface InboxMessage {
    id:string;
    week: number;
    season: number;
    subject: string;
    body: string;
    read: boolean;
}

export interface Coach {
    id: string;
    name: string;
    specialty: 'OC' | 'DC' | 'ST';
    rating: number; // 1-10
}

export interface Trophy {
    season: number;
    award: string; // e.g., "National Champions", "MVP Award"
    playerName?: string; // For player-specific awards
    playerId?: string;
}

export interface ActiveGameState {
  quarter: number;
  time: number; // in seconds
  down: number;
  distance: number;
  yardLine: number; // 0-100, from player's perspective (0 is own goal line)
  possession: 'player' | 'opponent';
  playerScore: number;
  opponentScore: number;
  gameId: string; // To link to the scheduled game
  opponentId: number;
  playLog: string[];
  isGameOver: boolean;
}

export interface StatEvent {
    playerId: string;
    stat: keyof Omit<PlayerStats, 'gamesPlayed'>;
    value: number;
}
export interface PlayOutcome {
    description: string;
    yards: number;
    isTurnover: boolean;
    isTouchdown: boolean;
isComplete: boolean;
    statEvents: StatEvent[];
}

export interface GameState {
  myTeamId: number | null;
  teams: Team[];
  season: number;
  week: number; // 1-10 regular season, 11-13 playoffs
  schedule: Record<number, Game[]>; // teamId -> schedule
  funds: number;
  facilities: {
    coaching: { level: number; cost: number };
    training: { level: number; cost: number };
    rehab: { level: number; cost: number };
  };
  nationalRankings: { teamId: number; rank: number }[];
  playoffBracket: { round: number; matchups: PlayoffMatchup[] }[] | null;
  lastGameResult: Game['result'] | null;
  gameLog: string[];
  recruits: Recruit[];
  isOffseason: boolean;
  seasonAwards: SeasonAwards;
  // New detailed features
  fanHappiness: number; // 0-100
  sponsors: Sponsor[];
  inbox: InboxMessage[];
  coaches: {
      OC: Coach | null;
      DC: Coach | null;
      ST: Coach | null;
  };
  myStrategy: GameStrategy;
  trophyCase: Trophy[];
  recruitingPoints: number;
  // God Mode flag
  forceWinNextGame: boolean;
  activeGame: ActiveGameState | null;
}

export type TrainingProgram = 'NONE' | 'CONDITIONING' | 'STRENGTH' | 'AGILITY' | 'PASSING' | 'RECEIVING' | 'TACKLING';

export type Screen = 
  | 'TEAM_SELECTION'
  | 'MAIN_MENU'
  | 'ROSTER'
  | 'SCHEDULE'
  | 'STANDINGS'
  | 'FACILITIES'
  | 'AWARDS'
  | 'GOD_MODE'
  | 'RECRUITMENT'
  | 'GAME_MODAL'
  | 'OFFSEASON_MODAL'
  | 'GAME_OVER'
  | 'NATIONAL_STATS'
  | 'COACHES'
  | 'SPONSORS'
  | 'INBOX'
  | 'TACTICS'
  | 'PLAY_GAME'
  | 'TROPHY_CASE'
  | 'TRAINING_CAMP';