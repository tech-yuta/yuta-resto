import 'server-only';

import type { LocalAuthSession } from '@yuta/contracts/local-pos';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { siteAgentClient } from '../lib/site-agent-client';

export const localManagementSessionCookie = 'yuta_pos_management_session';

export async function getLocalManagementSession(): Promise<LocalAuthSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(localManagementSessionCookie)?.value;
  if (!token) return null;

  try {
    const { session } = await siteAgentClient.getLocalSession(token);
    return session.user.role === 'admin' || session.user.role === 'manager'
      ? session
      : null;
  } catch {
    return null;
  }
}

export async function requireLocalManagementSession(): Promise<LocalAuthSession> {
  return (await requireLocalManagementCredentials()).session;
}

export async function requireLocalManagementCredentials(): Promise<{
  session: LocalAuthSession;
  token: string;
}> {
  const cookieStore = await cookies();
  const token = cookieStore.get(localManagementSessionCookie)?.value;
  if (!token) {
    redirect('/management/login');
  }
  const session = await getLocalManagementSession();
  if (!session) {
    redirect('/management/login');
  }
  return { session, token };
}
