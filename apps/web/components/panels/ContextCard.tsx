import React from 'react';
import { TrainState } from '../../../../packages/core/types/train';
import { useTrainStore } from '../../stores/trainStore';
import { Clock, ShieldCheck, ArrowRight, Zap, RefreshCw, AlertTriangle } from 'lucide-react';

interface ContextCardProps {
  train: TrainState;
}

export const ContextCard: React.FC<ContextCardProps> = ({ train }) => {
  const { theme } = useTrainStore();

  const primaryReason = train.contextReasons[0] || {
    priority: 5,
    type: 'UNKNOWN' as const,
    title: 'Running Normally',
    subtitle: 'Track clear ahead',
    icon: '⚡',
    confidence: 'HIGH' as const
  };

  const isLooped = train.status === 'LOOPED' || primaryReason.type === 'LOOPED';
  const holdEst = primaryReason.estimatedHoldMinutes || 8;
  const progressPercent = Math.min(100, Math.max(15, (train.slowDuration / (holdEst * 60)) * 100));

  return (
    <div className={`relative overflow-hidden rounded-2xl p-4 border transition-all duration-300 ${
      isLooped
        ? theme === 'light'
          ? 'bg-gradient-to-br from-amber-50 to-orange-100 border-amber-300 text-slate-900 shadow-lg'
          : 'bg-gradient-to-br from-amber-950/60 via-slate-900 to-orange-950/40 border-amber-500/40 text-textPrimary shadow-2xl'
        : theme === 'light'
        ? 'bg-gradient-to-br from-sky-50 to-blue-100 border-sky-300 text-slate-900 shadow-lg'
        : 'bg-gradient-to-br from-slate-900 via-bgCard to-slate-900 border-slate-700/80 text-textPrimary shadow-xl'
    }`}>
      {/* Background Accent Pulse */}
      {isLooped && (
        <div className="absolute -top-12 -right-12 w-36 h-36 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
      )}

      <div className="relative z-10 space-y-3">
        {/* Top Header Badge & Confidence */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-base shadow-md ${
              isLooped
                ? 'bg-amber-500/20 text-amber-500 border border-amber-500/40'
                : 'bg-accentBlue/20 text-accentBlue border border-accentBlue/40'
            }`}>
              {primaryReason.icon}
            </div>
            <div>
              <h2 className="font-extrabold text-sm tracking-tight leading-tight">{primaryReason.title}</h2>
              <p className={`text-[11px] font-medium ${theme === 'light' ? 'text-slate-600' : 'text-textSecondary'}`}>{primaryReason.subtitle}</p>
            </div>
          </div>

          <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
            primaryReason.confidence === 'HIGH'
              ? theme === 'light' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
              : theme === 'light' ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
          }`}>
            <ShieldCheck className="w-3 h-3" />
            <span>{primaryReason.confidence}</span>
          </div>
        </div>

        {/* Detailed Context Reasoning */}
        {primaryReason.detail && (
          <div className={`p-2.5 rounded-xl border text-xs leading-relaxed ${
            isLooped
              ? theme === 'light' ? 'bg-amber-100/70 border-amber-300 text-amber-950 font-medium' : 'bg-amber-500/10 border-amber-500/20 text-amber-200/90'
              : theme === 'light' ? 'bg-sky-100/70 border-sky-300 text-sky-950 font-medium' : 'bg-slate-800/60 border-slate-700/60 text-slate-300'
          }`}>
            {primaryReason.detail}
          </div>
        )}

        {/* Hold Estimate Progress Bar */}
        {isLooped && (
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className={`flex items-center gap-1.5 ${theme === 'light' ? 'text-slate-800' : 'text-slate-300'}`}>
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                <span>Estimated Hold Time</span>
              </span>
              <span className="font-mono text-amber-500 font-bold">~{Math.max(1, holdEst - Math.floor(train.slowDuration / 60))} min remaining</span>
            </div>

            <div className={`w-full h-2 rounded-full overflow-hidden p-0.5 border ${
              theme === 'light' ? 'bg-slate-200 border-slate-300' : 'bg-slate-900 border-slate-800'
            }`}>
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-400 transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* Bottom Kinematic Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800/80 text-xs">
          <div className="flex items-center gap-1 font-mono">
            <span className={theme === 'light' ? 'text-slate-500' : 'text-textSecondary'}>Current speed:</span>
            <span className={`font-bold ${train.speed === 0 ? 'text-amber-500' : 'text-emerald-500'}`}>
              {Math.round(train.speed)} km/h
            </span>
          </div>

          {train.nextStation && (
            <div className="flex items-center gap-1 text-[11px]">
              <span className={theme === 'light' ? 'text-slate-500' : 'text-textSecondary'}>Next:</span>
              <span className="font-bold text-accentBlue">{train.nextStation.name}</span>
              <span className={theme === 'light' ? 'text-slate-500 font-mono' : 'text-textSecondary font-mono'}>({train.nextStation.distanceKm} km)</span>
              <ArrowRight className="w-3 h-3 text-accentBlue" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
