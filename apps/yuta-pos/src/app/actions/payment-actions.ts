'use server';

import {
  createPosService,
  PaymentServiceError,
  parseEuroAmountToCents,
} from '@yuta/core';
import { db } from '@yuta/db/client';
import { orderItems } from '@yuta/db/schema';
import { and, eq, ne } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { getSelectedStaffUser } from '../_pos-helpers';

const moneyCentsSchema = z.preprocess(
  (v) => (typeof v === 'string' ? parseEuroAmountToCents(v) : null),
  z.number().int().positive(),
);

const optionalMoneyCentsSchema = z.preprocess(
  (value) =>
    value === null || value === ''
      ? undefined
      : typeof value === 'string'
        ? parseEuroAmountToCents(value)
        : null,
  z.coerce.number().int().positive().optional(),
);

const orderIdFormSchema = z.object({
  orderId: z.string().uuid(),
});

const payFullOrderFormSchema = z.object({
  orderId: z.string().uuid(),
  method: z.enum(['cash', 'card', 'ticket_resto', 'other']),
  amountCents: moneyCentsSchema,
  tenderedCents: optionalMoneyCentsSchema,
  idempotencyKey: z.string().uuid(),
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
  idempotencyKey: z.string().uuid(),
});

const createChecksByItemsFormSchema = z.object({
  orderId: z.string().uuid(),
});

export async function payFullOrderAction(formData: FormData): Promise<void> {
  const orderId = readOrderIdOrThrow(formData);
  const values = parsePaymentFormOrRedirect(
    payFullOrderFormSchema,
    formData,
    orderId,
  );
  const posService = createPosService(db);

  try {
    await posService.payFullOrder({
      orderId: values.orderId,
      method: values.method,
      amountCents: values.amountCents,
      tenderedCents: values.tenderedCents,
      paidBy: (await getSelectedStaffUser()).name,
      idempotencyKey: values.idempotencyKey,
    });
  } catch (error) {
    if (error instanceof PaymentServiceError) {
      redirect(`/orders/${values.orderId}/payment?error=${error.code}`);
    }

    throw error;
  }
  revalidatePath(`/orders/${values.orderId}`);
  revalidatePath(`/orders/${values.orderId}/payment`);
  revalidatePath('/pos/prints');
  redirect(`/orders/${values.orderId}`);
}

export async function splitOrderEquallyAction(
  formData: FormData,
): Promise<void> {
  const values = splitOrderEquallyFormSchema.parse({
    orderId: formData.get('orderId'),
    parts: formData.get('parts'),
  });
  const shouldReturnToPayment = formData.get('returnTo') === 'payment';
  await createPosService(db).splitOrderEqually({
    orderId: values.orderId,
    parts: values.parts,
  });

  revalidatePath(`/orders/${values.orderId}`);
  revalidatePath(`/orders/${values.orderId}/payment`);
  redirect(
    shouldReturnToPayment
      ? `/orders/${values.orderId}/payment?paymentDialog=equal-split`
      : `/orders/${values.orderId}/payment`,
  );
}

export async function cancelOrderSplitAction(
  formData: FormData,
): Promise<void> {
  const values = orderIdFormSchema.parse({
    orderId: formData.get('orderId'),
  });
  try {
    await createPosService(db).cancelOrderSplit(values.orderId);
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
  const orderId = readOrderIdOrThrow(formData);
  const values = parsePaymentFormOrRedirect(
    payCheckFormSchema,
    formData,
    orderId,
  );
  const posService = createPosService(db);

  try {
    await posService.payCheck({
      orderId: values.orderId,
      checkId: values.checkId,
      method: values.method,
      amountCents: values.amountCents,
      tenderedCents: values.tenderedCents,
      paidBy: (await getSelectedStaffUser()).name,
      idempotencyKey: values.idempotencyKey,
    });
  } catch (error) {
    if (error instanceof PaymentServiceError) {
      redirect(`/orders/${values.orderId}/payment?error=${error.code}`);
    }

    throw error;
  }
  revalidatePath(`/orders/${values.orderId}`);
  revalidatePath(`/orders/${values.orderId}/payment`);
  revalidatePath('/pos/prints');
  redirect(`/orders/${values.orderId}/payment`);
}

export async function createChecksByItemsAction(
  formData: FormData,
): Promise<void> {
  const values = createChecksByItemsFormSchema.parse({
    orderId: formData.get('orderId'),
  });
  const itemsByClient = new Map<
    number,
    Array<{ orderItemId: string; quantity: number }>
  >();
  const requestedClientCount = Number(formData.get('clientCount'));

  for (const [key, value] of formData.entries()) {
    const match = /^client(\d+):(.+)$/.exec(key);
    if (!match) {
      continue;
    }

    const clientIndex = Number(match[1]);
    const quantity = Number(value);
    if (
      !Number.isInteger(clientIndex) ||
      clientIndex < 1 ||
      !Number.isInteger(quantity) ||
      quantity <= 0
    ) {
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
  const filteredChecks = checkInputs.filter((check) => check.items.length > 0);
  const clientCount = Number.isInteger(requestedClientCount)
    ? requestedClientCount
    : Math.max(2, ...Array.from(itemsByClient.keys()));
  const shouldReturnToPayment = formData.get('returnTo') === 'payment';
  const itemSplitUrl = shouldReturnToPayment
    ? `/orders/${values.orderId}/payment`
    : `/orders/${values.orderId}/payment/items?clients=${clientCount}`;

  if (filteredChecks.length === 0) {
    redirect(
      shouldReturnToPayment
        ? `${itemSplitUrl}?itemSplitError=empty`
        : `${itemSplitUrl}&error=empty`,
    );
  }

  const activeItems = await db.query.orderItems.findMany({
    where: and(
      eq(orderItems.orderId, values.orderId),
      ne(orderItems.status, 'cancelled'),
    ),
  });
  const activeQuantityByItemId = new Map(
    activeItems.map((item) => [item.id, item.quantity]),
  );
  const assignedQuantityByItemId = new Map<string, number>();

  for (const check of filteredChecks) {
    for (const item of check.items) {
      assignedQuantityByItemId.set(
        item.orderItemId,
        (assignedQuantityByItemId.get(item.orderItemId) ?? 0) + item.quantity,
      );
    }
  }

  for (const [
    orderItemId,
    assignedQuantity,
  ] of assignedQuantityByItemId.entries()) {
    const availableQuantity = activeQuantityByItemId.get(orderItemId);

    if (
      availableQuantity === undefined ||
      assignedQuantity > availableQuantity
    ) {
      redirect(
        shouldReturnToPayment
          ? `${itemSplitUrl}?itemSplitError=quantity`
          : `${itemSplitUrl}&error=quantity`,
      );
    }
  }

  await createPosService(db).createChecksByItems({
    orderId: values.orderId,
    checks: filteredChecks,
  });

  revalidatePath(`/orders/${values.orderId}`);
  revalidatePath(`/orders/${values.orderId}/payment`);
  redirect(
    shouldReturnToPayment
      ? `/orders/${values.orderId}/payment?paymentDialog=item-split`
      : `/orders/${values.orderId}/payment`,
  );
}

function readOrderIdOrThrow(formData: FormData): string {
  return orderIdFormSchema.parse({
    orderId: formData.get('orderId'),
  }).orderId;
}

function parsePaymentFormOrRedirect<
  T extends typeof payFullOrderFormSchema | typeof payCheckFormSchema,
>(schema: T, formData: FormData, orderId: string): z.infer<T> {
  const rawAmountCents = formData.get('amountCents');
  const rawTenderedCents = formData.get('tenderedCents');
  const parsedValues = schema.safeParse({
    orderId,
    checkId: formData.get('checkId'),
    method: formData.get('method'),
    amountCents: rawAmountCents,
    tenderedCents:
      rawTenderedCents === null || rawTenderedCents === ''
        ? rawAmountCents
        : rawTenderedCents,
    idempotencyKey: formData.get('idempotencyKey'),
  });

  if (!parsedValues.success) {
    redirect(`/orders/${orderId}/payment?error=invalid_amount`);
  }

  return parsedValues.data as z.infer<T>;
}
