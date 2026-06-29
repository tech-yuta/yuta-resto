import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from 'dotenv';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(currentDir, '../../..');

for (const envPath of [
  path.join(repoRoot, '.env.local'),
  path.join(repoRoot, '.env'),
  path.join(repoRoot, 'packages/core/.env.local'),
  path.join(repoRoot, 'packages/core/.env'),
  path.join(repoRoot, 'packages/db/.env.local'),
  path.join(repoRoot, 'packages/db/.env'),
]) {
  config({ path: envPath });
}

const args = new Set(process.argv.slice(2));
const watch = args.has('--watch');
const intervalMs = readNumberEnv('PRINT_WORKER_INTERVAL_MS', 3000);
const batchSize = readNumberEnv('PRINT_WORKER_BATCH_SIZE', 10);
const failRate = readNumberEnv('PRINT_WORKER_FAIL_RATE', 0);
const outputDir = process.env.PRINT_WORKER_OUTPUT_DIR;

async function runOnce(): Promise<void> {
  const [{ db }, { processPendingPrintJobs }] = await Promise.all([
    import('@yuta/db/client'),
    import('./print-worker'),
  ]);
  const result = await processPendingPrintJobs(db, {
    batchSize,
    failRate,
    outputDir,
  });

  console.log(
    [
      `print-worker scanned=${result.scanned}`,
      `printed=${result.printed}`,
      `failed=${result.failed}`,
      `skipped=${result.skipped}`,
    ].join(' '),
  );
}

async function main(): Promise<void> {
  if (!watch) {
    await runOnce();
    process.exit(0);
  }

  console.log(`print-worker polling every ${intervalMs}ms`);
  await runOnce();
  setInterval(() => {
    runOnce().catch((error: unknown) => {
      console.error(error);
    });
  }, intervalMs);
}

function readNumberEnv(name: string, fallback: number): number {
  const value = process.env[name];

  if (!value) {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
