import 'server-only';
import { createCloudDatabaseClient } from '@yuta/db-cloud/client';
import { bookingWebEnvironment } from './environment';

declare global {
  var _yutaBookingCloudDatabase:
    | ReturnType<typeof createCloudDatabaseClient>
    | undefined;
}

export const cloudDatabase =
  global._yutaBookingCloudDatabase ??
  createCloudDatabaseClient({
    ...process.env,
    CLOUD_DATABASE_URL: bookingWebEnvironment.CLOUD_DATABASE_URL,
    CLOUD_DATABASE_SSL: bookingWebEnvironment.CLOUD_DATABASE_SSL,
  });

if (process.env.NODE_ENV !== 'production') {
  global._yutaBookingCloudDatabase = cloudDatabase;
}
