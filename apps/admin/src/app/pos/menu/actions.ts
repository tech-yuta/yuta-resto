'use server';

import { db } from '@yuta/db/client';
import { menuCategories, menuItems } from '@yuta/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const kitchenStationSchema = z.enum(['kitchen', 'bar', 'dessert', 'none']);

const createCategorySchema = z.object({
  name: z.string().trim().min(1).max(255),
  sortOrder: z.coerce.number().int().default(0),
});

const createMenuItemSchema = z.object({
  categoryId: z.string().uuid(),
  name: z.string().trim().min(1).max(255),
  description: z.string().trim().optional(),
  priceCents: z.coerce.number().int().nonnegative(),
  kitchenStation: kitchenStationSchema,
  sortOrder: z.coerce.number().int().default(0),
});

const updateMenuItemSchema = createMenuItemSchema.extend({
  itemId: z.string().uuid(),
});

const toggleMenuItemSchema = z.object({
  itemId: z.string().uuid(),
  isAvailable: z.enum(['true', 'false']).transform((value: 'true' | 'false') => value === 'true'),
});

export async function createCategoryAction(formData: FormData): Promise<void> {
  const values = createCategorySchema.parse({
    name: formData.get('name'),
    sortOrder: formData.get('sortOrder'),
  });

  await db.insert(menuCategories).values({
    name: values.name,
    sortOrder: values.sortOrder,
  });

  revalidatePath('/pos/menu');
}

export async function createMenuItemAction(formData: FormData): Promise<void> {
  const values = createMenuItemSchema.parse({
    categoryId: formData.get('categoryId'),
    name: formData.get('name'),
    description: formData.get('description') || undefined,
    priceCents: formData.get('priceCents'),
    kitchenStation: formData.get('kitchenStation'),
    sortOrder: formData.get('sortOrder'),
  });

  await db.insert(menuItems).values(values);

  revalidatePath('/pos/menu');
}

export async function updateMenuItemAction(formData: FormData): Promise<void> {
  const values = updateMenuItemSchema.parse({
    itemId: formData.get('itemId'),
    categoryId: formData.get('categoryId'),
    name: formData.get('name'),
    description: formData.get('description') || undefined,
    priceCents: formData.get('priceCents'),
    kitchenStation: formData.get('kitchenStation'),
    sortOrder: formData.get('sortOrder'),
  });

  await db
    .update(menuItems)
    .set({
      categoryId: values.categoryId,
      name: values.name,
      description: values.description,
      priceCents: values.priceCents,
      kitchenStation: values.kitchenStation,
      sortOrder: values.sortOrder,
    })
    .where(eq(menuItems.id, values.itemId));

  revalidatePath('/pos/menu');
}

export async function toggleMenuItemAvailabilityAction(formData: FormData): Promise<void> {
  const values = toggleMenuItemSchema.parse({
    itemId: formData.get('itemId'),
    isAvailable: formData.get('isAvailable'),
  });

  await db.update(menuItems).set({ isAvailable: values.isAvailable }).where(eq(menuItems.id, values.itemId));

  revalidatePath('/pos/menu');
}
