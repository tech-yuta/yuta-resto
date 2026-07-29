'use server';

import { localAuthLoginInputSchema } from '@yuta/contracts/local-pos';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import {
  SiteAgentClientError,
  siteAgentClient,
} from '../../lib/site-agent-client';
import { localManagementSessionCookie } from '../../server/local-management-session';

export type ManagementLoginState = {
  error: string | null;
};

export async function signInManagementAction(
  _previousState: ManagementLoginState,
  formData: FormData,
): Promise<ManagementLoginState> {
  const input = localAuthLoginInputSchema.safeParse({
    userId: formData.get('userId'),
    pin: formData.get('pin'),
  });
  if (!input.success) {
    return { error: 'Sélectionnez un utilisateur et saisissez un PIN valide.' };
  }

  try {
    const result = await siteAgentClient.signInLocalUser(input.data);
    if (
      result.session.user.role !== 'admin' &&
      result.session.user.role !== 'manager'
    ) {
      await siteAgentClient.signOutLocalSession(result.token);
      return {
        error: "Cet utilisateur n'a pas accès à la gestion locale.",
      };
    }

    const cookieStore = await cookies();
    cookieStore.set(localManagementSessionCookie, result.token, {
      httpOnly: true,
      sameSite: 'strict',
      secure: false,
      path: '/',
      expires: new Date(result.session.expiresAt),
    });
  } catch (error: unknown) {
    if (
      error instanceof SiteAgentClientError &&
      error.code === 'LOCAL_LOGIN_RATE_LIMITED'
    ) {
      return {
        error: 'Trop de tentatives. Réessayez dans quelques minutes.',
      };
    }
    return { error: 'Utilisateur ou PIN incorrect.' };
  }

  redirect('/management');
}

export async function signOutManagementAction(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(localManagementSessionCookie)?.value;
  if (token) {
    await siteAgentClient.signOutLocalSession(token).catch(() => undefined);
  }
  cookieStore.delete(localManagementSessionCookie);
  redirect('/management/login');
}
