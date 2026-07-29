import { Button, ErrorState, IconTile, PageHeader } from '@yuta/ui';
import { ArrowLeft, Printer } from 'lucide-react';
import Link from 'next/link';
import { siteAgentClient } from '../../../lib/site-agent-client';
import { requireLocalManagementCredentials } from '../../../server/local-management-session';
import { PrintingManagement } from './PrintingManagement';

export default async function LocalPrintingManagementPage() {
  const { token } = await requireLocalManagementCredentials();

  let jobs;
  try {
    jobs = (await siteAgentClient.listPrintJobs(token, { limit: 100 }))
      .printJobs;
  } catch {
    return (
      <main className="grid min-h-dvh place-items-center bg-canvas p-4">
        <ErrorState
          title="Site-agent indisponible"
          description="Impossible de charger la file d’impression locale."
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
          title="File d’impression"
          description="Suivez les tickets cuisine et reçus client stockés dans la base POS locale."
          media={
            <IconTile tone="neutral">
              <Printer className="h-5 w-5" />
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
        <PrintingManagement jobs={jobs} />
      </div>
    </main>
  );
}
