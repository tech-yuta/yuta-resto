import { randomBytes, randomInt } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));

if (process.env.NODE_ENV?.toLowerCase() === 'production') {
  throw new Error('dev:env:sync is disabled when NODE_ENV=production.');
}

function readEnv(relativePath) {
  const filePath = resolve(repositoryRoot, relativePath);
  const content = existsSync(filePath) ? readFileSync(filePath, 'utf8') : '';
  const values = new Map();

  for (const line of content.split(/\r?\n/)) {
    const match = /^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/.exec(line);
    if (match) {
      values.set(match[1], match[2]);
    }
  }

  return { filePath, content, values };
}

function syncEnvFile(relativePath, input) {
  const { filePath, content } = readEnv(relativePath);
  const remainingValues = new Map(Object.entries(input.values));
  const removedKeys = new Set(input.remove ?? []);
  const writtenKeys = new Set();
  const output = [];

  for (const line of content.split(/\r?\n/)) {
    const match = /^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/.exec(line);
    if (!match) {
      output.push(line);
      continue;
    }

    const key = match[1];
    if (removedKeys.has(key)) {
      continue;
    }

    if (remainingValues.has(key)) {
      if (!writtenKeys.has(key)) {
        output.push(`${key}=${remainingValues.get(key)}`);
        writtenKeys.add(key);
      }
      remainingValues.delete(key);
      continue;
    }

    output.push(line);
  }

  while (output.length > 0 && output.at(-1) === '') {
    output.pop();
  }
  if (output.length > 0 && remainingValues.size > 0) {
    output.push('');
  }
  for (const [key, value] of remainingValues) {
    output.push(`${key}=${value}`);
  }

  writeFileSync(filePath, `${output.join('\n')}\n`, 'utf8');
  console.log(`Updated ${relativePath}`);
}

const backofficeEnv = readEnv('apps/backoffice/.env.local');
const existingAuthSecret = backofficeEnv.values.get('AUTH_SECRET');
const authSecret =
  existingAuthSecret && existingAuthSecret.length >= 32
    ? existingAuthSecret
    : randomBytes(32).toString('hex');

const feedbackWebEnv = readEnv('apps/feedback-web/.env.local');
const existingFeedbackSalt = feedbackWebEnv.values.get(
  'PUBLIC_FEEDBACK_IP_HASH_SALT',
);
const feedbackSalt =
  existingFeedbackSalt && existingFeedbackSalt.length >= 32
    ? existingFeedbackSalt
    : randomBytes(32).toString('hex');

const cloudDatabaseEnv = readEnv('packages/db-cloud/.env.local');
const existingSeedPassword = cloudDatabaseEnv.values.get(
  'YUTA_CLOUD_SEED_PASSWORD',
);
const seedPassword =
  existingSeedPassword && existingSeedPassword.length >= 12
    ? existingSeedPassword
    : randomBytes(18).toString('base64url');

const posDatabaseEnv = readEnv('packages/db-pos/.env.local');

function developmentPin(name) {
  const existing = posDatabaseEnv.values.get(name);
  return existing && /^\d{4,8}$/.test(existing)
    ? existing
    : String(randomInt(100_000, 1_000_000));
}

syncEnvFile('apps/backoffice/.env.local', {
  remove: ['DATABASE_URL', 'DISABLE_AUTH', 'NEXT_PUBLIC_ADMIN_URL'],
  values: {
    CLOUD_DATABASE_URL:
      'postgres://yuta_cloud:yuta_cloud@localhost:55431/yuta_cloud',
    CLOUD_DATABASE_SSL: 'false',
    AUTH_SECRET: authSecret,
    NEXT_PUBLIC_APP_URL: 'http://localhost:3001',
  },
});

syncEnvFile('apps/web/.env.local', {
  remove: [
    'DATABASE_URL',
    'NEXT_PUBLIC_ADMIN_URL',
    'PUBLIC_FEEDBACK_IP_HASH_SALT',
  ],
  values: {
    CLOUD_DATABASE_URL:
      'postgres://yuta_cloud:yuta_cloud@localhost:55431/yuta_cloud',
    CLOUD_DATABASE_SSL: 'false',
    NEXT_PUBLIC_BACKOFFICE_URL: 'http://localhost:3001',
  },
});

syncEnvFile('apps/feedback-web/.env.local', {
  remove: ['DATABASE_URL', 'POS_DATABASE_URL', 'DISPLAY_DATABASE_URL'],
  values: {
    CLOUD_DATABASE_URL:
      'postgres://yuta_cloud:yuta_cloud@localhost:55431/yuta_cloud',
    CLOUD_DATABASE_SSL: 'false',
    PUBLIC_FEEDBACK_IP_HASH_SALT: feedbackSalt,
  },
});

syncEnvFile('packages/db-cloud/.env.local', {
  remove: ['DATABASE_URL', 'YUTA_CLOUD_SEED_ADMIN_PASSWORD'],
  values: {
    CLOUD_DATABASE_URL:
      'postgres://yuta_cloud:yuta_cloud@localhost:55431/yuta_cloud',
    CLOUD_DATABASE_SSL: 'false',
    YUTA_CLOUD_SEED_PASSWORD: seedPassword,
  },
});

syncEnvFile('apps/site-agent/.env.local', {
  remove: ['DATABASE_URL', 'CLOUD_DATABASE_URL', 'DISPLAY_DATABASE_URL'],
  values: {
    POS_DATABASE_URL: 'postgres://yuta_pos:yuta_pos@localhost:55432/yuta_pos',
    SITE_AGENT_HOST: '127.0.0.1',
    SITE_AGENT_PORT: '3004',
    SITE_AGENT_ALLOWED_ORIGIN: 'http://localhost:3003',
  },
});

syncEnvFile('packages/db-pos/.env.local', {
  remove: ['DATABASE_URL', 'CLOUD_DATABASE_URL', 'DISPLAY_DATABASE_URL'],
  values: {
    POS_DATABASE_URL: 'postgres://yuta_pos:yuta_pos@localhost:55432/yuta_pos',
    YUTA_POS_SEED_ADMIN_PIN: developmentPin('YUTA_POS_SEED_ADMIN_PIN'),
    YUTA_POS_SEED_STAFF_PIN: developmentPin('YUTA_POS_SEED_STAFF_PIN'),
    YUTA_POS_SEED_KITCHEN_PIN: developmentPin('YUTA_POS_SEED_KITCHEN_PIN'),
  },
});

syncEnvFile('apps/yuta-display/.env.local', {
  remove: ['DATABASE_URL', 'CLOUD_DATABASE_URL', 'POS_DATABASE_URL'],
  values: {
    DISPLAY_DATABASE_URL:
      'postgres://yuta_display:yuta_display@localhost:55433/yuta_display',
  },
});

syncEnvFile('apps/yuta-pos/.env.local', {
  remove: [
    'DATABASE_URL',
    'CLOUD_DATABASE_URL',
    'POS_DATABASE_URL',
    'DISPLAY_DATABASE_URL',
  ],
  values: {
    SITE_AGENT_URL: 'http://127.0.0.1:3004',
  },
});

console.log('Development environment files are synchronized.');
