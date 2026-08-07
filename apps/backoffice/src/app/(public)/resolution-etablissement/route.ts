import { AuthError } from '@yuta/auth';
import { type NextRequest, NextResponse } from 'next/server';
import {
  BACKOFFICE_SELECTION_COOKIE,
  BACKOFFICE_SESSION_COOKIE,
  authRepository,
  safeReturnTo,
} from '../../../server/auth/session';

export async function GET(request: NextRequest) {
  const returnTo = safeReturnTo(request.nextUrl.searchParams.get('returnTo'));
  const sessionToken = request.cookies.get(BACKOFFICE_SESSION_COOKIE)?.value;
  if (!sessionToken) return redirectTo(request, '/connexion');

  try {
    const result = await authRepository.recoverSessionScope(sessionToken);
    if (result.type === 'NO_ESTABLISHMENT') {
      const response = redirectTo(request, '/acces/aucun-etablissement');
      response.cookies.delete(BACKOFFICE_SESSION_COOKIE);
      response.cookies.delete(BACKOFFICE_SELECTION_COOKIE);
      return response;
    }
    if (result.type === 'SELECTION_REQUIRED') {
      const response = redirectTo(
        request,
        `/selection-etablissement?returnTo=${encodeURIComponent(returnTo)}`,
      );
      response.cookies.delete(BACKOFFICE_SESSION_COOKIE);
      response.cookies.set(BACKOFFICE_SELECTION_COOKIE, result.selectionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        expires: result.expiresAt,
        priority: 'high',
      });
      return response;
    }

    const response = redirectTo(request, returnTo);
    response.cookies.delete(BACKOFFICE_SELECTION_COOKIE);
    response.cookies.set(BACKOFFICE_SESSION_COOKIE, result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      expires: result.session.expiresAt,
      priority: 'high',
    });
    return response;
  } catch (error: unknown) {
    if (!(error instanceof AuthError)) {
      console.error('Back-office session scope recovery failed.', error);
    }
    const response = redirectTo(request, '/connexion?error=membership');
    response.cookies.delete(BACKOFFICE_SESSION_COOKIE);
    response.cookies.delete(BACKOFFICE_SELECTION_COOKIE);
    return response;
  }
}

function redirectTo(request: NextRequest, pathname: string) {
  return NextResponse.redirect(new URL(pathname, request.url));
}
