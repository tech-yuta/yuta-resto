export type ReservationActionState = {
  status: 'idle' | 'success' | 'error';
  message: string | null;
  fieldErrors: Record<string, string>;
};

export const initialReservationActionState: ReservationActionState = {
  status: 'idle',
  message: null,
  fieldErrors: {},
};
