import { z } from 'zod';

export const establishmentServiceModeSchema = z.enum([
  'DINE_IN',
  'TAKEAWAY',
  'RESERVATION',
  'DELIVERY',
  'CLICK_AND_COLLECT',
  'PRIVATE_EVENTS',
  'CATERING',
]);
export type EstablishmentServiceMode = z.infer<
  typeof establishmentServiceModeSchema
>;

const nullableText = (maximum: number) =>
  z.string().trim().max(maximum).nullable();
const nullableUrl = z
  .string()
  .trim()
  .url()
  .max(2048)
  .refine((value) => ['http:', 'https:'].includes(new URL(value).protocol))
  .nullable();

export const establishmentProfileInputSchema = z
  .object({
    name: z.string().trim().min(1).max(255),
    description: nullableText(1000),
    addressLine1: nullableText(255),
    addressLine2: nullableText(255),
    postalCode: nullableText(32),
    city: nullableText(120),
    countryCode: z
      .string()
      .trim()
      .length(2)
      .regex(/^[A-Za-z]{2}$/)
      .transform((value) => value.toUpperCase())
      .nullable(),
    phone: nullableText(30),
    email: z.string().trim().email().max(254).nullable(),
    website: nullableUrl,
    publicPhone: nullableText(30),
    publicEmail: z.string().trim().email().max(254).nullable(),
    logoUrl: nullableUrl,
    coverImageUrl: nullableUrl,
    languages: z
      .array(
        z
          .string()
          .trim()
          .min(2)
          .max(35)
          .regex(/^[A-Za-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/),
      )
      .max(20)
      .transform((values) => [...new Set(values)]),
    serviceModes: z.array(establishmentServiceModeSchema).max(7),
    publicDescription: z.boolean(),
    publicAddress: z.boolean(),
    publicPhoneVisible: z.boolean(),
    publicEmailVisible: z.boolean(),
    publicWebsite: z.boolean(),
    publicLanguages: z.boolean(),
    publicServiceModes: z.boolean(),
  })
  .strict();

export type EstablishmentProfileInput = z.infer<
  typeof establishmentProfileInputSchema
>;
