

import { GoogleGenAI, Type } from '@google/genai';
import { Game, Player, Position, Team, GameState, GameStrategy, PlayerStats, Recruit, PlayoffMatchup, SeasonAwards, OffensivePlaybook, DefensivePlaybook, Trophy, ActiveGameState, OffensivePlay, PlayOutcome, StatEvent, TrainingProgram, Staff, Sponsor, InboxMessage, PlayerTrait } from '../types';
import { POWERHOUSE_TEAMS, OTHER_TEAM_NAMES, FIRST_NAMES, LAST_NAMES, MAX_SEASONS, STAFF_FIRST_NAMES, STAFF_LAST_NAMES } from '../constants';

let ai: GoogleGenAI | null = null;
if (process.env.API_KEY) {
    ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
}

// FIX: Export 'rand' to make it accessible in other modules.
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

const generateAttributes = (position: Position) => {
  const base = {
    Speed: rand(50, 99), Strength: rand(50, 99), Stamina: rand(60, 99),
    Tackle: rand(50, 99), Catch: rand(50, 99), Pass: rand(50, 99),
    Block: rand(50, 99), Consistency: rand(60, 99), Potential: rand(65, 99),
    OVR: 0,
  };
  // Positional adjustments
  switch (position) {
    case 'QB': base.Pass = rand(75, 99); base.Speed = rand(60, 85); break;
    case 'RB': base.Speed = rand(80, 99); base.Strength = rand(65, 90); break;
    case 'WR': case 'TE': base.Catch = rand(75, 99); base.Speed = rand(75, 99); break;
    case 'OL': base.Block = rand(80, 99); base.Strength = rand(85, 99); base.Speed = rand(50, 65); break;
    case 'DL': base.Tackle = rand(80, 99); base.Strength = rand(85, 99); base.Speed = rand(55, 75); break;
    case 'LB': base.Tackle = rand(80, 99); base.Speed = rand(65, 90); base.Strength = rand(75,95); break;
    case 'DB': base.Speed = rand(85, 99); base.Catch = rand(65, 90); base.Tackle = rand(60,85); break;
    case 'K/P': base.Strength = rand(65,95); base.Consistency = rand(80, 99); break;
  }
  base.OVR = Math.round(Object.values(base).reduce((a, b) => a + b, 0) / (Object.keys(base).length-1)); // Exclude OVR itself
  return base;
};

export const generatePlayer = (position: Position, year: Player['year']): Player => {
  const attributes = generateAttributes(position);
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
    isSuspended: false,
  };
};

export const generateRoster = (): Player[] => {
  const roster: Player[] = [];
  const years: Player['year'][] = ['FR', 'SO', 'JR', 'SR'];
  const rosterTemplate = { 'QB': 2, 'RB': 3, 'WR': 5, 'TE': 2, 'OL': 6, 'DL': 5, 'LB': 5, 'DB': 6, 'K/P': 1 };

  for (const [pos, count] of Object.entries(rosterTemplate)) {
    for (let i = 0; i < count; i++) {
      roster.push(generatePlayer(pos as Position, choice(years)));
    }
  }
  return roster;
};

export const generateStaff = (count: number): Staff[] => {
    const staff: Staff[] = [];
    const types: Staff['type'][] = ['OC', 'DC', 'Trainer', 'Doctor'];
    const offensivePlaybooks: OffensivePlaybook[] = ['Balanced', 'Spread', 'Pro-Style', 'Run Heavy', 'Air Raid'];
    const defensivePlaybooks: DefensivePlaybook[] = ['4-3 Defense', '3-4 Defense', 'Nickel', 'Aggressive'];

    for(let i=0; i<count; i++) {
        const type = choice(types);
        const rating = rand(50, 95);
        let scheme: OffensivePlaybook | DefensivePlaybook | undefined = undefined;
        if (type === 'OC') scheme = choice(offensivePlaybooks);
        if (type === 'DC') scheme = choice(defensivePlaybooks);

        staff.push({
            id: crypto.randomUUID(),
            name: generateStaffName(),
            type,
            rating,
            salary: 10000 + (rating - 50) * 1000,
            scheme,
        });
    }
    return staff;
}

export const generateSponsors = (fanHappiness: number, season: number): Sponsor[] => {
    const sponsors: Sponsor[] = [];
    const numOffers = rand(2, 4);
    for(let i=0; i<numOffers; i++) {
        const type = fanHappiness > 80 ? 'National' : fanHappiness > 60 ? 'Regional' : 'Local';
        const basePayout = type === 'National' ? 20000 : type === 'Regional' ? 10000 : 5000;
        sponsors.push({
            id: crypto.randomUUID(),
            name: `${type} Sponsor #${i+1}`,
            type,
            payoutPerWin: basePayout + rand(-2000, 2000),
            signingBonus: basePayout * rand(3,5),
            duration: rand(1,3),
        });
    }
    return sponsors;
};


export const calculateTeamOVR = (roster: Player[]): number => {
    if (roster.length === 0) return 30;
    const sortedRoster = [...roster].filter(p => p.isInjured === 0 && !p.isSuspended).sort((a, b) => b.attributes.OVR - a.attributes.OVR);
    const topPlayers = sortedRoster.slice(0, 22);
    if (topPlayers.length === 0) return 30;
    const totalOVR = topPlayers.reduce((sum, p) => sum + p.attributes.OVR * (p.currentStamina / 110 + 0.1), 0); // Stamina affects OVR
    return Math.round(totalOVR / topPlayers.length);
};

export const initializeGameWorld = (): Omit<GameState, 'myTeamId'> => {
  const teams: Team[] = [];
  POWERHOUSE_TEAMS.forEach(teamData => {
    const roster = generateRoster();
    teams.push({ ...teamData, roster, ovr: calculateTeamOVR(roster), record: { wins: 0, losses: 0 }, confRecord: { wins: 0, losses: 0 } });
  });
  OTHER_TEAM_NAMES.slice(0, 80).forEach((name, i) => {
    const roster = generateRoster();
    teams.push({ id: 21 + i, name, roster, ovr: calculateTeamOVR(roster), record: { wins: 0, losses: 0 }, confRecord: { wins: 0, losses: 0 } });
  });
  
  // Assign rivals
  const teamIds = teams.map(t => t.id);
  const availableRivals = new Set(teamIds);
  teams.forEach(team => {
      if (!team.rivalId) {
          availableRivals.delete(team.id);
          const potentialRivals = Array.from(availableRivals);
          if (potentialRivals.length > 0) {
              const rivalId = choice(potentialRivals);
              const rival = teams.find(t => t.id === rivalId)!;
              team.rivalId = rival.id;
              rival.rivalId = team.id;
              availableRivals.delete(rival.id);
          }
      }
  });


  // FIX: Removed `myTeamId` from the returned object to match the `Omit<GameState, 'myTeamId'>` return type, resolving a type error.
  return {
    teams,
    season: 1, week: 1,
    schedule: generateAllSchedules(teams),
    funds: 50000,
    facilities: { coaching: { level: 1, cost: 10000 }, training: { level: 1, cost: 10000 }, rehab: { level: 1, cost: 10000 }, tutoring: { level: 1, cost: 15000 }},
    nationalRankings: updateRankings(teams),
    playoffBracket: null, lastGameResult: null, gameLog: [], recruits: [], isOffseason: false,
    seasonAwards: { mvp: null, allAmerican: [], bestQB: null, bestRB: null, bestWR: null, bestTE: null, bestOL: null, bestDL: null, bestLB: null, bestDB: null, bestKP: null },
    fanHappiness: 75,
    activeSponsor: null,
    availableSponsors: generateSponsors(75, 1),
    inbox: [],
    staff: [],
    staffMarket: generateStaff(10),
    myStrategy: { offense: 'Balanced', defense: '4-3 Defense' },
    trophyCase: [],
    recruitingPoints: 0,
    activeGame: null,
    forceWinNextGame: false,
  };
};

export const generateAllSchedules = (teams: Team[]): Record<number, Game[]> => {
    const schedules: Record<number, Game[]> = {};
    const teamIds = teams.map(t => t.id);
    const weathers: Game['weather'][] = ['Sunny', 'Sunny', 'Sunny', 'Rainy', 'Snowy'];

    for (const teamId of teamIds) {
        schedules[teamId] = [];
    }

    const matchupsMade = new Set<string>();

    for (let week = 1; week <= 10; week++) {
        const teamsToSchedule = shuffle([...teamIds]);
        const scheduledThisWeek = new Set<number>();

        for (const teamId of teamsToSchedule) {
            if (scheduledThisWeek.has(teamId)) continue;

            let opponentId: number | undefined = undefined;

            if (week >= 8) {
                const team = teams.find(t => t.id === teamId)!;
                const rivalId = team.rivalId;
                if (rivalId) {
                    const matchupKey = [teamId, rivalId].sort((a, b) => a - b).join('-');
                    if (!scheduledThisWeek.has(rivalId) && !matchupsMade.has(matchupKey)) {
                        opponentId = rivalId;
                    }
                }
            }
            
            if (!opponentId) {
                for (const potentialOpponentId of teamsToSchedule) {
                    if (teamId === potentialOpponentId || scheduledThisWeek.has(potentialOpponentId)) continue;
                    const matchupKey = [teamId, potentialOpponentId].sort((a, b) => a - b).join('-');
                    if (!matchupsMade.has(matchupKey)) {
                        opponentId = potentialOpponentId;
                        break;
                    }
                }
            }

            if (!opponentId) {
                for (const potentialOpponentId of teamsToSchedule) {
                    if (teamId !== potentialOpponentId && !scheduledThisWeek.has(potentialOpponentId)) {
                        opponentId = potentialOpponentId;
                        break;
                    }
                }
            }

            if (opponentId) {
                scheduledThisWeek.add(teamId);
                scheduledThisWeek.add(opponentId);

                const matchupKey = [teamId, opponentId].sort((a, b) => a - b).join('-');
                matchupsMade.add(matchupKey);

                const team = teams.find(t => t.id === teamId)!;
                const isRivalryGame = team.rivalId === opponentId;
                const isHome = Math.random() > 0.5;

                schedules[teamId].push({ week, opponentId, isHome, weather: choice(weathers), isRivalryGame });
                schedules[opponentId].push({ week, opponentId: teamId, isHome: !isHome, weather: choice(weathers), isRivalryGame });
            }
        }
    }

    for (const teamId in schedules) {
        schedules[teamId].sort((a, b) => a.week - b.week);
    }

    return schedules;
};

const getTeamPositionalOVR = (roster: Player[], position: Position, count: number) => {
    const players = roster.filter(p => p.position === position).sort((a, b) => b.attributes.OVR - a.attributes.OVR);
    const topPlayers = players.slice(0, count);
    if (topPlayers.length === 0) return 40;
    return topPlayers.reduce((sum, p) => sum + p.attributes.OVR, 0) / topPlayers.length;
};

const generateGameStatsForTeam = (team: Team, opponentOVR: number, didWin: boolean): Record<string, Partial<PlayerStats>> => {
    const stats: Record<string, Partial<PlayerStats>> = {};
    const baseTDs = didWin ? rand(3, 6) : rand(1, 4);

    const qb = team.roster.filter(p => p.position === 'QB').sort((a, b) => b.attributes.OVR - a.attributes.OVR)[0];
    if (qb) {
        stats[qb.id] = {
            passYds: rand(150, 400),
            passTDs: rand(Math.floor(baseTDs * 0.5), baseTDs),
        };
    }

    const runningBacks = team.roster.filter(p => p.position === 'RB').sort((a, b) => b.attributes.OVR - a.attributes.OVR);
    if (runningBacks[0]) {
        stats[runningBacks[0].id] = {
            rushYds: rand(50, 150),
            rushTDs: rand(0, Math.floor(baseTDs * 0.5)),
        };
    }
    // ... more detailed stat generation
    return stats;
};

export const simulateGame = async (
    myTeam: Team, 
    opponentTeam: Team, 
    myStrategy: GameStrategy,
    opponentStrategy: GameStrategy,
    myFacilities: GameState['facilities'],
    opponentFacilities: { level: number; cost: number },
    weather: 'Sunny' | 'Rainy' | 'Snowy',
    forceWin: boolean,
    myStaff: Staff[]
): Promise<NonNullable<Game['result']>> => {
    
    const myOVR = calculateTeamOVR(myTeam.roster);
    const opponentOVR = calculateTeamOVR(opponentTeam.roster);
    
    const ovrDiff = myOVR - opponentOVR;
    const homeAdvantage = 5; // Simple home advantage
    const facilityAdvantage = (myFacilities.coaching.level - opponentFacilities.level) * 2;
    
    const oc = myStaff.find(s => s.type === 'OC');
    const dc = myStaff.find(s => s.type === 'DC');
    const ocSchemeBonus = (oc && oc.scheme === myStrategy.offense) ? 3 : 0;
    const dcSchemeBonus = (dc && dc.scheme === myStrategy.defense) ? 3 : 0;
    const captainBonus = myTeam.roster.some(p => p.traits.includes('Team Captain')) ? 2 : 0;

    let myScore = rand(0, 3) * 7;
    let opponentScore = rand(0, 3) * 7;

    const advantage = ovrDiff + homeAdvantage + facilityAdvantage + ocSchemeBonus + dcSchemeBonus + captainBonus;

    for (let i = 0; i < 7; i++) { // Simulate ~7 possessions
        if (rand(1, 100) + advantage > 50) {
            myScore += choice([3, 7, 7, 7]);
        }
        if (rand(1, 100) - advantage > 50) {
            opponentScore += choice([3, 7, 7, 7]);
        }
    }
    
    if (forceWin && myScore <= opponentScore) {
        myScore = opponentScore + rand(1, 14);
    }
    
    const didWin = myScore > opponentScore;
    const summary = `${myTeam.name} ${didWin ? 'defeated' : 'lost to'} ${opponentTeam.name}, ${myScore}-${opponentScore}.`;

    const result: NonNullable<Game['result']> = {
        opponentId: opponentTeam.id,
        myScore,
        opponentScore,
        summary,
        playerStats: {
            myTeam: generateGameStatsForTeam(myTeam, opponentOVR, didWin),
            opponentTeam: generateGameStatsForTeam(opponentTeam, myOVR, !didWin),
        },
    };

    if (ai) {
        try {
            const prompt = `Generate a short, retro-style newspaper headline and a one-paragraph game summary for a high school football game.
            
My Team: ${myTeam.name}
Opponent: ${opponentTeam.name}
My Score: ${myScore}
Opponent Score: ${opponentScore}
Key Info: ${summary}

Respond in JSON format with two keys: "headline" and "newspaperSummary". The headline should be catchy and under 10 words. The summary should be around 50-70 words.`;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: {
                    responseMimeType: 'application/json',
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            headline: { type: Type.STRING },
                            newspaperSummary: { type: Type.STRING },
                        },
                        required: ['headline', 'newspaperSummary'],
                    },
                },
            });

            const text = response.text.trim();
            const generatedContent = JSON.parse(text);
            result.headline = generatedContent.headline;
            result.newspaperSummary = generatedContent.newspaperSummary;
        } catch (error) {
            console.error("Error generating newspaper summary:", error);
            result.headline = didWin ? `${myTeam.name} Triumphs!` : `${opponentTeam.name} Secures Victory.`;
            result.newspaperSummary = summary;
        }
    } else {
        result.headline = didWin ? `${myTeam.name} Triumphs!` : `${opponentTeam.name} Secures Victory.`;
        result.newspaperSummary = summary;
    }


    return result;
};


export const applyGameResults = (gameState: GameState, myTeam: Team, opponent: Team, result: NonNullable<Game['result']>) => {
    const myTeamInState = gameState.teams.find(t => t.id === myTeam.id)!;
    const opponentInState = gameState.teams.find(t => t.id === opponent.id)!;

    if (result.myScore > result.opponentScore) {
        myTeamInState.record.wins++;
        opponentInState.record.losses++;
    } else {
        myTeamInState.record.losses++;
        opponentInState.record.wins++;
    }

    // Update player stats and stamina
    [
        { team: myTeamInState, stats: result.playerStats.myTeam },
        { team: opponentInState, stats: result.playerStats.opponentTeam }
    ].forEach(({ team, stats }) => {
        team.roster.forEach(player => {
            player.currentStamina = Math.max(0, player.currentStamina - rand(15, 30));
             if (rand(1, 100) <= (player.traits.includes('Injury Prone') ? 8 : 2)) {
                player.isInjured = rand(1, 4);
            }

            const gameStats = stats[player.id];
            if (gameStats) {
                player.seasonStats.gamesPlayed++;
                player.careerStats.gamesPlayed++;
                for (const [stat, value] of Object.entries(gameStats)) {
                    (player.seasonStats[stat as keyof PlayerStats] as number) += value;
                    (player.careerStats[stat as keyof PlayerStats] as number) += value;
                }
            }
        });
    });

    // Update OVR based on new stamina
    myTeamInState.ovr = calculateTeamOVR(myTeamInState.roster);
    opponentInState.ovr = calculateTeamOVR(opponentInState.roster);

    // Update schedule with result
    const myGame = gameState.schedule[myTeam.id].find(g => g.week === gameState.week && g.opponentId === opponent.id);
    if (myGame) myGame.result = result;

    const opponentGame = gameState.schedule[opponent.id].find(g => g.week === gameState.week && g.opponentId === myTeam.id);
    if (opponentGame) {
         opponentGame.result = {
            ...result,
            myScore: result.opponentScore,
            opponentScore: result.myScore,
            playerStats: {
                myTeam: result.playerStats.opponentTeam,
                opponentTeam: result.playerStats.myTeam
            }
        };
    }
    
    if (myTeam.id === gameState.myTeamId) {
        gameState.lastGameResult = result;
        if(result.myScore > result.opponentScore && gameState.activeSponsor) {
            gameState.funds += gameState.activeSponsor.payoutPerWin;
        }
    }
};

export const simulateOtherGames = async (gameState: GameState): Promise<GameState> => {
    const teamsToSim = gameState.teams.filter(t => {
        const scheduleEntry = gameState.schedule[t.id].find(g => g.week === gameState.week);
        return scheduleEntry && !scheduleEntry.result;
    });

    const simulatedPairs = new Set<string>();

    for (const team of teamsToSim) {
        const game = gameState.schedule[team.id].find(g => g.week === gameState.week)!;
        const pairKey = [team.id, game.opponentId].sort().join('-');
        if (simulatedPairs.has(pairKey)) continue;

        const opponent = gameState.teams.find(t => t.id === game.opponentId)!;
        // Simplified simulation for non-player games, no AI call to save time/API quota
        const myOVR = calculateTeamOVR(team.roster);
        const oppOVR = calculateTeamOVR(opponent.roster);
        const score1 = Math.round(myOVR / 3) + rand(0, 14);
        const score2 = Math.round(oppOVR / 3) + rand(0, 14);

        const result: NonNullable<Game['result']> = {
            opponentId: opponent.id,
            myScore: score1,
            opponentScore: score2,
            summary: `Final score ${score1}-${score2}`,
            playerStats: { myTeam: {}, opponentTeam: {} }
        };
        
        applyGameResults(gameState, team, opponent, result);
        simulatedPairs.add(pairKey);
    }
    return gameState;
};

export const updateRankings = (teams: Team[]): { teamId: number; rank: number }[] => {
    const sortedTeams = [...teams].sort((a, b) => {
        if (a.record.wins !== b.record.wins) return b.record.wins - a.record.wins;
        if (a.record.losses !== b.record.losses) return a.record.losses - b.record.losses;
        return b.ovr - a.ovr;
    });
    return sortedTeams.map((team, i) => ({ teamId: team.id, rank: i + 1 }));
};

export const getNationalLeaders = (teams: Team[]): Record<string, Player[]> => {
    const allPlayers = teams.flatMap(t => t.roster);
    const leaders: Record<string, Player[]> = {
        passYds: [...allPlayers].sort((a, b) => b.seasonStats.passYds - a.seasonStats.passYds).slice(0, 5),
        rushYds: [...allPlayers].sort((a, b) => b.seasonStats.rushYds - a.seasonStats.rushYds).slice(0, 5),
        recYds: [...allPlayers].sort((a, b) => b.seasonStats.recYds - a.seasonStats.recYds).slice(0, 5),
        tackles: [...allPlayers].sort((a, b) => b.seasonStats.tackles - a.seasonStats.tackles).slice(0, 5),
        sacks: [...allPlayers].sort((a, b) => b.seasonStats.sacks - a.seasonStats.sacks).slice(0, 5),
        ints: [...allPlayers].sort((a, b) => b.seasonStats.ints - a.seasonStats.ints).slice(0, 5),
    };
    return leaders;
};

export const findNextOpponentId = (gameState: GameState): number | null => {
    if (!gameState.myTeamId || gameState.isOffseason) return null;
    const mySchedule = gameState.schedule[gameState.myTeamId];
    const nextGame = mySchedule.find(g => g.week === gameState.week);
    return nextGame ? nextGame.opponentId : null;
};

export const startOffseason = (gameState: GameState): GameState => {
    gameState.isOffseason = true;
    gameState.week = 1; // Reset for next season, but isOffseason flag controls screen
    
    // Calculate and store awards
    gameState.seasonAwards = calculateSeasonAwards(gameState.teams);
    
    // Add awards to trophy case
    const myTeamPlayers = gameState.teams.find(t => t.id === gameState.myTeamId)?.roster || [];
    if(gameState.seasonAwards.mvp && myTeamPlayers.some(p => p.id === gameState.seasonAwards.mvp?.id)) {
        gameState.trophyCase.push({ season: gameState.season, award: 'MVP Award', playerName: gameState.seasonAwards.mvp.name, playerId: gameState.seasonAwards.mvp.id });
    }
    // Add more trophy logic for other awards if needed

    // Generate new recruits
    gameState.recruits = Array.from({ length: 30 }, () => generateRecruit());
    gameState.recruitingPoints = rand(50, 80) + Math.floor(gameState.teams.find(t => t.id === gameState.myTeamId)!.record.wins * 5);
    
    return gameState;
};

export const advanceToNextSeason = (gameState: GameState, signedRecruits: Recruit[]): GameState => {
    gameState.isOffseason = false;
    gameState.season++;

    if (gameState.season > MAX_SEASONS) {
        // Game Over logic can be handled in the component
        return gameState;
    }

    // Graduate seniors and update years for all players
    gameState.teams.forEach(team => {
        team.roster = team.roster.filter(p => p.year !== 'SR');
        team.roster.forEach(p => {
            if (p.year === 'JR') p.year = 'SR';
            else if (p.year === 'SO') p.year = 'JR';
            else if (p.year === 'FR') p.year = 'SO';
            // Player progression
            Object.keys(p.attributes).forEach(key => {
                const attr = key as keyof Player['attributes'];
                if (attr !== 'OVR' && attr !== 'Potential') {
                    const gain = Math.floor(rand(0, 100) < p.attributes.Potential ? rand(1, 4) : rand(0, 1));
                    (p.attributes[attr] as number) = Math.min(99, p.attributes[attr] + gain);
                }
            });
             p.seasonStats = initialStats(); // Reset season stats
        });
    });
    
    // Add signed recruits to myTeam
    const myTeam = gameState.teams.find(t => t.id === gameState.myTeamId)!;
    signedRecruits.forEach(recruit => {
        myTeam.roster.push({
            ...recruit,
            year: 'FR',
            seasonStats: initialStats(),
            careerStats: initialStats(),
            isInjured: 0,
            morale: rand(60, 85),
            currentStamina: 100,
            isSuspended: false,
        });
    });

    // Fill roster gaps for all teams
    gameState.teams.forEach(team => {
        const rosterTemplate = { 'QB': 2, 'RB': 3, 'WR': 5, 'TE': 2, 'OL': 6, 'DL': 5, 'LB': 5, 'DB': 6, 'K/P': 1 };
        for (const [pos, count] of Object.entries(rosterTemplate)) {
            const currentCount = team.roster.filter(p => p.position === pos).length;
            for (let i = 0; i < count - currentCount; i++) {
                team.roster.push(generatePlayer(pos as Position, 'FR'));
            }
        }
        team.record = { wins: 0, losses: 0 };
        team.ovr = calculateTeamOVR(team.roster);
    });

    // Generate new schedule and reset state
    gameState.schedule = generateAllSchedules(gameState.teams);
    gameState.nationalRankings = updateRankings(gameState.teams);
    gameState.playoffBracket = null;
    gameState.lastGameResult = null;
    gameState.gameLog = [];
    
    // New staff and sponsors
    if (gameState.activeSponsor) {
        gameState.activeSponsor.duration--;
        if (gameState.activeSponsor.duration <= 0) {
            gameState.activeSponsor = null;
        }
    }
    if(!gameState.activeSponsor) {
        gameState.availableSponsors = generateSponsors(gameState.fanHappiness, gameState.season);
    }
    gameState.staffMarket = generateStaff(10);


    return gameState;
};

const generateRecruit = (): Recruit => {
    const positions: Position[] = ['QB', 'RB', 'WR', 'TE', 'OL', 'DL', 'LB', 'DB', 'K/P'];
    const position = choice(positions);
    const attributes = generateAttributes(position);
    const traits: PlayerTrait[] = [];
    if (rand(1, 100) <= 10) traits.push('Clutch');
    if (rand(1, 100) <= 10) traits.push('Injury Prone');
    if (rand(1, 100) <= 5) traits.push('Team Captain');
    if (position === 'RB' && rand(1, 100) <= 15) traits.push('Workhorse');

    return {
        id: crypto.randomUUID(),
        name: generateName(),
        position,
        attributes,
        cost: Math.floor(attributes.OVR / 10) + rand(1, 5),
        traits,
        gpa: rand(22, 38) / 10,
    };
};

export const calculateSeasonAwards = (teams: Team[]): SeasonAwards => {
    const allPlayers = teams.flatMap(t => t.roster);
    const awards: SeasonAwards = {
        mvp: null, allAmerican: [], bestQB: null, bestRB: null, bestWR: null,
        bestTE: null, bestOL: null, bestDL: null, bestLB: null, bestDB: null, bestKP: null
    };

    if (allPlayers.length === 0) return awards;

    const getBest = (pos: Position) => {
        return allPlayers.filter(p => p.position === pos).sort((a,b) => b.attributes.OVR - a.attributes.OVR)[0] || null;
    };
    
    awards.bestQB = getBest('QB');
    awards.bestRB = getBest('RB');
    awards.bestWR = getBest('WR');
    // ... calculate others similarly

    // MVP is more complex, could be based on a mix of OVR, stats, and team success
    awards.mvp = [...allPlayers].sort((a, b) => (b.attributes.OVR * 2 + b.seasonStats.passTDs * 5 + b.seasonStats.rushTDs * 5) - (a.attributes.OVR * 2 + a.seasonStats.passTDs * 5 + a.seasonStats.rushTDs * 5))[0];
    
    return awards;
};

export const generateScoutingReport = (team: Team): { strengths: string[], weaknesses: string[], keyPlayers: Player[] } => {
    const qbOvr = getTeamPositionalOVR(team.roster, 'QB', 1);
    const rbOvr = getTeamPositionalOVR(team.roster, 'RB', 1);
    const wrOvr = getTeamPositionalOVR(team.roster, 'WR', 2);
    const olOvr = getTeamPositionalOVR(team.roster, 'OL', 5);
    const dlOvr = getTeamPositionalOVR(team.roster, 'DL', 4);
    const lbOvr = getTeamPositionalOVR(team.roster, 'LB', 3);
    const dbOvr = getTeamPositionalOVR(team.roster, 'DB', 4);

    const strengths: string[] = [];
    const weaknesses: string[] = [];

    if (qbOvr > 85) strengths.push("Elite QB with a strong arm.");
    if (qbOvr < 70) weaknesses.push("Inconsistent QB play.");
    if (olOvr > 85) strengths.push("Dominant offensive line.");
    if (olOvr < 70) weaknesses.push("Offensive line struggles with protection.");
    if (dbOvr > 85) strengths.push("Lockdown secondary.");
    if (dbOvr < 70) weaknesses.push("Vulnerable to deep passes.");

    const keyPlayers = [...team.roster].sort((a, b) => b.attributes.OVR - a.attributes.OVR).slice(0, 3);

    return { strengths, weaknesses, keyPlayers };
};

export const calculateAwardRaces = (teams: Team[]): Record<string, { player: Player; teamName: string; }[]> => {
    // FIX: Corrected logic to properly map players to their team names, resolving a type error comparing player string ID to team number ID.
    const allPlayers = teams.flatMap(t =>
        t.roster.map(player => ({ player, teamName: t.name }))
    );

    if (allPlayers.length === 0) return {};

    const races: Record<string, {player: Player, teamName: string}[]> = {
        MVP: allPlayers.sort((a, b) => b.player.attributes.OVR - a.player.attributes.OVR).slice(0, 3),
        'Best QB': allPlayers.filter(p => p.player.position === 'QB').sort((a,b) => b.player.attributes.OVR - a.player.attributes.OVR).slice(0,3),
        'Best RB': allPlayers.filter(p => p.player.position === 'RB').sort((a,b) => b.player.attributes.OVR - a.player.attributes.OVR).slice(0,3),
        'Best WR': allPlayers.filter(p => p.player.position === 'WR').sort((a,b) => b.player.attributes.OVR - a.player.attributes.OVR).slice(0,3),
    };

    return races;
};

export const applyTrainingCampResults = (gameState: GameState, selections: Record<string, TrainingProgram>, signedRecruits: Recruit[]): { updatedState: GameState, cost: number } => {
    const programCosts: Record<TrainingProgram, number> = { 'NONE': 0, 'CONDITIONING': 5000, 'STRENGTH': 15000, 'AGILITY': 15000, 'PASSING': 25000, 'RECEIVING': 25000, 'TACKLING': 25000 };
    let totalCost = 0;
    const combinedRoster = [...gameState.teams.find(t => t.id === gameState.myTeamId)!.roster, ...signedRecruits];

    Object.entries(selections).forEach(([playerId, program]) => {
        if(program === 'NONE') return;
        
        const player = combinedRoster.find(p => p.id === playerId);
        if (player) {
            totalCost += programCosts[program];
            let primaryAttr: keyof Player['attributes'] | null = null;
            let secondaryAttr: keyof Player['attributes'] | null = null;

            switch(program) {
                case 'CONDITIONING': primaryAttr = 'Stamina'; secondaryAttr = 'Speed'; break;
                case 'STRENGTH': primaryAttr = 'Strength'; secondaryAttr = 'Block'; break;
                case 'AGILITY': primaryAttr = 'Speed'; secondaryAttr = 'Tackle'; break;
                case 'PASSING': primaryAttr = 'Pass'; secondaryAttr = 'Consistency'; break;
                case 'RECEIVING': primaryAttr = 'Catch'; secondaryAttr = 'Speed'; break;
                case 'TACKLING': primaryAttr = 'Tackle'; secondaryAttr = 'Strength'; break;
            }
            if(primaryAttr) (player.attributes[primaryAttr] as number) = Math.min(99, player.attributes[primaryAttr] + rand(1,3));
            if(secondaryAttr) (player.attributes[secondaryAttr] as number) = Math.min(99, player.attributes[secondaryAttr] + rand(0,2));
        }
    });
    
    gameState.funds -= totalCost;

    return { updatedState: gameState, cost: totalCost };
};

export const hireStaff = (gameState: GameState, staffId: string): GameState => {
    const staffToHire = gameState.staffMarket.find(s => s.id === staffId);
    if (!staffToHire || gameState.funds < staffToHire.salary) return gameState;
    
    // Fire existing staff of the same type
    const existingStaffIndex = gameState.staff.findIndex(s => s.type === staffToHire.type);
    if (existingStaffIndex !== -1) {
        gameState.staff.splice(existingStaffIndex, 1);
    }

    gameState.funds -= staffToHire.salary;
    gameState.staff.push(staffToHire);
    gameState.staffMarket = gameState.staffMarket.filter(s => s.id !== staffId);

    return gameState;
};

export const generateWeeklyInbox = (gameState: GameState): InboxMessage[] => {
    const messages: InboxMessage[] = [];
    const myTeam = gameState.teams.find(t => t.id === gameState.myTeamId)!;

    // Check for rival game next week
    const nextGame = gameState.schedule[myTeam.id].find(g => g.week === gameState.week);
    if (nextGame?.isRivalryGame) {
        messages.push({
            id: crypto.randomUUID(),
            season: gameState.season,
            week: gameState.week,
            from: "Fan Club President",
            subject: "IT'S HATE WEEK!",
            body: `Coach, this is the one we've all been waiting for. The game against ${gameState.teams.find(t=>t.id === nextGame.opponentId)!.name}.\n\nOur reputation is on the line. The whole school is counting on you. Go get 'em!`,
            read: false,
        });
    }

    return messages;
};

export const runWeeklyAcademicCheck = (gameState: GameState): { newState: GameState; messages: InboxMessage[] } => {
    const messages: InboxMessage[] = [];
    const myTeamFacilities = gameState.facilities;

    gameState.teams.forEach(team => {
        // Assume non-player teams have default facilities for simplicity
        const facilities = team.id === gameState.myTeamId ? myTeamFacilities : { tutoring: { level: 1 } };
        const tutoringBonus = (facilities.tutoring.level - 1) * 0.05;

        team.roster.forEach(player => {
            let gpaDelta = rand(-20, 15) / 100; // Drops are slightly more likely
            if (gpaDelta < 0) {
                gpaDelta *= (1 - tutoringBonus); // Tutoring reduces the drop
            }
            player.gpa = Math.max(0.0, Math.min(4.0, player.gpa + gpaDelta));

            if (player.gpa < 2.0 && !player.isSuspended) {
                player.isSuspended = true;
                if (team.id === gameState.myTeamId) {
                    messages.push({
                        id: crypto.randomUUID(), season: gameState.season, week: gameState.week, from: "Academic Advisor", subject: "Player Academically Ineligible",
                        body: `Coach,\n\nThis is to inform you that ${player.name} (${player.position}) has fallen below a 2.0 GPA and is now academically ineligible to play.\n\nHe will be suspended until his grades improve.`, read: false
                    });
                }
            } else if (player.gpa >= 2.2 && player.isSuspended) {
                player.isSuspended = false;
                 if (team.id === gameState.myTeamId) {
                    messages.push({
                        id: crypto.randomUUID(), season: gameState.season, week: gameState.week, from: "Academic Advisor", subject: "Player Regains Eligibility",
                        body: `Coach,\n\nGood news. ${player.name} (${player.position}) has improved his grades and is now academically eligible to play again, effective immediately.`, read: false
                    });
                }
            }
        });
    });

    return { newState: gameState, messages };
};


// --- REVAMPED PLAY-BY-PLAY SIMULATION LOGIC ---

// Determines the raw outcome of a single play.
const getPlayOutcome = (offenseTeam: Team, defenseTeam: Team, play: OffensivePlay, activeGame: ActiveGameState, staff: Staff[]): PlayOutcome => {
    const outcome: PlayOutcome = { description: '', yards: 0, isTurnover: false, isTouchdown: false, isComplete: true, statEvents: [], newMomentum: activeGame.momentum };
    // FIX: Property 'teamId' does not exist on type 'Staff'.
    const oc = staff.find(s => s.type === 'OC');
    const ocBonus = oc ? oc.rating / 20 : 0;

    const qb = offenseTeam.roster.filter(p => p.position === 'QB' && !p.isInjured && !p.isSuspended).sort((a, b) => b.attributes.OVR - a.attributes.OVR)[0];
    const rb = offenseTeam.roster.filter(p => p.position === 'RB' && !p.isInjured && !p.isSuspended).sort((a, b) => b.attributes.OVR - a.attributes.OVR)[0];

    if (!qb || !rb) {
        outcome.description = `${offenseTeam.name} is too injured to run a play.`;
        outcome.isTurnover = true;
        return outcome;
    }

    if (play.includes('Run')) {
        const workhorseBonus = rb.traits.includes('Workhorse') ? 2 : 0;
        const yards = rand(-2, 12) + Math.floor((rb.attributes.OVR - defenseTeam.ovr) / 5) + workhorseBonus;
        outcome.yards = yards;
        outcome.description = `${rb.name} runs for ${yards} yards.`;
    } else { // Pass play
        const clutchBonus = qb.traits.includes('Clutch') && activeGame.down >= 3 ? 10 : 0;
        const isComplete = rand(1, 100) < (qb.attributes.Pass + ocBonus + clutchBonus - (defenseTeam.ovr / 2));
        if (isComplete) {
            const yards = rand(5, 30);
            outcome.yards = yards;
            outcome.description = `${qb.name} passes to a receiver for ${yards} yards.`;
        } else {
            outcome.isComplete = false;
            outcome.yards = 0;
            outcome.description = `${qb.name}'s pass is incomplete.`;
        }
    }
    
    // Shared momentum logic
    if (outcome.yards > 25) outcome.newMomentum = Math.min(100, outcome.newMomentum + 25);
    else if (outcome.yards > 15) outcome.newMomentum = Math.min(100, outcome.newMomentum + 15);
    else if (outcome.yards < 0 || !outcome.isComplete) outcome.newMomentum = Math.max(-100, outcome.newMomentum - 10);
    
    // Universal turnover check
    if (rand(1, 100) <= 3) {
        outcome.isTurnover = true;
        outcome.description += " FUMBLE! Turnover!";
        outcome.newMomentum = Math.max(-100, outcome.newMomentum - 40);
    }
    
    return outcome;
};


export const determinePlayerPlayOutcome = (myTeam: Team, opponentTeam: Team, play: OffensivePlay, activeGame: ActiveGameState, staff: Staff[]): PlayOutcome => {
    return getPlayOutcome(myTeam, opponentTeam, play, activeGame, staff);
};

export const determineOpponentPlayOutcome = (myTeam: Team, opponentTeam: Team, activeGame: ActiveGameState): PlayOutcome => {
    // Simple AI for opponent play calling
    let play: OffensivePlay;
    if (activeGame.down >= 3 && activeGame.distance > 5) {
        play = choice(['Post', 'Slant', 'Play Action']);
    } else {
        play = choice(['Inside Run', 'Outside Run', 'Screen Pass']);
    }
    const outcome = getPlayOutcome(opponentTeam, myTeam, play, activeGame, []);
    
    // Invert momentum for opponent's perspective
    outcome.newMomentum = -outcome.newMomentum;
    
    return outcome;
};


// Pure function to calculate the next game state after a play
export const updateGameAfterPlay = (currentGame: ActiveGameState, outcome: PlayOutcome): ActiveGameState => {
    const game = { ...currentGame };

    game.playLog = [outcome.description, ...game.playLog];
    game.momentum = outcome.newMomentum;
    game.time -= rand(25, 40);

    const isOffensePlayer = game.possession === 'player';
    
    if (outcome.isTurnover) {
        game.possession = isOffensePlayer ? 'opponent' : 'player';
        game.yardLine = 100 - (game.yardLine + outcome.yards);
        game.down = 1;
        game.distance = 10;
        return game;
    }
    
    if (game.yardLine + outcome.yards >= 100) { // Touchdown
        if (isOffensePlayer) game.playerScore += 7;
        else game.opponentScore += 7;
        
        // FIX: Property 'description' does not exist on type 'ActiveGameState'.
        game.playLog[0] += " TOUCHDOWN!";
        game.momentum += (isOffensePlayer ? 30 : -30);
        game.possession = isOffensePlayer ? 'opponent' : 'player';
        game.yardLine = 25;
        game.down = 1;
        game.distance = 10;
        return game;
    }
    
    if (!outcome.isComplete) {
        game.down += 1;
    } else {
        game.yardLine += outcome.yards;
        game.distance -= outcome.yards;
        if (game.distance <= 0) {
            game.down = 1;
            game.distance = 10;
        } else {
            game.down += 1;
        }
    }
    
    if (game.down > 4) { // Turnover on downs
        game.possession = isOffensePlayer ? 'opponent' : 'player';
        game.yardLine = 100 - game.yardLine;
        game.down = 1;
        game.distance = 10;
        game.momentum += (isOffensePlayer ? -20 : 20);
    }
    
    game.momentum = Math.max(-100, Math.min(100, game.momentum));

    return game;
};

// Create a final game result object from a completed playable game
export const createResultFromActiveGame = (activeGame: ActiveGameState, myTeam: Team, opponentTeam: Team): NonNullable<Game['result']> => {
    const didWin = activeGame.playerScore > activeGame.opponentScore;
    const summary = `${myTeam.name} ${didWin ? 'defeated' : 'lost to'} ${opponentTeam.name}, ${activeGame.playerScore}-${activeGame.opponentScore}.`;
    
    // In a real scenario, you'd aggregate stats collected during the game. Here we generate them.
    return {
        opponentId: opponentTeam.id,
        myScore: activeGame.playerScore,
        opponentScore: activeGame.opponentScore,
        summary: summary,
        headline: didWin ? `${myTeam.name.split(' ').pop()} Victorious!` : `${opponentTeam.name.split(' ').pop()} Prevail!`,
        newspaperSummary: summary,
        playerStats: {
            myTeam: generateGameStatsForTeam(myTeam, opponentTeam.ovr, didWin),
            opponentTeam: generateGameStatsForTeam(opponentTeam, myTeam.ovr, !didWin),
        }
    };
};

export const endPlayableGame = async (gameState: GameState): Promise<GameState> => {
    if (!gameState.activeGame) return gameState;
    
    let updatedState = JSON.parse(JSON.stringify(gameState));
    const myTeam = updatedState.teams.find((t: Team) => t.id === updatedState.myTeamId)!;
    const opponent = updatedState.teams.find((t: Team) => t.id === updatedState.activeGame.opponentId)!;
    
    const gameResult = createResultFromActiveGame(updatedState.activeGame, myTeam, opponent);

    applyGameResults(updatedState, myTeam, opponent, gameResult);
    
    if (updatedState.week < 13) {
         updatedState.week++;
    }
   
    updatedState = await simulateOtherGames(updatedState);
    updatedState.nationalRankings = updateRankings(updatedState.teams);
    updatedState.activeGame = null; // Clear the active game
    
    return updatedState;
};


// Stubs for functions that are not fully implemented but might be called
export const updatePlayoffBracket = (gameState: GameState, team1Id: number, team2Id: number, team1Won: boolean): boolean => {
    // Placeholder logic
    return !team1Won; // return if my team was eliminated
};