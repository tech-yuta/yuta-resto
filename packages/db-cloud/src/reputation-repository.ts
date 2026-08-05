import type {
  FeedbackListQuery,
  FeedbackStatus,
  PublicFeedbackSubmission,
} from '@yuta/contracts/reputation';
import type { AssignableReputationUser } from '@yuta/contracts/cloud-admin';
import type { PublicTenantContext, TenantContext } from '@yuta/tenant';
import {
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  ilike,
  inArray,
  or,
  sql,
} from 'drizzle-orm';
import { v7 as uuidv7 } from 'uuid';
import type { CloudDatabaseClient } from './client';
import {
  directCustomerFeedback,
  establishments,
  feedbackInternalNotes,
  feedbackItems,
  feedbackReplies,
  reputationAuditEvents,
  reputationConnectors,
  reputationSettings,
  tenantEntitlements,
  tenantMemberships,
  users,
} from './schema';

type DbClient = CloudDatabaseClient;

export type ReputationRepositoryErrorCode =
  | 'FEEDBACK_NOT_FOUND'
  | 'ASSIGNEE_INVALID'
  | 'SOURCE_NOT_SUPPORTED'
  | 'CONNECTOR_NOT_FOUND';

export class ReputationRepositoryError extends Error {
  constructor(
    message: string,
    public readonly code: ReputationRepositoryErrorCode,
  ) {
    super(message);
    this.name = 'ReputationRepositoryError';
  }
}

export type ReputationConnectorSummary = {
  id: string;
  provider: 'GOOGLE';
  externalAccountId: string;
  externalLocationId: string;
  status:
    | 'DISCONNECTED'
    | 'CONNECTING'
    | 'CONNECTED'
    | 'ERROR'
    | 'AUTH_EXPIRED';
  tokenExpiresAt: Date | null;
  grantedScopes: string[];
  lastSyncedAt: Date | null;
  lastSuccessfulSyncAt: Date | null;
  lastSyncError: string | null;
  hasAccessToken: boolean;
  hasRefreshToken: boolean;
};

export type PublicFeedbackConfiguration = {
  organizationId: string;
  establishmentId: string;
  establishmentName: string;
  slug: string;
  enabled: boolean;
  googleReviewUrl: string | null;
  facebookReviewUrl: string | null;
  instagramUrl: string | null;
};

export async function findDevelopmentFeedbackTenantBySlug(
  repositoryDb: DbClient,
  slug: string,
): Promise<Omit<PublicTenantContext, 'hostname'> | null> {
  const rows = await repositoryDb
    .select({
      organizationId: reputationSettings.organizationId,
      establishmentId: reputationSettings.establishmentId,
      locale: establishments.locale,
      timezone: establishments.timezone,
    })
    .from(reputationSettings)
    .innerJoin(
      establishments,
      and(
        eq(establishments.id, reputationSettings.establishmentId),
        eq(establishments.organizationId, reputationSettings.organizationId),
      ),
    )
    .where(eq(reputationSettings.publicFeedbackSlug, slug))
    .limit(1);
  const tenant = rows[0];
  if (!tenant) return null;

  const entitlementRows = await repositoryDb
    .select({ key: tenantEntitlements.key })
    .from(tenantEntitlements)
    .where(
      and(
        eq(tenantEntitlements.organizationId, tenant.organizationId),
        eq(tenantEntitlements.establishmentId, tenant.establishmentId),
        eq(tenantEntitlements.enabled, true),
      ),
    );

  return Object.freeze({
    ...tenant,
    entitlements: new Set(entitlementRows.map((row) => row.key)),
  });
}

export async function findPublicFeedbackConfiguration(
  repositoryDb: DbClient,
  context: PublicTenantContext,
  slug: string,
): Promise<PublicFeedbackConfiguration | null> {
  const [result] = await repositoryDb
    .select()
    .from(reputationSettings)
    .where(
      and(
        eq(reputationSettings.organizationId, context.organizationId),
        eq(reputationSettings.establishmentId, context.establishmentId),
        eq(reputationSettings.publicFeedbackSlug, slug),
      ),
    )
    .limit(1);
  if (!result) return null;

  const [establishment] = await repositoryDb
    .select({ name: establishments.name })
    .from(establishments)
    .where(
      and(
        eq(establishments.organizationId, context.organizationId),
        eq(establishments.id, context.establishmentId),
      ),
    )
    .limit(1);
  if (!establishment) return null;

  return {
    organizationId: result.organizationId,
    establishmentId: result.establishmentId,
    establishmentName: establishment.name,
    slug: result.publicFeedbackSlug,
    enabled: result.publicFeedbackEnabled,
    googleReviewUrl: result.googleReviewUrl,
    facebookReviewUrl: result.facebookReviewUrl,
    instagramUrl: result.instagramUrl,
  };
}

export async function countRecentPublicSubmissions(
  repositoryDb: DbClient,
  context: PublicTenantContext,
  submissionIpHash: string,
  since: Date,
): Promise<number> {
  const [result] = await repositoryDb
    .select({ value: count() })
    .from(directCustomerFeedback)
    .where(
      and(
        eq(directCustomerFeedback.organizationId, context.organizationId),
        eq(directCustomerFeedback.establishmentId, context.establishmentId),
        eq(directCustomerFeedback.submissionIpHash, submissionIpHash),
        gte(directCustomerFeedback.createdAt, since),
      ),
    );
  return result?.value ?? 0;
}

export async function createPublicFeedback(
  repositoryDb: DbClient,
  context: PublicTenantContext,
  input: PublicFeedbackSubmission,
  metadata: {
    submissionIpHash: string | null;
    userAgent: string | null;
  },
): Promise<{ feedbackId: string }> {
  const sentiment =
    input.rating >= 4
      ? 'POSITIVE'
      : input.rating === 3
        ? 'NEUTRAL'
        : 'NEGATIVE';
  const urgency =
    input.topics.includes('ALLERGEN') || input.rating === 1
      ? 'HIGH'
      : input.rating <= 2
        ? 'MEDIUM'
        : 'LOW';
  const status = input.rating <= 3 ? 'TO_PROCESS' : 'NEW';
  const authorName = input.customerName || null;
  const content = input.comment || null;
  const consentRecordedAt = input.consentToContact ? new Date() : null;

  return repositoryDb.transaction(async (transaction) => {
    const [feedback] = await transaction
      .insert(feedbackItems)
      .values({
        id: uuidv7(),
        organizationId: context.organizationId,
        establishmentId: context.establishmentId,
        source: 'DIRECT',
        type: 'DIRECT_FEEDBACK',
        authorName,
        rating: input.rating,
        content,
        language: context.locale,
        sentiment,
        urgency,
        status,
        providerMetadata: input.sourceTag
          ? { collectionSource: input.sourceTag }
          : null,
      })
      .returning({ id: feedbackItems.id });

    await transaction.insert(directCustomerFeedback).values({
      id: uuidv7(),
      organizationId: context.organizationId,
      establishmentId: context.establishmentId,
      feedbackItemId: feedback.id,
      selectedTopics: input.topics,
      customerName: authorName,
      customerEmail: input.customerEmail || null,
      customerPhone: input.customerPhone || null,
      consentToContact: input.consentToContact,
      consentRecordedAt,
      orderReference: input.orderReference || null,
      visitDate: input.visitDate
        ? new Date(`${input.visitDate}T12:00:00.000Z`)
        : null,
      servicePeriod: input.servicePeriod ?? null,
      sourceTag: input.sourceTag ?? null,
      submissionIpHash: metadata.submissionIpHash,
      userAgent: metadata.userAgent,
    });

    return { feedbackId: feedback.id };
  });
}

function requireAdminEstablishment(context: TenantContext): string {
  if (!context.establishmentId) {
    throw new Error('An establishment-scoped tenant context is required.');
  }
  return context.establishmentId;
}

function feedbackVisibilityCondition(context: TenantContext) {
  return context.actor.type === 'user' && context.actor.role === 'STAFF'
    ? eq(feedbackItems.assignedToUserId, context.actor.userId)
    : undefined;
}

export async function listFeedback(
  repositoryDb: DbClient,
  context: TenantContext,
  query: FeedbackListQuery,
) {
  const establishmentId = requireAdminEstablishment(context);
  const offset = (query.page - 1) * query.pageSize;
  const filters = [
    eq(feedbackItems.organizationId, context.organizationId),
    eq(feedbackItems.establishmentId, establishmentId),
    feedbackVisibilityCondition(context),
    query.source ? eq(feedbackItems.source, query.source) : undefined,
    query.status ? eq(feedbackItems.status, query.status) : undefined,
    query.rating ? eq(feedbackItems.rating, query.rating) : undefined,
    query.sentiment ? eq(feedbackItems.sentiment, query.sentiment) : undefined,
    query.urgency ? eq(feedbackItems.urgency, query.urgency) : undefined,
    query.assignedTo
      ? eq(feedbackItems.assignedToUserId, query.assignedTo)
      : undefined,
    query.search
      ? or(
          ilike(feedbackItems.authorName, `%${query.search}%`),
          ilike(feedbackItems.content, `%${query.search}%`),
        )
      : undefined,
    query.hasIncident === true ? sql`false` : undefined,
  ].filter((filter) => filter !== undefined);
  const where = and(...filters);
  const orderBy =
    query.sort === 'oldest'
      ? asc(feedbackItems.receivedAt)
      : query.sort === 'rating_asc'
        ? asc(feedbackItems.rating)
        : query.sort === 'rating_desc'
          ? desc(feedbackItems.rating)
          : query.sort === 'urgency_desc'
            ? sql`case ${feedbackItems.urgency}
                when 'CRITICAL' then 4
                when 'HIGH' then 3
                when 'MEDIUM' then 2
                when 'LOW' then 1
                else 0 end desc`
            : query.sort === 'unanswered'
              ? sql`case when not exists (
                  select 1 from ${feedbackReplies}
                  where "feedback_replies"."feedback_item_id" = "feedback_items"."id"
                  and "feedback_replies"."status" = 'PUBLISHED'
                ) then 0 else 1 end asc, ${feedbackItems.receivedAt} desc`
              : desc(feedbackItems.receivedAt);

  const rows = await repositoryDb
    .select({
      id: feedbackItems.id,
      source: feedbackItems.source,
      type: feedbackItems.type,
      authorName: feedbackItems.authorName,
      authorAvatarUrl: feedbackItems.authorAvatarUrl,
      rating: feedbackItems.rating,
      content: feedbackItems.content,
      sentiment: feedbackItems.sentiment,
      urgency: feedbackItems.urgency,
      status: feedbackItems.status,
      assignedToUserId: feedbackItems.assignedToUserId,
      publishedAt: feedbackItems.publishedAt,
      receivedAt: feedbackItems.receivedAt,
      incidentId: sql<string | null>`null`,
      replyId: sql<string | null>`(
        select ${feedbackReplies.id}
        from ${feedbackReplies}
        where "feedback_replies"."feedback_item_id" = "feedback_items"."id"
        and "feedback_replies"."status" <> 'DELETED'
        order by ${feedbackReplies.createdAt} desc
        limit 1
      )`,
      replyStatus: sql<string | null>`(
        select ${feedbackReplies.status}::text
        from ${feedbackReplies}
        where "feedback_replies"."feedback_item_id" = "feedback_items"."id"
        and "feedback_replies"."status" <> 'DELETED'
        order by ${feedbackReplies.createdAt} desc
        limit 1
      )`,
    })
    .from(feedbackItems)
    .where(where)
    .orderBy(orderBy)
    .limit(query.pageSize)
    .offset(offset);

  const [totalResult] = await repositoryDb
    .select({ value: count() })
    .from(feedbackItems)
    .where(where);

  const [counters] = await repositoryDb
    .select({
      total: count(),
      new: sql<number>`count(*) filter (where ${feedbackItems.status} = 'NEW')`,
      unanswered: sql<number>`count(*) filter (
        where not exists (
          select 1 from ${feedbackReplies}
          where "feedback_replies"."feedback_item_id" = "feedback_items"."id"
          and "feedback_replies"."status" = 'PUBLISHED'
        )
      )`,
      negative: sql<number>`count(*) filter (where ${feedbackItems.sentiment} = 'NEGATIVE')`,
      withIncident: sql<number>`0`,
    })
    .from(feedbackItems)
    .where(
      and(
        eq(feedbackItems.organizationId, context.organizationId),
        eq(feedbackItems.establishmentId, establishmentId),
        feedbackVisibilityCondition(context),
      ),
    );

  const totalItems = totalResult?.value ?? 0;
  return {
    items: rows,
    pagination: {
      page: query.page,
      pageSize: query.pageSize,
      totalItems,
      totalPages: Math.max(1, Math.ceil(totalItems / query.pageSize)),
    },
    counters: {
      total: Number(counters?.total ?? 0),
      new: Number(counters?.new ?? 0),
      unanswered: Number(counters?.unanswered ?? 0),
      negative: Number(counters?.negative ?? 0),
      withIncident: Number(counters?.withIncident ?? 0),
    },
  };
}

export async function findFeedbackDetail(
  repositoryDb: DbClient,
  context: TenantContext,
  feedbackId: string,
) {
  const establishmentId = requireAdminEstablishment(context);
  const [feedback] = await repositoryDb
    .select()
    .from(feedbackItems)
    .where(
      and(
        eq(feedbackItems.id, feedbackId),
        eq(feedbackItems.organizationId, context.organizationId),
        eq(feedbackItems.establishmentId, establishmentId),
        feedbackVisibilityCondition(context),
      ),
    )
    .limit(1);
  if (!feedback) return undefined;

  const [replies, notes] = await Promise.all([
    repositoryDb
      .select()
      .from(feedbackReplies)
      .where(eq(feedbackReplies.feedbackItemId, feedback.id))
      .orderBy(desc(feedbackReplies.createdAt)),
    repositoryDb
      .select()
      .from(feedbackInternalNotes)
      .where(eq(feedbackInternalNotes.feedbackItemId, feedback.id))
      .orderBy(desc(feedbackInternalNotes.createdAt)),
  ]);

  return {
    ...feedback,
    analysis: null as {
      summary: string;
      topics: string[];
      suggestedAction: string | null;
    } | null,
    incidents: [] as Array<{ id: string }>,
    replies,
    notes,
  };
}

export async function listAssignableReputationUsers(
  repositoryDb: DbClient,
  context: TenantContext,
): Promise<AssignableReputationUser[]> {
  const establishmentId = requireAdminEstablishment(context);
  const rows = await repositoryDb
    .select({
      id: users.id,
      name: users.displayName,
      email: users.email,
      role: tenantMemberships.role,
    })
    .from(tenantMemberships)
    .innerJoin(users, eq(users.id, tenantMemberships.userId))
    .where(
      and(
        eq(tenantMemberships.organizationId, context.organizationId),
        eq(tenantMemberships.establishmentId, establishmentId),
        eq(tenantMemberships.status, 'active'),
        eq(users.status, 'ACTIVE'),
      ),
    )
    .orderBy(asc(users.displayName));
  return rows.map((row) => ({
    ...row,
    name: row.name ?? row.email ?? 'Utilisateur',
  }));
}

export async function findGoogleReputationConnector(
  repositoryDb: DbClient,
  context: TenantContext,
): Promise<ReputationConnectorSummary | null> {
  const establishmentId = requireAdminEstablishment(context);
  const [connector] = await repositoryDb
    .select()
    .from(reputationConnectors)
    .where(
      and(
        eq(reputationConnectors.organizationId, context.organizationId),
        eq(reputationConnectors.establishmentId, establishmentId),
        eq(reputationConnectors.provider, 'GOOGLE'),
      ),
    )
    .limit(1);
  if (!connector) return null;
  return {
    id: connector.id,
    provider: connector.provider,
    externalAccountId: connector.externalAccountId,
    externalLocationId: connector.externalLocationId,
    status: connector.status,
    tokenExpiresAt: connector.tokenExpiresAt,
    grantedScopes: connector.grantedScopes,
    lastSyncedAt: connector.lastSyncedAt,
    lastSuccessfulSyncAt: connector.lastSuccessfulSyncAt,
    lastSyncError: connector.lastSyncError,
    hasAccessToken: Boolean(connector.encryptedAccessToken),
    hasRefreshToken: Boolean(connector.encryptedRefreshToken),
  };
}

export async function findGoogleReputationConnectorCredentials(
  repositoryDb: DbClient,
  context: TenantContext,
) {
  const establishmentId = requireAdminEstablishment(context);
  const [connector] = await repositoryDb
    .select()
    .from(reputationConnectors)
    .where(
      and(
        eq(reputationConnectors.organizationId, context.organizationId),
        eq(reputationConnectors.establishmentId, establishmentId),
        eq(reputationConnectors.provider, 'GOOGLE'),
      ),
    )
    .limit(1);
  return connector ?? null;
}

export async function upsertGoogleReputationConnectorCredentials(
  repositoryDb: DbClient,
  context: TenantContext,
  input: {
    encryptedAccessToken: string;
    encryptedRefreshToken?: string;
    tokenExpiresAt: Date;
    grantedScopes: string[];
    actorUserId: string;
  },
) {
  const establishmentId = requireAdminEstablishment(context);
  return repositoryDb.transaction(async (transaction) => {
    const [connector] = await transaction
      .insert(reputationConnectors)
      .values({
        id: uuidv7(),
        organizationId: context.organizationId,
        establishmentId,
        provider: 'GOOGLE',
        externalAccountId: '',
        externalLocationId: '',
        status: 'CONNECTING',
        encryptedAccessToken: input.encryptedAccessToken,
        encryptedRefreshToken: input.encryptedRefreshToken ?? null,
        tokenExpiresAt: input.tokenExpiresAt,
        grantedScopes: input.grantedScopes,
        lastSyncError: null,
      })
      .onConflictDoUpdate({
        target: [
          reputationConnectors.organizationId,
          reputationConnectors.establishmentId,
          reputationConnectors.provider,
        ],
        set: {
          status: 'CONNECTING',
          encryptedAccessToken: input.encryptedAccessToken,
          ...(input.encryptedRefreshToken
            ? { encryptedRefreshToken: input.encryptedRefreshToken }
            : {}),
          tokenExpiresAt: input.tokenExpiresAt,
          grantedScopes: input.grantedScopes,
          lastSyncError: null,
        },
      })
      .returning();
    await transaction.insert(reputationAuditEvents).values({
      id: uuidv7(),
      organizationId: context.organizationId,
      entityType: 'CONNECTOR',
      entityId: connector.id,
      action: 'connector.google.authorized',
      actorUserId: input.actorUserId,
      metadata: {
        establishmentId,
        scopes: input.grantedScopes,
        refreshTokenReceived: Boolean(input.encryptedRefreshToken),
      },
    });
    return connector;
  });
}

export async function updateGoogleReputationConnectorAccessToken(
  repositoryDb: DbClient,
  context: TenantContext,
  input: {
    encryptedAccessToken: string;
    tokenExpiresAt: Date;
    grantedScopes?: string[];
  },
) {
  const establishmentId = requireAdminEstablishment(context);
  const [connector] = await repositoryDb
    .update(reputationConnectors)
    .set({
      encryptedAccessToken: input.encryptedAccessToken,
      tokenExpiresAt: input.tokenExpiresAt,
      ...(input.grantedScopes ? { grantedScopes: input.grantedScopes } : {}),
      lastSyncError: null,
    })
    .where(
      and(
        eq(reputationConnectors.organizationId, context.organizationId),
        eq(reputationConnectors.establishmentId, establishmentId),
        eq(reputationConnectors.provider, 'GOOGLE'),
      ),
    )
    .returning();
  if (!connector) {
    throw new ReputationRepositoryError(
      'Connector not found.',
      'CONNECTOR_NOT_FOUND',
    );
  }
  return connector;
}

export async function selectGoogleReputationLocation(
  repositoryDb: DbClient,
  context: TenantContext,
  input: {
    externalAccountId: string;
    externalLocationId: string;
    actorUserId: string;
  },
) {
  const establishmentId = requireAdminEstablishment(context);
  return repositoryDb.transaction(async (transaction) => {
    const [connector] = await transaction
      .update(reputationConnectors)
      .set({
        externalAccountId: input.externalAccountId,
        externalLocationId: input.externalLocationId,
        status: 'CONNECTED',
        lastSyncError: null,
      })
      .where(
        and(
          eq(reputationConnectors.organizationId, context.organizationId),
          eq(reputationConnectors.establishmentId, establishmentId),
          eq(reputationConnectors.provider, 'GOOGLE'),
        ),
      )
      .returning();
    if (!connector) {
      throw new ReputationRepositoryError(
        'Connector not found.',
        'CONNECTOR_NOT_FOUND',
      );
    }
    await transaction.insert(reputationAuditEvents).values({
      id: uuidv7(),
      organizationId: context.organizationId,
      entityType: 'CONNECTOR',
      entityId: connector.id,
      action: 'connector.google.location.selected',
      actorUserId: input.actorUserId,
      metadata: {
        establishmentId,
        externalAccountId: input.externalAccountId,
        externalLocationId: input.externalLocationId,
      },
    });
    return connector;
  });
}

export async function updateFeedback(
  repositoryDb: DbClient,
  context: TenantContext,
  input: {
    feedbackId: string;
    status?: FeedbackStatus;
    assignedToUserId?: string | null;
    actorUserId: string;
  },
) {
  const establishmentId = requireAdminEstablishment(context);
  return repositoryDb.transaction(async (transaction) => {
    const [feedback] = await transaction
      .select()
      .from(feedbackItems)
      .where(
        and(
          eq(feedbackItems.id, input.feedbackId),
          eq(feedbackItems.organizationId, context.organizationId),
          eq(feedbackItems.establishmentId, establishmentId),
          feedbackVisibilityCondition(context),
        ),
      )
      .limit(1);
    if (!feedback) {
      throw new ReputationRepositoryError(
        'Feedback not found.',
        'FEEDBACK_NOT_FOUND',
      );
    }

    if (input.assignedToUserId) {
      const assignee = await transaction
        .select({ id: users.id })
        .from(tenantMemberships)
        .innerJoin(users, eq(users.id, tenantMemberships.userId))
        .where(
          and(
            eq(tenantMemberships.userId, input.assignedToUserId),
            eq(tenantMemberships.organizationId, context.organizationId),
            eq(tenantMemberships.establishmentId, establishmentId),
            eq(tenantMemberships.status, 'active'),
            eq(users.status, 'ACTIVE'),
          ),
        )
        .limit(1);
      if (!assignee[0]) {
        throw new ReputationRepositoryError(
          'Assignee is not active in this establishment.',
          'ASSIGNEE_INVALID',
        );
      }
    }

    const [updated] = await transaction
      .update(feedbackItems)
      .set({
        ...(input.status !== undefined ? { status: input.status } : {}),
        ...(input.assignedToUserId !== undefined
          ? { assignedToUserId: input.assignedToUserId }
          : {}),
      })
      .where(eq(feedbackItems.id, feedback.id))
      .returning();

    await transaction.insert(reputationAuditEvents).values({
      id: uuidv7(),
      organizationId: context.organizationId,
      entityType: 'FEEDBACK',
      entityId: feedback.id,
      action: 'feedback.updated',
      actorUserId: input.actorUserId,
      metadata: {
        previousStatus: feedback.status,
        status: updated.status,
        previousAssignedToUserId: feedback.assignedToUserId,
        assignedToUserId: updated.assignedToUserId,
        establishmentId,
      },
    });
    return updated;
  });
}

export async function saveFeedbackReplyDraft(
  repositoryDb: DbClient,
  context: TenantContext,
  input: {
    feedbackId: string;
    content: string;
    actorUserId: string;
  },
) {
  const establishmentId = requireAdminEstablishment(context);
  return repositoryDb.transaction(async (transaction) => {
    const [feedback] = await transaction
      .select()
      .from(feedbackItems)
      .where(
        and(
          eq(feedbackItems.id, input.feedbackId),
          eq(feedbackItems.organizationId, context.organizationId),
          eq(feedbackItems.establishmentId, establishmentId),
          feedbackVisibilityCondition(context),
        ),
      )
      .limit(1);
    if (!feedback) {
      throw new ReputationRepositoryError(
        'Feedback not found.',
        'FEEDBACK_NOT_FOUND',
      );
    }
    if (feedback.source !== 'GOOGLE') {
      throw new ReputationRepositoryError(
        'Reply drafts are supported only for Google reviews.',
        'SOURCE_NOT_SUPPORTED',
      );
    }

    const [existingDraft] = await transaction
      .select()
      .from(feedbackReplies)
      .where(
        and(
          eq(feedbackReplies.feedbackItemId, feedback.id),
          inArray(feedbackReplies.status, ['DRAFT', 'READY', 'FAILED']),
        ),
      )
      .orderBy(desc(feedbackReplies.createdAt))
      .limit(1);
    const [reply] = existingDraft
      ? await transaction
          .update(feedbackReplies)
          .set({
            content: input.content,
            status: 'DRAFT',
            editedByUserId: input.actorUserId,
            failedAt: null,
            errorCode: null,
            errorMessage: null,
          })
          .where(eq(feedbackReplies.id, existingDraft.id))
          .returning()
      : await transaction
          .insert(feedbackReplies)
          .values({
            id: uuidv7(),
            organizationId: context.organizationId,
            feedbackItemId: feedback.id,
            content: input.content,
            status: 'DRAFT',
            generatedByAi: false,
            createdByUserId: input.actorUserId,
            editedByUserId: input.actorUserId,
          })
          .returning();

    await transaction
      .update(feedbackItems)
      .set({ status: 'DRAFTED' })
      .where(eq(feedbackItems.id, feedback.id));
    await transaction.insert(reputationAuditEvents).values({
      id: uuidv7(),
      organizationId: context.organizationId,
      entityType: 'REPLY',
      entityId: reply.id,
      action: existingDraft ? 'reply.draft.updated' : 'reply.draft.created',
      actorUserId: input.actorUserId,
      metadata: {
        feedbackItemId: feedback.id,
        establishmentId,
        generatedByAi: reply.generatedByAi,
      },
    });
    return reply;
  });
}

export async function createFeedbackInternalNote(
  repositoryDb: DbClient,
  context: TenantContext,
  input: {
    feedbackId: string;
    content: string;
    actorUserId: string;
  },
) {
  const establishmentId = requireAdminEstablishment(context);
  return repositoryDb.transaction(async (transaction) => {
    const [feedback] = await transaction
      .select()
      .from(feedbackItems)
      .where(
        and(
          eq(feedbackItems.id, input.feedbackId),
          eq(feedbackItems.organizationId, context.organizationId),
          eq(feedbackItems.establishmentId, establishmentId),
          feedbackVisibilityCondition(context),
        ),
      )
      .limit(1);
    if (!feedback) {
      throw new ReputationRepositoryError(
        'Feedback not found.',
        'FEEDBACK_NOT_FOUND',
      );
    }
    const [note] = await transaction
      .insert(feedbackInternalNotes)
      .values({
        id: uuidv7(),
        organizationId: context.organizationId,
        feedbackItemId: feedback.id,
        content: input.content,
        createdByUserId: input.actorUserId,
      })
      .returning();
    await transaction.insert(reputationAuditEvents).values({
      id: uuidv7(),
      organizationId: context.organizationId,
      entityType: 'FEEDBACK',
      entityId: feedback.id,
      action: 'feedback.note.created',
      actorUserId: input.actorUserId,
      metadata: {
        noteId: note.id,
        establishmentId,
      },
    });
    return note;
  });
}
