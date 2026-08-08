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

const statusLabels = {
  CONFIRMED: 'Confirmée',
  PENDING: 'En attente de confirmation',
  DECLINED: 'Refusée',
  CANCELLED: 'Annulée',
  SEATED: 'Installée',
  COMPLETED: 'Terminée',
  NO_SHOW: 'Absence',
} as const;

function statusTone(status: keyof typeof statusLabels) {
  if (status === 'CONFIRMED' || status === 'SEATED') return 'success';
  if (status === 'PENDING') return 'warning';
  if (status === 'DECLINED' || status === 'CANCELLED') return 'danger';
  return 'neutral';
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'full',
    timeZone: 'UTC',
  }).format(new Date(`${value}T12:00:00Z`));
}

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
        <Badge tone={statusTone(reservation.status)}>
          {statusLabels[reservation.status]}
        </Badge>
        <h1 className="mt-4 text-2xl font-bold">
          {reservation.establishmentName}
        </h1>
        <p className="mt-1 text-secondary">Référence {reservation.reference}</p>
        <div className="mt-6 space-y-3">
          <p className="flex items-center gap-2">
            <CalendarDays aria-hidden /> {formatDate(reservation.date)} à{' '}
            {reservation.time}
          </p>
          <p className="flex items-center gap-2">
            <Users aria-hidden /> {reservation.partySize}{' '}
            {reservation.partySize > 1 ? 'personnes' : 'personne'}
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
