import { redirect } from 'next/navigation';

export default async function ReviewDetailPage({
  params,
}: {
  params: Promise<{ reviewId: string }>;
}) {
  const { reviewId } = await params;
  redirect(`/customers/reviews?selected=${encodeURIComponent(reviewId)}`);
}
