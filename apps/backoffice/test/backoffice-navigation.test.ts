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
      { title: 'Accueil', items: ['Aujourd’hui'] },
      {
        title: 'Réservations',
        items: ['Réservations', 'Paramètres de réservation'],
      },
      {
        title: 'Établissement',
        items: [
          'Informations générales',
          'Horaires & services',
          'Salle & tables',
          'Carte & menus',
          'Ressources internes',
        ],
      },
      {
        title: 'Stock',
        items: [
          'Inventaire',
          'Mouvements de stock',
          'Fiches techniques',
          'Fournisseurs',
        ],
      },
      {
        title: 'Gestion de l’équipe',
        items: [
          'Salariés',
          'Planning',
          'Pointage',
          'Tâches du jour',
          'Formalités du personnel',
        ],
      },
      { title: 'Conformité', items: ['Veille & conformité'] },
      {
        title: 'Visibilité & réputation',
        items: ['Satisfaction client', 'Avis & commentaires'],
      },
      {
        title: 'Marketing & contenu',
        items: ['Créations visuelles', 'Création de contenus'],
      },
      {
        title: 'Paramètres',
        items: ['Modules & abonnement', 'Utilisateurs & accès'],
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
    expect(labels).not.toContain('Campagnes');
    expect(labels).not.toContain('Clients');
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
    expect(labels).not.toContain('Paramètres de réservation');
    expect(labels).not.toContain('Salle & tables');
    expect(labels).not.toContain('Horaires & services');
    expect(labels).not.toContain('Avis & commentaires');
    expect(labels).not.toContain('Satisfaction client');
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
      'Carte & menus',
      'Ressources internes',
    ]);
  });

  it('keeps establishment content out of marketing and settings', () => {
    const sections = getVisibleNavigationSections(allCapabilities);
    const marketing = sections.find(
      (section) => section.title === 'Marketing & contenu',
    );
    const settings = sections.find((section) => section.title === 'Paramètres');

    expect(marketing?.items.map((item) => item.label)).toEqual([
      'Créations visuelles',
      'Création de contenus',
    ]);
    expect(settings?.items.map((item) => item.label)).toEqual([
      'Modules & abonnement',
      'Utilisateurs & accès',
    ]);
  });

  it('selects the most specific active route', () => {
    const sections = getVisibleNavigationSections(allCapabilities);

    expect(
      getActiveNavigationHref('/etablissement/horaires-services', sections),
    ).toBe('/etablissement/horaires-services');
    expect(
      getActiveNavigationHref('/operations/reservations/booking-1', sections),
    ).toBe('/operations/reservations');
  });

  it('uses canonical routes that match each owning group', () => {
    const items = backofficeNavigationSections.flatMap((section) =>
      section.items.map((item) => [item.label, item.href] as const),
    );

    expect(Object.fromEntries(items)).toMatchObject({
      'Informations générales': '/etablissement/informations-generales',
      'Horaires & services': '/etablissement/horaires-services',
      'Salle & tables': '/etablissement/salles-tables',
      'Carte & menus': '/etablissement/carte-menus',
      'Ressources internes': '/etablissement/ressources-internes',
      'Paramètres de réservation': '/operations/reservations/parametres',
      'Fiches techniques': '/stock/fiches-techniques',
      Salariés: '/equipe/salaries',
      'Formalités du personnel': '/equipe/formalites-personnel',
      'Satisfaction client': '/clients/satisfaction',
      'Utilisateurs & accès': '/parametres/utilisateurs-acces',
    });
  });
});
