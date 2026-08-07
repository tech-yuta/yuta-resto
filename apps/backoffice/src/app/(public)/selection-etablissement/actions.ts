'use server';

import { AuthError, switchTenantInputSchema } from '@yuta/auth';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import {
  BACKOFFICE_SELECTION_COOKIE,
  BACKOFFICE_SESSION_COOKIE,
  authRepository,
  safeReturnTo,
} from '../../../server/auth/session';

export type EstablishmentSelectionActionState = {
  error: string | null;
};

export async function selectEstablishmentAction(
  _previousState: EstablishmentSelectionActionState,
  formData: FormData,
): Promise<EstablishmentSelectionActionState> {
  const parsed = switchTenantInputSchema.safeParse({
    membershipId: formData.get('membershipId'),
    returnTo: formData.get('returnTo')?.toString(),
  });
  if (!parsed.success) {
    return { error: "Cet établissement n'est pas valide." };
  }

  const cookieStore = await cookies();
  const selectionToken = cookieStore.get(BACKOFFICE_SELECTION_COOKIE)?.value;
  if (!selectionToken) {
    return { error: 'Votre demande a expiré. Reconnectez-vous.' };
  }

  let result;
  try {
    result = await authRepository.activateSelection({
      selectionToken,
      membershipId: parsed.data.membershipId,
    });
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      return {
        error:
          error.code === 'SELECTION_TICKET_INVALID'
            ? 'Votre demande a expiré. Reconnectez-vous.'
            : "Vous n'avez plus accès à cet établissement.",
      };
    }
    console.error('Back-office establishment activation failed.', error);
    return {
      error: "Impossible d'ouvrir cet établissement pour le moment.",
    };
  }

  cookieStore.delete(BACKOFFICE_SELECTION_COOKIE);
  cookieStore.set(BACKOFFICE_SESSION_COOKIE, result.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: result.session.expiresAt,
    priority: 'high',
  });
  redirect(safeReturnTo(parsed.data.returnTo));
}
