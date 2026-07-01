'use server';

import { createOrderService, createPaymentService, createPrintService, PaymentServiceError } from '@yuta/core';
import { db } from '@yuta/db/client';
import { checks, orderItems, orders, users } from '@yuta/db/schema';
import { and, eq, ne } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { z } from 'zod';

const selectedStaffCookieName = 'yuta_pos_staff_id';
const staffSelectableRoles = ['admin', 'manager', 'staff'] as const;

const createOrderFormSchema = z.object({
  tableLabel: z.string().trim().min(1).max(255),
  orderType: z.enum(['dine_in', 'takeaway', 'delivery']),
  staffUserId: z.string().uuid().optional(),
});

const selectStaffFormSchema = z.object({
  staffUserId: z.string().uuid(),
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

const moneyCentsSchema = z.preprocess(
  parseEuroAmountToCents,
  z.number().int().positive(),
);

const optionalMoneyCentsSchema = z.preprocess(
  (value) => (value === null || value === '' ? undefined : parseEuroAmountToCents(value)),
  z.coerce.number().int().positive().optional(),
);

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
  amountCents: moneyCentsSchema,
  tenderedCents: optionalMoneyCentsSchema,
});

const splitOrderEquallyFormSchema = z.object({
  orderId: z.string().uuid(),
  parts: z.coerce.number().int().min(2).max(99),
});

const payCheckFormSchema = z.object({
  orderId: z.string().uuid(),
  checkId: z.string().uuid(),
  method: z.enum(['cash', 'card', 'ticket_resto', 'other']),
  amountCents: moneyCentsSchema,
  tenderedCents: optionalMoneyCentsSchema,
});

const createChecksByItemsFormSchema = z.object({
  orderId: z.string().uuid(),
});

export async function selectStaffAction(formData: FormData): Promise<void> {
  const values = selectStaffFormSchema.parse({
    staffUserId: formData.get('staffUserId'),
  });
  const staffUser = await db.query.users.findFirst({
    where: eq(users.id, values.staffUserId),
  });

  if (!isSelectableStaffUser(staffUser)) {
    throw new Error('Selected staff user is not available.');
  }

  const cookieStore = await cookies();
  cookieStore.set(selectedStaffCookieName, staffUser.id, {
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });

  revalidatePath('/');
}

export async function createOrderAction(formData: FormData): Promise<void> {
  const values = createOrderFormSchema.parse({
    tableLabel: formData.get('tableLabel'),
    orderType: formData.get('orderType'),
    staffUserId: formData.get('staffUserId') || undefined,
  });
  const staffUser = values.staffUserId
    ? await getSelectableStaffUserById(values.staffUserId)
    : await getSelectedStaffUser();
  const orderService = createOrderService(db);
  const order = await orderService.createOrder({
    tableLabel: values.tableLabel,
    orderType: values.orderType,
    createdBy: staffUser.id,
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
  const pendingItems = await db.query.orderItems.findMany({
    where: and(eq(orderItems.orderId, values.orderId), eq(orderItems.status, 'pending')),
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

  try {
    await paymentService.payFullOrder({
      orderId: values.orderId,
      method: values.method,
      amountCents: values.amountCents,
      tenderedCents: values.tenderedCents,
      paidBy: (await getSelectedStaffUser()).name,
    });
  } catch (error) {
    if (error instanceof PaymentServiceError) {
      redirect(`/orders/${values.orderId}/payment?error=${error.code}`);
    }

    throw error;
  }
  const order = await db.query.orders.findFirst({
    where: eq(orders.id, values.orderId),
  });

  if (order?.status === 'paid') {
    await printService.createCustomerReceiptPrintJob({ orderId: values.orderId });
  }

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
  redirect(`/orders/${values.orderId}/payment`);
}

export async function cancelOrderSplitAction(formData: FormData): Promise<void> {
  const values = orderIdFormSchema.parse({
    orderId: formData.get('orderId'),
  });
  const paymentService = createPaymentService(db);

  try {
    await paymentService.cancelOrderSplit(values.orderId);
  } catch (error) {
    if (error instanceof PaymentServiceError) {
      redirect(`/orders/${values.orderId}/payment?error=${error.code}`);
    }

    throw error;
  }

  revalidatePath(`/orders/${values.orderId}`);
  revalidatePath(`/orders/${values.orderId}/payment`);
  redirect(`/orders/${values.orderId}/payment`);
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

  try {
    await paymentService.payCheck({
      checkId: values.checkId,
      method: values.method,
      amountCents: values.amountCents,
      tenderedCents: values.tenderedCents,
      paidBy: (await getSelectedStaffUser()).name,
    });
  } catch (error) {
    if (error instanceof PaymentServiceError) {
      redirect(`/orders/${values.orderId}/payment?error=${error.code}`);
    }

    throw error;
  }
  const check = await db.query.checks.findFirst({
    where: eq(checks.id, values.checkId),
  });

  if (check?.status === 'paid') {
    await printService.createCustomerReceiptPrintJob({
      orderId: values.orderId,
      checkId: values.checkId,
    });
  }

  revalidatePath(`/orders/${values.orderId}`);
  revalidatePath(`/orders/${values.orderId}/payment`);
  revalidatePath('/pos/prints');
  redirect(`/orders/${values.orderId}/payment`);
}

export async function createChecksByItemsAction(formData: FormData): Promise<void> {
  const values = createChecksByItemsFormSchema.parse({
    orderId: formData.get('orderId'),
  });
  const itemsByClient = new Map<number, Array<{ orderItemId: string; quantity: number }>>();
  const requestedClientCount = Number(formData.get('clientCount'));

  for (const [key, value] of formData.entries()) {
    const match = /^client(\d+):(.+)$/.exec(key);
    if (!match) {
      continue;
    }

    const clientIndex = Number(match[1]);
    const quantity = Number(value);
    if (!Number.isInteger(clientIndex) || clientIndex < 1 || !Number.isInteger(quantity) || quantity <= 0) {
      continue;
    }

    const items = itemsByClient.get(clientIndex) ?? [];
    items.push({
      orderItemId: match[2],
      quantity,
    });
    itemsByClient.set(clientIndex, items);
  }

  const checkInputs = Array.from(itemsByClient.entries())
    .toSorted(([leftIndex], [rightIndex]) => leftIndex - rightIndex)
    .map(([clientIndex, items]) => ({
      checkLabel: `Client ${clientIndex}`,
      items,
    }));
  const checks = checkInputs.filter((check) => check.items.length > 0);
  const clientCount = Number.isInteger(requestedClientCount)
    ? requestedClientCount
    : Math.max(2, ...Array.from(itemsByClient.keys()));
  const itemSplitUrl = `/orders/${values.orderId}/payment/items?clients=${clientCount}`;

  if (checks.length === 0) {
    redirect(`${itemSplitUrl}&error=empty`);
  }

  const activeItems = await db.query.orderItems.findMany({
    where: and(eq(orderItems.orderId, values.orderId), ne(orderItems.status, 'cancelled')),
  });
  const activeQuantityByItemId = new Map(activeItems.map((item) => [item.id, item.quantity]));
  const assignedQuantityByItemId = new Map<string, number>();

  for (const check of checks) {
    for (const item of check.items) {
      assignedQuantityByItemId.set(
        item.orderItemId,
        (assignedQuantityByItemId.get(item.orderItemId) ?? 0) + item.quantity,
      );
    }
  }

  for (const [orderItemId, assignedQuantity] of assignedQuantityByItemId.entries()) {
    const availableQuantity = activeQuantityByItemId.get(orderItemId);

    if (availableQuantity === undefined || assignedQuantity > availableQuantity) {
      redirect(`${itemSplitUrl}&error=quantity`);
    }
  }

  const paymentService = createPaymentService(db);
  await paymentService.createChecksByItems({
    orderId: values.orderId,
    checks,
  });

  revalidatePath(`/orders/${values.orderId}`);
  revalidatePath(`/orders/${values.orderId}/payment`);
  redirect(`/orders/${values.orderId}/payment`);
}

async function getSelectedStaffUser(): Promise<typeof users.$inferSelect> {
  const cookieStore = await cookies();
  const selectedStaffUserId = cookieStore.get(selectedStaffCookieName)?.value;

  if (selectedStaffUserId) {
    const selectedStaffUser = await db.query.users.findFirst({
      where: eq(users.id, selectedStaffUserId),
    });

    if (
      selectedStaffUser &&
      selectedStaffUser.isActive &&
      staffSelectableRoles.includes(selectedStaffUser.role as (typeof staffSelectableRoles)[number])
    ) {
      return selectedStaffUser;
    }
  }

  const seededStaffUser = await db.query.users.findFirst({ where: eq(users.email, 'staff@yuta.local') });
  if (isSelectableStaffUser(seededStaffUser)) {
    return seededStaffUser;
  }

  const staffUser = (await db.query.users.findMany({ where: eq(users.role, 'staff') })).find(
    (user) => user.isActive,
  );

  if (!staffUser) {
    throw new Error('No active staff user found. Run `corepack pnpm --filter @yuta/db db:seed` first.');
  }

  return staffUser;
}

async function getSelectableStaffUserById(staffUserId: string): Promise<typeof users.$inferSelect> {
  const staffUser = await db.query.users.findFirst({
    where: eq(users.id, staffUserId),
  });

  if (!isSelectableStaffUser(staffUser)) {
    throw new Error('Selected staff user is not available.');
  }

  return staffUser;
}

function isSelectableStaffUser(user: typeof users.$inferSelect | undefined): user is typeof users.$inferSelect {
  return Boolean(
    user?.isActive && staffSelectableRoles.includes(user.role as (typeof staffSelectableRoles)[number]),
  );
}

function parseEuroAmountToCents(value: unknown): number {
  if (typeof value !== 'string') {
    return Number.NaN;
  }

  const normalizedValue = value.trim().replace(/\s/g, '').replace(',', '.');
  if (!/^\d+(\.\d{0,2})?$/.test(normalizedValue)) {
    return Number.NaN;
  }

  const [eurosPart, centsPart = ''] = normalizedValue.split('.');
  const euros = Number(eurosPart);
  const cents = Number(centsPart.padEnd(2, '0'));

  if (!Number.isInteger(euros) || !Number.isInteger(cents)) {
    return Number.NaN;
  }

  return euros * 100 + cents;
}
