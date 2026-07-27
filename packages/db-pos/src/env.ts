import { z } from 'zod';

export const posDatabaseEnvSchema = z.object({
  POS_DATABASE_URL: z.string().url(),
});

export type PosDatabaseEnv = z.infer<typeof posDatabaseEnvSchema>;

export function readPosDatabaseEnv(
  environment: NodeJS.ProcessEnv = process.env,
): PosDatabaseEnv {
  return posDatabaseEnvSchema.parse(environment);
}
