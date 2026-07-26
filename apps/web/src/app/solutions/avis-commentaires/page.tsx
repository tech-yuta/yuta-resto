import type { Metadata } from 'next';
import { Card } from '@yuta/ui';
import {
  ArrowRight,
  CheckCircle2,
  MessageCircle,
  PencilLine,
  RefreshCcw,
  ShieldCheck,
} from 'lucide-react';
import Link from 'next/link';
import {
  InformationSection,
  MarketingButton,
  MarketingPage,
} from '../../../components/marketing/MarketingShell';

export const metadata: Metadata = {
  title: 'Gestion des avis clients pour restaurants',
  description:
    'Centralisez les avis de votre établissement, préparez des réponses personnalisées et gardez le contrôle avant chaque publication.',
  alternates: {
    canonical: '/solutions/avis-commentaires',
  },
  openGraph: {
    url: '/solutions/avis-commentaires',
    title: 'Gestion des avis clients pour restaurants | YUTA',
    description:
      'Centralisez les avis de votre établissement et préparez des réponses personnalisées avec YUTA.',
    images: ['/opengraph-image'],
  },
};

export default function ReviewsSolutionPage() {
  return (
    <MarketingPage
      eyebrow="Module pilote · Relation client"
      title="Mieux gérer les avis et les retours clients"
      intro="YUTA aide le restaurateur à retrouver les avis de ses établissements, à préparer une réponse adaptée et à garder la validation avant chaque publication."
    >
      <InformationSection title="Le problème au quotidien">
        <p>
          Consulter plusieurs fiches, repérer les nouveaux avis et répondre avec
          le bon ton prend du temps. Une réponse trop rapide ou générique peut
          aussi nuire à la relation avec le client.
        </p>
      </InformationSection>

      <InformationSection title="Un flux de travail clair">
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            {
              title: 'Synchroniser',
              text: 'Les avis des établissements autorisés sont regroupés dans YUTA.',
              icon: RefreshCcw,
            },
            {
              title: 'Préparer',
              text: 'Une suggestion tient compte du contenu de l’avis et du contexte disponible.',
              icon: MessageCircle,
            },
            {
              title: 'Modifier',
              text: 'Le restaurateur adapte librement le ton et le contenu.',
              icon: PencilLine,
            },
            {
              title: 'Valider',
              text: 'La réponse n’est publiée qu’après une action explicite de l’utilisateur.',
              icon: CheckCircle2,
            },
          ].map((step) => {
            const Icon = step.icon;
            return (
              <Card key={step.title} className="shadow-none">
                <Icon className="h-5 w-5 text-status-success" />
                <h3 className="mt-4 font-bold">{step.title}</h3>
                <p className="mt-2 text-base leading-7 text-secondary">
                  {step.text}
                </p>
              </Card>
            );
          })}
        </div>
      </InformationSection>

      <InformationSection title="Ce que vous contrôlez">
        <p className="flex gap-3">
          <ShieldCheck className="mt-1 h-5 w-5 shrink-0 text-status-success" />
          Vous choisissez les établissements connectés, vous pouvez modifier
          chaque suggestion, vous décidez de la publication et vous pouvez
          retirer l’autorisation Google à tout moment.
        </p>
      </InformationSection>

      <InformationSection title="Une partie de l’environnement YUTA">
        <p>
          Le module Avis & commentaires appartient au pilier Relation client.
          À terme, il partage le contexte de l’établissement avec les autres
          modules utiles au suivi quotidien.
        </p>
        <div className="flex flex-wrap gap-3">
          <MarketingButton asChild variant="success">
            <Link href="/integrations/google-business-profile">
              Comprendre l’intégration Google
              <ArrowRight className="h-4 w-4" />
            </Link>
          </MarketingButton>
          <MarketingButton asChild variant="outline">
            <Link href="/contact?subject=demo">Demander une démonstration</Link>
          </MarketingButton>
        </div>
      </InformationSection>
    </MarketingPage>
  );
}
