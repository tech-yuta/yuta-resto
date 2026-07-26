import type { Metadata } from 'next';
import {
  InformationSection,
  MarketingPage,
} from '../../components/marketing/MarketingShell';

export const metadata: Metadata = {
  title: 'Mentions légales',
  description: 'Informations relatives à l’édition du site YUTA.',
  alternates: {
    canonical: '/mentions-legales',
  },
  openGraph: {
    url: '/mentions-legales',
    title: 'Mentions légales | YUTA',
    description: 'Informations relatives à l’édition du site public YUTA.',
    images: ['/opengraph-image'],
  },
};

export default function LegalPage() {
  return (
    <MarketingPage
      eyebrow="Informations légales"
      title="Mentions légales"
      intro="Informations relatives au site public YUTA accessible sur yutapro.fr."
      layout="legal"
      navigation={[
        { id: 'editeur', label: 'Éditeur' },
        { id: 'hebergement', label: 'Hébergement' },
        { id: 'propriete', label: 'Propriété intellectuelle' },
        { id: 'google', label: 'Google' },
      ]}
    >
      <InformationSection id="editeur" title="Éditeur">
        <p>Nom du service et de la publication : YUTA.</p>
        <p>Contact du responsable de publication : tampm@yutapro.fr.</p>
      </InformationSection>

      <InformationSection id="hebergement" title="Hébergement">
        <p>
          Le service est exploité sur une infrastructure hébergée en Europe. Les
          coordonnées contractuelles complètes de l’hébergeur seront ajoutées
          avant l’ouverture commerciale du service.
        </p>
      </InformationSection>

      <InformationSection id="propriete" title="Propriété intellectuelle">
        <p>
          Les textes, interfaces, visuels et éléments de marque propres à YUTA
          sont protégés par les droits applicables. Les marques et contenus de
          tiers restent la propriété de leurs titulaires respectifs.
        </p>
      </InformationSection>

      <InformationSection id="google" title="Google">
        <p>
          Google Business Profile est une marque de Google LLC. YUTA est un
          service indépendant, non affilié à Google et non approuvé par Google.
        </p>
      </InformationSection>
    </MarketingPage>
  );
}
