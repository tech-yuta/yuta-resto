import type { Metadata } from 'next';
import {
  InformationSection,
  MarketingPage,
} from '../../components/marketing/MarketingShell';

export const metadata: Metadata = {
  title: {
    absolute: 'Contacter YUTA | Démonstration et assistance',
  },
  description:
    'Contactez YUTA pour présenter les besoins de votre restaurant, demander une démonstration ou obtenir une assistance.',
  alternates: {
    canonical: '/contact',
  },
  openGraph: {
    url: '/contact',
    title: 'Contacter YUTA | Démonstration et assistance',
    description:
      'Présentez les besoins de votre restaurant ou demandez une démonstration de YUTA.',
    images: ['/opengraph-image'],
  },
};

export default function ContactPage() {
  return (
    <MarketingPage
      eyebrow="Contact"
      title="Parlons de votre restaurant"
      intro="Pour une démonstration, une question produit ou une demande relative à vos données, contactez directement l’équipe YUTA."
    >
      <InformationSection title="Nous écrire">
        <p>
          Adresse e-mail :{' '}
          <a
            href="mailto:tampm@yutapro.fr"
            className="font-semibold text-status-success underline underline-offset-4"
          >
            tampm@yutapro.fr
          </a>
        </p>
        <p>
          Pour une démonstration, indiquez le nom du restaurant, sa ville et le
          nombre d’établissements à connecter.
        </p>
      </InformationSection>
    </MarketingPage>
  );
}
