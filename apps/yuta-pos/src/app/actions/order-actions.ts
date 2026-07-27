'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import {
  getSelectableStaffUserById,
  getSelectedStaffUser,
} from '../_pos-helpers';
import { posApi } from '../../lib/pos-api';

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

const sendToKitchenFormSchema = orderIdFormSchema.extend({
  idempotencyKey: z.string().uuid(),
});

const orderItemIdFormSchema = z.object({
  orderItemId: z.string().uuid(),
});

const updateOrderItemQuantityFormSchema = z.object({
  orderId: z.string().uuid(),
  orderItemId: z.string().uuid(),
  quantity: z.coerce.number().int().positive(),
});

const updateOrderItemInstructionsFormSchema = z.object({
  orderId: z.string().uuid(),
  orderItemId: z.string().uuid(),
  note: z.string().trim().max(300).optional(),
  selectedInstructionCodes: z.array(z.string()),
  selectedVariants: z.array(
    z.object({ code: z.string(), quantity: z.number().int().nonnegative() }),
  ),
  hasAllergy: z.boolean(),
  allergenCodes: z.array(z.string()),
  allergySeverity: z
    .enum(['intolerance', 'allergy', 'severe_no_traces'])
    .optional(),
  allergyNote: z.string().trim().max(300).optional(),
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
  const { order } = await posApi.createOrder({
    tableLabel: values.tableLabel,
    orderType: values.orderType,
    staffUserId: staffUser.id,
    note: values.note,
  });

  redirect(`/orders/${order.id}/items`);
}

export async function addOrderItemAction(formData: FormData): Promise<void> {
  const values = addOrderItemFormSchema.parse({
    orderId: formData.get('orderId'),
    menuItemId: formData.get('menuItemId'),
  });
  await posApi.addOrderItem(values.orderId, {
    menuItemId: values.menuItemId,
    quantity: 1,
  });

  revalidatePath(`/orders/${values.orderId}`);
  revalidatePath(`/orders/${values.orderId}/items`);
}

export async function sendOrderToKitchenAction(
  formData: FormData,
): Promise<void> {
  const values = sendToKitchenFormSchema.parse({
    orderId: formData.get('orderId'),
    idempotencyKey: formData.get('idempotencyKey'),
  });

  const staffUser = await getSelectedStaffUser();

  await posApi.executeOrderCommand(values.orderId, {
    action: 'send_to_kitchen',
    idempotencyKey: values.idempotencyKey,
    allergyAcknowledged: formData.get('allergyAcknowledged') === 'true',
    staffUserId: staffUser.id,
  });

  revalidatePath(`/orders/${values.orderId}`);
  revalidatePath('/kitchen');
  revalidatePath('/pos/prints');
}

export async function updateOrderItemInstructionsAction(
  formData: FormData,
): Promise<void> {
  const values = updateOrderItemInstructionsFormSchema.parse({
    orderId: formData.get('orderId'),
    orderItemId: formData.get('orderItemId'),
    note: formData.get('note') || undefined,
    selectedInstructionCodes: parseJsonArray(
      formData.get('selectedInstructionCodes'),
    ),
    selectedVariants: parseJsonArray(formData.get('selectedVariants')),
    hasAllergy: formData.get('hasAllergy') === 'true',
    allergenCodes: parseJsonArray(formData.get('allergenCodes')),
    allergySeverity: formData.get('allergySeverity') || undefined,
    allergyNote: formData.get('allergyNote') || undefined,
  });

  await posApi.updateOrderItem(values.orderItemId, {
    note: values.note,
    selectedInstructionCodes: values.selectedInstructionCodes,
    selectedVariants: values.selectedVariants,
    hasAllergy: values.hasAllergy,
    allergenCodes: values.allergenCodes,
    allergySeverity: values.allergySeverity,
    allergyNote: values.allergyNote,
  });

  revalidatePath(`/orders/${values.orderId}`);
  revalidatePath(`/orders/${values.orderId}/items`);
}

function parseJsonArray(value: FormDataEntryValue | null): unknown[] {
  if (typeof value !== 'string' || value.length === 0) {
    return [];
  }
  const parsed: unknown = JSON.parse(value);
  if (!Array.isArray(parsed)) {
    throw new Error('Expected a JSON array.');
  }
  return parsed;
}

export async function cancelOrderAction(formData: FormData): Promise<void> {
  const values = orderIdFormSchema.parse({
    orderId: formData.get('orderId'),
  });
  await posApi.executeOrderCommand(values.orderId, {
    action: 'cancel',
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
  await posApi.updateOrderItem(values.orderItemId, {
    quantity: values.quantity,
  });

  revalidatePath(`/orders/${values.orderId}`);
  revalidatePath(`/orders/${values.orderId}/items`);
  revalidatePath(`/orders/${values.orderId}/payment`);
}

export async function removePendingOrderItemAction(
  formData: FormData,
): Promise<void> {
  const values = cancelOrderItemFormSchema.parse({
    orderId: formData.get('orderId'),
    orderItemId: formData.get('orderItemId'),
  });
  await posApi.executeOrderItemCommand(values.orderItemId, {
    action: 'remove_pending',
  });

  revalidatePath(`/orders/${values.orderId}`);
  revalidatePath(`/orders/${values.orderId}/items`);
  revalidatePath(`/orders/${values.orderId}/payment`);
}

export async function cancelOrderItemAction(formData: FormData): Promise<void> {
  const values = cancelOrderItemFormSchema.parse({
    orderId: formData.get('orderId'),
    orderItemId: formData.get('orderItemId'),
  });
  await posApi.executeOrderItemCommand(values.orderItemId, {
    action: 'cancel',
    reason: 'POS item cancellation',
  });

  revalidatePath(`/orders/${values.orderId}`);
  revalidatePath(`/orders/${values.orderId}/items`);
  revalidatePath(`/orders/${values.orderId}/payment`);
  revalidatePath('/kitchen');
}

export async function restoreOrderItemAction(
  formData: FormData,
): Promise<void> {
  const values = restoreOrderItemFormSchema.parse({
    orderId: formData.get('orderId'),
    orderItemId: formData.get('orderItemId'),
  });
  await posApi.executeOrderItemCommand(values.orderItemId, {
    action: 'restore',
  });

  revalidatePath(`/orders/${values.orderId}`);
  revalidatePath(`/orders/${values.orderId}/items`);
  revalidatePath(`/orders/${values.orderId}/payment`);
  revalidatePath('/kitchen');
}
