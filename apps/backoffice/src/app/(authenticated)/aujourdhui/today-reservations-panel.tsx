import { Badge, Button, EmptyState, Panel } from '@yuta/ui';
import { ArrowRight, CalendarCheck } from 'lucide-react';
import Link from 'next/link';
import type { TodayReservationItem, TodaySection } from './today-data';
import { TodaySectionUnavailable } from './today-section-unavailable';

type TodayReservationsSection = TodaySection<{
  count: number;
  confirmedCount: number;
  pendingCount: number;
  items: TodayReservationItem[];
}>;

export function TodayReservationsPanel({
  section,
  localDate,
}: {
  section: TodayReservationsSection;
  localDate: string;
}) {
  return (
    <Panel
      title="Réservations aujourd’hui"
      description="Les prochaines arrivées de l’établissement."
      action={
        <Button asChild variant="secondary" size="sm">
          <Link href={`/reservations?date=${localDate}`}>Voir tout</Link>
        </Button>
      }
    >
      {section.state === 'ready' && (
        <div className="divide-y divide-border-default">
          {section.data.items.map((reservation) => (
            <ReservationRow key={reservation.id} reservation={reservation} />
          ))}
        </div>
      )}
      {section.state === 'empty' && (
        <EmptyState
          icon={<CalendarCheck className="mx-auto h-8 w-8" aria-hidden />}
          title="Aucune réservation prévue aujourd’hui"
          description="Les nouvelles réservations apparaîtront ici."
        />
      )}
      {section.state === 'unavailable' && <TodaySectionUnavailable />}
    </Panel>
  );
}

function ReservationRow({
  reservation,
}: {
  reservation: TodayReservationItem;
}) {
  return (
    <Link
      href={`/reservations/${reservation.id}`}
      className="grid gap-3 px-5 py-4 transition-colors hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus-ring sm:grid-cols-[4rem_minmax(0,1fr)_auto_auto] sm:items-center"
    >
      <span className="font-bold tabular-nums">{reservation.localTime}</span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-semibold">
          {reservation.guestName}
        </span>
        <span className="text-xs text-muted">
          {reservation.partySize} personne(s)
        </span>
      </span>
      <Badge tone={reservation.statusTone} size="sm">
        {reservation.statusLabel}
      </Badge>
      <ArrowRight className="hidden h-4 w-4 text-muted sm:block" aria-hidden />
    </Link>
  );
}
