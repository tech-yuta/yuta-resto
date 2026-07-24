import { relations, sql } from 'drizzle-orm';
import {
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  real,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { establishments, organizations } from './tenant';

export const feedbackSourceEnum = pgEnum('feedback_source', [
  'GOOGLE',
  'DIRECT',
]);
export const feedbackTypeEnum = pgEnum('feedback_type', [
  'PUBLIC_REVIEW',
  'DIRECT_FEEDBACK',
]);
export const feedbackSentimentEnum = pgEnum('feedback_sentiment', [
  'POSITIVE',
  'NEUTRAL',
  'NEGATIVE',
]);
export const feedbackUrgencyEnum = pgEnum('feedback_urgency', [
  'LOW',
  'MEDIUM',
  'HIGH',
  'CRITICAL',
]);
export const feedbackStatusEnum = pgEnum('feedback_status', [
  'NEW',
  'TO_PROCESS',
  'DRAFTED',
  'REPLIED',
  'FOLLOW_UP',
  'RESOLVED',
  'ARCHIVED',
  'SPAM',
]);
export const feedbackReplyStatusEnum = pgEnum('feedback_reply_status', [
  'AI_SUGGESTION',
  'DRAFT',
  'READY',
  'PUBLISHING',
  'PUBLISHED',
  'FAILED',
  'DELETED',
]);
export const servicePeriodEnum = pgEnum('feedback_service_period', [
  'LUNCH',
  'DINNER',
  'OTHER',
]);
export const incidentPriorityEnum = pgEnum('feedback_incident_priority', [
  'LOW',
  'MEDIUM',
  'HIGH',
  'CRITICAL',
]);
export const incidentStatusEnum = pgEnum('feedback_incident_status', [
  'OPEN',
  'IN_PROGRESS',
  'RESOLVED',
  'CLOSED',
]);
export const connectorProviderEnum = pgEnum('reputation_connector_provider', [
  'GOOGLE',
]);
export const connectorStatusEnum = pgEnum('reputation_connector_status', [
  'DISCONNECTED',
  'CONNECTING',
  'CONNECTED',
  'SYNCING',
  'ERROR',
  'AUTH_EXPIRED',
]);
export const auditEntityTypeEnum = pgEnum('reputation_audit_entity_type', [
  'FEEDBACK',
  'REPLY',
  'INCIDENT',
  'CONNECTOR',
  'SETTINGS',
]);

const createdAt = () =>
  timestamp('created_at', { withTimezone: true }).defaultNow().notNull();
const updatedAt = () =>
  timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull()
    .$onUpdateFn(() => new Date());

export const feedbackItems = pgTable(
  'feedback_items',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id),
    establishmentId: uuid('establishment_id')
      .notNull()
      .references(() => establishments.id),
    source: feedbackSourceEnum('source').notNull(),
    type: feedbackTypeEnum('type').notNull(),
    externalId: varchar('external_id', { length: 255 }),
    externalUrl: text('external_url'),
    authorName: varchar('author_name', { length: 255 }),
    authorAvatarUrl: text('author_avatar_url'),
    rating: integer('rating'),
    title: varchar('title', { length: 500 }),
    content: text('content'),
    language: varchar('language', { length: 35 }),
    sentiment: feedbackSentimentEnum('sentiment'),
    urgency: feedbackUrgencyEnum('urgency'),
    status: feedbackStatusEnum('status').default('NEW').notNull(),
    assignedToUserId: uuid('assigned_to_user_id'),
    publishedAt: timestamp('published_at', { withTimezone: true }),
    receivedAt: timestamp('received_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    lastSyncedAt: timestamp('last_synced_at', { withTimezone: true }),
    providerMetadata: jsonb('provider_metadata').$type<
      Record<string, unknown>
    >(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    check(
      'feedback_items_rating_check',
      sql`${table.rating} is null or (${table.rating} >= 1 and ${table.rating} <= 5)`,
    ),
    uniqueIndex('feedback_items_provider_external_unique_idx').on(
      table.organizationId,
      table.source,
      table.externalId,
    ),
    index('feedback_items_organization_id_idx').on(table.organizationId),
    index('feedback_items_establishment_id_idx').on(table.establishmentId),
    index('feedback_items_source_idx').on(table.source),
    index('feedback_items_status_idx').on(table.status),
    index('feedback_items_rating_idx').on(table.rating),
    index('feedback_items_sentiment_idx').on(table.sentiment),
    index('feedback_items_urgency_idx').on(table.urgency),
    index('feedback_items_published_at_idx').on(table.publishedAt),
    index('feedback_items_received_at_idx').on(table.receivedAt),
    index('feedback_items_assigned_to_user_id_idx').on(
      table.assignedToUserId,
    ),
    index('feedback_items_tenant_inbox_idx').on(
      table.organizationId,
      table.establishmentId,
      table.receivedAt,
    ),
  ],
);

export const feedbackReplies = pgTable(
  'feedback_replies',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id),
    feedbackItemId: uuid('feedback_item_id')
      .notNull()
      .references(() => feedbackItems.id, { onDelete: 'cascade' }),
    content: text('content').notNull(),
    status: feedbackReplyStatusEnum('status').default('DRAFT').notNull(),
    externalReplyId: varchar('external_reply_id', { length: 255 }),
    externalReplyStatus: varchar('external_reply_status', { length: 100 }),
    generatedByAi: boolean('generated_by_ai').default(false).notNull(),
    originalAiContent: text('original_ai_content'),
    createdByUserId: uuid('created_by_user_id'),
    editedByUserId: uuid('edited_by_user_id'),
    approvedByUserId: uuid('approved_by_user_id'),
    publishedByUserId: uuid('published_by_user_id'),
    publishedAt: timestamp('published_at', { withTimezone: true }),
    failedAt: timestamp('failed_at', { withTimezone: true }),
    errorCode: varchar('error_code', { length: 100 }),
    errorMessage: text('error_message'),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    index('feedback_replies_organization_id_idx').on(table.organizationId),
    index('feedback_replies_feedback_item_id_idx').on(table.feedbackItemId),
    index('feedback_replies_status_idx').on(table.status),
  ],
);

export const feedbackAnalyses = pgTable(
  'feedback_analyses',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id),
    feedbackItemId: uuid('feedback_item_id')
      .notNull()
      .references(() => feedbackItems.id, { onDelete: 'cascade' }),
    sentiment: feedbackSentimentEnum('sentiment').notNull(),
    urgency: feedbackUrgencyEnum('urgency').notNull(),
    summary: varchar('summary', { length: 500 }).notNull(),
    topics: jsonb('topics').$type<string[]>().default([]).notNull(),
    suggestedAction: varchar('suggested_action', { length: 500 }),
    requiresFollowUp: boolean('requires_follow_up').default(false).notNull(),
    requiresManagerAttention: boolean('requires_manager_attention')
      .default(false)
      .notNull(),
    confidence: real('confidence'),
    model: varchar('model', { length: 150 }).notNull(),
    promptVersion: varchar('prompt_version', { length: 100 }).notNull(),
    contentHash: varchar('content_hash', { length: 64 }).notNull(),
    generatedAt: timestamp('generated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    check(
      'feedback_analyses_confidence_check',
      sql`${table.confidence} is null or (${table.confidence} >= 0 and ${table.confidence} <= 1)`,
    ),
    uniqueIndex('feedback_analyses_feedback_item_unique_idx').on(
      table.feedbackItemId,
    ),
    index('feedback_analyses_organization_id_idx').on(table.organizationId),
    index('feedback_analyses_urgency_idx').on(table.urgency),
  ],
);

export const directCustomerFeedback = pgTable(
  'direct_customer_feedback',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id),
    establishmentId: uuid('establishment_id')
      .notNull()
      .references(() => establishments.id),
    feedbackItemId: uuid('feedback_item_id')
      .notNull()
      .references(() => feedbackItems.id, { onDelete: 'cascade' }),
    selectedTopics: jsonb('selected_topics')
      .$type<string[]>()
      .default([])
      .notNull(),
    customerName: varchar('customer_name', { length: 255 }),
    customerEmail: varchar('customer_email', { length: 320 }),
    customerPhone: varchar('customer_phone', { length: 40 }),
    consentToContact: boolean('consent_to_contact').default(false).notNull(),
    consentRecordedAt: timestamp('consent_recorded_at', {
      withTimezone: true,
    }),
    orderReference: varchar('order_reference', { length: 100 }),
    visitDate: timestamp('visit_date', { withTimezone: true }),
    servicePeriod: servicePeriodEnum('service_period'),
    sourceTag: varchar('source_tag', { length: 50 }),
    submissionIpHash: varchar('submission_ip_hash', { length: 64 }),
    userAgent: varchar('user_agent', { length: 500 }),
    createdAt: createdAt(),
  },
  (table) => [
    uniqueIndex('direct_customer_feedback_item_unique_idx').on(
      table.feedbackItemId,
    ),
    index('direct_customer_feedback_tenant_idx').on(
      table.organizationId,
      table.establishmentId,
    ),
    index('direct_customer_feedback_ip_created_idx').on(
      table.submissionIpHash,
      table.createdAt,
    ),
  ],
);

export const feedbackIncidents = pgTable(
  'feedback_incidents',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id),
    establishmentId: uuid('establishment_id')
      .notNull()
      .references(() => establishments.id),
    feedbackItemId: uuid('feedback_item_id')
      .notNull()
      .references(() => feedbackItems.id, { onDelete: 'cascade' }),
    category: varchar('category', { length: 100 }).notNull(),
    priority: incidentPriorityEnum('priority').notNull(),
    status: incidentStatusEnum('status').default('OPEN').notNull(),
    ownerUserId: uuid('owner_user_id'),
    title: varchar('title', { length: 255 }).notNull(),
    description: text('description'),
    rootCause: text('root_cause'),
    correctiveAction: text('corrective_action'),
    internalNotes: text('internal_notes'),
    dueAt: timestamp('due_at', { withTimezone: true }),
    resolvedAt: timestamp('resolved_at', { withTimezone: true }),
    createdByUserId: uuid('created_by_user_id').notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    index('feedback_incidents_tenant_idx').on(
      table.organizationId,
      table.establishmentId,
    ),
    index('feedback_incidents_feedback_item_id_idx').on(table.feedbackItemId),
    index('feedback_incidents_status_idx').on(table.status),
    index('feedback_incidents_priority_idx').on(table.priority),
    index('feedback_incidents_owner_user_id_idx').on(table.ownerUserId),
    index('feedback_incidents_due_at_idx').on(table.dueAt),
  ],
);

export const feedbackInternalNotes = pgTable(
  'feedback_internal_notes',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id),
    feedbackItemId: uuid('feedback_item_id')
      .notNull()
      .references(() => feedbackItems.id, { onDelete: 'cascade' }),
    content: text('content').notNull(),
    createdByUserId: uuid('created_by_user_id').notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    index('feedback_internal_notes_organization_id_idx').on(
      table.organizationId,
    ),
    index('feedback_internal_notes_feedback_item_id_idx').on(
      table.feedbackItemId,
    ),
  ],
);

export const reputationConnectors = pgTable(
  'reputation_connectors',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id),
    establishmentId: uuid('establishment_id')
      .notNull()
      .references(() => establishments.id),
    provider: connectorProviderEnum('provider').notNull(),
    externalAccountId: varchar('external_account_id', {
      length: 255,
    }).notNull(),
    externalLocationId: varchar('external_location_id', {
      length: 255,
    }).notNull(),
    status: connectorStatusEnum('status').default('DISCONNECTED').notNull(),
    encryptedAccessToken: text('encrypted_access_token'),
    encryptedRefreshToken: text('encrypted_refresh_token'),
    tokenExpiresAt: timestamp('token_expires_at', { withTimezone: true }),
    grantedScopes: jsonb('granted_scopes').$type<string[]>().default([]).notNull(),
    lastSyncedAt: timestamp('last_synced_at', { withTimezone: true }),
    lastSuccessfulSyncAt: timestamp('last_successful_sync_at', {
      withTimezone: true,
    }),
    lastSyncError: text('last_sync_error'),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    uniqueIndex('reputation_connectors_location_provider_unique_idx').on(
      table.organizationId,
      table.establishmentId,
      table.provider,
    ),
    index('reputation_connectors_status_idx').on(table.status),
  ],
);

export const reputationSettings = pgTable(
  'reputation_settings',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id),
    establishmentId: uuid('establishment_id')
      .notNull()
      .references(() => establishments.id),
    brandVoice: text('brand_voice').notNull(),
    replySignature: varchar('reply_signature', { length: 255 }),
    defaultReplyLanguage: varchar('default_reply_language', { length: 35 })
      .default('fr')
      .notNull(),
    allowEmployeePublish: boolean('allow_employee_publish')
      .default(false)
      .notNull(),
    requireManagerApproval: boolean('require_manager_approval')
      .default(false)
      .notNull(),
    googleReviewUrl: text('google_review_url'),
    facebookReviewUrl: text('facebook_review_url'),
    instagramUrl: text('instagram_url'),
    publicFeedbackEnabled: boolean('public_feedback_enabled')
      .default(false)
      .notNull(),
    publicFeedbackSlug: varchar('public_feedback_slug', {
      length: 100,
    }).notNull(),
    notifyOnNewReview: boolean('notify_on_new_review').default(true).notNull(),
    notifyOnNegativeReview: boolean('notify_on_negative_review')
      .default(true)
      .notNull(),
    negativeRatingThreshold: integer('negative_rating_threshold')
      .default(3)
      .notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    check(
      'reputation_settings_negative_threshold_check',
      sql`${table.negativeRatingThreshold} >= 1 and ${table.negativeRatingThreshold} <= 5`,
    ),
    uniqueIndex('reputation_settings_location_unique_idx').on(
      table.organizationId,
      table.establishmentId,
    ),
    uniqueIndex('reputation_settings_public_slug_unique_idx').on(
      table.publicFeedbackSlug,
    ),
  ],
);

export const reputationAuditEvents = pgTable(
  'reputation_audit_events',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id),
    entityType: auditEntityTypeEnum('entity_type').notNull(),
    entityId: uuid('entity_id').notNull(),
    action: varchar('action', { length: 100 }).notNull(),
    actorUserId: uuid('actor_user_id'),
    metadata: jsonb('metadata').$type<Record<string, unknown>>(),
    createdAt: createdAt(),
  },
  (table) => [
    index('reputation_audit_events_organization_id_idx').on(
      table.organizationId,
    ),
    index('reputation_audit_events_entity_idx').on(
      table.entityType,
      table.entityId,
    ),
    index('reputation_audit_events_created_at_idx').on(table.createdAt),
  ],
);

export const feedbackItemsRelations = relations(
  feedbackItems,
  ({ one, many }) => ({
    organization: one(organizations, {
      fields: [feedbackItems.organizationId],
      references: [organizations.id],
    }),
    establishment: one(establishments, {
      fields: [feedbackItems.establishmentId],
      references: [establishments.id],
    }),
    analysis: one(feedbackAnalyses),
    directFeedback: one(directCustomerFeedback),
    replies: many(feedbackReplies),
    incidents: many(feedbackIncidents),
    notes: many(feedbackInternalNotes),
  }),
);

export const feedbackRepliesRelations = relations(
  feedbackReplies,
  ({ one }) => ({
    feedbackItem: one(feedbackItems, {
      fields: [feedbackReplies.feedbackItemId],
      references: [feedbackItems.id],
    }),
  }),
);

export const feedbackAnalysesRelations = relations(
  feedbackAnalyses,
  ({ one }) => ({
    feedbackItem: one(feedbackItems, {
      fields: [feedbackAnalyses.feedbackItemId],
      references: [feedbackItems.id],
    }),
  }),
);

export const directCustomerFeedbackRelations = relations(
  directCustomerFeedback,
  ({ one }) => ({
    feedbackItem: one(feedbackItems, {
      fields: [directCustomerFeedback.feedbackItemId],
      references: [feedbackItems.id],
    }),
  }),
);

export const feedbackIncidentsRelations = relations(
  feedbackIncidents,
  ({ one }) => ({
    feedbackItem: one(feedbackItems, {
      fields: [feedbackIncidents.feedbackItemId],
      references: [feedbackItems.id],
    }),
  }),
);

export const feedbackInternalNotesRelations = relations(
  feedbackInternalNotes,
  ({ one }) => ({
    feedbackItem: one(feedbackItems, {
      fields: [feedbackInternalNotes.feedbackItemId],
      references: [feedbackItems.id],
    }),
  }),
);

export type FeedbackItem = typeof feedbackItems.$inferSelect;
export type FeedbackReply = typeof feedbackReplies.$inferSelect;
export type FeedbackAnalysis = typeof feedbackAnalyses.$inferSelect;
export type DirectCustomerFeedback =
  typeof directCustomerFeedback.$inferSelect;
export type FeedbackIncident = typeof feedbackIncidents.$inferSelect;
export type ReputationSettings = typeof reputationSettings.$inferSelect;
