import type { RouteHandler } from './types';
import { handleCatalogRoute } from './catalog';
import { handleHealthRoute } from './health';
import { handleLocalUsersRoute } from './local-users';
import { handleOrderItemsRoute } from './order-items';
import { handleOrdersRoute } from './orders';
import { handlePaymentRoutes } from './payments';
import { handlePrintJobRoutes } from './print-jobs';

export const siteAgentRoutes: RouteHandler[] = [
  handleHealthRoute,
  handleLocalUsersRoute,
  handleCatalogRoute,
  handleOrdersRoute,
  handleOrderItemsRoute,
  handlePaymentRoutes,
  handlePrintJobRoutes,
];
