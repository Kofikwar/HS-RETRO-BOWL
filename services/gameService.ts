
import { GoogleGenAI, Type } from '@google/genai';
import { Game, Player, Position, Team, GameState, GameStrategy, PlayerStats, Recruit, PlayoffMatchup, SeasonAwards, OffensivePlaybook, DefensivePlaybook, Trophy, ActiveGameState, OffensivePlay, PlayOutcome, StatEvent, TrainingProgram, Staff, Sponsor, InboxMessage, PlayerTrait, Coach, GodModeState, HallOfFameInductee, PlayerHOFDetails, CoachHOFDetails, TeamHOFDetails, CoachSkillTree, WVClass, PlayerGoal, ScoutingReport, TrainingFocus, NewsArticle, CollegeOffer } from '../types';
import { WV_TEAMS, OTHER_WV_TEAM_NAMES, FIRST_NAMES, LAST_NAMES, STAFF_FIRST_NAMES, STAFF_LAST_NAMES, RIVALRIES, POWERHOUSE_TEAMS } from '../constants';

let ai: GoogleGenAI | null = null;
if (process.env.API_KEY) {
    ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
}

export const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const choice = <T,>(arr: T[]): T => arr[rand(0, arr.length - 1)];
const shuffle = <T,>(array: T[]): T[] => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};


const generateName = () => `${choice(FIRST_NAMES)} ${choice(LAST_NAMES)}`;
const generateStaffName = () => `${choice(STAFF_FIRST_NAMES)} ${choice(STAFF_LAST_NAMES)}`;

const initialStats = (): PlayerStats => ({ gamesPlayed: 0, passYds: 0, passTDs: 0, rushYds: 0, rushTDs: 0, recYds: 0, recTDs: 0, tackles: 0, sacks: 0, ints: 0 });

const calculatePlayerOvr = (attributes: Player['attributes']): number => {
    const weights: Record<keyof Omit<Player['attributes'], 'OVR'>, number> = {
        Speed: 0.15, Strength: 0.1, Stamina: 0.05, Tackle: 0.1, Catch: 0.1, Pass: 0.1, Block: 0.1, Consistency: 0.2, Potential: 0.1
    };
    const ovr = Object.entries(weights).reduce((acc, [key, weight]) => {
        return acc + (attributes[key as keyof typeof weights] * weight);
    }, 0);
    return Math.round(ovr);
};

const mergeStats = (current: PlayerStats, game: Partial<PlayerStats>): PlayerStats => {
    const newStats: PlayerStats = { ...current };
    for (const key in game) {
        const statKey = key as keyof PlayerStats;
        newStats[statKey] = (newStats[statKey] || 0) + (game[statKey] || 0);
    }
    if (Object.values(game).some(v => v > 0)) {
        newStats.gamesPlayed = (newStats.gamesPlayed || 0) + 1;
    }
    return newStats;
};

const generateNewsArticle = (gameState: GameState, type: 'GAME_RESULT' | 'UPSET' | 'OFFER' | 'AWARD', data: any): NewsArticle | null => {
    let headline = '', body = '';
    switch(type) {
        case 'GAME_RESULT':
            const { winner, loser, winnerScore, loserScore, isRivalry } = data;
            const scoreDiff = Math.abs(winnerScore - loserScore);
            if (isRivalry) {
                 headline = `${winner.name} Claims Bragging Rights Over ${loser.name}, ${winnerScore}-${loserScore}`;
                 body = `The historic rivalry game lived up to the hype, with ${winner.name} emerging victorious in a hard-fought battle.`;
            } else if (scoreDiff > 28) {
                headline = `${winner.name} Dominates ${loser.name} in ${winnerScore}-${loserScore} Blowout`;
                body = `It was a one-sided affair in Week ${gameState.week} as ${winner.name} put on a clinic against ${loser.name}, cruising to an easy victory.`;
            } else {
                headline = `${winner.name} Edges ${loser.name}, ${winnerScore}-${loserScore}`;
                body = `A strong performance by ${winner.name} saw them overcome ${loser.name} in a Week ${gameState.week} thriller that went down to the wire.`;
            }
            break;
        case 'UPSET':
            const { underdog, favorite, uScore, fScore } = data;
            headline = `STUNNER! ${underdog.name} Upsets ${favorite.name}, ${uScore}-${fScore}`;
            body = `In the biggest shock of the week, the ${underdog.name} pulled off an incredible upset against the heavily favored ${favorite.name}.`;
            break;
        case 'OFFER':
            const { playerName, collegeName, division } = data;
            headline = `${collegeName} (${division}) Offers Scholarship to ${playerName}`;
            body = `Recruiting news is heating up as ${collegeName}, a prestigious ${division} program, has officially extended a scholarship offer to star player ${playerName}. Scouts have been watching closely all season after another impressive performance.`;
            break;
        default:
            return null;
    }
    return { id: crypto.randomUUID(), week: gameState.week, season: gameState.season, headline, body };
}


export const applyGameResults = (gameState: GameState, myTeamId: number, opponentId: number, myScore: number, opponentScore: number, playerStats: Game['result']['playerStats']) => {
    const isWin = myScore > opponentScore;
    const winnerId = isWin ? myTeamId : opponentId;
    const loserId = isWin ? opponentId : myTeamId;
    
    const winner = gameState.teams.find(t => t.id === winnerId);
    const loser = gameState.teams.find(t => t.id === loserId);

    // FIX: Add comprehensive guard clauses to prevent crashes from missing data.
    if (!winner || !loser) {
        console.error("Could not find winner or loser team in applyGameResults");
        return gameState;
    }

    winner.record.wins++;
    loser.record.losses++;

    const gameForMyTeam = gameState.schedule[myTeamId]?.find(g => g.week === gameState.week && g.opponentId === opponentId);
    if (gameForMyTeam) {
        gameForMyTeam.result = { myScore, opponentScore, opponentId, summary: "Game Played", playerStats };
    }

    const gameForOpponent = gameState.schedule[opponentId]?.find(g => g.week === gameState.week && g.opponentId === myTeamId);
    if (gameForOpponent) {
        gameForOpponent.result = { myScore: opponentScore, opponentScore: myScore, opponentId: myTeamId, summary: "Game Played", playerStats: { myTeam: playerStats.opponentTeam, opponentTeam: playerStats.myTeam }};
    }

    if(winnerId === gameState.myTeamId) {
        gameState.coach.totalWins++;
        if (gameState.activeSponsor) {
            gameState.funds += gameState.activeSponsor.payoutPerWin;
        }
    }
    
    // News Generation
    const isRivalry = winner.rivalId === loser.id;
    const isUpset = loser.ovr > winner.ovr + 5;
    let article: NewsArticle | null;
    if (isUpset) {
        article = generateNewsArticle(gameState, 'UPSET', { underdog: winner, favorite: loser, uScore: isWin ? myScore : opponentScore, fScore: isWin ? opponentScore : myScore });
    } else {
        article = generateNewsArticle(gameState, 'GAME_RESULT', { winner, loser, winnerScore: isWin ? myScore : opponentScore, loserScore: isWin ? opponentScore : myScore, isRivalry });
    }
    if(article) gameState.news.push(article);

    const myTeamForStats = gameState.teams.find(t => t.id === myTeamId);
    const oppTeamForStats = gameState.teams.find(t => t.id === opponentId);

    if (myTeamForStats && playerStats.myTeam) {
        for (const [playerId, stats] of Object.entries(playerStats.myTeam)) {
            const player = myTeamForStats.roster.find(p => p.id === playerId);
            if (player) {
                player.seasonStats = mergeStats(player.seasonStats, stats);
                player.careerStats = mergeStats(player.careerStats, stats);
            }
        }
    }
    if (oppTeamForStats && playerStats.opponentTeam) {
        for (const [playerId, stats] of Object.entries(playerStats.opponentTeam)) {
            const player = oppTeamForStats.roster.find(p => p.id === playerId);
            if (player) {
                player.seasonStats = mergeStats(player.seasonStats, stats);
                player.careerStats = mergeStats(player.careerStats, stats);
            }
        }
    }
    
    // In MyCareer, check goals and offers after every game
    if(gameState.gameMode === 'MY_CAREER' && gameState.myTeamId === myTeamId) {
        gameState = checkMyCareerGoals(gameState);
        gameState = checkAndGenerateOffer(gameState);
    }


    if(gameState.myTeamId) {
        const mySchedule = gameState.schedule[gameState.myTeamId];
        if (mySchedule) {
            const myLastGame = mySchedule.find(g => g.week === gameState.week);
            if (myLastGame) {
                 gameState.lastGameResult = myLastGame.result ?? null;
            }
        }
    }
    return gameState;
};


export const updateRankings = (teams: Team[]): GameState['nationalRankings'] => {
    const sortedTeams = [...teams].sort((a, b) => {
        if (b.record.wins !== a.record.wins) return b.record.wins - a.record.wins;
        if (a.record.losses !== b.record.losses) return a.record.losses - b.record.losses;
        return b.ovr - a.ovr;
    });
    return sortedTeams.slice(0, 25).map((team, index) => ({ teamId: team.id, rank: index + 1 }));
};

export const getNationalLeaders = (teams: Team[]): Record<string, { player: Player, teamName: string, value: number }[]> => {
    const allPlayers = teams.flatMap(t => t.roster.map(p => ({ ...p, teamName: t.name })));
    const leaders: Record<string, { player: Player, teamName: string, value: number }[]> = {};
    
    const statCategories: (keyof PlayerStats)[] = ['passYds', 'passTDs', 'rushYds', 'rushTDs', 'recYds', 'recTDs', 'tackles', 'sacks', 'ints'];
    
    statCategories.forEach(stat => {
        const sorted = allPlayers
            .filter(p => p.seasonStats[stat] > 0)
            .sort((a, b) => (b.seasonStats[stat] as number) - (a.seasonStats[stat] as number))
            .slice(0, 5)
            .map(p => ({ player: p, teamName: p.teamName, value: p.seasonStats[stat] as number }));
        leaders[stat] = sorted;
    });

    return leaders;
};


export const calculateAwardRaces = (teams: Team[]): Record<string, { player: Player, teamName: string }[]> => {
    const allPlayers = teams.flatMap(t => t.roster.map(p => ({ player: p, teamName: t.name })));

    const createRace = (pos: Position[], sortFn: (p: Player) => number) => {
        return allPlayers
            .filter(({ player }) => pos.includes(player.position))
            .sort((a, b) => sortFn(b.player) - sortFn(a.player))
            .slice(0, 5);
    };

    const mvpCandidates = createRace(['QB', 'RB', 'WR'], p => (p.attributes.OVR * 0.5 + (p.seasonStats.passTDs + p.seasonStats.rushTDs + p.seasonStats.recTDs) * 2));
    const bestQBCandidates = createRace(['QB'], p => p.seasonStats.passYds + p.seasonStats.passTDs * 50);
    const bestRBCandidates = createRace(['RB'], p => p.seasonStats.rushYds + p.seasonStats.rushTDs * 50);
    const bestWRCandidates = createRace(['WR', 'TE'], p => p.seasonStats.recYds + p.seasonStats.recTDs * 50);
    const bestDefenderCandidates = createRace(['DL', 'LB', 'DB'], p => p.seasonStats.tackles + p.seasonStats.sacks * 5 + p.seasonStats.ints * 10);
    
    return { 
        'MVP Race': mvpCandidates,
        'Best QB': bestQBCandidates,
        'Best RB': bestRBCandidates,
        'Best WR/TE': bestWRCandidates,
        'Best Defender': bestDefenderCandidates
    };
};

const generateAttributes = (position: Position, year: Player['year']) => {
  const yearModifier = { 'FR': -10, 'SO': -5, 'JR': 0, 'SR': 2 };
  const baseVal = (min: number, max: number) => Math.max(40, Math.min(99, rand(min, max) + yearModifier[year]));

  const base = {
    Speed: baseVal(50, 90), Strength: baseVal(50, 90), Stamina: baseVal(60, 95),
    Tackle: baseVal(50, 90), Catch: baseVal(50, 90), Pass: baseVal(50, 90),
    Block: baseVal(50, 90), Consistency: baseVal(50, 95), Potential: rand(70, 99),
  };
  // Positional adjustments
  switch (position) {
    case 'QB': base.Pass = baseVal(75, 95); base.Speed = baseVal(60, 85); break;
    case 'RB': base.Speed = baseVal(80, 99); base.Strength = baseVal(65, 90); base.Catch = baseVal(60, 80); break;
    case 'WR': case 'TE': base.Catch = baseVal(75, 99); base.Speed = baseVal(75, 99); break;
    case 'OL': base.Block = baseVal(80, 99); base.Strength = baseVal(85, 99); base.Speed = baseVal(50, 65); break;
    case 'DL': base.Tackle = baseVal(80, 99); base.Strength = baseVal(85, 99); base.Speed = baseVal(55, 75); break;
    case 'LB': base.Tackle = baseVal(80, 99); base.Speed = baseVal(65, 90); base.Strength = baseVal(75,95); break;
    case 'DB': base.Speed = baseVal(85, 99); base.Catch = baseVal(65, 90); base.Tackle = baseVal(60,85); break;
    case 'K/P': base.Strength = baseVal(65,95); base.Consistency = baseVal(80, 99); break;
  }

  const attributes = { ...base, OVR: 0 };
  attributes.OVR = calculatePlayerOvr(attributes);
  return attributes;
};

export const generatePlayer = (position: Position, year: Player['year']): Player => {
  const attributes = generateAttributes(position, year);
  const traits: PlayerTrait[] = [];
  if (rand(1, 100) <= 10) traits.push('Clutch');
  if (rand(1, 100) <= 10) traits.push('Injury Prone');
  if (rand(1, 100) <= 5) traits.push('Team Captain');
  if (position === 'RB' && rand(1, 100) <= 15) traits.push('Workhorse');

  return {
    id: crypto.randomUUID(),
    name: generateName(),
    position,
    year,
    attributes,
    seasonStats: initialStats(),
    careerStats: initialStats(),
    isInjured: 0,
    morale: rand(60, 85),
    currentStamina: 100,
    traits,
    gpa: rand(22, 38) / 10,
    isSuspended: 0,
    stringer: 0,
    xp: 0,
    xpToNextLevel: 1000,
    skillPoints: 0,
  };
};

export const generateRoster = (): Player[] => {
  const roster: Player[] = [];
  const years: Player['year'][] = ['FR', 'SO', 'JR', 'SR'];
  const rosterTemplate: Record<Position, number> = {
    'QB': 3, 'RB': 4, 'WR': 6, 'TE': 2, 'OL': 8, 'DL': 7,
    'LB': 6, 'DB': 7, 'K/P': 1,
  };

  for (const [pos, count] of Object.entries(rosterTemplate)) {
    for (let i = 0; i < count; i++) {
      roster.push(generatePlayer(pos as Position, choice(years)));
    }
  }
  return roster;
};

export const calculateTeamOvr = (roster: Player[]): number => {
    if (roster.length === 0) return 0;
    const topPlayers = roster.sort((a, b) => b.attributes.OVR - a.attributes.OVR).slice(0, 22);
    const totalOvr = topPlayers.reduce((sum, player) => sum + player.attributes.OVR, 0);
    return Math.round(totalOvr / topPlayers.length);
};

const updateDepthChartsForTeam = (team: Team): Team => {
    const positions: Position[] = ['QB', 'RB', 'WR', 'TE', 'OL', 'DL', 'LB', 'DB', 'K/P'];
    positions.forEach(pos => {
        team.roster.filter(p => p.position === pos)
            .sort((a,b) => b.attributes.OVR - a.attributes.OVR)
            .forEach((player, index) => {
                player.stringer = index + 1;
            });
    });
    return team;
}

export const generateTeam = (id: number, name: string, wvClass: WVClass): Team => {
    const isPowerhouse = POWERHOUSE_TEAMS.includes(id);
    let team: Team = {
        id,
        name,
        roster: generateRoster(),
        ovr: 0,
        record: { wins: 0, losses: 0 },
        confRecord: { wins: 0, losses: 0 },
        class: wvClass,
        rivalId: RIVALRIES[id] || undefined,
        prestige: rand(isPowerhouse ? 75 : 50, isPowerhouse ? 95 : 80),
    };
    team = updateDepthChartsForTeam(team);
    team.ovr = calculateTeamOvr(team.roster);
    if(isPowerhouse) team.ovr = Math.min(99, team.ovr + rand(2,5));
    return team;
};

export const generateSchedule = (teams: Team[]): Record<number, Game[]> => {
    const schedule: Record<number, Game[]> = {};
    teams.forEach(t => schedule[t.id] = []);

    for(let week = 1; week <= 10; week++) {
        const shuffledTeams = shuffle([...teams]);
        const pairs: [Team, Team][] = [];
        const pairedIds = new Set<number>();

        shuffledTeams.forEach(team1 => {
            if (pairedIds.has(team1.id)) return;
            // Prioritize rivalry games
            let opponent: Team | undefined;
            if (team1.rivalId && !pairedIds.has(team1.rivalId) && schedule[team1.id].every(g => g.opponentId !== team1.rivalId)) {
                opponent = shuffledTeams.find(t => t.id === team1.rivalId);
            }
            if(!opponent) {
                opponent = shuffledTeams.find(team2 => 
                    !pairedIds.has(team2.id) && 
                    team1.id !== team2.id &&
                    schedule[team1.id].every(g => g.opponentId !== team2.id)
                );
            }
            
            if (opponent) {
                pairs.push([team1, opponent]);
                pairedIds.add(team1.id);
                pairedIds.add(opponent.id);
            }
        });

        pairs.forEach(([team1, team2]) => {
             schedule[team1.id].push({ week, opponentId: team2.id, isHome: true, isRivalryGame: team1.rivalId === team2.id });
             schedule[team2.id].push({ week, opponentId: team1.id, isHome: false, isRivalryGame: team2.rivalId === team1.id });
        });
    }

    return schedule;
};

export const generateStaff = (type: Staff['type'], isGod = false): Staff => ({ id: crypto.randomUUID(), name: generateStaffName(), type, rating: isGod ? 99 : rand(60, 95), salary: rand(10000, 50000), scheme: type === 'OC' ? choice(['Balanced', 'Spread', 'Pro-Style', 'Run Heavy', 'Air Raid']) : type === 'DC' ? choice(['4-3 Defense', '3-4 Defense', 'Nickel', 'Aggressive']) : undefined });
export const generateSponsor = (isGod = false): Sponsor => { const type = isGod ? 'National' : choice<'Local' | 'Regional' | 'National'>(['Local', 'Regional', 'National']); let signingBonus = 0; let payoutPerWin = 0; switch(type) { case 'Local': signingBonus = rand(5000, 10000); payoutPerWin = rand(1000, 2500); break; case 'Regional': signingBonus = rand(15000, 30000); payoutPerWin = rand(3000, 6000); break; case 'National': signingBonus = rand(isGod ? 100000 : 40000, isGod ? 200000 : 75000); payoutPerWin = rand(isGod ? 20000 : 7000, isGod ? 50000 : 12000); break; } return { id: crypto.randomUUID(), name: `${choice(['Hometown', 'Statewide', 'National'])} ${choice(['Auto', 'Grill', 'Insurance', 'Sports'])}`, type, payoutPerWin, signingBonus, duration: rand(2, 4) }; };

const generateRecruit = (): Recruit => {
    const pos = choice<Position>(['QB', 'RB', 'WR', 'TE', 'OL', 'DL', 'LB', 'DB', 'K/P']);
    const player = generatePlayer(pos, 'FR');
    // FIX: Corrected casing of 'Potential' to match the type definition.
    const { Potential, OVR } = player.attributes;
    
    let starRating = 1;
    if (Potential > 95 || (Potential > 90 && OVR > 65)) starRating = 5;
    else if (Potential > 90 || (Potential > 85 && OVR > 62)) starRating = 4;
    else if (Potential > 85 || (Potential > 80 && OVR > 60)) starRating = 3;
    else if (Potential > 80) starRating = 2;

    const blurbs: Record<Position, string[]> = {
        'QB': ['Cannon for an arm', 'Pro-style pocket passer', 'Elusive dual-threat QB'],
        'RB': ['Downhill power runner', 'Speedy back with great hands', 'A true workhorse'],
        'WR': ['Deep threat receiver', 'Sure-handed possession WR', 'A mismatch in the slot'],
        'TE': ['Excellent blocker', 'Vertical threat at TE', 'Reliable target over the middle'],
        'OL': ['Pancake machine', 'Athletic pass protector', 'Mauler in the run game'],
        'DL': ['Explosive pass rusher', 'Stout run defender', 'High-motor interior lineman'],
        'LB': ['Sideline-to-sideline tackler', 'Intelligent field general', 'Hard-hitting inside backer'],
        'DB': ['Shutdown corner', 'Ball-hawking safety', 'Physical press corner'],
        'K/P': ['Big leg for kickoffs', 'Accurate field goal kicker', 'Can flip the field with punts']
    };

    return { 
        ...player,
        cost: rand(10, 50) + (starRating * 5),
        starRating,
        blurb: choice(blurbs[pos])
    };
};


export const initializeGameWorld = (godModeUnlocked: boolean): GameState => {
    const teams: Team[] = [];
    (Object.keys(WV_TEAMS) as WVClass[]).forEach(wvClass => {
        WV_TEAMS[wvClass].forEach(teamInfo => {
            teams.push(generateTeam(teamInfo.id, teamInfo.name, wvClass));
        });
    });

    const fillerTeamsNeeded = 48 - teams.length;
    const otherNames = shuffle(OTHER_WV_TEAM_NAMES);
    for (let i = 0; i < fillerTeamsNeeded; i++) {
        const id = 301 + i;
        const wvClass = choice<WVClass>(['A', 'AA', 'AAA']);
        teams.push(generateTeam(id, otherNames[i % otherNames.length], wvClass));
    }
    
    const schedule = generateSchedule(teams);
    
    return {
        gameMode: null, myTeamId: null, myPlayerId: null,
        teams,
        season: 1, week: 1, schedule, funds: 50000,
        facilities: { coaching: { level: 1, cost: 10000 }, training: { level: 1, cost: 10000 }, rehab: { level: 1, cost: 10000 }, tutoring: { level: 1, cost: 10000 }},
        nationalRankings: updateRankings(teams),
        playoffBracket: null, tocBracket: null, classChampions: { 'A': null, 'AA': null, 'AAA': null }, tocChampion: null,
        lastGameResult: null, gameLog: [], recruits: [], signedRecruits: [], isOffseason: false,
        seasonAwards: { mvp: null, bestQB: null, bestRB: null, bestWR: null, bestDefender: null, bestOL: null, bestKP: null },
        fanHappiness: 75, activeSponsor: null, availableSponsors: Array.from({ length: 5 }, () => generateSponsor(false)),
        inbox: [], staff: [generateStaff('OC'), generateStaff('DC'), generateStaff('Trainer'), generateStaff('Doctor')], staffMarket: Array.from({ length: 10 }, () => generateStaff(choice(['OC', 'DC', 'Trainer', 'Doctor']))),
        myStrategy: { offense: 'Balanced', defense: '4-3 Defense' },
        trophyCase: [], recruitingPoints: 100,
        coach: { name: 'Coach', archetype: 'Motivator', points: 5, skillTree: { pepTalk: { name: "Pep Talk", description: "Boosts team morale before big games.", level: 0, maxLevel: 5, cost: [1,2,3,4,5] }, recruitingNetwork: { name: "Recruiting Network", description: "Increases recruiting points each season.", level: 0, maxLevel: 5, cost: [1,2,3,4,5] }}, championships: 0, totalWins: 0, seasonsCoached: 0 },
        schoolPrestige: 70, hallOfFame: [], practiceSessions: 2, news: [], collegeOffers: [],
        godMode: godModeUnlocked ? { isEnabled: true, unlimitedFunds: false, maxFacilities: false, perfectAcademics: false, perfectMorale: false, maxCoaching: false, perfectRecruiting: false, forceWinGames: false, unlimitedStamina: false, infiniteSkillPoints: false, canEditPlayers: false, canTransferAnytime: false, autoCrazyStats: false, autoStart: false, maxAllTeamOvr: false } : null,
        activeGame: null,
    };
};

export const generateNewSeasonGoals = (player: Player): Player => {
    const goals: PlayerGoal[] = [];
    const targetMultiplier = { 'FR': 0.7, 'SO': 0.9, 'JR': 1.1, 'SR': 1.3 }[player.year];
    switch (player.position) {
        case 'QB': goals.push({ description: `Throw for ${Math.floor(2000*targetMultiplier)} yards`, stat: 'passYds', target: Math.floor(2000*targetMultiplier), reward: { attribute: 'Pass', points: 2 }, isCompleted: false }); break;
        case 'RB': goals.push({ description: `Rush for ${Math.floor(1500*targetMultiplier)} yards`, stat: 'rushYds', target: Math.floor(1500*targetMultiplier), reward: { attribute: 'Speed', points: 2 }, isCompleted: false }); break;
        case 'WR': goals.push({ description: `Get ${Math.floor(1000*targetMultiplier)} receiving yards`, stat: 'recYds', target: Math.floor(1000*targetMultiplier), reward: { attribute: 'Catch', points: 3 }, isCompleted: false }); break;
        case 'DL': goals.push({ description: `Record ${Math.floor(10*targetMultiplier)} sacks`, stat: 'sacks', target: Math.floor(10*targetMultiplier), reward: { attribute: 'Tackle', points: 3 }, isCompleted: false }); break;
        case 'LB': goals.push({ description: `Record ${Math.floor(100*targetMultiplier)} tackles`, stat: 'tackles', target: Math.floor(100*targetMultiplier), reward: { attribute: 'Tackle', points: 2 }, isCompleted: false }); break;
        case 'DB': goals.push({ description: `Get ${Math.floor(5*targetMultiplier)} interceptions`, stat: 'ints', target: Math.floor(5*targetMultiplier), reward: { attribute: 'Catch', points: 3 }, isCompleted: false }); break;
    }
    player.goals = goals;
    return player;
};

export const initializeMyCareer = (playerName: string, position: Position, teamId: number, godModeUnlocked: boolean, teams: Team[]): GameState => {
    const baseState = initializeGameWorld(godModeUnlocked); // Re-init to get a fresh world
    baseState.gameMode = 'MY_CAREER';
    baseState.myTeamId = teamId;
    
    let myPlayer: Player = { ...generatePlayer(position, 'FR'), name: playerName, isPlayerCharacter: true, skillPoints: 5, goals: [] };
    
    if (baseState.godMode?.isEnabled) {
        myPlayer.skillPoints = 99;
        Object.keys(myPlayer.attributes).forEach(key => {
            const attrKey = key as keyof Player['attributes'];
            if (attrKey !== 'OVR') {
                myPlayer.attributes[attrKey] = 99;
            }
        });
        myPlayer.attributes.OVR = calculatePlayerOvr(myPlayer.attributes);
        myPlayer.stringer = 1; // Make player starter
    }

    baseState.myPlayerId = myPlayer.id;

    const myTeam = baseState.teams.find(t => t.id === teamId);
    if (!myTeam) {
        console.error(`initializeMyCareer: Could not find team with id ${teamId}`);
        return baseState;
    }
    
    // FIX: Corrected roster addition logic to prevent duplicating the player.
    if (baseState.godMode?.isEnabled && baseState.godMode.autoStart) {
        const oldStarterIndex = myTeam.roster.findIndex(p => p.position === position && p.stringer === 1);
        if (oldStarterIndex > -1) {
            myTeam.roster.splice(oldStarterIndex, 1); // Remove old starter
        }
        myTeam.roster.push(myPlayer); // Add new player
    } else {
        const backupPlayerIndex = myTeam.roster.findIndex(p => p.position === position && p.stringer > 1);
        if (backupPlayerIndex > -1) {
            myTeam.roster[backupPlayerIndex] = myPlayer; // Replace a backup
        } else {
            myTeam.roster.push(myPlayer); // Add if no backup to replace
        }
    }
    
    updateDepthChartsForTeam(myTeam);
    myTeam.ovr = calculateTeamOvr(myTeam.roster);
    
    const updatedPlayer = generateNewSeasonGoals(myPlayer);
    const finalPlayerIndex = myTeam.roster.findIndex(p => p.id === updatedPlayer.id);
    if (finalPlayerIndex !== -1) {
        myTeam.roster[finalPlayerIndex] = updatedPlayer;
    }

    return baseState;
};

const generatePlausiblePlayerStats = (team: Team, opponent: Team, teamScore: number): Record<string, Partial<PlayerStats>> => {
    const stats: Record<string, Partial<PlayerStats>> = {};
    const touchdowns = Math.floor(teamScore / 7);
    const fieldgoals = Math.floor((teamScore % 7) / 3);
    let totalYards = touchdowns * rand(60, 80) + fieldgoals * rand(40, 60) + rand(50, 150);

    const qb = team.roster.find(p => p.position === 'QB' && p.stringer === 1);
    const rb = team.roster.find(p => p.position === 'RB' && p.stringer === 1);
    const wrs = team.roster.filter(p => p.position === 'WR' && p.stringer <= 2);
    const defenders = team.roster.filter(p => ['DL', 'LB', 'DB'].includes(p.position));

    if (qb) {
        stats[qb.id] = { ...stats[qb.id] };
        const passRatio = 0.6 + (qb.attributes.Pass - 70) * 0.01;
        const passYards = Math.floor(totalYards * passRatio);
        const passTDs = Math.max(0, Math.floor(touchdowns * passRatio) + rand(-1, 1));
        stats[qb.id].passYds = passYards;
        stats[qb.id].passTDs = passTDs;

        let remainingYards = passYards;
        let remainingTDs = passTDs;
        wrs.forEach(wr => {
            stats[wr.id] = { ...stats[wr.id] };
            const wrYards = Math.floor(remainingYards * (Math.random() * 0.5 + 0.25));
            const wrTDs = remainingTDs > 0 && Math.random() > 0.5 ? 1 : 0;
            stats[wr.id].recYds = wrYards;
            stats[wr.id].recTDs = wrTDs;
            remainingYards -= wrYards;
            remainingTDs -= wrTDs;
        });
    }

    if (rb) {
        stats[rb.id] = { ...stats[rb.id] };
        const rushRatio = 1 - (0.6 + (qb?.attributes.Pass || 70 - 70) * 0.01);
        stats[rb.id].rushYds = Math.floor(totalYards * rushRatio);
        stats[rb.id].rushTDs = touchdowns - (stats[qb?.id!]?.passTDs || 0);
    }

    defenders.forEach(def => {
        stats[def.id] = { ...stats[def.id] };
        stats[def.id].tackles = rand(1, 8);
        if (Math.random() < 0.1) stats[def.id].sacks = 1;
        if (def.position === 'DB' && Math.random() < 0.05) stats[def.id].ints = 1;
    });

    return stats;
};


export const simulateGame = async (gameState: GameState, team1Id: number, team2Id: number): Promise<{ team1Score: number, team2Score: number, playerStats: Game['result']['playerStats'] }> => {
    const team1 = gameState.teams.find(t => t.id === team1Id);
    const team2 = gameState.teams.find(t => t.id === team2Id);

    if (!team1 || !team2) {
        console.error(`simulateGame: Team not found. Team1Id: ${team1Id}, Team2Id: ${team2Id}`);
        return { team1Score: 0, team2Score: 21, playerStats: { myTeam: {}, opponentTeam: {} } };
    }

    const myPlayer = gameState.gameMode === 'MY_CAREER' ? team1.roster.find(p => p.id === gameState.myPlayerId) : null;
    const isMyGame = team1Id === gameState.myTeamId;

    if (isMyGame && gameState.godMode?.forceWinGames) {
        const team1Score = rand(35, 63);
        const team2Score = rand(0, 21);
        let myStats = generatePlausiblePlayerStats(team1, team2, team1Score);
        const oppStats = generatePlausiblePlayerStats(team2, team1, team2Score);

        if (myPlayer && gameState.godMode.autoCrazyStats) {
            const playerStats: Partial<PlayerStats> = {};
            switch (myPlayer.position) {
                case 'QB': playerStats.passYds = rand(450, 700); playerStats.passTDs = rand(5, 8); break;
                case 'RB': playerStats.rushYds = rand(250, 400); playerStats.rushTDs = rand(4, 6); break;
                case 'WR': case 'TE': playerStats.recYds = rand(200, 350); playerStats.recTDs = rand(3, 5); break;
                case 'DL': playerStats.tackles = rand(8, 15); playerStats.sacks = rand(3, 6); break;
                case 'LB': playerStats.tackles = rand(15, 25); playerStats.sacks = rand(1, 3); playerStats.ints = rand(0, 2); break;
                case 'DB': playerStats.tackles = rand(5, 10); playerStats.ints = rand(2, 4); break;
            }
            myStats[myPlayer.id] = { ...myStats[myPlayer.id], ...playerStats };
        }
        
        return { team1Score, team2Score, playerStats: { myTeam: myStats, opponentTeam: oppStats } };
    }

    const getUnitOVR = (roster: Player[], unit: 'off' | 'def') => {
        const positions = unit === 'off' ? ['QB', 'RB', 'WR', 'TE', 'OL'] : ['DL', 'LB', 'DB'];
        const players = roster.filter(p => positions.includes(p.position) && p.stringer === 1);
        return players.length > 0 ? players.reduce((sum, p) => sum + p.attributes.OVR, 0) / players.length : 60;
    };

    const team1OffOvr = getUnitOVR(team1.roster, 'off');
    const team1DefOvr = getUnitOVR(team1.roster, 'def');
    const team2OffOvr = getUnitOVR(team2.roster, 'off');
    const team2DefOvr = getUnitOVR(team2.roster, 'def');

    const calculateScore = (offOvr: number, defOvr: number) => {
        let score = 0;
        const possessions = rand(10, 13);
        const advantage = (offOvr - defOvr) / 100.0;
        const tdProb = Math.max(0.05, Math.min(0.7, 0.30 + advantage * 2));
        const fgProb = Math.max(0.05, Math.min(0.5, 0.15 + advantage));

        for(let i=0; i < possessions; i++) {
            const roll = Math.random();
            if (roll < tdProb) score += 7;
            else if (roll < tdProb + fgProb) score += 3;
        }
        return score;
    };

    const team1Score = calculateScore(team1OffOvr, team2DefOvr);
    const team2Score = calculateScore(team2OffOvr, team1DefOvr);
    
    const team1Stats = generatePlausiblePlayerStats(team1, team2, team1Score);
    const team2Stats = generatePlausiblePlayerStats(team2, team1, team2Score);

    return { team1Score, team2Score, playerStats: { myTeam: team1Stats, opponentTeam: team2Stats } };
};


export const simulateOtherGames = async (gameState: GameState): Promise<GameState> => {
    // FIX: Add guard for myTeamId to prevent crash
    if (gameState.myTeamId === null) return gameState;

    const playedTeams = new Set<number>();
    // Add my team and opponent since their game is handled separately
    const myGameThisWeek = gameState.schedule[gameState.myTeamId]?.find(g => g.week === gameState.week);
    if (myGameThisWeek) {
        playedTeams.add(gameState.myTeamId);
        playedTeams.add(myGameThisWeek.opponentId);
    }

    for (const team of gameState.teams) {
        if (playedTeams.has(team.id)) continue;
        
        const game = gameState.schedule[team.id]?.find(g => g.week === gameState.week);
        if (!game || playedTeams.has(game.opponentId)) continue;

        const result = await simulateGame(gameState, team.id, game.opponentId);
        applyGameResults(gameState, team.id, game.opponentId, result.team1Score, result.team2Score, result.playerStats);

        playedTeams.add(team.id);
        playedTeams.add(game.opponentId);
    }
    return gameState;
};


export const processOffseason = (gameState: GameState): GameState => {
    // FIX: Add type annotation to preserve type information after deep cloning with JSON.parse.
    let newState: GameState = JSON.parse(JSON.stringify(gameState));
    newState.coach.seasonsCoached++;
    newState = checkMyCareerGoals(newState);
    newState = checkAndGenerateOffer(newState, true); // Force an offer check in offseason

    const allPlayers = newState.teams.flatMap((t: Team) => t.roster.map((p: Player) => ({ ...p, teamName: t.name })));
    const findBestPlayer = (positions: Position[], sortFn: (p: Player) => number) => {
        const eligiblePlayers = allPlayers.filter((p: Player) => positions.includes(p.position));
        if (eligiblePlayers.length === 0) return null;
        return eligiblePlayers.sort((a: Player, b: Player) => sortFn(b) - sortFn(a))[0] || null;
    };

    const awardRaces = calculateAwardRaces(newState.teams);
    newState.seasonAwards = {
        mvp: awardRaces['MVP Race'][0]?.player || null,
        bestQB: awardRaces['Best QB'][0]?.player || null,
        bestRB: awardRaces['Best RB'][0]?.player || null,
        bestWR: awardRaces['Best WR/TE'][0]?.player || null,
        bestDefender: awardRaces['Best Defender'][0]?.player || null,
        bestOL: findBestPlayer(['OL'], p => p.attributes.OVR + p.attributes.Block),
        bestKP: findBestPlayer(['K/P'], p => p.attributes.OVR + p.attributes.Consistency),
    };

    // Hall of Fame Logic (Max 2 per year)
    const candidates: HallOfFameInductee[] = [];
    if(newState.gameMode === 'DYNASTY' && newState.coach.seasonsCoached >= 15 && newState.coach.championships > 2 && Math.random() < 0.3) {
        if (!newState.hallOfFame.some((inductee: HallOfFameInductee) => inductee.type === 'Coach' && (inductee.details as CoachHOFDetails).name === newState.coach.name)) {
            candidates.push({ type: 'Coach', yearInductcted: newState.season, details: { name: newState.coach.name, championships: newState.coach.championships, totalWins: newState.coach.totalWins } as CoachHOFDetails });
        }
    }
    // Check for legendary graduating players
    const myTeam = newState.teams.find((t:Team) => t.id === newState.myTeamId);
    if(myTeam) {
        myTeam.roster.filter((p:Player) => p.year === 'SR' && p.attributes.OVR > 95).forEach((p:Player) => {
            candidates.push({ type: 'Player', yearInductcted: newState.season, details: { playerId: p.id, name: p.name, position: p.position, careerStats: p.careerStats } as PlayerHOFDetails});
        });
    }
    
    shuffle(candidates).slice(0, 2).forEach(inductee => newState.hallOfFame.push(inductee));
    
    newState.week = 16; // Advance week to Awards stage
    newState.isOffseason = true;
    return newState;
};


export const runTrainingCamp = (gameState: GameState, focus: TrainingFocus): GameState => {
    const myTeam = gameState.teams.find(t => t.id === gameState.myTeamId);
    if (!myTeam) return gameState;

    const getBoost = () => rand(1, 3);

    const focusMap: Record<TrainingFocus, Position[]> = {
        'Passing Offense': ['QB', 'WR', 'TE', 'OL'],
        'Rushing Offense': ['RB', 'OL'],
        'Pass Defense': ['DB', 'DL'],
        'Rush Defense': ['DL', 'LB'],
        'Special Teams': ['K/P'],
    };

    myTeam.roster.forEach(player => {
        if(focusMap[focus].includes(player.position)) {
             player.attributes.Consistency += getBoost();
             if (player.position === 'QB') player.attributes.Pass += getBoost();
             if (['WR', 'TE', 'DB'].includes(player.position)) player.attributes.Catch += getBoost();
             if (player.position === 'OL') player.attributes.Block += getBoost();
             if (['DL', 'LB'].includes(player.position)) player.attributes.Tackle += getBoost();
             player.attributes.OVR = calculatePlayerOvr(player.attributes);
        }
    });
    return gameState;
};

const applyPassiveProgression = (player: Player): Player => {
    Object.keys(player.attributes).forEach(key => {
        const attr = key as keyof Player['attributes'];
        if (attr !== 'OVR' && attr !== 'Potential') {
            const increaseChance = player.attributes.Potential / 1000; // ~9% chance per week for 99 potential
            if (Math.random() < increaseChance) {
                player.attributes[attr] = Math.min(99, player.attributes[attr] + 1);
            }
        }
    });
    player.attributes.OVR = calculatePlayerOvr(player.attributes);
    return player;
};

export const prepareNextSeason = (gameState: GameState): GameState => {
    // FIX: Add type annotation to preserve type information after deep cloning with JSON.parse.
    let newState: GameState = JSON.parse(JSON.stringify(gameState));

    newState.teams.forEach((team: Team) => {
        const nextSeasonRoster: Player[] = [];
        team.roster.forEach((p: Player) => {
            if (p.year !== 'SR') {
                const yearMap: Record<string, Player['year']> = { 'FR': 'SO', 'SO': 'JR', 'JR': 'SR' };
                p.year = yearMap[p.year];
                // Offseason progression
                Object.keys(p.attributes).forEach(key => {
                    const attr = key as keyof Player['attributes'];
                    if (attr !== 'OVR' && attr !== 'Potential') {
                        const increase = Math.floor(Math.random() * (p.attributes.Potential / 20));
                        p.attributes[attr] = Math.min(99, p.attributes[attr] + increase);
                    }
                });
                p.seasonStats = initialStats();
                p.attributes.OVR = calculatePlayerOvr(p.attributes);
                nextSeasonRoster.push(p);
            }
        });

        if (team.id === newState.myTeamId) {
            newState.signedRecruits.forEach((recruit: Recruit) => {
                const newPlayer = { ...recruit, year: 'FR', seasonStats: initialStats(), careerStats: initialStats(), isInjured: 0, morale: rand(60,85), currentStamina: 100, isSuspended: 0, stringer: 0, skillPoints: 0, xp: 0, xpToNextLevel: 1000 } as Player;
                nextSeasonRoster.push(newPlayer);
            });
        }
        
        while(nextSeasonRoster.length < 44) nextSeasonRoster.push(generatePlayer(choice<Position>(['QB', 'RB', 'WR', 'TE', 'OL', 'DL', 'LB', 'DB', 'K/P']), 'FR'));

        team.roster = nextSeasonRoster;
        updateDepthChartsForTeam(team);
        team.ovr = calculateTeamOvr(team.roster);
        team.record = { wins: 0, losses: 0 };
    });

    newState.season += 1;
    newState.week = 1;
    newState.schedule = generateSchedule(newState.teams);
    newState.isOffseason = false;
    newState.playoffBracket = null;
    newState.tocBracket = null;
    newState.classChampions = { 'A': null, 'AA': null, 'AAA': null };
    newState.tocChampion = null;
    newState.recruitingPoints += 100;
    newState.recruits = Array.from({length: 15}, () => generateRecruit());
    newState.signedRecruits = [];
    newState.practiceSessions = 2;

    if(newState.gameMode === 'MY_CAREER') {
        const myTeam = newState.teams.find((t:Team) => t.id === newState.myTeamId);
        if (myTeam) {
            const myPlayer = myTeam.roster.find((p:Player) => p.id === newState.myPlayerId);
            if (myPlayer) {
                generateNewSeasonGoals(myPlayer);
            }
        }
    }
    
    return newState;
};

export const generateScoutingReport = (opponent: Team, allTeams: Team[]): ScoutingReport => {
    const bestPlayers = [...opponent.roster].sort((a,b) => b.attributes.OVR - a.attributes.OVR).slice(0, 3);
    const tactic = {
        strength: 'Well-coached team, very consistent.',
        weakness: 'Lacks elite speed on the outside.',
        suggestion: 'Challenge their corners with deep passes and attack the edges on run plays.'
    };
    return {
        teamId: opponent.id,
        teamName: opponent.name,
        ovr: opponent.ovr,
        record: opponent.record,
        bestPlayers,
        strategy: { offense: 'Balanced', defense: '4-3 Defense' }, // This is a fallback
        tactic
    };
};

export const generateDynamicScoutingReport = async (gameState: GameState, opponentId: number): Promise<ScoutingReport> => {
    const opponent = gameState.teams.find(t => t.id === opponentId);
    if (!opponent) {
        return generateScoutingReport({ id: opponentId, name: 'Unknown', ovr: 60, roster: [], record: {wins:0, losses:0}, class:'A', confRecord: {wins:0, losses:0}, prestige: 60}, gameState.teams);
    }
    
    if (!ai) {
        return generateScoutingReport(opponent, gameState.teams);
    }
    const myTeam = gameState.teams.find(t => t.id === gameState.myTeamId);
    if (!myTeam) {
        return generateScoutingReport(opponent, gameState.teams); // Fallback if myTeam is not found
    }
    
    const bestPlayers = [...opponent.roster].sort((a, b) => b.attributes.OVR - a.attributes.OVR).slice(0, 3);

    const prompt = `You are an expert high school football scout. Analyze this opponent and provide a brief, unique scouting report for my team.
    My Team: ${myTeam.name}, OVR: ${myTeam.ovr}, Offense: ${gameState.myStrategy.offense}, Defense: ${gameState.myStrategy.defense}.
    Opponent: ${opponent.name}, OVR: ${opponent.ovr}, Record: ${opponent.record.wins}-${opponent.record.losses}. Their best players are ${bestPlayers.map(p => `${p.name} (${p.position}, ${p.attributes.OVR} OVR)`).join(', ')}.
    Provide one key strength, one key weakness, and a one-sentence strategic suggestion for my team. Be specific and tactical. Do not repeat generic advice.`;

    const responseSchema = {
        type: Type.OBJECT,
        properties: {
            strength: { type: Type.STRING, description: "The opponent's primary strength." },
            weakness: { type: Type.STRING, description: "The opponent's primary weakness." },
            suggestion: { type: Type.STRING, description: "A strategic suggestion for my team." },
        },
        required: ['strength', 'weakness', 'suggestion'],
    };

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema,
            },
        });
        const tactic = JSON.parse(response.text.trim());
        return {
            teamId: opponent.id,
            teamName: opponent.name,
            ovr: opponent.ovr,
            record: opponent.record,
            bestPlayers,
            strategy: { offense: 'Balanced', defense: '4-3 Defense' }, // Placeholder
            tactic,
        };
    } catch (error) {
        console.error("Gemini API call failed, using fallback.", error);
        return generateScoutingReport(opponent, gameState.teams);
    }
};

export const handleSpendSkillPoint = (gameState: GameState, attribute: keyof Player['attributes']): GameState => {
    let newState = JSON.parse(JSON.stringify(gameState)) as GameState;
    if (newState.gameMode !== 'MY_CAREER') return newState;
    
    const myTeam = newState.teams.find(t => t.id === newState.myTeamId);
    if (!myTeam) return gameState;
    const myPlayer = myTeam.roster.find(p => p.id === newState.myPlayerId);
    if (!myPlayer) return gameState;
    
    if (myPlayer.skillPoints && myPlayer.skillPoints > 0) {
        if (!newState.godMode?.infiniteSkillPoints) {
            myPlayer.skillPoints -= 1;
        }
        myPlayer.attributes[attribute] = Math.min(99, myPlayer.attributes[attribute] + 1);
        myPlayer.attributes.OVR = calculatePlayerOvr(myPlayer.attributes);
        updateDepthChartsForTeam(myTeam);
    }

    return newState;
};

export const handlePractice = (gameState: GameState, type: string): GameState => {
     let newState = JSON.parse(JSON.stringify(gameState)) as GameState;
     if (newState.gameMode !== 'MY_CAREER' || newState.practiceSessions <= 0) return newState;
     const myTeam = newState.teams.find(t => t.id === newState.myTeamId);
     if (!myTeam) return gameState;
     const myPlayer = myTeam.roster.find(p => p.id === newState.myPlayerId);
     if (!myPlayer) return gameState;

     newState.practiceSessions -= 1;
     if (type === 'drills' && myPlayer.xp !== undefined && myPlayer.xpToNextLevel !== undefined && myPlayer.skillPoints !== undefined) {
        myPlayer.xp += 250;
        if (myPlayer.xp >= myPlayer.xpToNextLevel) {
            myPlayer.xp -= myPlayer.xpToNextLevel;
            myPlayer.skillPoints += 1;
            myPlayer.xpToNextLevel = Math.floor(myPlayer.xpToNextLevel * 1.5);
        }
     } else if (type === 'film') {
        myPlayer.attributes.Consistency = Math.min(99, myPlayer.attributes.Consistency + 1);
        myPlayer.attributes.OVR = calculatePlayerOvr(myPlayer.attributes);
        updateDepthChartsForTeam(myTeam);
     }
     return newState;
};

const addPlayoffGameToSchedule = (gameState: GameState, matchup: PlayoffMatchup, playoffRound: Game['playoffRound'], week: number) => {
    const { team1Id, team2Id } = matchup;
    
    const addGame = (teamId: number, opponentId: number, isHome: boolean) => {
        const existingGame = gameState.schedule[teamId]?.find(g => g.week === week);
        if (!existingGame) {
            if (!gameState.schedule[teamId]) gameState.schedule[teamId] = [];
            gameState.schedule[teamId].push({
                week,
                opponentId,
                isHome,
                playoffRound,
            });
        }
    }

    addGame(team1Id, team2Id, true);
    addGame(team2Id, team1Id, false);
}

export const startPlayoffs = (gameState: GameState): GameState => {
    const brackets: GameState['playoffBracket'] = { 'A': [], 'AA': [], 'AAA': [] };
    (['A', 'AA', 'AAA'] as WVClass[]).forEach(wvClass => {
        const classTeams = gameState.teams.filter(t => t.class === wvClass).sort((a, b) => b.record.wins - a.record.wins || b.ovr - a.ovr).slice(0, 8);
        const seeds = [0, 7, 3, 4, 2, 5, 1, 6];
        const matchups: PlayoffMatchup[] = [];
        for (let i = 0; i < 4; i++) {
            if (classTeams[seeds[i*2]] && classTeams[seeds[i*2 + 1]]) {
                const matchup = { team1Id: classTeams[seeds[i*2]].id, team2Id: classTeams[seeds[i*2 + 1]].id };
                matchups.push(matchup);
                addPlayoffGameToSchedule(gameState, matchup, 'Quarterfinals', 11);
            }
        }
        brackets[wvClass] = matchups;
    });
    gameState.playoffBracket = brackets;
    return gameState;
};

const simulatePlayoffGame = async (matchup: PlayoffMatchup, gameState: GameState): Promise<number> => {
    const { team1Id, team2Id } = matchup;
    
    // Check if game was already played (e.g., user's game)
    const gameForTeam1 = gameState.schedule[team1Id]?.find(g => g.week === gameState.week && g.opponentId === team2Id);
    if (gameForTeam1?.result) {
        return gameForTeam1.result.myScore > gameForTeam1.result.opponentScore ? team1Id : team2Id;
    }
    
    const team1 = gameState.teams.find(t => t.id === team1Id);
    const team2 = gameState.teams.find(t => t.id === team2Id);
    // FIX: Add guards for missing teams in playoffs
    if (!team1) return team2Id;
    if (!team2) return team1Id;

    const result = await simulateGame(gameState, team1Id, team2Id);
    applyGameResults(gameState, team1Id, team2Id, result.team1Score, result.team2Score, result.playerStats);
    return result.team1Score > result.team2Score ? team1Id : team2Id;
};

export const simulatePlayoffRound = async (gameState: GameState): Promise<GameState> => {
    if (!gameState.playoffBracket) return gameState;
    const playoffRoundMap = { 12: 'Semifinals', 13: 'Championship' } as const;
    const nextWeek = gameState.week + 1;
    const nextRound = playoffRoundMap[nextWeek as keyof typeof playoffRoundMap];

    for (const wvClass of Object.keys(gameState.playoffBracket) as WVClass[]) {
        const matchups = gameState.playoffBracket[wvClass];
        const nextRoundMatchups: PlayoffMatchup[] = [];
        
        if (matchups.length > 1) { // Quarter or Semifinals
             const winners = await Promise.all(matchups.map(m => simulatePlayoffGame(m, gameState)));
             for (let i = 0; i < winners.length; i += 2) {
                if (winners[i] && winners[i+1]) {
                    const matchup = { team1Id: winners[i], team2Id: winners[i+1] };
                    nextRoundMatchups.push(matchup);
                    addPlayoffGameToSchedule(gameState, matchup, nextRound, nextWeek);
                }
            };
             gameState.playoffBracket[wvClass] = nextRoundMatchups;
        } else if (matchups.length === 1) { // Championship
            const winner = await simulatePlayoffGame(matchups[0], gameState);
            gameState.classChampions[wvClass] = winner;
            if (winner === gameState.myTeamId) {
                 gameState.trophyCase.push({ season: gameState.season, award: `Class ${wvClass} State Champions` });
                 gameState.coach.championships++;
                 const champTeam = gameState.teams.find(t => t.id === winner);
                 if(champTeam && champTeam.record.losses === 0) gameState.hallOfFame.push({ type: 'Team', yearInductcted: gameState.season, details: { teamId: champTeam.id, teamName: champTeam.name, season: gameState.season, record: champTeam.record, accolade: "Undefeated Season" } as TeamHOFDetails });
            }
            gameState.playoffBracket[wvClass] = [];
        }
    }
    return gameState;
};

export const startTournamentOfChampions = (gameState: GameState): GameState => {
    const champions = Object.values(gameState.classChampions).filter(id => id !== null) as number[];
    if (champions.length >= 2) { // Handle case with fewer than 4 champs
        const shuffledChamps = shuffle(champions);
        gameState.tocBracket = [];
        for(let i = 0; i < Math.floor(shuffledChamps.length / 2); i++) {
            const matchup = { team1Id: shuffledChamps[i*2], team2Id: shuffledChamps[i*2 + 1] };
            gameState.tocBracket.push(matchup);
            addPlayoffGameToSchedule(gameState, matchup, 'ToC Semifinal', 14);
        }
    }
    return gameState;
};

export const simulateTocRound = async (gameState: GameState): Promise<GameState> => {
    if (!gameState.tocBracket) return gameState;

    if (gameState.week === 14) { // Semifinals
        const winners = await Promise.all(gameState.tocBracket.map(m => simulatePlayoffGame(m, gameState)));
        if (winners.length > 1) {
            const matchup = { team1Id: winners[0], team2Id: winners[1] };
            gameState.tocBracket = [matchup];
            addPlayoffGameToSchedule(gameState, matchup, 'ToC Final', 15);
        } else {
             gameState.tocChampion = winners[0] || null;
             gameState.tocBracket = [];
        }
    } else if (gameState.week === 15) { // Final
        if (gameState.tocBracket.length > 0) {
            const winner = await simulatePlayoffGame(gameState.tocBracket[0], gameState);
            gameState.tocChampion = winner;
            if (winner === gameState.myTeamId) {
                gameState.trophyCase.push({ season: gameState.season, award: 'Overall State Champions' });
            }
        }
        gameState.tocBracket = [];
    }
    return gameState;
};

export const checkMyCareerGoals = (gameState: GameState): GameState => {
    if (gameState.gameMode !== 'MY_CAREER' || !gameState.myPlayerId || !gameState.myTeamId) return gameState;
    const myTeam = gameState.teams.find(t => t.id === gameState.myTeamId);
    if (!myTeam) return gameState;
    const myPlayer = myTeam.roster.find(p => p.id === gameState.myPlayerId);
    if (myPlayer && myPlayer.goals) {
        myPlayer.goals.forEach(goal => {
            if (!goal.isCompleted && myPlayer.seasonStats[goal.stat] >= goal.target) {
                goal.isCompleted = true;
                myPlayer.attributes[goal.reward.attribute] = Math.min(99, myPlayer.attributes[goal.reward.attribute] + goal.reward.points);
            }
        });
        myPlayer.attributes.OVR = calculatePlayerOvr(myPlayer.attributes);
    }
    return gameState;
};

export const checkAndGenerateOffer = (gameState: GameState, isOffseason = false): GameState => {
    if (gameState.gameMode !== 'MY_CAREER') return gameState;

    const myTeam = gameState.teams.find(t => t.id === gameState.myTeamId);
    if (!myTeam) return gameState;
    const myPlayer = myTeam.roster.find(p => p.id === gameState.myPlayerId);
    if (!myPlayer || (myPlayer.year !== 'JR' && myPlayer.year !== 'SR')) return gameState;
    
    const hasMvp = gameState.seasonAwards.mvp?.id === myPlayer.id;
    const buzzScore = myPlayer.attributes.OVR + (hasMvp ? 15 : 0) + (myPlayer.stringer === 1 ? 5 : 0);
    const offerChance = isOffseason ? 0.8 : 0.25;

    if(buzzScore > 85 && Math.random() < offerChance) {
        const offer = generateCollegeOffers(myPlayer, gameState.trophyCase)[0];
        if(offer && !gameState.collegeOffers.some(o => o.collegeName === offer.collegeName)) {
            gameState.collegeOffers.push(offer);
            const article = generateNewsArticle(gameState, 'OFFER', {playerName: myPlayer.name, ...offer});
            if(article) gameState.news.push(article);
            gameState.inbox.push({ id: crypto.randomUUID(), season: gameState.season, week: gameState.week, from: `${offer.collegeName} Recruiting`, subject: "Scholarship Offer", body: `Dear ${myPlayer.name},\n\nWe've been incredibly impressed with your performance this season. It is with great pleasure that we extend to you a full athletic scholarship to join the ${offer.collegeName} football program.\n\nWe believe you have what it takes to succeed at the next level.\n\nSincerely,\nThe ${offer.collegeName} Coaching Staff`, read: false});
        }
    }
    return gameState;
};


export const applyWeeklySuspensionChecks = (gameState: GameState): GameState => {
    gameState.teams.forEach(team => team.roster.forEach(player => {
        if (player.isSuspended > 0) {
            player.isSuspended -= 1;
        }
        if (player.gpa < 2.5) {
            player.isSuspended = 1; // 1 game suspension
        }
        // GPA fluctuation
        player.gpa = Math.max(1.0, Math.min(4.0, player.gpa + (Math.random() * 0.2 - 0.1)));
        
        // Passive Progression
        applyPassiveProgression(player);
    }));
    return gameState;
};

export const applyWeeklyGodModeEffects = (gameState: GameState): GameState => {
    if (!gameState.godMode?.isEnabled || !gameState.myTeamId) return gameState;
    const { godMode, myTeamId, myPlayerId } = gameState;
    
    // Create a new state object to modify
    // FIX: Add type annotation to preserve type information after deep cloning with JSON.parse.
    let newState: GameState = JSON.parse(JSON.stringify(gameState));

    if (godMode.unlimitedFunds) newState.funds = 99999999;
    
    const myTeam = newState.teams.find(t => t.id === myTeamId);
    if(myTeam) {
        myTeam.roster.forEach(player => {
            if (godMode.perfectMorale) player.morale = 100;
            if (godMode.perfectAcademics) player.gpa = 4.0;
            if (godMode.unlimitedStamina) player.currentStamina = 100;
        });
        if (godMode.autoStart && myPlayerId) {
            const myPlayer = myTeam.roster.find(p => p.id === myPlayerId);
            if (myPlayer) {
                const oldStarter = myTeam.roster.find(p => p.position === myPlayer.position && p.stringer === 1);
                if (oldStarter && oldStarter.id !== myPlayer.id) {
                    oldStarter.stringer = myPlayer.stringer;
                }
                myPlayer.stringer = 1;
            }
        }
    }
    return newState;
};


export const initializeActiveGame = (gameState: GameState, game: Game): ActiveGameState => ({ quarter: 1, time: 12 * 60, down: 1, distance: 10, yardLine: 25, possession: Math.random() > 0.5 ? 'player' : 'opponent', playerScore: 0, opponentScore: 0, gameId: `${gameState.season}-${game.week}-${gameState.myTeamId}-${game.opponentId}`, opponentId: game.opponentId, playLog: ["Game started!"], isGameOver: false, momentum: 0 });

export const simulatePlay = (gameState: GameState, activeGame: ActiveGameState, play: OffensivePlay): { newActiveGame: ActiveGameState, outcome: PlayOutcome } => { const myTeam = gameState.teams.find(t => t.id === gameState.myTeamId)!; const opponentTeam = gameState.teams.find(t => t.id === activeGame.opponentId)!; const ovrDiff = myTeam.ovr - opponentTeam.ovr; let yards = 0; let description = ""; switch(play) { case 'Inside Run': yards = rand(-2, 8) + Math.floor(ovrDiff / 10); description = `Hand off up the middle for ${yards} yards.`; break; case 'Screen Pass': yards = rand(-5, 15) + Math.floor(ovrDiff / 8); description = `Quick screen pass nets ${yards} yards.`; break; case 'Hail Mary': yards = Math.random() > 0.7 ? rand(30, 60) : 0; description = yards > 0 ? `A deep bomb connects for ${yards} yards!` : `The long pass falls incomplete.`; break; default: yards = rand(-3, 12) + Math.floor(ovrDiff / 9); description = `A standard offensive play results in ${yards} yards.`; } const newYardLine = activeGame.yardLine + yards; if (newYardLine >= 100) { activeGame.playerScore += 7; activeGame.yardLine = 25; activeGame.down = 1; activeGame.distance = 10; activeGame.possession = 'opponent'; description += " TOUCHDOWN!"; } else { activeGame.yardLine = newYardLine; activeGame.down++; activeGame.distance -= yards; if (activeGame.distance <= 0) { activeGame.down = 1; activeGame.distance = 10; } } if (activeGame.down > 4) { activeGame.possession = 'opponent'; activeGame.yardLine = 100 - activeGame.yardLine; activeGame.down = 1; activeGame.distance = 10; description += " Turnover on downs!"; } if (activeGame.possession === 'opponent') { if (Math.random() > 0.3) { activeGame.opponentScore += 7; activeGame.playLog.push(`Opponent scores a touchdown.`); } else { activeGame.playLog.push(`Opponent drive stalls.`); } activeGame.possession = 'player'; activeGame.yardLine = 25; activeGame.down = 1; activeGame.distance = 10; } activeGame.time -= rand(20, 40); if (activeGame.time <= 0) { activeGame.quarter++; activeGame.time = 12 * 60; } if (activeGame.quarter > 4) { activeGame.isGameOver = true; } activeGame.playLog.push(description); const outcome: PlayOutcome = { description, yards, isTurnover: false, isTouchdown: false, isComplete: true, statEvents: [], newMomentum: 0 }; return { newActiveGame: activeGame, outcome }; };

export const signRecruit = (gameState: GameState, recruitId: string): GameState => {
    const recruit = gameState.recruits.find(r => r.id === recruitId);
    if (!recruit || gameState.recruitingPoints < recruit.cost) {
        return gameState;
    }
    const newState = { ...gameState };
    newState.recruitingPoints -= recruit.cost;
    newState.signedRecruits.push(recruit);
    return newState;
};

export const acceptOffer = (gameState: GameState, offerDetails: InboxMessage['offerDetails']): GameState => {
    const newState: GameState = JSON.parse(JSON.stringify(gameState));
    if (!offerDetails) return gameState;

    if (offerDetails.type === 'COACH_OFFER') {
        newState.myTeamId = offerDetails.newTeamId;
    } else if (offerDetails.type === 'PLAYER_OFFER' && newState.gameMode === 'MY_CAREER') {
        const fromTeam = newState.teams.find((t: Team) => t.id === offerDetails.fromTeamId);
        const toTeam = newState.teams.find((t: Team) => t.id === offerDetails.newTeamId);
        
        if (!fromTeam || !toTeam) return gameState; // Guard against missing teams

        const playerIndex = fromTeam.roster.findIndex((p: Player) => p.id === newState.myPlayerId);
        
        if (playerIndex > -1) {
            const [player] = fromTeam.roster.splice(playerIndex, 1);
            toTeam.roster.push(player);
            newState.myTeamId = toTeam.id;
            updateDepthChartsForTeam(fromTeam);
            updateDepthChartsForTeam(toTeam);
            fromTeam.ovr = calculateTeamOvr(fromTeam.roster);
            toTeam.ovr = calculateTeamOvr(toTeam.roster);
        }
    }
    return newState;
};

const generateCollegeOffers = (player: Player, trophies: Trophy[]): CollegeOffer[] => {
    const offers: CollegeOffer[] = [];
    const careerScore = player.attributes.OVR + (player.careerStats.passTDs + player.careerStats.rushTDs + player.careerStats.recTDs) * 0.5 + trophies.length * 5;

    if (careerScore > 120) offers.push({ collegeName: 'Alabama', division: 'D1-FBS', prestige: 99 });
    if (careerScore > 115) offers.push({ collegeName: 'Ohio State', division: 'D1-FBS', prestige: 98 });
    if (careerScore > 110) offers.push({ collegeName: 'West Virginia', division: 'D1-FBS', prestige: 85 });
    if (careerScore > 100) offers.push({ collegeName: 'Marshall', division: 'D1-FBS', prestige: 80 });
    if (careerScore > 90) offers.push({ collegeName: 'James Madison', division: 'D1-FCS', prestige: 75 });
    if (careerScore > 80) offers.push({ collegeName: 'Shepherd', division: 'D2', prestige: 70 });
    
    return offers.slice(0, 5);
}

export const endMyCareer = (gameState: GameState): GameState => {
    const myTeam = gameState.teams.find(t => t.id === gameState.myTeamId);
    if (!myTeam) return gameState;
    const myPlayer = myTeam.roster.find(p => p.id === gameState.myPlayerId);
    if (!myPlayer) return gameState;
    
    const offers = generateCollegeOffers(myPlayer, gameState.trophyCase.filter(t => t.playerId === myPlayer.id));
    gameState.collegeOffers = offers;
    
    return gameState;
};

export const applySponsor = (gameState: GameState, sponsor: Sponsor): GameState => {
    if (gameState.activeSponsor) return gameState;
    const newState: GameState = JSON.parse(JSON.stringify(gameState));
    newState.activeSponsor = sponsor;
    newState.funds += sponsor.signingBonus;
    return newState;
};

export const upgradeFacility = (gameState: GameState, facility: keyof GameState['facilities']): GameState => {
    const currentFacility = gameState.facilities[facility];
    if (gameState.funds < currentFacility.cost || currentFacility.level >= 5) return gameState;
    
    const newState: GameState = JSON.parse(JSON.stringify(gameState));
    newState.funds -= currentFacility.cost;
    newState.facilities[facility].level++;
    newState.facilities[facility].cost = Math.floor(currentFacility.cost * 1.75);
    
    const myTeam = newState.teams.find((t:Team) => t.id === newState.myTeamId);
    if (!myTeam) return gameState;
    
    const totalLevel = Object.values(newState.facilities).reduce((sum, f) => sum + f.level, 0);
    
    if (myTeam.class === 'A' && totalLevel >= 8) myTeam.class = 'AA';
    else if (myTeam.class === 'AA' && totalLevel >= 12) myTeam.class = 'AAA';
    
    return newState;
};

export const updateDepthChart = (gameState: GameState, position: Position, playerId: string, direction: 'UP' | 'DOWN'): GameState => {
    const myTeam = gameState.teams.find(t => t.id === gameState.myTeamId);
    if (!myTeam) return gameState;

    const playersInPos = myTeam.roster.filter(p => p.position === position).sort((a,b) => a.stringer - b.stringer);
    
    const playerIndex = playersInPos.findIndex(p => p.id === playerId);
    if (playerIndex === -1) return gameState;

    const swapIndex = direction === 'UP' ? playerIndex - 1 : playerIndex + 1;
    if (swapIndex < 0 || swapIndex >= playersInPos.length) return gameState;
    
    const player1 = playersInPos[playerIndex];
    const player2 = playersInPos[swapIndex];

    [player1.stringer, player2.stringer] = [player2.stringer, player1.stringer];
    
    return gameState;
};

// --- GOD MODE SPECIFIC FUNCTIONS ---

export const editPlayerAttributes = (gameState: GameState, playerId: string, newAttributes: Player['attributes']): GameState => {
    const myTeam = gameState.teams.find(t => t.id === gameState.myTeamId);
    if (!myTeam) return gameState;

    const player = myTeam.roster.find(p => p.id === playerId);
    if (player) {
        player.attributes = { ...newAttributes };
        player.attributes.OVR = calculatePlayerOvr(player.attributes);
        updateDepthChartsForTeam(myTeam);
        myTeam.ovr = calculateTeamOvr(myTeam.roster);
    }
    return gameState;
};

export const maxOutMyTeam = (gameState: GameState): GameState => {
    const myTeam = gameState.teams.find(t => t.id === gameState.myTeamId);
    if (!myTeam) return gameState;

    myTeam.roster.forEach(p => {
        Object.keys(p.attributes).forEach(key => {
            if (key !== 'OVR') p.attributes[key as keyof Omit<Player['attributes'], 'OVR'>] = 99
        });
        p.attributes.OVR = calculatePlayerOvr(p.attributes);
    });
    myTeam.ovr = calculateTeamOvr(myTeam.roster);
    updateDepthChartsForTeam(myTeam);
    return gameState;
};

export const transferPlayer = (gameState: GameState, newTeamId: number): GameState => {
    if (gameState.gameMode !== 'MY_CAREER') return gameState;
    const fromTeam = gameState.teams.find(t => t.id === gameState.myTeamId);
    const toTeam = gameState.teams.find(t => t.id === newTeamId);
    if (!fromTeam || !toTeam) return gameState;

    const playerIndex = fromTeam.roster.findIndex(p => p.id === gameState.myPlayerId);

    if (playerIndex > -1) {
        const [player] = fromTeam.roster.splice(playerIndex, 1);
        toTeam.roster.push(player);
        gameState.myTeamId = toTeam.id;

        updateDepthChartsForTeam(fromTeam);
        updateDepthChartsForTeam(toTeam);
        fromTeam.ovr = calculateTeamOvr(fromTeam.roster);
        toTeam.ovr = calculateTeamOvr(toTeam.roster);
    }
    return gameState;
};

export const applyImmediateGodModeEffects = (gameState: GameState, setting: keyof GodModeState): GameState => {
    // This function applies effects that should happen the moment a toggle is switched ON.
    if (!gameState.godMode?.isEnabled || !gameState.godMode[setting]) return gameState;

    const newState: GameState = JSON.parse(JSON.stringify(gameState));
    const myTeam = newState.teams.find((t: Team) => t.id === newState.myTeamId);

    switch(setting) {
        case 'unlimitedFunds':
            newState.funds = 99999999;
            break;
        case 'maxFacilities':
            Object.values(newState.facilities).forEach(f => {
                f.level = 5;
            });
            break;
        case 'maxCoaching':
            newState.coach.points = 999;
            Object.values(newState.coach.skillTree).forEach(s => s.level = s.maxLevel);
            break;
        case 'infiniteSkillPoints':
            if (myTeam && newState.myPlayerId) {
                const myPlayer = myTeam.roster.find((p: Player) => p.id === newState.myPlayerId);
                if (myPlayer) myPlayer.skillPoints = 99;
            }
            break;
    }
    return newState;
}


// --- CENTRALIZED WEEK ADVANCEMENT LOGIC ---

export const advanceWeek = async (gameState: GameState): Promise<GameState> => {
    let newState = { ...gameState };

    // 1. Pre-advance effects
    newState = applyWeeklyGodModeEffects(newState);

    // 2. Simulate current week's games
    if (newState.week <= 10) { // Regular Season
        newState = await simulateOtherGames(newState);
    } else if (newState.week >= 11 && newState.week <= 13) { // Class Playoffs
        newState = await simulatePlayoffRound(newState);
    } else if (newState.week >= 14 && newState.week <= 15) { // Tournament of Champions
        newState = await simulateTocRound(newState);
    }

    // 3. Advance week counter
    newState.week++;

    // 4. Handle transitions between season phases
    if (newState.week === 11 && !newState.playoffBracket) {
        newState = startPlayoffs(newState);
    } else if (newState.week === 14 && !newState.tocBracket) {
        newState = startTournamentOfChampions(newState);
    } else if (newState.week === 16 && !newState.isOffseason) {
        newState = processOffseason(newState);
    } else if (newState.week > 18) { // End of offseason, start new season
        newState = prepareNextSeason(newState);
    }

    // 5. Post-advance maintenance
    newState = applyWeeklySuspensionChecks(newState);
    newState.nationalRankings = updateRankings(newState.teams);

    return newState;
};
