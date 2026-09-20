import React, { useEffect, useState } from 'react';
import { Routes, Route, useParams } from 'react-router-dom';
import { useTrainStore } from './stores/trainStore';
import { useAuthStore } from './stores/authStore';
import { MapView } from './components/map/MapView';
import { BottomSheet } from './components/panels/BottomSheet';
import { Header } from './components/header/Header';
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
    document.body.classList.toggle('light', theme === 'light');
  }, [theme]);

  useEffect(() => {
    initializeAuth();
    initSocket();
    apiGetTrains()
      .then((data) => {
        if (data?.length) {
          setTrains(data);
          setBackendOnline(true);
        }
      })
      .catch(() => setBackendOnline(false));
  }, []);

  const selectedTrain = selectedTrainNo ? trains.get(selectedTrainNo) : null;

  return (
    <div
      className={`relative w-screen h-screen overflow-hidden ${
        theme === 'light' ? 'bg-slate-100 text-slate-900' : 'bg-bgPrimary text-textPrimary'
      }`}
    >
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
