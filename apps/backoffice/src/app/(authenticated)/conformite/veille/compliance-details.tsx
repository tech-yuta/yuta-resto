import { Avatar, Badge, Button, Card, IconButton } from '@yuta/ui';
import {
  CheckCircle2,
  ChevronRight,
  Download,
  ExternalLink,
  FileText,
  History,
  ListChecks,
  Pencil,
  X,
} from 'lucide-react';
import type { PriorityAction } from './compliance-model';

export function ComplianceDetails({ action }: { action: PriorityAction }) {
  return (
    <Card padding="none" className="overflow-hidden xl:sticky xl:top-0">
      <div className="flex items-center justify-between p-4">
        <div className="flex flex-wrap gap-2">
          <Badge tone="brand">Action requise</Badge>
          <Badge tone="danger">Priorité élevée</Badge>
        </div>
        <IconButton size="sm" aria-label="Fermer les détails">
          <X className="h-5 w-5" />
        </IconButton>
      </div>
      <div className="border-b border-border-default px-4 pb-4">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-xl font-black">{action.title}</h2>
          <Badge tone={action.categoryTone}>{action.category}</Badge>
        </div>
        <p className="mt-3 text-sm leading-6 text-secondary">
          Les clients doivent pouvoir accéder aux informations relatives aux
          allergènes avant l&apos;achat ou la consommation.
        </p>
      </div>
      <section className="border-b border-border-default p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-bold">État détecté par YuTa</h3>
          <span className="text-xs text-muted">Mis à jour le 10/07/2026</span>
        </div>
        <div className="grid gap-4 sm:grid-cols-[130px_1fr]">
          <div className="text-center">
            <div className="mx-auto grid h-28 w-28 place-items-center rounded-full border-[6px] border-status-success">
              <div>
                <p className="text-xl font-black">12 / 14</p>
                <p className="text-[11px] text-muted">produits complets</p>
              </div>
            </div>
          </div>
          <div className="rounded-lg border border-border-default p-3">
            <Badge tone="danger">À compléter</Badge>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-xs">
              <li>Gua Bao Dragon – soja non renseigné</li>
              <li>Dessert mangue – lait non confirmé</li>
            </ul>
            <Button
              variant="ghost"
              size="sm"
              disabled
              className="mt-2 px-0 text-brand-800"
            >
              Voir la liste complète
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>
      <section className="border-b border-border-default p-4">
        <h3 className="mb-3 font-bold">Preuves &amp; documents</h3>
        <div className="space-y-2">
          <DocumentRow
            label="Registre des allergènes"
            meta="Version 3 – 10/07/2026"
            download
          />
          <DocumentRow
            label="Carte client (QR & affichage)"
            meta="Version 3 – 08/07/2026"
            download
          />
          <DocumentRow label="Fiches techniques" meta="12 / 14 complètes" />
        </div>
      </section>
      <section className="border-b border-border-default p-4">
        <h3 className="font-bold">Source officielle</h3>
        <Button
          variant="ghost"
          size="sm"
          disabled
          className="mt-2 h-auto px-0 text-brand-800"
        >
          Entreprendre.Service-Public.fr
          <ExternalLink className="h-4 w-4" />
        </Button>
        <p className="mt-1 text-xs text-muted">Article vérifié le 23/06/2026</p>
        <p className="mt-3 text-sm leading-6 text-secondary">
          Obligation d&apos;information sur les allergènes dans les denrées
          alimentaires non préemballées.
        </p>
      </section>
      <section className="border-b border-border-default p-4">
        <h3 className="mb-3 font-bold">Actions</h3>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="secondary" size="sm" disabled>
            <Pencil className="h-4 w-4" />
            Corriger les produits
          </Button>
          <Button variant="secondary" size="sm" disabled>
            <FileText className="h-4 w-4" />
            Ajouter une preuve
          </Button>
          <Button variant="secondary" size="sm" disabled>
            <ListChecks className="h-4 w-4" />
            Créer une tâche
          </Button>
          <Button size="sm" disabled>
            <CheckCircle2 className="h-4 w-4" />
            Marquer vérifié
          </Button>
        </div>
      </section>
      <div className="grid grid-cols-2 divide-x divide-border-default p-4">
        <div className="flex items-center gap-3">
          <Avatar fallback={action.initials} size="sm" />
          <div>
            <p className="text-xs text-muted">Responsable</p>
            <p className="text-sm font-semibold">{action.responsible}</p>
          </div>
        </div>
        <div className="pl-4">
          <p className="inline-flex items-center gap-2 text-xs font-semibold">
            <History className="h-4 w-4" />
            Historique
          </p>
          <Button
            variant="ghost"
            size="sm"
            disabled
            className="mt-1 h-auto px-0 text-brand-800"
          >
            Voir l&apos;historique
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}

function DocumentRow({
  label,
  meta,
  download,
}: {
  label: string;
  meta: string;
  download?: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-surface-selected text-brand-800">
        <FileText className="h-4 w-4" />
      </span>
      <span className="flex-1 text-sm font-medium">{label}</span>
      <span className="text-xs text-muted">{meta}</span>
      {download ? (
        <Download className="h-4 w-4 text-muted" />
      ) : (
        <ChevronRight className="h-4 w-4 text-muted" />
      )}
    </div>
  );
}
