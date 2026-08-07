import { Badge, Card, Separator } from '@yuta/ui';
import { ChevronDown, Moon, SunMedium, Utensils } from 'lucide-react';
import {
  AddServiceForm,
  DeleteServicePeriodButton,
} from '../booking-administration-forms';
import {
  formatMinutes,
  formatTimeRange,
  orderedWeekDays,
} from '../booking-schedule-view-model';

export type WeeklyServicePeriod = {
  id: string;
  dayOfWeek: number;
  name: string;
  startTime: string;
  endTime: string;
  capacity: number;
  enabled: boolean;
};

export function WeeklyScheduleSection({
  periods,
  averageDurationMinutes,
  todayDayOfWeek,
  canEdit,
}: {
  periods: readonly WeeklyServicePeriod[];
  averageDurationMinutes: number;
  todayDayOfWeek: number;
  canEdit: boolean;
}) {
  const activePeriodCount = periods.filter((period) => period.enabled).length;

  return (
    <Card
      id="horaires-hebdomadaires"
      padding="none"
      radius="lg"
      className="overflow-hidden scroll-mt-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
        <div className="flex min-w-0 items-start gap-3">
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-action-primary text-sm font-black text-inverse">
            5
          </span>
          <div className="min-w-0">
            <h2 className="font-bold">Horaires hebdomadaires</h2>
            <p className="mt-1 text-sm text-muted">
              Définissez les services proposés chaque jour.
            </p>
          </div>
        </div>
        <Badge tone="success" variant="soft">
          {activePeriodCount} service{activePeriodCount === 1 ? '' : 's'} actif
          {activePeriodCount === 1 ? '' : 's'}
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
              canEdit={canEdit}
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
  canEdit,
}: {
  day: (typeof orderedWeekDays)[number];
  periods: readonly WeeklyServicePeriod[];
  averageDurationMinutes: number;
  defaultOpen: boolean;
  canEdit: boolean;
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
            canEdit={canEdit}
          />
        ))}
        {periods.length === 0 && (
          <p className="rounded-lg border border-dashed border-border-default px-4 py-5 text-center text-sm text-muted">
            Aucun service configuré pour cette journée.
          </p>
        )}
        {canEdit && <AddServiceForm dayOfWeek={day.value} />}
      </div>
    </details>
  );
}

function ServicePeriodRow({
  period,
  averageDurationMinutes,
  canEdit,
}: {
  period: WeeklyServicePeriod;
  averageDurationMinutes: number;
  canEdit: boolean;
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
      {canEdit ? (
        <DeleteServicePeriodButton id={period.id} name={period.name} />
      ) : (
        <span aria-hidden />
      )}
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
