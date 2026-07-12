'use server';

import { createMenuService } from '@yuta/core';
import { db } from '@yuta/db/client';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const kitchenStationSchema = z.enum(['kitchen', 'bar', 'dessert', 'none']);

const createCategoryFormSchema = z.object({
  name: z.string().trim().min(1).max(255),
  sortOrder: z.coerce.number().int().default(0),
});

const createMenuItemFormSchema = z.object({
  categoryId: z.string().uuid(),
  name: z.string().trim().min(1).max(255),
  description: z.string().trim().optional(),
  priceCents: z.coerce.number().int().nonnegative(),
  kitchenStation: kitchenStationSchema,
  sortOrder: z.coerce.number().int().default(0),
});

const updateMenuItemFormSchema = createMenuItemFormSchema.extend({
  itemId: z.string().uuid(),
});

const toggleMenuItemFormSchema = z.object({
  itemId: z.string().uuid(),
  isAvailable: z.enum(['true', 'false']).transform((v): boolean => v === 'true'),
});

export async function createCategoryAction(formData: FormData): Promise<void> {
  const values = createCategoryFormSchema.parse({
    name: formData.get('name'),
    sortOrder: formData.get('sortOrder'),
  });
  const menuService = createMenuService(db);

  await menuService.createCategory(values);

  revalidatePath('/pos/menu');
}

export async function createMenuItemAction(formData: FormData): Promise<void> {
  const values = createMenuItemFormSchema.parse({
    categoryId: formData.get('categoryId'),
    name: formData.get('name'),
    description: formData.get('description') || undefined,
    priceCents: formData.get('priceCents'),
    kitchenStation: formData.get('kitchenStation'),
    sortOrder: formData.get('sortOrder'),
  });
  const menuService = createMenuService(db);

  await menuService.createMenuItem(values);

  revalidatePath('/pos/menu');
}

export async function updateMenuItemAction(formData: FormData): Promise<void> {
  const values = updateMenuItemFormSchema.parse({
    itemId: formData.get('itemId'),
    categoryId: formData.get('categoryId'),
    name: formData.get('name'),
    description: formData.get('description') || undefined,
    priceCents: formData.get('priceCents'),
    kitchenStation: formData.get('kitchenStation'),
    sortOrder: formData.get('sortOrder'),
  });
  const menuService = createMenuService(db);

  await menuService.updateMenuItem(values);

  revalidatePath('/pos/menu');
}

export async function toggleMenuItemAvailabilityAction(
  formData: FormData,
): Promise<void> {
  const values = toggleMenuItemFormSchema.parse({
    itemId: formData.get('itemId'),
    isAvailable: formData.get('isAvailable'),
  });
  const menuService = createMenuService(db);

  await menuService.toggleMenuItemAvailability({
    itemId: values.itemId,
    isAvailable: values.isAvailable,
  });

  revalidatePath('/pos/menu');
}
