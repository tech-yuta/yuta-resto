import { createPrintService } from '@yuta/core';
import { db } from '@yuta/db/client';
import { Badge, Button, Card, EmptyState, Input, Separator, StatCard } from '@yuta/ui';
import { BarChart3, CheckCircle2, Printer, RefreshCw, XCircle } from 'lucide-react';
import Link from 'next/link';
import { AdminPage } from '../../../../components/admin-page';
import {
  markPrintJobFailedAction,
  markPrintJobPrintedAction,
  retryPrintJobAction,
} from './actions';

export const dynamic = 'force-dynamic';

type PrintPayloadSummary = {
  orderNumber?: string;
  tableLabel?: string;
  itemCount?: number;
};

export default async function PosPrintsPage() {
  const printService = createPrintService(db);
  const jobs = await printService.listPrintJobs({ limit: 100 });
  const counters = {
    pending: jobs.filter((job) => job.status === 'pending').length,
    printed: jobs.filter((job) => job.status === 'printed').length,
    failed: jobs.filter((job) => job.status === 'failed').length,
  };

  return (
    <AdminPage
      title="POS impressions"
      description="File mock des tickets cuisine"
      actions={
        <>
          <Button asChild variant="secondary">
            <Link href="/operations/reports">
              <BarChart3 className="h-4 w-4" />
              Rapports
            </Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/menu/menus">
              <Printer className="h-4 w-4" />
              Menu
            </Link>
          </Button>
        </>
      }
    >

        <section className="grid gap-4 md:grid-cols-3">
          <StatCard icon={<Printer className="h-4 w-4" />} label="En attente" value={String(counters.pending)} />
          <StatCard icon={<CheckCircle2 className="h-4 w-4" />} label="Imprimees" value={String(counters.printed)} />
          <StatCard icon={<XCircle className="h-4 w-4" />} label="Echecs" value={String(counters.failed)} />
        </section>

        <Card className="overflow-hidden p-0">
          <div className="px-5 py-4">
            <h2 className="text-lg font-bold">Jobs recents</h2>
            <p className="mt-1 text-sm text-primary/55">{jobs.length} job(s)</p>
          </div>
          <Separator />
          {jobs.length === 0 ? (
            <EmptyState
              icon={<Printer className="h-10 w-10" />}
              title="Aucun ticket"
              description="Les tickets cuisine apparaitront apres un envoi cuisine."
            />
          ) : (
            <div>
              {jobs.map((job, index) => {
                const summary = getPayloadSummary(job.payload);

                return (
                  <div key={job.id}>
                    <div className="grid gap-4 px-5 py-4 xl:grid-cols-[1.1fr_0.9fr_0.7fr_1.4fr] xl:items-center">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-black">{summary.tableLabel ?? 'Ticket'}</p>
                          <Badge {...statusBadgeProps(job.status)}>{statusLabel(job.status)}</Badge>
                        </div>
                        <p className="mt-1 text-sm font-semibold text-primary/55">{summary.orderNumber ?? job.id}</p>
                        {job.errorMessage && <p className="mt-2 text-sm font-semibold text-primary">{job.errorMessage}</p>}
                      </div>

                      <div className="text-sm">
                        <p className="font-semibold">{job.printerName}</p>
                        <p className="text-primary/55">{typeLabel(job.jobType)} - {sourceLabel(job.source)}</p>
                      </div>

                      <div className="text-sm">
                        <p className="font-semibold">{summary.itemCount ?? 0} article(s)</p>
                        <p className="text-primary/55">{formatDateTime(job.createdAt)}</p>
                      </div>

                      <div className="flex flex-wrap gap-2 xl:justify-end">
                        {job.status !== 'printed' && (
                          <form action={markPrintJobPrintedAction}>
                            <input type="hidden" name="printJobId" value={job.id} />
                            <Button type="submit" variant="primary" size="sm">
                              <CheckCircle2 className="h-4 w-4" />
                              Marquer imprime
                            </Button>
                          </form>
                        )}
                        {job.status === 'failed' && (
                          <form action={retryPrintJobAction}>
                            <input type="hidden" name="printJobId" value={job.id} />
                            <Button type="submit" variant="secondary" size="sm">
                              <RefreshCw className="h-4 w-4" />
                              Reessayer
                            </Button>
                          </form>
                        )}
                        {job.status !== 'failed' && job.status !== 'printed' && (
                          <form action={markPrintJobFailedAction} className="flex min-w-72 flex-1 gap-2 xl:max-w-md">
                            <input type="hidden" name="printJobId" value={job.id} />
                            <Input name="errorMessage" placeholder="Erreur mock" required />
                            <Button type="submit" variant="danger" size="sm">
                              <XCircle className="h-4 w-4" />
                              Echec
                            </Button>
                          </form>
                        )}
                      </div>
                    </div>
                    {index < jobs.length - 1 && <Separator />}
                  </div>
                );
              })}
            </div>
          )}
        </Card>
    </AdminPage>
  );
}

function getPayloadSummary(payload: unknown): PrintPayloadSummary {
  if (!payload || typeof payload !== 'object') {
    return {};
  }

  const record = payload as Record<string, unknown>;
  const items = Array.isArray(record.items) ? record.items : [];

  return {
    orderNumber: typeof record.orderNumber === 'string' ? record.orderNumber : undefined,
    tableLabel: typeof record.tableLabel === 'string' ? record.tableLabel : undefined,
    itemCount: items.length,
  };
}

function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: 'En attente',
    printing: 'Impression',
    printed: 'Imprime',
    failed: 'Echec',
  };

  return labels[status] ?? status;
}

function statusBadgeProps(status: string) {
  if (status === 'printed') {
    return { tone: 'success', variant: 'soft' } as const;
  }

  if (status === 'failed') {
    return { tone: 'danger', variant: 'solid' } as const;
  }

  if (status === 'pending') {
    return { tone: 'neutral', variant: 'outline' } as const;
  }

  return { tone: 'neutral', variant: 'soft' } as const;
}

function typeLabel(type: string): string {
  const labels: Record<string, string> = {
    kitchen_ticket: 'Ticket cuisine',
    customer_receipt: 'Ticket client',
    test: 'Test',
  };

  return labels[type] ?? type;
}

function sourceLabel(source: string): string {
  const labels: Record<string, string> = {
    pos: 'POS',
    kitchen: 'Cuisine',
    delivery: 'Livraison',
    manual: 'Manuel',
  };

  return labels[source] ?? source;
}

function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}
