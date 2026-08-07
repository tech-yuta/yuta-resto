import { BackofficeFrame } from '../../components/backoffice-frame';
import {
  authRepository,
  requireAuthenticatedTenant,
} from '../../server/auth/session';
import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function AuthenticatedLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { session, tenant } = await requireAuthenticatedTenant();
  if (tenant.actor.type !== 'user') redirect('/connexion');
  const availableTenants = await authRepository.listAvailableTenants(
    session.userId,
  );
  return (
    <BackofficeFrame
      currentUser={{
        name: session.userName,
        email: session.userEmail,
      }}
      tenantSwitcher={{
        tenants: availableTenants,
        currentMembershipId: tenant.actor.membershipId,
      }}
      canManageUsers={
        tenant.actor.type === 'user' &&
        (tenant.actor.role === 'OWNER' || tenant.actor.role === 'MANAGER')
      }
      canManageBookingSettings={
        tenant.actor.type === 'user' &&
        (tenant.actor.role === 'OWNER' || tenant.actor.role === 'MANAGER')
      }
      bookingEnabled={tenant.entitlements.has('booking.enabled')}
      reputationEnabled={tenant.entitlements.has('reputation.enabled')}
    >
      {children}
    </BackofficeFrame>
  );
}
