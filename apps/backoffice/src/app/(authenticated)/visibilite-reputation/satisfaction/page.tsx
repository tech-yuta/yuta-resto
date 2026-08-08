import { loadReviewsPage } from '../avis/reviews-loader';

export const dynamic = 'force-dynamic';

type ReviewSearchParams = Record<string, string | string[] | undefined>;

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<ReviewSearchParams>;
}) {
  return loadReviewsPage(await searchParams, 'direct');
}
