import type { Metadata } from 'next';
import {
  InformationSection,
  MarketingPage,
} from '../../components/marketing/MarketingShell';

export const metadata: Metadata = {
  title: {
    absolute: 'YUTA pour les restaurateurs indépendants',
  },
  description:
    'Une suite d’outils modulaires pour centraliser les informations, organiser l’équipe et simplifier la gestion quotidienne d’un restaurant indépendant.',
  alternates: {
    canonical: '/pour-les-restaurateurs',
  },
  openGraph: {
    url: '/pour-les-restaurateurs',
    title: 'YUTA pour les restaurateurs indépendants',
    description:
      'Des outils modulaires pensés pour les réalités quotidiennes des établissements indépendants.',
    images: ['/opengraph-image'],
  },
};

export default function ForRestaurantOwnersPage() {
  return (
    <MarketingPage
      eyebrow="Pour les restaurateurs"
      title="Une plateforme pensée pour les restaurateurs indépendants"
      intro="Un restaurant doit gérer les clients, l’équipe, les produits et les obligations quotidiennes avec des moyens limités. YUTA vise à réunir ces besoins dans un environnement simple et progressif."
    >
      <InformationSection title="Réduire la dispersion">
        <p>
          Les informations vivent souvent dans des messages, tableaux, outils
          spécialisés et documents séparés. YUTA centralise progressivement les
          éléments utiles par établissement afin de limiter les recherches et
          les doubles saisies.
        </p>
      </InformationSection>
      <InformationSection title="Commencer par vos priorités">
        <p>
          Une petite équipe n’a pas besoin d’activer tous les modules dès le
          premier jour. La plateforme est conçue pour démarrer avec un besoin
          concret, puis évoluer au rythme de l’activité.
        </p>
      </InformationSection>
      <InformationSection title="Garder une validation humaine">
        <p>
          L’assistance et l’automatisation servent à préparer le travail. Les
          décisions sensibles, les communications publiques et les actions
          importantes restent sous le contrôle d’un utilisateur autorisé.
        </p>
      </InformationSection>
      <InformationSection title="Pour différents formats de restauration">
        <p>
          L’approche vise les restaurants indépendants, cafés, bistrots,
          établissements de street food, restauration rapide et traiteurs. Les
          workflows restent configurés selon le fonctionnement réel de chaque
          établissement.
        </p>
      </InformationSection>
    </MarketingPage>
  );
}
