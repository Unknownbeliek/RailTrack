import { Router, Request, Response } from 'express';
import { getDatabase } from '../db';
import { config } from '../config';

export const healthRouter = Router();

const startTime = Date.now();

// GET /api/health
healthRouter.get('/', async (_req: Request, res: Response) => {
  try {
    const db = getDatabase();
    const trains = await db.getAllTrains();
    const stations = await db.getAllStations();

    return res.json({
      status: 'ok',
      service: 'TrackPulse MERN Server',
      dbType: db.dbType,
      configuredDbType: config.dbType,
      uptimeSeconds: Math.floor((Date.now() - startTime) / 1000),
      trainsCount: trains.length,
      stationsCount: stations.length,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return res.status(500).json({
      status: 'error',
      message: err.message,
    });
  }
});
