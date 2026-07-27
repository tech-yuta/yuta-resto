import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { z } from 'zod';
import * as schema from './schema';

const displayDatabaseEnvSchema = z.object({
  DISPLAY_DATABASE_URL: z.string().url(),
});

export function createDisplayDatabaseClient(
  environment: NodeJS.ProcessEnv = process.env,
) {
  const env = displayDatabaseEnvSchema.parse(environment);
  const client = postgres(env.DISPLAY_DATABASE_URL, { max: 3 });
  return drizzle(client, { schema });
}

export type DisplayDatabaseClient = ReturnType<
  typeof createDisplayDatabaseClient
>;

declare global {
  var _yutaDisplayDatabase: DisplayDatabaseClient | undefined;
}

export function getDisplayDatabase(): DisplayDatabaseClient {
  if (!global._yutaDisplayDatabase) {
    global._yutaDisplayDatabase = createDisplayDatabaseClient();
  }
  return global._yutaDisplayDatabase;
}
