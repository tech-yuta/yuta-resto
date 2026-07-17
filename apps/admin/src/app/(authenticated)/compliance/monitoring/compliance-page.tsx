'use client';

import { Avatar, Badge, Button, Card, IconButton, cn } from '@yuta/ui';
import {
  AlertCircle,
  Bell,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Download,
  ExternalLink,
  FileCheck2,
  FileText,
  GraduationCap,
  History,
  ListChecks,
  Pencil,
  Plus,
  ShieldCheck,
  Thermometer,
  X,
} from 'lucide-react';
import { useState, type ComponentType } from 'react';

type PriorityAction = {
  id: string;
  title: string;
  description: string;
  category: string;
  categoryTone: 'brand' | 'info' | 'success' | 'warning';
  due: string;
  dueTone: 'danger' | 'warning' | 'neutral';
  responsible: string;
  initials: string;
  icon: ComponentType<{ className?: string }>;
  iconTone: string;
};

const priorityActions: PriorityAction[] = [
  {
    id: 'ACT-001',
    title: 'Information sur les allergènes',
    description: '2 fiches allergènes incomplètes',
    category: 'Information client',
    categoryTone: 'brand',
    due: '18 juil. 2026',
    dueTone: 'danger',
    responsible: 'Tam P.',
    initials: 'TP',
    icon: AlertCircle,
    iconTone: 'bg-status-danger-soft text-status-danger',
  },
  {
    id: 'ACT-002',
    title: 'Vérification extincteurs',
    description: 'Vérification annuelle obligatoire',
    category: 'Sécurité ERP',
    categoryTone: 'info',
    due: '2 août 2026',
    dueTone: 'danger',
    responsible: 'Sophie L.',
    initials: 'SL',
    icon: CalendarDays,
    iconTone: 'bg-status-warning-soft text-status-warning',
  },
  {
    id: 'ACT-003',
    title: 'Relevés de température',
    description: '3 relevés de température manquants',
    category: 'Hygiène alimentaire',
    categoryTone: 'success',
    due: "Aujourd'hui",
    dueTone: 'warning',
    responsible: 'Yen N.',
    initials: 'YN',
    icon: Thermometer,
    iconTone: 'bg-status-warning-soft text-status-warning',
  },
  {
    id: 'ACT-004',
    title: 'Mise à jour DUERP',
    description: 'Document à réviser',
    category: 'Personnel & travail',
    categoryTone: 'warning',
    due: '30 août 2026',
    dueTone: 'neutral',
    responsible: 'Tam P.',
    initials: 'TP',
    icon: FileText,
    iconTone: 'bg-surface-muted text-secondary',
  },
  {
    id: 'ACT-005',
    title: 'Formation hygiène alimentaire',
    description: '1 employé sans attestation valide',
    category: 'Hygiène alimentaire',
    categoryTone: 'success',
    due: '14 sept. 2026',
    dueTone: 'neutral',
    responsible: 'Lucas M.',
    initials: 'LM',
    icon: GraduationCap,
    iconTone: 'bg-surface-muted text-secondary',
  },
];

const domains = [
  {
    label: 'Hygiène alimentaire',
    score: 88,
    obligations: 24,
    actions: 3,
    tone: 'success' as const,
  },
  {
    label: 'Personnel & travail',
    score: 94,
    obligations: 16,
    actions: 1,
    tone: 'success' as const,
  },
  {
    label: 'Sécurité & ERP',
    score: 82,
    obligations: 18,
    actions: 3,
    tone: 'warning' as const,
  },
  {
    label: 'Information des clients',
    score: 96,
    obligations: 10,
    actions: 0,
    tone: 'success' as const,
  },
  {
    label: 'Données & numérique',
    score: 76,
    obligations: 8,
    actions: 2,
    tone: 'danger' as const,
  },
  {
    label: 'Environnement & déchets',
    score: 90,
    obligations: 10,
    actions: 1,
    tone: 'success' as const,
  },
];

const metrics: Array<{
  label: string;
  value: string;
  helper: string;
  icon: ComponentType<{ className?: string }>;
  tone: string;
  helperTone: string;
}> = [
  {
    label: 'Actions requises',
    value: '7',
    helper: 'Dont 2 urgentes',
    icon: AlertCircle,
    tone: 'bg-status-danger-soft text-status-danger',
    helperTone: 'text-status-danger',
  },
  {
    label: 'Échéances < 30 jours',
    value: '3',
    helper: 'Prochaine : 18 juil. 2026',
    icon: CalendarDays,
    tone: 'bg-status-warning-soft text-status-warning',
    helperTone: 'text-status-warning',
  },
  {
    label: 'Obligations suivies',
    value: '86',
    helper: 'Toutes catégories',
    icon: CheckCircle2,
    tone: 'bg-status-success-soft text-status-success',
    helperTone: 'text-status-success',
  },
  {
    label: 'Dossier complété',
    value: '92 %',
    helper: 'En progression',
    icon: FileCheck2,
    tone: 'bg-status-info-soft text-status-info',
    helperTone: 'text-status-info',
  },
  {
    label: 'Nouveautés à analyser',
    value: '2',
    helper: 'Voir la veille',
    icon: Bell,
    tone: 'bg-surface-selected text-brand-800',
    helperTone: 'text-brand-800',
  },
];

const tabs = [
  'Vue d’ensemble',
  'Obligations',
  'Veille réglementaire',
  'Contrôles & preuves',
  'Calendrier',
] as const;

export function CompliancePage() {
  const [activeTab, setActiveTab] =
    useState<(typeof tabs)[number]>('Vue d’ensemble');
  const [selectedId, setSelectedId] = useState('ACT-001');
  const selectedAction =
    priorityActions.find((action) => action.id === selectedId) ??
    priorityActions[0];

  return (
    <div className="flex w-full flex-col gap-5">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight">
            Veille &amp; conformité
          </h1>
          <p className="mt-1 text-sm text-secondary">
            Anticipez les obligations, suivez vos actions et préparez vos
            contrôles.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" size="lg">
            <Download className="h-4 w-4" />
            Exporter le dossier
          </Button>
          <Button variant="secondary" size="lg">
            <ShieldCheck className="h-4 w-4" />
            Préparer un contrôle
          </Button>
          <Button size="lg">
            <Plus className="h-5 w-5" />
            Ajouter une obligation
          </Button>
        </div>
      </header>
      <Card
        padding="none"
        className="grid grid-cols-2 overflow-hidden md:grid-cols-3 xl:grid-cols-5"
      >
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <div
              key={metric.label}
              className={cn(
                'flex min-w-0 items-center gap-4 border-b border-r border-border-default p-5 xl:border-b-0',
                metric.label === 'Nouveautés à analyser' &&
                  'col-span-2 md:col-span-1',
              )}
            >
              <div
                className={cn(
                  'grid h-12 w-12 shrink-0 place-items-center rounded-full',
                  metric.tone,
                )}
              >
                <Icon className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-secondary">
                  {metric.label}
                </p>
                <p className="text-2xl font-black">{metric.value}</p>
                <p
                  className={cn(
                    'mt-2 truncate text-xs font-semibold',
                    metric.helperTone,
                  )}
                >
                  {metric.helper}
                </p>
              </div>
            </div>
          );
        })}
      </Card>
      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
        <Card padding="none" className="overflow-hidden">
          <nav
            className="flex overflow-x-auto border-b border-border-default px-3"
            aria-label="Sections conformité"
          >
            {tabs.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={cn(
                  'relative min-w-max px-5 py-4 text-sm font-semibold text-secondary',
                  activeTab === tab && 'text-brand-800',
                )}
              >
                {tab}
                {activeTab === tab && (
                  <span className="absolute inset-x-2 bottom-0 h-0.5 bg-action-primary" />
                )}
              </button>
            ))}
          </nav>
          {activeTab === 'Vue d’ensemble' ? (
            <Overview selectedId={selectedId} onSelect={setSelectedId} />
          ) : (
            <AlternateComplianceView title={activeTab} />
          )}
        </Card>
        <ComplianceDetails action={selectedAction} />
      </div>
    </div>
  );
}

function Overview({
  selectedId,
  onSelect,
}: {
  selectedId: string;
  onSelect(id: string): void;
}) {
  return (
    <div className="space-y-5 p-4">
      <section className="overflow-hidden rounded-lg border border-border-default">
        <div className="flex items-center justify-between border-b border-border-default px-4 py-3">
          <h2 className="font-bold">Priorités à traiter</h2>
          <Button variant="secondary" size="sm">
            Voir toutes les actions
          </Button>
        </div>
        <div className="divide-y divide-border-default">
          {priorityActions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.id}
                type="button"
                onClick={() => onSelect(action.id)}
                className={cn(
                  'grid w-full items-center gap-3 p-4 text-left hover:bg-surface-muted md:grid-cols-[auto_minmax(0,1fr)_110px_120px_auto]',
                  selectedId === action.id && 'bg-surface-selected',
                )}
              >
                <span
                  className={cn(
                    'grid h-10 w-10 place-items-center rounded-full',
                    action.iconTone,
                  )}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-bold">{action.description}</p>
                    <Badge tone={action.categoryTone} size="sm">
                      {action.category}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted">{action.title}</p>
                </div>
                <div>
                  <p className="text-xs text-muted">Échéance</p>
                  <p
                    className={cn(
                      'mt-1 text-sm font-semibold',
                      action.dueTone === 'danger'
                        ? 'text-status-danger'
                        : action.dueTone === 'warning'
                          ? 'text-status-warning'
                          : 'text-primary',
                    )}
                  >
                    {action.due}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted">Responsable</p>
                  <div className="mt-1 flex items-center gap-2">
                    <Avatar
                      fallback={action.initials}
                      size="sm"
                      className="h-6 w-6 text-[9px]"
                    />
                    <span className="text-sm">{action.responsible}</span>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted" />
              </button>
            );
          })}
        </div>
      </section>
      <section className="rounded-lg border border-border-default">
        <div className="flex items-center justify-between border-b border-border-default px-4 py-3">
          <h2 className="font-bold">Conformité par domaine</h2>
          <Button variant="secondary" size="sm">
            Voir tous les domaines
          </Button>
        </div>
        <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
          {domains.map((domain) => (
            <DomainCard key={domain.label} domain={domain} />
          ))}
        </div>
      </section>
    </div>
  );
}

function DomainCard({ domain }: { domain: (typeof domains)[number] }) {
  const border =
    domain.tone === 'success'
      ? 'border-status-success'
      : domain.tone === 'warning'
        ? 'border-status-warning'
        : 'border-status-danger';
  return (
    <div className="rounded-lg border border-border-default p-3 text-center">
      <p className="min-h-10 text-xs font-semibold leading-5">{domain.label}</p>
      <div
        className={cn(
          'mx-auto mt-2 grid h-20 w-20 place-items-center rounded-full border-[5px] bg-surface text-lg font-black',
          border,
        )}
      >
        {domain.score} %
      </div>
      <p className="mt-2 text-xs text-muted">
        {domain.obligations} obligations
      </p>
      <p
        className={cn(
          'mt-1 text-xs font-semibold',
          domain.actions === 0 ? 'text-status-success' : 'text-status-danger',
        )}
      >
        {domain.actions} action{domain.actions > 1 ? 's' : ''}
      </p>
    </div>
  );
}

function ComplianceDetails({ action }: { action: PriorityAction }) {
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
          <Button variant="secondary" size="sm">
            <Pencil className="h-4 w-4" />
            Corriger les produits
          </Button>
          <Button variant="secondary" size="sm">
            <FileText className="h-4 w-4" />
            Ajouter une preuve
          </Button>
          <Button variant="secondary" size="sm">
            <ListChecks className="h-4 w-4" />
            Créer une tâche
          </Button>
          <Button size="sm">
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
function AlternateComplianceView({ title }: { title: string }) {
  return (
    <div className="grid min-h-[520px] place-items-center p-8 text-center">
      <div>
        <ClipboardCheck className="mx-auto h-10 w-10 text-muted" />
        <h2 className="mt-4 text-xl font-bold">{title}</h2>
        <p className="mt-1 text-sm text-muted">
          Cette vue est prête à recevoir les données de conformité.
        </p>
      </div>
    </div>
  );
}
