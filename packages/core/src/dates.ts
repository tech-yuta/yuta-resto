export const SERVICE_DAY_START_HOUR = 5;

export function startOfToday(): Date {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

/**
 * Returns the start/end of the current restaurant service day.
 * The service day starts at `startHour` (default 05:00) and runs 24h.
 * Before startHour, the "current" day is considered to be yesterday's service.
 */
export function getServiceDayWindow(
  now: Date,
  startHour = SERVICE_DAY_START_HOUR,
): { start: Date; end: Date } {
  const start = new Date(now);
  start.setHours(startHour, 0, 0, 0);

  if (now.getHours() < startHour) {
    start.setDate(start.getDate() - 1);
  }

  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  return { start, end };
}
