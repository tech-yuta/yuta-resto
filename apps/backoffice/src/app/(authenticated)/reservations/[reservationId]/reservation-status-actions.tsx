import { Button } from '@yuta/ui';
import { updateReservationStatusAction } from '../reservation-actions';
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
        <form action={updateReservationStatusAction} key={nextStatus}>
          <input type="hidden" name="reservationId" value={reservationId} />
          <input type="hidden" name="status" value={nextStatus} />
          <Button
            type="submit"
            variant={
              nextStatus === 'CANCELLED' || nextStatus === 'DECLINED'
                ? 'danger'
                : 'outline'
            }
          >
            {nextStatus}
          </Button>
        </form>
      ))}
    </div>
  );
}
