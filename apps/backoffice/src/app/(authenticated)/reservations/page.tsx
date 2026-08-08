import { findBookingEstablishmentSlug, listReservations } from '@yuta/db-cloud';
import { BackofficePage } from '../../../components/backoffice-page';
import { requireBookingTenant } from '../../../server/auth/session';
import { cloudDatabase } from '../../../server/cloud-database';
import { ManualReservationForm } from './manual-reservation-form';
import { ReservationsFeedback } from './reservations-feedback';
import {
  getReservationListEndDate,
  resolveReservationListDate,
  resolveReservationListView,
} from './reservations-list-model';
import { ReservationsTable } from './reservations-table';
import { ReservationsToolbar } from './reservations-toolbar';

type PageProps = {
  searchParams: Promise<{ date?: string; view?: string; created?: string }>;
};

export default async function Page({ searchParams }: PageProps) {
  const { tenant } = await requireBookingTenant();
  const query = await searchParams;
  const selectedDate = resolveReservationListDate(query.date, tenant.timezone);
  const view = resolveReservationListView(query.view);
  const toDate = getReservationListEndDate(selectedDate, view);
  const [reservations, establishmentSlug] = await Promise.all([
    listReservations(cloudDatabase, tenant, selectedDate, toDate),
    findBookingEstablishmentSlug(cloudDatabase, tenant),
  ]);

  return (
    <BackofficePage
      title="Réservations"
      description="Planning, demandes clients et opérations de service."
    >
      <ReservationsFeedback created={query.created === '1'} />
      <ReservationsToolbar selectedDate={selectedDate} view={view} />
      <ReservationsTable reservations={reservations} />
      <ManualReservationForm
        establishmentSlug={establishmentSlug ?? ''}
        selectedDate={selectedDate}
      />
    </BackofficePage>
  );
}
