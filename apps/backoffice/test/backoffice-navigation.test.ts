import { describe, expect, it } from 'vitest';
import {
  backofficeNavigationSections,
  getActiveNavigationHref,
  getVisibleNavigationSections,
} from '../src/components/backoffice-navigation';

const allCapabilities = {
  bookingEnabled: true,
  reputationEnabled: true,
  canManageBookingSettings: true,
  canManageUsers: true,
};

describe('back-office navigation', () => {
  it('uses the approved section and item order', () => {
    expect(
      backofficeNavigationSections.map((section) => ({
        title: section.title,
        items: section.items.map((item) => item.label),
      })),
    ).toEqual([
      { title: 'Aujourd’hui', items: ['Aujourd’hui'] },
      {
        title: 'Réservations',
        items: ['Réservations'],
      },
      {
        title: 'Établissement',
        items: [
          'Informations générales',
          'Salle & tables',
          'Horaires & services',
        ],
      },
      {
        title: 'Stock',
        items: ['Inventaire', 'Mouvements de stock', 'Fournisseurs'],
      },
      {
        title: 'Équipe',
        items: [
          'Planning',
          'Pointage',
          'Tâches du jour',
          'Utilisateurs & accès',
        ],
      },
      { title: 'Conformité', items: ['Veille & conformité'] },
      {
        title: 'Clients & réputation',
        items: ['Clients', 'Avis & commentaires'],
      },
      {
        title: 'Marketing & contenu',
        items: ['Création visuelle', 'Pages & contenus', 'Campagnes'],
      },
      {
        title: 'Paramètres',
        items: ['Modules & abonnement'],
      },
    ]);
  });

  it('does not expose retired or duplicate entries', () => {
    const labels = getVisibleNavigationSections(allCapabilities).flatMap(
      (section) => section.items.map((item) => item.label),
    );

    expect(labels).not.toContain('Commandes');
    expect(labels).not.toContain('Fidélité');
    expect(labels).not.toContain('Promotions');
    expect(labels).not.toContain('Emails');
    expect(labels).not.toContain('Rôles & accès');
    expect(labels).not.toContain('Restaurant');
    expect(labels).not.toContain('Salle & disponibilités');
    expect(labels).not.toContain('Carte & menus');
  });

  it('filters server-derived permissions and module entitlements', () => {
    const sections = getVisibleNavigationSections({
      bookingEnabled: false,
      reputationEnabled: false,
      canManageBookingSettings: false,
      canManageUsers: false,
    });
    const labels = sections.flatMap((section) =>
      section.items.map((item) => item.label),
    );

    expect(labels).not.toContain('Réservations');
    expect(labels).not.toContain('Salle & tables');
    expect(labels).not.toContain('Horaires & services');
    expect(labels).not.toContain('Avis & commentaires');
    expect(labels).not.toContain('Utilisateurs & accès');
    expect(labels).toContain('Informations générales');
    expect(sections.map((section) => section.title)).not.toContain(
      'Réservations',
    );
  });

  it('shows hours only when booking and settings access are both available', () => {
    const sections = getVisibleNavigationSections({
      ...allCapabilities,
      canManageBookingSettings: false,
    });
    const establishment = sections.find(
      (section) => section.title === 'Établissement',
    );

    expect(establishment?.items.map((item) => item.label)).toEqual([
      'Informations générales',
      'Salle & tables',
    ]);
  });

  it('keeps establishment content out of marketing and settings', () => {
    const sections = getVisibleNavigationSections(allCapabilities);
    const marketing = sections.find(
      (section) => section.title === 'Marketing & contenu',
    );
    const settings = sections.find((section) => section.title === 'Paramètres');

    expect(marketing?.items.map((item) => item.label)).toEqual([
      'Création visuelle',
      'Pages & contenus',
      'Campagnes',
    ]);
    expect(settings?.items.map((item) => item.label)).toEqual([
      'Modules & abonnement',
    ]);
  });

  it('selects the most specific active route', () => {
    const sections = getVisibleNavigationSections(allCapabilities);

    expect(
      getActiveNavigationHref('/establishment/hours-services', sections),
    ).toBe('/establishment/hours-services');
    expect(
      getActiveNavigationHref('/operations/reservations/booking-1', sections),
    ).toBe('/operations/reservations');
  });

  it('uses canonical routes that match each owning group', () => {
    const items = backofficeNavigationSections.flatMap((section) =>
      section.items.map((item) => [item.label, item.href] as const),
    );

    expect(Object.fromEntries(items)).toMatchObject({
      'Informations générales': '/establishment/general-information',
      'Salle & tables': '/establishment/rooms-tables',
      'Horaires & services': '/establishment/hours-services',
      'Utilisateurs & accès': '/team/users-access',
    });
  });
});
