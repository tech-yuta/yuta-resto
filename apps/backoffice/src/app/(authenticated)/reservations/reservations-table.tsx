import {
  Badge,
  Button,
  Card,
  SimpleTable,
  SimpleTableBody,
  SimpleTableCell,
  SimpleTableHead,
  SimpleTableHeader,
  SimpleTableRow,
} from '@yuta/ui';
import Link from 'next/link';
import { updateReservationStatusAction } from './reservation-actions';
import {
  getReservationStatusTone,
  getReservationStatusTransitions,
} from './reservation-status-model';
import type { ReservationListItem } from './reservations-list-model';

export function ReservationsTable({
  reservations,
}: {
  reservations: readonly ReservationListItem[];
}) {
  return (
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
          {reservations.map((reservation) => (
            <SimpleTableRow key={reservation.id}>
              <SimpleTableCell>
                <Link
                  className="font-semibold hover:underline"
                  href={`/reservations/${reservation.id}`}
                >
                  {reservation.localDate} · {reservation.localTime.slice(0, 5)}
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
                <Badge tone={getReservationStatusTone(reservation.status)}>
                  {reservation.status}
                </Badge>
              </SimpleTableCell>
              <SimpleTableCell>
                <ReservationStatusActions
                  id={reservation.id}
                  status={reservation.status}
                />
              </SimpleTableCell>
            </SimpleTableRow>
          ))}
          {reservations.length === 0 && <ReservationsTableEmptyRow />}
        </SimpleTableBody>
      </SimpleTable>
    </Card>
  );
}

function ReservationStatusActions({
  id,
  status,
}: {
  id: string;
  status: string;
}) {
  const transitions = getReservationStatusTransitions(status);
  return (
    <div className="flex flex-wrap gap-1">
      {transitions.map((value) => (
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

function ReservationsTableEmptyRow() {
  return (
    <SimpleTableRow>
      <SimpleTableCell colSpan={5} className="py-8 text-center text-muted">
        Aucune réservation sur cette période.
      </SimpleTableCell>
    </SimpleTableRow>
  );
}
