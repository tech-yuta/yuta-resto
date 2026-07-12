/**
 * Import menu LUNA từ luna-menu.json vào database.
 *
 * Chạy:
 *   pnpm --filter @yuta/db tsx src/import-luna-menu.ts
 *
 * Script dùng upsert (insert or update) theo name nên chạy nhiều lần vẫn an toàn.
 */
import { config } from 'dotenv';
import { eq, sql } from 'drizzle-orm';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { db } from './client';
import {
  checkDiscountItems,
  checkDiscounts,
  checkItems,
  checks,
  comboRuleGroupItems,
  comboRuleGroups,
  comboRules,
  menuCategories,
  menuItems,
  orderDiscountItems,
  orderDiscounts,
  orderItems,
  orders,
  payments,
  printJobs,
  type MenuCategory,
  type MenuItem,
} from './schema';

// ─── Clean ────────────────────────────────────────────────────────────────────

async function cleanMenuData() {
  console.log('🗑️   Nettoyage des données menu...');

  // Ordre strict selon les FK (leaf → root)
  await db.delete(printJobs);            console.log('  ✓ print_jobs');
  await db.delete(payments);             console.log('  ✓ payments');
  await db.delete(checkDiscountItems);   console.log('  ✓ check_discount_items');
  await db.delete(checkDiscounts);       console.log('  ✓ check_discounts');
  await db.delete(checkItems);           console.log('  ✓ check_items');
  await db.delete(checks);               console.log('  ✓ checks');
  await db.delete(orderDiscountItems);   console.log('  ✓ order_discount_items');
  await db.delete(orderDiscounts);       console.log('  ✓ order_discounts');
  await db.delete(orderItems);           console.log('  ✓ order_items');
  await db.delete(orders);               console.log('  ✓ orders');
  await db.delete(comboRuleGroupItems);  console.log('  ✓ combo_rule_group_items');
  await db.delete(comboRuleGroups);      console.log('  ✓ combo_rule_groups');
  await db.delete(comboRules);           console.log('  ✓ combo_rules');
  await db.delete(menuItems);            console.log('  ✓ menu_items');
  await db.delete(menuCategories);       console.log('  ✓ menu_categories');
  console.log();
}

config({ path: '.env.local' });
config({ path: '.env' });

// ─── Types JSON ───────────────────────────────────────────────────────────────

type JsonItem = {
  category: string;
  name: string;
  description: string | null;
  priceCents: number;
  kitchenStation: 'kitchen' | 'bar' | 'dessert' | 'none';
  isAvailable: boolean;
  sortOrder: number;
};

type JsonComboGroupItem = { name: string; extraPriceCents: number };

type JsonComboGroup = {
  name: string;
  minQuantity: number;
  maxQuantity: number;
  sortOrder: number;
  items: JsonComboGroupItem[];
};

type JsonCombo = {
  name: string;
  comboPriceCents: number;
  priority: number;
  groups: JsonComboGroup[];
};

type MenuJson = {
  categories: { name: string; sortOrder: number }[];
  items: JsonItem[];
  combos: JsonCombo[];
};

// ─── Upsert helpers ───────────────────────────────────────────────────────────

async function upsertCategory(values: { name: string; sortOrder: number }): Promise<MenuCategory> {
  const existing = await db.query.menuCategories.findFirst({
    where: eq(menuCategories.name, values.name),
  });
  if (existing) {
    const [updated] = await db
      .update(menuCategories)
      .set({ sortOrder: values.sortOrder, isActive: true })
      .where(eq(menuCategories.id, existing.id))
      .returning();
    return updated;
  }
  const [created] = await db.insert(menuCategories).values(values).returning();
  return created;
}

async function upsertMenuItem(values: {
  categoryId: string;
  name: string;
  description: string | null;
  priceCents: number;
  kitchenStation: 'kitchen' | 'bar' | 'dessert' | 'none';
  isAvailable: boolean;
  sortOrder: number;
}): Promise<MenuItem> {
  const existing = await db.query.menuItems.findFirst({
    where: eq(menuItems.name, values.name),
  });
  if (existing) {
    const [updated] = await db
      .update(menuItems)
      .set({
        categoryId: values.categoryId,
        description: values.description,
        priceCents: values.priceCents,
        kitchenStation: values.kitchenStation,
        isAvailable: values.isAvailable,
        sortOrder: values.sortOrder,
      })
      .where(eq(menuItems.id, existing.id))
      .returning();
    return updated;
  }
  const [created] = await db.insert(menuItems).values(values).returning();
  return created;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const clean = process.argv.includes('--clean');

  const __dirname = fileURLToPath(new URL('.', import.meta.url));
  const raw = readFileSync(resolve(__dirname, 'luna-menu.json'), 'utf8');
  const data = JSON.parse(raw) as MenuJson;

  console.log('📂  Import menu LUNA...\n');

  if (clean) {
    await cleanMenuData();
  } else {
    console.log('ℹ️   Mode upsert (pas de nettoyage). Utilisez --clean pour repartir de zéro.\n');
  }

  // 1. Catégories ──────────────────────────────────────────────────────────────
  console.log('── Catégories');
  const categoryMap: Record<string, MenuCategory> = {};
  for (const cat of data.categories) {
    const result = await upsertCategory(cat);
    categoryMap[cat.name] = result;
    console.log(`  ✓ ${cat.name}`);
  }

  // 2. Articles ────────────────────────────────────────────────────────────────
  console.log('\n── Articles');
  const itemMap: Record<string, MenuItem> = {};
  for (const item of data.items) {
    const category = categoryMap[item.category];
    if (!category) {
      console.warn(`  ⚠ Catégorie introuvable: "${item.category}" pour "${item.name}" — ignoré`);
      continue;
    }
    const result = await upsertMenuItem({
      categoryId: category.id,
      name: item.name,
      description: item.description,
      priceCents: item.priceCents,
      kitchenStation: item.kitchenStation,
      isAvailable: item.isAvailable,
      sortOrder: item.sortOrder,
    });
    itemMap[item.name] = result;
    console.log(`  ✓ ${item.name} (${(item.priceCents / 100).toFixed(2)} €)`);
  }

  // 3. Combos ──────────────────────────────────────────────────────────────────
  console.log('\n── Combos');
  for (const combo of data.combos) {
    // Upsert comboRule
    const existingRule = await db.query.comboRules.findFirst({
      where: eq(comboRules.name, combo.name),
    });
    let rule;
    if (existingRule) {
      const [updated] = await db
        .update(comboRules)
        .set({ comboPriceCents: combo.comboPriceCents, priority: combo.priority, isActive: true })
        .where(eq(comboRules.id, existingRule.id))
        .returning();
      rule = updated;
    } else {
      const [created] = await db
        .insert(comboRules)
        .values({ name: combo.name, comboPriceCents: combo.comboPriceCents, priority: combo.priority })
        .returning();
      rule = created;
    }
    console.log(`  ✓ ${combo.name} (${(combo.comboPriceCents / 100).toFixed(2)} €)`);

    // Groups + items
    for (const group of combo.groups) {
      const existingGroup = await db.query.comboRuleGroups.findFirst({
        where: eq(comboRuleGroups.name, group.name),
      });
      let ruleGroup;
      if (existingGroup) {
        const [updated] = await db
          .update(comboRuleGroups)
          .set({
            minQuantity: group.minQuantity,
            maxQuantity: group.maxQuantity,
            sortOrder: group.sortOrder,
          })
          .where(eq(comboRuleGroups.id, existingGroup.id))
          .returning();
        ruleGroup = updated;
      } else {
        const [created] = await db
          .insert(comboRuleGroups)
          .values({
            comboRuleId: rule.id,
            name: group.name,
            minQuantity: group.minQuantity,
            maxQuantity: group.maxQuantity,
            sortOrder: group.sortOrder,
          })
          .returning();
        ruleGroup = created;
      }

      for (const gi of group.items) {
        const menuItem = itemMap[gi.name];
        if (!menuItem) {
          console.warn(`    ⚠ Article introuvable: "${gi.name}" dans group "${group.name}" — ignoré`);
          continue;
        }
        const existingGI = await db.query.comboRuleGroupItems.findFirst({
          where: eq(comboRuleGroupItems.menuItemId, menuItem.id),
        });
        if (existingGI) {
          await db
            .update(comboRuleGroupItems)
            .set({ extraPriceCents: gi.extraPriceCents })
            .where(eq(comboRuleGroupItems.id, existingGI.id));
        } else {
          await db.insert(comboRuleGroupItems).values({
            comboRuleGroupId: ruleGroup.id,
            menuItemId: menuItem.id,
            extraPriceCents: gi.extraPriceCents,
          });
        }
        console.log(`      + ${gi.name}`);
      }
    }
  }

  console.log('\n✅  Import terminé.');
  console.log(`   ${data.categories.length} catégories`);
  console.log(`   ${data.items.length} articles`);
  console.log(`   ${data.combos.length} combos`);
}

main().catch((err) => {
  console.error('❌  Erreur import:', err);
  process.exit(1);
});
