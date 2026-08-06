export const orderedWeekDays = [
  { value: 1, label: 'Lundi' },
  { value: 2, label: 'Mardi' },
  { value: 3, label: 'Mercredi' },
  { value: 4, label: 'Jeudi' },
  { value: 5, label: 'Vendredi' },
  { value: 6, label: 'Samedi' },
  { value: 0, label: 'Dimanche' },
] as const;

export const exceptionKindLabels = {
  CLOSED_ALL_DAY: 'Fermeture exceptionnelle',
  CLOSED_SERVICE: 'Service fermé',
  MODIFIED_HOURS: 'Horaires modifiés',
  BLOCKED_SLOT: 'Créneau bloqué',
} as const;

export function formatTime(value: string): string {
  return value.slice(0, 5);
}

export function formatTimeRange(start: string, end: string): string {
  return `${formatTime(start)}–${formatTime(end)}`;
}

export function formatMinutes(value: number): string {
  if (value < 60) return `${value} min`;
  const hours = Math.floor(value / 60);
  const minutes = value % 60;
  return minutes === 0 ? `${hours} h` : `${hours} h ${minutes}`;
}

export function getDateInTimezone(timezone: string, date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const value = Object.fromEntries(
    parts.map((part) => [part.type, part.value]),
  );
  return `${value.year}-${value.month}-${value.day}`;
}

export function getDayOfWeekInTimezone(
  timezone: string,
  date = new Date(),
): number {
  const shortDay = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    weekday: 'short',
  }).format(date);
  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(shortDay);
}

export function getNextDatedItem<T extends { exceptionDate: string }>(
  items: readonly T[],
  today: string,
): T | undefined {
  return [...items]
    .filter((item) => item.exceptionDate >= today)
    .sort((left, right) =>
      left.exceptionDate.localeCompare(right.exceptionDate),
    )[0];
}
