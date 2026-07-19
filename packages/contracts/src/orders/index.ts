import { z } from 'zod';
import {
  establishmentIdSchema,
  identifierSchema,
  moneySchema,
  orderIdSchema,
  orderItemIdSchema,
} from '../common';

export const orderTypeSchema = z.enum(['dine_in', 'takeaway', 'delivery']);
export const orderStatusSchema = z.enum([
  'draft',
  'sent',
  'preparing',
  'ready',
  'served',
  'paid',
  'cancelled',
]);
export const orderItemStatusSchema = z.enum([
  'pending',
  'sent',
  'preparing',
  'ready',
  'served',
  'cancelled',
]);
export const orderItemInputSchema = z
  .object({
    productId: identifierSchema,
    quantity: z.number().int().positive(),
    note: z.string().trim().max(300).optional(),
    modifierIds: z.array(identifierSchema).default([]),
  })
  .strict();
export const createOrderInputSchema = z
  .object({
    establishmentId: establishmentIdSchema,
    serviceType: orderTypeSchema,
    tableId: identifierSchema.optional(),
    items: z.array(orderItemInputSchema).min(1),
    idempotencyKey: identifierSchema,
  })
  .strict();
export const orderItemSchema = z
  .object({
    id: orderItemIdSchema,
    name: z.string().min(1),
    quantity: z.number().int().positive(),
    unitPrice: moneySchema,
    status: orderItemStatusSchema,
  })
  .strict();
export const orderResponseSchema = z
  .object({
    id: orderIdSchema,
    establishmentId: establishmentIdSchema,
    status: orderStatusSchema,
    serviceType: orderTypeSchema,
    items: z.array(orderItemSchema),
    total: moneySchema,
  })
  .strict();

export type OrderType = z.infer<typeof orderTypeSchema>;
export type OrderStatus = z.infer<typeof orderStatusSchema>;
export type OrderItemStatus = z.infer<typeof orderItemStatusSchema>;
export type CreateOrderInput = z.infer<typeof createOrderInputSchema>;
