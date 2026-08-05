import { findBookingEstablishmentSlug, listReservations } from '@yuta/db-cloud';
import {
  Badge,
  Button,
  Card,
  FormField,
  Input,
  SimpleTable,
  SimpleTableBody,
  SimpleTableCell,
  SimpleTableHead,
  SimpleTableHeader,
  SimpleTableRow,
} from '@yuta/ui';
import { CalendarPlus, Settings } from 'lucide-react';
import Link from 'next/link';
import { BackofficePage } from '../../../../components/backoffice-page';
import { requireBookingTenant } from '../../../../server/auth/session';
import { cloudDatabase } from '../../../../server/cloud-database';
import {
  createManualReservationAction,
  updateReservationStatusAction,
} from './actions';

type PageProps = {
  searchParams: Promise<{ date?: string; view?: string; created?: string }>;
};

export default async function Page({ searchParams }: PageProps) {
  const { tenant } = await requireBookingTenant();
  const query = await searchParams;
  const selectedDate = /^\d{4}-\d{2}-\d{2}$/.test(query.date ?? '')
    ? query.date!
    : new Date().toISOString().slice(0, 10);
  const days = query.view === 'week' ? 7 : 1;
  const toDate = new Date(`${selectedDate}T00:00:00Z`);
  toDate.setUTCDate(toDate.getUTCDate() + days - 1);
  const rows = await listReservations(
    cloudDatabase,
    tenant,
    selectedDate,
    toDate.toISOString().slice(0, 10),
  );
  const establishmentSlug =
    (await findBookingEstablishmentSlug(cloudDatabase, tenant)) ?? '';

  return (
    <BackofficePage
      title="Réservations"
      description="Planning, demandes clients et opérations de service."
      actions={
        <Button asChild variant="outline">
          <Link href="/operations/reservations/settings">
            <Settings aria-hidden /> Paramètres
          </Link>
        </Button>
      }
    >
      <div className="flex flex-wrap gap-2">
        <Button asChild variant={query.view !== 'week' ? 'primary' : 'outline'}>
          <Link href={`/operations/reservations?date=${selectedDate}`}>
            Jour
          </Link>
        </Button>
        <Button asChild variant={query.view === 'week' ? 'primary' : 'outline'}>
          <Link
            href={`/operations/reservations?date=${selectedDate}&view=week`}
          >
            Semaine
          </Link>
        </Button>
        <form className="flex gap-2">
          <Input type="date" name="date" defaultValue={selectedDate} />
          <Button type="submit" variant="secondary">
            Afficher
          </Button>
        </form>
      </div>

      <Card padding="none">
        <SimpleTable>
          <SimpleTableHeader>
            <SimpleTableRow>
              <SimpleTableHead>Horaire</SimpleTableHead>
              <SimpleTableHead>Client</SimpleTableHead>
              <SimpleTableHead>Convives</SimpleTableHead>
              <SimpleTableHead>Statut</SimpleTableHead>
              <SimpleTableHead>Actions</SimpleTableHead>
            </SimpleTableRow>
          </SimpleTableHeader>
          <SimpleTableBody>
            {rows.map((reservation) => (
              <SimpleTableRow key={reservation.id}>
                <SimpleTableCell>
                  <Link
                    className="font-semibold hover:underline"
                    href={`/operations/reservations/${reservation.id}`}
                  >
                    {reservation.localDate} ·{' '}
                    {reservation.localTime.slice(0, 5)}
                  </Link>
                </SimpleTableCell>
                <SimpleTableCell>
                  {reservation.guestFirstName} {reservation.guestLastName}
                  <div className="text-xs text-muted">
                    {reservation.reference}
                  </div>
                </SimpleTableCell>
                <SimpleTableCell>{reservation.partySize}</SimpleTableCell>
                <SimpleTableCell>
                  <Badge
                    tone={
                      reservation.status === 'CONFIRMED'
                        ? 'success'
                        : reservation.status === 'PENDING'
                          ? 'warning'
                          : 'neutral'
                    }
                  >
                    {reservation.status}
                  </Badge>
                </SimpleTableCell>
                <SimpleTableCell>
                  <StatusActions
                    id={reservation.id}
                    status={reservation.status}
                  />
                </SimpleTableCell>
              </SimpleTableRow>
            ))}
            {rows.length === 0 && (
              <SimpleTableRow>
                <SimpleTableCell
                  colSpan={5}
                  className="py-8 text-center text-muted"
                >
                  Aucune réservation sur cette période.
                </SimpleTableCell>
              </SimpleTableRow>
            )}
          </SimpleTableBody>
        </SimpleTable>
      </Card>

      <Card padding="lg">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <CalendarPlus aria-hidden /> Ajouter une réservation
        </h2>
        <form
          action={createManualReservationAction}
          className="mt-4 grid gap-4 md:grid-cols-3"
        >
          <input
            type="hidden"
            name="establishmentSlug"
            value={establishmentSlug}
          />
          <FormField label="Date">
            <Input
              name="date"
              type="date"
              defaultValue={selectedDate}
              required
            />
          </FormField>
          <FormField label="Heure">
            <Input name="time" type="time" required />
          </FormField>
          <FormField label="Convives">
            <Input
              name="partySize"
              type="number"
              min={1}
              max={30}
              defaultValue={2}
              required
            />
          </FormField>
          <FormField label="Prénom">
            <Input name="firstName" required />
          </FormField>
          <FormField label="Nom">
            <Input name="lastName" required />
          </FormField>
          <FormField label="Téléphone">
            <Input name="phone" type="tel" required />
          </FormField>
          <FormField label="E-mail">
            <Input name="email" type="email" required />
          </FormField>
          <FormField label="Note">
            <Input name="specialRequirements" />
          </FormField>
          <div className="flex items-end">
            <Button type="submit">Créer</Button>
          </div>
        </form>
      </Card>
    </BackofficePage>
  );
}

function StatusActions({ id, status }: { id: string; status: string }) {
  const next =
    status === 'PENDING'
      ? ['CONFIRMED', 'DECLINED']
      : status === 'CONFIRMED'
        ? ['SEATED', 'CANCELLED', 'NO_SHOW']
        : status === 'SEATED'
          ? ['COMPLETED']
          : [];
  return (
    <div className="flex flex-wrap gap-1">
      {next.map((value) => (
        <form action={updateReservationStatusAction} key={value}>
          <input type="hidden" name="reservationId" value={id} />
          <input type="hidden" name="status" value={value} />
          <Button
            size="sm"
            variant={
              value === 'CANCELLED' || value === 'DECLINED'
                ? 'danger'
                : 'outline'
            }
            type="submit"
          >
            {value}
          </Button>
        </form>
      ))}
    </div>
  );
}
