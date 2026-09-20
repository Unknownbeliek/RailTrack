import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrainState } from '../../types';
import { useTrainStore } from '../../stores/trainStore';
import { ContextCard } from './ContextCard';
import { SpeedPanel } from './SpeedPanel';
import { NearbyTrains } from './NearbyTrains';
import { ChevronUp, ChevronDown, MapPin, Clock, X } from 'lucide-react';

interface BottomSheetProps {
  train: TrainState;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({ train }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { theme, selectTrain } = useTrainStore();

  return (
    <motion.div
      initial={{ y: 200 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="fixed bottom-0 left-0 right-0 z-30 max-w-lg mx-auto p-3 pointer-events-auto"
    >
      <div
        className={`${
          theme === 'light'
            ? 'bg-white/95 border-slate-300 text-slate-900 shadow-2xl'
            : 'bg-bgCardElevated/95 border-slate-700/80 text-textPrimary shadow-2xl'
          } backdrop-blur-2xl border rounded-3xl overflow-hidden flex flex-col max-h-[82vh] transition-colors duration-300 relative`}
      >
        {/* Drag handle / collapse bar */}
        <div className="absolute top-2 right-2 z-10">
          <button
            onClick={() => selectTrain(null)}
            className={`p-1.5 rounded-full ${theme === 'light' ? 'hover:bg-slate-100' : 'hover:bg-slate-800'}`}
            title="Close"
          >
            <X className="w-4 h-4 opacity-60" />
          </button>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`w-full py-2.5 flex flex-col items-center justify-center cursor-pointer group ${
            theme === 'light' ? 'hover:bg-slate-100' : 'hover:bg-slate-800/40'
          } transition-colors`}
        >
          <div
            className={`w-12 h-1.5 ${
              theme === 'light' ? 'bg-slate-300 group-hover:bg-slate-400' : 'bg-slate-600 group-hover:bg-slate-400'
            } rounded-full mb-1 transition-colors`}
          />
          <div
            className={`flex items-center gap-1 text-[11px] font-semibold ${
              theme === 'light' ? 'text-slate-600' : 'text-textSecondary'
            }`}
          >
            <span>{isExpanded ? 'Collapse Details' : 'Pull Up for Full Kinematics & Radar'}</span>
            {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </div>
        </button>

        {/* Scrollable Container */}
        <div className="p-3 pt-0 space-y-3 overflow-y-auto max-h-[72vh] pb-6">
          {/* Main Context Card */}
          <ContextCard train={train} />

          {/* Expanded Panels */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-3 overflow-hidden"
              >
                <SpeedPanel train={train} />
                <NearbyTrains train={train} />

                {/* Station Halts List */}
                <div
                  className={`${
                    theme === 'light'
                      ? 'bg-white border-slate-300 shadow-lg'
                      : 'bg-bgCard border-slate-700/80 shadow-xl'
                  } border rounded-2xl p-4 backdrop-blur-xl transition-colors`}
                >
                  <div className="flex items-center gap-2 font-bold text-sm mb-3 border-b border-slate-200 dark:border-slate-800 pb-2">
                    <MapPin className="w-4 h-4 text-emerald-500" />
                    <span>Upcoming Route Stations</span>
                  </div>

                  <div className="space-y-2 text-xs">
                    {train.nextStation && (
                      <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-300">
                        <span className="font-bold flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5" /> {train.nextStation.name} ({train.nextStation.code})
                        </span>
                        <span className="font-mono">
                          {train.nextStation.distanceKm} km away • ETA {train.nextStation.etaMinutes}m
                        </span>
                      </div>
                    )}

                    <div
                      className={`flex items-center justify-between p-2 rounded-lg ${
                        theme === 'light'
                          ? 'bg-slate-50 border-slate-200 text-slate-700'
                          : 'bg-slate-900 border-slate-800 text-slate-400'
                      } border`}
                    >
                      <span>Kanpur Central (CNB)</span>
                      <span className="font-mono">232 km • Sch 21:30</span>
                    </div>
                    <div
                      className={`flex items-center justify-between p-2 rounded-lg ${
                        theme === 'light'
                          ? 'bg-slate-50 border-slate-200 text-slate-700'
                          : 'bg-slate-900 border-slate-800 text-slate-400'
                      } border`}
                    >
                      <span>Prayagraj Jn (PRYJ)</span>
                      <span className="font-mono">427 km • Sch 23:55</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};
