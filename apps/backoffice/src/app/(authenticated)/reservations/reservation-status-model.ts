export function getReservationStatusTone(
  status: string,
): 'success' | 'warning' | 'neutral' {
  if (status === 'CONFIRMED') return 'success';
  if (status === 'PENDING') return 'warning';
  return 'neutral';
}

export function getReservationStatusTransitions(status: string): string[] {
  if (status === 'PENDING') return ['CONFIRMED', 'DECLINED'];
  if (status === 'CONFIRMED') return ['SEATED', 'CANCELLED', 'NO_SHOW'];
  if (status === 'SEATED') return ['COMPLETED'];
  return [];
}
