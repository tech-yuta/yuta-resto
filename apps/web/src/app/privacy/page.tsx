import type { Metadata } from 'next';
import {
  InformationSection,
  MarketingPage,
} from '../../components/marketing/MarketingShell';

export const metadata: Metadata = {
  title: 'Politique de confidentialité',
  description:
    'Politique de confidentialité et d’utilisation des données de YUTA.',
  alternates: {
    canonical: '/privacy',
  },
  openGraph: {
    url: '/privacy',
    title: 'Politique de confidentialité | YUTA',
    description:
      'Consultez les engagements de YUTA concernant l’utilisation et le contrôle des données.',
    images: ['/opengraph-image'],
  },
};

export default function PrivacyPage() {
  return (
    <MarketingPage
      eyebrow="Informations légales"
      title="Politique de confidentialité"
      intro="Cette page décrit les données utilisées par YUTA, leur finalité et les moyens dont vous disposez pour garder le contrôle. Dernière mise à jour : 25 juillet 2026."
      layout="legal"
      navigation={[
        { id: 'donnees-concernees', label: 'Données concernées' },
        { id: 'finalites', label: 'Finalités' },
        { id: 'partage', label: 'Partage et utilisation' },
        { id: 'conservation', label: 'Conservation et suppression' },
        { id: 'vos-choix', label: 'Vos choix' },
      ]}
    >
      <InformationSection id="donnees-concernees" title="Données concernées">
        <p>
          YUTA peut traiter les informations de compte nécessaires à
          l’authentification, les établissements autorisés, les avis clients,
          les réponses, les préférences de l’organisation et les événements
          techniques utiles à la sécurité du service.
        </p>
        <p>
          Lorsqu’un compte Google Business Profile est connecté, YUTA traite
          uniquement les données nécessaires aux fonctionnalités présentées sur
          la page consacrée à l’intégration Google.
        </p>
      </InformationSection>

      <InformationSection id="finalites" title="Finalités">
        <ul className="list-disc space-y-2 pl-5">
          <li>Authentifier les utilisateurs et protéger leur espace.</li>
          <li>Afficher les établissements et avis autorisés.</li>
          <li>Préparer, enregistrer et publier les réponses validées.</li>
          <li>Assurer le suivi, l’assistance et la sécurité du service.</li>
        </ul>
      </InformationSection>

      <InformationSection id="partage" title="Partage et utilisation">
        <p>
          YUTA ne vend pas les données personnelles ni les données obtenues par
          les API Google. L’accès est limité aux prestataires techniques
          nécessaires au fonctionnement du service et encadré par leurs
          obligations de sécurité et de confidentialité.
        </p>
      </InformationSection>

      <InformationSection id="conservation" title="Conservation et suppression">
        <p>
          Les données sont conservées pendant la durée nécessaire au
          fonctionnement du compte et au respect des obligations applicables. La
          déconnexion Google met fin aux nouveaux accès. Une demande de
          suppression peut être envoyée à privacy@yutapro.fr et sera traitée en
          tenant compte des sauvegardes, journaux de sécurité et obligations
          légales applicables.
        </p>
      </InformationSection>

      <InformationSection id="vos-choix" title="Vos choix">
        <p>
          Vous pouvez demander l’accès, la rectification ou la suppression des
          données vous concernant, ainsi que retirer une autorisation Google à
          tout moment. Pour exercer ces choix, contactez privacy@yutapro.fr.
        </p>
      </InformationSection>
    </MarketingPage>
  );
}
