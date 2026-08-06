import { getBookingAdministration } from '@yuta/db-cloud';
import { Badge, Card, Separator } from '@yuta/ui';
import {
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Moon,
  SunMedium,
  Utensils,
} from 'lucide-react';
import { BackofficePage } from '../../../../components/backoffice-page';
import { requireBookingPermission } from '../../../../server/auth/permissions';
import { requireBookingTenant } from '../../../../server/auth/session';
import { cloudDatabase } from '../../../../server/cloud-database';
import {
  AddServiceForm,
  BookingRules,
  DeleteServicePeriodButton,
  ExceptionsPanel,
} from './hours-services-forms';
import {
  exceptionKindLabels,
  formatMinutes,
  formatTimeRange,
  getPublicScheduleRows,
  getDateInTimezone,
  getDayOfWeekInTimezone,
  getNextDatedItem,
  orderedWeekDays,
} from './hours-services-view-model';

type AdministrationData = Awaited<ReturnType<typeof getBookingAdministration>>;
type ServicePeriod = AdministrationData['periods'][number];
type BookingException = AdministrationData['exceptions'][number];

export default async function Page() {
  const { tenant } = await requireBookingTenant(
    '/establishment/hours-services',
  );
  requireBookingPermission(tenant, 'booking.settings.manage');
  const data = await getBookingAdministration(cloudDatabase, tenant);
  const settings = data.settings;
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
      description="Configurez les horaires d’ouverture, les services et les exceptions."
    >
      <TodaySummary
        periods={todayPeriods}
        nextException={nextException}
        locale={locale}
      />

      <nav
        aria-label="Sections des horaires"
        className="flex flex-wrap gap-2 border-b border-border-default pb-3"
      >
        <a
          href="#horaires-reguliers"
          className="rounded-lg bg-surface-selected px-3 py-2 text-sm font-semibold text-action-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
        >
          Horaires réguliers
        </a>
        <a
          href="#jours-exceptionnels"
          className="rounded-lg px-3 py-2 text-sm font-semibold text-muted transition-colors hover:bg-surface-muted hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
        >
          Jours exceptionnels
        </a>
      </nav>

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <WeeklySchedule
          periods={data.periods}
          averageDurationMinutes={settings?.averageDurationMinutes ?? 90}
          todayDayOfWeek={todayDayOfWeek}
        />

        <aside className="grid gap-5">
          <BookingRules settings={settings} />
          <PublicPreview periods={data.periods} />
          <ExceptionsPanel
            exceptions={upcomingExceptions}
            periods={data.periods}
            locale={locale}
          />
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

function WeeklySchedule({
  periods,
  averageDurationMinutes,
  todayDayOfWeek,
}: {
  periods: readonly ServicePeriod[];
  averageDurationMinutes: number;
  todayDayOfWeek: number;
}) {
  return (
    <Card
      id="horaires-reguliers"
      padding="none"
      radius="lg"
      className="overflow-hidden"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
        <div>
          <h2 className="text-lg font-bold">Horaires hebdomadaires</h2>
          <p className="mt-1 text-sm text-muted">
            Définissez les services proposés chaque jour.
          </p>
        </div>
        <Badge tone="success" variant="soft">
          {periods.filter((period) => period.enabled).length} services actifs
        </Badge>
      </div>
      <Separator />
      <div className="grid gap-3 p-3 sm:p-5">
        {orderedWeekDays.map((day) => {
          const dayPeriods = periods.filter(
            (period) => period.dayOfWeek === day.value,
          );
          return (
            <DaySchedule
              key={day.value}
              day={day}
              periods={dayPeriods}
              averageDurationMinutes={averageDurationMinutes}
              defaultOpen={day.value === todayDayOfWeek}
            />
          );
        })}
      </div>
    </Card>
  );
}

function DaySchedule({
  day,
  periods,
  averageDurationMinutes,
  defaultOpen,
}: {
  day: (typeof orderedWeekDays)[number];
  periods: readonly ServicePeriod[];
  averageDurationMinutes: number;
  defaultOpen: boolean;
}) {
  const enabledPeriods = periods.filter((period) => period.enabled);

  return (
    <details
      open={defaultOpen}
      className="group overflow-hidden rounded-xl border border-border-default bg-surface"
    >
      <summary className="flex min-h-14 cursor-pointer list-none items-center gap-3 px-4 py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus-ring [&::-webkit-details-marker]:hidden">
        <ChevronDown
          className="h-4 w-4 shrink-0 -rotate-90 transition-transform group-open:rotate-0"
          aria-hidden
        />
        <span className="font-bold">{day.label}</span>
        <span className="ml-auto hidden text-sm text-muted sm:block">
          {enabledPeriods.length > 0
            ? enabledPeriods
                .map((period) =>
                  formatTimeRange(period.startTime, period.endTime),
                )
                .join(' · ')
            : 'Fermé'}
        </span>
        <Badge
          tone={enabledPeriods.length > 0 ? 'success' : 'neutral'}
          size="sm"
        >
          {enabledPeriods.length > 0 ? 'Ouvert' : 'Fermé'}
        </Badge>
      </summary>

      <div className="grid gap-3 border-t border-border-default bg-canvas/50 p-3">
        {periods.map((period) => (
          <ServicePeriodRow
            key={period.id}
            period={period}
            averageDurationMinutes={averageDurationMinutes}
          />
        ))}
        {periods.length === 0 && (
          <p className="rounded-lg border border-dashed border-border-default px-4 py-5 text-center text-sm text-muted">
            Aucun service configuré pour cette journée.
          </p>
        )}
        <AddServiceForm dayOfWeek={day.value} />
      </div>
    </details>
  );
}

function ServicePeriodRow({
  period,
  averageDurationMinutes,
}: {
  period: ServicePeriod;
  averageDurationMinutes: number;
}) {
  const lowerName = period.name.toLocaleLowerCase('fr-FR');
  const ServiceIcon =
    lowerName.includes('dîner') || lowerName.includes('soir')
      ? Moon
      : lowerName.includes('déjeuner') || lowerName.includes('midi')
        ? Utensils
        : SunMedium;

  return (
    <article className="grid gap-4 rounded-xl border border-border-default bg-surface p-4 md:grid-cols-[minmax(8rem,1.2fr)_repeat(3,minmax(6rem,1fr))_auto] md:items-center">
      <div className="flex min-w-0 items-center gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-status-success-soft text-status-success">
          <ServiceIcon className="h-5 w-5" aria-hidden />
        </span>
        <div className="min-w-0">
          <h3 className="truncate font-bold">{period.name}</h3>
          <Badge tone={period.enabled ? 'success' : 'neutral'} size="sm">
            {period.enabled ? 'Actif' : 'Inactif'}
          </Badge>
        </div>
      </div>
      <PeriodMetric
        label="Heures de service"
        value={formatTimeRange(period.startTime, period.endTime)}
      />
      <PeriodMetric label="Capacité" value={`${period.capacity} couverts`} />
      <PeriodMetric
        label="Durée d’une table"
        value={formatMinutes(averageDurationMinutes)}
      />
      <DeleteServicePeriodButton id={period.id} name={period.name} />
    </article>
  );
}

function PeriodMetric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-muted">{label}</p>
      <p className="mt-1 text-sm font-semibold">{value}</p>
    </div>
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
