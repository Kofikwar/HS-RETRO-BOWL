
import { Game, Player, Position, Team, GameState, GameStrategy, PlayerStats, Recruit, PlayoffMatchup, SeasonAwards, OffensivePlaybook, DefensivePlaybook, Trophy, ActiveGameState, OffensivePlay, PlayOutcome, StatEvent, TrainingProgram, Staff, Sponsor, InboxMessage } from '../types';
import { POWERHOUSE_TEAMS, OTHER_TEAM_NAMES, FIRST_NAMES, LAST_NAMES, MAX_SEASONS, STAFF_FIRST_NAMES, STAFF_LAST_NAMES } from '../constants';

// FIX: Export 'rand' to make it accessible in other modules.
export const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const choice = <T,>(arr: T[]): T => arr[rand(0, arr.length - 1)];

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
    for(let i=0; i<count; i++) {
        const type = choice(types);
        const rating = rand(50, 95);
        staff.push({
            id: crypto.randomUUID(),
            name: generateStaffName(),
            type,
            rating,
            salary: 10000 + (rating - 50) * 1000,
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
    const sortedRoster = [...roster].filter(p => p.isInjured === 0).sort((a, b) => b.attributes.OVR - a.attributes.OVR);
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


  return {
    teams,
    season: 1, week: 1,
    schedule: generateAllSchedules(teams),
    funds: 50000,
    facilities: { coaching: { level: 1, cost: 10000 }, training: { level: 1, cost: 10000 }, rehab: { level: 1, cost: 10000 } },
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
    
    // Week 10 is Rivalry Week
    const scheduledInWeek10 = new Set<number>();
    for (const team of teams) {
        if (scheduledInWeek10.has(team.id)) continue;
        const rival = teams.find(t => t.id === team.rivalId);
        if (rival && !scheduledInWeek10.has(rival.id)) {
             const isHome = Math.random() > 0.5;
             schedules[team.id].push({ week: 10, opponentId: rival.id, isHome, weather: choice(weathers), isRivalryGame: true });
             schedules[rival.id].push({ week: 10, opponentId: team.id, isHome: !isHome, weather: choice(weathers), isRivalryGame: true });
             scheduledInWeek10.add(team.id);
             scheduledInWeek10.add(rival.id);
        }
    }

    // Schedule weeks 1-9
    for (const team of teams) {
        const teamId = team.id;
        const potentialOpponents = teamIds.filter(id => id !== teamId && id !== team.rivalId);
        let scheduledOpponents = new Set(schedules[teamId].map(g => g.opponentId));

        for (let week = 1; week <= 9; week++) {
            if (schedules[teamId].some(g => g.week === week)) continue;

            let opponentId: number;
            
            // Find an opponent who also needs a game this week
            let availableOpponents = potentialOpponents.filter(id => 
                !scheduledOpponents.has(id) && 
                schedules[id].every(g => g.week !== week)
            );
            
            if (availableOpponents.length === 0) {
                 // Fallback if we get stuck, less than ideal but prevents infinite loops
                 const allPossible = teamIds.filter(id => id !== teamId && schedules[id].every(g => g.week !== week) && !schedules[teamId].some(g => g.opponentId === id));
                 if (allPossible.length === 0) continue; // Should not happen in a league with even teams
                 opponentId = choice(allPossible);
            } else {
                 opponentId = choice(availableOpponents);
            }

            scheduledOpponents.add(opponentId);
            
            const isHome = Math.random() > 0.5;
            schedules[teamId].push({ week, opponentId, isHome, weather: choice(weathers) });
            schedules[opponentId].push({ week, opponentId: teamId, isHome: !isHome, weather: choice(weathers) });
        }
    }
    
    // Sort all schedules by week
    for (const teamId in schedules) {
        schedules[teamId].sort((a, b) => a.week - b.week);
    }

    return schedules;
};

const getPositionGroupOVR = (roster: Player[], positions: Position[], staminaWeight = 1) => {
    const players = roster.filter(p => positions.includes(p.position) && p.isInjured === 0);
    if (players.length === 0) return 30;
    const ovr = players.reduce((sum, p) => sum + p.attributes.OVR * (staminaWeight * (p.currentStamina / 100) + (1-staminaWeight)), 0) / players.length;
    return ovr;
}

const generateFullGameStats = (team: Team, score: number): Record<string, Partial<PlayerStats>> => {
    const stats: Record<string, Partial<PlayerStats>> = {};
    if (score === 0) return stats;

    const roster = team.roster.filter(p => p.isInjured === 0);
    if (roster.length === 0) return {};
    
    const qb = roster.filter(p => p.position === 'QB').sort((a,b) => b.attributes.OVR - a.attributes.OVR)[0];
    const rbs = roster.filter(p => p.position === 'RB').sort((a,b) => b.attributes.OVR - a.attributes.OVR);
    const receivers = roster.filter(p => ['WR', 'TE'].includes(p.position)).sort((a,b) => b.attributes.OVR - a.attributes.OVR);
    const defense = roster.filter(p => ['DL', 'LB', 'DB'].includes(p.position));

    let passYds = 0, passTDs = 0, rushYds = 0, rushTDs = 0;
    const totalTDs = Math.floor(score / 7);

    if (qb) {
        passTDs = Math.min(totalTDs, Math.round(totalTDs * (rand(50,80)/100)));
        passYds = passTDs * rand(30,50) + (score - totalTDs * 7) * rand(4,7);
        stats[qb.id] = { passYds, passTDs };
    }

    rushTDs = totalTDs - passTDs;
    if (rbs.length > 0) {
        let remainingRushTDs = rushTDs;
        while(remainingRushTDs > 0) {
            const scorer = rbs[0];
            if (!stats[scorer.id]) stats[scorer.id] = {};
            stats[scorer.id].rushTDs = (stats[scorer.id].rushTDs || 0) + 1;
            remainingRushTDs--;
        }
        rushYds = Math.max(40, passYds * (rand(30, 80)/100));
        let remainingRushYards = rushYds;
        while (remainingRushYards > 0 && rbs.length > 0) {
            const rusher = rbs[0];
            const gain = Math.min(remainingRushYards, rand(2, 15));
            if (!stats[rusher.id]) stats[rusher.id] = {};
            stats[rusher.id].rushYds = (stats[rusher.id].rushYds || 0) + gain;
            remainingRushYards -= gain;
        }
    }
    
    if (receivers.length > 0 && passYds > 0) {
        let remainingRecYds = passYds;
        let remainingRecTDs = passTDs;
        while(remainingRecYds > 20 && receivers.length > 0) {
            const receiver = choice(receivers);
            const gain = Math.min(remainingRecYds, rand(5, 40));
             if (!stats[receiver.id]) stats[receiver.id] = {};
            stats[receiver.id].recYds = (stats[receiver.id].recYds || 0) + gain;
            remainingRecYds -= gain;
            if (remainingRecTDs > 0 && Math.random() > 0.7) {
                stats[receiver.id].recTDs = (stats[receiver.id].recTDs || 0) + 1;
                remainingRecTDs--;
            }
        }
    }
    
    if (defense.length > 0) {
        for(let i=0; i < rand(40, 70); i++) {
            const tackler = choice(defense);
            if (!stats[tackler.id]) stats[tackler.id] = {};
            stats[tackler.id].tackles = (stats[tackler.id].tackles || 0) + 1;
        }
        for(let i=0; i < rand(0, 5); i++) {
            const sacker = choice(defense.filter(p => ['DL','LB'].includes(p.position)));
            if (sacker) {
                 if (!stats[sacker.id]) stats[sacker.id] = {};
                stats[sacker.id].sacks = (stats[sacker.id].sacks || 0) + 1;
            }
        }
        for(let i=0; i < rand(0, 3); i++) {
            const inter = choice(defense.filter(p => ['DB','LB'].includes(p.position)));
             if (inter) {
                 if (!stats[inter.id]) stats[inter.id] = {};
                stats[inter.id].ints = (stats[inter.id].ints || 0) + 1;
            }
        }
    }

    return stats;
}

export const simulateGame = (
    myTeam: Team,
    opponent: Team,
    myStrategy: GameStrategy,
    opponentStrategy: GameStrategy,
    myFacilities: GameState['facilities'],
    opponentFacilities: { level: number; cost: number; },
    weather: Game['weather'],
    forceWin: boolean,
    myStaff: Staff[]
): { didWin: boolean, result: NonNullable<Game['result']> } => {
    
    const oc = myStaff.find(s => s.type === 'OC');
    const dc = myStaff.find(s => s.type === 'DC');
    
    const myOffenseOVR = ((getPositionGroupOVR(myTeam.roster, ['QB', 'RB', 'WR', 'TE']) + getPositionGroupOVR(myTeam.roster, ['OL'])) / 2) + (oc ? oc.rating / 10 : 0);
    const myDefenseOVR = ((getPositionGroupOVR(myTeam.roster, ['DL', 'LB']) + getPositionGroupOVR(myTeam.roster, ['DB'])) / 2) + (dc ? dc.rating / 10 : 0);
    const oppOffenseOVR = (getPositionGroupOVR(opponent.roster, ['QB', 'RB', 'WR', 'TE']) + getPositionGroupOVR(opponent.roster, ['OL'])) / 2;
    const oppDefenseOVR = (getPositionGroupOVR(opponent.roster, ['DL', 'LB']) + getPositionGroupOVR(opponent.roster, ['DB'])) / 2;

    let myScore = 0;
    let opponentScore = 0;

    const totalPossessions = rand(22, 26); // 11-13 possessions per team

    // Weather modifier affects passing and kicking
    let weatherMod = 0;
    if (weather === 'Rainy') weatherMod = -4;
    if (weather === 'Snowy') weatherMod = -8;
    
    // Simulate each possession
    for (let i = 0; i < totalPossessions; i++) {
        const isMyPossession = i % 2 === 0;
        const offenseOVR = isMyPossession ? myOffenseOVR : oppOffenseOVR;
        const defenseOVR = isMyPossession ? oppDefenseOVR : myDefenseOVR;
        
        // Base success on OVR matchup, with randomness. A 10 point OVR advantage should be significant.
        const advantage = offenseOVR - defenseOVR;
        const baseSuccess = 50 + advantage * 1.5 + weatherMod + rand(-15, 15);
        
        // Chance for a big play TD regardless of matchup
        if (rand(1, 100) < 5) {
            if (isMyPossession) myScore += 7; else opponentScore += 7;
            continue; // a big play ends the drive
        }
        
        // Chance for defensive TD
        if (rand(1, 100) < 2) {
            if (isMyPossession) opponentScore += 7; else myScore += 7;
            continue;
        }

        if (baseSuccess > 80) { // High chance of TD
             if (isMyPossession) myScore += 7; else opponentScore += 7;
        } else if (baseSuccess > 60) { // Good chance of FG
             if (isMyPossession) myScore += 3; else opponentScore += 3;
        } else if (baseSuccess < 20) { // High chance of turnover
             // turnover, no points
        }
        // else: Punt, no points
    }
    
    // Adjust total points based on overall team quality. Better teams play in higher scoring games.
    const overallGameLevel = (myTeam.ovr + opponent.ovr) / 2;
    const scoreModifier = 1 + (overallGameLevel - 75) / 100; // e.g., 75 OVR=1.0x, 99 OVR=1.24x, 50 OVR=0.75x
    myScore = Math.round(myScore * scoreModifier);
    opponentScore = Math.round(opponentScore * scoreModifier);
    
    // Make sure scores are football-like (no 1s, 2s, 4s, 5s) by reconstructing from TDs and FGs
    const adjustToFootballScore = (score: number): number => {
        if (score <= 0) return 0;
        if (score <= 5) return choice([0, 3]);
        
        let attempts = 0;
        while(attempts < 5) {
            let tempScore = 0;
            let remaining = score;
            while(remaining > 0) {
                if (remaining >= 7 && Math.random() > 0.4) {
                    tempScore += 7;
                    remaining -= 7;
                } else if (remaining >= 3) {
                    tempScore += 3;
                    remaining -= 3;
                } else {
                    break;
                }
            }
            if (Math.abs(tempScore - score) < 5) return tempScore;
            attempts++;
        }
        return Math.floor(score / 7) * 7 + (score % 7 > 3 ? 3 : 0); // fallback
    }
    
    myScore = adjustToFootballScore(myScore);
    opponentScore = adjustToFootballScore(opponentScore);

    if (forceWin) {
        if (myScore <= opponentScore) {
            myScore = opponentScore + choice([3, 4, 6, 7, 8]); // more realistic win margins
        }
    } else if (myScore === opponentScore) {
        if (myTeam.ovr > opponent.ovr) myScore += 3;
        else opponentScore += 3;
    }

    const summary = `${myScore} - ${opponentScore}`;
    const didWin = myScore > opponentScore;

    const myPlayerStats = generateFullGameStats(myTeam, myScore);
    myTeam.roster.forEach(p => { if (myPlayerStats[p.id]) myPlayerStats[p.id]!.gamesPlayed = 1; else myPlayerStats[p.id] = { gamesPlayed: 1 }; });

    const opponentPlayerStats = generateFullGameStats(opponent, opponentScore);
    opponent.roster.forEach(p => { if (opponentPlayerStats[p.id]) opponentPlayerStats[p.id]!.gamesPlayed = 1; else opponentPlayerStats[p.id] = { gamesPlayed: 1 }; });

    return {
        didWin,
        result: {
            myScore,
            opponentScore,
            opponentId: opponent.id,
            summary,
            playerStats: { myTeam: myPlayerStats, opponentTeam: opponentPlayerStats }
        }
    };
};

export const applyGameResults = (gameState: GameState, myTeam: Team, opponent: Team, gameResult: ReturnType<typeof simulateGame>) => {
    const { result, didWin } = gameResult;
    if (didWin) {
        myTeam.record.wins++;
        if (gameState.activeSponsor) {
            gameState.funds += gameState.activeSponsor.payoutPerWin;
        }
    } else {
        myTeam.record.losses++;
    }

    if (!didWin) opponent.record.wins++; else opponent.record.losses++;
    
    const week = gameState.week;
    
    const updateScheduleForTeam = (teamId: number, oppId: number, score: number, oppScore: number, playerStats: { myTeam: Record<string, Partial<PlayerStats>>, opponentTeam: Record<string, Partial<PlayerStats>>}) => {
         const game = gameState.schedule[teamId]?.find(g => g.week === week && g.opponentId === oppId);
         if (game) {
             game.result = { ...result, myScore: score, opponentScore: oppScore, playerStats };
         }
    };
    updateScheduleForTeam(myTeam.id, opponent.id, result.myScore, result.opponentScore, result.playerStats);
    updateScheduleForTeam(opponent.id, myTeam.id, result.opponentScore, result.myScore, { myTeam: result.playerStats.opponentTeam, opponentTeam: result.playerStats.myTeam});
    gameState.lastGameResult = result;

    const applyStatsToRoster = (roster: Player[], stats: Record<string, Partial<PlayerStats>>) => {
        roster.forEach(p => {
             const gameStats = stats[p.id];
             if (gameStats) {
                Object.keys(gameStats).forEach(key => {
                    const statKey = key as keyof PlayerStats;
                    p.seasonStats[statKey] = (p.seasonStats[statKey] || 0) + (gameStats[statKey] || 0);
                    p.careerStats[statKey] = (p.careerStats[statKey] || 0) + (gameStats[statKey] || 0);
                });
            }
        });
    };
    
    applyStatsToRoster(myTeam.roster, result.playerStats.myTeam);
    applyStatsToRoster(opponent.roster, result.playerStats.opponentTeam);

    const doctor = gameState.staff.find(s => s.type === 'Doctor');
    const injuryModifier = doctor ? doctor.rating / 50 : 1; // Good doctor reduces injury time

    myTeam.roster.forEach(p => {
        p.currentStamina = Math.max(0, p.currentStamina - rand(20, 40));
        p.morale = Math.max(0, Math.min(100, p.morale + (didWin ? rand(1, 5) : rand(-5, -1))));
        if (rand(1, 100) > 98) p.isInjured = Math.max(1, Math.round(rand(1, 4) / injuryModifier));
    });

    myTeam.ovr = calculateTeamOVR(myTeam.roster);
    opponent.ovr = calculateTeamOVR(opponent.roster);
};


export const simulateOtherGames = (gameState: GameState) => {
    const teamsPlayedThisWeek = new Set<number>();
    if (gameState.myTeamId) {
        teamsPlayedThisWeek.add(gameState.myTeamId);
        const myGame = gameState.schedule[gameState.myTeamId].find(g => g.week === gameState.week && g.result);
        if (myGame) teamsPlayedThisWeek.add(myGame.opponentId);
    }
    
    for (const team of gameState.teams) {
        if (teamsPlayedThisWeek.has(team.id)) continue;

        const game = gameState.schedule[team.id]?.find(g => g.week === gameState.week);
        if (!game || teamsPlayedThisWeek.has(game.opponentId)) continue;
        
        const opponent = gameState.teams.find(t => t.id === game.opponentId)!;
        
        const result = simulateGame(team, opponent, {offense: 'Balanced', defense: '4-3 Defense'}, {offense: 'Balanced', defense: '4-3 Defense'}, { coaching: {level:1, cost: 0}, training: {level:1, cost:0}, rehab: {level:1, cost:0}}, {level:1, cost:0}, game.weather || 'Sunny', false, []);
        
        applyGameResults(gameState, team, opponent, result);

        teamsPlayedThisWeek.add(team.id);
        teamsPlayedThisWeek.add(opponent.id);
    }
    return gameState;
};

export const findNextOpponentId = (gameState: GameState): number | null => {
    if (!gameState.myTeamId) return null;
    const myTeam = gameState.teams.find(t => t.id === gameState.myTeamId)!;
    
    if (gameState.isOffseason) return null;

    if (gameState.week > 10 && gameState.playoffBracket) {
      const currentRound = gameState.playoffBracket.find(r => r.round === gameState.week - 10);
      const myMatch = currentRound?.matchups.find(m => m.team1Id === myTeam.id || m.team2Id === myTeam.id);
       if (myMatch && !myMatch.winnerId) {
          return myMatch.team1Id === myTeam.id ? myMatch.team2Id : myMatch.team1Id;
      }
      return null;
    }

    const nextGame = gameState.schedule[myTeam.id]?.find(g => g.week === gameState.week);
    if(nextGame) return nextGame.opponentId;
    
    return null;
}

export const updateRankings = (teams: Team[]): { teamId: number; rank: number }[] => {
    const sortedTeams = [...teams].sort((a, b) => {
        if (a.record.wins !== b.record.wins) return b.record.wins - a.record.wins;
        if (a.record.losses !== b.record.losses) return a.record.losses - b.record.losses;
        return b.ovr - a.ovr;
    });

    return sortedTeams.slice(0, 25).map((team, index) => ({
        teamId: team.id,
        rank: index + 1
    }));
};

export const getNationalLeaders = (teams: Team[]): Record<string, Player[]> => {
    const allPlayers = teams.flatMap(t => t.roster);
    const leaders: Record<string, Player[]> = {};
    const statCategories: (keyof PlayerStats)[] = ['passYds', 'passTDs', 'rushYds', 'rushTDs', 'recYds', 'recTDs', 'tackles', 'sacks', 'ints'];

    for (const stat of statCategories) {
        leaders[stat] = allPlayers
            .filter(p => p.seasonStats[stat] > 0)
            .sort((a, b) => b.seasonStats[stat] - a.seasonStats[stat])
            .slice(0, 20);
    }
    return leaders;
};

const calculateSeasonAwards = (teams: Team[]): SeasonAwards => {
    const allPlayers = teams.flatMap(t => t.roster);
    
    const findBest = (position: Position | Position[], stat: keyof PlayerStats | keyof Player['attributes']) => {
        const positions = Array.isArray(position) ? position : [position];
        const candidates = allPlayers.filter(p => positions.includes(p.position) && p.seasonStats.gamesPlayed > 5);
        if (candidates.length === 0) return null;
        
        if (['Block', 'Consistency'].includes(stat)) {
            return candidates.sort((a, b) => b.attributes[stat as keyof Player['attributes']] - a.attributes[stat as keyof Player['attributes']])[0];
        }
        return candidates.sort((a, b) => b.seasonStats[stat as keyof PlayerStats] - a.seasonStats[stat as keyof PlayerStats])[0];
    };
    
    const awards: SeasonAwards = {
        mvp: null, allAmerican: [], bestQB: null, bestRB: null, bestWR: null, bestTE: null, bestOL: null, bestDL: null, bestLB: null, bestDB: null, bestKP: null
    };

    awards.bestQB = findBest('QB', 'passYds');
    awards.bestRB = findBest('RB', 'rushYds');
    awards.bestWR = findBest('WR', 'recYds');
    awards.bestTE = findBest('TE', 'recYds');
    awards.bestOL = findBest('OL', 'Block');
    awards.bestDL = findBest('DL', 'sacks');
    awards.bestLB = findBest('LB', 'tackles');
    awards.bestDB = findBest('DB', 'ints');
    awards.bestKP = findBest('K/P', 'Consistency');

    const skillPlayers = [awards.bestQB, awards.bestRB, awards.bestWR].filter(Boolean) as Player[];
    if (skillPlayers.length > 0) {
        awards.mvp = skillPlayers.sort((a,b) => ((b.seasonStats.passTDs + b.seasonStats.rushTDs + b.seasonStats.recTDs)*2 + (b.seasonStats.passYds + b.seasonStats.rushYds + b.seasonStats.recYds)/10) - ((a.seasonStats.passTDs + a.seasonStats.rushTDs + a.seasonStats.recTDs)*2 + (a.seasonStats.passYds + a.seasonStats.rushYds + a.seasonStats.recYds)/10))[0];
    }
    
    return awards;
};

export const generateRecruits = (season: number): Recruit[] => {
    const recruits: Recruit[] = [];
    const positions: Position[] = ['QB', 'RB', 'WR', 'TE', 'OL', 'DL', 'LB', 'DB', 'K/P'];
    for (let i = 0; i < 50; i++) {
        const position = choice(positions);
        const attributes = generateAttributes(position);
        recruits.push({
            id: crypto.randomUUID(),
            name: generateName(),
            position,
            attributes,
            cost: 5 + Math.floor(attributes.OVR / 10) + Math.floor(attributes.Potential / 10),
        });
    }
    return recruits;
};

// Player progression/regression
const progressPlayer = (player: Player, coachingLevel: number, trainerRating: number) => {
    if (player.year === 'SR') return; // Seniors graduate, no progression
    
    const potential = player.attributes.Potential;
    const consistency = player.attributes.Consistency;
    const ageFactor = { 'FR': 3, 'SO': 2, 'JR': 1 }[player.year];
    
    let totalImprovement = 0;

    for (const key in player.attributes) {
        const attr = key as keyof Player['attributes'];
        if (attr === 'OVR') continue;

        const currentVal = player.attributes[attr];
        // Improvement chance is based on potential and coaching
        const improveChance = (potential + coachingLevel * 5 + trainerRating / 5) / 170;
        
        if (Math.random() < improveChance && currentVal < 99) {
            // Amount of improvement is based on consistency and age
            const improvementPoints = Math.max(1, Math.round((consistency / 100) * ageFactor * Math.random()));
            player.attributes[attr] = Math.min(99, currentVal + improvementPoints);
            totalImprovement += improvementPoints;
        }
    }

    if (totalImprovement > 0) {
        const newTotal = Object.entries(player.attributes).reduce((sum, [key, val]) => (key !== 'OVR' ? sum + val : sum), 0);
        player.attributes.OVR = Math.round(newTotal / (Object.keys(player.attributes).length - 1));
    }
    
    player.year = { 'FR': 'SO', 'SO': 'JR', 'JR': 'SR' }[player.year] as Player['year'];
};


export const startOffseason = (gameState: GameState): GameState => {
    const awards = calculateSeasonAwards(gameState.teams);
    
    if (awards.mvp) {
        gameState.trophyCase.push({ season: gameState.season, award: 'MVP Award', playerName: awards.mvp.name, playerId: awards.mvp.id });
    }
    
    const myTeam = gameState.teams.find(t => t.id === gameState.myTeamId)!;
    const trainer = gameState.staff.find(s => s.type === 'Trainer');
    const trainerRating = trainer ? trainer.rating : 0;

    // Player progression for ALL teams
    gameState.teams.forEach(team => {
        // Remove seniors first
        team.roster = team.roster.filter(p => p.year !== 'SR');
        // Progress remaining players
        team.roster.forEach(player => {
            const facilityLevel = team.id === gameState.myTeamId ? gameState.facilities.coaching.level : 1;
            const staffRating = team.id === gameState.myTeamId ? trainerRating : 0;
            progressPlayer(player, facilityLevel, staffRating);
        });
        team.ovr = calculateTeamOVR(team.roster);
    });

    return {
        ...gameState,
        isOffseason: true,
        week: 1,
        seasonAwards: awards,
        recruits: generateRecruits(gameState.season),
        recruitingPoints: 50 + (myTeam.record.wins * 5) + Math.floor(gameState.fanHappiness / 10),
        playoffBracket: null,
    };
};

export const applyTrainingCampResults = (gameState: GameState, selections: Record<string, TrainingProgram>, signedRecruits: Recruit[]): { updatedState: GameState, updatedRecruits: Recruit[] } => {
    const updatedState = JSON.parse(JSON.stringify(gameState));
    const myTeam = updatedState.teams.find((t: Team) => t.id === updatedState.myTeamId)!;
    
    const trainingPrograms: Record<TrainingProgram, { cost: number, effects: Partial<Record<keyof Player['attributes'], number>> }> = {
        'NONE': { cost: 0, effects: {} },
        'CONDITIONING': { cost: 5000, effects: { Stamina: rand(3, 7) } },
        'STRENGTH': { cost: 15000, effects: { Strength: rand(2, 5), Block: rand(1, 3) } },
        'AGILITY': { cost: 15000, effects: { Speed: rand(2, 5) } },
        'PASSING': { cost: 25000, effects: { Pass: rand(3, 6), Consistency: rand(2, 4) } },
        'RECEIVING': { cost: 25000, effects: { Catch: rand(3, 6) } },
        'TACKLING': { cost: 25000, effects: { Tackle: rand(3, 6) } }
    };

    let totalCost = 0;
    const combinedRoster: (Player | Recruit)[] = [...myTeam.roster, ...signedRecruits];

    for (const playerId in selections) {
        const programKey = selections[playerId];
        if (programKey === 'NONE') continue;
        
        const program = trainingPrograms[programKey];
        const player = combinedRoster.find(p => p.id === playerId);
        
        if (player && program) {
            totalCost += program.cost;
            for (const attr in program.effects) {
                const key = attr as keyof Player['attributes'];
                const boost = program.effects[key]!;
                player.attributes[key] = Math.min(99, player.attributes[key] + boost);
            }
            // Recalculate OVR
            const newTotal = Object.entries(player.attributes).reduce((sum, [key, val]) => (key !== 'OVR' ? sum + val : sum), 0);
            player.attributes.OVR = Math.round(newTotal / (Object.keys(player.attributes).length - 1));
        }
    }
    
    updatedState.funds -= totalCost;

    const updatedRecruits = combinedRoster.filter(p => 'cost' in p) as Recruit[];
    myTeam.roster = combinedRoster.filter(p => !('cost' in p)) as Player[];
    
    updatedState.teams.find((t: Team) => t.id === updatedState.myTeamId)!.roster = myTeam.roster;

    return { updatedState, updatedRecruits };
};


export const advanceToNextSeason = (gameState: GameState, signedRecruits: Recruit[]): GameState => {
    const newState = { ...gameState };

    // Add recruits to my team
    const myTeam = newState.teams.find(t => t.id === newState.myTeamId)!;
    signedRecruits.forEach(recruit => {
        myTeam.roster.push({
            ...recruit,
            year: 'FR',
            seasonStats: initialStats(),
            careerStats: initialStats(),
            isInjured: 0,
            morale: rand(70, 90),
            currentStamina: 100,
        });
    });
    
    // Fill rosters for AI teams
    newState.teams.forEach(team => {
        const neededPlayers = 45 - team.roster.length;
        if (neededPlayers > 0) {
            for (let i = 0; i < neededPlayers; i++) {
                const rosterTemplate: Position[] = ['QB', 'RB', 'WR', 'TE', 'OL', 'DL', 'LB', 'DB', 'K/P'];
                team.roster.push(generatePlayer(choice(rosterTemplate), 'FR'));
            }
        }
    });

    newState.season += 1;
    if (newState.season > MAX_SEASONS) {
        // Handle game over logic
        return newState;
    }
    newState.isOffseason = false;
    newState.schedule = generateAllSchedules(newState.teams);
    newState.lastGameResult = null;
    
    newState.teams.forEach(team => {
        team.record = { wins: 0, losses: 0 };
        team.roster.forEach(player => {
            player.seasonStats = initialStats();
            player.isInjured = 0;
            player.currentStamina = 100;
        });
        team.ovr = calculateTeamOVR(team.roster);
    });

    newState.nationalRankings = updateRankings(newState.teams);
    newState.availableSponsors = generateSponsors(newState.fanHappiness, newState.season);
    newState.staffMarket = generateStaff(10);

    return newState;
};

export const updatePlayoffBracket = (gameState: GameState, myTeamId: number, opponentId: number, didWin: boolean): boolean => {
    if (!gameState.playoffBracket) {
        const top8 = gameState.nationalRankings.slice(0, 8).map(t => t.teamId);
        if (!top8.includes(myTeamId)) return true; // Eliminated if not in top 8
        
        gameState.playoffBracket = [
            { round: 1, matchups: [ {team1Id: top8[0], team2Id: top8[7]}, {team1Id: top8[3], team2Id: top8[4]}, {team1Id: top8[2], team2Id: top8[5]}, {team1Id: top8[1], team2Id: top8[6]} ]},
            { round: 2, matchups: [ {team1Id: 0, team2Id: 0}, {team1Id: 0, team2Id: 0} ] },
            { round: 3, matchups: [ {team1Id: 0, team2Id: 0} ] }
        ];
    }

    const roundIndex = gameState.week - 11;
    if (roundIndex < 0 || roundIndex >= gameState.playoffBracket.length) return false;

    const currentRound = gameState.playoffBracket[roundIndex];
    const match = currentRound.matchups.find(m => (m.team1Id === myTeamId && m.team2Id === opponentId) || (m.team2Id === myTeamId && m.team1Id === opponentId));

    if (match) {
        match.winnerId = didWin ? myTeamId : opponentId;
        const game = gameState.schedule[myTeamId].find(g => g.week === gameState.week);
        if (game) match.game = game;
    }
    
    // Check if eliminated
    if (!didWin) return true;

    // If not the final, set up next round's matchup
    if (roundIndex < 2) {
        const nextRound = gameState.playoffBracket[roundIndex + 1];
        const winners = currentRound.matchups.map(m => m.winnerId).filter(Boolean) as number[];
        
        for(let i=0; i < winners.length; i += 2) {
            const matchupIndex = i / 2;
            if (nextRound.matchups[matchupIndex]) {
                 if (!nextRound.matchups[matchupIndex].team1Id) nextRound.matchups[matchupIndex].team1Id = winners[i];
                 if (!nextRound.matchups[matchupIndex].team2Id && winners[i+1]) nextRound.matchups[matchupIndex].team2Id = winners[i+1];
            }
        }
    }
    
    return false; // Not eliminated
};

export const simulatePlay = (myTeam: Team, opponent: Team, play: OffensivePlay, yardLine: number, staff: Staff[]): PlayOutcome => {
    const outcome: PlayOutcome = { description: '', yards: 0, isTurnover: false, isTouchdown: false, isComplete: true, statEvents: [] };
    
    const qb = myTeam.roster.filter(p => p.position === 'QB' && p.isInjured === 0).sort((a,b) => b.attributes.OVR - a.attributes.OVR)[0];
    const rb = myTeam.roster.filter(p => p.position === 'RB' && p.isInjured === 0).sort((a,b) => b.attributes.OVR - a.attributes.OVR)[0];
    const wr = myTeam.roster.filter(p => p.position === 'WR' && p.isInjured === 0).sort((a,b) => b.attributes.OVR - a.attributes.OVR)[0];

    if (!qb || !rb || !wr) return {...outcome, description: "Missing key players!"};

    const oc = staff.find(s => s.type === 'OC');
    const myOffenseOVR = myTeam.ovr + (oc ? oc.rating / 10 : 0);
    const oppDefenseOVR = opponent.ovr;
    const advantage = myOffenseOVR - oppDefenseOVR;

    const isRun = ['Inside Run', 'Outside Run', 'Power Run', 'Draw Play'].includes(play);
    
    if (isRun) {
        const rusher = rb || qb;
        const result = rand(-2, 10) + Math.floor(advantage / 10) + Math.floor(rusher.attributes.Speed / 20);
        outcome.yards = result;
        outcome.description = `${rusher.name} ${choice(['rushes up the middle', 'finds a hole', 'bounces outside'])} for ${result} yards.`;
        outcome.statEvents.push({ playerId: rusher.id, stat: 'rushYds', value: result });
    } else { // is pass
        const receiver = wr || rb;
        if (Math.random() * 100 < qb.attributes.Consistency + advantage / 2) {
            const result = rand(0, 25) + Math.floor(advantage / 10) + Math.floor(receiver.attributes.Catch / 20);
            outcome.yards = result;
            outcome.description = `${qb.name} ${choice(['fires a pass', 'drops back and throws', 'finds'])} to ${receiver.name} for ${result} yards.`;
            outcome.statEvents.push({ playerId: qb.id, stat: 'passYds', value: result });
            outcome.statEvents.push({ playerId: receiver.id, stat: 'recYds', value: result });
        } else {
            outcome.isComplete = false;
            outcome.description = `${qb.name} pass to ${receiver.name} is incomplete.`;
        }
    }
    
    if (Math.random() > 0.95 + (advantage / 100)) { // Turnovers are less likely with a big advantage
        outcome.isTurnover = true;
        outcome.description += ` ${choice(['FUMBLE!', 'INTERCEPTION!'])} Turnover!`;
    }
    
    if (yardLine + outcome.yards >= 100) {
        outcome.isTouchdown = true;
        outcome.yards = 100 - yardLine;
        outcome.description = `TOUCHDOWN! ${play === 'Hail Mary' ? 'A miracle catch!' : 'He takes it all the way!'}`;
        if (isRun) {
            outcome.statEvents.push({ playerId: rb.id, stat: 'rushTDs', value: 1 });
        } else {
            outcome.statEvents.push({ playerId: qb.id, stat: 'passTDs', value: 1 });
            outcome.statEvents.push({ playerId: wr.id, stat: 'recTDs', value: 1 });
        }
    }

    return outcome;
};

export const simulateOpponentDrive = (myTeam: Team, opponent: Team): { score: number, description: string, timeElapsed: number } => {
    const driveScore = choice([0,0,0,3,3,7]);
    let description = "Opponent punts.";
    if (driveScore === 3) description = "Opponent kicks a field goal.";
    if (driveScore === 7) description = "Opponent scores a touchdown.";
    
    return {
        score: driveScore,
        description,
        timeElapsed: rand(120, 300)
    };
}

export const skipGameSimulation = (gameState: GameState): ActiveGameState => {
    const { activeGame, myTeamId, teams, myStrategy, staff } = gameState;
    if (!activeGame) throw new Error("No active game to skip");
    
    const myTeam = teams.find(t => t.id === myTeamId)!;
    const opponent = teams.find(t => t.id === activeGame.opponentId)!;

    const result = simulateGame(myTeam, opponent, myStrategy, {offense: 'Balanced', defense: '4-3 Defense'}, gameState.facilities, {level:1, cost: 0}, 'Sunny', gameState.forceWinNextGame, staff);

    return {
        ...activeGame,
        playerScore: result.result.myScore,
        opponentScore: result.result.opponentScore,
        isGameOver: true,
        quarter: 4,
        time: 0
    };
};

export const applyPlayableGameResults = (gameState: GameState, activeGame: ActiveGameState, finalStats: Record<string, Partial<PlayerStats>>): GameState => {
    let updatedState = JSON.parse(JSON.stringify(gameState));
    const myTeam = updatedState.teams.find((t: Team) => t.id === updatedState.myTeamId)!;
    const opponent = updatedState.teams.find((t: Team) => t.id === activeGame.opponentId)!;

    const didWin = activeGame.playerScore > activeGame.opponentScore;

    if (didWin) myTeam.record.wins++; else myTeam.record.losses++;
    if (!didWin) opponent.record.wins++; else opponent.record.losses++;

    myTeam.roster.forEach((p: Player) => {
        const gameStats = finalStats[p.id];
        if (gameStats) {
            p.seasonStats.gamesPlayed = (p.seasonStats.gamesPlayed || 0) + 1;
            p.careerStats.gamesPlayed = (p.careerStats.gamesPlayed || 0) + 1;
            Object.keys(gameStats).forEach(key => {
                const statKey = key as keyof PlayerStats;
                p.seasonStats[statKey] = (p.seasonStats[statKey] || 0) + (gameStats[statKey] || 0);
                p.careerStats[statKey] = (p.careerStats[statKey] || 0) + (gameStats[statKey] || 0);
            });
        }
        p.currentStamina = Math.max(0, p.currentStamina - rand(20, 40));
    });

    const summary = `${activeGame.playerScore} - ${activeGame.opponentScore}`;
    updatedState.lastGameResult = {
        myScore: activeGame.playerScore,
        opponentScore: activeGame.opponentScore,
        opponentId: opponent.id,
        summary,
        playerStats: {
            myTeam: finalStats,
            opponentTeam: generateFullGameStats(opponent, activeGame.opponentScore)
        }
    };
    
    const game = updatedState.schedule[myTeam.id].find((g: Game) => g.week === updatedState.week);
    if(game) {
        game.result = updatedState.lastGameResult;
    }


    if (updatedState.week < 13) updatedState.week++;
    
    // Simulate other games for the week after player's game is done
    updatedState = simulateOtherGames(updatedState);
    
    updatedState.nationalRankings = updateRankings(updatedState.teams);

    if (updatedState.week > 10) {
        const isEliminated = updatePlayoffBracket(updatedState, myTeam.id, opponent.id, didWin);
        if (isEliminated) {
            updatedState = startOffseason(updatedState);
        } else if (updatedState.week === 14) {
            updatedState.trophyCase.push({ season: updatedState.season, award: 'National Champions' });
            updatedState = startOffseason(updatedState);
        }
    }
    if (updatedState.week > 10 && !updatedState.playoffBracket) {
        const isPlayoffTeam = updatedState.nationalRankings.slice(0,8).some((t: {teamId: number}) => t.teamId === myTeam.id);
        if(!isPlayoffTeam) {
             updatedState = startOffseason(updatedState);
        }
    }

    updatedState.activeGame = null;
    return updatedState;
};

export const hireStaff = (gameState: GameState, staffId: string): GameState => {
    const staffToHire = gameState.staffMarket.find(s => s.id === staffId);
    if (!staffToHire || gameState.funds < staffToHire.salary) {
        return gameState; // Not enough funds or staff not found
    }

    // Check if a staff of this type already exists and replace them
    const existingStaffIndex = gameState.staff.findIndex(s => s.type === staffToHire.type);
    if (existingStaffIndex !== -1) {
        const oldStaff = gameState.staff[existingStaffIndex];
        // For simplicity, we just fire the old one. Could be moved back to market.
        gameState.staff.splice(existingStaffIndex, 1);
    }

    gameState.funds -= staffToHire.salary;
    gameState.staff.push(staffToHire);
    gameState.staffMarket = gameState.staffMarket.filter(s => s.id !== staffId);

    return gameState;
};

export const generateScoutingReport = (opponent: Team): { strengths: string[], weaknesses: string[], keyPlayers: Player[] } => {
    const roster = opponent.roster;
    const strengths: string[] = [];
    const weaknesses: string[] = [];

    const ovrs = {
        QB: getPositionGroupOVR(roster, ['QB']),
        RB: getPositionGroupOVR(roster, ['RB']),
        WR: getPositionGroupOVR(roster, ['WR', 'TE']),
        OL: getPositionGroupOVR(roster, ['OL']),
        DL: getPositionGroupOVR(roster, ['DL']),
        LB: getPositionGroupOVR(roster, ['LB']),
        DB: getPositionGroupOVR(roster, ['DB']),
    };

    if (ovrs.QB > 85) strengths.push("Elite Quarterback");
    if (ovrs.QB < 70) weaknesses.push("Weak Quarterback Play");
    if (ovrs.RB > 85) strengths.push("Dominant Rushing Attack");
    if (ovrs.OL > 85) strengths.push("Impenetrable Offensive Line");
    if (ovrs.OL < 70) weaknesses.push("Porous Offensive Line");
    if (ovrs.WR > 85) strengths.push("Explosive Receiving Corps");
    if (ovrs.DL > 85) strengths.push("Disruptive Defensive Line");
    if (ovrs.DL < 70) weaknesses.push("Struggles to get pressure");
    if (ovrs.DB > 85) strengths.push("Lockdown Secondary");
    if (ovrs.DB < 70) weaknesses.push("Vulnerable Secondary");

    if (strengths.length === 0) strengths.push("Well-rounded team");
    if (weaknesses.length === 0) weaknesses.push("No glaring weaknesses");
    
    const keyPlayers = [...roster].sort((a,b) => b.attributes.OVR - a.attributes.OVR).slice(0, 3);

    return { strengths, weaknesses, keyPlayers };
};

export const calculateAwardRaces = (teams: Team[]): Record<string, {player: Player, teamName: string}[]> => {
    const allPlayers = teams.flatMap(t => {
        const teamName = t.name;
        return t.roster.map(p => ({ ...p, teamName }));
    });
    
    const races: Record<string, {player: Player, teamName: string}[]> = {};
    const awardCategories: { name: string, stat: keyof PlayerStats, positions: Position[] }[] = [
        { name: 'MVP', stat: 'passTDs', positions: ['QB', 'RB', 'WR'] }, // Special logic for MVP
        { name: 'Best QB', stat: 'passYds', positions: ['QB'] },
        { name: 'Best RB', stat: 'rushYds', positions: ['RB'] },
        { name: 'Best WR', stat: 'recYds', positions: ['WR', 'TE'] },
        { name: 'Best DL', stat: 'sacks', positions: ['DL'] },
        { name: 'Best LB', stat: 'tackles', positions: ['LB'] },
        { name: 'Best DB', stat: 'ints', positions: ['DB'] },
    ];

    for (const category of awardCategories) {
        let candidates = allPlayers.filter(p => category.positions.includes(p.position));
        
        if (category.name === 'MVP') {
            candidates = candidates.sort((a,b) => 
                ((b.seasonStats.passTDs + b.seasonStats.rushTDs + b.seasonStats.recTDs) * 2 + b.seasonStats.passYds / 10 + b.seasonStats.rushYds / 5) - 
                ((a.seasonStats.passTDs + a.seasonStats.rushTDs + a.seasonStats.recTDs) * 2 + a.seasonStats.passYds / 10 + a.seasonStats.rushYds / 5)
            );
        } else {
            candidates = candidates.sort((a, b) => (b.seasonStats[category.stat] || 0) - (a.seasonStats[category.stat] || 0));
        }
        
        races[category.name] = candidates.filter(p => p.seasonStats.gamesPlayed > 0).slice(0, 5).map(p => ({ player: p, teamName: p.teamName }));
    }
    
    return races;
};

export const generateWeeklyInbox = (gameState: GameState): InboxMessage[] => {
    const { week, season, teams, myTeamId, staff } = gameState;
    if (!myTeamId || gameState.isOffseason) return [];

    const messages: InboxMessage[] = [];
    const myTeam = teams.find(t => t.id === myTeamId)!;
    const nextOpponentId = findNextOpponentId(gameState);
    
    // Message from coordinator about next opponent
    if (nextOpponentId) {
        const opponent = teams.find(t => t.id === nextOpponentId)!;
        const report = generateScoutingReport(opponent);
        const dc = staff.find(s => s.type === 'DC');
        if (dc) {
            messages.push({
                id: crypto.randomUUID(), week, season, from: `DC ${dc.name}`, subject: `Scouting: ${opponent.name}'s Offense`,
                body: `Coach, their strength is their ${report.strengths[0] || 'passing game'}. We should prepare our secondary. They struggle with their ${report.weaknesses[0] || 'run blocking'}. Let's exploit that.`, read: false
            });
        }
    }

    // Message from trainer about injuries
    const trainer = staff.find(s => s.type === 'Trainer');
    if (trainer) {
        const injuredPlayers = myTeam.roster.filter(p => p.isInjured > 0);
        if (injuredPlayers.length > 0) {
            const player = injuredPlayers[0];
            messages.push({
                id: crypto.randomUUID(), week, season, from: `Trainer ${trainer.name}`, subject: 'Injury Update',
                body: `${player.name} is recovering well. He should be back in ${player.isInjured} game(s).`, read: false
            });
        } else if (Math.random() > 0.7) {
            messages.push({
                 id: crypto.randomUUID(), week, season, from: `Trainer ${trainer.name}`, subject: 'All Clear',
                body: `Good news, coach. No new injuries to report after last week's game. Everyone is healthy.`, read: false
            });
        }
    }

    // Message from a player
    const randomPlayer = choice(myTeam.roster);
    if (randomPlayer.morale < 60 && Math.random() > 0.5) {
        messages.push({
            id: crypto.randomUUID(), week, season, from: randomPlayer.name, subject: 'Feeling down',
            body: `Coach, I haven't been feeling like myself lately. I'm not sure what it is, but my head's not in the game.`, read: false
        });
    } else if (randomPlayer.morale > 90 && Math.random() > 0.5) {
        messages.push({
            id: crypto.randomUUID(), week, season, from: randomPlayer.name, subject: 'Ready to go!',
            body: `Coach, I feel incredible! Ready to go out there and leave it all on the field this week!`, read: false
        });
    }
    
    return messages;
};
