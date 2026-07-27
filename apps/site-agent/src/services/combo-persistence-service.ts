import type { PosDatabaseExecutor } from '@yuta/db-pos/client';
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
} from '@yuta/db-pos/schema';
import { and, asc, eq, inArray, ne } from 'drizzle-orm';
import { v7 as uuidv7 } from 'uuid';
import { calculateComboDiscounts, type ComboCalculationRule } from '@yuta/core';

export function createComboPersistenceService(db: PosDatabaseExecutor) {
  async function optimizeOrder(orderId: string) {
    const [items, rules] = await Promise.all([
      db
        .select()
        .from(orderItems)
        .where(
          and(
            eq(orderItems.orderId, orderId),
            ne(orderItems.status, 'cancelled'),
          ),
        ),
      loadRules(db),
    ]);
    const discounts = calculateComboDiscounts(items, rules);
    await clearOrderDiscounts(orderId);

    for (const discount of discounts) {
      const discountId = uuidv7();
      await db.insert(orderDiscounts).values({
        id: discountId,
        orderId,
        comboRuleId: discount.comboRuleId,
        nameSnapshot: discount.nameSnapshot,
        discountCents: discount.discountCents,
      });
      await db.insert(orderDiscountItems).values(
        discount.itemApplications.map((application) => ({
          id: uuidv7(),
          orderDiscountId: discountId,
          orderItemId: application.itemId,
          quantityApplied: application.quantityApplied,
        })),
      );
    }

    const subtotalCents = items.reduce(
      (sum, item) => sum + item.unitPriceCentsSnapshot * item.quantity,
      0,
    );
    const discountCents = discounts.reduce(
      (sum, discount) => sum + discount.discountCents,
      0,
    );
    await db
      .update(orders)
      .set({
        subtotalCents,
        discountCents,
        totalCents: Math.max(0, subtotalCents - discountCents),
      })
      .where(eq(orders.id, orderId));
    return discounts;
  }

  async function clearOrderDiscounts(orderId: string): Promise<void> {
    const existing = await db
      .select({ id: orderDiscounts.id })
      .from(orderDiscounts)
      .where(eq(orderDiscounts.orderId, orderId));
    if (existing.length > 0) {
      const ids = existing.map(({ id }) => id);
      await db
        .delete(orderDiscountItems)
        .where(inArray(orderDiscountItems.orderDiscountId, ids));
      await db.delete(orderDiscounts).where(inArray(orderDiscounts.id, ids));
    }
    await db
      .update(orders)
      .set({ discountCents: 0 })
      .where(eq(orders.id, orderId));
  }

  async function optimizeCheck(checkId: string) {
    const [rows, rules, check] = await Promise.all([
      db
        .select({
          id: checkItems.id,
          menuItemId: orderItems.menuItemId,
          unitPriceCentsSnapshot: orderItems.unitPriceCentsSnapshot,
          quantity: checkItems.quantity,
          createdAt: checkItems.createdAt,
        })
        .from(checkItems)
        .innerJoin(orderItems, eq(checkItems.orderItemId, orderItems.id))
        .where(eq(checkItems.checkId, checkId)),
      loadRules(db),
      db.query.checks.findFirst({ where: eq(checks.id, checkId) }),
    ]);
    if (!check) {
      return [];
    }
    const discounts = calculateComboDiscounts(rows, rules);
    await clearCheckDiscounts(checkId);

    for (const discount of discounts) {
      const discountId = uuidv7();
      await db.insert(checkDiscounts).values({
        id: discountId,
        checkId,
        comboRuleId: discount.comboRuleId,
        nameSnapshot: discount.nameSnapshot,
        discountCents: discount.discountCents,
      });
      await db.insert(checkDiscountItems).values(
        discount.itemApplications.map((application) => ({
          id: uuidv7(),
          checkDiscountId: discountId,
          checkItemId: application.itemId,
          quantityApplied: application.quantityApplied,
        })),
      );
    }
    const discountCents = discounts.reduce(
      (sum, discount) => sum + discount.discountCents,
      0,
    );
    await db
      .update(checks)
      .set({
        discountCents,
        totalCents: Math.max(0, check.subtotalCents - discountCents),
      })
      .where(eq(checks.id, checkId));
    return discounts;
  }

  async function clearCheckDiscounts(checkId: string): Promise<void> {
    const existing = await db
      .select({ id: checkDiscounts.id })
      .from(checkDiscounts)
      .where(eq(checkDiscounts.checkId, checkId));
    if (existing.length > 0) {
      const ids = existing.map(({ id }) => id);
      await db
        .delete(checkDiscountItems)
        .where(inArray(checkDiscountItems.checkDiscountId, ids));
      await db.delete(checkDiscounts).where(inArray(checkDiscounts.id, ids));
    }
    const check = await db.query.checks.findFirst({
      where: eq(checks.id, checkId),
    });
    if (check) {
      await db
        .update(checks)
        .set({ discountCents: 0, totalCents: check.subtotalCents })
        .where(eq(checks.id, checkId));
    }
  }

  return {
    optimizeOrder,
    clearOrderDiscounts,
    optimizeCheck,
    clearCheckDiscounts,
  };
}

async function loadRules(
  db: PosDatabaseExecutor,
): Promise<ComboCalculationRule[]> {
  const [ruleRows, groupRows, itemRows] = await Promise.all([
    db
      .select()
      .from(comboRules)
      .where(eq(comboRules.isActive, true))
      .orderBy(asc(comboRules.priority), asc(comboRules.name)),
    db.select().from(comboRuleGroups).orderBy(asc(comboRuleGroups.sortOrder)),
    db.select().from(comboRuleGroupItems),
  ]);
  return ruleRows.map((rule) => ({
    ...rule,
    groups: groupRows
      .filter((group) => group.comboRuleId === rule.id)
      .map((group) => ({
        id: group.id,
        name: group.name,
        minQuantity: group.minQuantity,
        maxQuantity: group.maxQuantity,
        sortOrder: group.sortOrder,
        items: itemRows
          .filter((item) => item.comboRuleGroupId === group.id)
          .map((item) => ({
            menuItemId: item.menuItemId,
            extraPriceCents: item.extraPriceCents,
          })),
      })),
  }));
}
