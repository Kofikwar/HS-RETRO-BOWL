
import * as React from 'react';
import { GameState, Screen, Team, Player, Game, Position, GameStrategy, Recruit, PlayerStats, OffensivePlaybook, DefensivePlaybook, SeasonAwards, Trophy, ActiveGameState, OffensivePlay, TrainingProgram, Staff, Sponsor, InboxMessage, GodModeState, HallOfFameInductee, CoachSkillTree, CoachSkill, WVClass, ScoutingReport, TrainingFocus, PlayerHOFDetails, CoachHOFDetails, TeamHOFDetails, NewsArticle, CollegeOffer, PlayoffMatchup, CustomPlaybook, DefensivePlay, CareerSummary, CustomOffensivePlay, CustomDefensivePlay, OffensiveFormation, PassConcept, RunDirection, DefensiveFormation, CoverageScheme, BlitzPackage, CollegeTrophy } from './types';
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
        if (gameMode === 'COLLEGE_CAREER') {
            if (week <= 12) return `Week ${week}`;
            if (week === 13) return 'Conf. Champ';
            if (week === 14) return 'Playoff SF';
            if (week === 15) return 'National Champ';
            return `Week ${week}`;
        }
        if (week <= 10) return `Week ${week}`;
        if (week === 11) return 'Playoffs QF';
        if (week === 12) return 'Playoffs SF';
        if (week === 13) return 'Playoffs Final';
        if (week === 14) return 'ToC Semifinal';
        if (week === 15) return 'ToC Final';
        if (week === 16) return 'Offseason: Awards';
        if (week === 17) return 'Offseason: Training';
        if (week === 18) return 'Offseason: Transfers/Recruiting';
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

const NavMenu: React.FC<{ onNavigate: (screen: Screen) => void, gameMode: GameState['gameMode'], isGodMode: boolean, week: number, unreadNews: boolean }> = ({ onNavigate, gameMode, isGodMode, week, unreadNews }) => {
    
    if (gameMode === 'COLLEGE_CAREER') {
        const collegeButtons = [
            { screen: 'COLLEGE_CAREER_HUB', icon: RosterIcon, label: 'My Hub', hasNotification: false },
            { screen: 'COLLEGE_SCHEDULE', icon: ScheduleIcon, label: 'Schedule', hasNotification: false },
            { screen: 'COLLEGE_STATS', icon: ChartIcon, label: 'Leaders', hasNotification: false },
            { screen: 'COLLEGE_AWARDS', icon: AwardIcon, label: 'Awards', hasNotification: false },
        ];
        return (
            <nav className="p-2 grid grid-cols-2 sm:grid-cols-4 gap-2">
                {collegeButtons.map(({ screen, icon: Icon, label, hasNotification }) => (
                    <button key={screen} onClick={() => onNavigate(screen)} className="relative flex flex-col items-center justify-center p-2 border-2 border-transparent bg-black/50 hover:border-primary hover:bg-secondary/50 transition-all duration-200">
                        <Icon className="w-8 h-8 mb-1 text-primary" />
                        <span className="font-press-start text-xs uppercase text-center">{label}</span>
                    </button>
                ))}
            </nav>
        );
    }
    
    const commonButtons = [
        { screen: 'SCHEDULE', icon: ScheduleIcon, label: 'Schedule', hasNotification: false },
        { screen: 'STANDINGS', icon: StandingsIcon, label: 'Standings', hasNotification: false },
        { screen: 'NEWS', icon: InboxIcon, label: 'News', hasNotification: unreadNews },
        { screen: 'NATIONAL_STATS', icon: ChartIcon, label: 'Leaders', hasNotification: false },
        { screen: 'AWARD_RACES', icon: AwardIcon, label: 'Award Races', hasNotification: false },
        { screen: 'TROPHY_CASE', icon: TrophyIcon, label: 'Trophy Case', hasNotification: false },
        { screen: 'HALL_OF_FAME', icon: HallOfFameIcon, label: 'Hall of Fame', hasNotification: false },
    ];
    
    if (week >= 11 && week <= 15) {
        commonButtons.splice(2, 0, { screen: 'PLAYOFFS_HUB', icon: TrophyIcon, label: 'Playoffs', hasNotification: false });
    }
    
    const hubButton = gameMode === 'DYNASTY' 
        ? { screen: 'TEAM_PROFILE_HUB', icon: CoachIcon, label: 'Team Hub', hasNotification: false}
        : { screen: 'MY_CAREER_HUB', icon: RosterIcon, label: 'MyCareer Hub', hasNotification: false };
        
    let buttons = [hubButton, ...commonButtons];
    if (isGodMode) {
        buttons.push({ screen: 'GOD_MODE_SETTINGS', icon: GodModeIcon, label: 'God Mode', hasNotification: false });
    }

    return (
        <nav className="p-2 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-9 gap-2">
            {buttons.map(({ screen, icon: Icon, label, hasNotification }) => (
                <button key={screen} onClick={() => onNavigate(screen)} className="relative flex flex-col items-center justify-center p-2 border-2 border-transparent bg-black/50 hover:border-primary hover:bg-secondary/50 transition-all duration-200">
                    <Icon className="w-8 h-8 mb-1 text-primary" />
                    <span className="font-press-start text-xs uppercase text-center">{label}</span>
                    {hasNotification && (
                         <span className="absolute top-1 right-1 bg-red-500 text-white text-xs font-bold rounded-full h-3 w-3 flex items-center justify-center"></span>
                    )}
                </button>
            ))}
        </nav>
    );
};

const Notification = ({ message, onClose }: { message: string, onClose: () => void }) => {
    React.useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 5000);
        return () => clearTimeout(timer);
    }, [message, onClose]);

    return (
        <div className="fixed top-5 right-5 bg-primary text-text-dark p-4 rounded-lg shadow-lg z-[101] font-press-start text-sm slide-in">
            <p>{message}</p>
            <button onClick={onClose} className="absolute top-1 right-2 text-lg leading-none">&times;</button>
        </div>
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

const GodModeSettingsScreen: React.FC<{ settings: GodModeState, onToggle: (setting: keyof GodModeState) => void, onBack: () => void, gameMode: GameState['gameMode'] }> = ({ settings, onToggle, onBack, gameMode }) => {
    const isMyCareer = gameMode === 'MY_CAREER';
    const toggles = Object.entries(settings).filter(([key]) => typeof settings[key as keyof GodModeState] === 'boolean' && key !== 'isEnabled');

    return (
        <div className="max-w-2xl mx-auto p-4">
            <h2 className="text-3xl font-press-start text-primary text-center my-6">God Mode Controls</h2>
            <div className="space-y-2">
                {toggles.map(([key, value]) => {
                    const myCareerOnly = ['canTransferAnytime', 'autoCrazyStats', 'autoStart', 'infiniteSkillPoints', 'makeMyPlayer99'].includes(key);
                    const dynastyOnly = ['makeMyTeam99'].includes(key);

                    if (myCareerOnly && !isMyCareer) return null;
                    if (dynastyOnly && isMyCareer) return null;

                     return (
                         <div key={key} className="flex items-center justify-between p-3 bg-secondary/20 border-l-4 border-primary">
                            <span className="capitalize font-bold">{key.replace(/([A-Z])/g, ' $1')}</span>
                            <button onClick={() => onToggle(key as keyof GodModeState)} className={`px-4 py-2 font-press-start text-xs ${value ? 'bg-secondary text-text-main' : 'bg-gray-600 text-gray-300'}`}>
                                {value ? 'ON' : 'OFF'}
                            </button>
                        </div>
                    );
                })}
            </div>
            <Button onClick={onBack} className="mt-8">Back</Button>
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

const MyCareerPlayerChoiceScreen: React.FC<{ onNavigate: (screen: Screen) => void }> = ({ onNavigate }) => (
    <div className="max-w-md mx-auto p-4 space-y-4 text-center">
        <h2 className="text-3xl font-press-start text-primary text-center my-6">Choose Your Path</h2>
        <Button onClick={() => onNavigate('MY_CAREER_CREATION')}>Create a New Player</Button>
        <Button onClick={() => onNavigate('MY_CAREER_EXISTING_PLAYER_SELECTION')}>Select an Existing Player</Button>
    </div>
);

const MyCareerExistingPlayerSelectionScreen: React.FC<{ gameState: GameState, onSelect: (playerId: string) => void }> = ({ gameState, onSelect }) => {
    const myTeam = gameState.teams.find(t => t.id === gameState.myTeamId);
    if (!myTeam) return <div>Team not found. Go back and select a team.</div>;

    const availablePlayers = myTeam.roster
        .filter(p => p.year === 'FR' || p.year === 'SO')
        .sort((a,b) => b.attributes.OVR - a.attributes.OVR);

    return (
        <div className="max-w-2xl mx-auto p-4">
            <h2 className="text-3xl font-press-start text-primary text-center my-6">Select Your Player</h2>
            <p className="text-center mb-4 italic">Only Freshmen and Sophomores can be selected to ensure a multi-year career.</p>
            {availablePlayers.length === 0 && <p className="text-center text-tertiary">No eligible Freshmen or Sophomores on this team.</p>}
            <div className="space-y-2">
                {availablePlayers.map(player => (
                    <Button key={player.id} onClick={() => onSelect(player.id)}>
                        <div className="flex justify-between">
                            <span>{player.name} ({player.position}, {player.year})</span>
                            <span className="text-tertiary">OVR: {player.attributes.OVR}</span>
                        </div>
                    </Button>
                ))}
            </div>
        </div>
    );
};

const MyCareerCreationScreen: React.FC<{ onComplete: (name: string, pos: Position) => void }> = ({ onComplete }) => {
    const [name, setName] = React.useState('');
    const [position, setPosition] = React.useState<Position>('QB');
    
    const positions: Position[] = ['QB', 'RB', 'WR', 'TE', 'OL', 'DL', 'LB', 'DB', 'K/P'];

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
            <Button onClick={() => onComplete(name, position)} disabled={!name}>Start Career</Button>
        </div>
    );
};

const ZERO_STATS: PlayerStats = { gamesPlayed: 0, passYds: 0, passTDs: 0, rushYds: 0, rushTDs: 0, recYds: 0, recTDs: 0, tackles: 0, sacks: 0, ints: 0 };

const StatBlock: React.FC<{ stats: PlayerStats, title: string }> = ({ stats, title }) => (
    <div>
        <h3 className="text-lg font-press-start text-primary mb-2">{title}</h3>
        {Object.entries(stats).map(([key, value]) => (
            <p key={key}>
                <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span> 
                <span className="float-right font-mono">{value}</span>
            </p>
        ))}
    </div>
);


const PlayerProfileModal: React.FC<{ player: Player, onUpgrade: (attr: keyof Player['attributes']) => void, onClose: () => void, isGodEditable: boolean, onEdit: (p: Player, newName: string, newAttrs: Player['attributes']) => void, onMovePlayerRosterStatus: (playerId: string) => void, committedCollege: CollegeOffer | null }> = ({ player, onUpgrade, onClose, isGodEditable, onEdit, onMovePlayerRosterStatus, committedCollege }) => {
    const [editableAttrs, setEditableAttrs] = React.useState(player.attributes);
    const [editableName, setEditableName] = React.useState(player.name);
    const [isEditing, setIsEditing] = React.useState(false);

    React.useEffect(() => {
        setEditableAttrs(player.attributes);
        setEditableName(player.name);
    }, [player.attributes, player.name]);


    const handleAttrChange = (attr: keyof Player['attributes'], value: string) => {
        const numValue = parseInt(value, 10);
        if (!isNaN(numValue) && numValue >= 40 && numValue <= 99) {
            setEditableAttrs(prev => {
                const newAttrs = { ...prev, [attr]: numValue };
                newAttrs.OVR = GameService.calculatePlayerOvr(newAttrs);
                return newAttrs;
            });
        }
    };
    
    const handleSave = () => {
        onEdit(player, editableName, editableAttrs);
        setIsEditing(false);
    }
    
    return (
        <Modal title={`${player.name} (${player.position})`} onClose={onClose}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <div className="flex justify-between items-start mb-4">
                       <div>
                            <p className="mb-2">Status: <span className="font-bold text-primary">{player.rosterStatus}</span></p>
                            {isEditing && (
                                <div className="mb-2">
                                   <input type="text" value={editableName} onChange={(e) => setEditableName(e.target.value)} className="w-full bg-gray-700 p-1 font-bold text-lg" />
                                </div>
                            )}
                       </div>
                       {!player.isPlayerCharacter && (
                            <Button onClick={() => onMovePlayerRosterStatus(player.id)} className="w-auto px-4 py-2 text-sm">
                               Move to {player.rosterStatus === 'VARSITY' ? 'JV' : 'Varsity'}
                            </Button>
                        )}
                    </div>
                    
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-press-start text-primary mb-2">Attributes</h3>
                        {isGodEditable && !isEditing && <button onClick={() => setIsEditing(true)} className="text-xs font-press-start text-primary">[EDIT]</button>}
                        {isEditing && <button onClick={handleSave} className="text-xs font-press-start text-secondary">[SAVE]</button>}
                    </div>
                    
                    {player.isPlayerCharacter && <p className="mb-2">Skill Points: <span className="text-primary font-bold">{player.skillPoints}</span></p>}
                    {player.isPlayerCharacter && committedCollege && <p className="mb-2 text-secondary">Committed to: {committedCollege.collegeName}</p>}
                    {player.isPlayerCharacter && typeof player.xp === 'number' && (
                         <div className="mb-2">
                             <p>XP: {player.xp} / {player.xpToNextLevel}</p>
                             <div className="w-full bg-gray-700 h-2 mt-1">
                                <div className="bg-primary h-2" style={{ width: `${(player.xp / player.xpToNextLevel!) * 100}%` }}></div>
                             </div>
                         </div>
                    )}
                    {Object.entries(isEditing ? editableAttrs : player.attributes).map(([key, value]) => (
                        <div key={key} className="flex justify-between items-center">
                            <span>{key}:</span>
                            {isEditing && key !== 'OVR' ? (
                                <input type="number" value={editableAttrs[key as keyof typeof editableAttrs]} onChange={(e) => handleAttrChange(key as keyof Player['attributes'], e.target.value)} className="w-16 bg-gray-700 text-right p-1" />
                            ) : (
                                <span className={key === 'OVR' ? 'text-primary font-bold' : ''}>{value}</span>
                            )}
                            {player.isPlayerCharacter && player.skillPoints! > 0 && key !== 'OVR' && !isEditing && (
                                <button onClick={() => onUpgrade(key as keyof Player['attributes'])} className="px-2 py-1 text-xs bg-secondary border-secondary font-press-start hover:bg-secondary/70">+</button>
                            )}
                        </div>
                    ))}
                </div>
                <div className="space-y-6">
                    <StatBlock stats={player.seasonStats} title="Varsity Stats" />
                    <StatBlock stats={player.jvSeasonStats || ZERO_STATS} title="JV Stats" />
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


const RosterScreen: React.FC<{ gameState: GameState, onUpgradeAttribute: (attr: keyof Player['attributes']) => void, onEditPlayer: (p: Player, newName: string, newAttrs: Player['attributes']) => void, onMovePlayer: (playerId: string) => void }> = ({ gameState, onUpgradeAttribute, onEditPlayer, onMovePlayer }) => {
    const [selectedPlayer, setSelectedPlayer] = React.useState<Player | null>(null);
    const myTeam = gameState.teams.find(t => t.id === gameState.myTeamId);
    const isGodEditable = gameState.godMode?.isEnabled && gameState.godMode.canEditPlayers;

    React.useEffect(() => {
        if (selectedPlayer && gameState.myTeamId) {
            const currentTeam = gameState.teams.find(t => t.id === gameState.myTeamId);
            const updatedPlayer = currentTeam?.roster.find(p => p.id === selectedPlayer.id);
            if (updatedPlayer && updatedPlayer.rosterStatus === 'VARSITY') {
                setSelectedPlayer(updatedPlayer);
            } else {
                setSelectedPlayer(null); // Player moved to JV or no longer on roster, close modal
            }
        }
    }, [gameState, selectedPlayer?.id]);
    
    if (!myTeam) return <div>Error: Team not found.</div>;

    const varsityRoster = myTeam.roster.filter(p => p.rosterStatus === 'VARSITY');

    return (
        <div>
            <h2 className="text-2xl font-press-start text-primary mb-4 p-4">Varsity Roster</h2>
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
                        {varsityRoster.sort((a,b) => a.stringer - b.stringer).map(p => (
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
            {selectedPlayer && <PlayerProfileModal player={selectedPlayer} onClose={() => setSelectedPlayer(null)} onUpgrade={onUpgradeAttribute} isGodEditable={isGodEditable} onEdit={onEditPlayer} onMovePlayerRosterStatus={onMovePlayer} committedCollege={gameState.committedCollege} />}
        </div>
    );
};

const ScheduleScreen: React.FC<{ gameState: GameState, onScoutOpponent: (opponentId: number) => void, onSimGame: () => void, onPlayGame: (game: Game) => void, onSimToOffseason: () => void, myPlayer?: Player | null }> = ({ gameState, onScoutOpponent, onSimGame, onPlayGame, onSimToOffseason, myPlayer }) => {
    const myTeamId = gameState.myTeamId;
    if (myTeamId === null) return <div>Error: No team selected.</div>;

    const isJVPlayer = gameState.gameMode === 'MY_CAREER' && myPlayer?.rosterStatus === 'JV';
    const scheduleSource = isJVPlayer ? gameState.jvSchedule : gameState.schedule;
    const scheduleTitle = isJVPlayer ? "My JV Schedule" : "Team Schedule";

    const mySchedule = scheduleSource[myTeamId];
    if (!mySchedule) return <div>Error: Schedule not found for your team.</div>;

    const isOffseason = gameState.week > 15;

    return (
        <div>
            <div className="flex justify-between items-center p-4">
                <h2 className="text-2xl font-press-start text-primary">{scheduleTitle}</h2>
                <div className="flex gap-2">
                    {!isOffseason && <Button onClick={onSimGame} className="w-auto px-4 py-2 text-sm">Sim Next Week</Button>}
                    {gameState.isEliminated && <Button onClick={onSimToOffseason} className="w-auto px-4 py-2 text-sm">Sim to Offseason</Button>}
                </div>
            </div>
            <div className="p-4 space-y-2">
                {mySchedule.map(game => {
                    const opponent = gameState.teams.find(t => t.id === game.opponentId);
                    if (!opponent) return null;

                    const isCurrentWeek = game.week === gameState.week;
                    const canTakeAction = isCurrentWeek && !game.result && !isOffseason;
                    const canScout = !game.result;

                    return (
                        <div key={`${game.week}-${game.opponentId}`} className={`p-3 bg-black/50 border-l-4 ${isCurrentWeek ? 'border-primary' : 'border-gray-700'}`}>
                            <div className="flex justify-between items-center flex-wrap gap-2">
                                <div>
                                    <p className="font-bold text-lg">Week {game.week}{game.playoffRound ? ` (${game.playoffRound})` : ''}: {game.isHome ? 'vs' : '@'} {opponent.name}</p>
                                    {game.isRivalryGame && <p className="text-sm font-press-start text-red-400">RIVALRY GAME</p>}
                                    {game.result ? (
                                        <p className={`text-lg ${game.result.myScore > game.result.opponentScore ? 'text-green-400' : 'text-red-400'}`}>
                                            {game.result.myScore > game.result.opponentScore ? 'W' : 'L'} {game.result.myScore} - {game.result.opponentScore}
                                        </p>
                                    ) : (
                                        <p className="text-sm text-tertiary">Upcoming Game (OVR: {opponent.ovr})</p>
                                    )}
                                </div>
                                <div className="flex gap-2">
                                    {canScout && <Button onClick={() => onScoutOpponent(opponent.id)} className="w-auto px-3 py-1 text-xs">Scout</Button>}
                                    {canTakeAction && <Button onClick={() => onPlayGame(game)} className="w-auto px-3 py-1 text-xs bg-secondary/50 border-secondary">Play</Button>}
                                    {canTakeAction && <Button onClick={onSimGame} className="w-auto px-3 py-1 text-xs">Sim</Button>}
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
        training: "Boosts player progression and adds offseason training slots.",
        rehab: "Reduces injury duration and severity.",
        tutoring: "Reduces chance of players becoming academically ineligible."
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
    const statDisplayNames: Record<string, string> = {
        passYds: 'Passing Yards', passTDs: 'Passing TDs',
        rushYds: 'Rushing Yards', rushTDs: 'Rushing TDs',
        recYds: 'Receiving Yards', recTDs: 'Receiving TDs',
        tackles: 'Tackles', sacks: 'Sacks', ints: 'Interceptions',
    };

    return (
        <div>
            <h2 className="text-2xl font-press-start text-primary mb-4 p-4">State Leaders (Varsity)</h2>
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(leaders).map(([stat, players]) => (
                    <div key={stat} className="p-4 border-2 border-primary bg-black/50">
                        <h3 className="text-xl font-press-start text-primary mb-2">{statDisplayNames[stat] || stat}</h3>
                        <ul className="space-y-1">
                            {players.map(({ player, teamName, value }, i) => (
                                <li key={player.id}>{i+1}. {player.name} ({player.position}, {teamName}) - <span className="text-primary font-bold">{value.toLocaleString()}</span></li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>
        </div>
    );
};

const JVHubScreen: React.FC<{ onNavigate: (s: Screen) => void; }> = ({ onNavigate }) => (
    <div className="p-4">
        <h2 className="text-2xl font-press-start text-primary mb-4">JV Team Hub</h2>
        <div className="space-y-4 max-w-md mx-auto">
            <Button onClick={() => onNavigate('JV_ROSTER')}>JV Roster</Button>
            <Button onClick={() => onNavigate('JV_SCHEDULE')}>JV Schedule</Button>
            <Button onClick={() => onNavigate('JV_STATS')}>JV Stat Leaders</Button>
            <Button onClick={() => onNavigate('JV_AWARDS')}>JV Season Awards</Button>
        </div>
    </div>
);

const JVRosterScreen: React.FC<{ gameState: GameState, onMovePlayer: (playerId: string) => void, onUpgradeAttribute: (attr: keyof Player['attributes']) => void, onEditPlayer: (p: Player, newName: string, newAttrs: Player['attributes']) => void }> = ({ gameState, onMovePlayer, onUpgradeAttribute, onEditPlayer }) => {
    const [selectedPlayer, setSelectedPlayer] = React.useState<Player | null>(null);
    const myTeam = gameState.teams.find(t => t.id === gameState.myTeamId);

    React.useEffect(() => {
        if (selectedPlayer && gameState.myTeamId) {
            const currentTeam = gameState.teams.find(t => t.id === gameState.myTeamId);
            const updatedPlayer = currentTeam?.roster.find(p => p.id === selectedPlayer.id);
            if (updatedPlayer && updatedPlayer.rosterStatus === 'JV') {
                setSelectedPlayer(updatedPlayer);
            } else {
                setSelectedPlayer(null); // Player moved to Varsity or no longer exists, close modal
            }
        }
    }, [gameState, selectedPlayer?.id]);
    
    if (!myTeam) return <div>Error: Team not found.</div>;

    const jvRoster = myTeam.roster.filter(p => p.rosterStatus === 'JV');

    return (
        <div>
            <h2 className="text-2xl font-press-start text-primary mb-4 p-4">Junior Varsity Roster</h2>
            <div className="overflow-x-auto p-4">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-black/50 border-b-2 border-primary">
                             {['Name', 'Pos', 'Yr', 'OVR', 'Status'].map(h => 
                                <th key={h} className="p-2 uppercase font-press-start text-xs">{h}</th>
                            )}
                        </tr>
                    </thead>
                    <tbody>
                        {jvRoster.sort((a,b) => b.attributes.OVR - a.attributes.OVR).map(p => (
                            <tr key={p.id} onClick={() => setSelectedPlayer(p)} className={`border-b border-gray-700 hover:bg-secondary/30 cursor-pointer ${p.id === gameState.myPlayerId ? 'bg-primary/20' : ''}`}>
                                <td className="p-2">{p.name} {p.isPlayerCharacter && '(You)'}</td>
                                <td className="p-2">{p.position}</td>
                                <td className="p-2">{p.year}</td>
                                <td className="p-2 text-primary font-bold">{p.attributes.OVR}</td>
                                <td className="p-2">{p.isSuspended > 0 ? <span className="text-red-500">SUSP ({p.isSuspended})</span> : p.isInjured > 0 ? <span className="text-yellow-500">INJ ({p.isInjured})</span> : <span className="text-green-500">OK</span>}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {selectedPlayer && <PlayerProfileModal player={selectedPlayer} onClose={() => setSelectedPlayer(null)} onUpgrade={onUpgradeAttribute} isGodEditable={false} onEdit={onEditPlayer} onMovePlayerRosterStatus={onMovePlayer} committedCollege={gameState.committedCollege} />}
        </div>
    );
};

const JVScheduleScreen: React.FC<{ gameState: GameState }> = ({ gameState }) => {
    const myTeamId = gameState.myTeamId;
    if (myTeamId === null) return <div>Error: No team selected.</div>;

    const mySchedule = gameState.jvSchedule[myTeamId];
    if (!mySchedule) return <div>Error: JV Schedule not found for your team.</div>;

    return (
        <div>
            <h2 className="text-2xl font-press-start text-primary mb-4 p-4">JV Schedule</h2>
            <div className="p-4 space-y-2">
                {mySchedule.slice(0, 8).map(game => { // JV plays 8 games
                    const opponent = gameState.teams.find(t => t.id === game.opponentId);
                    if (!opponent) return null;

                    const isCurrentWeek = game.week === gameState.week;

                     return (
                        <div key={`${game.week}-${game.opponentId}`} className={`p-3 bg-black/50 border-l-4 ${isCurrentWeek ? 'border-primary' : 'border-gray-700'}`}>
                           <p className="font-bold text-lg">Week {game.week}: {game.isHome ? 'vs' : '@'} {opponent.name} (JV)</p>
                           {game.result ? (
                                <p className={`text-lg ${game.result.myScore > game.result.opponentScore ? 'text-green-400' : 'text-red-400'}`}>
                                    {game.result.myScore > game.result.opponentScore ? 'W' : 'L'} {game.result.myScore} - {game.result.opponentScore}
                                </p>
                            ) : (
                                <p className="text-sm text-tertiary">Upcoming Game</p>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const JVStatsScreen: React.FC<{ teams: Team[] }> = ({ teams }) => {
    const leaders = GameService.getJVNationalLeaders(teams);
    const statDisplayNames: Record<string, string> = {
        passYds: 'Passing Yards', passTDs: 'Passing TDs',
        rushYds: 'Rushing Yards', rushTDs: 'Rushing TDs',
        recYds: 'Receiving Yards', recTDs: 'Receiving TDs',
        tackles: 'Tackles', sacks: 'Sacks', ints: 'Interceptions',
    };

    return (
        <div>
            <h2 className="text-2xl font-press-start text-primary mb-4 p-4">State Leaders (JV)</h2>
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(leaders).map(([stat, players]) => (
                    <div key={stat} className="p-4 border-2 border-primary bg-black/50">
                        <h3 className="text-xl font-press-start text-primary mb-2">{statDisplayNames[stat] || stat}</h3>
                        <ul className="space-y-1">
                            {players.map(({ player, teamName, value }, i) => (
                                <li key={player.id}>{i+1}. {player.name} ({player.position}, {teamName}) - <span className="text-primary font-bold">{value.toLocaleString()}</span></li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>
        </div>
    );
};

const JVAwardsScreen: React.FC<{ awards: SeasonAwards }> = ({ awards }) => (
    <div>
        <h2 className="text-2xl font-press-start text-primary mb-4 p-4">JV Season Awards</h2>
        <div className="p-4">
            <AwardsModalContent awards={awards} season={0} />
        </div>
    </div>
);

const TacticsScreen: React.FC<{ gameState: GameState, onSet: (offense: string, defense: string) => void }> = ({ gameState, onSet }) => {
    const { myStrategy, customPlaybooks } = gameState;
    const [offense, setOffense] = React.useState(myStrategy.offense);
    const [defense, setDefense] = React.useState(myStrategy.defense);
    
    const offensivePlaybooks: OffensivePlaybook[] = ['Balanced', 'Spread', 'Pro-Style', 'Run Heavy', 'Air Raid'];
    const defensivePlaybooks: DefensivePlaybook[] = ['4-3 Defense', '3-4 Defense', 'Nickel', 'Aggressive'];

    const customOffensive = customPlaybooks.filter(p => p.type === 'Offense');
    const customDefensive = customPlaybooks.filter(p => p.type === 'Defense');

    return (
        <div>
            <h2 className="text-2xl font-press-start text-primary mb-4 p-4">Strategy & Tactics</h2>
            <div className="p-4 max-w-md mx-auto space-y-6">
                <div>
                    <label className="block text-xl font-press-start text-primary mb-2">Offensive Playbook</label>
                    <select value={offense} onChange={e => setOffense(e.target.value)} className="w-full bg-gray-800 border-2 border-primary p-2 font-mono">
                        <optgroup label="Standard Playbooks">
                            {offensivePlaybooks.map(p => <option key={p} value={p}>{p}</option>)}
                        </optgroup>
                        {customOffensive.length > 0 && <optgroup label="Custom Playbooks">
                            {customOffensive.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                        </optgroup>}
                    </select>
                </div>
                <div>
                    <label className="block text-xl font-press-start text-primary mb-2">Defensive Playbook</label>
                    <select value={defense} onChange={e => setDefense(e.target.value)} className="w-full bg-gray-800 border-2 border-primary p-2 font-mono">
                         <optgroup label="Standard Playbooks">
                            {defensivePlaybooks.map(p => <option key={p} value={p}>{p}</option>)}
                        </optgroup>
                        {customDefensive.length > 0 && <optgroup label="Custom Playbooks">
                            {customDefensive.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                        </optgroup>}
                    </select>
                </div>
                <Button onClick={() => onSet(offense, defense)} className="text-center">Set Strategy</Button>
            </div>
        </div>
    );
};

const StaffScreen: React.FC<{ staff: Staff[], market: Staff[], funds: number, onHire: (id: string) => void, onFire: (id: string) => void }> = ({ staff, market, funds, onHire, onFire }) => (
    <div>
        <h2 className="text-2xl font-press-start text-primary mb-4 p-4">Coaching Staff</h2>
        <div className="p-4">
            <h3 className="text-xl font-press-start text-tertiary mb-2">Your Staff</h3>
            {staff.length === 0 && <p>You have no staff.</p>}
            <div className="space-y-2 mb-6">
                {staff.map(s => (
                    <div key={s.id} className="p-3 bg-black/50 border border-gray-700 flex justify-between items-center">
                        <div>
                            <p className="font-bold">{s.name} ({s.type})</p>
                            <p>Rating: <span className="text-primary">{s.rating}</span> | Salary: ${s.salary.toLocaleString()}</p>
                        </div>
                        <Button onClick={() => onFire(s.id)} className="w-auto px-4 py-2 text-sm bg-red-800/50 border-red-500 hover:bg-red-500">Fire</Button>
                    </div>
                ))}
            </div>
            <h3 className="text-xl font-press-start text-tertiary mb-2">Staff Market</h3>
            <div className="space-y-2">
                {market.map(s => (
                     <div key={s.id} className="p-3 bg-black/50 border border-gray-700 flex justify-between items-center">
                        <div>
                            <p className="font-bold">{s.name} ({s.type})</p>
                            <p>Rating: <span className="text-primary">{s.rating}</span> | Salary: ${s.salary.toLocaleString()}</p>
                        </div>
                        <Button onClick={() => onHire(s.id)} disabled={funds < s.salary} className="w-auto px-4 py-2 text-sm">Hire</Button>
                    </div>
                ))}
            </div>
        </div>
    </div>
);

const SponsorsScreen: React.FC<{ active: Sponsor | null, available: Sponsor[], onSelect: (id: string) => void }> = ({ active, available, onSelect }) => (
    <div>
        <h2 className="text-2xl font-press-start text-primary mb-4 p-4">Sponsors</h2>
        <div className="p-4">
            <h3 className="text-xl font-press-start text-tertiary mb-2">Active Sponsor</h3>
            {active ? (
                 <div className="p-3 bg-secondary/30 border-l-4 border-secondary">
                    <p className="font-bold text-lg">{active.name} ({active.type})</p>
                    <p>Bonus: <span className="text-tertiary">${active.signingBonus.toLocaleString()}</span> | Per Win: <span className="text-tertiary">${active.payoutPerWin.toLocaleString()}</span></p>
                </div>
            ) : <p>No active sponsor.</p>}
            <h3 className="text-xl font-press-start text-tertiary mt-6 mb-2">Available Sponsors</h3>
            <div className="space-y-2">
                {available.map(s => (
                    <div key={s.id} className="p-3 bg-black/50 border border-gray-700 flex justify-between items-center">
                        <div>
                            <p className="font-bold">{s.name} ({s.type})</p>
                            <p>Bonus: <span className="text-tertiary">${s.signingBonus.toLocaleString()}</span> | Per Win: <span className="text-tertiary">${s.payoutPerWin.toLocaleString()}</span></p>
                        </div>
                        <Button onClick={() => onSelect(s.id)} disabled={!!active} className="w-auto px-4 py-2 text-sm">Sign</Button>
                    </div>
                ))}
            </div>
        </div>
    </div>
);

const InboxScreen: React.FC<{ messages: InboxMessage[] }> = ({ messages }) => (
     <div>
        <h2 className="text-2xl font-press-start text-primary mb-4 p-4">Inbox</h2>
        <div className="p-4 space-y-3">
            {messages.length === 0 && <p>Your inbox is empty.</p>}
            {[...messages].sort((a,b) => (b.season * 100 + b.week) - (a.season * 100 + a.week)).map(msg => (
                <div key={msg.id} className="p-4 bg-black/50 border-l-4 border-primary">
                    <p className="font-bold text-tertiary">{msg.subject}</p>
                    <p className="text-sm text-gray-400">From: {msg.from} | Week {msg.week}, Season {msg.season}</p>
                    <p className="mt-2">{msg.body}</p>
                </div>
            ))}
        </div>
    </div>
);

const NewsScreen: React.FC<{ articles: NewsArticle[] }> = ({ articles }) => (
     <div>
        <h2 className="text-2xl font-press-start text-primary mb-4 p-4">State Sports News</h2>
        <div className="p-4 space-y-3">
            {articles.length === 0 && <p>No news yet.</p>}
            {[...articles].sort((a,b) => (b.season * 100 + b.week) - (a.season * 100 + a.week)).map(article => (
                <div key={article.id} className="p-4 bg-black/50 border-l-4 border-primary">
                    <p className="font-bold text-tertiary text-lg">{article.headline}</p>
                    <p className="text-sm text-gray-400">Week {article.week}, Season {article.season}</p>
                    <p className="mt-2">{article.body}</p>
                </div>
            ))}
        </div>
    </div>
);

const AwardRacesScreen: React.FC<{ teams: Team[] }> = ({ teams }) => {
    const races = GameService.calculateAwardRaces(teams);
    return (
         <div>
            <h2 className="text-2xl font-press-start text-primary mb-4 p-4">Award Races</h2>
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(races).map(([raceName, candidates]) => (
                    <div key={raceName} className="p-4 bg-black/50 border-2 border-primary">
                        <h3 className="text-xl font-press-start text-primary mb-2">{raceName}</h3>
                        <ul className="space-y-1">
                            {candidates.map(({ player, teamName }, i) => (
                                <li key={player.id}>{i+1}. {player.name} ({player.position}, {teamName}) - <span className="text-tertiary">{player.attributes.OVR} OVR</span></li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>
        </div>
    );
};

const TrophyCaseScreen: React.FC<{ trophies: Trophy[] }> = ({ trophies }) => (
    <div>
        <h2 className="text-2xl font-press-start text-primary mb-4 p-4">Trophy Case</h2>
        <div className="p-4">
            {trophies.length === 0 && <p>Your trophy case is empty. Go win something!</p>}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...trophies].sort((a, b) => b.season - a.season).map((trophy, i) => (
                <div key={i} className="p-4 bg-black/50 border-2 border-secondary text-center">
                    <TrophyIcon className="w-16 h-16 mx-auto text-primary mb-2" />
                    <p className="font-bold">{trophy.award}</p>
                    <p className="text-sm text-tertiary">Season {trophy.season}</p>
                    {trophy.playerName && <p className="text-xs">{trophy.playerName}</p>}
                </div>
            ))}
            </div>
        </div>
    </div>
);

const HallOfFameScreen: React.FC<{ inductees: HallOfFameInductee[] }> = ({ inductees }) => (
    <div>
        <h2 className="text-2xl font-press-start text-primary mb-4 p-4">Hall of Fame</h2>
        <div className="p-4 space-y-4">
            {inductees.length === 0 && <p>No inductees yet.</p>}
            {inductees.map((inductee, i) => (
                <div key={i} className="p-3 bg-black/50 border-l-4 border-primary">
                    <p className="font-bold text-lg">{inductee.details.name || (inductee.details as TeamHOFDetails).teamName} <span className="text-sm text-tertiary">({inductee.type}, Class of {inductee.yearInducted})</span></p>
                    {inductee.type === 'Player' && <p>{(inductee.details as PlayerHOFDetails).position}</p>}
                </div>
            ))}
        </div>
    </div>
);

const PlayoffsHubScreen: React.FC<{ gameState: GameState }> = ({ gameState }) => {
    const { playoffBracket, teams } = gameState;

    if (!playoffBracket) {
        return (
             <div>
                <h2 className="text-2xl font-press-start text-primary mb-4 p-4">Playoffs</h2>
                <p className="p-4">The playoff bracket has not been set yet.</p>
            </div>
        );
    }
    
    const getTeamName = (id: number) => teams.find(t => t.id === id)?.name || 'Unknown Team';

    const Matchup: React.FC<{ matchup: PlayoffMatchup }> = ({ matchup }) => {
        const game = matchup.game?.result;
        const winnerId = matchup.winnerId;

        const team1 = teams.find(t => t.id === matchup.team1Id);
        const team2 = teams.find(t => t.id === matchup.team2Id);
        if (!team1 || !team2) return null;

        const team1Score = game ? (game.opponentId === team2.id ? game.myScore : game.opponentScore) : null;
        const team2Score = game ? (game.opponentId === team1.id ? game.myScore : game.opponentScore) : null;

        return (
            <div className="p-2 bg-black/50">
                <p>
                    <span className={winnerId === matchup.team1Id ? 'font-bold text-primary' : ''}>{team1.name}</span>
                    {team1Score !== null && ` ${team1Score}`}
                    {' - '}
                    {team2Score !== null && `${team2Score} `}
                    <span className={winnerId === matchup.team2Id ? 'font-bold text-primary' : ''}>{team2.name}</span>
                </p>
            </div>
        );
    }
    

    return (
         <div>
            <h2 className="text-2xl font-press-start text-primary mb-4 p-4">Playoff Bracket</h2>
            <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-6">
                {(['AAA', 'AA', 'A'] as WVClass[]).map(c => (
                    <div key={c}>
                        <h3 className="text-xl font-press-start text-tertiary mb-2 border-b-2 border-primary">Class {c}</h3>
                        <div className="space-y-4">
                           <div>
                                <h4 className="font-press-start text-secondary">Quarterfinals</h4>
                                <div className="space-y-1 mt-1">
                                    {playoffBracket[c].quarterfinals.map((matchup, i) => <Matchup key={i} matchup={matchup} />)}
                                </div>
                           </div>
                           {playoffBracket[c].semifinals.length > 0 && <div>
                                <h4 className="font-press-start text-secondary">Semifinals</h4>
                                <div className="space-y-1 mt-1">
                                     {playoffBracket[c].semifinals.map((matchup, i) => <Matchup key={i} matchup={matchup} />)}
                                </div>
                           </div>}
                           {playoffBracket[c].final && <div>
                                <h4 className="font-press-start text-secondary">Championship</h4>
                                 <div className="space-y-1 mt-1">
                                    <Matchup matchup={playoffBracket[c].final!} />
                                </div>
                           </div>}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const TrainingCampScreen: React.FC<{ gameState: GameState, onTrain: (assignments: { playerId: string, focus: TrainingFocus }[]) => void, onAdvance: () => void }> = ({ gameState, onTrain, onAdvance }) => {
    const myTeam = gameState.teams.find(t => t.id === gameState.myTeamId);
    if (!myTeam) return null;

    const trainingSlots = 3 + gameState.facilities.training.level;
    const [assignments, setAssignments] = React.useState<Record<string, TrainingFocus>>({});
    
    const focuses: TrainingFocus[] = ['Physical', 'Passing Offense', 'Rushing Offense', 'Pass Defense', 'Rush Defense', 'Special Teams'];

    const handleSetFocus = (playerId: string, focus: TrainingFocus) => {
        if (Object.keys(assignments).length >= trainingSlots && !assignments[playerId]) {
            return; // Max slots used
        }
        setAssignments(prev => ({ ...prev, [playerId]: focus }));
    };

    const handleConfirm = () => {
        const assignmentList = Object.entries(assignments).map(([playerId, focus]) => ({ playerId, focus }));
        onTrain(assignmentList);
    };

    return (
         <div>
            <h2 className="text-2xl font-press-start text-primary mb-4 p-4">Offseason Training</h2>
            <p className="p-4">You have <span className="text-primary">{trainingSlots - Object.keys(assignments).length}</span> training slots remaining. Assign a focus to your players to improve their attributes.</p>
            <div className="p-4 overflow-x-auto">
                 <table className="w-full text-left">
                    <thead>
                        <tr className="bg-black/50 border-b-2 border-primary">
                            {['Name', 'Pos', 'Yr', 'OVR', 'Focus'].map(h => <th key={h} className="p-2 uppercase font-press-start text-xs">{h}</th>)}
                        </tr>
                    </thead>
                    <tbody>
                        {myTeam.roster.filter(p => p.year !== 'SR').map(p => (
                            <tr key={p.id} className="border-b border-gray-700">
                                <td className="p-2">{p.name}</td>
                                <td className="p-2">{p.position}</td>
                                <td className="p-2">{p.year}</td>
                                <td className="p-2 text-primary">{p.attributes.OVR}</td>
                                <td className="p-2">
                                    <select value={assignments[p.id] || ''} onChange={e => handleSetFocus(p.id, e.target.value as TrainingFocus)} className="bg-gray-800 border border-primary p-1 w-full">
                                        <option value="" disabled>Select Focus</option>
                                        {focuses.map(f => <option key={f} value={f}>{f}</option>)}
                                    </select>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="p-4 flex gap-4">
                <Button onClick={handleConfirm} className="text-center">Confirm Training</Button>
            </div>
        </div>
    );
};

const Top5SelectionModal: React.FC<{ onConfirm: (top5: CollegeOffer[]) => void, onClose: () => void }> = ({ onConfirm, onClose }) => {
    const [selected, setSelected] = React.useState<Set<string>>(new Set());
    const interestedSchools = React.useMemo(() => GameService.ALL_COLLEGES.map(c => ({ ...c, id: c.collegeName })), []);

    const handleSelect = (college: CollegeOffer) => {
        const newSelected = new Set(selected);
        if (newSelected.has(college.id)) {
            newSelected.delete(college.id);
        } else {
            if (newSelected.size < 5) {
                newSelected.add(college.id);
            }
        }
        setSelected(newSelected);
    };

    const handleConfirm = () => {
        const top5 = interestedSchools.filter(c => selected.has(c.id));
        onConfirm(top5);
        onClose();
    };

    return (
        <Modal title="Select Your Top 5 Schools" onClose={onClose} size="3xl">
            <p className="mb-4">Choose the 5 schools you are most interested in. This will increase your chances of receiving offers from them.</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {interestedSchools.map(college => (
                    <button 
                        key={college.id}
                        onClick={() => handleSelect(college)}
                        className={`p-3 text-left border-2 ${selected.has(college.id) ? 'bg-primary text-text-dark border-primary' : 'bg-secondary/20 border-secondary'}`}
                    >
                        <p className="font-bold">{college.collegeName}</p>
                        <p className="text-xs">{college.tier} - Prestige: {college.prestige}</p>
                    </button>
                ))}
            </div>
            <Button onClick={handleConfirm} disabled={selected.size !== 5} className="text-center mt-6">
                Confirm Top 5 ({selected.size}/5)
            </Button>
        </Modal>
    );
};

const CommitmentHubScreen: React.FC<{ gameState: GameState, onCommit: (offer: CollegeOffer) => void, onSelectTop5: (top5: CollegeOffer[]) => void }> = ({ gameState, onCommit, onSelectTop5 }) => {
    const [showTop5Modal, setShowTop5Modal] = React.useState(false);
    const { committedCollege, commitmentPhase, top5Colleges, collegeOffers } = gameState;

    const myPlayer = gameState.teams.find(t => t.id === gameState.myTeamId)?.roster.find(p => p.id === gameState.myPlayerId);

    return (
        <div>
            <h2 className="text-2xl font-press-start text-primary mb-4 p-4">Commitment Hub</h2>
            {showTop5Modal && <Top5SelectionModal onConfirm={onSelectTop5} onClose={() => setShowTop5Modal(false)} />}
            
            <div className="p-4">
                {commitmentPhase === 'COMMITTED' && committedCollege && (
                    <div className="text-center p-6 bg-secondary/30 border-2 border-primary">
                        <p className="text-lg">You have committed to</p>
                        <p className="text-3xl font-press-start text-primary my-2">{committedCollege.collegeName}</p>
                        <p className="text-tertiary">{committedCollege.tier}</p>
                    </div>
                )}
                
                {commitmentPhase === 'TOP_5_PENDING' && (
                     <div className="text-center p-6 bg-secondary/30 border-2 border-primary">
                        <p className="text-lg mb-4">It's your junior year! Time to select the top 5 schools you're interested in to kickstart your recruitment.</p>
                        <Button onClick={() => setShowTop5Modal(true)} className="text-center w-auto px-6 py-3">Select Top 5</Button>
                    </div>
                )}

                {commitmentPhase !== 'COMMITTED' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-1">
                            <h3 className="text-xl font-press-start text-tertiary mb-2">Top 5</h3>
                            {top5Colleges && top5Colleges.length > 0 ? (
                                <ul className="space-y-2">
                                    {top5Colleges.map(c => (
                                        <li key={c.id} className="p-3 bg-black/50 border-l-4 border-secondary">{c.collegeName}</li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="italic text-gray-400">You have not selected a Top 5 yet.</p>
                            )}
                        </div>
                        <div className="md:col-span-2">
                             <h3 className="text-xl font-press-start text-tertiary mb-2">Official Offers</h3>
                             <div className="space-y-3">
                                {collegeOffers.length === 0 && <p>You have not received any college offers yet. Keep working!</p>}
                                {collegeOffers.map((offer) => (
                                    <div key={offer.id} className="p-4 bg-black/50 border-l-4 border-primary flex justify-between items-center">
                                        <div>
                                            <p className="font-bold text-lg">{offer.collegeName}</p>
                                            <p className="text-tertiary">{offer.tier} - Prestige: {offer.prestige}</p>
                                        </div>
                                        <Button 
                                            onClick={() => onCommit(offer)} 
                                            className="w-auto px-4 py-2"
                                            disabled={!!committedCollege || myPlayer?.year !== 'SR'}
                                        >
                                           Commit
                                        </Button>
                                    </div>
                                ))}
                                {myPlayer?.year !== 'SR' && <p className="text-sm italic text-gray-400 mt-2">You can commit during your Senior year.</p>}
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};


const TeamStatsScreen: React.FC<{ team: Team | undefined }> = ({ team }) => {
    if (!team) return <div>No team data.</div>;
    // FIX: Changed to call the newly exported getTeamStats function.
    const stats = GameService.getTeamStats(team);
    return (
        <div>
            <h2 className="text-2xl font-press-start text-primary mb-4 p-4">{team.name} Team Stats</h2>
             <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(stats).map(([stat, value]) => (
                    <div key={stat} className="p-4 border-2 border-primary bg-black/50 text-center">
                        <h3 className="text-xl font-press-start text-primary mb-2">{stat}</h3>
                        <p className="text-2xl font-bold">{value.toLocaleString()}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

const AwardsModalContent: React.FC<{ awards: SeasonAwards, season: number }> = ({ awards, season }) => {
    const awardOrder: (keyof Omit<SeasonAwards, 'coachOfTheYear'>)[] = ['mvp', 'bestQB', 'bestRB', 'bestWR', 'bestDefender', 'bestOL', 'bestKP'];
    const awardTitles: Record<keyof SeasonAwards, string> = {
        mvp: 'Most Valuable Player',
        bestQB: 'Best Quarterback',
        bestRB: 'Best Running Back',
        bestWR: 'Best WR/TE',
        bestDefender: 'Best Defender',
        bestOL: 'Best Offensive Lineman',
        bestKP: 'Best Kicker/Punter',
        coachOfTheYear: 'Coach of the Year'
    };
    return (
        <div className="space-y-4">
            {awardOrder.map(key => {
                const player = awards[key];
                return (
                    <div key={key}>
                        <h3 className="text-xl font-press-start text-primary">{awardTitles[key]}</h3>
                        {player ? (
                            <p>{player.name} ({player.position}) - {player.attributes.OVR} OVR</p>
                        ) : (
                            <p>No winner selected.</p>
                        )}
                    </div>
                )
            })}
             <div>
                <h3 className="text-xl font-press-start text-primary">{awardTitles.coachOfTheYear}</h3>
                {awards.coachOfTheYear ? (
                    <p>{awards.coachOfTheYear.name} ({awards.coachOfTheYear.teamName})</p>
                ) : (
                    <p>No winner selected.</p>
                )}
            </div>
        </div>
    )
}

const PlaceholderScreen: React.FC<{ title: string }> = ({ title }) => (
    <div>
        <h2 className="text-2xl font-press-start text-primary mb-4 p-4">{title}</h2>
        <p className="p-4">This screen is not yet implemented.</p>
    </div>
);

const TeamProfileHub: React.FC<{ onNavigate: (s: Screen) => void; onAdvance: () => void; gameState: GameState; unreadMessages: number; onSimToOffseason: () => void; onPlayGame: (game: Game) => void; }> = ({ onNavigate, onAdvance, gameState, unreadMessages, onSimToOffseason, onPlayGame }) => {
    const { week, isEliminated, myTeamId } = gameState;
    const isOffseason = week > 15;

    const dynastyButtons = [
        { screen: 'ROSTER', icon: RosterIcon, label: 'Varsity' },
        { screen: 'JV_HUB', icon: RosterIcon, label: 'JV Team' },
        { screen: 'TACTICS', icon: TacticsIcon, label: 'Strategy' },
        { screen: 'PLAYBOOK_EDITOR', icon: TacticsIcon, label: 'Playbooks' },
        { screen: 'FACILITIES', icon: FacilitiesIcon, label: 'Facilities' },
        { screen: 'STAFF', icon: CoachIcon, label: 'Staff' },
        { screen: 'SPONSORS', icon: SponsorIcon, label: 'Sponsors' },
        { screen: 'INBOX', icon: InboxIcon, label: 'Inbox' },
        { screen: 'COACH_HUB', icon: CoachIcon, label: 'Coach Skills' },
        { screen: 'TEAM_STATS', icon: ChartIcon, label: 'Team Stats' },
    ];
    
    let advanceText = `Sim Next Week`;

    const myTeam = gameState.teams.find(t => t.id === myTeamId);
    const currentGame = myTeamId ? gameState.schedule[myTeamId]?.find(g => g.week === week) : null;
    const canPlay = !isOffseason && !isEliminated && currentGame && !currentGame.result;

    return (
        <div className="p-4">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-press-start text-primary">Team Hub</h2>
                {myTeam && <p>Chemistry: <span className="text-primary">{myTeam.chemistry}%</span></p>}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                {dynastyButtons.map(b => (
                    <Button key={b.screen} onClick={() => onNavigate(b.screen)} className="relative flex flex-col items-center justify-center text-center !h-24">
                        <b.icon className="w-8 h-8 mb-1" />
                        <span>{b.label}</span>
                        {b.screen === 'INBOX' && unreadMessages > 0 && (
                            <span className="absolute top-1 right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                                {unreadMessages}
                            </span>
                        )}
                    </Button>
                ))}
            </div>
            {canPlay && (
                <div className="grid grid-cols-2 gap-2">
                    <Button onClick={() => onPlayGame(currentGame)} className="text-center bg-secondary text-text-main border-secondary hover:bg-secondary/70">Play Game</Button>
                    <Button onClick={onAdvance} className="text-center bg-primary text-text-dark border-primary hover:bg-secondary">{advanceText}</Button>
                </div>
            )}
            {!isOffseason && isEliminated && <Button onClick={onSimToOffseason} className="w-full text-center bg-secondary text-text-dark border-secondary hover:bg-secondary/70">Sim to Offseason</Button>}
            {isOffseason && (
                <div className="grid grid-cols-3 gap-2">
                    <Button onClick={() => onNavigate('TRAINING_CAMP')} className="text-center">Training</Button>
                    <Button onClick={() => onNavigate('TRANSFER_PORTAL')} className="text-center">Transfers</Button>
                    <Button onClick={() => onNavigate('RECRUITMENT')} className="text-center">Recruiting</Button>
                </div>
            )}
        </div>
    )
};

const MyCareerHub: React.FC<{ onNavigate: (s: Screen) => void; onAdvance: () => void; gameState: GameState; unreadMessages: number; onSimToOffseason: () => void; onPlayGame: (game: Game) => void; }> = ({ onNavigate, onAdvance, gameState, unreadMessages, onSimToOffseason, onPlayGame }) => {
    const { week, isEliminated, godMode, myTeamId } = gameState;
    const isOffseason = week > 15;

    const careerButtons = [
        { screen: 'ROSTER', icon: RosterIcon, label: 'My Player' },
        { screen: 'PRACTICE', icon: FootballIcon, label: 'Practice' },
        { screen: 'JV_HUB', icon: RosterIcon, label: 'JV Team' },
        { screen: 'INBOX', icon: InboxIcon, label: 'Inbox' },
        { screen: 'COMMITMENT_HUB', icon: AwardIcon, label: 'Commitment' }
    ];

    if (godMode?.canTransferAnytime) {
        careerButtons.push({ screen: 'TRANSFER_SELECTION', icon: RecruitIcon, label: 'Transfer Now'});
    }
    
    const myTeam = gameState.teams.find(t => t.id === myTeamId);
    const myPlayer = myTeam?.roster.find(p => p.id === gameState.myPlayerId);
    const isJVPlayer = myPlayer?.rosterStatus === 'JV';

    const scheduleSource = myTeamId ? (isJVPlayer ? gameState.jvSchedule[myTeamId] : gameState.schedule[myTeamId]) : null;
    const currentGame = scheduleSource?.find(g => g.week === week);
    const canPlay = !isOffseason && !isEliminated && currentGame && !currentGame.result;


    return (
        <div className="p-4">
            <h2 className="text-2xl font-press-start text-primary mb-4">MyCareer Hub</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
                {careerButtons.map(b => (
                     <Button key={b.screen} onClick={() => onNavigate(b.screen)} className="relative flex flex-col items-center justify-center text-center !h-24">
                        <b.icon className="w-8 h-8 mb-1" />
                        <span>{b.label}</span>
                         {b.screen === 'INBOX' && unreadMessages > 0 && (
                            <span className="absolute top-1 right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                                {unreadMessages}
                            </span>
                        )}
                    </Button>
                ))}
            </div>
             {canPlay && (
                <div className="grid grid-cols-2 gap-2">
                    <Button onClick={() => onPlayGame(currentGame)} className="text-center bg-secondary text-text-main border-secondary hover:bg-secondary/70">Play Game</Button>
                    <Button onClick={onAdvance} className="text-center bg-primary text-text-dark border-primary hover:bg-secondary">Sim Next Week</Button>
                </div>
            )}
             {!isOffseason && isEliminated && <Button onClick={onSimToOffseason} className="w-full text-center bg-secondary text-text-dark border-secondary hover:bg-secondary/70">Sim to Offseason</Button>}
        </div>
    );
};

const CollegeCareerHub: React.FC<{ onNavigate: (s: Screen) => void, onAdvance: () => void, gameState: GameState }> = ({ onNavigate, onAdvance, gameState }) => {
    const collegeState = gameState.collegeGameState;
    if (!collegeState) return null;
    
    const hubButtons = [
        { screen: 'DORM_ROOM', icon: RosterIcon, label: 'Dorm Room' },
        { screen: 'COLLEGE_HALL_OF_CHAMPIONS', icon: TrophyIcon, label: 'Hall of Champions' },
    ];
    
    return (
        <div className="p-4">
            <h2 className="text-2xl font-press-start text-primary mb-4">College Hub</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {hubButtons.map(b => (
                    <Button key={b.screen} onClick={() => onNavigate(b.screen)} className="relative flex flex-col items-center justify-center text-center !h-24">
                        <b.icon className="w-8 h-8 mb-1" />
                        <span>{b.label}</span>
                    </Button>
                ))}
            </div>
            <Button onClick={onAdvance} className="text-center bg-primary text-text-dark border-primary hover:bg-secondary">Sim Next Week</Button>
        </div>
    );
};

const DormRoomScreen: React.FC<{ trophies: CollegeTrophy[] }> = ({ trophies }) => {
    const personalTrophies = trophies.filter(t => t.category !== 'Team' && t.category !== 'Rivalry');
    return (
        <div>
            <h2 className="text-2xl font-press-start text-primary mb-4 p-4">My Dorm Room</h2>
            <div className="p-4">
                <h3 className="text-xl font-press-start text-tertiary mb-2">Personal Trophy Case</h3>
                {personalTrophies.length === 0 && <p>No personal awards yet. Hit the field!</p>}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {personalTrophies.map((trophy, i) => (
                        <div key={i} className="p-4 bg-black/50 border-2 border-secondary text-center">
                            <AwardIcon className="w-16 h-16 mx-auto text-primary mb-2" />
                            <p className="font-bold">{trophy.award}</p>
                            <p className="text-sm text-tertiary">Season {trophy.season}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const CollegeHallOfChampionsScreen: React.FC<{ trophies: CollegeTrophy[] }> = ({ trophies }) => {
    const teamTrophies = trophies.filter(t => t.category === 'Team' || t.category === 'Rivalry');
    return (
        <div>
            <h2 className="text-2xl font-press-start text-primary mb-4 p-4">Hall of Champions</h2>
            <div className="p-4">
                <h3 className="text-xl font-press-start text-tertiary mb-2">Team Trophies & Rivalries</h3>
                {teamTrophies.length === 0 && <p>The team trophy case is empty.</p>}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {teamTrophies.map((trophy, i) => (
                        <div key={i} className="p-4 bg-black/50 border-2 border-secondary text-center">
                            <TrophyIcon className="w-16 h-16 mx-auto text-primary mb-2" />
                            <p className="font-bold">{trophy.award}</p>
                            <p className="text-sm text-tertiary">Season {trophy.season}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const PlaybookEditorScreen: React.FC<{ playbooks: CustomPlaybook[], onSave: (playbook: CustomPlaybook) => void, onDelete: (playbookId: string) => void }> = ({ playbooks, onSave, onDelete }) => {
    const [selectedPlaybook, setSelectedPlaybook] = React.useState<CustomPlaybook | null>(null);
    const [editingPlay, setEditingPlay] = React.useState<CustomOffensivePlay | CustomDefensivePlay | null>(null);

    const handleSavePlay = (play: CustomOffensivePlay | CustomDefensivePlay) => {
        if (!selectedPlaybook) return;
        const newPlays = [...selectedPlaybook.plays];
        const index = newPlays.findIndex(p => p.id === play.id);
        if (index > -1) {
            newPlays[index] = play;
        } else {
            newPlays.push(play);
        }
        onSave({ ...selectedPlaybook, plays: newPlays });
        setSelectedPlaybook({ ...selectedPlaybook, plays: newPlays });
        setEditingPlay(null);
    };
    
    const handleDeletePlay = (playId: string) => {
        if (!selectedPlaybook) return;
        const newPlays = selectedPlaybook.plays.filter(p => p.id !== playId);
        onSave({ ...selectedPlaybook, plays: newPlays });
        setSelectedPlaybook({ ...selectedPlaybook, plays: newPlays });
    }

    const startNewPlay = () => {
        if (!selectedPlaybook) return;
        if (selectedPlaybook.type === 'Offense') {
            setEditingPlay({ id: crypto.randomUUID(), name: 'New Run', type: 'Run', formation: 'I-Form', direction: 'Inside Right' });
        } else {
            setEditingPlay({ id: crypto.randomUUID(), name: 'New Zone', formation: '4-3', coverage: 'Cover 2 Zone', blitz: 'None' });
        }
    };
    
    return (
        <div>
            <h2 className="text-2xl font-press-start text-primary mb-4 p-4">Playbook Editor</h2>
            <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1 space-y-2">
                    <h3 className="text-xl font-press-start text-tertiary">My Playbooks</h3>
                    {playbooks.map(p => ( <Button key={p.id} onClick={() => setSelectedPlaybook(p)}>{p.name}</Button> ))}
                    <Button onClick={() => { const name = prompt("New playbook name:"); if(name) onSave({id: crypto.randomUUID(), name, type: 'Offense', plays:[]}); }} className="text-center">+ Offense</Button>
                    <Button onClick={() => { const name = prompt("New playbook name:"); if(name) onSave({id: crypto.randomUUID(), name, type: 'Defense', plays:[]}); }} className="text-center">+ Defense</Button>
                </div>
                <div className="md:col-span-2">
                {selectedPlaybook && (
                    <div className="p-4 bg-black/50 border border-primary">
                        <h3 className="text-xl font-press-start text-primary mb-4">{selectedPlaybook.name}</h3>
                        <div className="space-y-2">
                           {selectedPlaybook.plays.map(play => (
                               <div key={play.id} className="flex justify-between items-center p-2 bg-secondary/20">
                                   <span>{play.name}</span>
                                   <div>
                                       <button onClick={() => setEditingPlay(play)} className="text-xs font-press-start text-primary mr-2">[EDIT]</button>
                                       <button onClick={() => handleDeletePlay(play.id)} className="text-xs font-press-start text-red-500">[DEL]</button>
                                   </div>
                               </div>
                           ))}
                        </div>
                        <Button onClick={startNewPlay} className="text-center mt-4">+ Add New Play</Button>
                    </div>
                )}
                </div>
            </div>
            {editingPlay && selectedPlaybook && (
                 <Modal title="Edit Play" onClose={() => setEditingPlay(null)} size="2xl">
                     <PlayEditor play={editingPlay} type={selectedPlaybook.type} onSave={handleSavePlay} onCancel={() => setEditingPlay(null)} />
                 </Modal>
            )}
        </div>
    );
};

const PlayEditor: React.FC<{ play: CustomOffensivePlay | CustomDefensivePlay, type: 'Offense' | 'Defense', onSave: (p: any) => void, onCancel: () => void }> = ({ play, type, onSave, onCancel }) => {
    const [editedPlay, setEditedPlay] = React.useState(play);

    const handleFieldChange = (field: string, value: any) => {
        setEditedPlay(p => ({ ...p, [field]: value }));
    };

    if (type === 'Offense') {
        const p = editedPlay as CustomOffensivePlay;
        return (
            <div className="space-y-4">
                <input value={p.name} onChange={e => handleFieldChange('name', e.target.value)} className="w-full bg-gray-800 p-2" />
                <select value={p.formation} onChange={e => handleFieldChange('formation', e.target.value)} className="w-full bg-gray-800 p-2">
                    {(['Shotgun', 'I-Form', 'Singleback', 'Pistol'] as OffensiveFormation[]).map(f => <option key={f} value={f}>{f}</option>)}
                </select>
                <select value={p.type} onChange={e => handleFieldChange('type', e.target.value)} className="w-full bg-gray-800 p-2">
                    <option value="Run">Run</option><option value="Pass">Pass</option>
                </select>
                {p.type === 'Run' && <select value={p.direction} onChange={e => handleFieldChange('direction', e.target.value)} className="w-full bg-gray-800 p-2">
                    {(['Inside Left', 'Inside Right', 'Outside Left', 'Outside Right'] as RunDirection[]).map(d => <option key={d} value={d}>{d}</option>)}
                </select>}
                {p.type === 'Pass' && <select value={p.concept} onChange={e => handleFieldChange('concept', e.target.value)} className="w-full bg-gray-800 p-2">
                    {(['Four Verticals', 'Shallow Cross', 'Mesh', 'Screen', 'Play Action Deep'] as PassConcept[]).map(c => <option key={c} value={c}>{c}</option>)}
                </select>}
                <Button onClick={() => onSave(editedPlay)} className="text-center">Save Play</Button>
            </div>
        );
    } else {
        const p = editedPlay as CustomDefensivePlay;
         return (
            <div className="space-y-4">
                <input value={p.name} onChange={e => handleFieldChange('name', e.target.value)} className="w-full bg-gray-800 p-2" />
                 <select value={p.formation} onChange={e => handleFieldChange('formation', e.target.value)} className="w-full bg-gray-800 p-2">
                    {(['4-3', '3-4', 'Nickel', 'Dime'] as DefensiveFormation[]).map(f => <option key={f} value={f}>{f}</option>)}
                </select>
                <select value={p.coverage} onChange={e => handleFieldChange('coverage', e.target.value)} className="w-full bg-gray-800 p-2">
                    {(['Man-to-Man', 'Cover 2 Zone', 'Cover 3 Zone', 'Cover 4 Zone'] as CoverageScheme[]).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <select value={p.blitz} onChange={e => handleFieldChange('blitz', e.target.value)} className="w-full bg-gray-800 p-2">
                    {(['None', 'Linebacker', 'Cornerback', 'Safety'] as BlitzPackage[]).map(b => <option key={b} value={b}>{b}</option>)}
                </select>
                 <Button onClick={() => onSave(editedPlay)} className="text-center">Save Play</Button>
            </div>
        );
    }
};

const TransferPortalScreen: React.FC<{ gameState: GameState, onSign: (playerId: string) => void, onAdvance: () => void }> = ({ gameState, onSign, onAdvance }) => {
    return (
        <div>
            <h2 className="text-2xl font-press-start text-primary mb-4 p-4">Transfer Portal</h2>
            <div className="p-4 space-y-2">
                {gameState.transferPortal.length === 0 && <p>The transfer portal is empty.</p>}
                {gameState.transferPortal.sort((a,b) => b.attributes.OVR - a.attributes.OVR).map(p => (
                    <div key={p.id} className="p-3 bg-black/50 border border-gray-700 flex justify-between items-center">
                        <div>
                            <p className="font-bold">{p.name} ({p.position}, {p.year})</p>
                            <p>OVR: <span className="text-primary">{p.attributes.OVR}</span> | Cost: <span className="text-tertiary">${(p.attributes.OVR * 1000).toLocaleString()}</span></p>
                        </div>
                        <Button onClick={() => onSign(p.id)} disabled={gameState.funds < p.attributes.OVR * 1000} className="w-auto px-4 py-2 text-sm">Sign</Button>
                    </div>
                ))}
            </div>
            <div className="p-4">
                <Button onClick={onAdvance} className="text-center">Go to Recruiting</Button>
            </div>
        </div>
    );
};

const MyCareerTransferChoiceScreen: React.FC<{ gameState: GameState, onStay: () => void, onTransfer: (teamId: number) => void }> = ({ gameState, onStay, onTransfer }) => {
    const myTeam = gameState.teams.find(t => t.id === gameState.myTeamId)!;
    
    return (
        <div>
            <h2 className="text-2xl font-press-start text-primary mb-4 p-4">End of Season Decision</h2>
            <div className="p-4 text-center max-w-lg mx-auto">
                <p className="mb-6">The season is over. You can choose to remain loyal to the {myTeam.name} or enter the transfer portal to see what other opportunities are out there.</p>
                <Button onClick={onStay} className="text-center mb-4">Stay with {myTeam.name}</Button>
                
                <h3 className="text-xl font-press-start text-tertiary mt-8 mb-4">Transfer Offers</h3>
                {gameState.transferOffers.length === 0 && <p>You have no transfer offers at this time. Looks like you're staying put.</p>}
                <div className="space-y-2">
                    {gameState.transferOffers.map(offer => (
                        <Button key={offer.teamId} onClick={() => onTransfer(offer.teamId)}>
                            Transfer to {offer.teamName} (Prestige: {offer.prestige})
                        </Button>
                    ))}
                </div>
            </div>
        </div>
    );
};

const CareerSummaryScreen: React.FC<{ summary: CareerSummary, onMainMenu: () => void, onStartCollege: () => void }> = ({ summary, onMainMenu, onStartCollege }) => {
    return (
        <Modal title={summary.isPlayer ? "High School Career Over" : "Dynasty Complete"} onClose={onMainMenu} size="3xl">
            <div className="text-center">
                <h3 className="text-2xl text-primary">{summary.name}</h3>
                <p>Final Team: {summary.finalTeamName}</p>
            </div>

            <div className="my-6 space-y-2">
                {summary.isPlayer && summary.careerStats && <StatBlock stats={summary.careerStats} title="Career Stats" />}
                {!summary.isPlayer && (
                    <>
                        <p>Seasons Coached: <span className="text-primary float-right">{summary.seasons}</span></p>
                        <p>Total Wins: <span className="text-primary float-right">{summary.wins}</span></p>
                        <p>Championships: <span className="text-primary float-right">{summary.championships}</span></p>
                    </>
                )}
                 {summary.isPlayer && summary.collegeCommitted && <p>Committed To: <span className="text-primary float-right">{summary.collegeCommitted}</span></p>}
            </div>

            <h4 className="text-xl font-press-start text-primary mb-2">Trophy Case</h4>
            <div className="grid grid-cols-3 gap-2">
                 {summary.trophies.map((trophy, i) => (
                    <div key={i} className="p-2 bg-black/50 text-center">
                        <TrophyIcon className="w-8 h-8 mx-auto text-primary" />
                        <p className="text-sm">{trophy.award}</p>
                        <p className="text-xs text-tertiary">S{trophy.season}</p>
                    </div>
                ))}
            </div>
            
            {summary.isPlayer && summary.collegeCommitted && (
                <Button onClick={onStartCollege} className="text-center mt-8 bg-secondary border-secondary">Start College Career</Button>
            )}
            <Button onClick={onMainMenu} className="text-center mt-2">Return to Main Menu</Button>
        </Modal>
    );
};

const PlayGameScreen: React.FC<{ gameState: GameState, onPlayCall: (play: CustomOffensivePlay | CustomDefensivePlay) => void, onSimToEnd: () => void }> = ({ gameState, onPlayCall, onSimToEnd }) => {
    const { activeGame, teams, myTeamId, myStrategy, customPlaybooks } = gameState;
    if (!activeGame || myTeamId === null) return <div>Loading game...</div>;
    
    const [selectedPlay, setSelectedPlay] = React.useState<CustomOffensivePlay | CustomDefensivePlay | null>(null);

    const myTeam = teams.find(t => t.id === myTeamId);
    const opponent = teams.find(t => t.id === activeGame.opponentId);

    if (!myTeam || !opponent) return <div>Team data missing.</div>;

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const isOffense = activeGame.possession === 'player';
    const playbookName = isOffense ? myStrategy.offense : myStrategy.defense;
    let availablePlays: (CustomOffensivePlay | CustomDefensivePlay)[] = [];
    
    const customPlaybook = customPlaybooks.find(p => p.name === playbookName);
    if (customPlaybook) {
        availablePlays = customPlaybook.plays;
    } else {
        // Generate some default plays if not a custom playbook
        if (isOffense) {
            availablePlays = [
                { id: 'run-inside', name: 'Inside Run', type: 'Run', formation: 'I-Form', direction: 'Inside Right' },
                { id: 'run-outside', name: 'Outside Run', type: 'Run', formation: 'Singleback', direction: 'Outside Left' },
                { id: 'pass-short', name: 'Short Pass', type: 'Pass', formation: 'Shotgun', concept: 'Shallow Cross' },
                { id: 'pass-deep', name: 'Deep Pass', type: 'Pass', formation: 'Shotgun', concept: 'Four Verticals' },
            ] as CustomOffensivePlay[];
        } else {
            availablePlays = [
                { id: 'cov-man', name: 'Man Coverage', formation: 'Nickel', coverage: 'Man-to-Man', blitz: 'None' },
                { id: 'cov-zone', name: 'Cover 2 Zone', formation: '4-3', coverage: 'Cover 2 Zone', blitz: 'None' },
                { id: 'blitz-lb', name: 'Linebacker Blitz', formation: '3-4', coverage: 'Man-to-Man', blitz: 'Linebacker' },
                { id: 'prevent', name: 'Prevent Defense', formation: 'Dime', coverage: 'Cover 4 Zone', blitz: 'None' },
            ] as CustomDefensivePlay[];
        }
    }
    
    // Auto-select first play
    React.useEffect(() => {
        if (availablePlays.length > 0) {
            setSelectedPlay(availablePlays[0]);
        }
    }, [isOffense]);


    const yardLineText = () => {
        if (activeGame.yardLine === 50) return "50 yard line";
        if (activeGame.yardLine < 50) return `your own ${activeGame.yardLine}`;
        return `the opponent's ${100 - activeGame.yardLine}`;
    }

    const handleConfirmPlay = () => {
        if (selectedPlay) {
            onPlayCall(selectedPlay);
            setSelectedPlay(null);
        }
    }

    return (
        <div className="p-4 max-w-4xl mx-auto">
            {/* Scoreboard */}
            <div className="grid grid-cols-3 text-center mb-4 p-2 bg-black/50 border-2 border-primary font-press-start">
                <div className="text-left">
                    <p className="text-xl">{myTeam.name}</p>
                    <p className="text-3xl text-primary">{activeGame.playerScore}</p>
                </div>
                <div>
                    <p>QTR {activeGame.quarter}</p>
                    <p className="text-2xl">{formatTime(activeGame.time)}</p>
                </div>
                <div className="text-right">
                    <p className="text-xl">{opponent.name}</p>
                    <p className="text-3xl text-primary">{activeGame.opponentScore}</p>
                </div>
            </div>

            {/* Game State */}
            <div className="text-center mb-4 p-2 bg-black/50 font-press-start">
                <p>{activeGame.down}{['st', 'nd', 'rd', 'th'][activeGame.down - 1] || 'th'} & {activeGame.distance > 0 ? activeGame.distance : 'Goal'}</p>
                <p>Ball on {yardLineText()}</p>
                <p>Possession: <span className="text-primary">{activeGame.possession === 'player' ? myTeam.name : opponent.name}</span></p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Play Calling */}
                <div className="md:col-span-1 space-y-2">
                    <h3 className="text-lg font-press-start text-tertiary mb-2">{isOffense ? "Offensive Plays" : "Defensive Plays"}</h3>
                    {availablePlays.map(p => (
                        <button 
                            key={p.id}
                            onClick={() => setSelectedPlay(p)}
                            className={`w-full text-left p-2 border-2 transition-all ${selectedPlay?.id === p.id ? 'bg-primary text-text-dark border-primary' : 'bg-secondary/20 border-secondary'}`}
                        >
                            {p.name}
                        </button>
                    ))}
                </div>
                {/* Play Log */}
                <div className="md:col-span-2 bg-black/50 p-2 h-64 overflow-y-auto">
                    <h3 className="text-lg font-press-start text-tertiary mb-2">Play Log</h3>
                    <div className="space-y-1 text-sm">
                        {[...activeGame.playLog].reverse().map((log, i) => <p key={i}>{log}</p>)}
                    </div>
                </div>
            </div>
            {/* Actions */}
            <div className="mt-4 grid grid-cols-2 gap-4">
                 <Button onClick={handleConfirmPlay} disabled={!selectedPlay || activeGame.possession !== 'player'} className="text-center">Confirm Play</Button>
                 <Button onClick={onSimToEnd} className="text-center bg-secondary/50 border-secondary">Sim to End</Button>
            </div>
        </div>
    );
};

const SAVE_GAME_KEY = 'retro-hs-football-save';
const GOD_MODE_KEY = 'retro-hs-football-god-mode';

export const App: React.FC = () => {
    const [gameState, setGameState] = React.useState<GameState | null>(null);
    const [currentScreen, setCurrentScreen] = React.useState<Screen>('MAIN_MENU');
    const [godModeUnlocked, setGodModeUnlocked] = React.useState(false);
    const [hasSave, setHasSave] = React.useState(false);
    const [loadingText, setLoadingText] = React.useState<string | null>(null);
    const [notification, setNotification] = React.useState<string | null>(null);
    const [scoutingReport, setScoutingReport] = React.useState<ScoutingReport | null>(null);

    React.useEffect(() => {
        try {
            const unlocked = localStorage.getItem(GOD_MODE_KEY) === 'true';
            setGodModeUnlocked(unlocked);
            const savedGame = localStorage.getItem(SAVE_GAME_KEY);
            setHasSave(!!savedGame);
        } catch (e) {
            console.error("Could not access local storage:", e);
        }
    }, []);

    const saveGame = (state: GameState | null) => {
        if (!state) return;
        try {
            localStorage.setItem(SAVE_GAME_KEY, JSON.stringify(state));
            setHasSave(true);
        } catch (e) {
            console.error("Could not save game:", e);
        }
    };
    
    React.useEffect(() => {
        if (gameState) {
            saveGame(gameState);
        }
    }, [gameState]);

    const handleNavigate = (screen: Screen) => {
        if (gameState) {
            let newState = { ...gameState };
            let stateChanged = false;
            if (screen === 'INBOX') {
                newState.inbox = newState.inbox.map(m => ({ ...m, read: true }));
                stateChanged = true;
            }
            if (screen === 'NEWS') {
                newState.lastReadNewsCount = newState.news.length;
                stateChanged = true;
            }
            if (stateChanged) {
                setGameState(newState);
            }
        }
        setCurrentScreen(screen);
    };
    
    const showNotification = (message: string) => {
        setNotification(message);
    };

    const handleUnlockGodMode = () => {
        setGodModeUnlocked(true);
        try {
            localStorage.setItem(GOD_MODE_KEY, 'true');
        } catch (e) {
            console.error("Could not save to local storage:", e);
        }
    };

    const handleNewGame = (mode: GameState['gameMode']) => {
        setLoadingText('Setting up new world...');
        const newGameState = GameService.initializeGameWorld(godModeUnlocked);
        newGameState.gameMode = mode;
        setGameState(newGameState);
        setCurrentScreen('TEAM_SELECTION');
        setLoadingText(null);
    };

    const handleLoadGame = () => {
        try {
            const savedGame = localStorage.getItem(SAVE_GAME_KEY);
            if (savedGame) {
                const loadedState = JSON.parse(savedGame);
                setGameState(loadedState);
                if (loadedState.gameMode === 'DYNASTY') {
                    setCurrentScreen('TEAM_PROFILE_HUB');
                } else if (loadedState.gameMode === 'MY_CAREER') {
                    setCurrentScreen('MY_CAREER_HUB');
                } else if (loadedState.gameMode === 'COLLEGE_CAREER') {
                    setCurrentScreen('COLLEGE_CAREER_HUB');
                } else if (loadedState.gameMode === 'DYNASTY_OVER' || loadedState.gameMode === 'CAREER_OVER') {
                    setCurrentScreen('CAREER_SUMMARY');
                } else {
                    setCurrentScreen('MAIN_MENU');
                }
            }
        } catch (e) {
            console.error("Could not load game:", e);
            setHasSave(false);
        }
    };
    
    const resetToMainMenu = () => {
      setGameState(null);
      setCurrentScreen('MAIN_MENU');
    }

    const handleTeamSelection = (teamId: number) => {
        if (!gameState) return;
        let newState = { ...gameState, myTeamId: teamId };
        
        if(newState.gameMode === 'DYNASTY') {
            setGameState(newState);
            setCurrentScreen('TEAM_PROFILE_HUB');
        } else { // MyCareer
            setGameState(newState);
            setCurrentScreen('MY_CAREER_PLAYER_CHOICE');
        }
    };

    const handleMyCareerCreation = (name: string, pos: Position) => {
        if (!gameState || gameState.myTeamId === null) return;
        const newState = GameService.initializeMyCareer(name, pos, gameState.myTeamId, godModeUnlocked, gameState.teams);
        setGameState(newState);
        setCurrentScreen('MY_CAREER_HUB');
    };

    const handleMyCareerExistingPlayerSelection = (playerId: string) => {
        if (!gameState) return;
        const newState = GameService.initializeMyCareerWithExistingPlayer(playerId, gameState);
        setGameState(newState);
        setCurrentScreen('MY_CAREER_HUB');
    };

    const advanceWeek = async () => {
        if (!gameState) return;

        if (gameState.gameMode === 'COLLEGE_CAREER') {
            // FIX: Changed to call the newly exported advanceCollegeWeek function.
            setLoadingText(`Simulating College Week ${gameState.collegeGameState?.week}...`);
            const newState = GameService.advanceCollegeWeek(gameState);
            setGameState(newState);
            setLoadingText(null);
            return;
        }

        setLoadingText(`Simulating Week ${gameState.week}...`);
        const { newState, notification } = await GameService.advanceWeek(gameState);
        setGameState(newState);
        if(notification) showNotification(notification);
        setLoadingText(null);
        if (newState.isOffseason && newState.week === 16) {
             setCurrentScreen('AWARDS');
        }
        if (newState.gameMode?.endsWith('_OVER')) {
            setCurrentScreen('CAREER_SUMMARY');
        }
    };
    
    const handleSimToOffseason = async () => {
        if (!gameState) return;
        let tempState = gameState;
        while (!tempState.isOffseason) {
            setLoadingText(`Simulating Week ${tempState.week}...`);
            const { newState } = await GameService.advanceWeek(tempState);
            tempState = newState;
        }
        setGameState(tempState);
        setLoadingText(null);
        if (tempState.isOffseason && tempState.week === 16) {
            setCurrentScreen('AWARDS');
        }
    };

    const handleScoutOpponent = async (opponentId: number) => {
        if (!gameState) return;
        setLoadingText('Scouting opponent...');
        try {
            // FIX: Changed to call the newly exported generateDynamicScoutingReport function.
            const report = await GameService.generateDynamicScoutingReport(gameState, opponentId);
            setScoutingReport(report);
        } catch (e) {
            console.error(e);
            showNotification("Failed to generate scouting report.");
        } finally {
            setLoadingText(null);
        }
    };

    const handleUpgradeFacility = (facility: keyof GameState['facilities']) => {
        if (!gameState) return;
        // FIX: Changed to call the newly exported upgradeFacility function.
        setGameState(GameService.upgradeFacility(gameState, facility));
    };

    const handleSignRecruit = (recruitId: string) => {
        if(!gameState) return;
        // FIX: Changed to call the newly exported signRecruit function.
        setGameState(GameService.signRecruit(gameState, recruitId));
    };
    
    const handleFinishRecruiting = () => {
        if (!gameState) return;
        setLoadingText("Preparing next season...");
        // FIX: Changed to call the newly exported prepareNextSeason function.
        const newState = GameService.prepareNextSeason(gameState);
        setGameState(newState);
        if (newState.gameMode?.endsWith('_OVER')) {
            setCurrentScreen('CAREER_SUMMARY');
        } else {
            setCurrentScreen(newState.gameMode === 'DYNASTY' ? 'TEAM_PROFILE_HUB' : 'MY_CAREER_HUB');
        }
        setLoadingText(null);
    };
    
    const handleUpgradeAttribute = (attr: keyof Player['attributes']) => {
        if (!gameState) return;
        // FIX: Changed to call the newly exported handleSpendSkillPoint function.
        setGameState(GameService.handleSpendSkillPoint(gameState, attr));
    };

    const handlePractice = (type: string) => {
        if (!gameState) return;
        // FIX: Changed to call the newly exported handlePractice function.
        const { newState, notification } = GameService.handlePractice(gameState, type);
        setGameState(newState);
        if (notification) showNotification(notification);
    };
    
    const handleToggleGodMode = (setting: keyof GodModeState) => {
        if (!gameState || !gameState.godMode) return;
        const newGodModeState = { ...gameState.godMode, [setting]: !gameState.godMode[setting] };
        let newState = { ...gameState, godMode: newGodModeState };
        newState = GameService.applyImmediateGodModeEffects(newState, setting);
        setGameState(newState);
    };

    const handleEditPlayer = (player: Player, newName: string, newAttrs: Player['attributes']) => {
        if(!gameState) return;
        // FIX: Changed to call the newly exported editPlayer function.
        setGameState(GameService.editPlayer(gameState, player.id, newName, newAttrs));
    };

    const handleMovePlayer = (playerId: string) => {
        if(!gameState) return;
        // FIX: Changed to call the newly exported movePlayerRosterStatus function.
        setGameState(GameService.movePlayerRosterStatus(gameState, playerId));
    };
    
    const handleSetStrategy = (offense: string, defense: string) => {
        if(!gameState) return;
        // FIX: Changed to call the newly exported setStrategy function.
        setGameState(GameService.setStrategy(gameState, offense, defense));
    };

    const handleSelectSponsor = (id: string) => {
        if(!gameState) return;
        // FIX: Changed to call the newly exported selectSponsor function.
        setGameState(GameService.selectSponsor(gameState, id));
        showNotification("Sponsor signed!");
    };

    const handleHireStaff = (id: string) => {
        if(!gameState) return;
        // FIX: Changed to call the newly exported hireStaff function.
        setGameState(GameService.hireStaff(gameState, id));
    };
    
    const handleFireStaff = (id: string) => {
        if(!gameState) return;
        // FIX: Changed to call the newly exported fireStaff function.
        setGameState(GameService.fireStaff(gameState, id));
    };

    const handleUpgradeCoach = (skill: string) => {
        if(!gameState) return;
        // FIX: Changed to call the newly exported upgradeCoachSkill function.
        setGameState(GameService.upgradeCoachSkill(gameState, skill));
    };
    
    const handleTrainingCamp = (assignments: {playerId: string, focus: TrainingFocus}[]) => {
        if(!gameState) return;
        // FIX: Changed to call the newly exported handleTrainingCamp function.
        setGameState(GameService.handleTrainingCamp(gameState, assignments));
        showNotification("Training complete!");
    };
    
    const handleSavePlaybook = (playbook: CustomPlaybook) => {
        if(!gameState) return;
        // FIX: Changed to call the newly exported saveCustomPlaybook function.
        setGameState(GameService.saveCustomPlaybook(gameState, playbook));
    };

    const handleDeletePlaybook = (playbookId: string) => {
        if(!gameState) return;
        // FIX: Changed to call the newly exported deleteCustomPlaybook function.
        setGameState(GameService.deleteCustomPlaybook(gameState, playbookId));
    };
    
    const handleSignFromPortal = (playerId: string) => {
        if(!gameState) return;
        // FIX: Changed to call the newly exported signFromTransferPortal function.
        setGameState(GameService.signFromTransferPortal(gameState, playerId));
    };

    const handleMyCareerTransferChoice = (teamId: number) => {
        if(!gameState) return;
        // FIX: Changed to call the newly exported handleTransferRequest function.
        const newState = GameService.handleTransferRequest(gameState, teamId);
        setGameState(newState);
        handleFinishRecruiting();
    };
    
    const handleCommitToCollege = (offer: CollegeOffer) => {
        if(!gameState) return;
        // FIX: Changed to call the newly exported commitToCollege function.
        const {newState, notification} = GameService.commitToCollege(gameState, offer);
        setGameState(newState);
        showNotification(notification);
    };

    const handleSelectTop5 = (top5: CollegeOffer[]) => {
        if(!gameState) return;
        // FIX: Changed to call the newly exported selectTop5Colleges function.
        setGameState(GameService.selectTop5Colleges(gameState, top5));
        showNotification("Top 5 saved!");
    }
    
    const handlePlayGame = (game: Game) => {
        if(!gameState || !gameState.myTeamId) return;
        // FIX: Changed to call the newly exported startGame function.
        const activeGame = GameService.startGame(gameState, gameState.myTeamId, game.opponentId);
        setGameState({...gameState, activeGame});
        setCurrentScreen('PLAY_GAME');
    }

    const handlePlayCall = async (play: CustomOffensivePlay | CustomDefensivePlay) => {
        if(!gameState) return;
        // FIX: Changed to call the newly exported resolvePlay function.
        const newState = await GameService.resolvePlay(gameState, play);
        if(newState.activeGame?.isGameOver) {
            setLoadingText('Game finalizing...');
            setTimeout(() => {
                const finalState = { ...newState, activeGame: null };
                setGameState(finalState);
                setCurrentScreen(finalState.gameMode === 'DYNASTY' ? 'TEAM_PROFILE_HUB' : 'MY_CAREER_HUB');
                setLoadingText(null);
            }, 2000);
        } else {
            setGameState(newState);
        }
    }
    
    const handleSimToEndOfGame = async () => {
        if(!gameState || !gameState.activeGame) return;
        setLoadingText('Simulating rest of game...');
        // FIX: Changed to call the newly exported simToEndOfGame function.
        const newState = await GameService.simToEndOfGame(gameState);
        setGameState(newState);
        setCurrentScreen(newState.gameMode === 'DYNASTY' ? 'TEAM_PROFILE_HUB' : 'MY_CAREER_HUB');
        setLoadingText(null);
    }

    const handleStartCollegeCareer = () => {
        if(!gameState) return;
        setLoadingText("Heading to college...");
        // FIX: Changed to call the newly exported transitionToCollegeCareer function.
        const newState = GameService.transitionToCollegeCareer(gameState);
        setGameState(newState);
        setCurrentScreen('COLLEGE_CAREER_HUB');
        setLoadingText(null);
    };

    const renderScreen = () => {
      if (!gameState) {
        switch (currentScreen) {
          case 'MAIN_MENU':
            return <MainMenu onNavigate={handleNavigate} onNewGame={handleNewGame} hasSave={hasSave} onLoadGame={handleLoadGame} godModeUnlocked={godModeUnlocked} />;
          case 'GOD_MODE':
            return <GodModeUnlockScreen onUnlock={handleUnlockGodMode} onBack={() => handleNavigate('MAIN_MENU')} unlocked={godModeUnlocked} />;
          case 'TEAM_SELECTION':
            return <div>Loading...</div>;
          default:
            return <MainMenu onNavigate={handleNavigate} onNewGame={handleNewGame} hasSave={hasSave} onLoadGame={handleLoadGame} godModeUnlocked={godModeUnlocked} />;
        }
      }

      const myTeam = gameState.teams.find(t => t.id === gameState.myTeamId);
      const myPlayer = myTeam?.roster.find(p => p.id === gameState.myPlayerId);
      const unreadMessages = gameState.inbox.filter(m => !m.read).length;
      const unreadNews = gameState.news.length > (gameState.lastReadNewsCount || 0);
      

      switch (currentScreen) {
          case 'MAIN_MENU': return <MainMenu onNavigate={handleNavigate} onNewGame={handleNewGame} hasSave={hasSave} onLoadGame={handleLoadGame} godModeUnlocked={godModeUnlocked} />;
          case 'TEAM_SELECTION': return <TeamSelectionScreen teams={gameState.teams} onSelect={handleTeamSelection} />;
          case 'MY_CAREER_PLAYER_CHOICE': return <MyCareerPlayerChoiceScreen onNavigate={handleNavigate} />;
          case 'MY_CAREER_CREATION': return <MyCareerCreationScreen onComplete={handleMyCareerCreation} />;
          case 'MY_CAREER_EXISTING_PLAYER_SELECTION': return <MyCareerExistingPlayerSelectionScreen gameState={gameState} onSelect={handleMyCareerExistingPlayerSelection} />;
          case 'TEAM_PROFILE_HUB': return <TeamProfileHub onNavigate={handleNavigate} onAdvance={advanceWeek} gameState={gameState} unreadMessages={unreadMessages} onSimToOffseason={handleSimToOffseason} onPlayGame={handlePlayGame} />;
          case 'MY_CAREER_HUB': return <MyCareerHub onNavigate={handleNavigate} onAdvance={advanceWeek} gameState={gameState} unreadMessages={unreadMessages} onSimToOffseason={handleSimToOffseason} onPlayGame={handlePlayGame} />;
          case 'ROSTER': return <RosterScreen gameState={gameState} onUpgradeAttribute={handleUpgradeAttribute} onEditPlayer={handleEditPlayer} onMovePlayer={handleMovePlayer} />;
          case 'SCHEDULE': return <ScheduleScreen gameState={gameState} onScoutOpponent={handleScoutOpponent} onSimGame={advanceWeek} onPlayGame={handlePlayGame} onSimToOffseason={handleSimToOffseason} myPlayer={myPlayer} />;
          case 'STANDINGS': return <StandingsScreen teams={gameState.teams} rankings={gameState.nationalRankings} />;
          case 'FACILITIES': return <FacilitiesScreen facilities={gameState.facilities} funds={gameState.funds} onUpgrade={handleUpgradeFacility} />;
          case 'AWARDS': return <Modal title={`Season ${gameState.season} Awards`} onClose={() => handleNavigate(gameState.isOffseason ? (gameState.gameMode === 'MY_CAREER' ? 'MY_CAREER_TRANSFER_CHOICE' : 'TRAINING_CAMP') : 'TEAM_PROFILE_HUB' )}><AwardsModalContent awards={gameState.seasonAwards} season={gameState.season} /></Modal>
          case 'GOD_MODE_SETTINGS': return <GodModeSettingsScreen settings={gameState.godMode!} onToggle={handleToggleGodMode} onBack={() => handleNavigate(gameState.gameMode === 'DYNASTY' ? 'TEAM_PROFILE_HUB' : 'MY_CAREER_HUB')} gameMode={gameState.gameMode!} />;
          case 'RECRUITMENT': return <RecruitmentScreen recruits={gameState.recruits} points={gameState.recruitingPoints} onSign={handleSignRecruit} signedRecruits={gameState.signedRecruits} onFinish={handleFinishRecruiting} />;
          case 'NATIONAL_STATS': return <NationalStatsScreen teams={gameState.teams} />;
          case 'INBOX': return <InboxScreen messages={gameState.inbox} />;
          case 'TACTICS': return <TacticsScreen gameState={gameState} onSet={handleSetStrategy} />;
          case 'TROPHY_CASE': return <TrophyCaseScreen trophies={gameState.trophyCase} />;
          case 'TRAINING_CAMP': return <TrainingCampScreen gameState={gameState} onTrain={handleTrainingCamp} onAdvance={() => handleNavigate('TRANSFER_PORTAL')} />;
          case 'AWARD_RACES': return <AwardRacesScreen teams={gameState.teams} />;
          case 'STAFF': return <StaffScreen staff={gameState.staff} market={gameState.staffMarket} funds={gameState.funds} onHire={handleHireStaff} onFire={handleFireStaff} />;
          case 'HALL_OF_FAME': return <HallOfFameScreen inductees={gameState.hallOfFame} />;
          case 'NEWS': return <NewsScreen articles={gameState.news} />;
          case 'PLAYOFFS_HUB': return <PlayoffsHubScreen gameState={gameState} />;
          case 'PRACTICE': return <PracticeScreen gameState={gameState} onPractice={handlePractice} onBack={() => handleNavigate('MY_CAREER_HUB')} />;
          case 'COACH_HUB': return <CoachScreen coach={gameState.coach} onUpgrade={handleUpgradeCoach} />;
          case 'JV_HUB': return <JVHubScreen onNavigate={handleNavigate} />;
          case 'JV_ROSTER': return <JVRosterScreen gameState={gameState} onMovePlayer={handleMovePlayer} onUpgradeAttribute={handleUpgradeAttribute} onEditPlayer={handleEditPlayer} />;
          case 'JV_SCHEDULE': return <JVScheduleScreen gameState={gameState} />;
          case 'JV_STATS': return <JVStatsScreen teams={gameState.teams} />;
          case 'JV_AWARDS': return <JVAwardsScreen awards={gameState.jvSeasonAwards} />;
          case 'TEAM_STATS': return <TeamStatsScreen team={myTeam} />;
          case 'PLAYBOOK_EDITOR': return <PlaybookEditorScreen playbooks={gameState.customPlaybooks} onSave={handleSavePlaybook} onDelete={handleDeletePlaybook} />;
          case 'TRANSFER_PORTAL': return <TransferPortalScreen gameState={gameState} onSign={handleSignFromPortal} onAdvance={() => handleNavigate('RECRUITMENT')} />;
          case 'TRANSFER_SELECTION': return <TeamSelectionScreen teams={gameState.teams.filter(t => t.id !== gameState.myTeamId)} onSelect={handleMyCareerTransferChoice} title="Select New Team" />;
          case 'MY_CAREER_TRANSFER_CHOICE': return <MyCareerTransferChoiceScreen gameState={gameState} onStay={handleFinishRecruiting} onTransfer={handleMyCareerTransferChoice} />;
          case 'CAREER_SUMMARY': return <CareerSummaryScreen summary={gameState.careerSummary!} onMainMenu={resetToMainMenu} onStartCollege={handleStartCollegeCareer} />;
          case 'PLAY_GAME': return <PlayGameScreen gameState={gameState} onPlayCall={handlePlayCall} onSimToEnd={handleSimToEndOfGame} />;
          case 'COMMITMENT_HUB': return <CommitmentHubScreen gameState={gameState} onCommit={handleCommitToCollege} onSelectTop5={handleSelectTop5} />;
          // College Screens
          case 'COLLEGE_CAREER_HUB': return <CollegeCareerHub onNavigate={handleNavigate} onAdvance={advanceWeek} gameState={gameState} />;
          case 'DORM_ROOM': return <DormRoomScreen trophies={gameState.collegeGameState?.trophyCase || []} />;
          case 'COLLEGE_HALL_OF_CHAMPIONS': return <CollegeHallOfChampionsScreen trophies={gameState.collegeGameState?.trophyCase || []} />;
          case 'COLLEGE_SCHEDULE': return <PlaceholderScreen title="College Schedule" />;
          case 'COLLEGE_STATS': return <PlaceholderScreen title="College Stats" />;
          case 'COLLEGE_AWARDS': return <PlaceholderScreen title="College Awards" />;
          default:
              return <PlaceholderScreen title={currentScreen} />;
      }
    };

    let teamName = "Retro HS Football";
    let record: { wins: number; losses: number; } | undefined = undefined;
    let season = 1;
    let week = 1;

    if (gameState?.gameMode === 'COLLEGE_CAREER' && gameState.collegeGameState && gameState.myPlayerId) {
        const collegeState = gameState.collegeGameState;
        const player = gameState.teams.flatMap(t => t.roster).find(p => p.id === gameState.myPlayerId);
        const myCollegeTeam = collegeState.teams.find(t => t.roster.some(p => p.id === gameState.myPlayerId));
        teamName = myCollegeTeam?.name || "College Career";
        record = myCollegeTeam?.record;
        season = ['FR', 'SO', 'JR', 'SR'].indexOf(collegeState.season) + 1;
        week = collegeState.week;
    } else if (gameState) {
        const myTeam = gameState.teams.find(t => t.id === gameState.myTeamId);
        teamName = myTeam?.name || "Retro HS Football";
        record = myTeam?.record;
        season = gameState.season;
        week = gameState.week;
    }
    
    const unreadNews = gameState ? gameState.news.length > (gameState.lastReadNewsCount || 0) : false;

    return (
        <div className="container mx-auto max-w-7xl border-x-2 border-primary min-h-screen">
            {loadingText && <Loading text={loadingText} />}
            {notification && <Notification message={notification} onClose={() => setNotification(null)} />}
            {scoutingReport && <ScoutingReportModal report={scoutingReport} onClose={() => setScoutingReport(null)} />}
            
            {gameState && currentScreen !== 'MAIN_MENU' && currentScreen !== 'TEAM_SELECTION' && currentScreen !== 'MY_CAREER_CREATION' && currentScreen !== 'MY_CAREER_PLAYER_CHOICE' && currentScreen !== 'MY_CAREER_EXISTING_PLAYER_SELECTION' && currentScreen !== 'GOD_MODE' && (
                <>
                    <Header 
                        teamName={teamName}
                        funds={gameState.funds}
                        season={season}
                        week={week}
                        record={record}
                        gameMode={gameState.gameMode}
                        onMainMenu={resetToMainMenu}
                    />
                     <NavMenu 
                        onNavigate={handleNavigate}
                        gameMode={gameState.gameMode!}
                        isGodMode={!!gameState.godMode?.isEnabled}
                        week={gameState.week}
                        unreadNews={unreadNews}
                    />
                </>
            )}

            <main className="p-2 md:p-4">
                <ScreenWrapper screenKey={currentScreen}>
                    {renderScreen()}
                </ScreenWrapper>
            </main>
        </div>
    );
};
