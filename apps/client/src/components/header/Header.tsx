import React, { useState } from 'react';
import { useTrainStore } from '../../stores/trainStore';
import { useAuthStore } from '../../stores/authStore';
import { ModeToggle } from '../common/ModeToggle';
import { ThemeToggle } from '../common/ThemeToggle';
import { apiSimulateOvertake, apiResetSimulation, apiPostTelemetry } from '../../services/api';
import { triggerSocketSimulation, resetSocketSimulation, emitGPSReport } from '../../services/socket';
import { Search, Train, Sparkles, RotateCcw, Navigation, Layers, User as UserIcon, LogOut } from 'lucide-react';

interface HeaderProps {
  onOpenAuth: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenAuth }) => {
  const {
    trains,
    selectedTrainNo,
    mode,
    theme,
    selectTrain,
    updateTrain,
    isReportingGps,
    setIsReportingGps,
  } = useTrainStore();

  const { user, isAuthenticated, logout } = useAuthStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSimulatingLocal, setIsSimulatingLocal] = useState(false);

  const trainList = Array.from(trains.values());

  const filteredTrains = trainList.filter(
    (t) =>
      t.trainNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.trainName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSimulateOvertake = async () => {
    setIsSimulatingLocal(true);
    try {
      // Trigger via REST or Socket
      const res = await apiSimulateOvertake();
      if (res.trains) {
        res.trains.forEach((t) => updateTrain(t));
      }
    } catch {
      triggerSocketSimulation();
    } finally {
      setIsSimulatingLocal(false);
    }
  };

  const handleResetSimulation = async () => {
    try {
      const res = await apiResetSimulation();
      if (res.trains) {
        res.trains.forEach((t) => updateTrain(t));
      }
    } catch {
      resetSocketSimulation();
    }
  };

  const handleToggleGPS = () => {
    const nextState = !isReportingGps;
    setIsReportingGps(nextState);

    if (nextState && selectedTrainNo) {
      // Emit a sample real-time user telemetry report
      const selTrain = trains.get(selectedTrainNo);
      if (selTrain) {
        const report = {
          trainNo: selectedTrainNo,
          lat: selTrain.lat + (Math.random() - 0.5) * 0.005,
          lng: selTrain.lng + (Math.random() - 0.5) * 0.005,
          speed: Math.max(0, selTrain.speed + (Math.random() - 0.5) * 4),
          heading: selTrain.heading,
          accuracy: 8,
          timestamp: Date.now(),
        };
        apiPostTelemetry(selectedTrainNo, report).catch(() => emitGPSReport(report));
      }
    }
  };

  return (
    <header className="absolute top-0 left-0 right-0 z-20 p-3 pointer-events-auto">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Logo & App Name */}
        <div
          className={`flex items-center gap-3 ${
            theme === 'light'
              ? 'bg-white/90 border-slate-200 text-slate-900'
              : 'bg-bgCardElevated/90 border-slate-700/80 text-textPrimary'
          } backdrop-blur-md px-3.5 py-2 rounded-2xl border shadow-2xl`}
        >
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-accentBlue to-cyan-400 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-accentBlue/30">
            TP
          </div>
          <div>
            <h1 className="font-extrabold text-sm tracking-tight flex items-center gap-1.5">
              TrackPulse{' '}
              <span className="text-[10px] px-1.5 py-0.2 bg-amber-500/20 text-amber-500 border border-amber-500/30 rounded font-mono font-bold">
                INDIA
              </span>
            </h1>
            <p className={`text-[10px] font-mono leading-none ${theme === 'light' ? 'text-slate-500' : 'text-textSecondary'}`}>
              Spatial Rail Intelligence (MERN)
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 absolute left-3 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search train (e.g. 12393 Sampark Kranti, 12301 Rajdhani)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchOpen(true)}
              className={`w-full ${
                theme === 'light'
                  ? 'bg-white/90 border-slate-300 text-slate-900 placeholder:text-slate-400'
                  : 'bg-bgCardElevated/90 border-slate-700/80 text-textPrimary placeholder:text-slate-500'
              } backdrop-blur-md border text-xs rounded-2xl pl-9 pr-4 py-2.5 focus:outline-none focus:border-accentBlue shadow-2xl transition-all`}
            />
          </div>

          {/* Search Dropdown */}
          {isSearchOpen && searchQuery.length > 0 && (
            <div
              className={`absolute top-12 left-0 right-0 ${
                theme === 'light' ? 'bg-white border-slate-300' : 'bg-bgCard border-slate-700'
              } border rounded-2xl p-2 shadow-2xl z-30 max-h-60 overflow-y-auto`}
            >
              {filteredTrains.map((t) => (
                <button
                  key={t.trainNo}
                  onClick={() => {
                    selectTrain(t.trainNo);
                    setIsSearchOpen(false);
                    setSearchQuery('');
                  }}
                  className={`w-full text-left p-2 ${
                    theme === 'light' ? 'hover:bg-slate-100' : 'hover:bg-slate-800/70'
                  } rounded-xl flex items-center justify-between text-xs transition-colors`}
                >
                  <div className="flex items-center gap-2">
                    <Train className="w-3.5 h-3.5 text-accentBlue" />
                    <span className="font-bold">{t.trainName}</span>
                    <span className="text-slate-400 font-mono">({t.trainNo})</span>
                  </div>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                      theme === 'light'
                        ? 'bg-slate-100 border-slate-200 text-slate-700'
                        : 'bg-slate-900 border-slate-800 text-slate-300'
                    }`}
                  >
                    {t.status}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Controls: Simulation, Reporting, Modes, Theme, Auth */}
        <div className="flex items-center gap-2">
          {/* Simulation button */}
          <button
            onClick={handleSimulateOvertake}
            disabled={isSimulatingLocal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all active:scale-95 disabled:opacity-50"
            title="Advance Rajdhani Overtake Scenario"
          >
            <Sparkles className="w-3.5 h-3.5 fill-slate-950" />
            <span>Simulate Rajdhani Overtake</span>
          </button>

          <button
            onClick={handleResetSimulation}
            className="p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
            title="Reset Simulation"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* GPS reporter button */}
          <button
            onClick={handleToggleGPS}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
              isReportingGps
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 animate-pulse'
                : 'bg-slate-800/80 text-textSecondary border-slate-700 hover:text-textPrimary'
            }`}
          >
            <Navigation className={`w-3.5 h-3.5 ${isReportingGps ? 'text-emerald-400 fill-emerald-400' : ''}`} />
            <span>{isReportingGps ? 'GPS Active' : "I'm on a train"}</span>
          </button>

          <ModeToggle />
          <ThemeToggle />

          {/* User Auth Button */}
          {isAuthenticated && user ? (
            <div className="flex items-center gap-1.5 bg-slate-800/80 border border-slate-700 px-2.5 py-1 rounded-xl text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="font-bold text-slate-200">{user.name.split(' ')[0]}</span>
              <button
                onClick={logout}
                className="p-1 text-slate-400 hover:text-red-400 transition-colors"
                title="Log Out"
              >
                <LogOut className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-accentBlue/20 text-accentBlue border border-accentBlue/40 text-xs font-bold hover:bg-accentBlue/30 transition-colors shadow-lg"
            >
              <UserIcon className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>

      {/* Railfan Mode Section Banner */}
      {mode === 'RAILFAN' && (
        <div
          className={`max-w-7xl mx-auto mt-2 ${
            theme === 'light' ? 'bg-white/95 border-slate-300 text-slate-800' : 'bg-slate-950/90 border-slate-800 text-slate-300'
          } backdrop-blur-md border rounded-xl p-2 px-3 flex items-center justify-between text-xs font-mono shadow-xl`}
        >
          <div className="flex items-center gap-3">
            <span className="text-amber-500 font-bold flex items-center gap-1">
              <Layers className="w-3.5 h-3.5" /> SECTION: TDL-CNB (IRI North Central Zone)
            </span>
            <span>•</span>
            <span>
              Congestion: <strong className="text-amber-500">MEDIUM (2 Trains Active)</strong>
            </span>
          </div>
          <div className="flex items-center gap-2 text-slate-500 text-[11px]">
            <span>
              Block Section <strong>TDL-MARK</strong> occupied by <strong>12301 Rajdhani</strong>
            </span>
          </div>
        </div>
      )}

      {/* Train Selector Tabs */}
      <div className="max-w-7xl mx-auto mt-2 flex items-center gap-2 overflow-x-auto pb-1">
        {trainList.map((t) => (
          <button
            key={t.trainNo}
            onClick={() => selectTrain(t.trainNo)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
              t.trainNo === selectedTrainNo
                ? 'bg-accentBlue text-slate-950 border-accentBlue shadow-lg shadow-accentBlue/20 font-extrabold'
                : theme === 'light'
                ? 'bg-white/90 text-slate-700 border-slate-300 hover:bg-slate-100'
                : 'bg-bgCard/90 text-textSecondary border-slate-700/80 hover:text-textPrimary'
            }`}
          >
            <Train className="w-3.5 h-3.5" />
            <span>{t.trainName}</span>
            <span className="font-mono text-[10px] opacity-80">({t.trainNo})</span>
          </button>
        ))}
      </div>
    </header>
  );
};
