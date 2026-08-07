import { identifierSchema } from '@yuta/contracts/common';
import { feedbackListQuerySchema } from '@yuta/contracts/reputation';
import {
  findFeedbackDetail,
  listAssignableReputationUsers,
  listFeedback,
} from '@yuta/db-cloud';
import { requireReputationTenant } from '../../../../server/auth/session';
import { cloudDatabase as db } from '../../../../server/cloud-database';
import {
  ReviewsPage,
  type ReviewDetailRecord,
  type ReviewsPageData,
} from './reviews-page';

export const dynamic = 'force-dynamic';

type ReviewSearchParams = Record<string, string | string[] | undefined>;

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<ReviewSearchParams>;
}) {
  const rawSearchParams = await searchParams;
  const { tenant } = await requireReputationTenant();
  const queryResult = feedbackListQuerySchema.safeParse({
    source: filterValue(rawSearchParams.source),
    status: filterValue(rawSearchParams.status),
    rating: filterValue(rawSearchParams.rating),
    sentiment: filterValue(rawSearchParams.sentiment),
    urgency: filterValue(rawSearchParams.urgency),
    assignedTo: filterValue(rawSearchParams.assignedTo),
    search: filterValue(rawSearchParams.search),
    sort: filterValue(rawSearchParams.sort) ?? 'newest',
    page: filterValue(rawSearchParams.page) ?? 1,
    pageSize: 25,
  });
  const query = queryResult.success
    ? queryResult.data
    : feedbackListQuerySchema.parse({});

  try {
    const result = await listFeedback(db, tenant, query);
    const requestedId = filterValue(rawSearchParams.selected);
    const parsedRequestedId = identifierSchema.safeParse(requestedId);
    const selectedId = parsedRequestedId.success
      ? parsedRequestedId.data
      : result.items[0]?.id;
    const [detail, assignableUsers] = await Promise.all([
      selectedId ? findFeedbackDetail(db, tenant, selectedId) : null,
      listAssignableReputationUsers(db, tenant),
    ]);
    const userNames = new Map(
      assignableUsers.map((user) => [user.id, user.name]),
    );

    const data: ReviewsPageData = {
      state: 'ready',
      items: result.items.map((item) => ({
        id: item.id,
        source: item.source,
        authorName: item.authorName,
        authorAvatarUrl: item.authorAvatarUrl,
        rating: item.rating,
        content: item.content,
        sentiment: item.sentiment,
        urgency: item.urgency,
        status: item.status,
        assignedToUserId: item.assignedToUserId,
        receivedAt: item.receivedAt.toISOString(),
        incidentId: item.incidentId,
        replyStatus: item.replyStatus,
      })),
      detail: detail ? serializeDetail(detail, userNames) : null,
      assignableUsers,
      query: {
        source: query.source ?? null,
        status: query.status ?? null,
        rating: query.rating ?? null,
        search: query.search ?? '',
        sort: query.sort,
      },
      pagination: result.pagination,
      counters: result.counters,
      permissions: {
        canManageFeedback:
          tenant.actor.type === 'user' &&
          ['OWNER', 'MANAGER'].includes(tenant.actor.role),
        canCreateReply:
          tenant.actor.type === 'user' &&
          ['OWNER', 'MANAGER', 'STAFF'].includes(tenant.actor.role),
        canCreateNote:
          tenant.actor.type === 'user' &&
          ['OWNER', 'MANAGER', 'STAFF'].includes(tenant.actor.role),
      },
    };
    return <ReviewsPage data={data} />;
  } catch (error: unknown) {
    console.error('Unable to load reputation inbox.', error);
    return <ReviewsPage data={unavailableData()} />;
  }
}

function serializeDetail(
  detail: NonNullable<Awaited<ReturnType<typeof findFeedbackDetail>>>,
  userNames: Map<string, string>,
): ReviewDetailRecord {
  const latestReply = detail.replies.find(
    (reply) => reply.status !== 'DELETED',
  );
  return {
    id: detail.id,
    source: detail.source,
    authorName: detail.authorName,
    authorAvatarUrl: detail.authorAvatarUrl,
    rating: detail.rating,
    content: detail.content,
    sentiment: detail.sentiment,
    urgency: detail.urgency,
    status: detail.status,
    assignedToUserId: detail.assignedToUserId,
    receivedAt: detail.receivedAt.toISOString(),
    incidentId: detail.incidents[0]?.id ?? null,
    replyStatus: latestReply?.status ?? null,
    externalUrl: detail.externalUrl,
    analysis: detail.analysis
      ? {
          summary: detail.analysis.summary,
          topics: detail.analysis.topics,
          suggestedAction: detail.analysis.suggestedAction,
        }
      : null,
    latestReply: latestReply
      ? {
          id: latestReply.id,
          content: latestReply.content,
          status: latestReply.status,
        }
      : null,
    notes: detail.notes.map((note) => ({
      id: note.id,
      content: note.content,
      authorName: userNames.get(note.createdByUserId) ?? 'Utilisateur',
      createdAt: note.createdAt.toISOString(),
    })),
  };
}

function filterValue(value: string | string[] | undefined): string | undefined {
  const first = Array.isArray(value) ? value[0] : value;
  return !first || first === 'ALL' ? undefined : first;
}

function unavailableData(): ReviewsPageData {
  return {
    state: 'unavailable',
    items: [],
    detail: null,
    assignableUsers: [],
    query: {
      source: null,
      status: null,
      rating: null,
      search: '',
      sort: 'newest',
    },
    pagination: {
      page: 1,
      pageSize: 25,
      totalItems: 0,
      totalPages: 1,
    },
    counters: {
      total: 0,
      new: 0,
      unanswered: 0,
      negative: 0,
      withIncident: 0,
    },
    permissions: {
      canManageFeedback: false,
      canCreateReply: false,
      canCreateNote: false,
    },
  };
}
