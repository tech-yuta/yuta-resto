import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Singleton pattern prevents exhausting connections during Next.js hot reload in development.
declare global {
  // eslint-disable-next-line no-var
  var _pgClient: ReturnType<typeof postgres> | undefined;
}

// max:3 is sufficient for a single-display kiosk — keeps server RAM low.
const client = global._pgClient ?? postgres(process.env.DATABASE_URL!, { max: 3 });

if (process.env.NODE_ENV !== 'production') {
  global._pgClient = client;
}

export const db = drizzle(client, { schema });
