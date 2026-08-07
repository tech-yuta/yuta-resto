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
      items: [
        { label: 'Aujourd’hui', icon: LayoutDashboard, href: '/aujourdhui' },
      ],
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
          href: '/etablissement/informations-generales',
        },
        {
          label: 'Salle & tables',
          icon: LayoutGrid,
          href: '/etablissement/salles-tables',
          requires: ['bookingEnabled'],
        },
        {
          label: 'Horaires & services',
          icon: CalendarClock,
          href: '/etablissement/horaires-services',
          requires: ['bookingEnabled', 'canManageBookingSettings'],
        },
      ],
    },
    {
      title: 'Stock',
      items: [
        { label: 'Inventaire', icon: Archive, href: '/stock/inventaire' },
        {
          label: 'Mouvements de stock',
          icon: ArrowLeftRight,
          href: '/stock/mouvements',
        },
        { label: 'Fournisseurs', icon: Truck, href: '/stock/fournisseurs' },
      ],
    },
    {
      title: 'Équipe',
      items: [
        { label: 'Planning', icon: CalendarDays, href: '/equipe/planning' },
        { label: 'Pointage', icon: Clock, href: '/equipe/pointage' },
        {
          label: 'Tâches du jour',
          icon: ClipboardCheck,
          href: '/equipe/taches-quotidiennes',
        },
        {
          label: 'Utilisateurs & accès',
          icon: UserCog,
          href: '/equipe/utilisateurs-acces',
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
          href: '/conformite/veille',
        },
      ],
    },
    {
      title: 'Clients & réputation',
      items: [
        { label: 'Clients', icon: Users, href: '/clients/repertoire' },
        {
          label: 'Avis & commentaires',
          icon: MessageSquare,
          href: '/clients/avis',
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
          href: '/marketing/studio-creatif',
        },
        {
          label: 'Pages & contenus',
          icon: FileText,
          href: '/marketing/contenus',
        },
        { label: 'Campagnes', icon: Megaphone, href: '/marketing/campagnes' },
      ],
    },
    {
      title: 'Paramètres',
      items: [
        {
          label: 'Modules & abonnement',
          icon: PackageCheck,
          href: '/parametres/abonnement',
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
