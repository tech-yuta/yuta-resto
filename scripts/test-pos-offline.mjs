import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:net';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));
const containerName = `yuta-pos-offline-acceptance-${randomUUID().slice(0, 8)}`;
const pnpmEntrypoint = process.env.npm_execpath;
const siteAgentPort = readPort('YUTA_OFFLINE_SITE_AGENT_PORT', 3004);
const posPort = readPort('YUTA_OFFLINE_POS_PORT', 3003);
const posNextEnvPath = join(
  repositoryRoot,
  'apps',
  'yuta-pos',
  'next-env.d.ts',
);
const childProcesses = [];
let containerStarted = false;
let originalPosNextEnv;

function readPort(name, fallback) {
  const value = Number(process.env[name] ?? fallback);
  if (!Number.isInteger(value) || value < 1 || value > 65_535) {
    throw new Error(`${name} must be a valid TCP port.`);
  }
  return value;
}

function createAcceptanceUuidV7() {
  const value = randomUUID();
  return `${value.slice(0, 14)}7${value.slice(15)}`;
}

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
  const seededCatalogItem = catalog.categories
    .flatMap((category) => category.items)
    .at(0);

  if (users.users.length === 0 || !seededCatalogItem) {
    throw new Error('The disposable POS seed did not create usable data.');
  }

  const managementUser = users.users.find(
    (user) => user.role === 'admin' || user.role === 'manager',
  );
  if (!managementUser) {
    throw new Error(
      'The disposable POS seed did not create a management user.',
    );
  }

  const loginResponse = await fetch(
    `http://127.0.0.1:${siteAgentPort}/api/v1/auth/login`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: managementUser.id,
        pin: runtimeEnv.YUTA_POS_SEED_ADMIN_PIN ?? '1234',
      }),
      signal: AbortSignal.timeout(5_000),
    },
  );
  if (!loginResponse.ok) {
    throw new Error(
      `Local management login returned HTTP ${loginResponse.status}: ${await loginResponse.text()}`,
    );
  }
  const localAuth = await loginResponse.json();

  const sessionResponse = await fetch(
    `http://127.0.0.1:${siteAgentPort}/api/v1/auth/session`,
    {
      headers: { Authorization: `Bearer ${localAuth.token}` },
      signal: AbortSignal.timeout(5_000),
    },
  );
  if (!sessionResponse.ok) {
    throw new Error(
      `Local management session returned HTTP ${sessionResponse.status}: ${await sessionResponse.text()}`,
    );
  }
  const localSession = await sessionResponse.json();
  if (localSession.session.user.id !== managementUser.id) {
    throw new Error('Local management session returned the wrong user.');
  }

  const createdUserResponse = await fetch(
    `http://127.0.0.1:${siteAgentPort}/api/v1/local-users`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${localAuth.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Offline acceptance staff',
        email: 'offline-acceptance@yuta.local',
        role: 'staff',
        pin: '4567',
      }),
      signal: AbortSignal.timeout(5_000),
    },
  );
  if (createdUserResponse.status !== 201) {
    throw new Error(
      `Local user creation returned HTTP ${createdUserResponse.status}: ${await createdUserResponse.text()}`,
    );
  }
  const createdUser = await createdUserResponse.json();

  const createdUserLoginResponse = await fetch(
    `http://127.0.0.1:${siteAgentPort}/api/v1/auth/login`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: createdUser.user.id, pin: '4567' }),
      signal: AbortSignal.timeout(5_000),
    },
  );
  if (!createdUserLoginResponse.ok) {
    throw new Error('The newly created local user could not sign in.');
  }
  const createdUserAuth = await createdUserLoginResponse.json();

  const resetPinResponse = await fetch(
    `http://127.0.0.1:${siteAgentPort}/api/v1/local-users/${createdUser.user.id}/pin`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${localAuth.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ pin: '5678' }),
      signal: AbortSignal.timeout(5_000),
    },
  );
  if (!resetPinResponse.ok) {
    throw new Error('The local user PIN could not be reset.');
  }

  const revokedSessionResponse = await fetch(
    `http://127.0.0.1:${siteAgentPort}/api/v1/auth/session`,
    {
      headers: { Authorization: `Bearer ${createdUserAuth.token}` },
      signal: AbortSignal.timeout(5_000),
    },
  );
  if (revokedSessionResponse.status !== 401) {
    throw new Error('Resetting a PIN did not invalidate the previous session.');
  }

  const managerResponse = await fetch(
    `http://127.0.0.1:${siteAgentPort}/api/v1/local-users`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${localAuth.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Offline acceptance manager',
        email: 'offline-manager@yuta.local',
        role: 'manager',
        pin: '4568',
      }),
      signal: AbortSignal.timeout(5_000),
    },
  );
  if (managerResponse.status !== 201) {
    throw new Error('The offline acceptance manager could not be created.');
  }
  const manager = await managerResponse.json();
  const managerLoginResponse = await fetch(
    `http://127.0.0.1:${siteAgentPort}/api/v1/auth/login`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: manager.user.id, pin: '4568' }),
      signal: AbortSignal.timeout(5_000),
    },
  );
  const managerAuth = await managerLoginResponse.json();
  const forbiddenAdminUpdate = await fetch(
    `http://127.0.0.1:${siteAgentPort}/api/v1/local-users/${managementUser.id}`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${managerAuth.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: 'Forbidden admin update' }),
      signal: AbortSignal.timeout(5_000),
    },
  );
  if (forbiddenAdminUpdate.status !== 403) {
    throw new Error('A manager was allowed to modify an administrator.');
  }

  const lastAdminResponse = await fetch(
    `http://127.0.0.1:${siteAgentPort}/api/v1/local-users/${managementUser.id}`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${localAuth.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ isActive: false }),
      signal: AbortSignal.timeout(5_000),
    },
  );
  if (lastAdminResponse.status !== 409) {
    throw new Error('The last active local admin was not protected.');
  }

  const categoryResponse = await fetch(
    `http://127.0.0.1:${siteAgentPort}/api/v1/catalog/categories`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${localAuth.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Offline acceptance category',
        sortOrder: 999,
      }),
      signal: AbortSignal.timeout(5_000),
    },
  );
  if (categoryResponse.status !== 201) {
    throw new Error('The offline catalog category could not be created.');
  }
  const createdCategory = await categoryResponse.json();

  const itemResponse = await fetch(
    `http://127.0.0.1:${siteAgentPort}/api/v1/catalog/items`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${localAuth.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        categoryId: createdCategory.category.id,
        name: 'Offline acceptance item',
        description: 'Created without cloud services',
        priceCents: 1250,
        kitchenStation: 'kitchen',
        isAvailable: true,
        sortOrder: 10,
      }),
      signal: AbortSignal.timeout(5_000),
    },
  );
  if (itemResponse.status !== 201) {
    throw new Error('The offline catalog item could not be created.');
  }
  const createdItem = await itemResponse.json();

  const unavailableItemResponse = await fetch(
    `http://127.0.0.1:${siteAgentPort}/api/v1/catalog/items/${createdItem.item.id}`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${localAuth.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ isAvailable: false }),
      signal: AbortSignal.timeout(5_000),
    },
  );
  const unavailableItem = await unavailableItemResponse.json();
  if (
    !unavailableItemResponse.ok ||
    unavailableItem.item.isAvailable !== false
  ) {
    throw new Error('The offline catalog item availability did not update.');
  }

  const hiddenCategoryResponse = await fetch(
    `http://127.0.0.1:${siteAgentPort}/api/v1/catalog/categories/${createdCategory.category.id}`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${localAuth.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ isActive: false }),
      signal: AbortSignal.timeout(5_000),
    },
  );
  const hiddenCategory = await hiddenCategoryResponse.json();
  if (
    !hiddenCategoryResponse.ok ||
    hiddenCategory.category.isActive !== false
  ) {
    throw new Error('The offline catalog category visibility did not update.');
  }

  const comboRuleResponse = await fetch(
    `http://127.0.0.1:${siteAgentPort}/api/v1/catalog/combo-rules`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${localAuth.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Offline acceptance combo',
        pricingMode: 'fixed',
        comboPriceCents: 1990,
        priceDeltaCents: 0,
        basePricingGroupName: null,
        priority: 999,
        maxApplications: 1,
        isActive: false,
      }),
      signal: AbortSignal.timeout(5_000),
    },
  );
  if (comboRuleResponse.status !== 201) {
    throw new Error(
      `The offline combo rule could not be created: ${await comboRuleResponse.text()}`,
    );
  }
  const createdComboRule = await comboRuleResponse.json();

  const comboGroupResponse = await fetch(
    `http://127.0.0.1:${siteAgentPort}/api/v1/catalog/combo-groups`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${localAuth.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        comboRuleId: createdComboRule.comboRule.id,
        name: 'Main',
        minQuantity: 1,
        maxQuantity: 1,
        sortOrder: 0,
      }),
      signal: AbortSignal.timeout(5_000),
    },
  );
  if (comboGroupResponse.status !== 201) {
    throw new Error(
      `The offline combo group could not be created: ${await comboGroupResponse.text()}`,
    );
  }
  const createdComboGroup = await comboGroupResponse.json();

  const comboGroupItemResponse = await fetch(
    `http://127.0.0.1:${siteAgentPort}/api/v1/catalog/combo-group-items`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${localAuth.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        comboRuleGroupId: createdComboGroup.group.id,
        menuItemId: seededCatalogItem.id,
        extraPriceCents: 0,
      }),
      signal: AbortSignal.timeout(5_000),
    },
  );
  if (comboGroupItemResponse.status !== 201) {
    throw new Error(
      `The offline combo item could not be created: ${await comboGroupItemResponse.text()}`,
    );
  }
  const createdComboGroupItem = await comboGroupItemResponse.json();

  const activateComboResponse = await fetch(
    `http://127.0.0.1:${siteAgentPort}/api/v1/catalog/combo-rules/${createdComboRule.comboRule.id}`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${localAuth.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ isActive: true }),
      signal: AbortSignal.timeout(5_000),
    },
  );
  if (!activateComboResponse.ok) {
    throw new Error(
      `The structurally valid offline combo could not be activated: ${await activateComboResponse.text()}`,
    );
  }

  const activeStructureMutationResponse = await fetch(
    `http://127.0.0.1:${siteAgentPort}/api/v1/catalog/combo-group-items/${createdComboGroupItem.item.id}`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${localAuth.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ extraPriceCents: 100 }),
      signal: AbortSignal.timeout(5_000),
    },
  );
  if (activeStructureMutationResponse.status !== 409) {
    throw new Error(
      'An active combo allowed its group structure to be modified.',
    );
  }

  const deactivateComboResponse = await fetch(
    `http://127.0.0.1:${siteAgentPort}/api/v1/catalog/combo-rules/${createdComboRule.comboRule.id}`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${localAuth.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ isActive: false }),
      signal: AbortSignal.timeout(5_000),
    },
  );
  if (!deactivateComboResponse.ok) {
    throw new Error('The offline combo could not be deactivated.');
  }

  const deleteComboItemResponse = await fetch(
    `http://127.0.0.1:${siteAgentPort}/api/v1/catalog/combo-group-items/${createdComboGroupItem.item.id}`,
    {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${localAuth.token}` },
      signal: AbortSignal.timeout(5_000),
    },
  );
  const deleteComboGroupResponse = await fetch(
    `http://127.0.0.1:${siteAgentPort}/api/v1/catalog/combo-groups/${createdComboGroup.group.id}`,
    {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${localAuth.token}` },
      signal: AbortSignal.timeout(5_000),
    },
  );
  if (!deleteComboItemResponse.ok || !deleteComboGroupResponse.ok) {
    throw new Error(
      'The inactive offline combo structure could not be removed.',
    );
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

  const orderItemResponse = await fetch(
    `http://127.0.0.1:${siteAgentPort}/api/v1/orders/${createdOrder.order.id}/items`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        menuItemId: seededCatalogItem.id,
        quantity: 1,
      }),
      signal: AbortSignal.timeout(5_000),
    },
  );
  if (!orderItemResponse.ok) {
    throw new Error(
      `The offline order item could not be created: ${await orderItemResponse.text()}`,
    );
  }

  const kitchenSendResponse = await fetch(
    `http://127.0.0.1:${siteAgentPort}/api/v1/orders/${createdOrder.order.id}/commands`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'send_to_kitchen',
        idempotencyKey: createAcceptanceUuidV7(),
        allergyAcknowledged: false,
        staffUserId: users.users[0].id,
      }),
      signal: AbortSignal.timeout(5_000),
    },
  );
  if (!kitchenSendResponse.ok) {
    throw new Error(
      `The offline kitchen ticket could not be created: ${await kitchenSendResponse.text()}`,
    );
  }
  const kitchenSend = await kitchenSendResponse.json();

  const unauthorizedPrintQueue = await fetch(
    `http://127.0.0.1:${siteAgentPort}/api/v1/print-jobs`,
    { signal: AbortSignal.timeout(5_000) },
  );
  if (unauthorizedPrintQueue.status !== 401) {
    throw new Error('The local print queue was readable without a session.');
  }

  const pendingPrintQueue = await fetch(
    `http://127.0.0.1:${siteAgentPort}/api/v1/print-jobs?status=pending`,
    {
      headers: { Authorization: `Bearer ${localAuth.token}` },
      signal: AbortSignal.timeout(5_000),
    },
  );
  const pendingPrintJobs = await pendingPrintQueue.json();
  if (
    !pendingPrintQueue.ok ||
    !pendingPrintJobs.printJobs.some(
      (job) =>
        job.id === kitchenSend.printJob.id && job.summary.itemCount === 1,
    )
  ) {
    throw new Error('The kitchen ticket was not visible in the local queue.');
  }

  const printJobCommandUrl = `http://127.0.0.1:${siteAgentPort}/api/v1/print-jobs/${kitchenSend.printJob.id}/commands`;
  for (const command of [
    { action: 'mark_printing' },
    { action: 'mark_failed', errorMessage: 'Offline acceptance failure' },
    { action: 'retry' },
    { action: 'mark_printing' },
    { action: 'mark_printed' },
  ]) {
    const commandResponse = await fetch(printJobCommandUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${localAuth.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(command),
      signal: AbortSignal.timeout(5_000),
    });
    if (!commandResponse.ok) {
      throw new Error(
        `Print command ${command.action} failed: ${await commandResponse.text()}`,
      );
    }
  }

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
        localManagementRole: localSession.session.user.role,
        localUserManagement:
          'create, reset PIN, revoke, role guard, last-admin guard',
        localCatalogManagement:
          'create category/item, availability, category visibility',
        localComboManagement:
          'create structure, activate, active-write guard, deactivate, remove structure',
        localPrintQueue:
          'authenticated list, printing, failure, retry, printed',
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
