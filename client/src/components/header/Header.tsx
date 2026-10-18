import React, { useEffect, useMemo, useState } from 'react';
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
  Clock3,
  SlidersHorizontal,
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
  const [currentTime, setCurrentTime] = useState(() => new Date());

  const trainList = useMemo(() => Array.from(trains.values()), [trains]);
  const liveCount = trainList.filter((t) => typeFilter[t.type] !== false).length;
  const delayedCount = trainList.filter((t) => t.delayMinutes > 15 && typeFilter[t.type] !== false).length;
  const loopedCount = trainList.filter((t) => t.status === 'LOOPED' && typeFilter[t.type] !== false).length;

  useEffect(() => {
    const timer = window.setInterval(() => setCurrentTime(new Date()), 30000);
    return () => window.clearInterval(timer);
  }, []);

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
      ? 'bg-white/90 border-slate-200 text-slate-900 shadow-[0_18px_45px_rgba(15,23,42,0.08)]'
      : 'bg-slate-950/80 border-white/10 text-slate-100 shadow-[0_18px_45px_rgba(15,23,42,0.45)]';

  const railCard =
    theme === 'light'
      ? 'bg-white/90 border-slate-200 text-slate-900 shadow-[0_14px_36px_rgba(15,23,42,0.08)]'
      : 'bg-slate-950/80 border-white/10 text-slate-100 shadow-[0_14px_36px_rgba(15,23,42,0.35)]';

  const secondaryCard =
    theme === 'light'
      ? 'bg-slate-50/90 border-slate-200 text-slate-700'
      : 'bg-slate-900/80 border-white/10 text-slate-300';

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

  const timeLabel = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const dateLabel = currentTime.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });

  return (
    <header className="absolute inset-x-0 top-0 z-30 pointer-events-none">
      <div className="mx-auto max-w-[1520px] px-4 pt-4">
        <div className="grid gap-4 xl:grid-cols-[248px_minmax(0,1fr)_288px] items-start">
          <aside className="pointer-events-auto space-y-3">
            <div className={`${railCard} rounded-[1.8rem] border px-4 py-4 backdrop-blur-xl`}>
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-[linear-gradient(135deg,#ff6a3d_0%,#ff9f43_45%,#1d4ed8_100%)] text-white font-black text-sm flex items-center justify-center shadow-lg shadow-orange-500/20">
                  RT
                </div>
                <div className="min-w-0">
                  <div className="text-[15px] font-black tracking-tight">RailTrack</div>
                  <div className={`text-[11px] ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
                    Indian railway live map
                  </div>
                </div>
              </div>

              <div className="mt-3 flex items-center gap-2 flex-wrap">
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-black tracking-[0.16em] uppercase ${
                    backendOnline
                      ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                      : 'bg-amber-100 text-amber-700 border border-amber-200'
                  }`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${backendOnline ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                  {backendOnline ? 'Live' : 'Offline'}
                </span>
                <span className={`text-[11px] font-semibold ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
                  {liveCount} trains tracked
                </span>
              </div>
            </div>

            <div className={`${railCard} rounded-[1.6rem] border p-2.5 backdrop-blur-xl space-y-2`}>
              {[
                {
                  title: 'Most delayed trains',
                  value: delayedCount.toString().padStart(2, '0'),
                  tone: 'text-rose-500',
                },
                {
                  title: 'Most disrupted stations',
                  value: Math.max(3, loopedCount + 2).toString().padStart(2, '0'),
                  tone: 'text-amber-500',
                },
                {
                  title: 'Bookmarks',
                  value: '04',
                  tone: 'text-sky-500',
                },
              ].map((item) => (
                <button
                  key={item.title}
                  type="button"
                  className={`w-full rounded-2xl border px-3 py-3 text-left transition-colors ${secondaryCard} hover:border-sky-300`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-[12px] font-semibold leading-tight">{item.title}</div>
                      <div className={`mt-1 text-[10px] font-black tracking-[0.22em] uppercase ${item.tone}`}>
                        Live
                      </div>
                    </div>
                    <div className={`text-2xl font-black ${item.tone}`}>{item.value}</div>
                  </div>
                </button>
              ))}
            </div>
          </aside>

          <section className="pointer-events-auto space-y-3">
            <div className={`${glass} relative rounded-[1.85rem] border px-3 py-3.5 backdrop-blur-xl`}>
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                <div className="flex flex-1 items-center gap-2 rounded-[1.35rem] border border-slate-200 bg-slate-50/90 px-4 py-3 shadow-sm">
                  <Search className="w-4 h-4 text-slate-400" />
                  <input
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value);
                      setSearchOpen(true);
                    }}
                    onFocus={() => setSearchOpen(true)}
                    placeholder="Search a train, a station, a line..."
                    className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                  />
                  <button
                    type="button"
                    onClick={() => setFilterOpen((value) => !value)}
                    className="rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-slate-500 transition-colors hover:bg-slate-50"
                    title="Filter trains"
                  >
                    <SlidersHorizontal className="h-4 w-4" />
                  </button>
                </div>

                <div className="flex items-center justify-between gap-2 lg:justify-end">
                  <div className="rounded-[1.2rem] border border-slate-200 bg-white px-3 py-2 shadow-sm">
                    <div className="text-[10px] uppercase tracking-[0.22em] text-slate-400">Local time</div>
                    <div className="mt-1 flex items-center gap-2 text-sm font-black text-slate-900">
                      <Clock3 className="h-4 w-4 text-sky-500" />
                      <span>{timeLabel}</span>
                    </div>
                    <div className="mt-1 text-[11px] text-slate-500">{dateLabel}</div>
                  </div>

                  <div className="flex items-center gap-2">
                    <ThemeToggle />
                    <button
                      type="button"
                      onClick={handleReset}
                      className="h-11 w-11 rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition-colors hover:bg-slate-50"
                      title="Reset fleet"
                    >
                      <RotateCcw className="mx-auto h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onOpenAuth();
                        setMoreOpen(false);
                      }}
                      className="h-11 w-11 rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition-colors hover:bg-slate-50"
                      title={isAuthenticated && user ? `Signed in as ${user.name}` : 'Sign in'}
                    >
                      <UserIcon className="mx-auto h-4 w-4" />
                    </button>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setMoreOpen((value) => !value)}
                        className="h-11 rounded-full border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-600 shadow-sm transition-colors hover:bg-slate-50"
                      >
                        More <ChevronDown className="inline h-3.5 w-3.5" />
                      </button>
                      {moreOpen && (
                        <div className="absolute right-0 top-full z-40 mt-2 w-56 rounded-[1.4rem] border border-slate-200 bg-white p-2 shadow-[0_20px_45px_rgba(15,23,42,0.12)]">
                          <button
                            type="button"
                            onClick={handleOvertake}
                            className="flex w-full items-center gap-2 rounded-2xl px-3 py-2.5 text-left text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50"
                          >
                            <Sparkles className="h-4 w-4 text-amber-500" />
                            Tundla overtake demo
                          </button>
                          <button
                            type="button"
                            onClick={handleReset}
                            className="flex w-full items-center gap-2 rounded-2xl px-3 py-2.5 text-left text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50"
                          >
                            <RotateCcw className="h-4 w-4 text-slate-500" />
                            Reset fleet
                          </button>
                          <div className="my-2 h-px bg-slate-100" />
                          {isAuthenticated && user ? (
                            <button
                              type="button"
                              onClick={() => {
                                logout();
                                setMoreOpen(false);
                              }}
                              className="flex w-full items-center gap-2 rounded-2xl px-3 py-2.5 text-left text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50"
                            >
                              <LogOut className="h-4 w-4 text-slate-500" />
                              Sign out ({user.name.split(' ')[0]})
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                onOpenAuth();
                                setMoreOpen(false);
                              }}
                              className="flex w-full items-center gap-2 rounded-2xl px-3 py-2.5 text-left text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50"
                            >
                              <UserIcon className="h-4 w-4 text-slate-500" />
                              Sign in
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {searchOpen && matches.length > 0 && (
                <div className={`${glass} absolute left-3 right-3 top-[calc(100%+0.75rem)] z-40 overflow-hidden rounded-[1.6rem] border`}>
                  {matches.map((t) => (
                    <button
                      key={t.trainNo}
                      onClick={() => pickTrain(t.trainNo)}
                      className="flex w-full items-center justify-between gap-4 border-b border-slate-100 px-4 py-3 text-left text-xs last:border-b-0 hover:bg-slate-50"
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <Train className="w-3.5 h-3.5 text-slate-400" />
                        <span className="truncate font-semibold">{t.trainName}</span>
                        <span className="font-mono text-slate-400">{t.trainNo}</span>
                      </span>
                      <span className="hidden font-mono text-slate-400 md:inline">
                        {t.fromStation} → {t.toStation}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className={`inline-flex items-center gap-1 rounded-full border px-1.5 py-1 ${railCard}`}>
                <button
                  onClick={() => setMarkerMode('minimal')}
                  className={`rounded-full px-3 py-1.5 text-[11px] font-semibold transition-colors ${
                    markerMode === 'minimal'
                      ? 'bg-sky-500 text-white shadow-sm'
                      : theme === 'light'
                      ? 'text-slate-500 hover:bg-slate-100'
                      : 'text-slate-300 hover:bg-white/5'
                  }`}
                  title="Delay-based markers"
                >
                  Delay
                </button>
                <button
                  onClick={() => setMarkerMode('typed')}
                  className={`rounded-full px-3 py-1.5 text-[11px] font-semibold transition-colors ${
                    markerMode === 'typed'
                      ? 'bg-sky-500 text-white shadow-sm'
                      : theme === 'light'
                      ? 'text-slate-500 hover:bg-slate-100'
                      : 'text-slate-300 hover:bg-white/5'
                  }`}
                  title="Class-based markers"
                >
                  Class
                </button>
              </div>

              <div className={`inline-flex items-center gap-1 rounded-full border px-1.5 py-1 ${railCard}`}>
                <button
                  onClick={() => setMapDensity('network')}
                  className={`rounded-full px-3 py-1.5 text-[11px] font-semibold transition-colors ${
                    mapDensity === 'network'
                      ? 'bg-slate-900 text-white shadow-sm'
                      : theme === 'light'
                      ? 'text-slate-500 hover:bg-slate-100'
                      : 'text-slate-300 hover:bg-white/5'
                  }`}
                >
                  Network
                </button>
                <button
                  onClick={() => setMapDensity('railfan')}
                  className={`rounded-full px-3 py-1.5 text-[11px] font-semibold transition-colors ${
                    mapDensity === 'railfan'
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : theme === 'light'
                      ? 'text-slate-500 hover:bg-slate-100'
                      : 'text-slate-300 hover:bg-white/5'
                  }`}
                >
                  Railfan
                </button>
              </div>

              <button
                onClick={() => setFollowTrain(!followTrain)}
                className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[11px] font-semibold transition-colors ${
                  followTrain
                    ? 'border-sky-300 bg-sky-50 text-sky-700 shadow-sm'
                    : railCard
                }`}
                title="Follow selected train"
              >
                <Crosshair className="h-3.5 w-3.5" />
                Follow train
              </button>

              <button
                onClick={() => setFilterOpen((value) => !value)}
                className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[11px] font-semibold transition-colors ${railCard}`}
              >
                <Filter className="h-3.5 w-3.5" />
                Filters
              </button>
            </div>

            {selectedTrainNo && trains.get(selectedTrainNo) && (
              <div className="pointer-events-none">
                <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] ${glass}`}>
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ background: TYPE_COLORS[trains.get(selectedTrainNo)!.type] }}
                  />
                  <span className="font-semibold">{trains.get(selectedTrainNo)!.trainName}</span>
                  <span className="font-mono opacity-60">{selectedTrainNo}</span>
                </div>
              </div>
            )}
          </section>

          <aside className="pointer-events-auto flex justify-end">
            <div className="w-full space-y-3">
              <div className={`${railCard} rounded-[1.8rem] border p-3 backdrop-blur-xl`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.26em] text-slate-400">Session</div>
                    <div className="mt-1 flex items-center gap-2 text-xl font-black tracking-tight text-slate-900">
                      <Clock3 className="h-4 w-4 text-sky-500" />
                      {timeLabel}
                    </div>
                    <div className={`mt-1 text-[11px] ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
                      {dateLabel}
                    </div>
                  </div>
                  <ThemeToggle />
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
                  <div className={`${secondaryCard} rounded-2xl border px-3 py-2`}>
                    <div className="font-semibold">{backendOnline ? 'Backend synced' : 'Waiting for backend'}</div>
                    <div className={`mt-0.5 ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
                      {liveCount} live trains
                    </div>
                  </div>
                  <div className={`${secondaryCard} rounded-2xl border px-3 py-2`}>
                    <div className="font-semibold">{followTrain ? 'Follow mode on' : 'Map mode ready'}</div>
                    <div className={`mt-0.5 ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
                      Smooth camera tracking
                    </div>
                  </div>
                </div>
              </div>

              <div className={`${railCard} rounded-[1.6rem] border p-2.5 backdrop-blur-xl`}>
                <button
                  onClick={() => setFilterOpen((value) => !value)}
                  className="flex w-full items-center justify-between rounded-2xl px-3 py-2.5 text-left text-sm font-semibold transition-colors hover:bg-slate-50/80"
                >
                  <span className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-slate-500" />
                    Type filters
                  </span>
                  <ChevronDown className="h-4 w-4 text-slate-400" />
                </button>

                {filterOpen && (
                  <div className="mt-2 space-y-1 rounded-2xl border border-slate-200 bg-white/95 p-2 shadow-sm">
                    {ALL_TYPES.map((type: TrainType) => (
                      <label key={type} className="flex items-center gap-2 rounded-xl px-3 py-2 text-[11px] cursor-pointer hover:bg-slate-50">
                        <input
                          type="checkbox"
                          className="accent-sky-500"
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
            </div>
          </aside>
        </div>
      </div>
    </header>
  );
};
