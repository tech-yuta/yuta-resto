import { feedbackListQuerySchema } from '@yuta/contracts/reputation';
import { db } from '@yuta/db/client';
import {
  findDevelopmentFeedbackTenantBySlug,
  listFeedback,
} from '@yuta/db';
import { createMembershipLookup } from '@yuta/db/tenant-adapters';
import { users } from '@yuta/db/schema';
import { resolveAuthenticatedTenant } from '@yuta/tenant';
import { eq } from 'drizzle-orm';
import { ReviewsPage, type ReviewsPageData } from './reviews-page';

export const dynamic = 'force-dynamic';

async function loadReviewsPage(): Promise<ReviewsPageData> {
  if (process.env.NODE_ENV === 'production') {
    return {
      state: 'authentication-required',
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

  try {
    const developmentTenant = await findDevelopmentFeedbackTenantBySlug(
      db,
      'luna',
    );
    const adminUser = await db.query.users.findFirst({
      where: eq(users.email, 'admin@yuta.local'),
    });
    if (!developmentTenant || !adminUser) {
      throw new Error('Development tenant seed is missing.');
    }

    const tenant = await resolveAuthenticatedTenant({
      userId: adminUser.id,
      organizationId: developmentTenant.organizationId,
      establishmentId: developmentTenant.establishmentId,
      membershipLookup: createMembershipLookup(db),
      tenantMetadata: {
        locale: developmentTenant.locale,
        timezone: developmentTenant.timezone,
        entitlements: [...developmentTenant.entitlements],
      },
    });
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
