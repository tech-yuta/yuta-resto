import 'server-only';
import { BookingRepositoryError } from '@yuta/db-cloud';
import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

export function clientAddress(request: Request): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}

export function rateLimitSecret(): string {
  const value = process.env.BOOKING_RATE_LIMIT_SECRET;
  if (value && value.length >= 32) return value;
  if (process.env.NODE_ENV !== 'production')
    return 'local-booking-rate-limit-secret-change-me';
  throw new Error(
    'BOOKING_RATE_LIMIT_SECRET must contain at least 32 characters.',
  );
}

export function publicApiError(error: unknown): NextResponse {
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: {
          code: 'INVALID_REQUEST',
          message: 'Les informations fournies sont invalides.',
        },
      },
      { status: 400 },
    );
  }
  if (error instanceof BookingRepositoryError) {
    const status =
      error.code === 'RATE_LIMITED'
        ? 429
        : error.code === 'BOOKING_NOT_FOUND'
          ? 404
          : error.code === 'IDEMPOTENCY_CONFLICT' ||
              error.code === 'SLOT_UNAVAILABLE' ||
              error.code === 'CANCELLATION_NOT_ALLOWED'
            ? 409
            : 400;
    return NextResponse.json(
      { error: { code: error.code, message: error.message } },
      { status },
    );
  }
  console.error('Public booking request failed.', error);
  return NextResponse.json(
    {
      error: {
        code: 'REQUEST_FAILED',
        message: 'La demande n’a pas pu être traitée.',
      },
    },
    { status: 500 },
  );
}
