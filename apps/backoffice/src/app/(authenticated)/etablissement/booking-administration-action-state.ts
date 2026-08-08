import { z } from 'zod';

export const bookingAdministrationIdSchema = z.string().uuid();

export type BookingAdministrationActionState = {
  status: 'idle' | 'success' | 'error';
  message: string | null;
  fieldErrors: Record<string, string>;
};

export function bookingAdministrationError(
  error: unknown,
  fallbackMessage: string,
): BookingAdministrationActionState {
  if (error instanceof z.ZodError) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of error.issues) {
      const field = String(issue.path[0] ?? 'form');
      fieldErrors[field] ??= 'Vérifiez cette valeur.';
    }
    return {
      status: 'error',
      message: 'Certains champs doivent être corrigés.',
      fieldErrors,
    };
  }

  console.error(fallbackMessage, error);
  return {
    status: 'error',
    message: 'Une erreur est survenue. Réessayez.',
    fieldErrors: {},
  };
}
