import { createPosDatabaseClient } from '@yuta/db-pos/client';
import { config } from 'dotenv';
import {
  createServer,
  type IncomingMessage,
  type ServerResponse,
} from 'node:http';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { v7 as uuidv7 } from 'uuid';
import { readSiteAgentEnv, type SiteAgentEnv } from './env';
import { HttpError, sendError, sendJson } from './http';
import { siteAgentRoutes } from './routes';
import {
  createSiteAgentService,
  type SiteAgentService,
} from './services/site-agent-service';
import { createLocalPrinterWorker } from './services/local-printer-worker';

config({ path: '.env.local' });
config({ path: '.env' });

export function createSiteAgentServer(input: {
  env: SiteAgentEnv;
  service: SiteAgentService;
}) {
  return createServer((request, response) => {
    void handleRequest(request, response, input).catch((error: unknown) => {
      const requestId =
        response.getHeader('X-Request-Id')?.toString() ?? uuidv7();
      sendError(response, error, requestId);
    });
  });
}

async function handleRequest(
  request: IncomingMessage,
  response: ServerResponse,
  input: { env: SiteAgentEnv; service: SiteAgentService },
): Promise<void> {
  const requestId = uuidv7();
  response.setHeader('X-Request-Id', requestId);
  applyCors(request, response, input.env);

  if (request.method === 'OPTIONS') {
    response.statusCode = 204;
    response.end();
    return;
  }

  const url = new URL(
    request.url ?? '/',
    `http://${request.headers.host ?? 'localhost'}`,
  );
  for (const route of siteAgentRoutes) {
    if (await route({ request, response, url, service: input.service })) {
      return;
    }
  }

  sendJson(response, 404, {
    error: {
      code: 'NOT_FOUND',
      message: 'The requested site-agent route does not exist.',
      requestId,
    },
  });
}

function applyCors(
  request: IncomingMessage,
  response: ServerResponse,
  env: SiteAgentEnv,
): void {
  const origin = request.headers.origin;
  if (origin && origin !== env.SITE_AGENT_ALLOWED_ORIGIN) {
    throw new HttpError(
      403,
      'ORIGIN_NOT_ALLOWED',
      'The request origin is not allowed.',
    );
  }

  if (origin) {
    response.setHeader('Access-Control-Allow-Origin', origin);
    response.setHeader('Vary', 'Origin');
  }
  response.setHeader(
    'Access-Control-Allow-Methods',
    'GET,POST,PATCH,DELETE,OPTIONS',
  );
  response.setHeader(
    'Access-Control-Allow-Headers',
    'Authorization, Content-Type',
  );
}

async function startSiteAgent(): Promise<void> {
  const env = readSiteAgentEnv(process.env);
  const db = createPosDatabaseClient(process.env);
  const printerWorker = env.POS_PRINTER_DEVICE
    ? createLocalPrinterWorker({
        db,
        devicePath: env.POS_PRINTER_DEVICE,
        pollIntervalMs: env.POS_PRINT_POLL_INTERVAL_MS,
      })
    : null;
  const server = createSiteAgentServer({
    env,
    service: createSiteAgentService(db),
  });

  await new Promise<void>((resolveListen, rejectListen) => {
    server.once('error', rejectListen);
    server.listen(env.SITE_AGENT_PORT, env.SITE_AGENT_HOST, () => {
      server.off('error', rejectListen);
      resolveListen();
    });
  });
  console.log(
    `YuTa site-agent listening on http://${env.SITE_AGENT_HOST}:${env.SITE_AGENT_PORT}`,
  );
  if (printerWorker) {
    await printerWorker.start();
    console.log(
      `YuTa local print worker enabled for ${env.POS_PRINTER_DEVICE}`,
    );
  }

  const shutdown = async () => {
    await printerWorker?.stop();
    await new Promise<void>((resolveClose, rejectClose) => {
      server.close((error) => {
        if (error) {
          rejectClose(error);
          return;
        }
        resolveClose();
      });
    });
    await db.$client.end({ timeout: 5 });
  };

  process.once('SIGINT', () => void shutdown().finally(() => process.exit(0)));
  process.once('SIGTERM', () => void shutdown().finally(() => process.exit(0)));
}

const isDirectRun =
  process.argv[1] !== undefined &&
  fileURLToPath(import.meta.url) === resolve(process.argv[1]);

if (isDirectRun) {
  startSiteAgent().catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  });
}
