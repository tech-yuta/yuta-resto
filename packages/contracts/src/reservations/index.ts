import { z } from 'zod';
import { establishmentIdSchema, isoDateTimeSchema } from '../common';

const localDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const localTimeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);

export const reservationStatusSchema = z.enum([
  'PENDING',
  'CONFIRMED',
  'DECLINED',
  'CANCELLED',
  'SEATED',
  'COMPLETED',
  'NO_SHOW',
]);

export const reservationSourceSchema = z.enum([
  'DIRECT',
  'GOOGLE',
  'FACEBOOK',
  'INSTAGRAM',
  'TIKTOK',
  'QR_CODE',
  'WEBSITE',
  'PHONE',
  'BACK_OFFICE',
  'OTHER',
]);

export const confirmationModeSchema = z.enum(['AUTOMATIC', 'MANUAL']);
export const bookingExceptionKindSchema = z.enum([
  'CLOSED_ALL_DAY',
  'CLOSED_SERVICE',
  'MODIFIED_HOURS',
  'BLOCKED_SLOT',
]);

export const publicAvailabilityQuerySchema = z
  .object({
    date: localDateSchema,
    partySize: z.coerce.number().int().min(1).max(30),
  })
  .strict();

export const publicAvailabilityResponseSchema = z.object({
  date: localDateSchema,
  timezone: z.string().min(1),
  slots: z.array(
    z.object({
      time: localTimeSchema,
      available: z.boolean(),
      remainingCapacity: z.number().int().nonnegative(),
    }),
  ),
});

export const publicBookingEstablishmentSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  locale: z.string().min(1),
  timezone: z.string().min(1),
  logoUrl: z.string().url().nullable(),
  coverImageUrl: z.string().url().nullable(),
  publicPhone: z.string().nullable(),
  publicEmail: z.string().email().nullable(),
  address: z.string().nullable(),
  welcomeMessage: z.string().nullable(),
  bookingPolicy: z.string().nullable(),
  minimumPartySize: z.number().int().positive(),
  maximumPartySize: z.number().int().positive(),
});

export const createPublicReservationInputSchema = z
  .object({
    date: localDateSchema,
    time: localTimeSchema,
    partySize: z.number().int().min(1).max(30),
    guest: z
      .object({
        firstName: z.string().trim().min(1).max(100),
        lastName: z.string().trim().min(1).max(100),
        email: z.string().trim().email().max(254),
        phone: z.string().trim().min(6).max(30),
      })
      .strict(),
    specialRequirements: z.string().trim().max(1000).optional(),
    source: reservationSourceSchema.default('DIRECT'),
    marketingConsent: z.boolean().default(false),
    policyAccepted: z.literal(true),
    idempotencyKey: z.string().min(16).max(200),
  })
  .strict();

/** @deprecated Use createPublicReservationInputSchema at the public boundary. */
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

export const publicReservationSchema = z.object({
  reference: z.string().min(1),
  establishmentName: z.string().min(1),
  establishmentSlug: z.string().min(1),
  date: localDateSchema,
  time: localTimeSchema,
  timezone: z.string().min(1),
  partySize: z.number().int().positive(),
  status: reservationStatusSchema,
  guestFirstName: z.string().min(1),
  cancellable: z.boolean(),
});

export const createPublicReservationResponseSchema = z.object({
  reservation: publicReservationSchema,
  publicToken: z.string().min(32),
});

export const bookingSettingsInputSchema = z
  .object({
    enabled: z.boolean(),
    confirmationMode: confirmationModeSchema,
    minimumPartySize: z.number().int().min(1).max(30),
    maximumPartySize: z.number().int().min(1).max(100),
    slotIntervalMinutes: z.number().int().min(5).max(120),
    averageDurationMinutes: z.number().int().min(15).max(720),
    minimumNoticeMinutes: z.number().int().min(0).max(525600),
    bookingWindowDays: z.number().int().min(0).max(730),
    cancellationDeadlineMinutes: z.number().int().min(0).max(525600),
    welcomeMessage: z.string().trim().max(1000).nullable(),
    bookingPolicy: z.string().trim().max(4000).nullable(),
  })
  .strict()
  .refine((value) => value.maximumPartySize >= value.minimumPartySize, {
    message: 'Maximum party size must be at least the minimum party size.',
    path: ['maximumPartySize'],
  });

export const bookingServicePeriodInputSchema = z
  .object({
    dayOfWeek: z.number().int().min(0).max(6),
    name: z.string().trim().min(1).max(100),
    startTime: localTimeSchema,
    endTime: localTimeSchema,
    capacity: z.number().int().min(1).max(10000),
    enabled: z.boolean(),
  })
  .strict()
  .refine((value) => value.endTime > value.startTime, {
    message: 'Overnight service periods are not supported.',
    path: ['endTime'],
  });

export const bookingExceptionInputSchema = z
  .object({
    date: localDateSchema,
    kind: bookingExceptionKindSchema,
    servicePeriodId: z.string().uuid().nullable(),
    startTime: localTimeSchema.nullable(),
    endTime: localTimeSchema.nullable(),
    capacityOverride: z.number().int().min(0).max(10000).nullable(),
    reason: z.string().trim().max(500).nullable(),
  })
  .strict()
  .superRefine((value, context) => {
    const addIssue = (path: string, message: string) =>
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: [path],
        message,
      });

    if (value.kind === 'CLOSED_SERVICE' && !value.servicePeriodId) {
      addIssue(
        'servicePeriodId',
        'A service period is required for a service closure.',
      );
    }

    if (
      (value.kind === 'MODIFIED_HOURS' || value.kind === 'BLOCKED_SLOT') &&
      (!value.startTime || !value.endTime)
    ) {
      if (!value.startTime) addIssue('startTime', 'A start time is required.');
      if (!value.endTime) addIssue('endTime', 'An end time is required.');
    }

    if (value.startTime && value.endTime && value.endTime <= value.startTime) {
      addIssue('endTime', 'The end time must be after the start time.');
    }

    if (
      value.kind === 'CLOSED_ALL_DAY' &&
      (value.servicePeriodId ||
        value.startTime ||
        value.endTime ||
        value.capacityOverride !== null)
    ) {
      addIssue(
        'kind',
        'An all-day closure cannot target a service, time range, or capacity.',
      );
    }
  });

export const manualReservationInputSchema = createPublicReservationInputSchema
  .omit({ policyAccepted: true, idempotencyKey: true })
  .extend({ status: z.enum(['PENDING', 'CONFIRMED']).default('CONFIRMED') });

export const updateReservationStatusInputSchema = z
  .object({
    reservationId: z.string().uuid(),
    status: reservationStatusSchema,
    reason: z.string().trim().max(500).optional(),
  })
  .strict();

export const updateReservationDetailsInputSchema = z
  .object({
    reservationId: z.string().uuid(),
    date: localDateSchema,
    time: localTimeSchema,
    partySize: z.number().int().min(1).max(100),
    guestFirstName: z.string().trim().min(1).max(100),
    guestLastName: z.string().trim().min(1).max(100),
    guestEmail: z.string().trim().email().max(254),
    guestPhone: z.string().trim().min(6).max(30),
    specialRequirements: z.string().trim().max(1000).nullable(),
  })
  .strict();

export const bookingApiErrorSchema = z.object({
  error: z.object({
    code: z.string().min(1),
    message: z.string().min(1),
  }),
});

export type ReservationStatus = z.infer<typeof reservationStatusSchema>;
export type ReservationSource = z.infer<typeof reservationSourceSchema>;
export type CreatePublicReservationInput = z.infer<
  typeof createPublicReservationInputSchema
>;
export type BookingSettingsInput = z.infer<typeof bookingSettingsInputSchema>;
export type BookingServicePeriodInput = z.infer<
  typeof bookingServicePeriodInputSchema
>;
export type BookingExceptionInput = z.infer<typeof bookingExceptionInputSchema>;
