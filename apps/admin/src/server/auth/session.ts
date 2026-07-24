import 'server-only';

import { hashRateLimitKey, type AuthenticatedSession } from '@yuta/auth';
import { createAuthRepository } from '@yuta/db';
import { db } from '@yuta/db/client';
import {
  createMembershipLookup,
  findAuthenticatedTenantMetadata,
} from '@yuta/db/tenant-adapters';
import {
  requireEntitlement,
  resolveAuthenticatedTenant,
  type TenantContext,
} from '@yuta/tenant';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { cache } from 'react';
import { requireReputationPermission } from './permissions';

export const ADMIN_SESSION_COOKIE = 'yuta_admin_session';

const authRepository = createAuthRepository(db);

export function getAuthSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (secret && secret.length >= 32) return secret;
  if (process.env.NODE_ENV !== 'production') {
    return 'local-development-auth-secret-change-me';
  }
  throw new Error('AUTH_SECRET must contain at least 32 characters.');
}

export function createLoginRateLimitKey(
  email: string,
  clientAddress: string,
): string {
  return hashRateLimitKey(`${email}|${clientAddress}`, getAuthSecret());
}

export function hashClientAddress(clientAddress: string): string {
  return hashRateLimitKey(clientAddress, getAuthSecret());
}

export const getCurrentSession = cache(
  async (): Promise<AuthenticatedSession | null> => {
    const cookieStore = await cookies();
    const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
    if (!token) return null;
    return authRepository.findSession(token);
  },
);

export async function requireAdminSession(
  returnTo = '/today',
): Promise<AuthenticatedSession> {
  const session = await getCurrentSession();
  if (!session) {
    redirect(`/login?returnTo=${encodeURIComponent(safeReturnTo(returnTo))}`);
  }
  return session;
}

export async function requireAuthenticatedTenant(returnTo = '/today'): Promise<{
  session: AuthenticatedSession;
  tenant: TenantContext;
}> {
  const session = await requireAdminSession(returnTo);
  const metadata = await findAuthenticatedTenantMetadata(db, {
    organizationId: session.organizationId,
    establishmentId: session.establishmentId,
  });
  if (!metadata) redirect('/login?error=membership');

  const tenant = await resolveAuthenticatedTenant({
    userId: session.userId,
    organizationId: session.organizationId,
    establishmentId: session.establishmentId,
    membershipLookup: createMembershipLookup(db),
    tenantMetadata: metadata,
  });
  return { session, tenant };
}

export async function requireReputationTenant(
  returnTo = '/customers/reviews',
): Promise<{
  session: AuthenticatedSession;
  tenant: TenantContext;
}> {
  const context = await requireAuthenticatedTenant(returnTo);
  requireEntitlement(context.tenant, 'reputation.enabled');
  requireReputationPermission(context.tenant, 'reputation.read');
  return context;
}

export function safeReturnTo(value: string | null | undefined): string {
  if (
    !value ||
    !value.startsWith('/') ||
    value.startsWith('//') ||
    value.includes('\\')
  ) {
    return '/today';
  }
  return value;
}

export { authRepository };
