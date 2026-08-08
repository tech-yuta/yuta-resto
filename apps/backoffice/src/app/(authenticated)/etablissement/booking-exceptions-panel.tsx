import { Card, Separator } from '@yuta/ui';
import { CalendarClock } from 'lucide-react';
import type {
  BookingException,
  ServicePeriodOption,
} from './booking-administration-model';
import { BookingExceptionForm } from './booking-exception-form';
import { BookingExceptionList } from './booking-exception-list';

export function ExceptionsPanel({
  exceptions,
  periods,
  locale,
}: {
  exceptions: readonly BookingException[];
  periods: readonly ServicePeriodOption[];
  locale: string;
}) {
  return (
    <Card
      id="jours-exceptionnels"
      padding="none"
      radius="lg"
      className="overflow-hidden scroll-mt-6"
    >
      <div className="flex items-center gap-2 px-5 py-4">
        <CalendarClock className="h-5 w-5" aria-hidden />
        <h2 className="font-bold">Exceptions à venir</h2>
      </div>
      <Separator />
      <div className="grid gap-1 p-3">
        <BookingExceptionList exceptions={exceptions} locale={locale} />
      </div>
      <Separator />
      <BookingExceptionForm periods={periods} />
    </Card>
  );
}
