import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { IDatabase, User, TelemetryLog, StationFilter } from './types';
import { TrainState, Station } from '../../../../packages/core/types/train';
import { config } from '../config';
import { MemoryDatabaseAdapter } from './memory';
import { getInitialDemoTrains, loadStationsData } from '../seed/demoData';

const UserSchema = new Schema({
  id: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'railfan', 'admin'], default: 'user' },
  createdAt: { type: Date, default: Date.now },
});

const TrainSchema = new Schema({
  trainNo: { type: String, required: true, unique: true, index: true },
  state: { type: Schema.Types.Mixed, required: true },
});

const StationSchema = new Schema({
  code: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
  kmMarker: Number,
  hasLoopLine: Boolean,
  loopLineCount: Number,
  platforms: Number,
  zone: { type: String, index: true },
  division: String,
});

const TelemetrySchema = new Schema({
  id: { type: String, required: true, unique: true },
  trainNo: { type: String, required: true, index: true },
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
  speed: { type: Number, required: true },
  heading: Number,
  accuracy: Number,
  timestamp: { type: Date, default: Date.now },
});

export class MongoDatabaseAdapter implements IDatabase {
  readonly dbType = 'mongodb';
  private UserModel: any = mongoose.models.User || mongoose.model('User', UserSchema);
  private TrainModel: any = mongoose.models.Train || mongoose.model('Train', TrainSchema);
  private StationModel: any = mongoose.models.Station || mongoose.model('Station', StationSchema);
  private TelemetryModel: any = mongoose.models.Telemetry || mongoose.model('Telemetry', TelemetrySchema);

  private fallbackAdapter?: MemoryDatabaseAdapter;

  async connect(): Promise<void> {
    try {
      console.log(`[DB:Mongo] Connecting to MongoDB at ${config.mongoUri} ...`);
      mongoose.set('strictQuery', false);
      await mongoose.connect(config.mongoUri, {
        serverSelectionTimeoutMS: 2000,
      });
      console.log('[DB:Mongo] Connected successfully to MongoDB.');

      await this.seedData();
    } catch (err: any) {
      console.warn(
        `[DB:Mongo] MongoDB connection failed (${err.message}). Falling back to Memory Database Adapter.`
      );
      this.fallbackAdapter = new MemoryDatabaseAdapter();
      await this.fallbackAdapter.connect();
    }
  }

  async disconnect(): Promise<void> {
    if (this.fallbackAdapter) {
      await this.fallbackAdapter.disconnect();
    } else {
      await mongoose.disconnect();
      console.log('[DB:Mongo] Disconnected from MongoDB.');
    }
  }

  private async seedData(): Promise<void> {
    const userCount = await this.UserModel.countDocuments();
    if (userCount === 0) {
      const railfanPasswordHash = await bcrypt.hash('trackpulse123', 10);
      const adminPasswordHash = await bcrypt.hash('admin123', 10);

      await this.UserModel.create([
        {
          id: 'usr_railfan_01',
          email: 'railfan@trackpulse.in',
          name: 'TrackPulse Railfan',
          password: railfanPasswordHash,
          role: 'railfan',
          createdAt: new Date(),
        },
        {
          id: 'usr_admin_01',
          email: 'admin@trackpulse.in',
          name: 'System Admin',
          password: adminPasswordHash,
          role: 'admin',
          createdAt: new Date(),
        },
      ]);
    }

    const trainCount = await this.TrainModel.countDocuments();
    if (trainCount === 0) {
      const demoTrains = getInitialDemoTrains();
      for (const t of demoTrains) {
        await this.TrainModel.create({ trainNo: t.trainNo, state: t });
      }
    }

    const stationCount = await this.StationModel.countDocuments();
    if (stationCount === 0) {
      const stations = loadStationsData();
      if (stations.length > 0) {
        await this.StationModel.insertMany(stations);
      }
    }
  }

  // Users
  async findUserByEmail(email: string): Promise<User | null> {
    if (this.fallbackAdapter) return this.fallbackAdapter.findUserByEmail(email);
    const doc = await this.UserModel.findOne({ email: email.toLowerCase() });
    if (!doc) return null;
    return {
      id: doc.id,
      email: doc.email,
      name: doc.name,
      password: doc.password,
      role: doc.role,
      createdAt: doc.createdAt,
    };
  }

  async findUserById(id: string): Promise<User | null> {
    if (this.fallbackAdapter) return this.fallbackAdapter.findUserById(id);
    const doc = await this.UserModel.findOne({ id });
    if (!doc) return null;
    return {
      id: doc.id,
      email: doc.email,
      name: doc.name,
      password: doc.password,
      role: doc.role,
      createdAt: doc.createdAt,
    };
  }

  async createUser(userData: Omit<User, 'id' | 'createdAt'>): Promise<User> {
    if (this.fallbackAdapter) return this.fallbackAdapter.createUser(userData);
    const id = `usr_${crypto.randomUUID()}`;
    const doc = await this.UserModel.create({
      ...userData,
      email: userData.email.toLowerCase(),
      id,
      createdAt: new Date(),
    });
    return {
      id: doc.id,
      email: doc.email,
      name: doc.name,
      password: doc.password,
      role: doc.role,
      createdAt: doc.createdAt,
    };
  }

  // Trains
  async getAllTrains(): Promise<TrainState[]> {
    if (this.fallbackAdapter) return this.fallbackAdapter.getAllTrains();
    const docs = await this.TrainModel.find({});
    return docs.map((d: any) => d.state as TrainState);
  }

  async getTrainByNo(trainNo: string): Promise<TrainState | null> {
    if (this.fallbackAdapter) return this.fallbackAdapter.getTrainByNo(trainNo);
    const doc = await this.TrainModel.findOne({ trainNo });
    return doc ? (doc.state as TrainState) : null;
  }

  async upsertTrain(train: TrainState): Promise<TrainState> {
    if (this.fallbackAdapter) return this.fallbackAdapter.upsertTrain(train);
    await this.TrainModel.findOneAndUpdate(
      { trainNo: train.trainNo },
      { state: train },
      { upsert: true, new: true }
    );
    return train;
  }

  async resetTrains(initialTrains: TrainState[]): Promise<TrainState[]> {
    if (this.fallbackAdapter) return this.fallbackAdapter.resetTrains(initialTrains);
    await this.TrainModel.deleteMany({});
    for (const t of initialTrains) {
      await this.TrainModel.create({ trainNo: t.trainNo, state: t });
    }
    return initialTrains;
  }

  // Stations
  async getAllStations(filter?: StationFilter): Promise<Station[]> {
    if (this.fallbackAdapter) return this.fallbackAdapter.getAllStations(filter);
    const query: any = {};
    if (filter?.zone) {
      query.zone = filter.zone.toUpperCase();
    }
    if (filter?.search) {
      const regex = new RegExp(filter.search, 'i');
      query.$or = [{ name: regex }, { code: regex }, { division: regex }];
    }
    const docs = await this.StationModel.find(query);
    return docs.map((d: any) => ({
      code: d.code,
      name: d.name,
      lat: d.lat,
      lng: d.lng,
      kmMarker: d.kmMarker,
      hasLoopLine: d.hasLoopLine,
      loopLineCount: d.loopLineCount,
      platforms: d.platforms,
      zone: d.zone,
      division: d.division,
    }));
  }

  async getStationByCode(code: string): Promise<Station | null> {
    if (this.fallbackAdapter) return this.fallbackAdapter.getStationByCode(code);
    const doc = await this.StationModel.findOne({ code: code.toUpperCase() });
    if (!doc) return null;
    return {
      code: doc.code,
      name: doc.name,
      lat: doc.lat,
      lng: doc.lng,
      kmMarker: doc.kmMarker,
      hasLoopLine: doc.hasLoopLine,
      loopLineCount: doc.loopLineCount,
      platforms: doc.platforms,
      zone: doc.zone,
      division: doc.division,
    };
  }

  // Telemetry logs
  async logTelemetry(telemetry: Omit<TelemetryLog, 'id'>): Promise<TelemetryLog> {
    if (this.fallbackAdapter) return this.fallbackAdapter.logTelemetry(telemetry);
    const id = `tel_${crypto.randomUUID()}`;
    const doc = await this.TelemetryModel.create({
      ...telemetry,
      id,
      timestamp: telemetry.timestamp || new Date(),
    });
    return {
      id: doc.id,
      trainNo: doc.trainNo,
      lat: doc.lat,
      lng: doc.lng,
      speed: doc.speed,
      heading: doc.heading,
      accuracy: doc.accuracy,
      timestamp: doc.timestamp,
    };
  }

  async getTelemetryHistory(trainNo: string, limit: number = 50): Promise<TelemetryLog[]> {
    if (this.fallbackAdapter) return this.fallbackAdapter.getTelemetryHistory(trainNo, limit);
    const docs = await this.TelemetryModel.find({ trainNo }).sort({ timestamp: -1 }).limit(limit);
    return docs.reverse().map((d: any) => ({
      id: d.id,
      trainNo: d.trainNo,
      lat: d.lat,
      lng: d.lng,
      speed: d.speed,
      heading: d.heading,
      accuracy: d.accuracy,
      timestamp: d.timestamp,
    }));
  }
}
