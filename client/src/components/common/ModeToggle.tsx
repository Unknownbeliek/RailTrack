import React from 'react';
import { useTrainStore } from '../../stores/trainStore';
import { Eye, Compass } from 'lucide-react';

export const ModeToggle: React.FC = () => {
  const { mode, setMode, theme } = useTrainStore();

  const shell =
    theme === 'light'
      ? 'bg-white border-slate-200 shadow-[0_14px_36px_rgba(15,23,42,0.08)]'
      : 'bg-bgCardElevated/90 border-slate-700/60 shadow-xl';

  return (
    <div className={`flex items-center backdrop-blur-md p-1 rounded-full border ${shell}`}>
      <button
        onClick={() => setMode('PASSENGER')}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
          mode === 'PASSENGER'
            ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20 font-bold'
            : theme === 'light'
            ? 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
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
            ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-bold'
            : theme === 'light'
            ? 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
            : 'text-textSecondary hover:text-textPrimary hover:bg-slate-800/50'
        }`}
      >
        <Compass className="w-3.5 h-3.5" />
        <span>Railfan</span>
      </button>
    </div>
  );
};
