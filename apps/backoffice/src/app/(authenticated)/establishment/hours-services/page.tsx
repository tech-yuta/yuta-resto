import { getBookingAdministration } from '@yuta/db-cloud';
import {
  Badge,
  Button,
  Card,
  FormField,
  IconButton,
  Input,
  Separator,
  Textarea,
} from '@yuta/ui';
import {
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Moon,
  Plus,
  Save,
  Settings2,
  SunMedium,
  Timer,
  Trash2,
  Utensils,
} from 'lucide-react';
import { BackofficePage } from '../../../../components/backoffice-page';
import { requireBookingPermission } from '../../../../server/auth/permissions';
import { requireBookingTenant } from '../../../../server/auth/session';
import { cloudDatabase } from '../../../../server/cloud-database';
import {
  createExceptionAction,
  createServicePeriodAction,
  deleteExceptionAction,
  deleteServicePeriodAction,
  saveBookingSettingsAction,
} from '../../operations/reservations/actions';
import {
  exceptionKindLabels,
  formatMinutes,
  formatTimeRange,
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
      actions={
        <Button type="submit" form="booking-settings-form" variant="success">
          <Save className="h-4 w-4" aria-hidden />
          Enregistrer
        </Button>
      }
    >
      <TodaySummary
        periods={todayPeriods}
        nextException={nextException}
        locale={locale}
      />

      <nav
        aria-label="Sections des horaires"
        className="flex gap-6 border-b border-border-default"
      >
        <a
          href="#horaires-reguliers"
          className="border-b-2 border-action-primary px-1 pb-3 text-sm font-semibold text-action-primary"
        >
          Horaires réguliers
        </a>
        <a
          href="#jours-exceptionnels"
          className="px-1 pb-3 text-sm font-semibold text-muted transition-colors hover:text-primary"
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
        <AddServiceForm day={day} />
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
      <form action={deleteServicePeriodAction} className="justify-self-end">
        <input type="hidden" name="id" value={period.id} />
        <IconButton
          type="submit"
          variant="ghost"
          size="sm"
          aria-label={`Supprimer le service ${period.name}`}
          title="Supprimer le service"
          className="text-status-danger"
        >
          <Trash2 className="h-4 w-4" aria-hidden />
        </IconButton>
      </form>
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

function AddServiceForm({ day }: { day: (typeof orderedWeekDays)[number] }) {
  return (
    <details className="group rounded-xl border border-dashed border-border-default bg-surface">
      <summary className="flex cursor-pointer list-none items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-action-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus-ring [&::-webkit-details-marker]:hidden">
        <Plus className="h-4 w-4" aria-hidden />
        Ajouter un service
      </summary>
      <form
        action={createServicePeriodAction}
        className="grid gap-3 border-t border-border-default p-4 sm:grid-cols-2 lg:grid-cols-5"
      >
        <input type="hidden" name="dayOfWeek" value={day.value} />
        <FormField label="Nom du service">
          <Input name="name" placeholder="Déjeuner" required />
        </FormField>
        <FormField label="Début">
          <Input name="startTime" type="time" required />
        </FormField>
        <FormField label="Fin">
          <Input name="endTime" type="time" required />
        </FormField>
        <FormField label="Capacité">
          <Input name="capacity" type="number" min={1} required />
        </FormField>
        <div className="flex items-end">
          <Button type="submit" fullWidth>
            Ajouter
          </Button>
        </div>
      </form>
    </details>
  );
}

function BookingRules({
  settings,
}: {
  settings: AdministrationData['settings'];
}) {
  return (
    <Card padding="none" radius="lg" className="overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-4">
        <Settings2 className="h-5 w-5" aria-hidden />
        <h2 className="font-bold">Règles de réservation</h2>
      </div>
      <Separator />
      <form
        id="booking-settings-form"
        action={saveBookingSettingsAction}
        className="grid gap-4 p-5"
      >
        <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg bg-surface-muted px-3 py-2.5 text-sm font-semibold">
          Réservation publique
          <span className="relative inline-flex h-6 w-11 shrink-0 items-center">
            <input
              name="enabled"
              type="checkbox"
              defaultChecked={settings?.enabled}
              className="peer sr-only"
            />
            <span className="absolute inset-0 rounded-full bg-neutral-300 transition peer-checked:bg-action-primary peer-focus-visible:ring-2 peer-focus-visible:ring-focus-ring peer-focus-visible:ring-offset-2" />
            <span className="absolute left-0.5 h-5 w-5 rounded-full bg-surface shadow-sm transition-transform peer-checked:translate-x-5" />
          </span>
        </label>

        <RuleNumberField
          icon={Clock3}
          label="Préavis minimum"
          name="minimumNoticeMinutes"
          defaultValue={settings?.minimumNoticeMinutes ?? 120}
          suffix="min"
          min={0}
        />
        <RuleNumberField
          icon={CalendarDays}
          label="Fenêtre de réservation"
          name="bookingWindowDays"
          defaultValue={settings?.bookingWindowDays ?? 60}
          suffix="jours"
          min={0}
        />
        <RuleNumberField
          icon={Timer}
          label="Intervalle des créneaux"
          name="slotIntervalMinutes"
          defaultValue={settings?.slotIntervalMinutes ?? 30}
          suffix="min"
          min={5}
        />
        <RuleNumberField
          icon={Timer}
          label="Durée moyenne"
          name="averageDurationMinutes"
          defaultValue={settings?.averageDurationMinutes ?? 90}
          suffix="min"
          min={15}
        />

        <Separator />
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Taille min.">
            <Input
              name="minimumPartySize"
              type="number"
              min={1}
              defaultValue={settings?.minimumPartySize ?? 1}
            />
          </FormField>
          <FormField label="Taille max.">
            <Input
              name="maximumPartySize"
              type="number"
              min={1}
              defaultValue={settings?.maximumPartySize ?? 12}
            />
          </FormField>
        </div>
        <FormField label="Confirmation">
          <select
            name="confirmationMode"
            defaultValue={settings?.confirmationMode ?? 'MANUAL'}
            className="h-10 rounded-lg border border-border-default bg-surface px-3 text-sm"
          >
            <option value="MANUAL">Manuelle</option>
            <option value="AUTOMATIC">Automatique</option>
          </select>
        </FormField>
        <RuleNumberField
          icon={CalendarClock}
          label="Délai d’annulation"
          name="cancellationDeadlineMinutes"
          defaultValue={settings?.cancellationDeadlineMinutes ?? 120}
          suffix="min"
          min={0}
        />

        <details className="group rounded-lg border border-border-default">
          <summary className="cursor-pointer list-none px-3 py-2.5 text-sm font-semibold [&::-webkit-details-marker]:hidden">
            Informations publiques
          </summary>
          <div className="grid gap-3 border-t border-border-default p-3">
            <FormField label="Téléphone public">
              <Input
                name="publicPhone"
                defaultValue={settings?.publicPhone ?? ''}
              />
            </FormField>
            <FormField label="E-mail public">
              <Input
                name="publicEmail"
                type="email"
                defaultValue={settings?.publicEmail ?? ''}
              />
            </FormField>
            <FormField label="Adresse">
              <Textarea name="address" defaultValue={settings?.address ?? ''} />
            </FormField>
            <FormField label="Message d’accueil">
              <Textarea
                name="welcomeMessage"
                defaultValue={settings?.welcomeMessage ?? ''}
              />
            </FormField>
            <FormField label="Politique de réservation">
              <Textarea
                name="bookingPolicy"
                defaultValue={settings?.bookingPolicy ?? ''}
              />
            </FormField>
          </div>
        </details>

        <Button type="submit" variant="success" fullWidth className="xl:hidden">
          <Save className="h-4 w-4" aria-hidden />
          Enregistrer
        </Button>
      </form>
    </Card>
  );
}

function RuleNumberField({
  icon: Icon,
  label,
  name,
  defaultValue,
  suffix,
  min,
}: {
  icon: typeof Clock3;
  label: string;
  name: string;
  defaultValue: number;
  suffix: string;
  min: number;
}) {
  return (
    <label className="grid grid-cols-[auto_1fr_5.5rem] items-center gap-2 text-sm">
      <span className="grid h-8 w-8 place-items-center rounded-full bg-status-success-soft text-status-success">
        <Icon className="h-4 w-4" aria-hidden />
      </span>
      <span className="font-medium">{label}</span>
      <span className="relative">
        <Input
          name={name}
          type="number"
          min={min}
          defaultValue={defaultValue}
          size="sm"
          className="pr-9 text-right"
        />
        <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted">
          {suffix}
        </span>
      </span>
    </label>
  );
}

function PublicPreview({ periods }: { periods: readonly ServicePeriod[] }) {
  const summaries = [
    { label: 'Lundi à vendredi', days: [1, 2, 3, 4, 5] },
    { label: 'Samedi', days: [6] },
    { label: 'Dimanche', days: [0] },
  ];

  return (
    <Card padding="none" radius="lg" className="overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-4">
        <CheckCircle2 className="h-5 w-5" aria-hidden />
        <h2 className="font-bold">Aperçu public</h2>
      </div>
      <Separator />
      <div className="grid gap-3 p-5 text-sm">
        {summaries.map((summary) => {
          const ranges = periods
            .filter(
              (period) =>
                summary.days.includes(period.dayOfWeek) && period.enabled,
            )
            .map((period) => formatTimeRange(period.startTime, period.endTime))
            .filter((value, index, values) => values.indexOf(value) === index);
          return (
            <div key={summary.label} className="flex justify-between gap-3">
              <span className="text-muted">{summary.label}</span>
              <span className="text-right font-medium">
                {ranges.length > 0 ? ranges.join(' · ') : 'Fermé'}
              </span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function ExceptionsPanel({
  exceptions,
  periods,
  locale,
}: {
  exceptions: readonly BookingException[];
  periods: readonly ServicePeriod[];
  locale: string;
}) {
  return (
    <Card
      id="jours-exceptionnels"
      padding="none"
      radius="lg"
      className="overflow-hidden"
    >
      <div className="flex items-center gap-2 px-5 py-4">
        <CalendarClock className="h-5 w-5" aria-hidden />
        <h2 className="font-bold">Exceptions à venir</h2>
      </div>
      <Separator />
      <div className="grid gap-1 p-3">
        {exceptions.slice(0, 5).map((exception) => (
          <ExceptionRow
            key={exception.id}
            exception={exception}
            locale={locale}
          />
        ))}
        {exceptions.length === 0 && (
          <p className="px-2 py-4 text-center text-sm text-muted">
            Aucune exception planifiée.
          </p>
        )}
      </div>
      <Separator />
      <details className="group">
        <summary className="flex cursor-pointer list-none items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-action-primary [&::-webkit-details-marker]:hidden">
          <Plus className="h-4 w-4" aria-hidden />
          Ajouter une exception
        </summary>
        <form
          action={createExceptionAction}
          className="grid gap-3 border-t border-border-default p-4"
        >
          <FormField label="Date">
            <Input name="date" type="date" required />
          </FormField>
          <FormField label="Type">
            <select
              name="kind"
              className="h-10 rounded-lg border border-border-default bg-surface px-3 text-sm"
            >
              <option value="CLOSED_ALL_DAY">Fermeture exceptionnelle</option>
              <option value="CLOSED_SERVICE">Service fermé</option>
              <option value="MODIFIED_HOURS">Horaires modifiés</option>
              <option value="BLOCKED_SLOT">Créneau bloqué</option>
            </select>
          </FormField>
          <FormField label="Service concerné">
            <select
              name="servicePeriodId"
              className="h-10 rounded-lg border border-border-default bg-surface px-3 text-sm"
            >
              <option value="">Tous les services</option>
              {periods.map((period) => (
                <option key={period.id} value={period.id}>
                  {
                    orderedWeekDays.find(
                      (day) => day.value === period.dayOfWeek,
                    )?.label
                  }{' '}
                  · {period.name}
                </option>
              ))}
            </select>
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Début">
              <Input name="startTime" type="time" />
            </FormField>
            <FormField label="Fin">
              <Input name="endTime" type="time" />
            </FormField>
          </div>
          <FormField label="Capacité forcée">
            <Input name="capacityOverride" type="number" min={0} />
          </FormField>
          <FormField label="Motif">
            <Textarea name="reason" />
          </FormField>
          <Button type="submit" fullWidth>
            Ajouter l’exception
          </Button>
        </form>
      </details>
    </Card>
  );
}

function ExceptionRow({
  exception,
  locale,
}: {
  exception: BookingException;
  locale: string;
}) {
  const tone =
    exception.kind === 'CLOSED_ALL_DAY'
      ? 'danger'
      : exception.kind === 'MODIFIED_HOURS'
        ? 'warning'
        : 'info';

  return (
    <div className="grid grid-cols-[1fr_auto] items-center gap-2 rounded-lg px-2 py-2 hover:bg-surface-muted">
      <div className="min-w-0">
        <p className="text-sm font-semibold">
          {formatDate(exception.exceptionDate, locale)}
        </p>
        <Badge tone={tone} size="sm" className="mt-1 max-w-full truncate">
          {exceptionKindLabels[exception.kind]}
        </Badge>
      </div>
      <form action={deleteExceptionAction}>
        <input type="hidden" name="id" value={exception.id} />
        <IconButton
          type="submit"
          variant="ghost"
          size="sm"
          aria-label={`Supprimer l’exception du ${formatDate(exception.exceptionDate, locale)}`}
          title="Supprimer l’exception"
          className="text-status-danger"
        >
          <Trash2 className="h-4 w-4" aria-hidden />
        </IconButton>
      </form>
    </div>
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
