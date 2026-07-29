import {
  localCatalogResponseSchema,
  localOrderResponseSchema,
  localOrdersQuerySchema,
  localOrdersResponseSchema,
  localUsersResponseSchema,
  siteAgentHealthResponseSchema,
  type CreateLocalOrderInput,
  type LocalOrderSummary,
  type LocalOrdersQuery,
} from '@yuta/contracts/local-pos';
import type { PosDatabaseClient } from '@yuta/db-pos/client';
import {
  comboRuleGroupItems,
  comboRuleGroups,
  comboRules,
  localUsers,
  menuCategories,
  menuItems,
  orders,
} from '@yuta/db-pos/schema';
import { asc, desc, eq, sql } from 'drizzle-orm';
import { v7 as uuidv7 } from 'uuid';
import { HttpError } from '../http';
import { createCatalogManagementService } from './catalog-management-service';
import { createComboManagementService } from './combo-management-service';
import { createOrderCommandService } from './order-command-service';
import { createFinancialService } from './financial-service';
import { createLocalAuthService } from './local-auth-service';
import { createLocalUserManagementService } from './local-user-management-service';
import { createPrintJobService } from './print-job-service';

export function createSiteAgentService(db: PosDatabaseClient) {
  const orderCommands = createOrderCommandService(db);
  const financial = createFinancialService(db);
  const printing = createPrintJobService(db);
  const authentication = createLocalAuthService(db);
  const userManagement = createLocalUserManagementService(db);
  const catalogManagement = createCatalogManagementService(db);
  const comboManagement = createComboManagementService(db);
  async function getHealth() {
    try {
      await db.execute(sql`select 1`);
      return siteAgentHealthResponseSchema.parse({
        status: 'ok',
        database: 'ready',
        service: 'site-agent',
        apiVersion: 'v1',
        checkedAt: new Date().toISOString(),
      });
    } catch {
      return siteAgentHealthResponseSchema.parse({
        status: 'degraded',
        database: 'unavailable',
        service: 'site-agent',
        apiVersion: 'v1',
        checkedAt: new Date().toISOString(),
      });
    }
  }

  async function listLocalUsers() {
    const rows = await db
      .select({
        id: localUsers.id,
        name: localUsers.name,
        email: localUsers.email,
        role: localUsers.role,
        isActive: localUsers.isActive,
      })
      .from(localUsers)
      .orderBy(asc(localUsers.name));

    return localUsersResponseSchema.parse({ users: rows });
  }

  async function getCatalog() {
    const [categoryRows, itemRows, ruleRows, groupRows, groupItemRows] =
      await Promise.all([
        db
          .select()
          .from(menuCategories)
          .orderBy(asc(menuCategories.sortOrder), asc(menuCategories.name)),
        db
          .select()
          .from(menuItems)
          .orderBy(asc(menuItems.sortOrder), asc(menuItems.name)),
        db
          .select()
          .from(comboRules)
          .orderBy(asc(comboRules.priority), asc(comboRules.name)),
        db
          .select()
          .from(comboRuleGroups)
          .orderBy(asc(comboRuleGroups.sortOrder), asc(comboRuleGroups.name)),
        db.select().from(comboRuleGroupItems),
      ]);
    const itemsByCategory = new Map<string, typeof itemRows>();
    for (const item of itemRows) {
      const categoryItems = itemsByCategory.get(item.categoryId) ?? [];
      categoryItems.push(item);
      itemsByCategory.set(item.categoryId, categoryItems);
    }
    const groupItemsByGroup = new Map<string, typeof groupItemRows>();
    for (const item of groupItemRows) {
      const items = groupItemsByGroup.get(item.comboRuleGroupId) ?? [];
      items.push(item);
      groupItemsByGroup.set(item.comboRuleGroupId, items);
    }
    const groupsByRule = new Map<string, typeof groupRows>();
    for (const group of groupRows) {
      const groups = groupsByRule.get(group.comboRuleId) ?? [];
      groups.push(group);
      groupsByRule.set(group.comboRuleId, groups);
    }

    return localCatalogResponseSchema.parse({
      categories: categoryRows.map((category) => ({
        id: category.id,
        name: category.name,
        sortOrder: category.sortOrder,
        isActive: category.isActive,
        items: (itemsByCategory.get(category.id) ?? []).map((item) => ({
          id: item.id,
          categoryId: item.categoryId,
          name: item.name,
          description: item.description,
          priceCents: item.priceCents,
          kitchenStation: item.kitchenStation,
          isAvailable: item.isAvailable,
          sortOrder: item.sortOrder,
        })),
      })),
      comboRules: ruleRows.map((rule) => ({
        id: rule.id,
        name: rule.name,
        pricingMode: rule.pricingMode,
        comboPriceCents: rule.comboPriceCents,
        priceDeltaCents: rule.priceDeltaCents,
        basePricingGroupName: rule.basePricingGroupName,
        priority: rule.priority,
        maxApplications: rule.maxApplications,
        isActive: rule.isActive,
        groups: (groupsByRule.get(rule.id) ?? []).map((group) => ({
          id: group.id,
          name: group.name,
          minQuantity: group.minQuantity,
          maxQuantity: group.maxQuantity,
          sortOrder: group.sortOrder,
          items: (groupItemsByGroup.get(group.id) ?? []).map((item) => ({
            id: item.id,
            menuItemId: item.menuItemId,
            extraPriceCents: item.extraPriceCents,
          })),
        })),
      })),
    });
  }

  async function listOrders(input: LocalOrdersQuery) {
    const query = localOrdersQuerySchema.parse(input);
    const rows = query.status
      ? await db
          .select()
          .from(orders)
          .where(eq(orders.status, query.status))
          .orderBy(desc(orders.createdAt))
          .limit(query.limit)
      : await db
          .select()
          .from(orders)
          .orderBy(desc(orders.createdAt))
          .limit(query.limit);

    return localOrdersResponseSchema.parse({
      orders: rows.map(toOrderSummary),
    });
  }

  async function createOrder(input: CreateLocalOrderInput) {
    const staffUser = await db.query.localUsers.findFirst({
      where: eq(localUsers.id, input.staffUserId),
    });
    if (!staffUser || !staffUser.isActive || staffUser.role === 'kitchen') {
      throw new HttpError(
        422,
        'STAFF_USER_UNAVAILABLE',
        'The selected local staff user is not available.',
      );
    }

    const id = uuidv7();
    const [created] = await db
      .insert(orders)
      .values({
        id,
        orderNumber: createOrderNumber(id),
        tableLabel: input.tableLabel,
        orderType: input.orderType,
        createdBy: staffUser.id,
        note: input.note,
      })
      .returning();

    return localOrderResponseSchema.parse({ order: toOrderSummary(created) });
  }

  return {
    getHealth,
    listLocalUsers,
    getCatalog,
    listOrders,
    createOrder,
    ...authentication,
    ...userManagement,
    ...catalogManagement,
    ...comboManagement,
    ...orderCommands,
    ...financial,
    ...printing,
  };
}

export type SiteAgentService = ReturnType<typeof createSiteAgentService>;

export function toOrderSummary(
  order: typeof orders.$inferSelect,
): LocalOrderSummary {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    tableLabel: order.tableLabel,
    orderType: order.orderType,
    status: order.status,
    subtotalCents: order.subtotalCents,
    discountCents: order.discountCents,
    totalCents: order.totalCents,
    paymentMode: order.paymentMode,
    note: order.note,
    hasAllergy: order.hasAllergy,
    allergyNote: order.allergyNote,
    allergyAcknowledgedAt: order.allergyAcknowledgedAt?.toISOString() ?? null,
    createdBy: order.createdBy,
    sentAt: order.sentAt?.toISOString() ?? null,
    paidAt: order.paidAt?.toISOString() ?? null,
    cancelledAt: order.cancelledAt?.toISOString() ?? null,
    cancelledReason: order.cancelledReason,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
  };
}

function createOrderNumber(id: string, date = new Date()): string {
  const datePart = [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, '0'),
    String(date.getUTCDate()).padStart(2, '0'),
  ].join('');
  const timePart = [
    String(date.getUTCHours()).padStart(2, '0'),
    String(date.getUTCMinutes()).padStart(2, '0'),
    String(date.getUTCSeconds()).padStart(2, '0'),
  ].join('');
  const suffix = id.replaceAll('-', '').slice(-6).toUpperCase();

  return `POS-${datePart}-${timePart}-${suffix}`;
}
