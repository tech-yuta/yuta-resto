import 'server-only';

import { createCloudDatabaseClient } from '@yuta/db-cloud/client';

declare global {
  var _yutaFeedbackWebCloudDatabase:
    | ReturnType<typeof createCloudDatabaseClient>
    | undefined;
}

export const cloudDatabase =
  global._yutaFeedbackWebCloudDatabase ?? createCloudDatabaseClient();

if (process.env.NODE_ENV !== 'production') {
  global._yutaFeedbackWebCloudDatabase = cloudDatabase;
}
