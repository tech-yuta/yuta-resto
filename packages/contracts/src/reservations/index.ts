import { z } from 'zod';
import {
  establishmentIdSchema,
  isoDateTimeSchema,
  reservationIdSchema,
} from '../common';

export const reservationStatusSchema = z.enum([
  'pending',
  'confirmed',
  'seated',
  'completed',
  'cancelled',
  'no_show',
]);
export const createReservationInputSchema = z
  .object({
    establishmentId: establishmentIdSchema,
    startAt: isoDateTimeSchema,
    partySize: z.number().int().min(1).max(30),
    customer: z
      .object({
        firstName: z.string().trim().min(1).max(100),
        lastName: z.string().trim().min(1).max(100),
        email: z.string().trim().email().max(254),
        phone: z.string().trim().min(6).max(30),
      })
      .strict(),
    note: z.string().trim().max(500).optional(),
    idempotencyKey: z.string().uuid(),
  })
  .strict();
export const updateReservationStatusInputSchema = z
  .object({
    reservationId: reservationIdSchema,
    status: reservationStatusSchema,
  })
  .strict();
export const publicReservationResponseSchema = z
  .object({
    id: reservationIdSchema,
    reference: z.string().min(1),
    establishmentId: establishmentIdSchema,
    startAt: isoDateTimeSchema,
    partySize: z.number().int().positive(),
    status: reservationStatusSchema,
  })
  .strict();

export type ReservationStatus = z.infer<typeof reservationStatusSchema>;
export type CreateReservationInput = z.infer<
  typeof createReservationInputSchema
>;
