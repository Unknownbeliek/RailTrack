'use client';

import React, { useEffect, useState } from 'react';
import { useTrainStore } from '../stores/trainStore';
import { MapView } from '../components/map/MapView';
import { BottomSheet } from '../components/panels/BottomSheet';
import { ModeToggle } from '../components/common/ModeToggle';
import { ThemeToggle } from '../components/common/ThemeToggle';
import { GPSReporter } from '../components/gps/GPSReporter';
import { Search, Train, Layers } from 'lucide-react';
import { Station, TrainState } from '../../../packages/core/types/train';

import stationsData from '../../../data/stations.json';
import routeData from '../../../data/geojson/routes/12393_NDLS_RJPB.json';

export default function Home() {
  const { trains, selectedTrainNo, mode, theme, selectTrain, updateTrain, setTrains } = useTrainStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [simStep, setSimStep] = useState(0);

  // Sync theme to document body
  useEffect(() => {
    if (theme === 'light') {
      document.body.classList.add('light');
    } else {
      document.body.classList.remove('light');
    }
  }, [theme]);

  // Initial demo state population
  useEffect(() => {
    const initialTrains: TrainState[] = [
      {
        trainNo: '12393',
        trainName: 'Sampark Kranti Express',
        type: 'SF',
        priority: 3,
        lat: 27.2063,
        lng: 78.2411,
        snappedLat: 27.2063,
        snappedLng: 78.2411,
        kmMarker: 207.2,
        heading: 105,
        speed: 0,
        maxSpeedToday: 110,
        avgSpeedLastHour: 72,
        speedHistory: [
          { timestamp: Date.now() - 3600000, speed: 105 },
          { timestamp: Date.now() - 1800000, speed: 92 },
          { timestamp: Date.now() - 300000, speed: 12 },
          { timestamp: Date.now(), speed: 0 }
        ],
        status: 'LOOPED',
        isOnLoopLine: true,
        lateralOffset: 24.5,
        slowDuration: 180,
        delayMinutes: 42,
        contextReasons: [
          {
            priority: 1,
            type: 'LOOPED',
            icon: '🔄',
            title: 'Looped at Tundla Junction',
            subtitle: 'Yielding mainline track to 12301 Howrah Rajdhani Express',
            detail: '12301 Rajdhani Express is 14km behind at 112 km/h. Estimated hold: ~7 min.',
            estimatedHoldMinutes: 7,
            relatedTrain: 'Howrah Rajdhani Express',
            confidence: 'HIGH'
          }
        ],
        nearbyTrains: [
          {
            trainNo: '12301',
            trainName: 'Howrah Rajdhani Express',
            type: 'RAJDHANI',
            direction: 'SAME',
            position: 'BEHIND',
            distanceKm: 14.2,
            speed: 112,
            relativeSpeed: 112
          }
        ],
        overtakePredictions: [
          {
            type: 'INCOMING_OVERTAKE',
            trainNo: '12301',
            trainName: 'Howrah Rajdhani Express',
            distanceBehind: 14.2,
            speedDiff: 112,
            etaMinutes: 7,
            likelyLoopStation: 'Tundla Jn',
            overtakeSide: 'LEFT',
            message: 'Howrah Rajdhani Express (12301) is 14km behind, approaching 112 km/h faster. You are looped at Tundla Jn for ~7 min.'
          }
        ],
        dataSource: 'GPS',
        confidence: 'HIGH',
        reporterCount: 14,
        lastUpdated: new Date().toISOString(),
        routeId: '12393_NDLS_RJPB',
        fromStation: 'NDLS',
        toStation: 'RJPB',
        nextStation: {
          code: 'FZD',
          name: 'Firozabad',
          distanceKm: 16.6,
          etaMinutes: 18,
          scheduledTime: '19:45'
        },
        lastStation: {
          code: 'TDL',
          name: 'Tundla Jn',
          departedAt: '19:10 (Stopped)',
          delayAtDeparture: 42
        }
      },
      {
        trainNo: '12301',
        trainName: 'Howrah Rajdhani Express',
        type: 'RAJDHANI',
        priority: 1,
        lat: 27.2800,
        lng: 78.1400,
        snappedLat: 27.2800,
        snappedLng: 78.1400,
        kmMarker: 193.0,
        heading: 105,
        speed: 112,
        maxSpeedToday: 130,
        avgSpeedLastHour: 108,
        speedHistory: [
          { timestamp: Date.now() - 3600000, speed: 115 },
          { timestamp: Date.now() - 1800000, speed: 120 },
          { timestamp: Date.now(), speed: 112 }
        ],
        status: 'RUNNING',
        isOnLoopLine: false,
        lateralOffset: 0.5,
        slowDuration: 0,
        delayMinutes: 5,
        contextReasons: [
          {
            priority: 5,
            type: 'UNKNOWN',
            icon: '⚡',
            title: 'Priority Track Clearance',
            subtitle: 'Mainline green signal locked — Overtaking 12393 at Tundla Jn',
            confidence: 'HIGH'
          }
        ],
        nearbyTrains: [
          {
            trainNo: '12393',
            trainName: 'Sampark Kranti Express',
            type: 'SF',
            direction: 'SAME',
            position: 'AHEAD',
            distanceKm: 14.2,
            speed: 0,
            relativeSpeed: -112
          }
        ],
        overtakePredictions: [],
        dataSource: 'GPS',
        confidence: 'HIGH',
        reporterCount: 52,
        lastUpdated: new Date().toISOString(),
        routeId: '12393_NDLS_RJPB',
        fromStation: 'NDLS',
        toStation: 'HWH',
        nextStation: {
          code: 'CNB',
          name: 'Kanpur Central',
          distanceKm: 246.6,
          etaMinutes: 132,
          scheduledTime: '21:30'
        },
        lastStation: {
          code: 'ALJN',
          name: 'Aligarh Jn',
          departedAt: '18:35',
          delayAtDeparture: 5
        }
      }
    ];

    setTrains(initialTrains);
  }, [setTrains]);

  // Live simulation of Rajdhani Overtake sequence
  const handleSimulateOvertake = () => {
    const rajdhani = trains.get('12301');
    const sampark = trains.get('12393');

    if (!rajdhani || !sampark) return;

    if (simStep === 0) {
      // Step 1: Rajdhani closes distance to 4km
      updateTrain({
        ...rajdhani,
        lat: 27.2250,
        lng: 78.2200,
        snappedLat: 27.2250,
        snappedLng: 78.2200,
        kmMarker: 203.2,
        speed: 118,
        nearbyTrains: [{ ...rajdhani.nearbyTrains[0], distanceKm: 4.0 }]
      });

      updateTrain({
        ...sampark,
        contextReasons: [
          {
            priority: 1,
            type: 'LOOPED',
            icon: '🔄',
            title: 'Looped at Tundla Junction',
            subtitle: 'Rajdhani Express approaching behind (4km)',
            detail: '12301 Rajdhani Express is passing Tundla mainline. Signal hold: ~2 min remaining.',
            estimatedHoldMinutes: 2,
            relatedTrain: 'Howrah Rajdhani Express',
            confidence: 'HIGH'
          }
        ],
        nearbyTrains: [{ ...sampark.nearbyTrains[0], distanceKm: 4.0 }]
      });

      setSimStep(1);
    } else if (simStep === 1) {
      // Step 2: Rajdhani overtakes right beside Tundla
      updateTrain({
        ...rajdhani,
        lat: 27.2063,
        lng: 78.2411,
        snappedLat: 27.2063,
        snappedLng: 78.2411,
        kmMarker: 207.2,
        speed: 124,
        nearbyTrains: [{ ...rajdhani.nearbyTrains[0], distanceKm: 0.2, position: 'AHEAD' }]
      });

      updateTrain({
        ...sampark,
        contextReasons: [
          {
            priority: 1,
            type: 'LOOPED',
            icon: '⚡',
            title: 'Overtake in Progress!',
            subtitle: '12301 Howrah Rajdhani passing on Mainline at 124 km/h',
            detail: 'You are currently stopped on Tundla Loop 1. Accelerating after block clearance.',
            estimatedHoldMinutes: 1,
            relatedTrain: 'Howrah Rajdhani Express',
            confidence: 'HIGH'
          }
        ],
        nearbyTrains: [{ ...sampark.nearbyTrains[0], distanceKm: 0.2, position: 'AHEAD' }]
      });

      setSimStep(2);
    } else {
      // Step 3: Rajdhani speeds ahead, Sampark Kranti leaves loop siding and accelerates to 88 km/h!
      updateTrain({
        ...rajdhani,
        lat: 27.1511,
        lng: 78.3965,
        snappedLat: 27.1511,
        snappedLng: 78.3965,
        kmMarker: 223.8,
        speed: 120,
        nearbyTrains: [{ ...rajdhani.nearbyTrains[0], distanceKm: 16.6, position: 'AHEAD' }]
      });

      updateTrain({
        ...sampark,
        status: 'RUNNING',
        isOnLoopLine: false,
        lateralOffset: 0.8,
        speed: 88,
        slowDuration: 0,
        contextReasons: [
          {
            priority: 5,
            type: 'UNKNOWN',
            icon: '🚀',
            title: 'Accelerating on Mainline',
            subtitle: 'Departed Tundla Siding after Rajdhani overtake',
            detail: 'Green signal locked towards Firozabad & Kanpur Central.',
            confidence: 'HIGH'
          }
        ],
        nearbyTrains: [{ ...sampark.nearbyTrains[0], distanceKm: 16.6, position: 'AHEAD' }]
      });

      setSimStep(0);
    }
  };

  const handleResetSimulation = () => {
    setSimStep(0);
    window.location.reload();
  };

  const selectedTrain = selectedTrainNo ? trains.get(selectedTrainNo) : null;
  const trainList = Array.from(trains.values());

  const filteredTrains = trainList.filter(
    (t) =>
      t.trainNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.trainName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={`relative w-screen h-screen overflow-hidden ${theme === 'light' ? 'bg-slate-100 text-slate-900' : 'bg-bgPrimary text-textPrimary'}`}>
      {/* Background MapLibre Canvas */}
      <MapView stations={stationsData as Station[]} routeGeoJSON={routeData} />

      {/* Top Header Bar & Search */}
      <header className="absolute top-0 left-0 right-0 z-20 p-3 pointer-events-auto">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
          {/* Logo & App Name */}
          <div className={`flex items-center gap-3 ${theme === 'light' ? 'bg-white/90 border-slate-200 text-slate-900' : 'bg-bgCardElevated/90 border-slate-700/80 text-textPrimary'} backdrop-blur-md px-3.5 py-2 rounded-2xl border shadow-2xl`}>
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-accentBlue to-cyan-400 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-accentBlue/30">
              TP
            </div>
            <div>
              <h1 className="font-extrabold text-sm tracking-tight flex items-center gap-1.5">
                TrackPulse <span className="text-[10px] px-1.5 py-0.2 bg-amber-500/20 text-amber-500 border border-amber-500/30 rounded font-mono font-bold">INDIA</span>
              </h1>
              <p className={`text-[10px] font-mono leading-none ${theme === 'light' ? 'text-slate-500' : 'text-textSecondary'}`}>
                Spatial Rail Intelligence
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
                className={`w-full ${theme === 'light' ? 'bg-white/90 border-slate-300 text-slate-900 placeholder:text-slate-400' : 'bg-bgCardElevated/90 border-slate-700/80 text-textPrimary placeholder:text-slate-500'} backdrop-blur-md border text-xs rounded-2xl pl-9 pr-4 py-2.5 focus:outline-none focus:border-accentBlue shadow-2xl transition-all`}
              />
            </div>

            {/* Search Dropdown */}
            {isSearchOpen && searchQuery.length > 0 && (
              <div className={`absolute top-12 left-0 right-0 ${theme === 'light' ? 'bg-white border-slate-300' : 'bg-bgCard border-slate-700'} border rounded-2xl p-2 shadow-2xl z-30 max-h-60 overflow-y-auto`}>
                {filteredTrains.map((t) => (
                  <button
                    key={t.trainNo}
                    onClick={() => {
                      selectTrain(t.trainNo);
                      setIsSearchOpen(false);
                      setSearchQuery('');
                    }}
                    className={`w-full text-left p-2 ${theme === 'light' ? 'hover:bg-slate-100' : 'hover:bg-slate-800/70'} rounded-xl flex items-center justify-between text-xs transition-colors`}
                  >
                    <div className="flex items-center gap-2">
                      <Train className="w-3.5 h-3.5 text-accentBlue" />
                      <span className="font-bold">{t.trainName}</span>
                      <span className="text-slate-400 font-mono">({t.trainNo})</span>
                    </div>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${theme === 'light' ? 'bg-slate-100 border-slate-200 text-slate-700' : 'bg-slate-900 border-slate-800 text-slate-300'}`}>
                      {t.status}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Theme Toggle, Mode Toggle & GPS Simulation Controls */}
          <div className="flex items-center gap-2">
            <GPSReporter
              onSimulateOvertake={handleSimulateOvertake}
              onResetSimulation={handleResetSimulation}
            />
            <ModeToggle />
            <ThemeToggle />
          </div>
        </div>

        {/* Section Telemetry Banner (Railfan View) */}
        {mode === 'RAILFAN' && (
          <div className={`max-w-6xl mx-auto mt-2 ${theme === 'light' ? 'bg-white/95 border-slate-300 text-slate-800' : 'bg-slate-950/90 border-slate-800 text-slate-300'} backdrop-blur-md border rounded-xl p-2 px-3 flex items-center justify-between text-xs font-mono shadow-xl`}>
            <div className="flex items-center gap-3">
              <span className="text-amber-500 font-bold flex items-center gap-1">
                <Layers className="w-3.5 h-3.5" /> SECTION: TDL-CNB
              </span>
              <span>•</span>
              <span>Congestion: <strong className="text-amber-600">MEDIUM (2 Trains Active)</strong></span>
            </div>
            <div className="flex items-center gap-2 text-slate-500 text-[11px]">
              <span>Block Section <strong>TDL-MARK</strong> occupied by <strong>12301 Rajdhani</strong></span>
            </div>
          </div>
        )}

        {/* Train Selector Tabs */}
        <div className="max-w-6xl mx-auto mt-2 flex items-center gap-2 overflow-x-auto pb-1">
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

      {/* Draggable Bottom Sheet with Context Engine Data */}
      {selectedTrain && <BottomSheet train={selectedTrain} />}
    </div>
  );
}
