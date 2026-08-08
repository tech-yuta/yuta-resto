import { FormField, Input, Label, Separator } from '@yuta/ui';
import {
  CalendarClock,
  CalendarDays,
  Clock3,
  Timer,
  type LucideIcon,
} from 'lucide-react';
import type { BookingSettings } from './booking-administration-model';

type BookingRuleFieldsProps = {
  settings: BookingSettings | null;
  fieldErrors: Record<string, string>;
};

export function BookingRuleFields({
  settings,
  fieldErrors,
}: BookingRuleFieldsProps) {
  return (
    <>
      <BookingAvailabilityFields
        settings={settings}
        fieldErrors={fieldErrors}
      />
      <Separator />
      <BookingPartyAndConfirmationFields
        settings={settings}
        fieldErrors={fieldErrors}
      />
    </>
  );
}

function BookingAvailabilityFields({
  settings,
  fieldErrors,
}: BookingRuleFieldsProps) {
  return (
    <>
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
        error={fieldErrors.minimumNoticeMinutes}
      />
      <RuleNumberField
        icon={CalendarDays}
        label="Fenêtre de réservation"
        name="bookingWindowDays"
        defaultValue={settings?.bookingWindowDays ?? 60}
        suffix="jours"
        min={0}
        error={fieldErrors.bookingWindowDays}
      />
      <RuleNumberField
        icon={Timer}
        label="Intervalle des créneaux"
        name="slotIntervalMinutes"
        defaultValue={settings?.slotIntervalMinutes ?? 30}
        suffix="min"
        min={5}
        error={fieldErrors.slotIntervalMinutes}
      />
      <RuleNumberField
        icon={Timer}
        label="Durée moyenne"
        name="averageDurationMinutes"
        defaultValue={settings?.averageDurationMinutes ?? 90}
        suffix="min"
        min={15}
        error={fieldErrors.averageDurationMinutes}
      />
    </>
  );
}

function BookingPartyAndConfirmationFields({
  settings,
  fieldErrors,
}: BookingRuleFieldsProps) {
  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <FormField
          label={<Label htmlFor="minimum-party-size">Taille min.</Label>}
          error={fieldErrors.minimumPartySize}
        >
          <Input
            id="minimum-party-size"
            name="minimumPartySize"
            type="number"
            min={1}
            defaultValue={settings?.minimumPartySize ?? 1}
          />
        </FormField>
        <FormField
          label={<Label htmlFor="maximum-party-size">Taille max.</Label>}
          error={fieldErrors.maximumPartySize}
        >
          <Input
            id="maximum-party-size"
            name="maximumPartySize"
            type="number"
            min={1}
            defaultValue={settings?.maximumPartySize ?? 12}
          />
        </FormField>
      </div>
      <FormField
        label={<Label htmlFor="confirmation-mode">Confirmation</Label>}
        error={fieldErrors.confirmationMode}
      >
        <select
          id="confirmation-mode"
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
        error={fieldErrors.cancellationDeadlineMinutes}
      />
    </>
  );
}

function RuleNumberField({
  icon: Icon,
  label,
  name,
  defaultValue,
  suffix,
  min,
  error,
}: {
  icon: LucideIcon;
  label: string;
  name: string;
  defaultValue: number;
  suffix: string;
  min: number;
  error?: string;
}) {
  return (
    <FormField error={error}>
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
    </FormField>
  );
}
