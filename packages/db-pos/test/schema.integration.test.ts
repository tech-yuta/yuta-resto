import { config } from 'dotenv';
import { eq } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { v7 as uuidv7, version as uuidVersion } from 'uuid';
import { createPosDatabaseClient, type PosDatabaseClient } from '../src/client';
import {
  localUsers,
  menuCategories,
  menuItems,
  orderItems,
  orders,
} from '../src/schema';

config({ path: '.env.test' });
config({ path: '.env.local' });

const integrationTest =
  process.env.POS_DATABASE_URL &&
  process.env.YUTA_ALLOW_DATABASE_INTEGRATION_TESTS === 'true'
    ? describe
    : describe.skip;

integrationTest('POS schema integration', () => {
  let db: PosDatabaseClient;
  const userId = uuidv7();
  const categoryId = uuidv7();
  const menuItemId = uuidv7();
  const orderId = uuidv7();
  const orderItemId = uuidv7();

  beforeAll(async () => {
    db = createPosDatabaseClient(process.env);
    await db.insert(localUsers).values({
      id: userId,
      name: 'POS Schema Tester',
      email: `pos-schema-${userId}@example.test`,
      role: 'admin',
    });
    await db.insert(menuCategories).values({
      id: categoryId,
      name: `Integration category ${categoryId}`,
    });
    await db.insert(menuItems).values({
      id: menuItemId,
      categoryId,
      name: `Integration item ${menuItemId}`,
      priceCents: 1000,
      kitchenStation: 'kitchen',
    });
    await db.insert(orders).values({
      id: orderId,
      orderNumber: `TEST-${orderId}`,
      tableLabel: 'Integration',
      orderType: 'dine_in',
      createdBy: userId,
    });
  });

  afterAll(async () => {
    if (!db) {
      return;
    }
    await db.delete(orderItems).where(eq(orderItems.id, orderItemId));
    await db.delete(orders).where(eq(orders.id, orderId));
    await db.delete(menuItems).where(eq(menuItems.id, menuItemId));
    await db.delete(menuCategories).where(eq(menuCategories.id, categoryId));
    await db.delete(localUsers).where(eq(localUsers.id, userId));
    await db.$client.end({ timeout: 5 });
  });

  it('stores an operational snapshot with application-generated UUIDv7 IDs', async () => {
    const [item] = await db
      .insert(orderItems)
      .values({
        id: orderItemId,
        orderId,
        menuItemId,
        itemNameSnapshot: 'Integration item snapshot',
        unitPriceCentsSnapshot: 1000,
        kitchenStationSnapshot: 'kitchen',
        quantity: 1,
      })
      .returning();

    expect(uuidVersion(item.id)).toBe(7);
    expect(item.itemNameSnapshot).toBe('Integration item snapshot');
    expect(item.orderId).toBe(orderId);
  });
});
