'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import {
  ADMIN_SESSION_COOKIE,
  authRepository,
} from '../../server/auth/session';

export async function logoutAction(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  if (token) await authRepository.revokeSession(token);
  cookieStore.delete(ADMIN_SESSION_COOKIE);
  redirect('/login');
}
