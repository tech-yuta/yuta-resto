import {
  localComboDeleteResponseSchema,
  localComboGroupItemResponseSchema,
  localComboGroupResponseSchema,
  localComboRuleResponseSchema,
  type CreateLocalComboGroupInput,
  type CreateLocalComboGroupItemInput,
  type CreateLocalComboRuleInput,
  type UpdateLocalComboGroupInput,
  type UpdateLocalComboGroupItemInput,
  type UpdateLocalComboRuleInput,
} from '@yuta/contracts/local-pos';
import type { PosDatabaseClient } from '@yuta/db-pos/client';
import {
  comboRuleGroupItems,
  comboRuleGroups,
  comboRules,
  menuItems,
} from '@yuta/db-pos/schema';
import { and, asc, eq, ne, sql } from 'drizzle-orm';
import { v7 as uuidv7 } from 'uuid';
import { HttpError } from '../http';

export function createComboManagementService(db: PosDatabaseClient) {
  async function createComboRule(input: CreateLocalComboRuleInput) {
    if (input.isActive) throw structureRequiredError();
    await assertRuleNameAvailable(input.name);
    const [created] = await db
      .insert(comboRules)
      .values({ id: uuidv7(), ...input })
      .returning();
    return localComboRuleResponseSchema.parse({
      comboRule: { ...toRule(created), groups: [] },
    });
  }

  async function updateComboRule(
    ruleId: string,
    input: UpdateLocalComboRuleInput,
  ) {
    const current = await requireRule(ruleId);
    if (input.name !== undefined) {
      await assertRuleNameAvailable(input.name, ruleId);
    }

    const next = { ...current, ...input };
    if (next.isActive) await validateRuleStructure(next);
    await db.update(comboRules).set(input).where(eq(comboRules.id, ruleId));
    return localComboRuleResponseSchema.parse({
      comboRule: await loadRule(ruleId),
    });
  }

  async function createComboGroup(input: CreateLocalComboGroupInput) {
    const rule = await requireRule(input.comboRuleId);
    assertRuleInactive(rule);
    await assertGroupNameAvailable(input.comboRuleId, input.name);
    const [created] = await db
      .insert(comboRuleGroups)
      .values({ id: uuidv7(), ...input })
      .returning();
    return localComboGroupResponseSchema.parse({
      group: { ...toGroup(created), items: [] },
    });
  }

  async function updateComboGroup(
    groupId: string,
    input: UpdateLocalComboGroupInput,
  ) {
    const current = await requireGroup(groupId);
    const rule = await requireRule(current.comboRuleId);
    assertRuleInactive(rule);
    const minQuantity = input.minQuantity ?? current.minQuantity;
    const maxQuantity = input.maxQuantity ?? current.maxQuantity;
    if (maxQuantity < minQuantity) {
      throw new HttpError(
        422,
        'COMBO_GROUP_QUANTITY_INVALID',
        'Group maximum quantity must be at least its minimum quantity.',
      );
    }
    if (input.name !== undefined) {
      await assertGroupNameAvailable(current.comboRuleId, input.name, groupId);
    }
    const [updated] = await db
      .update(comboRuleGroups)
      .set(input)
      .where(eq(comboRuleGroups.id, groupId))
      .returning();
    const items = await db
      .select()
      .from(comboRuleGroupItems)
      .where(eq(comboRuleGroupItems.comboRuleGroupId, groupId));
    return localComboGroupResponseSchema.parse({
      group: { ...toGroup(updated), items: items.map(toGroupItem) },
    });
  }

  async function deleteComboGroup(groupId: string) {
    const group = await requireGroup(groupId);
    const rule = await requireRule(group.comboRuleId);
    assertRuleInactive(rule);
    await db.transaction(async (tx) => {
      await tx
        .delete(comboRuleGroupItems)
        .where(eq(comboRuleGroupItems.comboRuleGroupId, groupId));
      await tx.delete(comboRuleGroups).where(eq(comboRuleGroups.id, groupId));
    });
    return localComboDeleteResponseSchema.parse({ success: true });
  }

  async function createComboGroupItem(input: CreateLocalComboGroupItemInput) {
    const group = await requireGroup(input.comboRuleGroupId);
    const rule = await requireRule(group.comboRuleId);
    assertRuleInactive(rule);
    await requireMenuItem(input.menuItemId);
    await assertGroupItemAvailable(input.comboRuleGroupId, input.menuItemId);
    const [created] = await db
      .insert(comboRuleGroupItems)
      .values({ id: uuidv7(), ...input })
      .returning();
    return localComboGroupItemResponseSchema.parse({
      item: toGroupItem(created),
    });
  }

  async function updateComboGroupItem(
    groupItemId: string,
    input: UpdateLocalComboGroupItemInput,
  ) {
    const current = await requireGroupItem(groupItemId);
    const group = await requireGroup(current.comboRuleGroupId);
    const rule = await requireRule(group.comboRuleId);
    assertRuleInactive(rule);
    const [updated] = await db
      .update(comboRuleGroupItems)
      .set(input)
      .where(eq(comboRuleGroupItems.id, groupItemId))
      .returning();
    return localComboGroupItemResponseSchema.parse({
      item: toGroupItem(updated),
    });
  }

  async function deleteComboGroupItem(groupItemId: string) {
    const current = await requireGroupItem(groupItemId);
    const group = await requireGroup(current.comboRuleGroupId);
    const rule = await requireRule(group.comboRuleId);
    assertRuleInactive(rule);
    await db
      .delete(comboRuleGroupItems)
      .where(eq(comboRuleGroupItems.id, groupItemId));
    return localComboDeleteResponseSchema.parse({ success: true });
  }

  async function loadRule(ruleId: string) {
    const rule = await requireRule(ruleId);
    const groups = await db
      .select()
      .from(comboRuleGroups)
      .where(eq(comboRuleGroups.comboRuleId, ruleId))
      .orderBy(asc(comboRuleGroups.sortOrder), asc(comboRuleGroups.name));
    const groupIds = new Set(groups.map((group) => group.id));
    const items = await db.select().from(comboRuleGroupItems);
    const itemsByGroup = new Map<string, typeof items>();
    for (const item of items) {
      if (!groupIds.has(item.comboRuleGroupId)) continue;
      const groupItems = itemsByGroup.get(item.comboRuleGroupId) ?? [];
      groupItems.push(item);
      itemsByGroup.set(item.comboRuleGroupId, groupItems);
    }
    return {
      ...toRule(rule),
      groups: groups.map((group) => ({
        ...toGroup(group),
        items: (itemsByGroup.get(group.id) ?? []).map(toGroupItem),
      })),
    };
  }

  async function validateRuleStructure(rule: typeof comboRules.$inferSelect) {
    const groups = await db
      .select()
      .from(comboRuleGroups)
      .where(eq(comboRuleGroups.comboRuleId, rule.id));
    if (groups.length === 0) throw structureRequiredError();
    const items = await db.select().from(comboRuleGroupItems);
    for (const group of groups) {
      if (
        group.minQuantity > 0 &&
        !items.some((item) => item.comboRuleGroupId === group.id)
      ) {
        throw structureRequiredError();
      }
    }
    if (
      rule.pricingMode === 'base_item_plus_delta' &&
      (!rule.basePricingGroupName ||
        !groups.some((group) => group.name === rule.basePricingGroupName))
    ) {
      throw new HttpError(
        422,
        'COMBO_BASE_GROUP_INVALID',
        'The base pricing group must match an existing combo group.',
      );
    }
  }

  async function requireRule(ruleId: string) {
    const rule = await db.query.comboRules.findFirst({
      where: eq(comboRules.id, ruleId),
    });
    if (!rule) throw notFoundError('COMBO_RULE_NOT_FOUND', 'combo rule');
    return rule;
  }

  async function requireGroup(groupId: string) {
    const group = await db.query.comboRuleGroups.findFirst({
      where: eq(comboRuleGroups.id, groupId),
    });
    if (!group) throw notFoundError('COMBO_GROUP_NOT_FOUND', 'combo group');
    return group;
  }

  async function requireGroupItem(groupItemId: string) {
    const item = await db.query.comboRuleGroupItems.findFirst({
      where: eq(comboRuleGroupItems.id, groupItemId),
    });
    if (!item) {
      throw notFoundError('COMBO_GROUP_ITEM_NOT_FOUND', 'combo group item');
    }
    return item;
  }

  async function requireMenuItem(menuItemId: string) {
    const item = await db.query.menuItems.findFirst({
      where: eq(menuItems.id, menuItemId),
    });
    if (!item) throw notFoundError('CATALOG_ITEM_NOT_FOUND', 'catalog item');
    return item;
  }

  async function assertRuleNameAvailable(name: string, excludedId?: string) {
    const existing = await db.query.comboRules.findFirst({
      where: excludedId
        ? and(
            sql`lower(${comboRules.name}) = lower(${name})`,
            ne(comboRules.id, excludedId),
          )
        : sql`lower(${comboRules.name}) = lower(${name})`,
    });
    if (existing) {
      throw new HttpError(
        409,
        'COMBO_RULE_NAME_CONFLICT',
        'A combo rule with this name already exists.',
      );
    }
  }

  async function assertGroupNameAvailable(
    ruleId: string,
    name: string,
    excludedId?: string,
  ) {
    const conditions = [
      eq(comboRuleGroups.comboRuleId, ruleId),
      sql`lower(${comboRuleGroups.name}) = lower(${name})`,
    ];
    if (excludedId) conditions.push(ne(comboRuleGroups.id, excludedId));
    const existing = await db.query.comboRuleGroups.findFirst({
      where: and(...conditions),
    });
    if (existing) {
      throw new HttpError(
        409,
        'COMBO_GROUP_NAME_CONFLICT',
        'A group with this name already exists in the combo rule.',
      );
    }
  }

  async function assertGroupItemAvailable(groupId: string, menuItemId: string) {
    const existing = await db.query.comboRuleGroupItems.findFirst({
      where: and(
        eq(comboRuleGroupItems.comboRuleGroupId, groupId),
        eq(comboRuleGroupItems.menuItemId, menuItemId),
      ),
    });
    if (existing) {
      throw new HttpError(
        409,
        'COMBO_GROUP_ITEM_CONFLICT',
        'This catalog item is already eligible in the combo group.',
      );
    }
  }

  return {
    createComboRule,
    updateComboRule,
    createComboGroup,
    updateComboGroup,
    deleteComboGroup,
    createComboGroupItem,
    updateComboGroupItem,
    deleteComboGroupItem,
  };
}

function assertRuleInactive(rule: typeof comboRules.$inferSelect): void {
  if (rule.isActive) {
    throw new HttpError(
      409,
      'COMBO_RULE_MUST_BE_INACTIVE',
      'Deactivate the combo rule before changing its groups or eligible items.',
    );
  }
}

function structureRequiredError(): HttpError {
  return new HttpError(
    422,
    'COMBO_RULE_STRUCTURE_REQUIRED',
    'The combo rule needs valid groups and eligible items before activation.',
  );
}

function notFoundError(code: string, entity: string): HttpError {
  return new HttpError(404, code, `The requested ${entity} does not exist.`);
}

function toRule(rule: typeof comboRules.$inferSelect) {
  return {
    id: rule.id,
    name: rule.name,
    pricingMode: rule.pricingMode,
    comboPriceCents: rule.comboPriceCents,
    priceDeltaCents: rule.priceDeltaCents,
    basePricingGroupName: rule.basePricingGroupName,
    priority: rule.priority,
    maxApplications: rule.maxApplications,
    isActive: rule.isActive,
  };
}

function toGroup(group: typeof comboRuleGroups.$inferSelect) {
  return {
    id: group.id,
    name: group.name,
    minQuantity: group.minQuantity,
    maxQuantity: group.maxQuantity,
    sortOrder: group.sortOrder,
  };
}

function toGroupItem(item: typeof comboRuleGroupItems.$inferSelect) {
  return {
    id: item.id,
    menuItemId: item.menuItemId,
    extraPriceCents: item.extraPriceCents,
  };
}
