import React from 'react';
import { SlotConfiguration, Player } from '../types/fantasy';
import { Trophy, Users, Calendar, Settings, RefreshCw, LayoutList } from 'lucide-react';

type ViewType = 'pitch' | 'list' | 'fixtures';

interface NavbarProps {
  slots: SlotConfiguration[];
  players: Player[];
  activeWeek: number;
  activeView: ViewType;
  onWeekChange: (w: number) => void;
  onViewChange: (v: ViewType) => void;
  onFormationClick: () => void;
  onSyncSchedule: () => void;
  isSyncing?: boolean;
  lastSyncedAt?: string | null;
}

const Navbar: React.FC<NavbarProps> = ({
  slots, players, activeWeek, activeView, onWeekChange, onViewChange,
  onFormationClick, onSyncSchedule, isSyncing, lastSyncedAt,
}) => {
  const totalPlayers = players.length;
  const startersFilled = slots.filter(s => s.isStarter && s.playerId).length;
  const startersTotal = slots.filter(s => s.isStarter).length;
  const benchFilled = slots.filter(s => !s.isStarter && s.playerId).length;
  const benchTotal = slots.filter(s => !s.isStarter).length;

  const TOTAL_WEEKS = 38;

  return (
    <nav className="sticky top-0 z-50 bg-[#0d0c1a]/95 backdrop-blur-xl border-b border-purple-900/40 shadow-2xl">
      {/* Top bar */}
      <div className="px-4 py-3 flex items-center justify-between gap-4">
        {/* Logo */}
        <div className="flex items-center space-x-3 shrink-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-violet-800 flex items-center justify-center shadow-lg shadow-purple-500/30">
            <Trophy className="w-5 h-5 text-yellow-300" />
          </div>
          <div>
            <div className="font-display font-black text-base text-white leading-tight tracking-tight">
              Premier <span className="text-purple-400">Fantasy</span>
            </div>
            <div className="text-[9px] text-slate-500 uppercase font-bold tracking-widest">Manager · EPL</div>
          </div>
        </div>

        {/* Stat pills */}
        <div className="hidden md:flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
            <span className="text-slate-400">Squad </span>
            <span className="font-bold text-purple-300">{totalPlayers}</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
            <span className="text-slate-400">Starting XI </span>
            <span className={`font-bold ${startersFilled === startersTotal ? 'text-emerald-400' : 'text-yellow-400'}`}>{startersFilled}/{startersTotal}</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
            <span className="text-slate-400">Bench </span>
            <span className={`font-bold ${benchFilled === benchTotal ? 'text-emerald-400' : 'text-amber-400'}`}>{benchFilled}/{benchTotal}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onFormationClick}
            className="flex items-center space-x-1.5 px-3 py-2 bg-purple-700/30 border border-purple-600/40 text-purple-300 rounded-xl text-xs font-bold hover:bg-purple-700/50 transition-all"
          >
            <Settings className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Formation</span>
          </button>
          <button
            onClick={onSyncSchedule}
            disabled={isSyncing}
            title={lastSyncedAt ? `Last synced ${new Date(lastSyncedAt).toLocaleString()}` : 'Fetch latest 2026/27 squads and fixtures from FPL'}
            className="flex items-center space-x-1.5 px-3 py-2 bg-slate-900 border border-slate-700 text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-800 transition-all disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-purple-300' : ''}`} />
            <span className="hidden sm:inline">{isSyncing ? 'Syncing…' : 'Sync 2026/27 EPL'}</span>
          </button>
        </div>
      </div>

      {/* Matchweek selector + view tabs */}
      <div className="px-4 pb-3 flex items-center justify-between gap-4">
        {/* Matchweek */}
        <div className="flex items-center space-x-2">
          <Calendar className="w-4 h-4 text-purple-400 shrink-0" />
          <span className="text-xs text-slate-400 font-semibold shrink-0">GW</span>
          <div className="flex items-center space-x-1">
            <button
              onClick={() => onWeekChange(Math.max(1, activeWeek - 1))}
              className="w-6 h-6 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white text-xs font-bold transition-colors"
            >‹</button>
            <div className="flex gap-0.5 overflow-x-auto max-w-xs scrollbar-hide">
              {Array.from({ length: Math.min(TOTAL_WEEKS, 10) }, (_, i) => {
                const startW = Math.max(1, Math.min(activeWeek - 4, TOTAL_WEEKS - 9));
                const w = startW + i;
                return (
                  <button
                    key={w}
                    onClick={() => onWeekChange(w)}
                    className={`w-7 h-7 rounded-lg text-xs font-extrabold transition-all shrink-0 ${
                      w === activeWeek
                        ? 'bg-purple-600 text-white shadow shadow-purple-500/40'
                        : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    {w}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => onWeekChange(Math.min(TOTAL_WEEKS, activeWeek + 1))}
              className="w-6 h-6 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white text-xs font-bold transition-colors"
            >›</button>
          </div>
          <span className="text-[10px] text-slate-500 shrink-0">/ {TOTAL_WEEKS}</span>
        </div>

        {/* View tabs */}
        <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-xl">
          {([
            { id: 'pitch', label: 'Pitch', icon: <Users className="w-3.5 h-3.5" /> },
            { id: 'list', label: 'Squad', icon: <LayoutList className="w-3.5 h-3.5" /> },
            { id: 'fixtures', label: 'Fixtures', icon: <Calendar className="w-3.5 h-3.5" /> },
          ] as { id: ViewType; label: string; icon: React.ReactNode }[]).map(v => (
            <button
              key={v.id}
              onClick={() => onViewChange(v.id)}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeView === v.id
                  ? 'bg-purple-600 text-white shadow shadow-purple-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {v.icon}
              <span className="hidden sm:inline">{v.label}</span>
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
