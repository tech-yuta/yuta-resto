import { ReservationStatusActionForm } from '../reservation-status-action-form';
import { getReservationStatusTransitions } from '../reservation-status-model';

export function ReservationStatusActions({
  reservationId,
  status,
}: {
  reservationId: string;
  status: string;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {getReservationStatusTransitions(status).map((nextStatus) => (
        <ReservationStatusActionForm
          key={nextStatus}
          reservationId={reservationId}
          nextStatus={nextStatus}
        />
      ))}
    </div>
  );
}
