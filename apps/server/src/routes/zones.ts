import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { config } from '../config';

export const zonesRouter = Router();

const ZONE_METADATA = [
  { code: 'NR', name: 'Northern Railway', color: '#C8E6C9', hq: 'New Delhi' },
  { code: 'NCR', name: 'North Central Railway', color: '#BBDEFB', hq: 'Prayagraj' },
  { code: 'CR', name: 'Central Railway', color: '#FFE0B2', hq: 'Mumbai CSMT' },
  { code: 'WR', name: 'Western Railway', color: '#F8BBD0', hq: 'Mumbai Churchgate' },
  { code: 'SCR', name: 'South Central Railway', color: '#E1BEE7', hq: 'Secunderabad' },
  { code: 'SR', name: 'Southern Railway', color: '#B2DFDB', hq: 'Chennai' },
  { code: 'ER', name: 'Eastern Railway', color: '#FFF9C4', hq: 'Kolkata' },
  { code: 'ECR', name: 'East Central Railway', color: '#DCEDC8', hq: 'Hajipur' },
  { code: 'NER', name: 'North Eastern Railway', color: '#B3E5FC', hq: 'Gorakhpur' },
  { code: 'NFR', name: 'Northeast Frontier Railway', color: '#C5CAE9', hq: 'Maligaon' },
  { code: 'SECR', name: 'South East Central Railway', color: '#FFCCBC', hq: 'Bilaspur' },
  { code: 'SWR', name: 'South Western Railway', color: '#D7CCC8', hq: 'Hubballi' },
  { code: 'WCR', name: 'West Central Railway', color: '#F0F4C3', hq: 'Jabalpur' },
  { code: 'ECoR', name: 'East Coast Railway', color: '#B2EBF2', hq: 'Bhubaneswar' },
  { code: 'NWR', name: 'North Western Railway', color: '#FFECB3', hq: 'Jaipur' },
  { code: 'SER', name: 'South Eastern Railway', color: '#FFAB91', hq: 'Garden Reach' },
  { code: 'KR', name: 'Konkan Railway', color: '#80CBC4', hq: 'Navi Mumbai' },
];

let zonesGeoJSONCache: any = null;

// GET /api/zones
zonesRouter.get('/', (_req: Request, res: Response) => {
  return res.json({
    count: ZONE_METADATA.length,
    zones: ZONE_METADATA,
  });
});

// GET /api/zones/geojson
zonesRouter.get('/geojson', (_req: Request, res: Response) => {
  try {
    if (zonesGeoJSONCache) {
      return res.json(zonesGeoJSONCache);
    }
    const filePath = path.join(config.dataDir, 'geojson', 'zones-all.geojson');
    if (fs.existsSync(filePath)) {
      zonesGeoJSONCache = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      return res.json(zonesGeoJSONCache);
    }
    return res.status(404).json({ error: 'Zones GeoJSON file not found' });
  } catch (err: any) {
    console.error('Error reading zones GeoJSON:', err);
    return res.status(500).json({ error: 'Failed to read zones GeoJSON' });
  }
});
