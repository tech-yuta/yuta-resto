import 'server-only';

import { hashRateLimitKey, type AuthenticatedSession } from '@yuta/auth';
import {
  createAuthRepository,
  createMembershipLookup,
  findAuthenticatedTenantMetadata,
} from '@yuta/db-cloud';
import {
  requireEntitlement,
  requireEstablishment,
  requireRole,
  resolveAuthenticatedTenant,
  TenantError,
  type TenantContext,
} from '@yuta/tenant';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { cache } from 'react';
import { cloudDatabase } from '../cloud-database';
import { requireReputationPermission } from './permissions';
import { requireBookingPermission } from './permissions';

export const BACKOFFICE_SESSION_COOKIE = 'yuta_backoffice_session';
export const BACKOFFICE_SELECTION_COOKIE = 'yuta_backoffice_selection';

const authRepository = createAuthRepository(cloudDatabase);

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
    const token = cookieStore.get(BACKOFFICE_SESSION_COOKIE)?.value;
    if (!token) return null;
    return authRepository.findSession(token);
  },
);

export async function requireBackofficeSession(
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
  const session = await requireBackofficeSession(returnTo);
  const metadata = await findAuthenticatedTenantMetadata(cloudDatabase, {
    organizationId: session.organizationId,
    establishmentId: session.establishmentId,
  });
  if (!metadata) redirectToScopeRecovery(returnTo);

  try {
    const tenant = await resolveAuthenticatedTenant({
      userId: session.userId,
      organizationId: session.organizationId,
      establishmentId: session.establishmentId,
      membershipLookup: createMembershipLookup(cloudDatabase),
      tenantMetadata: metadata,
    });
    return { session, tenant };
  } catch (error: unknown) {
    if (error instanceof TenantError) redirectToScopeRecovery(returnTo);
    throw error;
  }
}

function redirectToScopeRecovery(returnTo: string): never {
  redirect(
    `/resolve-establishment?returnTo=${encodeURIComponent(safeReturnTo(returnTo))}`,
  );
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

export async function requireUserManagementTenant(): Promise<{
  session: AuthenticatedSession;
  tenant: TenantContext;
}> {
  const context = await requireAuthenticatedTenant('/team/users-access');
  requireRole(context.tenant, ['OWNER', 'MANAGER']);
  return context;
}

export async function requireBookingTenant(
  returnTo = '/operations/reservations',
) {
  const context = await requireAuthenticatedTenant(returnTo);
  requireEstablishment(context.tenant);
  requireEntitlement(context.tenant, 'booking.enabled');
  requireBookingPermission(context.tenant, 'booking.read');
  return context as typeof context & {
    tenant: typeof context.tenant & { establishmentId: string };
  };
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
