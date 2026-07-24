'use client';

import type {
  FeedbackSentiment,
  FeedbackSource,
  FeedbackStatus,
  FeedbackUrgency,
} from '@yuta/contracts/reputation';
import {
  Avatar,
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  IconButton,
  Input,
  MetricCard,
  PageHeader,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
  cn,
} from '@yuta/ui';
import {
  AlertTriangle,
  Bot,
  ExternalLink,
  FilePenLine,
  Inbox,
  MessageCircle,
  RefreshCw,
  Search,
  Send,
  Settings,
  Sparkles,
  Star,
  UserRound,
} from 'lucide-react';
import { useMemo, useState } from 'react';

export type ReviewListRecord = {
  id: string;
  source: FeedbackSource;
  authorName: string | null;
  authorAvatarUrl: string | null;
  rating: number | null;
  content: string | null;
  sentiment: FeedbackSentiment | null;
  urgency: FeedbackUrgency | null;
  status: FeedbackStatus;
  receivedAt: string;
  incidentId: string | null;
  replyStatus: string | null;
};

export type ReviewsPageData = {
  state: 'ready' | 'authentication-required' | 'unavailable';
  items: ReviewListRecord[];
  counters: {
    total: number;
    new: number;
    unanswered: number;
    negative: number;
    withIncident: number;
  };
};

const statusLabels: Record<FeedbackStatus, string> = {
  NEW: 'Nouveau',
  TO_PROCESS: 'À traiter',
  DRAFTED: 'Brouillon',
  REPLIED: 'Répondu',
  FOLLOW_UP: 'À suivre',
  RESOLVED: 'Résolu',
  ARCHIVED: 'Archivé',
  SPAM: 'Indésirable',
};

const statusTones: Record<
  FeedbackStatus,
  'neutral' | 'brand' | 'warning' | 'success' | 'danger'
> = {
  NEW: 'brand',
  TO_PROCESS: 'brand',
  DRAFTED: 'warning',
  REPLIED: 'success',
  FOLLOW_UP: 'danger',
  RESOLVED: 'success',
  ARCHIVED: 'neutral',
  SPAM: 'neutral',
};

const sentimentLabels: Record<FeedbackSentiment, string> = {
  POSITIVE: 'Positif',
  NEUTRAL: 'Neutre',
  NEGATIVE: 'Négatif',
};

const sentimentTones: Record<
  FeedbackSentiment,
  'success' | 'neutral' | 'danger'
> = {
  POSITIVE: 'success',
  NEUTRAL: 'neutral',
  NEGATIVE: 'danger',
};

const urgencyLabels: Record<FeedbackUrgency, string> = {
  LOW: 'Faible',
  MEDIUM: 'Moyenne',
  HIGH: 'Haute',
  CRITICAL: 'Critique',
};

function getInitials(name: string | null): string {
  if (!name) return 'A';
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

function formatRelativeDate(value: string): string {
  const date = new Date(value);
  const elapsedMinutes = Math.max(
    1,
    Math.round((Date.now() - date.getTime()) / 60_000),
  );
  if (elapsedMinutes < 60) return `Il y a ${elapsedMinutes} min`;
  const hours = Math.round(elapsedMinutes / 60);
  if (hours < 24) return `Il y a ${hours} h`;
  const days = Math.round(hours / 24);
  return `Il y a ${days} j`;
}

export function ReviewsPage({
  data,
  initialSelectedId,
}: {
  data: ReviewsPageData;
  initialSelectedId?: string;
}) {
  const [source, setSource] = useState<'ALL' | FeedbackSource>('ALL');
  const [status, setStatus] = useState<'ALL' | FeedbackStatus>('ALL');
  const [rating, setRating] = useState('ALL');
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState(
    initialSelectedId &&
      data.items.some((item) => item.id === initialSelectedId)
      ? initialSelectedId
      : (data.items[0]?.id ?? ''),
  );

  const items = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('fr');
    return data.items.filter((item) => {
      return (
        (source === 'ALL' || item.source === source) &&
        (status === 'ALL' || item.status === status) &&
        (rating === 'ALL' || item.rating === Number(rating)) &&
        `${item.authorName ?? ''} ${item.content ?? ''}`
          .toLocaleLowerCase('fr')
          .includes(normalizedQuery)
      );
    });
  }, [data.items, query, rating, source, status]);

  const selected =
    data.items.find((item) => item.id === selectedId) ?? items[0] ?? null;

  return (
    <div className="flex w-full flex-col gap-5">
      <PageHeader
        eyebrow="Clients"
        title="Avis & commentaires"
        description="Centralisez les avis Google et les retours directs de vos clients."
        actions={
          <>
            <Button variant="secondary">
              <RefreshCw className="h-4 w-4" />
              Synchroniser
            </Button>
            <Button variant="secondary">
              <Settings className="h-4 w-4" />
              Paramètres
            </Button>
          </>
        }
      />

      {data.state === 'authentication-required' && (
        <Card padding="none">
          <ErrorState
            title="Session administrateur requise"
            description="Le stockage reputation est prêt, mais les actions admin attendent une session serveur fournissant un utilisateur et un établissement vérifiés."
          />
        </Card>
      )}

      {data.state === 'unavailable' && (
        <Card padding="none">
          <ErrorState
            title="Les avis sont momentanément indisponibles"
            description="Vérifiez la base locale, appliquez la migration et relancez le seed."
          />
        </Card>
      )}

      {data.state === 'ready' && (
        <>
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <MetricCard
              label="Total"
              value={data.counters.total}
              helper="Google et retours directs"
            />
            <MetricCard
              label="Nouveaux"
              value={data.counters.new}
              helper="À consulter"
            />
            <MetricCard
              label="Sans réponse"
              value={data.counters.unanswered}
              helper="Action recommandée"
            />
            <MetricCard
              label="Négatifs"
              value={data.counters.negative}
              helper="À surveiller"
            />
            <MetricCard
              label="Avec incident"
              value={data.counters.withIncident}
              helper="Suivi opérationnel"
            />
          </section>

          <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(420px,0.85fr)]">
            <Card padding="none" className="overflow-hidden">
              <div className="grid gap-2 border-b border-border-default p-4 sm:grid-cols-2 lg:grid-cols-[145px_145px_135px_minmax(180px,1fr)]">
                <Select
                  value={source}
                  onValueChange={(value) =>
                    setSource(value as 'ALL' | FeedbackSource)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Toutes les sources</SelectItem>
                    <SelectItem value="GOOGLE">Google</SelectItem>
                    <SelectItem value="DIRECT">Retour direct</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={status}
                  onValueChange={(value) =>
                    setStatus(value as 'ALL' | FeedbackStatus)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Tous les statuts</SelectItem>
                    {Object.entries(statusLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={rating} onValueChange={setRating}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Toutes les notes</SelectItem>
                    {[5, 4, 3, 2, 1].map((value) => (
                      <SelectItem key={value} value={String(value)}>
                        {value} étoiles
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                  <Input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Rechercher un avis…"
                    className="pl-10"
                  />
                </div>
              </div>

              {items.length === 0 ? (
                <EmptyState
                  icon={<Inbox className="mx-auto h-8 w-8" />}
                  title="Aucun avis trouvé"
                  description="Modifiez les filtres pour afficher d'autres résultats."
                />
              ) : (
                <div className="divide-y divide-border-default">
                  {items.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedId(item.id)}
                      className={cn(
                        'grid w-full gap-3 p-4 text-left transition-colors hover:bg-surface-muted sm:grid-cols-[auto_minmax(0,1fr)_auto]',
                        selected?.id === item.id && 'bg-surface-selected',
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <SourceMark source={item.source} />
                        <Avatar
                          fallback={getInitials(item.authorName)}
                          src={item.authorAvatarUrl}
                          size="sm"
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-bold">
                            {item.authorName ?? 'Client anonyme'}
                          </p>
                          {item.rating && <Rating value={item.rating} />}
                        </div>
                        <p className="mt-1 line-clamp-2 text-sm leading-5 text-secondary">
                          {item.content || 'Aucun commentaire.'}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {item.sentiment && (
                            <Badge
                              size="sm"
                              tone={sentimentTones[item.sentiment]}
                            >
                              {sentimentLabels[item.sentiment]}
                            </Badge>
                          )}
                          {item.incidentId && (
                            <Badge size="sm" tone="danger" variant="outline">
                              Incident
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge tone={statusTones[item.status]}>
                          {statusLabels[item.status]}
                        </Badge>
                        <span className="text-xs text-muted">
                          {formatRelativeDate(item.receivedAt)}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </Card>

            {selected ? (
              <ReviewDetail review={selected} />
            ) : (
              <Card padding="none">
                <EmptyState
                  icon={<MessageCircle className="mx-auto h-8 w-8" />}
                  title="Sélectionnez un avis"
                />
              </Card>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function ReviewDetail({ review }: { review: ReviewListRecord }) {
  const [reply, setReply] = useState(
    review.source === 'GOOGLE'
      ? `Bonjour,\n\nMerci d'avoir pris le temps de partager votre expérience. Votre retour est précieux pour notre équipe.\n\nL'équipe LUNA`
      : '',
  );

  return (
    <Card padding="none" className="overflow-hidden xl:sticky xl:top-0">
      <div className="flex items-center justify-between border-b border-border-default p-4">
        <div className="flex items-center gap-3">
          <SourceMark source={review.source} />
          <div>
            <p className="font-bold">
              {review.source === 'GOOGLE' ? 'Avis Google' : 'Retour direct'}
            </p>
            <p className="text-xs text-muted">
              {formatRelativeDate(review.receivedAt)}
            </p>
          </div>
        </div>
        {review.source === 'GOOGLE' && (
          <IconButton
            variant="ghost"
            aria-label="Ouvrir l'avis sur Google"
          >
            <ExternalLink className="h-4 w-4" />
          </IconButton>
        )}
      </div>

      <section className="p-4">
        <div className="rounded-lg border border-border-default p-4">
          <div className="flex items-center gap-3">
            <Avatar
              fallback={getInitials(review.authorName)}
              src={review.authorAvatarUrl}
            />
            <div className="flex-1">
              <p className="font-bold">
                {review.authorName ?? 'Client anonyme'}
              </p>
              {review.rating && <Rating value={review.rating} />}
            </div>
            <Badge tone={statusTones[review.status]}>
              {statusLabels[review.status]}
            </Badge>
          </div>
          <p className="mt-4 text-sm leading-6">
            {review.content || 'Aucun commentaire.'}
          </p>
        </div>
      </section>

      <section className="border-t border-border-default p-4">
        <h2 className="flex items-center gap-2 font-bold text-brand-800">
          <Sparkles className="h-4 w-4" />
          Analyse
        </h2>
        <div className="mt-3 grid gap-3 rounded-lg bg-surface-muted p-4 sm:grid-cols-2">
          <div>
            <p className="text-xs text-muted">Sentiment</p>
            <div className="mt-2">
              {review.sentiment ? (
                <Badge tone={sentimentTones[review.sentiment]}>
                  {sentimentLabels[review.sentiment]}
                </Badge>
              ) : (
                <Badge>En attente</Badge>
              )}
            </div>
          </div>
          <div>
            <p className="text-xs text-muted">Urgence</p>
            <div className="mt-2">
              {review.urgency ? (
                <Badge
                  tone={
                    review.urgency === 'CRITICAL' ||
                    review.urgency === 'HIGH'
                      ? 'danger'
                      : review.urgency === 'MEDIUM'
                        ? 'warning'
                        : 'neutral'
                  }
                >
                  {urgencyLabels[review.urgency]}
                </Badge>
              ) : (
                <Badge>En attente</Badge>
              )}
            </div>
          </div>
        </div>
        {(review.urgency === 'HIGH' || review.urgency === 'CRITICAL') && (
          <div className="mt-3 flex items-start gap-2 rounded-lg border border-status-danger bg-status-danger-soft p-3 text-sm text-status-danger">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            Une attention managériale est recommandée.
          </div>
        )}
      </section>

      {review.source === 'GOOGLE' ? (
        <section className="border-t border-border-default p-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 font-bold text-brand-800">
              <Bot className="h-4 w-4" />
              Réponse suggérée
            </h2>
            {review.replyStatus && (
              <Badge variant="outline">{review.replyStatus}</Badge>
            )}
          </div>
          <Textarea
            value={reply}
            onChange={(event) => setReply(event.target.value)}
            className="mt-3 min-h-44 leading-6"
          />
          <p className="mt-2 text-xs text-muted">
            Vérifiez toujours le contenu avant publication.
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Button variant="secondary" disabled>
              <FilePenLine className="h-4 w-4" />
              Enregistrer
            </Button>
            <Button disabled>
              <Send className="h-4 w-4" />
              Publier sur Google
            </Button>
          </div>
        </section>
      ) : (
        <section className="border-t border-border-default p-4">
          <Button variant="secondary" fullWidth disabled>
            <UserRound className="h-4 w-4" />
            Créer un incident
          </Button>
        </section>
      )}
    </Card>
  );
}

function SourceMark({ source }: { source: FeedbackSource }) {
  return (
    <span
      className={cn(
        'grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-black',
        source === 'GOOGLE'
          ? 'bg-status-info-soft text-status-info'
          : 'bg-surface-selected text-brand-800',
      )}
      aria-label={source === 'GOOGLE' ? 'Google' : 'Retour direct'}
    >
      {source === 'GOOGLE' ? 'G' : 'D'}
    </span>
  );
}

function Rating({ value }: { value: number }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs font-bold">
      {value.toFixed(1)}
      <Star className="h-3.5 w-3.5 fill-status-rating text-status-rating" />
    </span>
  );
}
