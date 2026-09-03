import React, { useState } from 'react';
import { SlotConfiguration, Position } from '../types/fantasy';
import { Settings, X, Check, Zap } from 'lucide-react';

interface FormationSettingsModalProps {
  slots: SlotConfiguration[];
  onClose: () => void;
  onSave: (newSlots: SlotConfiguration[]) => void;
}

interface Formation {
  name: string;
  label: string;
  gk: number; def: number; mid: number; fwd: number; bench: number;
}

const PRESETS: Formation[] = [
  { name: '4-4-2',    label: 'Classic',      gk:1, def:4, mid:4, fwd:2, bench:4 },
  { name: '4-3-3',    label: 'Attacking',    gk:1, def:4, mid:3, fwd:3, bench:4 },
  { name: '3-5-2',    label: 'Wing Heavy',   gk:1, def:3, mid:5, fwd:2, bench:4 },
  { name: '4-2-3-1',  label: 'Modern',       gk:1, def:4, mid:5, fwd:1, bench:4 },
  { name: '5-3-2',    label: 'Defensive',    gk:1, def:5, mid:3, fwd:2, bench:4 },
  { name: '5-4-1',    label: 'Ultra Def',    gk:1, def:5, mid:4, fwd:1, bench:4 },
  { name: '4-5-1',    label: 'Midfield',     gk:1, def:4, mid:5, fwd:1, bench:4 },
  { name: '3-4-3',    label: 'Ultra Attack', gk:1, def:3, mid:4, fwd:3, bench:4 },
];

function buildSlots(cfg: { gk: number; def: number; mid: number; fwd: number; bench: number }, old: SlotConfiguration[]): SlotConfiguration[] {
  const slots: SlotConfiguration[] = [];
  const getOldPlayer = (label: string) => old.find(s => s.label === label)?.playerId ?? null;

  for (let i = 0; i < cfg.gk; i++) {
    const lbl = i === 0 ? 'GK' : `GK ${i+1}`;
    slots.push({ id: `gk_${i+1}`, label: lbl, allowedPositions: ['GK'], isStarter: true, playerId: getOldPlayer(lbl) });
  }
  for (let i = 0; i < cfg.def; i++) {
    const lbl = cfg.def === 1 ? 'DEF' : `DEF ${i+1}`;
    slots.push({ id: `def_${i+1}`, label: lbl, allowedPositions: ['DEF'], isStarter: true, playerId: getOldPlayer(lbl) });
  }
  for (let i = 0; i < cfg.mid; i++) {
    const lbl = cfg.mid === 1 ? 'MID' : `MID ${i+1}`;
    slots.push({ id: `mid_${i+1}`, label: lbl, allowedPositions: ['MID'], isStarter: true, playerId: getOldPlayer(lbl) });
  }
  for (let i = 0; i < cfg.fwd; i++) {
    const lbl = cfg.fwd === 1 ? 'FWD' : `FWD ${i+1}`;
    slots.push({ id: `fwd_${i+1}`, label: lbl, allowedPositions: ['FWD'], isStarter: true, playerId: getOldPlayer(lbl) });
  }
  for (let i = 0; i < cfg.bench; i++) {
    const lbl = `BENCH ${i+1}`;
    slots.push({ id: `bench_${i+1}`, label: lbl, allowedPositions: ['GK','DEF','MID','FWD'], isStarter: false, playerId: getOldPlayer(lbl) });
  }
  return slots;
}

const Stepper = ({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (v: number) => void }) => (
  <div className="flex items-center justify-between py-3 border-b border-slate-800/60">
    <span className="text-sm font-bold text-slate-200">{label}</span>
    <div className="flex items-center space-x-2">
      <button
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-white font-bold text-lg flex items-center justify-center transition-all"
      >−</button>
      <span className="w-10 text-center font-extrabold text-purple-300 text-lg">{value}</span>
      <button
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        className="w-8 h-8 rounded-lg bg-purple-700 hover:bg-purple-600 disabled:opacity-30 disabled:cursor-not-allowed text-white font-bold text-lg flex items-center justify-center transition-all"
      >+</button>
    </div>
  </div>
);

const FormationSettingsModal: React.FC<FormationSettingsModalProps> = ({ slots, onClose, onSave }) => {
  const [gk, setGk] = useState(slots.filter(s => s.isStarter && s.allowedPositions.includes('GK')).length || 1);
  const [def, setDef] = useState(slots.filter(s => s.isStarter && s.allowedPositions.includes('DEF') && !s.allowedPositions.includes('MID')).length || 4);
  const [mid, setMid] = useState(slots.filter(s => s.isStarter && s.allowedPositions.includes('MID') && !s.allowedPositions.includes('FWD')).length || 4);
  const [fwd, setFwd] = useState(slots.filter(s => s.isStarter && s.allowedPositions.includes('FWD') && !s.allowedPositions.includes('DEF')).length || 2);
  const [bench, setBench] = useState(slots.filter(s => !s.isStarter).length || 4);

  const totalStarters = gk + def + mid + fwd;
  const validStarters = totalStarters === 11;

  const applyPreset = (p: Formation) => {
    setGk(p.gk); setDef(p.def); setMid(p.mid); setFwd(p.fwd); setBench(p.bench);
  };

  const handleSave = () => {
    if (!validStarters) return;
    onSave(buildSlots({ gk, def, mid, fwd, bench }, slots));
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#111128] border border-purple-900/50 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <Settings className="w-5 h-5 text-purple-400" />
            <h2 className="text-lg font-bold text-white">Formation Settings</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-6 space-y-6">
          {/* Preset formation buttons */}
          <div>
            <div className="flex items-center space-x-2 mb-3">
              <Zap className="w-4 h-4 text-yellow-400" />
              <span className="text-sm font-bold text-slate-300">Quick Presets</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {PRESETS.map(p => (
                <button
                  key={p.name}
                  onClick={() => applyPreset(p)}
                  className={`p-3 rounded-xl border text-center transition-all hover:scale-[1.02] ${
                    gk===p.gk && def===p.def && mid===p.mid && fwd===p.fwd
                      ? 'bg-purple-600/30 border-purple-500/60 text-purple-200'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-purple-600/50'
                  }`}
                >
                  <div className="font-extrabold text-base">{p.name}</div>
                  <div className="text-[9px] uppercase text-slate-500 mt-0.5">{p.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Manual sliders */}
          <div>
            <div className="text-sm font-bold text-slate-300 mb-3">Manual Adjustment</div>
            <Stepper label="Goalkeepers (GK)" value={gk} min={1} max={1} onChange={setGk} />
            <Stepper label="Defenders (DEF)" value={def} min={3} max={5} onChange={setDef} />
            <Stepper label="Midfielders (MID)" value={mid} min={2} max={5} onChange={setMid} />
            <Stepper label="Forwards (FWD)" value={fwd} min={1} max={3} onChange={setFwd} />
            <Stepper label="Bench Players" value={bench} min={1} max={6} onChange={setBench} />
          </div>

          {/* Validation */}
          <div className={`flex items-center justify-between p-4 rounded-xl border ${validStarters ? 'bg-emerald-900/20 border-emerald-600/30' : 'bg-rose-900/20 border-rose-600/30'}`}>
            <div>
              <div className={`text-sm font-bold ${validStarters ? 'text-emerald-300' : 'text-rose-300'}`}>
                Starting XI: {totalStarters}/11
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                Formation: {gk === 1 ? '' : gk+'-'}{def}-{mid}-{fwd}
              </div>
            </div>
            {validStarters
              ? <Check className="w-5 h-5 text-emerald-400" />
              : <span className="text-xs text-rose-400 font-bold">Must be exactly 11</span>
            }
          </div>
        </div>

        <div className="p-6 border-t border-slate-800 flex space-x-3">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-bold transition-all">Cancel</button>
          <button
            onClick={handleSave}
            disabled={!validStarters}
            className="flex-1 px-4 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-sm font-bold transition-all"
          >
            Apply Formation
          </button>
        </div>
      </div>
    </div>
  );
};

export default FormationSettingsModal;
