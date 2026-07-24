import { z } from 'zod';
import {
  establishmentIdSchema,
  identifierSchema,
  organizationIdSchema,
} from '../common';

export const feedbackStatusValues = [
  'NEW',
  'TO_PROCESS',
  'DRAFTED',
  'REPLIED',
  'FOLLOW_UP',
  'RESOLVED',
  'ARCHIVED',
  'SPAM',
] as const;
export const feedbackStatusSchema = z.enum(feedbackStatusValues);
export type FeedbackStatus = z.infer<typeof feedbackStatusSchema>;

export const feedbackSourceValues = ['GOOGLE', 'DIRECT'] as const;
export const feedbackSourceSchema = z.enum(feedbackSourceValues);
export type FeedbackSource = z.infer<typeof feedbackSourceSchema>;

export const feedbackTypeValues = [
  'PUBLIC_REVIEW',
  'DIRECT_FEEDBACK',
] as const;
export const feedbackTypeSchema = z.enum(feedbackTypeValues);
export type FeedbackType = z.infer<typeof feedbackTypeSchema>;

export const feedbackSentimentValues = [
  'POSITIVE',
  'NEUTRAL',
  'NEGATIVE',
] as const;
export const feedbackSentimentSchema = z.enum(feedbackSentimentValues);
export type FeedbackSentiment = z.infer<typeof feedbackSentimentSchema>;

export const feedbackUrgencyValues = [
  'LOW',
  'MEDIUM',
  'HIGH',
  'CRITICAL',
] as const;
export const feedbackUrgencySchema = z.enum(feedbackUrgencyValues);
export type FeedbackUrgency = z.infer<typeof feedbackUrgencySchema>;

export const feedbackTopicValues = [
  'FOOD_QUALITY',
  'WAITING_TIME',
  'WELCOME',
  'SERVICE',
  'CLEANLINESS',
  'PRICE',
  'PORTION_SIZE',
  'ORDER_ACCURACY',
  'ONLINE_ORDER',
  'DELIVERY',
  'AMBIENCE',
  'ALLERGEN',
  'STAFF_BEHAVIOUR',
  'OTHER',
] as const;
export const feedbackTopicSchema = z.enum(feedbackTopicValues);
export type FeedbackTopic = z.infer<typeof feedbackTopicSchema>;

export const feedbackToneValues = [
  'DEFAULT',
  'WARMER',
  'PROFESSIONAL',
  'SHORTER',
  'EMPATHETIC',
  'LIGHTER',
  'APOLOGETIC',
  'SOLUTION_ORIENTED',
] as const;
export const feedbackToneSchema = z.enum(feedbackToneValues);

export const servicePeriodValues = ['LUNCH', 'DINNER', 'OTHER'] as const;
export const servicePeriodSchema = z.enum(servicePeriodValues);

export const feedbackAnalysisSchema = z.object({
  sentiment: feedbackSentimentSchema,
  urgency: feedbackUrgencySchema,
  summary: z.string().trim().min(1).max(500),
  topics: z.array(feedbackTopicSchema).max(8),
  suggestedAction: z.string().trim().max(500).nullable(),
  requiresFollowUp: z.boolean(),
  requiresManagerAttention: z.boolean(),
  confidence: z.number().min(0).max(1).nullable(),
});
export type FeedbackAnalysisOutput = z.infer<typeof feedbackAnalysisSchema>;

export const publicFeedbackSubmissionSchema = z
  .object({
    rating: z.coerce.number().int().min(1).max(5),
    topics: z.array(feedbackTopicSchema).max(8).default([]),
    comment: z.string().trim().max(4_000).optional().default(''),
    customerName: z.string().trim().max(255).optional().default(''),
    customerEmail: z
      .union([z.string().trim().email().max(320), z.literal('')])
      .optional()
      .default(''),
    customerPhone: z.string().trim().max(40).optional().default(''),
    consentToContact: z.boolean().default(false),
    orderReference: z.string().trim().max(100).optional().default(''),
    visitDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date.')
      .optional(),
    servicePeriod: servicePeriodSchema.nullable().optional(),
    sourceTag: z
      .enum(['table', 'receipt', 'counter', 'click_collect', 'email', 'other'])
      .optional(),
    website: z.string().max(255).optional().default(''),
  })
  .superRefine((value, context) => {
    const hasContact = Boolean(value.customerEmail || value.customerPhone);
    if (hasContact && !value.consentToContact) {
      context.addIssue({
        code: 'custom',
        path: ['consentToContact'],
        message:
          'Le consentement est obligatoire lorsque des coordonnées sont fournies.',
      });
    }
  });
export type PublicFeedbackSubmission = z.infer<
  typeof publicFeedbackSubmissionSchema
>;

export const publicFeedbackResponseSchema = z.object({
  feedbackId: identifierSchema,
  status: z.literal('received'),
});
export type PublicFeedbackResponse = z.infer<
  typeof publicFeedbackResponseSchema
>;

export const feedbackListQuerySchema = z.object({
  source: feedbackSourceSchema.optional(),
  status: feedbackStatusSchema.optional(),
  rating: z.coerce.number().int().min(1).max(5).optional(),
  sentiment: feedbackSentimentSchema.optional(),
  urgency: feedbackUrgencySchema.optional(),
  hasIncident: z.coerce.boolean().optional(),
  assignedTo: identifierSchema.optional(),
  search: z.string().trim().max(200).optional(),
  sort: z
    .enum([
      'newest',
      'oldest',
      'rating_asc',
      'rating_desc',
      'urgency_desc',
      'unanswered',
    ])
    .default('newest'),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
});
export type FeedbackListQuery = z.infer<typeof feedbackListQuerySchema>;

export const feedbackScopeSchema = z.object({
  organizationId: organizationIdSchema,
  establishmentId: establishmentIdSchema,
});

export const updateFeedbackSchema = z
  .object({
    status: feedbackStatusSchema.optional(),
    assignedToUserId: identifierSchema.nullable().optional(),
  })
  .refine(
    (value) =>
      value.status !== undefined || value.assignedToUserId !== undefined,
    'At least one field is required.',
  );

export const generateReplySchema = z.object({
  tone: feedbackToneSchema.optional().default('DEFAULT'),
  language: z.string().trim().min(2).max(35).optional().default('fr'),
  instructions: z.string().trim().max(1_000).optional(),
});

export const saveReplySchema = z.object({
  content: z.string().trim().min(1).max(4_000),
});

export const incidentPriorityValues = [
  'LOW',
  'MEDIUM',
  'HIGH',
  'CRITICAL',
] as const;
export const incidentPrioritySchema = z.enum(incidentPriorityValues);

export const incidentStatusValues = [
  'OPEN',
  'IN_PROGRESS',
  'RESOLVED',
  'CLOSED',
] as const;
export const incidentStatusSchema = z.enum(incidentStatusValues);

export const createIncidentSchema = z.object({
  feedbackItemId: identifierSchema,
  category: z.string().trim().min(1).max(100),
  priority: incidentPrioritySchema,
  ownerUserId: identifierSchema.nullable().optional(),
  title: z.string().trim().min(1).max(255),
  description: z.string().trim().max(4_000).nullable().optional(),
  internalNotes: z.string().trim().max(4_000).nullable().optional(),
  dueAt: z.string().datetime().nullable().optional(),
});
