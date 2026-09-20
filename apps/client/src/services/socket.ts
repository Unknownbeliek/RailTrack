import { io, Socket } from 'socket.io-client';
import { useTrainStore } from '../stores/trainStore';
import { TrainState } from '../types';

let socket: Socket | null = null;

export function initSocket() {
  if (socket) return socket;

  // In production / dev, connect to window.location.origin (proxied by Vite) or configured backend URL
  socket = io({
    transports: ['websocket', 'polling'],
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  socket.on('connect', () => {
    console.log('[Socket.io Client] Connected to TrackPulse backend:', socket?.id);
  });

  socket.on('train:all', (trains: TrainState[]) => {
    console.log('[Socket.io Client] Received initial train list:', trains.length);
    useTrainStore.getState().setTrains(trains);
  });

  socket.on('train:state', (train: TrainState) => {
    useTrainStore.getState().updateTrain(train);
  });

  socket.on('simulation:step', (data: { step: number; message: string }) => {
    console.log('[Socket.io Client] Simulation step:', data.step, data.message);
    useTrainStore.getState().setSimulationStep(data.step);
  });

  socket.on('simulation:reset', () => {
    console.log('[Socket.io Client] Simulation reset');
    useTrainStore.getState().setSimulationStep(0);
  });

  socket.on('disconnect', () => {
    console.log('[Socket.io Client] Disconnected from server');
  });

  return socket;
}

export function getSocket(): Socket | null {
  return socket;
}

export function emitGPSReport(report: any) {
  if (socket?.connected) {
    socket.emit('gps:report', report);
  }
}

export function subscribeToTrain(trainNo: string) {
  if (socket?.connected) {
    socket.emit('train:subscribe', trainNo);
  }
}

export function triggerSocketSimulation() {
  if (socket?.connected) {
    socket.emit('simulation:trigger');
  }
}

export function resetSocketSimulation() {
  if (socket?.connected) {
    socket.emit('simulation:reset');
  }
}
