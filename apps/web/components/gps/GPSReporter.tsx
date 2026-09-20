import React, { useState } from 'react';
import { useTrainStore } from '../../stores/trainStore';
import { Play, Pause, RotateCcw, Navigation, Radio, Sparkles } from 'lucide-react';

interface GPSReporterProps {
  onSimulateOvertake: () => void;
  onResetSimulation: () => void;
}

export const GPSReporter: React.FC<GPSReporterProps> = ({
  onSimulateOvertake,
  onResetSimulation
}) => {
  const { isSimulating, setSimulating, trains, selectedTrainNo } = useTrainStore();
  const [isReporting, setIsReporting] = useState(false);

  const selectedTrain = selectedTrainNo ? trains.get(selectedTrainNo) : null;

  return (
    <div className="flex items-center gap-2">
      {/* Live Overtake Simulator trigger */}
      <button
        onClick={onSimulateOvertake}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all active:scale-95"
      >
        <Sparkles className="w-3.5 h-3.5 fill-slate-950" />
        <span>Simulate Rajdhani Overtake</span>
      </button>

      {/* Reset simulation button */}
      <button
        onClick={onResetSimulation}
        className="p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
        title="Reset Overtake Simulation"
      >
        <RotateCcw className="w-3.5 h-3.5" />
      </button>

      {/* "I'm on a Train" live reporter */}
      <button
        onClick={() => setIsReporting(!isReporting)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
          isReporting
            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 animate-pulse'
            : 'bg-slate-800/80 text-textSecondary border-slate-700 hover:text-textPrimary'
        }`}
      >
        <Navigation className={`w-3.5 h-3.5 ${isReporting ? 'text-emerald-400 fill-emerald-400' : ''}`} />
        <span>{isReporting ? 'Reporting GPS (3s)' : "I'm on a train"}</span>
      </button>
    </div>
  );
};
