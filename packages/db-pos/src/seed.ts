import { and, eq } from 'drizzle-orm';
import { config } from 'dotenv';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { v7 as uuidv7 } from 'uuid';
import type { PosDatabaseClient } from './client';
import { hashLocalPin } from './local-auth-crypto';
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

const categorySeeds = [
  { name: 'Entrees', sortOrder: 10 },
  { name: 'Plats', sortOrder: 20 },
  { name: 'Boissons', sortOrder: 30 },
  { name: 'Desserts', sortOrder: 40 },
] as const;

const menuItemSeeds = [
  {
    name: 'Bun bo',
    category: 'Plats',
    priceCents: 1300,
    kitchenStation: 'kitchen',
    sortOrder: 10,
  },
  {
    name: 'Com ga',
    category: 'Plats',
    priceCents: 1200,
    kitchenStation: 'kitchen',
    sortOrder: 20,
  },
  {
    name: 'Pho',
    category: 'Plats',
    priceCents: 1400,
    kitchenStation: 'kitchen',
    sortOrder: 30,
  },
  {
    name: 'Coca',
    category: 'Boissons',
    priceCents: 300,
    kitchenStation: 'bar',
    sortOrder: 10,
  },
  {
    name: 'The glace maison',
    category: 'Boissons',
    priceCents: 400,
    kitchenStation: 'bar',
    sortOrder: 20,
  },
  {
    name: 'Che',
    category: 'Desserts',
    priceCents: 500,
    kitchenStation: 'dessert',
    sortOrder: 10,
  },
  {
    name: 'Mochi',
    category: 'Desserts',
    priceCents: 400,
    kitchenStation: 'dessert',
    sortOrder: 20,
  },
] as const;

const comboSeeds = [
  {
    name: 'Combo A',
    comboPriceCents: 1400,
    priority: 10,
    groups: [
      {
        name: 'Plat',
        minQuantity: 1,
        maxQuantity: 1,
        sortOrder: 10,
        items: [
          { name: 'Bun bo', extraPriceCents: 0 },
          { name: 'Com ga', extraPriceCents: 0 },
          { name: 'Pho', extraPriceCents: 100 },
        ],
      },
      {
        name: 'Boisson',
        minQuantity: 1,
        maxQuantity: 1,
        sortOrder: 20,
        items: [
          { name: 'Coca', extraPriceCents: 0 },
          { name: 'The glace maison', extraPriceCents: 100 },
        ],
      },
    ],
  },
  {
    name: 'Combo B',
    comboPriceCents: 1700,
    priority: 20,
    groups: [
      {
        name: 'Plat',
        minQuantity: 1,
        maxQuantity: 1,
        sortOrder: 10,
        items: [
          { name: 'Bun bo', extraPriceCents: 0 },
          { name: 'Com ga', extraPriceCents: 0 },
          { name: 'Pho', extraPriceCents: 100 },
        ],
      },
      {
        name: 'Boisson',
        minQuantity: 1,
        maxQuantity: 1,
        sortOrder: 20,
        items: [
          { name: 'Coca', extraPriceCents: 0 },
          { name: 'The glace maison', extraPriceCents: 100 },
        ],
      },
      {
        name: 'Dessert',
        minQuantity: 1,
        maxQuantity: 1,
        sortOrder: 30,
        items: [
          { name: 'Che', extraPriceCents: 0 },
          { name: 'Mochi', extraPriceCents: 0 },
        ],
      },
    ],
  },
] as const;

export async function seedPosData(
  seedDb?: PosDatabaseClient,
): Promise<PosSeedContext> {
  const activeDb =
    seedDb ?? (await import('./client')).createPosDatabaseClient(process.env);
  const [adminPinHash, staffPinHash, kitchenPinHash] = await Promise.all([
    hashLocalPin(readSeedPin('YUTA_POS_SEED_ADMIN_PIN', '1234')),
    hashLocalPin(readSeedPin('YUTA_POS_SEED_STAFF_PIN', '2345')),
    hashLocalPin(readSeedPin('YUTA_POS_SEED_KITCHEN_PIN', '3456')),
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
  for (const categorySeed of categorySeeds) {
    categories[categorySeed.name] = await upsertCategory(
      activeDb,
      categorySeed,
    );
  }

  const seededMenuItems: Record<string, MenuItem> = {};
  for (const itemSeed of menuItemSeeds) {
    seededMenuItems[itemSeed.name] = await upsertMenuItem(activeDb, {
      categoryId: categories[itemSeed.category].id,
      name: itemSeed.name,
      priceCents: itemSeed.priceCents,
      kitchenStation: itemSeed.kitchenStation,
      sortOrder: itemSeed.sortOrder,
    });
  }

  const seededComboRules: Record<string, ComboRule> = {};
  for (const comboSeed of comboSeeds) {
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

function readSeedPin(
  environmentKey: string,
  developmentFallback: string,
): string {
  const value = process.env[environmentKey] ?? developmentFallback;
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
    priceCents: number;
    kitchenStation: 'kitchen' | 'bar' | 'dessert' | 'none';
    sortOrder: number;
  },
): Promise<MenuItem> {
  const existing = await seedDb.query.menuItems.findFirst({
    where: eq(menuItems.name, values.name),
  });

  if (existing) {
    const [updated] = await seedDb
      .update(menuItems)
      .set({ ...values, isAvailable: true })
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
  values: { name: string; comboPriceCents: number; priority: number },
): Promise<ComboRule> {
  const existing = await seedDb.query.comboRules.findFirst({
    where: eq(comboRules.name, values.name),
  });

  if (existing) {
    const [updated] = await seedDb
      .update(comboRules)
      .set({ ...values, isActive: true })
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
