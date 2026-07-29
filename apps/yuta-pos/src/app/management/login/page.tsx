import { Card, ErrorState } from '@yuta/ui';
import Image from 'next/image';
import { redirect } from 'next/navigation';
import { posApi } from '../../../lib/pos-api';
import { getLocalManagementSession } from '../../../server/local-management-session';
import { ManagementLoginForm } from './ManagementLoginForm';

export default async function ManagementLoginPage() {
  if (await getLocalManagementSession()) {
    redirect('/management');
  }

  let users;
  try {
    const response = await posApi.listLocalUsers();
    users = response.users.filter(
      (user) =>
        user.isActive && (user.role === 'admin' || user.role === 'manager'),
    );
  } catch {
    return (
      <main className="grid min-h-dvh place-items-center bg-canvas p-4">
        <ErrorState
          title="Site-agent indisponible"
          description="Démarrez la base POS et site-agent avant d'ouvrir la gestion locale."
        />
      </main>
    );
  }

  return (
    <main className="grid min-h-dvh place-items-center bg-canvas p-4">
      <Card padding="lg" className="w-full max-w-md">
        <div className="mb-7 grid justify-items-center gap-3 text-center">
          <div className="grid h-16 w-16 place-items-center rounded-lg bg-surface-selected">
            <Image
              src="/images/logo.svg"
              alt="YuTa"
              width={48}
              height={48}
              priority
            />
          </div>
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-secondary">
              YuTa POS
            </p>
            <h1 className="mt-1 text-2xl font-black text-primary">
              Gestion locale
            </h1>
            <p className="mt-2 text-sm text-secondary">
              Identifiez-vous avec votre code PIN administrateur.
            </p>
          </div>
        </div>

        {users.length > 0 ? (
          <ManagementLoginForm users={users} />
        ) : (
          <ErrorState
            title="Aucun gestionnaire actif"
            description="Ajoutez un administrateur ou un manager dans la base POS locale."
          />
        )}
      </Card>
    </main>
  );
}
