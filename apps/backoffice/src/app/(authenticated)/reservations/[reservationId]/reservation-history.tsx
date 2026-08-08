import { Card } from '@yuta/ui';
import {
  formatReservationEventDate,
  type ReservationHistoryRecord,
} from './reservation-detail-model';

export function ReservationHistory({
  history,
  locale,
  timezone,
}: {
  history: readonly ReservationHistoryRecord[];
  locale: string;
  timezone: string;
}) {
  return (
    <Card padding="lg" className="lg:col-span-2">
      <h2 className="text-lg font-semibold">Historique</h2>
      <div className="mt-4 space-y-2">
        {history.map((item) => (
          <div
            key={item.id}
            className="flex justify-between border-b border-border-default py-2 text-sm"
          >
            <span>
              {item.fromStatus ?? 'CRÉATION'} → {item.toStatus}
            </span>
            <time className="text-muted">
              {formatReservationEventDate(item.createdAt, locale, timezone)}
            </time>
          </div>
        ))}
        {history.length === 0 && (
          <p className="text-sm text-muted">Aucun historique disponible.</p>
        )}
      </div>
    </Card>
  );
}
