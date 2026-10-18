import React from 'react';
import { useTrainStore } from '../../stores/trainStore';
import { Sun, Moon } from 'lucide-react';

export const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTrainStore();

  return (
    <button
      onClick={toggleTheme}
      className={`p-2 rounded-xl border transition-all duration-200 flex items-center justify-center shadow-lg ${
        theme === 'dark'
          ? 'bg-slate-800/90 text-amber-400 border-slate-700 hover:bg-slate-700'
          : 'bg-white text-slate-800 border-slate-300 hover:bg-slate-100'
      }`}
      title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
    >
      {theme === 'dark' ? (
        <Sun className="w-4 h-4 text-amber-400 fill-amber-400/20" />
      ) : (
        <Moon className="w-4 h-4 text-indigo-600 fill-indigo-600/20" />
      )}
    </button>
  );
};
