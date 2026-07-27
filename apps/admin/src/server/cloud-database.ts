import 'server-only';

import { createCloudDatabaseClient } from '@yuta/db-cloud/client';

declare global {
  var _yutaAdminCloudDatabase:
    | ReturnType<typeof createCloudDatabaseClient>
    | undefined;
}

export const cloudDatabase =
  global._yutaAdminCloudDatabase ?? createCloudDatabaseClient();

if (process.env.NODE_ENV !== 'production') {
  global._yutaAdminCloudDatabase = cloudDatabase;
}
