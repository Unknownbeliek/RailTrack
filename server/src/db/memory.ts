import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { IDatabase, User, TelemetryLog, StationFilter } from './types';
import { TrainState, Station } from '../../../../packages/core/types/train';
import { getInitialDemoTrains, loadStationsData } from '../seed/demoData';

export class MemoryDatabaseAdapter implements IDatabase {
  readonly dbType = 'memory';
  private users: Map<string, User> = new Map();
  private trains: Map<string, TrainState> = new Map();
  private stations: Map<string, Station> = new Map();
  private telemetryLogs: TelemetryLog[] = [];

  async connect(): Promise<void> {
    console.log('[DB:Memory] Initializing in-memory database adapter...');
    
    // Seed default users if empty
    if (this.users.size === 0) {
      const railfanPasswordHash = await bcrypt.hash('trackpulse123', 10);
      const adminPasswordHash = await bcrypt.hash('admin123', 10);

      const railfanUser: User = {
        id: 'usr_railfan_01',
        email: 'railfan@trackpulse.in',
        name: 'TrackPulse Railfan',
        password: railfanPasswordHash,
        role: 'railfan',
        createdAt: new Date(),
      };

      const adminUser: User = {
        id: 'usr_admin_01',
        email: 'admin@trackpulse.in',
        name: 'System Admin',
        password: adminPasswordHash,
        role: 'admin',
        createdAt: new Date(),
      };

      this.users.set(railfanUser.email.toLowerCase(), railfanUser);
      this.users.set(adminUser.email.toLowerCase(), adminUser);
    }

    // Seed demo trains
    if (this.trains.size === 0) {
      const demoTrains = getInitialDemoTrains();
      demoTrains.forEach((t) => this.trains.set(t.trainNo, t));
    }

    // Seed stations
    if (this.stations.size === 0) {
      const stationsList = loadStationsData();
      stationsList.forEach((s) => this.stations.set(s.code.toUpperCase(), s));
    }

    console.log(
      `[DB:Memory] Ready with ${this.users.size} users, ${this.trains.size} trains, ${this.stations.size} stations.`
    );
  }

  async disconnect(): Promise<void> {
    console.log('[DB:Memory] Disconnecting in-memory database.');
  }

  // Users
  async findUserByEmail(email: string): Promise<User | null> {
    return this.users.get(email.toLowerCase()) || null;
  }

  async findUserById(id: string): Promise<User | null> {
    for (const user of this.users.values()) {
      if (user.id === id) return user;
    }
    return null;
  }

  async createUser(userData: Omit<User, 'id' | 'createdAt'>): Promise<User> {
    const user: User = {
      ...userData,
      id: `usr_${crypto.randomUUID()}`,
      createdAt: new Date(),
    };
    this.users.set(user.email.toLowerCase(), user);
    return user;
  }

  // Trains
  async getAllTrains(): Promise<TrainState[]> {
    return Array.from(this.trains.values());
  }

  async getTrainByNo(trainNo: string): Promise<TrainState | null> {
    return this.trains.get(trainNo) || null;
  }

  async upsertTrain(train: TrainState): Promise<TrainState> {
    this.trains.set(train.trainNo, train);
    return train;
  }

  async resetTrains(initialTrains: TrainState[]): Promise<TrainState[]> {
    this.trains.clear();
    initialTrains.forEach((t) => this.trains.set(t.trainNo, t));
    return initialTrains;
  }

  // Stations
  async getAllStations(filter?: StationFilter): Promise<Station[]> {
    let list = Array.from(this.stations.values());
    if (filter?.zone) {
      const z = filter.zone.toUpperCase();
      list = list.filter((s) => s.zone?.toUpperCase() === z);
    }
    if (filter?.search) {
      const q = filter.search.toLowerCase();
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.code.toLowerCase().includes(q) ||
          s.division?.toLowerCase().includes(q)
      );
    }
    return list;
  }

  async getStationByCode(code: string): Promise<Station | null> {
    return this.stations.get(code.toUpperCase()) || null;
  }

  // Telemetry logs
  async logTelemetry(telemetry: Omit<TelemetryLog, 'id'>): Promise<TelemetryLog> {
    const log: TelemetryLog = {
      ...telemetry,
      id: `tel_${crypto.randomUUID()}`,
    };
    this.telemetryLogs.push(log);
    // Keep max 1000 logs in memory
    if (this.telemetryLogs.length > 1000) {
      this.telemetryLogs.shift();
    }
    return log;
  }

  async getTelemetryHistory(trainNo: string, limit: number = 50): Promise<TelemetryLog[]> {
    return this.telemetryLogs
      .filter((t) => t.trainNo === trainNo)
      .slice(-limit);
  }
}
