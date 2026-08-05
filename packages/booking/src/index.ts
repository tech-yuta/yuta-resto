import { Temporal } from '@js-temporal/polyfill';
import type { ReservationStatus } from '@yuta/contracts/reservations';

export type AvailabilitySettings = {
  minimumPartySize: number;
  maximumPartySize: number;
  slotIntervalMinutes: number;
  minimumNoticeMinutes: number;
  bookingWindowDays: number;
};

export type ServicePeriod = {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  capacity: number;
  enabled: boolean;
};

export type BookingException = {
  kind: 'CLOSED_ALL_DAY' | 'CLOSED_SERVICE' | 'MODIFIED_HOURS' | 'BLOCKED_SLOT';
  servicePeriodId: string | null;
  startTime: string | null;
  endTime: string | null;
  capacityOverride: number | null;
};

export type AvailabilitySlot = {
  time: string;
  available: boolean;
  remainingCapacity: number;
};

export class BookingDomainError extends Error {
  constructor(
    message: string,
    public readonly code:
      | 'INVALID_LOCAL_TIME'
      | 'INVALID_PARTY_SIZE'
      | 'OUTSIDE_BOOKING_WINDOW'
      | 'SLOT_UNAVAILABLE'
      | 'INVALID_STATUS_TRANSITION'
      | 'CANCELLATION_DEADLINE_PASSED',
  ) {
    super(message);
    this.name = 'BookingDomainError';
  }
}

const consumingStatuses = new Set<ReservationStatus>([
  'PENDING',
  'CONFIRMED',
  'SEATED',
]);

const transitions: Record<ReservationStatus, readonly ReservationStatus[]> = {
  PENDING: ['CONFIRMED', 'DECLINED', 'CANCELLED'],
  CONFIRMED: ['CANCELLED', 'SEATED', 'NO_SHOW'],
  DECLINED: [],
  CANCELLED: [],
  SEATED: ['COMPLETED'],
  COMPLETED: [],
  NO_SHOW: [],
};

export function consumesCapacity(status: ReservationStatus): boolean {
  return consumingStatuses.has(status);
}

export function assertStatusTransition(
  current: ReservationStatus,
  next: ReservationStatus,
): void {
  if (current === next) return;
  if (!transitions[current].includes(next)) {
    throw new BookingDomainError(
      `Reservation cannot move from ${current} to ${next}.`,
      'INVALID_STATUS_TRANSITION',
    );
  }
}

export function localDateTimeToInstant(
  date: string,
  time: string,
  timezone: string,
): Date {
  try {
    return new Date(
      Temporal.ZonedDateTime.from(`${date}T${time}:00[${timezone}]`, {
        disambiguation: 'reject',
      }).epochMilliseconds,
    );
  } catch {
    throw new BookingDomainError(
      'The selected local date and time is invalid.',
      'INVALID_LOCAL_TIME',
    );
  }
}

export function generateAvailability(input: {
  date: string;
  timezone: string;
  partySize: number;
  settings: AvailabilitySettings;
  periods: readonly ServicePeriod[];
  exceptions: readonly BookingException[];
  reservedSeatsByTime: ReadonlyMap<string, number>;
  now: Date;
}): AvailabilitySlot[] {
  const { settings } = input;
  if (
    input.partySize < settings.minimumPartySize ||
    input.partySize > settings.maximumPartySize
  ) {
    throw new BookingDomainError(
      'Party size is outside the permitted range.',
      'INVALID_PARTY_SIZE',
    );
  }

  const today = Temporal.Instant.fromEpochMilliseconds(input.now.getTime())
    .toZonedDateTimeISO(input.timezone)
    .toPlainDate();
  const requestedDate = Temporal.PlainDate.from(input.date);
  const daysAhead = today.until(requestedDate).days;
  if (daysAhead < 0 || daysAhead > settings.bookingWindowDays) {
    throw new BookingDomainError(
      'Date is outside the booking window.',
      'OUTSIDE_BOOKING_WINDOW',
    );
  }

  if (input.exceptions.some((item) => item.kind === 'CLOSED_ALL_DAY'))
    return [];

  const minimumInstant =
    input.now.getTime() + settings.minimumNoticeMinutes * 60_000;
  const result = new Map<string, AvailabilitySlot>();
  const dayOfWeek = requestedDate.dayOfWeek % 7;

  for (const period of input.periods) {
    if (!period.enabled || period.dayOfWeek !== dayOfWeek) continue;
    const relevant = input.exceptions.filter(
      (item) =>
        item.servicePeriodId === null || item.servicePeriodId === period.id,
    );
    if (relevant.some((item) => item.kind === 'CLOSED_SERVICE')) continue;

    const modified = relevant.find((item) => item.kind === 'MODIFIED_HOURS');
    const start = modified?.startTime ?? period.startTime;
    const end = modified?.endTime ?? period.endTime;
    const capacity = modified?.capacityOverride ?? period.capacity;
    if (!start || !end || end <= start) continue;

    let cursor = Temporal.PlainTime.from(start);
    const endTime = Temporal.PlainTime.from(end);
    while (Temporal.PlainTime.compare(cursor, endTime) < 0) {
      const time = cursor.toString({ smallestUnit: 'minute' });
      const instant = localDateTimeToInstant(input.date, time, input.timezone);
      const blocked = relevant.some(
        (item) =>
          item.kind === 'BLOCKED_SLOT' &&
          item.startTime !== null &&
          item.endTime !== null &&
          time >= item.startTime &&
          time < item.endTime,
      );
      const remaining = Math.max(
        0,
        capacity - (input.reservedSeatsByTime.get(time) ?? 0),
      );
      result.set(time, {
        time,
        available:
          !blocked &&
          instant.getTime() >= minimumInstant &&
          remaining >= input.partySize,
        remainingCapacity: remaining,
      });
      cursor = cursor.add({ minutes: settings.slotIntervalMinutes });
    }
  }

  return [...result.values()].sort((left, right) =>
    left.time.localeCompare(right.time),
  );
}

export function assertSlotAvailable(
  slots: readonly AvailabilitySlot[],
  time: string,
): void {
  if (!slots.some((slot) => slot.time === time && slot.available)) {
    throw new BookingDomainError(
      'The selected slot is no longer available.',
      'SLOT_UNAVAILABLE',
    );
  }
}

export function isCancellationAllowed(input: {
  startAt: Date;
  now: Date;
  cancellationDeadlineMinutes: number;
}): boolean {
  return (
    input.startAt.getTime() - input.now.getTime() >=
    input.cancellationDeadlineMinutes * 60_000
  );
}

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function normalizePhone(value: string): string {
  const trimmed = value.trim();
  const prefix = trimmed.startsWith('+') ? '+' : '';
  return `${prefix}${trimmed.replace(/\D/g, '')}`;
}

export type BookingNotificationEvent = {
  type:
    | 'RESERVATION_CREATED'
    | 'RESERVATION_CONFIRMED'
    | 'RESERVATION_DECLINED'
    | 'RESERVATION_CANCELLED'
    | 'RESERVATION_UPDATED';
  reservationId: string;
  organizationId: string;
  establishmentId: string;
};

export interface BookingNotificationPublisher {
  publish(event: BookingNotificationEvent): Promise<void>;
}
