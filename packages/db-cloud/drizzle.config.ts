import { config } from 'dotenv';
import { defineConfig } from 'drizzle-kit';
import { z } from 'zod';

config({ path: '.env.local' });
config({ path: '.env' });

const cliEnv = z
  .object({
    CLOUD_DATABASE_URL: z.string().url(),
  })
  .parse(process.env);

export default defineConfig({
  schema: './src/schema/index.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: cliEnv.CLOUD_DATABASE_URL,
  },
});
