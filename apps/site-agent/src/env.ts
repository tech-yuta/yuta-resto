import { z } from 'zod';

export const siteAgentEnvSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  POS_DATABASE_URL: z.string().url(),
  SITE_AGENT_HOST: z.string().min(1).default('127.0.0.1'),
  SITE_AGENT_PORT: z.coerce.number().int().min(1).max(65535).default(3004),
  SITE_AGENT_ALLOWED_ORIGIN: z.string().url().default('http://localhost:3003'),
  POS_PRINTER_DEVICE: z.string().min(1).optional(),
  POS_PRINT_POLL_INTERVAL_MS: z.coerce
    .number()
    .int()
    .min(250)
    .max(60_000)
    .default(1_000),
});

export type SiteAgentEnv = z.infer<typeof siteAgentEnvSchema>;

export function readSiteAgentEnv(
  environment: NodeJS.ProcessEnv = process.env,
): SiteAgentEnv {
  return siteAgentEnvSchema.parse(environment);
}
