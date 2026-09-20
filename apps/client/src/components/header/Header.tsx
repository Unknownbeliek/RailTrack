import React, { useMemo, useState } from 'react';
import {
  Search,
  Train,
  RotateCcw,
  Sparkles,
  User as UserIcon,
  LogOut,
  Filter,
  Crosshair,
  ChevronDown,
} from 'lucide-react';
import { useTrainStore } from '../../stores/trainStore';
import { useAuthStore } from '../../stores/authStore';
import { ThemeToggle } from '../common/ThemeToggle';
import { apiResetSimulation, apiSimulateOvertake } from '../../services/api';
import { resetSocketSimulation, triggerSocketSimulation } from '../../services/socket';
import { ALL_TYPES, TYPE_COLORS, TYPE_LABEL } from '../../lib/trainStyle';
import { TrainType } from '../../types';

interface HeaderProps {
  onOpenAuth: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenAuth }) => {
  const {
    trains,
    selectedTrainNo,
    theme,
    markerMode,
    mapDensity,
    typeFilter,
    backendOnline,
    followTrain,
    selectTrain,
    setMarkerMode,
    setMapDensity,
    toggleTypeFilter,
    setFollowTrain,
    setFocusRequest,
  } = useTrainStore();
  const { user, isAuthenticated, logout } = useAuthStore();

  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  const trainList = useMemo(() => Array.from(trains.values()), [trains]);
  const liveCount = trainList.filter((t) => typeFilter[t.type] !== false).length;

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return trainList
      .filter(
        (t) =>
          t.trainNo.toLowerCase().includes(q) ||
          t.trainName.toLowerCase().includes(q) ||
          t.fromStation.toLowerCase().includes(q) ||
          t.toStation.toLowerCase().includes(q)
      )
      .slice(0, 12);
  }, [query, trainList]);

  const glass =
    theme === 'light'
      ? 'bg-white/90 border-slate-200 text-slate-900'
      : 'bg-slate-950/80 border-white/10 text-slate-100';

  const handleOvertake = async () => {
    try {
      await apiSimulateOvertake();
    } catch {
      triggerSocketSimulation();
    }
    setMoreOpen(false);
  };

  const handleReset = async () => {
    try {
      await apiResetSimulation();
    } catch {
      resetSocketSimulation();
    }
    setMoreOpen(false);
  };

  const pickTrain = (trainNo: string) => {
    const t = trains.get(trainNo);
    selectTrain(trainNo);
    if (t) setFocusRequest({ lng: t.snappedLng, lat: t.snappedLat, zoom: 8.5 });
    setQuery('');
    setSearchOpen(false);
  };

  return (
    <header className="absolute top-0 left-0 right-0 z-30 p-3 pointer-events-none">
      <div className="max-w-[1400px] mx-auto flex items-start gap-2 flex-wrap">
        <div className={`pointer-events-auto ${glass} backdrop-blur-md border rounded-2xl px-3 py-2 shadow-xl flex items-center gap-2.5`}>
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-400 to-cyan-300 text-slate-950 font-black text-sm flex items-center justify-center">
            TP
          </div>
          <div className="leading-tight">
            <div className="text-[13px] font-extrabold tracking-tight">TrackPulse</div>
            <div className="text-[10px] font-mono opacity-60 flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${backendOnline ? 'bg-emerald-400' : 'bg-amber-400'}`} />
              {liveCount} trains · demo
            </div>
          </div>
        </div>

        <div className="pointer-events-auto relative flex-1 max-w-md">
          <div className={`${glass} backdrop-blur-md border rounded-2xl shadow-xl flex items-center`}>
            <Search className="w-4 h-4 ml-3 opacity-50" />
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSearchOpen(true);
              }}
              onFocus={() => setSearchOpen(true)}
              placeholder="Search train no, name, station…"
              className="w-full bg-transparent text-sm px-2.5 py-2.5 outline-none placeholder:opacity-40"
            />
          </div>
          {searchOpen && matches.length > 0 && (
            <div className={`absolute top-12 inset-x-0 ${glass} backdrop-blur-md border rounded-2xl shadow-2xl overflow-hidden z-40`}>
              {matches.map((t) => (
                <button
                  key={t.trainNo}
                  onClick={() => pickTrain(t.trainNo)}
                  className="w-full text-left px-3 py-2 flex items-center justify-between hover:bg-white/5 text-xs"
                >
                  <span className="flex items-center gap-2">
                    <Train className="w-3.5 h-3.5 opacity-70" />
                    <span className="font-semibold">{t.trainName}</span>
                    <span className="font-mono opacity-50">{t.trainNo}</span>
                  </span>
                  <span className="font-mono opacity-60">
                    {t.fromStation}→{t.toStation}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className={`pointer-events-auto ${glass} backdrop-blur-md border rounded-2xl shadow-xl p-1 flex items-center gap-1`}>
          <button
            onClick={() => setMarkerMode('minimal')}
            className={`px-2.5 py-1.5 rounded-xl text-[11px] font-semibold ${
              markerMode === 'minimal' ? 'bg-sky-400 text-slate-950' : 'opacity-70 hover:opacity-100'
            }`}
            title="Minimal: colour by delay"
          >
            Delay
          </button>
          <button
            onClick={() => setMarkerMode('typed')}
            className={`px-2.5 py-1.5 rounded-xl text-[11px] font-semibold ${
              markerMode === 'typed' ? 'bg-sky-400 text-slate-950' : 'opacity-70 hover:opacity-100'
            }`}
            title="Typed: colour by train class"
          >
            Class
          </button>
        </div>

        <div className={`pointer-events-auto ${glass} backdrop-blur-md border rounded-2xl shadow-xl p-1 flex items-center gap-1`}>
          <button
            onClick={() => setMapDensity('network')}
            className={`px-2.5 py-1.5 rounded-xl text-[11px] font-semibold ${
              mapDensity === 'network' ? 'bg-sky-400 text-slate-950' : 'opacity-70 hover:opacity-100'
            }`}
          >
            Network
          </button>
          <button
            onClick={() => setMapDensity('railfan')}
            className={`px-2.5 py-1.5 rounded-xl text-[11px] font-semibold ${
              mapDensity === 'railfan' ? 'bg-orange-400 text-slate-950' : 'opacity-70 hover:opacity-100'
            }`}
          >
            Railfan
          </button>
        </div>

        <div className="pointer-events-auto relative">
          <button
            onClick={() => setFilterOpen((v) => !v)}
            className={`${glass} backdrop-blur-md border rounded-2xl shadow-xl p-2.5`}
            title="Filter train types"
          >
            <Filter className="w-4 h-4" />
          </button>
          {filterOpen && (
            <div className={`absolute right-0 top-12 ${glass} backdrop-blur-md border rounded-2xl shadow-2xl p-2 w-48 z-40`}>
              {ALL_TYPES.map((type: TrainType) => (
                <label key={type} className="flex items-center gap-2 px-2 py-1.5 text-[11px] cursor-pointer rounded-lg hover:bg-white/5">
                  <input
                    type="checkbox"
                    className="accent-sky-400"
                    checked={typeFilter[type]}
                    onChange={() => toggleTypeFilter(type)}
                  />
                  <span className="w-2 h-2 rounded-full" style={{ background: TYPE_COLORS[type] }} />
                  {TYPE_LABEL[type]}
                </label>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={() => setFollowTrain(!followTrain)}
          className={`pointer-events-auto ${glass} backdrop-blur-md border rounded-2xl shadow-xl p-2.5 ${
            followTrain ? 'ring-1 ring-sky-400' : ''
          }`}
          title="Follow selected train"
        >
          <Crosshair className="w-4 h-4" />
        </button>

        <ThemeToggle />

        <div className="pointer-events-auto relative">
          <button
            onClick={() => setMoreOpen((v) => !v)}
            className={`${glass} backdrop-blur-md border rounded-2xl shadow-xl px-2.5 py-2 text-[11px] font-semibold flex items-center gap-1`}
          >
            More <ChevronDown className="w-3.5 h-3.5" />
          </button>
          {moreOpen && (
            <div className={`absolute right-0 top-12 ${glass} backdrop-blur-md border rounded-2xl shadow-2xl p-1.5 w-52 z-40`}>
              <button
                onClick={handleOvertake}
                className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs hover:bg-white/5"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Tundla overtake demo
              </button>
              <button
                onClick={handleReset}
                className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs hover:bg-white/5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset fleet
              </button>
              <div className="h-px bg-white/10 my-1" />
              {isAuthenticated && user ? (
                <button
                  onClick={() => {
                    logout();
                    setMoreOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs hover:bg-white/5"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign out ({user.name.split(' ')[0]})
                </button>
              ) : (
                <button
                  onClick={() => {
                    onOpenAuth();
                    setMoreOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs hover:bg-white/5"
                >
                  <UserIcon className="w-3.5 h-3.5" />
                  Sign in
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {selectedTrainNo && trains.get(selectedTrainNo) && (
        <div className="max-w-[1400px] mx-auto mt-2 pointer-events-none">
          <div className={`inline-flex items-center gap-2 ${glass} backdrop-blur-md border rounded-full px-3 py-1 text-[11px] shadow-lg`}>
            <span
              className="w-2 h-2 rounded-full"
              style={{ background: TYPE_COLORS[trains.get(selectedTrainNo)!.type] }}
            />
            <span className="font-semibold">{trains.get(selectedTrainNo)!.trainName}</span>
            <span className="font-mono opacity-60">{selectedTrainNo}</span>
          </div>
        </div>
      )}
    </header>
  );
};
