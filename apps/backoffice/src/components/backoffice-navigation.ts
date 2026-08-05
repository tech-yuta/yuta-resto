import type { LucideIcon } from 'lucide-react';
import {
  Archive,
  ArrowLeftRight,
  CalendarCheck,
  CalendarClock,
  CalendarDays,
  Clock,
  ClipboardCheck,
  FileText,
  LayoutDashboard,
  LayoutGrid,
  Megaphone,
  MessageSquare,
  PackageCheck,
  Palette,
  Scale,
  Store,
  Truck,
  UserCog,
  Users,
} from 'lucide-react';

export type NavigationCapabilities = {
  bookingEnabled: boolean;
  reputationEnabled: boolean;
  canManageBookingSettings: boolean;
  canManageUsers: boolean;
};

export type BackofficeNavigationItem = {
  label: string;
  icon: LucideIcon;
  href: string;
  requires?: readonly (keyof NavigationCapabilities)[];
};

export type BackofficeNavigationSection = {
  title: string;
  items: readonly BackofficeNavigationItem[];
};

export const backofficeNavigationSections: readonly BackofficeNavigationSection[] =
  [
    {
      title: 'Aujourd’hui',
      items: [{ label: 'Aujourd’hui', icon: LayoutDashboard, href: '/today' }],
    },
    {
      title: 'Réservations',
      items: [
        {
          label: 'Réservations',
          icon: CalendarCheck,
          href: '/operations/reservations',
          requires: ['bookingEnabled'],
        },
      ],
    },
    {
      title: 'Établissement',
      items: [
        {
          label: 'Informations générales',
          icon: Store,
          href: '/establishment/general-information',
        },
        {
          label: 'Salle & tables',
          icon: LayoutGrid,
          href: '/establishment/rooms-tables',
          requires: ['bookingEnabled'],
        },
        {
          label: 'Horaires & services',
          icon: CalendarClock,
          href: '/establishment/hours-services',
          requires: ['bookingEnabled', 'canManageBookingSettings'],
        },
      ],
    },
    {
      title: 'Stock',
      items: [
        { label: 'Inventaire', icon: Archive, href: '/stock/inventory' },
        {
          label: 'Mouvements de stock',
          icon: ArrowLeftRight,
          href: '/stock/movements',
        },
        { label: 'Fournisseurs', icon: Truck, href: '/stock/suppliers' },
      ],
    },
    {
      title: 'Équipe',
      items: [
        { label: 'Planning', icon: CalendarDays, href: '/team/planning' },
        { label: 'Pointage', icon: Clock, href: '/team/time-tracking' },
        {
          label: 'Tâches du jour',
          icon: ClipboardCheck,
          href: '/team/daily-tasks',
        },
        {
          label: 'Utilisateurs & accès',
          icon: UserCog,
          href: '/team/users-access',
          requires: ['canManageUsers'],
        },
      ],
    },
    {
      title: 'Conformité',
      items: [
        {
          label: 'Veille & conformité',
          icon: Scale,
          href: '/compliance/monitoring',
        },
      ],
    },
    {
      title: 'Clients & réputation',
      items: [
        { label: 'Clients', icon: Users, href: '/customers/directory' },
        {
          label: 'Avis & commentaires',
          icon: MessageSquare,
          href: '/customers/reviews',
          requires: ['reputationEnabled'],
        },
      ],
    },
    {
      title: 'Marketing & contenu',
      items: [
        {
          label: 'Création visuelle',
          icon: Palette,
          href: '/marketing/creative-studio',
        },
        {
          label: 'Pages & contenus',
          icon: FileText,
          href: '/marketing/content',
        },
        { label: 'Campagnes', icon: Megaphone, href: '/marketing/campaigns' },
      ],
    },
    {
      title: 'Paramètres',
      items: [
        {
          label: 'Modules & abonnement',
          icon: PackageCheck,
          href: '/settings/billing',
        },
      ],
    },
  ];

export function getVisibleNavigationSections(
  capabilities: NavigationCapabilities,
): BackofficeNavigationSection[] {
  return backofficeNavigationSections.flatMap((section) => {
    const items = section.items.filter(
      (item) =>
        !item.requires ||
        item.requires.every((capability) => capabilities[capability]),
    );
    return items.length > 0 ? [{ ...section, items }] : [];
  });
}

export function getActiveNavigationHref(
  pathname: string,
  sections: readonly BackofficeNavigationSection[],
): string | undefined {
  return sections
    .flatMap((section) => section.items)
    .filter(
      (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
    )
    .sort((left, right) => right.href.length - left.href.length)[0]?.href;
}
