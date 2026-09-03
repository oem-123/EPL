import React from 'react';
import { Player, SlotConfiguration } from '../types/fantasy';
import { useEplTeams } from '../context/CatalogContext';
import { UserPlus } from 'lucide-react';

interface SoccerPitchProps {
  slots: SlotConfiguration[];
  players: Player[];
  activeWeek: number;
  onSlotClick: (slotId: string) => void;
}

const SoccerPitch: React.FC<SoccerPitchProps> = ({ slots, players, activeWeek, onSlotClick }) => {
  const EPL_TEAMS = useEplTeams();
  const starterSlots = slots.filter(s => s.isStarter);
  const gkSlots = starterSlots.filter(s => s.allowedPositions.includes('GK'));
  const defSlots = starterSlots.filter(s => s.allowedPositions.includes('DEF') && !s.allowedPositions.includes('MID') && !s.allowedPositions.includes('GK'));
  const midSlots = starterSlots.filter(s => s.allowedPositions.includes('MID') && !s.allowedPositions.includes('FWD') && !s.allowedPositions.includes('GK'));
  const fwdSlots = starterSlots.filter(s => s.allowedPositions.includes('FWD') && !s.allowedPositions.includes('DEF'));

  const getPlayer = (slot: SlotConfiguration): Player | null =>
    slot.playerId ? players.find(p => p.id === slot.playerId) ?? null : null;

  const renderRow = (rowSlots: SlotConfiguration[], label: string, accent: string) => (
    <div className="flex justify-center items-center gap-3 w-full">
      {rowSlots.map(slot => {
        const player = getPlayer(slot);
        const teamInfo = player ? EPL_TEAMS[player.team] : null;
        const fixture = player ? player.fixtures[activeWeek] : null;
        return (
          <div
            key={slot.id}
            onClick={() => onSlotClick(slot.id)}
            className="flex flex-col items-center gap-1 cursor-pointer group"
            style={{ minWidth: 72 }}
          >
            {/* Player token */}
            <div className="relative">
              <div
                className={`w-14 h-14 rounded-full border-2 flex items-center justify-center font-extrabold text-sm shadow-lg transition-all duration-200 group-hover:scale-110 group-hover:shadow-purple-500/40 group-hover:shadow-xl ${
                  player ? 'border-white/30' : 'border-dashed border-purple-500/50 bg-slate-900/60'
                }`}
                style={player && teamInfo ? {
                  backgroundColor: teamInfo.primaryColor,
                  color: teamInfo.secondaryColor,
                  boxShadow: `0 4px 20px ${teamInfo.primaryColor}55`,
                } : { backgroundColor: '#1e1b33' }}
              >
                {player ? (
                  <span className="text-[10px] font-black">{player.team}</span>
                ) : (
                  <UserPlus className="w-5 h-5 text-purple-400/60" />
                )}
              </div>
              {/* FDR badge */}
              {fixture && !fixture.isBlankGameweek && (
                <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black border border-slate-900 fdr-${fixture.fdr}`}>
                  {fixture.fdr}
                </div>
              )}
              {fixture?.isBlankGameweek && (
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-slate-700 border border-slate-900 flex items-center justify-center text-[8px] font-black text-slate-400">
                  BGW
                </div>
              )}
            </div>
            {/* Name */}
            <div className="text-center max-w-[72px]">
              <div className="text-white font-bold text-[9px] leading-tight truncate max-w-full drop-shadow">
                {player ? player.name.split(' ').pop() : slot.label}
              </div>
              {player && fixture && (
                <div className="text-[8px] text-slate-400 truncate">
                  {fixture.isHome ? 'vs' : '@'} {fixture.opponent}
                </div>
              )}
              {/* Pos label */}
              <div className={`text-[7px] font-extrabold uppercase mt-0.5 ${accent}`}>
                {label}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="relative w-full max-w-3xl mx-auto rounded-2xl overflow-hidden shadow-2xl" style={{ minHeight: 520 }}>
      {/* Pitch background */}
      <div className="absolute inset-0 pitch-grass" />
      {/* Pitch markings */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 600 520" preserveAspectRatio="xMidYMid meet">
        {/* Outline */}
        <rect x="20" y="10" width="560" height="500" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="1.5" rx="4"/>
        {/* Halfway line */}
        <line x1="20" y1="260" x2="580" y2="260" stroke="rgba(255,255,255,0.18)" strokeWidth="1.5"/>
        {/* Centre circle */}
        <circle cx="300" cy="260" r="60" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="1.5"/>
        <circle cx="300" cy="260" r="3" fill="rgba(255,255,255,0.35)"/>
        {/* Top penalty area */}
        <rect x="150" y="10" width="300" height="100" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.2"/>
        <rect x="210" y="10" width="180" height="55" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1"/>
        <circle cx="300" cy="85" r="4" fill="rgba(255,255,255,0.3)"/>
        {/* Bottom penalty area */}
        <rect x="150" y="410" width="300" height="100" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.2"/>
        <rect x="210" y="455" width="180" height="55" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1"/>
        <circle cx="300" cy="435" r="4" fill="rgba(255,255,255,0.3)"/>
        {/* Goals */}
        <rect x="245" y="10" width="110" height="14" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5"/>
        <rect x="245" y="496" width="110" height="14" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5"/>
        {/* Corner arcs */}
        <path d="M20,10 A15,15 0 0,1 35,25" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1"/>
        <path d="M580,10 A15,15 0 0,0 565,25" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1"/>
        <path d="M20,510 A15,15 0 0,0 35,495" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1"/>
        <path d="M580,510 A15,15 0 0,1 565,495" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1"/>
        {/* Stripe bands */}
        {[0,60,120,180,240,300,360,420,480].map((y,i) => (
          <rect key={i} x="20" y={y+10} width="560" height="60" fill={i%2===0?"rgba(0,0,0,0.04)":"transparent"}/>
        ))}
      </svg>

      {/* Player rows */}
      <div className="relative z-10 flex flex-col justify-between py-6 px-4 h-full" style={{ minHeight: 520 }}>
        {fwdSlots.length > 0 && (
          <div className="mb-2">{renderRow(fwdSlots, 'ATT', 'text-rose-400')}</div>
        )}
        {midSlots.length > 0 && (
          <div className="my-2">{renderRow(midSlots, 'MID', 'text-yellow-400')}</div>
        )}
        <div className="my-2 flex-1 flex items-center justify-center">
          {/* empty midfield zone */}
        </div>
        {defSlots.length > 0 && (
          <div className="my-2">{renderRow(defSlots, 'DEF', 'text-blue-300')}</div>
        )}
        {gkSlots.length > 0 && (
          <div className="mt-2">{renderRow(gkSlots, 'GK', 'text-purple-300')}</div>
        )}
      </div>
    </div>
  );
};

export default SoccerPitch;
