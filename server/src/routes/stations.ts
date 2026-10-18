import { Router, Request, Response } from 'express';
import { getDatabase } from '../db';

export const stationsRouter = Router();

// GET /api/stations
stationsRouter.get('/', async (req: Request, res: Response) => {
  try {
    const { search, zone } = req.query;
    const db = getDatabase();
    const stations = await db.getAllStations({
      search: search ? String(search) : undefined,
      zone: zone ? String(zone) : undefined,
    });
    return res.json(stations);
  } catch (err: any) {
    console.error('Error fetching stations:', err);
    return res.status(500).json({ error: 'Failed to retrieve stations' });
  }
});

stationsRouter.get('/geojson', async (_req: Request, res: Response) => {
  try {
    const { buildNetwork } = await import('../seed/network');
    return res.json(buildNetwork().stationsGeoJSON);
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to build stations GeoJSON' });
  }
});

// GET /api/stations/:code
stationsRouter.get('/:code', async (req: Request, res: Response) => {
  try {
    const { code } = req.params;
    const db = getDatabase();
    const station = await db.getStationByCode(code);
    if (!station) {
      return res.status(404).json({ error: `Station with code '${code}' not found` });
    }
    return res.json(station);
  } catch (err: any) {
    console.error('Error fetching station details:', err);
    return res.status(500).json({ error: 'Failed to retrieve station details' });
  }
});
