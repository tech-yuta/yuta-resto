import type { Metadata } from 'next';
import { Badge, Card, IconTile } from '@yuta/ui';
import {
  ArrowRight,
  BarChart3,
  Bell,
  Boxes,
  CalendarCheck,
  ChartNoAxesColumnIncreasing,
  Check,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Coffee,
  ConciergeBell,
  Database,
  FileCheck2,
  Info,
  ListChecks,
  LockKeyhole,
  MessageCircle,
  MoveRight,
  PackageOpen,
  PencilLine,
  Puzzle,
  Sandwich,
  ShieldCheck,
  ShoppingBag,
  ShoppingBasket,
  Sparkles,
  Store,
  Trash2,
  Truck,
  UserCheck,
  UserRound,
  Users,
  UsersRound,
  Utensils,
  Zap,
} from 'lucide-react';
import Link from 'next/link';
import {
  MarketingFooter,
  MarketingButton,
  MarketingHeader,
} from '../components/marketing/MarketingShell';
import { PublicContainer } from '../components/marketing/PublicContainer';
import Image from 'next/image';

export const metadata: Metadata = {
  title: {
    absolute: 'YUTA — Suite de gestion pour restaurants',
  },
  description:
    'YUTA réunit les outils essentiels pour organiser votre équipe, suivre votre activité, améliorer la relation client et simplifier la gestion quotidienne de votre restaurant.',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    url: '/',
    title: 'YUTA — Suite de gestion pour restaurants',
    description:
      'Une suite d’outils intelligents conçue pour simplifier la gestion quotidienne des restaurants.',
    images: ['/opengraph-image'],
  },
};

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': 'https://yutapro.fr/#organization',
  name: 'YUTA',
  url: 'https://yutapro.fr',
  logo: {
    '@type': 'ImageObject',
    url: 'https://yutapro.fr/images/web-app-manifest-512x512.png',
    width: 512,
    height: 512,
  },
  description:
    'YUTA développe une suite d’outils intelligents pour simplifier la gestion quotidienne des restaurants.',
  email: 'tampm@yutapro.fr',
};

const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': 'https://yutapro.fr/#website',
  url: 'https://yutapro.fr',
  name: 'YUTA',
  inLanguage: 'fr-FR',
  publisher: {
    '@id': 'https://yutapro.fr/#organization',
  },
};

const restaurantTypes = [
  { label: 'Restaurant indépendant', icon: Utensils },
  { label: 'Café', icon: Coffee },
  { label: 'Bistrot', icon: Store },
  { label: 'Street food', icon: Truck },
  { label: 'Traiteur', icon: ConciergeBell },
  { label: 'Restauration rapide', icon: Sandwich },
];

const solutionPillars = [
  {
    id: 'relation-client',
    title: 'Relation client',
    modules: [
      'Fiche client et historique',
      'Réservations',
      'Communications',
      'Avis & commentaires',
    ],
    icon: UserRound,
    iconClassName: 'bg-status-success text-inverse',
    borderClassName: 'border-status-success-border',
    backgroundClassName: 'bg-status-success-soft',
    dotClassName: 'bg-status-success',
  },
  {
    id: 'operations',
    title: 'Opérations',
    modules: [
      'Commandes & ventes',
      'Stocks & inventaires',
      'Fournisseurs',
      'Recettes & fiches produits',
    ],
    icon: ShoppingBag,
    iconClassName: 'bg-status-info text-inverse',
    borderClassName: 'border-status-info-border',
    backgroundClassName: 'bg-status-info-soft',
    dotClassName: 'bg-status-info',
  },
  {
    id: 'equipe',
    title: 'Équipe',
    modules: [
      'Employés',
      'Planning',
      'Rôles & permissions',
      'Tâches & procédures',
    ],
    icon: UsersRound,
    iconClassName: 'bg-brand-500 text-inverse',
    borderClassName: 'border-brand-200',
    backgroundClassName: 'bg-brand-50',
    dotClassName: 'bg-brand-500',
  },
  {
    id: 'pilotage-developpement',
    title: 'Pilotage & développement',
    modules: [
      'Tableaux de bord',
      'Indicateurs clés',
      'Analyses d’activité',
      'Export de données',
    ],
    icon: ChartNoAxesColumnIncreasing,
    iconClassName: 'bg-status-warning text-inverse',
    borderClassName: 'border-status-warning-border',
    backgroundClassName: 'bg-status-warning-soft',
    dotClassName: 'bg-status-warning',
  },
];

const dataPromises = [
  {
    title: 'Connexion sécurisée',
    description:
      'Accès à vos comptes via des autorisations sécurisées comme OAuth 2.0.',
    icon: LockKeyhole,
  },
  {
    title: 'Utilisation limitée',
    description:
      'Vos données sont utilisées uniquement pour les services YUTA que vous activez.',
    icon: Database,
  },
  {
    title: 'Validation humaine',
    description:
      'Aucune action n’est publiée sans votre relecture et votre validation.',
    icon: UserCheck,
  },
  {
    title: 'Retrait et suppression',
    description:
      'Les connexions peuvent être retirées et les données supprimées sur demande.',
    icon: Trash2,
  },
];

const sectionTitleClassName =
  'text-[22px] font-bold leading-[1.25] tracking-[-0.025em]';
const sectionDescriptionClassName =
  'text-[15px] leading-6 text-secondary';
const cardTitleClassName = 'text-[15px] font-bold leading-5';
const cardDescriptionClassName = 'text-[14px] leading-[1.55] text-secondary';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-surface text-primary">
      <MarketingHeader />
      <main className="pb-12">
        <HeroSection />
        <OperationalValueSection />
        <SolutionPillarsSection />
        <PracticalAiSection />
        <ModularPlatformSection />
        <FeaturedReviewsSection />
        <GoogleIntegrationSection />
        <FieldTestedSection />
        <DataControlSection />
        <FinalCtaSection />
      </main>
      <MarketingFooter />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organizationJsonLd).replace(/</g, '\\u003c'),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(websiteJsonLd).replace(/</g, '\\u003c'),
        }}
      />
    </div>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
  centered = true,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  centered?: boolean;
}) {
  return (
    <div className={centered ? 'mx-auto max-w-3xl text-center' : 'max-w-2xl'}>
      {eyebrow ? (
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-status-success">
          {eyebrow}
        </p>
      ) : null}
      <h2 className={`mt-2 ${sectionTitleClassName}`}>
        {title}
      </h2>
      {description ? (
        <p className={`mt-3 ${sectionDescriptionClassName}`}>
          {description}
        </p>
      ) : null}
    </div>
  );
}

function HeroSection() {
  return (
    <section className="relative w-full overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-28 top-12 h-96 w-96 rounded-full bg-brand-100 blur-3xl"
      />
      <PublicContainer className="relative grid gap-9 pb-9 pt-10 lg:grid-cols-[minmax(0,0.88fr)_minmax(0,1.12fr)] lg:items-center lg:gap-10 lg:pb-10 lg:pt-12">
        <div className="max-w-[560px]">
          <Badge
            tone="success"
            className="px-3 py-1 text-[11px] font-semibold tracking-[0.04em] uppercase"
          >
            Suite de gestion pour restaurants
          </Badge>
          <h1 className="mt-6 text-[36px] font-bold leading-[1.1] tracking-[-0.035em] sm:text-[38px] xl:text-[40px]">
            <span className="block">Les outils qui</span>
            <span className="block">simplifient la gestion</span>
            <span className="block text-status-success">
              de votre restaurant.
            </span>
          </h1>
          <p className="mt-5 max-w-[520px] text-[16px] leading-7 text-secondary">
            De la relation client à l’organisation de l’équipe, YUTA centralise
            les informations, automatise les tâches répétitives et aide les
            restaurateurs à mieux piloter leur établissement.
          </p>
          <div className="mt-7 flex flex-col gap-2.5 sm:flex-row">
            <MarketingButton
              asChild
              variant="success"
              size="md"
              className="whitespace-nowrap px-5 text-[14px]"
            >
              <a href="#solutions">
                Découvrir YUTA
                <ArrowRight className="h-4 w-4" />
              </a>
            </MarketingButton>
            <MarketingButton
              asChild
              variant="outline"
              size="md"
              className="whitespace-nowrap px-5 text-[14px]"
            >
              <Link href="/contact?subject=demo">Demander une démo</Link>
            </MarketingButton>
          </div>
          <div className="mt-7 grid gap-3 text-[13px] leading-5 text-secondary sm:grid-cols-[1.1fr_0.9fr_1.1fr] sm:gap-4">
            <span className="flex items-center gap-2.5">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-status-success-soft">
                <Utensils className="h-4 w-4 text-status-success" />
              </span>
              Pensé pour les restaurateurs
            </span>
            <span className="flex items-center gap-2.5">
              <Image
                src="/flags/fr.svg"
                alt=""
                width={32}
                height={24}
                className="h-6 w-8 shrink-0 rounded-sm border border-border-default object-cover shadow-sm"
              />
              Développé en France
            </span>
            <span className="flex items-center gap-2.5">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-status-success-soft">
                <Puzzle className="h-4 w-4 text-status-success" />
              </span>
              Modules selon vos besoins
            </span>
          </div>
        </div>
        <PlatformPreview />
      </PublicContainer>

      <PublicContainer className="pb-7">
        <div className="grid gap-px overflow-hidden rounded-lg border border-border-default bg-border-default shadow-sm sm:grid-cols-2 lg:grid-cols-6">
          {restaurantTypes.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                className="flex min-h-16 items-center justify-center gap-3 bg-surface px-3 py-3"
              >
                <Icon className="h-6 w-6 shrink-0 text-status-success" />
                <span className="whitespace-nowrap text-[12px] font-medium text-secondary">
                  {item.label}
                </span>
              </div>
            );
          })}
        </div>
      </PublicContainer>
    </section>
  );
}

function PlatformPreview() {
  const summaries = [
    {
      label: 'Réservations',
      value: '12',
      helper: 'Aujourd’hui',
      icon: CalendarCheck,
    },
    {
      label: 'Employés en service',
      value: '4',
      helper: 'En ce moment',
      icon: Users,
    },
    {
      label: 'Produits bientôt en rupture',
      value: '3',
      helper: 'À surveiller',
      icon: PackageOpen,
    },
    {
      label: 'Tâches à valider',
      value: '2',
      helper: 'En attente',
      icon: ListChecks,
    },
    {
      label: 'Avis à traiter',
      value: '5',
      helper: 'Nouveaux',
      icon: MessageCircle,
    },
    {
      label: 'Document à vérifier',
      value: '1',
      helper: 'En attente',
      icon: FileCheck2,
    },
  ];

  return (
    <figure className="min-w-0">
      <Card padding="none" radius="lg" className="overflow-hidden shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-default px-4 py-3">
          <div className="flex items-center gap-2">
            <Image
              src="/images/web-app-manifest-192x192.png"
              alt=""
              width={26}
              height={26}
              className="h-6 w-6 object-contain"
            />
            <span className="text-[15px] font-bold">YUTA</span>
          </div>
          <figcaption className="rounded-full bg-surface-muted px-3 py-1 text-[12px] text-muted">
            Aperçu de l’environnement YUTA — données d’illustration
          </figcaption>
        </div>
        <div className="grid md:grid-cols-[150px_1fr]">
          <aside className="hidden border-r border-border-default bg-surface-muted p-3 md:block">
            {[
              { label: 'Accueil', icon: Store },
              { label: 'Clients', icon: Users },
              { label: 'Réservations', icon: CalendarCheck },
              { label: 'Commandes', icon: ShoppingBasket },
              { label: 'Produits & stocks', icon: Boxes },
              { label: 'Équipe', icon: Users },
              { label: 'Planning', icon: ListChecks },
            ].map((item, index) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.label}
                  className={
                    index === 0
                      ? 'mb-1 flex items-center gap-2 rounded-md bg-status-success-soft px-2.5 py-2 text-[13px] font-semibold text-status-success'
                      : 'mb-1 flex items-center gap-2 px-2.5 py-2 text-[13px] font-medium text-secondary'
                  }
                >
                  <Icon className="h-3.5 w-3.5" />
                  {item.label}
                </div>
              );
            })}
          </aside>
          <div className="bg-canvas p-4">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-bold">Établissement de démonstration</p>
                <p className="mt-0.5 text-[13px] text-muted">
                  Vue d’ensemble du jour
                </p>
              </div>
              <Badge variant="outline">Aujourd’hui</Badge>
            </div>
            <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-3">
              {summaries.map((item) => {
                const Icon = item.icon;
                return (
                  <Card key={item.label} padding="sm" className="shadow-none">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[13px] leading-5 text-secondary">
                        {item.label}
                      </p>
                      <Icon className="h-4 w-4 shrink-0 text-status-success" />
                    </div>
                    <p className="mt-2 text-2xl font-bold">{item.value}</p>
                    <p className="mt-1 text-[12px] font-semibold text-status-success">
                      {item.helper}
                    </p>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      </Card>
    </figure>
  );
}

function OperationalValueSection() {
  const benefits = [
    {
      title: 'Centraliser',
      description:
        'Toutes les informations de votre restaurant au même endroit : clients, réservations, commandes, stocks, équipe, tâches et documents.',
      icon: Database,
    },
    {
      title: 'Organiser',
      description:
        'Structurez votre activité avec des processus clairs, des plannings partagés et une répartition des responsabilités visible par tous.',
      icon: Users,
    },
    {
      title: 'Automatiser',
      description:
        'Automatisez les tâches répétitives, les rappels et le suivi pour réduire les oublis et vous concentrer sur l’essentiel.',
      icon: Zap,
    },
  ];

  return (
    <section id="pourquoi-yuta" className="w-full scroll-mt-24 py-7">
      <PublicContainer>
        <h2 className={`text-center ${sectionTitleClassName}`}>
          Moins d’outils dispersés. Plus de temps pour votre restaurant.
        </h2>
        <div className="mt-5 grid gap-5 md:grid-cols-3">
          {benefits.map((item) => {
            const Icon = item.icon;
            return (
              <Card
                key={item.title}
                className="flex min-h-40 items-start gap-5 p-5 shadow-none"
              >
                <IconTile
                  tone="success"
                  shape="circle"
                  size="lg"
                  className="h-14 w-14 shrink-0"
                >
                  <Icon className="h-7 w-7 fill-status-success text-status-success stroke-[1.75]" />
                </IconTile>
                <div className="pt-1">
                  <h3 className={cardTitleClassName}>{item.title}</h3>
                  <p className={`mt-2 ${cardDescriptionClassName}`}>
                    {item.description}
                  </p>
                </div>
              </Card>
            );
          })}
        </div>
      </PublicContainer>
    </section>
  );
}

function SolutionPillarsSection() {
  return (
    <section id="solutions" className="w-full scroll-mt-24 py-7">
      <PublicContainer>
        <h2 className={`text-center ${sectionTitleClassName}`}>
          Un environnement pensé pour le quotidien des restaurateurs
        </h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {solutionPillars.map((pillar) => {
            const Icon = pillar.icon;
            return (
              <Card
                key={pillar.id}
                id={pillar.id}
                radius="lg"
                className={`flex min-h-56 scroll-mt-28 flex-col border ${pillar.borderClassName} ${pillar.backgroundClassName} p-5 shadow-none`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${pillar.iconClassName}`}
                  >
                    <Icon className="h-5 w-5 stroke-[2.25]" />
                  </span>
                  <h3 className={cardTitleClassName}>{pillar.title}</h3>
                </div>
                <ul className="mt-4 grid gap-1.5">
                  {pillar.modules.map((module) => (
                    <li
                      key={module}
                      className="flex items-start gap-2 text-[14px] leading-[1.55] text-secondary"
                    >
                      <ChevronRight className="mt-1 h-3 w-3 shrink-0 text-primary stroke-[2.5]" />
                      {module}
                    </li>
                  ))}
                </ul>
                <p className="mt-auto flex items-center gap-2 pt-4 text-[11px] font-semibold text-muted">
                  <span
                    className={`h-2 w-2 rounded-full ${pillar.dotClassName}`}
                  />
                  Déploiement progressif
                </p>
              </Card>
            );
          })}
        </div>
        <div className="mt-4 flex items-center justify-center gap-3 rounded-lg bg-surface-muted px-5 py-3">
          <Info className="h-4 w-4 shrink-0 text-status-success" />
          <p className="text-[12px] leading-5 text-secondary">
            Les modules sont déployés progressivement. Activez uniquement ce
            dont vous avez besoin aujourd’hui.
          </p>
        </div>
      </PublicContainer>
    </section>
  );
}

function PracticalAiSection() {
  const steps = [
    {
      title: 'Repérer',
      description:
        'YUTA identifie les éléments à traiter : avis, documents, tâches et anomalies.',
      icon: MessageCircle,
    },
    {
      title: 'Proposer',
      description:
        'L’IA propose des suggestions concrètes et rédigées à partir de vos données.',
      icon: Sparkles,
    },
    {
      title: 'Adapter',
      description:
        'Vous relisez et ajustez les propositions selon votre contexte.',
      icon: PencilLine,
    },
    {
      title: 'Valider & agir',
      description:
        'Vous validez, YUTA applique l’action et en garde la trace pour le suivi.',
      icon: CheckCircle2,
    },
  ];

  return (
    <section
      id="intelligence-artificielle"
      className="w-full scroll-mt-24 py-7"
    >
      <PublicContainer>
        <div className="rounded-xl border border-brand-100 bg-gradient-to-r from-brand-50/40 via-surface to-brand-50/40 px-5 py-5 shadow-sm sm:px-7">
          <h2 className={`text-center ${sectionTitleClassName}`}>
            L’intelligence artificielle intégrée aux tâches utiles
          </h2>
          <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-4 xl:gap-7">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.title}
                  className="relative flex items-center gap-4"
                >
                  <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-brand-100 bg-surface">
                    <Icon className="h-7 w-7 text-status-success stroke-[2]" />
                  </span>
                  <div>
                    <h3 className={cardTitleClassName}>{step.title}</h3>
                    <p className={`mt-1.5 ${cardDescriptionClassName}`}>
                      {step.description}
                    </p>
                  </div>
                  {index < steps.length - 1 ? (
                    <MoveRight className="absolute -right-6 top-1/2 z-10 hidden h-5 w-7 -translate-y-1/2 text-brand-500/70 stroke-[1.35] xl:block" />
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </PublicContainer>
    </section>
  );
}

function ModularPlatformSection() {
  const steps = [
    {
      title: 'Choisissez les modules utiles',
      description:
        'Activez uniquement les outils dont votre établissement a besoin.',
    },
    {
      title: 'Configurez vos règles',
      description:
        'Adaptez les services, rôles, alertes et préférences du restaurant.',
    },
    {
      title: 'Ajoutez des outils',
      description:
        'Faites évoluer l’environnement lorsque vos besoins changent.',
    },
  ];

  return (
    <section
      id="plateforme-modulaire"
      className="w-full scroll-mt-24 py-7"
    >
      <PublicContainer>
        <h2 className={`text-center ${sectionTitleClassName}`}>
          Une plateforme qui s’adapte à votre établissement
        </h2>
        <div className="mt-5 grid items-center gap-5 lg:grid-cols-[minmax(0,1fr)_220px]">
          <Card
            radius="lg"
            className="grid gap-5 border-brand-100 bg-surface p-5 shadow-none md:grid-cols-3 md:gap-7"
          >
            {steps.map((step, index) => (
              <div key={step.title} className="relative flex gap-3.5">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-status-success text-[13px] font-bold text-inverse">
                  {index + 1}
                </span>
                <div>
                  <h3 className={cardTitleClassName}>{step.title}</h3>
                  <p className={`mt-1.5 ${cardDescriptionClassName}`}>
                    {step.description}
                  </p>
                </div>
                {index < steps.length - 1 ? (
                  <MoveRight className="absolute -right-5 top-3 hidden h-4 w-6 text-brand-500/50 stroke-[1.25] md:block" />
                ) : null}
              </div>
            ))}
          </Card>
          <PlatformModulesIllustration />
        </div>
      </PublicContainer>
    </section>
  );
}

function PlatformModulesIllustration() {
  const floatingIcons = [
    {
      icon: BarChart3,
      className: 'left-5 top-9',
    },
    {
      icon: MessageCircle,
      className: 'left-1/2 top-0 -translate-x-1/2',
    },
    {
      icon: FileCheck2,
      className: 'right-6 top-9',
    },
    {
      icon: Bell,
      className: 'right-2 top-[5.7rem]',
    },
  ];

  return (
    <div
      aria-hidden="true"
      className="relative mx-auto hidden h-44 w-56 lg:block"
    >
      <div className="absolute bottom-1 left-1/2 h-28 w-48 -translate-x-1/2 rounded-full bg-brand-100/70 blur-2xl" />
      {floatingIcons.map((item, index) => {
        const Icon = item.icon;
        return (
          <span
            key={index}
            className={`absolute z-40 grid h-8 w-8 place-items-center rounded-full border border-brand-100 bg-brand-50 shadow-sm ${item.className}`}
          >
            <Icon className="h-4 w-4 text-status-success stroke-[1.8]" />
          </span>
        );
      })}

      <div className="absolute bottom-0 left-1/2 z-10 h-16 w-40 -translate-x-1/2 drop-shadow-lg">
        <span className="absolute inset-0 bg-brand-50 [clip-path:polygon(50%_0%,100%_25%,50%_50%,0%_25%)]" />
        <span className="absolute inset-0 bg-brand-200 [clip-path:polygon(0%_25%,50%_50%,50%_100%,0%_75%)]" />
        <span className="absolute inset-0 bg-brand-100 [clip-path:polygon(100%_25%,50%_50%,50%_100%,100%_75%)]" />
      </div>

      <div className="absolute bottom-7 left-1/2 z-20 h-20 w-28 -translate-x-1/2 drop-shadow-md">
        <span className="absolute inset-0 bg-surface [clip-path:polygon(50%_0%,100%_25%,50%_50%,0%_25%)]" />
        <span className="absolute inset-0 bg-brand-100 [clip-path:polygon(0%_25%,50%_50%,50%_100%,0%_75%)]" />
        <span className="absolute inset-0 bg-brand-50 [clip-path:polygon(100%_25%,50%_50%,50%_100%,100%_75%)]" />
      </div>

      <div className="absolute bottom-[4.6rem] left-1/2 z-30 h-16 w-16 -translate-x-1/2 drop-shadow-lg">
        <span className="absolute inset-0 bg-brand-500 [clip-path:polygon(50%_0%,100%_25%,50%_50%,0%_25%)]" />
        <span className="absolute inset-0 bg-brand-700 [clip-path:polygon(0%_25%,50%_50%,50%_100%,0%_75%)]" />
        <span className="absolute inset-0 bg-brand-600 [clip-path:polygon(100%_25%,50%_50%,50%_100%,100%_75%)]" />
      </div>
    </div>
  );
}

function FeaturedReviewsSection() {
  const steps = [
    {
      title: 'Avis Google autorisés',
      description:
        'Récupérez les nouveaux avis de vos établissements autorisés.',
      icon: null,
      iconClassName: '',
    },
    {
      title: 'Suggestion par l’IA',
      description: 'Obtenez une proposition de réponse adaptée au contexte.',
      icon: Sparkles,
      iconClassName: 'text-status-info',
    },
    {
      title: 'Édition',
      description: 'Modifiez la réponse proposée pour la personnaliser.',
      icon: PencilLine,
      iconClassName: 'text-status-success',
    },
    {
      title: 'Validation humaine',
      description: 'Validez la réponse avant sa publication sur Google.',
      icon: CheckCircle2,
      iconClassName: 'text-status-success',
    },
  ];

  return (
    <section className="w-full py-7">
      <PublicContainer>
        <div className="grid gap-7 rounded-xl border border-brand-100 bg-gradient-to-r from-brand-50/50 via-surface to-brand-50/30 p-5 lg:grid-cols-[0.62fr_1.38fr] lg:items-center lg:p-6">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-status-success">
                Module en vedette
              </p>
              <Badge tone="brand">Module pilote</Badge>
            </div>
            <h2 className={`mt-3 ${sectionTitleClassName}`}>
              Mieux gérer les avis et les retours clients
            </h2>
            <p className={`mt-3 ${sectionDescriptionClassName}`}>
              Centralisez les avis Google autorisés, préparez des réponses
              adaptées à votre ton et gardez le contrôle avant chaque
              publication.
            </p>
            <MarketingButton
              asChild
              variant="success"
              size="md"
              className="mt-5"
            >
              <Link href="/solutions/avis-commentaires">
                Découvrir Avis & commentaires
                <ArrowRight className="h-4 w-4" />
              </Link>
            </MarketingButton>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 xl:gap-6">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={step.title} className="relative">
                  <Card className="flex min-h-48 h-full flex-col items-center bg-surface p-4 text-center shadow-sm">
                    <h3
                      className={`flex min-h-10 items-center justify-center ${cardTitleClassName}`}
                    >
                      {step.title}
                    </h3>
                    <div className="mt-1 grid h-10 place-items-center">
                      {Icon ? (
                        <Icon
                          className={`h-8 w-8 stroke-[1.8] ${step.iconClassName}`}
                        />
                      ) : (
                        <Image
                          src="/brands/google-g.png"
                          alt="Google"
                          width={32}
                          height={32}
                          className="block h-8 w-8 object-contain"
                        />
                      )}
                    </div>
                    <p className={`mt-3 ${cardDescriptionClassName}`}>
                      {step.description}
                    </p>
                  </Card>
                  {index < steps.length - 1 ? (
                    <MoveRight className="absolute -right-[22px] top-1/2 z-10 hidden h-4 w-5 -translate-y-1/2 text-brand-500/65 stroke-[1.35] xl:block" />
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </PublicContainer>
    </section>
  );
}

function GoogleIntegrationSection() {
  return (
    <section id="integration-google" className="w-full scroll-mt-24 py-7">
      <PublicContainer>
        <div className="grid gap-6 rounded-xl border border-brand-100 bg-gradient-to-r from-brand-50/40 via-surface to-brand-50/30 p-5 lg:grid-cols-[280px_minmax(0,1fr)_190px] lg:items-center lg:gap-6">
          <div className="relative mx-auto h-32 w-[280px]">
            <Image
              src="/images/restaurant-integration.png"
              alt="Équipe préparant le service dans un restaurant"
              width={192}
              height={120}
              className="absolute right-0 top-1/2 h-[118px] w-48 -translate-y-1/2 rounded-l-xl rounded-r-[3rem] object-cover shadow-sm"
            />
            <div className="absolute left-0 top-1/2 z-10 grid h-28 w-28 -translate-y-1/2 place-items-center rounded-full border border-brand-100 bg-surface shadow-md">
              <Image
                src="/brands/google-g.png"
                alt="Google"
                width={58}
                height={58}
                className="h-[58px] w-[58px] object-contain"
              />
              <span className="absolute bottom-0 right-0 grid h-9 w-9 translate-x-1/4 place-items-center rounded-full border-4 border-surface bg-brand-50 shadow-sm">
                <LockKeyhole className="h-4 w-4 text-status-success stroke-[2]" />
              </span>
            </div>
          </div>
          <div>
            <h2 className={sectionTitleClassName}>
              Connectez les établissements que vous gérez sur Google
            </h2>
            <ul className="mt-4 grid gap-2 text-[14px] leading-5 text-secondary">
              {[
                'Connexion sécurisée via Google OAuth 2.0',
                'Sélection des établissements autorisés',
                'Synchronisation des avis associés',
                'Publication après votre validation',
                'Déconnexion possible à tout moment',
              ].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <Check className="h-4 w-4 shrink-0 text-status-success" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <MarketingButton
            asChild
            variant="outline"
            className="w-full justify-between border-status-success px-4 text-left text-[13px] leading-5 text-status-success lg:min-h-16 lg:w-[190px]"
          >
            <Link href="/integrations/google-business-profile">
              <span>Comprendre l’intégration Google Business Profile</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </MarketingButton>
        </div>
        <p className="mt-3 text-center text-[13px] leading-5 text-muted">
          Google Business Profile est une marque de Google LLC. YUTA est un
          service indépendant et n’est ni affilié à, ni approuvé par Google.
        </p>
      </PublicContainer>
    </section>
  );
}

function FieldTestedSection() {
  return (
    <section className="w-full py-7">
      <PublicContainer>
        <div className="grid overflow-hidden rounded-xl border border-brand-100 bg-gradient-to-r from-brand-50/30 via-surface to-surface lg:grid-cols-[0.82fr_1.18fr] lg:items-stretch">
          <Image
            src="/images/restaurant-team-service.png"
            alt="Équipe de restaurant travaillant pendant le service"
            width={720}
            height={420}
            className="h-full min-h-52 w-full object-cover lg:rounded-r-2xl"
          />
          <div className="p-6 lg:px-8 lg:py-7">
            <h2 className={sectionTitleClassName}>
              Pensé avec des restaurateurs, testé sur le terrain
            </h2>
            <p className={`mt-3 ${sectionDescriptionClassName}`}>
              YUTA est développé avec des restaurateurs de tous types. Chaque
              fonctionnalité répond à un besoin concret du quotidien en salle
              et en cuisine.
            </p>
            <div className="mt-6 grid gap-6 sm:grid-cols-3">
              {[
                {
                  title: 'Conçu avec des professionnels de la restauration',
                  icon: Boxes,
                },
                {
                  title: 'Testé dans des conditions réelles d’exploitation',
                  icon: Zap,
                },
                {
                  title: 'Amélioré en continu grâce à vos retours d’expérience',
                  icon: Sparkles,
                },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="flex items-start gap-3">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-50">
                      <Icon className="h-5 w-5 text-status-success stroke-[1.9]" />
                    </span>
                    <p className="pt-0.5 text-[13px] font-semibold leading-5">
                      {item.title}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </PublicContainer>
    </section>
  );
}

function DataControlSection() {
  return (
    <section id="donnees" className="w-full scroll-mt-24 py-7">
      <PublicContainer>
        <div className="rounded-xl border border-brand-100 bg-gradient-to-r from-brand-50/40 via-surface to-brand-50/30 p-5">
          <SectionHeading title="Vous gardez le contrôle de vos données" />
          <div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {dataPromises.map((item) => {
              const Icon = item.icon;
              return (
                <Card key={item.title} className="p-4 shadow-sm">
                  <div className="flex items-center gap-4">
                    <Icon className="h-8 w-8 shrink-0 text-status-success stroke-[1.75]" />
                    <div>
                      <h3 className={cardTitleClassName}>{item.title}</h3>
                      <p className={`mt-1.5 ${cardDescriptionClassName}`}>
                        {item.description}
                      </p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </PublicContainer>
    </section>
  );
}

function FinalCtaSection() {
  return (
    <section className="w-full pt-5">
      <PublicContainer>
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-brand-800 via-brand-700 to-brand-600 px-6 py-5 text-inverse md:px-9">
          <div
            aria-hidden="true"
            className="absolute inset-y-0 left-0 w-24 bg-[radial-gradient(circle,var(--color-brand-300)_1px,transparent_1px)] bg-[length:10px_10px] opacity-35"
          />
          <div
            aria-hidden="true"
            className="absolute inset-y-0 right-0 w-24 bg-[radial-gradient(circle,var(--color-brand-300)_1px,transparent_1px)] bg-[length:10px_10px] opacity-35"
          />
          <div className="relative grid gap-5 md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-center">
            <span className="hidden h-12 w-12 shrink-0 place-items-center rounded-lg bg-surface text-status-success shadow-sm sm:grid">
              <CalendarCheck className="h-6 w-6" />
            </span>
            <div>
              <h2 className="max-w-md text-[18px] font-bold leading-[1.25] tracking-[-0.02em]">
                Un seul environnement pour mieux gérer votre restaurant
              </h2>
              <p className="mt-1.5 text-[13px] leading-5 text-brand-100">
                Centralisez, organisez, automatisez. Avec YUTA, restez concentré
                sur l’essentiel : vos clients et votre cuisine.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <MarketingButton
                asChild
                variant="secondary"
                size="md"
                className="px-5 text-[14px]"
              >
                <Link href="/contact?subject=demo">
                  Demander une démonstration
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </MarketingButton>
              <MarketingButton
                asChild
                variant="outline"
                size="md"
                className="border-brand-200 px-5 text-[14px] text-inverse"
              >
                <Link href="/contact">Nous contacter</Link>
              </MarketingButton>
            </div>
          </div>
        </div>
      </PublicContainer>
    </section>
  );
}
