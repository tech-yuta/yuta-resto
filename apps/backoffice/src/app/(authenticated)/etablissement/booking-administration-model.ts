export type ServicePeriodOption = {
  id: string;
  dayOfWeek: number;
  name: string;
};

export type BookingSettings = {
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

export type BookingException = {
  id: string;
  exceptionDate: string;
  kind: 'CLOSED_ALL_DAY' | 'CLOSED_SERVICE' | 'MODIFIED_HOURS' | 'BLOCKED_SLOT';
};

export function getBookingExceptionFieldVisibility(
  kind: BookingException['kind'],
): {
  requiresService: boolean;
  requiresTimes: boolean;
  supportsCapacity: boolean;
} {
  return {
    requiresService: kind === 'CLOSED_SERVICE',
    requiresTimes: kind === 'MODIFIED_HOURS' || kind === 'BLOCKED_SLOT',
    supportsCapacity: kind === 'MODIFIED_HOURS',
  };
}

export function getBookingDayLabel(dayOfWeek: number): string {
  return (
    ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'][
      dayOfWeek
    ] ?? 'Jour'
  );
}

export function formatBookingExceptionDate(
  value: string,
  locale: string,
): string {
  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${value}T12:00:00Z`));
}
