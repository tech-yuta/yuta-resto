import {
  localCatalogCategoryResponseSchema,
  localCatalogItemResponseSchema,
  type CreateLocalCatalogCategoryInput,
  type CreateLocalCatalogItemInput,
  type UpdateLocalCatalogCategoryInput,
  type UpdateLocalCatalogItemInput,
} from '@yuta/contracts/local-pos';
import type { PosDatabaseClient } from '@yuta/db-pos/client';
import { menuCategories, menuItems } from '@yuta/db-pos/schema';
import { and, asc, eq, ne, sql } from 'drizzle-orm';
import { v7 as uuidv7 } from 'uuid';
import { HttpError } from '../http';

export function createCatalogManagementService(db: PosDatabaseClient) {
  async function createCatalogCategory(input: CreateLocalCatalogCategoryInput) {
    await assertCategoryNameAvailable(input.name);
    const [created] = await db
      .insert(menuCategories)
      .values({ id: uuidv7(), ...input })
      .returning();
    return localCatalogCategoryResponseSchema.parse({
      category: { ...toCategory(created), items: [] },
    });
  }

  async function updateCatalogCategory(
    categoryId: string,
    input: UpdateLocalCatalogCategoryInput,
  ) {
    await requireCategory(categoryId);
    if (input.name !== undefined) {
      await assertCategoryNameAvailable(input.name, categoryId);
    }
    const [updated] = await db
      .update(menuCategories)
      .set(input)
      .where(eq(menuCategories.id, categoryId))
      .returning();
    const items = await db
      .select()
      .from(menuItems)
      .where(eq(menuItems.categoryId, categoryId))
      .orderBy(asc(menuItems.sortOrder), asc(menuItems.name));
    return localCatalogCategoryResponseSchema.parse({
      category: {
        ...toCategory(updated),
        items: items.map(toItem),
      },
    });
  }

  async function createCatalogItem(input: CreateLocalCatalogItemInput) {
    await requireCategory(input.categoryId);
    await assertItemNameAvailable(input.categoryId, input.name);
    const [created] = await db
      .insert(menuItems)
      .values({ id: uuidv7(), ...input })
      .returning();
    return localCatalogItemResponseSchema.parse({ item: toItem(created) });
  }

  async function updateCatalogItem(
    itemId: string,
    input: UpdateLocalCatalogItemInput,
  ) {
    const current = await db.query.menuItems.findFirst({
      where: eq(menuItems.id, itemId),
    });
    if (!current) throw catalogItemNotFoundError();

    const categoryId = input.categoryId ?? current.categoryId;
    if (input.categoryId !== undefined) {
      await requireCategory(input.categoryId);
    }
    if (input.name !== undefined || input.categoryId !== undefined) {
      await assertItemNameAvailable(
        categoryId,
        input.name ?? current.name,
        itemId,
      );
    }
    const [updated] = await db
      .update(menuItems)
      .set(input)
      .where(eq(menuItems.id, itemId))
      .returning();
    return localCatalogItemResponseSchema.parse({ item: toItem(updated) });
  }

  async function requireCategory(categoryId: string) {
    const category = await db.query.menuCategories.findFirst({
      where: eq(menuCategories.id, categoryId),
    });
    if (!category) {
      throw new HttpError(
        404,
        'CATALOG_CATEGORY_NOT_FOUND',
        'The requested catalog category does not exist.',
      );
    }
    return category;
  }

  async function assertCategoryNameAvailable(
    name: string,
    excludedId?: string,
  ): Promise<void> {
    const existing = await db.query.menuCategories.findFirst({
      where: excludedId
        ? and(
            sql`lower(${menuCategories.name}) = lower(${name})`,
            ne(menuCategories.id, excludedId),
          )
        : sql`lower(${menuCategories.name}) = lower(${name})`,
    });
    if (existing) {
      throw new HttpError(
        409,
        'CATALOG_CATEGORY_NAME_CONFLICT',
        'A category with this name already exists.',
      );
    }
  }

  async function assertItemNameAvailable(
    categoryId: string,
    name: string,
    excludedId?: string,
  ): Promise<void> {
    const conditions = [
      eq(menuItems.categoryId, categoryId),
      sql`lower(${menuItems.name}) = lower(${name})`,
    ];
    if (excludedId) conditions.push(ne(menuItems.id, excludedId));
    const existing = await db.query.menuItems.findFirst({
      where: and(...conditions),
    });
    if (existing) {
      throw new HttpError(
        409,
        'CATALOG_ITEM_NAME_CONFLICT',
        'An item with this name already exists in the category.',
      );
    }
  }

  return {
    createCatalogCategory,
    updateCatalogCategory,
    createCatalogItem,
    updateCatalogItem,
  };
}

function catalogItemNotFoundError(): HttpError {
  return new HttpError(
    404,
    'CATALOG_ITEM_NOT_FOUND',
    'The requested catalog item does not exist.',
  );
}

function toCategory(category: typeof menuCategories.$inferSelect) {
  return {
    id: category.id,
    name: category.name,
    sortOrder: category.sortOrder,
    isActive: category.isActive,
  };
}

function toItem(item: typeof menuItems.$inferSelect) {
  return {
    id: item.id,
    categoryId: item.categoryId,
    name: item.name,
    description: item.description,
    priceCents: item.priceCents,
    kitchenStation: item.kitchenStation,
    isAvailable: item.isAvailable,
    sortOrder: item.sortOrder,
  };
}
