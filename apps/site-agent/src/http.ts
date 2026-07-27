import type { IncomingMessage, ServerResponse } from 'node:http';
import { ZodError } from 'zod';

const maximumJsonBodyBytes = 1024 * 1024;

export class HttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

export async function readJsonBody<T>(
  request: IncomingMessage,
  schema: { parse(value: unknown): T },
): Promise<T> {
  const contentType = request.headers['content-type'];
  if (!contentType?.toLowerCase().startsWith('application/json')) {
    throw new HttpError(
      415,
      'UNSUPPORTED_MEDIA_TYPE',
      'Content-Type must be application/json.',
    );
  }

  const chunks: Buffer[] = [];
  let byteLength = 0;
  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    byteLength += buffer.length;
    if (byteLength > maximumJsonBodyBytes) {
      throw new HttpError(413, 'BODY_TOO_LARGE', 'Request body is too large.');
    }
    chunks.push(buffer);
  }

  let value: unknown;
  try {
    value = JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    throw new HttpError(400, 'INVALID_JSON', 'Request body is not valid JSON.');
  }

  return schema.parse(value);
}

export function sendJson(
  response: ServerResponse,
  status: number,
  body: unknown,
): void {
  response.statusCode = status;
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.end(JSON.stringify(body));
}

export function sendError(
  response: ServerResponse,
  error: unknown,
  requestId: string,
): void {
  if (error instanceof ZodError) {
    sendJson(response, 400, {
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed.',
        fieldErrors: error.flatten().fieldErrors,
        requestId,
      },
    });
    return;
  }

  if (error instanceof HttpError) {
    sendJson(response, error.status, {
      error: { code: error.code, message: error.message, requestId },
    });
    return;
  }

  console.error(error);
  sendJson(response, 500, {
    error: {
      code: 'INTERNAL_ERROR',
      message: 'The site agent could not process the request.',
      requestId,
    },
  });
}
