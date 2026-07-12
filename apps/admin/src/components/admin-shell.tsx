'use client';

import {
  AppFooter,
  AppMain,
  AppShell,
  AppSidebar,
  AppSidebarFooter,
  AppSidebarHeader,
  AppTopbar,
  Badge,
  Button,
  Card,
  IconTile,
  ListRow,
  Panel,
  Separator,
  cn,
} from '@yuta/ui';
import {
  Archive,
  ArrowLeftRight,
  ArrowRight,
  BarChart3,
  Bell,
  CalendarCheck,
  CalendarDays,
  CheckSquare,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  CreditCard,
  FileText,
  Folder,
  Heart,
  ImageIcon,
  LayoutDashboard,
  LayoutGrid,
  Layers,
  ListChecks,
  Megaphone,
  Mail,
  MessageSquare,
  Package,
  PackageCheck,
  Plus,
  Search,
  Settings,
  Shield,
  ShoppingCart,
  ClipboardCheck,
  Scale,
  Send,
  Star,
  Store,
  Tag,
  Truck,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

type NavItem = {
  label: string;
  icon: React.ElementType;
  href: string;
  note?: string;
  sub?: boolean;
};

type NavSection = {
  title?: string;
  items: NavItem[];
};

const navSections: NavSection[] = [
  {
    items: [{ label: "Aujourd'hui", icon: LayoutDashboard, href: '/' }],
  },
  {
    title: 'Operations',
    items: [
      { label: 'Commandes', icon: ShoppingCart, href: '#' },
      { label: 'Tables & salle', icon: LayoutGrid, href: '#' },
      { label: 'Reservations', icon: CalendarCheck, href: '#' },
      { label: 'Paiements', icon: CreditCard, href: '#' },
      { label: 'Rapports POS', icon: BarChart3, href: '/pos/reports' },
    ],
  },
  {
    title: 'Menu',
    items: [
      { label: 'Menus & options', icon: ListChecks, href: '/pos/menu' },
      { label: 'Combos', icon: Layers, href: '/pos/combos' },
      { label: 'Produits', icon: Package, href: '#' },
      { label: 'Categories', icon: Folder, href: '#' },
    ],
  },
  {
    title: 'Stock',
    items: [
      { label: 'Inventaire', icon: Archive, href: '#' },
      { label: 'Fournisseurs', icon: Truck, href: '#' },
      { label: 'Entrees / sorties', icon: ArrowLeftRight, href: '#' },
    ],
  },
  {
    title: 'Equipe',
    items: [
      { label: 'Employes', icon: Users, href: '/pos/staff' },
      { label: 'Planning', icon: CalendarDays, href: '#' },
      { label: 'Pointage', icon: Clock, href: '#' },
      { label: 'Taches du jour', icon: ClipboardCheck, href: '#' },
      { label: 'Roles & acces', icon: Shield, href: '#' },
    ],
  },
  {
    title: 'Conformite & veille',
    items: [
      { label: 'Veille & Conformite', icon: Scale, href: '#' },
    ],
  },
  {
    title: 'Clients',
    items: [
      { label: 'Clients', icon: Users, href: '#' },
      { label: 'Fidelite', icon: Heart, href: '#' },
      { label: 'Avis & commentaires', icon: MessageSquare, href: '#' },
      { label: 'Emails', icon: Mail, href: '#' },
    ],
  },
  {
    title: 'Marketing & contenu',
    items: [
      { label: 'Reseaux sociaux', icon: Send, href: '#' },
      { label: 'Medias', icon: ImageIcon, href: '#' },
      { label: 'Pages & contenus', icon: FileText, href: '#' },
      { label: 'Promotions', icon: Tag, href: '#' },
      { label: 'Campagnes', icon: Megaphone, href: '#' },
    ],
  },
  {
    title: 'Parametres',
    items: [
      { label: 'Restaurant', icon: Store, href: '#' },
      { label: 'Modules & abonnement', icon: PackageCheck, href: '#' },
      { label: 'POS', icon: Settings, href: '#' },
    ],
  },
];

// ─── Dashboard data ──────────────────────────────────────────────────────────

const metrics = [
  {
    label: "Réservations aujourd'hui",
    value: '18',
    delta: 'À venir',
    iconBg: 'bg-yuta-success/10 text-yuta-success',
    icon: CalendarCheck,
    linkText: 'Voir le planning',
  },
  {
    label: 'Tâches à faire',
    value: '7',
    delta: 'À compléter',
    iconBg: 'bg-yuta-warning/15 text-yuta-warning',
    icon: CheckSquare,
    linkText: 'Voir les tâches',
  },
  {
    label: 'Avis à répondre',
    value: '5',
    delta: 'Nouveaux',
    iconBg: 'bg-amber-50 text-amber-500',
    icon: Star,
    linkText: 'Voir les avis',
  },
  {
    label: 'Emails non lus',
    value: '6',
    delta: 'À traiter',
    iconBg: 'bg-yuta-info text-yuta-ink',
    icon: Mail,
    linkText: 'Voir les emails',
  },
  {
    label: 'Contenus à valider',
    value: '3',
    delta: 'En attente',
    iconBg: 'bg-purple-50 text-purple-500',
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
  { channel: 'Facebook',   title: "Nouvelle carte d'été",  bg: 'bg-green-100',  time: '10:20' },
  { channel: 'Instagram',  title: 'Atelier Petit Chef ✨', bg: 'bg-orange-100', time: 'Hier'  },
  { channel: 'Facebook',   title: 'Bánh mì du jour',       bg: 'bg-amber-100',  time: '20/06' },
];

const dailyPlan = [
  { time: '09:00', title: 'Ouverture & préparation équipe' },
  { time: '12:00', title: 'Service du midi' },
  { time: '14:30', title: 'Pause équipe' },
  { time: '18:30', title: 'Service du soir' },
  { time: '22:30', title: 'Fermeture & clôture caisse' },
];

export function AdminShell() {
  const pathname = usePathname();

  return (
    <AppShell
      sidebar={
        <AppSidebar
          header={
            <AppSidebarHeader>
              <IconTile tone="accent" size="sm">
                <span className="text-sm font-black">Y</span>
              </IconTile>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold">YuTa Admin</p>
                <p className="truncate text-xs font-semibold text-yuta-ink/45">
                  Back office restaurant
                </p>
              </div>
            </AppSidebarHeader>
          }
          footer={
            <AppSidebarFooter>
              <button className="flex h-9 w-full items-center gap-2 rounded-lg px-2 text-sm font-semibold text-yuta-ink/50 hover:bg-yuta-mist hover:text-yuta-ink">
                <ChevronLeft className="h-4 w-4" />
                Reduire le menu
              </button>
            </AppSidebarFooter>
          }
        >
          {navSections.map((section, sectionIndex) => (
            <div key={section.title ?? 'main'} className={sectionIndex > 0 ? 'mt-4' : ''}>
              {section.title && (
                <p className="mb-1.5 px-2 text-[10px] font-bold uppercase tracking-widest text-yuta-ink/40">
                  {section.title}
                </p>
              )}
              <div className="grid gap-0.5">
                {section.items.map((item) => (
                  <NavLink key={item.label} item={item} pathname={pathname} />
                ))}
              </div>
            </div>
          ))}
        </AppSidebar>
      }
    >
      <div className="flex h-screen min-w-0 flex-col overflow-hidden">
        <AppTopbar
          search={
            <label className="flex h-10 min-w-0 max-w-md flex-1 items-center gap-2 rounded-lg border border-yuta-line bg-yuta-paper px-3 shadow-sm">
              <Search className="h-4 w-4 shrink-0 text-yuta-ink/40" />
              <input
                type="text"
                placeholder="Rechercher (ex : commande, produit, employe...)"
                className="min-w-0 flex-1 bg-transparent text-sm text-yuta-ink placeholder:text-yuta-ink/40 focus:outline-none"
              />
              <span className="hidden shrink-0 rounded-md border border-yuta-line bg-white px-1.5 py-0.5 text-[11px] font-semibold text-yuta-ink/40 sm:block">
                &#8984; K
              </span>
            </label>
          }
          actions={
            <>
              <button className="relative grid h-10 w-10 place-items-center rounded-lg text-yuta-ink/60 hover:bg-yuta-mist">
                <Bell className="h-5 w-5" />
                <span className="absolute right-1.5 top-1.5 grid h-4 w-4 place-items-center rounded-full bg-yuta-danger text-[10px] font-black text-white">
                  3
                </span>
              </button>
              <button className="flex items-center gap-1.5 rounded-lg p-1 hover:bg-yuta-mist">
                <div className="grid h-8 w-8 place-items-center rounded-full bg-yuta-ink text-xs font-bold text-white">
                  YT
                </div>
                <ChevronRight className="hidden h-3.5 w-3.5 rotate-90 text-yuta-ink/40 sm:block" />
              </button>
            </>
          }
        />

        <AppMain>
          <div className="flex w-full flex-col gap-6">
            {/* Greeting */}
            <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-sm font-semibold text-yuta-ink/50">Samedi 21 juin 2025</p>
                <h1 className="mt-1 text-2xl font-bold tracking-tight">Bonjour, YuTa. 👋</h1>
                <p className="mt-1.5 max-w-2xl text-sm text-yuta-ink/60">
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
            <section className="grid gap-5 xl:grid-cols-3">
              {/* Réservations du jour */}
              <Panel
                title="Réservations du jour"
                action={<PanelLink>Voir le planning</PanelLink>}
              >
                <div className="divide-y divide-yuta-line">
                  {reservationsToday.map((r) => (
                    <div key={r.time + r.table} className="flex items-center gap-3 px-5 py-2.5">
                      <span className="w-12 shrink-0 text-sm font-semibold tabular-nums text-yuta-ink">
                        {r.time}
                      </span>
                      <span className="w-14 shrink-0 text-sm text-yuta-ink/55">{r.guests}</span>
                      <span className="flex-1 text-sm text-yuta-ink">{r.table}</span>
                      <ReservationStatusBadge status={r.status} />
                    </div>
                  ))}
                </div>
                <PanelFooterLink>Voir toutes les réservations</PanelFooterLink>
              </Panel>

              {/* Tâches à faire */}
              <Panel
                title="Tâches à faire aujourd'hui"
                action={<PanelLink>Voir toutes</PanelLink>}
              >
                <div className="divide-y divide-yuta-line">
                  {tasksToday.map((t) => (
                    <div key={t.title} className="flex items-center gap-3 px-5 py-2.5">
                      <span className="grid h-4 w-4 shrink-0 rounded border border-yuta-line bg-white" />
                      <span className="flex-1 min-w-0 truncate text-sm text-yuta-ink">{t.title}</span>
                      <TaskPriorityBadge priority={t.priority} />
                      <span className="w-12 shrink-0 text-right text-xs tabular-nums text-yuta-ink/40">
                        {t.time}
                      </span>
                    </div>
                  ))}
                </div>
                <PanelFooterLink>Voir toutes les tâches</PanelFooterLink>
              </Panel>

              {/* Avis à répondre */}
              <Panel
                title="Avis à répondre"
                action={<PanelLink>Voir tous les avis</PanelLink>}
              >
                <div className="divide-y divide-yuta-line">
                  {reviewsToAnswer.map((r) => (
                    <div key={r.name} className="flex items-start gap-3 px-5 py-3">
                      <ReviewAvatar source={r.source} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-yuta-ink">{r.name}</span>
                          <StarRating value={r.stars} />
                          <span className="ml-auto shrink-0 text-xs tabular-nums text-yuta-ink/40">{r.time}</span>
                        </div>
                        <p className="mt-0.5 truncate text-xs text-yuta-ink/50">&ldquo;{r.text}&rdquo;</p>
                      </div>
                      <button
                        type="button"
                        style={{ backgroundColor: 'white', color: '#16211d' }}
                        className="mt-0.5 inline-flex shrink-0 cursor-pointer items-center justify-center rounded-lg border border-yuta-line px-3 py-1.5 text-xs font-semibold transition-colors"
                      >
                        Répondre
                      </button>
                    </div>
                  ))}
                </div>
                <PanelFooterLink>Voir tous les avis</PanelFooterLink>
              </Panel>
            </section>

            {/* ── Row 2 : Emails · Contenus · Plan ────── */}
            <section className="grid gap-5 xl:grid-cols-3">
              {/* Emails non lus */}
              <Panel
                title="Emails non lus"
                action={<PanelLink>Voir tous les emails</PanelLink>}
              >
                <div className="divide-y divide-yuta-line">
                  {unreadEmails.map((e) => (
                    <div key={e.sender} className="flex items-start gap-3 px-5 py-3">
                      <IconTile tone="info" size="sm" className="mt-0.5 shrink-0">
                        <Mail className="h-3.5 w-3.5" />
                      </IconTile>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-yuta-ink">{e.sender}</p>
                        <p className="truncate text-xs text-yuta-ink/50">{e.subject}</p>
                      </div>
                      <span className="shrink-0 text-xs tabular-nums text-yuta-ink/40">{e.time}</span>
                    </div>
                  ))}
                </div>
                <PanelFooterLink>Voir tous les emails</PanelFooterLink>
              </Panel>

              {/* Contenus à valider */}
              <Panel
                title="Contenus à valider (Réseaux sociaux)"
                action={<PanelLink>Voir tous</PanelLink>}
              >
                <div className="divide-y divide-yuta-line">
                  {contentsToApprove.map((c) => (
                    <div key={c.title} className="flex items-center gap-3 px-5 py-3">
                      {/* Thumbnail + platform badge */}
                      <div className={cn('relative h-10 w-10 shrink-0 overflow-visible rounded-lg', c.bg)}>
                        <PlatformBadge channel={c.channel} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-yuta-ink">{c.title}</p>
                        <p className="text-xs text-yuta-ink/50">{c.channel}</p>
                      </div>
                      <Badge size="sm" className="shrink-0 bg-orange-100 text-orange-700">En attente</Badge>
                      <span className="shrink-0 text-xs tabular-nums text-yuta-ink/40">{c.time}</span>
                    </div>
                  ))}
                </div>
                <PanelFooterLink>Voir tous les contenus</PanelFooterLink>
              </Panel>

              {/* Plan du jour */}
              <Panel
                title="Plan du jour"
                action={<PanelLink>Modifier</PanelLink>}
              >
                <div className="divide-y divide-yuta-line">
                  {dailyPlan.map((item) => (
                    <div key={item.time} className="flex items-center gap-4 px-5 py-3">
                      <span className="w-12 shrink-0 text-sm font-semibold tabular-nums text-yuta-ink">
                        {item.time}
                      </span>
                      <span className="flex-1 text-sm text-yuta-ink">{item.title}</span>
                    </div>
                  ))}
                </div>
                <PanelFooterLink>Voir tout le planning</PanelFooterLink>
              </Panel>
            </section>
          </div>
        </AppMain>

        <AppFooter>
          YuTa Admin v1.0.0&nbsp;&nbsp; &copy; 2025 YuTa Solutions. Tous droits reserves.
        </AppFooter>
      </div>
    </AppShell>
  );
}

// ─── NavLink ─────────────────────────────────────────────────────────────────

function NavLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const Icon = item.icon;
  const isActive = item.href === '/' ? pathname === '/' : item.href !== '#' && pathname.startsWith(item.href);
  const isDisabled = item.href === '#';

  return (
    <Link
      href={item.href}
      aria-disabled={isDisabled}
      className={cn(
        'flex min-h-9 w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-semibold transition-colors',
        item.sub && 'pl-6',
        isActive
          ? 'bg-yuta-mist text-yuta-ink'
          : 'text-yuta-ink/60 hover:bg-yuta-mist hover:text-yuta-ink',
        isDisabled && 'cursor-default',
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="min-w-0 flex-1 truncate">{item.label}</span>
      {item.note && (
        <span className="rounded-md bg-yuta-info px-1.5 py-0.5 text-[10px] font-black uppercase text-yuta-ink/60">
          {item.note}
        </span>
      )}
    </Link>
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
          <div className={cn('grid h-8 w-8 shrink-0 place-items-center rounded-lg', metric.iconBg)}>
            <Icon className="h-4 w-4" />
          </div>
          <p className="text-sm font-medium leading-snug text-yuta-ink/70">{metric.label}</p>
        </div>
        <div>
          <p className="text-3xl font-bold tracking-tight text-yuta-ink">{metric.value}</p>
          <p className="mt-0.5 text-xs text-yuta-ink/50">{metric.delta}</p>
        </div>
      </div>
      <Separator />
      <div className="px-5 py-3">
        <button className="flex items-center gap-1 text-sm font-semibold text-yuta-success transition-colors hover:text-yuta-success/80">
          {metric.linkText}
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </Card>
  );
}

/** Inline star rating */
function StarRating({ value, max = 5 }: { value: number; max?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            'h-3 w-3',
            i < value ? 'fill-amber-400 text-amber-400' : 'fill-yuta-mist text-yuta-line',
          )}
        />
      ))}
    </div>
  );
}

/** Circular review source avatar (G / f / T) */
function ReviewAvatar({ source }: { source: string }) {
  const palette: Record<string, string> = {
    G: 'bg-red-100 text-red-600',
    f: 'bg-blue-100 text-blue-600',
    T: 'bg-green-100 text-green-600',
  };
  const cls = palette[source] ?? 'bg-yuta-mist text-yuta-ink';
  return (
    <div className={cn('grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-bold', cls)}>
      {source}
    </div>
  );
}

/** Content thumbnail platform badge overlay */
function PlatformBadge({ channel }: { channel: string }) {
  const isFb = channel === 'Facebook';
  return (
    <div
      className={cn(
        'absolute bottom-0 right-0 grid h-5 w-5 place-items-center rounded-full text-[9px] font-black text-white',
        isFb ? 'bg-blue-600' : 'bg-pink-500',
      )}
    >
      {isFb ? 'f' : 'ig'}
    </div>
  );
}

/** Header action link */
function PanelLink({ children }: { children: React.ReactNode }) {
  return (
    <button className="text-sm font-semibold text-yuta-ink/50 hover:text-yuta-ink">
      {children}
    </button>
  );
}

/** Centered footer “Voir tout…” link inside a panel */
function PanelFooterLink({ children }: { children: React.ReactNode }) {
  return (
    <div className="border-t border-yuta-line py-3 text-center">
      <p className="cursor-pointer text-sm font-medium text-yuta-ink/50 transition-colors hover:text-yuta-ink">
        {children}
      </p>
    </div>
  );
}

/** Soft-color badge for task priority — uses core Badge */
function TaskPriorityBadge({ priority }: { priority: string }) {
  const cls: Record<string, string> = {
    Haute:   'bg-red-100 text-red-700',
    Moyenne: 'bg-orange-100 text-orange-700',
    Basse:   'bg-sky-100 text-sky-700',
  };
  return (
    <Badge size="sm" className={cls[priority] ?? 'bg-yuta-mist text-yuta-ink'}>
      {priority}
    </Badge>
  );
}

/** Soft reservation status badge — uses core Badge */
function ReservationStatusBadge({ status }: { status: string }) {
  const cls = status === 'Confirmée'
    ? 'bg-green-100 text-green-700'
    : 'bg-orange-100 text-orange-700';
  return (
    <Badge size="sm" className={cls}>
      {status}
    </Badge>
  );
}
