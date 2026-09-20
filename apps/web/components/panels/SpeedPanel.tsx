import React from 'react';
import { TrainState } from '../../../../packages/core/types/train';
import { Gauge, TrendingUp, Activity } from 'lucide-react';

interface SpeedPanelProps {
  train: TrainState;
}

export const SpeedPanel: React.FC<SpeedPanelProps> = ({ train }) => {
  const currentSpeed = Math.round(train.speed);
  const maxSpeed = train.maxSpeedToday || 110;
  const speedHistory = train.speedHistory || [];

  return (
    <div className="bg-bgCard border border-slate-700/80 rounded-2xl p-4 shadow-xl backdrop-blur-xl">
      <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2 text-textPrimary font-bold text-sm">
          <Gauge className="w-4 h-4 text-accentBlue" />
          <span>Speedometer & Kinematics</span>
        </div>
        <span className="text-xs text-slate-400 flex items-center gap-1 font-mono">
          <Activity className="w-3.5 h-3.5 text-emerald-400" />
          Max Today: {maxSpeed} km/h
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3 my-2">
        {/* Current Speed */}
        <div className="bg-slate-900/80 rounded-xl p-3 border border-slate-800 text-center flex flex-col items-center justify-center">
          <span className="text-[10px] text-textSecondary uppercase font-bold tracking-wider mb-0.5">Live Speed</span>
          <span className={`text-2xl font-mono font-extrabold ${currentSpeed > 5 ? 'text-accentBlue' : 'text-amber-400'}`}>
            {currentSpeed}
          </span>
          <span className="text-[10px] text-slate-400 font-semibold">km/h</span>
        </div>

        {/* Avg Speed */}
        <div className="bg-slate-900/80 rounded-xl p-3 border border-slate-800 text-center flex flex-col items-center justify-center">
          <span className="text-[10px] text-textSecondary uppercase font-bold tracking-wider mb-0.5">1-Hr Avg</span>
          <span className="text-2xl font-mono font-bold text-emerald-400">
            {train.avgSpeedLastHour || 72}
          </span>
          <span className="text-[10px] text-slate-400 font-semibold">km/h</span>
        </div>

        {/* Distance Marker */}
        <div className="bg-slate-900/80 rounded-xl p-3 border border-slate-800 text-center flex flex-col items-center justify-center">
          <span className="text-[10px] text-textSecondary uppercase font-bold tracking-wider mb-0.5">Km Marker</span>
          <span className="text-xl font-mono font-bold text-cyan-300">
            {train.kmMarker}
          </span>
          <span className="text-[10px] text-slate-400 font-semibold">km</span>
        </div>
      </div>

      {/* Mini Speed Graph */}
      <div className="mt-3">
        <div className="flex justify-between items-center text-xs text-slate-400 mb-1">
          <span className="flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-accentOrange" /> Speed Profile (Last 60 min)
          </span>
          <span className="font-mono text-[10px]">0 - {maxSpeed} km/h</span>
        </div>

        <div className="h-16 w-full bg-slate-950 rounded-lg border border-slate-800 p-2 flex items-end gap-1.5 justify-between overflow-hidden">
          {speedHistory.map((pt, idx) => {
            const heightPct = Math.min(100, Math.max(8, (pt.speed / maxSpeed) * 100));
            return (
              <div key={idx} className="flex-1 flex flex-col items-center group relative">
                <div
                  className={`w-full rounded-t transition-all duration-300 ${
                    pt.speed > 80
                      ? 'bg-accentBlue'
                      : pt.speed > 20
                      ? 'bg-cyan-400'
                      : 'bg-amber-500'
                  }`}
                  style={{ height: `${heightPct}%` }}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
