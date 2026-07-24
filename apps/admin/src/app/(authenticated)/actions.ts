'use server';

import { AuthError, switchTenantInputSchema } from '@yuta/auth';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import {
  ADMIN_SESSION_COOKIE,
  authRepository,
  safeReturnTo,
} from '../../server/auth/session';

export type TenantSwitchActionState = {
  error: string | null;
};

export async function switchTenantAction(
  _previousState: TenantSwitchActionState,
  formData: FormData,
): Promise<TenantSwitchActionState> {
  const parsed = switchTenantInputSchema.safeParse({
    establishmentId: formData.get('establishmentId'),
    returnTo: formData.get('returnTo')?.toString(),
  });
  if (!parsed.success) {
    return { error: "Cet établissement n'est pas valide." };
  }

  const cookieStore = await cookies();
  const currentToken = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  if (!currentToken) {
    return { error: 'Votre session a expiré. Reconnectez-vous.' };
  }

  let result;
  try {
    result = await authRepository.switchTenant({
      token: currentToken,
      establishmentId: parsed.data.establishmentId,
    });
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      return {
        error:
          error.code === 'TENANT_ACCESS_DENIED'
            ? "Vous n'avez plus accès à cet établissement."
            : 'Votre session a expiré. Reconnectez-vous.',
      };
    }
    console.error('Admin tenant switch failed.', error);
    return {
      error: "Le changement d'établissement est momentanément indisponible.",
    };
  }

  cookieStore.set(ADMIN_SESSION_COOKIE, result.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: result.session.expiresAt,
    priority: 'high',
  });
  revalidatePath('/', 'layout');
  redirect(safeReturnTo(parsed.data.returnTo));
}

export async function logoutAction(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  if (token) await authRepository.revokeSession(token);
  cookieStore.delete(ADMIN_SESSION_COOKIE);
  redirect('/login');
}
