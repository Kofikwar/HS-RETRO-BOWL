



export type PlayerTrait = 'Clutch' | 'Injury Prone' | 'Team Captain' | 'Workhorse';

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

export interface PlayerGoal {
    description: string;
    stat: keyof Omit<PlayerStats, 'gamesPlayed'>;
    target: number;
    reward: {
        attribute: keyof Player['attributes'];
        points: number;
    };
    isCompleted: boolean;
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
  traits: PlayerTrait[];
  gpa: number;
  isSuspended: number; // Games remaining on suspension
  stringer: number; // 1 for starter, 2 for backup, etc.
  // MyCareer specific fields
  isPlayerCharacter?: boolean;
  xp?: number;
  xpToNextLevel?: number;
  skillPoints?: number;
  archetype?: string;
  coachRelationship?: number; // 0-100
  collegeOffers?: any[]; // Simplified for now
  isOnProbation?: boolean;
  disciplinarySuspension?: number; // Games remaining
  goals?: PlayerGoal[];
}

export type Position = 'QB' | 'RB' | 'WR' | 'TE' | 'OL' | 'DL' | 'LB' | 'DB' | 'K/P';

export interface Recruit extends Omit<Player, 'year' | 'careerStats' | 'isInjured' | 'seasonStats' | 'morale' | 'currentStamina' | 'isSuspended' | 'stringer'> {
  cost: number;
  starRating: number;
  blurb: string;
}

export type WVClass = 'A' | 'AA' | 'AAA';
export interface Team {
  id: number;
  name: string;
  ovr: number;
  roster: Player[];
  record: { wins: number; losses: number; };
  confRecord: { wins: number; losses: number; };
  rivalId?: number;
  class: WVClass;
  prestige: number; // 0-100
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
    headline?: string;
    newspaperSummary?: string;
    playerStats: {
      myTeam: Record<string, Partial<PlayerStats>>;
      opponentTeam: Record<string, Partial<PlayerStats>>;
    };
  };
  playoffRound?: 'Quarterfinals' | 'Semifinals' | 'Championship' | 'ToC Semifinal' | 'ToC Final';
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
    bestQB: Player | null;
    bestRB: Player | null;
    bestWR: Player | null;
    bestDefender: Player | null;
    bestOL: Player | null;
    bestKP: Player | null;
}

export interface Sponsor {
    id: string;
    name: string;
    type: 'Local' | 'Regional' | 'National';
    payoutPerWin: number;
    signingBonus: number;
    duration: number; // in seasons
}

export interface InboxMessage {
    id:string;
    week: number;
    season: number;
    from: string;
    subject: string;
    body: string;
    read: boolean;
    offerDetails?: {
        fromTeamId: number;
        newTeamId: number;
        type: 'COACH_OFFER' | 'PLAYER_OFFER';
    };
}

export interface Staff {
    id: string;
    name: string;
    type: 'OC' | 'DC' | 'Trainer' | 'Doctor';
    rating: number; // 1-100
    salary: number;
    scheme?: OffensivePlaybook | DefensivePlaybook;
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
  momentum: number; // -100 (opponent) to 100 (player)
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
    newMomentum: number;
}

export interface CoachSkill {
    name: string;
    description: string;
    level: number;
    maxLevel: number;
    cost: number[]; // cost for each level
}

export type CoachSkillTree = Record<string, CoachSkill>;

export interface Coach {
  name: string;
  archetype: 'Motivator' | 'Strategist' | 'Recruiter';
  points: number;
  skillTree: CoachSkillTree;
  championships: number;
  totalWins: number;
  seasonsCoached: number;
}

export interface GodModeState {
    isEnabled: boolean;
    unlimitedFunds: boolean;
    maxFacilities: boolean;
    perfectAcademics: boolean;
    perfectMorale: boolean;
    maxCoaching: boolean;
    perfectRecruiting: boolean;
    forceWinGames: boolean;
    unlimitedStamina: boolean;
    infiniteSkillPoints: boolean;
    // New detailed controls
    canEditPlayers: boolean;
    canTransferAnytime: boolean; // MyCareer
    autoCrazyStats: boolean; // MyCareer
    autoStart: boolean; // MyCareer
    maxAllTeamOvr: boolean;
}

export interface HallOfFameInductee {
    type: 'Player' | 'Coach' | 'Team';
    yearInductcted: number;
    details: PlayerHOFDetails | CoachHOFDetails | TeamHOFDetails;
}

export interface PlayerHOFDetails {
    playerId: string;
    name: string;
    position: Position;
    careerStats: PlayerStats;
}

export interface CoachHOFDetails {
    name: string;
    championships: number;
    totalWins: number;
}

export interface TeamHOFDetails {
    teamId: number;
    teamName: string;
    season: number;
    record: { wins: number; losses: number; };
    accolade: string; // e.g., "Undefeated Season"
}

export interface ScoutingReport {
    teamId: number;
    teamName: string;
    ovr: number;
    record: { wins: number; losses: number };
    bestPlayers: Player[];
    strategy: GameStrategy;
    tactic: {
        strength: string;
        weakness: string;
        suggestion: string;
    };
}

// FIX: Changed 'interface' to 'type' as an interface cannot be a union type.
export type TrainingFocus = 'Passing Offense' | 'Rushing Offense' | 'Pass Defense' | 'Rush Defense' | 'Special Teams';

export interface NewsArticle {
    id: string;
    week: number;
    season: number;
    headline: string;
    body: string;
}

export interface CollegeOffer {
    collegeName: string;
    division: 'D1-FBS' | 'D1-FCS' | 'D2';
    prestige: number; // 1-100
}


export interface GameState {
  gameMode: 'DYNASTY' | 'MY_CAREER' | null;
  myTeamId: number | null;
  myPlayerId: string | null;
  teams: Team[];
  season: number;
  week: number; // 1-10 reg, 11-13 playoffs, 14-15 ToC, 16 Awards, 17 Training, 18 Recruiting
  schedule: Record<number, Game[]>; // teamId -> schedule
  funds: number;
  facilities: {
    coaching: { level: number; cost: number };
    training: { level: number; cost: number };
    rehab: { level: number; cost: number };
    tutoring: { level: number; cost: number };
  };
  nationalRankings: { teamId: number; rank: number }[];
  playoffBracket: Record<WVClass, PlayoffMatchup[]> | null;
  tocBracket: PlayoffMatchup[] | null;
  classChampions: Record<WVClass, number | null>;
  tocChampion: number | null;
  lastGameResult: Game['result'] | null;
  gameLog: string[];
  recruits: Recruit[];
  signedRecruits: Recruit[];
  isOffseason: boolean;
  seasonAwards: SeasonAwards;
  // New detailed features
  fanHappiness: number; // 0-100
  activeSponsor: Sponsor | null;
  availableSponsors: Sponsor[];
  inbox: InboxMessage[];
  staff: Staff[];
  staffMarket: Staff[];
  myStrategy: GameStrategy;
  trophyCase: Trophy[];
  recruitingPoints: number;
  coach: Coach;
  schoolPrestige: number; // 0-100
  hallOfFame: HallOfFameInductee[];
  practiceSessions: number; // MyCareer weekly practice limit
  news: NewsArticle[];
  collegeOffers: CollegeOffer[];
  // God Mode flag
  godMode: GodModeState | null;
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
  | 'TRAINING_CAMP'
  | 'AWARD_RACES'
  | 'STAFF'
  | 'HALL_OF_FAME'
  | 'NEWS'
  | 'PLAYOFFS_HUB'
  | 'CAREER_OVER'
  // New Screens
  | 'MODE_SELECTION'
  | 'MY_CAREER_CREATION'
  | 'MY_CAREER_HUB'
  | 'PRACTICE'
  | 'DEPTH_CHART'
  | 'TEAM_PROFILE_HUB'
  | 'COACH_HUB'
  | 'GOD_MODE_SETTINGS'
  | 'TRANSFER_SELECTION'
  | 'TEAM_STATS'
  | 'DYNASTY_OVER'
  | 'MY_CAREER_OFFERS';