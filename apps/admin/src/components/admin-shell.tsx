'use client';

import {
  Avatar,
  Badge,
  Button,
  Card,
  IconTile,
  Panel,
  Separator,
  cn,
} from '@yuta/ui';
import {
  ArrowRight,
  CalendarCheck,
  CheckSquare,
  ChevronDown,
  ImageIcon,
  Mail,
  Plus,
  Star,
} from 'lucide-react';

// ─── Dashboard data ──────────────────────────────────────────────────────────

const metrics = [
  {
    label: "Réservations aujourd'hui",
    value: '18',
    delta: 'À venir',
    iconTone: 'success' as const,
    icon: CalendarCheck,
    linkText: 'Voir le planning',
  },
  {
    label: 'Tâches à faire',
    value: '7',
    delta: 'À compléter',
    iconTone: 'warning' as const,
    icon: CheckSquare,
    linkText: 'Voir les tâches',
  },
  {
    label: 'Avis à répondre',
    value: '5',
    delta: 'Nouveaux',
    iconTone: 'warning' as const,
    icon: Star,
    linkText: 'Voir les avis',
  },
  {
    label: 'Emails non lus',
    value: '6',
    delta: 'À traiter',
    iconTone: 'info' as const,
    icon: Mail,
    linkText: 'Voir les emails',
  },
  {
    label: 'Contenus à valider',
    value: '3',
    delta: 'En attente',
    iconTone: 'brand' as const,
    icon: ImageIcon,
    linkText: 'Voir les contenus',
  },
];

const reservationsToday = [
  { time: '12:00', guests: '2 pers.', table: 'Table 3',  status: 'Confirmée',  badge: 'success' as const },
  { time: '12:30', guests: '4 pers.', table: 'Table 6',  status: 'Confirmée',  badge: 'success' as const },
  { time: '13:00', guests: '6 pers.', table: 'Table 8',  status: 'En attente', badge: 'warning' as const },
  { time: '19:00', guests: '2 pers.', table: 'Table 2',  status: 'Confirmée',  badge: 'success' as const },
  { time: '19:30', guests: '4 pers.', table: 'Table 5',  status: 'Confirmée',  badge: 'success' as const },
  { time: '20:00', guests: '6 pers.', table: 'Table 7',  status: 'En attente', badge: 'warning' as const },
  { time: '21:00', guests: '2 pers.', table: 'Table 9',  status: 'Confirmée',  badge: 'success' as const },
  { time: '21:30', guests: '4 pers.', table: 'Table 1',  status: 'Confirmée',  badge: 'success' as const },
];

const tasksToday = [
  { title: 'Vérifier le stock des ingrédients clés',    priority: 'Haute',   time: '09:00', badge: 'destructive' as const },
  { title: 'Passer commande fournisseurs',               priority: 'Haute',   time: '10:00', badge: 'destructive' as const },
  { title: 'Entretien hebdomadaire (cuisine & salle)',   priority: 'Moyenne', time: '11:30', badge: 'warning'     as const },
  { title: 'Nettoyage hotte aspirante',                  priority: 'Moyenne', time: '13:00', badge: 'warning'     as const },
  { title: 'Vérifier DLC produits frais',                priority: 'Moyenne', time: '14:00', badge: 'warning'     as const },
  { title: 'Rapport de caisse du jour',                  priority: 'Basse',   time: '22:30', badge: 'info'        as const },
  { title: 'Planifier le personnel demain',              priority: 'Basse',   time: '22:30', badge: 'info'        as const },
];

const reviewsToAnswer = [
  { source: 'G',  name: 'Marie L.',   stars: 5, text: 'Très bon accueil et plats délicieux !...',    time: 'Il y a 2h' },
  { source: 'G',  name: 'Thomas B.',  stars: 4, text: 'Attente un peu longue mais cuisine...',       time: 'Il y a 5h' },
  { source: 'f',  name: 'Sophie D.',  stars: 5, text: 'Meilleur restaurant vietnamien du...',        time: 'Il y a 1j' },
  { source: 'T',  name: 'Julien M.',  stars: 4, text: 'Bon rapport qualité/prix, je...',             time: 'Il y a 1j' },
  { source: 'G',  name: 'Camille R.', stars: 2, text: 'Les plats sont bons mais le service...',     time: 'Il y a 2j' },
];

const unreadEmails = [
  { sender: 'contact@fastviet.fr',         subject: 'Demande de devis traiteur',           time: '09:45' },
  { sender: 'reservation@futuroscope.com', subject: 'Groupe de 20 personnes — 28/06',      time: '09:12' },
  { sender: 'partenariat@local-event.fr',  subject: 'Proposition partenariat événement',   time: 'Hier'  },
];

const contentsToApprove = [
  { channel: 'Facebook',   title: "Nouvelle carte d'été",  bg: 'bg-status-success-soft',  time: '10:20' },
  { channel: 'Instagram',  title: 'Atelier Petit Chef ✨', bg: 'bg-status-warning-soft', time: 'Hier'  },
  { channel: 'Facebook',   title: 'Bánh mì du jour',       bg: 'bg-surface-selected',  time: '20/06' },
];

const dailyPlan = [
  { time: '09:00', title: 'Ouverture & préparation équipe' },
  { time: '12:00', title: 'Service du midi' },
  { time: '14:30', title: 'Pause équipe' },
  { time: '18:30', title: 'Service du soir' },
  { time: '22:30', title: 'Fermeture & clôture caisse' },
];

export function AdminShell() {
  return (
    <div className="flex w-full flex-col gap-6">
      {/* Greeting */}
      <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold text-primary/50">Samedi 21 juin 2025</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">Bonjour, YuTa. 👋</h1>
          <p className="mt-1.5 max-w-2xl text-sm text-primary/60">
            Voici votre plan d&apos;action pour aujourd&apos;hui.
          </p>
        </div>
        <Button variant="success" size="sm" className="self-start lg:self-end">
          <Plus className="h-4 w-4" />
          Ajouter
          <ChevronDown className="h-4 w-4" />
        </Button>
      </section>

      {/* ── Summary cards ────────────────────────── */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {metrics.map((m) => (
          <SummaryCard key={m.label} metric={m} />
        ))}
      </section>

      {/* ── Row 1 : Réservations · Tâches · Avis ─── */}
      <section className="grid items-stretch gap-5 xl:grid-cols-3">
        <Panel
          title="Réservations du jour"
          action={<PanelLink>Voir le planning</PanelLink>}
        >
          <div className="flex flex-1 flex-col divide-y divide-border-default">
            {reservationsToday.map((r) => (
              <div key={r.time + r.table} className="flex items-center gap-3 px-5 py-2.5">
                <span className="w-12 shrink-0 text-sm font-semibold tabular-nums text-primary">
                  {r.time}
                </span>
                <span className="w-14 shrink-0 text-sm text-primary/55">{r.guests}</span>
                <span className="flex-1 text-sm text-primary">{r.table}</span>
                <ReservationStatusBadge status={r.status} />
              </div>
            ))}
          </div>
          <PanelFooterLink>Voir toutes les réservations</PanelFooterLink>
        </Panel>

        <Panel
          title="Tâches à faire aujourd'hui"
          action={<PanelLink>Voir toutes</PanelLink>}
        >
          <div className="divide-y divide-border-default">
            {tasksToday.map((t) => (
              <div key={t.title} className="flex items-center gap-3 px-5 py-2.5">
                <span className="grid h-4 w-4 shrink-0 rounded border border-border-default bg-white" />
                <span className="flex-1 min-w-0 truncate text-sm text-primary">{t.title}</span>
                <TaskPriorityBadge priority={t.priority} />
                <span className="w-12 shrink-0 text-right text-xs tabular-nums text-primary/40">
                  {t.time}
                </span>
              </div>
            ))}
          </div>
          <PanelFooterLink>Voir toutes les tâches</PanelFooterLink>
        </Panel>

        <Panel
          title="Avis à répondre"
          action={<PanelLink>Voir tous les avis</PanelLink>}
        >
          <div className="flex flex-1 flex-col divide-y divide-border-default">
            {reviewsToAnswer.map((r) => (
              <div
                key={r.name}
                className="grid flex-1 grid-cols-[auto_minmax(0,1fr)_64px_auto] items-center gap-3 px-5 py-2.5"
              >
                <ReviewAvatar source={r.source} />
                <div className="min-w-0 flex-1">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="shrink-0 text-sm font-semibold text-primary">{r.name}</span>
                    <StarRating value={r.stars} className="shrink-0" />
                  </div>
                  <p className="mt-0.5 truncate text-xs text-primary/50">&ldquo;{r.text}&rdquo;</p>
                </div>
                <span className="text-right text-xs tabular-nums text-primary/40">{r.time}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-9 shrink-0 bg-status-success-soft px-3 text-status-success hover:bg-status-success-soft/80"
                >
                  Répondre
                </Button>
              </div>
            ))}
          </div>
          <PanelFooterLink>Voir tous les avis</PanelFooterLink>
        </Panel>
      </section>

      {/* ── Row 2 : Emails · Contenus · Plan ────── */}
      <section className="grid items-stretch gap-5 xl:grid-cols-3">
        <Panel
          title="Emails non lus"
          action={<PanelLink>Voir tous les emails</PanelLink>}
        >
          <div className="divide-y divide-border-default">
            {unreadEmails.map((e) => (
              <div key={e.sender} className="flex items-start gap-3 px-5 py-3">
                <IconTile tone="info" size="sm" className="mt-0.5 shrink-0">
                  <Mail className="h-3.5 w-3.5" />
                </IconTile>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-primary">{e.sender}</p>
                  <p className="truncate text-xs text-primary/50">{e.subject}</p>
                </div>
                <span className="shrink-0 text-xs tabular-nums text-primary/40">{e.time}</span>
              </div>
            ))}
          </div>
          <PanelFooterLink>Voir tous les emails</PanelFooterLink>
        </Panel>

        <Panel
          title="Contenus à valider (Réseaux sociaux)"
          action={<PanelLink>Voir tous</PanelLink>}
        >
          <div className="flex flex-1 flex-col divide-y divide-border-default">
            {contentsToApprove.map((c) => (
              <div
                key={c.title}
                className="grid flex-1 grid-cols-[auto_minmax(0,1fr)_96px_48px] items-center gap-3 px-5 py-3"
              >
                <div className={cn('relative h-10 w-10 shrink-0 overflow-visible rounded-lg', c.bg)}>
                  <PlatformBadge channel={c.channel} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-primary">{c.title}</p>
                  <p className="text-xs text-primary/50">{c.channel}</p>
                </div>
                <div className="flex justify-end">
                  <Badge tone="warning" variant="soft" size="sm">En attente</Badge>
                </div>
                <span className="text-right text-xs tabular-nums text-primary/40">{c.time}</span>
              </div>
            ))}
          </div>
          <PanelFooterLink>Voir tous les contenus</PanelFooterLink>
        </Panel>

        <Panel
          title="Plan du jour"
          action={<PanelLink>Modifier</PanelLink>}
        >
          <div className="divide-y divide-border-default">
            {dailyPlan.map((item) => (
              <div key={item.time} className="flex items-center gap-4 px-5 py-3">
                <span className="w-12 shrink-0 text-sm font-semibold tabular-nums text-primary">
                  {item.time}
                </span>
                <span className="flex-1 text-sm text-primary">{item.title}</span>
              </div>
            ))}
          </div>
          <PanelFooterLink>Voir tout le planning</PanelFooterLink>
        </Panel>
      </section>
    </div>
  );
}

// ─── Dashboard helpers ────────────────────────────────────────────────────────

/** Top summary card: icon + number + subtitle + "Voir…" link */
function SummaryCard({ metric }: { metric: (typeof metrics)[number] }) {
  const Icon = metric.icon;
  return (
    <Card padding="none" className="flex flex-col">
      <div className="flex flex-col gap-3 p-5">
        <div className="flex items-center gap-2.5">
          <IconTile tone={metric.iconTone} size="sm">
            <Icon className="h-4 w-4" />
          </IconTile>
          <p className="text-sm font-medium leading-snug text-primary/70">{metric.label}</p>
        </div>
        <div>
          <p className="text-3xl font-bold tracking-tight text-primary">{metric.value}</p>
          <p className="mt-0.5 text-xs text-primary/50">{metric.delta}</p>
        </div>
      </div>
      <Separator />
      <div className="px-5 py-3">
        <Button variant="ghost" size="sm" className="h-auto p-0 text-status-success hover:bg-transparent hover:text-status-success/80">
          {metric.linkText}
          <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </Card>
  );
}

/** Inline star rating */
function StarRating({
  value,
  max = 5,
  className,
}: {
  value: number;
  max?: number;
  className?: string;
}) {
  return (
    <div className={cn('flex items-center gap-0.5', className)}>
      {Array.from({ length: max }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            'h-3 w-3',
            i < value
              ? 'fill-status-rating text-status-rating'
              : 'fill-transparent text-border-default',
          )}
        />
      ))}
    </div>
  );
}

/** Circular review source avatar (G / f / T) */
function ReviewAvatar({ source }: { source: string }) {
  const palette: Record<string, string> = {
    G: 'bg-status-danger-soft text-status-danger',
    f: 'bg-status-info-soft text-status-info',
    T: 'bg-status-success-soft text-status-success',
  };
  const cls = palette[source] ?? 'bg-surface-muted text-primary';
  return (
    <Avatar fallback={source} size="sm" className={cls} />
  );
}

/** Content thumbnail platform badge overlay */
function PlatformBadge({ channel }: { channel: string }) {
  const isFb = channel === 'Facebook';
  return (
    <div
      className={cn(
        'absolute bottom-0 right-0 grid h-5 w-5 place-items-center rounded-full text-[9px] font-black text-white',
        isFb ? 'bg-status-info' : 'bg-action-danger',
      )}
    >
      {isFb ? 'f' : 'ig'}
    </div>
  );
}

/** Header action link */
function PanelLink({ children }: { children: React.ReactNode }) {
  return (
    <Button variant="ghost" size="sm" className="h-auto p-0 text-primary/50 hover:bg-transparent hover:text-primary">
      {children}
    </Button>
  );
}

/** Centered footer “Voir tout…” link inside a panel */
function PanelFooterLink({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-auto border-t border-border-default py-3 text-center">
      <Button variant="ghost" size="sm" className="h-auto p-0 text-primary/50 hover:bg-transparent hover:text-primary">
        {children}
      </Button>
    </div>
  );
}

/** Soft-color badge for task priority — uses core Badge */
function TaskPriorityBadge({ priority }: { priority: string }) {
  const tone: Record<string, 'danger' | 'warning' | 'info'> = {
    Haute: 'danger',
    Moyenne: 'warning',
    Basse: 'info',
  };
  return (
    <Badge tone={tone[priority] ?? 'neutral'} variant="soft" size="sm">
      {priority}
    </Badge>
  );
}

/** Soft reservation status badge — uses core Badge */
function ReservationStatusBadge({ status }: { status: string }) {
  const tone = status.startsWith('Confirm') ? 'success' : 'warning';
  return (
    <Badge tone={tone} variant="soft" size="sm">
      {status}
    </Badge>
  );
}
