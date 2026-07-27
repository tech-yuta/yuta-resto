import { z } from 'zod';

export const cloudDatabaseEnvSchema = z.object({
  CLOUD_DATABASE_URL: z.string().url(),
  CLOUD_DATABASE_SSL: z
    .enum(['true', 'false'])
    .default('false')
    .transform((value) => value === 'true'),
});

export type CloudDatabaseEnv = z.infer<typeof cloudDatabaseEnvSchema>;

export function readCloudDatabaseEnv(
  environment: NodeJS.ProcessEnv = process.env,
): CloudDatabaseEnv {
  return cloudDatabaseEnvSchema.parse(environment);
}
