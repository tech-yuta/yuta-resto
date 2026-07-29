import {
  localKitchenSendResponseSchema,
  localOrderDetailResponseSchema,
  localOrderItemResponseSchema,
  type AddLocalOrderItemInput,
  type LocalOrderCommand,
  type LocalOrderItemCommand,
  type UpdateLocalOrderItemInput,
} from '@yuta/contracts/local-pos';
import type { PosDatabaseExecutor } from '@yuta/db-pos/client';
import {
  checks,
  localUsers,
  menuItems,
  orderDiscountItems,
  orderDiscounts,
  orderItems,
  orders,
  payments,
  printJobs,
  type Order,
  type OrderItem,
} from '@yuta/db-pos/schema';
import { and, asc, eq, inArray, ne, sql } from 'drizzle-orm';
import { v7 as uuidv7 } from 'uuid';
import { HttpError } from '../http';
import {
  buildInstructionSnapshots,
  buildVariantSnapshots,
} from './instruction-snapshots';
import { toOrderSummary } from './site-agent-service';

const knownAllergenCodes = new Set([
  'PEANUTS',
  'GLUTEN',
  'SOY',
  'CRUSTACEANS',
  'EGGS',
  'MILK',
  'SESAME',
  'FISH',
  'OTHER',
]);

export function createOrderCommandService(db: PosDatabaseExecutor) {
  async function getOrderDetail(orderId: string) {
    const order = await getRequiredOrder(db, orderId);
    return localOrderDetailResponseSchema.parse(
      await loadOrderDetail(db, order),
    );
  }

  async function addOrderItem(orderId: string, input: AddLocalOrderItemInput) {
    const order = await getRequiredOrder(db, orderId);
    await assertOrderCanChangeItems(db, order);
    const menuItem = await db.query.menuItems.findFirst({
      where: eq(menuItems.id, input.menuItemId),
    });
    if (!menuItem) {
      throw new HttpError(404, 'MENU_ITEM_NOT_FOUND', 'Menu item not found.');
    }
    if (!menuItem.isAvailable) {
      throw new HttpError(
        422,
        'MENU_ITEM_UNAVAILABLE',
        'Menu item is not available.',
      );
    }

    const existing = await db.query.orderItems.findFirst({
      where: and(
        eq(orderItems.orderId, orderId),
        eq(orderItems.menuItemId, menuItem.id),
        eq(orderItems.status, 'pending'),
        sql`${orderItems.note} is null`,
      ),
    });
    let item: OrderItem;
    if (existing && !input.note) {
      [item] = await db
        .update(orderItems)
        .set({ quantity: existing.quantity + input.quantity })
        .where(eq(orderItems.id, existing.id))
        .returning();
    } else {
      [item] = await db
        .insert(orderItems)
        .values({
          id: uuidv7(),
          orderId,
          menuItemId: menuItem.id,
          itemNameSnapshot: menuItem.name,
          unitPriceCentsSnapshot: menuItem.priceCents,
          kitchenStationSnapshot: menuItem.kitchenStation,
          quantity: input.quantity,
          note: input.note,
        })
        .returning();
    }

    await recalculateOrder(db, orderId);
    return localOrderItemResponseSchema.parse({ item: toOrderItem(item) });
  }

  async function updateOrderItem(
    orderItemId: string,
    input: UpdateLocalOrderItemInput,
  ) {
    const item = await getRequiredOrderItem(db, orderItemId);
    const order = await getRequiredOrder(db, item.orderId);
    await assertOrderCanChangeItems(db, order);
    if (item.status !== 'pending') {
      throw new HttpError(
        409,
        'INVALID_ITEM_STATUS',
        'Only pending order items can be edited.',
      );
    }

    const quantity = input.quantity ?? item.quantity;
    const requestedAllergens = input.allergenCodes ?? item.allergenCodes;
    if (requestedAllergens.some((code) => !knownAllergenCodes.has(code))) {
      throw new HttpError(422, 'UNKNOWN_ALLERGEN', 'Unknown allergen.');
    }
    const hasAllergy = input.hasAllergy ?? item.hasAllergy;
    const allergySeverity = hasAllergy
      ? (input.allergySeverity ?? item.allergySeverity)
      : null;
    const allergyNote = hasAllergy
      ? (input.allergyNote ?? item.allergyNote)
      : null;
    const allergenCodes = hasAllergy ? requestedAllergens : [];
    if (hasAllergy && allergenCodes.length === 0) {
      throw new HttpError(
        422,
        'ALLERGEN_REQUIRED',
        'At least one allergen is required.',
      );
    }
    if (hasAllergy && !allergySeverity) {
      throw new HttpError(
        422,
        'ALLERGY_SEVERITY_REQUIRED',
        'Allergy severity is required.',
      );
    }
    if (hasAllergy && allergenCodes.includes('OTHER') && !allergyNote) {
      throw new HttpError(
        422,
        'ALLERGY_DETAIL_REQUIRED',
        'Allergy details are required for Other.',
      );
    }

    const quickInstructions = input.selectedInstructionCodes
      ? buildInstructionSnapshots(input.selectedInstructionCodes)
      : item.quickInstructions;
    const selectedVariants = input.selectedVariants
      ? buildVariantSnapshots(
          item.itemNameSnapshot,
          quantity,
          input.selectedVariants,
        )
      : item.selectedVariants;
    const allergyChanged =
      hasAllergy !== item.hasAllergy ||
      allergySeverity !== item.allergySeverity ||
      allergyNote !== item.allergyNote ||
      JSON.stringify(allergenCodes) !== JSON.stringify(item.allergenCodes);
    const [updated] = await db
      .update(orderItems)
      .set({
        quantity,
        note: input.note === undefined ? item.note : input.note,
        quickInstructions,
        selectedVariants,
        hasAllergy,
        allergenCodes,
        allergySeverity,
        allergyNote,
        allergyAcknowledgedAt: allergyChanged
          ? null
          : item.allergyAcknowledgedAt,
        allergyAcknowledgedBy: allergyChanged
          ? null
          : item.allergyAcknowledgedBy,
        allergyKitchenConfirmedAt: allergyChanged
          ? null
          : item.allergyKitchenConfirmedAt,
        allergyKitchenConfirmedBy: allergyChanged
          ? null
          : item.allergyKitchenConfirmedBy,
      })
      .where(eq(orderItems.id, item.id))
      .returning();

    await recalculateOrder(db, item.orderId);
    return localOrderItemResponseSchema.parse({ item: toOrderItem(updated) });
  }

  async function executeOrderItemCommand(
    orderItemId: string,
    command: LocalOrderItemCommand,
  ) {
    if (command.action === 'confirm_allergy') {
      await requireActiveLocalUser(db, command.staffUserId);
    }

    const item = await getRequiredOrderItem(db, orderItemId);
    const order = await getRequiredOrder(db, item.orderId);
    if (order.status === 'cancelled') {
      throw new HttpError(
        409,
        'ORDER_CANCELLED',
        'Cancelled orders cannot be changed.',
      );
    }

    let updated: OrderItem;
    if (command.action === 'remove_pending') {
      await assertOrderCanChangeItems(db, order);
      if (item.status !== 'pending') {
        throw new HttpError(
          409,
          'INVALID_ITEM_STATUS',
          'Only pending items can be removed.',
        );
      }
      [updated] = await cancelItem(db, item, 'Removed before kitchen send');
    } else if (command.action === 'cancel') {
      await assertOrderCanChangeItems(db, order);
      if (item.status === 'cancelled') {
        updated = item;
      } else {
        [updated] = await cancelItem(db, item, command.reason);
      }
    } else if (command.action === 'restore') {
      await assertOrderCanChangeItems(db, order);
      if (item.status !== 'cancelled') {
        updated = item;
      } else {
        [updated] = await db
          .update(orderItems)
          .set({
            status: item.sentAt ? 'sent' : 'pending',
            cancelledAt: null,
            cancelledReason: null,
          })
          .where(eq(orderItems.id, item.id))
          .returning();
      }
    } else if (command.action === 'confirm_allergy') {
      if (!item.hasAllergy) {
        throw new HttpError(
          422,
          'NO_ALLERGY_WARNING',
          'This item has no allergy warning.',
        );
      }
      if (!['sent', 'preparing', 'ready'].includes(item.status)) {
        throw new HttpError(
          409,
          'INVALID_ITEM_STATUS',
          'Only kitchen items can have their allergy confirmed.',
        );
      }
      [updated] = await db
        .update(orderItems)
        .set({
          allergyKitchenConfirmedAt: new Date(),
          allergyKitchenConfirmedBy: command.staffUserId,
        })
        .where(eq(orderItems.id, item.id))
        .returning();
    } else {
      const target =
        command.action === 'mark_sent'
          ? 'sent'
          : command.action === 'mark_preparing'
            ? 'preparing'
            : 'ready';
      const allowed =
        target === 'sent'
          ? ['preparing', 'ready']
          : target === 'preparing'
            ? ['sent', 'ready']
            : ['sent', 'preparing'];
      if (!allowed.includes(item.status)) {
        throw new HttpError(
          409,
          'INVALID_ITEM_STATUS',
          `Cannot mark item ${target} from status ${item.status}.`,
        );
      }
      if (
        target === 'ready' &&
        item.hasAllergy &&
        !item.allergyKitchenConfirmedAt
      ) {
        throw new HttpError(
          409,
          'ALLERGY_CONFIRMATION_REQUIRED',
          'Kitchen must confirm the allergy before marking the item ready.',
        );
      }
      [updated] = await db
        .update(orderItems)
        .set({
          status: target,
          ...(target === 'ready' ? { readyAt: new Date() } : {}),
          ...(target === 'sent' || target === 'preparing'
            ? { readyAt: null, servedAt: null }
            : {}),
        })
        .where(eq(orderItems.id, item.id))
        .returning();
    }

    await recalculateOrder(db, item.orderId);
    await refreshOrderStatus(db, item.orderId);
    return localOrderItemResponseSchema.parse({ item: toOrderItem(updated) });
  }

  async function executeOrderCommand(
    orderId: string,
    command: LocalOrderCommand,
  ) {
    return db.transaction(async (tx) => {
      await tx.execute(
        sql`select ${orders.id} from ${orders} where ${orders.id} = ${orderId} for update`,
      );
      if (command.action === 'cancel') {
        return cancelOrder(tx, orderId, command.reason);
      }
      return sendToKitchen(tx, orderId, command);
    });
  }

  return {
    getOrderDetail,
    addOrderItem,
    updateOrderItem,
    executeOrderItemCommand,
    executeOrderCommand,
  };
}

async function cancelOrder(
  db: PosDatabaseExecutor,
  orderId: string,
  reason?: string,
) {
  const order = await getRequiredOrder(db, orderId);
  if (order.status === 'cancelled') {
    return localOrderDetailResponseSchema.parse({
      ...(await loadOrderDetail(db, order)),
    });
  }
  if (order.status === 'paid') {
    throw new HttpError(409, 'ORDER_PAID', 'Paid orders cannot be cancelled.');
  }
  const paidPayment = await db.query.payments.findFirst({
    where: and(eq(payments.orderId, orderId), eq(payments.status, 'paid')),
  });
  if (paidPayment) {
    throw new HttpError(
      409,
      'ORDER_HAS_PAYMENT',
      'Orders with paid payments cannot be cancelled.',
    );
  }

  const now = new Date();
  await db
    .update(orderItems)
    .set({ status: 'cancelled', cancelledAt: now, cancelledReason: reason })
    .where(
      and(eq(orderItems.orderId, orderId), ne(orderItems.status, 'cancelled')),
    );
  await db
    .update(checks)
    .set({ status: 'void' })
    .where(and(eq(checks.orderId, orderId), ne(checks.status, 'paid')));
  const [cancelled] = await db
    .update(orders)
    .set({
      status: 'cancelled',
      cancelledAt: now,
      cancelledReason: reason,
      paymentMode: 'single',
    })
    .where(eq(orders.id, orderId))
    .returning();

  return localOrderDetailResponseSchema.parse(
    await loadOrderDetail(db, cancelled),
  );
}

async function sendToKitchen(
  db: PosDatabaseExecutor,
  orderId: string,
  command: Extract<LocalOrderCommand, { action: 'send_to_kitchen' }>,
) {
  await requireActiveLocalUser(db, command.staffUserId);
  const existingJob = await db.query.printJobs.findFirst({
    where: eq(printJobs.idempotencyKey, command.idempotencyKey),
  });
  if (existingJob) {
    if (
      existingJob.orderId !== orderId ||
      existingJob.jobType !== 'kitchen_ticket'
    ) {
      throw new HttpError(
        409,
        'IDEMPOTENCY_CONFLICT',
        'Idempotency key is already used by another command.',
      );
    }
    const detail = await loadOrderDetail(
      db,
      await getRequiredOrder(db, orderId),
    );
    return localKitchenSendResponseSchema.parse({
      ...detail,
      printJob: toPrintJob(existingJob),
      replayed: true,
    });
  }
  const paymentWithKey = await db.query.payments.findFirst({
    where: eq(payments.idempotencyKey, command.idempotencyKey),
  });
  if (paymentWithKey) {
    throw new HttpError(
      409,
      'IDEMPOTENCY_CONFLICT',
      'Idempotency key is already used by a payment.',
    );
  }

  const order = await getRequiredOrder(db, orderId);
  if (order.status === 'paid' || order.status === 'cancelled') {
    throw new HttpError(
      409,
      'INVALID_ORDER_STATUS',
      'Paid or cancelled orders cannot be sent to kitchen.',
    );
  }
  const pendingItems = await db
    .select()
    .from(orderItems)
    .where(
      and(eq(orderItems.orderId, orderId), eq(orderItems.status, 'pending')),
    );
  if (pendingItems.length === 0) {
    throw new HttpError(
      409,
      'EMPTY_KITCHEN_SEND',
      'Order has no pending items to send.',
    );
  }
  const incompleteMochi = pendingItems.find(
    (item) =>
      item.itemNameSnapshot === 'Mochi glace (2 pcs)' &&
      item.selectedVariants.reduce(
        (sum, variant) => sum + variant.quantity,
        0,
      ) !==
        item.quantity * 2,
  );
  if (incompleteMochi) {
    throw new HttpError(
      422,
      'INVALID_VARIANT_QUANTITY',
      `Select exactly ${incompleteMochi.quantity * 2} Mochi flavours before sending.`,
    );
  }

  const allergyItems = pendingItems.filter(
    (item) => item.hasAllergy && !item.allergyAcknowledgedAt,
  );
  if (allergyItems.length > 0 && !command.allergyAcknowledged) {
    throw new HttpError(
      409,
      'ALLERGY_ACKNOWLEDGEMENT_REQUIRED',
      'Every pending item allergy must be acknowledged before sending.',
    );
  }
  const now = new Date();
  if (allergyItems.length > 0) {
    await db
      .update(orderItems)
      .set({
        allergyAcknowledgedAt: now,
        allergyAcknowledgedBy: command.staffUserId,
      })
      .where(
        inArray(
          orderItems.id,
          allergyItems.map((item) => item.id),
        ),
      );
  }
  await db
    .update(orderItems)
    .set({ status: 'sent', sentAt: now })
    .where(
      and(eq(orderItems.orderId, orderId), eq(orderItems.status, 'pending')),
    );
  const [sentOrder] = await db
    .update(orders)
    .set({
      status: 'sent',
      sentAt: order.sentAt ?? now,
      ...(allergyItems.length > 0
        ? {
            hasAllergy: true,
            allergyAcknowledgedAt: now,
            allergyAcknowledgedBy: command.staffUserId,
          }
        : {}),
    })
    .where(eq(orders.id, orderId))
    .returning();

  const sentItems = pendingItems.map((item) => ({
    ...item,
    status: 'sent' as const,
    sentAt: now,
    allergyAcknowledgedAt:
      item.hasAllergy && !item.allergyAcknowledgedAt
        ? now
        : item.allergyAcknowledgedAt,
  }));
  const [printJob] = await db
    .insert(printJobs)
    .values({
      id: uuidv7(),
      orderId,
      source: 'pos',
      printerName: 'mock-kitchen',
      jobType: 'kitchen_ticket',
      payload: buildKitchenPayload(sentOrder, sentItems),
      idempotencyKey: command.idempotencyKey,
    })
    .returning();
  const detail = await loadOrderDetail(db, sentOrder);

  return localKitchenSendResponseSchema.parse({
    ...detail,
    printJob: toPrintJob(printJob),
    replayed: false,
  });
}

async function getRequiredOrder(
  db: PosDatabaseExecutor,
  orderId: string,
): Promise<Order> {
  const order = await db.query.orders.findFirst({
    where: eq(orders.id, orderId),
  });
  if (!order) {
    throw new HttpError(404, 'ORDER_NOT_FOUND', 'Order not found.');
  }
  return order;
}

async function getRequiredOrderItem(
  db: PosDatabaseExecutor,
  orderItemId: string,
): Promise<OrderItem> {
  const item = await db.query.orderItems.findFirst({
    where: eq(orderItems.id, orderItemId),
  });
  if (!item) {
    throw new HttpError(404, 'ORDER_ITEM_NOT_FOUND', 'Order item not found.');
  }
  return item;
}

async function requireActiveLocalUser(
  db: PosDatabaseExecutor,
  userId: string,
): Promise<void> {
  const user = await db.query.localUsers.findFirst({
    where: eq(localUsers.id, userId),
  });
  if (!user?.isActive) {
    throw new HttpError(
      422,
      'STAFF_USER_UNAVAILABLE',
      'The selected local user is not available.',
    );
  }
}

async function assertOrderCanChangeItems(
  db: PosDatabaseExecutor,
  order: Order,
): Promise<void> {
  if (order.status === 'paid' || order.status === 'cancelled') {
    throw new HttpError(
      409,
      'INVALID_ORDER_STATUS',
      'Paid or cancelled orders cannot be changed.',
    );
  }
  if (order.paymentMode !== 'single') {
    throw new HttpError(
      409,
      'ACTIVE_PAYMENT_SPLIT',
      'Orders with an active payment split cannot be changed.',
    );
  }
  const paidPayment = await db.query.payments.findFirst({
    where: and(eq(payments.orderId, order.id), eq(payments.status, 'paid')),
  });
  if (paidPayment) {
    throw new HttpError(
      409,
      'ORDER_HAS_PAYMENT',
      'Orders with a recorded payment cannot be changed.',
    );
  }
}

async function cancelItem(
  db: PosDatabaseExecutor,
  item: OrderItem,
  reason?: string,
) {
  return db
    .update(orderItems)
    .set({
      status: 'cancelled',
      cancelledAt: new Date(),
      cancelledReason: reason,
    })
    .where(eq(orderItems.id, item.id))
    .returning();
}

async function recalculateOrder(
  db: PosDatabaseExecutor,
  orderId: string,
): Promise<void> {
  const activeItems = await db
    .select()
    .from(orderItems)
    .where(
      and(eq(orderItems.orderId, orderId), ne(orderItems.status, 'cancelled')),
    );
  const subtotalCents = activeItems.reduce(
    (sum, item) => sum + item.unitPriceCentsSnapshot * item.quantity,
    0,
  );
  const order = await getRequiredOrder(db, orderId);
  await db
    .update(orders)
    .set({
      subtotalCents,
      totalCents: Math.max(0, subtotalCents - order.discountCents),
      hasAllergy: activeItems.some((item) => item.hasAllergy),
    })
    .where(eq(orders.id, orderId));
}

async function refreshOrderStatus(
  db: PosDatabaseExecutor,
  orderId: string,
): Promise<void> {
  const order = await getRequiredOrder(db, orderId);
  if (order.status === 'paid' || order.status === 'cancelled') {
    return;
  }
  const items = await db
    .select()
    .from(orderItems)
    .where(
      and(eq(orderItems.orderId, orderId), ne(orderItems.status, 'cancelled')),
    );
  const status =
    items.length === 0
      ? 'draft'
      : items.every((item) => item.status === 'served')
        ? 'served'
        : items.every(
              (item) => item.status === 'ready' || item.status === 'served',
            )
          ? 'ready'
          : items.some((item) => item.status === 'preparing')
            ? 'preparing'
            : items.some((item) => item.status === 'sent')
              ? 'sent'
              : 'draft';
  await db.update(orders).set({ status }).where(eq(orders.id, orderId));
}

async function loadOrderDetail(db: PosDatabaseExecutor, order: Order) {
  const [items, discountRows] = await Promise.all([
    db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, order.id))
      .orderBy(asc(orderItems.createdAt), asc(orderItems.id)),
    db
      .select()
      .from(orderDiscounts)
      .where(eq(orderDiscounts.orderId, order.id))
      .orderBy(asc(orderDiscounts.createdAt), asc(orderDiscounts.id)),
  ]);
  const discountItemRows =
    discountRows.length === 0
      ? []
      : await db
          .select({
            orderDiscountId: orderDiscountItems.orderDiscountId,
            quantityApplied: orderDiscountItems.quantityApplied,
            orderItemId: orderItems.id,
            itemNameSnapshot: orderItems.itemNameSnapshot,
          })
          .from(orderDiscountItems)
          .innerJoin(
            orderItems,
            eq(orderDiscountItems.orderItemId, orderItems.id),
          )
          .where(
            inArray(
              orderDiscountItems.orderDiscountId,
              discountRows.map((discount) => discount.id),
            ),
          );
  return {
    order: toOrderSummary(order),
    items: items.map(toOrderItem),
    discounts: discountRows.map((discount) => ({
      id: discount.id,
      nameSnapshot: discount.nameSnapshot,
      discountCents: discount.discountCents,
      items: discountItemRows
        .filter((item) => item.orderDiscountId === discount.id)
        .map((item) => ({
          quantityApplied: item.quantityApplied,
          orderItem: {
            id: item.orderItemId,
            itemNameSnapshot: item.itemNameSnapshot,
          },
        })),
    })),
  };
}

function toOrderItem(item: OrderItem) {
  return {
    id: item.id,
    orderId: item.orderId,
    menuItemId: item.menuItemId,
    itemNameSnapshot: item.itemNameSnapshot,
    unitPriceCentsSnapshot: item.unitPriceCentsSnapshot,
    kitchenStationSnapshot: item.kitchenStationSnapshot,
    quantity: item.quantity,
    note: item.note,
    quickInstructions: item.quickInstructions,
    selectedVariants: item.selectedVariants,
    hasAllergy: item.hasAllergy,
    allergenCodes: item.allergenCodes,
    allergySeverity: item.allergySeverity,
    allergyNote: item.allergyNote,
    allergyAcknowledgedAt: item.allergyAcknowledgedAt?.toISOString() ?? null,
    allergyKitchenConfirmedAt:
      item.allergyKitchenConfirmedAt?.toISOString() ?? null,
    status: item.status,
    sentAt: item.sentAt?.toISOString() ?? null,
    readyAt: item.readyAt?.toISOString() ?? null,
    servedAt: item.servedAt?.toISOString() ?? null,
    cancelledAt: item.cancelledAt?.toISOString() ?? null,
    cancelledReason: item.cancelledReason,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
}

function toPrintJob(job: typeof printJobs.$inferSelect) {
  return {
    id: job.id,
    orderId: job.orderId,
    checkId: job.checkId,
    paymentId: job.paymentId,
    type: job.jobType,
    source: job.source,
    status: job.status,
    printerName: job.printerName,
    summary: {
      orderNumber:
        typeof job.payload.orderNumber === 'string'
          ? job.payload.orderNumber
          : null,
      tableLabel:
        typeof job.payload.tableLabel === 'string'
          ? job.payload.tableLabel
          : null,
      itemCount: Array.isArray(job.payload.items)
        ? job.payload.items.length
        : 0,
    },
    errorMessage: job.errorMessage,
    createdAt: job.createdAt.toISOString(),
    printedAt: job.printedAt?.toISOString() ?? null,
  };
}

function buildKitchenPayload(order: Order, items: OrderItem[]) {
  return {
    orderId: order.id,
    orderNumber: order.orderNumber,
    tableLabel: order.tableLabel,
    orderType: order.orderType,
    orderNote: order.note,
    hasAllergy: items.some((item) => item.hasAllergy),
    allergyNote: order.allergyNote,
    allergyAcknowledgedAt: order.allergyAcknowledgedAt?.toISOString() ?? null,
    createdAt: new Date().toISOString(),
    items: items.map((item) => ({
      orderItemId: item.id,
      name: item.itemNameSnapshot,
      quantity: item.quantity,
      note: item.note,
      quickInstructions: item.quickInstructions,
      selectedVariants: item.selectedVariants,
      hasAllergy: item.hasAllergy,
      allergenCodes: item.allergenCodes,
      allergySeverity: item.allergySeverity,
      allergyNote: item.allergyNote,
      allergyAcknowledgedAt: item.allergyAcknowledgedAt?.toISOString() ?? null,
      allergyKitchenConfirmedAt:
        item.allergyKitchenConfirmedAt?.toISOString() ?? null,
      station: item.kitchenStationSnapshot,
    })),
  };
}
