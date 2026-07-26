import type { Metadata } from 'next';
import {
  InformationSection,
  MarketingPage,
} from '../../components/marketing/MarketingShell';

export const metadata: Metadata = {
  title: 'Gestion et suppression des données',
  description:
    'Connecter, déconnecter et demander la suppression de ses données dans YUTA.',
  alternates: {
    canonical: '/gestion-des-donnees',
  },
  openGraph: {
    url: '/gestion-des-donnees',
    title: 'Gestion et suppression des données | YUTA',
    description:
      'Découvrez comment retirer une connexion et demander la suppression de données dans YUTA.',
    images: ['/opengraph-image'],
  },
};

export default function DataManagementPage() {
  return (
    <MarketingPage
      eyebrow="Données"
      title="Gestion et suppression des données"
      intro="YUTA vous permet de contrôler les établissements connectés, les autorisations Google et les données synchronisées."
      layout="legal"
      navigation={[
        { id: 'deconnecter-google', label: 'Déconnecter Google' },
        { id: 'demander-suppression', label: 'Demander une suppression' },
        { id: 'donnees-supprimees', label: 'Ce qui est supprimé' },
      ]}
    >
      <InformationSection id="deconnecter-google" title="Déconnecter Google">
        <p>
          Depuis les paramètres d’intégration YUTA, utilisez l’action de
          déconnexion du compte Google. Vous pouvez aussi révoquer YUTA depuis
          la page des connexions tierces de votre compte Google. La révocation
          empêche tout nouvel accès.
        </p>
      </InformationSection>

      <InformationSection
        id="demander-suppression"
        title="Demander une suppression"
      >
        <p>
          Envoyez votre demande depuis l’adresse associée à votre compte YUTA à
          tampm@yutapro.fr. Indiquez l’organisation et les établissements
          concernés afin que l’équipe puisse vérifier votre autorité et traiter
          la demande en sécurité.
        </p>
      </InformationSection>

      <InformationSection id="donnees-supprimees" title="Ce qui est supprimé">
        <p>
          La demande peut couvrir la connexion Google, les établissements
          associés, les avis synchronisés, les brouillons et les données
          opérationnelles liées au compte. Certaines traces de sécurité ou
          obligations légales peuvent imposer une conservation limitée, qui sera
          expliquée lorsqu’elle s’applique.
        </p>
      </InformationSection>
    </MarketingPage>
  );
}
