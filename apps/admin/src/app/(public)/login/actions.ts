'use server';

import { AuthError, loginInputSchema } from '@yuta/auth';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import {
  ADMIN_SESSION_COOKIE,
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
    cookieStore.set(ADMIN_SESSION_COOKIE, result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      expires: result.session.expiresAt,
      priority: 'high',
    });
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      if (error.code === 'LOGIN_RATE_LIMITED') {
        return {
          error: 'Trop de tentatives. Patientez 15 minutes avant de réessayer.',
        };
      }
      return { error: 'Adresse e-mail ou mot de passe incorrect.' };
    }
    console.error('Admin login failed.', error);
    return {
      error: 'La connexion est momentanément indisponible.',
    };
  }

  redirect(safeReturnTo(formData.get('returnTo')?.toString()));
}
