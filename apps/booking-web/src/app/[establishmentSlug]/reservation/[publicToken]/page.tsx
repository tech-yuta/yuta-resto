import {
  findPublicBookingConfiguration,
  findPublicReservation,
} from '@yuta/db-cloud';
import { Badge, Button, Card } from '@yuta/ui';
import { CalendarDays, Users } from 'lucide-react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { cloudDatabase } from '../../../../server/cloud-database';
import { CancelReservationButton } from './cancel-reservation-button';

type PageProps = {
  params: Promise<{ establishmentSlug: string; publicToken: string }>;
};
export const metadata: Metadata = {
  title: 'Ma réservation',
  robots: { index: false, follow: false },
};

export default async function Page({ params }: PageProps) {
  const { establishmentSlug, publicToken } = await params;
  const config = await findPublicBookingConfiguration(
    cloudDatabase,
    establishmentSlug,
  );
  if (!config) notFound();
  const reservation = await findPublicReservation(
    cloudDatabase,
    config,
    publicToken,
  );
  if (!reservation) notFound();
  return (
    <main className="mx-auto flex min-h-screen max-w-xl items-center px-4 py-10">
      <Card padding="lg" className="w-full">
        <Badge
          tone={reservation.status === 'CONFIRMED' ? 'success' : 'warning'}
        >
          {reservation.status}
        </Badge>
        <h1 className="mt-4 text-2xl font-bold">
          {reservation.establishmentName}
        </h1>
        <p className="mt-1 text-secondary">Référence {reservation.reference}</p>
        <div className="mt-6 space-y-3">
          <p className="flex items-center gap-2">
            <CalendarDays aria-hidden /> {reservation.date} à {reservation.time}
          </p>
          <p className="flex items-center gap-2">
            <Users aria-hidden /> {reservation.partySize} personne(s)
          </p>
        </div>
        {reservation.cancellable && (
          <CancelReservationButton
            slug={establishmentSlug}
            publicToken={publicToken}
          />
        )}
        <Button asChild variant="ghost" className="mt-3">
          <a href={`/${establishmentSlug}`}>Nouvelle réservation</a>
        </Button>
      </Card>
    </main>
  );
}
