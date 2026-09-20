import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

function resolveDataDir(): string {
  const candidates = [
    path.resolve(process.cwd(), 'data'),
    path.resolve(process.cwd(), '../data'),
    path.resolve(process.cwd(), '../../data'),
    path.resolve(__dirname, '../../../../data'),
    path.resolve(__dirname, '../../../data'),
    path.resolve(__dirname, '../../data'),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return path.resolve(process.cwd(), 'data');
}

const resolvedDataDir = resolveDataDir();

export const config = {
  port: parseInt(process.env.PORT || '4000', 10),
  jwtSecret: process.env.JWT_SECRET || 'trackpulse_jwt_secret_railfan_2026',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  dbType: (process.env.DB_TYPE || 'memory').toLowerCase() as 'memory' | 'mongodb' | 'postgres' | 'sqlite',
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/railtrack',
  postgresUrl: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/railtrack',
  sqlitePath: process.env.SQLITE_PATH || ':memory:',
  dataDir: resolvedDataDir,
  routesDir: path.resolve(resolvedDataDir, 'geojson', 'routes'),
};
