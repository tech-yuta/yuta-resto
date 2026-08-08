import { and, eq } from 'drizzle-orm';
import { config } from 'dotenv';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { v7 as uuidv7 } from 'uuid';
import type { PosDatabaseClient } from './client';
import { hashLocalPin } from './local-auth-crypto';
import {
  lunaCategorySeeds,
  lunaComboSeeds,
  lunaMenuItemSeeds,
} from './luna-seed-data';
import {
  comboRuleGroupItems,
  comboRuleGroups,
  comboRules,
  localUsers,
  menuCategories,
  menuItems,
  type ComboRule,
  type ComboRuleGroup,
  type LocalUser,
  type MenuCategory,
  type MenuItem,
} from './schema';

config({ path: '.env.local' });
config({ path: '.env' });

export type PosSeedContext = {
  adminUser: LocalUser;
  staffUser: LocalUser;
  kitchenUser: LocalUser;
  categories: Record<string, MenuCategory>;
  menuItems: Record<string, MenuItem>;
  comboRules: Record<string, ComboRule>;
};

export async function seedPosData(
  seedDb?: PosDatabaseClient,
): Promise<PosSeedContext> {
  const adminPin = readSeedPin('YUTA_POS_SEED_ADMIN_PIN');
  const staffPin = readSeedPin('YUTA_POS_SEED_STAFF_PIN');
  const kitchenPin = readSeedPin('YUTA_POS_SEED_KITCHEN_PIN');
  const activeDb =
    seedDb ?? (await import('./client')).createPosDatabaseClient(process.env);
  const [adminPinHash, staffPinHash, kitchenPinHash] = await Promise.all([
    hashLocalPin(adminPin),
    hashLocalPin(staffPin),
    hashLocalPin(kitchenPin),
  ]);
  const adminUser = await upsertLocalUser(activeDb, {
    name: 'YuTa Admin',
    email: 'admin@yuta.local',
    role: 'admin',
    pinHash: adminPinHash,
  });
  const staffUser = await upsertLocalUser(activeDb, {
    name: 'YuTa Staff',
    email: 'staff@yuta.local',
    role: 'staff',
    pinHash: staffPinHash,
  });
  const kitchenUser = await upsertLocalUser(activeDb, {
    name: 'YuTa Kitchen',
    email: 'kitchen@yuta.local',
    role: 'kitchen',
    pinHash: kitchenPinHash,
  });

  const categories: Record<string, MenuCategory> = {};
  for (const categorySeed of lunaCategorySeeds) {
    categories[categorySeed.name] = await upsertCategory(
      activeDb,
      categorySeed,
    );
  }

  const seededMenuItems: Record<string, MenuItem> = {};
  for (const itemSeed of lunaMenuItemSeeds) {
    seededMenuItems[itemSeed.name] = await upsertMenuItem(activeDb, {
      categoryId: categories[itemSeed.category].id,
      name: itemSeed.name,
      description: itemSeed.description ?? null,
      priceCents: itemSeed.priceCents,
      kitchenStation: itemSeed.kitchenStation,
      isAvailable: itemSeed.isAvailable ?? true,
      sortOrder: itemSeed.sortOrder,
    });
  }

  const seededComboRules: Record<string, ComboRule> = {};
  for (const comboSeed of lunaComboSeeds) {
    const comboRule = await upsertComboRule(activeDb, comboSeed);
    seededComboRules[comboRule.name] = comboRule;

    for (const groupSeed of comboSeed.groups) {
      const group = await upsertComboRuleGroup(activeDb, {
        comboRuleId: comboRule.id,
        name: groupSeed.name,
        minQuantity: groupSeed.minQuantity,
        maxQuantity: groupSeed.maxQuantity,
        sortOrder: groupSeed.sortOrder,
      });

      for (const itemSeed of groupSeed.items) {
        await upsertComboRuleGroupItem(activeDb, {
          comboRuleGroupId: group.id,
          menuItemId: seededMenuItems[itemSeed.name].id,
          extraPriceCents: itemSeed.extraPriceCents,
        });
      }
    }
  }

  return {
    adminUser,
    staffUser,
    kitchenUser,
    categories,
    menuItems: seededMenuItems,
    comboRules: seededComboRules,
  };
}

async function upsertLocalUser(
  seedDb: PosDatabaseClient,
  values: {
    name: string;
    email: string;
    role: 'admin' | 'manager' | 'staff' | 'kitchen';
    pinHash: string;
  },
): Promise<LocalUser> {
  const existing = await seedDb.query.localUsers.findFirst({
    where: eq(localUsers.email, values.email),
  });

  if (existing) {
    const [updated] = await seedDb
      .update(localUsers)
      .set({ ...values, isActive: true })
      .where(eq(localUsers.id, existing.id))
      .returning();
    return updated;
  }

  const [created] = await seedDb
    .insert(localUsers)
    .values({ id: uuidv7(), ...values })
    .returning();
  return created;
}

function readSeedPin(environmentKey: string): string {
  const value = process.env[environmentKey];
  if (!value) {
    throw new Error(
      `${environmentKey} is required. Run pnpm dev:env:sync or set it explicitly.`,
    );
  }
  if (!/^\d{4,8}$/.test(value)) {
    throw new Error(`${environmentKey} must contain between 4 and 8 digits.`);
  }
  return value;
}

async function upsertCategory(
  seedDb: PosDatabaseClient,
  values: { name: string; sortOrder: number },
): Promise<MenuCategory> {
  const existing = await seedDb.query.menuCategories.findFirst({
    where: eq(menuCategories.name, values.name),
  });

  if (existing) {
    const [updated] = await seedDb
      .update(menuCategories)
      .set({ sortOrder: values.sortOrder, isActive: true })
      .where(eq(menuCategories.id, existing.id))
      .returning();
    return updated;
  }

  const [created] = await seedDb
    .insert(menuCategories)
    .values({ id: uuidv7(), ...values })
    .returning();
  return created;
}

async function upsertMenuItem(
  seedDb: PosDatabaseClient,
  values: {
    categoryId: string;
    name: string;
    description: string | null;
    priceCents: number;
    kitchenStation: 'kitchen' | 'bar' | 'dessert' | 'none';
    isAvailable: boolean;
    sortOrder: number;
  },
): Promise<MenuItem> {
  const existing = await seedDb.query.menuItems.findFirst({
    where: eq(menuItems.name, values.name),
  });

  if (existing) {
    const [updated] = await seedDb
      .update(menuItems)
      .set(values)
      .where(eq(menuItems.id, existing.id))
      .returning();
    return updated;
  }

  const [created] = await seedDb
    .insert(menuItems)
    .values({ id: uuidv7(), ...values })
    .returning();
  return created;
}

async function upsertComboRule(
  seedDb: PosDatabaseClient,
  values: {
    name: string;
    pricingMode: 'fixed' | 'base_item_plus_delta';
    comboPriceCents: number;
    priceDeltaCents: number;
    basePricingGroupName: string | null;
    priority: number;
    maxApplications: number | null;
    isActive: boolean;
  },
): Promise<ComboRule> {
  const existing = await seedDb.query.comboRules.findFirst({
    where: eq(comboRules.name, values.name),
  });

  if (existing) {
    const [updated] = await seedDb
      .update(comboRules)
      .set(values)
      .where(eq(comboRules.id, existing.id))
      .returning();
    return updated;
  }

  const [created] = await seedDb
    .insert(comboRules)
    .values({ id: uuidv7(), ...values })
    .returning();
  return created;
}

async function upsertComboRuleGroup(
  seedDb: PosDatabaseClient,
  values: {
    comboRuleId: string;
    name: string;
    minQuantity: number;
    maxQuantity: number;
    sortOrder: number;
  },
): Promise<ComboRuleGroup> {
  const existing = await seedDb.query.comboRuleGroups.findFirst({
    where: and(
      eq(comboRuleGroups.comboRuleId, values.comboRuleId),
      eq(comboRuleGroups.name, values.name),
    ),
  });

  if (existing) {
    const [updated] = await seedDb
      .update(comboRuleGroups)
      .set(values)
      .where(eq(comboRuleGroups.id, existing.id))
      .returning();
    return updated;
  }

  const [created] = await seedDb
    .insert(comboRuleGroups)
    .values({ id: uuidv7(), ...values })
    .returning();
  return created;
}

async function upsertComboRuleGroupItem(
  seedDb: PosDatabaseClient,
  values: {
    comboRuleGroupId: string;
    menuItemId: string;
    extraPriceCents: number;
  },
): Promise<void> {
  const existing = await seedDb.query.comboRuleGroupItems.findFirst({
    where: and(
      eq(comboRuleGroupItems.comboRuleGroupId, values.comboRuleGroupId),
      eq(comboRuleGroupItems.menuItemId, values.menuItemId),
    ),
  });

  if (existing) {
    await seedDb
      .update(comboRuleGroupItems)
      .set({ extraPriceCents: values.extraPriceCents })
      .where(eq(comboRuleGroupItems.id, existing.id));
    return;
  }

  await seedDb.insert(comboRuleGroupItems).values({ id: uuidv7(), ...values });
}

const isDirectRun =
  process.argv[1] !== undefined &&
  fileURLToPath(import.meta.url) === resolve(process.argv[1]);

if (isDirectRun) {
  seedPosData()
    .then(() => {
      console.log('YuTa local POS seed data completed.');
      process.exit(0);
    })
    .catch((error: unknown) => {
      console.error(error);
      process.exit(1);
    });
}
