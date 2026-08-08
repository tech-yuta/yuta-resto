export type ReservationListView = 'day' | 'week';

export type ReservationListItem = {
  id: string;
  localDate: string;
  localTime: string;
  guestFirstName: string;
  guestLastName: string;
  reference: string;
  partySize: number;
  status: string;
};

export function getDateInTimezone(timezone: string, date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const values = new Map(parts.map((part) => [part.type, part.value]));
  return `${values.get('year')}-${values.get('month')}-${values.get('day')}`;
}

export function resolveReservationListDate(
  value: string | undefined,
  timezone: string,
  now = new Date(),
): string {
  return /^\d{4}-\d{2}-\d{2}$/.test(value ?? '')
    ? value!
    : getDateInTimezone(timezone, now);
}

export function resolveReservationListView(
  value: string | undefined,
): ReservationListView {
  return value === 'week' ? 'week' : 'day';
}

export function getReservationListEndDate(
  selectedDate: string,
  view: ReservationListView,
): string {
  const endDate = new Date(`${selectedDate}T12:00:00Z`);
  endDate.setUTCDate(endDate.getUTCDate() + (view === 'week' ? 6 : 0));
  return endDate.toISOString().slice(0, 10);
}
