'use client';

import { Card, FormField, Input, Label, Separator, Textarea } from '@yuta/ui';
import {
  CalendarClock,
  CalendarDays,
  Clock3,
  Save,
  Settings2,
  Timer,
  type LucideIcon,
} from 'lucide-react';
import { useActionState } from 'react';
import { saveBookingSettingsAction } from '../operations/reservations/actions';
import {
  BookingAdministrationActionMessage,
  BookingAdministrationSubmitButton,
  initialBookingAdministrationActionState,
} from './booking-administration-action-feedback';
import type { BookingSettings } from './booking-administration-model';

export function BookingRules({
  settings,
}: {
  settings: BookingSettings | null;
}) {
  const [state, formAction] = useActionState(
    saveBookingSettingsAction,
    initialBookingAdministrationActionState,
  );

  return (
    <Card padding="none" radius="lg" className="overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-4">
        <Settings2 className="h-5 w-5" aria-hidden />
        <div>
          <h2 className="font-bold">Règles de réservation</h2>
          <p className="mt-0.5 text-xs text-muted">
            Ce formulaire enregistre uniquement les règles générales.
          </p>
        </div>
      </div>
      <Separator />
      <form action={formAction} className="grid gap-4 p-5">
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
          error={state.fieldErrors.minimumNoticeMinutes}
        />
        <RuleNumberField
          icon={CalendarDays}
          label="Fenêtre de réservation"
          name="bookingWindowDays"
          defaultValue={settings?.bookingWindowDays ?? 60}
          suffix="jours"
          min={0}
          error={state.fieldErrors.bookingWindowDays}
        />
        <RuleNumberField
          icon={Timer}
          label="Intervalle des créneaux"
          name="slotIntervalMinutes"
          defaultValue={settings?.slotIntervalMinutes ?? 30}
          suffix="min"
          min={5}
          error={state.fieldErrors.slotIntervalMinutes}
        />
        <RuleNumberField
          icon={Timer}
          label="Durée moyenne"
          name="averageDurationMinutes"
          defaultValue={settings?.averageDurationMinutes ?? 90}
          suffix="min"
          min={15}
          error={state.fieldErrors.averageDurationMinutes}
        />

        <Separator />
        <div className="grid grid-cols-2 gap-3">
          <FormField
            label={<Label htmlFor="minimum-party-size">Taille min.</Label>}
            error={state.fieldErrors.minimumPartySize}
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
            error={state.fieldErrors.maximumPartySize}
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
          error={state.fieldErrors.confirmationMode}
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
          error={state.fieldErrors.cancellationDeadlineMinutes}
        />

        <details className="group rounded-lg border border-border-default">
          <summary className="cursor-pointer list-none px-3 py-2.5 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus-ring [&::-webkit-details-marker]:hidden">
            Informations publiques
          </summary>
          <div className="grid gap-3 border-t border-border-default p-3">
            <PublicTextareaField
              id="welcome-message"
              label="Message d’accueil"
              name="welcomeMessage"
              defaultValue={settings?.welcomeMessage ?? ''}
              error={state.fieldErrors.welcomeMessage}
            />
            <PublicTextareaField
              id="booking-policy"
              label="Politique de réservation"
              name="bookingPolicy"
              defaultValue={settings?.bookingPolicy ?? ''}
              error={state.fieldErrors.bookingPolicy}
            />
          </div>
        </details>

        <BookingAdministrationActionMessage state={state} />
        <BookingAdministrationSubmitButton
          label="Enregistrer les règles"
          variant="success"
          icon={<Save className="h-4 w-4" aria-hidden />}
        />
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

function PublicTextareaField({
  id,
  label,
  name,
  defaultValue,
  error,
}: {
  id: string;
  label: string;
  name: string;
  defaultValue: string;
  error?: string;
}) {
  return (
    <FormField label={<Label htmlFor={id}>{label}</Label>} error={error}>
      <Textarea id={id} name={name} defaultValue={defaultValue} />
    </FormField>
  );
}
