import { GoogleGenAI, Type } from '@google/genai';
import { Game, Player, Position, Team, GameState, GameStrategy, PlayerStats, Recruit, PlayoffMatchup, SeasonAwards, OffensivePlaybook, DefensivePlaybook, Trophy, ActiveGameState, OffensivePlay, PlayOutcome, StatEvent, TrainingProgram, Staff, Sponsor, InboxMessage, PlayerTrait, Coach, GodModeState, HallOfFameInductee, PlayerHOFDetails, CoachHOFDetails, TeamHOFDetails, CoachSkillTree, WVClass, PlayerGoal, ScoutingReport, TrainingFocus, NewsArticle, CollegeOffer, PlayoffBracket, CustomPlaybook, CareerSummary, CustomOffensivePlay, CustomDefensivePlay, CollegeGameState, CollegeTeam } from '../types';
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

export const calculatePlayerOvr = (attributes: Player['attributes']): number => {
    // Make sure all attributes are numbers, default to a baseline if not
    const getAttr = (key: keyof Omit<Player['attributes'], 'OVR'>) => Number(attributes[key]) || 60;

    const weights: Record<keyof Omit<Player['attributes'], 'OVR'>, number> = {
        Speed: 0.15, Strength: 0.1, Stamina: 0.05, Tackle: 0.1, Catch: 0.1, Pass: 0.1, Block: 0.1, Consistency: 0.2, Potential: 0.1
    };
    const ovr = Object.entries(weights).reduce((acc, [key, weight]) => {
        return acc + (getAttr(key as keyof typeof weights) * weight);
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

const generateNewsArticle = (gameState: GameState, type: 'GAME_RESULT' | 'UPSET' | 'OFFER' | 'AWARD' | 'COMMITMENT' | 'PLAYER_OF_WEEK' | 'RANKING', data: any): NewsArticle | null => {
    let headline = '', body = '', articleType: NewsArticle['type'] = 'GENERAL', relatedId: string | number | undefined;

    switch(type) {
        case 'GAME_RESULT': {
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
            if (winner.id === gameState.myTeamId || loser.id === gameState.myTeamId) {
                articleType = 'TEAM_FOCUS';
                relatedId = gameState.myTeamId!;
            }
            break;
        }
        case 'UPSET': {
            const { underdog, favorite, uScore, fScore } = data;
            headline = `STUNNER! ${underdog.name} Upsets ${favorite.name}, ${uScore}-${fScore}`;
            body = `In the biggest shock of the week, the ${underdog.name} pulled off an incredible upset against the heavily favored ${favorite.name}.`;
             if (underdog.id === gameState.myTeamId || favorite.id === gameState.myTeamId) {
                articleType = 'TEAM_FOCUS';
                relatedId = gameState.myTeamId!;
            }
            break;
        }
        case 'OFFER': {
            const { player, collegeName, tier } = data;
            headline = `${collegeName} (${tier}) Offers Scholarship to ${player.name}`;
            body = `Recruiting news is heating up as ${collegeName}, a prestigious ${tier} program, has officially extended a scholarship offer to star player ${player.name}. Scouts have been watching closely all season after another impressive performance.`;
            if (player.id === gameState.myPlayerId) {
                articleType = 'PLAYER_FOCUS';
                relatedId = player.id;
            }
            break;
        }
        case 'COMMITMENT': {
            const { committedPlayerName, committedPlayerId, committedCollegeName } = data;
            headline = `Star Player ${committedPlayerName} Commits to ${committedCollegeName}!`;
            body = `Ending weeks of speculation, high school standout ${committedPlayerName} has officially announced their commitment to ${committedCollegeName}. This is a huge pickup for their next recruiting class.`;
            if (committedPlayerId === gameState.myPlayerId) {
                articleType = 'PLAYER_FOCUS';
                relatedId = committedPlayerId;
            }
            break;
        }
        case 'PLAYER_OF_WEEK': {
            const { player, teamName, statLine } = data;
            headline = `${player.name} (${teamName}) Named Player of the Week`;
            body = `After an incredible performance in Week ${gameState.week - 1}, ${player.position} ${player.name} has been named the Player of the Week. ${player.name} put up staggering numbers: ${statLine}.`;
            if (player.id === gameState.myPlayerId) {
                articleType = 'PLAYER_FOCUS';
                relatedId = player.id;
            }
            break;
        }
        case 'RANKING': {
            const { teamName, newRank, oldRank } = data;
            const movement = newRank < oldRank ? 'climbs' : 'falls';
            headline = `${teamName} ${movement} in State Rankings`;
            body = `Following their Week ${gameState.week} performance, ${teamName} has moved from #${oldRank} to #${newRank} in the latest state-wide rankings.`;
            if (data.teamId === gameState.myTeamId) {
                articleType = 'TEAM_FOCUS';
                relatedId = data.teamId;
            }
            break;
        }
        default:
            return null;
    }
    return { id: crypto.randomUUID(), week: gameState.week, season: gameState.season, headline, body, type: articleType, relatedId };
}

export const ALL_COLLEGES: Omit<CollegeOffer, 'id'>[] = [
    // D1-FBS
    { collegeName: "WVU", tier: 'D1-FBS', prestige: 85 },
    { collegeName: "Marshall", tier: 'D1-FBS', prestige: 80 },
    { collegeName: "Ohio State", tier: 'D1-FBS', prestige: 99 },
    { collegeName: "Penn State", tier: 'D1-FBS', prestige: 95 },
    { collegeName: "Virginia Tech", tier: 'D1-FBS', prestige: 88 },
    { collegeName: "Pitt", tier: 'D1-FBS', prestige: 82 },
    { collegeName: "Alabama", tier: 'D1-FBS', prestige: 100 },
    { collegeName: "Clemson", tier: 'D1-FBS', prestige: 96 },
    // D1-FCS
    { collegeName: "James Madison", tier: 'D1-FCS', prestige: 75 },
    { collegeName: "Youngstown State", tier: 'D1-FCS', prestige: 70 },
    // D2
    { collegeName: "Shepherd", tier: 'D2', prestige: 65 },
    { collegeName: "Charleston (WV)", tier: 'D2', prestige: 60 },
    { collegeName: "Fairmont State", tier: 'D2', prestige: 58 },
    // D3
    { collegeName: "Washington & Jefferson", tier: 'D3', prestige: 50 },
    { collegeName: "Marietta College", tier: 'D3', prestige: 45 },
    // JUCO
    { collegeName: "East Mississippi CC", tier: 'JUCO', prestige: 40 },
    { collegeName: "Garden City CC", tier: 'JUCO', prestige: 35 },
];

const getPlayerStatScore = (player: Player): number => {
    const { seasonStats, position } = player;
    switch(position) {
        case 'QB': return (seasonStats.passYds / 100) + (seasonStats.passTDs * 20) + (seasonStats.rushYds / 100);
        case 'RB': return (seasonStats.rushYds / 50) + (seasonStats.rushTDs * 20) + (seasonStats.recYds / 50);
        case 'WR':
        case 'TE': return (seasonStats.recYds / 50) + (seasonStats.recTDs * 20);
        case 'DL':
        case 'LB':
        case 'DB': return seasonStats.tackles + (seasonStats.sacks * 5) + (seasonStats.ints * 10);
        default: return 0;
    }
};

const checkAndGenerateOffer = (gameState: GameState): GameState => {
    if (gameState.gameMode !== 'MY_CAREER' || !gameState.myPlayerId) return gameState;

    const myTeam = gameState.teams.find(t => t.id === gameState.myTeamId);
    const player = myTeam?.roster.find(p => p.id === gameState.myPlayerId);

    if (!player || (player.year !== 'JR' && player.year !== 'SR') || gameState.committedCollege) return gameState;

    const statScore = getPlayerStatScore(player);
    const recruitingScore = player.attributes.OVR + (player.attributes.Potential / 10) + (statScore / 10);

    const existingOffers = new Set(gameState.collegeOffers.map(o => o.collegeName));

    ALL_COLLEGES.forEach(college => {
        if (existingOffers.has(college.collegeName)) return;

        // Base chance is higher if player is much better than the school's prestige level
        let offerChance = Math.max(0, recruitingScore - college.prestige + 5);
        
        // Bonus if the school is in the player's top 5
        if (gameState.top5Colleges?.some(c => c.collegeName === college.collegeName)) {
            offerChance += 25; // Significant bonus
        }

        if (rand(1, 200) <= offerChance) { // Use a wider rand range to make it less frequent per-college
            const newOffer: CollegeOffer = {
                id: crypto.randomUUID(),
                collegeName: college.collegeName,
                tier: college.tier,
                prestige: college.prestige
            };
            gameState.collegeOffers.push(newOffer);
            
            gameState.inbox.push({
                id: crypto.randomUUID(),
                week: gameState.week,
                season: gameState.season,
                from: `${college.collegeName} Recruiting`,
                subject: `Scholarship Offer`,
                body: `Congratulations, ${player.name}. We've been impressed with your performance and would like to officially offer you a scholarship to play for ${college.collegeName}.`,
                read: false,
                type: 'PLAYER_OFFER'
            });

            const article = generateNewsArticle(gameState, 'OFFER', { player, collegeName: college.collegeName, tier: college.tier });
            if(article) gameState.news.push(article);
        }
    });

    return gameState;
};

const checkMyCareerGoals = (gameState: GameState): GameState => {
    // Stub for checking MyCareer goals
    return gameState;
};


export const applyGameResults = async (gameState: GameState, team1Id: number, team2Id: number, team1Score: number, team2Score: number, playerStats: Game['result']['playerStats'], isRivalry: boolean, playLog: string[], level: 'VARSITY' | 'JV' = 'VARSITY'): Promise<GameState> => {
    const isTeam1Win = team1Score > team2Score;
    const winnerId = isTeam1Win ? team1Id : team2Id;
    const loserId = isTeam1Win ? team2Id : team1Id;
    
    const winner = gameState.teams.find(t => t.id === winnerId);
    const loser = gameState.teams.find(t => t.id === loserId);

    if (!winner || !loser) {
        console.error("Could not find winner or loser team in applyGameResults");
        return gameState;
    }
    
    // Update team chemistry
    const team1 = gameState.teams.find(t => t.id === team1Id);
    const team2 = gameState.teams.find(t => t.id === team2Id);
    if(team1) team1.chemistry = Math.max(0, Math.min(100, team1.chemistry + (isTeam1Win ? rand(2, 5) : -rand(2,5))));
    if(team2) team2.chemistry = Math.max(0, Math.min(100, team2.chemistry + (!isTeam1Win ? rand(2, 5) : -rand(2,5))));


    const schedule = level === 'VARSITY' ? gameState.schedule : gameState.jvSchedule;

    if (level === 'VARSITY') {
        winner.record.wins++;
        loser.record.losses++;
    }

    let recap: string;
    const isUserGame = (team1Id === gameState.myTeamId || team2Id === gameState.myTeamId) && level === 'VARSITY';

    if (ai && isUserGame) {
      try {
        const winnerScore = isTeam1Win ? team1Score : team2Score;
        const loserScore = isTeam1Win ? team2Score : team1Score;
        const prompt = `Write a short, one-paragraph newspaper-style game recap for a high school football game where the ${winner.name} beat the ${loser.name} with a score of ${winnerScore} to ${loserScore}. Mention the key to victory.`;
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        recap = response.text;
      } catch (e: any) {
        // FIX: Check for rate limit errors (429) and suppress the console error if found.
        if (e.message && e.message.includes('"code":429')) {
            console.log("AI recap generation skipped due to rate limit.");
        } else {
            console.error("AI recap generation failed", e);
        }
        recap = "A hard-fought game."; // Fallback
      }
    } else {
        // Fast, template-based recap for non-user games
        const scoreDiff = Math.abs(team1Score - team2Score);
        if (isRivalry) {
             recap = `${winner.name} claims bragging rights over ${loser.name} in a heated rivalry matchup.`;
        } else if (scoreDiff > 28) {
            recap = `${winner.name} dominated ${loser.name} from start to finish in a blowout victory.`;
        } else if (scoreDiff < 8) {
             recap = `It was a nail-biter, but ${winner.name} managed to edge out ${loser.name} in a close contest.`;
        } else {
            recap = `${winner.name} secured a convincing win over ${loser.name}.`;
        }
    }


    const gameForTeam1 = schedule[team1Id]?.find(g => g.week === gameState.week && g.opponentId === team2Id);
    if (gameForTeam1) {
        gameForTeam1.result = { myScore: team1Score, opponentScore: team2Score, opponentId: team2Id, summary: "Game Played", playerStats, recap, playLog };
    }

    const gameForTeam2 = schedule[team2Id]?.find(g => g.week === gameState.week && g.opponentId === team1Id);
    if (gameForTeam2) {
        gameForTeam2.result = { myScore: team2Score, opponentScore: team1Score, opponentId: team1Id, summary: "Game Played", playerStats: { myTeam: playerStats.opponentTeam, opponentTeam: playerStats.myTeam }, recap, playLog };
    }
    
    // Update playoff brackets with winner
    if (level === 'VARSITY' && gameState.week >= 11) {
        const gameForWinner = gameState.schedule[winnerId]?.find(g => g.week === gameState.week && g.opponentId === loserId);
        if (gameForWinner?.playoffRound && (gameState.playoffBracket || gameState.tocBracket)) {
            const winnerTeam = gameState.teams.find(t => t.id === winnerId)!;
            const bracketForClass = gameState.playoffBracket ? gameState.playoffBracket[winnerTeam.class] : null;

            let matchup: PlayoffMatchup | null | undefined = null;
            switch(gameForWinner.playoffRound) {
                case 'Quarterfinals':
                    matchup = bracketForClass?.quarterfinals.find(m => (m.team1Id === winnerId && m.team2Id === loserId) || (m.team1Id === loserId && m.team2Id === winnerId));
                    break;
                case 'Semifinals':
                    matchup = bracketForClass?.semifinals.find(m => (m.team1Id === winnerId && m.team2Id === loserId) || (m.team1Id === loserId && m.team2Id === winnerId));
                    break;
                case 'Championship':
                    matchup = bracketForClass?.final;
                    break;
                case 'ToC Semifinal':
                case 'ToC Final':
                    // FIX: Correctly find the active ToC matchup instead of assuming it's the first.
                    matchup = gameState.tocBracket?.find(m => 
                        !m.winnerId &&
                        ((m.team1Id === winnerId && m.team2Id === loserId) || (m.team1Id === loserId && m.team2Id === winnerId))
                    );
                    break;
            }
            if (matchup) {
                matchup.winnerId = winnerId;
            }
        }
    }


    if(level === 'VARSITY' && winnerId === gameState.myTeamId) {
        gameState.coach.totalWins++;
        if (gameState.activeSponsor) {
            gameState.funds += gameState.activeSponsor.payoutPerWin;
        }
        if (isRivalry) {
            gameState.funds += 5000;
            gameState.schoolPrestige = Math.min(100, gameState.schoolPrestige + 3);
            gameState.fanHappiness = Math.min(100, gameState.fanHappiness + 5);
        }
    }
    
    if (level === 'VARSITY') {
        const isUpset = loser.ovr > winner.ovr + 5;
        let article: NewsArticle | null;
        if (isUpset) {
            article = generateNewsArticle(gameState, 'UPSET', { underdog: winner, favorite: loser, uScore: isTeam1Win ? team1Score : team2Score, fScore: isTeam1Win ? team2Score : team1Score });
        } else {
            article = generateNewsArticle(gameState, 'GAME_RESULT', { winner, loser, winnerScore: isTeam1Win ? team1Score : team2Score, loserScore: isTeam1Win ? team2Score : team1Score, isRivalry });
        }
        if(article) gameState.news.push(article);
    }

    const team1ForStats = gameState.teams.find(t => t.id === team1Id);
    const team2ForStats = gameState.teams.find(t => t.id === team2Id);

    if (team1ForStats && playerStats.myTeam) {
        for (const [playerId, stats] of Object.entries(playerStats.myTeam)) {
            const player = team1ForStats.roster.find(p => p.id === playerId);
            if (player) {
                const targetStats = level === 'VARSITY' ? player.seasonStats : player.jvSeasonStats;
                const newStats = mergeStats(targetStats, stats);
                if (level === 'VARSITY') {
                    player.seasonStats = newStats;
                } else {
                    player.jvSeasonStats = newStats;
                }
                player.careerStats = mergeStats(player.careerStats, stats);
            }
        }
    }
    if (team2ForStats && playerStats.opponentTeam) {
        for (const [playerId, stats] of Object.entries(playerStats.opponentTeam)) {
            const player = team2ForStats.roster.find(p => p.id === playerId);
            if (player) {
                const targetStats = level === 'VARSITY' ? player.seasonStats : player.jvSeasonStats;
                const newStats = mergeStats(targetStats, stats);
                 if (level === 'VARSITY') {
                    player.seasonStats = newStats;
                } else {
                    player.jvSeasonStats = newStats;
                }
                player.careerStats = mergeStats(player.careerStats, stats);
            }
        }
    }
    
    if(gameState.gameMode === 'MY_CAREER' && isUserGame) {
        gameState = checkMyCareerGoals(gameState);
        gameState = checkAndGenerateOffer(gameState);
    }


    if(gameState.myTeamId && level === 'VARSITY') {
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

const getFilteredNationalLeaders = (teams: Team[], filter: (p: Player) => boolean, statType: 'season' | 'jv'): Record<string, { player: Player, teamName: string, value: number }[]> => {
    const statsKey = statType === 'season' ? 'seasonStats' : 'jvSeasonStats';
    const allPlayers = teams.flatMap(t => t.roster.filter(filter).map(p => ({ ...p, teamName: t.name })));
    const leaders: Record<string, { player: Player, teamName: string, value: number }[]> = {};
    
    const statCategories: (keyof PlayerStats)[] = ['passYds', 'passTDs', 'rushYds', 'rushTDs', 'recYds', 'recTDs', 'tackles', 'sacks', 'ints'];
    
    statCategories.forEach(stat => {
        const sorted = allPlayers
            .filter(p => p[statsKey][stat] > 0)
            .sort((a, b) => (b[statsKey][stat] as number) - (a[statsKey][stat] as number))
            .slice(0, 5)
            .map(p => ({ player: p, teamName: p.teamName, value: p[statsKey][stat] as number }));
        leaders[stat] = sorted;
    });

    return leaders;
};


export const getNationalLeaders = (teams: Team[]): Record<string, { player: Player, teamName: string, value: number }[]> => {
    return getFilteredNationalLeaders(teams, p => p.rosterStatus === 'VARSITY', 'season');
};

export const getJVNationalLeaders = (teams: Team[]): Record<string, { player: Player, teamName: string, value: number }[]> => {
    return getFilteredNationalLeaders(teams, p => p.rosterStatus === 'JV', 'jv');
};


export const calculateAwardRaces = (teams: Team[]): Record<string, { player: Player, teamName: string }[]> => {
    const allPlayers = teams.flatMap(t => t.roster.map(p => ({ player: p, teamName: t.name })));

    const createRace = (pos: Position[], sortFn: (p: Player) => number) => {
        return allPlayers
            .filter(({ player }) => pos.includes(player.position) && player.rosterStatus === 'VARSITY')
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

export const generatePlayer = (position: Position, year: Player['year'], nameOverride?: string): Player => {
  const attributes = generateAttributes(position, year);
  const traits: PlayerTrait[] = [];
  if (rand(1, 100) <= 10) traits.push('Clutch');
  if (rand(1, 100) <= 10) traits.push('Injury Prone');
  if (rand(1, 100) <= 5) traits.push('Team Captain');
  if (position === 'RB' && rand(1, 100) <= 15) traits.push('Workhorse');

  return {
    id: crypto.randomUUID(),
    name: nameOverride || generateName(),
    position,
    year,
    attributes,
    seasonStats: initialStats(),
    jvSeasonStats: initialStats(),
    careerStats: initialStats(),
    collegeSeasonStats: initialStats(),
    collegeCareerStats: initialStats(),
    isInjured: 0,
    morale: rand(60, 85),
    currentStamina: 100,
    traits,
    gpa: rand(22, 38) / 10,
    isSuspended: 0,
    stringer: 0,
    rosterStatus: 'JV', // Default to JV, will be promoted later
    xp: 0,
    xpToNextLevel: 1000,
    skillPoints: 0,
  };
};

// --- Custom Roster for Williamstown ---
const WILLIAMSTOWN_ROSTER_RAW_DATA: { name: string; year: Player['year']; positions: Position[] }[] = [
    // 8th Graders (as Freshmen)
    { name: 'Landry Bunch', year: 'FR', positions: ['QB', 'DB'] },
    { name: 'Jaxon Holloway', year: 'FR', positions: ['WR', 'DB'] },
    { name: 'Cam Roush', year: 'FR', positions: ['RB'] },
    { name: 'Brayden Richards', year: 'FR', positions: ['TE'] },
    { name: 'Case Williams', year: 'FR', positions: ['RB'] }, // FB mapped to RB
    { name: 'Garret Nestor', year: 'FR', positions: ['OL'] },
    { name: 'Kofi Kwarteng', year: 'FR', positions: ['WR'] },
    // From Table
    { name: 'Josh Shamblin', year: 'SO', positions: ['WR', 'DB'] },
    { name: 'Jenner Burge', year: 'SR', positions: ['TE', 'LB'] },
    { name: 'Jack Moore', year: 'SO', positions: ['RB', 'LB'] },
    { name: 'Mason Kern', year: 'JR', positions: ['WR', 'LB'] },
    { name: 'Trenton Hall', year: 'SO', positions: ['WR', 'LB'] },
    { name: 'Carson Haines', year: 'SR', positions: ['WR', 'DB'] },
    { name: 'Breck Allen', year: 'SO', positions: ['QB', 'DB'] },
    { name: 'Jackson Kerr', year: 'SR', positions: ['RB', 'LB'] },
    { name: 'Owen Lefebure', year: 'FR', positions: ['QB', 'DB'] },
    { name: 'JT Amrine', year: 'SO', positions: ['WR', 'DB'] },
    { name: 'Jackson Fulton', year: 'SO', positions: ['RB', 'DB'] },
    { name: 'Tyrell Miller', year: 'SO', positions: ['WR', 'DB'] },
    { name: 'Mason Mcdonald', year: 'FR', positions: ['WR', 'DB'] },
    { name: 'Julian Williamson', year: 'FR', positions: ['RB', 'DB'] },
    { name: 'Konner Adkins', year: 'FR', positions: ['WR', 'LB'] },
    { name: 'Carter Hoops', year: 'JR', positions: ['RB', 'LB'] },
    { name: 'Jacob Maclver', year: 'SO', positions: ['RB', 'LB'] },
    { name: 'JP Strobl', year: 'FR', positions: ['RB', 'LB'] },
    { name: 'Daniel Cunningham', year: 'FR', positions: ['RB', 'DB'] },
    { name: 'Ethan Morrison', year: 'SO', positions: ['WR', 'DB'] },
    { name: 'Evan Bailey', year: 'FR', positions: ['WR', 'DL'] },
    { name: 'William Casto', year: 'FR', positions: ['TE', 'LB'] },
    { name: 'Landon Smith', year: 'FR', positions: ['WR', 'DB'] },
    { name: 'Connor Bailey', year: 'SO', positions: ['RB', 'LB'] },
    { name: 'Lincoln Knapp', year: 'FR', positions: ['TE', 'LB'] },
    { name: 'Landon Ritchie', year: 'FR', positions: ['TE', 'LB'] },
    { name: 'Myles Matheny', year: 'SR', positions: ['WR', 'LB'] },
    { name: 'Garrett Bunn', year: 'FR', positions: ['RB', 'LB'] },
    { name: 'Carson Sutton', year: 'FR', positions: ['RB', 'LB'] },
    { name: 'Miles Flanagin', year: 'JR', positions: ['OL', 'DL'] },
    { name: 'Charles Ellison', year: 'FR', positions: ['OL', 'DL'] },
    { name: 'Wyatt Ridgway', year: 'SO', positions: ['OL', 'DL'] },
    { name: 'Gage Casto', year: 'JR', positions: ['OL', 'DL'] },
    { name: 'Jacob Carsey', year: 'FR', positions: ['OL', 'DL'] },
    { name: 'Colin Jones', year: 'SO', positions: ['OL', 'LB'] },
    { name: 'Christian Hoosier', year: 'JR', positions: ['OL', 'DL'] },
    { name: 'Jaden Brooks', year: 'JR', positions: ['OL', 'LB'] },
    { name: 'Tresstin Neill', year: 'SO', positions: ['OL', 'DL'] },
    { name: 'Xavier Graeber', year: 'FR', positions: ['K/P'] },
    { name: 'Hunter Mason', year: 'FR', positions: ['OL', 'DL'] },
    { name: 'Zackary Sheppard', year: 'JR', positions: ['OL', 'DL'] },
    { name: 'Gavin Martin', year: 'SR', positions: ['OL', 'DL'] },
    { name: 'Christian Stull', year: 'SO', positions: ['OL', 'DL'] },
    { name: 'Isaac Harshbarger', year: 'FR', positions: ['OL', 'DL'] },
    { name: 'Zayden Jacobs', year: 'FR', positions: ['OL', 'DL'] },
    { name: 'Blake Brown', year: 'SR', positions: ['OL', 'DL'] },
    { name: 'Dominick Thomas', year: 'FR', positions: ['RB', 'LB'] },
    { name: 'Gabriel Gibson', year: 'FR', positions: ['TE', 'LB'] },
    { name: 'AJ Ayers', year: 'FR', positions: ['WR', 'LB'] },
];

const generateWilliamstownRoster = (): Player[] => {
    const roster: Player[] = [];
    const counts: Record<Position, number> = { 'QB':0, 'RB':0, 'WR':0, 'TE':0, 'OL':0, 'DL':0, 'LB':0, 'DB':0, 'K/P':0 };

    const data = [...WILLIAMSTOWN_ROSTER_RAW_DATA];

    data.forEach(playerData => {
        let assignedPosition: Position;
        if (playerData.positions.length === 1) {
            assignedPosition = playerData.positions[0];
        } else {
            const pos1 = playerData.positions[0];
            const pos2 = playerData.positions[1];
            if (counts[pos1] <= counts[pos2]) {
                assignedPosition = pos1;
            } else {
                assignedPosition = pos2;
            }
        }
        counts[assignedPosition]++;
        roster.push(generatePlayer(assignedPosition, playerData.year, playerData.name));
    });

    return roster;
};

export const generateRoster = (): Player[] => {
  const roster: Player[] = [];
  const years: Player['year'][] = ['FR', 'SO', 'JR', 'SR'];
  const rosterTemplate: Record<Position, number> = {
    'QB': 4, 'RB': 6, 'WR': 8, 'TE': 3, 'OL': 10, 'DL': 9,
    'LB': 8, 'DB': 9, 'K/P': 2,
  };

  for (const [pos, count] of Object.entries(rosterTemplate)) {
    for (let i = 0; i < count; i++) {
      roster.push(generatePlayer(pos as Position, choice(years)));
    }
  }
  return roster;
};

export const calculateTeamOvr = (roster: Player[]): number => {
    const varsityRoster = roster.filter(p => p.rosterStatus === 'VARSITY');
    if (varsityRoster.length === 0) return 0;
    const topPlayers = varsityRoster.sort((a, b) => b.attributes.OVR - a.attributes.OVR).slice(0, 22);
    if (topPlayers.length === 0) return 0;
    const totalOvr = topPlayers.reduce((sum, player) => sum + player.attributes.OVR, 0);
    return Math.round(totalOvr / topPlayers.length);
};

const assignRosterStatuses = (roster: Player[]): Player[] => {
    const yearOrder: Record<Player['year'], number> = { 'SR': 4, 'JR': 3, 'SO': 2, 'FR': 1 };
    roster.sort((a,b) => {
        if(yearOrder[b.year] !== yearOrder[a.year]) return yearOrder[b.year] - yearOrder[a.year];
        return b.attributes.OVR - a.attributes.OVR;
    });

    roster.forEach((player, index) => {
        player.rosterStatus = index < 44 ? 'VARSITY' : 'JV';
    });

    return roster;
};


const updateVarsityDepthCharts = (team: Team, gameState: GameState): Team => {
    const positions: Position[] = ['QB', 'RB', 'WR', 'TE', 'OL', 'DL', 'LB', 'DB', 'K/P'];
    const yearOrder: Record<Player['year'], number> = { 'SR': 4, 'JR': 3, 'SO': 2, 'FR': 1 };
    
    positions.forEach(pos => {
        team.roster.filter(p => p.position === pos && p.rosterStatus === 'VARSITY')
            .sort((a,b) => {
                if (a.isPlayerCharacter && gameState.godMode?.autoStart) return -1;
                if (b.isPlayerCharacter && gameState.godMode?.autoStart) return 1;
                if (a.isPlayerCharacter) return -1;
                if (b.isPlayerCharacter) return 1;
                if (yearOrder[b.year] !== yearOrder[a.year]) return yearOrder[b.year] - yearOrder[a.year];
                return b.attributes.OVR - a.attributes.OVR;
            })
            .forEach((player, index) => {
                player.stringer = index + 1;
            });
    });
    return team;
}

const updateJVDepthCharts = (team: Team): Team => {
    const positions: Position[] = ['QB', 'RB', 'WR', 'TE', 'OL', 'DL', 'LB', 'DB', 'K/P'];
    positions.forEach(pos => {
        team.roster.filter(p => p.position === pos && p.rosterStatus === 'JV')
            .sort((a,b) => b.attributes.OVR - a.attributes.OVR)
            .forEach((player, index) => {
                player.stringer = index + 1;
            });
    });
    return team;
}

export const generateTeam = (id: number, name: string, wvClass: WVClass): Team => {
    const isPowerhouse = POWERHOUSE_TEAMS.includes(id);
    let roster = id === 201 ? generateWilliamstownRoster() : generateRoster();
    roster = assignRosterStatuses(roster);

    let team: Team = {
        id,
        name,
        roster,
        ovr: 0,
        record: { wins: 0, losses: 0 },
        confRecord: { wins: 0, losses: 0 },
        class: wvClass,
        rivalId: RIVALRIES[id] || undefined,
        prestige: rand(isPowerhouse ? 75 : 50, isPowerhouse ? 95 : 80),
        chemistry: rand(60, 85),
    };
    // Dummy GameState for initial depth chart
    const dummyGs = { godMode: null } as GameState;
    team = updateVarsityDepthCharts(team, dummyGs);
    team = updateJVDepthCharts(team);
    team.ovr = calculateTeamOvr(team.roster);
    if(isPowerhouse) team.ovr = Math.min(99, team.ovr + rand(2,5));
    return team;
};

export const generateSchedule = (teams: Team[]): Record<number, Game[]> => {
    const schedule: Record<number, Game[]> = {};
    teams.forEach(t => (schedule[t.id] = []));

    const classes: WVClass[] = ['AAA', 'AA', 'A'];
    classes.forEach(c => {
        let classTeams = teams.filter(t => t.class === c);
        if (classTeams.length < 2) return;
        
        if (classTeams.length % 2 !== 0) {
            classTeams.push({ id: -1, name: "BYE" } as Team);
        }

        const numTeams = classTeams.length;
        const numRounds = 10;
        
        for (let round = 0; round < numRounds; round++) {
            const week = round + 1;
            for (let i = 0; i < numTeams / 2; i++) {
                const team1 = classTeams[i];
                const team2 = classTeams[numTeams - 1 - i];

                if (team1.id === -1 || team2.id === -1) continue; 

                if (schedule[team1.id].some(g => g.week === week) || schedule[team2.id].some(g => g.week === week)) continue;

                const isHome = Math.random() > 0.5;
                const isRivalry = team1.rivalId === team2.id;
                
                schedule[team1.id].push({ week, opponentId: team2.id, isHome, isRivalryGame: isRivalry });
                schedule[team2.id].push({ week, opponentId: team1.id, isHome: !isHome, isRivalryGame: isRivalry });
            }

            const lastTeam = classTeams.pop()!;
            classTeams.splice(1, 0, lastTeam);
        }
    });

    Object.values(schedule).forEach(s => s.sort((a, b) => a.week - b.week));

    return schedule;
};


const generateSponsors = (): Sponsor[] => {
    return [
        { id: 'sp1', name: 'Local Pizza Shop', type: 'Local', payoutPerWin: 250, signingBonus: 1000, duration: 1 },
        { id: 'sp2', name: 'Regional Bank', type: 'Regional', payoutPerWin: 500, signingBonus: 2500, duration: 2 },
        { id: 'sp3', name: 'National Sporting Goods', type: 'National', payoutPerWin: 1000, signingBonus: 5000, duration: 3 },
    ];
};

const generateStaffMarket = (): Staff[] => {
    const staff: Staff[] = [];
    const types: Staff['type'][] = ['OC', 'DC', 'Trainer', 'Doctor'];
    types.forEach(type => {
        for (let i=0; i<3; i++) {
            staff.push({
                id: crypto.randomUUID(),
                name: generateStaffName(),
                type,
                rating: rand(50, 85),
                salary: rand(1000, 5000)
            });
        }
    });
    return staff;
};

export const initializeGameWorld = (godModeUnlocked: boolean): GameState => {
    const teams: Team[] = [];
    (Object.keys(WV_TEAMS) as WVClass[]).forEach(wvClass => {
        WV_TEAMS[wvClass].forEach(teamInfo => {
            teams.push(generateTeam(teamInfo.id, teamInfo.name, wvClass));
        });
    });

    const schedule = generateSchedule(teams);
    const jvSchedule = JSON.parse(JSON.stringify(schedule)); 
    Object.values(jvSchedule).flat().forEach((game: Game) => game.level = 'JV');


    const initialCoach: Coach = {
        name: "Coach",
        archetype: 'Strategist',
        points: 5,
        skillTree: {
            recruiting: { name: 'Recruiting', description: 'Improves recruiting effectiveness', level: 0, maxLevel: 5, cost: [1,2,3,4,5] },
            offense: { name: 'Offense', description: 'Improves offensive playcalling', level: 0, maxLevel: 5, cost: [1,2,3,4,5] },
            defense: { name: 'Defense', description: 'Improves defensive playcalling', level: 0, maxLevel: 5, cost: [1,2,3,4,5] },
            training: { name: 'Training', description: 'Improves player progression', level: 0, maxLevel: 5, cost: [1,2,3,4,5] },
        },
        championships: 0,
        totalWins: 0,
        seasonsCoached: 0
    };
    
    const emptyAwards: SeasonAwards = { mvp: null, bestQB: null, bestRB: null, bestWR: null, bestDefender: null, bestOL: null, bestKP: null, coachOfTheYear: null };

    return {
        gameMode: null,
        myTeamId: null,
        myPlayerId: null,
        teams,
        season: 1,
        week: 1,
        schedule,
        jvSchedule: jvSchedule,
        funds: 50000,
        facilities: {
            coaching: { level: 1, cost: 25000 },
            training: { level: 1, cost: 25000 },
            rehab: { level: 1, cost: 25000 },
            tutoring: { level: 1, cost: 25000 },
        },
        nationalRankings: updateRankings(teams),
        playoffBracket: null,
        tocBracket: [],
        classChampions: { 'A': null, 'AA': null, 'AAA': null },
        tocChampion: null,
        lastGameResult: null,
        gameLog: [],
        recruits: [],
        signedRecruits: [],
        isOffseason: false,
        seasonAwards: { ...emptyAwards },
        jvSeasonAwards: { ...emptyAwards },
        customPlaybooks: [],
        fanHappiness: 75,
        activeSponsor: null,
        availableSponsors: generateSponsors(),
        inbox: [],
        staff: [],
        staffMarket: generateStaffMarket(),
        myStrategy: { offense: 'Balanced', defense: '4-3 Defense' },
        trophyCase: [],
        recruitingPoints: 100,
        coach: initialCoach,
        schoolPrestige: 70,
        hallOfFame: [],
        practiceSessions: 3,
        news: [],
        collegeOffers: [],
        committedCollege: null,
        godMode: godModeUnlocked ? { 
            isEnabled: true, unlimitedFunds: false, maxFacilities: false, perfectAcademics: false, perfectMorale: false,
            maxCoaching: false, perfectRecruiting: false, forceWinGames: false, unlimitedStamina: false, infiniteSkillPoints: false,
            canEditPlayers: false, canTransferAnytime: false, autoCrazyStats: false, autoStart: false, makeMyPlayer99: false, makeMyTeam99: false,
            noInjuries: false, revealAllRecruitRatings: false
        } : null,
        activeGame: null,
        transferPortal: [],
        careerSummary: null,
        isEliminated: false,
        transferOffers: [],
        top5Colleges: null,
        commitmentPhase: 'NONE',
        lastReadNewsCount: 0,
        collegeGameState: null,
    };
};

export const initializeMyCareer = (name: string, pos: Position, myTeamId: number, godModeUnlocked: boolean, teams: Team[]): GameState => {
    const gameState = initializeGameWorld(godModeUnlocked);
    gameState.myTeamId = myTeamId;
    gameState.gameMode = 'MY_CAREER';
    gameState.season = 1; // Freshman year

    const myTeam = gameState.teams.find(t => t.id === myTeamId);
    if (!myTeam) return gameState;

    const player = generatePlayer(pos, 'FR', name);
    player.isPlayerCharacter = true;
    player.rosterStatus = 'VARSITY';
    player.stringer = 1;
    player.skillPoints = 5;

    myTeam.roster.push(player);
    updateVarsityDepthCharts(myTeam, gameState);

    gameState.myPlayerId = player.id;
    return gameState;
};

export const initializeMyCareerWithExistingPlayer = (playerId: string, gameState: GameState): GameState => {
    const newState = { ...gameState };
    newState.gameMode = 'MY_CAREER';
    newState.myPlayerId = playerId;

    const myTeam = newState.teams.find(t => t.id === newState.myTeamId);
    if (myTeam) {
        const player = myTeam.roster.find(p => p.id === playerId);
        if (player) {
            player.isPlayerCharacter = true;
            player.skillPoints = player.skillPoints || 0;
            player.xp = player.xp || 0;
            player.xpToNextLevel = player.xpToNextLevel || 1000;
        }
    }
    return newState;
};

export const simulateGame = async (gameState: GameState, team1Id: number, team2Id: number): Promise<{ team1Score: number, team2Score: number, playerStats: Game['result']['playerStats'] }> => {
    const team1 = gameState.teams.find(t => t.id === team1Id)!;
    const team2 = gameState.teams.find(t => t.id === team2Id)!;

    const generateCrazyMyCareerStats = (player: Player): Partial<PlayerStats> => {
        const stats: Partial<PlayerStats> = {};
        switch (player.position) {
            case 'QB':
                stats.passYds = rand(400, 600);
                stats.passTDs = rand(4, 7);
                stats.rushYds = rand(50, 120);
                stats.rushTDs = rand(0, 2);
                break;
            case 'RB':
                stats.rushYds = rand(180, 300);
                stats.rushTDs = rand(3, 5);
                stats.recYds = rand(40, 100);
                stats.recTDs = rand(0, 2);
                break;
            case 'WR':
            case 'TE':
                stats.recYds = rand(150, 250);
                stats.recTDs = rand(2, 4);
                break;
            case 'DL':
                stats.tackles = rand(8, 15);
                stats.sacks = rand(2, 5);
                break;
            case 'LB':
                stats.tackles = rand(10, 18);
                stats.sacks = rand(1, 3);
                stats.ints = rand(0, 2);
                break;
            case 'DB':
                stats.tackles = rand(5, 10);
                stats.ints = rand(1, 3);
                break;
            default:
                break;
        }
        return stats;
    };
    
    const generateStatsForTeam = (team: Team, score: number, overrides: Record<string, Partial<PlayerStats>> = {}): Record<string, Partial<PlayerStats>> => {
        const stats: Record<string, Partial<PlayerStats>> = JSON.parse(JSON.stringify(overrides));
        const roster = team.roster.filter(p => p.rosterStatus === 'VARSITY' && p.isInjured === 0 && p.isSuspended === 0 && !overrides[p.id]);
        if (roster.length === 0 && Object.keys(stats).length === 0) return {};

        let totalTouchdowns = Math.floor(score / 7);
        let totalYards = totalTouchdowns * rand(50, 80) + rand(100, 250);

        Object.values(overrides).forEach(override => {
            totalTouchdowns -= (override.passTDs || 0) + (override.rushTDs || 0) + (override.recTDs || 0);
            totalYards -= (override.passYds || 0) + (override.rushYds || 0) + (override.recYds || 0);
        });
        totalTouchdowns = Math.max(0, totalTouchdowns);
        totalYards = Math.max(0, totalYards);

        const getPlayer = (pos: Position, stringer = 1) => roster.find(p => p.position === pos && p.stringer === stringer);

        const qb = getPlayer('QB');
        const rb1 = getPlayer('RB');
        const rb2 = getPlayer('RB', 2);
        const wrs = roster.filter(p => p.position === 'WR' || p.position === 'TE').sort((a,b) => a.stringer - b.stringer);
        const defenders = roster.filter(p => ['DL', 'LB', 'DB'].includes(p.position));

        const rushRatio = 0.4;
        let rushingYards = Math.floor(totalYards * rushRatio);
        let passingYards = totalYards - rushingYards;

        if (qb) {
            stats[qb.id] = { ...stats[qb.id], passYds: (stats[qb.id]?.passYds || 0) + passingYards, passTDs: (stats[qb.id]?.passTDs || 0), rushYds: (stats[qb.id]?.rushYds || 0) + rand(0, 30) };
        }

        for (let i = 0; i < totalTouchdowns; i++) {
            const isPassTd = Math.random() > 0.4;
            if (isPassTd && qb && wrs.length > 0) {
                stats[qb.id]!.passTDs = (stats[qb.id]!.passTDs || 0) + 1;
                const receiver = choice(wrs);
                stats[receiver.id] = { ...stats[receiver.id], recTDs: (stats[receiver.id]?.recTDs || 0) + 1 };
            } else if (rb1) {
                stats[rb1.id] = { ...stats[rb1.id], rushTDs: (stats[rb1.id]?.rushTDs || 0) + 1 };
            } else if (qb) { // Scramble TD
                 stats[qb.id]!.rushTDs = (stats[qb.id]!.rushTDs || 0) + 1;
            }
        }
        
        if (rb1) {
            const rb1Yards = Math.floor(rushingYards * 0.7);
            stats[rb1.id] = { ...stats[rb1.id], rushYds: (stats[rb1.id]?.rushYds || 0) + rb1Yards };
            rushingYards -= rb1Yards;
        }
        if (rb2) {
             stats[rb2.id] = { ...stats[rb2.id], rushYds: (stats[rb2.id]?.rushYds || 0) + rushingYards };
        } else if (rb1) {
            stats[rb1.id]!.rushYds = (stats[rb1.id]!.rushYds || 0) + rushingYards;
        }
        
        if (passingYards > 0 && wrs.length > 0) {
            let tempPassingYards = passingYards;
            const targetShares = wrs.map(() => Math.random());
            const totalShares = targetShares.reduce((a, b) => a + b, 0);
            
            wrs.forEach((wr, index) => {
                const yards = Math.floor(tempPassingYards * (targetShares[index] / totalShares));
                stats[wr.id] = { ...stats[wr.id], recYds: (stats[wr.id]?.recYds || 0) + yards };
                passingYards -= yards;
            });

            if (passingYards > 0 && wrs[0]) {
                stats[wrs[0].id]!.recYds = (stats[wrs[0].id]!.recYds || 0) + passingYards;
            }
        }
        
        if(defenders.length > 0) {
            let totalTackles = rand(40, 70), totalSacks = rand(0, 5), totalInts = rand(0, 3);
            for(let i=0; i<totalTackles; i++) {
                const defender = choice(defenders);
                stats[defender.id] = { ...stats[defender.id], tackles: (stats[defender.id]?.tackles || 0) + 1 };
            }
            for(let i=0; i<totalSacks; i++) {
                const defender = choice(defenders.filter(d => ['DL', 'LB'].includes(d.position))) || choice(defenders);
                stats[defender.id] = { ...stats[defender.id], sacks: (stats[defender.id]?.sacks || 0) + 1 };
            }
             for(let i=0; i<totalInts; i++) {
                const defender = choice(defenders.filter(d => ['DB', 'LB'].includes(d.position))) || choice(defenders);
                stats[defender.id] = { ...stats[defender.id], ints: (stats[defender.id]?.ints || 0) + 1 };
            }
        }
        
        return stats;
    };

    const myPlayer = gameState.myPlayerId ? gameState.teams.find(t => t.id === gameState.myTeamId)?.roster.find(p => p.id === gameState.myPlayerId) : null;
    const isMyCareerGame = (team1Id === gameState.myTeamId || team2Id === gameState.myTeamId) && myPlayer;
    const shouldHaveCrazyStats = isMyCareerGame && (myPlayer.attributes.OVR >= 99 || (gameState.godMode?.isEnabled && gameState.godMode.autoCrazyStats));

    if (shouldHaveCrazyStats) {
        const myTeam = gameState.teams.find(t => t.id === gameState.myTeamId)!;
        const opponentTeam = (team1Id === myTeam.id) ? team2 : team1;

        const myCrazyStats = generateCrazyMyCareerStats(myPlayer!);
        const myScore = rand(42, 63);
        const oppScore = rand(7, 28);
        
        const playerStatsOverrides = { [myPlayer!.id]: myCrazyStats };

        const myTeamStats = generateStatsForTeam(myTeam, myScore, playerStatsOverrides);
        const oppTeamStats = generateStatsForTeam(opponentTeam, oppScore);
        
        const userIsTeam1 = team1Id === myTeam.id;

        return {
            team1Score: userIsTeam1 ? myScore : oppScore,
            team2Score: userIsTeam1 ? oppScore : myScore,
            playerStats: {
                myTeam: userIsTeam1 ? myTeamStats : oppTeamStats,
                opponentTeam: userIsTeam1 ? oppTeamStats : myTeamStats,
            }
        };
    }

    if (isMyCareerGame && gameState.godMode?.isEnabled && gameState.godMode.forceWinGames) {
        const userIsTeam1 = team1Id === gameState.myTeamId;
        const userScore = rand(35, 63);
        const oppScore = rand(0, 28);
        return {
            team1Score: userIsTeam1 ? userScore : oppScore,
            team2Score: userIsTeam1 ? oppScore : userScore,
            playerStats: {
                myTeam: generateStatsForTeam(team1, userIsTeam1 ? userScore : oppScore),
                opponentTeam: generateStatsForTeam(team2, userIsTeam1 ? oppScore : userScore)
            }
        };
    }

    const getTeamPower = (team: Team, isUserTeam: boolean): number => {
        let power = team.ovr * 2;
        power += (team.chemistry - 50) * 0.2; // Chemistry impact
        if (isUserTeam) {
            power += gameState.facilities.coaching.level * 2; // Coaching facility impact
        }
        return power;
    };
    
    const t1Power = getTeamPower(team1, team1Id === gameState.myTeamId);
    const t2Power = getTeamPower(team2, team2Id === gameState.myTeamId);

    const powerDiff = t1Power - t2Power;

    let t1Score = rand(7, 42);
    let t2Score = rand(7, 42);

    const scoreAdjustment = Math.pow(Math.abs(powerDiff), 1.2) * (powerDiff > 0 ? 1 : -1) * 0.5;
    t1Score += scoreAdjustment;
    t2Score -= scoreAdjustment;

    if (rand(1, 100) <= 5) { // 5% chance of a major swing
        const upsetFactor = rand(10, 20);
        if (t1Power < t2Power) t1Score += upsetFactor;
        else t2Score += upsetFactor;
    }

    const finalT1Score = Math.max(0, Math.round(t1Score));
    const finalT2Score = Math.max(0, Math.round(t2Score));

    const playerStats: Game['result']['playerStats'] = { myTeam: {}, opponentTeam: {} };
    playerStats.myTeam = generateStatsForTeam(team1, finalT1Score);
    playerStats.opponentTeam = generateStatsForTeam(team2, finalT2Score);

    return { team1Score: finalT1Score, team2Score: finalT2Score, playerStats };
};

const evaluateMyCareerPlayerStatus = (gState: GameState): { newState: GameState, notification?: string } => {
    const gameState = JSON.parse(JSON.stringify(gState));
    if (gameState.gameMode !== 'MY_CAREER' || !gameState.myPlayerId || !gameState.myTeamId) {
        return { newState: gameState };
    }

    const myTeam = gameState.teams.find((t: Team) => t.id === gameState.myTeamId);
    if (!myTeam) return { newState: gameState };
    
    const player = myTeam.roster.find((p: Player) => p.id === gameState.myPlayerId);
    if (!player) return { newState: gameState };

    let rosterChanged = false;
    let message: InboxMessage | null = null;
    let notification: string | undefined = undefined;

    if (player.rosterStatus === 'JV' && player.attributes.OVR > 68) {
        player.rosterStatus = 'VARSITY';
        rosterChanged = true;
        message = {
            id: crypto.randomUUID(),
            week: gameState.week,
            season: gameState.season,
            from: "Head Coach",
            subject: "You're moving up!",
            body: `Great work on the JV squad, ${player.name}. Your overall performance has earned you a spot on the Varsity roster. Keep up the hard work.`,
            read: false,
            type: 'PROMOTION'
        };
        notification = "You've been promoted to Varsity!";
    }
    else if (player.rosterStatus === 'VARSITY' && player.attributes.OVR < 65 && player.stringer > 2) {
        player.rosterStatus = 'JV';
        rosterChanged = true;
        message = {
            id: crypto.randomUUID(),
            week: gameState.week,
            season: gameState.season,
            from: "Head Coach",
            subject: "Roster Change",
            body: `Tough decision, ${player.name}, but we're moving you to the JV roster for now to get you more reps and development time. Show us what you've got and you can earn your spot back.`,
            read: false,
            type: 'GENERAL'
        };
        notification = "You've been sent down to the JV roster.";
    }

    if (rosterChanged) {
        updateVarsityDepthCharts(myTeam, gameState);
        updateJVDepthCharts(myTeam);
        myTeam.ovr = calculateTeamOvr(myTeam.roster);
        if (message) {
            gameState.inbox.push(message);
        }
    }

    return { newState: gameState, notification };
};

const generatePlayoffBracket = (teams: Team[]): Record<WVClass, PlayoffBracket> => {
    const bracket: Record<WVClass, PlayoffBracket> = { 
        'AAA': { quarterfinals: [], semifinals: [], final: null }, 
        'AA': { quarterfinals: [], semifinals: [], final: null }, 
        'A': { quarterfinals: [], semifinals: [], final: null } 
    };
    const classes: WVClass[] = ['AAA', 'AA', 'A'];
    
    classes.forEach(c => {
        const classTeams = teams.filter(t => t.class === c)
            .sort((a, b) => {
                if (b.record.wins !== a.record.wins) return b.record.wins - a.record.wins;
                if (a.record.losses !== b.record.losses) return a.record.losses - b.record.losses;
                return b.ovr - a.ovr;
            })
            .slice(0, 8); // Top 8
        
        if (classTeams.length === 8) {
            bracket[c].quarterfinals.push({ team1Id: classTeams[0].id, team2Id: classTeams[7].id });
            bracket[c].quarterfinals.push({ team1Id: classTeams[3].id, team2Id: classTeams[4].id });
            bracket[c].quarterfinals.push({ team1Id: classTeams[2].id, team2Id: classTeams[5].id });
            bracket[c].quarterfinals.push({ team1Id: classTeams[1].id, team2Id: classTeams[6].id });
        }
    });

    return bracket;
};

const calculateAndSetJVAwards = (gameState: GameState): GameState => {
    const allPlayers = gameState.teams.flatMap(t => t.roster.filter(p => p.rosterStatus === 'JV'));
    if (allPlayers.length === 0) return gameState;
    
    const getWinner = (pos: Position[], sortFn: (p: Player) => number): Player | null => {
        const candidates = allPlayers
            .filter(p => pos.includes(p.position))
            .sort((a, b) => sortFn(b) - sortFn(a));
        return candidates[0] || null;
    }

    gameState.jvSeasonAwards.mvp = getWinner(['QB', 'RB', 'WR'], p => (p.attributes.OVR * 0.5 + (p.jvSeasonStats.passTDs + p.jvSeasonStats.rushTDs + p.jvSeasonStats.recTDs) * 2));
    gameState.jvSeasonAwards.bestQB = getWinner(['QB'], p => p.jvSeasonStats.passYds + p.jvSeasonStats.passTDs * 50);
    gameState.jvSeasonAwards.bestRB = getWinner(['RB'], p => p.jvSeasonStats.rushYds + p.jvSeasonStats.rushTDs * 50);
    gameState.jvSeasonAwards.bestWR = getWinner(['WR', 'TE'], p => p.jvSeasonStats.recYds + p.jvSeasonStats.recTDs * 50);
    gameState.jvSeasonAwards.bestDefender = getWinner(['DL', 'LB', 'DB'], p => p.jvSeasonStats.tackles + p.jvSeasonStats.sacks * 5 + p.jvSeasonStats.ints * 10);
    
    let bestJVCoachTeam: Team | null = null;
    let maxCoachScore = -1;

    gameState.teams.forEach(team => {
        const jvWins = gameState.jvSchedule[team.id]?.filter(g => g.result && g.result.myScore > g.result.opponentScore).length || 0;
        let score = jvWins * 10 + rand(0, 5);
        if (score > maxCoachScore) {
            maxCoachScore = score;
            bestJVCoachTeam = team;
        }
    });
    
    if (bestJVCoachTeam) {
        const coachName = (bestJVCoachTeam.id === gameState.myTeamId) ? gameState.coach.name : `Coach of ${bestJVCoachTeam.name}`;
        gameState.jvSeasonAwards.coachOfTheYear = { name: coachName, teamName: bestJVCoachTeam.name };
    }

    return gameState;
};

const calculateAndSetVarsityAwards = (gameState: GameState): GameState => {
    const allPlayers = gameState.teams.flatMap(t => t.roster.filter(p => p.rosterStatus === 'VARSITY'));
    if (allPlayers.length === 0) return gameState;

    const getWinner = (pos: Position[], sortFn: (p: Player) => number): Player | null => {
        const candidates = allPlayers
            .filter(p => pos.includes(p.position))
            .sort((a, b) => sortFn(b) - sortFn(a));
        return candidates.length > 0 ? { ...candidates[0] } : null; // Return a copy
    }

    const awardMapping: { key: keyof SeasonAwards, name: string, logic: () => Player | null }[] = [
        { key: 'mvp', name: 'Most Valuable Player', logic: () => getWinner(['QB', 'RB', 'WR'], p => (p.attributes.OVR * 0.5 + (p.seasonStats.passTDs + p.seasonStats.rushTDs + p.seasonStats.recTDs) * 2)) },
        { key: 'bestQB', name: 'Best Quarterback', logic: () => getWinner(['QB'], p => p.seasonStats.passYds + p.seasonStats.passTDs * 50) },
        { key: 'bestRB', name: 'Best Running Back', logic: () => getWinner(['RB'], p => p.seasonStats.rushYds + p.seasonStats.rushTDs * 50) },
        { key: 'bestWR', name: 'Best WR/TE', logic: () => getWinner(['WR', 'TE'], p => p.seasonStats.recYds + p.seasonStats.recTDs * 50) },
        { key: 'bestDefender', name: 'Best Defender', logic: () => getWinner(['DL', 'LB', 'DB'], p => p.seasonStats.tackles + p.seasonStats.sacks * 5 + p.seasonStats.ints * 10) },
        { key: 'bestOL', name: 'Best Offensive Lineman', logic: () => getWinner(['OL'], p => p.attributes.OVR + p.attributes.Strength) },
        { key: 'bestKP', name: 'Best Kicker/Punter', logic: () => getWinner(['K/P'], p => p.attributes.OVR + p.attributes.Consistency) },
    ];

    awardMapping.forEach(award => {
        const winner = award.logic();
        if (winner) {
            gameState.seasonAwards[award.key as 'mvp'] = winner; // Type assertion to satisfy TS
            const winnerTeam = gameState.teams.find(t => t.roster.some(p => p.id === winner.id));
            if (winnerTeam && winnerTeam.id === gameState.myTeamId) {
                gameState.trophyCase.push({
                    season: gameState.season,
                    award: award.name,
                    playerName: winner.name,
                    playerId: winner.id,
                });
                 gameState.inbox.push({
                    id: crypto.randomUUID(),
                    week: 16,
                    season: gameState.season,
                    from: "State Sports Network",
                    subject: "Season Award Winner!",
                    body: `Congratulations! ${winner.name} has won the ${award.name} award for his outstanding performance this season!`,
                    read: false,
                    type: 'GENERAL'
                });
            }
        }
    });
    
    let bestCoachTeam: Team | null = null;
    let maxCoachScore = -1;

    gameState.teams.forEach(team => {
        let score = team.record.wins * 10;
        if (gameState.classChampions[team.class] === team.id) score += 30;
        if (gameState.tocChampion === team.id) score += 50;
        // Factor in over-performance
        score += (team.record.wins * 100) / (team.ovr / 2); // Win score relative to OVR
        score += rand(0, 5);

        if (score > maxCoachScore) {
            maxCoachScore = score;
            bestCoachTeam = team;
        }
    });

    if (bestCoachTeam) {
        const coachName = (bestCoachTeam.id === gameState.myTeamId) ? gameState.coach.name : `Coach of ${bestCoachTeam.name}`;
        gameState.seasonAwards.coachOfTheYear = { name: coachName, teamName: bestCoachTeam.name };
        if (bestCoachTeam.id === gameState.myTeamId) {
            gameState.trophyCase.push({
                season: gameState.season,
                award: 'Coach of the Year',
                playerName: coachName
            });
            gameState.inbox.push({
                id: crypto.randomUUID(), week: 16, season: gameState.season,
                from: "State Sports Network", subject: "You've Won Coach of the Year!",
                body: `Congratulations, Coach! Your incredible season has earned you the state's Coach of the Year award.`, read: false, type: 'GENERAL'
            });
        }
    }

    return gameState;
};

const handleAcademics = (gameState: GameState): GameState => {
    if (gameState.godMode?.isEnabled && gameState.godMode.perfectAcademics) {
        return gameState; // Skip all academic checks
    }
    const tutoringBonus = gameState.facilities.tutoring.level * 5; // Up to 25% chance reduction
    gameState.teams.forEach(team => {
        team.roster.forEach(player => {
            if (player.gpa < 2.0 && player.isSuspended === 0) {
                const suspensionChance = 30 - tutoringBonus;
                if (rand(1, 100) <= suspensionChance) {
                    player.isSuspended = rand(1, 2);
                    if (team.id === gameState.myTeamId) {
                        gameState.inbox.push({
                            id: crypto.randomUUID(),
                            week: gameState.week,
                            season: gameState.season,
                            from: "Athletic Director",
                            subject: "Academic Suspension",
                            body: `${player.name} is academically ineligible and has been suspended for ${player.isSuspended} game(s).`,
                            read: false,
                            type: 'ACADEMIC_WARNING'
                        });
                    }
                }
            }
        });
    });
    return gameState;
};

const isTeamInPlayoffs = (teamId: number, gameState: GameState): boolean => {
    if (!gameState.playoffBracket) return false;
    for (const c of Object.values(gameState.playoffBracket)) {
        if (c.quarterfinals.some(m => m.team1Id === teamId || m.team2Id === teamId)) {
            return true;
        }
    }
    return false;
};

const getSingleGameStatScore = (stats: Partial<PlayerStats>, position: Position): number => {
    const { passYds = 0, passTDs = 0, rushYds = 0, rushTDs = 0, recYds = 0, recTDs = 0, tackles = 0, sacks = 0, ints = 0 } = stats;
    switch(position) {
        case 'QB': return (passYds / 25) + (passTDs * 20) + (rushYds / 10);
        case 'RB': return (rushYds / 10) + (rushTDs * 20) + (recYds / 10);
        case 'WR':
        case 'TE': return (recYds / 10) + (recTDs * 20);
        case 'DL':
        case 'LB':
        case 'DB': return tackles + (sacks * 5) + (ints * 10);
        default: return 0;
    }
};

const formatStatLine = (stats: Partial<PlayerStats>, position: Position): string => {
    let line = [];
    if (position === 'QB') {
        if (stats.passYds) line.push(`${stats.passYds} PaYds`);
        if (stats.passTDs) line.push(`${stats.passTDs} PaTDs`);
        if (stats.rushYds) line.push(`${stats.rushYds} RuYds`);
    } else if (position === 'RB') {
        if (stats.rushYds) line.push(`${stats.rushYds} RuYds`);
        if (stats.rushTDs) line.push(`${stats.rushTDs} RuTDs`);
        if (stats.recYds) line.push(`${stats.recYds} RecYds`);
    } else if (['WR', 'TE'].includes(position)) {
        if (stats.recYds) line.push(`${stats.recYds} RecYds`);
        if (stats.recTDs) line.push(`${stats.recTDs} RecTDs`);
    } else {
        if (stats.tackles) line.push(`${stats.tackles} Tkls`);
        if (stats.sacks) line.push(`${stats.sacks} Sacks`);
        if (stats.ints) line.push(`${stats.ints} Ints`);
    }
    return line.join(', ');
};

const findAndAnnouncePlayerOfTheWeek = (gameState: GameState): GameState => {
    if (gameState.week <= 1) return gameState;

    let topPerformer = { player: null as Player | null, teamName: '', score: 0, stats: {} as Partial<PlayerStats> };

    gameState.teams.forEach(team => {
        const lastGame = gameState.schedule[team.id]?.find(g => g.week === gameState.week - 1);
        if (lastGame?.result) {
            const playerStats = lastGame.result.playerStats.myTeam;
            for (const playerId in playerStats) {
                const player = team.roster.find(p => p.id === playerId);
                const stats = playerStats[playerId];
                if (player && stats) {
                    const score = getSingleGameStatScore(stats, player.position);
                    if (score > topPerformer.score) {
                        topPerformer = { player, teamName: team.name, score, stats };
                    }
                }
            }
        }
    });

    if (topPerformer.player) {
        const statLine = formatStatLine(topPerformer.stats, topPerformer.player.position);
        const article = generateNewsArticle(gameState, 'PLAYER_OF_WEEK', { player: topPerformer.player, teamName: topPerformer.teamName, statLine });
        if (article) gameState.news.push(article);

        const myTeam = gameState.teams.find(t => t.id === gameState.myTeamId);
        if (myTeam && myTeam.roster.some(p => p.id === topPerformer.player!.id)) {
            gameState.inbox.push({
                id: crypto.randomUUID(),
                week: gameState.week,
                season: gameState.season,
                from: "State Sports Network",
                subject: "Player of the Week!",
                body: `Congratulations! ${topPerformer.player.name} has been named the Player of the Week for their performance: ${statLine}.`,
                read: false,
                type: 'GENERAL'
            });
        }
    }
    
    return gameState;
};

const handlePlayoffAdvancement = (gameState: GameState, week: number): GameState => {
    if (week < 11 || week > 15 || !gameState.playoffBracket) return gameState;

    const addGameToSchedule = (week: number, team1Id: number, team2Id: number, round: Game['playoffRound']) => {
        const team1 = gameState.teams.find(t => t.id === team1Id);
        const team2 = gameState.teams.find(t => t.id === team2Id);
        if(!team1 || !team2) return;
        
        const game1: Game = { week, opponentId: team2Id, isHome: true, playoffRound: round, isRivalryGame: team1.rivalId === team2Id };
        const game2: Game = { week, opponentId: team1Id, isHome: false, playoffRound: round, isRivalryGame: team2.rivalId === team1Id };
        gameState.schedule[team1Id].push(game1);
        gameState.schedule[team2Id].push(game2);
    };
    
    if (week === 11) { // After Quarterfinals
        (Object.values(gameState.playoffBracket) as PlayoffBracket[]).forEach(bracket => {
            if (bracket.quarterfinals.every(m => m.winnerId) && bracket.semifinals.length === 0) {
                const winners = bracket.quarterfinals.map(m => m.winnerId!);
                bracket.semifinals.push({ team1Id: winners[0], team2Id: winners[1] });
                bracket.semifinals.push({ team1Id: winners[2], team2Id: winners[3] });
                bracket.semifinals.forEach(m => addGameToSchedule(12, m.team1Id, m.team2Id, 'Semifinals'));
            }
        });
    }

    if (week === 12) { // After Semifinals
        (Object.values(gameState.playoffBracket) as PlayoffBracket[]).forEach(bracket => {
            if (bracket.semifinals.every(m => m.winnerId) && !bracket.final) {
                const winners = bracket.semifinals.map(m => m.winnerId!);
                bracket.final = { team1Id: winners[0], team2Id: winners[1] };
                addGameToSchedule(13, bracket.final.team1Id, bracket.final.team2Id, 'Championship');
            }
        });
    }

    if (week === 13) { // After Championships, set up ToC
        const champions: number[] = [];
        (Object.keys(gameState.playoffBracket) as WVClass[]).forEach(c => {
            const bracket = gameState.playoffBracket![c];
            if (bracket.final?.winnerId) {
                gameState.classChampions[c] = bracket.final.winnerId;
                champions.push(bracket.final.winnerId);
                const team = gameState.teams.find(t => t.id === bracket.final!.winnerId);
                if (team && team.id === gameState.myTeamId) {
                    gameState.trophyCase.push({ season: gameState.season, award: `Class ${c} Champions` });
                    gameState.coach.championships++;
                }
            }
        });
        
        if (champions.length > 1) {
            const tocTeams = champions.map(id => gameState.teams.find(t => t.id === id)!).sort((a, b) => b.ovr - a.ovr);
            
            if (tocTeams.length === 3) {
                // #1 gets a bye. #2 vs #3 in Semifinal.
                const semifinalMatchup: PlayoffMatchup = { team1Id: tocTeams[1].id, team2Id: tocTeams[2].id };
                gameState.tocBracket = [semifinalMatchup];
                addGameToSchedule(14, semifinalMatchup.team1Id, semifinalMatchup.team2Id, 'ToC Semifinal');
            } else if (tocTeams.length === 2) { 
                // 2 champions, straight to final in week 15. Both get a bye week 14.
                const finalMatchup: PlayoffMatchup = { team1Id: tocTeams[0].id, team2Id: tocTeams[1].id };
                gameState.tocBracket = [finalMatchup];
                addGameToSchedule(15, finalMatchup.team1Id, finalMatchup.team2Id, 'ToC Final');
            }
        }
    }
    
    if (week === 14) { // After ToC Semifinal
        if(gameState.tocBracket && gameState.tocBracket.length > 0) {
            const semifinal = gameState.tocBracket.find(m => {
                // Check if this matchup was scheduled for week 14
                const game = gameState.schedule[m.team1Id]?.find(g => g.week === 14 && g.opponentId === m.team2Id);
                return game?.playoffRound === 'ToC Semifinal';
            });

            if (semifinal?.winnerId) { // Semifinal just finished
                const allChampions = Object.values(gameState.classChampions).filter(id => id !== null) as number[];
                const championTeams = allChampions.map(id => gameState.teams.find(t => t.id === id)!).sort((a,b) => b.ovr - a.ovr);
                const byeTeamId = championTeams[0].id;
                
                const finalMatchup: PlayoffMatchup = { team1Id: byeTeamId, team2Id: semifinal.winnerId };
                gameState.tocBracket.push(finalMatchup);
                addGameToSchedule(15, finalMatchup.team1Id, finalMatchup.team2Id, 'ToC Final');
            }
        }
    }
    
    if (week === 15) { // After ToC Final
        if(gameState.tocBracket && gameState.tocBracket.length > 0) {
            // Find the matchup that was played in week 15
            const finalMatchup = gameState.tocBracket.find(m => {
                const game = gameState.schedule[m.team1Id]?.find(g => g.week === 15 && g.opponentId === m.team2Id);
                return game?.playoffRound === 'ToC Final';
            });
             if (finalMatchup?.winnerId) {
                gameState.tocChampion = finalMatchup.winnerId;
                const team = gameState.teams.find(t => t.id === gameState.tocChampion);
                if(team && team.id === gameState.myTeamId) {
                    gameState.trophyCase.push({ season: gameState.season, award: 'Tournament of Champions Winner' });
                }
            }
        }
    }

    return gameState;
};

// FIX: New function to generate transfer offers for MyCareer players.
const generateMyCareerTransferOffers = (gameState: GameState): GameState => {
    if (gameState.gameMode !== 'MY_CAREER' || !gameState.myPlayerId || !gameState.myTeamId) {
        return gameState;
    }
    const myTeam = gameState.teams.find(t => t.id === gameState.myTeamId)!;
    const player = myTeam.roster.find(p => p.id === gameState.myPlayerId)!;
    
    // Don't generate offers for seniors who are graduating
    if (player.year === 'SR') {
        gameState.transferOffers = [];
        return gameState;
    }

    const potentialTeams = gameState.teams.filter(t => t.id !== gameState.myTeamId);
    const offers: GameState['transferOffers'] = [];

    potentialTeams.forEach(team => {
        const prestigeDiff = team.prestige - player.attributes.OVR;
        // More likely to get offers from teams around your skill level
        if (Math.abs(prestigeDiff) < 15 && Math.random() < 0.3) {
            offers.push({ teamId: team.id, teamName: team.name, prestige: team.prestige });
        }
    });

    gameState.transferOffers = shuffle(offers).slice(0, rand(2, 4));
    return gameState;
};


// --- NEWLY IMPLEMENTED & EXPORTED FUNCTIONS ---

export const getTeamStats = (team: Team): Record<string, number> => {
    let totalYards = 0, passingYards = 0, rushingYards = 0;
    team.roster.forEach(p => {
        totalYards += p.seasonStats.passYds + p.seasonStats.rushYds + p.seasonStats.recYds;
        passingYards += p.seasonStats.passYds;
        rushingYards += p.seasonStats.rushYds;
    });
    const gamesPlayed = team.record.wins + team.record.losses || 1;
    return {
        'Yards Per Game': Math.round(totalYards / gamesPlayed),
        'Passing YPG': Math.round(passingYards / gamesPlayed),
        'Rushing YPG': Math.round(rushingYards / gamesPlayed),
        'Overall': team.ovr,
        'Prestige': team.prestige,
        'Chemistry': team.chemistry,
    };
};

export const generateDynamicScoutingReport = async (gameState: GameState, opponentId: number): Promise<ScoutingReport> => {
    const opponent = gameState.teams.find(t => t.id === opponentId)!;
    const bestPlayers = [...opponent.roster]
        .filter(p => p.rosterStatus === 'VARSITY')
        .sort((a,b) => b.attributes.OVR - a.attributes.OVR)
        .slice(0,3);

    const report: ScoutingReport = {
        teamId: opponent.id,
        teamName: opponent.name,
        ovr: opponent.ovr,
        record: opponent.record,
        bestPlayers: bestPlayers,
        strategy: { offense: 'Balanced', defense: '4-3 Defense' }, // Placeholder
        tactic: {
            strength: "Strong running game.",
            weakness: "Vulnerable to deep passes.",
            suggestion: "Focus on stopping the run and take shots downfield."
        }
    };
    
    if(ai) {
        const prompt = `Generate a very brief, one-sentence scouting report for a high school football team named ${opponent.name} with an OVR of ${opponent.ovr}. Give one strength, one weakness, and one strategic suggestion. Format as a JSON object with keys "strength", "weakness", "suggestion".`;
         try {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: { responseMimeType: 'application/json' }
            });
            const tactic = JSON.parse(response.text.replace(/```json|```/g, '').trim());
            report.tactic = tactic;
        } catch(e) {
            console.error("Failed to generate AI scouting report", e);
        }
    }
    
    return report;
};

export const upgradeFacility = (gameState: GameState, facility: keyof GameState['facilities']): GameState => {
    const fac = gameState.facilities[facility];
    if (gameState.funds >= fac.cost && fac.level < 5) {
        gameState.funds -= fac.cost;
        fac.level++;
        fac.cost *= 2;
    }
    return { ...gameState };
};

export const signRecruit = (gameState: GameState, recruitId: string): GameState => {
    const recruit = gameState.recruits.find(r => r.id === recruitId);
    if (recruit && gameState.recruitingPoints >= recruit.cost && !gameState.signedRecruits.some(r => r.id === recruitId)) {
        gameState.recruitingPoints -= recruit.cost;
        gameState.signedRecruits.push(recruit);
    }
    return { ...gameState };
};

export const prepareNextSeason = (gState: GameState): GameState => {
    const gameState = JSON.parse(JSON.stringify(gState));
    
    // Player Progression
    gameState.teams.forEach((team: Team) => {
        team.roster.forEach((player: Player) => {
            if (player.year === 'SR') return; // Handled by graduation
            
            const progression = Math.floor(player.attributes.Potential / 10) - 4 + rand(0, 2);
            Object.keys(player.attributes).forEach(key => {
                const attr = key as keyof Player['attributes'];
                if (attr !== 'OVR' && attr !== 'Potential') {
                    player.attributes[attr] = Math.min(99, player.attributes[attr] + rand(0, progression));
                }
            });
            player.attributes.OVR = calculatePlayerOvr(player.attributes);
        });
    });

    // Graduation and Roster update
    let myPlayerGraduated = false;
    gameState.teams.forEach((team: Team) => {
        if (gameState.myPlayerId && team.roster.some(p => p.id === gameState.myPlayerId && p.year === 'SR')) {
            myPlayerGraduated = true;
        }
        team.roster = team.roster.filter((p: Player) => p.year !== 'SR');
        team.roster.forEach((p: Player) => {
            const yearMap: Record<Player['year'], Player['year']> = { 'FR': 'SO', 'SO': 'JR', 'JR': 'SR', 'SR': 'SR' };
            p.year = yearMap[p.year];
            p.seasonStats = initialStats();
            p.jvSeasonStats = initialStats();
        });
    });

    const myTeam = gameState.teams.find((t: Team) => t.id === gameState.myTeamId);
    // Add signed recruits
    if (myTeam) {
        gameState.signedRecruits.forEach((recruit: Recruit) => {
            const newPlayer: Player = {
                ...(recruit as any),
                year: 'FR',
                careerStats: initialStats(),
                seasonStats: initialStats(),
                jvSeasonStats: initialStats(),
                collegeSeasonStats: initialStats(),
                collegeCareerStats: initialStats(),
                isInjured: 0,
                morale: 75,
                currentStamina: 100,
                isSuspended: 0,
                stringer: 0,
                rosterStatus: 'JV',
            };
            myTeam.roster.push(newPlayer);
        });
    }

    // Reset game state for new season
    gameState.season++;
    gameState.week = 1;
    gameState.isOffseason = false;
    gameState.signedRecruits = [];
    gameState.recruitingPoints = 100;
    gameState.playoffBracket = null;
    gameState.tocBracket = [];
    gameState.isEliminated = false;
    
    // Roster shakedown
    gameState.teams.forEach((team: Team) => {
        team.roster = assignRosterStatuses(team.roster);
        updateVarsityDepthCharts(team, gameState);
        updateJVDepthCharts(team);
        team.ovr = calculateTeamOvr(team.roster);
        team.record = { wins: 0, losses: 0 };
    });

    gameState.schedule = generateSchedule(gameState.teams);
    const jvSchedule = JSON.parse(JSON.stringify(gameState.schedule)); 
    Object.values(jvSchedule).flat().forEach((game: Game) => game.level = 'JV');
    gameState.jvSchedule = jvSchedule;
    gameState.nationalRankings = updateRankings(gameState.teams);

    // MyCareer specific logic
    if (gameState.gameMode === 'MY_CAREER' && gameState.myPlayerId) {
        if (myPlayerGraduated) {
            const finalPlayerState = gState.teams.flatMap(t => t.roster).find(p => p.id === gState.myPlayerId);
            gameState.gameMode = 'CAREER_OVER';
            gameState.careerSummary = {
                isPlayer: true,
                name: finalPlayerState?.name || "MyCareer Player",
                finalTeamName: gState.teams.find(t=>t.id === gState.myTeamId)?.name || "Unknown",
                seasons: gameState.season - 1,
                collegeCommitted: gameState.committedCollege?.collegeName,
                trophies: gameState.trophyCase,
                careerStats: finalPlayerState?.careerStats,
            };
        } else {
             const player = gameState.teams.flatMap((t: Team) => t.roster).find((p: Player) => p.id === gameState.myPlayerId);
            if (player?.year === 'JR' && gameState.commitmentPhase === 'NONE') {
                gameState.commitmentPhase = 'TOP_5_PENDING';
            }
        }
    }
    
    return gameState;
};

export const handleSpendSkillPoint = (gameState: GameState, attr: keyof Player['attributes']): GameState => {
    if (gameState.gameMode !== 'MY_CAREER' || !gameState.myPlayerId) return gameState;
    const myTeam = gameState.teams.find(t => t.id === gameState.myTeamId);
    if (!myTeam) return gameState;
    const player = myTeam.roster.find(p => p.id === gameState.myPlayerId);
    if (player && player.skillPoints && player.skillPoints > 0) {
        player.skillPoints--;
        player.attributes[attr] = Math.min(99, player.attributes[attr] + 1);
        player.attributes.OVR = calculatePlayerOvr(player.attributes);
    }
    return { ...gameState };
};

export const handlePractice = (gameState: GameState, type: string): { newState: GameState, notification: string } => {
    if (gameState.gameMode !== 'MY_CAREER' || !gameState.myPlayerId || gameState.practiceSessions <= 0) {
        return { newState: gameState, notification: "No practice sessions left." };
    }
    const myTeam = gameState.teams.find(t => t.id === gameState.myTeamId)!;
    const player = myTeam.roster.find(p => p.id === gameState.myPlayerId)!;
    
    gameState.practiceSessions--;
    let notification = '';
    
    if (type === 'drills') {
        player.xp = (player.xp || 0) + 250;
        notification = "+250 XP earned!";
    } else if (type === 'film') {
        player.attributes.Consistency = Math.min(99, player.attributes.Consistency + 1);
        notification = "Consistency +1!";
    }

    if (player.xp! >= player.xpToNextLevel!) {
        player.xp -= player.xpToNextLevel!;
        player.xpToNextLevel! *= 1.2;
        player.skillPoints = (player.skillPoints || 0) + 1;
        notification += " You leveled up! +1 Skill Point.";
    }
    player.attributes.OVR = calculatePlayerOvr(player.attributes);

    return { newState: { ...gameState }, notification };
};

export const editPlayer = (gameState: GameState, playerId: string, newName: string, newAttrs: Player['attributes']): GameState => {
    const team = gameState.teams.find(t => t.roster.some(p => p.id === playerId));
    if (team) {
        const player = team.roster.find(p => p.id === playerId);
        if (player) {
            player.name = newName;
            player.attributes = newAttrs;
        }
        team.ovr = calculateTeamOvr(team.roster);
    }
    return { ...gameState };
};

export const movePlayerRosterStatus = (gameState: GameState, playerId: string): GameState => {
    const team = gameState.teams.find(t => t.roster.some(p => p.id === playerId));
    if (team) {
        const player = team.roster.find(p => p.id === playerId)!;
        player.rosterStatus = player.rosterStatus === 'VARSITY' ? 'JV' : 'VARSITY';
        updateVarsityDepthCharts(team, gameState);
        updateJVDepthCharts(team);
        team.ovr = calculateTeamOvr(team.roster);
    }
    return { ...gameState };
};

export const setStrategy = (gameState: GameState, offense: string, defense: string): GameState => {
    gameState.myStrategy = { offense, defense };
    return { ...gameState };
};

export const selectSponsor = (gameState: GameState, sponsorId: string): GameState => {
    const sponsor = gameState.availableSponsors.find(s => s.id === sponsorId);
    if(sponsor) {
        gameState.activeSponsor = sponsor;
        gameState.funds += sponsor.signingBonus;
    }
    return { ...gameState };
};

export const hireStaff = (gameState: GameState, staffId: string): GameState => {
    const staffPerson = gameState.staffMarket.find(s => s.id === staffId);
    if (staffPerson && gameState.funds >= staffPerson.salary) {
        gameState.funds -= staffPerson.salary;
        gameState.staff.push(staffPerson);
        gameState.staffMarket = gameState.staffMarket.filter(s => s.id !== staffId);
    }
    return { ...gameState };
};

export const fireStaff = (gameState: GameState, staffId: string): GameState => {
    gameState.staff = gameState.staff.filter(s => s.id !== staffId);
    return { ...gameState };
};

export const upgradeCoachSkill = (gameState: GameState, skillKey: string): GameState => {
    const skill = gameState.coach.skillTree[skillKey as keyof CoachSkillTree];
    if (skill && skill.level < skill.maxLevel && gameState.coach.points >= skill.cost[skill.level]) {
        gameState.coach.points -= skill.cost[skill.level];
        skill.level++;
    }
    return { ...gameState };
};

export const handleTrainingCamp = (gameState: GameState, assignments: {playerId: string, focus: TrainingFocus}[]): GameState => {
    const myTeam = gameState.teams.find(t => t.id === gameState.myTeamId)!;
    assignments.forEach(({ playerId, focus }) => {
        const player = myTeam.roster.find(p => p.id === playerId);
        if (player) {
            // simple progression
            Object.keys(player.attributes).forEach(key => {
                const attr = key as keyof Player['attributes'];
                if (rand(1, 3) === 1) { // 1/3 chance to get +1
                     player.attributes[attr] = Math.min(99, player.attributes[attr] + 1);
                }
            });
            player.attributes.OVR = calculatePlayerOvr(player.attributes);
        }
    });
    myTeam.ovr = calculateTeamOvr(myTeam.roster);
    return { ...gameState };
};

export const saveCustomPlaybook = (gameState: GameState, playbook: CustomPlaybook): GameState => {
    const index = gameState.customPlaybooks.findIndex(p => p.id === playbook.id);
    if (index > -1) {
        gameState.customPlaybooks[index] = playbook;
    } else {
        gameState.customPlaybooks.push(playbook);
    }
    return { ...gameState };
};

export const deleteCustomPlaybook = (gameState: GameState, playbookId: string): GameState => {
    gameState.customPlaybooks = gameState.customPlaybooks.filter(p => p.id !== playbookId);
    return { ...gameState };
};

export const signFromTransferPortal = (gameState: GameState, playerId: string): GameState => {
    const player = gameState.transferPortal.find(p => p.id === playerId);
    const myTeam = gameState.teams.find(t => t.id === gameState.myTeamId);
    if (player && myTeam) {
        const cost = player.attributes.OVR * 1000;
        if (gameState.funds >= cost) {
            gameState.funds -= cost;
            myTeam.roster.push(player);
            gameState.transferPortal = gameState.transferPortal.filter(p => p.id !== playerId);
        }
    }
    return { ...gameState };
};

export const handleTransferRequest = (gameState: GameState, newTeamId: number): GameState => {
    if (gameState.gameMode !== 'MY_CAREER' || !gameState.myPlayerId) return gameState;

    const oldTeam = gameState.teams.find(t => t.id === gameState.myTeamId)!;
    const player = oldTeam.roster.find(p => p.id === gameState.myPlayerId)!;
    
    oldTeam.roster = oldTeam.roster.filter(p => p.id !== gameState.myPlayerId);
    
    const newTeam = gameState.teams.find(t => t.id === newTeamId)!;
    newTeam.roster.push(player);
    
    gameState.myTeamId = newTeamId;
    
    updateVarsityDepthCharts(oldTeam, gameState);
    updateJVDepthCharts(oldTeam);
    oldTeam.ovr = calculateTeamOvr(oldTeam.roster);

    updateVarsityDepthCharts(newTeam, gameState);
    updateJVDepthCharts(newTeam);
    newTeam.ovr = calculateTeamOvr(newTeam.roster);

    return { ...gameState };
};

export const commitToCollege = (gameState: GameState, offer: CollegeOffer): { newState: GameState, notification: string } => {
    if (gameState.gameMode !== 'MY_CAREER' || !gameState.myPlayerId) {
        return { newState: gameState, notification: "Error." };
    }
    const player = gameState.teams.find(t => t.id === gameState.myTeamId)?.roster.find(p => p.id === gameState.myPlayerId);
    if (!player || player.year !== 'SR') {
        return { newState: gameState, notification: "You can only commit in your Senior year." };
    }

    gameState.committedCollege = offer;
    gameState.commitmentPhase = 'COMMITTED';
    const notification = `You have committed to ${offer.collegeName}!`;
    
    gameState.inbox.push({
        id: crypto.randomUUID(),
        week: gameState.week,
        season: gameState.season,
        from: "Your Family",
        subject: "We're so proud!",
        body: `We heard the news about you committing to ${offer.collegeName}! We couldn't be more proud of you. All your hard work has paid off.`,
        read: false,
        type: 'COMMITMENT'
    });
    const article = generateNewsArticle(gameState, 'COMMITMENT', { committedPlayerName: player.name, committedPlayerId: player.id, committedCollegeName: offer.collegeName });
    if (article) gameState.news.push(article);

    return { newState: { ...gameState }, notification };
};

export const selectTop5Colleges = (gameState: GameState, top5: CollegeOffer[]): GameState => {
    if (gameState.gameMode !== 'MY_CAREER') return gameState;
    gameState.top5Colleges = top5;
    gameState.commitmentPhase = 'NONE'; // Phase is over
    return { ...gameState };
};

export const startGame = (gameState: GameState, myTeamId: number, opponentId: number): ActiveGameState => {
    return {
        quarter: 1,
        time: 60 * 5, // 5 min quarter
        down: 1,
        distance: 10,
        yardLine: 25,
        possession: 'player',
        playerScore: 0,
        opponentScore: 0,
        gameId: `${myTeamId}-${opponentId}-${gameState.week}`,
        opponentId,
        playLog: ["The game is underway!"],
        isGameOver: false,
        momentum: 0,
        playerTeamStats: {},
        opponentTeamStats: {},
        playerTeamId: myTeamId,
    };
};

export const resolvePlay = async (gameState: GameState, play: CustomOffensivePlay | CustomDefensivePlay): Promise<GameState> => {
    // This is a simplified placeholder
    if (!gameState.activeGame) return gameState;
    
    const activeGame = gameState.activeGame;
    const yardsGained = rand(-5, 20);
    const newYardLine = activeGame.yardLine + yardsGained;
    
    activeGame.playLog.push(`${play.name} resulted in a ${yardsGained} yard gain.`);
    activeGame.time -= rand(10, 30);
    
    if (newYardLine >= 100) {
        // Touchdown
        activeGame.playerScore += 7;
        activeGame.yardLine = 25;
        activeGame.possession = 'opponent'; // Simplified
    } else {
        activeGame.yardLine = newYardLine;
        activeGame.distance -= yardsGained;
        if (activeGame.distance <= 0) {
            activeGame.down = 1;
            activeGame.distance = 10;
        } else {
            activeGame.down++;
        }
    }

    if (activeGame.down > 4) {
        // Turnover on downs
        activeGame.possession = 'opponent';
        activeGame.yardLine = 100 - activeGame.yardLine;
        activeGame.down = 1;
        activeGame.distance = 10;
    }

    if (activeGame.time <= 0) {
        activeGame.quarter++;
        if (activeGame.quarter > 4) {
            activeGame.isGameOver = true;
            return await simToEndOfGame(gameState);
        }
        activeGame.time = 60 * 5;
    }
    
    return { ...gameState };
};

export const simToEndOfGame = async (gameState: GameState): Promise<GameState> => {
    if (!gameState.activeGame) return gameState;
    
    const myTeamId = gameState.activeGame.playerTeamId;
    const oppId = gameState.activeGame.opponentId;
    
    const { team1Score, team2Score, playerStats } = await simulateGame(gameState, myTeamId, oppId);
    
    const finalState = await applyGameResults(gameState, myTeamId, oppId, team1Score, team2Score, playerStats, false, gameState.activeGame.playLog);
    finalState.activeGame = null;
    return finalState;
};

export const transitionToCollegeCareer = (gameState: GameState): GameState => {
    // Simplified transition
    gameState.gameMode = 'COLLEGE_CAREER';
    const collegeTeam: CollegeTeam = {
        id: gameState.committedCollege!.collegeName,
        name: gameState.committedCollege!.collegeName,
        ovr: 85,
        roster: [], // Add player
        prestige: gameState.committedCollege!.prestige,
        conference: "Big 12",
        record: { wins: 0, losses: 0 },
        confRecord: { wins: 0, losses: 0 },
    };
    const player = gameState.teams.flatMap(t => t.roster).find(p => p.id === gameState.myPlayerId)!;
    player.year = 'FR';
    collegeTeam.roster.push(player);
    
    const collegeGameState: CollegeGameState = {
        season: 'FR',
        week: 1,
        teams: [collegeTeam],
        conferences: [],
        schedule: {},
        nationalRankings: [],
        playoffTeams: [],
        nationalChampion: null,
        trophyCase: [],
        sponsors: [],
        news: [],
    };
    gameState.collegeGameState = collegeGameState;
    
    return { ...gameState };
};

export const advanceCollegeWeek = (gameState: GameState): GameState => {
    if (!gameState.collegeGameState) return gameState;
    gameState.collegeGameState.week++;
    return { ...gameState };
};


export const applyImmediateGodModeEffects = (gameState: GameState, setting: keyof GodModeState): GameState => {
    const newState = { ...gameState };
    if (!newState.godMode) return newState;

    const isActive = newState.godMode[setting];

    switch (setting) {
        case 'unlimitedFunds':
            if (isActive) newState.funds = 999999999;
            break;
        case 'maxFacilities':
            if (isActive) {
                newState.facilities.coaching.level = 5;
                newState.facilities.training.level = 5;
                newState.facilities.rehab.level = 5;
                newState.facilities.tutoring.level = 5;
            }
            break;
        case 'perfectMorale':
            if (isActive) {
                newState.teams.forEach(team => {
                    team.roster.forEach(p => p.morale = 100);
                });
            }
            break;
        case 'maxCoaching':
            if (isActive) {
                Object.keys(newState.coach.skillTree).forEach(key => {
                    const skill = newState.coach.skillTree[key as keyof CoachSkillTree];
                    skill.level = skill.maxLevel;
                });
            }
            break;
        case 'makeMyPlayer99':
            if (isActive && newState.myPlayerId && newState.myTeamId) {
                const myTeam = newState.teams.find(t => t.id === newState.myTeamId);
                if (myTeam) {
                    const player = myTeam.roster.find(p => p.id === newState.myPlayerId);
                    if (player) {
                        player.attributes.Speed = 99;
                        player.attributes.Strength = 99;
                        player.attributes.Stamina = 99;
                        player.attributes.Tackle = 99;
                        player.attributes.Catch = 99;
                        player.attributes.Pass = 99;
                        player.attributes.Block = 99;
                        player.attributes.Consistency = 99;
                        player.attributes.OVR = 99;
                    }
                }
            }
            break;
        case 'makeMyTeam99':
            if (isActive && newState.myTeamId) {
                 const myTeam = newState.teams.find(t => t.id === newState.myTeamId);
                 if (myTeam) {
                     myTeam.roster.forEach(player => {
                         Object.keys(player.attributes).forEach(attr => {
                            const key = attr as keyof Player['attributes'];
                            if (key !== 'Potential') {
                                player.attributes[key] = 99;
                            }
                         });
                     });
                     myTeam.ovr = 99;
                 }
            }
            break;
    }

    return newState;
};

export const advanceWeek = async (gState: GameState): Promise<{ newState: GameState, notification?: string }> => {
    let gameState = JSON.parse(JSON.stringify(gState));
    let notification: string | undefined = undefined;

    // Sim JV Games first
    const jvScheduleForWeek = Object.entries(gameState.jvSchedule)
        .flatMap(([teamId, games]) => (games as Game[]).filter(g => g.week === gameState.week && !g.result).map(g => ({ ...g, teamId: parseInt(teamId) })))
        .filter(game => game.teamId < game.opponentId);

    for (const game of jvScheduleForWeek) {
        const { team1Score, team2Score, playerStats } = await simulateGame(gameState, game.teamId, game.opponentId);
        gameState = await applyGameResults(gameState, game.teamId, game.opponentId, team1Score, team2Score, playerStats, false, [], 'JV');
    }

    // Then sim Varsity Games
    const scheduleForWeek = Object.entries(gameState.schedule)
        .flatMap(([teamId, games]) => (games as Game[]).filter(g => g.week === gameState.week && !g.result).map(g => ({ ...g, teamId: parseInt(teamId) })))
        .filter(game => game.teamId < game.opponentId); 

    for (const game of scheduleForWeek) {
        const { team1Score, team2Score, playerStats } = await simulateGame(gameState, game.teamId, game.opponentId);
        gameState = await applyGameResults(gameState, game.teamId, game.opponentId, team1Score, team2Score, playerStats, game.isRivalryGame || false, []);
    }
    
    gameState.week++;

    if (gameState.gameMode === 'MY_CAREER') {
        const result = evaluateMyCareerPlayerStatus(gameState);
        gameState = result.newState;
        notification = result.notification;
    }
    
    const oldRankings = [...gameState.nationalRankings];
    gameState.nationalRankings = updateRankings(gameState.teams);
    
    if (gameState.myTeamId) {
        const myTeamId = gameState.myTeamId;
        const oldRank = oldRankings.find(r => r.teamId === myTeamId)?.rank;
        const newRank = gameState.nationalRankings.find(r => r.teamId === myTeamId)?.rank;
        const myTeam = gameState.teams.find(t => t.id === myTeamId);
        if (myTeam && oldRank && newRank && oldRank !== newRank) {
            const article = generateNewsArticle(gameState, 'RANKING', { teamName: myTeam.name, teamId: myTeamId, oldRank, newRank });
            if (article) gameState.news.push(article);
        }
    }

    gameState = findAndAnnouncePlayerOfTheWeek(gameState);

    if (gameState.week === 11) {
        gameState.playoffBracket = generatePlayoffBracket(gameState.teams);
        // FIX: Added type assertion to PlayoffBracket[] as Object.values was returning unknown[].
        (Object.values(gameState.playoffBracket) as PlayoffBracket[]).forEach(bracket => {
            bracket.quarterfinals.forEach(matchup => {
                const team1 = gameState.teams.find(t => t.id === matchup.team1Id)!;
                const team2 = gameState.teams.find(t => t.id === matchup.team2Id)!;
                const game1: Game = { week: 11, opponentId: team2.id, isHome: true, playoffRound: 'Quarterfinals' };
                const game2: Game = { week: 11, opponentId: team1.id, isHome: false, playoffRound: 'Quarterfinals' };
                gameState.schedule[team1.id].push(game1);
                gameState.schedule[team2.id].push(game2);
            });
        });
        
        // FIX: Added type assertion to PlayoffBracket[] as Object.values was returning unknown[].
        const playoffTeamIds = new Set((Object.values(gameState.playoffBracket) as PlayoffBracket[]).flatMap(b => b.quarterfinals.flatMap(m => [m.team1Id, m.team2Id])));
        if (gameState.myTeamId && !playoffTeamIds.has(gameState.myTeamId)) {
            gameState.isEliminated = true;
        }
    }

    if (gameState.week >= 12 && gameState.week <= 16) {
        gameState = handlePlayoffAdvancement(gameState, gameState.week - 1);
        if (gameState.myTeamId && !gameState.isEliminated) {
            const mySchedule = gameState.schedule[gameState.myTeamId];
            const nextGame = mySchedule.find(g => g.week === gameState.week);
            if (!nextGame) {
                gameState.isEliminated = true;
            }
        }
    }
    
    if (gameState.week === 16) {
        gameState.isOffseason = true;
        gameState = calculateAndSetJVAwards(gameState);
        gameState = calculateAndSetVarsityAwards(gameState);
        // FIX: Generate transfer offers for MyCareer mode.
        if (gameState.gameMode === 'MY_CAREER') {
            gameState = generateMyCareerTransferOffers(gameState);
        }
    }
    
    gameState.teams.forEach(team => {
        team.roster.forEach(player => {
            if (player.isInjured > 0) player.isInjured--;
            if (player.isSuspended > 0) player.isSuspended--;
            player.currentStamina = 100;
        });
    });
    
    gameState = handleAcademics(gameState);

    return { newState: gameState, notification };
};