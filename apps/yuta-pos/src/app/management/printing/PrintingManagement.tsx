'use client';

import type { LocalPrintJob, PrintJobCommand } from '@yuta/contracts/local-pos';
import {
  Alert,
  AlertDescription,
  Badge,
  Button,
  Card,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  EmptyState,
  FormField,
  Input,
  Separator,
  StatCard,
} from '@yuta/ui';
import {
  CheckCircle2,
  CirclePlay,
  Printer,
  RefreshCw,
  TriangleAlert,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { useActionState, useEffect, useState } from 'react';
import {
  failPrintJobAction,
  runPrintJobCommandAction,
  type PrintingActionState,
} from './actions';

const initialState: PrintingActionState = { error: null, success: null };

export function PrintingManagement({ jobs }: { jobs: LocalPrintJob[] }) {
  const counters = {
    pending: jobs.filter((job) => job.status === 'pending').length,
    printing: jobs.filter((job) => job.status === 'printing').length,
    printed: jobs.filter((job) => job.status === 'printed').length,
    failed: jobs.filter((job) => job.status === 'failed').length,
  };

  return (
    <div className="grid gap-5">
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="En attente" value={String(counters.pending)} />
        <StatCard label="En impression" value={String(counters.printing)} />
        <StatCard label="Imprimés" value={String(counters.printed)} />
        <StatCard label="Échecs" value={String(counters.failed)} />
      </section>

      <Card padding="none" className="overflow-hidden">
        <div className="px-5 py-4">
          <h2 className="text-lg font-black">Tickets récents</h2>
          <p className="mt-1 text-sm text-secondary">
            {jobs.length} ticket{jobs.length === 1 ? '' : 's'} chargé
            {jobs.length === 1 ? '' : 's'}
          </p>
        </div>
        <Separator />
        {jobs.length === 0 ? (
          <EmptyState
            icon={<Printer className="h-8 w-8" />}
            title="Aucun ticket d’impression"
            description="Les tickets cuisine apparaissent après l’envoi d’une commande. Les reçus apparaissent après paiement."
          />
        ) : (
          <div>
            {jobs.map((job, index) => (
              <div key={job.id}>
                <PrintJobRow job={job} />
                {index < jobs.length - 1 && <Separator />}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function PrintJobRow({ job }: { job: LocalPrintJob }) {
  return (
    <div className="grid gap-4 px-5 py-4 xl:grid-cols-[1.2fr_0.9fr_0.9fr_auto] xl:items-center">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-black">{jobTitle(job)}</p>
          <Badge tone={statusTone(job.status)}>{statusLabel(job.status)}</Badge>
        </div>
        <p className="mt-1 text-sm text-secondary">
          {typeLabel(job.type)} · {job.summary.itemCount} article
          {job.summary.itemCount === 1 ? '' : 's'}
        </p>
        {job.errorMessage && (
          <p className="mt-2 text-sm font-semibold text-status-danger">
            {job.errorMessage}
          </p>
        )}
      </div>

      <div className="text-sm">
        <p className="font-semibold">{job.printerName}</p>
        <p className="text-secondary">{sourceLabel(job.source)}</p>
      </div>

      <div className="text-sm">
        <p className="font-semibold">{formatDateTime(job.createdAt)}</p>
        {job.orderId ? (
          <Link
            href={`/orders/${job.orderId}`}
            className="text-secondary underline-offset-4 hover:underline"
          >
            Ouvrir la commande
          </Link>
        ) : (
          <p className="text-muted">Sans commande liée</p>
        )}
      </div>

      <JobActions job={job} />
    </div>
  );
}

function JobActions({ job }: { job: LocalPrintJob }) {
  if (job.status === 'printed') {
    return (
      <div className="flex items-center gap-2 text-sm font-semibold text-status-success">
        <CheckCircle2 className="h-4 w-4" />
        Terminé
      </div>
    );
  }

  if (job.status === 'failed') {
    return (
      <CommandButton
        jobId={job.id}
        command={{ action: 'retry' }}
        label="Réessayer"
        icon={<RefreshCw className="h-4 w-4" />}
        variant="secondary"
      />
    );
  }

  return (
    <div className="flex flex-wrap justify-start gap-2 xl:justify-end">
      {job.status === 'pending' ? (
        <CommandButton
          jobId={job.id}
          command={{ action: 'mark_printing' }}
          label="Démarrer"
          icon={<CirclePlay className="h-4 w-4" />}
          variant="primary"
        />
      ) : (
        <CommandButton
          jobId={job.id}
          command={{ action: 'mark_printed' }}
          label="Imprimé"
          icon={<CheckCircle2 className="h-4 w-4" />}
          variant="success"
        />
      )}
      <FailDialog job={job} />
    </div>
  );
}

function CommandButton({
  jobId,
  command,
  label,
  icon,
  variant,
}: {
  jobId: string;
  command: PrintJobCommand;
  label: string;
  icon: ReactNode;
  variant: 'primary' | 'secondary' | 'success';
}) {
  const actionFunction = runPrintJobCommandAction.bind(null, jobId, command);
  const [state, action, pending] = useActionState(actionFunction, initialState);

  return (
    <div>
      <form action={action}>
        <Button type="submit" size="sm" variant={variant} loading={pending}>
          {icon}
          {label}
        </Button>
      </form>
      {state.error && (
        <p className="mt-1 max-w-52 text-xs text-status-danger" role="alert">
          {state.error}
        </p>
      )}
    </div>
  );
}

function FailDialog({ job }: { job: LocalPrintJob }) {
  const [open, setOpen] = useState(false);
  const actionFunction = failPrintJobAction.bind(null, job.id);
  const [state, action, pending] = useActionState(actionFunction, initialState);

  useEffect(() => {
    if (state.success) setOpen(false);
  }, [state.success]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" size="sm" variant="danger">
          <XCircle className="h-4 w-4" />
          Échec
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Signaler un échec d’impression</DialogTitle>
          <DialogDescription>
            Le motif restera visible dans la file jusqu’à la prochaine
            tentative.
          </DialogDescription>
        </DialogHeader>
        <form action={action} className="grid gap-4">
          <FormField label="Motif">
            <Input
              name="errorMessage"
              placeholder="Papier absent, imprimante hors ligne…"
              maxLength={2000}
              required
            />
          </FormField>
          {state.error && (
            <Alert tone="danger">
              <TriangleAlert className="h-4 w-4" />
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setOpen(false)}
            >
              Annuler
            </Button>
            <Button type="submit" variant="danger" loading={pending}>
              Enregistrer l’échec
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function jobTitle(job: LocalPrintJob): string {
  return (
    job.summary.tableLabel ??
    job.summary.orderNumber ??
    `Ticket ${job.id.slice(0, 8)}`
  );
}

function statusLabel(status: LocalPrintJob['status']): string {
  if (status === 'pending') return 'En attente';
  if (status === 'printing') return 'En impression';
  if (status === 'printed') return 'Imprimé';
  return 'Échec';
}

function statusTone(
  status: LocalPrintJob['status'],
): 'neutral' | 'info' | 'success' | 'danger' {
  if (status === 'printing') return 'info';
  if (status === 'printed') return 'success';
  if (status === 'failed') return 'danger';
  return 'neutral';
}

function typeLabel(type: LocalPrintJob['type']): string {
  if (type === 'kitchen_ticket') return 'Ticket cuisine';
  if (type === 'customer_receipt') return 'Reçu client';
  return 'Test';
}

function sourceLabel(source: LocalPrintJob['source']): string {
  if (source === 'pos') return 'Créé par le POS';
  if (source === 'kitchen') return 'Créé en cuisine';
  if (source === 'delivery') return 'Créé par la livraison';
  return 'Créé manuellement';
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
}
