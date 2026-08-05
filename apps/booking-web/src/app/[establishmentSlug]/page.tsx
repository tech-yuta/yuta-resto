import { findPublicBookingConfiguration } from '@yuta/db-cloud';
import { Card } from '@yuta/ui';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { cloudDatabase } from '../../server/cloud-database';
import { BookingFlow } from './booking-flow';

type PageProps = {
  params: Promise<{ establishmentSlug: string }>;
  searchParams: Promise<{ source?: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { establishmentSlug } = await params;
  const config = await findPublicBookingConfiguration(
    cloudDatabase,
    establishmentSlug,
  );
  if (!config) {
    return { title: 'Réservation indisponible', robots: { index: false } };
  }
  return {
    title: `Réserver chez ${config.establishmentName}`,
    description: `Réservez une table chez ${config.establishmentName}.`,
    alternates: { canonical: `/${config.slug}` },
  };
}

export default async function Page({ params, searchParams }: PageProps) {
  const { establishmentSlug } = await params;
  const config = await findPublicBookingConfiguration(
    cloudDatabase,
    establishmentSlug,
  );
  if (!config) notFound();

  const sourceValue = (await searchParams).source?.toUpperCase();
  const source = [
    'GOOGLE',
    'FACEBOOK',
    'INSTAGRAM',
    'TIKTOK',
    'QR_CODE',
    'WEBSITE',
  ].includes(sourceValue ?? '')
    ? (sourceValue as
        | 'GOOGLE'
        | 'FACEBOOK'
        | 'INSTAGRAM'
        | 'TIKTOK'
        | 'QR_CODE'
        | 'WEBSITE')
    : 'DIRECT';

  return (
    <main className="relative min-h-dvh overflow-hidden bg-surface sm:bg-canvas sm:px-6 sm:py-10">
      <div className="pointer-events-none absolute inset-x-0 top-0 hidden h-72 bg-surface-selected opacity-70 sm:block" />
      <div className="relative mx-auto min-h-dvh w-full max-w-[420px] sm:min-h-0">
        <Card
          padding="none"
          radius="lg"
          className="min-h-dvh overflow-hidden rounded-none border-0 shadow-none sm:min-h-0 sm:rounded-lg sm:border sm:shadow-lg"
        >
          <BookingFlow
            establishment={{
              name: config.establishmentName,
              slug: config.slug,
              timezone: config.timezone,
              logoUrl: config.logoUrl,
              welcomeMessage: config.welcomeMessage,
              minimumPartySize: config.minimumPartySize,
              maximumPartySize: config.maximumPartySize,
              bookingWindowDays: config.bookingWindowDays,
              bookingPolicy: config.bookingPolicy,
              publicPhone: config.publicPhone,
              address: config.address,
            }}
            source={source}
          />
        </Card>
      </div>
    </main>
  );
}
