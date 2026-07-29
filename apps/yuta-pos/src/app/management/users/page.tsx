import { Button, ErrorState, IconTile, PageHeader } from '@yuta/ui';
import { ArrowLeft, Users } from 'lucide-react';
import Link from 'next/link';
import { siteAgentClient } from '../../../lib/site-agent-client';
import { requireLocalManagementSession } from '../../../server/local-management-session';
import { UsersManagement } from './UsersManagement';

export default async function LocalUsersManagementPage() {
  const session = await requireLocalManagementSession();

  let users;
  try {
    users = (await siteAgentClient.listLocalUsers()).users;
  } catch {
    return (
      <main className="grid min-h-dvh place-items-center bg-canvas p-4">
        <ErrorState
          title="Site-agent indisponible"
          description="Impossible de charger les utilisateurs POS locaux."
          action={
            <Button asChild variant="secondary">
              <Link href="/management">Retour à la gestion</Link>
            </Button>
          }
        />
      </main>
    );
  }

  return (
    <main className="min-h-dvh bg-canvas text-primary">
      <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-6 md:px-8">
        <PageHeader
          eyebrow="Gestion locale"
          title="Équipe POS"
          description="Gérez les utilisateurs, les rôles, les PIN et l’accès au terminal."
          media={
            <IconTile tone="brand">
              <Users className="h-5 w-5" />
            </IconTile>
          }
          actions={
            <Button asChild variant="secondary">
              <Link href="/management">
                <ArrowLeft className="h-4 w-4" />
                Retour
              </Link>
            </Button>
          }
        />
        <UsersManagement users={users} actorRole={session.user.role} />
      </div>
    </main>
  );
}
