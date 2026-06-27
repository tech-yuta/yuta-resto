import { config } from 'dotenv';
import { and, eq } from 'drizzle-orm';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { DbClient } from './client';
import {
  comboRuleGroupItems,
  comboRuleGroups,
  comboRules,
  menuCategories,
  menuItems,
  users,
  type ComboRule,
  type ComboRuleGroup,
  type MenuCategory,
  type MenuItem,
  type User,
} from './schema';

config({ path: '.env.local' });
config({ path: '.env' });

type SeedContext = {
  adminUser: User;
  staffUser: User;
  kitchenUser: User;
  categories: Record<string, MenuCategory>;
  menuItems: Record<string, MenuItem>;
  comboRules: Record<string, ComboRule>;
};

const categorySeeds = [
  { name: 'Entrees', sortOrder: 10 },
  { name: 'Plats', sortOrder: 20 },
  { name: 'Boissons', sortOrder: 30 },
  { name: 'Desserts', sortOrder: 40 },
];

const menuItemSeeds = [
  { name: 'Bun bo', category: 'Plats', priceCents: 1300, kitchenStation: 'kitchen', sortOrder: 10 },
  { name: 'Com ga', category: 'Plats', priceCents: 1200, kitchenStation: 'kitchen', sortOrder: 20 },
  { name: 'Pho', category: 'Plats', priceCents: 1400, kitchenStation: 'kitchen', sortOrder: 30 },
  { name: 'Coca', category: 'Boissons', priceCents: 300, kitchenStation: 'bar', sortOrder: 10 },
  {
    name: 'The glace maison',
    category: 'Boissons',
    priceCents: 400,
    kitchenStation: 'bar',
    sortOrder: 20,
  },
  { name: 'Che', category: 'Desserts', priceCents: 500, kitchenStation: 'dessert', sortOrder: 10 },
  { name: 'Mochi', category: 'Desserts', priceCents: 400, kitchenStation: 'dessert', sortOrder: 20 },
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
];

export async function seedPosData(seedDb?: DbClient): Promise<SeedContext> {
  const activeDb = seedDb ?? (await import('./client')).db;

  const adminUser = await upsertUser(activeDb, {
    name: 'YuTa Admin',
    email: 'admin@yuta.local',
    role: 'admin',
  });
  const staffUser = await upsertUser(activeDb, {
    name: 'YuTa Staff',
    email: 'staff@yuta.local',
    role: 'staff',
  });
  const kitchenUser = await upsertUser(activeDb, {
    name: 'YuTa Kitchen',
    email: 'kitchen@yuta.local',
    role: 'kitchen',
  });

  const categories: Record<string, MenuCategory> = {};
  for (const categorySeed of categorySeeds) {
    categories[categorySeed.name] = await upsertCategory(activeDb, categorySeed);
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

async function upsertUser(
  seedDb: DbClient,
  values: { name: string; email: string; role: 'admin' | 'staff' | 'kitchen' },
): Promise<User> {
  const existing = await seedDb.query.users.findFirst({
    where: eq(users.email, values.email),
  });

  if (existing) {
    const [updated] = await seedDb
      .update(users)
      .set({ name: values.name, role: values.role, isActive: true })
      .where(eq(users.id, existing.id))
      .returning();
    return updated;
  }

  const [created] = await seedDb.insert(users).values(values).returning();
  return created;
}

async function upsertCategory(
  seedDb: DbClient,
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

  const [created] = await seedDb.insert(menuCategories).values(values).returning();
  return created;
}

async function upsertMenuItem(
  seedDb: DbClient,
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
      .set({
        categoryId: values.categoryId,
        priceCents: values.priceCents,
        kitchenStation: values.kitchenStation,
        sortOrder: values.sortOrder,
        isAvailable: true,
      })
      .where(eq(menuItems.id, existing.id))
      .returning();
    return updated;
  }

  const [created] = await seedDb.insert(menuItems).values(values).returning();
  return created;
}

async function upsertComboRule(
  seedDb: DbClient,
  values: { name: string; comboPriceCents: number; priority: number },
): Promise<ComboRule> {
  const existing = await seedDb.query.comboRules.findFirst({
    where: eq(comboRules.name, values.name),
  });

  if (existing) {
    const [updated] = await seedDb
      .update(comboRules)
      .set({
        comboPriceCents: values.comboPriceCents,
        priority: values.priority,
        isActive: true,
      })
      .where(eq(comboRules.id, existing.id))
      .returning();
    return updated;
  }

  const [created] = await seedDb.insert(comboRules).values(values).returning();
  return created;
}

async function upsertComboRuleGroup(
  seedDb: DbClient,
  values: {
    comboRuleId: string;
    name: string;
    minQuantity: number;
    maxQuantity: number;
    sortOrder: number;
  },
): Promise<ComboRuleGroup> {
  const existing = await seedDb.query.comboRuleGroups.findFirst({
    where: and(eq(comboRuleGroups.comboRuleId, values.comboRuleId), eq(comboRuleGroups.name, values.name)),
  });

  if (existing) {
    const [updated] = await seedDb
      .update(comboRuleGroups)
      .set({
        minQuantity: values.minQuantity,
        maxQuantity: values.maxQuantity,
        sortOrder: values.sortOrder,
      })
      .where(eq(comboRuleGroups.id, existing.id))
      .returning();
    return updated;
  }

  const [created] = await seedDb.insert(comboRuleGroups).values(values).returning();
  return created;
}

async function upsertComboRuleGroupItem(
  seedDb: DbClient,
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

  await seedDb.insert(comboRuleGroupItems).values(values);
}

const isDirectRun =
  process.argv[1] !== undefined && fileURLToPath(import.meta.url) === resolve(process.argv[1]);

if (isDirectRun) {
  seedPosData()
    .then(() => {
      console.log('YuTa POS seed data completed.');
      process.exit(0);
    })
    .catch((error: unknown) => {
      console.error(error);
      process.exit(1);
    });
}
