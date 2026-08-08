export type ReservationDetailRecord = {
  id: string;
  reference: string;
  status: string;
  localDate: string;
  localTime: string;
  partySize: number;
  guestFirstName: string;
  guestLastName: string;
  guestEmail: string;
  guestPhone: string;
  specialRequirements: string | null;
};

export type ReservationNoteRecord = {
  id: string;
  body: string;
  createdAt: Date;
};

export type ReservationHistoryRecord = {
  id: string;
  fromStatus: string | null;
  toStatus: string;
  createdAt: Date;
};

export function formatReservationEventDate(
  value: Date,
  locale: string,
  timezone: string,
): string {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: timezone,
  }).format(value);
}
