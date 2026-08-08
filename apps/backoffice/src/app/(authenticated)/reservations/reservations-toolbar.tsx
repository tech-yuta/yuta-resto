import { Button, Input } from '@yuta/ui';
import Link from 'next/link';
import type { ReservationListView } from './reservations-list-model';

export function ReservationsToolbar({
  selectedDate,
  view,
}: {
  selectedDate: string;
  view: ReservationListView;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button asChild variant={view === 'day' ? 'primary' : 'outline'}>
        <Link href={`/reservations?date=${selectedDate}`}>Jour</Link>
      </Button>
      <Button asChild variant={view === 'week' ? 'primary' : 'outline'}>
        <Link href={`/reservations?date=${selectedDate}&view=week`}>
          Semaine
        </Link>
      </Button>
      <form className="flex gap-2">
        <Input type="date" name="date" defaultValue={selectedDate} />
        {view === 'week' && <input type="hidden" name="view" value="week" />}
        <Button type="submit" variant="secondary">
          Afficher
        </Button>
      </form>
    </div>
  );
}
