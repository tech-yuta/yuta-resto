import type { Metadata } from 'next';
import {
  InformationSection,
  MarketingPage,
} from '../../components/marketing/MarketingShell';

export const metadata: Metadata = {
  title: {
    absolute: 'À propos de YUTA | Outils pour restaurateurs',
  },
  description:
    'Découvrez pourquoi YUTA est développé à partir de situations réelles de restauration et comment la plateforme accompagne les besoins quotidiens des établissements.',
  alternates: {
    canonical: '/a-propos',
  },
  openGraph: {
    url: '/a-propos',
    title: 'À propos de YUTA | Outils pour restaurateurs',
    description:
      'Une plateforme développée à partir des situations concrètes rencontrées dans la restauration.',
    images: ['/opengraph-image'],
  },
};

export default function AboutPage() {
  return (
    <MarketingPage
      eyebrow="À propos"
      title="YUTA, développé à partir du terrain"
      intro="YUTA part d’un constat simple : les restaurateurs ont besoin d’outils qui suivent leur manière de travailler, sans ajouter de complexité au service."
    >
      <InformationSection title="Une approche opérationnelle">
        <p>
          Les choix produit partent de situations concrètes : préparer un
          service, transmettre une consigne, suivre une rupture, répondre à un
          client ou vérifier une procédure.
        </p>
      </InformationSection>
      <InformationSection title="Un environnement modulaire">
        <p>
          Plutôt que d’imposer un ensemble figé, YUTA organise les fonctions par
          modules. Chaque établissement peut commencer avec ses besoins
          prioritaires et élargir son environnement progressivement.
        </p>
      </InformationSection>
      <InformationSection title="Une assistance qui reste contrôlable">
        <p>
          L’intelligence artificielle peut résumer, structurer et préparer. Elle
          ne remplace pas le jugement du restaurateur : les actions importantes
          restent vérifiables et validées par une personne autorisée.
        </p>
      </InformationSection>
      <InformationSection title="Construire avec des retours réels">
        <p>
          Le produit évolue à partir de tests, d’observations et de retours
          issus du quotidien de la restauration. Une fonctionnalité n’est
          présentée comme disponible que lorsqu’elle peut réellement être
          utilisée.
        </p>
      </InformationSection>
    </MarketingPage>
  );
}
