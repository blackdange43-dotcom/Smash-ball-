import React from 'react';
import { ActiveBuff } from '../types';
import { POWER_UP_CONFIG } from '../gameConfig';

interface ActivePowerUpsProps {
  buffs: ActiveBuff[];
}

export const ActivePowerUps: React.FC<ActivePowerUpsProps> = ({ buffs }) => {
  if (buffs.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 px-3 py-1.5 bg-slate-900/80 backdrop-blur-md border border-slate-700/60 rounded-xl shadow-lg">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
        Kuchaytirgichlar:
      </span>
      {buffs.map((buff) => {
        const config = POWER_UP_CONFIG[buff.type];
        const percent = Math.max(0, Math.min(100, (buff.remainingTime / buff.totalTime) * 100));

        return (
          <div
            key={buff.type}
            className="flex items-center gap-2 px-2.5 py-1 bg-slate-800/90 border rounded-lg text-xs font-medium text-white shadow-sm"
            style={{ borderColor: config.color }}
          >
            <span>{config.icon}</span>
            <span className="font-semibold text-slate-100">{config.label}</span>
            <div className="w-12 h-1.5 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full transition-all duration-100 rounded-full"
                style={{
                  width: `${percent}%`,
                  backgroundColor: config.color,
                }}
              />
            </div>
            <span className="text-[11px] font-mono text-slate-300">
              {buff.remainingTime.toFixed(1)}s
            </span>
          </div>
        );
      })}
    </div>
  );
};
