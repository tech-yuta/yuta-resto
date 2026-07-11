'use client';

import { Badge, Button, Card, Separator, cn } from '@yuta/ui';
import Link from 'next/link';
import {
  LayoutDashboard,
  ShoppingCart,
  LayoutGrid,
  Utensils,
  ListChecks,
  Layers,
  CreditCard,
  BarChart2,
  Box,
  Folder,
  Archive,
  Truck,
  ArrowLeftRight,
  Users,
  CalendarDays,
  Clock,
  Shield,
  Heart,
  Tag,
  Star,
  ImageIcon,
  FileText,
  Megaphone,
  Monitor,
  Printer,
  Settings,
  ChevronLeft,
  ChevronRight,
  Bell,
  Search,
  Plus,
  TrendingUp,
  Package,
  Table2,
  CheckCircle2,
} from 'lucide-react';

// ─── Navigation data ────────────────────────────────────────────────────────

type NavItem = { label: string; icon: React.ElementType; href?: string; sub?: boolean };
type NavSection = { title?: string; items: NavItem[] };

const navSections: NavSection[] = [
  {
    items: [{ label: 'Tableau de bord', icon: LayoutDashboard, href: '/' }],
  },
  {
    title: 'GESTION',
    items: [
      { label: 'Commandes', icon: ShoppingCart, href: '#' },
      { label: 'Tables & Salle', icon: LayoutGrid, href: '#' },
      { label: 'Menu', icon: Utensils, href: '#' },
      { label: 'Menus & Options', icon: ListChecks, href: '/pos/menu', sub: true },
      { label: 'Combos', icon: Layers, href: '/pos/combos', sub: true },
      { label: 'Paiements', icon: CreditCard, href: '#' },
      { label: 'Rapports POS', icon: BarChart2, href: '/pos/reports' },
    ],
  },
  {
    title: 'PRODUITS & STOCK',
    items: [
      { label: 'Produits', icon: Box, href: '#' },
      { label: 'Catégories', icon: Folder, href: '#' },
      { label: 'Stock', icon: Archive, href: '#' },
      { label: 'Fournisseurs', icon: Truck, href: '#' },
      { label: 'Entrées / Sorties', icon: ArrowLeftRight, href: '#' },
    ],
  },
  {
    title: 'ÉQUIPE',
    items: [
      { label: 'Employés', icon: Users, href: '/pos/staff' },
      { label: 'Planning', icon: CalendarDays, href: '#' },
      { label: 'Pointage', icon: Clock, href: '#' },
      { label: 'Rôles & Accès', icon: Shield, href: '#' },
    ],
  },
  {
    title: 'CLIENTS & MARKETING',
    items: [
      { label: 'Clients & Fidélité', icon: Heart, href: '#' },
      { label: 'Promotions', icon: Tag, href: '#' },
      { label: 'Avis & Réseaux', icon: Star, href: '#' },
    ],
  },
  {
    title: 'CONTENU & COMMUNICATION',
    items: [
      { label: 'Médias', icon: ImageIcon, href: '#' },
      { label: 'Pages & Contenus', icon: FileText, href: '#' },
      { label: 'Campagnes', icon: Megaphone, href: '#' },
    ],
  },
  {
    title: 'POS',
    items: [
      { label: 'Écran cuisine', icon: Monitor, href: '#' },
      { label: 'Imprimantes', icon: Printer, href: '/pos/prints' },
      { label: 'Paramètres POS', icon: Settings, href: '#' },
    ],
  },
];

// ─── Dashboard data ──────────────────────────────────────────────────────────

const recentActivities = [
  {
    id: 1,
    icon: ShoppingCart,
    color: 'bg-yuta-success/10 text-yuta-success',
    title: 'Commande #POS-202506211-1056',
    sub: 'Table 5  •  32,50 €',
    time: '10:15',
  },
  {
    id: 2,
    icon: CreditCard,
    color: 'bg-blue-50 text-blue-500',
    title: 'Paiement accepté',
    sub: 'Carte bancaire  •  28,00 €',
    time: '10:12',
  },
  {
    id: 3,
    icon: Package,
    color: 'bg-orange-50 text-orange-500',
    title: 'Entrée de stock',
    sub: "Maison d'Asie  •  23 produits",
    time: '09:58',
  },
  {
    id: 4,
    icon: Users,
    color: 'bg-purple-50 text-purple-500',
    title: 'Employé pointé',
    sub: 'Ca sáng đã bắt đầu',
    time: '09:00',
  },
  {
    id: 5,
    icon: Utensils,
    color: 'bg-yuta-success/10 text-yuta-success',
    title: 'Menu mis à jour',
    sub: 'Bún bò, Phở gà, Bánh bao',
    time: '08:45',
  },
];

const currentOrders = [
  { id: 1, table: 'Table 5', plats: 3, time: '10:15', status: 'À préparer', badge: 'warning' as const },
  { id: 2, table: 'Table 7', plats: 2, time: '10:14', status: 'En préparation', badge: 'info' as const },
  { id: 3, table: 'Table 2', plats: 4, time: '10:13', status: 'À préparer', badge: 'warning' as const },
  { id: 4, table: 'Table 9 (Takeaway)', plats: 2, time: '10:12', status: 'Prêt', badge: 'success' as const },
];

const lowStock = [
  { id: 1, name: 'Bœuf', unit: '0,8 kg restant' },
  { id: 2, name: 'Vermicelles de riz', unit: '1 paquet restant' },
  { id: 3, name: 'Sauce poisson', unit: '2 bouteilles restantes' },
];

const reservations = [
  { id: 1, time: '12:00', guests: 2, table: 'Table 3' },
  { id: 2, time: '19:00', guests: 4, table: 'Table 6' },
  { id: 3, time: '20:00', guests: 6, table: 'Table 8' },
  { id: 4, time: '21:00', guests: 2, table: 'Table 2' },
];

const teamToday = [
  { initials: 'YT', name: 'YuTa', role: 'Quản lý', start: '08:00', end: '16:00', color: 'bg-yuta-accent text-yuta-ink' },
  { initials: 'AN', name: 'Anh', role: 'Cuisinier', start: '08:00', end: '16:00', color: 'bg-blue-100 text-blue-700' },
  { initials: 'LY', name: 'Linh', role: 'Service', start: '09:00', end: '17:00', color: 'bg-purple-100 text-purple-700' },
  { initials: 'HA', name: 'Hà', role: 'Plonge', start: '14:00', end: '22:00', color: 'bg-orange-100 text-orange-700' },
];

// ─── Sparkline SVG ───────────────────────────────────────────────────────────

function Sparkline({ points, color }: { points: number[]; color: string }) {
  const w = 120;
  const h = 40;
  const max = Math.max(...points);
  const min = Math.min(...points);
  const range = max - min || 1;
  const coords = points.map((p, i) => ({
    x: (i / (points.length - 1)) * w,
    y: h - ((p - min) / range) * (h - 4) - 2,
  }));
  const d = coords.map((c, i) => `${i === 0 ? 'M' : 'L'}${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' ');
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible">
      <path d={d} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

export function AdminShell() {
  return (
    <div className="flex min-h-screen bg-yuta-paper">
      {/* ── Sidebar ────────────────────────────────────────────────────────── */}
      <aside className="hidden w-47 shrink-0 flex-col border-r border-yuta-line bg-white md:flex">
        {/* Logo */}
        <div className="flex h-17 shrink-0 items-center gap-2.5 border-b border-yuta-line px-4">
          <div className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-yuta-accent font-black text-sm text-yuta-ink">
            Y
          </div>
          <span className="text-sm font-extrabold text-yuta-ink">YuTa Admin</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto p-2">
          {navSections.map((section, si) => (
            <div key={si} className={si > 0 ? 'mt-3' : ''}>
              {section.title && (
                <p className="mb-1 px-2 text-[10px] font-bold uppercase tracking-widest text-yuta-ink/40">
                  {section.title}
                </p>
              )}
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = item.href === '/';
                return (
                  <Link
                    key={item.label}
                    href={item.href ?? '#'}
                    className={cn(
                      'flex w-full items-center gap-2.5 rounded-lg px-2 py-1.75 text-[13px] font-medium transition-colors',
                      item.sub && 'pl-6',
                      isActive
                        ? 'bg-yuta-mist font-semibold text-yuta-ink'
                        : 'text-yuta-ink/60 hover:bg-yuta-mist hover:text-yuta-ink',
                    )}
                  >
                    <Icon className="h-3.75 w-3.75 shrink-0" />
                    <span className="min-w-0 truncate">{item.label}</span>
                    {item.label === 'Menu' && (
                      <ChevronRight className="ml-auto h-3.5 w-3.5 shrink-0 text-yuta-ink/30" />
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Réduire */}
        <div className="shrink-0 border-t border-yuta-line p-2">
          <button className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-[13px] font-medium text-yuta-ink/50 hover:bg-yuta-mist hover:text-yuta-ink">
            <ChevronLeft className="h-4 w-4" />
            Réduire le menu
          </button>
        </div>
      </aside>

      {/* ── Main column ────────────────────────────────────────────────────── */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar */}
        <header className="sticky top-0 z-10 flex h-17 shrink-0 items-center gap-4 border-b border-yuta-line bg-white px-6">
          <label className="flex flex-1 items-center gap-2 rounded-xl border border-yuta-line bg-yuta-paper px-3 py-2 max-w-xs">
            <Search className="h-4 w-4 shrink-0 text-yuta-ink/40" />
            <input
              type="text"
              placeholder="Rechercher (ex : commande, produit, employé...)"
              className="min-w-0 flex-1 bg-transparent text-sm text-yuta-ink placeholder:text-yuta-ink/40 focus:outline-none"
            />
            <span className="shrink-0 rounded-md border border-yuta-line bg-white px-1.5 py-0.5 text-[11px] text-yuta-ink/40">
              ⌘K
            </span>
          </label>

          <div className="flex items-center gap-3">
            <button className="relative rounded-xl p-2 text-yuta-ink/60 hover:bg-yuta-mist">
              <Bell className="h-5 w-5" />
              <span className="absolute right-1 top-1 h-4 w-4 rounded-full bg-yuta-danger text-[10px] font-bold text-white flex items-center justify-center">
                3
              </span>
            </button>
            <button className="flex items-center gap-1.5">
              <div className="grid h-8 w-8 place-items-center rounded-full bg-yuta-ink text-xs font-bold text-white">
                YT
              </div>
              <ChevronRight className="h-3.5 w-3.5 rotate-90 text-yuta-ink/40" />
            </button>
          </div>
        </header>

        {/* Dashboard */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          {/* Page heading */}
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm text-yuta-ink/50">Samedi 21 juin 2025</p>
              <h1 className="mt-0.5 text-2xl font-extrabold tracking-tight text-yuta-ink">
                Bonjour, YuTa. 👋
              </h1>
              <p className="mt-1 text-sm text-yuta-ink/55">
                Voici un aperçu de l&apos;activité de votre restaurant.
              </p>
            </div>
            <Button variant="accent">
              <Plus className="h-4 w-4" />
              Ajouter
            </Button>
          </div>

          {/* Metric cards row */}
          <div className="mb-6 grid grid-cols-2 gap-4 xl:grid-cols-4">
            <DashMetricCard
              label="Chiffre d'affaires aujourd'hui"
              value="1 245,00 €"
              delta="+18% par rapport à hier"
              icon={<TrendingUp className="h-4 w-4" />}
              iconBg="bg-yuta-success/10 text-yuta-success"
              sparkPoints={[40, 55, 45, 65, 60, 75, 70, 80, 85, 100]}
              sparkColor="#22c55e"
            />
            <DashMetricCard
              label="Commandes aujourd'hui"
              value="56"
              delta="+12% par rapport à hier"
              icon={<Table2 className="h-4 w-4" />}
              iconBg="bg-blue-50 text-blue-500"
              sparkPoints={[30, 40, 35, 50, 45, 58, 55, 65, 68, 75]}
              sparkColor="#3b82f6"
            />
            <DashMetricCard
              label="Taux de satisfaction"
              value="4,8 / 5"
              delta="+0,3 par rapport à hier"
              icon={<Star className="h-4 w-4" />}
              iconBg="bg-blue-50 text-blue-500"
              sparkPoints={[70, 72, 69, 74, 73, 75, 74, 77, 75, 80]}
              sparkColor="#6366f1"
            />
            <DashMetricCard
              label="Employés en service"
              value="8"
              delta="Sur 12 employés"
              icon={<Users className="h-4 w-4" />}
              iconBg="bg-purple-50 text-purple-500"
              sparkPoints={[60, 65, 60, 70, 65, 72, 70, 78, 75, 82]}
              sparkColor="#a855f7"
            />
          </div>

          {/* Mid row: activities + orders */}
          <div className="mb-6 grid gap-4 lg:grid-cols-2">
            {/* Activités récentes */}
            <Card padding="none" className="overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4">
                <h2 className="font-semibold text-yuta-ink">Activités récentes</h2>
              </div>
              <Separator />
              <div>
                {recentActivities.map((a, i) => {
                  const Icon = a.icon;
                  return (
                    <div key={a.id}>
                      <div className="flex items-center gap-3 px-5 py-3">
                        <div className={cn('grid h-8 w-8 shrink-0 place-items-center rounded-full', a.color)}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-yuta-ink">{a.title}</p>
                          <p className="text-xs text-yuta-ink/50">{a.sub}</p>
                        </div>
                        <span className="shrink-0 text-xs text-yuta-ink/40">{a.time}</span>
                      </div>
                      {i < recentActivities.length - 1 && <Separator />}
                    </div>
                  );
                })}
              </div>
              <Separator />
              <div className="px-5 py-3">
                <button className="text-sm font-medium text-yuta-ink/50 hover:text-yuta-ink">
                  Voir toutes les activités
                </button>
              </div>
            </Card>

            {/* Commandes en cours */}
            <Card padding="none" className="overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4">
                <h2 className="font-semibold text-yuta-ink">Commandes en cours</h2>
                <button className="text-sm font-medium text-yuta-ink/50 hover:text-yuta-ink">
                  Voir tout
                </button>
              </div>
              <Separator />
              <div>
                {currentOrders.map((o, i) => (
                  <div key={o.id}>
                    <div className="flex items-center gap-3 px-5 py-3">
                      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-yuta-mist">
                        <Table2 className="h-4 w-4 text-yuta-ink/60" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-yuta-ink">{o.table}</p>
                        <p className="text-xs text-yuta-ink/50">
                          {o.plats} plat{o.plats > 1 ? 's' : ''}  •  {o.time}
                        </p>
                      </div>
                      <Badge variant={o.badge} size="sm">
                        {o.status}
                      </Badge>
                    </div>
                    {i < currentOrders.length - 1 && <Separator />}
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Bottom row: stock / réservations / équipe */}
          <div className="grid gap-4 lg:grid-cols-3">
            {/* Stock faible */}
            <Card padding="none" className="overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4">
                <h2 className="font-semibold text-yuta-ink">Stock faible</h2>
                <button className="text-sm font-medium text-yuta-ink/50 hover:text-yuta-ink">
                  Voir tout
                </button>
              </div>
              <Separator />
              <div>
                {lowStock.map((s, i) => (
                  <div key={s.id}>
                    <div className="flex items-center gap-3 px-5 py-3">
                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-yuta-mist">
                        <Archive className="h-4 w-4 text-yuta-ink/50" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-yuta-ink">{s.name}</p>
                        <p className="text-xs text-yuta-ink/50">{s.unit}</p>
                      </div>
                      <Badge variant="destructive" size="sm">Faible</Badge>
                    </div>
                    {i < lowStock.length - 1 && <Separator />}
                  </div>
                ))}
              </div>
            </Card>

            {/* Réservations */}
            <Card padding="none" className="overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4">
                <h2 className="font-semibold text-yuta-ink">Réservations aujourd&apos;hui</h2>
                <button className="text-sm font-medium text-yuta-ink/50 hover:text-yuta-ink">
                  Voir tout
                </button>
              </div>
              <Separator />
              <div>
                {reservations.map((r, i) => (
                  <div key={r.id}>
                    <div className="flex items-center gap-3 px-5 py-3">
                      <span className="w-10 shrink-0 text-sm font-semibold text-yuta-ink">{r.time}</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-yuta-ink/70">
                          {r.guests} pers.  •  {r.table}
                        </p>
                      </div>
                      <Badge variant="success" size="sm">Confirmée</Badge>
                    </div>
                    {i < reservations.length - 1 && <Separator />}
                  </div>
                ))}
              </div>
            </Card>

            {/* Équipe */}
            <Card padding="none" className="overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4">
                <h2 className="font-semibold text-yuta-ink">Équipe aujourd&apos;hui</h2>
                <button className="text-sm font-medium text-yuta-ink/50 hover:text-yuta-ink">
                  Voir planning
                </button>
              </div>
              <Separator />
              <div>
                {teamToday.map((t, i) => (
                  <div key={t.initials}>
                    <div className="flex items-center gap-3 px-5 py-3">
                      <div className={cn('grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-bold', t.color)}>
                        {t.initials}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-yuta-ink">
                          {t.name}{' '}
                          <span className="font-normal text-yuta-ink/50">({t.role})</span>
                        </p>
                      </div>
                      <span className="shrink-0 text-xs text-yuta-ink/50">
                        {t.start} – {t.end}
                      </span>
                    </div>
                    {i < teamToday.length - 1 && <Separator />}
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}

// ─── DashMetricCard ──────────────────────────────────────────────────────────

function DashMetricCard({
  label,
  value,
  delta,
  icon,
  iconBg,
  sparkPoints,
  sparkColor,
}: {
  label: string;
  value: string;
  delta: string;
  icon: React.ReactNode;
  iconBg: string;
  sparkPoints: number[];
  sparkColor: string;
}) {
  return (
    <Card padding="default" className="flex flex-col gap-3 overflow-hidden">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium leading-snug text-yuta-ink/60">{label}</p>
        <div className={cn('grid h-7 w-7 shrink-0 place-items-center rounded-lg', iconBg)}>
          {icon}
        </div>
      </div>
      <div>
        <p className="text-2xl font-extrabold tracking-tight text-yuta-ink">{value}</p>
        <p className="mt-0.5 flex items-center gap-1 text-xs text-yuta-success">
          <CheckCircle2 className="h-3 w-3" />
          {delta}
        </p>
      </div>
      <div className="-mx-1 mt-auto">
        <Sparkline points={sparkPoints} color={sparkColor} />
      </div>
    </Card>
  );
}
