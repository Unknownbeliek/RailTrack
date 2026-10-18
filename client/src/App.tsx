import React, { useEffect, useState } from 'react';
import { Routes, Route, useParams } from 'react-router-dom';
import { useTrainStore } from './stores/trainStore';
import { useAuthStore } from './stores/authStore';

import { BottomSheet } from './components/panels/BottomSheet';
import { Header } from './components/header/Header';
import { MapView } from './components/map/MapView';
import { AuthModal } from './components/auth/AuthModal';
import { initSocket } from './services/socket';
import { apiGetTrains } from './services/api';

function DashboardView() {
  const { trainNo } = useParams<{ trainNo?: string }>();
  const { trains, selectedTrainNo, selectTrain, setTrains, theme, setBackendOnline } = useTrainStore();
  const { initializeAuth } = useAuthStore();
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  useEffect(() => {
    if (trainNo && trains.has(trainNo)) selectTrain(trainNo);
  }, [trainNo, trains, selectTrain]);

  useEffect(() => {
    document.body.classList.toggle('dark', theme === 'dark');
    document.body.classList.toggle('light', theme === 'light');
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.style.colorScheme = theme;
  }, [theme]);

  useEffect(() => {
    initializeAuth();
    initSocket();
    let cancelled = false;

    const syncTrains = async () => {
      try {
        const data = await apiGetTrains();
        if (cancelled) return;
        setTrains(data || []);
        setBackendOnline(true);
      } catch {
        if (!cancelled) setBackendOnline(false);
      }
    };

    void syncTrains();
    const retryTimer = window.setInterval(syncTrains, 10000);

    return () => {
      cancelled = true;
      window.clearInterval(retryTimer);
    };
  }, []);

  const selectedTrain = selectedTrainNo ? trains.get(selectedTrainNo) : null;

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[var(--bg-primary)]">
      <MapView />
      <Header onOpenAuth={() => setIsAuthOpen(true)} />
      {selectedTrain && <BottomSheet train={selectedTrain} />}
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
