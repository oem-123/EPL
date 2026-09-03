import React, { useState, useEffect, useRef } from 'react';
import { Player, SlotConfiguration, Position } from '../types/fantasy';
import { useEplTeams } from '../context/CatalogContext';
import { Search, X, UserPlus } from 'lucide-react';

interface SlotAssignModalProps {
  slot: SlotConfiguration;
  players: Player[];
  slots: SlotConfiguration[];
  onAssign: (slotId: string, playerId: string) => void;
  onClose: () => void;
}

const posColors: Record<string, string> = {
  GK: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
  DEF: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
  MID: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40',
  FWD: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
};

const SlotAssignModal: React.FC<SlotAssignModalProps> = ({ slot, players, slots, onAssign, onClose }) => {
  const EPL_TEAMS = useEplTeams();
  const [search, setSearch] = useState('');
  const [posFilter, setPosFilter] = useState<string>('ALL');
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => { searchRef.current?.focus(); }, []);

  const allowedPos = slot.allowedPositions;
  const multiPos = allowedPos.length > 1;
  const alreadyAssigned = new Set(slots.filter(s => s.id !== slot.id && s.playerId).map(s => s.playerId!));

  const eligible = players.filter(p => {
    if (!allowedPos.includes(p.position)) return false;
    if (alreadyAssigned.has(p.id)) return false;
    if (posFilter !== 'ALL' && p.position !== posFilter) return false;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      if (!p.name.toLowerCase().includes(q) && !p.team.toLowerCase().includes(q) && !p.position.toLowerCase().includes(q)) return false;
    }
    return true;
  }).sort((a, b) => b.projectedAvgPts - a.projectedAvgPts);

  const teamInfo = (code: string) => EPL_TEAMS[code];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#111128] border border-purple-900/40 rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <div>
            <div className="text-xs text-purple-400 font-extrabold uppercase tracking-wider">{slot.label}</div>
            <h2 className="font-bold text-white text-base">Assign Player</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
        </div>

        {/* Search */}
        <div className="px-5 py-3 border-b border-slate-800 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, club..."
              className="w-full pl-9 pr-9 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          {multiPos && (
            <div className="flex items-center gap-2">
              {['ALL', ...allowedPos].map(p => (
                <button
                  key={p}
                  onClick={() => setPosFilter(p)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all ${
                    posFilter === p
                      ? 'bg-purple-600 border-purple-500 text-white'
                      : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
                  }`}
                >
                  {p}
                </button>
              ))}
              <span className="text-xs text-slate-500 ml-auto">{eligible.length} players</span>
            </div>
          )}
        </div>

        {/* Player list */}
        <div className="overflow-y-auto flex-1 divide-y divide-slate-800/50">
          {eligible.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-sm">No eligible players found</div>
          ) : eligible.map(p => {
            const ti = teamInfo(p.team);
            return (
              <button
                key={p.id}
                onClick={() => { onAssign(slot.id, p.id); onClose(); }}
                className="w-full flex items-center gap-3 px-5 py-3 hover:bg-purple-900/20 transition-colors text-left"
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-[10px] font-black shrink-0 shadow"
                  style={{ backgroundColor: ti?.primaryColor || '#334155', color: ti?.secondaryColor || '#fff' }}
                >
                  {p.team.substring(0,3)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-slate-100 text-sm truncate">{p.name}</div>
                  <div className="text-xs text-slate-500">{ti?.name ?? p.team}</div>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-lg border font-extrabold ${posColors[p.position] || ''}`}>{p.position}</span>
                <div className="text-right shrink-0">
                  <div className="text-xs font-bold text-yellow-400">£{p.price}m</div>
                  <div className="text-[10px] text-slate-400">{p.projectedAvgPts} avg pts</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SlotAssignModal;
