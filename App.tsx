

import * as React from 'react';
import { GameState, Screen, Team, Player, Game, Position, GameStrategy, Recruit, PlayerStats, OffensivePlaybook, DefensivePlaybook, SeasonAwards, Trophy, ActiveGameState, OffensivePlay } from './types';
import { POWERHOUSE_TEAMS, MAX_SEASONS } from './constants';
import * as GameService from './services/gameService';
import { FootballIcon, RosterIcon, ScheduleIcon, StandingsIcon, FacilitiesIcon, AwardIcon, RecruitIcon, GodModeIcon, ChartIcon, InboxIcon, CoachIcon, SponsorIcon, TrophyIcon, TacticsIcon } from './components/Icons';

// --- HELPER & UI COMPONENTS ---

const ScreenWrapper = ({ children, screenKey }: { children: React.ReactNode, screenKey: Screen }) => (
    <div key={screenKey} className="fade-in">
        {children}
    </div>
);

// FIX: Use React.FC to correctly type the component and handle special React props like `key`.
const Button: React.FC<{ onClick?: React.MouseEventHandler<HTMLButtonElement>; children?: React.ReactNode; className?: string; disabled?: boolean }> = ({ onClick, children, className = '', disabled }) => (
  <button 
    onClick={onClick} 
    disabled={disabled}
    className={`w-full text-left p-4 border-2 border-cyan-400 bg-black/50 transition-all duration-200 uppercase font-press-start text-sm md:text-base ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-cyan-400 hover:text-black'}`}
  >
    {children}
  </button>
);

const Modal = ({ children, onClose, size = '4xl' }: { children?: React.ReactNode, onClose?: () => void, size?: 'xl' | '2xl' | '3xl' | '4xl' | 'full' }) => (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className={`bg-gray-900 border-2 border-cyan-400 p-6 max-w-${size} w-full max-h-[90vh] overflow-y-auto`} onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>
);

const Loading = ({ text }: { text: string }) => (
    <div className="fixed inset-0 bg-black/90 flex flex-col items-center justify-center p-4 z-[100]">
        <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-cyan-400"></div>
        <p className="text-cyan-400 font-press-start mt-4 text-center">{text}</p>
    </div>
);

const Header = ({ title, onBack }: { title: string; onBack?: () => void; }) => (
  <div className="text-center p-4 border-b-4 border-cyan-400 bg-gray-800/50 relative">
    {onBack && <button onClick={onBack} className="absolute left-4 top-1/2 -translate-y-1/2 text-cyan-400 hover:text-white font-press-start text-sm">&lt; BACK</button>}
    <h1 className="text-2xl md:text-4xl text-cyan-400 font-press-start">{title}</h1>
  </div>
);

const StatBar = ({ value, max = 100, colorClass }: { value: number, max?: number, colorClass?: string }) => {
  const percentage = Math.max(0, Math.min(100, (value / max) * 100));
  let color = colorClass;
  if (!color) {
    if (percentage > 70) color = 'bg-green-500';
    else if (percentage > 40) color = 'bg-yellow-500';
    else color = 'bg-red-500'
  }
  
  return (
    <div className="w-24 h-4 bg-gray-700 border border-gray-500">
      <div className={`${color} h-full`} style={{ width: `${percentage}%` }}></div>
    </div>
  );
};


// --- SCREEN COMPONENTS ---

const TeamSelectionScreen = ({ onTeamSelect }: { onTeamSelect: (teamId: number) => void }) => (
  <div className="p-4 md:p-8">
    <Header title="Choose Your Team" />
    <div className="mt-6 text-center">
      <p className="mb-8 text-lg text-gray-300">Select a powerhouse to begin your coaching career.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl mx-auto">
        {POWERHOUSE_TEAMS.map(team => (
          <button key={team.id} onClick={() => onTeamSelect(team.id)} className="p-4 bg-gray-800 hover:bg-cyan-600 border border-gray-600 text-left transition-colors">
            <h3 className="font-bold text-lg text-white">{team.name}</h3>
          </button>
        ))}
      </div>
    </div>
  </div>
);

const MainMenu = ({ gameState, setScreen, onPlayNextGame, onStartRecruitment, onGodModeClick }: { gameState: GameState, setScreen: (screen: Screen) => void; onPlayNextGame: () => void; onStartRecruitment: () => void; onGodModeClick: () => void; }) => {
  const myTeam = gameState.teams.find(t => t.id === gameState.myTeamId)!;
  const isPlayoffs = gameState.week > 10;
  let nextOpponent: Team | null = null;
  let nextGame: Game | null = null;

  const opponentId = GameService.findNextOpponentId(gameState);
  if (opponentId) {
    nextOpponent = gameState.teams.find(t => t.id === opponentId) || null;
    nextGame = gameState.schedule[myTeam.id]?.find(g => g.week === gameState.week) || { week: gameState.week, opponentId: opponentId, isHome: true, playoffRound: gameState.week === 11 ? 'Quarterfinals' : gameState.week === 12 ? 'Semifinals' : 'Championship' };
  }

  const isGameOver = gameState.season > MAX_SEASONS;

  return (
    <div className="p-4 md:p-8">
      <div className="text-center mb-8">
        <h1 className="text-2xl md:text-3xl text-cyan-400 font-press-start">{myTeam.name}</h1>
        <p className="text-lg mt-2">Season {gameState.season} | {isPlayoffs ? nextGame?.playoffRound || 'Playoffs' : `Week ${gameState.week}`}</p>
        <p className="text-xl font-bold">{myTeam.record.wins} - {myTeam.record.losses}</p>
        <div className="text-md text-gray-400 mt-2 space-x-4">
          <span>Funds: ${gameState.funds.toLocaleString()}</span>
          <span>Fans: <span className={gameState.fanHappiness > 70 ? 'text-green-400' : gameState.fanHappiness > 40 ? 'text-yellow-400' : 'text-red-400'}>{gameState.fanHappiness}%</span></span>
        </div>
      </div>
      
      <div className="max-w-xl mx-auto space-y-4">
        <div className="p-4 border-2 border-dashed border-gray-600 text-center">
          <h2 className="uppercase text-gray-400 text-sm mb-2">Next Game</h2>
          {nextOpponent ? (
            <p className="text-xl font-bold">{nextGame?.isHome ? 'vs.' : '@'} {nextOpponent.name} ({nextOpponent.record.wins}-{nextOpponent.record.losses}) {nextGame?.isRivalryGame && <span className="text-red-500 font-press-start text-sm animate-pulse">RIVALRY</span>}</p>
          ) : gameState.isOffseason ? (
            <p className="text-xl font-bold text-yellow-400">OFFSEASON</p>
          ) : isGameOver ? (
             <p className="text-xl font-bold text-red-500">CAREER OVER</p>
          ) : isPlayoffs ? (
            <p className="text-xl font-bold text-green-400">CHAMPION!</p>
          ) : (
            <p className="text-xl font-bold">End of Regular Season</p>
          )}
        </div>

        {gameState.lastGameResult && (
             <div className="p-4 border-2 border-dashed border-gray-600 text-center">
                <h2 className="uppercase text-gray-400 text-sm mb-2">Last Game Result</h2>
                <p className={`text-xl font-bold ${gameState.lastGameResult.myScore > gameState.lastGameResult.opponentScore ? 'text-green-400' : 'text-red-400'}`}>
                    {gameState.lastGameResult.myScore > gameState.lastGameResult.opponentScore ? 'W' : 'L'} {gameState.lastGameResult.summary}
                </p>
            </div>
        )}
        
        {nextOpponent && !gameState.isOffseason && <Button onClick={onPlayNextGame}><span className="flex items-center"><FootballIcon className="w-5 h-5 mr-3" /> Play Next Game</span></Button>}
        {gameState.isOffseason && !isGameOver && <Button onClick={onStartRecruitment} className="text-green-400 border-green-400 hover:bg-green-400"><span className="flex items-center"><RecruitIcon className="w-5 h-5 mr-3" /> Go To Recruitment</span></Button>}
        <div className="grid grid-cols-2 gap-4">
            <Button onClick={() => setScreen('ROSTER')}><span className="flex items-center"><RosterIcon className="w-5 h-5 mr-3" /> Roster</span></Button>
            <Button onClick={() => setScreen('TACTICS')}><span className="flex items-center"><TacticsIcon className="w-5 h-5 mr-3" /> Tactics</span></Button>
            <Button onClick={() => setScreen('SCHEDULE')}><span className="flex items-center"><ScheduleIcon className="w-5 h-5 mr-3" /> Schedule</span></Button>
            <Button onClick={() => setScreen('STANDINGS')}><span className="flex items-center"><StandingsIcon className="w-5 h-5 mr-3" /> Standings</span></Button>
            <Button onClick={() => setScreen('NATIONAL_STATS')}><span className="flex items-center"><ChartIcon className="w-5 h-5 mr-3" /> National Stats</span></Button>
            <Button onClick={() => setScreen('TROPHY_CASE')}><span className="flex items-center"><TrophyIcon className="w-5 h-5 mr-3" /> Trophy Case</span></Button>
            <Button onClick={() => setScreen('AWARDS')}><span className="flex items-center"><AwardIcon className="w-5 h-5 mr-3" /> Awards</span></Button>
            <Button onClick={() => setScreen('FACILITIES')}><span className="flex items-center"><FacilitiesIcon className="w-5 h-5 mr-3" /> Facilities</span></Button>
        </div>
        <Button onClick={onGodModeClick} className="text-yellow-400 border-yellow-400 hover:bg-yellow-400"><span className="flex items-center"><GodModeIcon className="w-5 h-5 mr-3" /> God Mode</span></Button>
      </div>
    </div>
  );
};

const RosterScreen = ({ gameState, setScreen, onPlayerSelected }: { gameState: GameState, setScreen: (screen: Screen) => void, onPlayerSelected: (player: Player) => void }) => {
    const myTeam = gameState.teams.find(t => t.id === gameState.myTeamId)!;

    return (
        <div>
            <Header title="Roster" onBack={() => setScreen('MAIN_MENU')} />
            <div className="p-2 md:p-4">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm md:text-base">
                        <thead className="text-left text-gray-400 uppercase">
                            <tr>
                                <th className="p-2">Name</th>
                                <th className="p-2">Pos</th>
                                <th className="p-2">Yr</th>
                                <th className="p-2">OVR</th>
                                <th className="p-2">Stamina</th>
                                <th className="p-2 hidden md:table-cell">Morale</th>
                                <th className="p-2">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {[...myTeam.roster].sort((a, b) => b.attributes.OVR - a.attributes.OVR).map(p => (
                                <tr key={p.id} className="border-b border-gray-700 hover:bg-gray-800 cursor-pointer" onClick={() => onPlayerSelected(p)}>
                                    <td className="p-2 font-bold">{p.name}</td>
                                    <td className="p-2">{p.position}</td>
                                    <td className="p-2">{p.year}</td>
                                    <td className="p-2"><StatBar value={p.attributes.OVR} max={99} /></td>
                                    <td className="p-2"><StatBar value={p.currentStamina}/></td>
                                    <td className="p-2 hidden md:table-cell"><StatBar value={p.morale}/></td>
                                    <td className="p-2">{p.isInjured > 0 ? <span className="text-red-500">INJ ({p.isInjured}w)</span> : <span className="text-green-400">OK</span>}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const ScheduleScreen = ({ gameState, setScreen, onGameSelected }: { gameState: GameState; setScreen: (screen: Screen) => void; onGameSelected: (game: Game) => void; }) => {
    const myTeam = gameState.teams.find(t => t.id === gameState.myTeamId)!;
    const mySchedule = gameState.schedule[myTeam.id];

    const renderPlayoffBracket = () => {
        if (!gameState.playoffBracket) return <p>No playoffs this season.</p>;

        return (
            <div className="flex justify-around font-mono text-sm">
                {gameState.playoffBracket.map((roundData, roundIndex) => (
                    <div key={roundIndex} className="flex flex-col justify-around">
                        <h3 className="text-center font-press-start text-cyan-400 mb-4">{['Quarterfinals', 'Semifinals', 'Championship'][roundIndex]}</h3>
                        <div className="space-y-8">
                        {roundData.matchups.map((matchup, matchIndex) => {
                            const team1 = gameState.teams.find(t => t.id === matchup.team1Id)!;
                            const team2 = gameState.teams.find(t => t.id === matchup.team2Id)!;
                            const winnerId = matchup.winnerId;
                            return (
                                <div key={matchIndex} className="p-2 bg-gray-800 border-l-4 border-gray-600">
                                    <p className={`${winnerId === team1.id ? 'font-bold text-white' : winnerId ? 'text-gray-500' : ''}`}>{team1.name}</p>
                                    <p className={`${winnerId === team2.id ? 'font-bold text-white' : winnerId ? 'text-gray-500' : ''}`}>{team2.name}</p>
                                    {matchup.game?.result && <p className="text-xs text-cyan-400">{matchup.game.result.summary}</p>}
                                </div>
                            );
                        })}
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div>
            <Header title="Schedule" onBack={() => setScreen('MAIN_MENU')} />
            <div className="p-4 md:p-8 max-w-5xl mx-auto">
                {mySchedule && mySchedule.length > 0 ? (
                    <div className="space-y-2">
                        {mySchedule.map(game => {
                            const opponent = gameState.teams.find(t => t.id === game.opponentId)!;
                            let resultText = '';
                            let resultColor = 'text-gray-400';

                            if (game.result) {
                                const won = game.result.myScore > game.result.opponentScore;
                                resultText = `${won ? 'W' : 'L'} ${game.result.summary}`;
                                resultColor = won ? 'text-green-400' : 'text-red-400';
                            }

                            return (
                                <div key={`${game.week}-${game.opponentId}`} className={`p-4 flex justify-between items-center cursor-pointer hover:bg-gray-700 ${game.week < gameState.week ? 'bg-gray-800' : 'bg-gray-800/50'}`} onClick={() => onGameSelected(game)}>
                                    <div className="flex items-center">
                                        <span className="w-8 text-gray-500">W{game.week}</span>
                                        <span>{game.isHome ? 'vs' : '@'} {opponent.name}</span>
                                        {game.isRivalryGame && <span className="ml-4 text-xs font-bold text-red-500 uppercase">Rivalry</span>}
                                        <span className="ml-4 text-xs text-gray-400">({game.weather})</span>
                                    </div>
                                    <div className={`font-bold text-lg ${resultColor}`}>{resultText}</div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    renderPlayoffBracket()
                )}
            </div>
        </div>
    );
};

const StandingsScreen = ({ gameState, setScreen }: { gameState: GameState, setScreen: (screen: Screen) => void }) => (
    <div>
        <Header title="National Standings" onBack={() => setScreen('MAIN_MENU')} />
        <div className="p-4 md:p-8 max-w-3xl mx-auto">
            <h2 className="font-press-start text-xl text-cyan-400 mb-4">Top 25 Poll</h2>
            <div className="space-y-1">
                {gameState.nationalRankings.map(({teamId, rank}) => {
                    const team = gameState.teams.find(t => t.id === teamId)!;
                    const isMyTeam = team.id === gameState.myTeamId;
                    return (
                        <div key={teamId} className={`p-3 flex items-center ${isMyTeam ? 'bg-cyan-900/50 border border-cyan-400' : 'bg-gray-800/50'}`}>
                           <span className="font-bold w-10">{rank}.</span>
                           <span className="flex-grow">{team.name}</span>
                           <span className="font-mono">({team.record.wins}-{team.record.losses})</span>
                        </div>
                    );
                })}
            </div>
        </div>
    </div>
);

const StatVisualBar = ({ value, maxValue }: { value: number, maxValue: number }) => {
    const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;
    return (
        <div className="w-full h-4 bg-gray-700 border border-gray-600">
            <div className="bg-cyan-500 h-full" style={{ width: `${percentage}%` }}></div>
        </div>
    );
};


const NationalStatsScreen = ({ gameState, setScreen, onPlayerSelected }: { gameState: GameState, setScreen: (screen: Screen) => void, onPlayerSelected: (player: Player) => void }) => {
    const [leaders, setLeaders] = React.useState<Record<string, Player[]>>({});
    const [statCategory, setStatCategory] = React.useState<keyof PlayerStats>('passYds');

    React.useEffect(() => {
        setLeaders(GameService.getNationalLeaders(gameState.teams));
    }, [gameState.teams]);

    const statLabels: Record<keyof PlayerStats, string> = {
        passYds: 'Passing Yards', passTDs: 'Passing TDs', rushYds: 'Rushing Yards', rushTDs: 'Rushing TDs',
        recYds: 'Receiving Yards', recTDs: 'Receiving TDs', tackles: 'Tackles', sacks: 'Sacks', ints: 'Interceptions',
        gamesPlayed: 'Games Played'
    };

    const currentLeaders = leaders[statCategory] || [];
    const maxValue = currentLeaders.length > 0 ? currentLeaders[0].seasonStats[statCategory] : 0;

    return (
        <div>
            <Header title="National Leaders" onBack={() => setScreen('MAIN_MENU')} />
            <div className="p-4 md:p-8 max-w-5xl mx-auto">
                <div className="flex flex-wrap justify-center gap-2 mb-6">
                    {Object.keys(statLabels).filter(s => s !== 'gamesPlayed').map(key => (
                         <button 
                            key={key}
                            onClick={() => setStatCategory(key as keyof PlayerStats)}
                            className={`px-3 py-1 text-sm font-press-start ${statCategory === key ? 'bg-cyan-400 text-black' : 'bg-gray-700'}`}
                         >
                             {statLabels[key as keyof PlayerStats]}
                         </button>
                    ))}
                </div>
                <div>
                    <h2 className="font-press-start text-xl text-cyan-400 mb-4">{statLabels[statCategory]}</h2>
                     <table className="w-full text-sm md:text-base">
                        <thead className="text-left text-gray-400 uppercase">
                            <tr>
                                <th className="p-2 w-8">#</th>
                                <th className="p-2 w-1/3">Name</th>
                                <th className="p-2 w-1/3 hidden md:table-cell">Team</th>
                                <th className="p-2 text-right">Stat</th>
                                <th className="p-2 w-1/3"> </th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentLeaders.map((p, index) => {
                                const team = gameState.teams.find(t => t.roster.some(pl => pl.id === p.id));
                                return (
                                <tr key={p.id} className="border-b border-gray-700 hover:bg-gray-800 cursor-pointer" onClick={() => onPlayerSelected(p)}>
                                    <td className="p-2">{index + 1}</td>
                                    <td className="p-2 font-bold">{p.name} <span className="text-gray-400">({p.position}, {p.year})</span></td>
                                    <td className="p-2 text-xs hidden md:table-cell">{team?.name}</td>
                                    <td className="p-2 text-right font-bold text-cyan-300 w-16">{p.seasonStats[statCategory]}</td>
                                    <td className="p-2"><StatVisualBar value={p.seasonStats[statCategory]} maxValue={maxValue} /></td>
                                </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

const FacilitiesScreen = ({ gameState, setGameState, setScreen }: { gameState: GameState, setGameState: React.Dispatch<React.SetStateAction<GameState | null>>, setScreen: (screen: Screen) => void }) => {
    const upgradeFacility = (facility: keyof GameState['facilities']) => {
        setGameState(prev => {
            if (!prev) return null;
            const current = prev.facilities[facility];
            if (prev.funds >= current.cost) {
                return {
                    ...prev,
                    funds: prev.funds - current.cost,
                    facilities: { ...prev.facilities, [facility]: { level: current.level + 1, cost: Math.floor(current.cost * 2.5) } }
                }
            }
            return prev;
        });
    };
    
    const descriptions = {
        coaching: "Better coaching improves player development in the offseason.",
        training: "Improves weekly stamina recovery for all players.",
        rehab: "Reduces the duration of player injuries."
    };

    return (
        <div>
            <Header title="Facilities" onBack={() => setScreen('MAIN_MENU')} />
            <div className="p-4 md:p-8 max-w-3xl mx-auto">
                <p className="text-center mb-6">Funds: <span className="font-bold text-green-400">${gameState.funds.toLocaleString()}</span></p>
                <div className="space-y-6">
                    {Object.entries(gameState.facilities).map(([key, facility]) => (
                        <div key={key} className="p-4 bg-gray-800/50 border border-gray-700">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h3 className="font-press-start text-lg capitalize">{key}</h3>
                                    <p className="text-gray-400">Current Level: {facility.level}</p>
                                </div>
                                <Button 
                                    onClick={() => upgradeFacility(key as keyof GameState['facilities'])} 
                                    disabled={gameState.funds < facility.cost} 
                                    className="w-auto !text-center text-sm"
                                >
                                    Upgrade for ${facility.cost.toLocaleString()}
                                </Button>
                            </div>
                            <p className="text-sm text-gray-500 mt-2">{descriptions[key as keyof typeof descriptions]}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const AwardCard: React.FC<{title: string, player: Player | null}> = ({ title, player }) => (
    <div className="bg-gray-800 p-4">
        <h3 className="font-press-start text-yellow-400 text-lg">{title}</h3>
        {player ? (
            <p className="text-white mt-2">{player.name} <span className="text-gray-400">({player.position})</span></p>
        ) : <p className="text-gray-500 mt-2">N/A</p>}
    </div>
);

const AwardsScreen = ({ gameState, setScreen }: { gameState: GameState, setScreen: (screen: Screen) => void }) => {
    const { mvp, allAmerican, ...positionalAwards } = gameState.seasonAwards || { mvp: null, allAmerican: [] };

    return (
        <div>
            <Header title="Season Awards" onBack={() => setScreen('MAIN_MENU')} />
            <div className="p-4 md:p-8 max-w-5xl mx-auto text-center">
                {gameState.isOffseason ? (
                    <div>
                        <AwardCard title="National MVP" player={mvp} />
                        <h2 className="font-press-start text-2xl text-yellow-400 my-8">Positional Awards</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {Object.entries(positionalAwards).map(([key, player]) => (
                                <AwardCard key={key} title={key.replace('best', 'Best ')} player={player as Player} />
                            ))}
                        </div>
                    </div>
                ) : (
                    <p className="text-gray-400">Awards are announced during the offseason.</p>
                )}
            </div>
        </div>
    );
};

const TrophyCaseScreen = ({ gameState, setScreen }: { gameState: GameState, setScreen: (screen: Screen) => void }) => {
    const trophiesBySeason: Record<number, Trophy[]> = {};
    gameState.trophyCase.forEach(trophy => {
        if (!trophiesBySeason[trophy.season]) {
            trophiesBySeason[trophy.season] = [];
        }
        trophiesBySeason[trophy.season].push(trophy);
    });
    const sortedSeasons = Object.keys(trophiesBySeason).map(Number).sort((a, b) => b - a);

    return (
        <div>
            <Header title="Trophy Case" onBack={() => setScreen('MAIN_MENU')} />
            <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-8">
                {sortedSeasons.length > 0 ? sortedSeasons.map(season => (
                    <div key={season}>
                        <h2 className="font-press-start text-2xl text-cyan-400 border-b-2 border-cyan-400 pb-2 mb-4">Season {season}</h2>
                        <div className="space-y-2">
                            {trophiesBySeason[season].map((trophy, index) => (
                                <div key={index} className="p-3 bg-gray-800 flex items-center gap-4">
                                    <TrophyIcon className="w-8 h-8 text-yellow-400"/>
                                    <div>
                                        <p className="font-bold text-lg">{trophy.award}</p>
                                        {trophy.playerName && <p className="text-gray-400">{trophy.playerName}</p>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )) : (
                    <p className="text-center text-gray-500 text-lg">Your trophy case is empty. Go win some championships!</p>
                )}
            </div>
        </div>
    );
};

const TacticsScreen = ({ gameState, setGameState, setScreen }: { gameState: GameState, setGameState: React.Dispatch<React.SetStateAction<GameState | null>>, setScreen: (screen: Screen) => void }) => {
    const offensivePlaybooks: OffensivePlaybook[] = ['Balanced', 'Spread', 'Pro-Style', 'Run Heavy', 'Air Raid'];
    const defensivePlaybooks: DefensivePlaybook[] = ['4-3 Defense', '3-4 Defense', 'Nickel', 'Aggressive'];

    const setStrategy = (type: 'offense' | 'defense', value: OffensivePlaybook | DefensivePlaybook) => {
        setGameState(prev => {
            if (!prev) return null;
            return {
                ...prev,
                myStrategy: {
                    ...prev.myStrategy,
                    [type]: value,
                }
            };
        });
    };
    
    return (
        <div>
            <Header title="Tactics" onBack={() => setScreen('MAIN_MENU')} />
            <div className="p-4 md:p-8 max-w-3xl mx-auto space-y-8">
                <div>
                    <h2 className="font-press-start text-xl text-cyan-400 mb-4">Offensive Playbook</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {offensivePlaybooks.map(p => (
                            <button key={p} onClick={() => setStrategy('offense', p)}
                                className={`p-4 border-2 text-left transition-colors ${gameState.myStrategy.offense === p ? 'bg-cyan-400 text-black border-cyan-400' : 'bg-gray-800 border-gray-600 hover:bg-gray-700'}`}>
                                {p}
                            </button>
                        ))}
                    </div>
                </div>
                 <div>
                    <h2 className="font-press-start text-xl text-cyan-400 mb-4">Defensive Playbook</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {defensivePlaybooks.map(p => (
                            <button key={p} onClick={() => setStrategy('defense', p)}
                                className={`p-4 border-2 text-left transition-colors ${gameState.myStrategy.defense === p ? 'bg-cyan-400 text-black border-cyan-400' : 'bg-gray-800 border-gray-600 hover:bg-gray-700'}`}>
                                {p}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

const GodModeScreen = ({ gameState, setGameState, setScreen }: { gameState: GameState, setGameState: React.Dispatch<React.SetStateAction<GameState | null>>, setScreen: (screen: Screen) => void }) => {
    const [fundsInput, setFundsInput] = React.useState(gameState.funds.toString());
    const [editingPlayer, setEditingPlayer] = React.useState<Player | null>(null);

    const handleSetFunds = () => {
        const amount = parseInt(fundsInput, 10);
        if (!isNaN(amount)) {
            setGameState(p => p ? { ...p, funds: amount } : p);
        }
    };

    const GodModeAction = (action: 'heal' | 'morale' | 'stamina') => {
        setGameState(prev => {
            if (!prev) return null;
            const newTeams = JSON.parse(JSON.stringify(prev.teams));
            const myTeam = newTeams.find((t: Team) => t.id === prev.myTeamId);
            if(myTeam) {
                myTeam.roster.forEach((p: Player) => {
                    if (action === 'heal') p.isInjured = 0;
                    if (action === 'morale') p.morale = 100;
                    if (action === 'stamina') p.currentStamina = 100;
                });
            }
            return { ...prev, teams: newTeams };
        });
    };
    
    // Player Edit Modal Component
    const PlayerEditModal = ({ player, onClose }: { player: Player, onClose: () => void }) => {
        const [localPlayer, setLocalPlayer] = React.useState<Player>(player);

        React.useEffect(() => {
            setLocalPlayer(player);
        }, [player]);

        const handleAttributeChange = (attr: keyof Player['attributes'], value: number) => {
            const newAttributes = { ...localPlayer.attributes, [attr]: value };
            // FIX: Cast `val` to number to resolve TypeScript error with `reduce`.
            const total = Object.entries(newAttributes).reduce((sum, [key, val]) => (key !== 'OVR' ? sum + (val as number) : sum), 0);
            newAttributes.OVR = Math.round(total / (Object.keys(newAttributes).length - 1));
            setLocalPlayer({ ...localPlayer, attributes: newAttributes });
        };
        
        const handleNameChange = (newName: string) => {
            setLocalPlayer({ ...localPlayer, name: newName });
        };

        const handleSaveChanges = () => {
            setGameState(prev => {
                if (!prev) return null;
                const newTeams = JSON.parse(JSON.stringify(prev.teams));
                const myTeam = newTeams.find((t: Team) => t.id === prev.myTeamId);
                const playerIndex = myTeam.roster.findIndex((p: Player) => p.id === localPlayer.id);
                if (playerIndex > -1) {
                    myTeam.roster[playerIndex] = localPlayer;
                }
                return { ...prev, teams: newTeams };
            });
            onClose();
        };

        return (
            <Modal onClose={onClose} size="2xl">
                <div className="flex justify-between items-center">
                    <h2 className="font-press-start text-xl text-cyan-400 mb-4">Edit Player</h2>
                    <button onClick={onClose} className="text-2xl text-gray-500 hover:text-white">&times;</button>
                </div>
                <div className="mb-4">
                    <label className="block text-gray-400">Name</label>
                    <input type="text" value={localPlayer.name} onChange={e => handleNameChange(e.target.value)} className="w-full p-2 bg-gray-800 border-2 border-gray-600 text-white" />
                </div>
                <div className="space-y-2">
                    <p className="font-bold">OVR: {localPlayer.attributes.OVR}</p>
                    {Object.entries(localPlayer.attributes).map(([key, value]) => {
                        const attrKey = key as keyof Player['attributes'];
                        if (attrKey === 'OVR') return null;
                        return (
                            <div key={key} className="flex items-center justify-between">
                                <label className="capitalize w-28">{key}</label>
                                <input 
                                    type="range" 
                                    min="50" max="99" 
                                    value={value} 
                                    onChange={e => handleAttributeChange(attrKey, parseInt(e.target.value, 10))}
                                    className="w-full mx-4"
                                />
                                <span className="w-8 text-center font-bold text-cyan-300">{value}</span>
                            </div>
                        )
                    })}
                </div>
                 <div className="mt-6 text-right">
                    <Button onClick={handleSaveChanges} className="!text-center w-auto">Save Changes</Button>
                </div>
            </Modal>
        );
    };


    return (
        <div>
            {editingPlayer && <PlayerEditModal player={editingPlayer} onClose={() => setEditingPlayer(null)} />}
            <Header title="God Mode" onBack={() => setScreen('MAIN_MENU')} />
            <div className="p-4 md:p-8 max-w-3xl mx-auto space-y-4">
                <div className="flex gap-2">
                    <input type="number" value={fundsInput} onChange={e => setFundsInput(e.target.value)} className="w-full p-2 bg-gray-800 border-2 border-gray-600 text-white" />
                    <button onClick={handleSetFunds} className="px-4 py-2 bg-yellow-600 hover:bg-yellow-500 font-press-start text-sm">SET FUNDS</button>
                </div>
                <Button onClick={() => setGameState(p => p ? { ...p, forceWinNextGame: !p.forceWinNextGame } : p)} className={`${gameState.forceWinNextGame ? 'text-green-400 border-green-400' : 'text-red-400 border-red-400'}`}>
                    Force Win Next Game: {gameState.forceWinNextGame ? 'ON' : 'OFF'}
                </Button>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Button onClick={() => GodModeAction('heal')} className="!text-center border-green-400 text-green-400 hover:bg-green-400">Heal All Injuries</Button>
                    <Button onClick={() => GodModeAction('morale')} className="!text-center border-blue-400 text-blue-400 hover:bg-blue-400">Max Morale</Button>
                    <Button onClick={() => GodModeAction('stamina')} className="!text-center border-yellow-400 text-yellow-400 hover:bg-yellow-400">Restore Stamina</Button>
                </div>

                <h2 className="font-press-start text-xl text-cyan-400 pt-4">Edit Player</h2>
                <div className="space-y-2 max-h-96 overflow-y-auto p-2 bg-black/20">
                    {gameState.teams.find(t => t.id === gameState.myTeamId)!.roster.sort((a,b) => b.attributes.OVR - a.attributes.OVR).map(p => (
                        <div key={p.id} className="p-2 bg-gray-800 flex justify-between items-center">
                            <span>{p.name} ({p.position}, OVR: {p.attributes.OVR})</span>
                            <button onClick={() => setEditingPlayer(p)} className="px-2 py-1 text-xs bg-cyan-600 hover:bg-cyan-500">EDIT</button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const RecruitmentScreen = ({ gameState, setGameState, onFinalizeRecruiting }: { gameState: GameState, setGameState: React.Dispatch<React.SetStateAction<GameState | null>>, onFinalizeRecruiting: (signedRecruits: Recruit[]) => void }) => {
    const [availableRecruits, setAvailableRecruits] = React.useState(gameState.recruits);
    const [signedRecruits, setSignedRecruits] = React.useState<Recruit[]>([]);
    const [recruitingPoints, setRecruitingPoints] = React.useState(gameState.recruitingPoints);

    const handleSignRecruit = (recruit: Recruit) => {
        if (recruitingPoints >= recruit.cost) {
            setRecruitingPoints(prev => prev - recruit.cost);
            setSignedRecruits(prev => [...prev, recruit]);
            setAvailableRecruits(prev => prev.filter(r => r.id !== recruit.id));
        }
    };
    
    const RecruitCard: React.FC<{ recruit: Recruit, onSign: (r: Recruit) => void, canAfford: boolean }> = ({ recruit, onSign, canAfford }) => (
        <div className="p-3 bg-gray-800 border border-gray-700 flex flex-col justify-between">
            <div>
                <div className="flex justify-between items-center">
                    <h3 className="font-bold text-lg">{recruit.name}</h3>
                    <span className="font-bold text-cyan-400">{recruit.position}</span>
                </div>
                <div className="flex justify-between items-center mt-2 text-sm">
                    <span>OVR: <span className="font-bold">{recruit.attributes.OVR}</span></span>
                    <span>Potential: <span className="font-bold">{recruit.attributes.Potential}</span></span>
                </div>
            </div>
            <div className="mt-4">
                 <Button onClick={() => onSign(recruit)} disabled={!canAfford} className="!text-center w-full text-sm">
                    Sign (Cost: {recruit.cost})
                </Button>
            </div>
        </div>
    );

    return (
        <div>
            <Header title="Offseason Recruiting" />
            <div className="p-4 md:p-8 max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-6 p-4 bg-gray-800/50">
                    <h2 className="font-press-start text-xl">Recruiting Points: <span className="text-yellow-400">{recruitingPoints}</span></h2>
                    <Button onClick={() => onFinalizeRecruiting(signedRecruits)} className="!text-center w-auto border-green-400 text-green-400 hover:bg-green-400">
                        Finalize Class & Advance
                    </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {availableRecruits.sort((a,b) => b.attributes.OVR - a.attributes.OVR).map(recruit => (
                        <RecruitCard key={recruit.id} recruit={recruit} onSign={handleSignRecruit} canAfford={recruitingPoints >= recruit.cost}/>
                    ))}
                </div>
            </div>
        </div>
    );
}

const PlayerModal = ({ player, onClose }: { player: Player, onClose: () => void }) => {
    const statCategories: (keyof PlayerStats)[] = ['gamesPlayed', 'passYds', 'passTDs', 'rushYds', 'rushTDs', 'recYds', 'recTDs', 'tackles', 'sacks', 'ints'];

    const StatRow: React.FC<{ category: string, seasonValue: number, careerValue: number }> = ({ category, seasonValue, careerValue }) => (
        <tr>
            <td className="p-1 capitalize text-gray-400">{category.replace('Yds', ' Yds').replace('TDs', ' TDs')}</td>
            <td className="p-1 text-right font-bold">{seasonValue}</td>
            <td className="p-1 text-right font-bold text-gray-300">{careerValue}</td>
        </tr>
    );

    return (
        <Modal onClose={onClose}>
            <div className="flex justify-between items-start">
                <div>
                    <h2 className="text-2xl font-press-start text-cyan-400">{player.name}</h2>
                    <p className="text-lg text-gray-300">{player.position} | {player.year} | OVR: {player.attributes.OVR}</p>
                </div>
                <button onClick={onClose} className="text-2xl text-gray-500 hover:text-white">&times;</button>
            </div>
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                    <h3 className="font-press-start text-lg text-cyan-400 mb-2">Attributes</h3>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                        <div className="flex justify-between items-center"><span>Stamina:</span> <StatBar value={player.currentStamina} /></div>
                        {Object.entries(player.attributes).map(([key, value]) => (
                            <div key={key} className="flex justify-between items-center">
                                <span>{key}:</span>
                                <StatBar value={value} max={99} />
                            </div>
                        ))}
                    </div>
                </div>
                 <div>
                    <h3 className="font-press-start text-lg text-cyan-400 mb-2">Stats</h3>
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-left text-gray-500">
                                <th className="p-1">Stat</th>
                                <th className="p-1 text-right">Season</th>
                                <th className="p-1 text-right">Career</th>
                            </tr>
                        </thead>
                        <tbody>
                            {statCategories.map(key => {
                                const seasonValue = player.seasonStats[key];
                                const careerValue = player.careerStats[key];
                                if (seasonValue > 0 || careerValue > 0) {
                                    return <StatRow key={key} category={key} seasonValue={seasonValue} careerValue={careerValue} />;
                                }
                                return null;
                            })}
                        </tbody>
                    </table>
                 </div>
            </div>
        </Modal>
    );
};


const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

// --- MAIN APP COMPONENT ---

const App = () => {
  const [gameState, setGameState] = React.useState<GameState | null>(null);
  const [currentScreen, setScreen] = React.useState<Screen>('TEAM_SELECTION');
  const [loadingText, setLoadingText] = React.useState<string>('');
  const [selectedPlayer, setSelectedPlayer] = React.useState<Player | null>(null);
  const [godModeUnlocked, setGodModeUnlocked] = React.useState(false);
  const [showGodModePassword, setShowGodModePassword] = React.useState(false);
  const [showPreGameModal, setShowPreGameModal] = React.useState(false);
  const [showGameResultModal, setShowGameResultModal] = React.useState<{ result: NonNullable<Game['result']>, isRivalry: boolean } | null>(null);


  const handleTeamSelection = (teamId: number) => {
    setLoadingText("Building your dynasty...");
    setTimeout(() => {
      const initialState = GameService.initializeGameWorld();
      setGameState({ ...initialState, myTeamId: teamId });
      setScreen('MAIN_MENU');
      setLoadingText('');
    }, 500);
  };
    
  const handleSimulateGame = () => {
    setShowPreGameModal(false);
    setLoadingText("Simulating Week...");
    setTimeout(() => {
        setGameState(currentGameState => {
            if (!currentGameState) return null;

            let updatedState = { ...currentGameState, teams: JSON.parse(JSON.stringify(currentGameState.teams)), schedule: JSON.parse(JSON.stringify(currentGameState.schedule))};
            
            const myTeam = updatedState.teams.find(t => t.id === updatedState.myTeamId)!;
            const opponentId = GameService.findNextOpponentId(updatedState);
            if (!opponentId) {
                console.error("No opponent found");
                return updatedState;
            }
            const opponent = updatedState.teams.find(t => t.id === opponentId)!;
            const game = updatedState.schedule[myTeam.id].find(g => g.week === updatedState.week && g.opponentId === opponentId) || { week: updatedState.week, opponentId: opponent.id, isHome: true, weather: 'Sunny' };

            const myGameResult = GameService.simulateGame(myTeam, opponent, updatedState.myStrategy, {offense: 'Balanced', defense: '4-3 Defense'}, updatedState.facilities, {level: 1, cost: 0}, game.weather || 'Sunny', updatedState.forceWinNextGame);
            
            GameService.applyGameResults(myTeam, opponent, myGameResult, updatedState.schedule);
            updatedState.lastGameResult = myGameResult.result;

            GameService.simulateOtherGames(updatedState);

            // Handle rivalry bonus
            if (game.isRivalryGame && myGameResult.didWin) {
                updatedState.funds += 25000;
                updatedState.fanHappiness = Math.min(100, updatedState.fanHappiness + 10);
            }
            
            if (updatedState.week < 13) updatedState.week++;
            
            myTeam.roster.forEach(p => {
                const recoveryRate = 10 + (updatedState.facilities.training.level * 3);
                p.currentStamina = Math.min(100, p.currentStamina + recoveryRate);
            });
            
            updatedState.nationalRankings = GameService.updateRankings(updatedState.teams);
            
            if (updatedState.week > 10) {
                 const isEliminated = GameService.updatePlayoffBracket(updatedState, myTeam.id, opponent.id, myGameResult.didWin);
                 if (isEliminated) {
                     updatedState = GameService.startOffseason(updatedState);
                 } else if (updatedState.week === 14) {
                     updatedState.trophyCase.push({ season: updatedState.season, award: 'National Champions' });
                     updatedState = GameService.startOffseason(updatedState);
                 }
            }
            if (updatedState.week > 10 && !updatedState.playoffBracket) {
                 updatedState = GameService.startOffseason(updatedState);
            }
            setShowGameResultModal({ result: updatedState.lastGameResult, isRivalry: !!game.isRivalryGame });
            return { ...updatedState, forceWinNextGame: false };
        });
        setLoadingText('');
    }, 1000);
  };
    
  const handleStartRecruitment = () => {
    setScreen('RECRUITMENT');
  }

  const handleFinalizeRecruiting = (signedRecruits: Recruit[]) => {
    setLoadingText("Advancing to next season...");
    setTimeout(() => {
        setGameState(prev => prev ? GameService.advanceToNextSeason(prev, signedRecruits) : null);
        setScreen('MAIN_MENU');
        setLoadingText('');
    }, 1000);
  }

  const handleStartPlayableGame = () => {
    setShowPreGameModal(false);
    setGameState(prev => {
        if (!prev) return prev;

        const myTeam = prev.teams.find(t => t.id === prev.myTeamId)!;
        const opponentId = GameService.findNextOpponentId(prev);
        if (!opponentId) return prev;

        const newActiveGame: ActiveGameState = {
            quarter: 1,
            time: 15 * 60,
            down: 1,
            distance: 10,
            yardLine: 25,
            possession: 'player',
            playerScore: 0,
            opponentScore: 0,
            gameId: `${prev.season}-${prev.week}-${myTeam.id}-${opponentId}`,
            opponentId: opponentId,
            playLog: ['The game is underway!'],
            isGameOver: false,
        };
        return { ...prev, activeGame: newActiveGame };
    });
    setScreen('PLAY_GAME');
  };

  const handleFinishPlayableGame = (stats: Record<string, Partial<PlayerStats>>) => {
    if (!gameState || !gameState.activeGame) return;
    setLoadingText("Finalizing game results...");
    setTimeout(() => {
        const game = gameState.schedule[gameState.myTeamId!].find(g => g.week === gameState.week);
        
        let finalState = GameService.applyPlayableGameResults(gameState, gameState.activeGame, stats);
        
        // Handle rivalry bonus
        if (game?.isRivalryGame && finalState.lastGameResult && finalState.lastGameResult.myScore > finalState.lastGameResult.opponentScore) {
            finalState.funds += 25000;
            finalState.fanHappiness = Math.min(100, finalState.fanHappiness + 10);
        }
        
        setGameState(finalState);
        if (finalState.lastGameResult) {
            setShowGameResultModal({ result: finalState.lastGameResult, isRivalry: !!game?.isRivalryGame });
        }
        setScreen('MAIN_MENU');
        setLoadingText('');
    }, 1000);
  };


  const handleGodModePassword = (password: string) => {
    if (password === '102011') {
        setGodModeUnlocked(true);
        setScreen('GOD_MODE');
    }
    setShowGodModePassword(false);
  };

  const renderScreen = (): React.ReactElement => {
    if (!gameState) {
      return <ScreenWrapper screenKey="TEAM_SELECTION" children={<TeamSelectionScreen onTeamSelect={handleTeamSelection} />} />;
    }

    switch(currentScreen) {
      case 'MAIN_MENU':
        return <ScreenWrapper screenKey={currentScreen} children={<MainMenu gameState={gameState} setScreen={setScreen} onPlayNextGame={() => setShowPreGameModal(true)} onStartRecruitment={handleStartRecruitment} onGodModeClick={() => godModeUnlocked ? setScreen('GOD_MODE') : setShowGodModePassword(true)} />} />;
      case 'ROSTER':
        return <ScreenWrapper screenKey={currentScreen} children={<RosterScreen gameState={gameState} setScreen={setScreen} onPlayerSelected={setSelectedPlayer} />} />;
      case 'SCHEDULE':
          return <ScreenWrapper screenKey={currentScreen} children={<ScheduleScreen gameState={gameState} setScreen={setScreen} onGameSelected={() => {}} />} />;
      case 'STANDINGS':
          return <ScreenWrapper screenKey={currentScreen} children={<StandingsScreen gameState={gameState} setScreen={setScreen} />} />;
      case 'FACILITIES':
          return <ScreenWrapper screenKey={currentScreen} children={<FacilitiesScreen gameState={gameState} setGameState={setGameState} setScreen={setScreen} />} />;
      case 'AWARDS':
          return <ScreenWrapper screenKey={currentScreen} children={<AwardsScreen gameState={gameState} setScreen={setScreen} />} />;
      case 'GOD_MODE':
          return <ScreenWrapper screenKey={currentScreen} children={<GodModeScreen gameState={gameState} setGameState={setGameState} setScreen={setScreen} />} />;
      case 'NATIONAL_STATS':
          return <ScreenWrapper screenKey={currentScreen} children={<NationalStatsScreen gameState={gameState} setScreen={setScreen} onPlayerSelected={setSelectedPlayer} />} />;
      case 'TROPHY_CASE':
          return <ScreenWrapper screenKey={currentScreen} children={<TrophyCaseScreen gameState={gameState} setScreen={setScreen} />} />;
      case 'TACTICS':
          return <ScreenWrapper screenKey={currentScreen} children={<TacticsScreen gameState={gameState} setGameState={setGameState} setScreen={setScreen} />} />;
      case 'PLAY_GAME':
          return <ScreenWrapper screenKey={currentScreen} children={<GameplayScreen gameState={gameState} setGameState={setGameState} onGameEnd={handleFinishPlayableGame} />} />;
      case 'RECRUITMENT':
          return <ScreenWrapper screenKey={currentScreen} children={<RecruitmentScreen gameState={gameState} setGameState={setGameState} onFinalizeRecruiting={handleFinalizeRecruiting} />} />;
      default:
        return <ScreenWrapper screenKey="MAIN_MENU" children={<MainMenu gameState={gameState} setScreen={setScreen} onPlayNextGame={() => setShowPreGameModal(true)} onStartRecruitment={handleStartRecruitment} onGodModeClick={() => godModeUnlocked ? setScreen('GOD_MODE') : setShowGodModePassword(true)} />} />;
    }
  };
  
  const GameplayScreen = ({ gameState, setGameState, onGameEnd }: { gameState: GameState, setGameState: React.Dispatch<React.SetStateAction<GameState | null>>, onGameEnd: (stats: Record<string, Partial<PlayerStats>>) => void }) => {
      const { activeGame, myStrategy } = gameState;
      const [gameStats, setGameStats] = React.useState<Record<string, Partial<PlayerStats>>>({});
      
      React.useEffect(() => {
          if (activeGame && activeGame.isGameOver) {
              onGameEnd(gameStats);
          }
      }, [activeGame, onGameEnd, gameStats]);

      if (!activeGame) return null;

      const myTeam = gameState.teams.find(t => t.id === gameState.myTeamId)!;
      const opponent = gameState.teams.find(t => t.id === activeGame.opponentId)!;
      const game = gameState.schedule[myTeam.id]?.find(g => g.week === gameState.week);
      
      const { playerScore, opponentScore } = activeGame;

      const formatTime = (seconds: number) => {
          const min = Math.floor(seconds / 60);
          const sec = seconds % 60;
          return `${min}:${sec < 10 ? '0' : ''}${sec}`;
      };
      
      const playbookPlays: Record<OffensivePlaybook, OffensivePlay[]> = {
          'Balanced': ['Inside Run', 'Outside Run', 'Slant', 'Screen Pass', 'Post'],
          'Air Raid': ['Slant', 'Post', 'Screen Pass', 'Play Action', 'Hail Mary'],
          'Run Heavy': ['Inside Run', 'Outside Run', 'Power Run', 'Draw Play', 'Play Action'],
          'Spread': ['Outside Run', 'Draw Play', 'Slant', 'Screen Pass', 'Post'],
          'Pro-Style': ['Inside Run', 'Play Action', 'Power Run', 'Post', 'Slant']
      };

      const handlePlayCall = (playType: OffensivePlay) => {
        setGameState(prev => {
            if (!prev || !prev.activeGame) return prev;
            
            const outcome = GameService.simulatePlay(myTeam, opponent, playType, prev.activeGame.yardLine);
            setGameStats(prevStats => {
                const newStats = JSON.parse(JSON.stringify(prevStats));
                outcome.statEvents.forEach(event => {
                    if (!newStats[event.playerId]) newStats[event.playerId] = {};
                    const stat = event.stat as keyof PlayerStats;
                    newStats[event.playerId][stat] = (newStats[event.playerId][stat] || 0) + event.value;
                });
                return newStats;
            });

            const { yardLine: currentYardLine, down: currentDown, distance: currentDistance, possession: currentPossession, playerScore: currentPlayerScore, opponentScore: currentOpponentScore, time: currentTime, quarter: currentQuarter, playLog: currentPlayLog, isGameOver: currentIsGameOver } = prev.activeGame;

            let yardLine = currentYardLine, down = currentDown, distance = currentDistance, possession = currentPossession, playerScore = currentPlayerScore, opponentScore = currentOpponentScore, time = currentTime, quarter = currentQuarter, playLog = currentPlayLog, isGameOver = currentIsGameOver;

            time -= rand(25, 45);
            playLog = [...playLog, outcome.description].slice(-5);

            if (outcome.isTurnover) {
                possession = 'opponent';
                yardLine = 100 - (yardLine + outcome.yards);
                down = 1; distance = 10;
            } else if (!outcome.isComplete) {
                down++;
            } else {
                yardLine += outcome.yards;
                distance -= outcome.yards;
                if (yardLine >= 100) { // Touchdown
                    playerScore += 7;
                    playLog.push("TOUCHDOWN!");
                    possession = 'opponent'; yardLine = 25; down = 1; distance = 10;
                } else if (distance <= 0) { // First down
                    down = 1; distance = 10;
                } else {
                    down++;
                }
            }

            if (down > 4) { // Turnover on downs
                possession = 'opponent'; yardLine = 100 - yardLine; down = 1; distance = 10;
                playLog.push("Turnover on downs!");
            }
            
            if (time <= 0) {
                quarter++;
                time = 15 * 60;
                if (quarter > 4) {
                    isGameOver = true;
                }
            }

            return { ...prev, activeGame: { ...prev.activeGame, yardLine, down, distance, possession, playerScore, opponentScore, time, quarter, playLog, isGameOver } };
        });
      };
      
      const handleSimulateOpponentDrive = () => {
        setGameState(prev => {
            if (!prev || !prev.activeGame) return prev;
            const driveResult = GameService.simulateOpponentDrive(myTeam, opponent);
            
            const { opponentScore: currentOpponentScore, time: currentTime, quarter: currentQuarter, playLog: currentPlayLog, isGameOver: currentIsGameOver } = prev.activeGame;
            
            let opponentScore = currentOpponentScore, time = currentTime, quarter = currentQuarter, playLog = currentPlayLog, isGameOver = currentIsGameOver;

            opponentScore += driveResult.score;
            time -= driveResult.timeElapsed;
            playLog = [...playLog, driveResult.description].slice(-5);
            
            if (time <= 0) {
                quarter++;
                time = 15 * 60;
                if (quarter > 4) {
                    isGameOver = true;
                }
            }

            return { ...prev, activeGame: { ...prev.activeGame, opponentScore, time, quarter, playLog, isGameOver, possession: 'player', down: 1, distance: 10, yardLine: 25 }};
        });
      };

      const handleSkipGame = () => {
        setGameState(prev => {
            if (!prev || !prev.activeGame) return prev;
            const finalState = GameService.skipGameSimulation(prev);
            return { ...prev, activeGame: finalState };
        });
      };
      
      return (
        <div className="p-4 md:p-8">
            <div className="flex justify-between items-center bg-black/50 p-2 border-2 border-gray-600 mb-4 font-press-start text-sm md:text-lg">
                <div className="text-left w-1/3"><p>{game?.isHome ? myTeam.name : opponent.name}</p><p className="text-2xl md:text-4xl text-cyan-400">{game?.isHome ? playerScore : opponentScore}</p></div>
                <div className="text-center w-1/3"><p>Q{activeGame.quarter}</p><p className="text-xl md:text-2xl text-yellow-400">{formatTime(activeGame.time)}</p></div>
                <div className="text-right w-1/3"><p>{game?.isHome ? opponent.name : myTeam.name}</p><p className="text-2xl md:text-4xl text-cyan-400">{game?.isHome ? opponentScore : playerScore}</p></div>
            </div>

            <div className="bg-green-800/20 border-y-4 border-white h-48 mb-4 flex items-center justify-center text-center relative overflow-hidden">
                {[...Array(9)].map((_, i) => <div key={i} className="h-full w-px bg-white/30 absolute" style={{left: `${(i+1)*10}%`}}></div>)}
                <div className="h-full w-2 bg-white/50 absolute left-1/2 -translate-x-1/2"></div>
                <div className="absolute top-2 left-2 text-white font-mono z-10 bg-black/30 p-1 rounded"><p>{activeGame.down}{['st','nd','rd','th'][activeGame.down - 1] || 'th'} & {activeGame.distance <= 0 ? 'Goal' : activeGame.distance}</p><p>Ball on the {activeGame.yardLine > 50 ? `Opponent ${100 - activeGame.yardLine}` : `Own ${activeGame.yardLine}`}</p></div>
                <div className="absolute w-2 h-4 bg-yellow-900 border border-black z-10" style={{ left: `calc(${activeGame.yardLine}% - 4px)` }}></div>
                <div className="bg-black/70 p-2 text-yellow-300 font-mono text-sm max-w-lg z-10">{activeGame.playLog[activeGame.playLog.length - 1]}</div>
            </div>

            {activeGame.possession === 'player' ? (
                <div>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        {playbookPlays[myStrategy.offense].map(play => (
                           <Button key={play} onClick={() => handlePlayCall(play)} className="!text-center">{play}</Button>
                        ))}
                    </div>
                    <div className="mt-6">
                        <Button onClick={handleSkipGame} className="!text-center border-yellow-400 text-yellow-400 hover:bg-yellow-400">Skip Game</Button>
                    </div>
                </div>
            ) : (
                <div><h3 className="text-center text-xl text-red-400 font-press-start mb-4">Opponent's Possession</h3><Button onClick={handleSimulateOpponentDrive} className="!text-center">Continue</Button></div>
            )}
        </div>
      );
  };
  
  const PreGameModal = () => {
    if (!gameState) return null;
    const opponentId = GameService.findNextOpponentId(gameState);
    if (!opponentId) return null;
    const myTeam = gameState.teams.find(t => t.id === gameState.myTeamId)!;
    const opponent = gameState.teams.find(t => t.id === opponentId)!;

    return (
        <Modal onClose={() => setShowPreGameModal(false)} size="2xl">
            <h2 className="font-press-start text-2xl text-cyan-400 mb-4 text-center">Week {gameState.week} Matchup</h2>
            <div className="text-center text-xl mb-6">
                <p>{myTeam.name} ({myTeam.record.wins}-{myTeam.record.losses})</p>
                <p className="font-press-start text-sm my-2">VS</p>
                <p>{opponent.name} ({opponent.record.wins}-{opponent.record.losses})</p>
            </div>
            <div className="flex flex-col md:flex-row gap-4">
                <Button onClick={handleStartPlayableGame} className="!text-center flex-1"><span className="flex items-center justify-center"><FootballIcon className="w-5 h-5 mr-3" /> Play Game</span></Button>
                <Button onClick={handleSimulateGame} className="!text-center flex-1">Simulate Game</Button>
            </div>
        </Modal>
    );
  }

  const GodModePasswordModal = () => {
    const [password, setPassword] = React.useState('');
    return (
        <Modal onClose={() => setShowGodModePassword(false)} size="xl">
            <h2 className="font-press-start text-xl text-yellow-400 mb-4">Enter God Mode</h2>
            <p className="mb-4">Enter the password to unlock God Mode.</p>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full p-2 bg-gray-800 border-2 border-gray-600 text-white mb-4" />
            <Button onClick={() => handleGodModePassword(password)} className="!text-center">Unlock</Button>
        </Modal>
    );
  };

  const GameResultModal = ({ modalData, teams, myTeamId, onClose, onPlayerSelected }: { modalData: { result: NonNullable<Game['result']>, isRivalry: boolean }, teams: Team[], myTeamId: number, onClose: () => void, onPlayerSelected: (p: Player) => void }) => {
    const { result, isRivalry } = modalData;
    const myTeam = teams.find(t => t.id === myTeamId)!;
    const opponent = teams.find(t => t.id === result.opponentId)!;
    const didWin = result.myScore > result.opponentScore;

    const findTopPerformer = (team: Team, teamStats: Record<string, Partial<PlayerStats>>, stat: keyof PlayerStats) => {
        const topPlayerId = Object.keys(teamStats).sort((a, b) => (teamStats[b][stat] || 0) - (teamStats[a][stat] || 0))[0];
        if (!topPlayerId) return null;
        const player = team.roster.find(p => p.id === topPlayerId);
        return { player, value: teamStats[topPlayerId][stat] };
    };

    const myTopPasser = findTopPerformer(myTeam, result.playerStats.myTeam, 'passYds');
    const myTopRusher = findTopPerformer(myTeam, result.playerStats.myTeam, 'rushYds');
    const myTopReceiver = findTopPerformer(myTeam, result.playerStats.myTeam, 'recYds');

    const oppTopPasser = findTopPerformer(opponent, result.playerStats.opponentTeam, 'passYds');
    const oppTopRusher = findTopPerformer(opponent, result.playerStats.opponentTeam, 'rushYds');
    const oppTopReceiver = findTopPerformer(opponent, result.playerStats.opponentTeam, 'recYds');
    
    const PerfStat = ({ title, data }: {title: string, data: {player: Player | undefined, value: number | undefined} | null}) => {
        if (!data?.player || !data.value) return null;
        return (
            <div className="text-sm">
                <p className="uppercase text-gray-400">{title}</p>
                <p><a href="#" onClick={(e) => { e.preventDefault(); onPlayerSelected(data.player!)}} className="font-bold hover:text-cyan-300">{data.player.name}</a>: {data.value} yds</p>
            </div>
        );
    }

    return (
        <Modal onClose={onClose} size="3xl">
            <h2 className={`font-press-start text-3xl mb-2 text-center ${didWin ? 'text-green-400' : 'text-red-400'}`}>{didWin ? 'VICTORY' : 'DEFEAT'}</h2>
            {isRivalry && didWin && (
                <div className="text-center p-2 mb-4 bg-yellow-500/20 border-2 border-dashed border-yellow-400">
                    <p className="font-press-start text-yellow-300">RIVALRY WIN!</p>
                    <p className="text-sm text-yellow-400">+$25,000 | +10% Fan Happiness</p>
                </div>
            )}
            <div className="text-center text-2xl mb-6 flex justify-center items-center gap-4">
                <span className="font-bold">{myTeam.name}</span>
                <span className="font-press-start text-cyan-400">{result.myScore} - {result.opponentScore}</span>
                <span className="font-bold">{opponent.name}</span>
            </div>
            <div className="grid grid-cols-2 gap-4 border-t-2 border-gray-700 pt-4">
                <div className="space-y-4">
                    <h3 className="font-press-start text-xl">{myTeam.name}</h3>
                    <PerfStat title="Leading Passer" data={myTopPasser} />
                    <PerfStat title="Leading Rusher" data={myTopRusher} />
                    <PerfStat title="Leading Receiver" data={myTopReceiver} />
                </div>
                 <div className="space-y-4 text-right">
                    <h3 className="font-press-start text-xl">{opponent.name}</h3>
                    <PerfStat title="Leading Passer" data={oppTopPasser} />
                    <PerfStat title="Leading Rusher" data={oppTopRusher} />
                    <PerfStat title="Leading Receiver" data={oppTopReceiver} />
                </div>
            </div>
            <div className="mt-8 text-center">
                <Button onClick={onClose} className="!text-center w-1/2 mx-auto">Continue</Button>
            </div>
        </Modal>
    )
  }

  return (
    <div className="container mx-auto max-w-7xl bg-gray-900 border-x-2 border-cyan-700/50 min-h-screen">
      {loadingText && <Loading text={loadingText} />}
      {selectedPlayer && <PlayerModal player={selectedPlayer} onClose={() => setSelectedPlayer(null)} />}
      {showGodModePassword && <GodModePasswordModal />}
      {showPreGameModal && <PreGameModal />}
      {showGameResultModal && gameState && <GameResultModal modalData={showGameResultModal} teams={gameState.teams} myTeamId={gameState.myTeamId!} onClose={() => setShowGameResultModal(null)} onPlayerSelected={(p) => { setSelectedPlayer(p); }}/>}
      {renderScreen()}
    </div>
  );
};

export default App;