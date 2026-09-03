import React from 'react';
import { Player, SlotConfiguration } from '../types/fantasy';
import { useEplTeams } from '../context/CatalogContext';
import { UserPlus, X, ArrowLeftRight } from 'lucide-react';

interface LineupManagerProps {
  slots: SlotConfiguration[];
  players: Player[];
  activeWeek: number;
  onSlotClick: (slotId: string) => void;
  onRemovePlayer: (slotId: string) => void;
}

const posColors: Record<string, string> = {
  GK: 'text-purple-300 bg-purple-900/30 border-purple-700/40',
  DEF: 'text-blue-300 bg-blue-900/30 border-blue-700/40',
  MID: 'text-yellow-300 bg-yellow-900/30 border-yellow-700/40',
  FWD: 'text-rose-300 bg-rose-900/30 border-rose-700/40',
};

const SlotRow: React.FC<{
  slot: SlotConfiguration;
  player: Player | null;
  activeWeek: number;
  onSlotClick: (id: string) => void;
  onRemove: (id: string) => void;
}> = ({ slot, player, activeWeek, onSlotClick, onRemove }) => {
  const EPL_TEAMS = useEplTeams();
  const teamInfo = player ? EPL_TEAMS[player.team] : null;
  const fixture = player ? player.fixtures[activeWeek] : null;
  const posStyle = player ? posColors[player.position] || '' : '';

  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl border transition-all hover:bg-slate-800/40 ${
      player ? 'bg-[#111128] border-slate-800/60' : 'bg-slate-900/40 border-dashed border-slate-700/50'
    }`}>
      {/* Slot label */}
      <div className="w-16 shrink-0">
        <span className="text-[10px] font-extrabold text-slate-500 uppercase">{slot.label}</span>
      </div>

      {player ? (
        <>
          {/* Team badge dot */}
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[9px] font-black text-white shrink-0 shadow"
            style={{ backgroundColor: teamInfo?.primaryColor || '#334155', color: teamInfo?.secondaryColor || '#fff' }}
          >
            {player.team.substring(0,3)}
          </div>
          {/* Name & team */}
          <div className="flex-1 min-w-0">
            <div className="font-bold text-slate-100 text-sm truncate">{player.name}</div>
            <div className="text-xs text-slate-500 truncate">{teamInfo?.name ?? player.team}</div>
          </div>
          {/* Position badge */}
          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-lg border uppercase ${posStyle}`}>
            {player.position}
          </span>
          {/* Price */}
          <div className="text-xs font-bold text-yellow-400 shrink-0">£{player.price}m</div>
          {/* Fixture */}
          {fixture && (
            <div className="text-right shrink-0">
              <span className={`inline-block text-[9px] font-extrabold px-2 py-0.5 rounded-lg border fdr-${fixture.fdr}`}>
                {fixture.isHome ? 'vs' : '@'} {fixture.opponent}
              </span>
              <div className="text-[9px] text-slate-400 mt-0.5">{fixture.projectedPoints}pts</div>
            </div>
          )}
          {/* Actions */}
          <div className="flex items-center space-x-1 shrink-0">
            <button onClick={() => onSlotClick(slot.id)} className="p-1.5 rounded-lg bg-slate-800 hover:bg-purple-700/40 text-slate-400 hover:text-purple-300 transition-all" title="Change player">
              <ArrowLeftRight className="w-3 h-3" />
            </button>
            <button onClick={() => onRemove(slot.id)} className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-700/40 text-slate-400 hover:text-rose-400 transition-all" title="Remove player">
              <X className="w-3 h-3" />
            </button>
          </div>
        </>
      ) : (
        <button
          onClick={() => onSlotClick(slot.id)}
          className="flex-1 flex items-center space-x-2 text-slate-500 hover:text-purple-400 transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          <span className="text-xs font-semibold">Assign player</span>
        </button>
      )}
    </div>
  );
};

const LineupManager: React.FC<LineupManagerProps> = ({ slots, players, activeWeek, onSlotClick, onRemovePlayer }) => {
  const starterSlots = slots.filter(s => s.isStarter);
  const benchSlots = slots.filter(s => !s.isStarter);
  const getPlayer = (slot: SlotConfiguration) =>
    slot.playerId ? players.find(p => p.id === slot.playerId) ?? null : null;

  const section = (title: string, rows: SlotConfiguration[], accent: string) => (
    <div className="mb-6">
      <h3 className={`text-xs font-extrabold uppercase tracking-widest mb-3 ${accent}`}>{title}</h3>
      <div className="space-y-2">
        {rows.map(slot => (
          <SlotRow key={slot.id} slot={slot} player={getPlayer(slot)} activeWeek={activeWeek} onSlotClick={onSlotClick} onRemove={onRemovePlayer} />
        ))}
      </div>
    </div>
  );

  return (
    <div className="w-full max-w-3xl mx-auto animate-fadeIn">
      {section('Starting XI', starterSlots, 'text-purple-400')}
      {section('Bench', benchSlots, 'text-amber-400')}
    </div>
  );
};

export default LineupManager;
