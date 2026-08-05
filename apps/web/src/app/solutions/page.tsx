import type { Metadata } from 'next';
import { Badge, Card, IconTile } from '@yuta/ui';
import { ArrowRight, Boxes, Gauge, MessageCircle, Users } from 'lucide-react';
import Link from 'next/link';
import {
  MarketingButton,
  MarketingShell,
} from '../../components/marketing/MarketingShell';
import { PublicContainer } from '../../components/marketing/PublicContainer';

export const metadata: Metadata = {
  title: 'Solutions de gestion pour restaurants',
  description:
    'Découvrez les outils YUTA pour la relation client, les opérations, les équipes, les stocks, la conformité et le pilotage quotidien de votre restaurant.',
  alternates: {
    canonical: '/solutions',
  },
  openGraph: {
    url: '/solutions',
    title: 'Solutions de gestion pour restaurants | YUTA',
    description:
      'Des modules complémentaires pour organiser la relation client, les opérations, l’équipe et le pilotage du restaurant.',
    images: ['/opengraph-image'],
  },
};

const pillars = [
  {
    id: 'relation-client',
    title: 'Relation client',
    problem:
      'Les avis, réservations et échanges clients arrivent par plusieurs canaux et demandent un suivi régulier.',
    workflow:
      'YUTA rassemble progressivement ces informations par établissement et aide à préparer les actions à traiter.',
    modules: ['Avis & commentaires', 'Réservations', 'Fidélisation'],
    icon: MessageCircle,
  },
  {
    id: 'operations',
    title: 'Opérations',
    problem:
      'Les stocks, fournisseurs, produits et procédures doivent rester à jour sans alourdir chaque service.',
    workflow:
      'Les informations opérationnelles sont structurées dans des espaces partagés, avec des priorités faciles à retrouver.',
    modules: [
      'Stocks & fournisseurs',
      'Produits & menus',
      'Procédures & conformité',
    ],
    icon: Boxes,
  },
  {
    id: 'equipe',
    title: 'Équipe',
    problem:
      'Un planning change, une nouvelle personne arrive et les consignes doivent circuler rapidement.',
    workflow:
      'YUTA vise à réunir planning, tâches et supports d’intégration autour du même établissement.',
    modules: ['Planning', 'Tâches', 'Formation & intégration'],
    icon: Users,
  },
  {
    id: 'pilotage-developpement',
    title: 'Pilotage & développement',
    problem:
      'Piloter l’activité et préparer la communication prend du temps lorsque les données et contenus sont dispersés.',
    workflow:
      'Des tableaux de bord et assistants ciblés aident à préparer les décisions et les contenus, sous contrôle humain.',
    modules: ['Tableaux de bord', 'Création visuelle', 'Communication'],
    icon: Gauge,
  },
];

export default function SolutionsPage() {
  return (
    <MarketingShell>
      <section className="w-full py-14 sm:py-20">
        <PublicContainer>
          <div className="max-w-3xl">
            <Badge tone="success">Suite modulaire</Badge>
            <h1 className="mt-5 text-4xl font-bold tracking-tight sm:text-5xl">
              Des outils adaptés au quotidien de votre restaurant
            </h1>
            <p className="mt-6 text-lg leading-8 text-secondary">
              YUTA organise ses outils autour des grandes responsabilités d’un
              établissement. Chaque module répond à un problème précis et
              s’intègre progressivement au même environnement de travail.
            </p>
          </div>
        </PublicContainer>
      </section>

      <section className="w-full bg-surface-muted py-16">
        <PublicContainer>
          <div className="grid gap-6 md:grid-cols-2">
            {pillars.map((pillar) => {
              const Icon = pillar.icon;
              return (
                <Card
                  key={pillar.id}
                  id={pillar.id}
                  radius="lg"
                  className="scroll-mt-28 shadow-none"
                >
                  <IconTile tone="success" size="lg">
                    <Icon className="h-6 w-6" />
                  </IconTile>
                  <h2 className="mt-5 text-2xl font-bold">{pillar.title}</h2>
                  <h3 className="mt-5 text-base font-bold">
                    Le problème opérationnel
                  </h3>
                  <p className="mt-2 leading-7 text-secondary">
                    {pillar.problem}
                  </p>
                  <h3 className="mt-5 text-base font-bold">
                    Le fonctionnement visé
                  </h3>
                  <p className="mt-2 leading-7 text-secondary">
                    {pillar.workflow}
                  </p>
                  <ul className="mt-5 flex flex-wrap gap-2">
                    {pillar.modules.map((module) => (
                      <li key={module}>
                        <Badge tone="neutral">{module}</Badge>
                      </li>
                    ))}
                  </ul>
                </Card>
              );
            })}
          </div>
          <div className="mt-8 rounded-2xl border border-border-default bg-surface p-6">
            <h2 className="text-xl font-bold">Un déploiement progressif</h2>
            <p className="mt-3 max-w-3xl leading-7 text-secondary">
              Les modules ne sont pas tous disponibles au même moment. YUTA
              indique leur état réel et permet de commencer avec les fonctions
              utiles, sans présenter la feuille de route comme un produit déjà
              livré.
            </p>
            <MarketingButton asChild variant="success" className="mt-6">
              <Link href="/solutions/avis-commentaires">
                Découvrir le module pilote Avis & commentaires
                <ArrowRight className="h-4 w-4" />
              </Link>
            </MarketingButton>
          </div>
        </PublicContainer>
      </section>
    </MarketingShell>
  );
}
