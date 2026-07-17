'use client';

import {
  Avatar,
  Badge,
  Button,
  Card,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  IconButton,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
  cn,
} from '@yuta/ui';
import {
  Bot,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Clock3,
  ExternalLink,
  FilePenLine,
  Filter,
  Gauge,
  MessageCircle,
  MoreHorizontal,
  RefreshCw,
  Search,
  Send,
  Settings,
  Sparkles,
  Star,
  ThumbsUp,
  X,
} from 'lucide-react';
import { useMemo, useState, type ComponentType } from 'react';

type ReviewStatus = 'À traiter' | 'Brouillon' | 'Répondu';
type Sentiment = 'Positif' | 'Neutre' | 'Négatif';
type Platform = 'Google' | 'Instagram' | 'Facebook';

type Review = {
  id: string;
  platform: Platform;
  author: string;
  initials: string;
  rating?: number;
  time: string;
  text: string;
  status: ReviewStatus;
  sentiment: Sentiment;
  tags: string[];
  history: string;
};

const reviews: Review[] = [
  {
    id: 'AV-018',
    platform: 'Google',
    author: 'Julie Bernard',
    initials: 'JB',
    rating: 2,
    time: 'Il y a 12 min',
    text: 'Très déçue, j’ai attendu 50 minutes pour trois bao à emporter. Les bao étaient bons mais il y avait très peu de viande.',
    status: 'À traiter',
    sentiment: 'Négatif',
    tags: ['Attente', 'Quantité', 'À emporter'],
    history: '12 avis · 3 photos',
  },
  {
    id: 'AV-017',
    platform: 'Instagram',
    author: 'Thomas Leroy',
    initials: 'TL',
    time: 'Il y a 1 h',
    text: 'Ça donne vraiment envie 😍 À très bientôt !',
    status: 'Brouillon',
    sentiment: 'Positif',
    tags: ['Commentaire'],
    history: '8 interactions',
  },
  {
    id: 'AV-016',
    platform: 'Facebook',
    author: 'Sophie Martin',
    initials: 'SM',
    rating: 5,
    time: 'Il y a 2 h',
    text: "Super expérience ! Le bún bò est délicieux et l'équipe très accueillante.",
    status: 'À traiter',
    sentiment: 'Positif',
    tags: ['Accueil', 'Cuisine'],
    history: '4 avis',
  },
  {
    id: 'AV-015',
    platform: 'Google',
    author: 'Marc Dupont',
    initials: 'MD',
    rating: 3,
    time: 'Il y a 3 h',
    text: 'Bon restaurant mais un peu cher pour la quantité. Le service est correct.',
    status: 'À traiter',
    sentiment: 'Neutre',
    tags: ['Prix', 'Quantité'],
    history: '6 avis',
  },
  {
    id: 'AV-014',
    platform: 'Instagram',
    author: 'Chloé Petit',
    initials: 'CP',
    time: 'Il y a 5 h',
    text: 'Votre banh mi est incroyable !!! 😍 Quel pain croustillant !',
    status: 'Répondu',
    sentiment: 'Positif',
    tags: ['Commentaire'],
    history: '15 interactions',
  },
  {
    id: 'AV-013',
    platform: 'Google',
    author: 'Antoine R.',
    initials: 'AR',
    rating: 1,
    time: 'Hier',
    text: 'Commande annulée sans prévenir. Très mauvaise expérience.',
    status: 'À traiter',
    sentiment: 'Négatif',
    tags: ['Livraison', 'Service'],
    history: '2 avis',
  },
  {
    id: 'AV-012',
    platform: 'Facebook',
    author: 'Lucie Bernard',
    initials: 'LB',
    rating: 4,
    time: 'Hier',
    text: 'Très bon accueil et plats savoureux. Je reviendrai !',
    status: 'À traiter',
    sentiment: 'Positif',
    tags: ['Accueil', 'Cuisine'],
    history: '7 avis',
  },
];

const sentimentTones: Record<Sentiment, 'success' | 'neutral' | 'danger'> = {
  Positif: 'success',
  Neutre: 'neutral',
  Négatif: 'danger',
};

const statusTones: Record<ReviewStatus, 'brand' | 'warning' | 'success'> = {
  'À traiter': 'brand',
  Brouillon: 'warning',
  Répondu: 'success',
};

const platformConfig: Record<Platform, { logo: string; className: string }> = {
  Google: { logo: 'G', className: 'bg-surface text-status-info' },
  Instagram: {
    logo: 'IG',
    className: 'bg-status-danger-soft text-status-danger',
  },
  Facebook: { logo: 'f', className: 'bg-status-info text-inverse' },
};

const metrics: Array<{
  label: string;
  value: string;
  helper: string;
  icon: ComponentType<{ className?: string }>;
  tone: string;
}> = [
  {
    label: 'À traiter',
    value: '18',
    helper: '+6 depuis hier',
    icon: MessageCircle,
    tone: 'bg-surface-selected text-brand-800',
  },
  {
    label: 'Brouillons',
    value: '4',
    helper: '-1 depuis hier',
    icon: FilePenLine,
    tone: 'bg-status-success-soft text-status-success',
  },
  {
    label: 'Répondus',
    value: '126',
    helper: '+14 cette semaine',
    icon: Send,
    tone: 'bg-status-info-soft text-status-info',
  },
  {
    label: 'Note moyenne',
    value: '4,6 / 5',
    helper: '+0,1 ce mois',
    icon: Star,
    tone: 'bg-status-warning-soft text-status-warning',
  },
  {
    label: 'Taux de réponse',
    value: '87 %',
    helper: '+5 % ce mois',
    icon: Gauge,
    tone: 'bg-status-success-soft text-status-success',
  },
  {
    label: 'Temps moyen réponse',
    value: '3 h 24',
    helper: '-1 h ce mois',
    icon: Clock3,
    tone: 'bg-status-success-soft text-status-success',
  },
];

const reviewTabs = [
  { value: 'À traiter', label: 'À traiter', count: 18 },
  { value: 'Brouillon', label: 'Brouillons', count: 4 },
  { value: 'Répondu', label: 'Répondus', count: 126 },
  { value: 'all', label: 'Tous', count: 152 },
  { value: 'internal', label: 'Avis internes', count: 7 },
] as const;

const defaultReply = `Bonjour Julie,

Nous sommes sincèrement désolés pour cette attente beaucoup trop longue.
Nous comprenons parfaitement votre déception, surtout concernant la quantité de viande.

Nous allons revoir ce point avec notre équipe pour améliorer notre organisation et offrir une meilleure expérience, même quand il y a beaucoup de commandes.

Merci d’avoir pris le temps de nous faire ce retour, cela nous aide vraiment à progresser.
Au plaisir de vous accueillir à nouveau dans de meilleures conditions !

L’équipe YuTa`;

export function ReviewsPage() {
  const [activeTab, setActiveTab] =
    useState<(typeof reviewTabs)[number]['value']>('À traiter');
  const [source, setSource] = useState('all');
  const [rating, setRating] = useState('all');
  const [sentiment, setSentiment] = useState('all');
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState('AV-018');
  const [reply, setReply] = useState(defaultReply);

  const filteredReviews = useMemo(
    () =>
      reviews.filter((review) => {
        const normalizedQuery = query.trim().toLocaleLowerCase('fr');
        const matchesTab =
          activeTab === 'all' ||
          activeTab === 'internal' ||
          review.status === activeTab;
        return (
          matchesTab &&
          (source === 'all' || review.platform === source) &&
          (rating === 'all' || review.rating === Number(rating)) &&
          (sentiment === 'all' || review.sentiment === sentiment) &&
          `${review.author} ${review.text}`
            .toLocaleLowerCase('fr')
            .includes(normalizedQuery)
        );
      }),
    [activeTab, query, rating, sentiment, source],
  );

  const selectedReview =
    reviews.find((review) => review.id === selectedId) ?? reviews[0];

  return (
    <div className="flex w-full flex-col gap-5">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight">
            Avis &amp; commentaires
          </h1>
          <p className="mt-1 text-sm text-secondary">
            Centralisez et répondez aux retours de vos clients sur tous vos
            canaux.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" size="lg">
            <RefreshCw className="h-4 w-4" />
            Actualiser
          </Button>
          <Button variant="secondary" size="lg">
            <Settings className="h-4 w-4" />
            Paramètres IA
          </Button>
          <Button size="lg">
            <Filter className="h-4 w-4" />
            Filtres avancés
          </Button>
        </div>
      </header>
      <Card
        padding="none"
        className="grid grid-cols-2 overflow-hidden md:grid-cols-3 xl:grid-cols-6"
      >
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <div
              key={metric.label}
              className="flex min-w-0 items-center gap-3 border-b border-r border-border-default p-4 xl:border-b-0"
            >
              <div
                className={cn(
                  'grid h-11 w-11 shrink-0 place-items-center rounded-full',
                  metric.tone,
                )}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-secondary">
                  {metric.label}
                </p>
                <p className="text-xl font-black">{metric.value}</p>
                <p
                  className={cn(
                    'truncate text-xs',
                    metric.label === 'À traiter'
                      ? 'text-status-danger'
                      : 'text-status-success',
                  )}
                >
                  {metric.helper}
                </p>
              </div>
            </div>
          );
        })}
      </Card>
      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(440px,0.9fr)]">
        <Card padding="none" className="overflow-hidden">
          <nav
            className="flex overflow-x-auto border-b border-border-default px-3"
            aria-label="Statut des avis"
          >
            {reviewTabs.map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => setActiveTab(tab.value)}
                className={cn(
                  'relative flex min-w-max items-center gap-2 px-4 py-4 text-sm font-semibold text-secondary',
                  activeTab === tab.value && 'text-brand-800',
                )}
              >
                {tab.label}
                <Badge size="sm">{tab.count}</Badge>
                {activeTab === tab.value && (
                  <span className="absolute inset-x-2 bottom-0 h-0.5 bg-action-primary" />
                )}
              </button>
            ))}
          </nav>
          <div className="grid gap-2 border-b border-border-default p-4 sm:grid-cols-2 lg:grid-cols-[150px_150px_170px_minmax(180px,1fr)_auto]">
            <Select value={source} onValueChange={setSource}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les sources</SelectItem>
                <SelectItem value="Google">Google</SelectItem>
                <SelectItem value="Instagram">Instagram</SelectItem>
                <SelectItem value="Facebook">Facebook</SelectItem>
              </SelectContent>
            </Select>
            <Select value={rating} onValueChange={setRating}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les notes</SelectItem>
                {[5, 4, 3, 2, 1].map((value) => (
                  <SelectItem key={value} value={String(value)}>
                    {value} étoiles
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sentiment} onValueChange={setSentiment}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les sentiments</SelectItem>
                <SelectItem value="Positif">Positif</SelectItem>
                <SelectItem value="Neutre">Neutre</SelectItem>
                <SelectItem value="Négatif">Négatif</SelectItem>
              </SelectContent>
            </Select>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Rechercher un avis, un client..."
                className="pl-10"
              />
            </div>
            <IconButton
              variant="secondary"
              aria-label="Réinitialiser les filtres"
              onClick={() => {
                setSource('all');
                setRating('all');
                setSentiment('all');
                setQuery('');
              }}
            >
              <Filter className="h-4 w-4" />
            </IconButton>
          </div>
          <ReviewsList
            reviews={filteredReviews}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
        </Card>
        <ReviewWorkspace
          review={selectedReview}
          reply={reply}
          onReplyChange={setReply}
        />
      </div>
    </div>
  );
}

function ReviewsList({
  reviews: items,
  selectedId,
  onSelect,
}: {
  reviews: Review[];
  selectedId: string;
  onSelect(id: string): void;
}) {
  return (
    <>
      <div className="divide-y divide-border-default">
        {items.map((review, index) => (
          <div
            key={review.id}
            role="button"
            tabIndex={0}
            onClick={() => onSelect(review.id)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                onSelect(review.id);
              }
            }}
            className={cn(
              'grid w-full gap-3 p-4 text-left transition-colors hover:bg-surface-muted sm:grid-cols-[auto_130px_minmax(0,1fr)_auto]',
              review.id === selectedId &&
                'bg-surface-selected ring-1 ring-inset ring-focus-ring',
            )}
          >
            <div className="flex items-start gap-3">
              <PlatformLogo platform={review.platform} />
              <Avatar
                fallback={review.initials}
                size="sm"
                className={
                  index % 2 === 0
                    ? 'bg-status-danger-soft text-status-danger'
                    : 'bg-surface-selected text-brand-800'
                }
              />
            </div>
            <div>
              <p className="font-bold">{review.author}</p>
              {review.rating ? (
                <StarRating value={review.rating} />
              ) : (
                <Badge tone="brand" size="sm" className="mt-1">
                  Commentaire
                </Badge>
              )}
              <p className="mt-1 text-xs text-muted">{review.time}</p>
            </div>
            <div className="min-w-0">
              <p className="line-clamp-2 text-sm leading-5 text-secondary">
                {review.text}
              </p>
              <div className="mt-2 flex flex-wrap gap-1">
                {review.tags.map((tag) => (
                  <Badge key={tag} size="sm">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Badge tone={statusTones[review.status]}>{review.status}</Badge>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <IconButton
                    size="sm"
                    aria-label={`Actions pour ${review.author}`}
                    onClick={(event) => event.stopPropagation()}
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </IconButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>Voir le profil</DropdownMenuItem>
                  <DropdownMenuItem>Marquer comme répondu</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem destructive>Ignorer</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        ))}
      </div>
      {items.length === 0 && (
        <div className="p-16 text-center">
          <MessageCircle className="mx-auto h-8 w-8 text-muted" />
          <p className="mt-3 font-semibold">Aucun avis trouvé</p>
        </div>
      )}
      <footer className="flex flex-col gap-3 border-t border-border-default px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm">
          <strong>1 à {items.length}</strong> sur 18 avis
        </p>
        <div className="flex gap-2">
          <IconButton
            variant="secondary"
            size="sm"
            aria-label="Première page"
            disabled
          >
            <ChevronsLeft className="h-4 w-4" />
          </IconButton>
          <IconButton
            variant="secondary"
            size="sm"
            aria-label="Page précédente"
            disabled
          >
            <ChevronLeft className="h-4 w-4" />
          </IconButton>
          <Button size="sm" className="w-9 px-0">
            1
          </Button>
          <Button variant="secondary" size="sm" className="w-9 px-0">
            2
          </Button>
          <Button variant="secondary" size="sm" className="w-9 px-0">
            3
          </Button>
          <IconButton variant="secondary" size="sm" aria-label="Page suivante">
            <ChevronRight className="h-4 w-4" />
          </IconButton>
          <IconButton variant="secondary" size="sm" aria-label="Dernière page">
            <ChevronsRight className="h-4 w-4" />
          </IconButton>
        </div>
      </footer>
    </>
  );
}

function ReviewWorkspace({
  review,
  reply,
  onReplyChange,
}: {
  review: Review;
  reply: string;
  onReplyChange(value: string): void;
}) {
  return (
    <Card padding="none" className="overflow-hidden xl:sticky xl:top-0">
      <div className="flex items-center justify-between border-b border-border-default p-4">
        <div className="flex items-center gap-3">
          <PlatformLogo platform={review.platform} />
          <div>
            <p className="font-bold">{review.platform}</p>
            <p className="text-xs text-muted">Avis public</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm">
            Ouvrir sur {review.platform}
            <ExternalLink className="h-4 w-4" />
          </Button>
          <IconButton size="sm" aria-label="Fermer l'avis">
            <X className="h-5 w-5" />
          </IconButton>
        </div>
      </div>
      <div className="p-4">
        <div className="rounded-lg border border-border-default">
          <div className="flex flex-wrap items-center gap-3 border-b border-border-default p-4">
            <Avatar
              fallback={review.initials}
              size="md"
              className="bg-status-danger-soft text-status-danger"
            />
            <div className="flex-1">
              <p className="font-bold">{review.author}</p>
              <p className="text-sm text-muted">{review.history}</p>
            </div>
            {review.rating && <StarRating value={review.rating} />}
            <span className="text-xs text-muted">{review.time}</span>
          </div>
          <p className="p-4 text-sm leading-6">{review.text}</p>
        </div>
      </div>
      <section className="border-t border-border-default p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="inline-flex items-center gap-2 font-bold text-brand-800">
            <Sparkles className="h-4 w-4" />
            Analyse IA
          </h3>
          <span className="text-xs text-muted">
            Mis à jour à l&apos;instant
          </span>
        </div>
        <div className="rounded-lg border border-border-default p-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-xs text-muted">Sentiment</p>
              <Badge tone={sentimentTones[review.sentiment]} className="mt-2">
                {review.sentiment}
              </Badge>
            </div>
            <div className="sm:col-span-2">
              <p className="text-xs text-muted">Thèmes détectés</p>
              <div className="mt-2 flex flex-wrap gap-1">
                {review.tags.map((tag) => (
                  <Badge key={tag} tone="brand">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-xs text-muted">Résumé</p>
            <p className="mt-1 text-sm">
              Le client apprécie le goût des plats mais est déçu par le temps
              d&apos;attente et la quantité servie.
            </p>
          </div>
          <div className="mt-3 flex items-center gap-2 text-sm text-status-success">
            <ThumbsUp className="h-4 w-4" />
            Goût des plats
          </div>
        </div>
      </section>
      <section className="border-t border-border-default p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="inline-flex items-center gap-2 font-bold text-brand-800">
            <Bot className="h-4 w-4" />
            Réponse suggérée par l&apos;IA
          </h3>
          <Select defaultValue="warm">
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="warm">Chaleureux</SelectItem>
              <SelectItem value="soft">Plus doux</SelectItem>
              <SelectItem value="direct">Plus direct</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <ReplyControls />
        <Textarea
          value={reply}
          onChange={(event) => onReplyChange(event.target.value)}
          className="min-h-52 border-focus-ring leading-6"
        />
        <div className="mt-1 flex items-center justify-between text-xs text-muted">
          <span>Généré par l&apos;IA. Vérifiez toujours avant de publier.</span>
          <span>{reply.length} / 1000</span>
        </div>
        <div className="mt-3 flex gap-2">
          <Input placeholder="Demander une modification à l’IA..." />
          <IconButton variant="secondary" aria-label="Envoyer la demande">
            <Send className="h-4 w-4" />
          </IconButton>
        </div>
      </section>
      <div className="grid grid-cols-2 gap-3 border-t border-border-default p-4">
        <Button variant="secondary">Enregistrer en brouillon</Button>
        <Button>
          <Send className="h-4 w-4" />
          Publier la réponse
          <ChevronDown className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
}

function ReplyControls() {
  return (
    <div className="mb-3 grid gap-2 text-xs">
      <div className="flex flex-wrap items-center gap-2">
        <span className="w-16 text-muted">Ajuster le ton</span>
        {[
          'Plus chaleureux',
          'Plus doux',
          'Plus professionnel',
          'Plus direct',
        ].map((label, index) => (
          <Button
            key={label}
            variant={index === 0 ? 'primary' : 'secondary'}
            size="sm"
            className="h-7 px-2 text-[11px]"
          >
            {label}
          </Button>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="w-16 text-muted">Format</span>
        {[
          'Plus court',
          'Plus détaillé',
          'Reformuler',
          'Corriger le français',
        ].map((label, index) => (
          <Button
            key={label}
            variant={index === 0 ? 'primary' : 'secondary'}
            size="sm"
            className="h-7 px-2 text-[11px]"
          >
            {label}
          </Button>
        ))}
      </div>
    </div>
  );
}

function PlatformLogo({ platform }: { platform: Platform }) {
  const config = platformConfig[platform];
  return (
    <span
      className={cn(
        'grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-black shadow-xs',
        config.className,
      )}
    >
      {config.logo}
    </span>
  );
}
function StarRating({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-0.5">
      <span className="mr-1 text-xs font-bold">{value.toFixed(1)}</span>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            'h-3.5 w-3.5',
            star <= value
              ? 'fill-status-rating text-status-rating'
              : 'text-border-strong',
          )}
        />
      ))}
    </div>
  );
}
