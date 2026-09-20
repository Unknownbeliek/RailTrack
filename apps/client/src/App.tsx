import React, { useEffect, useState } from 'react';
import { Routes, Route, useParams } from 'react-router-dom';
import { useTrainStore } from './stores/trainStore';
import { useAuthStore } from './stores/authStore';
import { MapView } from './components/map/MapView';
import { BottomSheet } from './components/panels/BottomSheet';
import { Header } from './components/header/Header';
import { AuthModal } from './components/auth/AuthModal';
import { initSocket } from './services/socket';
import { apiGetTrains, apiGetStations } from './services/api';
import { Station } from './types';

function DashboardView() {
  const { trainNo } = useParams<{ trainNo?: string }>();
  const { trains, selectedTrainNo, selectTrain, setTrains, theme } = useTrainStore();
  const { initializeAuth } = useAuthStore();
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [stations, setStations] = useState<Station[]>([]);

  // Synchronize URL train param
  useEffect(() => {
    if (trainNo && trains.has(trainNo)) {
      selectTrain(trainNo);
    }
  }, [trainNo, trains, selectTrain]);

  // Synchronize document theme
  useEffect(() => {
    if (theme === 'light') {
      document.body.classList.add('light');
    } else {
      document.body.classList.remove('light');
    }
  }, [theme]);

  // Initialize socket and fetch initial data
  useEffect(() => {
    initializeAuth();
    initSocket();

    // Fetch initial trains & stations via REST API
    apiGetTrains()
      .then((data) => {
        if (data && data.length > 0) {
          setTrains(data);
        }
      })
      .catch((e) => console.warn('Could not fetch trains from /api/trains:', e));

    apiGetStations()
      .then((data) => {
        if (data && data.length > 0) {
          setStations(data);
        }
      })
      .catch((e) => console.warn('Could not fetch stations from /api/stations:', e));
  }, []);

  const selectedTrain = selectedTrainNo ? trains.get(selectedTrainNo) : null;

  return (
    <div
      className={`relative w-screen h-screen overflow-hidden ${
        theme === 'light' ? 'bg-slate-100 text-slate-900' : 'bg-bgPrimary text-textPrimary'
      }`}
    >
      {/* Background Interactive MapLibre Canvas with IRI Layers */}
      <MapView stations={stations} />

      {/* Top Header Navigation */}
      <Header onOpenAuth={() => setIsAuthOpen(true)} />

      {/* Kinematics & Context Bottom Sheet */}
      {selectedTrain && <BottomSheet train={selectedTrain} />}

      {/* Auth Modal (Login / Register) */}
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </div>
  );
}

export function App() {
  return (
    <Routes>
      <Route path="/" element={<DashboardView />} />
      <Route path="/train/:trainNo" element={<DashboardView />} />
      <Route path="*" element={<DashboardView />} />
    </Routes>
  );
}

export default App;
