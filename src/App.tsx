import React, { useState, useEffect, useCallback } from 'react';
import { Player, SlotConfiguration, CustomPlayerPayload, EPLTeamInfo } from './types/fantasy';
import { INITIAL_PRESET_PLAYERS, TEAM_SCHEDULES, EPL_TEAMS, DATA_UPDATED_AT } from './data/eplData';
import { generatePlayerFixtures, TeamScheduleMap } from './lib/fixtures';
import { fetchLiveFplCatalog, mergeSquadWithCatalog } from './lib/fplApi';
import { CatalogProvider } from './context/CatalogContext';
import Navbar from './components/Navbar';
import SoccerPitch from './components/SoccerPitch';
import LineupManager from './components/LineupManager';
import UpcomingFixturesMatrix from './components/UpcomingFixturesMatrix';
import AddPlayerModal from './components/AddPlayerModal';
import SlotAssignModal from './components/SlotAssignModal';
import FormationSettingsModal from './components/FormationSettingsModal';
import { Calendar, Plus, Sparkles, Shield } from 'lucide-react';

type ViewType = 'pitch' | 'list' | 'fixtures';

const STORAGE_KEY_PLAYERS = 'epl_players_2026_v2';
const STORAGE_KEY_SLOTS = 'epl_slots_2026_v2';
const STORAGE_KEY_CATALOG = 'epl_catalog_2026_v1';

const DEFAULT_SLOTS: SlotConfiguration[] = [
  { id: 'gk_1',     label: 'GK',       allowedPositions: ['GK'],  isStarter: true,  playerId: null },
  { id: 'def_1',    label: 'DEF 1',    allowedPositions: ['DEF'], isStarter: true,  playerId: null },
  { id: 'def_2',    label: 'DEF 2',    allowedPositions: ['DEF'], isStarter: true,  playerId: null },
  { id: 'def_3',    label: 'DEF 3',    allowedPositions: ['DEF'], isStarter: true,  playerId: null },
  { id: 'def_4',    label: 'DEF 4',    allowedPositions: ['DEF'], isStarter: true,  playerId: null },
  { id: 'mid_1',    label: 'MID 1',    allowedPositions: ['MID'], isStarter: true,  playerId: null },
  { id: 'mid_2',    label: 'MID 2',    allowedPositions: ['MID'], isStarter: true,  playerId: null },
  { id: 'mid_3',    label: 'MID 3',    allowedPositions: ['MID'], isStarter: true,  playerId: null },
  { id: 'mid_4',    label: 'MID 4',    allowedPositions: ['MID'], isStarter: true,  playerId: null },
  { id: 'fwd_1',    label: 'FWD 1',    allowedPositions: ['FWD'], isStarter: true,  playerId: null },
  { id: 'fwd_2',    label: 'FWD 2',    allowedPositions: ['FWD'], isStarter: true,  playerId: null },
  { id: 'bench_1',  label: 'BENCH 1',  allowedPositions: ['GK','DEF','MID','FWD'], isStarter: false, playerId: null },
  { id: 'bench_2',  label: 'BENCH 2',  allowedPositions: ['GK','DEF','MID','FWD'], isStarter: false, playerId: null },
  { id: 'bench_3',  label: 'BENCH 3',  allowedPositions: ['GK','DEF','MID','FWD'], isStarter: false, playerId: null },
  { id: 'bench_4',  label: 'BENCH 4',  allowedPositions: ['GK','DEF','MID','FWD'], isStarter: false, playerId: null },
];

interface CatalogState {
  teams: Record<string, EPLTeamInfo>;
  schedules: TeamScheduleMap;
  library: Player[];
  updatedAt: string;
}

function loadCatalog(): CatalogState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_CATALOG);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed?.library?.length && parsed?.teams && parsed?.schedules) {
        return parsed;
      }
    }
  } catch { /* ignore */ }
  return {
    teams: EPL_TEAMS,
    schedules: TEAM_SCHEDULES,
    library: INITIAL_PRESET_PLAYERS,
    updatedAt: DATA_UPDATED_AT,
  };
}

const App: React.FC = () => {
  const [catalog, setCatalog] = useState<CatalogState>(loadCatalog);
  const [players, setPlayers] = useState<Player[]>([]);
  const [slots, setSlots] = useState<SlotConfiguration[]>(DEFAULT_SLOTS);
  const [activeWeek, setActiveWeek] = useState(1);
  const [activeView, setActiveView] = useState<ViewType>('pitch');
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [assignSlotId, setAssignSlotId] = useState<string | null>(null);
  const [showFormation, setShowFormation] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  useEffect(() => {
    try {
      const savedPlayers = localStorage.getItem(STORAGE_KEY_PLAYERS);
      const savedSlots = localStorage.getItem(STORAGE_KEY_SLOTS);
      if (savedPlayers) {
        const parsed: Player[] = JSON.parse(savedPlayers);
        setPlayers(parsed.map((p) => ({
          ...p,
          fixtures: generatePlayerFixtures(p.team, p.projectedAvgPts, catalog.schedules),
        })));
      }
      if (savedSlots) setSlots(JSON.parse(savedSlots));
    } catch { /* ignore */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PLAYERS, JSON.stringify(players));
  }, [players]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_SLOTS, JSON.stringify(slots));
  }, [slots]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_CATALOG, JSON.stringify(catalog));
  }, [catalog]);

  const handleAddPreset = useCallback((preset: Player) => {
    const fixtures = generatePlayerFixtures(preset.team, preset.projectedAvgPts, catalog.schedules);
    const p: Player = { ...preset, fixtures };
    setPlayers(prev => [...prev, p]);
  }, [catalog.schedules]);

  const handleAddCustom = useCallback((payload: CustomPlayerPayload) => {
    const id = `custom_${Date.now()}`;
    const fixtures = generatePlayerFixtures(payload.team, payload.projectedAvgPts, catalog.schedules);
    const p: Player = { id, ...payload, fixtures, isCustom: true };
    setPlayers(prev => [...prev, p]);
  }, [catalog.schedules]);

  const handleSlotClick = useCallback((slotId: string) => {
    setAssignSlotId(slotId);
  }, []);

  const handleAssignPlayer = useCallback((slotId: string, playerId: string) => {
    setSlots(prev => {
      const existingSlot = prev.find(s => s.playerId === playerId);
      const targetSlot = prev.find(s => s.id === slotId);
      return prev.map(s => {
        if (s.id === slotId) return { ...s, playerId };
        if (s.playerId === playerId && existingSlot && targetSlot) {
          return { ...s, playerId: targetSlot.playerId };
        }
        return s;
      });
    });
  }, []);

  const handleRemovePlayer = useCallback((slotId: string) => {
    setSlots(prev => prev.map(s => s.id === slotId ? { ...s, playerId: null } : s));
  }, []);

  const handleSaveFormation = useCallback((newSlots: SlotConfiguration[]) => {
    setSlots(newSlots);
  }, []);

  const handleSyncSchedule = useCallback(async () => {
    setIsSyncing(true);
    setSyncMessage(null);
    try {
      const live = await fetchLiveFplCatalog();
      const nextCatalog: CatalogState = {
        teams: live.teams,
        schedules: live.schedules,
        library: live.players,
        updatedAt: live.updatedAt,
      };
      setCatalog(nextCatalog);
      setPlayers(prev => mergeSquadWithCatalog(prev, live));
      const clubCount = Object.keys(live.teams).length;
      setSyncMessage(`Updated ${live.players.length} players across ${clubCount} clubs · ${live.updatedAt.slice(0, 10)}`);
    } catch (err) {
      setPlayers(prev => prev.map(p => ({
        ...p,
        fixtures: generatePlayerFixtures(p.team, p.projectedAvgPts, catalog.schedules),
      })));
      setSyncMessage(err instanceof Error ? `Live fetch failed — reapplied bundled fixtures. ${err.message}` : 'Live fetch failed.');
    } finally {
      setIsSyncing(false);
      window.setTimeout(() => setSyncMessage(null), 6000);
    }
  }, [catalog.schedules]);

  const assignSlot = assignSlotId ? slots.find(s => s.id === assignSlotId) : null;
  const starterCount = slots.filter(s => s.isStarter && s.playerId).length;
  const starterTotal = slots.filter(s => s.isStarter).length;

  return (
    <CatalogProvider teams={catalog.teams}>
    <div className="min-h-screen bg-[#0a0a12] text-slate-100">
      <Navbar
        slots={slots}
        players={players}
        activeWeek={activeWeek}
        activeView={activeView}
        onWeekChange={setActiveWeek}
        onViewChange={setActiveView}
        onFormationClick={() => setShowFormation(true)}
        onSyncSchedule={handleSyncSchedule}
        isSyncing={isSyncing}
        lastSyncedAt={catalog.updatedAt}
      />

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {syncMessage && (
          <div className="px-4 py-2.5 rounded-xl bg-purple-900/30 border border-purple-700/40 text-sm text-purple-200">
            {syncMessage}
          </div>
        )}

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-black text-white">
              My <span className="text-purple-400">Squad</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {players.length} players · Starting XI {starterCount}/{starterTotal} · GW{activeWeek}
              {' · '}{Object.keys(catalog.teams).length} clubs · library {catalog.library.length}
            </p>
          </div>
          <button
            onClick={() => setShowAddPlayer(true)}
            className="flex items-center space-x-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-purple-500/25 hover:scale-105"
          >
            <Plus className="w-4 h-4" />
            <span>Add Player</span>
          </button>
        </div>

        {activeView === 'pitch' && (
          <div className="space-y-6 animate-fadeIn">
            <SoccerPitch
              slots={slots}
              players={players}
              activeWeek={activeWeek}
              onSlotClick={handleSlotClick}
            />
            {players.length > 0 && (
              <div className="bg-[#111128] border border-purple-900/30 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-purple-400" />
                    <span>GW{activeWeek} Fixtures</span>
                  </h3>
                  <button onClick={() => setActiveView('fixtures')} className="text-xs text-purple-400 font-bold hover:underline flex items-center space-x-1">
                    <span>Full 38-GW FDR Matrix</span>
                    <Sparkles className="w-3 h-3" />
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {slots.filter(s => s.isStarter && s.playerId).map(s => {
                    const p = players.find(pl => pl.id === s.playerId);
                    if (!p) return null;
                    const fx = p.fixtures[activeWeek];
                    return (
                      <div key={s.id} className="bg-slate-900/60 border border-slate-800 rounded-xl p-2.5 text-center">
                        <div className="text-[9px] text-purple-400 font-extrabold uppercase">{s.label}</div>
                        <div className="font-bold text-slate-100 text-xs truncate mt-0.5">{p.name.split(' ').pop()}</div>
                        {fx && !fx.isBlankGameweek && (
                          <div className={`mt-1 px-2 py-0.5 rounded-lg text-[9px] font-bold fdr-${fx.fdr} inline-block`}>
                            {fx.isDoubleGameweek ? 'DGW ' : ''}{fx.isHome ? 'vs' : '@'} {fx.opponent}
                          </div>
                        )}
                        {fx?.isBlankGameweek && (
                          <div className="mt-1 px-2 py-0.5 rounded-lg text-[9px] font-bold bg-slate-800 text-slate-400 inline-block">BGW</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {activeView === 'list' && (
          <div className="animate-fadeIn">
            <LineupManager
              slots={slots}
              players={players}
              activeWeek={activeWeek}
              onSlotClick={handleSlotClick}
              onRemovePlayer={handleRemovePlayer}
            />
          </div>
        )}

        {activeView === 'fixtures' && (
          <div className="animate-fadeIn">
            <UpcomingFixturesMatrix
              players={players}
              slots={slots}
              activeWeek={activeWeek}
            />
          </div>
        )}

        {players.length === 0 && (
          <div className="text-center py-16 space-y-4">
            <div className="w-20 h-20 mx-auto bg-purple-900/30 rounded-full flex items-center justify-center">
              <Shield className="w-10 h-10 text-purple-400" />
            </div>
            <h2 className="text-xl font-bold text-slate-200">Your squad is empty</h2>
            <p className="text-slate-500 max-w-sm mx-auto text-sm">Start building your Premier Fantasy team. Add players from the 2026/27 EPL library, set your formation, and track fixture difficulty ratings across all 38 gameweeks.</p>
            <button onClick={() => setShowAddPlayer(true)} className="inline-flex items-center space-x-2 px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-purple-500/25">
              <Plus className="w-4 h-4" />
              <span>Add Your First Player</span>
            </button>
          </div>
        )}
      </main>

      {showAddPlayer && (
        <AddPlayerModal
          existingPlayers={players}
          libraryPlayers={catalog.library}
          teams={catalog.teams}
          onAddPlayer={handleAddCustom}
          onAddPreset={handleAddPreset}
          onClose={() => setShowAddPlayer(false)}
        />
      )}
      {assignSlot && (
        <SlotAssignModal
          slot={assignSlot}
          players={players}
          slots={slots}
          onAssign={handleAssignPlayer}
          onClose={() => setAssignSlotId(null)}
        />
      )}
      {showFormation && (
        <FormationSettingsModal
          slots={slots}
          onClose={() => setShowFormation(false)}
          onSave={handleSaveFormation}
        />
      )}
    </div>
    </CatalogProvider>
  );
};

export default App;
