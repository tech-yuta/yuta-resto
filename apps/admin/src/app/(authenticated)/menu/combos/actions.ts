'use server';

import { db } from '@yuta/db/client';
import { comboRuleGroupItems, comboRuleGroups, comboRules } from '@yuta/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const createComboRuleSchema = z.object({
  name: z.string().trim().min(1).max(255),
  comboPriceCents: z.coerce.number().int().nonnegative(),
  priority: z.coerce.number().int().default(0),
  maxApplications: z.coerce.number().int().positive().optional(),
});

const updateComboRuleSchema = createComboRuleSchema.extend({
  comboRuleId: z.string().uuid(),
  isActive: z.enum(['true', 'false']).transform((value: 'true' | 'false') => value === 'true'),
});

const createComboRuleGroupSchema = z.object({
  comboRuleId: z.string().uuid(),
  name: z.string().trim().min(1).max(255),
  minQuantity: z.coerce.number().int().positive().default(1),
  maxQuantity: z.coerce.number().int().positive().default(1),
  sortOrder: z.coerce.number().int().default(0),
});

const addComboGroupItemSchema = z.object({
  comboRuleGroupId: z.string().uuid(),
  menuItemId: z.string().uuid(),
  extraPriceCents: z.coerce.number().int().nonnegative().default(0),
});

export async function createComboRuleAction(formData: FormData): Promise<void> {
  const values = createComboRuleSchema.parse({
    name: formData.get('name'),
    comboPriceCents: formData.get('comboPriceCents'),
    priority: formData.get('priority'),
    maxApplications: formData.get('maxApplications') || undefined,
  });

  await db.insert(comboRules).values(values);

  revalidatePath('/menu/combos');
}

export async function updateComboRuleAction(formData: FormData): Promise<void> {
  const values = updateComboRuleSchema.parse({
    comboRuleId: formData.get('comboRuleId'),
    name: formData.get('name'),
    comboPriceCents: formData.get('comboPriceCents'),
    priority: formData.get('priority'),
    maxApplications: formData.get('maxApplications') || undefined,
    isActive: formData.get('isActive'),
  });

  await db
    .update(comboRules)
    .set({
      name: values.name,
      comboPriceCents: values.comboPriceCents,
      priority: values.priority,
      maxApplications: values.maxApplications,
      isActive: values.isActive,
    })
    .where(eq(comboRules.id, values.comboRuleId));

  revalidatePath('/menu/combos');
}

export async function createComboRuleGroupAction(formData: FormData): Promise<void> {
  const values = createComboRuleGroupSchema.parse({
    comboRuleId: formData.get('comboRuleId'),
    name: formData.get('name'),
    minQuantity: formData.get('minQuantity'),
    maxQuantity: formData.get('maxQuantity'),
    sortOrder: formData.get('sortOrder'),
  });

  await db.insert(comboRuleGroups).values(values);

  revalidatePath('/menu/combos');
}

export async function addComboGroupItemAction(formData: FormData): Promise<void> {
  const values = addComboGroupItemSchema.parse({
    comboRuleGroupId: formData.get('comboRuleGroupId'),
    menuItemId: formData.get('menuItemId'),
    extraPriceCents: formData.get('extraPriceCents'),
  });

  await db.insert(comboRuleGroupItems).values(values);

  revalidatePath('/menu/combos');
}
