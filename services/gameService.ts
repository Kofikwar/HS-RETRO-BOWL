

import { Game, Player, Position, Team, GameState, GameStrategy, PlayerStats, Recruit, PlayoffMatchup, SeasonAwards, OffensivePlaybook, DefensivePlaybook, Trophy, ActiveGameState, OffensivePlay, PlayOutcome, StatEvent } from '../types';
import { POWERHOUSE_TEAMS, OTHER_TEAM_NAMES, FIRST_NAMES, LAST_NAMES, MAX_SEASONS } from '../constants';

const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const choice = <T,>(arr: T[]): T => arr[rand(0, arr.length - 1)];

const generateName = () => `${choice(FIRST_NAMES)} ${choice(LAST_NAMES)}`;
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
    sponsors: [],
    inbox: [],
    coaches: { OC: null, DC: null, ST: null },
    forceWinNextGame: false,
    myStrategy: { offense: 'Balanced', defense: '4-3 Defense' },
    trophyCase: [],
    recruitingPoints: 0,
    activeGame: null,
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
        const scheduledOpponents = new Set<number>();

        for (let week = 1; week <= 9; week++) {
            let opponentId: number;
            
            // Find an opponent who also needs a game this week
            let availableOpponents = potentialOpponents.filter(id => 
                !scheduledOpponents.has(id) && 
                schedules[id].every(g => g.week !== week)
            );
            
            if (availableOpponents.length === 0) {
                 // Fallback if we get stuck, less than ideal but prevents infinite loops
                 const allPossible = teamIds.filter(id => id !== teamId && schedules[id].every(g => g.week !== week));
                 if (allPossible.length === 0) continue;
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

    let passYds = 0, passTDs = 0, rushYds = 0, rushTDs = 0, recYds = 0, recTDs = 0;
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
    
    if (receivers.length > 0) {
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
    forceWin: boolean
): { didWin: boolean, result: NonNullable<Game['result']> } => {
    
    const myOffenseOVR = (getPositionGroupOVR(myTeam.roster, ['QB', 'RB', 'WR', 'TE']) + getPositionGroupOVR(myTeam.roster, ['OL'])) / 2;
    const myDefenseOVR = (getPositionGroupOVR(myTeam.roster, ['DL', 'LB']) + getPositionGroupOVR(myTeam.roster, ['DB'])) / 2;
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
    }

    const summary = `${myScore} - ${opponentScore}`;
    const didWin = myScore > opponentScore;

    const myPlayerStats = generateFullGameStats(myTeam, myScore);
    myTeam.roster.forEach(p => { if (myPlayerStats[p.id]) myPlayerStats[p.id]!.gamesPlayed = 1; });

    const opponentPlayerStats = generateFullGameStats(opponent, opponentScore);
    opponent.roster.forEach(p => { if (opponentPlayerStats[p.id]) opponentPlayerStats[p.id]!.gamesPlayed = 1; });

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

export const applyGameResults = (myTeam: Team, opponent: Team, gameResult: ReturnType<typeof simulateGame>, schedule: GameState['schedule']) => {
    const { result, didWin } = gameResult;
    if (didWin) myTeam.record.wins++; else myTeam.record.losses++;
    if (!didWin) opponent.record.wins++; else opponent.record.losses++;
    
    const week = myTeam.record.wins + myTeam.record.losses;
    
    const updateScheduleForTeam = (teamId: number, oppId: number, score: number, oppScore: number, playerStats: { myTeam: Record<string, Partial<PlayerStats>>, opponentTeam: Record<string, Partial<PlayerStats>>}) => {
         const game = schedule[teamId]?.find(g => g.week === week && g.opponentId === oppId);
         if (game) {
             game.result = { ...result, myScore: score, opponentScore: oppScore, playerStats };
         }
    };
    updateScheduleForTeam(myTeam.id, opponent.id, result.myScore, result.opponentScore, result.playerStats);
    updateScheduleForTeam(opponent.id, myTeam.id, result.opponentScore, result.myScore, { myTeam: result.playerStats.opponentTeam, opponentTeam: result.playerStats.myTeam});

    const applyStatsToRoster = (roster: Player[], stats: Record<string, Partial<PlayerStats>>) => {
        roster.forEach(p => {
             const gameStats = stats[p.id];
             if (gameStats?.gamesPlayed) {
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


    myTeam.roster.forEach(p => {
        p.currentStamina = Math.max(0, p.currentStamina - rand(20, 40));
        p.morale = Math.max(0, Math.min(100, p.morale + (didWin ? rand(1, 5) : rand(-5, -1))));
        if (rand(1, 100) > 95) p.isInjured = rand(1, 4);
    });

    myTeam.ovr = calculateTeamOVR(myTeam.roster);
    opponent.ovr = calculateTeamOVR(opponent.roster);
};


export const simulateOtherGames = (gameState: GameState) => {
    const teamsPlayedThisWeek = new Set<number>();
    if (gameState.myTeamId) {
        teamsPlayedThisWeek.add(gameState.myTeamId);
        const myGame = gameState.schedule[gameState.myTeamId].find(g => g.week === gameState.week);
        if (myGame) teamsPlayedThisWeek.add(myGame.opponentId);
    }
    
    for (const team of gameState.teams) {
        if (teamsPlayedThisWeek.has(team.id)) continue;

        const game = gameState.schedule[team.id]?.find(g => g.week === gameState.week);
        if (!game || teamsPlayedThisWeek.has(game.opponentId)) continue;
        
        const opponent = gameState.teams.find(t => t.id === game.opponentId)!;
        
        const result = simulateGame(team, opponent, {offense: 'Balanced', defense: '4-3 Defense'}, {offense: 'Balanced', defense: '4-3 Defense'}, { coaching: {level:1, cost: 0}, training: {level:1, cost:0}, rehab: {level:1, cost:0}}, {level:1, cost:0}, game.weather || 'Sunny', false);
        
        applyGameResults(team, opponent, result, gameState.schedule);

        teamsPlayedThisWeek.add(team.id);
        teamsPlayedThisWeek.add(opponent.id);
    }
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

    return sortedTeams.slice(0, 25).map((team, index) => ({ teamId: team.id, rank: index + 1 }));
};


export const updatePlayoffBracket = (gameState: GameState, myTeamId: number, opponentId: number, didIWin: boolean): boolean => {
    if (!gameState.playoffBracket) {
        const top8 = gameState.nationalRankings.slice(0, 8).map(r => r.teamId);
        if (!top8.includes(myTeamId)) return true; // Eliminated if not in top 8

        gameState.playoffBracket = [{
            round: 1,
            matchups: [
                { team1Id: top8[0], team2Id: top8[7] }, { team1Id: top8[3], team2Id: top8[4] },
                { team1Id: top8[2], team2Id: top8[5] }, { team1Id: top8[1], team2Id: top8[6] },
            ]
        }];
        return false;
    }

    const currentRoundIndex = gameState.week - 11;
    const roundData = gameState.playoffBracket[currentRoundIndex];
    if (!roundData) return true;

    const myMatch = roundData.matchups.find(m => m.team1Id === myTeamId || m.team2Id === myTeamId);
    if (!myMatch) return true;

    myMatch.winnerId = didIWin ? myTeamId : opponentId;
    
    if (currentRoundIndex < 2) {
        const winners = roundData.matchups.map(m => m.winnerId!);
        const nextRoundMatchups: PlayoffMatchup[] = [];
        for (let i = 0; i < winners.length; i += 2) {
            nextRoundMatchups.push({ team1Id: winners[i], team2Id: winners[i+1] });
        }
        gameState.playoffBracket.push({ round: currentRoundIndex + 2, matchups: nextRoundMatchups });
    }

    return !didIWin;
};

export const getNationalLeaders = (teams: Team[]): Record<string, Player[]> => {
    const allPlayers = teams.flatMap(t => t.roster);
    const leaders: Record<string, Player[]> = {};
    const statCategories: (keyof PlayerStats)[] = ['passYds', 'passTDs', 'rushYds', 'rushTDs', 'recYds', 'recTDs', 'tackles', 'sacks', 'ints'];

    for (const key of statCategories) {
        leaders[key] = [...allPlayers]
            .filter(p => p.seasonStats[key] > 0)
            .sort((a, b) => (b.seasonStats[key] || 0) - (a.seasonStats[key] || 0))
            .slice(0, 10);
    }
    return leaders;
};


export const calculateSeasonAwards = (gameState: GameState): SeasonAwards => {
    const allPlayers = gameState.teams.flatMap(t => t.roster);
    const getBest = (position: Position | Position[], stat: keyof PlayerStats) => 
        allPlayers.filter(p => Array.isArray(position) ? position.includes(p.position) : p.position === position)
            .sort((a, b) => (b.seasonStats[stat] || 0) - (a.seasonStats[stat] || 0))[0] || null;

    const bestQB = getBest('QB', 'passYds');
    const bestRB = getBest('RB', 'rushYds');
    const bestWR = getBest('WR', 'recYds');
    const mvpCandidates = [bestQB, bestRB, bestWR].filter(Boolean) as Player[];
    const mvp = mvpCandidates.sort((a, b) => ((b.seasonStats.passTDs || 0) + (b.seasonStats.rushTDs || 0) + (b.seasonStats.recTDs || 0)) - ((a.seasonStats.passTDs || 0) + (a.seasonStats.rushTDs || 0) + (a.seasonStats.recTDs || 0)))[0] || null;

    return {
        mvp, allAmerican: [],
        bestQB, bestRB, bestWR,
        bestTE: getBest('TE', 'recYds'),
        bestOL: null,
        bestDL: getBest(['DL', 'LB'], 'sacks'),
        bestLB: getBest(['DL', 'LB', 'DB'], 'tackles'),
        bestDB: getBest('DB', 'ints'),
        bestKP: null,
    };
};

export const logAwardsToTrophyCase = (gameState: GameState): Trophy[] => {
    const newTrophies: Trophy[] = [];
    const myPlayers = gameState.teams.find(t => t.id === gameState.myTeamId)!.roster;
    
    const checkAndAdd = (awardName: string, player: Player | null) => {
        if(player && myPlayers.some(p => p.id === player.id)) {
            newTrophies.push({ season: gameState.season, award: awardName, playerName: player.name, playerId: player.id });
        }
    };

    checkAndAdd('National MVP', gameState.seasonAwards.mvp);
    checkAndAdd('Best QB', gameState.seasonAwards.bestQB);
    checkAndAdd('Best RB', gameState.seasonAwards.bestRB);
    checkAndAdd('Best WR', gameState.seasonAwards.bestWR);

    return [...gameState.trophyCase, ...newTrophies];
}

const generateRecruits = (count: number): Recruit[] => {
    const recruits: Recruit[] = [];
    const positions: Position[] = ['QB', 'RB', 'WR', 'TE', 'OL', 'DL', 'LB', 'DB', 'K/P'];
    for(let i = 0; i < count; i++) {
        const position = choice(positions);
        const attributes = generateAttributes(position);
        const cost = 10 + Math.floor(Math.pow(attributes.OVR - 50, 2) / 20) + Math.floor(Math.pow(attributes.Potential - 50, 2) / 20);
        recruits.push({
            id: crypto.randomUUID(),
            name: generateName(),
            position,
            attributes,
            cost: Math.max(10, cost)
        });
    }
    return recruits;
};

export const startOffseason = (gameState: GameState): GameState => {
    const myTeam = gameState.teams.find(t => t.id === gameState.myTeamId)!;
    const wins = myTeam.record.wins;
    const recruitingPoints = 50 + (wins * 10) + (gameState.fanHappiness / 10);

    return {
        ...gameState,
        isOffseason: true,
        seasonAwards: calculateSeasonAwards(gameState),
        trophyCase: logAwardsToTrophyCase(gameState),
        recruits: generateRecruits(50),
        recruitingPoints: Math.round(recruitingPoints)
    };
}

export const advanceToNextSeason = (gameState: GameState, signedRecruits: Recruit[]): GameState => {
    const yearMap: Record<Player['year'], Player['year']> = { 'FR': 'SO', 'SO': 'JR', 'JR': 'SR', 'SR': 'SR' };

    gameState.teams.forEach(team => {
        let roster = team.roster.filter(p => p.year !== 'SR').map(p => {
            // Player development logic
            const developmentChance = (p.attributes.Potential / 150) + (gameState.facilities.coaching.level / 50);
            if (Math.random() < developmentChance) {
                const potentialAttributes = Object.keys(p.attributes).filter(a => !['OVR', 'Potential', 'Consistency', 'Stamina'].includes(a)) as (keyof Player['attributes'])[];
                const attrToImprove = choice(potentialAttributes);
                const improvement = rand(1, 3);
                if (typeof p.attributes[attrToImprove] === 'number') {
                    (p.attributes[attrToImprove] as number) = Math.min(99, (p.attributes[attrToImprove] as number) + improvement);
                }
            }
            
            const total = Object.entries(p.attributes).reduce((sum, [key, value]) => key !== 'OVR' ? sum + (value as number) : sum, 0);
            p.attributes.OVR = Math.round(total / (Object.keys(p.attributes).length - 1));

            p.year = yearMap[p.year];
            p.seasonStats = initialStats();
            p.isInjured = 0;
            p.currentStamina = 100;
            return p;
        });

        if (team.id === gameState.myTeamId) {
            signedRecruits.forEach(recruit => {
                roster.push({
                    ...recruit,
                    year: 'FR',
                    seasonStats: initialStats(),
                    careerStats: initialStats(),
                    isInjured: 0,
                    morale: rand(70, 90),
                    currentStamina: 100,
                });
            });
            team.roster = roster;
        } else {
             // Simple refill roster for NPCs
            while(roster.length < 35) {
                roster.push(generatePlayer(choice(['QB', 'RB', 'WR', 'TE', 'OL', 'DL', 'LB', 'DB']), 'FR'));
            }
             team.roster = roster;
        }

        team.record = { wins: 0, losses: 0 };
        team.ovr = calculateTeamOVR(team.roster);
    });
    
    return {
        ...gameState,
        season: gameState.season + 1,
        week: 1,
        isOffseason: false,
        schedule: generateAllSchedules(gameState.teams),
        playoffBracket: null,
        nationalRankings: updateRankings(gameState.teams),
        recruits: [],
        recruitingPoints: 0,
        activeGame: null,
    };
};

// --- PLAYABLE GAME LOGIC ---

export const simulatePlay = (attackingTeam: Team, defendingTeam: Team, playType: OffensivePlay, yardLine: number): PlayOutcome => {
    const getPlayer = (roster: Player[], pos: Position | Position[]) => {
        const positions = Array.isArray(pos) ? pos : [pos];
        const players = roster
            .filter(p => positions.includes(p.position) && p.isInjured === 0)
            .sort((a,b) => b.attributes.OVR - a.attributes.OVR);
        return players.length > 0 ? players[0] : null;
    }

    const attackingOVR = calculateTeamOVR(attackingTeam.roster);
    const defendingOVR = calculateTeamOVR(defendingTeam.roster);

    let description = '';
    let yards = 0;
    let isTurnover = false;
    let isComplete = true;
    let successChance = 50 + (attackingOVR - defendingOVR) * 1.5;
    const statEvents: StatEvent[] = [];

    const qb = getPlayer(attackingTeam.roster, 'QB');
    const rb = getPlayer(attackingTeam.roster, 'RB');
    const wr = getPlayer(attackingTeam.roster, ['WR', 'TE']);
    
    const addTDs = (gainedYards: number, passer: Player | null, receiverOrRusher: Player | null, isPass: boolean) => {
        if (gainedYards + yardLine >= 100) {
            if (isPass && passer && receiverOrRusher) {
                 statEvents.push({ playerId: passer.id, stat: 'passTDs', value: 1 });
                 statEvents.push({ playerId: receiverOrRusher.id, stat: 'recTDs', value: 1 });
            } else if (!isPass && receiverOrRusher) {
                 statEvents.push({ playerId: receiverOrRusher.id, stat: 'rushTDs', value: 1 });
            }
        }
    };

    const handleRunPlay = (baseYards: [number, number], successMod: number, name: string) => {
        successChance += successMod;
        if (rand(1, 100) < successChance) {
            yards = rand(baseYards[0], baseYards[1]);
            description = `${name} to ${rb?.name} for ${yards} yards.`;
        } else {
            yards = rand(-3, 1);
            description = `The defense stuffs ${rb?.name}! A gain of ${yards}.`;
        }
        if (rb) {
            statEvents.push({ playerId: rb.id, stat: 'rushYds', value: yards });
            addTDs(yards, null, rb, false);
        }
        if (rand(1, 100) > 98) { isTurnover = true; description += ' FUMBLE! The defense recovers!'; }
    };
    
    const handlePassPlay = (baseYards: [number, number], successMod: number, name: string) => {
        successChance += successMod;
        const receiver = ['Screen Pass', 'Draw Play'].includes(playType) ? rb : wr;
        if (rand(1, 100) < successChance) {
            yards = rand(baseYards[0], baseYards[1]);
            description = `${name} from ${qb?.name} to ${receiver?.name} is complete for ${yards} yards.`;
            if (qb && receiver) {
                statEvents.push({playerId: qb.id, stat: 'passYds', value: yards});
                statEvents.push({playerId: receiver.id, stat: 'recYds', value: yards});
                addTDs(yards, qb, receiver, true);
            }
        } else {
            isComplete = false; yards = 0; description = 'The pass is incomplete.';
        }
        if (rand(1, 100) > (96 - successMod / 5) && isComplete) {
            isTurnover = true; isComplete = false; description = 'INTERCEPTED! The defense made a great play!';
            const defender = getPlayer(defendingTeam.roster, ['DB', 'LB']);
            if (defender) statEvents.push({ playerId: defender.id, stat: 'ints', value: 1 });
        }
    };

    switch (playType) {
        case 'Inside Run': handleRunPlay([2, 6], 15, 'Hand off up the middle'); break;
        case 'Outside Run': handleRunPlay([3, 12], -5, 'Toss to the outside'); break;
        case 'Power Run': handleRunPlay([1, 5], 25, 'Power run'); break;
        case 'Draw Play': handleRunPlay([0, 10], -10, 'Draw play fools the defense'); break;
        case 'Slant': handlePassPlay([4, 12], 5, 'Quick slant'); break;
        case 'Screen Pass': handlePassPlay([-3, 25], -10, 'A screen pass'); break;
        case 'Post': handlePassPlay([15, 50], -25, 'Deep post'); break;
        case 'Play Action': handlePassPlay([10, 30], -20, 'Play action pass'); break;
        case 'Hail Mary': handlePassPlay([25, 70], -50, 'A desperate Hail Mary'); break;
    }
    
    return { description, yards, isTurnover, isTouchdown: yardLine + yards >= 100, isComplete, statEvents };
};

export const simulateOpponentDrive = (myTeam: Team, opponent: Team): { description: string, score: number, timeElapsed: number } => {
    const myDefenseOVR = (getPositionGroupOVR(myTeam.roster, ['DL', 'LB']) + getPositionGroupOVR(myTeam.roster, ['DB'])) / 2;
    const oppOffenseOVR = (getPositionGroupOVR(opponent.roster, ['QB', 'RB', 'WR', 'TE']) + getPositionGroupOVR(opponent.roster, ['OL'])) / 2;

    const outcomeChance = rand(1, 100) + (oppOffenseOVR - myDefenseOVR) * 1.5;
    const timeElapsed = rand(90, 240); // 1:30 to 4:00

    if (outcomeChance > 80) { // Touchdown
        return { description: `${opponent.name} marched down the field and scored a TOUCHDOWN.`, score: 7, timeElapsed };
    } else if (outcomeChance > 60) { // Field Goal
        return { description: `${opponent.name} drove into range and kicked a FIELD GOAL.`, score: 3, timeElapsed };
    } else if (outcomeChance > 30) { // Punt
        return { description: `${opponent.name}'s drive stalled, and they were forced to punt.`, score: 0, timeElapsed };
    } else { // Turnover
        return { description: `A big play by your defense! They forced a turnover!`, score: 0, timeElapsed };
    }
};

export const skipGameSimulation = (gameState: GameState): ActiveGameState => {
    if (!gameState.activeGame) return null!;

    const myTeam = gameState.teams.find(t => t.id === gameState.myTeamId)!;
    const opponent = gameState.teams.find(t => t.id === gameState.activeGame.opponentId)!;
    const game = gameState.schedule[myTeam.id]?.find(g => g.week === gameState.week);

    const simulationResult = simulateGame(
        myTeam,
        opponent,
        gameState.myStrategy,
        { offense: 'Balanced', defense: '4-3 Defense' }, 
        gameState.facilities,
        { level: 1, cost: 0 }, 
        game?.weather || 'Sunny',
        gameState.forceWinNextGame
    );
    
    const { myScore, opponentScore } = simulationResult.result;

    return {
        ...gameState.activeGame,
        playerScore: myScore,
        opponentScore: opponentScore,
        quarter: 4,
        time: 0,
        isGameOver: true,
        playLog: [...gameState.activeGame.playLog, `The rest of the game was simulated. Final score: ${myScore}-${opponentScore}`]
    };
};

export const applyPlayableGameResults = (gameState: GameState, activeGame: ActiveGameState, gameStats: Record<string, Partial<PlayerStats>>): GameState => {
    const myTeam = gameState.teams.find(t => t.id === gameState.myTeamId)!;
    const opponent = gameState.teams.find(t => t.id === activeGame.opponentId)!;

    myTeam.roster.forEach(p => {
        if (gameStats[p.id]) gameStats[p.id].gamesPlayed = 1;
    });

    const didWin = activeGame.playerScore > activeGame.opponentScore;
    const gameResult: ReturnType<typeof simulateGame> = {
        didWin,
        result: {
            myScore: activeGame.playerScore,
            opponentScore: activeGame.opponentScore,
            opponentId: opponent.id,
            summary: `${activeGame.playerScore} - ${activeGame.opponentScore}`,
            playerStats: { myTeam: gameStats, opponentTeam: {} }
        }
    };

    applyGameResults(myTeam, opponent, gameResult, gameState.schedule);

    let updatedState = { ...gameState, lastGameResult: gameResult.result };
    
    simulateOtherGames(updatedState);

    if (updatedState.week < 13) updatedState.week++;
    
    myTeam.roster.forEach(p => {
        const recoveryRate = 10 + (updatedState.facilities.training.level * 3);
        p.currentStamina = Math.min(100, p.currentStamina + recoveryRate);
    });
    
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
         updatedState = startOffseason(updatedState);
    }

    return { ...updatedState, forceWinNextGame: false, activeGame: null };
};