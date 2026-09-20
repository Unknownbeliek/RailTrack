import { create } from 'zustand';
import { TrainState } from '../types';

interface LayersVisibility {
  zones: boolean;
  tracksMain: boolean;
  tracksBranch: boolean;
  sidings: boolean;
  speeds: boolean;
  stations: boolean;
}

interface TrainStore {
  trains: Map<string, TrainState>;
  selectedTrainNo: string | null;
  mode: 'PASSENGER' | 'RAILFAN';
  theme: 'dark' | 'light';
  followTrain: boolean;
  isSimulating: boolean;
  simulationStep: number;
  layersVisible: LayersVisibility;
  isReportingGps: boolean;

  // Actions
  setTrains: (trains: TrainState[]) => void;
  updateTrain: (train: TrainState) => void;
  selectTrain: (trainNo: string | null) => void;
  setMode: (mode: 'PASSENGER' | 'RAILFAN') => void;
  setTheme: (theme: 'dark' | 'light') => void;
  toggleTheme: () => void;
  setFollowTrain: (follow: boolean) => void;
  setSimulating: (simulating: boolean) => void;
  setSimulationStep: (step: number) => void;
  nextSimulationStep: () => void;
  setLayersVisible: (layers: Partial<LayersVisibility>) => void;
  setIsReportingGps: (reporting: boolean) => void;
}

export const useTrainStore = create<TrainStore>((set) => ({
  trains: new Map<string, TrainState>(),
  selectedTrainNo: '12393',
  mode: 'PASSENGER',
  theme: 'dark',
  followTrain: true,
  isSimulating: true,
  simulationStep: 0,
  isReportingGps: false,
  layersVisible: {
    zones: true,
    tracksMain: true,
    tracksBranch: true,
    sidings: true,
    speeds: true,
    stations: true,
  },

  setTrains: (trainList) => {
    const map = new Map<string, TrainState>();
    trainList.forEach((t) => map.set(t.trainNo, t));
    set({ trains: map });
  },

  updateTrain: (train) => {
    set((state) => {
      const updated = new Map(state.trains);
      updated.set(train.trainNo, train);
      return { trains: updated };
    });
  },

  selectTrain: (trainNo) => set({ selectedTrainNo: trainNo }),

  setMode: (mode) => set({ mode }),

  setTheme: (theme) => set({ theme }),

  toggleTheme: () =>
    set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),

  setFollowTrain: (follow) => set({ followTrain: follow }),

  setSimulating: (simulating) => set({ isSimulating: simulating }),

  setSimulationStep: (step) => set({ simulationStep: step }),

  nextSimulationStep: () =>
    set((state) => ({ simulationStep: state.simulationStep + 1 })),

  setLayersVisible: (layers) =>
    set((state) => ({
      layersVisible: { ...state.layersVisible, ...layers },
    })),

  setIsReportingGps: (reporting) => set({ isReportingGps: reporting }),
}));
