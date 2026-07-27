import 'server-only';

import { createCloudDatabaseClient } from '@yuta/db-cloud/client';

declare global {
  var _yutaWebCloudDatabase:
    | ReturnType<typeof createCloudDatabaseClient>
    | undefined;
}

export const cloudDatabase =
  global._yutaWebCloudDatabase ?? createCloudDatabaseClient();

if (process.env.NODE_ENV !== 'production') {
  global._yutaWebCloudDatabase = cloudDatabase;
}
