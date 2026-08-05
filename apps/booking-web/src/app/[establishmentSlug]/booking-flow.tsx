'use client';

import type { CreatePublicReservationInput } from '@yuta/contracts/reservations';
import {
  Alert,
  AlertDescription,
  Button,
  FormField,
  IconButton,
  Input,
  PoweredByYuta,
  Progress,
  YutaBrandMark,
  yutaLogoAsset,
  cn,
} from '@yuta/ui';
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  MapPin,
  Minus,
  Plus,
  Users,
} from 'lucide-react';
import { useMemo, useState } from 'react';

type Establishment = {
  name: string;
  slug: string;
  timezone: string;
  logoUrl: string | null;
  welcomeMessage: string | null;
  minimumPartySize: number;
  maximumPartySize: number;
  bookingWindowDays: number;
  bookingPolicy: string | null;
  publicPhone: string | null;
  address: string | null;
};

type Slot = { time: string; available: boolean; remainingCapacity: number };
type Result = {
  reference: string;
  token: string;
  status: string;
  firstName: string;
};

const weekdayLabels = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

export function BookingFlow({
  establishment,
  source,
}: {
  establishment: Establishment;
  source: CreatePublicReservationInput['source'];
}) {
  const today = useMemo(() => startOfDay(new Date()), []);
  const [step, setStep] = useState(1);
  const [partySize, setPartySize] = useState(
    Math.max(2, establishment.minimumPartySize),
  );
  const [date, setDate] = useState('');
  const [calendarMonth, setCalendarMonth] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1),
  );
  const [slots, setSlots] = useState<Slot[]>([]);
  const [time, setTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<Result | null>(null);

  async function loadSlots() {
    if (!date) return;
    setLoading(true);
    setError('');
    setTime('');
    try {
      const response = await fetch(
        `/api/public/booking/establishments/${encodeURIComponent(establishment.slug)}/availability?date=${date}&partySize=${partySize}`,
      );
      const body = (await response.json()) as {
        slots?: Slot[];
        error?: { message: string };
      };
      if (!response.ok) {
        throw new Error(body.error?.message ?? 'Créneaux indisponibles.');
      }
      setSlots(body.slots ?? []);
      setStep(3);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : 'Créneaux indisponibles.',
      );
    } finally {
      setLoading(false);
    }
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const firstName = String(data.get('firstName') ?? '');
    const payload: CreatePublicReservationInput = {
      date,
      time,
      partySize,
      guest: {
        firstName,
        lastName: String(data.get('lastName') ?? ''),
        email: String(data.get('email') ?? ''),
        phone: String(data.get('phone') ?? ''),
      },
      specialRequirements:
        String(data.get('specialRequirements') ?? '') || undefined,
      source,
      marketingConsent: data.get('marketingConsent') === 'on',
      policyAccepted: true,
      idempotencyKey: crypto.randomUUID(),
    };

    setLoading(true);
    setError('');
    try {
      const response = await fetch(
        `/api/public/booking/establishments/${encodeURIComponent(establishment.slug)}/reservations`,
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(payload),
        },
      );
      const body = (await response.json()) as {
        reservation?: { reference: string; status: string };
        publicToken?: string;
        error?: { message: string };
      };
      if (!response.ok || !body.reservation || !body.publicToken) {
        throw new Error(body.error?.message ?? 'La réservation a échoué.');
      }
      setResult({
        reference: body.reservation.reference,
        status: body.reservation.status,
        token: body.publicToken,
        firstName,
      });
      setStep(5);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : 'La réservation a échoué.',
      );
    } finally {
      setLoading(false);
    }
  }

  function goBack() {
    setError('');
    setStep((current) => Math.max(1, current - 1));
  }

  return (
    <div className={`flex h-dvh flex-col sm:max-h-225`}>
      <RestaurantBrand establishment={establishment} />
      <div
        className={
          'flex flex-1 px-6 pb-5 sm:px-8 sm:pb-7 sm:pt-8 min-h-0 flex-col overflow-y-auto'
        }
      >
        {step === 1 && (
          <PartyStep
            establishment={establishment}
            value={partySize}
            minimum={establishment.minimumPartySize}
            maximum={establishment.maximumPartySize}
            onChange={setPartySize}
            onContinue={() => setStep(2)}
          />
        )}

        {step === 2 && (
          <DateStep
            establishment={establishment}
            selectedDate={date}
            month={calendarMonth}
            today={today}
            bookingWindowDays={establishment.bookingWindowDays}
            loading={loading}
            onSelect={setDate}
            onMonthChange={setCalendarMonth}
            onContinue={loadSlots}
            onBack={goBack}
          />
        )}

        {step === 3 && (
          <TimeStep
            establishment={establishment}
            date={date}
            partySize={partySize}
            slots={slots}
            value={time}
            onChange={setTime}
            onContinue={() => setStep(4)}
            onBack={goBack}
          />
        )}

        {step === 4 && (
          <GuestStep
            establishment={establishment}
            loading={loading}
            onSubmit={submit}
            onBack={goBack}
          />
        )}

        {step === 5 && result && (
          <ConfirmationStep
            establishment={establishment}
            date={date}
            time={time}
            partySize={partySize}
            result={result}
          />
        )}

        {error && (
          <Alert tone="danger" className="mt-5">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </div>

      <PoweredByYuta className="shrink-0 border-t border-border-default px-5 py-3" />
    </div>
  );
}

function RestaurantBrand({
  establishment,
}: {
  establishment: Establishment;
  showWelcome?: boolean;
}) {
  const usesYutaLogo = !establishment.logoUrl;
  return (
    <div className="my-6 text-center">
      <div className="inline-flex items-center justify-center gap-2">
        {usesYutaLogo ? (
          <YutaBrandMark
            iconClassName="h-10 w-10"
            nameClassName="text-xl font-black tracking-[0.14em]"
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={establishment.logoUrl ?? yutaLogoAsset.src}
            alt={`Logo ${establishment.name}`}
            className="h-14 max-w-36 object-contain"
          />
        )}
      </div>
    </div>
  );
}

function StepIntro({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <header className="text-center">
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
      <p className="mx-auto mt-6 max-w-sm text-sm text-secondary">
        {description}
      </p>
    </header>
  );
}

function PartyStep({
  establishment,
  value,
  minimum,
  maximum,
  onChange,
  onContinue,
}: {
  establishment: Establishment;
  value: number;
  minimum: number;
  maximum: number;
  onChange: (value: number) => void;
  onContinue: () => void;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <p className="mb-1 text-sm text-secondary text-center">
        Bienvenue au {establishment.name}
      </p>
      <StepIntro
        title="Combien de personnes ?"
        description="Sélectionnez le nombre de convives."
      />
      <div className="flex flex-col items-center py-8">
        <div className="flex items-center gap-8">
          <IconButton
            type="button"
            variant="outline"
            size="lg"
            className="rounded-full"
            disabled={value <= minimum}
            onClick={() => onChange(Math.max(minimum, value - 1))}
            aria-label="Diminuer le nombre de personnes"
          >
            <Minus aria-hidden />
          </IconButton>
          <span
            className="min-w-12 text-center text-5xl font-bold tabular-nums"
            aria-live="polite"
            aria-atomic="true"
          >
            {value}
          </span>
          <IconButton
            type="button"
            variant="primary"
            size="lg"
            className="rounded-full"
            disabled={value >= maximum}
            onClick={() => onChange(Math.min(maximum, value + 1))}
            aria-label="Augmenter le nombre de personnes"
          >
            <Plus aria-hidden />
          </IconButton>
        </div>
        <p className="mt-5 text-sm text-muted">
          Tables de {minimum} à {maximum} personnes
        </p>
      </div>

      <div className="rounded-lg bg-surface-muted px-4 py-3 text-center text-sm text-secondary">
        Pour les groupes de plus de {maximum} personnes, contactez directement
        le restaurant
        {establishment.publicPhone ? (
          <>
            {' au '}
            <a
              href={`tel:${establishment.publicPhone}`}
              className="font-semibold text-primary underline underline-offset-2"
            >
              {establishment.publicPhone}
            </a>
            .
          </>
        ) : (
          '.'
        )}
      </div>

      <div className="mt-auto pt-7">
        <Button type="button" fullWidth size="lg" onClick={onContinue}>
          Continuer <ArrowRight className="h-4 w-4" aria-hidden />
        </Button>
      </div>
    </div>
  );
}

function BookingProgress() {
  return (
    <div className="mb-7" aria-label="Étape 1 sur 5">
      <div className="mb-2 flex items-center justify-between text-xs">
        <span className="font-semibold text-primary">Étape 1 sur 5</span>
        <span className="text-muted">Personnes</span>
      </div>
      <Progress value={20} aria-label="Progression de la réservation : 20 %" />
    </div>
  );
}

function DateStep({
  establishment,
  selectedDate,
  month,
  today,
  bookingWindowDays,
  loading,
  onSelect,
  onMonthChange,
  onContinue,
  onBack,
}: {
  establishment: Establishment;
  selectedDate: string;
  month: Date;
  today: Date;
  bookingWindowDays: number;
  loading: boolean;
  onSelect: (value: string) => void;
  onMonthChange: (value: Date) => void;
  onContinue: () => void;
  onBack: () => void;
}) {
  const maximumDate = addDays(today, bookingWindowDays);
  const days = calendarDays(month);
  const canGoPrevious =
    month.getFullYear() > today.getFullYear() ||
    month.getMonth() > today.getMonth();

  return (
    <div className="flex flex-1 flex-col">
      <StepIntro
        title="Choisissez la date"
        description="Sélectionnez le jour de votre venue."
      />
      <div className="my-7">
        <div className="mb-4 flex items-center justify-between">
          <button
            type="button"
            className="rounded-full p-2 hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-30"
            disabled={!canGoPrevious}
            onClick={() =>
              onMonthChange(
                new Date(month.getFullYear(), month.getMonth() - 1, 1),
              )
            }
            aria-label="Mois précédent"
          >
            <ChevronLeft aria-hidden />
          </button>
          <p className="font-semibold capitalize">
            {month.toLocaleDateString('fr-FR', {
              month: 'long',
              year: 'numeric',
            })}
          </p>
          <button
            type="button"
            className="rounded-full p-2 hover:bg-surface-muted"
            onClick={() =>
              onMonthChange(
                new Date(month.getFullYear(), month.getMonth() + 1, 1),
              )
            }
            aria-label="Mois suivant"
          >
            <ChevronRight aria-hidden />
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center">
          {weekdayLabels.map((label) => (
            <span key={label} className="py-2 text-xs font-medium text-muted">
              {label}
            </span>
          ))}
          {days.map((day) => {
            const value = toLocalDate(day);
            const isCurrentMonth = day.getMonth() === month.getMonth();
            const disabled =
              !isCurrentMonth || day < today || day > maximumDate;
            const selected = selectedDate === value;
            return (
              <button
                key={value}
                type="button"
                disabled={disabled}
                onClick={() => onSelect(value)}
                className={cn(
                  'mx-auto flex h-10 w-10 items-center justify-center rounded-full text-sm transition',
                  selected
                    ? 'bg-action-primary font-semibold text-inverse shadow-sm'
                    : 'hover:bg-surface-selected',
                  disabled && 'cursor-not-allowed text-muted opacity-30',
                )}
                aria-pressed={selected}
              >
                {day.getDate()}
              </button>
            );
          })}
        </div>
      </div>
      <StepActions
        canContinue={Boolean(selectedDate)}
        loading={loading}
        onBack={onBack}
        onContinue={onContinue}
      />
    </div>
  );
}

function TimeStep({
  establishment,
  date,
  partySize,
  slots,
  value,
  onChange,
  onContinue,
  onBack,
}: {
  establishment: Establishment;
  date: string;
  partySize: number;
  slots: Slot[];
  value: string;
  onChange: (value: string) => void;
  onContinue: () => void;
  onBack: () => void;
}) {
  const availableSlots = slots.filter((slot) => slot.available);
  return (
    <div className="flex flex-1 flex-col">
      <StepIntro
        title="Choisissez l’horaire"
        description={`Disponibilités pour ${partySize} personne${partySize > 1 ? 's' : ''} le ${formatDate(date)}.`}
      />
      <div className="my-8 flex-1">
        {availableSlots.length > 0 ? (
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
            {availableSlots.map((slot) => (
              <Button
                key={slot.time}
                type="button"
                size="md"
                variant={value === slot.time ? 'primary' : 'outline'}
                onClick={() => onChange(slot.time)}
              >
                {slot.time}
              </Button>
            ))}
          </div>
        ) : (
          <div className="rounded-lg bg-surface-muted px-5 py-10 text-center">
            <Clock3 className="mx-auto h-8 w-8 text-muted" aria-hidden />
            <p className="mt-3 font-medium">Aucun horaire disponible</p>
            <p className="mt-1 text-sm text-secondary">
              Revenez à l’étape précédente pour choisir une autre date.
            </p>
          </div>
        )}
      </div>
      <StepActions
        canContinue={Boolean(value)}
        onBack={onBack}
        onContinue={onContinue}
      />
    </div>
  );
}

function GuestStep({
  establishment,
  loading,
  onSubmit,
  onBack,
}: {
  establishment: Establishment;
  loading: boolean;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onBack: () => void;
}) {
  return (
    <form className="flex flex-1 flex-col" onSubmit={onSubmit}>
      <StepIntro
        title="Vos informations"
        description="Nous en avons besoin pour confirmer votre réservation."
      />
      <div className="my-7 grid gap-4">
        <FormField label="Prénom">
          <Input name="firstName" autoComplete="given-name" required />
        </FormField>
        <FormField label="Nom">
          <Input name="lastName" autoComplete="family-name" required />
        </FormField>
        <FormField label="E-mail">
          <Input name="email" type="email" autoComplete="email" required />
        </FormField>
        <FormField label="Téléphone">
          <Input name="phone" type="tel" autoComplete="tel" required />
        </FormField>
        <div>
          <FormField label="Demandes particulières (facultatif)">
            <Input
              name="specialRequirements"
              placeholder="Allergies, anniversaire, accessibilité…"
              maxLength={1000}
            />
          </FormField>
        </div>
        <label className="flex cursor-pointer items-start gap-3 text-sm text-secondary">
          <input
            name="policyAccepted"
            type="checkbox"
            required
            className="mt-1"
          />
          <span>
            J’accepte la politique de réservation.{' '}
            {establishment.bookingPolicy && (
              <span className="text-muted">{establishment.bookingPolicy}</span>
            )}
          </span>
        </label>
        <label className="flex cursor-pointer items-start gap-3 text-sm text-secondary">
          <input name="marketingConsent" type="checkbox" className="mt-1" />
          Je souhaite recevoir les actualités du restaurant.
        </label>
      </div>
      <StepActions
        loading={loading}
        canContinue
        continueLabel="Confirmer la réservation"
        onBack={onBack}
      />
    </form>
  );
}

function ConfirmationStep({
  establishment,
  date,
  time,
  partySize,
  result,
}: {
  establishment: Establishment;
  date: string;
  time: string;
  partySize: number;
  result: Result;
}) {
  const confirmed = result.status === 'CONFIRMED';
  return (
    <div className="flex flex-1 flex-col text-center">
      <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-surface-selected text-status-success">
        <CheckCircle2 className="h-11 w-11" aria-hidden />
      </span>
      <h1 className="mt-5 text-2xl font-bold text-status-success">
        {confirmed ? 'Réservation confirmée !' : 'Demande envoyée !'}
      </h1>
      <p className="mt-2 text-sm text-secondary">
        Merci {result.firstName}.{' '}
        {confirmed
          ? 'Votre table est réservée.'
          : 'Le restaurant doit encore confirmer votre demande.'}
      </p>

      <div className="my-7 rounded-lg border border-border-default bg-surface-muted p-5 text-left">
        <SummaryRow icon={MapPin} value={establishment.name} />
        <SummaryRow icon={CalendarDays} value={formatDate(date)} />
        <SummaryRow icon={Clock3} value={time} />
        <SummaryRow
          icon={Users}
          value={`${partySize} personne${partySize > 1 ? 's' : ''}`}
        />
        <p className="mt-4 border-t border-border-default pt-3 text-xs text-muted">
          Référence {result.reference}
        </p>
      </div>

      <Button
        type="button"
        variant="outline"
        fullWidth
        onClick={() => downloadCalendar(establishment, date, time)}
      >
        <CalendarDays aria-hidden /> Ajouter à mon calendrier
      </Button>
      <Button asChild fullWidth className="mt-3">
        <a href={`/${establishment.slug}/reservation/${result.token}`}>
          Voir ma réservation
        </a>
      </Button>
    </div>
  );
}

function SummaryRow({
  icon: Icon,
  value,
}: {
  icon: typeof MapPin;
  value: string;
}) {
  return (
    <p className="flex items-center gap-3 py-1.5 text-sm">
      <Icon className="h-4 w-4 text-muted" aria-hidden />
      <span>{value}</span>
    </p>
  );
}

function StepActions({
  canContinue,
  loading = false,
  continueLabel = 'Continuer',
  onBack,
  onContinue,
}: {
  canContinue: boolean;
  loading?: boolean;
  continueLabel?: string;
  onBack: () => void;
  onContinue?: () => void;
}) {
  return (
    <div className="mt-auto grid grid-cols-[auto_1fr] gap-3">
      <Button type="button" variant="ghost" onClick={onBack}>
        <ChevronLeft aria-hidden /> Retour
      </Button>
      <Button
        type={onContinue ? 'button' : 'submit'}
        fullWidth
        loading={loading}
        disabled={!canContinue}
        onClick={onContinue}
      >
        {continueLabel}
      </Button>
    </div>
  );
}

function calendarDays(month: Date): Date[] {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const mondayOffset = (first.getDay() + 6) % 7;
  const start = addDays(first, -mondayOffset);
  return Array.from({ length: 42 }, (_, index) => addDays(start, index));
}

function startOfDay(value: Date): Date {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}

function addDays(value: Date, amount: number): Date {
  const result = new Date(value);
  result.setDate(result.getDate() + amount);
  return result;
}

function toLocalDate(value: Date): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDate(value: string): string {
  return new Date(`${value}T12:00:00`).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function downloadCalendar(
  establishment: Establishment,
  date: string,
  time: string,
) {
  const start = `${date.replaceAll('-', '')}T${time.replace(':', '')}00`;
  const content = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'BEGIN:VEVENT',
    `DTSTART;TZID=${establishment.timezone}:${start}`,
    `SUMMARY:Réservation — ${establishment.name}`,
    establishment.address ? `LOCATION:${establishment.address}` : '',
    'END:VEVENT',
    'END:VCALENDAR',
  ]
    .filter(Boolean)
    .join('\r\n');
  const link = document.createElement('a');
  link.href = `data:text/calendar;charset=utf-8,${encodeURIComponent(content)}`;
  link.download = `reservation-${establishment.slug}.ics`;
  link.click();
}
