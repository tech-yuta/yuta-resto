import type {
  FeedbackListQuery,
  PublicFeedbackSubmission,
} from '@yuta/contracts/reputation';
import type { PublicTenantContext, TenantContext } from '@yuta/tenant';
import {
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  ilike,
  isNotNull,
  isNull,
  or,
  sql,
} from 'drizzle-orm';
import type { DbClient } from './client';
import {
  directCustomerFeedback,
  establishments,
  feedbackAnalyses,
  feedbackIncidents,
  feedbackItems,
  feedbackReplies,
  reputationSettings,
  tenantEntitlements,
} from './schema';

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
        eq(
          establishments.organizationId,
          reputationSettings.organizationId,
        ),
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
  const result = await repositoryDb.query.reputationSettings.findFirst({
    where: and(
      eq(reputationSettings.organizationId, context.organizationId),
      eq(reputationSettings.establishmentId, context.establishmentId),
      eq(reputationSettings.publicFeedbackSlug, slug),
    ),
  });
  if (!result) return null;

  const establishment = await repositoryDb.query.establishments.findFirst({
    where: and(
      eq(establishments.organizationId, context.organizationId),
      eq(establishments.id, context.establishmentId),
    ),
    columns: { name: true },
  });
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
    input.rating >= 4 ? 'POSITIVE' : input.rating === 3 ? 'NEUTRAL' : 'NEGATIVE';
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
    query.source ? eq(feedbackItems.source, query.source) : undefined,
    query.status ? eq(feedbackItems.status, query.status) : undefined,
    query.rating ? eq(feedbackItems.rating, query.rating) : undefined,
    query.sentiment
      ? eq(feedbackItems.sentiment, query.sentiment)
      : undefined,
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
    query.hasIncident === true
      ? isNotNull(feedbackIncidents.id)
      : query.hasIncident === false
        ? isNull(feedbackIncidents.id)
        : undefined,
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
              ? sql`case when ${feedbackReplies.id} is null then 0 else 1 end asc, ${feedbackItems.receivedAt} desc`
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
      incidentId: feedbackIncidents.id,
      replyId: feedbackReplies.id,
      replyStatus: feedbackReplies.status,
    })
    .from(feedbackItems)
    .leftJoin(
      feedbackIncidents,
      eq(feedbackIncidents.feedbackItemId, feedbackItems.id),
    )
    .leftJoin(
      feedbackReplies,
      and(
        eq(feedbackReplies.feedbackItemId, feedbackItems.id),
        sql`${feedbackReplies.status} <> 'DELETED'`,
      ),
    )
    .where(where)
    .orderBy(orderBy)
    .limit(query.pageSize)
    .offset(offset);

  const [totalResult] = await repositoryDb
    .select({ value: count() })
    .from(feedbackItems)
    .leftJoin(
      feedbackIncidents,
      eq(feedbackIncidents.feedbackItemId, feedbackItems.id),
    )
    .where(where);

  const [counters] = await repositoryDb
    .select({
      total: count(),
      new: sql<number>`count(*) filter (where ${feedbackItems.status} = 'NEW')`,
      unanswered: sql<number>`count(*) filter (
        where not exists (
          select 1 from ${feedbackReplies}
          where ${feedbackReplies.feedbackItemId} = ${feedbackItems.id}
          and ${feedbackReplies.status} = 'PUBLISHED'
        )
      )`,
      negative: sql<number>`count(*) filter (where ${feedbackItems.sentiment} = 'NEGATIVE')`,
      withIncident: sql<number>`count(distinct ${feedbackIncidents.feedbackItemId})`,
    })
    .from(feedbackItems)
    .leftJoin(
      feedbackIncidents,
      eq(feedbackIncidents.feedbackItemId, feedbackItems.id),
    )
    .where(
      and(
        eq(feedbackItems.organizationId, context.organizationId),
        eq(feedbackItems.establishmentId, establishmentId),
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
  return repositoryDb.query.feedbackItems.findFirst({
    where: and(
      eq(feedbackItems.id, feedbackId),
      eq(feedbackItems.organizationId, context.organizationId),
      eq(feedbackItems.establishmentId, establishmentId),
    ),
    with: {
      analysis: true,
      replies: {
        orderBy: [desc(feedbackReplies.createdAt)],
      },
      incidents: {
        orderBy: [desc(feedbackIncidents.createdAt)],
      },
      notes: true,
    },
  });
}

export async function findFeedbackAnalysis(
  repositoryDb: DbClient,
  context: TenantContext,
  feedbackId: string,
) {
  const establishmentId = requireAdminEstablishment(context);
  return repositoryDb
    .select({ analysis: feedbackAnalyses })
    .from(feedbackAnalyses)
    .innerJoin(
      feedbackItems,
      eq(feedbackItems.id, feedbackAnalyses.feedbackItemId),
    )
    .where(
      and(
        eq(feedbackAnalyses.feedbackItemId, feedbackId),
        eq(feedbackItems.organizationId, context.organizationId),
        eq(feedbackItems.establishmentId, establishmentId),
      ),
    )
    .limit(1);
}
