import { getReservationDetails } from '@yuta/db-cloud';
import { Button } from '@yuta/ui';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { BackofficePage } from '../../../../components/backoffice-page';
import { requireBookingTenant } from '../../../../server/auth/session';
import { cloudDatabase } from '../../../../server/cloud-database';
import { ReservationEditForm } from './reservation-edit-form';
import { ReservationHistory } from './reservation-history';
import { ReservationNotes } from './reservation-notes';
import { ReservationOverview } from './reservation-overview';

type PageProps = { params: Promise<{ reservationId: string }> };

export default async function Page({ params }: PageProps) {
  const { reservationId } = await params;
  const { tenant } = await requireBookingTenant(
    `/reservations/${reservationId}`,
  );
  const details = await getReservationDetails(
    cloudDatabase,
    tenant,
    reservationId,
  );
  if (!details) notFound();

  const { reservation, notes, history } = details;
  return (
    <BackofficePage
      title={`${reservation.guestFirstName} ${reservation.guestLastName}`}
      description={reservation.reference}
      actions={
        <Button asChild variant="outline">
          <Link href="/reservations">Retour</Link>
        </Button>
      }
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <ReservationOverview reservation={reservation} />
        <ReservationEditForm reservation={reservation} />
        <ReservationNotes
          reservationId={reservation.id}
          notes={notes}
          locale={tenant.locale}
          timezone={tenant.timezone}
        />
        <ReservationHistory
          history={history}
          locale={tenant.locale}
          timezone={tenant.timezone}
        />
      </div>
    </BackofficePage>
  );
}
