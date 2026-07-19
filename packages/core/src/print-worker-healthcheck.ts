import { stat } from 'node:fs/promises';

async function main(): Promise<void> {
  const healthFile = process.env.PRINT_WORKER_HEALTH_FILE;
  const intervalMs = readNumberEnv('PRINT_WORKER_INTERVAL_MS', 3000);
  const maximumAgeMs = Math.max(intervalMs * 4, 15000);

  if (!healthFile) {
    throw new Error('PRINT_WORKER_HEALTH_FILE is required.');
  }

  const file = await stat(healthFile);

  if (Date.now() - file.mtimeMs > maximumAgeMs) {
    throw new Error('Print worker heartbeat is stale.');
  }
}

function readNumberEnv(name: string, fallback: number): number {
  const value = process.env[name];
  const parsed = value ? Number(value) : Number.NaN;

  return Number.isFinite(parsed) ? parsed : fallback;
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
