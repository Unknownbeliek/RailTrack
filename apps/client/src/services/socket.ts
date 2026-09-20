import { io, Socket } from 'socket.io-client';
import { useTrainStore } from '../stores/trainStore';
import { TrainState } from '../types';

let socket: Socket | null = null;

export function initSocket() {
  if (socket) return socket;

  socket = io({
    transports: ['websocket', 'polling'],
    reconnectionAttempts: 20,
    reconnectionDelay: 1000,
  });

  socket.on('connect', () => {
    console.log('[Socket] connected', socket?.id);
    useTrainStore.getState().setBackendOnline(true);
  });

  const applyList = (trains: TrainState[]) => {
    if (Array.isArray(trains) && trains.length) {
      useTrainStore.getState().setTrains(trains);
    }
  };

  socket.on('train:all', applyList);
  socket.on('trains:snapshot', applyList);

  socket.on('train:state', (train: TrainState) => {
    if (train?.trainNo) useTrainStore.getState().updateTrain(train);
  });

  socket.on('simulation:step', (data: { step: number; message: string }) => {
    useTrainStore.getState().setSimulationStep(data.step);
  });

  socket.on('simulation:reset', () => {
    useTrainStore.getState().setSimulationStep(0);
  });

  socket.on('simulation:focus', (data: { lng: number; lat: number; zoom?: number }) => {
    if (data?.lng && data?.lat) {
      useTrainStore.getState().setFocusRequest({
        lng: data.lng,
        lat: data.lat,
        zoom: data.zoom || 9,
      });
    }
  });

  socket.on('disconnect', () => {
    useTrainStore.getState().setBackendOnline(false);
  });

  return socket;
}

export function getSocket(): Socket | null {
  return socket;
}

export function emitGPSReport(report: any) {
  if (socket?.connected) socket.emit('gps:report', report);
}

export function subscribeToTrain(trainNo: string) {
  if (socket?.connected) socket.emit('train:subscribe', trainNo);
}

export function triggerSocketSimulation() {
  if (socket?.connected) socket.emit('simulation:trigger');
}

export function resetSocketSimulation() {
  if (socket?.connected) socket.emit('simulation:reset');
}
