'use client';

import type { AvailableTenant } from '@yuta/auth';
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
  YutaBrandMark,
  cn,
} from '@yuta/ui';
import { Bell, ChevronLeft, LogOut, Menu, X } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { logoutAction } from '../app/(authenticated)/actions';
import {
  getActiveNavigationHref,
  getVisibleNavigationSections,
  type BackofficeNavigationItem,
  type NavigationCapabilities,
} from './backoffice-navigation';
import { TenantSwitcher } from './tenant-switcher';

export function BackofficeFrame({
  children,
  currentUser,
  tenantSwitcher,
  canManageUsers,
  canManageBookingSettings,
  bookingEnabled,
  reputationEnabled,
}: {
  children: ReactNode;
  currentUser: { name: string; email: string };
  tenantSwitcher: {
    tenants: AvailableTenant[];
    currentMembershipId: string;
  };
  canManageUsers: boolean;
  canManageBookingSettings: boolean;
  bookingEnabled: boolean;
  reputationEnabled: boolean;
}) {
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
              <BackofficeBrand />
            </AppSidebarHeader>
          }
          footer={
            <AppSidebarFooter>
              <Button
                variant="ghost"
                size="sm"
                fullWidth
                className="justify-start text-primary/50"
              >
                <ChevronLeft className="h-4 w-4" />
                Reduire le menu
              </Button>
            </AppSidebarFooter>
          }
        >
          <BackofficeNavigation
            pathname={pathname}
            capabilities={{
              bookingEnabled,
              reputationEnabled,
              canManageBookingSettings,
              canManageUsers,
            }}
          />
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
              <TenantSwitcher
                tenants={tenantSwitcher.tenants}
                currentMembershipId={tenantSwitcher.currentMembershipId}
                className="hidden w-56 md:flex"
              />
              <IconButton
                className="relative text-primary/60"
                aria-label="Notifications"
              >
                <Bell className="h-5 w-5" />
                <span className="absolute right-1.5 top-1.5 grid h-4 w-4 place-items-center rounded-full bg-action-danger text-[10px] font-black text-white">
                  3
                </span>
              </IconButton>
              <div className="hidden text-right lg:block">
                <p className="text-xs font-bold text-primary">
                  {currentUser.name}
                </p>
                <p className="max-w-44 truncate text-[11px] text-muted">
                  {currentUser.email}
                </p>
              </div>
              <Avatar
                fallback={currentUser.name}
                size="sm"
                className="bg-primary text-white"
              />
              <form action={logoutAction}>
                <IconButton
                  type="submit"
                  variant="ghost"
                  size="sm"
                  aria-label="Se déconnecter"
                  title="Se déconnecter"
                >
                  <LogOut className="h-4 w-4" />
                </IconButton>
              </form>
            </>
          }
        />

        <AppMain>{children}</AppMain>

        <AppFooter>
          Espace restaurateur YUTA v1.0.0&nbsp;&nbsp; &copy; 2025 YuTa
          Solutions. Tous droits reserves.
        </AppFooter>
      </div>

      <MobileMenuDrawer
        open={mobileMenuOpen}
        pathname={pathname}
        tenantSwitcher={tenantSwitcher}
        canManageUsers={canManageUsers}
        canManageBookingSettings={canManageBookingSettings}
        bookingEnabled={bookingEnabled}
        reputationEnabled={reputationEnabled}
        onClose={() => setMobileMenuOpen(false)}
      />
    </AppShell>
  );
}

// ─── NavLink ─────────────────────────────────────────────────────────────────

function BackofficeBrand() {
  return (
    <>
      <div className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full bg-surface-selected">
        <YutaBrandMark showName={false} iconClassName="h-7 w-7" />
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-bold">Espace restaurateur YUTA</p>
        <p className="truncate text-xs font-semibold text-primary/45">
          Back office restaurant
        </p>
      </div>
    </>
  );
}

function BackofficeNavigation({
  pathname,
  capabilities,
  onNavigate,
}: {
  pathname: string;
  capabilities: NavigationCapabilities;
  onNavigate?: () => void;
}) {
  const sections = getVisibleNavigationSections(capabilities);
  const activeHref = getActiveNavigationHref(pathname, sections);

  return (
    <>
      {sections.map((section, sectionIndex) => (
        <div key={section.title} className={sectionIndex > 0 ? 'mt-4' : ''}>
          <p className="mb-1.5 px-2 text-[10px] font-bold uppercase tracking-widest text-primary/40">
            {section.title}
          </p>
          <div className="grid gap-0.5">
            {section.items.map((item) => (
              <NavLink
                key={item.label}
                item={item}
                active={item.href === activeHref}
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
  tenantSwitcher,
  canManageUsers,
  canManageBookingSettings,
  bookingEnabled,
  reputationEnabled,
  onClose,
}: {
  open: boolean;
  pathname: string;
  tenantSwitcher: {
    tenants: AvailableTenant[];
    currentMembershipId: string;
  };
  canManageUsers: boolean;
  canManageBookingSettings: boolean;
  bookingEnabled: boolean;
  reputationEnabled: boolean;
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
        aria-labelledby="mobile-backoffice-menu-title"
        className={cn(
          'relative flex h-dvh w-80 max-w-[85vw] min-h-0 flex-col border-r border-border-default bg-white shadow-md transition-transform duration-200 ease-out will-change-transform motion-reduce:transition-none',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <AppSidebarHeader className="pr-3">
          <BackofficeBrand />
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
        <h2 id="mobile-backoffice-menu-title" className="sr-only">
          Menu de l'espace restaurateur YUTA
        </h2>
        <nav className="min-h-0 flex-1 overflow-y-auto p-4">
          <TenantSwitcher
            tenants={tenantSwitcher.tenants}
            currentMembershipId={tenantSwitcher.currentMembershipId}
            className="mb-4 md:hidden"
          />
          <BackofficeNavigation
            pathname={pathname}
            capabilities={{
              bookingEnabled,
              reputationEnabled,
              canManageBookingSettings,
              canManageUsers,
            }}
            onNavigate={onClose}
          />
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
  active,
  onNavigate,
}: {
  item: BackofficeNavigationItem;
  active: boolean;
  onNavigate?: () => void;
}) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={() => {
        onNavigate?.();
      }}
      className={cn(
        'flex min-h-9 w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-semibold transition-colors',
        active
          ? 'bg-surface-muted text-primary'
          : 'text-primary/60 hover:bg-surface-muted hover:text-primary',
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="min-w-0 flex-1 truncate">{item.label}</span>
    </Link>
  );
}
