

import * as React from 'react';
import { GameState, Screen, Team, Player, Game, Position, GameStrategy, Recruit, PlayerStats, OffensivePlaybook, DefensivePlaybook, SeasonAwards, Trophy, ActiveGameState, OffensivePlay, TrainingProgram, Staff, Sponsor, InboxMessage, GodModeState, HallOfFameInductee, CoachSkillTree, CoachSkill, WVClass, ScoutingReport, TrainingFocus, PlayerHOFDetails, CoachHOFDetails, TeamHOFDetails, NewsArticle, CollegeOffer } from './types';
import { WV_TEAMS } from './constants';
import * as GameService from './services/gameService';
import { FootballIcon, RosterIcon, ScheduleIcon, StandingsIcon, FacilitiesIcon, AwardIcon, RecruitIcon, GodModeIcon, ChartIcon, InboxIcon, CoachIcon, SponsorIcon, TrophyIcon, TacticsIcon, ScoutIcon, DollarIcon, HallOfFameIcon } from './components/Icons';

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
    className={`w-full text-left p-4 border-2 border-primary bg-secondary/20 transition-all duration-200 uppercase font-press-start text-sm md:text-base ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-primary hover:text-text-dark'}`}
  >
    {children}
  </button>
);

const Modal = ({ children, onClose, title, size = '4xl' }: { children?: React.ReactNode, onClose?: () => void, title: string, size?: 'xl' | '2xl' | '3xl' | '4xl' | 'full' }) => (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className={`bg-background border-2 border-primary p-6 max-w-${size} w-full max-h-[90vh] overflow-y-auto`} onClick={e => e.stopPropagation()}>
        <h2 className="text-2xl font-press-start text-primary mb-4">{title}</h2>
        {children}
      </div>
    </div>
);

const Loading = ({ text }: { text: string }) => (
    <div className="fixed inset-0 bg-black/90 flex flex-col items-center justify-center p-4 z-[100]">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-xl font-press-start text-primary">{text}</p>
    </div>
);

const Header = ({ teamName, funds, season, week, record, gameMode, onMainMenu }: { teamName: string, funds: number, season: number, week: number, record?: { wins: number; losses: number; }, gameMode: GameState['gameMode'], onMainMenu: () => void }) => {
    const getWeekLabel = () => {
        if (week <= 10) return `Week ${week}`;
        if (week === 11) return 'Playoffs QF';
        if (week === 12) return 'Playoffs SF';
        if (week === 13) return 'Playoffs Final';
        if (week === 14) return 'ToC Semifinal';
        if (week === 15) return 'ToC Final';
        if (week === 16) return 'Offseason: Awards';
        if (week === 17) return 'Offseason: Training';
        if (week === 18) return 'Offseason: Recruiting';
        return `Week ${week}`;
    };

    return (
        <header className="p-4 bg-black/50 border-b-2 border-primary flex flex-wrap justify-between items-center text-xs md:text-base">
            <h1 className="font-press-start text-base md:text-2xl text-primary basis-full md:basis-auto mb-2 md:mb-0">{teamName}</h1>
            <div className="flex space-x-4 md:space-x-6 items-center">
                {gameMode === 'DYNASTY' && <p>Funds: <span className="text-tertiary">${funds.toLocaleString()}</span></p>}
                <p>Season: <span className="text-primary">{season}</span></p>
                <p>Phase: <span className="text-primary">{getWeekLabel()}</span></p>
                {record && <p>Record: <span className="text-primary">{record.wins}-{record.losses}</span></p>}
                <button onClick={onMainMenu} className="font-press-start text-xs uppercase border-2 border-primary px-2 py-1 hover:bg-primary hover:text-text-dark">Main Menu</button>
            </div>
        </header>
    );
};

const NavMenu: React.FC<{ onNavigate: (screen: Screen) => void, gameMode: GameState['gameMode'], isGodMode: boolean, week: number }> = ({ onNavigate, gameMode, isGodMode, week }) => {
    const commonButtons = [
        { screen: 'SCHEDULE', icon: ScheduleIcon, label: 'Schedule' },
        { screen: 'STANDINGS', icon: StandingsIcon, label: 'Standings' },
        { screen: 'NEWS', icon: InboxIcon, label: 'News' },
        { screen: 'NATIONAL_STATS', icon: ChartIcon, label: 'Leaders' },
        { screen: 'AWARD_RACES', icon: AwardIcon, label: 'Award Races' },
        { screen: 'TROPHY_CASE', icon: TrophyIcon, label: 'Trophy Case' },
        { screen: 'HALL_OF_FAME', icon: HallOfFameIcon, label: 'Hall of Fame' },
    ];
    
    if (week >= 11 && week <= 15) {
        commonButtons.splice(2, 0, { screen: 'PLAYOFFS_HUB', icon: TrophyIcon, label: 'Playoffs' });
    }
    
    const hubButton = gameMode === 'DYNASTY' 
        ? { screen: 'TEAM_PROFILE_HUB', icon: CoachIcon, label: 'Team Hub'}
        : { screen: 'MY_CAREER_HUB', icon: RosterIcon, label: 'MyCareer Hub' };
        
    let buttons = [hubButton, ...commonButtons];
    if (isGodMode) {
        buttons.push({ screen: 'GOD_MODE_SETTINGS', icon: GodModeIcon, label: 'God Mode' });
    }

    return (
        <nav className="p-2 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-9 gap-2">
            {buttons.map(({ screen, icon: Icon, label }) => (
                <button key={screen} onClick={() => onNavigate(screen)} className="flex flex-col items-center justify-center p-2 border-2 border-transparent bg-black/50 hover:border-primary hover:bg-secondary/50 transition-all duration-200">
                    <Icon className="w-8 h-8 mb-1 text-primary" />
                    <span className="font-press-start text-xs uppercase text-center">{label}</span>
                </button>
            ))}
        </nav>
    );
};


// --- SCREENS ---

const MainMenu: React.FC<{ onNavigate: (screen: Screen) => void, onNewGame: (mode: GameState['gameMode']) => void, hasSave: boolean, onLoadGame: () => void, godModeUnlocked: boolean }> = ({ onNavigate, onNewGame, hasSave, onLoadGame, godModeUnlocked }) => (
    <div className="max-w-md mx-auto p-4 space-y-4 text-center">
        <h1 className="text-4xl font-press-start text-primary my-8">Retro High School Football</h1>
        {hasSave && <Button onClick={onLoadGame}>Load Game</Button>}
        <Button onClick={() => onNewGame('DYNASTY')}>New Dynasty</Button>
        <Button onClick={() => onNewGame('MY_CAREER')}>New MyCareer</Button>
        <Button onClick={() => onNavigate('GOD_MODE')}>God Mode</Button>
    </div>
);

const GodModeUnlockScreen: React.FC<{ onUnlock: () => void, onBack: () => void, unlocked: boolean }> = ({ onUnlock, onBack, unlocked }) => {
    const [password, setPassword] = React.useState('');
    const [message, setMessage] = React.useState('');

    const handleUnlock = () => {
        if (password === '102011') {
            onUnlock();
            setMessage('GOD MODE UNLOCKED! New games will have god mode available.');
        } else {
            setMessage('Incorrect password.');
        }
    };

    if (unlocked) {
        return (
            <div className="max-w-md mx-auto p-4 space-y-4 text-center">
                 <h2 className="text-2xl font-press-start text-secondary">God Mode Status</h2>
                 <p className="text-secondary">UNLOCKED</p>
                 <p>You can now enable God Mode cheats from the God Mode menu screen for any new game.</p>
                 <Button onClick={onBack}>Back to Menu</Button>
            </div>
        )
    }

    return (
        <div className="max-w-md mx-auto p-4 space-y-4 text-center">
            <h2 className="text-2xl font-press-start text-primary">Unlock God Mode</h2>
            <input 
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-gray-800 border-2 border-primary p-2 text-center font-mono"
                placeholder="Enter Password"
            />
            <Button onClick={handleUnlock}>Unlock</Button>
            <Button onClick={onBack}>Back</Button>
            {message && <p className="mt-4 text-primary">{message}</p>}
        </div>
    );
};

const GodModeSettingsScreen: React.FC<{ settings: GodModeState, onToggle: (setting: keyof GodModeState) => void, onAction: (action: 'maxAllTeamOvr') => void, onBack: () => void, gameMode: GameState['gameMode'] }> = ({ settings, onToggle, onAction, onBack, gameMode }) => {
    const isMyCareer = gameMode === 'MY_CAREER';
    const toggles = Object.entries(settings).filter(([key]) => typeof settings[key as keyof GodModeState] === 'boolean' && key !== 'isEnabled');

    return (
        <div className="max-w-2xl mx-auto p-4">
            <h2 className="text-3xl font-press-start text-primary text-center my-6">God Mode Controls</h2>
            <div className="space-y-4">
                {toggles.map(([key, value]) => {
                     const myCareerOnly = ['canTransferAnytime', 'autoCrazyStats', 'autoStart', 'infiniteSkillPoints'].includes(key);
                     if (myCareerOnly && !isMyCareer) return null;

                     return (
                         <div key={key} className="flex items-center justify-between p-3 bg-secondary/20 border-l-4 border-primary">
                            <span className="capitalize font-bold">{key.replace(/([A-Z])/g, ' $1')}</span>
                            <button onClick={() => onToggle(key as keyof GodModeState)} className={`px-4 py-2 font-press-start text-xs ${value ? 'bg-secondary text-text-main' : 'bg-gray-600 text-gray-300'}`}>
                                {value ? 'ON' : 'OFF'}
                            </button>
                        </div>
                    );
                })}
                <Button onClick={() => onAction('maxAllTeamOvr')}>Max Out All Team Players to 99 OVR</Button>
            </div>
            <Button onClick={onBack} className="mt-8">Back to Menu</Button>
        </div>
    );
};


const TeamSelectionScreen: React.FC<{ teams: Team[], onSelect: (teamId: number) => void, title?: string }> = ({ teams, onSelect, title = "Select Your Team" }) => (
    <div className="max-w-2xl mx-auto p-4">
        <h2 className="text-3xl font-press-start text-primary text-center my-6">{title}</h2>
        {(['AAA', 'AA', 'A'] as WVClass[]).map(wvClass => {
            const classTeams = teams.filter(t => t.class === wvClass);
            if (classTeams.length === 0) return null;
            return (
                <div key={wvClass} className="mb-6">
                    <h3 className="text-2xl font-press-start text-tertiary mb-2">Class {wvClass}</h3>
                    <div className="space-y-2">
                        {classTeams.map(team => (
                            <Button key={team.id} onClick={() => onSelect(team.id)}>
                                <div className="flex justify-between">
                                    <span>{team.name}</span>
                                    <span className="text-tertiary">OVR: {team.ovr}</span>
                                </div>
                            </Button>
                        ))}
                    </div>
                </div>
            );
        })}
    </div>
);

const MyCareerCreationScreen: React.FC<{ teams: Team[], onComplete: (name: string, pos: Position, teamId: number) => void }> = ({ teams, onComplete }) => {
    const [name, setName] = React.useState('');
    const [position, setPosition] = React.useState<Position>('QB');
    const [teamId, setTeamId] = React.useState<number | null>(null);

    const positions: Position[] = ['QB', 'RB', 'WR', 'TE', 'OL', 'DL', 'LB', 'DB', 'K/P'];

    if (teamId === null) {
        return <TeamSelectionScreen teams={teams} onSelect={setTeamId} />;
    }

    return (
        <div className="max-w-md mx-auto p-4 space-y-4">
            <h2 className="text-3xl font-press-start text-primary text-center my-6">Create Your Player</h2>
            <div>
                <label className="block text-xl font-press-start text-primary mb-2">Player Name</label>
                <input 
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-gray-800 border-2 border-primary p-2 font-mono"
                    placeholder="Enter Name"
                />
            </div>
            <div>
                <label className="block text-xl font-press-start text-primary mb-2">Position</label>
                <select value={position} onChange={e => setPosition(e.target.value as Position)} className="w-full bg-gray-800 border-2 border-primary p-2 font-mono">
                    {positions.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
            </div>
            <Button onClick={() => onComplete(name, position, teamId)} disabled={!name}>Start Career</Button>
        </div>
    );
};

const PlayerProfileModal: React.FC<{ player: Player, onUpgrade: (attr: keyof Player['attributes']) => void, onClose: () => void, isGodEditable: boolean, onEdit: (p: Player, newAttrs: Player['attributes']) => void }> = ({ player, onUpgrade, onClose, isGodEditable, onEdit }) => {
    const [editableAttrs, setEditableAttrs] = React.useState(player.attributes);
    const [isEditing, setIsEditing] = React.useState(false);

    // FIX: Keep editable state in sync with the player prop to avoid stale data.
    React.useEffect(() => {
        setEditableAttrs(player.attributes);
    }, [player.attributes]);


    const handleAttrChange = (attr: keyof Player['attributes'], value: string) => {
        const numValue = parseInt(value, 10);
        if (!isNaN(numValue) && numValue >= 40 && numValue <= 99) {
            setEditableAttrs(prev => ({ ...prev, [attr]: numValue }));
        }
    };
    
    const handleSave = () => {
        onEdit(player, editableAttrs);
        setIsEditing(false);
    }
    
    return (
        <Modal title={`${player.name} (${player.position})`} onClose={onClose}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-press-start text-primary mb-2">Attributes</h3>
                        {isGodEditable && !isEditing && <button onClick={() => setIsEditing(true)} className="text-xs font-press-start text-primary">[EDIT]</button>}
                        {isEditing && <button onClick={handleSave} className="text-xs font-press-start text-secondary">[SAVE]</button>}
                    </div>
                    
                    {player.isPlayerCharacter && <p className="mb-2">Skill Points: <span className="text-primary font-bold">{player.skillPoints}</span></p>}
                    {player.isPlayerCharacter && typeof player.xp === 'number' && (
                         <div className="mb-2">
                             <p>XP: {player.xp} / {player.xpToNextLevel}</p>
                             <div className="w-full bg-gray-700 h-2 mt-1">
                                <div className="bg-primary h-2" style={{ width: `${(player.xp / player.xpToNextLevel!) * 100}%` }}></div>
                             </div>
                         </div>
                    )}
                    {Object.entries(player.attributes).map(([key, value]) => (
                        <div key={key} className="flex justify-between items-center">
                            <span>{key}:</span>
                            {isEditing && key !== 'OVR' ? (
                                <input type="number" value={editableAttrs[key as keyof typeof editableAttrs]} onChange={(e) => handleAttrChange(key as keyof Player['attributes'], e.target.value)} className="w-16 bg-gray-700 text-right p-1" />
                            ) : (
                                <span>{value}</span>
                            )}
                            {player.isPlayerCharacter && player.skillPoints! > 0 && key !== 'OVR' && !isEditing && (
                                <button onClick={() => onUpgrade(key as keyof Player['attributes'])} className="px-2 py-1 text-xs bg-secondary border-secondary font-press-start hover:bg-secondary/70">+</button>
                            )}
                        </div>
                    ))}
                </div>
                <div>
                    <h3 className="text-lg font-press-start text-primary mb-2">Season Stats</h3>
                    {Object.entries(player.seasonStats).map(([key, value]) => <p key={key}>{key}: {value}</p>)}
                </div>
                {player.isPlayerCharacter && player.goals && (
                    <div className="md:col-span-2 mt-4">
                         <h3 className="text-lg font-press-start text-primary mb-2">Season Goals</h3>
                         <ul className="list-disc list-inside">
                            {player.goals.map((goal, i) => <li key={i} className={goal.isCompleted ? 'line-through text-gray-500' : ''}>{goal.description}</li>)}
                         </ul>
                    </div>
                )}
            </div>
        </Modal>
    );
};


const RosterScreen: React.FC<{ gameState: GameState, onUpgradeAttribute: (attr: keyof Player['attributes']) => void, onEditPlayer: (p: Player, newAttrs: Player['attributes']) => void }> = ({ gameState, onUpgradeAttribute, onEditPlayer }) => {
    const [selectedPlayer, setSelectedPlayer] = React.useState<Player | null>(null);
    const myTeam = gameState.teams.find(t => t.id === gameState.myTeamId);
    const isGodEditable = gameState.godMode?.isEnabled && gameState.godMode.canEditPlayers;

    // FIX: Keep selectedPlayer in sync with gameState to prevent stale data in the modal.
    React.useEffect(() => {
        if (selectedPlayer && gameState.myTeamId) {
            const currentTeam = gameState.teams.find(t => t.id === gameState.myTeamId);
            const updatedPlayer = currentTeam?.roster.find(p => p.id === selectedPlayer.id);
            if (updatedPlayer) {
                setSelectedPlayer(updatedPlayer);
            } else {
                setSelectedPlayer(null); // Player no longer exists, close modal
            }
        }
    }, [gameState, selectedPlayer?.id, gameState.myTeamId]);
    
    // FIX: Add a guard clause to prevent crashing if the team is not found.
    if (!myTeam) return <div>Error: Team not found.</div>;

    return (
        <div>
            <h2 className="text-2xl font-press-start text-primary mb-4 p-4">Team Roster</h2>
            <div className="overflow-x-auto p-4">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-black/50 border-b-2 border-primary">
                            {['Name', 'Pos', 'Yr', 'Str', 'OVR', 'Morale', 'Stamina', 'Status'].map(h => 
                                <th key={h} className="p-2 uppercase font-press-start text-xs">{h}</th>
                            )}
                        </tr>
                    </thead>
                    <tbody>
                        {myTeam.roster.sort((a,b) => a.stringer - b.stringer).map(p => (
                            <tr key={p.id} onClick={() => setSelectedPlayer(p)} className={`border-b border-gray-700 hover:bg-secondary/30 cursor-pointer ${p.id === gameState.myPlayerId ? 'bg-primary/20' : ''}`}>
                                <td className="p-2">{p.name} {p.isPlayerCharacter && '(You)'}</td>
                                <td className="p-2">{p.position}</td>
                                <td className="p-2">{p.year}</td>
                                <td className="p-2">{p.stringer}</td>
                                <td className="p-2 text-primary font-bold">{p.attributes.OVR}</td>
                                <td className="p-2">{p.morale}</td>
                                <td className="p-2">{p.currentStamina}</td>
                                <td className="p-2">{p.isSuspended > 0 ? <span className="text-red-500">SUSP ({p.isSuspended})</span> : p.isInjured > 0 ? <span className="text-yellow-500">INJ ({p.isInjured})</span> : <span className="text-green-500">OK</span>}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {selectedPlayer && <PlayerProfileModal player={selectedPlayer} onClose={() => setSelectedPlayer(null)} onUpgrade={onUpgradeAttribute} isGodEditable={isGodEditable} onEdit={onEditPlayer} />}
        </div>
    );
};

const ScheduleScreen: React.FC<{ gameState: GameState, onScoutOpponent: (opponentId: number) => void, onSimGame: (game: Game) => void }> = ({ gameState, onScoutOpponent, onSimGame }) => {
    // FIX: Add guard clauses for missing team or schedule
    const myTeamId = gameState.myTeamId;
    if (myTeamId === null) return <div>Error: No team selected.</div>;

    const mySchedule = gameState.schedule[myTeamId];
    if (!mySchedule) return <div>Error: Schedule not found for your team.</div>;

    return (
        <div>
            <h2 className="text-2xl font-press-start text-primary mb-4 p-4">Team Schedule</h2>
            <div className="p-4 space-y-2">
                {mySchedule.map(game => {
                    const opponent = gameState.teams.find(t => t.id === game.opponentId);
                    if (!opponent) return null;

                    const isCurrentWeek = game.week === gameState.week;
                    const canPlayGame = isCurrentWeek && !game.result && gameState.week <= 15;

                    return (
                        <div key={`${game.week}-${game.opponentId}`} className={`p-3 bg-black/50 border-l-4 ${isCurrentWeek ? 'border-primary' : 'border-gray-700'}`}>
                            <div className="flex justify-between items-center flex-wrap gap-2">
                                <div>
                                    <p className="font-bold text-lg">Week {game.week}{game.playoffRound ? ` (${game.playoffRound})` : ''}: {game.isHome ? 'vs' : '@'} {opponent.name}</p>
                                    {game.result ? (
                                        <p className={`text-lg ${game.result.myScore > game.result.opponentScore ? 'text-green-400' : 'text-red-400'}`}>
                                            {game.result.myScore > game.result.opponentScore ? 'W' : 'L'} {game.result.myScore} - {game.result.opponentScore}
                                        </p>
                                    ) : (
                                        <p className="text-sm text-tertiary">Upcoming Game (OVR: {opponent.ovr})</p>
                                    )}
                                </div>
                                <div className="flex gap-2">
                                    {canPlayGame && (
                                        <Button onClick={() => onScoutOpponent(opponent.id)} className="w-auto px-4 py-2 text-sm">Scout</Button>
                                    )}
                                     {canPlayGame && (
                                        <Button onClick={() => onSimGame(game)} className="w-auto px-4 py-2 text-sm">Sim Game</Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};


const PracticeScreen: React.FC<{ gameState: GameState, onPractice: (type: string) => void, onBack: () => void }> = ({ gameState, onPractice, onBack }) => {
    // FIX: Add guard clauses for MyCareer mode and missing player
    if (gameState.gameMode !== 'MY_CAREER') return <div>This is only for MyCareer.</div>;
    const myTeam = gameState.teams.find(t => t.id === gameState.myTeamId);
    if (!myTeam) return <div>Error: Team not found.</div>;
    const myPlayer = myTeam.roster.find(p => p.id === gameState.myPlayerId);
    if (!myPlayer) return <div>Error: Player not found.</div>;

    const sessions = gameState.practiceSessions;

    return (
        <div>
            <h2 className="text-2xl font-press-start text-primary mb-4 p-4">Weekly Practice</h2>
            <div className="p-4 text-center">
                <p className="text-lg mb-6">You have <span className="text-primary font-press-start">{sessions}</span> practice sessions remaining this week.</p>
                <div className="max-w-md mx-auto space-y-4">
                    <Button onClick={() => onPractice('drills')} disabled={sessions <= 0}>
                        <p className="text-lg">Run Drills</p>
                        <p className="text-xs normal-case italic mt-1">Gain 250 XP towards your next skill point.</p>
                    </Button>
                    <Button onClick={() => onPractice('film')} disabled={sessions <= 0}>
                         <p className="text-lg">Film Study</p>
                        <p className="text-xs normal-case italic mt-1">Increase your Consistency attribute by 1.</p>
                    </Button>
                     <Button onClick={onBack} className="mt-8 text-center">Back to Hub</Button>
                </div>
            </div>
        </div>
    );
};

const ScoutingReportModal: React.FC<{ report: ScoutingReport | null, onClose: () => void }> = ({ report, onClose }) => {
    if (!report) return null;
    return (
        <Modal title={`Scouting: ${report.teamName}`} onClose={onClose} size="2xl">
            <div className="space-y-4">
                <div className="text-center">
                    <p>OVR: <span className="text-primary">{report.ovr}</span> | Record: <span className="text-primary">{report.record.wins}-{report.record.losses}</span></p>
                </div>
                <div>
                    <h3 className="text-lg font-press-start text-primary mb-2">Key Strength</h3>
                    <p className="italic">"{report.tactic.strength}"</p>
                </div>
                 <div>
                    <h3 className="text-lg font-press-start text-primary mb-2">Key Weakness</h3>
                    <p className="italic">"{report.tactic.weakness}"</p>
                </div>
                 <div>
                    <h3 className="text-lg font-press-start text-primary mb-2">Coach's Suggestion</h3>
                    <p className="italic">"{report.tactic.suggestion}"</p>
                </div>
                 <div>
                    <h3 className="text-lg font-press-start text-primary mb-2">Players to Watch</h3>
                    <ul className="list-disc list-inside">
                        {report.bestPlayers.map(p => <li key={p.id}>{p.name} ({p.position}, {p.attributes.OVR} OVR)</li>)}
                    </ul>
                </div>
            </div>
        </Modal>
    );
};

const CoachScreen: React.FC<{ coach: GameState['coach'], onUpgrade: (skill: string) => void }> = ({ coach, onUpgrade }) => {
    return (
        <div>
            <h2 className="text-2xl font-press-start text-primary mb-4 p-4">Coach Hub</h2>
            <div className="p-4 bg-black/50 border border-primary mb-4">
                <p>Name: {coach.name}</p>
                <p>Archetype: {coach.archetype}</p>
                <p>Coaching Points: <span className="text-primary">{coach.points}</span></p>
            </div>
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.keys(coach.skillTree).map((key) => {
                    const skill = coach.skillTree[key as keyof CoachSkillTree];
                    const canUpgrade = coach.points >= skill.cost[skill.level] && skill.level < skill.maxLevel;
                    return (
                        <div key={key} className="p-4 border-2 border-primary bg-black/50">
                            <h3 className="text-xl font-press-start capitalize text-primary">{skill.name}</h3>
                            <p className="my-2 text-sm italic">{skill.description}</p>
                            <p>Level: {skill.level} / {skill.maxLevel}</p>
                            {skill.level < skill.maxLevel && <p>Upgrade Cost: <span className="text-primary">{skill.cost[skill.level]} CP</span></p>}
                            <Button onClick={() => onUpgrade(key)} disabled={!canUpgrade} className={`mt-4 ${canUpgrade ? 'bg-secondary border-secondary hover:bg-secondary/70' : ''}`}>
                                {skill.level >= skill.maxLevel ? 'Max Level' : 'Upgrade'}
                            </Button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const StandingsScreen: React.FC<{ teams: Team[], rankings: GameState['nationalRankings'] }> = ({ teams, rankings }) => (
    <div>
        <h2 className="text-2xl font-press-start text-primary mb-4 p-4">State Rankings</h2>
        <div className="p-4">
            <ol>
                {rankings.map(({ teamId, rank }) => {
                    const team = teams.find(t => t.id === teamId);
                    if (!team) return null;
                    return (
                        <li key={teamId} className="p-2 flex justify-between bg-black/50 mb-2 border-l-4 border-primary">
                            <span><span className="font-press-start">{rank}.</span> {team.name} ({team.class})</span>
                            <span>({team.record.wins}-{team.record.losses}) OVR: {team.ovr}</span>
                        </li>
                    )
                })}
            </ol>
        </div>
    </div>
);

const FacilitiesScreen: React.FC<{ facilities: GameState['facilities'], funds: number, onUpgrade: (facility: keyof GameState['facilities']) => void }> = ({ facilities, funds, onUpgrade }) => {
    const facilityInfo: Record<keyof GameState['facilities'], string> = {
        coaching: "Improves in-game performance and play calling.",
        training: "Boosts player progression during the offseason.",
        rehab: "Reduces injury duration and severity.",
        tutoring: "Helps players maintain academic eligibility."
    };

    return (
        <div>
            <h2 className="text-2xl font-press-start text-primary mb-4 p-4">Facilities</h2>
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                {(Object.keys(facilities) as Array<keyof typeof facilities>).map((type) => {
                    const facility = facilities[type];
                    const canUpgrade = funds >= facility.cost && facility.level < 5;
                    return (
                        <div key={type} className="p-4 border-2 border-primary bg-black/50">
                            <h3 className="text-xl font-press-start capitalize text-primary">{type}</h3>
                            <p className="my-2 text-sm italic">{facilityInfo[type]}</p>
                            <p>Level: {facility.level} / 5</p>
                            {facility.level < 5 && <p>Upgrade Cost: <span className="text-tertiary">${facility.cost.toLocaleString()}</span></p>}
                            <Button onClick={() => onUpgrade(type)} disabled={!canUpgrade} className={`mt-4 ${canUpgrade ? 'bg-secondary border-secondary hover:bg-secondary/70' : ''}`}>
                                {facility.level >= 5 ? 'Max Level' : 'Upgrade'}
                            </Button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const RecruitmentScreen: React.FC<{ recruits: Recruit[], points: number, onSign: (recruitId: string) => void, signedRecruits: Recruit[], onFinish: () => void }> = ({ recruits, points, onSign, signedRecruits, onFinish }) => {
    const signedIds = new Set(signedRecruits.map(r => r.id));
    return (
        <div>
            <div className="flex justify-between items-center p-4">
                <h2 className="text-2xl font-press-start text-primary">Recruiting Class</h2>
                <p>Points: <span className="text-primary">{points}</span></p>
            </div>
            <div className="p-4 space-y-2">
                {recruits.map(r => {
                    const isSigned = signedIds.has(r.id);
                    const stars = '⭐'.repeat(r.starRating);
                    return (
                        <div key={r.id} className={`p-3 bg-black/50 border border-gray-700 flex justify-between items-center ${isSigned ? 'opacity-50' : ''}`}>
                            <div>
                                <p className="font-bold">{r.name} ({r.position}, OVR: {r.attributes.OVR}) <span className="text-yellow-400">{stars}</span></p>
                                <p className="text-sm italic text-tertiary">"{r.blurb}"</p>
                                <p className="text-sm">Potential: {r.attributes.Potential} | Cost: <span className="text-primary">{r.cost} pts</span></p>
                            </div>
                            <Button onClick={() => onSign(r.id)} disabled={points < r.cost || isSigned} className="w-auto px-4 py-2 text-sm">
                                {isSigned ? 'Signed' : 'Sign'}
                            </Button>
                        </div>
                    );
                })}
            </div>
            <div className="p-4">
                <Button onClick={onFinish} className="bg-primary text-text-dark border-primary text-center">Advance to Next Season</Button>
            </div>
        </div>
    );
};

const NationalStatsScreen: React.FC<{ teams: Team[] }> = ({ teams }) => {
    const leaders = GameService.getNationalLeaders(teams);
    return (
        <div>
            <h2 className="text-2xl font-press-start text-primary mb-4 p-4">State Leaders</h2>
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(leaders).map(([stat, players]) => (
                    <div key={stat} className="p-4 border-2 border-primary bg-black/50">
                        <h3 className="text-xl font-press-start text-primary mb-2">{stat.replace(/([A-Z])/g, ' $1').trim()}</h3>
                        <ul className="space-y-1">
                            {players.map(({ player, teamName, value }, i) => (
                                <li key={player.id}>{i+1}. {player.name} ({teamName}) - <span className="font-bold">{value.toLocaleString()}</span></li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>
        </div>
    );
};

const StaffScreen: React.FC<{ myStaff: Staff[], staffMarket: Staff[], funds: number, onHire: (staff: Staff) => void, onFire: (staffId: string) => void }> = ({ myStaff, staffMarket, funds, onHire, onFire }) => (
    <div>
        <h2 className="text-2xl font-press-start text-primary mb-4 p-4">Coaching Staff</h2>
        <div className="p-4 grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
                <h3 className="text-xl font-press-start text-primary mb-2">My Staff</h3>
                <div className="space-y-2">
                    {myStaff.map(s => (
                        <div key={s.id} className="p-3 bg-black/50 border border-gray-700 flex justify-between items-center">
                            <div>
                                <p className="font-bold">{s.name} ({s.type})</p>
                                <p className="text-sm">Rating: {s.rating} | Salary: ${s.salary.toLocaleString()}</p>
                            </div>
                            <Button onClick={() => onFire(s.id)} className="w-auto px-4 py-2 text-sm bg-red-600 border-red-400 hover:bg-red-400">Fire</Button>
                        </div>
                    ))}
                </div>
            </div>
            <div>
                <h3 className="text-xl font-press-start text-primary mb-2">Staff Market</h3>
                 <div className="space-y-2">
                    {staffMarket.map(s => (
                        <div key={s.id} className="p-3 bg-black/50 border border-gray-700 flex justify-between items-center">
                            <div>
                                <p className="font-bold">{s.name} ({s.type})</p>
                                <p className="text-sm">Rating: {s.rating} | Salary: ${s.salary.toLocaleString()}</p>
                            </div>
                            <Button onClick={() => onHire(s)} disabled={funds < s.salary} className="w-auto px-4 py-2 text-sm bg-secondary border-secondary hover:bg-secondary/70">Hire</Button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    </div>
);

const SponsorsScreen: React.FC<{ activeSponsor: Sponsor | null, availableSponsors: Sponsor[], onSelect: (sponsor: Sponsor) => void }> = ({ activeSponsor, availableSponsors, onSelect }) => (
    <div>
        <h2 className="text-2xl font-press-start text-primary mb-4 p-4">Sponsors</h2>
        <div className="p-4 grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
                 <h3 className="text-xl font-press-start text-primary mb-2">Active Sponsor</h3>
                 {activeSponsor ? (
                     <div className="p-4 bg-green-900/30 border-2 border-green-500">
                        <p className="font-bold text-lg">{activeSponsor.name}</p>
                        <p>Type: {activeSponsor.type}</p>
                        <p>Signing Bonus: ${activeSponsor.signingBonus.toLocaleString()}</p>
                        <p>Payout per Win: ${activeSponsor.payoutPerWin.toLocaleString()}</p>
                        <p>Duration: {activeSponsor.duration} seasons</p>
                    </div>
                 ) : <p>No active sponsor.</p>}
            </div>
            <div>
                <h3 className="text-xl font-press-start text-primary mb-2">Available Deals</h3>
                <div className="space-y-2">
                    {availableSponsors.map(s => (
                        <div key={s.id} className="p-3 bg-black/50 border border-gray-700">
                            <p className="font-bold">{s.name} ({s.type})</p>
                            <p className="text-sm">Bonus: ${s.signingBonus.toLocaleString()} | Per Win: ${s.payoutPerWin.toLocaleString()}</p>
                            <Button onClick={() => onSelect(s)} disabled={!!activeSponsor} className="w-auto px-4 py-2 text-sm mt-2">Sign Deal</Button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    </div>
);

const InboxScreen: React.FC<{ messages: InboxMessage[], onRead: (id: string) => void, onAcceptOffer: (msg: InboxMessage) => void }> = ({ messages, onRead, onAcceptOffer }) => {
    const [selectedMsg, setSelectedMsg] = React.useState<InboxMessage | null>(null);
    const handleSelect = (msg: InboxMessage) => {
        setSelectedMsg(msg);
        onRead(msg.id);
    };
    return (
        <div>
            <h2 className="text-2xl font-press-start text-primary mb-4 p-4">Inbox</h2>
            <div className="p-4 space-y-2">
                {[...messages].sort((a,b) => b.season - a.season || b.week - a.week).map(msg => (
                    <div key={msg.id} onClick={() => handleSelect(msg)} className={`p-3 bg-black/50 border-l-4 ${msg.read ? 'border-gray-600' : 'border-primary'} cursor-pointer`}>
                        <p className="font-bold">From: {msg.from}</p>
                        <p className={`${msg.read ? 'text-gray-400' : ''}`}>Subject: {msg.subject}</p>
                    </div>
                ))}
            </div>
            {selectedMsg && (
                <Modal title={selectedMsg.subject} onClose={() => setSelectedMsg(null)}>
                    <p className="whitespace-pre-wrap">{selectedMsg.body}</p>
                    {selectedMsg.offerDetails && (
                        <div className="mt-4">
                            <Button onClick={() => onAcceptOffer(selectedMsg)}>Accept Offer</Button>
                        </div>
                    )}
                </Modal>
            )}
        </div>
    );
};

const TrophyCaseScreen: React.FC<{ trophies: Trophy[] }> = ({ trophies }) => (
    <div>
        <h2 className="text-2xl font-press-start text-primary mb-4 p-4">Trophy Case</h2>
        <div className="p-4 space-y-2">
            {trophies.length === 0 && <p>Your trophy case is empty. Go win some championships!</p>}
            {[...trophies].sort((a,b) => b.season - a.season).map((trophy, i) => (
                <div key={i} className="p-3 bg-black/50 border-l-4 border-primary">
                    <p className="font-bold">Season {trophy.season}: {trophy.award}</p>
                    {trophy.playerName && <p className="text-sm">Won by: {trophy.playerName}</p>}
                </div>
            ))}
        </div>
    </div>
);

const HallOfFameScreen: React.FC<{ hallOfFame: HallOfFameInductee[] }> = ({ hallOfFame }) => {
    const getInducteeName = (inductee: HallOfFameInductee) => {
        if (inductee.type === 'Team') {
            return (inductee.details as TeamHOFDetails).teamName;
        } else if (inductee.type === 'Player') {
            return (inductee.details as PlayerHOFDetails).name;
        } else {
            return (inductee.details as CoachHOFDetails).name;
        }
    }
    return (
    <div>
        <h2 className="text-2xl font-press-start text-primary mb-4 p-4">Hall of Fame</h2>
        <div className="p-4 space-y-2">
            {hallOfFame.length === 0 && <p>No inductees yet. Build a legacy to be remembered!</p>}
            {[...hallOfFame].sort((a, b) => b.yearInductcted - a.yearInductcted).map((inductee, i) => (
                <div key={i} className="p-3 bg-black/50 border-l-4 border-primary">
                    <p className="font-bold">Class of {inductee.yearInductcted}: {getInducteeName(inductee)} ({inductee.type})</p>
                </div>
            ))}
        </div>
    </div>
    )
};

const NewsScreen: React.FC<{ news: NewsArticle[] }> = ({ news }) => {
    const [selectedArticle, setSelectedArticle] = React.useState<NewsArticle | null>(null);
    return (
        <div>
             <h2 className="text-2xl font-press-start text-primary mb-4 p-4">State Sports News</h2>
             <div className="p-4 space-y-2">
                 {[...news].sort((a,b) => b.season - a.season || b.week - a.week).map(article => (
                    <div key={article.id} onClick={() => setSelectedArticle(article)} className="p-3 bg-black/50 border-l-4 border-primary cursor-pointer">
                        <p className="font-bold">{article.headline}</p>
                        <p className="text-sm text-gray-400">Season {article.season}, Week {article.week}</p>
                    </div>
                 ))}
             </div>
             {selectedArticle && (
                <Modal title={selectedArticle.headline} onClose={() => setSelectedArticle(null)}>
                    <p className="whitespace-pre-wrap">{selectedArticle.body}</p>
                </Modal>
             )}
        </div>
    );
};

const MyCareerOffersScreen: React.FC<{ offers: CollegeOffer[] }> = ({ offers }) => (
    <div>
        <h2 className="text-2xl font-press-start text-primary mb-4 p-4">College Offers</h2>
        <div className="p-4 space-y-2">
            {offers.length === 0 ? (
                <p>You haven't received any college offers yet. Keep working hard!</p>
            ) : (
                offers.map(offer => (
                    <div key={offer.collegeName} className="p-3 bg-black/50 border-l-4 border-primary">
                        <p className="font-bold text-lg">{offer.collegeName}</p>
                        <p className="text-sm">Division: {offer.division} | Prestige: {offer.prestige}</p>
                    </div>
                ))
            )}
        </div>
    </div>
);


const PlayoffHubScreen: React.FC<{ bracket: GameState['playoffBracket'], teams: Team[] }> = ({ bracket, teams }) => {
    if (!bracket) return <div>Loading playoffs...</div>;
    const findTeam = (id: number) => teams.find(t => t.id === id);

    return (
        <div>
             <h2 className="text-2xl font-press-start text-primary mb-4 p-4">State Playoffs</h2>
             <div className="p-4 grid grid-cols-1 lg:grid-cols-3 gap-8">
                {(Object.keys(bracket) as WVClass[]).map(wvClass => (
                    <div key={wvClass}>
                        <h3 className="text-xl font-press-start text-primary mb-2">Class {wvClass}</h3>
                        <div className="space-y-4">
                        {bracket[wvClass].map((matchup, i) => {
                            const team1 = findTeam(matchup.team1Id);
                            const team2 = findTeam(matchup.team2Id);
                            if (!team1 || !team2) return null;
                            return (
                                <div key={i} className="p-2 bg-black/50 border border-gray-700 text-center">
                                    <p>{team1.name} ({team1.record.wins}-{team1.record.losses})</p>
                                    <p className="font-press-start text-xs my-1">VS</p>
                                    <p>{team2.name} ({team2.record.wins}-{team2.record.losses})</p>
                                </div>
                            )
                        })}
                        {bracket[wvClass].length === 0 && <p>Championship decided!</p>}
                        </div>
                    </div>
                ))}
             </div>
        </div>
    );
};

const CareerOverScreen: React.FC<{ gameState: GameState, onMainMenu: () => void }> = ({ gameState, onMainMenu }) => {
    const myTeam = gameState.teams.find(t => t.id === gameState.myTeamId);
    // FIX: Add a defensive check to prevent crashing on the career over screen.
    if (!myTeam) return <div>Error: Could not load final career data.</div>;
    const myPlayer = myTeam.roster.find(p => p.id === gameState.myPlayerId);
    if (!myPlayer) return <div>Error: Player not found.</div>;
    
    return (
        <div className="max-w-xl mx-auto p-4 text-center">
            <h2 className="text-3xl font-press-start text-primary my-6">High School Career Over</h2>
            <p className="text-xl mb-4">Congratulations, {myPlayer.name}!</p>
            <div className="p-4 bg-black/50 border border-primary space-y-2 text-left">
                <h3 className="text-lg font-press-start text-primary mb-2">Final Stats</h3>
                {Object.entries(myPlayer.careerStats).map(([key, value]) => <p key={key}>{key}: {value}</p>)}
                <h3 className="text-lg font-press-start text-primary mt-4 mb-2">College Offers</h3>
                {gameState.collegeOffers.length > 0 ? (
                    gameState.collegeOffers.map(offer => <p key={offer.collegeName}>{offer.collegeName} ({offer.division})</p>)
                ) : <p>You did not receive any college offers.</p>}
            </div>
            <Button onClick={onMainMenu} className="mt-8 text-center">Main Menu</Button>
        </div>
    );
};

const DynastyOverScreen: React.FC<{ gameState: GameState, onMainMenu: () => void }> = ({ gameState, onMainMenu }) => {
    const { coach } = gameState;
    return (
        <div className="max-w-xl mx-auto p-4 text-center">
            <h2 className="text-3xl font-press-start text-primary my-6">Coaching Career Complete</h2>
            <p className="text-xl mb-4">Congratulations on a legendary 30-season career, Coach {coach.name}!</p>
            <div className="p-4 bg-black/50 border border-primary space-y-2 text-left">
                <h3 className="text-lg font-press-start text-primary mb-2">Career Summary</h3>
                <p>Total Wins: <span className="text-tertiary">{coach.totalWins}</span></p>
                <p>State Championships: <span className="text-tertiary">{coach.championships}</span></p>
                <p>Seasons Coached: <span className="text-tertiary">{coach.seasonsCoached}</span></p>
            </div>
            <Button onClick={onMainMenu} className="mt-8 text-center">Main Menu</Button>
        </div>
    );
};


const AwardCeremonyModal: React.FC<{ awards: SeasonAwards, champions: GameState['classChampions'], tocChampion: number | null, teams: Team[], hallOfFame: HallOfFameInductee[], onContinue: () => void, season: number }> = ({ awards, champions, tocChampion, teams, onContinue, hallOfFame, season }) => {
    const findTeam = (id: number | null) => id ? teams.find(t => t.id === id)?.name : 'N/A';
    const newInductees = hallOfFame.filter(ind => ind.yearInductcted === season);

    const getInducteeName = (inductee: HallOfFameInductee) => {
        // FIX: Use a more robust type-narrowing structure to prevent TypeScript errors.
        if (inductee.type === 'Team') {
            return (inductee.details as TeamHOFDetails).teamName;
        } else if (inductee.type === 'Player') {
            return (inductee.details as PlayerHOFDetails).name;
        } else if (inductee.type === 'Coach') {
            return (inductee.details as CoachHOFDetails).name;
        }
        return 'Unknown Inductee';
    }

    return (
        <Modal title="End of Season Awards" onClose={onContinue} size="3xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <h3 className="text-lg font-press-start text-primary mb-2">Champions</h3>
                    <p>Class A: {findTeam(champions.A)}</p>
                    <p>Class AA: {findTeam(champions.AA)}</p>
                    <p>Class AAA: {findTeam(champions.AAA)}</p>
                    <p>Tournament of Champions: {findTeam(tocChampion)}</p>
                </div>
                <div>
                    <h3 className="text-lg font-press-start text-primary mb-2">Player Awards</h3>
                    <p>MVP: {awards.mvp?.name || 'N/A'}</p>
                    <p>Best QB: {awards.bestQB?.name || 'N/A'}</p>
                    <p>Best RB: {awards.bestRB?.name || 'N/A'}</p>
                    <p>Best WR/TE: {awards.bestWR?.name || 'N/A'}</p>
                    <p>Best Defender: {awards.bestDefender?.name || 'N/A'}</p>
                    <p>Best OL: {awards.bestOL?.name || 'N/A'}</p>
                    <p>Best K/P: {awards.bestKP?.name || 'N/A'}</p>
                </div>
                {newInductees.length > 0 && (
                    <div className="md:col-span-2 mt-4">
                        <h3 className="text-lg font-press-start text-primary mb-2">Hall of Fame Inductees</h3>
                        {newInductees.map((inductee, i) => <p key={i}>Class of {season}: {getInducteeName(inductee)} ({inductee.type})</p>)}
                    </div>
                )}
            </div>
            <Button onClick={onContinue} className="mt-8 text-center">Continue to Offseason</Button>
        </Modal>
    );
};

// ... More screens will go here ...

// --- MAIN APP COMPONENT ---

const App = () => {
  const [gameState, setGameState] = React.useState<GameState | null>(null);
  const [screen, setScreen] = React.useState<Screen>('MAIN_MENU');
  const [loadingText, setLoadingText] = React.useState<string>('');
  const [godModeUnlocked, setGodModeUnlocked] = React.useState(false);
  const [hasSave, setHasSave] = React.useState(false);
  const [scoutingReport, setScoutingReport] = React.useState<ScoutingReport | null>(null);

  // Check for save file and god mode unlock on initial load
  React.useEffect(() => {
    const savedGame = localStorage.getItem('footballGameState');
    if (savedGame) setHasSave(true);
    const unlocked = localStorage.getItem('godModeUnlocked');
    if (unlocked === 'true') setGodModeUnlocked(true);
  }, []);

  const saveGame = (state: GameState) => {
    localStorage.setItem('footballGameState', JSON.stringify(state));
    setHasSave(true);
  };
  
  const handleNewGame = (mode: GameState['gameMode']) => {
    const newGameState = GameService.initializeGameWorld(godModeUnlocked);
    newGameState.gameMode = mode;
    if (mode === 'DYNASTY') {
        setGameState(newGameState);
        setScreen('TEAM_SELECTION');
    } else if (mode === 'MY_CAREER') {
        setGameState(newGameState);
        setScreen('MY_CAREER_CREATION');
    }
  };

  const handleLoadGame = () => {
    const savedGame = localStorage.getItem('footballGameState');
    if (savedGame) {
      const loadedState = JSON.parse(savedGame) as GameState;
      setGameState(loadedState);
      setScreen(loadedState.gameMode === 'DYNASTY' ? 'TEAM_PROFILE_HUB' : 'MY_CAREER_HUB');
    }
  };
  
  const handleUnlockGodMode = () => {
      localStorage.setItem('godModeUnlocked', 'true');
      setGodModeUnlocked(true);
  };

  const handleSelectTeam = (teamId: number) => {
    if (!gameState) return;
    const newState = { ...gameState, myTeamId: teamId };
    setGameState(newState);
    setScreen('TEAM_PROFILE_HUB');
  };
  
  const handleCreateMyCareer = (name: string, pos: Position, teamId: number) => {
      if(!gameState) return;
      const newState = GameService.initializeMyCareer(name, pos, teamId, godModeUnlocked, gameState.teams);
      setGameState(newState);
      setScreen('MY_CAREER_HUB');
  }

  const handleAdvanceWeek = async () => {
    if (!gameState || !gameState.myTeamId) return;

    setLoadingText('Advancing week...');
    let newState = JSON.parse(JSON.stringify(gameState)) as GameState;

    const myGameThisWeek = newState.schedule[newState.myTeamId]?.find(g => g.week === newState.week);
    if (myGameThisWeek && !myGameThisWeek.result && newState.week <= 15) {
        alert("You must play your game for the week before advancing.");
        setLoadingText('');
        return;
    }

    newState = await GameService.advanceWeek(newState);
    
    setGameState(newState);
    saveGame(newState);
    setLoadingText('');
    
    // Check for end of career after state update
    if (newState.week > 18) {
        if (newState.gameMode === 'DYNASTY' && newState.season > 30) {
            setScreen('DYNASTY_OVER');
        } else if (newState.gameMode === 'MY_CAREER') {
            const myPlayer = newState.teams.find(t => t.id === newState.myTeamId)?.roster.find(p => p.id === newState.myPlayerId);
            if (myPlayer?.year === 'SR') {
                const finalState = GameService.endMyCareer(newState);
                setGameState(finalState);
                setScreen('CAREER_OVER');
            }
        }
    }
};

  const handleSimGame = async (game: Game) => {
    if (!gameState) return;
    setLoadingText('Simulating game...');
    // FIX: Passed myTeamId as the first team ID, as required by simulateGame.
    const result = await GameService.simulateGame(gameState, gameState.myTeamId!, game.opponentId);
    // FIX: Used team1Score and team2Score from the result object, which correspond to myScore and opponentScore.
    let newState = GameService.applyGameResults(gameState, gameState.myTeamId!, game.opponentId, result.team1Score, result.team2Score, result.playerStats);
    
    setGameState(newState);
    setLoadingText('');
    
    // Auto-advance after playing the game
    await handleAdvanceWeek();
  };
  
  const handleScoutOpponent = async (opponentId: number) => {
      if (!gameState) return;
      setLoadingText("Scouting opponent...");
      const report = await GameService.generateDynamicScoutingReport(gameState, opponentId);
      setScoutingReport(report);
      setLoadingText("");
  };

  const handleUpgradeFacility = (facility: keyof GameState['facilities']) => {
    if (!gameState) return;
    const newState = GameService.upgradeFacility(gameState, facility);
    setGameState(newState);
  };
  
  const handleUpgradeAttribute = (attr: keyof Player['attributes']) => {
      if (!gameState) return;
      const newState = GameService.handleSpendSkillPoint(gameState, attr);
      setGameState(newState);
  };

  const handleEditPlayer = (player: Player, newAttrs: Player['attributes']) => {
    if (!gameState) return;
    const newState = GameService.editPlayerAttributes(gameState, player.id, newAttrs);
    setGameState(newState);
  };
  
  const handlePractice = (type: string) => {
      if (!gameState) return;
      const newState = GameService.handlePractice(gameState, type);
      setGameState(newState);
  }

  const handleToggleGodMode = (setting: keyof GodModeState) => {
    if (!gameState || !gameState.godMode) return;
    
    const toggledState: GameState = {
        ...gameState,
        godMode: {
            ...gameState.godMode,
            [setting]: !gameState.godMode[setting]
        }
    };
    
    // If the setting was just turned ON, apply immediate effects
    if (toggledState.godMode[setting]) {
        const finalState = GameService.applyImmediateGodModeEffects(toggledState, setting);
        setGameState(finalState);
    } else {
        setGameState(toggledState);
    }
  };

  const handleGodModeAction = (action: 'maxAllTeamOvr') => {
      if (!gameState || !gameState.godMode?.isEnabled) return;
      if (action === 'maxAllTeamOvr') {
          const newState = GameService.maxOutMyTeam(gameState);
          setGameState(newState);
      }
  };
  
  // --- RENDER LOGIC ---

  // State 1: No game loaded. Show the main menu.
  if (!gameState) {
    const content = screen === 'GOD_MODE'
        ? <GodModeUnlockScreen onUnlock={handleUnlockGodMode} onBack={() => setScreen('MAIN_MENU')} unlocked={godModeUnlocked} />
        : <MainMenu onNavigate={setScreen} onNewGame={handleNewGame} hasSave={hasSave} onLoadGame={handleLoadGame} godModeUnlocked={godModeUnlocked} />;
    
    return (
      <div className="container mx-auto">
        {content}
      </div>
    );
  }

  // State 2: Game started, but no team/player selected yet.
  if (gameState.myTeamId === null) {
    const renderPreTeamScreen = () => {
      switch (screen) {
        case 'TEAM_SELECTION': 
          return <TeamSelectionScreen teams={gameState.teams} onSelect={handleSelectTeam} />;
        case 'MY_CAREER_CREATION': 
          return <MyCareerCreationScreen teams={gameState.teams} onComplete={handleCreateMyCareer} />;
        default:
          // This is an invalid state. A game has started but no team is selected, and we're not on a selection screen.
          // Force the user back to the team selection screen to prevent errors.
          setScreen('TEAM_SELECTION');
          return <TeamSelectionScreen teams={gameState.teams} onSelect={handleSelectTeam} title="Please Select A Team" />;
      }
    };

    return (
       <div className="min-h-screen">
           {loadingText && <Loading text={loadingText} />}
           <main className="container mx-auto">
              <ScreenWrapper screenKey={screen}>
                {renderPreTeamScreen()}
              </ScreenWrapper>
           </main>
       </div>
    );
  }
  
  // State 3: Game and team are loaded. Render the full app UI.
  const myTeam = gameState.teams.find(t => t.id === gameState.myTeamId);

  // FIX: Add a safeguard for corrupted saves where the team ID is invalid.
  if (!myTeam) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center p-4">
          <h2 className="text-2xl font-press-start text-red-500">Critical Error</h2>
          <p className="my-4">Your selected team (ID: {gameState.myTeamId}) could not be found. Your save file may be corrupt.</p>
          <Button onClick={() => { localStorage.removeItem('footballGameState'); setGameState(null); setScreen('MAIN_MENU'); setHasSave(false); }}>Return to Main Menu</Button>
        </div>
      </div>
    );
  }
  
  const renderScreen = () => {
    switch (screen) {
      case 'GOD_MODE_SETTINGS': return <GodModeSettingsScreen settings={gameState.godMode!} onToggle={handleToggleGodMode} onAction={handleGodModeAction} onBack={() => setScreen(gameState.gameMode === 'DYNASTY' ? 'TEAM_PROFILE_HUB' : 'MY_CAREER_HUB')} gameMode={gameState.gameMode} />;
      case 'SCHEDULE': return <ScheduleScreen gameState={gameState} onScoutOpponent={handleScoutOpponent} onSimGame={handleSimGame} />;
      case 'ROSTER': return <RosterScreen gameState={gameState} onUpgradeAttribute={handleUpgradeAttribute} onEditPlayer={handleEditPlayer} />;
      case 'COACH_HUB': return <CoachScreen coach={gameState.coach} onUpgrade={(skill) => setGameState(prevState => ({...prevState!, coach: {...prevState!.coach, points: prevState!.coach.points-1}}))} />; // Dummy handler for now
      case 'STANDINGS': return <StandingsScreen teams={gameState.teams} rankings={gameState.nationalRankings} />;
      case 'FACILITIES': return <FacilitiesScreen facilities={gameState.facilities} funds={gameState.funds} onUpgrade={handleUpgradeFacility} />;
      case 'RECRUITMENT': return <RecruitmentScreen recruits={gameState.recruits} points={gameState.recruitingPoints} onSign={(id) => setGameState(GameService.signRecruit(gameState, id))} signedRecruits={gameState.signedRecruits} onFinish={() => setGameState(GameService.prepareNextSeason(gameState))} />;
      case 'NATIONAL_STATS': return <NationalStatsScreen teams={gameState.teams} />;
      case 'STAFF': return <StaffScreen myStaff={gameState.staff} staffMarket={gameState.staffMarket} funds={gameState.funds} onHire={(s) => {}} onFire={(id) => {}} />;
      case 'SPONSORS': return <SponsorsScreen activeSponsor={gameState.activeSponsor} availableSponsors={gameState.availableSponsors} onSelect={(s) => setGameState(GameService.applySponsor(gameState, s))} />;
      case 'INBOX': return <InboxScreen messages={gameState.inbox} onRead={(id) => { const msgs = gameState.inbox.map(m => m.id === id ? {...m, read: true} : m); setGameState({...gameState, inbox: msgs}); }} onAcceptOffer={(msg) => {if(msg.offerDetails) setGameState(GameService.acceptOffer(gameState, msg.offerDetails))}} />;
      case 'TROPHY_CASE': return <TrophyCaseScreen trophies={gameState.trophyCase} />;
      case 'HALL_OF_FAME': return <HallOfFameScreen hallOfFame={gameState.hallOfFame} />;
      case 'NEWS': return <NewsScreen news={gameState.news} />;
      case 'MY_CAREER_OFFERS': return <MyCareerOffersScreen offers={gameState.collegeOffers} />;
      case 'PRACTICE': return <PracticeScreen gameState={gameState} onPractice={handlePractice} onBack={() => setScreen('MY_CAREER_HUB')} />;
      case 'PLAYOFFS_HUB': return <PlayoffHubScreen bracket={gameState.playoffBracket} teams={gameState.teams} />;
      case 'CAREER_OVER': return <CareerOverScreen gameState={gameState} onMainMenu={() => { setGameState(null); setScreen('MAIN_MENU'); }} />;
      case 'DYNASTY_OVER': return <DynastyOverScreen gameState={gameState} onMainMenu={() => { setGameState(null); setScreen('MAIN_MENU'); }} />;
      // Default/Hub screens
      default:
        const myGameForWeek = gameState.schedule[gameState.myTeamId!]?.find(g => g.week === gameState.week);
        const canPlayGame = myGameForWeek && !myGameForWeek.result;
        const mainHubOptions = gameState.gameMode === 'DYNASTY' ? 
            [
                {label: 'Manage Roster', screen: 'ROSTER'},
                {label: 'Upgrade Facilities', screen: 'FACILITIES'},
                {label: 'View Coach Hub', screen: 'COACH_HUB'},
                {label: 'Manage Staff', screen: 'STAFF'},
                {label: 'View Sponsors', screen: 'SPONSORS'},
                {label: 'Check Inbox', screen: 'INBOX'},
            ] : 
            [
                {label: 'View Profile & Goals', screen: 'ROSTER'}, // Roster screen doubles as profile for MyCareer
                {label: 'Practice & Improve', screen: 'PRACTICE'},
                {label: 'Check Inbox', screen: 'INBOX'},
                {label: 'View College Offers', screen: 'MY_CAREER_OFFERS'},
            ];
        
        return (
          <div className="max-w-4xl mx-auto p-4 space-y-4">
              {myGameForWeek ? (
                  <div className="p-4 bg-black/50 border-2 border-primary">
                      <h2 className="text-xl font-press-start text-primary mb-2">This Week's Game</h2>
                      <div className="flex justify-between items-center">
                          <div>
                            <p>VS {gameState.teams.find(t => t.id === myGameForWeek.opponentId)?.name}</p>
                            {myGameForWeek.result && <p>Result: {myGameForWeek.result.myScore} - {myGameForWeek.result.opponentScore}</p>}
                          </div>
                          {canPlayGame && <Button className="w-auto px-4" onClick={() => handleSimGame(myGameForWeek)}>Sim Game</Button>}
                          {!canPlayGame && gameState.week <= 18 && <Button className="w-auto px-4" onClick={handleAdvanceWeek}>Advance</Button>}
                      </div>
                  </div>
              ) : (
                 <div className="p-4 bg-black/50 border-2 border-primary">
                    <h2 className="text-xl font-press-start text-primary mb-2">Offseason</h2>
                    <p>Your season is over. Continue to advance through the offseason stages.</p>
                    <Button className="w-auto px-4 mt-2" onClick={handleAdvanceWeek}>Advance</Button>
                 </div>
              )}

               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                {mainHubOptions.map(opt => <Button key={opt.screen} onClick={() => setScreen(opt.screen)}>{opt.label}</Button>)}
               </div>
          </div>
        );
    }
  }

  return (
    <div className="min-h-screen">
      {loadingText && <Loading text={loadingText} />}
      {scoutingReport && <ScoutingReportModal report={scoutingReport} onClose={() => setScoutingReport(null)} />}
      {gameState.week === 16 && gameState.isOffseason && (
        <AwardCeremonyModal
            awards={gameState.seasonAwards}
            champions={gameState.classChampions}
            tocChampion={gameState.tocChampion}
            teams={gameState.teams}
            hallOfFame={gameState.hallOfFame}
            season={gameState.season}
            onContinue={() => {
                const newState = {...gameState, week: 17};
                setGameState(newState);
                saveGame(newState);
            }}
        />
      )}
      <Header 
        teamName={myTeam.name} 
        funds={gameState.funds} 
        season={gameState.season} 
        week={gameState.week} 
        record={myTeam.record}
        gameMode={gameState.gameMode}
        onMainMenu={() => { saveGame(gameState); setGameState(null); setScreen('MAIN_MENU'); }}
      />
      <NavMenu onNavigate={setScreen} gameMode={gameState.gameMode} isGodMode={!!gameState.godMode?.isEnabled} week={gameState.week} />
      <main className="container mx-auto">
        <ScreenWrapper screenKey={screen}>
          {renderScreen()}
        </ScreenWrapper>
      </main>
    </div>
  );
};

export default App;