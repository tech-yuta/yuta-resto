import type { Metadata } from 'next';
import {
  InformationSection,
  MarketingPage,
} from '../../components/marketing/MarketingShell';

export const metadata: Metadata = {
  title: 'Conditions d’utilisation',
  description: 'Conditions générales d’utilisation du service YUTA.',
  alternates: {
    canonical: '/conditions-utilisation',
  },
  openGraph: {
    url: '/conditions-utilisation',
    title: 'Conditions d’utilisation | YUTA',
    description: 'Consultez les conditions d’utilisation du service YUTA.',
    images: ['/opengraph-image'],
  },
};

export default function TermsPage() {
  return (
    <MarketingPage
      eyebrow="Informations légales"
      title="Conditions d’utilisation"
      intro="Les présentes conditions encadrent l’accès au site et aux fonctionnalités YUTA. Dernière mise à jour : 25 juillet 2026."
      layout="legal"
      navigation={[
        { id: 'objet', label: 'Objet du service' },
        { id: 'compte', label: 'Compte et autorisations' },
        { id: 'suggestions', label: 'Suggestions assistées' },
        { id: 'utilisation', label: 'Utilisation acceptable' },
        { id: 'evolution', label: 'Évolution du service' },
      ]}
    >
      <InformationSection id="objet" title="Objet du service">
        <p>
          YUTA fournit aux professionnels de la restauration des outils de
          gestion, notamment pour centraliser des avis et préparer des réponses.
          Les fonctionnalités indiquées comme étant en développement ne font pas
          encore partie du service disponible.
        </p>
      </InformationSection>

      <InformationSection id="compte" title="Compte et autorisations">
        <p>
          Chaque utilisateur doit utiliser son propre compte, protéger ses accès
          et ne connecter que les établissements qu’il est autorisé à gérer. Le
          propriétaire du profil d’établissement reste responsable des
          informations et réponses publiées.
        </p>
      </InformationSection>

      <InformationSection id="suggestions" title="Suggestions assistées">
        <p>
          Les suggestions de réponse doivent être relues et validées par un
          utilisateur autorisé. YUTA ne garantit pas qu’une suggestion soit
          adaptée à chaque situation et ne publie pas automatiquement une
          réponse sans validation.
        </p>
      </InformationSection>

      <InformationSection id="utilisation" title="Utilisation acceptable">
        <p>
          Le service ne doit pas être utilisé pour accéder à des établissements
          sans autorisation, publier du contenu trompeur ou illicite, contourner
          les règles de Google Business Profile ou porter atteinte aux droits de
          tiers.
        </p>
      </InformationSection>

      <InformationSection id="evolution" title="Évolution du service">
        <p>
          YUTA peut faire évoluer ses fonctionnalités afin d’améliorer le
          produit, sa sécurité ou sa conformité. Les changements importants
          seront communiqués aux utilisateurs concernés.
        </p>
      </InformationSection>
    </MarketingPage>
  );
}
