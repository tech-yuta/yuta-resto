'use server';

import { createOrderService, OrderServiceError } from '@yuta/core';
import { db } from '@yuta/db/client';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getSelectedStaffUser } from '../_pos-helpers';

const orderItemIdFormSchema = z.object({
  orderItemId: z.string().uuid(),
});

export async function markOrderItemPreparingAction(
  formData: FormData,
): Promise<void> {
  const values = orderItemIdFormSchema.parse({
    orderItemId: formData.get('orderItemId'),
  });
  const orderService = createOrderService(db);

  await runKitchenStatusAction(() =>
    orderService.markOrderItemPreparing(values.orderItemId),
  );
}

export async function markOrderItemSentAction(
  formData: FormData,
): Promise<void> {
  const values = orderItemIdFormSchema.parse({
    orderItemId: formData.get('orderItemId'),
  });
  const orderService = createOrderService(db);

  await runKitchenStatusAction(() =>
    orderService.markOrderItemSent(values.orderItemId),
  );
}

export async function markOrderItemReadyAction(
  formData: FormData,
): Promise<void> {
  const values = orderItemIdFormSchema.parse({
    orderItemId: formData.get('orderItemId'),
  });
  const orderService = createOrderService(db);

  await runKitchenStatusAction(() =>
    orderService.markOrderItemReady(values.orderItemId),
  );
}

export async function confirmOrderItemAllergyAction(
  formData: FormData,
): Promise<void> {
  const values = orderItemIdFormSchema.parse({
    orderItemId: formData.get('orderItemId'),
  });
  const staffUser = await getSelectedStaffUser();
  const orderService = createOrderService(db);

  await runKitchenStatusAction(() =>
    orderService.confirmOrderItemAllergy({
      orderItemId: values.orderItemId,
      confirmedBy: staffUser.id,
    }),
  );
}

async function runKitchenStatusAction(
  operation: () => Promise<unknown>,
): Promise<void> {
  try {
    await operation();
  } catch (error) {
    if (error instanceof OrderServiceError && error.code === 'invalid_status') {
      revalidatePath('/kitchen');
      return;
    }

    throw error;
  }

  revalidatePath('/kitchen');
}
