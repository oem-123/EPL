import React, { useState } from 'react';
import { Player, Position, CustomPlayerPayload, EPLTeamInfo } from '../types/fantasy';
import { Search, X, Plus, ChevronLeft, ChevronRight, Star } from 'lucide-react';

interface AddPlayerModalProps {
  existingPlayers: Player[];
  libraryPlayers: Player[];
  teams: Record<string, EPLTeamInfo>;
  onAddPlayer: (payload: CustomPlayerPayload) => void;
  onAddPreset: (player: Player) => void;
  onClose: () => void;
}

const POSITIONS: Position[] = ['GK', 'DEF', 'MID', 'FWD'];
const PAGE_SIZE = 12;

const posColors: Record<string, string> = {
  GK: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
  DEF: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
  MID: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40',
  FWD: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
};

const AddPlayerModal: React.FC<AddPlayerModalProps> = ({
  existingPlayers, libraryPlayers, teams: EPL_TEAMS, onAddPlayer, onAddPreset, onClose,
}) => {
  const TEAM_CODES = Object.keys(EPL_TEAMS).sort();
  const [tab, setTab] = useState<'preset' | 'custom'>('preset');
  const [search, setSearch] = useState('');
  const [posFilter, setPosFilter] = useState<string>('ALL');
  const [teamFilter, setTeamFilter] = useState<string>('ALL');
  const [page, setPage] = useState(0);

  // Custom form
  const [customName, setCustomName] = useState('');
  const [customPos, setCustomPos] = useState<Position>('MID');
  const [customTeam, setCustomTeam] = useState('MCI');
  const [customPrice, setCustomPrice] = useState(6.0);
  const [customAvg, setCustomAvg] = useState(6.0);
  const [customNotes, setCustomNotes] = useState('');

  const existingIds = new Set(existingPlayers.map(p => p.id));

  const filtered = libraryPlayers.filter(p => {
    if (existingIds.has(p.id)) return false;
    if (posFilter !== 'ALL' && p.position !== posFilter) return false;
    if (teamFilter !== 'ALL' && p.team !== teamFilter) return false;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      if (!p.name.toLowerCase().includes(q) && !p.team.toLowerCase().includes(q)) return false;
    }
    return true;
  }).sort((a, b) => b.projectedAvgPts - a.projectedAvgPts);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const visible = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const resetFilters = () => { setSearch(''); setPosFilter('ALL'); setTeamFilter('ALL'); setPage(0); };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#111128] border border-purple-900/40 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 shrink-0">
          <h2 className="text-lg font-bold text-white flex items-center space-x-2">
            <Plus className="w-5 h-5 text-purple-400" />
            <span>Add Player to Squad</span>
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        {/* Tabs */}
        <div className="flex shrink-0 border-b border-slate-800">
          {(['preset', 'custom'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-3 text-sm font-bold transition-all ${
                tab === t
                  ? 'text-purple-300 border-b-2 border-purple-500 bg-purple-900/10'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {t === 'preset' ? `EPL Player Library (${libraryPlayers.length - existingIds.size})` : 'Custom Player'}
            </button>
          ))}
        </div>

        {tab === 'preset' ? (
          <>
            {/* Filters */}
            <div className="p-4 border-b border-slate-800 space-y-3 shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={search}
                  onChange={e => { setSearch(e.target.value); setPage(0); }}
                  placeholder="Search players..."
                  className="w-full pl-9 pr-9 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
                />
                {search && <button onClick={resetFilters} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"><X className="w-3.5 h-3.5" /></button>}
              </div>
              <div className="flex flex-wrap gap-2">
                {['ALL', ...POSITIONS].map(p => (
                  <button key={p} onClick={() => { setPosFilter(p); setPage(0); }}
                    className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all ${
                      posFilter === p ? 'bg-purple-600 border-purple-500 text-white' : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
                    }`}>{p}</button>
                ))}
                <div className="ml-auto">
                  <select
                    value={teamFilter}
                    onChange={e => { setTeamFilter(e.target.value); setPage(0); }}
                    className="bg-slate-900 border border-slate-700 text-slate-300 text-xs rounded-lg px-2 py-1 focus:outline-none focus:border-purple-500"
                  >
                    <option value="ALL">All Clubs</option>
                    {TEAM_CODES.map(c => <option key={c} value={c}>{EPL_TEAMS[c]?.shortName ?? c}</option>)}
                  </select>
                </div>
              </div>
              <div className="text-xs text-slate-500">{filtered.length} players available</div>
            </div>

            {/* Player grid */}
            <div className="overflow-y-auto flex-1 p-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
              {visible.map(p => {
                const ti = EPL_TEAMS[p.team];
                return (
                  <button
                    key={p.id}
                    onClick={() => { onAddPreset(p); onClose(); }}
                    className="bg-slate-900/80 border border-slate-800 hover:border-purple-500/50 rounded-xl p-3 text-left transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-purple-500/10 group"
                  >
                    <div className="flex items-center space-x-2 mb-2">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-[9px] font-black shrink-0 shadow"
                        style={{ backgroundColor: ti?.primaryColor || '#334155', color: ti?.secondaryColor || '#fff' }}
                      >
                        {p.team}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-slate-100 text-xs truncate group-hover:text-white">{p.name}</div>
                        <div className="text-[10px] text-slate-500 truncate">{ti?.shortName ?? p.team}</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded border font-bold ${posColors[p.position]}`}>{p.position}</span>
                      <div className="text-right">
                        <div className="text-yellow-400 text-xs font-bold">£{p.price}m</div>
                        <div className="flex items-center space-x-1">
                          <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
                          <span className="text-[10px] text-slate-400">{p.projectedAvgPts}</span>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
              {visible.length === 0 && (
                <div className="col-span-3 py-12 text-center text-slate-500 text-sm">No players match your filters.</div>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="shrink-0 flex items-center justify-center gap-3 p-4 border-t border-slate-800">
                <button onClick={() => setPage(p => Math.max(0, p-1))} disabled={page === 0} className="p-1.5 rounded-lg bg-slate-800 disabled:opacity-30 hover:bg-slate-700 transition-all">
                  <ChevronLeft className="w-4 h-4 text-slate-400" />
                </button>
                <span className="text-xs text-slate-400 font-semibold">Page {page+1} / {totalPages}</span>
                <button onClick={() => setPage(p => Math.min(totalPages-1, p+1))} disabled={page === totalPages-1} className="p-1.5 rounded-lg bg-slate-800 disabled:opacity-30 hover:bg-slate-700 transition-all">
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="overflow-y-auto flex-1 p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-xs text-slate-400 font-semibold block mb-1">Player Name *</label>
                <input value={customName} onChange={e => setCustomName(e.target.value)} placeholder="e.g. Erling Haaland" className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500" />
              </div>
              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-1">Position</label>
                <div className="flex gap-2">
                  {POSITIONS.map(p => (
                    <button key={p} onClick={() => setCustomPos(p)} className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all ${customPos === p ? 'bg-purple-600 border-purple-500 text-white' : 'bg-slate-900 border-slate-700 text-slate-400'}`}>{p}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-1">Club</label>
                <select value={customTeam} onChange={e => setCustomTeam(e.target.value)} className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-300 focus:outline-none focus:border-purple-500">
                  {TEAM_CODES.map(c => <option key={c} value={c}>{EPL_TEAMS[c]?.shortName ?? c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-1">FPL Price (£m)</label>
                <input type="number" step="0.5" min="3.5" max="15" value={customPrice} onChange={e => setCustomPrice(Number(e.target.value))} className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-purple-500" />
              </div>
              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-1">Projected Avg Pts/GW</label>
                <input type="number" step="0.5" min="0" max="20" value={customAvg} onChange={e => setCustomAvg(Number(e.target.value))} className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-purple-500" />
              </div>
              <div className="col-span-2">
                <label className="text-xs text-slate-400 font-semibold block mb-1">Notes (optional)</label>
                <textarea value={customNotes} onChange={e => setCustomNotes(e.target.value)} placeholder="e.g. Key penalty taker, rotation risk..." rows={2} className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 resize-none" />
              </div>
            </div>
            <button
              disabled={!customName.trim()}
              onClick={() => {
                onAddPlayer({ name: customName.trim(), position: customPos, team: customTeam, price: customPrice, projectedAvgPts: customAvg, notes: customNotes });
                onClose();
              }}
              className="w-full py-3 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl text-sm transition-all"
            >
              Add Custom Player
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddPlayerModal;
