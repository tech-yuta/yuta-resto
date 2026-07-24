import { AdminFrame } from '../../components/admin-frame';
import {
  authRepository,
  requireAuthenticatedTenant,
} from '../../server/auth/session';
import type { ReactNode } from 'react';

export const dynamic = 'force-dynamic';

export default async function AuthenticatedLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { session, tenant } = await requireAuthenticatedTenant();
  const availableTenants = await authRepository.listAvailableTenants(
    session.userId,
  );
  return (
    <AdminFrame
      currentUser={{
        name: session.userName,
        email: session.userEmail,
      }}
      tenantSwitcher={{
        tenants: availableTenants,
        currentEstablishmentId: session.establishmentId,
      }}
      canManageUsers={
        tenant.actor.type === 'user' &&
        (tenant.actor.role === 'owner' || tenant.actor.role === 'admin')
      }
    >
      {children}
    </AdminFrame>
  );
}
