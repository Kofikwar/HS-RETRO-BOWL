

import * as React from 'react';
import { GameState, Screen, Team, Player, Game, Position, GameStrategy, Recruit, PlayerStats, OffensivePlaybook, DefensivePlaybook, SeasonAwards, Trophy, ActiveGameState, OffensivePlay, TrainingProgram, Staff, Sponsor, InboxMessage } from './types';
import { POWERHOUSE_TEAMS, MAX_SEASONS } from './constants';
import * as GameService from './services/gameService';
import { FootballIcon, RosterIcon, ScheduleIcon, StandingsIcon, FacilitiesIcon, AwardIcon, RecruitIcon, GodModeIcon, ChartIcon, InboxIcon, CoachIcon, SponsorIcon, TrophyIcon, TacticsIcon, ScoutIcon, DollarIcon } from './components/Icons';

// --- HELPER & UI COMPONENTS ---

const ScreenWrapper: React.FC<{ screenKey: Screen, children?: React.ReactNode }> = ({ children, screenKey }) => (
    <div key={screenKey} className="fade-in">
        {children}
    </div>
);

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
        <div className="w-16 h-16 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-xl font-press-start text-cyan-400">{text}</p>
    </div>
);

const Header = ({ teamName, funds, season, week }: { teamName: string, funds: number, season: number, week: number }) => (
    <header className="p-4 bg-black/30 border-b-2 border-cyan-400 flex flex-wrap justify-between items-center text-xs md:text-base">
        <h1 className="font-press-start text-base md:text-2xl text-cyan-400 basis-full md:basis-auto mb-2 md:mb-0">{teamName}</h1>
        <div className="flex space-x-4">
            <span>S{season} W{week}</span>
            <span className="text-green-400">${funds.toLocaleString()}</span>
        </div>
    </header>
);

const getAttributeColor = (value: number) => {
    if (value >= 90) return 'text-cyan-400';
    if (value >= 80) return 'text-green-400';
    if (value >= 70) return 'text-yellow-400';
    return 'text-gray-400';
};

const getPositionColor = (pos: Position) => {
    const colors: Record<Position, string> = {
        'QB': 'bg-red-600', 'RB': 'bg-blue-600', 'WR': 'bg-yellow-500', 'TE': 'bg-orange-500',
        'OL': 'bg-gray-500', 'DL': 'bg-purple-600', 'LB': 'bg-indigo-600', 'DB': 'bg-green-600', 'K/P': 'bg-pink-500'
    };
    return colors[pos];
};

// --- SCREENS & MODALS ---

const TeamSelectionScreen = ({ onSelectTeam }: { onSelectTeam: (teamId: number) => void }) => (
    <ScreenWrapper screenKey="TEAM_SELECTION">
        <div className="p-4 md:p-8">
            <h1 className="text-3xl md:text-5xl font-press-start text-center mb-8 text-cyan-400">Select a Powerhouse</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {POWERHOUSE_TEAMS.map(team => (
                    <Button key={team.id} onClick={() => onSelectTeam(team.id)}>
                        {team.name}
                    </Button>
                ))}
            </div>
        </div>
    </ScreenWrapper>
);

const MainMenu = ({ onNavigate, unreadMessages }: { onNavigate: (screen: Screen) => void, unreadMessages: number }) => (
    <nav className="p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <Button onClick={() => onNavigate('ROSTER')}><RosterIcon className="w-6 h-6 inline-block mr-2" />Roster</Button>
        <Button onClick={() => onNavigate('SCHEDULE')}><ScheduleIcon className="w-6 h-6 inline-block mr-2" />Schedule</Button>
        <Button onClick={() => onNavigate('STANDINGS')}><StandingsIcon className="w-6 h-6 inline-block mr-2" />Standings</Button>
        <Button onClick={() => onNavigate('NATIONAL_STATS')}><ChartIcon className="w-6 h-6 inline-block mr-2" />Leaders</Button>
        <Button onClick={() => onNavigate('STAFF')}><CoachIcon className="w-6 h-6 inline-block mr-2" />Staff</Button>
        <Button onClick={() => onNavigate('SPONSORS')}><SponsorIcon className="w-6 h-6 inline-block mr-2" />Sponsors</Button>
        <Button onClick={() => onNavigate('TACTICS')}><TacticsIcon className="w-6 h-6 inline-block mr-2" />Tactics</Button>
        <Button onClick={() => onNavigate('FACILITIES')}><FacilitiesIcon className="w-6 h-6 inline-block mr-2" />Facilities</Button>
        <Button onClick={() => onNavigate('AWARD_RACES')}><AwardIcon className="w-6 h-6 inline-block mr-2" />Award Races</Button>
        <Button onClick={() => onNavigate('TROPHY_CASE')}><TrophyIcon className="w-6 h-6 inline-block mr-2" />Trophy Case</Button>
        <Button onClick={() => onNavigate('INBOX')}>
            <InboxIcon className="w-6 h-6 inline-block mr-2" />
            Inbox {unreadMessages > 0 && <span className="ml-2 bg-red-500 text-white rounded-full px-2 py-1 text-xs">{unreadMessages}</span>}
        </Button>
        <Button onClick={() => onNavigate('GOD_MODE')}><GodModeIcon className="w-6 h-6 inline-block mr-2" />God Mode</Button>
    </nav>
);

const RosterScreen = ({ team, onPlayerSelect, onBack }: { team: Team, onPlayerSelect: (player: Player) => void, onBack: () => void }) => {
    const [sortBy, setSortBy] = React.useState<keyof Player['attributes'] | 'position' | 'name'>('position');
    
    const sortedRoster = [...team.roster].sort((a, b) => {
        if (sortBy === 'position') return a.position.localeCompare(b.position) || b.attributes.OVR - a.attributes.OVR;
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        if (sortBy === 'OVR' || sortBy === 'Speed' || sortBy === 'Strength' || sortBy === 'Stamina' || sortBy === 'Tackle' || sortBy === 'Catch' || sortBy === 'Pass' || sortBy === 'Block' || sortBy === 'Consistency' || sortBy === 'Potential') {
          return b.attributes[sortBy] - a.attributes[sortBy];
        }
        return 0;
    });

    return (
        <ScreenWrapper screenKey="ROSTER">
            <div className="flex justify-between items-center p-4">
                <h2 className="text-2xl font-press-start text-cyan-400">Roster</h2>
                <Button onClick={onBack} className="w-auto px-4 py-2">Back</Button>
            </div>
            <div className="overflow-x-auto px-4">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-gray-800">
                            {['Pos', 'Name', 'Year', 'OVR', 'Spd', 'Str', 'Stm', 'Tck', 'Ctch', 'Pass', 'Blk'].map(h => 
                                <th key={h} className="p-2 uppercase">{h}</th>
                            )}
                        </tr>
                    </thead>
                    <tbody>
                        {sortedRoster.map(p => (
                            <tr key={p.id} className={`border-b border-gray-700 ${p.isInjured > 0 ? 'bg-red-900/50' : ''} ${p.isSuspended ? 'bg-yellow-900/50' : ''}`} onClick={() => onPlayerSelect(p)}>
                                <td className="p-2"><span className={`px-2 py-1 text-xs font-bold rounded ${getPositionColor(p.position)}`}>{p.position}</span></td>
                                <td className="p-2">
                                    {p.name}
                                    {p.traits.includes('Team Captain') && <span title="Team Captain" className="ml-1">©️</span>}
                                    {p.traits.includes('Clutch') && <span title="Clutch" className="ml-1">⭐</span>}
                                    {p.isInjured > 0 && <span className="text-red-500 ml-1">(Inj {p.isInjured}w)</span>}
                                    {p.isSuspended && <span className="text-yellow-500 ml-1">(Susp)</span>}
                                </td>
                                <td className="p-2">{p.year}</td>
                                <td className={`p-2 font-bold ${getAttributeColor(p.attributes.OVR)}`}>{p.attributes.OVR}</td>
                                <td className={`p-2 ${getAttributeColor(p.attributes.Speed)}`}>{p.attributes.Speed}</td>
                                <td className={`p-2 ${getAttributeColor(p.attributes.Strength)}`}>{p.attributes.Strength}</td>
                                <td className={`p-2 ${getAttributeColor(p.attributes.Stamina)}`}>{p.attributes.Stamina}</td>
                                <td className={`p-2 ${getAttributeColor(p.attributes.Tackle)}`}>{p.attributes.Tackle}</td>
                                <td className={`p-2 ${getAttributeColor(p.attributes.Catch)}`}>{p.attributes.Catch}</td>
                                <td className={`p-2 ${getAttributeColor(p.attributes.Pass)}`}>{p.attributes.Pass}</td>
                                <td className={`p-2 ${getAttributeColor(p.attributes.Block)}`}>{p.attributes.Block}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </ScreenWrapper>
    );
};

const PlayerEditModal = ({ player, onClose }: { player: Player, onClose: () => void }) => (
    <Modal onClose={onClose} size="3xl">
        <h2 className="text-2xl font-press-start text-cyan-400 mb-4">{player.name} ({player.position})</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <h3 className="text-lg font-press-start">Attributes</h3>
                {Object.entries(player.attributes).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                        <span>{key}</span>
                        <span className={getAttributeColor(value)}>{value}</span>
                    </div>
                ))}
                 <div className="mt-4">
                    <h3 className="text-lg font-press-start">Info</h3>
                    <div className="flex justify-between"><span>GPA:</span> <span>{player.gpa.toFixed(2)} {player.isSuspended && <span className="text-yellow-500">(Suspended)</span>}</span></div>
                    <div className="flex justify-between"><span>Traits:</span> <span>{player.traits.join(', ') || 'None'}</span></div>
                 </div>
            </div>
            <div>
                 <h3 className="text-lg font-press-start mb-2">Season Stats</h3>
                {Object.entries(player.seasonStats).map(([key, value]) => (
                    <div key={key} className="flex justify-between text-sm">
                        <span>{key}</span>
                        <span>{value}</span>
                    </div>
                ))}
                 <h3 className="text-lg font-press-start mt-4 mb-2">Career Stats</h3>
                {Object.entries(player.careerStats).map(([key, value]) => (
                    <div key={key} className="flex justify-between text-sm">
                        <span>{key}</span>
                        <span>{value}</span>
                    </div>
                ))}
            </div>
        </div>
    </Modal>
);

const ScheduleScreen = ({ schedule, teams, myTeamId, week, onGameClick, onBack }: { schedule: Game[], teams: Team[], myTeamId: number, week: number, onGameClick: (game: Game, opponent: Team) => void, onBack: () => void }) => (
    <ScreenWrapper screenKey="SCHEDULE">
        <div className="flex justify-between items-center p-4">
            <h2 className="text-2xl font-press-start text-cyan-400">Schedule</h2>
            <Button onClick={onBack} className="w-auto px-4 py-2">Back</Button>
        </div>
        <div className="space-y-2 p-4 pt-0">
            {schedule.map(game => {
                const opponent = teams.find(t => t.id === game.opponentId)!;
                const isPast = game.week < week || (game.week === week && game.result);
                const isCurrent = game.week === week && !game.result;
                let bgColor = 'bg-gray-800/50';
                if (isCurrent) bgColor = 'bg-yellow-800/50';
                if (isPast && game.result) {
                    bgColor = game.result.myScore > game.result.opponentScore ? 'bg-green-800/50' : 'bg-red-800/50';
                }
                
                return (
                    <div key={game.week} className={`p-4 border border-gray-600 ${bgColor} flex items-center justify-between cursor-pointer`} onClick={() => onGameClick(game, opponent)}>
                        <div>
                            <p className="font-bold">Week {game.week}{game.isRivalryGame && <span className="text-red-500"> (RIVALRY)</span>}</p>
                            <p>{game.isHome ? 'vs' : '@'} {opponent.name} ({opponent.record.wins}-{opponent.record.losses})</p>
                        </div>
                        {game.result && (
                            <p className="text-2xl font-press-start">{game.result.myScore} - {game.result.opponentScore}</p>
                        )}
                        {!game.result && (
                            <div className="flex items-center">
                               <ScoutIcon className="w-6 h-6 mr-2" />
                               <span>Scout</span>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    </ScreenWrapper>
);

const ScoutingReportModal = ({ team, onClose }: { team: Team, onClose: () => void }) => {
    // FIX: Memoization was causing a type inference issue. The calculation is inexpensive so we can run it on every render.
    const report = GameService.generateScoutingReport(team);
    return (
        <Modal onClose={onClose} size="3xl">
            <h2 className="text-2xl font-press-start text-cyan-400 mb-4">Scouting Report: {team.name}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <h3 className="text-xl font-press-start text-yellow-400 mb-2">Strengths</h3>
                    <ul className="list-disc list-inside space-y-1">
                        {report.strengths.map((s, i) => <li key={i}>{s}</li>)}
                    </ul>
                </div>
                <div>
                    <h3 className="text-xl font-press-start text-red-400 mb-2">Weaknesses</h3>
                    <ul className="list-disc list-inside space-y-1">
                        {report.weaknesses.map((w, i) => <li key={i}>{w}</li>)}
                    </ul>
                </div>
            </div>
            <div className="mt-6">
                <h3 className="text-xl font-press-start text-green-400 mb-2">Key Players</h3>
                <div className="space-y-2">
                    {report.keyPlayers.map(p => (
                        <div key={p.id} className="p-2 bg-gray-800 border border-gray-700 flex justify-between">
                            <span>{p.name} ({p.position})</span>
                            <span className="font-bold text-yellow-400">OVR: {p.attributes.OVR}</span>
                        </div>
                    ))}
                </div>
            </div>
        </Modal>
    );
};

const GameSummaryModal = ({ game, myTeam, opponent, onClose }: { game: Game, myTeam: Team, opponent: Team, onClose: () => void }) => {
    if (!game.result) return null;
    const { myScore, opponentScore, playerStats } = game.result;
    
    const statHeaders: { key: keyof PlayerStats, label: string }[] = [
        { key: 'passYds', label: 'Pass Yds' }, { key: 'passTDs', label: 'Pass TD' },
        { key: 'rushYds', label: 'Rush Yds' }, { key: 'rushTDs', label: 'Rush TD' },
        { key: 'recYds', label: 'Rec Yds' }, { key: 'recTDs', label: 'Rec TD' },
        { key: 'tackles', label: 'Tackles' }, { key: 'sacks', label: 'Sacks' }, { key: 'ints', label: 'INT' },
    ];

    const getTopPerformers = (teamRoster: Player[], stats: Record<string, Partial<PlayerStats>>) => {
        const performers: { player: Player, stat: string, value: number }[] = [];
        statHeaders.forEach(header => {
            const top = teamRoster.filter(p => stats[p.id] && stats[p.id][header.key]).sort((a, b) => (stats[b.id][header.key] ?? 0) - (stats[a.id][header.key] ?? 0))[0];
            if (top && (stats[top.id][header.key] ?? 0) > 0) {
                performers.push({ player: top, stat: header.label, value: stats[top.id][header.key]! });
            }
        });
        return performers.filter((p, i, self) => i === self.findIndex(t => t.player.id === p.player.id)).slice(0, 4); // Unique players
    };
    
    const myTopPerformers = getTopPerformers(myTeam.roster, playerStats.myTeam);
    const oppTopPerformers = getTopPerformers(opponent.roster, playerStats.opponentTeam);

    return (
        <Modal onClose={onClose} size="4xl">
            <h2 className="text-2xl font-press-start text-cyan-400 mb-4 text-center">Game Summary</h2>
            <div className="text-center mb-6">
                <p className="text-xl">{myTeam.name} vs {opponent.name}</p>
                <p className={`text-4xl font-bold ${myScore > opponentScore ? 'text-green-400' : 'text-red-400'}`}>
                    {myScore} - {opponentScore}
                </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <h3 className="text-xl font-press-start text-yellow-400 mb-2">{myTeam.name} - Top Performers</h3>
                     <div className="space-y-2">
                        {myTopPerformers.length > 0 ? myTopPerformers.map(({player, stat, value}) => (
                           <p key={player.id}>{player.name} ({player.position}): {value} {stat}</p>
                        )) : <p>No notable performers.</p>}
                    </div>
                </div>
                <div>
                    <h3 className="text-xl font-press-start text-yellow-400 mb-2">{opponent.name} - Top Performers</h3>
                     <div className="space-y-2">
                         {oppTopPerformers.length > 0 ? oppTopPerformers.map(({player, stat, value}) => (
                           <p key={player.id}>{player.name} ({player.position}): {value} {stat}</p>
                        )) : <p>No notable performers.</p>}
                    </div>
                </div>
            </div>
        </Modal>
    );
};

const StandingsScreen = ({ teams, rankings, myTeamId, onBack }: { teams: Team[], rankings: { teamId: number, rank: number }[], myTeamId: number, onBack: () => void }) => (
    <ScreenWrapper screenKey="STANDINGS">
        <div className="flex justify-between items-center p-4">
            <h2 className="text-2xl font-press-start text-cyan-400">National Rankings</h2>
            <Button onClick={onBack} className="w-auto px-4 py-2">Back</Button>
        </div>
        <div className="p-4 pt-0">
            {rankings.map(({ teamId, rank }) => {
                const team = teams.find(t => t.id === teamId)!;
                return (
                    <div key={teamId} className={`flex justify-between p-2 ${teamId === myTeamId ? 'bg-cyan-900' : ''}`}>
                        <span>#{rank} {team.name}</span>
                        <span>({team.record.wins}-{team.record.losses}) OVR: {team.ovr}</span>
                    </div>
                );
            })}
        </div>
    </ScreenWrapper>
);

const NationalStatsScreen = ({ teams, onBack }: { teams: Team[], onBack: () => void }) => {
    // FIX: Removed useMemo to avoid potential type inference issues from other modules.
    const leaders = GameService.getNationalLeaders(teams);
    return (
        <ScreenWrapper screenKey="NATIONAL_STATS">
            <div className="flex justify-between items-center p-4">
                <h2 className="text-2xl font-press-start text-cyan-400">National Leaders</h2>
                <Button onClick={onBack} className="w-auto px-4 py-2">Back</Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 pt-0">
                {Object.entries(leaders).map(([stat, players]) => (
                    <div key={stat} className="bg-gray-800 p-4">
                        <h3 className="font-press-start text-lg text-yellow-400 mb-2">{stat}</h3>
                        {players.map((p, i) => (
                            <div key={p.id} className="flex justify-between text-sm">
                                <span>{i+1}. {p.name}</span>
                                <span>{p.seasonStats[stat as keyof PlayerStats]}</span>
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        </ScreenWrapper>
    );
};

const FacilitiesScreen = ({ facilities, funds, onUpgrade, onBack }: { facilities: GameState['facilities'], funds: number, onUpgrade: (facility: keyof GameState['facilities']) => void, onBack: () => void }) => (
    <ScreenWrapper screenKey="FACILITIES">
        <div className="flex justify-between items-center p-4">
            <h2 className="text-2xl font-press-start text-cyan-400">Facilities</h2>
            <Button onClick={onBack} className="w-auto px-4 py-2">Back</Button>
        </div>
        <div className="space-y-4 p-4 pt-0">
            {Object.entries(facilities).map(([key, facility]) => (
                <div key={key} className="bg-gray-800 p-4">
                    <h3 className="font-press-start text-lg capitalize text-yellow-400">{key}</h3>
                    <p>Level: {facility.level}</p>
                    <p>Upgrade Cost: ${facility.cost.toLocaleString()}</p>
                    <Button onClick={() => onUpgrade(key as keyof GameState['facilities'])} disabled={funds < facility.cost} className="mt-2 w-auto px-4 py-2">
                        Upgrade
                    </Button>
                </div>
            ))}
        </div>
    </ScreenWrapper>
);

const TacticsScreen = ({ gameState, onStrategyChange, onBack }: { gameState: GameState, onStrategyChange: (newStrategy: GameStrategy) => void, onBack: () => void }) => {
    const offensivePlaybooks: OffensivePlaybook[] = ['Balanced', 'Spread', 'Pro-Style', 'Run Heavy', 'Air Raid'];
    const defensivePlaybooks: DefensivePlaybook[] = ['4-3 Defense', '3-4 Defense', 'Nickel', 'Aggressive'];

    const oc = gameState.staff.find(s => s.type === 'OC');
    const dc = gameState.staff.find(s => s.type === 'DC');

    return (
        <ScreenWrapper screenKey="TACTICS">
            <div className="flex justify-between items-center p-4">
                <h2 className="text-2xl font-press-start text-cyan-400">Tactics</h2>
                <Button onClick={onBack} className="w-auto px-4 py-2">Back</Button>
            </div>
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                    <h3 className="text-xl font-press-start text-yellow-400 mb-4">Offensive Playbook</h3>
                    {oc && <p className="mb-2 text-sm">Your OC ({oc.name}) prefers a {oc.scheme} scheme.</p>}
                    <div className="space-y-2">
                        {offensivePlaybooks.map(p => (
                            <button
                                key={p}
                                onClick={() => onStrategyChange({ ...gameState.myStrategy, offense: p })}
                                className={`w-full p-3 text-left border-2 transition-colors ${gameState.myStrategy.offense === p ? 'bg-cyan-400 text-black border-cyan-400' : 'border-gray-600 hover:bg-gray-700'}`}
                            >
                                {p} {oc?.scheme === p && ' (Scheme Fit)'}
                            </button>
                        ))}
                    </div>
                </div>
                <div>
                    <h3 className="text-xl font-press-start text-yellow-400 mb-4">Defensive Playbook</h3>
                     {dc && <p className="mb-2 text-sm">Your DC ({dc.name}) prefers a {dc.scheme} scheme.</p>}
                    <div className="space-y-2">
                         {defensivePlaybooks.map(p => (
                            <button
                                key={p}
                                onClick={() => onStrategyChange({ ...gameState.myStrategy, defense: p })}
                                className={`w-full p-3 text-left border-2 transition-colors ${gameState.myStrategy.defense === p ? 'bg-cyan-400 text-black border-cyan-400' : 'border-gray-600 hover:bg-gray-700'}`}
                            >
                                {p} {dc?.scheme === p && ' (Scheme Fit)'}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </ScreenWrapper>
    );
};

const AwardRacesScreen = ({ teams, onBack }: { teams: Team[], onBack: () => void }) => {
    // FIX: Memoization was causing a type inference issue. The calculation is inexpensive so we can run it on every render.
    const races = GameService.calculateAwardRaces(teams);

    return (
        <ScreenWrapper screenKey="AWARD_RACES">
            <div className="flex justify-between items-center p-4">
                <h2 className="text-2xl font-press-start text-cyan-400">Award Races</h2>
                <Button onClick={onBack} className="w-auto px-4 py-2">Back</Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                {Object.entries(races).map(([award, candidates]) => (
                    <div key={award} className="bg-gray-800 p-4">
                        <h3 className="font-press-start text-lg text-yellow-400 mb-2">{award}</h3>
                        {candidates.map(({player, teamName}, i) => (
                            <div key={player.id} className="flex justify-between text-sm mb-1">
                                <span>{i + 1}. {player.name} ({player.position})</span>
                                <span className="text-gray-400">{teamName.split(' ').pop()} - OVR {player.attributes.OVR}</span>
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        </ScreenWrapper>
    );
};

const StaffScreen = ({ myStaff, market, funds, onHire, onBack }: { myStaff: Staff[], market: Staff[], funds: number, onHire: (staffId: string) => void, onBack: () => void }) => (
    <ScreenWrapper screenKey="STAFF">
        <div className="flex justify-between items-center p-4">
            <h2 className="text-2xl font-press-start text-cyan-400">Coaching Staff</h2>
            <Button onClick={onBack} className="w-auto px-4 py-2">Back</Button>
        </div>
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
                <h3 className="text-xl font-press-start text-yellow-400 mb-4">Your Staff</h3>
                {myStaff.length > 0 ? (
                    <div className="space-y-2">
                        {myStaff.map(s => (
                            <div key={s.id} className="bg-gray-800 p-3">
                                <p className="font-bold">{s.name} ({s.type})</p>
                                <p>Rating: {s.rating} | Salary: ${s.salary.toLocaleString()}</p>
                                {s.scheme && <p>Scheme: {s.scheme}</p>}
                            </div>
                        ))}
                    </div>
                ) : <p>You have no staff hired.</p>}
            </div>
            <div>
                <h3 className="text-xl font-press-start text-yellow-400 mb-4">Staff Market</h3>
                <div className="space-y-2">
                    {market.map(s => (
                        <div key={s.id} className="bg-gray-800 p-3 flex justify-between items-center">
                            <div>
                                <p className="font-bold">{s.name} ({s.type})</p>
                                <p>Rating: {s.rating} | Salary: ${s.salary.toLocaleString()}</p>
                                {s.scheme && <p>Scheme: {s.scheme}</p>}
                            </div>
                            <Button onClick={() => onHire(s.id)} disabled={funds < s.salary || myStaff.some(ms => ms.type === s.type)} className="w-auto px-3 py-1 text-sm">
                                {myStaff.some(ms => ms.type === s.type) ? 'Position Filled' : 'Hire'}
                            </Button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    </ScreenWrapper>
);

const SponsorsScreen = ({ activeSponsor, availableSponsors, onSelectSponsor, onBack }: { activeSponsor: Sponsor | null, availableSponsors: Sponsor[], onSelectSponsor: (sponsorId: string) => void, onBack: () => void }) => (
    <ScreenWrapper screenKey="SPONSORS">
        <div className="flex justify-between items-center p-4">
            <h2 className="text-2xl font-press-start text-cyan-400">Sponsors</h2>
            <Button onClick={onBack} className="w-auto px-4 py-2">Back</Button>
        </div>
        <div className="p-4">
            {activeSponsor ? (
                <div>
                    <h3 className="text-xl font-press-start text-yellow-400 mb-4">Active Sponsor</h3>
                    <div className="bg-gray-800 p-4">
                        <p className="font-bold text-lg">{activeSponsor.name} ({activeSponsor.type})</p>
                        <p>Payout per Win: ${activeSponsor.payoutPerWin.toLocaleString()}</p>
                        <p>Duration: {activeSponsor.duration} season(s) remaining</p>
                    </div>
                </div>
            ) : (
                <div>
                    <h3 className="text-xl font-press-start text-yellow-400 mb-4">Available Sponsors</h3>
                    <div className="space-y-3">
                        {availableSponsors.map(s => (
                            <div key={s.id} className="bg-gray-800 p-4 flex justify-between items-center">
                                <div>
                                    <p className="font-bold text-lg">{s.name} ({s.type})</p>
                                    <p>Payout per Win: ${s.payoutPerWin.toLocaleString()}</p>
                                    <p>Signing Bonus: ${s.signingBonus.toLocaleString()}</p>
                                    <p>Duration: {s.duration} season(s)</p>
                                </div>
                                <Button onClick={() => onSelectSponsor(s.id)} className="w-auto px-4 py-2">Sign</Button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    </ScreenWrapper>
);

const TrophyCaseScreen = ({ trophies, onBack }: { trophies: Trophy[], onBack: () => void }) => (
    <ScreenWrapper screenKey="TROPHY_CASE">
        <div className="flex justify-between items-center p-4">
            <h2 className="text-2xl font-press-start text-cyan-400">Trophy Case</h2>
            <Button onClick={onBack} className="w-auto px-4 py-2">Back</Button>
        </div>
        <div className="p-4">
            {trophies.length > 0 ? (
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {trophies.map((trophy, i) => (
                        <div key={i} className="bg-gray-800 p-4 text-center border-2 border-yellow-500">
                            <TrophyIcon className="w-16 h-16 mx-auto mb-2 text-yellow-400"/>
                            <p className="font-press-start text-lg">{trophy.award}</p>
                            <p className="text-sm">Season {trophy.season}</p>
                            {trophy.playerName && <p className="text-sm">({trophy.playerName})</p>}
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-center p-8">Your trophy case is empty. Go win something!</p>
            )}
        </div>
    </ScreenWrapper>
);

const InboxScreen = ({ messages, onSelectMessage, onBack, onDeleteAll }: { messages: InboxMessage[], onSelectMessage: (messageId: string) => void, onBack: () => void, onDeleteAll: () => void }) => (
    <ScreenWrapper screenKey="INBOX">
         <div className="flex justify-between items-center p-4">
            <h2 className="text-2xl font-press-start text-cyan-400">Inbox</h2>
            <div>
                 <Button onClick={onDeleteAll} className="w-auto px-4 py-2 mr-2">Delete All</Button>
                 <Button onClick={onBack} className="w-auto px-4 py-2">Back</Button>
            </div>
        </div>
        <div className="p-4 space-y-2">
            {messages.length > 0 ? (
                messages.sort((a,b) => (b.season*100 + b.week) - (a.season*100 + a.week)).map(msg => (
                    <div key={msg.id} onClick={() => onSelectMessage(msg.id)} className={`p-3 cursor-pointer border border-gray-600 ${msg.read ? 'bg-gray-800' : 'bg-cyan-900/50'}`}>
                        <p className="font-bold">From: {msg.from}</p>
                        <p>Subject: {msg.subject}</p>
                        <p className="text-xs text-gray-400">S{msg.season} W{msg.week}</p>
                    </div>
                ))
            ) : <p className="text-center p-8">Your inbox is empty.</p>}
        </div>
    </ScreenWrapper>
);

const InboxMessageModal = ({ message, onClose }: { message: InboxMessage, onClose: () => void }) => (
    <Modal onClose={onClose} size="3xl">
        <h2 className="text-xl font-press-start text-cyan-400 mb-2">From: {message.from}</h2>
        <h3 className="text-lg font-bold mb-4">Subject: {message.subject}</h3>
        <p className="whitespace-pre-wrap">{message.body}</p>
    </Modal>
);

const GodModeScreen = ({ onAddFunds, onToggleForceWin, forceWin, onBack }: { onAddFunds: () => void, onToggleForceWin: () => void, forceWin: boolean, onBack: () => void }) => (
    <ScreenWrapper screenKey="GOD_MODE">
        <div className="flex justify-between items-center p-4">
            <h2 className="text-2xl font-press-start text-cyan-400">God Mode</h2>
            <Button onClick={onBack} className="w-auto px-4 py-2">Back</Button>
        </div>
        <div className="p-4 space-y-4">
            <Button onClick={onAddFunds}><DollarIcon className="w-6 h-6 inline-block mr-2" />Add $1,000,000</Button>
            <Button onClick={onToggleForceWin} className={forceWin ? 'bg-green-700 hover:bg-green-600' : ''}>
                <FootballIcon className="w-6 h-6 inline-block mr-2" />
                {forceWin ? 'Force Win: ON' : 'Force Win: OFF'}
            </Button>
        </div>
    </ScreenWrapper>
);

const GameModal = ({ game, opponent, onPlay, onSim, onClose, forceWin }: { game: Game, opponent: Team, onPlay: () => void, onSim: () => void, onClose: () => void, forceWin: boolean }) => (
    <Modal onClose={onClose} size="3xl">
        <h2 className="text-2xl font-press-start text-cyan-400 mb-4 text-center">Week {game.week}</h2>
        <div className="text-center mb-6">
            <p className="text-xl">vs {opponent.name} ({opponent.record.wins}-{opponent.record.losses})</p>
            <p className="text-gray-400">Their OVR: {opponent.ovr}</p>
            {forceWin && <p className="text-yellow-400 font-bold mt-2">FORCE WIN IS ACTIVE</p>}
        </div>
        <div className="flex space-x-4">
            <Button onClick={onPlay}>Play Game</Button>
            <Button onClick={onSim}>Sim Game</Button>
        </div>
    </Modal>
);

const OffseasonModal = ({ onRecruitment, onTraining, onAdvance, awards, myTeam }: { onRecruitment: () => void, onTraining: () => void, onAdvance: () => void, awards: SeasonAwards, myTeam: Team }) => {
    const myMvp = awards.mvp && myTeam.roster.some(p => p.id === awards.mvp?.id);

    return (
        <Modal size="4xl" onClose={onAdvance}>
            <h2 className="text-3xl font-press-start text-cyan-400 mb-4 text-center">Offseason</h2>
            <div className="text-center mb-6 bg-gray-800 p-4">
                <h3 className="text-xl font-press-start text-yellow-400 mb-2">Season Awards</h3>
                <p>National MVP: {awards.mvp ? `${awards.mvp.name} (${awards.mvp.position})` : 'N/A'}</p>
                {myMvp && <p className="text-green-400 font-bold">Your player won the MVP!</p>}
            </div>
            <div className="space-y-4">
                <Button onClick={onRecruitment}><RecruitIcon className="w-6 h-6 inline-block mr-2" />Go to Recruitment</Button>
                <Button onClick={onTraining}><FacilitiesIcon className="w-6 h-6 inline-block mr-2" />Go to Training Camp</Button>
                <Button onClick={onAdvance} className="bg-green-800/50 hover:bg-green-700">Advance to Next Season</Button>
            </div>
        </Modal>
    );
};

const RecruitmentScreen = ({ recruits, points, onSign, onBack, signedRecruits }: { recruits: Recruit[], points: number, onSign: (recruit: Recruit) => void, onBack: () => void, signedRecruits: Recruit[] }) => (
    <ScreenWrapper screenKey="RECRUITMENT">
         <div className="flex justify-between items-center p-4">
            <h2 className="text-2xl font-press-start text-cyan-400">Recruitment</h2>
            <div className="flex items-center space-x-4">
                <span className="text-yellow-400 font-bold">Points: {points}</span>
                <Button onClick={onBack} className="w-auto px-4 py-2">Done</Button>
            </div>
        </div>
        <div className="p-4 pt-0">
            {recruits.map(r => {
                const isSigned = signedRecruits.some(sr => sr.id === r.id);
                return (
                    <div key={r.id} className={`p-3 border border-gray-600 mb-2 flex justify-between items-center ${isSigned ? 'bg-green-900/50' : 'bg-gray-800'}`}>
                        <div>
                            <p className="font-bold">{r.name} ({r.position})</p>
                            <p>OVR: {r.attributes.OVR} | Potential: {r.attributes.Potential}</p>
                        </div>
                        <Button onClick={() => onSign(r)} disabled={points < r.cost || isSigned} className="w-auto px-3 py-1 text-sm">
                            {isSigned ? 'Signed' : `Sign (${r.cost} pts)`}
                        </Button>
                    </div>
                );
            })}
        </div>
    </ScreenWrapper>
);

const TrainingCampScreen = ({ roster, recruits, funds, onSelectionsChange, selections, onBack, onFinalize }: { roster: Player[], recruits: Recruit[], funds: number, selections: Record<string, TrainingProgram>, onSelectionsChange: (playerId: string, program: TrainingProgram) => void, onBack: () => void, onFinalize: () => void }) => {
    const programs: TrainingProgram[] = ['NONE', 'CONDITIONING', 'STRENGTH', 'AGILITY', 'PASSING', 'RECEIVING', 'TACKLING'];
    const programCosts: Record<TrainingProgram, number> = { 'NONE': 0, 'CONDITIONING': 5000, 'STRENGTH': 15000, 'AGILITY': 15000, 'PASSING': 25000, 'RECEIVING': 25000, 'TACKLING': 25000 };
    
    const totalCost = Object.values(selections).reduce((acc, program) => acc + (programCosts[program] || 0), 0);
    const combinedRoster = [...roster, ...recruits];
    
    return (
        <ScreenWrapper screenKey="TRAINING_CAMP">
            <div className="flex justify-between items-center p-4">
                <h2 className="text-2xl font-press-start text-cyan-400">Training Camp</h2>
                <div className="flex items-center space-x-4">
                    <span className={`font-bold ${totalCost > funds ? 'text-red-500' : 'text-green-400'}`}>Cost: ${totalCost.toLocaleString()}</span>
                    <Button onClick={onFinalize} disabled={totalCost > funds} className="w-auto px-4 py-2">Finalize & Pay</Button>
                    <Button onClick={onBack} className="w-auto px-4 py-2">Back</Button>
                </div>
            </div>
            <div className="p-4 pt-0">
                <p className="mb-4">Select a training program for each player. Improvements are not guaranteed!</p>
                <div className="space-y-2">
                    {combinedRoster.map(p => (
                        <div key={p.id} className="grid grid-cols-3 items-center gap-4 bg-gray-800 p-2">
                            <div className="col-span-1">
                                <p className="font-bold">{p.name} ({p.position})</p>
                                <p className="text-sm">OVR: {p.attributes.OVR}</p>
                            </div>
                            <div className="col-span-2">
                                <select 
                                    value={selections[p.id] || 'NONE'}
                                    onChange={(e) => onSelectionsChange(p.id, e.target.value as TrainingProgram)}
                                    className="w-full bg-gray-900 border border-gray-600 p-2"
                                >
                                    {programs.map(prog => (
                                        <option key={prog} value={prog}>{prog} - ${programCosts[prog].toLocaleString()}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </ScreenWrapper>
    );
};

const GameOverScreen = ({ onRestart }: { onRestart: () => void }) => (
    <ScreenWrapper screenKey="GAME_OVER">
        <div className="flex flex-col items-center justify-center h-screen p-4">
            <h1 className="text-5xl font-press-start text-red-500 mb-4">GAME OVER</h1>
            <p className="text-xl mb-8">You have completed the maximum number of seasons.</p>
            <Button onClick={onRestart} className="w-auto px-6 py-3">Start New Career</Button>
        </div>
    </ScreenWrapper>
);

// --- APP COMPONENT ---

const App = () => {
    // State management
    const [gameState, setGameState] = React.useState<GameState | null>(null);
    const [screen, setScreen] = React.useState<Screen>('TEAM_SELECTION');
    const [loading, setLoading] = React.useState<string | null>(null);
    
    // Modal states
    const [selectedPlayer, setSelectedPlayer] = React.useState<Player | null>(null);
    const [selectedGame, setSelectedGame] = React.useState<Game | null>(null);
    const [scoutingOpponent, setScoutingOpponent] = React.useState<Team | null>(null);
    const [gameSummary, setGameSummary] = React.useState<{game: Game, myTeam: Team, opponent: Team} | null>(null);
    const [selectedMessage, setSelectedMessage] = React.useState<InboxMessage | null>(null);
    const [trainingSelections, setTrainingSelections] = React.useState<Record<string, TrainingProgram>>({});
    const [signedRecruits, setSignedRecruits] = React.useState<Recruit[]>([]);

    const resetGame = () => {
        setLoading("Starting New Career...");
        setTimeout(() => { // Simulate loading time
            const world = GameService.initializeGameWorld();
            setGameState({ ...world, myTeamId: null });
            setScreen('TEAM_SELECTION');
            setSignedRecruits([]);
            setTrainingSelections({});
            setLoading(null);
        }, 1000);
    };

    React.useEffect(() => {
        resetGame();
    }, []);
    
    const setGameStateAndSave = (newState: GameState) => {
        // In a real app, you would save to localStorage here
        setGameState(newState);
    };

    // --- HANDLERS ---
    
    const handleSelectTeam = (teamId: number) => {
        setGameState(prev => {
            if (!prev) return null;
            const staff = GameService.generateStaff(2); // Start with an OC and DC
            return {
                ...prev,
                myTeamId: teamId,
                staff,
            };
        });
        setScreen('MAIN_MENU');
    };
    
    const handleNavigate = (newScreen: Screen) => setScreen(newScreen);
    
    const handleAdvanceWeek = async () => {
        if (!gameState || !gameState.myTeamId) return;
        setLoading("Simulating Week...");

        await new Promise(res => setTimeout(res, 500));
        let newState = await GameService.simulateOtherGames(JSON.parse(JSON.stringify(gameState)));
        
        // Post-simulation updates
        newState.teams.forEach(t => t.roster.forEach(p => {
             p.currentStamina = Math.min(100, p.currentStamina + 30);
             if(p.isInjured > 0) p.isInjured--;
        }));

        const { newState: academicState, messages: academicMessages } = GameService.runWeeklyAcademicCheck(newState);
        newState = academicState;
        
        if (newState.week >= 10) { 
            newState = GameService.startOffseason(newState);
            setSignedRecruits([]);
            setTrainingSelections({});
        } else {
             newState.week++;
        }
        
        const weeklyMessages = GameService.generateWeeklyInbox(newState);
        newState.inbox.unshift(...academicMessages, ...weeklyMessages);
        newState.nationalRankings = GameService.updateRankings(newState.teams);
        setGameStateAndSave(newState);
        setLoading(null);
    };
    
    const handleSimGame = async () => {
        if (!gameState || !gameState.myTeamId || !selectedGame) return;
        setLoading("Simulating Your Game...");

        const myTeam = gameState.teams.find(t => t.id === gameState.myTeamId)!;
        const opponent = gameState.teams.find(t => t.id === selectedGame.opponentId)!;
        
        const gameToSim = selectedGame;
        setSelectedGame(null);
        await new Promise(res => setTimeout(res, 500));

        const result = await GameService.simulateGame(myTeam, opponent, gameState.myStrategy, {offense: 'Balanced', defense: '4-3 Defense'}, gameState.facilities, {level: 1, cost: 0}, gameToSim.weather || 'Sunny', gameState.forceWinNextGame, gameState.staff);
        
        const tempState = JSON.parse(JSON.stringify(gameState));
        GameService.applyGameResults(tempState, myTeam, opponent, result);
        if (tempState.forceWinNextGame) tempState.forceWinNextGame = false;
        setGameStateAndSave(tempState);
        
        await handleAdvanceWeek();
    };
    
    const handleGameClick = (game: Game, opponent: Team) => {
        if (game.result) {
            const myTeam = gameState!.teams.find(t => t.id === gameState!.myTeamId)!;
            setGameSummary({ game, myTeam, opponent });
        } else if (game.week === gameState!.week) {
            setSelectedGame(game);
        } else {
            setScoutingOpponent(opponent);
        }
    };

    const handleUpgradeFacility = (facility: keyof GameState['facilities']) => {
        if (!gameState) return;
        const cost = gameState.facilities[facility].cost;
        if (gameState.funds >= cost) {
            const newState = JSON.parse(JSON.stringify(gameState));
            newState.funds -= cost;
            newState.facilities[facility].level++;
            newState.facilities[facility].cost = Math.floor(cost * 1.75);
            setGameStateAndSave(newState);
        }
    };
    
    const handleSignRecruit = (recruit: Recruit) => {
        if (!gameState || gameState.recruitingPoints < recruit.cost) return;
        setGameState(prev => ({...prev!, recruitingPoints: prev!.recruitingPoints - recruit.cost }));
        setSignedRecruits(prev => [...prev, recruit]);
    };
    
    const handleFinalizeTraining = () => {
        if (!gameState) return;
        const { updatedState, cost } = GameService.applyTrainingCampResults(JSON.parse(JSON.stringify(gameState)), trainingSelections, signedRecruits);
        setGameStateAndSave(updatedState);
        setScreen('MAIN_MENU'); // Or back to offseason modal
    };
    
    const handleAdvanceSeason = () => {
        if (!gameState) return;
        setLoading("Advancing to Next Season...");
        setTimeout(() => {
            const newState = GameService.advanceToNextSeason(JSON.parse(JSON.stringify(gameState)), signedRecruits);
            setGameStateAndSave(newState);
            setSignedRecruits([]);
            setTrainingSelections({});
            setLoading(null);
            setScreen('MAIN_MENU');
        }, 500);
    };

    const handleHireStaff = (staffId: string) => {
        if(!gameState) return;
        const newState = GameService.hireStaff(JSON.parse(JSON.stringify(gameState)), staffId);
        setGameStateAndSave(newState);
    };

    const handleSelectSponsor = (sponsorId: string) => {
        if(!gameState) return;
        const sponsor = gameState.availableSponsors.find(s => s.id === sponsorId);
        if(sponsor) {
            const newState = JSON.parse(JSON.stringify(gameState));
            newState.activeSponsor = sponsor;
            newState.funds += sponsor.signingBonus;
            newState.availableSponsors = [];
            setGameStateAndSave(newState);
        }
    };

    const handleSelectMessage = (messageId: string) => {
        if(!gameState) return;
        const message = gameState.inbox.find(m => m.id === messageId);
        if (message) {
            message.read = true;
            setSelectedMessage(message);
            setGameStateAndSave(JSON.parse(JSON.stringify(gameState)));
        }
    };

    // --- RENDER LOGIC ---

    if (loading) return <Loading text={loading} />;
    if (!gameState) return <div />;

    const myTeam = gameState.myTeamId ? gameState.teams.find(t => t.id === gameState.myTeamId) : null;

    if (gameState.season > MAX_SEASONS) {
        return <GameOverScreen onRestart={resetGame} />;
    }

    if (!myTeam) {
        return <TeamSelectionScreen onSelectTeam={handleSelectTeam} />;
    }
    
    if (gameState.isOffseason && screen !== 'RECRUITMENT' && screen !== 'TRAINING_CAMP') {
        return <OffseasonModal myTeam={myTeam} awards={gameState.seasonAwards} onRecruitment={() => setScreen('RECRUITMENT')} onTraining={() => setScreen('TRAINING_CAMP')} onAdvance={handleAdvanceSeason} />;
    }

    const renderScreen = () => {
        switch (screen) {
            case 'ROSTER': return <RosterScreen team={myTeam} onPlayerSelect={p => setSelectedPlayer(p)} onBack={() => setScreen('MAIN_MENU')} />;
            case 'SCHEDULE': return <ScheduleScreen schedule={gameState.schedule[myTeam.id]} teams={gameState.teams} myTeamId={myTeam.id} week={gameState.week} onGameClick={handleGameClick} onBack={() => setScreen('MAIN_MENU')} />;
            case 'STANDINGS': return <StandingsScreen teams={gameState.teams} rankings={gameState.nationalRankings} myTeamId={myTeam.id} onBack={() => setScreen('MAIN_MENU')} />;
            case 'NATIONAL_STATS': return <NationalStatsScreen teams={gameState.teams} onBack={() => setScreen('MAIN_MENU')} />;
            case 'FACILITIES': return <FacilitiesScreen facilities={gameState.facilities} funds={gameState.funds} onUpgrade={handleUpgradeFacility} onBack={() => setScreen('MAIN_MENU')} />;
            case 'RECRUITMENT': return <RecruitmentScreen recruits={gameState.recruits} points={gameState.recruitingPoints} onSign={handleSignRecruit} signedRecruits={signedRecruits} onBack={() => setScreen('MAIN_MENU')} />;
            case 'TRAINING_CAMP': return <TrainingCampScreen roster={myTeam.roster} recruits={signedRecruits} funds={gameState.funds} selections={trainingSelections} onSelectionsChange={(pId, prog) => setTrainingSelections(s => ({...s, [pId]: prog}))} onBack={() => setScreen('MAIN_MENU')} onFinalize={handleFinalizeTraining} />;
            case 'AWARD_RACES': return <AwardRacesScreen teams={gameState.teams} onBack={() => setScreen('MAIN_MENU')} />;
            case 'STAFF': return <StaffScreen myStaff={gameState.staff} market={gameState.staffMarket} funds={gameState.funds} onHire={handleHireStaff} onBack={() => setScreen('MAIN_MENU')} />;
            case 'SPONSORS': return <SponsorsScreen activeSponsor={gameState.activeSponsor} availableSponsors={gameState.availableSponsors} onSelectSponsor={handleSelectSponsor} onBack={() => setScreen('MAIN_MENU')} />;
            case 'INBOX': return <InboxScreen messages={gameState.inbox} onSelectMessage={handleSelectMessage} onDeleteAll={() => setGameState(gs => ({...gs!, inbox: []}))} onBack={() => setScreen('MAIN_MENU')} />;
            case 'TACTICS': return <TacticsScreen gameState={gameState} onStrategyChange={(strat) => setGameState(gs => ({...gs!, myStrategy: strat}))} onBack={() => setScreen('MAIN_MENU')} />;
            case 'TROPHY_CASE': return <TrophyCaseScreen trophies={gameState.trophyCase} onBack={() => setScreen('MAIN_MENU')} />;
            // FIX: Removed the `funds` prop from `GodModeScreen` as it is not defined in the component's props, resolving a type error.
            case 'GOD_MODE': return <GodModeScreen forceWin={gameState.forceWinNextGame} onAddFunds={() => setGameState(gs => ({...gs!, funds: gs!.funds + 1000000}))} onToggleForceWin={() => setGameState(gs => ({...gs!, forceWinNextGame: !gs!.forceWinNextGame}))} onBack={() => setScreen('MAIN_MENU')} />;
            case 'MAIN_MENU':
            default:
                const currentWeekGame = gameState.schedule[myTeam.id].find(g => g.week === gameState.week && !g.result);
                const nextOpponent = currentWeekGame ? gameState.teams.find(t => t.id === currentWeekGame.opponentId) : null;
                return (
                    <div>
                        <MainMenu onNavigate={handleNavigate} unreadMessages={gameState.inbox.filter(m => !m.read).length} />
                        <div className="p-4">
                            {gameState.lastGameResult && (
                                <div className="bg-gray-800 p-4 mb-4">
                                    <h3 className="font-press-start text-lg text-yellow-400">Last Game</h3>
                                    <p>{gameState.lastGameResult.summary}</p>
                                    <p className="text-sm italic mt-2">"{gameState.lastGameResult.newspaperSummary}"</p>
                                </div>
                            )}
                            {nextOpponent ? (
                                <Button onClick={() => setSelectedGame(currentWeekGame!)}>
                                    <FootballIcon className="w-6 h-6 inline-block mr-2" />
                                    Play Week {gameState.week} vs {nextOpponent.name}
                                </Button>
                            ) : !gameState.isOffseason && <p>Waiting for next opponent...</p>}
                        </div>
                    </div>
                );
        }
    };
    
    return (
        <div className="max-w-7xl mx-auto bg-gray-800 border-x-2 border-cyan-400 min-h-screen">
            <Header teamName={myTeam.name} funds={gameState.funds} season={gameState.season} week={gameState.isOffseason ? 1 : gameState.week} />
            {renderScreen()}
            {/* --- Modals --- */}
            {selectedPlayer && <PlayerEditModal player={selectedPlayer} onClose={() => setSelectedPlayer(null)} />}
            {scoutingOpponent && <ScoutingReportModal team={scoutingOpponent} onClose={() => setScoutingOpponent(null)} />}
            {gameSummary && <GameSummaryModal game={gameSummary.game} myTeam={gameSummary.myTeam} opponent={gameSummary.opponent} onClose={() => setGameSummary(null)} />}
            {selectedMessage && <InboxMessageModal message={selectedMessage} onClose={() => setSelectedMessage(null)} />}
            {selectedGame && (
                <GameModal 
                    game={selectedGame} 
                    opponent={gameState.teams.find(t => t.id === selectedGame.opponentId)!}
                    onSim={handleSimGame}
                    onPlay={() => alert("Play-by-play coming soon! Simming for now.")}
                    onClose={() => setSelectedGame(null)}
                    forceWin={gameState.forceWinNextGame}
                />
            )}
        </div>
    );
};

export default App;
