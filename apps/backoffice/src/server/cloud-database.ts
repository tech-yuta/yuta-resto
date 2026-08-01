import 'server-only';

import { createCloudDatabaseClient } from '@yuta/db-cloud/client';

declare global {
  var _yutaBackofficeCloudDatabase:
    | ReturnType<typeof createCloudDatabaseClient>
    | undefined;
}

export const cloudDatabase =
  global._yutaBackofficeCloudDatabase ?? createCloudDatabaseClient();

if (process.env.NODE_ENV !== 'production') {
  global._yutaBackofficeCloudDatabase = cloudDatabase;
}
