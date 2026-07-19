import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

declare global {
  // eslint-disable-next-line no-var
  var _yutaPgClient: ReturnType<typeof postgres> | undefined;
}

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is required to initialize @yuta/db.');
}

const client = global._yutaPgClient ?? postgres(connectionString, { max: 5 });

if (process.env.NODE_ENV !== 'production') {
  global._yutaPgClient = client;
}

export const db = drizzle(client, { schema });
export type DbClient = Omit<typeof db, '$client'>;
