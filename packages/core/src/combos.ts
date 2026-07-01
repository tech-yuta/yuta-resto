import { and, asc, eq, inArray, isNotNull, ne, sql } from 'drizzle-orm';
import {
  checkDiscountItems,
  checkDiscounts,
  checkItems,
  checks,
  comboRuleGroupItems,
  comboRuleGroups,
  comboRules,
  orderDiscountItems,
  orderDiscounts,
  orderItems,
  orders,
  type ComboRule,
  type ComboRuleGroup,
  type ComboRuleGroupItem,
  type Order,
} from '@yuta/db/schema';
import type { DbClient } from '@yuta/db/client';
import { z } from 'zod';

export type ComboCalculationItem = {
  id: string;
  menuItemId: string;
  unitPriceCentsSnapshot: number;
  quantity: number;
  createdAt: Date;
};

export type ComboCalculationRule = Pick<
  ComboRule,
  'id' | 'name' | 'comboPriceCents' | 'priority' | 'maxApplications' | 'isActive'
> & {
  groups: Array<
    Pick<ComboRuleGroup, 'id' | 'comboRuleId' | 'name' | 'minQuantity' | 'maxQuantity' | 'sortOrder'> & {
      items: Array<Pick<ComboRuleGroupItem, 'id' | 'comboRuleGroupId' | 'menuItemId' | 'extraPriceCents'>>;
    }
  >;
};

export type CalculatedComboDiscount = {
  comboRuleId: string;
  nameSnapshot: string;
  discountCents: number;
  itemApplications: Array<{
    itemId: string;
    quantityApplied: number;
  }>;
};

type UnitItem = {
  unitKey: string;
  itemId: string;
  menuItemId: string;
  unitPriceCentsSnapshot: number;
  createdAt: Date;
};

type MatchedUnit = UnitItem & {
  groupId: string;
  extraPriceCents: number;
};

const orderIdSchema = z.object({
  orderId: z.string().uuid(),
});

const checkIdSchema = z.object({
  checkId: z.string().uuid(),
});

export class ComboServiceError extends Error {
  constructor(
    message: string,
    public readonly code: 'not_found' | 'invalid_input',
  ) {
    super(message);
    this.name = 'ComboServiceError';
  }
}

export function calculateComboDiscountsForItems(
  items: ComboCalculationItem[],
  rules: ComboCalculationRule[],
): CalculatedComboDiscount[] {
  const discounts: CalculatedComboDiscount[] = [];
  const remainingUnits = expandQuantities(items);
  const activeRules = rules
    .filter((rule) => rule.isActive)
    .toSorted((left, right) => left.priority - right.priority || left.name.localeCompare(right.name));

  for (const rule of activeRules) {
    let applications = 0;

    while (rule.maxApplications === null || applications < rule.maxApplications) {
      const match = findBestMatch(rule, remainingUnits);

      if (!match) {
        break;
      }

      const originalTotal = match.reduce((total, item) => total + item.unitPriceCentsSnapshot, 0);
      const extraTotal = match.reduce((total, item) => total + item.extraPriceCents, 0);
      const comboTotal = rule.comboPriceCents + extraTotal;
      const discountCents = originalTotal - comboTotal;

      if (discountCents <= 0) {
        break;
      }

      discounts.push({
        comboRuleId: rule.id,
        nameSnapshot: rule.name,
        discountCents,
        itemApplications: aggregateMatchedItems(match),
      });

      removeMatchedUnits(remainingUnits, match);
      applications++;
    }
  }

  return discounts;
}

export function createComboService(db: DbClient) {
  async function optimizeOrderCombos(orderId: string): Promise<CalculatedComboDiscount[]> {
    const { orderId: parsedOrderId } = orderIdSchema.parse({ orderId });

    return db.transaction(async (tx) => {
      await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${parsedOrderId}))`);

      const order = await tx.query.orders.findFirst({
        where: eq(orders.id, parsedOrderId),
      });

      if (!order) {
        throw new ComboServiceError('Order not found.', 'not_found');
      }

      const items = await tx.query.orderItems.findMany({
        where: and(eq(orderItems.orderId, parsedOrderId), ne(orderItems.status, 'cancelled')),
        orderBy: [asc(orderItems.createdAt), asc(orderItems.id)],
      });
      const rules = await tx.query.comboRules.findMany({
        where: eq(comboRules.isActive, true),
        with: {
          groups: {
            with: {
              items: true,
            },
            orderBy: [asc(comboRuleGroups.sortOrder)],
          },
        },
        orderBy: [asc(comboRules.priority), asc(comboRules.name)],
      });
      const discounts = calculateComboDiscountsForItems(
        items.map((item) => ({
          id: item.id,
          menuItemId: item.menuItemId,
          unitPriceCentsSnapshot: item.unitPriceCentsSnapshot,
          quantity: item.quantity,
          createdAt: item.createdAt,
        })),
        rules,
      );
      const existingDiscounts = await tx.query.orderDiscounts.findMany({
        where: and(eq(orderDiscounts.orderId, parsedOrderId), isNotNull(orderDiscounts.comboRuleId)),
      });

      if (existingDiscounts.length > 0) {
        const discountIds = existingDiscounts.map((discount) => discount.id);

        await tx
          .delete(orderDiscountItems)
          .where(inArray(orderDiscountItems.orderDiscountId, discountIds));
        await tx.delete(orderDiscounts).where(inArray(orderDiscounts.id, discountIds));
      }

      for (const discount of discounts) {
        const [createdDiscount] = await tx
          .insert(orderDiscounts)
          .values({
            orderId: parsedOrderId,
            comboRuleId: discount.comboRuleId,
            nameSnapshot: discount.nameSnapshot,
            discountCents: discount.discountCents,
          })
          .returning();

        if (discount.itemApplications.length > 0) {
          await tx.insert(orderDiscountItems).values(
            discount.itemApplications.map((item) => ({
              orderDiscountId: createdDiscount.id,
              orderItemId: item.itemId,
              quantityApplied: item.quantityApplied,
            })),
          );
        }
      }

      const discountCents = sumDiscounts(discounts);
      await tx
        .update(orders)
        .set({
          discountCents,
          totalCents: Math.max(0, order.subtotalCents - discountCents),
        })
        .where(eq(orders.id, parsedOrderId));

      return discounts;
    });
  }

  async function clearOrderComboDiscounts(orderId: string): Promise<void> {
    const { orderId: parsedOrderId } = orderIdSchema.parse({ orderId });
    const existingDiscounts = await db.query.orderDiscounts.findMany({
      where: and(eq(orderDiscounts.orderId, parsedOrderId), isNotNull(orderDiscounts.comboRuleId)),
    });

    if (existingDiscounts.length === 0) {
      await db.update(orders).set({ discountCents: 0 }).where(eq(orders.id, parsedOrderId));
      const order = await getRequiredOrder(parsedOrderId);
      await db.update(orders).set({ totalCents: order.subtotalCents }).where(eq(orders.id, parsedOrderId));
      return;
    }

    const discountIds = existingDiscounts.map((discount) => discount.id);

    await db
      .delete(orderDiscountItems)
      .where(inArray(orderDiscountItems.orderDiscountId, discountIds));
    await db.delete(orderDiscounts).where(inArray(orderDiscounts.id, discountIds));

    const order = await getRequiredOrder(parsedOrderId);
    await db
      .update(orders)
      .set({ discountCents: 0, totalCents: order.subtotalCents })
      .where(eq(orders.id, parsedOrderId));
  }

  async function optimizeCheckCombos(checkId: string): Promise<CalculatedComboDiscount[]> {
    const { checkId: parsedCheckId } = checkIdSchema.parse({ checkId });
    const check = await getRequiredCheck(parsedCheckId);
    const items = await getCheckCalculationItems(parsedCheckId);
    const rules = await getActiveComboRules();
    const discounts = calculateComboDiscountsForItems(items, rules);

    await clearCheckComboDiscounts(parsedCheckId);
    await insertCheckDiscounts(parsedCheckId, discounts);

    const discountCents = sumDiscounts(discounts);
    await db
      .update(checks)
      .set({
        discountCents,
        totalCents: Math.max(0, check.subtotalCents - discountCents),
      })
      .where(eq(checks.id, parsedCheckId));

    return discounts;
  }

  async function clearCheckComboDiscounts(checkId: string): Promise<void> {
    const { checkId: parsedCheckId } = checkIdSchema.parse({ checkId });
    const existingDiscounts = await db.query.checkDiscounts.findMany({
      where: and(eq(checkDiscounts.checkId, parsedCheckId), isNotNull(checkDiscounts.comboRuleId)),
    });

    if (existingDiscounts.length === 0) {
      const check = await getRequiredCheck(parsedCheckId);
      await db
        .update(checks)
        .set({ discountCents: 0, totalCents: check.subtotalCents })
        .where(eq(checks.id, parsedCheckId));
      return;
    }

    const discountIds = existingDiscounts.map((discount) => discount.id);

    await db
      .delete(checkDiscountItems)
      .where(inArray(checkDiscountItems.checkDiscountId, discountIds));
    await db.delete(checkDiscounts).where(inArray(checkDiscounts.id, discountIds));

    const check = await getRequiredCheck(parsedCheckId);
    await db
      .update(checks)
      .set({ discountCents: 0, totalCents: check.subtotalCents })
      .where(eq(checks.id, parsedCheckId));
  }

  async function getActiveComboRules(): Promise<ComboCalculationRule[]> {
    return db.query.comboRules.findMany({
      where: eq(comboRules.isActive, true),
      with: {
        groups: {
          with: {
            items: true,
          },
          orderBy: [asc(comboRuleGroups.sortOrder)],
        },
      },
      orderBy: [asc(comboRules.priority), asc(comboRules.name)],
    });
  }

  async function getRequiredOrder(orderId: string): Promise<Order> {
    const order = await db.query.orders.findFirst({
      where: eq(orders.id, orderId),
    });

    if (!order) {
      throw new ComboServiceError('Order not found.', 'not_found');
    }

    return order;
  }

  async function getRequiredCheck(checkId: string) {
    const check = await db.query.checks.findFirst({
      where: eq(checks.id, checkId),
    });

    if (!check) {
      throw new ComboServiceError('Check not found.', 'not_found');
    }

    return check;
  }

  async function getOrderCalculationItems(orderId: string): Promise<ComboCalculationItem[]> {
    const items = await db.query.orderItems.findMany({
      where: and(eq(orderItems.orderId, orderId), ne(orderItems.status, 'cancelled')),
      orderBy: [asc(orderItems.createdAt), asc(orderItems.id)],
    });

    return items.map((item) => ({
      id: item.id,
      menuItemId: item.menuItemId,
      unitPriceCentsSnapshot: item.unitPriceCentsSnapshot,
      quantity: item.quantity,
      createdAt: item.createdAt,
    }));
  }

  async function getCheckCalculationItems(checkId: string): Promise<ComboCalculationItem[]> {
    const items = await db.query.checkItems.findMany({
      where: eq(checkItems.checkId, checkId),
      with: {
        orderItem: true,
      },
      orderBy: [asc(checkItems.createdAt), asc(checkItems.id)],
    });

    return items
      .filter((item) => item.orderItem.status !== 'cancelled')
      .map((item) => ({
        id: item.id,
        menuItemId: item.orderItem.menuItemId,
        unitPriceCentsSnapshot: item.orderItem.unitPriceCentsSnapshot,
        quantity: item.quantity,
        createdAt: item.createdAt,
      }));
  }

  async function insertOrderDiscounts(
    orderId: string,
    discounts: CalculatedComboDiscount[],
  ): Promise<void> {
    for (const discount of discounts) {
      const [createdDiscount] = await db
        .insert(orderDiscounts)
        .values({
          orderId,
          comboRuleId: discount.comboRuleId,
          nameSnapshot: discount.nameSnapshot,
          discountCents: discount.discountCents,
        })
        .returning();

      if (discount.itemApplications.length > 0) {
        await db.insert(orderDiscountItems).values(
          discount.itemApplications.map((item) => ({
            orderDiscountId: createdDiscount.id,
            orderItemId: item.itemId,
            quantityApplied: item.quantityApplied,
          })),
        );
      }
    }
  }

  async function insertCheckDiscounts(
    checkId: string,
    discounts: CalculatedComboDiscount[],
  ): Promise<void> {
    for (const discount of discounts) {
      const [createdDiscount] = await db
        .insert(checkDiscounts)
        .values({
          checkId,
          comboRuleId: discount.comboRuleId,
          nameSnapshot: discount.nameSnapshot,
          discountCents: discount.discountCents,
        })
        .returning();

      if (discount.itemApplications.length > 0) {
        await db.insert(checkDiscountItems).values(
          discount.itemApplications.map((item) => ({
            checkDiscountId: createdDiscount.id,
            checkItemId: item.itemId,
            quantityApplied: item.quantityApplied,
          })),
        );
      }
    }
  }

  async function updateOrderDiscountTotals(
    order: Order,
    discounts: CalculatedComboDiscount[],
  ): Promise<void> {
    const discountCents = sumDiscounts(discounts);

    await db
      .update(orders)
      .set({
        discountCents,
        totalCents: Math.max(0, order.subtotalCents - discountCents),
      })
      .where(eq(orders.id, order.id));
  }

  return {
    optimizeOrderCombos,
    clearOrderComboDiscounts,
    calculateComboDiscountsForItems,
    optimizeCheckCombos,
    clearCheckComboDiscounts,
  };
}

function expandQuantities(items: ComboCalculationItem[]): UnitItem[] {
  return items
    .toSorted(compareCalculationItems)
    .flatMap((item) =>
      Array.from({ length: item.quantity }, (_, index) => ({
        unitKey: `${item.id}:${index}`,
        itemId: item.id,
        menuItemId: item.menuItemId,
        unitPriceCentsSnapshot: item.unitPriceCentsSnapshot,
        createdAt: item.createdAt,
      })),
    );
}

function findBestMatch(rule: ComboCalculationRule, remainingUnits: UnitItem[]): MatchedUnit[] | null {
  const groups = rule.groups.toSorted((left, right) => left.sortOrder - right.sortOrder);
  let candidates: MatchedUnit[][] = [[]];

  for (const group of groups) {
    const groupMatches = findGroupMatches(group, remainingUnits);

    if (groupMatches.length === 0) {
      return null;
    }

    const nextCandidates: MatchedUnit[][] = [];

    for (const candidate of candidates) {
      for (const groupMatch of groupMatches) {
        if (hasUnitOverlap(candidate, groupMatch)) {
          continue;
        }

        nextCandidates.push([...candidate, ...groupMatch]);
      }
    }

    candidates = nextCandidates;

    if (candidates.length === 0) {
      return null;
    }
  }

  return candidates.toSorted(compareMatchesForBestDiscount)[0] ?? null;
}

function findGroupMatches(
  group: ComboCalculationRule['groups'][number],
  remainingUnits: UnitItem[],
): MatchedUnit[][] {
  const eligibleUnits = remainingUnits
    .map((unit) => {
      const groupItem = group.items.find((item) => item.menuItemId === unit.menuItemId);

      if (!groupItem) {
        return null;
      }

      return {
        ...unit,
        groupId: group.id,
        extraPriceCents: groupItem.extraPriceCents,
      };
    })
    .filter((unit): unit is MatchedUnit => unit !== null)
    .toSorted(compareUnits);

  const matches: MatchedUnit[][] = [];
  const maxQuantity = Math.min(group.maxQuantity, eligibleUnits.length);

  for (let size = group.minQuantity; size <= maxQuantity; size++) {
    matches.push(...combinations(eligibleUnits, size));
  }

  return matches.toSorted(compareMatchesForBestDiscount);
}

function combinations<T>(items: T[], size: number): T[][] {
  if (size <= 0) {
    return [[]];
  }

  if (items.length < size) {
    return [];
  }

  const result: T[][] = [];

  function walk(startIndex: number, current: T[]): void {
    if (current.length === size) {
      result.push([...current]);
      return;
    }

    for (let index = startIndex; index < items.length; index++) {
      current.push(items[index]);
      walk(index + 1, current);
      current.pop();
    }
  }

  walk(0, []);

  return result;
}

function compareMatchesForBestDiscount(left: MatchedUnit[], right: MatchedUnit[]): number {
  const leftNetValue = matchNetValue(left);
  const rightNetValue = matchNetValue(right);

  if (leftNetValue !== rightNetValue) {
    return rightNetValue - leftNetValue;
  }

  return compareUnitArrays(left, right);
}

function matchNetValue(match: MatchedUnit[]): number {
  return match.reduce((total, item) => total + item.unitPriceCentsSnapshot - item.extraPriceCents, 0);
}

function compareUnitArrays(left: UnitItem[], right: UnitItem[]): number {
  const sortedLeft = left.toSorted(compareUnits);
  const sortedRight = right.toSorted(compareUnits);
  const length = Math.min(sortedLeft.length, sortedRight.length);

  for (let index = 0; index < length; index++) {
    const comparison = compareUnits(sortedLeft[index], sortedRight[index]);
    if (comparison !== 0) {
      return comparison;
    }
  }

  return sortedLeft.length - sortedRight.length;
}

function compareCalculationItems(left: ComboCalculationItem, right: ComboCalculationItem): number {
  return left.createdAt.getTime() - right.createdAt.getTime() || left.id.localeCompare(right.id);
}

function compareUnits(left: UnitItem, right: UnitItem): number {
  return (
    left.createdAt.getTime() - right.createdAt.getTime() ||
    left.itemId.localeCompare(right.itemId) ||
    left.unitKey.localeCompare(right.unitKey)
  );
}

function hasUnitOverlap(left: UnitItem[], right: UnitItem[]): boolean {
  const usedUnitKeys = new Set(left.map((unit) => unit.unitKey));
  return right.some((unit) => usedUnitKeys.has(unit.unitKey));
}

function aggregateMatchedItems(match: MatchedUnit[]): CalculatedComboDiscount['itemApplications'] {
  const quantitiesByItemId = new Map<string, number>();

  for (const item of match) {
    quantitiesByItemId.set(item.itemId, (quantitiesByItemId.get(item.itemId) ?? 0) + 1);
  }

  return Array.from(quantitiesByItemId.entries())
    .map(([itemId, quantityApplied]) => ({ itemId, quantityApplied }))
    .toSorted((left, right) => left.itemId.localeCompare(right.itemId));
}

function removeMatchedUnits(remainingUnits: UnitItem[], match: MatchedUnit[]): void {
  const matchedUnitKeys = new Set(match.map((item) => item.unitKey));

  for (let index = remainingUnits.length - 1; index >= 0; index--) {
    if (matchedUnitKeys.has(remainingUnits[index].unitKey)) {
      remainingUnits.splice(index, 1);
    }
  }
}

function sumDiscounts(discounts: CalculatedComboDiscount[]): number {
  return discounts.reduce((total, discount) => total + discount.discountCents, 0);
}
