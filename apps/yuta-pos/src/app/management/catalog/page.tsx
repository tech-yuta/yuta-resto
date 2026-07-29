import { Button, ErrorState, IconTile, PageHeader } from '@yuta/ui';
import { ArrowLeft, Utensils } from 'lucide-react';
import Link from 'next/link';
import { siteAgentClient } from '../../../lib/site-agent-client';
import { requireLocalManagementSession } from '../../../server/local-management-session';
import { CatalogManagement } from './CatalogManagement';

export default async function LocalCatalogManagementPage() {
  await requireLocalManagementSession();

  let categories;
  try {
    categories = (await siteAgentClient.getCatalog()).categories;
  } catch {
    return (
      <main className="grid min-h-dvh place-items-center bg-canvas p-4">
        <ErrorState
          title="Site-agent indisponible"
          description="Impossible de charger le catalogue POS local."
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
          title="Menu et catégories"
          description="Gérez les prix, la disponibilité, l’ordre d’affichage et les postes de préparation."
          media={
            <IconTile tone="success">
              <Utensils className="h-5 w-5" />
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
        <CatalogManagement categories={categories} />
      </div>
    </main>
  );
}
