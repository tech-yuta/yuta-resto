'use client';

import {
  Badge,
  Button,
  Card,
  IconButton,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
  cn,
} from '@yuta/ui';
import {
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  Clock3,
  Files,
  ImagePlus,
  Lightbulb,
  Megaphone,
  MessageCircleMore,
  MoreHorizontal,
  Pencil,
  Plus,
  Settings,
  Shuffle,
  Smartphone,
  Sparkles,
  UtensilsCrossed,
  WandSparkles,
} from 'lucide-react';
import Image from 'next/image';
import { useState, type ComponentType } from 'react';

const tabs = [
  'Accueil',
  'Modèles',
  'Mes créations',
  'Planification',
  'Bibliothèque',
] as const;
const filters = [
  'Tous',
  'Promotion',
  'Nouveau plat',
  'Événement',
  'Happy hour',
  'Livraison',
  'Saisonnier',
];

type FormatCard = {
  title: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
  tone: string;
};

const formatCards: FormatCard[] = [
  {
    title: 'Affiche / Promotion',
    description: 'Promotions, offres spéciales, événements',
    icon: Megaphone,
    tone: 'bg-surface-selected text-brand-800',
  },
  {
    title: 'Réseaux sociaux',
    description: 'Facebook, Instagram, LinkedIn, TikTok',
    icon: MessageCircleMore,
    tone: 'bg-status-danger-soft text-status-danger',
  },
  {
    title: 'Menu du jour',
    description: 'Menu, ardoise, suggestions du chef',
    icon: UtensilsCrossed,
    tone: 'bg-status-warning-soft text-status-warning',
  },
  {
    title: 'Story / Reel',
    description: 'Stories Instagram, Reels, TikTok',
    icon: Smartphone,
    tone: 'bg-status-success-soft text-status-success',
  },
  {
    title: 'Autre format',
    description: 'Flyer, bannière, carte, etc.',
    icon: Files,
    tone: 'bg-status-info-soft text-status-info',
  },
];

const popularTemplates = [
  {
    image: '/creative-studio/bao-poster.png',
    eyebrow: 'HAPPY HOUR',
    title: '-20%',
    detail: '17H – 19H',
    dark: true,
  },
  {
    image: '/creative-studio/pho-poster.png',
    eyebrow: 'NOUVEAU',
    title: 'PHỞ BÒ',
    detail: 'Découvrez notre recette',
    dark: true,
  },
  {
    image: '/creative-studio/menu-poster.png',
    eyebrow: 'MENU',
    title: 'DU JOUR',
    detail: 'MARDI · 16,90 €',
    dark: false,
  },
  {
    image: '/creative-studio/rolls-poster.png',
    eyebrow: 'SUMMER',
    title: 'ROLLS',
    detail: 'Frais, légers & maison',
    dark: false,
  },
  {
    image: '/creative-studio/pho-poster.png',
    eyebrow: 'SOIRÉE',
    title: 'STREET FOOD',
    detail: 'Vendredi · à partir de 19h',
    dark: true,
  },
];

const recentCreations = [
  {
    image: '/creative-studio/bao-poster.png',
    status: 'Planifiée',
    title: 'Offre étudiants – Mai',
    format: '1080 × 1350 · Instagram post',
    meta: 'Planifiée le 16/05 à 12:00',
  },
  {
    image: '/creative-studio/pho-poster.png',
    status: 'Brouillon',
    title: 'Nouveau Banh Mi',
    format: '1080 × 1080 · Instagram post',
    meta: 'Modifié il y a 2 heures',
  },
  {
    image: '/creative-studio/bao-poster.png',
    status: 'Planifiée',
    title: 'Happy Hour Cocktails',
    format: '1080 × 1920 · Story',
    meta: 'Planifiée le 18/05 à 18:00',
  },
  {
    image: '/creative-studio/rolls-poster.png',
    status: 'Publié',
    title: 'Menu du jour – 12/05',
    format: '1080 × 1080 · Instagram post',
    meta: 'Publié le 12/05 à 11:30',
  },
  {
    image: '/creative-studio/menu-poster.png',
    status: 'Brouillon',
    title: 'Fête des mères',
    format: '1080 × 1350 · Instagram post',
    meta: 'Modifié il y a 1 jour',
  },
];

export function CreativeStudioPage() {
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>('Accueil');
  const [activeFilter, setActiveFilter] = useState('Tous');
  const [format, setFormat] = useState('Portrait');
  const [visualType, setVisualType] = useState('promotion');
  const [prompt, setPrompt] = useState(
    'Annonce pour notre Happy Hour :\n-20% sur tous les cocktails de 17h à 19h,\ndu lundi au jeudi.\nAmbiance chaleureuse et moderne.\nInclure notre logo.',
  );

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-black tracking-tight">
              Création visuelle
            </h1>
            <Badge tone="brand" variant="soft">
              IA
            </Badge>
          </div>
          <p className="mt-1 text-sm text-secondary">
            Générez des visuels professionnels avec l&apos;IA, selon le style de
            votre restaurant.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" size="lg">
            <CircleHelp className="h-4 w-4" />
            Guide d&apos;utilisation
          </Button>
          <Button variant="secondary" size="lg">
            <Settings className="h-4 w-4" />
            Paramètres de style
          </Button>
        </div>
      </header>

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <Card padding="none" className="min-w-0 overflow-hidden">
          <nav
            className="flex overflow-x-auto border-b border-border-default px-3"
            aria-label="Sections création visuelle"
          >
            {tabs.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={cn(
                  'relative min-w-max px-5 py-4 text-sm font-semibold text-secondary',
                  activeTab === tab && 'text-brand-800',
                )}
              >
                {tab}
                {activeTab === tab && (
                  <span className="absolute inset-x-3 bottom-0 h-0.5 bg-action-primary" />
                )}
              </button>
            ))}
          </nav>

          {activeTab === 'Accueil' ? (
            <div className="space-y-6 p-4">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 min-[1400px]:grid-cols-5">
                {formatCards.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.title}
                      type="button"
                      className="flex min-h-24 gap-3 rounded-lg border border-border-default bg-surface p-3 text-left transition hover:border-border-strong hover:bg-surface-muted"
                    >
                      <span
                        className={cn(
                          'grid h-10 w-10 shrink-0 place-items-center rounded-full',
                          item.tone,
                        )}
                      >
                        <Icon className="h-5 w-5" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-bold">
                          {item.title}
                        </span>
                        <span className="mt-1 block text-xs leading-5 text-muted">
                          {item.description}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>

              <section>
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <h2 className="text-lg font-black">Modèles populaires</h2>
                    <button
                      type="button"
                      className="text-sm font-semibold text-brand-800"
                    >
                      Voir tous les modèles
                    </button>
                  </div>
                  <Button variant="secondary" size="sm">
                    Trier par : Populaires
                  </Button>
                </div>
                <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
                  {filters.map((filter) => (
                    <button
                      key={filter}
                      type="button"
                      onClick={() => setActiveFilter(filter)}
                      className={cn(
                        'min-w-max rounded-full px-3 py-1.5 text-xs font-semibold',
                        activeFilter === filter
                          ? 'bg-surface-selected text-brand-800 ring-1 ring-brand-500'
                          : 'bg-surface-muted text-secondary',
                      )}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3 min-[1400px]:grid-cols-5">
                  {popularTemplates.map((template, index) => (
                    <TemplateCard
                      key={`${template.title}-${index}`}
                      {...template}
                    />
                  ))}
                </div>
              </section>

              <section>
                <div className="mb-4 flex items-center gap-3">
                  <h2 className="text-lg font-black">Mes créations récentes</h2>
                  <button
                    type="button"
                    className="text-sm font-semibold text-brand-800"
                  >
                    Voir toutes mes créations
                  </button>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 min-[1400px]:grid-cols-5">
                  {recentCreations.map((creation) => (
                    <RecentCreationCard
                      key={creation.title}
                      creation={creation}
                    />
                  ))}
                </div>
              </section>
            </div>
          ) : (
            <div className="grid min-h-[580px] place-items-center p-8 text-center">
              <div>
                <ImagePlus className="mx-auto h-10 w-10 text-muted" />
                <h2 className="mt-4 text-lg font-bold">{activeTab}</h2>
                <p className="mt-1 text-sm text-muted">
                  Cette section sera alimentée par vos prochains visuels.
                </p>
              </div>
            </div>
          )}
        </Card>

        <div className="space-y-4 xl:sticky xl:top-4">
          <GeneratorPanel
            prompt={prompt}
            setPrompt={setPrompt}
            format={format}
            setFormat={setFormat}
            visualType={visualType}
            setVisualType={setVisualType}
          />
          <Card className="relative overflow-hidden bg-surface-selected">
            <div className="max-w-[240px]">
              <p className="font-bold">Besoin d&apos;inspiration ?</p>
              <p className="mt-1 text-sm text-secondary">
                Découvrez des idées adaptées à votre restaurant et à la saison.
              </p>
              <Button variant="secondary" size="sm" className="mt-4">
                Voir les idées <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <Lightbulb className="absolute -bottom-3 right-4 h-20 w-20 text-brand-500/40" />
          </Card>
        </div>
      </div>
    </div>
  );
}

function TemplateCard({
  image,
  eyebrow,
  title,
  detail,
  dark,
}: (typeof popularTemplates)[number]) {
  return (
    <button
      type="button"
      className="group relative aspect-[4/5] overflow-hidden rounded-lg border border-border-default text-left shadow-sm"
    >
      <Image
        src={image}
        alt=""
        fill
        sizes="(max-width: 768px) 50vw, 220px"
        className="object-cover transition duration-300 group-hover:scale-105"
      />
      <span
        className={cn(
          'absolute inset-0',
          dark ? 'bg-neutral-950/35' : 'bg-white/10',
        )}
      />
      <span
        className={cn(
          'absolute inset-x-0 top-0 block p-4',
          dark ? 'text-inverse' : 'text-primary',
        )}
      >
        <span className="block text-xs font-bold tracking-widest">
          {eyebrow}
        </span>
        <span className="mt-1 block text-2xl font-black leading-none md:text-3xl">
          {title}
        </span>
        <span className="mt-3 block text-[10px] font-bold uppercase tracking-wide">
          {detail}
        </span>
      </span>
      <span
        className={cn(
          'absolute bottom-3 left-4 text-[10px] font-black tracking-widest',
          dark ? 'text-inverse' : 'text-primary',
        )}
      >
        LUNA
      </span>
    </button>
  );
}

function RecentCreationCard({
  creation,
}: {
  creation: (typeof recentCreations)[number];
}) {
  const tone =
    creation.status === 'Planifiée'
      ? 'success'
      : creation.status === 'Publié'
        ? 'info'
        : 'neutral';
  return (
    <div className="overflow-hidden rounded-lg border border-border-default bg-surface">
      <div className="relative aspect-[4/5] overflow-hidden">
        <Image
          src={creation.image}
          alt=""
          fill
          sizes="(max-width: 768px) 100vw, 220px"
          className="object-cover"
        />
        <Badge tone={tone} size="sm" className="absolute left-2 top-2">
          {creation.status}
        </Badge>
      </div>
      <div className="p-3">
        <p className="truncate text-sm font-bold">{creation.title}</p>
        <p className="mt-1 truncate text-xs text-muted">{creation.format}</p>
        <div className="mt-3 flex items-center justify-between gap-2 text-[11px] text-muted">
          <span className="flex min-w-0 items-center gap-1 truncate">
            {creation.status === 'Publié' ? (
              <CheckCircle2 className="h-3 w-3 text-status-success" />
            ) : creation.status === 'Planifiée' ? (
              <CalendarDays className="h-3 w-3" />
            ) : (
              <Clock3 className="h-3 w-3" />
            )}
            <span className="truncate">{creation.meta}</span>
          </span>
          <IconButton aria-label="Plus d'actions" variant="ghost" size="sm">
            <MoreHorizontal className="h-4 w-4" />
          </IconButton>
        </div>
      </div>
    </div>
  );
}

function GeneratorPanel({
  prompt,
  setPrompt,
  format,
  setFormat,
  visualType,
  setVisualType,
}: {
  prompt: string;
  setPrompt(value: string): void;
  format: string;
  setFormat(value: string): void;
  visualType: string;
  setVisualType(value: string): void;
}) {
  return (
    <Card padding="none" className="overflow-hidden">
      <div className="border-b border-border-default p-4">
        <h2 className="flex items-center gap-2 font-black text-brand-800">
          <Sparkles className="h-5 w-5" /> Générer un visuel avec l&apos;IA
        </h2>
      </div>
      <div className="space-y-5 p-4">
        <div>
          <label
            className="mb-2 block text-sm font-bold"
            htmlFor="visual-prompt"
          >
            1. Décrivez votre visuel
          </label>
          <Textarea
            id="visual-prompt"
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            rows={7}
            maxLength={800}
          />
          <p className="mt-1 text-right text-[11px] text-muted">
            {prompt.length} / 800
          </p>
          <Button
            variant="secondary"
            size="sm"
            className="mt-2"
            onClick={() =>
              setPrompt(
                'Annoncez notre menu du jour avec une ambiance fraîche, moderne et gourmande. Inclure notre logo.',
              )
            }
          >
            <Shuffle className="h-4 w-4" /> Idée aléatoire
          </Button>
        </div>

        <div>
          <p className="mb-2 text-sm font-bold">2. Style de votre restaurant</p>
          <div className="rounded-lg border border-border-default p-3">
            <div className="flex items-center gap-3">
              <div className="relative h-10 w-10 overflow-hidden rounded-lg">
                <Image
                  src="/creative-studio/bao-poster.png"
                  alt="Style Luna"
                  fill
                  sizes="40px"
                  className="object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold">
                  LUNA Street Food Viet
                </p>
                <div
                  className="mt-2 flex gap-2"
                  aria-label="Palette de couleurs"
                >
                  {[
                    'bg-neutral-950',
                    'bg-brand-200',
                    'bg-status-danger',
                    'bg-status-warning',
                    'bg-neutral-100',
                  ].map((color) => (
                    <span
                      key={color}
                      className={cn('h-4 w-4 rounded-full', color)}
                    />
                  ))}
                </div>
              </div>
            </div>
            <button
              type="button"
              className="mt-3 flex items-center gap-1 text-sm font-semibold text-brand-800"
            >
              <Pencil className="h-4 w-4" /> Modifier le style
            </button>
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-bold">3. Format</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 2xl:grid-cols-2">
            {[
              ['Carré', '1080 × 1080'],
              ['Portrait', '1080 × 1350'],
              ['Story', '1080 × 1920'],
              ['Paysage', '1200 × 628'],
            ].map(([name, size]) => (
              <button
                key={name}
                type="button"
                onClick={() => setFormat(name)}
                className={cn(
                  'rounded-lg border p-3 text-center',
                  format === name
                    ? 'border-brand-500 bg-surface-selected text-brand-800'
                    : 'border-border-default bg-surface',
                )}
              >
                <span className="block text-sm font-bold">{name}</span>
                <span className="mt-1 block text-[10px] text-muted">
                  {size}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-bold">
            4. Type de visuel
          </label>
          <Select value={visualType} onValueChange={setVisualType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="promotion">Promotion / Offre</SelectItem>
              <SelectItem value="menu">Menu du jour</SelectItem>
              <SelectItem value="event">Événement</SelectItem>
              <SelectItem value="social">Publication sociale</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <p className="mb-2 text-sm font-bold">
            5. Éléments à inclure{' '}
            <span className="font-normal text-muted">(optionnel)</span>
          </p>
          <div className="flex flex-wrap gap-2">
            <Badge tone="neutral">Logo du restaurant</Badge>
            <Badge tone="neutral">Photo de cocktail</Badge>
            <IconButton
              aria-label="Ajouter un élément"
              variant="secondary"
              size="sm"
            >
              <Plus className="h-4 w-4" />
            </IconButton>
          </div>
        </div>

        <Button fullWidth size="lg">
          <WandSparkles className="h-5 w-5" /> Générer mes visuels
        </Button>
        <p className="-mt-3 text-xs text-muted">
          Générations restantes : 48 ce mois-ci
        </p>
      </div>
    </Card>
  );
}
