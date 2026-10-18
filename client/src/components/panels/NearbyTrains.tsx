import React from 'react';
import { TrainState } from '../../types';
import { Radio, Zap, ArrowUpRight, ArrowDownLeft } from 'lucide-react';

interface NearbyTrainsProps {
  train: TrainState;
}

export const NearbyTrains: React.FC<NearbyTrainsProps> = ({ train }) => {
  const nearby = train.nearbyTrains || [];

  return (
    <div className="bg-bgCard border border-slate-700/80 rounded-2xl p-4 shadow-xl backdrop-blur-xl">
      <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2 text-textPrimary font-bold text-sm">
          <Radio className="w-4 h-4 text-accentOrange animate-pulse" />
          <span>Nearby Trains & Overtake Radar</span>
        </div>
        <span className="text-xs text-slate-400 font-mono">{nearby.length} Active in Section</span>
      </div>

      {nearby.length === 0 ? (
        <p className="text-xs text-slate-400 italic text-center py-3">
          No nearby trains detected within 50 km block section.
        </p>
      ) : (
        <div className="space-y-2">
          {nearby.map((nt) => (
            <div
              key={nt.trainNo}
              className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 flex items-center justify-between hover:border-slate-700 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs ${
                    nt.type === 'RAJDHANI'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                  }`}
                >
                  {nt.type === 'RAJDHANI' ? 'RAJ' : 'SF'}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-textPrimary">{nt.trainName}</span>
                    <span className="text-[10px] font-mono text-slate-400">({nt.trainNo})</span>
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                    <span className="flex items-center gap-1">
                      {nt.position === 'BEHIND' ? (
                        <ArrowDownLeft className="w-3 h-3 text-accentOrange" />
                      ) : (
                        <ArrowUpRight className="w-3 h-3 text-emerald-400" />
                      )}
                      {nt.distanceKm} km {nt.position?.toLowerCase()}
                    </span>
                    <span>•</span>
                    <span className="font-mono text-slate-300">{nt.speed} km/h</span>
                  </div>
                </div>
              </div>

              {nt.relativeSpeed > 0 && (
                <div className="text-right">
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                    <Zap className="w-3 h-3" />
                    +{Math.round(nt.relativeSpeed)} km/h faster
                  </span>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                    Catching up in ~{Math.round((nt.distanceKm / nt.relativeSpeed) * 60)} min
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
