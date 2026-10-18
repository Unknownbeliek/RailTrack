import React from 'react';
import { useTrainStore } from '../../stores/trainStore';
import { Sun, Moon } from 'lucide-react';

export const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTrainStore();

  return (
    <button
      onClick={toggleTheme}
      className={`h-11 w-11 rounded-full border transition-all duration-200 flex items-center justify-center shadow-sm ${
        theme === 'dark'
          ? 'bg-slate-900 text-amber-300 border-white/10 hover:bg-slate-800'
          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
      }`}
      title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
    >
      {theme === 'dark' ? (
        <Sun className="w-4 h-4 text-amber-300 fill-amber-300/20" />
      ) : (
        <Moon className="w-4 h-4 text-sky-600 fill-sky-600/20" />
      )}
    </button>
  );
};
