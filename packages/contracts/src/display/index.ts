import { z } from 'zod';
import {
  eventEnvelopeSchema,
  orderIdSchema,
  orderItemIdSchema,
} from '../common';
export const kitchenOrderCreatedEventSchema = eventEnvelopeSchema
  .extend({
    type: z.literal('kitchen.order.created'),
    payload: z
      .object({
        orderId: orderIdSchema,
        orderNumber: z.string().min(1),
        createdAt: z.string().datetime({ offset: true }),
        items: z.array(
          z
            .object({
              orderItemId: orderItemIdSchema,
              displayName: z.string().min(1),
              quantity: z.number().int().positive(),
              notes: z.array(z.string()).default([]),
            })
            .strict(),
        ),
      })
      .strict(),
  })
  .strict();

export type KitchenOrderCreatedEvent = z.infer<
  typeof kitchenOrderCreatedEventSchema
>;
