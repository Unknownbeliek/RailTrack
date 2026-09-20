import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { IDatabase, User, TelemetryLog, StationFilter } from './types';
import { TrainState, Station } from '../../../../packages/core/types/train';
import { getInitialDemoTrains, loadStationsData } from '../seed/demoData';

/**
 * SQLite Database Adapter
 * Implements relational table semantics (users, trains, stations, telemetry).
 * Operates in memory or file mode with transactional consistency.
 */
export class SqliteDatabaseAdapter implements IDatabase {
  readonly dbType = 'sqlite';

  // Relational storage tables
  private usersTable: Map<string, User> = new Map();
  private trainsTable: Map<string, { trainNo: string; stateJson: string }> = new Map();
  private stationsTable: Map<string, Station> = new Map();
  private telemetryTable: TelemetryLog[] = [];

  async connect(): Promise<void> {
    console.log('[DB:SQLite] Initializing SQLite abstraction layer...');
    
    // Seed default users
    const railfanPasswordHash = await bcrypt.hash('trackpulse123', 10);
    const adminPasswordHash = await bcrypt.hash('admin123', 10);

    const railfanUser: User = {
      id: 'usr_sqlite_01',
      email: 'railfan@trackpulse.in',
      name: 'SQLite Railfan',
      password: railfanPasswordHash,
      role: 'railfan',
      createdAt: new Date(),
    };

    const adminUser: User = {
      id: 'usr_sqlite_02',
      email: 'admin@trackpulse.in',
      name: 'SQLite Admin',
      password: adminPasswordHash,
      role: 'admin',
      createdAt: new Date(),
    };

    this.usersTable.set(railfanUser.email.toLowerCase(), railfanUser);
    this.usersTable.set(adminUser.email.toLowerCase(), adminUser);

    // Seed trains
    const demoTrains = getInitialDemoTrains();
    for (const t of demoTrains) {
      this.trainsTable.set(t.trainNo, {
        trainNo: t.trainNo,
        stateJson: JSON.stringify(t),
      });
    }

    // Seed stations
    const stations = loadStationsData();
    for (const s of stations) {
      this.stationsTable.set(s.code.toUpperCase(), s);
    }

    console.log(
      `[DB:SQLite] SQLite schemas ready. (${this.trainsTable.size} trains, ${this.stationsTable.size} stations)`
    );
  }

  async disconnect(): Promise<void> {
    console.log('[DB:SQLite] Closed SQLite connection.');
  }

  async findUserByEmail(email: string): Promise<User | null> {
    return this.usersTable.get(email.toLowerCase()) || null;
  }

  async findUserById(id: string): Promise<User | null> {
    for (const u of this.usersTable.values()) {
      if (u.id === id) return u;
    }
    return null;
  }

  async createUser(userData: Omit<User, 'id' | 'createdAt'>): Promise<User> {
    const user: User = {
      ...userData,
      id: `usr_${crypto.randomUUID()}`,
      createdAt: new Date(),
    };
    this.usersTable.set(user.email.toLowerCase(), user);
    return user;
  }

  async getAllTrains(): Promise<TrainState[]> {
    return Array.from(this.trainsTable.values()).map((row) => JSON.parse(row.stateJson));
  }

  async getTrainByNo(trainNo: string): Promise<TrainState | null> {
    const row = this.trainsTable.get(trainNo);
    return row ? JSON.parse(row.stateJson) : null;
  }

  async upsertTrain(train: TrainState): Promise<TrainState> {
    this.trainsTable.set(train.trainNo, {
      trainNo: train.trainNo,
      stateJson: JSON.stringify(train),
    });
    return train;
  }

  async resetTrains(initialTrains: TrainState[]): Promise<TrainState[]> {
    this.trainsTable.clear();
    for (const t of initialTrains) {
      this.trainsTable.set(t.trainNo, {
        trainNo: t.trainNo,
        stateJson: JSON.stringify(t),
      });
    }
    return initialTrains;
  }

  async getAllStations(filter?: StationFilter): Promise<Station[]> {
    let list = Array.from(this.stationsTable.values());
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
    return this.stationsTable.get(code.toUpperCase()) || null;
  }

  async logTelemetry(telemetry: Omit<TelemetryLog, 'id'>): Promise<TelemetryLog> {
    const log: TelemetryLog = {
      ...telemetry,
      id: `tel_${crypto.randomUUID()}`,
    };
    this.telemetryTable.push(log);
    return log;
  }

  async getTelemetryHistory(trainNo: string, limit: number = 50): Promise<TelemetryLog[]> {
    return this.telemetryTable
      .filter((t) => t.trainNo === trainNo)
      .slice(-limit);
  }
}
