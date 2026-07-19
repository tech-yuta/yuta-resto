import { z } from 'zod';

export const identifierSchema = z.string().uuid();
export const organizationIdSchema = identifierSchema;
export const establishmentIdSchema = identifierSchema;
export const userIdSchema = identifierSchema;
export const orderIdSchema = identifierSchema;
export const orderItemIdSchema = identifierSchema;
export const reservationIdSchema = identifierSchema;
export const isoDateTimeSchema = z.string().datetime({ offset: true });
export const moneySchema = z
  .object({ amountMinor: z.number().int(), currency: z.string().length(3) })
  .strict();
export const apiErrorSchema = z
  .object({
    error: z
      .object({
        code: z.string().min(1),
        message: z.string().min(1),
        fieldErrors: z.record(z.array(z.string())).optional(),
        requestId: z.string().optional(),
      })
      .strict(),
  })
  .strict();
export const cursorPaginationQuerySchema = z
  .object({
    cursor: z.string().optional(),
    limit: z.coerce.number().int().min(1).max(100).default(25),
  })
  .strict();
export const pageInfoSchema = z
  .object({ nextCursor: z.string().nullable(), hasMore: z.boolean() })
  .strict();
export const eventEnvelopeSchema = z
  .object({
    eventId: identifierSchema,
    eventVersion: z.number().int().positive(),
    occurredAt: isoDateTimeSchema,
    organizationId: organizationIdSchema,
    establishmentId: establishmentIdSchema.nullable(),
    correlationId: identifierSchema.optional(),
    causationId: identifierSchema.optional(),
  })
  .strict();

export type Money = z.infer<typeof moneySchema>;
export type ApiError = z.infer<typeof apiErrorSchema>;
export type EventEnvelope = z.infer<typeof eventEnvelopeSchema>;
