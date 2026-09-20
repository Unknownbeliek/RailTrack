import React from 'react';
import { useTrainStore } from '../../stores/trainStore';
import { Eye, Compass } from 'lucide-react';

export const ModeToggle: React.FC = () => {
  const { mode, setMode } = useTrainStore();

  return (
    <div className="flex items-center bg-bgCardElevated/90 backdrop-blur-md p-1 rounded-xl border border-slate-700/60 shadow-xl">
      <button
        onClick={() => setMode('PASSENGER')}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
          mode === 'PASSENGER'
            ? 'bg-accentBlue text-slate-950 shadow-md shadow-accentBlue/20 font-bold'
            : 'text-textSecondary hover:text-textPrimary hover:bg-slate-800/50'
        }`}
      >
        <Eye className="w-3.5 h-3.5" />
        <span>Passenger</span>
      </button>

      <button
        onClick={() => setMode('RAILFAN')}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
          mode === 'RAILFAN'
            ? 'bg-accentOrange text-slate-950 shadow-md shadow-accentOrange/20 font-bold'
            : 'text-textSecondary hover:text-textPrimary hover:bg-slate-800/50'
        }`}
      >
        <Compass className="w-3.5 h-3.5" />
        <span>Railfan</span>
      </button>
    </div>
  );
};
