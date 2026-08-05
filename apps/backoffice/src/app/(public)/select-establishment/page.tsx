import { AuthError, type AvailableTenant } from '@yuta/auth';
import { Badge, Card } from '@yuta/ui';
import { Building2 } from 'lucide-react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import {
  BACKOFFICE_SELECTION_COOKIE,
  authRepository,
  safeReturnTo,
} from '../../../server/auth/session';
import { EstablishmentSelectionForm } from './establishment-selection-form';

export const dynamic = 'force-dynamic';

const roleLabels = {
  OWNER: 'Propriétaire',
  MANAGER: 'Gestionnaire',
  STAFF: 'Équipe',
} as const;

export default async function SelectEstablishmentPage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string }>;
}) {
  const query = await searchParams;
  const returnTo = safeReturnTo(query.returnTo);
  const cookieStore = await cookies();
  const selectionToken = cookieStore.get(BACKOFFICE_SELECTION_COOKIE)?.value;
  if (!selectionToken) redirect('/login');

  let establishments: AvailableTenant[];
  try {
    establishments = await authRepository.listSelectionOptions(selectionToken);
  } catch (error: unknown) {
    if (error instanceof AuthError) redirect('/login?error=selection');
    throw error;
  }
  if (establishments.length === 0) redirect('/access/no-establishment');

  const organizations = groupByOrganization(establishments);
  return (
    <main className="w-full max-w-3xl">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-primary">
          Sélectionner un établissement
        </h1>
        <p className="mt-2 text-sm text-secondary">
          Choisissez l’établissement que vous souhaitez gérer.
        </p>
      </div>

      <div className="space-y-7">
        {organizations.map((organization) => (
          <section key={organization.id} aria-labelledby={organization.id}>
            <h2
              id={organization.id}
              className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-secondary"
            >
              <Building2 className="h-4 w-4" aria-hidden="true" />
              {organization.name}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {organization.establishments.map((establishment) => (
                <Card key={establishment.membershipId} padding="lg">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate text-lg font-semibold text-primary">
                        {establishment.establishmentName}
                      </h3>
                    </div>
                    <Badge tone="brand">{roleLabels[establishment.role]}</Badge>
                  </div>
                  <EstablishmentSelectionForm
                    membershipId={establishment.membershipId}
                    returnTo={returnTo}
                  />
                </Card>
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}

function groupByOrganization(establishments: AvailableTenant[]) {
  const organizations = new Map<
    string,
    { id: string; name: string; establishments: AvailableTenant[] }
  >();
  for (const establishment of establishments) {
    const group = organizations.get(establishment.organizationId);
    if (group) {
      group.establishments.push(establishment);
    } else {
      organizations.set(establishment.organizationId, {
        id: establishment.organizationId,
        name: establishment.organizationName,
        establishments: [establishment],
      });
    }
  }
  return [...organizations.values()];
}
