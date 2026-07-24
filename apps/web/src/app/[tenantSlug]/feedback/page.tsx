import { db } from '@yuta/db/client';
import { findPublicFeedbackConfiguration } from '@yuta/db';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { FeedbackForm } from './feedback-form';
import { resolveFeedbackTenant } from '../../../server/reputation/resolve-public-feedback';

export const dynamic = 'force-dynamic';

export default async function FeedbackPage({
  params,
}: {
  params: Promise<{ tenantSlug: string }>;
}) {
  const { tenantSlug } = await params;
  const requestHeaders = await headers();
  const tenant = await resolveFeedbackTenant(
    requestHeaders.get('host') ?? '',
    tenantSlug,
  ).catch(() => null);
  if (!tenant) notFound();

  const configuration = await findPublicFeedbackConfiguration(
    db,
    tenant,
    tenantSlug,
  );
  if (!configuration?.enabled) notFound();

  return (
    <FeedbackForm
      tenantSlug={configuration.slug}
      establishmentName={configuration.establishmentName}
      externalLinks={{
        google: configuration.googleReviewUrl,
        facebook: configuration.facebookReviewUrl,
        instagram: configuration.instagramUrl,
      }}
    />
  );
}
