import type { LucideIcon } from 'lucide-react';
import {
  Archive,
  ArrowLeftRight,
  BookOpen,
  CalendarCheck,
  CalendarClock,
  CalendarDays,
  Clock,
  ClipboardCheck,
  ClipboardList,
  FileText,
  FolderOpen,
  LayoutDashboard,
  LayoutGrid,
  MessageSquare,
  PackageCheck,
  Palette,
  Scale,
  Settings2,
  Smile,
  Store,
  Truck,
  UtensilsCrossed,
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
      title: 'Accueil',
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
          href: '/reservations',
          requires: ['bookingEnabled'],
        },
        {
          label: 'Paramètres de réservation',
          icon: Settings2,
          href: '/reservations/parametres',
          requires: ['bookingEnabled', 'canManageBookingSettings'],
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
          label: 'Horaires & services',
          icon: CalendarClock,
          href: '/etablissement/horaires-services',
          requires: ['bookingEnabled', 'canManageBookingSettings'],
        },
        {
          label: 'Salle & tables',
          icon: LayoutGrid,
          href: '/etablissement/salles-tables',
          requires: ['bookingEnabled'],
        },
        {
          label: 'Carte & menus',
          icon: UtensilsCrossed,
          href: '/etablissement/carte-menus',
        },
        {
          label: 'Ressources internes',
          icon: FolderOpen,
          href: '/etablissement/ressources-internes',
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
        {
          label: 'Fiches techniques',
          icon: ClipboardList,
          href: '/stock/fiches-techniques',
        },
        { label: 'Fournisseurs', icon: Truck, href: '/stock/fournisseurs' },
      ],
    },
    {
      title: 'Gestion de l’équipe',
      items: [
        { label: 'Salariés', icon: Users, href: '/equipe/salaries' },
        { label: 'Planning', icon: CalendarDays, href: '/equipe/planning' },
        { label: 'Pointage', icon: Clock, href: '/equipe/pointage' },
        {
          label: 'Tâches du jour',
          icon: ClipboardCheck,
          href: '/equipe/taches-quotidiennes',
        },
        {
          label: 'Formalités du personnel',
          icon: BookOpen,
          href: '/equipe/formalites-personnel',
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
      title: 'Visibilité & réputation',
      items: [
        {
          label: 'Satisfaction client',
          icon: Smile,
          href: '/visibilite-reputation/satisfaction',
          requires: ['reputationEnabled'],
        },
        {
          label: 'Avis & commentaires',
          icon: MessageSquare,
          href: '/visibilite-reputation/avis',
          requires: ['reputationEnabled'],
        },
      ],
    },
    {
      title: 'Marketing & contenu',
      items: [
        {
          label: 'Créations visuelles',
          icon: Palette,
          href: '/marketing/studio-creatif',
        },
        {
          label: 'Création de contenus',
          icon: FileText,
          href: '/marketing/contenus',
        },
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
        {
          label: 'Utilisateurs & accès',
          icon: UserCog,
          href: '/parametres/utilisateurs-acces',
          requires: ['canManageUsers'],
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
