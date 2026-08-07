'use client';

import {
  Alert,
  AlertDescription,
  Button,
  Card,
  ConfirmDialog,
  FormField,
  IconButton,
  Input,
  Label,
  Separator,
  Textarea,
} from '@yuta/ui';
import {
  CalendarClock,
  CalendarDays,
  Clock3,
  Plus,
  Save,
  Settings2,
  Timer,
  Trash2,
  type LucideIcon,
} from 'lucide-react';
import { useActionState, useEffect, useRef, useState } from 'react';
import { useFormStatus } from 'react-dom';
import {
  createExceptionAction,
  createServicePeriodAction,
  deleteExceptionAction,
  deleteServicePeriodAction,
  saveBookingSettingsAction,
  type BookingAdministrationActionState,
} from '../operations/reservations/actions';
import { exceptionKindLabels } from './booking-schedule-view-model';

type ServicePeriodOption = {
  id: string;
  dayOfWeek: number;
  name: string;
};

type BookingSettings = {
  enabled: boolean;
  confirmationMode: 'MANUAL' | 'AUTOMATIC';
  minimumPartySize: number;
  maximumPartySize: number;
  slotIntervalMinutes: number;
  averageDurationMinutes: number;
  minimumNoticeMinutes: number;
  bookingWindowDays: number;
  cancellationDeadlineMinutes: number;
  welcomeMessage: string | null;
  bookingPolicy: string | null;
};

type BookingException = {
  id: string;
  exceptionDate: string;
  kind: 'CLOSED_ALL_DAY' | 'CLOSED_SERVICE' | 'MODIFIED_HOURS' | 'BLOCKED_SLOT';
};

const initialActionState: BookingAdministrationActionState = {
  status: 'idle',
  message: null,
  fieldErrors: {},
};

export function AddServiceForm({ dayOfWeek }: { dayOfWeek: number }) {
  const [state, formAction] = useActionState(
    createServicePeriodAction,
    initialActionState,
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === 'success') formRef.current?.reset();
  }, [state.status]);

  return (
    <details className="group rounded-xl border border-dashed border-border-default bg-surface">
      <summary className="flex cursor-pointer list-none items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-action-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus-ring [&::-webkit-details-marker]:hidden">
        <Plus className="h-4 w-4" aria-hidden />
        Ajouter un service
      </summary>
      <form
        ref={formRef}
        action={formAction}
        className="grid gap-3 border-t border-border-default p-4 sm:grid-cols-2 lg:grid-cols-5"
      >
        <input type="hidden" name="dayOfWeek" value={dayOfWeek} />
        <FormField
          label={
            <Label htmlFor={`service-name-${dayOfWeek}`}>Nom du service</Label>
          }
          error={state.fieldErrors.name}
        >
          <Input
            id={`service-name-${dayOfWeek}`}
            name="name"
            placeholder="Déjeuner"
            required
          />
        </FormField>
        <FormField
          label={<Label htmlFor={`service-start-${dayOfWeek}`}>Début</Label>}
          error={state.fieldErrors.startTime}
        >
          <Input
            id={`service-start-${dayOfWeek}`}
            name="startTime"
            type="time"
            required
          />
        </FormField>
        <FormField
          label={<Label htmlFor={`service-end-${dayOfWeek}`}>Fin</Label>}
          error={state.fieldErrors.endTime}
        >
          <Input
            id={`service-end-${dayOfWeek}`}
            name="endTime"
            type="time"
            required
          />
        </FormField>
        <FormField
          label={
            <Label htmlFor={`service-capacity-${dayOfWeek}`}>Capacité</Label>
          }
          error={state.fieldErrors.capacity}
        >
          <Input
            id={`service-capacity-${dayOfWeek}`}
            name="capacity"
            type="number"
            min={1}
            required
          />
        </FormField>
        <div className="flex items-end">
          <SubmitButton label="Ajouter" />
        </div>
        <ActionMessage state={state} className="sm:col-span-2 lg:col-span-5" />
      </form>
    </details>
  );
}

export function DeleteServicePeriodButton({
  id,
  name,
}: {
  id: string;
  name: string;
}) {
  return (
    <DeleteButton
      id={id}
      kind="service"
      accessibleLabel={`Supprimer le service ${name}`}
      title="Supprimer le service ?"
      description={`Le service « ${name} » sera supprimé définitivement.`}
    />
  );
}

export function BookingRules({
  settings,
}: {
  settings: BookingSettings | null;
}) {
  const [state, formAction] = useActionState(
    saveBookingSettingsAction,
    initialActionState,
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

        <ActionMessage state={state} />
        <SubmitButton
          label="Enregistrer les règles"
          variant="success"
          icon={<Save className="h-4 w-4" aria-hidden />}
        />
      </form>
    </Card>
  );
}

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
      <AddExceptionForm periods={periods} />
    </Card>
  );
}

function AddExceptionForm({
  periods,
}: {
  periods: readonly ServicePeriodOption[];
}) {
  const [kind, setKind] = useState<BookingException['kind']>('CLOSED_ALL_DAY');
  const [state, formAction] = useActionState(
    createExceptionAction,
    initialActionState,
  );
  const formRef = useRef<HTMLFormElement>(null);
  const requiresService = kind === 'CLOSED_SERVICE';
  const requiresTimes = kind === 'MODIFIED_HOURS' || kind === 'BLOCKED_SLOT';
  const supportsCapacity = kind === 'MODIFIED_HOURS';

  useEffect(() => {
    if (state.status === 'success') {
      formRef.current?.reset();
      setKind('CLOSED_ALL_DAY');
    }
  }, [state.status]);

  return (
    <details className="group">
      <summary className="flex cursor-pointer list-none items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-action-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus-ring [&::-webkit-details-marker]:hidden">
        <Plus className="h-4 w-4" aria-hidden />
        Ajouter une exception
      </summary>
      <form
        ref={formRef}
        action={formAction}
        className="grid gap-3 border-t border-border-default p-4"
      >
        <FormField
          label={<Label htmlFor="exception-date">Date</Label>}
          error={state.fieldErrors.date}
        >
          <Input id="exception-date" name="date" type="date" required />
        </FormField>
        <FormField
          label={<Label htmlFor="exception-kind">Type</Label>}
          error={state.fieldErrors.kind}
        >
          <select
            id="exception-kind"
            name="kind"
            value={kind}
            onChange={(event) =>
              setKind(event.target.value as BookingException['kind'])
            }
            className="h-10 rounded-lg border border-border-default bg-surface px-3 text-sm"
          >
            <option value="CLOSED_ALL_DAY">Fermeture exceptionnelle</option>
            <option value="CLOSED_SERVICE">Service fermé</option>
            <option value="MODIFIED_HOURS">Horaires modifiés</option>
            <option value="BLOCKED_SLOT">Créneau bloqué</option>
          </select>
        </FormField>

        {(requiresService || requiresTimes) && (
          <FormField
            label={<Label htmlFor="exception-service">Service concerné</Label>}
            hint={
              requiresService
                ? undefined
                : 'Facultatif : tous les services par défaut.'
            }
            error={state.fieldErrors.servicePeriodId}
          >
            <select
              id="exception-service"
              name="servicePeriodId"
              required={requiresService}
              className="h-10 rounded-lg border border-border-default bg-surface px-3 text-sm"
            >
              <option value="">Tous les services</option>
              {periods.map((period) => (
                <option key={period.id} value={period.id}>
                  {dayLabel(period.dayOfWeek)} · {period.name}
                </option>
              ))}
            </select>
          </FormField>
        )}

        {requiresTimes && (
          <div className="grid grid-cols-2 gap-3">
            <FormField
              label={<Label htmlFor="exception-start">Début</Label>}
              error={state.fieldErrors.startTime}
            >
              <Input
                id="exception-start"
                name="startTime"
                type="time"
                required
              />
            </FormField>
            <FormField
              label={<Label htmlFor="exception-end">Fin</Label>}
              error={state.fieldErrors.endTime}
            >
              <Input id="exception-end" name="endTime" type="time" required />
            </FormField>
          </div>
        )}

        {supportsCapacity && (
          <FormField
            label={<Label htmlFor="exception-capacity">Capacité forcée</Label>}
            hint="Laissez vide pour conserver la capacité habituelle."
            error={state.fieldErrors.capacityOverride}
          >
            <Input
              id="exception-capacity"
              name="capacityOverride"
              type="number"
              min={0}
            />
          </FormField>
        )}

        <FormField label={<Label htmlFor="exception-reason">Motif</Label>}>
          <Textarea id="exception-reason" name="reason" />
        </FormField>
        <ActionMessage state={state} />
        <SubmitButton label="Ajouter l’exception" />
      </form>
    </details>
  );
}

function ExceptionRow({
  exception,
  locale,
}: {
  exception: BookingException;
  locale: string;
}) {
  return (
    <div className="grid grid-cols-[1fr_auto] items-center gap-2 rounded-lg px-2 py-2 hover:bg-surface-muted">
      <div className="min-w-0">
        <p className="text-sm font-semibold">
          {formatDate(exception.exceptionDate, locale)}
        </p>
        <p className="mt-1 truncate text-xs text-muted">
          {exceptionKindLabels[exception.kind]}
        </p>
      </div>
      <DeleteButton
        id={exception.id}
        kind="exception"
        accessibleLabel={`Supprimer l’exception du ${formatDate(exception.exceptionDate, locale)}`}
        title="Supprimer cette exception ?"
        description="Cette exception sera supprimée définitivement."
      />
    </div>
  );
}

function DeleteButton({
  id,
  kind,
  accessibleLabel,
  title,
  description,
}: {
  id: string;
  kind: 'service' | 'exception';
  accessibleLabel: string;
  title: string;
  description: string;
}) {
  const action =
    kind === 'service' ? deleteServicePeriodAction : deleteExceptionAction;
  const [state, formAction] = useActionState(action, initialActionState);
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <div className="justify-self-end">
      <form ref={formRef} action={formAction}>
        <input type="hidden" name="id" value={id} />
        <IconButton
          type="button"
          variant="ghost"
          size="sm"
          aria-label={accessibleLabel}
          title={accessibleLabel}
          className="text-status-danger"
          onClick={() => setOpen(true)}
        >
          <Trash2 className="h-4 w-4" aria-hidden />
        </IconButton>
      </form>
      {state.status === 'error' && (
        <p
          className="mt-1 max-w-40 text-right text-xs font-medium text-status-danger"
          role="alert"
        >
          {state.message}
        </p>
      )}
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={title}
        description={description}
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        onConfirm={() => {
          setOpen(false);
          formRef.current?.requestSubmit();
        }}
      />
    </div>
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

function SubmitButton({
  label,
  variant = 'primary',
  icon,
}: {
  label: string;
  variant?: 'primary' | 'success';
  icon?: React.ReactNode;
}) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant={variant} fullWidth loading={pending}>
      {icon}
      {pending ? 'Enregistrement…' : label}
    </Button>
  );
}

function ActionMessage({
  state,
  className,
}: {
  state: BookingAdministrationActionState;
  className?: string;
}) {
  if (!state.message || state.status === 'idle') return null;
  return (
    <Alert
      tone={state.status === 'success' ? 'success' : 'danger'}
      className={className}
    >
      <AlertDescription>{state.message}</AlertDescription>
    </Alert>
  );
}

function dayLabel(dayOfWeek: number): string {
  return (
    ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'][
      dayOfWeek
    ] ?? 'Jour'
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
