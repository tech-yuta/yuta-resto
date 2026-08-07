import { getBookingAdministration } from '@yuta/db-cloud';
import { Card, Separator } from '@yuta/ui';
import { CalendarDays, CheckCircle2 } from 'lucide-react';
import { BackofficePage } from '../../../../components/backoffice-page';
import { requireBookingPermission } from '../../../../server/auth/permissions';
import { requireBookingTenant } from '../../../../server/auth/session';
import { cloudDatabase } from '../../../../server/cloud-database';
import { ExceptionsPanel } from '../booking-administration-forms';
import {
  exceptionKindLabels,
  formatTimeRange,
  getPublicScheduleRows,
  getDateInTimezone,
  getDayOfWeekInTimezone,
  getNextDatedItem,
} from '../booking-schedule-view-model';
import { WeeklyScheduleSection } from './weekly-schedule-section';

type AdministrationData = Awaited<ReturnType<typeof getBookingAdministration>>;
type ServicePeriod = AdministrationData['periods'][number];
type BookingException = AdministrationData['exceptions'][number];

export default async function Page() {
  const { tenant } = await requireBookingTenant(
    '/etablissement/horaires-services',
  );
  requireBookingPermission(tenant, 'booking.settings.manage');
  const data = await getBookingAdministration(cloudDatabase, tenant);
  const timezone = data.establishment?.timezone ?? 'Europe/Paris';
  const locale = data.establishment?.locale ?? 'fr-FR';
  const today = getDateInTimezone(timezone);
  const todayDayOfWeek = getDayOfWeekInTimezone(timezone);
  const todayPeriods = data.periods.filter(
    (period) => period.dayOfWeek === todayDayOfWeek && period.enabled,
  );
  const upcomingExceptions = [...data.exceptions]
    .filter((exception) => exception.exceptionDate >= today)
    .sort((left, right) =>
      left.exceptionDate.localeCompare(right.exceptionDate),
    );
  const nextException = getNextDatedItem(data.exceptions, today);

  return (
    <BackofficePage
      title="Horaires & services"
      description="Consultez les services et gérez les jours exceptionnels."
    >
      <TodaySummary
        periods={todayPeriods}
        nextException={nextException}
        locale={locale}
      />

      <WeeklyScheduleSection
        periods={data.periods}
        averageDurationMinutes={data.settings?.averageDurationMinutes ?? 90}
        todayDayOfWeek={todayDayOfWeek}
        canEdit
      />

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <ExceptionsPanel
          exceptions={upcomingExceptions}
          periods={data.periods}
          locale={locale}
        />

        <aside>
          <PublicPreview periods={data.periods} />
        </aside>
      </div>
    </BackofficePage>
  );
}

function TodaySummary({
  periods,
  nextException,
  locale,
}: {
  periods: readonly ServicePeriod[];
  nextException?: BookingException;
  locale: string;
}) {
  return (
    <section className="flex flex-wrap items-center gap-x-6 gap-y-3 rounded-xl border border-status-success-border bg-status-success-soft/40 px-4 py-3 text-sm">
      <span className="inline-flex items-center gap-2 font-semibold">
        <span className="grid h-8 w-8 place-items-center rounded-full bg-status-success-soft text-status-success">
          <CalendarDays className="h-4 w-4" aria-hidden />
        </span>
        Aujourd’hui :
        <span
          className={periods.length > 0 ? 'text-status-success' : 'text-muted'}
        >
          {periods.length > 0 ? 'Ouvert' : 'Fermé'}
        </span>
      </span>

      {periods.map((period) => (
        <span
          key={period.id}
          className="inline-flex items-center gap-2 border-l border-border-default pl-6"
        >
          <strong>{period.name}</strong>
          {formatTimeRange(period.startTime, period.endTime)}
        </span>
      ))}

      <span className="min-w-0 border-l border-border-default pl-6">
        <strong>Prochaine exception :</strong>{' '}
        {nextException
          ? `${exceptionKindLabels[nextException.kind]} le ${formatDate(nextException.exceptionDate, locale)}`
          : 'Aucune exception planifiée'}
      </span>
    </section>
  );
}

function PublicPreview({ periods }: { periods: readonly ServicePeriod[] }) {
  const summaries = getPublicScheduleRows(periods);

  return (
    <Card padding="none" radius="lg" className="overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-4">
        <CheckCircle2 className="h-5 w-5" aria-hidden />
        <h2 className="font-bold">Aperçu public</h2>
      </div>
      <Separator />
      <div className="grid gap-3 p-5 text-sm">
        {summaries.map((summary) => {
          return (
            <div key={summary.label} className="flex justify-between gap-3">
              <span className="text-muted">{summary.label}</span>
              <span className="text-right font-medium">
                {summary.ranges.length > 0
                  ? summary.ranges.join(' · ')
                  : 'Fermé'}
              </span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function formatDate(value: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${value}T12:00:00Z`));
}
