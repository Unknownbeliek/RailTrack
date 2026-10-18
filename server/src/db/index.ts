import { IDatabase } from './types';
import { MemoryDatabaseAdapter } from './memory';
import { MongoDatabaseAdapter } from './mongo';
import { SqliteDatabaseAdapter } from './sqlite';
import { PostgresDatabaseAdapter } from './postgres';
import { config } from '../config';

export * from './types';

let dbInstance: IDatabase | null = null;

export function getDatabase(dbType?: string): IDatabase {
  if (dbInstance) return dbInstance;

  const type = (dbType || config.dbType || 'memory').toLowerCase();
  console.log(`[DB Factory] Initializing database provider: ${type}`);

  switch (type) {
    case 'mongodb':
    case 'mongo':
      dbInstance = new MongoDatabaseAdapter();
      break;
    case 'sqlite':
    case 'sqlite3':
      dbInstance = new SqliteDatabaseAdapter();
      break;
    case 'postgres':
    case 'postgresql':
    case 'pg':
      dbInstance = new PostgresDatabaseAdapter();
      break;
    case 'memory':
    default:
      dbInstance = new MemoryDatabaseAdapter();
      break;
  }

  return dbInstance;
}
