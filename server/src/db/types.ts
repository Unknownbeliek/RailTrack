import { TrainState, Station } from '../../../../packages/core/types/train';

export interface User {
  id: string;
  email: string;
  name: string;
  password?: string;
  role: 'user' | 'railfan' | 'admin';
  createdAt: Date;
}

export interface TelemetryLog {
  id: string;
  trainNo: string;
  lat: number;
  lng: number;
  speed: number;
  heading?: number;
  accuracy?: number;
  timestamp: Date;
}

export interface StationFilter {
  search?: string;
  zone?: string;
}

export interface IDatabase {
  readonly dbType: string;
  connect(): Promise<void>;
  disconnect(): Promise<void>;

  // Users
  findUserByEmail(email: string): Promise<User | null>;
  findUserById(id: string): Promise<User | null>;
  createUser(user: Omit<User, 'id' | 'createdAt'>): Promise<User>;

  // Trains
  getAllTrains(): Promise<TrainState[]>;
  getTrainByNo(trainNo: string): Promise<TrainState | null>;
  upsertTrain(train: TrainState): Promise<TrainState>;
  resetTrains(initialTrains: TrainState[]): Promise<TrainState[]>;

  // Stations
  getAllStations(filter?: StationFilter): Promise<Station[]>;
  getStationByCode(code: string): Promise<Station | null>;

  // Telemetry logs
  logTelemetry(telemetry: Omit<TelemetryLog, 'id'>): Promise<TelemetryLog>;
  getTelemetryHistory(trainNo: string, limit?: number): Promise<TelemetryLog[]>;
}
