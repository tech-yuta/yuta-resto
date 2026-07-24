import { feedbackListQuerySchema } from '@yuta/contracts/reputation';
import { listFeedback } from '@yuta/db';
import { db } from '@yuta/db/client';
import { requireReputationTenant } from '../../../../server/auth/session';
import { ReviewsPage, type ReviewsPageData } from './reviews-page';

export const dynamic = 'force-dynamic';

async function loadReviewsPage(): Promise<ReviewsPageData> {
  const { tenant } = await requireReputationTenant();
  try {
    const result = await listFeedback(
      db,
      tenant,
      feedbackListQuerySchema.parse({ pageSize: 100 }),
    );

    return {
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
        receivedAt: item.receivedAt.toISOString(),
        incidentId: item.incidentId,
        replyStatus: item.replyStatus,
      })),
      counters: result.counters,
    };
  } catch (error: unknown) {
    console.error('Unable to load reputation inbox.', error);
    return {
      state: 'unavailable',
      items: [],
      counters: {
        total: 0,
        new: 0,
        unanswered: 0,
        negative: 0,
        withIncident: 0,
      },
    };
  }
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ selected?: string }>;
}) {
  const { selected } = await searchParams;
  const data = await loadReviewsPage();
  return <ReviewsPage data={data} initialSelectedId={selected} />;
}
