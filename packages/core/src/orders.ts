import {
  and,
  desc,
  eq,
  ne,
  notInArray,
} from 'drizzle-orm';
import {
  menuItems,
  orderItems,
  orders,
  type MenuItem,
  type Order,
  type OrderItem,
} from '@yuta/db/schema';
import type { DbClient } from '@yuta/db/client';
import { z } from 'zod';

type OrderType = 'dine_in' | 'takeaway' | 'delivery';
type OrderItemStatus = 'pending' | 'sent' | 'preparing' | 'ready' | 'served' | 'cancelled';
type OrderStatus = 'draft' | 'sent' | 'preparing' | 'ready' | 'served' | 'paid' | 'cancelled';

const createOrderSchema = z.object({
  tableLabel: z.string().trim().min(1).max(255),
  orderType: z.enum(['dine_in', 'takeaway', 'delivery']),
  createdBy: z.string().uuid(),
  note: z.string().trim().max(2000).optional(),
});

const addOrderItemSchema = z.object({
  orderId: z.string().uuid(),
  menuItemId: z.string().uuid(),
  quantity: z.number().int().positive(),
  note: z.string().trim().max(2000).optional(),
});

const updateOrderItemQuantitySchema = z.object({
  orderItemId: z.string().uuid(),
  quantity: z.number().int().positive(),
});

const cancelOrderItemSchema = z.object({
  orderItemId: z.string().uuid(),
  reason: z.string().trim().max(2000).optional(),
});

const orderItemIdSchema = z.object({
  orderItemId: z.string().uuid(),
});

const orderIdSchema = z.object({
  orderId: z.string().uuid(),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type AddOrderItemInput = z.infer<typeof addOrderItemSchema>;
export type UpdateOrderItemQuantityInput = z.infer<typeof updateOrderItemQuantitySchema>;
export type CancelOrderItemInput = z.infer<typeof cancelOrderItemSchema>;

export type OrderDetail = Order & {
  items: OrderItem[];
};

export class OrderServiceError extends Error {
  constructor(
    message: string,
    public readonly code:
      | 'not_found'
      | 'invalid_status'
      | 'invalid_input'
      | 'menu_item_unavailable'
      | 'empty_order',
  ) {
    super(message);
    this.name = 'OrderServiceError';
  }
}

export function createOrderService(db: DbClient) {
  async function createOrder(input: CreateOrderInput): Promise<Order> {
    const values = createOrderSchema.parse(input);

    const [createdOrder] = await db
      .insert(orders)
      .values({
        orderNumber: createOrderNumber(),
        tableLabel: values.tableLabel,
        orderType: values.orderType,
        createdBy: values.createdBy,
        note: values.note,
      })
      .returning();

    return createdOrder;
  }

  async function addOrderItem(input: AddOrderItemInput): Promise<OrderItem> {
    const values = addOrderItemSchema.parse(input);

    const order = await getRequiredOrder(values.orderId);
    assertOrderCanChangeItems(order);

    const menuItem = await getRequiredMenuItem(values.menuItemId);
    if (!menuItem.isAvailable) {
      throw new OrderServiceError('Menu item is not available.', 'menu_item_unavailable');
    }

    const [createdItem] = await db
      .insert(orderItems)
      .values({
        orderId: order.id,
        menuItemId: menuItem.id,
        itemNameSnapshot: menuItem.name,
        unitPriceCentsSnapshot: menuItem.priceCents,
        kitchenStationSnapshot: menuItem.kitchenStation,
        quantity: values.quantity,
        note: values.note,
      })
      .returning();

    await recalculateOrderTotals(order.id);

    return createdItem;
  }

  async function updateOrderItemQuantity(input: UpdateOrderItemQuantityInput): Promise<OrderItem> {
    const values = updateOrderItemQuantitySchema.parse(input);
    const item = await getRequiredOrderItem(values.orderItemId);

    if (item.status !== 'pending') {
      throw new OrderServiceError('Only pending order items can be edited.', 'invalid_status');
    }

    const [updatedItem] = await db
      .update(orderItems)
      .set({ quantity: values.quantity })
      .where(eq(orderItems.id, item.id))
      .returning();

    await recalculateOrderTotals(item.orderId);

    return updatedItem;
  }

  async function cancelOrderItem(input: CancelOrderItemInput): Promise<OrderItem> {
    const values = cancelOrderItemSchema.parse(input);
    const item = await getRequiredOrderItem(values.orderItemId);

    if (item.status === 'cancelled') {
      return item;
    }

    const [cancelledItem] = await db
      .update(orderItems)
      .set({
        status: 'cancelled',
        cancelledAt: new Date(),
        cancelledReason: values.reason,
      })
      .where(eq(orderItems.id, item.id))
      .returning();

    await recalculateOrderTotals(item.orderId);
    await refreshOrderStatus(item.orderId);

    return cancelledItem;
  }

  async function sendOrderToKitchen(orderId: string): Promise<OrderDetail> {
    const { orderId: parsedOrderId } = orderIdSchema.parse({ orderId });
    const order = await getRequiredOrder(parsedOrderId);

    if (order.status === 'paid' || order.status === 'cancelled') {
      throw new OrderServiceError('Paid or cancelled orders cannot be sent to kitchen.', 'invalid_status');
    }

    const pendingItems = await db.query.orderItems.findMany({
      where: and(eq(orderItems.orderId, parsedOrderId), eq(orderItems.status, 'pending')),
    });

    if (pendingItems.length === 0) {
      throw new OrderServiceError('Order has no pending items to send.', 'empty_order');
    }

    const now = new Date();

    await db
      .update(orderItems)
      .set({ status: 'sent', sentAt: now })
      .where(and(eq(orderItems.orderId, parsedOrderId), eq(orderItems.status, 'pending')));

    await db
      .update(orders)
      .set({ status: 'sent', sentAt: order.sentAt ?? now })
      .where(eq(orders.id, parsedOrderId));

    return getOrderDetail(parsedOrderId);
  }

  async function markOrderItemPreparing(orderItemId: string): Promise<OrderItem> {
    return markOrderItemStatus(orderItemId, 'preparing', ['sent']);
  }

  async function markOrderItemReady(orderItemId: string): Promise<OrderItem> {
    return markOrderItemStatus(orderItemId, 'ready', ['sent', 'preparing']);
  }

  async function markOrderItemServed(orderItemId: string): Promise<OrderItem> {
    return markOrderItemStatus(orderItemId, 'served', ['ready']);
  }

  async function getOpenOrders(): Promise<OrderDetail[]> {
    return db.query.orders.findMany({
      where: notInArray(orders.status, ['paid', 'cancelled']),
      with: {
        items: true,
      },
      orderBy: [desc(orders.createdAt)],
    });
  }

  async function getOrderDetail(orderId: string): Promise<OrderDetail> {
    const { orderId: parsedOrderId } = orderIdSchema.parse({ orderId });

    const order = await db.query.orders.findFirst({
      where: eq(orders.id, parsedOrderId),
      with: {
        items: true,
      },
    });

    if (!order) {
      throw new OrderServiceError('Order not found.', 'not_found');
    }

    return order;
  }

  async function markOrderItemStatus(
    orderItemId: string,
    status: Exclude<OrderItemStatus, 'pending' | 'cancelled'>,
    allowedCurrentStatuses: OrderItemStatus[],
  ): Promise<OrderItem> {
    const values = orderItemIdSchema.parse({ orderItemId });
    const item = await getRequiredOrderItem(values.orderItemId);

    if (!allowedCurrentStatuses.includes(item.status)) {
      throw new OrderServiceError(
        `Cannot mark item ${status} from status ${item.status}.`,
        'invalid_status',
      );
    }

    const now = new Date();
    const timestampValues =
      status === 'ready'
        ? { readyAt: now }
        : status === 'served'
          ? { servedAt: now }
          : {};

    const [updatedItem] = await db
      .update(orderItems)
      .set({ status, ...timestampValues })
      .where(eq(orderItems.id, item.id))
      .returning();

    await refreshOrderStatus(item.orderId);

    return updatedItem;
  }

  async function getRequiredOrder(orderId: string): Promise<Order> {
    const order = await db.query.orders.findFirst({
      where: eq(orders.id, orderId),
    });

    if (!order) {
      throw new OrderServiceError('Order not found.', 'not_found');
    }

    return order;
  }

  async function getRequiredOrderItem(orderItemId: string): Promise<OrderItem> {
    const item = await db.query.orderItems.findFirst({
      where: eq(orderItems.id, orderItemId),
    });

    if (!item) {
      throw new OrderServiceError('Order item not found.', 'not_found');
    }

    return item;
  }

  async function getRequiredMenuItem(menuItemId: string): Promise<MenuItem> {
    const item = await db.query.menuItems.findFirst({
      where: eq(menuItems.id, menuItemId),
    });

    if (!item) {
      throw new OrderServiceError('Menu item not found.', 'not_found');
    }

    return item;
  }

  async function recalculateOrderTotals(orderId: string): Promise<void> {
    const activeItems = await db.query.orderItems.findMany({
      where: and(eq(orderItems.orderId, orderId), ne(orderItems.status, 'cancelled')),
    });

    const subtotalCents = activeItems.reduce(
      (total, item) => total + item.unitPriceCentsSnapshot * item.quantity,
      0,
    );

    const order = await getRequiredOrder(orderId);

    await db
      .update(orders)
      .set({
        subtotalCents,
        totalCents: Math.max(0, subtotalCents - order.discountCents),
      })
      .where(eq(orders.id, orderId));
  }

  async function refreshOrderStatus(orderId: string): Promise<void> {
    const order = await getRequiredOrder(orderId);

    if (order.status === 'paid' || order.status === 'cancelled') {
      return;
    }

    const activeItems = await db.query.orderItems.findMany({
      where: and(eq(orderItems.orderId, orderId), ne(orderItems.status, 'cancelled')),
    });

    const status = deriveOrderStatus(activeItems);

    await db.update(orders).set({ status }).where(eq(orders.id, orderId));
  }

  return {
    createOrder,
    addOrderItem,
    updateOrderItemQuantity,
    cancelOrderItem,
    sendOrderToKitchen,
    markOrderItemPreparing,
    markOrderItemReady,
    markOrderItemServed,
    getOpenOrders,
    getOrderDetail,
  };
}

function assertOrderCanChangeItems(order: Order): void {
  if (order.status === 'paid' || order.status === 'cancelled') {
    throw new OrderServiceError('Paid or cancelled orders cannot be changed.', 'invalid_status');
  }
}

function deriveOrderStatus(items: OrderItem[]): OrderStatus {
  if (items.length === 0) {
    return 'draft';
  }

  if (items.every((item) => item.status === 'served')) {
    return 'served';
  }

  if (items.every((item) => item.status === 'ready' || item.status === 'served')) {
    return 'ready';
  }

  if (items.some((item) => item.status === 'preparing')) {
    return 'preparing';
  }

  if (items.some((item) => item.status === 'sent')) {
    return 'sent';
  }

  return 'draft';
}

function createOrderNumber(date = new Date()): string {
  const datePart = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('');
  const timePart = [
    String(date.getHours()).padStart(2, '0'),
    String(date.getMinutes()).padStart(2, '0'),
    String(date.getSeconds()).padStart(2, '0'),
  ].join('');
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();

  return `POS-${datePart}-${timePart}-${suffix}`;
}
