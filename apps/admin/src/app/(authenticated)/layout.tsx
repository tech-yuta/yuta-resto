import { AdminFrame } from '../../components/admin-frame';
import { requireAuthenticatedTenant } from '../../server/auth/session';
import type { ReactNode } from 'react';

export const dynamic = 'force-dynamic';

export default async function AuthenticatedLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { session } = await requireAuthenticatedTenant();
  return (
    <AdminFrame
      currentUser={{
        name: session.userName,
        email: session.userEmail,
      }}
    >
      {children}
    </AdminFrame>
  );
}
