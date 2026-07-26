import type { Metadata } from 'next';
import {
  InformationSection,
  MarketingPage,
} from '../../../components/marketing/MarketingShell';

export const metadata: Metadata = {
  title: 'Intégration Google Business Profile',
  description:
    'Découvrez comment YUTA se connecte aux établissements Google autorisés pour synchroniser les avis et publier les réponses validées par le restaurateur.',
  alternates: {
    canonical: '/integrations/google-business-profile',
  },
  openGraph: {
    url: '/integrations/google-business-profile',
    title: 'Intégration Google Business Profile | YUTA',
    description:
      'Comprenez la connexion OAuth, les données utilisées et la validation des réponses dans YUTA.',
    images: ['/opengraph-image'],
  },
};

export default function GoogleIntegrationPage() {
  return (
    <MarketingPage
      eyebrow="Intégrations"
      title="Connectez Google Business Profile à YUTA"
      intro="YUTA permet aux restaurateurs de connecter les établissements qu’ils gèrent, de synchroniser leurs avis et de publier uniquement les réponses qu’ils ont validées."
    >
      <InformationSection title="Comment fonctionne la connexion">
        <ol className="list-decimal space-y-3 pl-5">
          <li>
            Vous choisissez de connecter Google depuis les paramètres YUTA.
          </li>
          <li>
            Google affiche les autorisations demandées avant votre accord.
          </li>
          <li>Vous sélectionnez les établissements que YUTA peut gérer.</li>
          <li>YUTA synchronise les avis associés à ces établissements.</li>
        </ol>
        <p>
          L’authentification est effectuée par Google OAuth 2.0. Votre mot de
          passe Google n’est jamais communiqué à YUTA.
        </p>
      </InformationSection>

      <InformationSection title="Données utilisées">
        <ul className="list-disc space-y-2 pl-5">
          <li>Identifiant du compte Google Business Profile autorisé.</li>
          <li>
            Liste des établissements accessibles et établissements sélectionnés.
          </li>
          <li>
            Avis, notes, dates et réponses associés aux établissements
            sélectionnés.
          </li>
          <li>
            Jetons OAuth nécessaires au maintien de la connexion sécurisée.
          </li>
        </ul>
        <p>
          YUTA n’utilise pas ces données à des fins publicitaires et ne vend pas
          les données Google de ses utilisateurs.
        </p>
      </InformationSection>

      <InformationSection title="Validation des réponses">
        <p>
          Une suggestion peut être préparée pour aider le restaurant, mais elle
          n’est jamais publiée automatiquement. Un utilisateur autorisé doit
          relire, modifier si nécessaire et valider chaque réponse avant sa
          publication sur Google.
        </p>
      </InformationSection>

      <InformationSection title="Retirer l’accès">
        <p>
          Vous pouvez déconnecter Google depuis les paramètres YUTA ou révoquer
          l’autorisation depuis les paramètres de sécurité de votre compte
          Google. Vous pouvez également demander la suppression des données
          synchronisées en écrivant à tampm@yutapro.fr.
        </p>
      </InformationSection>
    </MarketingPage>
  );
}
