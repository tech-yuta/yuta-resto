import { z } from 'zod';
import type { ReservationActionState } from './reservation-action-state';

export function reservationActionSuccess(
  message: string,
): ReservationActionState {
  return { status: 'success', message, fieldErrors: {} };
}

export function reservationActionFailure(
  message: string,
): ReservationActionState {
  return { status: 'error', message, fieldErrors: {} };
}

export function reservationActionError(
  error: unknown,
  fallbackMessage: string,
): ReservationActionState {
  if (error instanceof z.ZodError) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of error.issues) {
      const field = String(issue.path.at(-1) ?? 'form');
      fieldErrors[field] ??= 'Vérifiez cette valeur.';
    }
    return {
      status: 'error',
      message: 'Certains champs doivent être corrigés.',
      fieldErrors,
    };
  }

  if (hasErrorCode(error, 'SLOT_UNAVAILABLE')) {
    return reservationActionFailure(
      'Ce créneau n’est plus disponible. Choisissez une autre heure.',
    );
  }
  if (hasErrorCode(error, 'BOOKING_DISABLED')) {
    return reservationActionFailure(
      'La réservation publique est désactivée pour cet établissement.',
    );
  }
  if (hasErrorCode(error, 'BOOKING_NOT_FOUND')) {
    return reservationActionFailure(
      'Cette réservation n’existe plus ou n’est plus accessible.',
    );
  }

  if (hasErrorCode(error, 'INVALID_STATUS_TRANSITION')) {
    return reservationActionFailure(
      'Le statut a changé. Actualisez la page puis réessayez.',
    );
  }

  console.error(fallbackMessage, error);
  return reservationActionFailure(
    'Une erreur est survenue. Vérifiez les données puis réessayez.',
  );
}

function hasErrorCode(error: unknown, code: string): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === code
  );
}
