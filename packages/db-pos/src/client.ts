import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { readPosDatabaseEnv } from './env';
import * as schema from './schema';

export function createPosDatabaseClient(
  environment: NodeJS.ProcessEnv = process.env,
) {
  const env = readPosDatabaseEnv(environment);
  const client = postgres(env.POS_DATABASE_URL, { ssl: false });

  return drizzle(client, { schema });
}

export type PosDatabaseClient = ReturnType<typeof createPosDatabaseClient>;
export type PosDatabaseExecutor = Omit<PosDatabaseClient, '$client'>;
