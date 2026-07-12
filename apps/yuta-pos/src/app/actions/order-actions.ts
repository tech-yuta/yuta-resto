'use server';

import { createOrderService, createPrintService, OrderServiceError } from '@yuta/core';
import { db } from '@yuta/db/client';
import { orderItems } from '@yuta/db/schema';
import { and, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import {
  getSelectableStaffUserById,
  getSelectedStaffUser,
} from '../_pos-helpers';

const createOrderFormSchema = z.object({
  tableLabel: z.string().trim().min(1).max(255),
  orderType: z.enum(['dine_in', 'takeaway', 'delivery']),
  staffUserId: z.string().uuid().optional(),
  note: z.string().trim().max(2000).optional(),
});

const addOrderItemFormSchema = z.object({
  orderId: z.string().uuid(),
  menuItemId: z.string().uuid(),
});

const orderIdFormSchema = z.object({
  orderId: z.string().uuid(),
});

const orderItemIdFormSchema = z.object({
  orderItemId: z.string().uuid(),
});

const updateOrderItemQuantityFormSchema = z.object({
  orderId: z.string().uuid(),
  orderItemId: z.string().uuid(),
  quantity: z.coerce.number().int().positive(),
});

const cancelOrderItemFormSchema = z.object({
  orderId: z.string().uuid(),
  orderItemId: z.string().uuid(),
});

const restoreOrderItemFormSchema = z.object({
  orderId: z.string().uuid(),
  orderItemId: z.string().uuid(),
});

export async function createOrderAction(formData: FormData): Promise<void> {
  const values = createOrderFormSchema.parse({
    tableLabel: formData.get('tableLabel'),
    orderType: formData.get('orderType'),
    staffUserId: formData.get('staffUserId') || undefined,
    note: formData.get('note') || undefined,
  });
  const staffUser = values.staffUserId
    ? await getSelectableStaffUserById(values.staffUserId)
    : await getSelectedStaffUser();
  const orderService = createOrderService(db);
  const order = await orderService.createOrder({
    tableLabel: values.tableLabel,
    orderType: values.orderType,
    createdBy: staffUser.id,
    note: values.note,
  });

  redirect(`/orders/${order.id}/items`);
}

export async function addOrderItemAction(formData: FormData): Promise<void> {
  const values = addOrderItemFormSchema.parse({
    orderId: formData.get('orderId'),
    menuItemId: formData.get('menuItemId'),
  });
  const orderService = createOrderService(db);

  await orderService.addOrderItem({
    orderId: values.orderId,
    menuItemId: values.menuItemId,
    quantity: 1,
  });

  revalidatePath(`/orders/${values.orderId}`);
  revalidatePath(`/orders/${values.orderId}/items`);
}

export async function sendOrderToKitchenAction(
  formData: FormData,
): Promise<void> {
  const values = orderIdFormSchema.parse({
    orderId: formData.get('orderId'),
  });
  const orderService = createOrderService(db);
  const printService = createPrintService(db);
  const pendingItems = await db.query.orderItems.findMany({
    where: and(
      eq(orderItems.orderId, values.orderId),
      eq(orderItems.status, 'pending'),
    ),
  });

  await orderService.sendOrderToKitchen(values.orderId);
  await printService.createKitchenTicketPrintJob({
    orderId: values.orderId,
    orderItemIds: pendingItems.map((item) => item.id),
  });

  revalidatePath(`/orders/${values.orderId}`);
  revalidatePath('/kitchen');
  revalidatePath('/pos/prints');
}

export async function cancelOrderAction(formData: FormData): Promise<void> {
  const values = orderIdFormSchema.parse({
    orderId: formData.get('orderId'),
  });
  const orderService = createOrderService(db);

  await orderService.cancelOrder({
    orderId: values.orderId,
    reason: 'POS order cancellation',
  });

  revalidatePath('/');
  revalidatePath(`/orders/${values.orderId}`);
  revalidatePath(`/orders/${values.orderId}/items`);
  revalidatePath(`/orders/${values.orderId}/payment`);
  revalidatePath('/kitchen');
}

export async function updateOrderItemQuantityAction(
  formData: FormData,
): Promise<void> {
  const values = updateOrderItemQuantityFormSchema.parse({
    orderId: formData.get('orderId'),
    orderItemId: formData.get('orderItemId'),
    quantity: formData.get('quantity'),
  });
  const orderService = createOrderService(db);

  await orderService.updateOrderItemQuantity({
    orderItemId: values.orderItemId,
    quantity: values.quantity,
  });

  revalidatePath(`/orders/${values.orderId}`);
}

export async function cancelOrderItemAction(formData: FormData): Promise<void> {
  const values = cancelOrderItemFormSchema.parse({
    orderId: formData.get('orderId'),
    orderItemId: formData.get('orderItemId'),
  });
  const orderService = createOrderService(db);

  await orderService.cancelOrderItem({
    orderItemId: values.orderItemId,
    reason: 'POS item cancellation',
  });

  revalidatePath(`/orders/${values.orderId}`);
  revalidatePath('/kitchen');
}

export async function restoreOrderItemAction(
  formData: FormData,
): Promise<void> {
  const values = restoreOrderItemFormSchema.parse({
    orderId: formData.get('orderId'),
    orderItemId: formData.get('orderItemId'),
  });
  const orderService = createOrderService(db);

  await orderService.restoreOrderItem({
    orderItemId: values.orderItemId,
  });

  revalidatePath(`/orders/${values.orderId}`);
  revalidatePath('/kitchen');
}
