
import * as React from 'react';
import { GameState, Screen, Team, Player, Game, Position, GameStrategy, Recruit, PlayerStats, OffensivePlaybook, DefensivePlaybook, SeasonAwards, Trophy, ActiveGameState, OffensivePlay, TrainingProgram, Staff, Sponsor, InboxMessage } from './types';
import { POWERHOUSE_TEAMS, MAX_SEASONS } from './constants';
import * as GameService from './services/gameService';
import { FootballIcon, RosterIcon, ScheduleIcon, StandingsIcon, FacilitiesIcon, AwardIcon, RecruitIcon, GodModeIcon, ChartIcon, InboxIcon, CoachIcon, SponsorIcon, TrophyIcon, TacticsIcon, ScoutIcon, DollarIcon } from './components/Icons';

// --- HELPER & UI COMPONENTS ---

// FIX: Changed to React.FC to make children prop optional and align with Button component, resolving multiple errors.
const ScreenWrapper: React.FC<{ screenKey: Screen }> = ({ children, screenKey }) => (
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
        return b.attributes[sortBy] - a.attributes[sortBy];
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
    const report = React.useMemo(() => GameService.generateScoutingReport(team), [team]);
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
            if (top && stats[top.id][header.key]! > 0) {
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
    const leaders = React.useMemo(() => GameService.getNationalLeaders(teams), [teams]);
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
                        {/* FIX: Cast 'players' to Player[] to resolve 'map' does not exist on type 'unknown' error. */}
                        {(players as Player[]).map((p, i) => (
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
                    <Button onClick={() => onUpgrade(key as keyof GameState['facilities'])} disabled={funds < facility.cost} className="mt-2">
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
             <div className="p-4 pt-0 space-y-8">
                 <div>
                     <h3 className="text-xl font-press-start text-yellow-400 mb-4">Offensive Playbook</h3>
                     <div className="grid grid-cols-2 gap-4">
                         {offensivePlaybooks.map(pb => {
                            const isSchemeMatch = oc?.scheme === pb;
                            return (
                                <Button key={pb} onClick={() => onStrategyChange({ ...gameState.myStrategy, offense: pb })} className={gameState.myStrategy.offense === pb ? 'bg-cyan-400 text-black' : ''}>
                                 {pb} {isSchemeMatch && '⭐'}
                             </Button>
                            );
                         })}
                     </div>
                 </div>
                 <div>
                     <h3 className="text-xl font-press-start text-yellow-400 mb-4">Defensive Playbook</h3>
                     <div className="grid grid-cols-2 gap-4">
                         {defensivePlaybooks.map(pb => {
                            const isSchemeMatch = dc?.scheme === pb;
                            return (
                              <Button key={pb} onClick={() => onStrategyChange({ ...gameState.myStrategy, defense: pb })} className={gameState.myStrategy.defense === pb ? 'bg-cyan-400 text-black' : ''}>
                                 {pb} {isSchemeMatch && '⭐'}
                             </Button>
                            );
                         })}
                     </div>
                 </div>
             </div>
        </ScreenWrapper>
    );
};

const StaffScreen = ({ gameState, onHire, onBack }: { gameState: GameState, onHire: (staffId: string) => void, onBack: () => void }) => {
    return (
        <ScreenWrapper screenKey="STAFF">
            <div className="flex justify-between items-center p-4">
                <h2 className="text-2xl font-press-start text-cyan-400">Staff</h2>
                <Button onClick={onBack} className="w-auto px-4 py-2">Back</Button>
            </div>
            <div className="p-4 pt-0 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                    <h3 className="text-xl font-press-start text-yellow-400 mb-4">Your Staff</h3>
                    <div className="space-y-4">
                        {['OC', 'DC', 'Trainer', 'Doctor'].map(type => {
                            const member = gameState.staff.find(s => s.type === type);
                            return (
                                <div key={type} className="bg-gray-800 p-3">
                                    <p className="font-bold text-lg">{type}</p>
                                    {member ? (
                                        <>
                                            <p>{member.name}</p>
                                            <p>Rating: <span className={getAttributeColor(member.rating)}>{member.rating}</span></p>
                                            {member.scheme && <p>Scheme: {member.scheme}</p>}
                                        </>
                                    ) : <p className="text-gray-500">Position Vacant</p>}
                                </div>
                            );
                        })}
                    </div>
                </div>
                 <div>
                    <h3 className="text-xl font-press-start text-yellow-400 mb-4">Staff Market</h3>
                     <div className="space-y-4">
                        {gameState.staffMarket.map(staff => (
                            <div key={staff.id} className="bg-gray-800 p-3">
                                <p className="font-bold text-lg">{staff.name} ({staff.type})</p>
                                <p>Rating: <span className={getAttributeColor(staff.rating)}>{staff.rating}</span></p>
                                {staff.scheme && <p>Scheme: {staff.scheme}</p>}
                                <p>Salary: <span className="text-green-400">${staff.salary.toLocaleString()}</span></p>
                                <Button onClick={() => onHire(staff.id)} disabled={gameState.funds < staff.salary} className="mt-2 text-sm p-2">
                                    Hire
                                </Button>
                            </div>
                        ))}
                     </div>
                </div>
            </div>
        </ScreenWrapper>
    );
};

const SponsorsScreen = ({ gameState, onSelect, onBack }: { gameState: GameState, onSelect: (sponsorId: string) => void, onBack: () => void }) => {
    return (
        <ScreenWrapper screenKey="SPONSORS">
            <div className="flex justify-between items-center p-4">
                <h2 className="text-2xl font-press-start text-cyan-400">Sponsors</h2>
                <Button onClick={onBack} className="w-auto px-4 py-2">Back</Button>
            </div>
            <div className="p-4 pt-0 space-y-8">
                <div>
                    <h3 className="text-xl font-press-start text-yellow-400 mb-4">Active Sponsor</h3>
                    {gameState.activeSponsor ? (
                        <div className="bg-gray-800 p-4">
                             <p className="font-bold text-lg">{gameState.activeSponsor.name}</p>
                             <p>Payout per Win: <span className="text-green-400">${gameState.activeSponsor.payoutPerWin.toLocaleString()}</span></p>
                             <p>Seasons Remaining: {gameState.activeSponsor.duration}</p>
                        </div>
                    ) : <p className="text-gray-500">No active sponsor.</p>}
                </div>
                 <div>
                    <h3 className="text-xl font-press-start text-yellow-400 mb-4">Available Offers</h3>
                     <div className="space-y-4">
                        {gameState.availableSponsors.map(sponsor => (
                            <div key={sponsor.id} className="bg-gray-800 p-4">
                                <p className="font-bold text-lg">{sponsor.name} ({sponsor.type})</p>
                                <p>Signing Bonus: <span className="text-green-400">${sponsor.signingBonus.toLocaleString()}</span></p>
                                <p>Payout per Win: <span className="text-green-400">${sponsor.payoutPerWin.toLocaleString()}</span></p>
                                <p>Duration: {sponsor.duration} season(s)</p>
                                <Button onClick={() => onSelect(sponsor.id)} disabled={!!gameState.activeSponsor} className="mt-2 text-sm p-2">
                                    {!!gameState.activeSponsor ? 'Deal Active' : 'Accept Deal'}
                                </Button>
                            </div>
                        ))}
                     </div>
                </div>
            </div>
        </ScreenWrapper>
    );
};

const AwardRacesScreen = ({ gameState, onBack }: { gameState: GameState, onBack: () => void }) => {
    const awardRaces = React.useMemo(() => GameService.calculateAwardRaces(gameState.teams), [gameState.teams]);
    
    return (
        <ScreenWrapper screenKey="AWARD_RACES">
             <div className="flex justify-between items-center p-4">
                <h2 className="text-2xl font-press-start text-cyan-400">Mid-Season Award Races</h2>
                <Button onClick={onBack} className="w-auto px-4 py-2">Back</Button>
            </div>
             <div className="p-4 pt-0 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Object.entries(awardRaces).map(([award, candidates]) => {
                    {/* FIX: Cast 'candidates' to a specific type to resolve errors with 'length' and 'map' on type 'unknown'. */}
                    const typedCandidates = candidates as {player: Player, teamName: string}[];
                    return (
                        <div key={award} className="bg-gray-800 p-4">
                            <h3 className="font-press-start text-lg text-yellow-400 mb-2">{award}</h3>
                            {typedCandidates.length > 0 ? (
                                typedCandidates.map(({player, teamName}, index) => (
                                    <div key={player.id} className="text-sm">
                                        <p>{index + 1}. {player.name} ({player.position}) - {teamName.split(' ')[0]}</p>
                                    </div>
                                ))
                            ) : <p className="text-gray-500">No clear frontrunner.</p>}
                        </div>
                    );
                })}
             </div>
        </ScreenWrapper>
    );
};

const InboxScreen = ({ gameState, onRead, onDelete, onBack }: { gameState: GameState, onRead: (id: string) => void, onDelete: (id: string) => void, onBack: () => void }) => {
    const [selectedMessage, setSelectedMessage] = React.useState<InboxMessage | null>(null);

    const handleSelectMessage = (message: InboxMessage) => {
        setSelectedMessage(message);
        onRead(message.id);
    };

    return (
        <ScreenWrapper screenKey="INBOX">
            <div className="flex justify-between items-center p-4">
                <h2 className="text-2xl font-press-start text-cyan-400">Inbox</h2>
                <Button onClick={onBack} className="w-auto px-4 py-2">Back</Button>
            </div>
            <div className="p-4 pt-0 space-y-2">
                {gameState.inbox.length === 0 && <p>Your inbox is empty.</p>}
                {gameState.inbox.slice().reverse().map(msg => (
                    <div key={msg.id} className={`p-3 border border-gray-700 cursor-pointer ${msg.read ? 'bg-gray-800/60' : 'bg-cyan-900/50'}`} onClick={() => handleSelectMessage(msg)}>
                        <div className="flex justify-between">
                            <p className="font-bold">{msg.from}: {msg.subject}</p>
                            <p className="text-sm text-gray-400">S{msg.season} W{msg.week}</p>
                        </div>
                        <p className="truncate text-sm text-gray-300">{msg.body}</p>
                    </div>
                ))}
            </div>
            
            {selectedMessage && (
                <Modal onClose={() => setSelectedMessage(null)} size="3xl">
                    <h3 className="font-press-start text-xl text-cyan-400 mb-2">{selectedMessage.subject}</h3>
                    <p className="text-gray-400 mb-4">From: {selectedMessage.from}</p>
                    <p className="whitespace-pre-wrap">{selectedMessage.body}</p>
                    <div className="mt-6 flex gap-4">
                        <Button onClick={() => setSelectedMessage(null)} className="text-center justify-center">Close</Button>
                        <Button onClick={() => { onDelete(selectedMessage.id); setSelectedMessage(null); }} className="text-center justify-center border-red-500 hover:bg-red-500">Delete</Button>
                    </div>
                </Modal>
            )}
        </ScreenWrapper>
    );
};

const GodModeScreen = ({ gameState, onBack, onUpdateState, godModeUnlocked, setGodModeUnlocked }: { 
    gameState: GameState, 
    onBack: () => void, 
    onUpdateState: (newState: GameState) => void,
    godModeUnlocked: boolean,
    setGodModeUnlocked: (unlocked: boolean) => void
}) => {
    const [password, setPassword] = React.useState('');
    const [error, setError] = React.useState(false);

    const handleUnlock = () => {
        if (password === '102011') {
            setGodModeUnlocked(true);
            setError(false);
        } else {
            setError(true);
        }
    };

    if (!godModeUnlocked) {
        return (
            <ScreenWrapper screenKey="GOD_MODE">
                <div className="flex justify-between items-center p-4">
                    <h2 className="text-2xl font-press-start text-cyan-400">God Mode</h2>
                    <Button onClick={onBack} className="w-auto px-4 py-2">Back</Button>
                </div>
                <div className="p-4 max-w-sm mx-auto">
                    <input 
                        type="password" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={`bg-gray-800 p-3 w-full mb-4 border-2 ${error ? 'border-red-500' : 'border-gray-700'}`}
                        placeholder="Enter password"
                    />
                    <Button onClick={handleUnlock} className="text-center justify-center">Unlock</Button>
                    {error && <p className="text-red-500 mt-2 text-center">Incorrect Password.</p>}
                </div>
            </ScreenWrapper>
        );
    }
    
    const handleAddFunds = () => onUpdateState({ ...gameState, funds: gameState.funds + 1000000 });
    
    const handleHealTeam = () => {
        if (!gameState.myTeamId) return;
        const myTeam = gameState.teams.find(t => t.id === gameState.myTeamId)!;
        const newRoster = myTeam.roster.map(p => ({ ...p, isInjured: 0, currentStamina: 100 }));
        const newTeams = gameState.teams.map(t => t.id === gameState.myTeamId ? { ...myTeam, roster: newRoster, ovr: GameService.calculateTeamOVR(newRoster) } : t);
        onUpdateState({ ...gameState, teams: newTeams });
    };

    const handleBoostTeam = () => {
        if (!gameState.myTeamId) return;
        const myTeam = gameState.teams.find(t => t.id === gameState.myTeamId)!;
        const newRoster = myTeam.roster.map(p => {
            const newAttributes = { ...p.attributes };
            Object.keys(newAttributes).forEach(key => {
                const attr = key as keyof typeof newAttributes;
                if (attr !== 'OVR') {
                    newAttributes[attr] = 99;
                }
            });
            newAttributes.OVR = 99;
            return { ...p, attributes: newAttributes };
        });
        const newTeams = gameState.teams.map(t => t.id === gameState.myTeamId ? { ...myTeam, roster: newRoster, ovr: 99 } : t);
        onUpdateState({ ...gameState, teams: newTeams });
    };

    const handleMaxFacilities = () => {
        const newFacilities = { ...gameState.facilities };
        const MAX_LEVEL = 10;
        (Object.keys(newFacilities) as Array<keyof typeof newFacilities>).forEach(key => {
            newFacilities[key].level = MAX_LEVEL;
            newFacilities[key].cost = 99999999;
        });
        onUpdateState({ ...gameState, facilities: newFacilities });
    };

    const handleMaxCoaches = () => {
        const newStaff = gameState.staff.map(s => ({ ...s, rating: 99 }));
        onUpdateState({ ...gameState, staff: newStaff });
    };

    const handleMaxMorale = () => {
        if (!gameState.myTeamId) return;
        const myTeam = gameState.teams.find(t => t.id === gameState.myTeamId)!;
        const newRoster = myTeam.roster.map(p => ({ ...p, morale: 100 }));
        const newTeams = gameState.teams.map(t => t.id === gameState.myTeamId ? { ...myTeam, roster: newRoster } : t);
        onUpdateState({ ...gameState, teams: newTeams });
    };

    const handleFixAcademics = () => {
        if (!gameState.myTeamId) return;
        const myTeam = gameState.teams.find(t => t.id === gameState.myTeamId)!;
        const newRoster = myTeam.roster.map(p => ({ ...p, gpa: 4.0, isSuspended: false }));
        const newTeams = gameState.teams.map(t => t.id === gameState.myTeamId ? { ...myTeam, roster: newRoster } : t);
        onUpdateState({ ...gameState, teams: newTeams });
    };

    return (
        <ScreenWrapper screenKey="GOD_MODE">
            <div className="flex justify-between items-center p-4">
                <h2 className="text-2xl font-press-start text-cyan-400">God Mode Controls</h2>
                <Button onClick={onBack} className="w-auto px-4 py-2">Back</Button>
            </div>
            <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button onClick={handleAddFunds} className="text-center justify-center"><DollarIcon className="w-5 h-5 inline mr-2"/>Add $1,000,000</Button>
                <Button onClick={handleHealTeam} className="text-center justify-center">Heal My Team</Button>
                <Button onClick={handleBoostTeam} className="text-center justify-center">Boost Team to 99 OVR</Button>
                <Button onClick={() => onUpdateState({...gameState, forceWinNextGame: !gameState.forceWinNextGame})} className={`text-center justify-center ${gameState.forceWinNextGame ? 'bg-green-600' : ''}`}>
                    Force Win Next Game: {gameState.forceWinNextGame ? 'ON' : 'OFF'}
                </Button>
                <Button onClick={() => onUpdateState({...gameState, fanHappiness: 100})} className="text-center justify-center">Max Fan Happiness</Button>
                <Button onClick={() => onUpdateState({...gameState, recruitingPoints: 999})} className="text-center justify-center">Max Recruiting Points</Button>
                <Button onClick={handleMaxFacilities} className="text-center justify-center">Max Facilities</Button>
                <Button onClick={handleMaxCoaches} className="text-center justify-center">Max Coach Ratings</Button>
                <Button onClick={handleMaxMorale} className="text-center justify-center">Max Team Morale</Button>
                <Button onClick={handleFixAcademics} className="text-center justify-center">Fix Team Academics</Button>
            </div>
        </ScreenWrapper>
    );
};


const TrophyCaseScreen = ({ trophies, onBack }: { trophies: Trophy[], onBack: () => void }) => (
    <ScreenWrapper screenKey="TROPHY_CASE">
        <div className="flex justify-between items-center p-4">
            <h2 className="text-2xl font-press-start text-cyan-400">Trophy Case</h2>
            <Button onClick={onBack} className="w-auto px-4 py-2">Back</Button>
        </div>
        <div className="p-4 pt-0 space-y-2">
            {trophies.length === 0 && <p>Your trophy case is empty. Go win something!</p>}
            {trophies.map((trophy, i) => (
                <div key={i} className="bg-gray-800 p-3">
                    <p className="font-bold text-yellow-400">S{trophy.season} - {trophy.award}</p>
                    {trophy.playerName && <p>{trophy.playerName}</p>}
                </div>
            ))}
        </div>
    </ScreenWrapper>
);


const RecruitmentScreen = ({ recruits, recruitingPoints, onSign, onFinish, signedRecruits }: { recruits: Recruit[], recruitingPoints: number, onSign: (recruit: Recruit) => void, onFinish: () => void, signedRecruits: Recruit[] }) => (
    <ScreenWrapper screenKey="RECRUITMENT">
        <div className="p-4">
            <h2 className="text-2xl font-press-start text-cyan-400 mb-2">Recruiting Class</h2>
            <p className="text-lg text-yellow-400 mb-4">Points: {recruitingPoints}</p>
             <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-gray-800">
                            {['Pos', 'Name', 'OVR', 'Pot', 'Cost', 'Action'].map(h => 
                                <th key={h} className="p-2 uppercase">{h}</th>
                            )}
                        </tr>
                    </thead>
                    <tbody>
                        {recruits.map(r => {
                            const hasSigned = signedRecruits.some(sr => sr.id === r.id);
                            return (
                                <tr key={r.id} className={`border-b border-gray-700 ${hasSigned ? 'opacity-50' : ''}`}>
                                    <td className="p-2"><span className={`px-2 py-1 text-xs font-bold rounded ${getPositionColor(r.position)}`}>{r.position}</span></td>
                                    <td className="p-2">{r.name}</td>
                                    <td className={`p-2 font-bold ${getAttributeColor(r.attributes.OVR)}`}>{r.attributes.OVR}</td>
                                    <td className={`p-2 ${getAttributeColor(r.attributes.Potential)}`}>{r.attributes.Potential}</td>
                                    <td className="p-2 text-yellow-400">{r.cost}</td>
                                    <td className="p-2">
                                        <Button onClick={() => onSign(r)} disabled={recruitingPoints < r.cost || hasSigned} className="p-2 text-sm">
                                            {hasSigned ? 'Signed' : 'Sign'}
                                        </Button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            <Button onClick={onFinish} className="mt-4">Finish Recruiting</Button>
        </div>
    </ScreenWrapper>
);

const TrainingCampScreen = ({ roster, recruits, funds, onFinish, onSelectProgram, selections }: { roster: Player[], recruits: Recruit[], funds: number, onFinish: (selections: Record<string, TrainingProgram>) => void, onSelectProgram: (playerId: string, program: TrainingProgram) => void, selections: Record<string, TrainingProgram> }) => {
    const combinedRoster = [...roster, ...recruits];
    const programs: TrainingProgram[] = ['NONE', 'CONDITIONING', 'STRENGTH', 'AGILITY', 'PASSING', 'RECEIVING', 'TACKLING'];
    const programCosts: Record<TrainingProgram, number> = { 'NONE': 0, 'CONDITIONING': 5000, 'STRENGTH': 15000, 'AGILITY': 15000, 'PASSING': 25000, 'RECEIVING': 25000, 'TACKLING': 25000 };

    const totalCost = Object.values(selections).reduce((sum, prog) => sum + (programCosts[prog] || 0), 0);
    const remainingFunds = funds - totalCost;

    return (
        <ScreenWrapper screenKey="TRAINING_CAMP">
            <div className="p-4">
                <h2 className="text-2xl font-press-start text-cyan-400 mb-2">Training Camp</h2>
                <p className="text-lg text-green-400 mb-4">Funds: ${remainingFunds.toLocaleString()}</p>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-800">
                                {['Pos', 'Name', 'OVR', 'Training Program'].map(h => <th key={h} className="p-2 uppercase">{h}</th>)}
                            </tr>
                        </thead>
                        <tbody>
                            {combinedRoster.map(p => (
                                <tr key={p.id} className="border-b border-gray-700">
                                    <td className="p-2"><span className={`px-2 py-1 text-xs font-bold rounded ${getPositionColor(p.position)}`}>{p.position}</span></td>
                                    <td className="p-2">{p.name}</td>
                                    <td className={`p-2 font-bold ${getAttributeColor(p.attributes.OVR)}`}>{p.attributes.OVR}</td>
                                    <td className="p-2">
                                        <select
                                            value={selections[p.id] || 'NONE'}
                                            onChange={(e) => onSelectProgram(p.id, e.target.value as TrainingProgram)}
                                            className="bg-gray-700 border border-gray-600 p-1 w-full"
                                        >
                                            {programs.map(prog => (
                                                <option key={prog} value={prog} disabled={remainingFunds < programCosts[prog] && selections[p.id] !== prog}>
                                                    {prog} - ${programCosts[prog].toLocaleString()}
                                                </option>
                                            ))}
                                        </select>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <Button onClick={() => onFinish(selections)} className="mt-4" disabled={funds < totalCost}>Finalize & Advance to Season</Button>
            </div>
        </ScreenWrapper>
    );
};


const PlayGameScreen = ({ activeGame, myTeam, opponentTeam, onPlay, onSkip, onContinueOpponentPlay }: { activeGame: ActiveGameState, myTeam: Team, opponentTeam: Team, onPlay: (play: OffensivePlay) => void, onSkip: () => void, onContinueOpponentPlay: () => void }) => {
    const offensivePlays: OffensivePlay[] = ['Inside Run', 'Outside Run', 'Slant', 'Post', 'Screen Pass', 'Play Action'];
    const momentumWidth = 50 + activeGame.momentum / 2;

    return (
        <ScreenWrapper screenKey="PLAY_GAME">
            <div className="p-4">
                <div className="grid grid-cols-3 text-center mb-2 bg-black/50 p-2 font-press-start">
                    <div className="text-cyan-400">{myTeam.name}: {activeGame.playerScore}</div>
                    <div>Q{activeGame.quarter} - {Math.floor(activeGame.time / 60)}:{String(activeGame.time % 60).padStart(2, '0')}</div>
                    <div className="text-red-400">{opponentTeam.name}: {activeGame.opponentScore}</div>
                </div>
                 <div className="w-full bg-red-800 h-2 mb-4 border-2 border-gray-600">
                    <div className="bg-cyan-400 h-full" style={{ width: `${momentumWidth}%` }}></div>
                </div>
                 <div className="text-center text-lg font-bold mb-4">
                    {activeGame.possession === 'player' ? 'Your Possession' : 'Opponent Possession'} - {activeGame.down}{['st','nd','rd','th'][activeGame.down-1] || 'th'} & {activeGame.distance} at the {activeGame.yardLine > 50 ? `Opp ${100 - activeGame.yardLine}` : `Own ${activeGame.yardLine}`}
                </div>
                <div className="h-64 overflow-y-auto bg-gray-800/50 p-2 mb-4 border border-gray-700">
                    {activeGame.playLog.map((log, i) => <p key={i}>{log}</p>)}
                </div>

                {activeGame.possession === 'player' ? (
                     <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {offensivePlays.map(play => <Button key={play} onClick={() => onPlay(play)} className="text-center justify-center">{play}</Button>)}
                        <Button onClick={() => onPlay('Hail Mary')} className="text-center justify-center border-yellow-500 hover:bg-yellow-500">Hail Mary</Button>
                     </div>
                ) : (
                    <Button onClick={onContinueOpponentPlay} className="text-center justify-center">Continue</Button>
                )}
                 <Button onClick={onSkip} className="mt-4 text-center justify-center border-gray-500 hover:bg-gray-600">Sim to End</Button>
            </div>
        </ScreenWrapper>
    );
};

const OffseasonModal = ({ awards, onStartRecruiting }: { awards: SeasonAwards, onStartRecruiting: () => void }) => (
    <Modal size="4xl">
        <h2 className="text-2xl font-press-start text-cyan-400 mb-4">Offseason Report</h2>
        <div className="space-y-4">
            <h3 className="text-xl font-press-start text-yellow-400">Season Awards</h3>
            {awards.mvp && <p>MVP: {awards.mvp.name} ({awards.mvp.position})</p>}
            <p>Best QB: {awards.bestQB?.name || 'N/A'}</p>
             <p>Best RB: {awards.bestRB?.name || 'N/A'}</p>
             <p>Best WR: {awards.bestWR?.name || 'N/A'}</p>
             {/* ... more awards */}
        </div>
        <Button onClick={onStartRecruiting} className="mt-6">Start Recruiting</Button>
    </Modal>
);

const NewspaperClippingModal = ({ result, myTeamName, opponentName, onContinue }: { result: Game['result'], myTeamName: string, opponentName: string, onContinue: () => void }) => {
    if (!result) return null;

    return (
        <Modal size="2xl" onClose={onContinue}>
            <div className="bg-[#FDFBF2] text-black p-6 font-mono border-4 border-black/20" style={{ fontFamily: '"Roboto Mono", monospace' }}>
                <div className="text-center border-b-2 border-black/20 pb-2 mb-4">
                    <h1 className="text-xl font-bold uppercase">The High School Gridiron Gazette</h1>
                    <p className="text-xs">Your Weekly Source for Prep Football Action</p>
                </div>
                <h2 className="text-3xl font-bold text-center mb-4 leading-tight" style={{ fontFamily: '"Press Start 2P", cursive' }}>
                    {result.headline || 'Game Result'}
                </h2>
                <div className="flex justify-around items-center text-center my-4 p-2 bg-black/10 rounded">
                    <div>
                        <p className="text-sm font-bold">{myTeamName}</p>
                        <p className="text-4xl font-bold">{result.myScore}</p>
                    </div>
                    <p className="text-2xl font-bold">-</p>
                     <div>
                        <p className="text-sm font-bold">{opponentName}</p>
                        <p className="text-4xl font-bold">{result.opponentScore}</p>
                    </div>
                </div>
                <p className="text-base leading-relaxed my-4 text-justify">
                    {result.newspaperSummary || 'An exciting game was played.'}
                </p>
                <button 
                    onClick={onContinue} 
                    className="w-full mt-4 p-3 bg-gray-800 text-white font-press-start text-sm uppercase hover:bg-gray-700 transition-colors"
                >
                    Continue
                </button>
            </div>
        </Modal>
    );
};

const GameOverScreen = ({ season, onRestart }: { season: number, onRestart: () => void }) => (
    <ScreenWrapper screenKey="GAME_OVER">
         <div className="p-8 text-center">
            <h2 className="text-4xl font-press-start text-red-500 mb-4">CAREER OVER</h2>
            <p className="text-xl mb-6">You coached for {season - 1} seasons.</p>
            <Button onClick={onRestart} className="text-center justify-center">Start New Career</Button>
        </div>
    </ScreenWrapper>
);

// --- MAIN APP COMPONENT ---

const App = () => {
    const [gameState, setGameState] = React.useState<GameState | null>(null);
    const [screen, setScreen] = React.useState<Screen>('TEAM_SELECTION');
    const [loading, setLoading] = React.useState<string | null>(null);
    const [selectedPlayer, setSelectedPlayer] = React.useState<Player | null>(null);
    const [modal, setModal] = React.useState<{type: 'gameSummary' | 'scoutingReport', game: Game, opponent: Team} | null>(null);
    const [signedRecruits, setSignedRecruits] = React.useState<Recruit[]>([]);
    const [trainingSelections, setTrainingSelections] = React.useState<Record<string, TrainingProgram>>({});
    const [godModeUnlocked, setGodModeUnlocked] = React.useState(false);

    React.useEffect(() => {
        const savedState = localStorage.getItem('footballGameState');
        if (savedState) {
            setGameState(JSON.parse(savedState));
            setScreen('MAIN_MENU');
        }
    }, []);

    React.useEffect(() => {
        if (gameState) {
            localStorage.setItem('footballGameState', JSON.stringify(gameState));
        }
    }, [gameState]);

    const handleSelectTeam = (teamId: number) => {
        setLoading("Building your dynasty...");
        setTimeout(() => {
            const initialState = GameService.initializeGameWorld();
            setGameState({ ...initialState, myTeamId: teamId });
            setScreen('MAIN_MENU');
            setLoading(null);
        }, 500);
    };

    const handleAdvanceWeek = async () => {
        if (!gameState || !gameState.myTeamId) return;
        setLoading("Simulating week...");
        
        // Short delay for loader UX
        await new Promise(r => setTimeout(r, 200));

        let updatedState = JSON.parse(JSON.stringify(gameState));
        const myTeam = updatedState.teams.find((t: Team) => t.id === updatedState.myTeamId)!;

        // Restore stamina for my team
        myTeam.roster.forEach((p: Player) => {
            const trainer = updatedState.staff.find((s: Staff) => s.type === 'Trainer');
            const recoveryRate = 70 + (trainer ? trainer.rating / 10 : 0);
            // FIX: Use exported 'rand' function from GameService to resolve 'rand is not defined' error.
            p.currentStamina = Math.min(100, p.currentStamina + GameService.rand(recoveryRate-10, recoveryRate+10));
            if (p.isInjured > 0) p.isInjured--;
        });

        const { newState: stateAfterAcademics, messages: academicMessages } = GameService.runWeeklyAcademicCheck(updatedState);
        updatedState = stateAfterAcademics;
        updatedState.inbox.push(...academicMessages);

        const nextGame = updatedState.schedule[myTeam.id].find((g: Game) => g.week === updatedState.week);
        
        if (!nextGame) { // End of regular season
            const isPlayoffTeam = updatedState.nationalRankings.slice(0, 8).some((t: { teamId: number }) => t.teamId === myTeam.id);
            if (!isPlayoffTeam) {
                updatedState = GameService.startOffseason(updatedState);
            } else {
                updatedState.week++; // Move to playoffs
            }
        } else {
            const opponent = updatedState.teams.find((t: Team) => t.id === nextGame.opponentId)!;
            const gameResult = await GameService.simulateGame(myTeam, opponent, updatedState.myStrategy, {offense: 'Balanced', defense: '4-3 Defense'}, updatedState.facilities, {level: 1, cost: 0}, nextGame.weather || 'Sunny', updatedState.forceWinNextGame, updatedState.staff);
            
            GameService.applyGameResults(updatedState, myTeam, opponent, gameResult);
            
            if (updatedState.week < 13) {
                 updatedState.week++;
            }
           
            updatedState = await GameService.simulateOtherGames(updatedState);
            updatedState.nationalRankings = GameService.updateRankings(updatedState.teams);

            if (updatedState.week > 10) {
                 const isEliminated = GameService.updatePlayoffBracket(updatedState, myTeam.id, opponent.id, gameResult.myScore > gameResult.opponentScore);
                 if(isEliminated) {
                     updatedState = GameService.startOffseason(updatedState);
                 } else if (updatedState.week === 14) { // Won championship
                     updatedState.trophyCase.push({ season: updatedState.season, award: 'National Champions' });
                     updatedState = GameService.startOffseason(updatedState);
                 }
            }
        }
        
        // Add new inbox messages
        const newMessages = GameService.generateWeeklyInbox(updatedState);
        updatedState.inbox.push(...newMessages);
        if (updatedState.forceWinNextGame) updatedState.forceWinNextGame = false;

        setGameState(updatedState);
        setLoading(null);
    };

    const handlePlayGame = (game: Game, opponent: Team) => {
         if (!gameState) return;
         setGameState({ ...gameState, activeGame: {
            quarter: 1, time: 900, down: 1, distance: 10, yardLine: 25, possession: 'player',
            playerScore: 0, opponentScore: 0, gameId: `${game.week}-${game.opponentId}`, opponentId: opponent.id, playLog: ["Game Start!"], isGameOver: false, momentum: 0,
         }});
         setScreen('PLAY_GAME');
    };
    
    const handleGameModalClick = (game: Game, opponent: Team) => {
        if(game.result) {
            setModal({type: 'gameSummary', game, opponent});
        } else {
            setModal({type: 'scoutingReport', game, opponent});
        }
    };
    
    // --- REVAMPED PLAYABLE GAME LOGIC ---

    const processPlay = (updatedGame: ActiveGameState) => {
        if (updatedGame.time <= 0 && updatedGame.quarter < 4) {
            updatedGame.quarter++;
            updatedGame.time = 900;
            updatedGame.playLog = [`Start of Quarter ${updatedGame.quarter}`, ...updatedGame.playLog];
        }

        if (updatedGame.quarter >= 4 && updatedGame.time <= 0) {
            updatedGame.isGameOver = true;
        }

        setGameState(gs => ({...gs!, activeGame: updatedGame}));
    };

    const handlePlayAction = (play: OffensivePlay) => {
        if (!gameState?.activeGame || !gameState.myTeamId) return;
        const myTeam = gameState.teams.find(t => t.id === gameState.myTeamId)!;
        const opponent = gameState.teams.find(t => t.id === gameState.activeGame.opponentId)!;

        const outcome = GameService.determinePlayerPlayOutcome(myTeam, opponent, play, gameState.activeGame, gameState.staff);
        const nextGameState = GameService.updateGameAfterPlay(gameState.activeGame, outcome);
        processPlay(nextGameState);
    };
    
    const handleContinueForOpponent = () => {
        if (!gameState?.activeGame || !gameState.myTeamId) return;
        setLoading("Opponent's turn...");
        
        // Short delay for UX
        setTimeout(() => {
            const myTeam = gameState.teams.find(t => t.id === gameState.myTeamId)!;
            const opponent = gameState.teams.find(t => t.id === gameState.activeGame.opponentId)!;

            const outcome = GameService.determineOpponentPlayOutcome(myTeam, opponent, gameState.activeGame);
            const nextGameState = GameService.updateGameAfterPlay(gameState.activeGame, outcome);
            processPlay(nextGameState);
            setLoading(null);
        }, 750);
    };

    const handleEndPlayableGame = async () => {
        if (!gameState?.activeGame) return;
        setLoading("Finalizing game...");
        await new Promise(r => setTimeout(r, 200));

        const finalState = await GameService.endPlayableGame(gameState);
        setGameState(finalState);
        setScreen('MAIN_MENU');
        setLoading(null);
    };
    
    const handleSkipGame = async () => {
         if (!gameState || !gameState.myTeamId) return;
        setLoading("Simulating to end...");
        await new Promise(r => setTimeout(r, 200));

        // This function now behaves identically to handleAdvanceWeek but for the current game
        // This ensures records and scores are processed by the same reliable logic.
        let updatedState = JSON.parse(JSON.stringify(gameState));
        const myTeam = updatedState.teams.find((t: Team) => t.id === updatedState.myTeamId)!;
        const nextGame = updatedState.schedule[myTeam.id].find((g: Game) => g.week === updatedState.week)!;
        const opponent = updatedState.teams.find((t: Team) => t.id === nextGame.opponentId)!;
        
        const gameResult = await GameService.simulateGame(myTeam, opponent, updatedState.myStrategy, {offense: 'Balanced', defense: '4-3 Defense'}, updatedState.facilities, {level: 1, cost: 0}, nextGame.weather || 'Sunny', updatedState.forceWinNextGame, updatedState.staff);
        
        GameService.applyGameResults(updatedState, myTeam, opponent, gameResult);
            
        if (updatedState.week < 13) updatedState.week++;
    
        updatedState = await GameService.simulateOtherGames(updatedState);
        updatedState.nationalRankings = GameService.updateRankings(updatedState.teams);
        if (updatedState.forceWinNextGame) updatedState.forceWinNextGame = false;
        updatedState.activeGame = null; // Ensure active game is cleared

        setGameState(updatedState);
        setScreen('MAIN_MENU');
        setLoading(null);
    };

    // --- END REVAMPED LOGIC ---


    const handleUpgradeFacility = (facility: keyof GameState['facilities']) => {
        if (!gameState) return;
        const cost = gameState.facilities[facility].cost;
        if (gameState.funds >= cost) {
            const newState = JSON.parse(JSON.stringify(gameState));
            newState.funds -= cost;
            newState.facilities[facility].level++;
            newState.facilities[facility].cost = Math.floor(cost * 1.75);
            setGameState(newState);
        }
    };
    
    const handleSignRecruit = (recruit: Recruit) => {
        if (!gameState || gameState.recruitingPoints < recruit.cost || signedRecruits.some(r => r.id === recruit.id)) return;
        setGameState({ ...gameState, recruitingPoints: gameState.recruitingPoints - recruit.cost });
        setSignedRecruits([...signedRecruits, recruit]);
    };
    
    const handleFinishRecruiting = () => {
        setScreen('TRAINING_CAMP');
    };

    const handleTrainingSelection = (playerId: string, program: TrainingProgram) => {
        setTrainingSelections({...trainingSelections, [playerId]: program });
    };

    const handleFinishTraining = () => {
        if (!gameState) return;
        setLoading("Applying training...");
        setTimeout(() => {
            const { updatedState } = GameService.applyTrainingCampResults(gameState, trainingSelections, signedRecruits);
            const finalState = GameService.advanceToNextSeason(updatedState, signedRecruits);
            setGameState(finalState);
            setSignedRecruits([]);
            setTrainingSelections({});
            setScreen('MAIN_MENU');
            setLoading(null);
        }, 500);
    };

    const handleHireStaff = (staffId: string) => {
        if (!gameState) return;
        const newState = GameService.hireStaff(JSON.parse(JSON.stringify(gameState)), staffId);
        setGameState(newState);
    };

    const handleSelectSponsor = (sponsorId: string) => {
        if (!gameState || gameState.activeSponsor) return;
        const sponsor = gameState.availableSponsors.find(s => s.id === sponsorId);
        if (sponsor) {
            setGameState({
                ...gameState,
                funds: gameState.funds + sponsor.signingBonus,
                activeSponsor: sponsor,
                availableSponsors: []
            });
        }
    };
    
    const handleMessageRead = (id: string) => {
        if (!gameState) return;
        const msg = gameState.inbox.find(m => m.id === id);
        if (msg && !msg.read) {
            setGameState({ ...gameState, inbox: gameState.inbox.map(m => m.id === id ? {...m, read: true} : m) });
        }
    };

    const handleMessageDelete = (id: string) => {
        if (!gameState) return;
        setGameState({ ...gameState, inbox: gameState.inbox.filter(m => m.id !== id) });
    };

    const renderScreen = () => {
        if (!gameState) return <TeamSelectionScreen onSelectTeam={handleSelectTeam} />;

        const myTeam = gameState.teams.find(t => t.id === gameState.myTeamId);
        if (!myTeam) return <div>Error: Team not found</div>;

        if (gameState.isOffseason && screen !== 'RECRUITMENT' && screen !== 'TRAINING_CAMP') {
             return <OffseasonModal awards={gameState.seasonAwards} onStartRecruiting={() => setScreen('RECRUITMENT')} />;
        }
        
        if (gameState.activeGame && !gameState.activeGame.isGameOver && screen !== 'PLAY_GAME') {
            setScreen('PLAY_GAME'); // Force to game screen if game is active
        }

        switch (screen) {
            case 'ROSTER': return <RosterScreen team={myTeam} onPlayerSelect={setSelectedPlayer} onBack={() => setScreen('MAIN_MENU')} />;
            case 'SCHEDULE': return <ScheduleScreen schedule={gameState.schedule[myTeam.id]} teams={gameState.teams} myTeamId={myTeam.id} week={gameState.week} onGameClick={handleGameModalClick} onBack={() => setScreen('MAIN_MENU')} />;
            case 'STANDINGS': return <StandingsScreen teams={gameState.teams} rankings={gameState.nationalRankings} myTeamId={myTeam.id} onBack={() => setScreen('MAIN_MENU')} />;
            case 'NATIONAL_STATS': return <NationalStatsScreen teams={gameState.teams} onBack={() => setScreen('MAIN_MENU')} />;
            case 'FACILITIES': return <FacilitiesScreen facilities={gameState.facilities} funds={gameState.funds} onUpgrade={handleUpgradeFacility} onBack={() => setScreen('MAIN_MENU')} />;
            case 'TACTICS': return <TacticsScreen gameState={gameState} onStrategyChange={(s) => setGameState({...gameState, myStrategy: s})} onBack={() => setScreen('MAIN_MENU')} />;
            case 'STAFF': return <StaffScreen gameState={gameState} onHire={handleHireStaff} onBack={() => setScreen('MAIN_MENU')} />;
            case 'SPONSORS': return <SponsorsScreen gameState={gameState} onSelect={handleSelectSponsor} onBack={() => setScreen('MAIN_MENU')} />;
            case 'AWARD_RACES': return <AwardRacesScreen gameState={gameState} onBack={() => setScreen('MAIN_MENU')} />;
            case 'TROPHY_CASE': return <TrophyCaseScreen trophies={gameState.trophyCase} onBack={() => setScreen('MAIN_MENU')} />;
            case 'INBOX': return <InboxScreen gameState={gameState} onRead={handleMessageRead} onDelete={handleMessageDelete} onBack={() => setScreen('MAIN_MENU')} />;
            case 'GOD_MODE': return <GodModeScreen gameState={gameState} onBack={() => setScreen('MAIN_MENU')} onUpdateState={setGameState} godModeUnlocked={godModeUnlocked} setGodModeUnlocked={setGodModeUnlocked} />;
            case 'RECRUITMENT': return <RecruitmentScreen recruits={gameState.recruits} recruitingPoints={gameState.recruitingPoints} onSign={handleSignRecruit} onFinish={handleFinishRecruiting} signedRecruits={signedRecruits} />;
            case 'TRAINING_CAMP': return <TrainingCampScreen roster={myTeam.roster} recruits={signedRecruits} funds={gameState.funds} onFinish={handleFinishTraining} onSelectProgram={handleTrainingSelection} selections={trainingSelections} />;
            case 'PLAY_GAME':
                if (gameState.activeGame?.isGameOver) {
                    return <Button onClick={handleEndPlayableGame} className="text-center justify-center m-8">Game Over! View Results</Button>
                }
                return gameState.activeGame ? <PlayGameScreen activeGame={gameState.activeGame} myTeam={myTeam} opponentTeam={gameState.teams.find(t => t.id === gameState.activeGame?.opponentId)!} onPlay={handlePlayAction} onSkip={handleSkipGame} onContinueOpponentPlay={handleContinueForOpponent} /> : <div>No Active Game</div>;
            case 'GAME_OVER': return <GameOverScreen season={gameState.season} onRestart={() => { setGameState(null); setScreen('TEAM_SELECTION'); }} />;
            case 'MAIN_MENU':
            default:
                const nextOpponentId = GameService.findNextOpponentId(gameState);
                const nextOpponent = nextOpponentId ? gameState.teams.find(t => t.id === nextOpponentId) : null;
                const nextGame = gameState.schedule[myTeam.id].find(g => g.week === gameState.week);
                const unreadMessages = gameState.inbox.filter(m => !m.read).length;
                return (
                    <ScreenWrapper screenKey="MAIN_MENU">
                        <div className="p-4 text-center bg-black/30 border-b-2 border-cyan-700 mb-4">
                            <h3 className="text-2xl font-press-start text-yellow-400">
                                Record: {myTeam.record.wins}-{myTeam.record.losses}
                            </h3>
                             <p className="text-sm text-gray-400 mt-1">Overall: {myTeam.ovr}</p>
                        </div>
                        <MainMenu onNavigate={setScreen} unreadMessages={unreadMessages} />
                        {gameState.lastGameResult && <NewspaperClippingModal result={gameState.lastGameResult} myTeamName={myTeam.name} opponentName={gameState.teams.find(t => t.id === gameState.lastGameResult?.opponentId)?.name || ''} onContinue={() => setGameState({...gameState, lastGameResult: null})} />}
                        <div className="p-4">
                            {nextOpponent && nextGame ? (
                                <>
                                    <Button onClick={() => handlePlayGame(nextGame, nextOpponent)} className="mb-2 text-center justify-center">Play Week {gameState.week} vs {nextOpponent.name}</Button>
                                    <Button onClick={handleAdvanceWeek} className="text-center justify-center">Sim Week {gameState.week}</Button>
                                </>
                            ) : <p>Offseason in progress...</p>}
                        </div>
                    </ScreenWrapper>
                );
        }
    };

    const myTeam = gameState?.teams.find(t => t.id === gameState.myTeamId);

    return (
        <div className="container mx-auto max-w-7xl bg-gray-900 border-x-2 border-cyan-600 min-h-screen">
            {loading && <Loading text={loading} />}
            {myTeam && screen !== 'TEAM_SELECTION' && <Header teamName={myTeam.name} funds={gameState!.funds} season={gameState!.season} week={gameState!.week} />}
            <main>
                {renderScreen()}
            </main>
            {selectedPlayer && <PlayerEditModal player={selectedPlayer} onClose={() => setSelectedPlayer(null)} />}
            {modal?.type === 'gameSummary' && <GameSummaryModal game={modal.game} myTeam={myTeam!} opponent={modal.opponent} onClose={() => setModal(null)} />}
            {modal?.type === 'scoutingReport' && <ScoutingReportModal team={modal.opponent} onClose={() => setModal(null)} />}
        </div>
    );
};

export default App;
