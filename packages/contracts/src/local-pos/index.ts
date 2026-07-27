import { z } from 'zod';
import { identifierSchema, isoDateTimeSchema } from '../common';

export const localPosApiVersion = 'v1' as const;
export const localPosApiBasePath = `/api/${localPosApiVersion}` as const;
export const uuidV7Schema = identifierSchema.refine(
  (value) => value[14]?.toLowerCase() === '7',
  'Expected a UUIDv7 value.',
);

export const localPosRoutes = {
  health: '/health',
  localUsers: `${localPosApiBasePath}/local-users`,
  catalog: `${localPosApiBasePath}/catalog`,
  orders: `${localPosApiBasePath}/orders`,
  orderItems: `${localPosApiBasePath}/order-items`,
  payments: `${localPosApiBasePath}/payments`,
  printJobs: `${localPosApiBasePath}/print-jobs`,
} as const;

export const siteAgentHealthResponseSchema = z
  .object({
    status: z.enum(['ok', 'degraded']),
    database: z.enum(['ready', 'unavailable']),
    service: z.literal('site-agent'),
    apiVersion: z.literal(localPosApiVersion),
    checkedAt: isoDateTimeSchema,
  })
  .strict();

export const localUserRoleSchema = z.enum([
  'admin',
  'manager',
  'staff',
  'kitchen',
]);

export const localUserSchema = z
  .object({
    id: identifierSchema,
    name: z.string().min(1),
    email: z.string().email().nullable(),
    role: localUserRoleSchema,
    isActive: z.boolean(),
  })
  .strict();

export const localUsersResponseSchema = z
  .object({ users: z.array(localUserSchema) })
  .strict();

export const kitchenStationSchema = z.enum([
  'kitchen',
  'bar',
  'dessert',
  'none',
]);

export const localCatalogItemSchema = z
  .object({
    id: identifierSchema,
    categoryId: identifierSchema,
    name: z.string().min(1),
    description: z.string().nullable(),
    priceCents: z.number().int().nonnegative(),
    kitchenStation: kitchenStationSchema,
    isAvailable: z.boolean(),
    sortOrder: z.number().int(),
  })
  .strict();

export const localCatalogCategorySchema = z
  .object({
    id: identifierSchema,
    name: z.string().min(1),
    sortOrder: z.number().int(),
    isActive: z.boolean(),
    items: z.array(localCatalogItemSchema),
  })
  .strict();

export const comboPricingModeSchema = z.enum(['fixed', 'base_item_plus_delta']);
export const localComboRuleGroupItemSchema = z
  .object({
    id: identifierSchema,
    menuItemId: identifierSchema,
    extraPriceCents: z.number().int().nonnegative(),
  })
  .strict();
export const localComboRuleGroupSchema = z
  .object({
    id: identifierSchema,
    name: z.string().min(1),
    minQuantity: z.number().int().nonnegative(),
    maxQuantity: z.number().int().nonnegative(),
    sortOrder: z.number().int(),
    items: z.array(localComboRuleGroupItemSchema),
  })
  .strict();
export const localComboRuleSchema = z
  .object({
    id: identifierSchema,
    name: z.string().min(1),
    pricingMode: comboPricingModeSchema,
    comboPriceCents: z.number().int().nonnegative(),
    priceDeltaCents: z.number().int(),
    basePricingGroupName: z.string().nullable(),
    priority: z.number().int(),
    maxApplications: z.number().int().positive().nullable(),
    isActive: z.boolean(),
    groups: z.array(localComboRuleGroupSchema),
  })
  .strict();

export const localCatalogResponseSchema = z
  .object({
    categories: z.array(localCatalogCategorySchema),
    comboRules: z.array(localComboRuleSchema),
  })
  .strict();

export const localOrderTypeSchema = z.enum(['dine_in', 'takeaway', 'delivery']);
export const localOrderStatusSchema = z.enum([
  'draft',
  'sent',
  'preparing',
  'ready',
  'served',
  'paid',
  'cancelled',
]);
export const localOrderItemStatusSchema = z.enum([
  'pending',
  'sent',
  'preparing',
  'ready',
  'served',
  'cancelled',
]);
export const localPaymentModeSchema = z.enum([
  'single',
  'split_by_items',
  'split_equally',
]);
export const allergySeveritySchema = z.enum([
  'intolerance',
  'allergy',
  'severe_no_traces',
]);

export const createLocalOrderInputSchema = z
  .object({
    tableLabel: z.string().trim().min(1).max(255),
    orderType: localOrderTypeSchema,
    staffUserId: identifierSchema,
    note: z.string().trim().max(2000).optional(),
  })
  .strict();

export const localOrderSummarySchema = z
  .object({
    id: identifierSchema,
    orderNumber: z.string().min(1),
    tableLabel: z.string().min(1),
    orderType: localOrderTypeSchema,
    status: localOrderStatusSchema,
    subtotalCents: z.number().int().nonnegative(),
    discountCents: z.number().int().nonnegative(),
    totalCents: z.number().int().nonnegative(),
    paymentMode: localPaymentModeSchema,
    note: z.string().nullable(),
    hasAllergy: z.boolean(),
    allergyNote: z.string().nullable(),
    allergyAcknowledgedAt: isoDateTimeSchema.nullable(),
    createdBy: identifierSchema,
    sentAt: isoDateTimeSchema.nullable(),
    paidAt: isoDateTimeSchema.nullable(),
    cancelledAt: isoDateTimeSchema.nullable(),
    cancelledReason: z.string().nullable(),
    createdAt: isoDateTimeSchema,
    updatedAt: isoDateTimeSchema,
  })
  .strict();

export const localOrdersQuerySchema = z
  .object({
    status: localOrderStatusSchema.optional(),
    limit: z.coerce.number().int().min(1).max(200).default(50),
  })
  .strict();

export const localOrdersResponseSchema = z
  .object({ orders: z.array(localOrderSummarySchema) })
  .strict();

export const localOrderResponseSchema = z
  .object({ order: localOrderSummarySchema })
  .strict();

export const selectedInstructionSnapshotSchema = z
  .object({
    instructionId: z.string().min(1),
    code: z.string().min(1),
    labelSnapshot: z.string().min(1),
  })
  .strict();
export const itemVariantSnapshotSchema = z
  .object({
    code: z.string().min(1),
    labelSnapshot: z.string().min(1),
    quantity: z.number().int().positive(),
  })
  .strict();
export const localOrderItemSchema = z
  .object({
    id: identifierSchema,
    orderId: identifierSchema,
    menuItemId: identifierSchema,
    itemNameSnapshot: z.string().min(1),
    unitPriceCentsSnapshot: z.number().int().nonnegative(),
    kitchenStationSnapshot: kitchenStationSchema,
    quantity: z.number().int().positive(),
    note: z.string().nullable(),
    quickInstructions: z.array(selectedInstructionSnapshotSchema),
    selectedVariants: z.array(itemVariantSnapshotSchema),
    hasAllergy: z.boolean(),
    allergenCodes: z.array(z.string()),
    allergySeverity: allergySeveritySchema.nullable(),
    allergyNote: z.string().nullable(),
    allergyAcknowledgedAt: isoDateTimeSchema.nullable(),
    allergyKitchenConfirmedAt: isoDateTimeSchema.nullable(),
    status: localOrderItemStatusSchema,
    sentAt: isoDateTimeSchema.nullable(),
    readyAt: isoDateTimeSchema.nullable(),
    servedAt: isoDateTimeSchema.nullable(),
    cancelledAt: isoDateTimeSchema.nullable(),
    cancelledReason: z.string().nullable(),
    createdAt: isoDateTimeSchema,
    updatedAt: isoDateTimeSchema,
  })
  .strict();
export const localOrderDiscountItemSchema = z
  .object({
    quantityApplied: z.number().int().positive(),
    orderItem: z
      .object({
        id: identifierSchema,
        itemNameSnapshot: z.string().min(1),
      })
      .strict(),
  })
  .strict();
export const localOrderDiscountSchema = z
  .object({
    id: identifierSchema,
    nameSnapshot: z.string().min(1),
    discountCents: z.number().int().nonnegative(),
    items: z.array(localOrderDiscountItemSchema),
  })
  .strict();
export const localOrderDetailResponseSchema = z
  .object({
    order: localOrderSummarySchema,
    items: z.array(localOrderItemSchema),
    discounts: z.array(localOrderDiscountSchema),
  })
  .strict();
export const localOrderItemResponseSchema = z
  .object({ item: localOrderItemSchema })
  .strict();

export const addLocalOrderItemInputSchema = z
  .object({
    menuItemId: identifierSchema,
    quantity: z.number().int().positive().default(1),
    note: z.string().trim().max(2000).optional(),
  })
  .strict();

export const updateLocalOrderItemInputSchema = z
  .object({
    quantity: z.number().int().positive().optional(),
    note: z.string().trim().max(300).nullable().optional(),
    selectedInstructionCodes: z
      .array(z.string().trim().min(1))
      .max(20)
      .optional(),
    selectedVariants: z
      .array(
        z
          .object({
            code: z.string().trim().min(1),
            quantity: z.number().int().nonnegative(),
          })
          .strict(),
      )
      .max(20)
      .optional(),
    hasAllergy: z.boolean().optional(),
    allergenCodes: z.array(z.string().trim().min(1)).max(20).optional(),
    allergySeverity: allergySeveritySchema.nullable().optional(),
    allergyNote: z.string().trim().max(300).nullable().optional(),
  })
  .strict()
  .refine((values) => Object.keys(values).length > 0, {
    message: 'At least one order-item field is required.',
  });

export const localOrderItemCommandSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('remove_pending') }).strict(),
  z
    .object({
      action: z.literal('cancel'),
      reason: z.string().trim().max(2000).optional(),
    })
    .strict(),
  z.object({ action: z.literal('restore') }).strict(),
  z.object({ action: z.literal('mark_sent') }).strict(),
  z.object({ action: z.literal('mark_preparing') }).strict(),
  z.object({ action: z.literal('mark_ready') }).strict(),
  z
    .object({
      action: z.literal('confirm_allergy'),
      staffUserId: identifierSchema,
    })
    .strict(),
]);

export const localOrderCommandSchema = z.discriminatedUnion('action', [
  z
    .object({
      action: z.literal('cancel'),
      reason: z.string().trim().max(2000).optional(),
    })
    .strict(),
  z
    .object({
      action: z.literal('send_to_kitchen'),
      idempotencyKey: uuidV7Schema,
      allergyAcknowledged: z.boolean().default(false),
      staffUserId: identifierSchema,
    })
    .strict(),
]);

export const paymentMethodSchema = z.enum([
  'cash',
  'card',
  'ticket_resto',
  'other',
]);

const paymentCaptureFields = {
  method: paymentMethodSchema,
  amountCents: z.number().int().positive(),
  tenderedCents: z.number().int().positive().optional(),
  tipCents: z.number().int().nonnegative().optional(),
  staffUserId: identifierSchema,
  idempotencyKey: uuidV7Schema,
};

export const payLocalOrderInputSchema = z.object(paymentCaptureFields).strict();
export const payLocalCheckInputSchema = z
  .object({ checkId: identifierSchema, ...paymentCaptureFields })
  .strict();

export const splitLocalOrderEquallyInputSchema = z
  .object({ parts: z.number().int().min(2).max(99) })
  .strict();

export const splitCheckItemSchema = z
  .object({
    orderItemId: identifierSchema,
    quantity: z.number().int().positive(),
  })
  .strict();
export const createLocalChecksByItemsInputSchema = z
  .object({
    checks: z
      .array(
        z
          .object({
            checkLabel: z.string().trim().min(1).max(255),
            items: z.array(splitCheckItemSchema).min(1),
          })
          .strict(),
      )
      .min(1),
  })
  .strict();

export const localCheckStatusSchema = z.enum(['open', 'paid', 'void']);
export const localCheckItemSchema = z
  .object({
    id: identifierSchema,
    quantity: z.number().int().positive(),
    amountCentsSnapshot: z.number().int().nonnegative(),
    orderItem: z
      .object({
        id: identifierSchema,
        itemNameSnapshot: z.string().min(1),
        unitPriceCentsSnapshot: z.number().int().nonnegative(),
      })
      .strict(),
  })
  .strict();
export const localCheckDiscountItemSchema = z
  .object({
    quantityApplied: z.number().int().positive(),
    checkItem: z
      .object({
        id: identifierSchema,
        orderItem: z
          .object({
            id: identifierSchema,
            itemNameSnapshot: z.string().min(1),
          })
          .strict(),
      })
      .strict(),
  })
  .strict();
export const localCheckDiscountSchema = z
  .object({
    id: identifierSchema,
    nameSnapshot: z.string().min(1),
    discountCents: z.number().int().nonnegative(),
    items: z.array(localCheckDiscountItemSchema),
  })
  .strict();
export const localCheckSchema = z
  .object({
    id: identifierSchema,
    orderId: identifierSchema,
    checkLabel: z.string().min(1),
    splitMode: z.enum(['items', 'equal']),
    status: localCheckStatusSchema,
    subtotalCents: z.number().int().nonnegative(),
    discountCents: z.number().int().nonnegative(),
    totalCents: z.number().int().nonnegative(),
    items: z.array(localCheckItemSchema),
    discounts: z.array(localCheckDiscountSchema),
    createdAt: isoDateTimeSchema,
  })
  .strict();
export const localChecksResponseSchema = z
  .object({ checks: z.array(localCheckSchema) })
  .strict();

export const localPaymentStatusSchema = z.enum([
  'pending',
  'paid',
  'refunded',
  'failed',
]);
export const localPaymentSchema = z
  .object({
    id: identifierSchema,
    orderId: identifierSchema,
    checkId: identifierSchema.nullable(),
    method: paymentMethodSchema,
    amountCents: z.number().int().positive(),
    tenderedCents: z.number().int().nonnegative().nullable(),
    changeCents: z.number().int().nonnegative().nullable(),
    tipCents: z.number().int().nonnegative(),
    status: localPaymentStatusSchema,
    paidBy: z.string().nullable(),
    paidAt: isoDateTimeSchema.nullable(),
    createdAt: isoDateTimeSchema,
  })
  .strict();

export const printJobTypeSchema = z.enum([
  'kitchen_ticket',
  'customer_receipt',
]);
export const printJobStatusSchema = z.enum([
  'pending',
  'printing',
  'printed',
  'failed',
]);
export const printJobsQuerySchema = z
  .object({
    status: printJobStatusSchema.optional(),
    limit: z.coerce.number().int().min(1).max(200).default(50),
  })
  .strict();
export const createPrintJobInputSchema = z
  .object({
    type: printJobTypeSchema,
    orderId: identifierSchema,
    orderItemIds: z.array(identifierSchema).optional(),
    checkId: identifierSchema.optional(),
    paymentId: identifierSchema.optional(),
    idempotencyKey: uuidV7Schema.optional(),
  })
  .strict();
export const localPrintJobSchema = z
  .object({
    id: identifierSchema,
    orderId: identifierSchema.nullable(),
    checkId: identifierSchema.nullable(),
    paymentId: identifierSchema.nullable(),
    type: printJobTypeSchema,
    status: printJobStatusSchema,
    printerName: z.string().min(1),
    errorMessage: z.string().nullable(),
    createdAt: isoDateTimeSchema,
    printedAt: isoDateTimeSchema.nullable(),
  })
  .strict();
export const localKitchenSendResponseSchema = z
  .object({
    order: localOrderSummarySchema,
    items: z.array(localOrderItemSchema),
    discounts: z.array(localOrderDiscountSchema),
    printJob: localPrintJobSchema,
    replayed: z.boolean(),
  })
  .strict();
export const localPaymentCaptureResponseSchema = z
  .object({
    payment: localPaymentSchema,
    printJob: localPrintJobSchema.nullable(),
    replayed: z.boolean(),
  })
  .strict();
export const localPaymentSummaryResponseSchema = z
  .object({
    order: localOrderSummarySchema,
    checks: z.array(localCheckSchema),
    payments: z.array(localPaymentSchema),
    paidCents: z.number().int().nonnegative(),
    remainingCents: z.number().int().nonnegative(),
  })
  .strict();
export const localPrintJobsResponseSchema = z
  .object({ printJobs: z.array(localPrintJobSchema) })
  .strict();
export const printJobCommandSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('mark_printing') }).strict(),
  z.object({ action: z.literal('mark_printed') }).strict(),
  z
    .object({
      action: z.literal('mark_failed'),
      errorMessage: z.string().trim().min(1).max(2000),
    })
    .strict(),
  z.object({ action: z.literal('retry') }).strict(),
]);

export type SiteAgentHealthResponse = z.infer<
  typeof siteAgentHealthResponseSchema
>;
export type LocalUser = z.infer<typeof localUserSchema>;
export type LocalCatalogResponse = z.infer<typeof localCatalogResponseSchema>;
export type CreateLocalOrderInput = z.infer<typeof createLocalOrderInputSchema>;
export type LocalOrderSummary = z.infer<typeof localOrderSummarySchema>;
export type LocalOrdersQuery = z.infer<typeof localOrdersQuerySchema>;
export type AddLocalOrderItemInput = z.infer<
  typeof addLocalOrderItemInputSchema
>;
export type UpdateLocalOrderItemInput = z.infer<
  typeof updateLocalOrderItemInputSchema
>;
export type LocalOrderItemCommand = z.infer<typeof localOrderItemCommandSchema>;
export type LocalOrderCommand = z.infer<typeof localOrderCommandSchema>;
export type PayLocalOrderInput = z.infer<typeof payLocalOrderInputSchema>;
export type PayLocalCheckInput = z.infer<typeof payLocalCheckInputSchema>;
export type CreateLocalChecksByItemsInput = z.infer<
  typeof createLocalChecksByItemsInputSchema
>;
export type CreatePrintJobInput = z.infer<typeof createPrintJobInputSchema>;
export type PrintJobsQuery = z.infer<typeof printJobsQuerySchema>;
export type PrintJobCommand = z.infer<typeof printJobCommandSchema>;
