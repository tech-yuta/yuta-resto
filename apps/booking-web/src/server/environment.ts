import 'server-only';
import { z } from 'zod';

const bookingWebEnvironmentSchema = z
  .object({
    CLOUD_DATABASE_URL: z.string().url(),
    CLOUD_DATABASE_SSL: z.enum(['true', 'false']),
    PUBLIC_BOOKING_BASE_URL: z.string().url(),
    BOOKING_RATE_LIMIT_SECRET: z.string().min(32),
  })
  .strict();

export type BookingWebEnvironment = z.infer<typeof bookingWebEnvironmentSchema>;

export function readBookingWebEnvironment(
  environment: NodeJS.ProcessEnv = process.env,
): BookingWebEnvironment {
  return bookingWebEnvironmentSchema.parse({
    CLOUD_DATABASE_URL: environment.CLOUD_DATABASE_URL,
    CLOUD_DATABASE_SSL: environment.CLOUD_DATABASE_SSL,
    PUBLIC_BOOKING_BASE_URL: environment.PUBLIC_BOOKING_BASE_URL,
    BOOKING_RATE_LIMIT_SECRET: environment.BOOKING_RATE_LIMIT_SECRET,
  });
}

export const bookingWebEnvironment = readBookingWebEnvironment();
