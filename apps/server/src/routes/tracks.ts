import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { config } from '../config';

export const tracksRouter = Router();

let tracksGeoJSONCache: any = null;
let speedBadgesGeoJSONCache: any = null;

// GET /api/tracks
tracksRouter.get('/', (_req: Request, res: Response) => {
  return res.json({
    status: 'ok',
    network: 'Indian Railways IRI Network',
    classification: {
      mainline: { color: '#22C55E', speedLimitKmph: 130, usage: 'main' },
      branch: { color: '#4DA8FF', speedLimitKmph: 100, usage: 'branch' },
      siding: { color: '#FB923C', speedLimitKmph: 30, service: 'siding' },
      yard: { color: '#9CA3AF', speedLimitKmph: 15, service: 'yard' },
    },
    sources: ['OpenStreetMap Rail Network', 'IR Working Time Table (WTT)'],
  });
});

// GET /api/tracks/geojson
tracksRouter.get('/geojson', (_req: Request, res: Response) => {
  try {
    if (tracksGeoJSONCache) {
      return res.json(tracksGeoJSONCache);
    }
    const filePath = path.join(config.dataDir, 'geojson', 'tracks-with-speed.geojson');
    if (fs.existsSync(filePath)) {
      tracksGeoJSONCache = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      return res.json(tracksGeoJSONCache);
    }
    return res.status(404).json({ error: 'Tracks GeoJSON file not found' });
  } catch (err: any) {
    console.error('Error reading tracks GeoJSON:', err);
    return res.status(500).json({ error: 'Failed to read tracks GeoJSON' });
  }
});

// GET /api/tracks/speeds
tracksRouter.get('/speeds', (_req: Request, res: Response) => {
  try {
    if (speedBadgesGeoJSONCache) {
      return res.json(speedBadgesGeoJSONCache);
    }
    const filePath = path.join(config.dataDir, 'geojson', 'speed-badges.geojson');
    if (fs.existsSync(filePath)) {
      speedBadgesGeoJSONCache = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      return res.json(speedBadgesGeoJSONCache);
    }
    return res.status(404).json({ error: 'Speed badges GeoJSON file not found' });
  } catch (err: any) {
    console.error('Error reading speed badges GeoJSON:', err);
    return res.status(500).json({ error: 'Failed to read speed badges GeoJSON' });
  }
});
