import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:net';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));
const containerName = `yuta-pos-offline-acceptance-${randomUUID().slice(0, 8)}`;
const pnpmEntrypoint = process.env.npm_execpath;
const siteAgentPort = 3004;
const posPort = 3003;
const posNextEnvPath = join(
  repositoryRoot,
  'apps',
  'yuta-pos',
  'next-env.d.ts',
);
const childProcesses = [];
let containerStarted = false;
let originalPosNextEnv;

function runCommand(command, args, options = {}) {
  return new Promise((resolveCommand, rejectCommand) => {
    const child = spawn(command, args, {
      cwd: repositoryRoot,
      env: options.env ?? process.env,
      shell: false,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk) => {
      const text = chunk.toString();
      stdout += text;
      if (!options.quiet) {
        process.stdout.write(text);
      }
    });
    child.stderr.on('data', (chunk) => {
      const text = chunk.toString();
      stderr += text;
      if (!options.quiet) {
        process.stderr.write(text);
      }
    });
    child.once('error', rejectCommand);
    child.once('exit', (code) => {
      if (code === 0) {
        resolveCommand({ stdout: stdout.trim(), stderr: stderr.trim() });
        return;
      }

      rejectCommand(
        new Error(
          `${command} ${args.join(' ')} exited with code ${code}.\n${stderr}`,
        ),
      );
    });
  });
}

function runPnpm(args, options = {}) {
  if (pnpmEntrypoint) {
    return runCommand(process.execPath, [pnpmEntrypoint, ...args], options);
  }

  return runCommand('pnpm', args, options);
}

function startProcess(command, args, env, cwd = repositoryRoot) {
  const child = spawn(command, args, {
    cwd,
    env,
    shell: false,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const logs = { stdout: '', stderr: '' };

  child.stdout.on('data', (chunk) => {
    logs.stdout += chunk.toString();
  });
  child.stderr.on('data', (chunk) => {
    logs.stderr += chunk.toString();
  });
  childProcesses.push(child);

  return { child, logs };
}

function assertPortAvailable(port) {
  return new Promise((resolvePort, rejectPort) => {
    const server = createServer();

    server.once('error', () => {
      rejectPort(
        new Error(
          `Port ${port} is already in use. Stop the existing service before running this acceptance test.`,
        ),
      );
    });
    server.listen(port, '127.0.0.1', () => {
      server.close((error) => {
        if (error) {
          rejectPort(error);
          return;
        }
        resolvePort();
      });
    });
  });
}

async function waitForJson(url, attempts, processState) {
  let lastError;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    if (processState.child.exitCode !== null) {
      throw new Error(
        `Process exited before ${url} became ready.\n${processState.logs.stderr}`,
      );
    }

    try {
      const response = await fetch(url, {
        cache: 'no-store',
        signal: AbortSignal.timeout(4_000),
      });

      if (response.ok) {
        return await response.json();
      }

      lastError = new Error(`${url} returned HTTP ${response.status}`);
    } catch (error) {
      lastError = error;
    }

    await new Promise((resolveDelay) => setTimeout(resolveDelay, 500));
  }

  throw new Error(
    `${url} did not become ready: ${String(lastError)}\n${processState.logs.stderr}`,
  );
}

async function stopChild(child) {
  if (child.exitCode !== null || child.signalCode !== null) {
    return;
  }

  child.kill('SIGTERM');
  await Promise.race([
    new Promise((resolveExit) => child.once('exit', resolveExit)),
    new Promise((resolveDelay) => setTimeout(resolveDelay, 5_000)),
  ]);

  if (child.exitCode === null && child.signalCode === null) {
    child.kill('SIGKILL');
  }
}

async function cleanup() {
  await Promise.allSettled(childProcesses.reverse().map(stopChild));

  if (originalPosNextEnv !== undefined) {
    writeFileSync(posNextEnvPath, originalPosNextEnv);
  }

  if (containerStarted) {
    await runCommand('docker', ['rm', '--force', containerName], {
      quiet: true,
    }).catch(() => undefined);
  }
}

async function main() {
  const tsxCli = join(
    repositoryRoot,
    'apps',
    'site-agent',
    'node_modules',
    'tsx',
    'dist',
    'cli.mjs',
  );
  const nextCli = join(
    repositoryRoot,
    'apps',
    'yuta-pos',
    'node_modules',
    'next',
    'dist',
    'bin',
    'next',
  );

  if (!existsSync(tsxCli) || !existsSync(nextCli)) {
    throw new Error('Install workspace dependencies before running this test.');
  }

  await Promise.all([
    assertPortAvailable(posPort),
    assertPortAvailable(siteAgentPort),
  ]);

  console.log('Starting disposable PostgreSQL 17...');
  await runCommand(
    'docker',
    [
      'run',
      '--detach',
      '--name',
      containerName,
      '--env',
      'POSTGRES_DB=yuta_pos_offline',
      '--env',
      'POSTGRES_USER=yuta_pos',
      '--env',
      'POSTGRES_PASSWORD=yuta_pos_offline',
      '--publish',
      '127.0.0.1::5432',
      '--tmpfs',
      '/var/lib/postgresql/data',
      'postgres:17-alpine',
    ],
    { quiet: true },
  );
  containerStarted = true;

  for (let attempt = 0; attempt < 30; attempt += 1) {
    try {
      await runCommand(
        'docker',
        [
          'exec',
          containerName,
          'pg_isready',
          '-U',
          'yuta_pos',
          '-d',
          'yuta_pos_offline',
        ],
        { quiet: true },
      );
      break;
    } catch {
      if (attempt === 29) {
        throw new Error('Disposable PostgreSQL did not become ready.');
      }
      await new Promise((resolveDelay) => setTimeout(resolveDelay, 1_000));
    }
  }

  const portResult = await runCommand(
    'docker',
    ['port', containerName, '5432/tcp'],
    { quiet: true },
  );
  const databasePort = Number(portResult.stdout.split(':').at(-1));
  if (!Number.isInteger(databasePort)) {
    throw new Error(`Could not resolve PostgreSQL port: ${portResult.stdout}`);
  }

  const runtimeEnv = {
    ...process.env,
    POS_DATABASE_URL: `postgres://yuta_pos:yuta_pos_offline@127.0.0.1:${databasePort}/yuta_pos_offline`,
    SITE_AGENT_HOST: '127.0.0.1',
    SITE_AGENT_PORT: String(siteAgentPort),
    SITE_AGENT_ALLOWED_ORIGIN: `http://localhost:${posPort}`,
    SITE_AGENT_URL: `http://127.0.0.1:${siteAgentPort}`,
    POS_INTERNET_CHECK_URL: 'http://127.0.0.1:1/offline',
  };
  delete runtimeEnv.CLOUD_DATABASE_URL;
  delete runtimeEnv.DISPLAY_DATABASE_URL;

  console.log('Migrating and seeding the disposable POS database...');
  await runPnpm(['--filter', '@yuta/db-pos', 'db:migrate'], {
    env: runtimeEnv,
  });
  await runPnpm(['--filter', '@yuta/db-pos', 'db:seed'], {
    env: runtimeEnv,
  });

  console.log('Building the POS production bundle...');
  if (existsSync(posNextEnvPath)) {
    originalPosNextEnv = readFileSync(posNextEnvPath);
  }
  await runPnpm(['--filter', '@yuta/pos', 'build'], {
    env: runtimeEnv,
  });

  console.log('Starting site-agent without cloud configuration...');
  const siteAgent = startProcess(
    process.execPath,
    [tsxCli, join(repositoryRoot, 'apps', 'site-agent', 'src', 'server.ts')],
    runtimeEnv,
  );
  const agentHealth = await waitForJson(
    `http://127.0.0.1:${siteAgentPort}/health`,
    40,
    siteAgent,
  );
  const users = await waitForJson(
    `http://127.0.0.1:${siteAgentPort}/api/v1/local-users`,
    5,
    siteAgent,
  );
  const catalog = await waitForJson(
    `http://127.0.0.1:${siteAgentPort}/api/v1/catalog`,
    5,
    siteAgent,
  );
  const catalogItemCount = catalog.categories.reduce(
    (total, category) => total + category.items.length,
    0,
  );

  if (users.users.length === 0 || catalogItemCount === 0) {
    throw new Error('The disposable POS seed did not create usable data.');
  }

  const orderResponse = await fetch(
    `http://127.0.0.1:${siteAgentPort}/api/v1/orders`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tableLabel: 'Offline acceptance',
        orderType: 'dine_in',
        staffUserId: users.users[0].id,
        note: 'Created without cloud services',
      }),
      signal: AbortSignal.timeout(5_000),
    },
  );
  if (!orderResponse.ok) {
    throw new Error(
      `Offline order creation returned HTTP ${orderResponse.status}: ${await orderResponse.text()}`,
    );
  }
  const createdOrder = await orderResponse.json();

  console.log(
    'Starting the POS with an intentionally unavailable Internet probe...',
  );
  const pos = startProcess(
    process.execPath,
    [nextCli, 'start', '-p', String(posPort)],
    runtimeEnv,
    join(repositoryRoot, 'apps', 'yuta-pos'),
  );
  const posHealth = await waitForJson(
    `http://127.0.0.1:${posPort}/api/health`,
    60,
    pos,
  );

  if (
    posHealth.status !== 'available' ||
    posHealth.siteAgent !== 'ok' ||
    posHealth.database !== 'available' ||
    posHealth.internet !== 'unavailable'
  ) {
    throw new Error(
      `Unexpected offline POS health: ${JSON.stringify(posHealth)}`,
    );
  }

  console.log(
    JSON.stringify(
      {
        disposableDatabase: 'ready',
        siteAgent: agentHealth.status,
        siteAgentDatabase: agentHealth.database,
        localUsers: users.users.length,
        catalogItems: catalogItemCount,
        createdOrderId: createdOrder.order.id,
        pos: posHealth.status,
        internet: posHealth.internet,
        cloudDatabaseConfigured: false,
      },
      null,
      2,
    ),
  );
  console.log('Offline POS acceptance test passed.');
}

try {
  await main();
} finally {
  await cleanup();
}
