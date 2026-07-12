'use client';

import {
  AppFooter,
  AppMain,
  AppShell,
  AppSidebar,
  AppSidebarFooter,
  AppSidebarHeader,
  AppTopbar,
  Avatar,
  Button,
  IconButton,
  SearchInput,
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
  Menu,
  Megaphone,
  MessageSquare,
  Package,
  PackageCheck,
  Scale,
  Send,
  Settings,
  Shield,
  ShoppingCart,
  Star,
  Store,
  Tag,
  Truck,
  Users,
  X,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState, type ReactNode } from 'react';
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
    items: [{ label: "Aujourd'hui", icon: LayoutDashboard, href: '/today' }],
  },
  {
    title: 'Operations',
    items: [
      { label: 'Commandes', icon: ShoppingCart, href: '/operations/orders' },
      { label: 'Tables & salle', icon: LayoutGrid, href: '/operations/tables' },
      { label: 'Reservations', icon: CalendarCheck, href: '/operations/reservations' },
      { label: 'Paiements', icon: CreditCard, href: '/operations/payments' },
      { label: 'Rapports POS', icon: BarChart3, href: '/operations/reports' },
    ],
  },
  {
    title: 'Menu',
    items: [
      { label: 'Menus & options', icon: ListChecks, href: '/menu/menus' },
      { label: 'Combos', icon: Layers, href: '/menu/combos' },
      { label: 'Produits', icon: Package, href: '/menu/products' },
      { label: 'Categories', icon: Folder, href: '/menu/categories' },
    ],
  },
  {
    title: 'Stock',
    items: [
      { label: 'Inventaire', icon: Archive, href: '/stock/inventory' },
      { label: 'Fournisseurs', icon: Truck, href: '/stock/suppliers' },
      { label: 'Entrees / sorties', icon: ArrowLeftRight, href: '/stock/movements' },
    ],
  },
  {
    title: 'Equipe',
    items: [
      { label: 'Employes', icon: Users, href: '/team/staff' },
      { label: 'Planning', icon: CalendarDays, href: '/team/planning' },
      { label: 'Pointage', icon: Clock, href: '/team/time-tracking' },
      { label: 'Taches du jour', icon: ClipboardCheck, href: '/team/daily-tasks' },
      { label: 'Roles & acces', icon: Shield, href: '/team/roles' },
    ],
  },
  {
    title: 'Conformite & veille',
    items: [
      { label: 'Veille & Conformite', icon: Scale, href: '/compliance/monitoring' },
    ],
  },
  {
    title: 'Clients',
    items: [
      { label: 'Clients', icon: Users, href: '/customers/directory' },
      { label: 'Fidelite', icon: Heart, href: '/customers/loyalty' },
      { label: 'Avis & commentaires', icon: MessageSquare, href: '/customers/reviews' },
      { label: 'Emails', icon: Mail, href: '/customers/emails' },
    ],
  },
  {
    title: 'Marketing & contenu',
    items: [
      { label: 'Reseaux sociaux', icon: Send, href: '/marketing/social-media' },
      { label: 'Medias', icon: ImageIcon, href: '/marketing/media-library' },
      { label: 'Pages & contenus', icon: FileText, href: '/marketing/content' },
      { label: 'Promotions', icon: Tag, href: '#' },
      { label: 'Campagnes', icon: Megaphone, href: '/marketing/campaigns' },
    ],
  },
  {
    title: 'Parametres',
    items: [
      { label: 'Restaurant', icon: Store, href: '/settings/restaurant' },
      { label: 'Modules & abonnement', icon: PackageCheck, href: '/settings/billing' },
      { label: 'POS', icon: Settings, href: '/settings/printers' },
    ],
  },
];

export function AdminFrame({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!mobileMenuOpen) {
      return;
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setMobileMenuOpen(false);
      }
    }

    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [mobileMenuOpen]);

  return (
    <AppShell
      sidebar={
        <AppSidebar
          header={
            <AppSidebarHeader>
              <AdminBrand />
            </AppSidebarHeader>
          }
          footer={
            <AppSidebarFooter>
              <Button variant="ghost" size="sm" fullWidth className="justify-start text-primary/50">
                <ChevronLeft className="h-4 w-4" />
                Reduire le menu
              </Button>
            </AppSidebarFooter>
          }
        >
          <AdminNavigation pathname={pathname} />
        </AppSidebar>
      }
    >
      <div className="flex h-screen min-w-0 flex-col overflow-hidden">
        <AppTopbar
          search={
            <>
              <IconButton
                type="button"
                variant="secondary"
                size="md"
                className="h-10 w-10 shrink-0 md:hidden"
                aria-label="Ouvrir le menu"
                onClick={() => setMobileMenuOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </IconButton>
              <div className="relative min-w-0 max-w-md flex-1">
                <SearchInput
                  placeholder="Rechercher (ex : commande, produit, employe...)"
                  className="pr-14"
                />
                <span className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded-md border border-border-default bg-white px-1.5 py-0.5 text-[11px] font-semibold text-primary/40 sm:block">
                  &#8984; K
                </span>
              </div>
            </>
          }
          actions={
            <>
              <IconButton className="relative text-primary/60" aria-label="Notifications">
                <Bell className="h-5 w-5" />
                <span className="absolute right-1.5 top-1.5 grid h-4 w-4 place-items-center rounded-full bg-action-danger text-[10px] font-black text-white">
                  3
                </span>
              </IconButton>
              <Button variant="ghost" size="sm" className="gap-1.5 p-1">
                <Avatar fallback="YT" size="sm" className="bg-primary text-white" />
                <ChevronRight className="hidden h-3.5 w-3.5 rotate-90 text-primary/40 sm:block" />
              </Button>
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

      <MobileMenuDrawer
        open={mobileMenuOpen}
        pathname={pathname}
        onClose={() => setMobileMenuOpen(false)}
      />
    </AppShell>
  );
}

// ─── NavLink ─────────────────────────────────────────────────────────────────

function AdminBrand() {
  return (
    <>
      <div className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full bg-surface-selected">
        <Image
          src="/images/logo.svg"
          alt="YuTa"
          width={28}
          height={28}
          priority
          className="h-7 w-7 object-contain"
        />
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-bold">YuTa Admin</p>
        <p className="truncate text-xs font-semibold text-primary/45">
          Back office restaurant
        </p>
      </div>
    </>
  );
}

function AdminNavigation({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <>
      {navSections.map((section, sectionIndex) => (
        <div key={section.title ?? 'main'} className={sectionIndex > 0 ? 'mt-4' : ''}>
          {section.title && (
            <p className="mb-1.5 px-2 text-[10px] font-bold uppercase tracking-widest text-primary/40">
              {section.title}
            </p>
          )}
          <div className="grid gap-0.5">
            {section.items.map((item) => (
              <NavLink
                key={item.label}
                item={item}
                pathname={pathname}
                onNavigate={onNavigate}
              />
            ))}
          </div>
        </div>
      ))}
    </>
  );
}

function MobileMenuDrawer({
  open,
  pathname,
  onClose,
}: {
  open: boolean;
  pathname: string;
  onClose: () => void;
}) {
  return (
    <div
      className={cn(
        'fixed inset-0 z-50 md:hidden',
        open ? 'pointer-events-auto' : 'pointer-events-none',
      )}
      aria-hidden={!open}
    >
      <button
        type="button"
        className={cn(
          'absolute inset-0 bg-primary/40 transition-opacity duration-200 ease-out motion-reduce:transition-none',
          open ? 'opacity-100' : 'opacity-0',
        )}
        aria-label="Fermer le menu"
        tabIndex={open ? 0 : -1}
        onClick={onClose}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="mobile-admin-menu-title"
        className={cn(
          'relative flex h-dvh w-80 max-w-[85vw] min-h-0 flex-col border-r border-border-default bg-white shadow-md transition-transform duration-200 ease-out will-change-transform motion-reduce:transition-none',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <AppSidebarHeader className="pr-3">
          <AdminBrand />
          <IconButton
            type="button"
            variant="ghost"
            size="sm"
            className="ml-auto"
            aria-label="Fermer le menu"
            tabIndex={open ? 0 : -1}
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </IconButton>
        </AppSidebarHeader>
        <h2 id="mobile-admin-menu-title" className="sr-only">
          Menu admin YuTa
        </h2>
        <nav className="min-h-0 flex-1 overflow-y-auto p-4">
          <AdminNavigation pathname={pathname} onNavigate={onClose} />
        </nav>
        <AppSidebarFooter>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            fullWidth
            className="justify-start text-primary/50"
            tabIndex={open ? 0 : -1}
            onClick={onClose}
          >
            <ChevronLeft className="h-4 w-4" />
            Fermer le menu
          </Button>
        </AppSidebarFooter>
      </aside>
    </div>
  );
}

function NavLink({
  item,
  pathname,
  onNavigate,
}: {
  item: NavItem;
  pathname: string;
  onNavigate?: () => void;
}) {
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
      onClick={(event) => {
        if (isDisabled) {
          event.preventDefault();
          return;
        }
        onNavigate?.();
      }}
      className={cn(
        'flex min-h-9 w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-semibold transition-colors',
        item.sub && 'pl-6',
        isActive
          ? 'bg-surface-muted text-primary'
          : 'text-primary/60 hover:bg-surface-muted hover:text-primary',
        isDisabled && 'cursor-default',
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="min-w-0 flex-1 truncate">{item.label}</span>
      {item.note && (
        <span className="rounded-md bg-status-info-soft px-1.5 py-0.5 text-[10px] font-black uppercase text-primary/60">
          {item.note}
        </span>
      )}
    </Link>
  );
}
