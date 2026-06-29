'use server';

import { createOrderService, createPaymentService, createPrintService } from '@yuta/core';
import { db } from '@yuta/db/client';
import { users } from '@yuta/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

const createOrderFormSchema = z.object({
  tableLabel: z.string().trim().min(1).max(255),
  orderType: z.enum(['dine_in', 'takeaway', 'delivery']),
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

const payFullOrderFormSchema = z.object({
  orderId: z.string().uuid(),
  method: z.enum(['cash', 'card', 'ticket_resto', 'other']),
  amountCents: z.coerce.number().int().positive(),
  tenderedCents: z.coerce.number().int().positive().optional(),
});

const splitOrderEquallyFormSchema = z.object({
  orderId: z.string().uuid(),
  parts: z.coerce.number().int().min(2).max(99),
});

const payCheckFormSchema = z.object({
  orderId: z.string().uuid(),
  checkId: z.string().uuid(),
  method: z.enum(['cash', 'card', 'ticket_resto', 'other']),
  amountCents: z.coerce.number().int().positive(),
  tenderedCents: z.coerce.number().int().positive().optional(),
});

const createChecksByItemsFormSchema = z.object({
  orderId: z.string().uuid(),
});

export async function createOrderAction(formData: FormData): Promise<void> {
  const values = createOrderFormSchema.parse({
    tableLabel: formData.get('tableLabel'),
    orderType: formData.get('orderType'),
  });
  const createdBy = await getDefaultStaffUserId();
  const orderService = createOrderService(db);
  const order = await orderService.createOrder({
    tableLabel: values.tableLabel,
    orderType: values.orderType,
    createdBy,
  });

  redirect(`/orders/${order.id}`);
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
}

export async function sendOrderToKitchenAction(formData: FormData): Promise<void> {
  const values = orderIdFormSchema.parse({
    orderId: formData.get('orderId'),
  });
  const orderService = createOrderService(db);
  const printService = createPrintService(db);

  await orderService.sendOrderToKitchen(values.orderId);
  await printService.createKitchenTicketPrintJob(values.orderId);

  revalidatePath(`/orders/${values.orderId}`);
  revalidatePath('/kitchen');
  revalidatePath('/pos/prints');
}

export async function updateOrderItemQuantityAction(formData: FormData): Promise<void> {
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

export async function restoreOrderItemAction(formData: FormData): Promise<void> {
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

export async function markOrderItemPreparingAction(formData: FormData): Promise<void> {
  const values = orderItemIdFormSchema.parse({
    orderItemId: formData.get('orderItemId'),
  });
  const orderService = createOrderService(db);

  await orderService.markOrderItemPreparing(values.orderItemId);

  revalidatePath('/kitchen');
}

export async function markOrderItemReadyAction(formData: FormData): Promise<void> {
  const values = orderItemIdFormSchema.parse({
    orderItemId: formData.get('orderItemId'),
  });
  const orderService = createOrderService(db);

  await orderService.markOrderItemReady(values.orderItemId);

  revalidatePath('/kitchen');
}

export async function payFullOrderAction(formData: FormData): Promise<void> {
  const rawTenderedCents = formData.get('tenderedCents');
  const values = payFullOrderFormSchema.parse({
    orderId: formData.get('orderId'),
    method: formData.get('method'),
    amountCents: formData.get('amountCents'),
    tenderedCents: rawTenderedCents === '' ? undefined : rawTenderedCents,
  });
  const paymentService = createPaymentService(db);
  const printService = createPrintService(db);

  await paymentService.payFullOrder({
    orderId: values.orderId,
    method: values.method,
    amountCents: values.amountCents,
    tenderedCents: values.tenderedCents,
  });
  await printService.createCustomerReceiptPrintJob({ orderId: values.orderId });

  revalidatePath(`/orders/${values.orderId}`);
  revalidatePath(`/orders/${values.orderId}/payment`);
  revalidatePath('/pos/prints');
  redirect(`/orders/${values.orderId}`);
}

export async function splitOrderEquallyAction(formData: FormData): Promise<void> {
  const values = splitOrderEquallyFormSchema.parse({
    orderId: formData.get('orderId'),
    parts: formData.get('parts'),
  });
  const paymentService = createPaymentService(db);

  await paymentService.splitOrderEqually({
    orderId: values.orderId,
    parts: values.parts,
  });

  revalidatePath(`/orders/${values.orderId}`);
  revalidatePath(`/orders/${values.orderId}/payment`);
}

export async function payCheckAction(formData: FormData): Promise<void> {
  const rawTenderedCents = formData.get('tenderedCents');
  const values = payCheckFormSchema.parse({
    orderId: formData.get('orderId'),
    checkId: formData.get('checkId'),
    method: formData.get('method'),
    amountCents: formData.get('amountCents'),
    tenderedCents: rawTenderedCents === '' ? undefined : rawTenderedCents,
  });
  const paymentService = createPaymentService(db);
  const printService = createPrintService(db);

  await paymentService.payCheck({
    checkId: values.checkId,
    method: values.method,
    amountCents: values.amountCents,
    tenderedCents: values.tenderedCents,
  });
  await printService.createCustomerReceiptPrintJob({
    orderId: values.orderId,
    checkId: values.checkId,
  });

  revalidatePath(`/orders/${values.orderId}`);
  revalidatePath(`/orders/${values.orderId}/payment`);
  revalidatePath('/pos/prints');
}

export async function createChecksByItemsAction(formData: FormData): Promise<void> {
  const values = createChecksByItemsFormSchema.parse({
    orderId: formData.get('orderId'),
  });
  const paymentService = createPaymentService(db);
  const checkInputs = ['client1', 'client2'].map((clientKey, index) => ({
    checkLabel: `Client ${index + 1}`,
    items: Array.from(formData.entries())
      .filter(([key]) => key.startsWith(`${clientKey}:`))
      .map(([key, value]) => ({
        orderItemId: key.slice(`${clientKey}:`.length),
        quantity: Number(value),
      }))
      .filter((item) => Number.isInteger(item.quantity) && item.quantity > 0),
  }));
  const checks = checkInputs.filter((check) => check.items.length > 0);

  if (checks.length === 0) {
    throw new Error('At least one check must include items.');
  }

  await paymentService.createChecksByItems({
    orderId: values.orderId,
    checks,
  });

  revalidatePath(`/orders/${values.orderId}`);
  revalidatePath(`/orders/${values.orderId}/payment`);
  redirect(`/orders/${values.orderId}/payment`);
}

async function getDefaultStaffUserId(): Promise<string> {
  const staffUser =
    (await db.query.users.findFirst({ where: eq(users.email, 'staff@yuta.local') })) ??
    (await db.query.users.findFirst({ where: eq(users.role, 'staff') }));

  if (!staffUser) {
    throw new Error('No active staff user found. Run `corepack pnpm --filter @yuta/db db:seed` first.');
  }

  return staffUser.id;
}
