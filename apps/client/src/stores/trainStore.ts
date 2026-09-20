import { create } from 'zustand';
import { ALL_TYPES } from '../lib/trainStyle';
import { MapDensity, MarkerMode, TrainState, TrainType } from '../types';

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
  markerMode: MarkerMode;
  mapDensity: MapDensity;
  typeFilter: Record<TrainType, boolean>;
  backendOnline: boolean;
  focusRequest: { lng: number; lat: number; zoom: number } | null;

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
  setMarkerMode: (mode: MarkerMode) => void;
  setMapDensity: (density: MapDensity) => void;
  toggleTypeFilter: (type: TrainType) => void;
  setAllTypeFilters: (on: boolean) => void;
  setBackendOnline: (online: boolean) => void;
  setFocusRequest: (focus: { lng: number; lat: number; zoom: number } | null) => void;
}

const allOn = () => {
  const o = {} as Record<TrainType, boolean>;
  ALL_TYPES.forEach((t) => {
    o[t] = true;
  });
  return o;
};

export const useTrainStore = create<TrainStore>((set) => ({
  trains: new Map<string, TrainState>(),
  selectedTrainNo: null,
  mode: 'PASSENGER',
  theme: 'dark',
  followTrain: false,
  isSimulating: true,
  simulationStep: 0,
  isReportingGps: false,
  markerMode: 'typed',
  mapDensity: 'network',
  typeFilter: allOn(),
  backendOnline: false,
  focusRequest: null,
  layersVisible: {
    zones: false,
    tracksMain: true,
    tracksBranch: true,
    sidings: false,
    speeds: false,
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

  setMode: (mode) =>
    set({
      mode,
      mapDensity: mode === 'RAILFAN' ? 'railfan' : 'network',
      layersVisible:
        mode === 'RAILFAN'
          ? { zones: false, tracksMain: true, tracksBranch: true, sidings: true, speeds: false, stations: true }
          : { zones: false, tracksMain: true, tracksBranch: true, sidings: false, speeds: false, stations: true },
    }),

  setTheme: (theme) => set({ theme }),

  toggleTheme: () => set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),

  setFollowTrain: (follow) => set({ followTrain: follow }),

  setSimulating: (simulating) => set({ isSimulating: simulating }),

  setSimulationStep: (step) => set({ simulationStep: step }),

  nextSimulationStep: () => set((state) => ({ simulationStep: state.simulationStep + 1 })),

  setLayersVisible: (layers) =>
    set((state) => ({
      layersVisible: { ...state.layersVisible, ...layers },
    })),

  setIsReportingGps: (reporting) => set({ isReportingGps: reporting }),

  setMarkerMode: (markerMode) => set({ markerMode }),

  setMapDensity: (mapDensity) =>
    set({
      mapDensity,
      mode: mapDensity === 'railfan' ? 'RAILFAN' : 'PASSENGER',
    }),

  toggleTypeFilter: (type) =>
    set((state) => ({
      typeFilter: { ...state.typeFilter, [type]: !state.typeFilter[type] },
    })),

  setAllTypeFilters: (on) => {
    const next = {} as Record<TrainType, boolean>;
    ALL_TYPES.forEach((t) => {
      next[t] = on;
    });
    set({ typeFilter: next });
  },

  setBackendOnline: (backendOnline) => set({ backendOnline }),

  setFocusRequest: (focusRequest) => set({ focusRequest }),
}));
