import { spawn } from 'node:child_process';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));
const dryRun = process.argv.includes('--dry-run');
const pnpmEntrypoint = process.env.npm_execpath;
const seedAfterReset = process.env.SEED_DB_RESET === 'true';

const boundaries = [
  {
    name: 'cloud',
    project: 'yuta-cloud-dev',
    composeFile: 'docker-compose.cloud.dev.yml',
    databaseUrl:
      'postgres://yuta_cloud:yuta_cloud@127.0.0.1:' +
      `${process.env.CLOUD_DEV_DB_PORT ?? '55431'}/yuta_cloud`,
    migrateArgs: ['--filter', '@yuta/db-cloud', 'db:migrate'],
    seedArgs: ['--filter', '@yuta/db-cloud', 'db:seed'],
  },
  {
    name: 'pos',
    project: 'yuta-pos-dev',
    composeFile: 'docker-compose.local.dev.yml',
    databaseUrl:
      'postgres://yuta_pos:yuta_pos@127.0.0.1:' +
      `${process.env.POS_DEV_DB_PORT ?? '55432'}/yuta_pos`,
    migrateArgs: ['--filter', '@yuta/db-pos', 'db:migrate'],
    seedArgs: ['--filter', '@yuta/db-pos', 'db:seed'],
  },
  {
    name: 'display',
    project: 'yuta-display-dev',
    composeFile: 'apps/yuta-display/docker-compose.dev.yml',
    databaseUrl:
      'postgres://yuta_display:yuta_display@127.0.0.1:' +
      `${process.env.DISPLAY_DEV_DB_PORT ?? '55433'}/yuta_display`,
    migrateArgs: ['--filter', '@yuta/display', 'db:migrate'],
  },
];

const legacyContainers = ['yuta-postgres-dev', 'yuta-display-db-1'];
const legacyVolumes = [
  'yuta-resto_yuta-postgres-dev-data',
  'yuta-display_luna_display_dev',
];

function formatCommand(command, args) {
  return [command, ...args]
    .map((part) => (part.includes(' ') ? JSON.stringify(part) : part))
    .join(' ');
}

function runCommand(command, args, options = {}) {
  if (dryRun) {
    console.log(`[dry-run] ${formatCommand(command, args)}`);
    return Promise.resolve({ stdout: '' });
  }

  return new Promise((resolveCommand, rejectCommand) => {
    const child = spawn(command, args, {
      cwd: repositoryRoot,
      env: options.env ?? process.env,
      shell: false,
      stdio: options.quiet
        ? ['ignore', 'pipe', 'pipe']
        : ['ignore', 'inherit', 'inherit'],
    });
    let stdout = '';
    let stderr = '';

    if (options.quiet) {
      child.stdout.on('data', (chunk) => {
        stdout += chunk.toString();
      });
      child.stderr.on('data', (chunk) => {
        stderr += chunk.toString();
      });
    }

    child.once('error', rejectCommand);
    child.once('exit', (code) => {
      if (code === 0) {
        resolveCommand({ stdout: stdout.trim() });
        return;
      }

      rejectCommand(
        new Error(
          `${formatCommand(command, args)} exited with code ${code}.` +
            (stderr ? `\n${stderr}` : ''),
        ),
      );
    });
  });
}

function runPnpm(args, env) {
  if (pnpmEntrypoint) {
    return runCommand(process.execPath, [pnpmEntrypoint, ...args], { env });
  }

  return runCommand('pnpm', args, { env });
}

async function dockerResourceExists(resource, name) {
  if (dryRun) {
    return true;
  }

  try {
    await runCommand('docker', [resource, 'inspect', name], { quiet: true });
    return true;
  } catch {
    return false;
  }
}

function databaseEnvironment(boundary) {
  const environment = { ...process.env };
  delete environment.CLOUD_DATABASE_URL;
  delete environment.POS_DATABASE_URL;
  delete environment.DISPLAY_DATABASE_URL;

  if (boundary.name === 'cloud') {
    environment.CLOUD_DATABASE_URL = boundary.databaseUrl;
  } else if (boundary.name === 'pos') {
    environment.POS_DATABASE_URL = boundary.databaseUrl;
  } else {
    environment.DISPLAY_DATABASE_URL = boundary.databaseUrl;
  }

  return environment;
}

function validateGuards() {
  if (process.env.NODE_ENV?.toLowerCase() === 'production') {
    throw new Error('db:reset:dev is disabled when NODE_ENV=production.');
  }

  if (!dryRun && process.env.CONFIRM_DB_RESET !== 'true') {
    throw new Error(
      'Refusing to delete development databases. Set CONFIRM_DB_RESET=true or use --dry-run.',
    );
  }
}

async function printPlan() {
  console.log('Development database reset targets:');
  for (const boundary of boundaries) {
    console.log(
      `- ${boundary.name}: ${boundary.composeFile} (${boundary.project})`,
    );
  }
  console.log(`- legacy containers: ${legacyContainers.join(', ')}`);
  console.log(`- legacy volumes: ${legacyVolumes.join(', ')}`);
  console.log(`- seed after reset: ${seedAfterReset ? 'yes' : 'no'}`);
}

async function resetDatabases() {
  validateGuards();
  await printPlan();

  for (const boundary of boundaries) {
    await runCommand('docker', [
      'compose',
      '--project-name',
      boundary.project,
      '--file',
      boundary.composeFile,
      'down',
      '--volumes',
      '--remove-orphans',
    ]);
  }

  for (const container of legacyContainers) {
    if (await dockerResourceExists('container', container)) {
      await runCommand('docker', ['container', 'rm', '--force', container]);
    }
  }
  for (const volume of legacyVolumes) {
    if (await dockerResourceExists('volume', volume)) {
      await runCommand('docker', ['volume', 'rm', volume]);
    }
  }

  for (const boundary of boundaries) {
    await runCommand('docker', [
      'compose',
      '--project-name',
      boundary.project,
      '--file',
      boundary.composeFile,
      'up',
      '--detach',
      '--wait',
    ]);
  }

  for (const boundary of boundaries) {
    const environment = databaseEnvironment(boundary);
    await runPnpm(boundary.migrateArgs, environment);
    if (seedAfterReset && boundary.seedArgs) {
      await runPnpm(boundary.seedArgs, environment);
    }
  }

  if (dryRun) {
    console.log('Dry run completed; no containers or volumes were changed.');
  } else {
    console.log('Development databases were recreated from clean baselines.');
  }
}

await resetDatabases();
