import 'server-only';
import { createCloudDatabaseClient } from '@yuta/db-cloud/client';

declare global {
  var _yutaBookingCloudDatabase:
    | ReturnType<typeof createCloudDatabaseClient>
    | undefined;
}

export const cloudDatabase =
  global._yutaBookingCloudDatabase ?? createCloudDatabaseClient();

if (process.env.NODE_ENV !== 'production') {
  global._yutaBookingCloudDatabase = cloudDatabase;
}
