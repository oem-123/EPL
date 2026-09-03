import React, { useState } from 'react';
import { Player, SlotConfiguration, MatchupRating, FDRRating } from '../types/fantasy';
import { useEplTeams } from '../context/CatalogContext';
import { Calendar, Filter, Clock, Check } from 'lucide-react';

interface UpcomingFixturesMatrixProps {
  players: Player[];
  slots: SlotConfiguration[];
  activeWeek: number;
}

const FDR_STYLES: Record<number, string> = {
  1: 'fdr-1',
  2: 'fdr-2',
  3: 'fdr-3',
  4: 'fdr-4',
  5: 'fdr-5',
};

const UpcomingFixturesMatrix: React.FC<UpcomingFixturesMatrixProps> = ({ players, slots, activeWeek }) => {
  const EPL_TEAMS = useEplTeams();
  const [selectedPosFilter, setSelectedPosFilter] = useState<string>('ALL');
  const [showStarters, setShowStarters] = useState<boolean>(true);
  const [showBench, setShowBench] = useState<boolean>(true);
  const [weekRange, setWeekRange] = useState<'1-10' | '11-20' | '21-30' | '31-38' | 'all'>('1-10');

  const starterCount = React.useMemo(() => slots.filter(s => s.isStarter && s.playerId).length, [slots]);
  const benchCount = React.useMemo(() => slots.filter(s => !s.isStarter && s.playerId).length, [slots]);

  const weeks = React.useMemo(() => {
    if (weekRange === '1-10') return Array.from({ length: 10 }, (_, i) => i + 1);
    if (weekRange === '11-20') return Array.from({ length: 10 }, (_, i) => i + 11);
    if (weekRange === '21-30') return Array.from({ length: 10 }, (_, i) => i + 21);
    if (weekRange === '31-38') return Array.from({ length: 8 }, (_, i) => i + 31);
    return Array.from({ length: 38 }, (_, i) => i + 1);
  }, [weekRange]);

  const filteredPlayers = players.filter(player => {
    if (selectedPosFilter !== 'ALL' && player.position !== selectedPosFilter) return false;
    const slot = slots.find(s => s.playerId === player.id);
    if (!slot) return false;
    if (slot.isStarter && !showStarters) return false;
    if (!slot.isStarter && !showBench) return false;
    return true;
  });

  const sortedPlayers = React.useMemo(() => {
    return [...filteredPlayers].sort((a, b) => {
      const ia = slots.findIndex(s => s.playerId === a.id);
      const ib = slots.findIndex(s => s.playerId === b.id);
      if (ia !== -1 && ib !== -1) return ia - ib;
      if (ia !== -1) return -1;
      if (ib !== -1) return 1;
      const posOrder: Record<string,number> = {GK:1,DEF:2,MID:3,FWD:4};
      const pa = posOrder[a.position] ?? 9;
      const pb = posOrder[b.position] ?? 9;
      if (pa !== pb) return pa - pb;
      return b.projectedAvgPts - a.projectedAvgPts;
    });
  }, [filteredPlayers, slots]);

  const getSlotInfo = (playerId: string) => {
    const slot = slots.find(s => s.playerId === playerId);
    if (!slot) return null;
    return { label: slot.label, isStarter: slot.isStarter };
  };

  const RANGES = ['1-10','11-20','21-30','31-38','all'] as const;

  return (
    <div className="w-full max-w-full space-y-4 animate-fadeIn">
      {/* Week range selector */}
      <div className="flex justify-end">
        <div className="flex items-center space-x-1 bg-slate-900 border border-slate-800 p-1 rounded-xl">
          {RANGES.map(r => (
            <button
              key={r}
              onClick={() => setWeekRange(r)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                weekRange === r
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {r === 'all' ? 'All 38' : `GW ${r}`}
            </button>
          ))}
        </div>
      </div>

      {/* Header card with filters */}
      <div className="bg-[#111128] rounded-2xl border border-purple-900/30 p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-purple-400" />
            <h2 className="text-xl font-bold text-slate-100">Fixture Difficulty Rating Matrix</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            2026/27 EPL schedule with official FDR ratings (1 = Very Easy → 5 = Very Hard)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Position filter */}
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            {['ALL','GK','DEF','MID','FWD'].map(pos => (
              <button
                key={pos}
                onClick={() => setSelectedPosFilter(pos)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  selectedPosFilter === pos
                    ? 'bg-purple-500 text-white shadow-md shadow-purple-500/20'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {pos}
              </button>
            ))}
          </div>

          {/* Starter/Bench multi-select */}
          <div className="flex items-center space-x-1 bg-slate-900 border border-slate-800 p-1 rounded-xl">
            <button onClick={() => { setShowStarters(true); setShowBench(true); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${showStarters && showBench ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}>
              All ({starterCount + benchCount})
            </button>
            <button onClick={() => setShowStarters(!showStarters)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-all ${showStarters ? 'bg-purple-500 text-white shadow-md shadow-purple-500/20' : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'}`}>
              {showStarters && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              <span>Starters ({starterCount})</span>
            </button>
            <button onClick={() => setShowBench(!showBench)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-all ${showBench ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20' : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'}`}>
              {showBench && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              <span>Bench ({benchCount})</span>
            </button>
          </div>
        </div>
      </div>

      {/* FDR legend */}
      <div className="flex items-center gap-2 flex-wrap px-1">
        <span className="text-xs text-slate-500 font-semibold">FDR:</span>
        {[1,2,3,4,5].map(n => (
          <div key={n} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold fdr-${n}`}>
            <span>{n}</span>
            <span className="font-normal opacity-80">{['Very Easy','Easy','Medium','Hard','Very Hard'][n-1]}</span>
          </div>
        ))}
      </div>

      {/* Fixtures Table */}
      <div className="bg-[#111128] rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <th className="py-4 px-6 min-w-[200px]">Player & Club</th>
                <th className="py-4 px-3 text-center min-w-[110px]">Slot</th>
                {weeks.map(w => (
                  <th key={w} className={`py-4 px-3 text-center min-w-[100px] ${w === activeWeek ? 'bg-purple-950/40 text-purple-300 font-extrabold border-x border-purple-500/30' : ''}`}>
                    GW{w}{w === activeWeek ? ' ✦' : ''}
                  </th>
                ))}
                <th className="py-4 px-4 text-right">Avg Pts</th>
              </tr>
            </thead>
            <tbody>
              {sortedPlayers.length > 0 ? sortedPlayers.map(player => {
                const slotInfo = getSlotInfo(player.id);
                const ti = EPL_TEAMS[player.team];
                const validWeeks = weeks.map(w => player.fixtures[w]).filter(Boolean);
                const avgPts = validWeeks.length > 0
                  ? (validWeeks.reduce((sum, f) => sum + f.projectedPoints, 0) / validWeeks.length).toFixed(1)
                  : player.projectedAvgPts.toFixed(1);

                return (
                  <tr key={player.id} className="border-b border-slate-800/60 hover:bg-purple-900/10 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs text-white shadow shrink-0"
                          style={{ backgroundColor: ti?.primaryColor || '#334155', color: ti?.secondaryColor || '#fff' }}>
                          {player.team}
                        </div>
                        <div className="truncate">
                          <div className="font-bold text-slate-100 text-sm truncate">
                            {player.name}
                            {player.isCustom && <span className="ml-1 text-[9px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-1 rounded">Custom</span>}
                          </div>
                          <div className="text-xs text-slate-400">
                            <span className="font-semibold text-slate-300">{ti?.shortName ?? player.team}</span>
                            <span className="mx-1">·</span>
                            <span className="text-yellow-400">£{player.price}m</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-3 text-center">
                      {slotInfo ? (
                        <div className="flex flex-col items-center">
                          <span className={`inline-block px-2 py-1 rounded-lg text-[10px] font-extrabold border ${slotInfo.isStarter ? 'bg-purple-500/20 border-purple-500/40 text-purple-300' : 'bg-amber-500/20 border-amber-500/40 text-amber-300'}`}>
                            {slotInfo.label}
                          </span>
                          <span className="text-[9px] text-slate-500 mt-0.5 uppercase">{slotInfo.isStarter ? 'Starter' : 'Bench'}</span>
                        </div>
                      ) : <span className="text-[10px] text-slate-600 italic">—</span>}
                    </td>
                    {weeks.map(w => {
                      const fx = player.fixtures[w];
                      const isActive = w === activeWeek;
                      return (
                        <td key={w} className={`py-3 px-2 text-center ${isActive ? 'bg-purple-950/20 border-x border-purple-500/20' : ''}`}>
                          {fx ? (
                            <div className="flex flex-col items-center gap-0.5">
                              {fx.isBlankGameweek ? (
                                <span className="inline-block px-2 py-1 rounded-lg text-[10px] font-bold border bg-slate-800 border-slate-700 text-slate-400">
                                  BGW
                                </span>
                              ) : (
                                <>
                                  <span className={`inline-block px-2 py-1 rounded-lg text-[10px] font-bold border fdr-${fx.fdr}`}>
                                    {fx.isDoubleGameweek ? 'DGW ' : ''}{fx.isHome ? 'vs' : '@'} {fx.opponent}
                                  </span>
                                  <span className="text-[9px] text-slate-500 flex items-center gap-0.5">
                                    <Clock className="w-2.5 h-2.5" />{fx.gameTime}
                                  </span>
                                  <span className="text-[9px] font-bold text-purple-300">{fx.projectedPoints}pts</span>
                                </>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-700 text-xs">BGW</span>
                          )}
                        </td>
                      );
                    })}
                    <td className="py-4 px-4 text-right font-extrabold text-sm text-purple-300">{avgPts} pts</td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={weeks.length + 3} className="py-12 text-center text-slate-500 text-sm">
                    No players found. Add players to your squad to view their fixture schedule!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UpcomingFixturesMatrix;
