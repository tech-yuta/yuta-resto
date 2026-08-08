import { Badge, Card } from '@yuta/ui';
import { getReservationStatusTone } from '../reservation-status-model';
import type { ReservationDetailRecord } from './reservation-detail-model';
import { ReservationStatusActions } from './reservation-status-actions';

export function ReservationOverview({
  reservation,
}: {
  reservation: ReservationDetailRecord;
}) {
  return (
    <Card padding="lg">
      <Badge tone={getReservationStatusTone(reservation.status)}>
        {reservation.status}
      </Badge>
      <dl className="mt-5 grid grid-cols-2 gap-4">
        <ReservationFact
          label="Date"
          value={`${reservation.localDate} à ${reservation.localTime.slice(0, 5)}`}
        />
        <ReservationFact
          label="Convives"
          value={String(reservation.partySize)}
        />
        <ReservationFact label="E-mail" value={reservation.guestEmail} />
        <ReservationFact label="Téléphone" value={reservation.guestPhone} />
        <ReservationFact
          label="Demande"
          value={reservation.specialRequirements || '—'}
          wide
        />
      </dl>
      <div className="mt-6">
        <ReservationStatusActions
          reservationId={reservation.id}
          status={reservation.status}
        />
      </div>
    </Card>
  );
}

function ReservationFact({
  label,
  value,
  wide = false,
}: {
  label: string;
  value: string;
  wide?: boolean;
}) {
  return (
    <div className={wide ? 'col-span-2' : undefined}>
      <dt className="text-sm text-muted">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
