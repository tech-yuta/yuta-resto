import { BookingAdministrationDeleteButton } from './booking-administration-delete-button';
import {
  formatBookingExceptionDate,
  type BookingException,
} from './booking-administration-model';
import { deleteExceptionAction } from './booking-exception-actions';
import { exceptionKindLabels } from './booking-schedule-view-model';

export function BookingExceptionList({
  exceptions,
  locale,
}: {
  exceptions: readonly BookingException[];
  locale: string;
}) {
  if (exceptions.length === 0) {
    return (
      <p className="px-2 py-4 text-center text-sm text-muted">
        Aucune exception planifiée.
      </p>
    );
  }

  return exceptions
    .slice(0, 5)
    .map((exception) => (
      <BookingExceptionRow
        key={exception.id}
        exception={exception}
        locale={locale}
      />
    ));
}

function BookingExceptionRow({
  exception,
  locale,
}: {
  exception: BookingException;
  locale: string;
}) {
  const formattedDate = formatBookingExceptionDate(
    exception.exceptionDate,
    locale,
  );

  return (
    <div className="grid grid-cols-[1fr_auto] items-center gap-2 rounded-lg px-2 py-2 hover:bg-surface-muted">
      <div className="min-w-0">
        <p className="text-sm font-semibold">{formattedDate}</p>
        <p className="mt-1 truncate text-xs text-muted">
          {exceptionKindLabels[exception.kind]}
        </p>
      </div>
      <BookingAdministrationDeleteButton
        id={exception.id}
        action={deleteExceptionAction}
        accessibleLabel={`Supprimer l’exception du ${formattedDate}`}
        title="Supprimer cette exception ?"
        description="Cette exception sera supprimée définitivement."
      />
    </div>
  );
}
