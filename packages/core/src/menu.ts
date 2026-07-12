import { eq } from 'drizzle-orm';
import { menuCategories, menuItems } from '@yuta/db/schema';
import type { DbClient } from '@yuta/db/client';
import { z } from 'zod';

const kitchenStationSchema = z.enum(['kitchen', 'bar', 'dessert', 'none']);

const createCategorySchema = z.object({
  name: z.string().trim().min(1).max(255),
  sortOrder: z.number().int().default(0),
});

const createMenuItemSchema = z.object({
  categoryId: z.string().uuid(),
  name: z.string().trim().min(1).max(255),
  description: z.string().trim().optional(),
  priceCents: z.number().int().nonnegative(),
  kitchenStation: kitchenStationSchema,
  sortOrder: z.number().int().default(0),
});

const updateMenuItemSchema = createMenuItemSchema.extend({
  itemId: z.string().uuid(),
});

const toggleMenuItemSchema = z.object({
  itemId: z.string().uuid(),
  isAvailable: z.boolean(),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type CreateMenuItemInput = z.infer<typeof createMenuItemSchema>;
export type UpdateMenuItemInput = z.infer<typeof updateMenuItemSchema>;
export type ToggleMenuItemInput = z.infer<typeof toggleMenuItemSchema>;

export class MenuServiceError extends Error {
  constructor(
    message: string,
    public readonly code: 'not_found' | 'invalid_input',
  ) {
    super(message);
    this.name = 'MenuServiceError';
  }
}

export function createMenuService(db: DbClient) {
  async function createCategory(
    input: CreateCategoryInput,
  ): Promise<typeof menuCategories.$inferSelect> {
    const values = createCategorySchema.parse(input);

    const [created] = await db
      .insert(menuCategories)
      .values({ name: values.name, sortOrder: values.sortOrder })
      .returning();

    return created;
  }

  async function createMenuItem(
    input: CreateMenuItemInput,
  ): Promise<typeof menuItems.$inferSelect> {
    const values = createMenuItemSchema.parse(input);

    const [created] = await db.insert(menuItems).values(values).returning();

    return created;
  }

  async function updateMenuItem(
    input: UpdateMenuItemInput,
  ): Promise<typeof menuItems.$inferSelect> {
    const values = updateMenuItemSchema.parse(input);
    const { itemId, ...fields } = values;

    const [updated] = await db
      .update(menuItems)
      .set({
        categoryId: fields.categoryId,
        name: fields.name,
        description: fields.description,
        priceCents: fields.priceCents,
        kitchenStation: fields.kitchenStation,
        sortOrder: fields.sortOrder,
      })
      .where(eq(menuItems.id, itemId))
      .returning();

    if (!updated) {
      throw new MenuServiceError('Menu item not found.', 'not_found');
    }

    return updated;
  }

  async function toggleMenuItemAvailability(
    input: ToggleMenuItemInput,
  ): Promise<typeof menuItems.$inferSelect> {
    const values = toggleMenuItemSchema.parse(input);

    const [updated] = await db
      .update(menuItems)
      .set({ isAvailable: values.isAvailable })
      .where(eq(menuItems.id, values.itemId))
      .returning();

    if (!updated) {
      throw new MenuServiceError('Menu item not found.', 'not_found');
    }

    return updated;
  }

  return {
    createCategory,
    createMenuItem,
    updateMenuItem,
    toggleMenuItemAvailability,
  };
}
