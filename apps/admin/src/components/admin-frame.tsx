'use client';

import {
  AppFooter,
  AppMain,
  AppShell,
  AppSidebar,
  AppSidebarFooter,
  AppSidebarHeader,
  AppTopbar,
  IconTile,
  cn,
} from '@yuta/ui';
import {
  Archive,
  ArrowLeftRight,
  BarChart3,
  Bell,
  CalendarCheck,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  ClipboardCheck,
  CreditCard,
  FileText,
  Folder,
  Heart,
  ImageIcon,
  LayoutDashboard,
  LayoutGrid,
  Layers,
  ListChecks,
  Mail,
  Megaphone,
  MessageSquare,
  Package,
  PackageCheck,
  Scale,
  Search,
  Send,
  Settings,
  Shield,
  ShoppingCart,
  Star,
  Store,
  Tag,
  Truck,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';
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

export function AdminFrame({ children }: { children: ReactNode }) {
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
          {children}
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
  const isActive =
    item.href === '/'
      ? pathname === '/'
      : item.href !== '#' && pathname.startsWith(item.href);
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
