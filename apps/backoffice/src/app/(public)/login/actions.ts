'use server';

import { AuthError, loginInputSchema } from '@yuta/auth';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import {
  BACKOFFICE_SESSION_COOKIE,
  BACKOFFICE_SELECTION_COOKIE,
  authRepository,
  createLoginRateLimitKey,
  hashClientAddress,
  safeReturnTo,
} from '../../../server/auth/session';

export type LoginActionState = {
  error: string | null;
};

function getClientAddress(requestHeaders: Headers): string {
  const forwardedFor = requestHeaders.get('x-forwarded-for');
  if (forwardedFor) return forwardedFor.split(',')[0]?.trim() || 'unknown';
  return requestHeaders.get('x-real-ip') ?? 'unknown';
}

export async function loginAction(
  _previousState: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> {
  const parsed = loginInputSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });
  if (!parsed.success) {
    return { error: 'Vérifiez votre adresse e-mail et votre mot de passe.' };
  }

  const requestHeaders = await headers();
  const clientAddress = getClientAddress(requestHeaders);
  let destination = safeReturnTo(formData.get('returnTo')?.toString());

  try {
    const result = await authRepository.signIn({
      ...parsed.data,
      rateLimitKeyHash: createLoginRateLimitKey(
        parsed.data.email,
        clientAddress,
      ),
      ipHash:
        clientAddress === 'unknown' ? null : hashClientAddress(clientAddress),
      userAgent: requestHeaders.get('user-agent')?.slice(0, 500) ?? null,
    });

    const cookieStore = await cookies();
    if (result.type === 'SELECTION_REQUIRED') {
      cookieStore.delete(BACKOFFICE_SESSION_COOKIE);
      cookieStore.set(BACKOFFICE_SELECTION_COOKIE, result.selectionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        expires: result.expiresAt,
        priority: 'high',
      });
      destination = `/select-establishment?returnTo=${encodeURIComponent(destination)}`;
    } else {
      cookieStore.delete(BACKOFFICE_SELECTION_COOKIE);
      cookieStore.set(BACKOFFICE_SESSION_COOKIE, result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        expires: result.session.expiresAt,
        priority: 'high',
      });
    }
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      if (error.code === 'LOGIN_RATE_LIMITED') {
        return {
          error: 'Trop de tentatives. Patientez 15 minutes avant de réessayer.',
        };
      }
      if (error.code === 'NO_ACTIVE_MEMBERSHIP') {
        const cookieStore = await cookies();
        cookieStore.delete(BACKOFFICE_SESSION_COOKIE);
        cookieStore.delete(BACKOFFICE_SELECTION_COOKIE);
        destination = '/access/no-establishment';
      } else {
        return { error: 'Adresse e-mail ou mot de passe incorrect.' };
      }
    } else {
      console.error('Back-office login failed.', error);
      return {
        error: 'La connexion est momentanément indisponible.',
      };
    }
  }

  redirect(destination);
}
