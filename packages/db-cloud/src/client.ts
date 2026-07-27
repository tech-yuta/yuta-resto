import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { readCloudDatabaseEnv } from './env';
import * as schema from './schema';

export function createCloudDatabaseClient(
  environment: NodeJS.ProcessEnv = process.env,
) {
  const env = readCloudDatabaseEnv(environment);
  const client = postgres(env.CLOUD_DATABASE_URL, {
    ssl: env.CLOUD_DATABASE_SSL ? 'require' : false,
  });

  return drizzle(client, { schema });
}

export type CloudDatabaseClient = ReturnType<typeof createCloudDatabaseClient>;
