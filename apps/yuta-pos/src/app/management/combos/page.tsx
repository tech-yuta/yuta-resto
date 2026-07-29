import { Button, ErrorState, IconTile, PageHeader } from '@yuta/ui';
import { ArrowLeft, Layers3 } from 'lucide-react';
import Link from 'next/link';
import { siteAgentClient } from '../../../lib/site-agent-client';
import { requireLocalManagementSession } from '../../../server/local-management-session';
import { ComboManagement } from './ComboManagement';

export default async function LocalComboManagementPage() {
  await requireLocalManagementSession();

  let catalog;
  try {
    catalog = await siteAgentClient.getCatalog();
  } catch {
    return (
      <main className="grid min-h-dvh place-items-center bg-canvas p-4">
        <ErrorState
          title="Site-agent indisponible"
          description="Impossible de charger les formules POS locales."
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
          title="Formules et combos"
          description="Configurez les groupes éligibles, les suppléments, la priorité et le mode de prix."
          media={
            <IconTile tone="info">
              <Layers3 className="h-5 w-5" />
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
        <ComboManagement
          comboRules={catalog.comboRules}
          catalogItems={catalog.categories.flatMap(
            (category) => category.items,
          )}
        />
      </div>
    </main>
  );
}
