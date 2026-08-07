'use client';

import type {
  FeedbackSentiment,
  FeedbackSource,
  FeedbackStatus,
  FeedbackUrgency,
} from '@yuta/contracts/reputation';
import type { AssignableReputationUser } from '@yuta/contracts/cloud-admin';
import {
  Avatar,
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  IconButton,
  Input,
  Label,
  MetricCard,
  PageHeader,
  Pagination,
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
  StickyNote,
  UserRound,
} from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useActionState, useEffect, useState, type FormEvent } from 'react';
import { useFormStatus } from 'react-dom';
import {
  createInternalNoteAction,
  saveReplyDraftAction,
  updateFeedbackAction,
  type ReputationActionState,
} from './actions';

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
  assignedToUserId: string | null;
  receivedAt: string;
  incidentId: string | null;
  replyStatus: string | null;
};

export type ReviewDetailRecord = ReviewListRecord & {
  externalUrl: string | null;
  analysis: {
    summary: string;
    topics: string[];
    suggestedAction: string | null;
  } | null;
  latestReply: {
    id: string;
    content: string;
    status: string;
  } | null;
  notes: Array<{
    id: string;
    content: string;
    authorName: string;
    createdAt: string;
  }>;
};

export type ReviewsPageData = {
  state: 'ready' | 'unavailable';
  items: ReviewListRecord[];
  detail: ReviewDetailRecord | null;
  assignableUsers: AssignableReputationUser[];
  query: {
    source: FeedbackSource | null;
    status: FeedbackStatus | null;
    rating: number | null;
    search: string;
    sort:
      | 'newest'
      | 'oldest'
      | 'rating_asc'
      | 'rating_desc'
      | 'urgency_desc'
      | 'unanswered';
  };
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
  counters: {
    total: number;
    new: number;
    unanswered: number;
    negative: number;
    withIncident: number;
  };
  permissions: {
    canManageFeedback: boolean;
    canCreateReply: boolean;
    canCreateNote: boolean;
  };
};

export type ReviewsPageMode = 'all' | 'direct';

const initialActionState: ReputationActionState = {
  error: null,
  success: null,
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

export function ReviewsPage({
  data,
  mode = 'all',
}: {
  data: ReviewsPageData;
  mode?: ReviewsPageMode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const currentSearchParams = useSearchParams();
  const [search, setSearch] = useState(data.query.search);
  const userNames = new Map(
    data.assignableUsers.map((user) => [user.id, user.name]),
  );
  const directOnly = mode === 'direct';

  function updateQuery(
    updates: Record<string, string | number | null>,
    options?: { keepSelected?: boolean },
  ) {
    const params = new URLSearchParams(currentSearchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value === null || value === '' || value === 'ALL') {
        params.delete(key);
      } else {
        params.set(key, String(value));
      }
    }
    if (!options?.keepSelected) params.delete('selected');
    if (!Object.hasOwn(updates, 'page')) params.delete('page');
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    updateQuery({ search });
  }

  return (
    <div className="flex w-full flex-col gap-5">
      <PageHeader
        eyebrow="Visibilité & réputation"
        title={directOnly ? 'Satisfaction client' : 'Avis & commentaires'}
        description={
          directOnly
            ? 'Consultez les avis transmis directement par vos clients sur le web.'
            : 'Centralisez les avis Google et les retours directs de vos clients.'
        }
        actions={
          directOnly ? undefined : (
            <>
              <Button variant="secondary" disabled>
                <RefreshCw className="h-4 w-4" />
                Synchroniser
              </Button>
              <Button variant="secondary" disabled>
                <Settings className="h-4 w-4" />
                Paramètres
              </Button>
            </>
          )
        }
      />

      {data.state === 'unavailable' && (
        <Card padding="none">
          <ErrorState
            title="Les avis sont momentanément indisponibles"
            description="Vérifiez la base locale, appliquez les migrations et relancez le seed."
          />
        </Card>
      )}

      {data.state === 'ready' && (
        <>
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <MetricCard
              label="Total"
              value={data.counters.total}
              helper={
                directOnly ? 'Retours directs' : 'Google et retours directs'
              }
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
              <div
                className={cn(
                  'grid gap-2 border-b border-border-default p-4 sm:grid-cols-2',
                  directOnly
                    ? 'lg:grid-cols-[145px_135px_165px_minmax(180px,1fr)]'
                    : 'lg:grid-cols-[145px_145px_135px_165px_minmax(180px,1fr)]',
                )}
              >
                {!directOnly && (
                  <Select
                    value={data.query.source ?? 'ALL'}
                    onValueChange={(value) => updateQuery({ source: value })}
                  >
                    <SelectTrigger aria-label="Source">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">Toutes les sources</SelectItem>
                      <SelectItem value="GOOGLE">Google</SelectItem>
                      <SelectItem value="DIRECT">Retour direct</SelectItem>
                    </SelectContent>
                  </Select>
                )}
                <Select
                  value={data.query.status ?? 'ALL'}
                  onValueChange={(value) => updateQuery({ status: value })}
                >
                  <SelectTrigger aria-label="Statut">
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
                <Select
                  value={data.query.rating ? String(data.query.rating) : 'ALL'}
                  onValueChange={(value) => updateQuery({ rating: value })}
                >
                  <SelectTrigger aria-label="Note">
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
                <Select
                  value={data.query.sort}
                  onValueChange={(value) => updateQuery({ sort: value })}
                >
                  <SelectTrigger aria-label="Tri">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Plus récents</SelectItem>
                    <SelectItem value="oldest">Plus anciens</SelectItem>
                    <SelectItem value="rating_asc">
                      Notes croissantes
                    </SelectItem>
                    <SelectItem value="rating_desc">
                      Notes décroissantes
                    </SelectItem>
                    <SelectItem value="urgency_desc">
                      Urgence prioritaire
                    </SelectItem>
                    <SelectItem value="unanswered">
                      Sans réponse d'abord
                    </SelectItem>
                  </SelectContent>
                </Select>
                <form onSubmit={submitSearch} className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                  <Input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Rechercher un avis…"
                    className="pl-10 pr-20"
                  />
                  <Button
                    type="submit"
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 -translate-y-1/2"
                  >
                    Chercher
                  </Button>
                </form>
              </div>

              {data.items.length === 0 ? (
                <EmptyState
                  icon={<Inbox className="mx-auto h-8 w-8" />}
                  title={
                    directOnly
                      ? 'Aucun retour direct trouvé'
                      : 'Aucun avis trouvé'
                  }
                  description="Modifiez les filtres pour afficher d'autres résultats."
                />
              ) : (
                <div className="divide-y divide-border-default">
                  {data.items.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() =>
                        updateQuery(
                          { selected: item.id },
                          { keepSelected: true },
                        )
                      }
                      className={cn(
                        'grid w-full gap-3 p-4 text-left transition-colors hover:bg-surface-muted sm:grid-cols-[auto_minmax(0,1fr)_auto]',
                        data.detail?.id === item.id && 'bg-surface-selected',
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
                          {item.assignedToUserId && (
                            <Badge size="sm" tone="info" variant="outline">
                              {userNames.get(item.assignedToUserId) ??
                                'Assigné'}
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

              {data.pagination.totalItems > 0 && (
                <Pagination
                  page={data.pagination.page}
                  pageCount={data.pagination.totalPages}
                  previousLabel="Précédent"
                  nextLabel="Suivant"
                  pageLabel={(page, pageCount) =>
                    `Page ${page} sur ${pageCount}`
                  }
                  className="border-t border-border-default p-4"
                  onPrevious={() =>
                    updateQuery(
                      { page: data.pagination.page - 1 },
                      { keepSelected: false },
                    )
                  }
                  onNext={() =>
                    updateQuery(
                      { page: data.pagination.page + 1 },
                      { keepSelected: false },
                    )
                  }
                />
              )}
            </Card>

            {data.detail ? (
              <ReviewDetail
                key={data.detail.id}
                review={data.detail}
                assignableUsers={data.assignableUsers}
                permissions={data.permissions}
              />
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

function ReviewDetail({
  review,
  assignableUsers,
  permissions,
}: {
  review: ReviewDetailRecord;
  assignableUsers: AssignableReputationUser[];
  permissions: ReviewsPageData['permissions'];
}) {
  const [managementState, managementAction] = useActionState(
    updateFeedbackAction,
    initialActionState,
  );
  const [replyState, replyAction] = useActionState(
    saveReplyDraftAction,
    initialActionState,
  );
  const [noteState, noteAction] = useActionState(
    createInternalNoteAction,
    initialActionState,
  );
  const [reply, setReply] = useState(review.latestReply?.content ?? '');
  const [note, setNote] = useState('');

  useEffect(() => {
    if (noteState.success) setNote('');
  }, [noteState.success]);

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
        {review.source === 'GOOGLE' && review.externalUrl && (
          <IconButton asChild variant="ghost" aria-label="Ouvrir sur Google">
            <a href={review.externalUrl} target="_blank" rel="noreferrer">
              <ExternalLink className="h-4 w-4" />
            </a>
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

      <form
        action={managementAction}
        className="grid gap-3 border-t border-border-default p-4 sm:grid-cols-2"
      >
        <input type="hidden" name="feedbackId" value={review.id} />
        <div className="grid gap-2">
          <Label htmlFor={`feedback-status-${review.id}`}>Statut</Label>
          <Select
            name="status"
            defaultValue={review.status}
            disabled={!permissions.canManageFeedback}
          >
            <SelectTrigger id={`feedback-status-${review.id}`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(statusLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor={`feedback-assignee-${review.id}`}>Responsable</Label>
          <Select
            name="assignedToUserId"
            defaultValue={review.assignedToUserId ?? 'UNASSIGNED'}
            disabled={!permissions.canManageFeedback}
          >
            <SelectTrigger id={`feedback-assignee-${review.id}`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="UNASSIGNED">Non attribué</SelectItem>
              {assignableUsers.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  {user.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="sm:col-span-2">
          <ActionMessage state={managementState} />
          <MutationSubmit
            label="Enregistrer le traitement"
            disabled={!permissions.canManageFeedback}
          />
        </div>
      </form>

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
                <Badge tone={urgencyTone(review.urgency)}>
                  {urgencyLabels[review.urgency]}
                </Badge>
              ) : (
                <Badge>En attente</Badge>
              )}
            </div>
          </div>
          {review.analysis && (
            <div className="sm:col-span-2">
              <p className="text-xs text-muted">Résumé</p>
              <p className="mt-1 text-sm">{review.analysis.summary}</p>
              {review.analysis.topics.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {review.analysis.topics.map((topic) => (
                    <Badge key={topic} size="sm" variant="outline">
                      {topic}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        {(review.urgency === 'HIGH' || review.urgency === 'CRITICAL') && (
          <div className="mt-3 flex items-start gap-2 rounded-lg border border-status-danger bg-status-danger-soft p-3 text-sm text-status-danger">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            Une attention managériale est recommandée.
          </div>
        )}
      </section>

      {review.source === 'GOOGLE' && (
        <form
          action={replyAction}
          className="border-t border-border-default p-4"
        >
          <input type="hidden" name="feedbackId" value={review.id} />
          <div className="flex items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 font-bold text-brand-800">
              <Bot className="h-4 w-4" />
              Brouillon de réponse
            </h2>
            {review.latestReply && (
              <Badge variant="outline">{review.latestReply.status}</Badge>
            )}
          </div>
          <Textarea
            name="content"
            value={reply}
            onChange={(event) => setReply(event.target.value)}
            placeholder="Rédigez une réponse manuelle…"
            className="mt-3 min-h-40 leading-6"
            maxLength={4_000}
            disabled={!permissions.canCreateReply}
          />
          <p className="mt-2 text-xs text-muted">
            Le brouillon est enregistré dans YUTA. La publication Google sera
            activée avec le connecteur.
          </p>
          <ActionMessage state={replyState} />
          <div className="mt-4 grid grid-cols-2 gap-3">
            <ReplySubmit
              disabled={
                !permissions.canCreateReply || reply.trim().length === 0
              }
            />
            <Button type="button" disabled>
              <Send className="h-4 w-4" />
              Publier sur Google
            </Button>
          </div>
        </form>
      )}

      <section className="border-t border-border-default p-4">
        <h2 className="flex items-center gap-2 font-bold text-brand-800">
          <StickyNote className="h-4 w-4" />
          Notes internes
        </h2>
        {review.notes.length > 0 ? (
          <div className="mt-3 grid gap-2">
            {review.notes.map((internalNote) => (
              <div
                key={internalNote.id}
                className="rounded-lg bg-surface-muted p-3"
              >
                <p className="text-sm leading-5">{internalNote.content}</p>
                <p className="mt-2 text-xs text-muted">
                  {internalNote.authorName} ·{' '}
                  {formatAbsoluteDate(internalNote.createdAt)}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-2 text-sm text-muted">
            Aucune note interne pour cet avis.
          </p>
        )}
        <form action={noteAction} className="mt-3">
          <input type="hidden" name="feedbackId" value={review.id} />
          <Textarea
            name="content"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Ajouter une note visible uniquement par l'équipe…"
            maxLength={4_000}
            disabled={!permissions.canCreateNote}
          />
          <ActionMessage state={noteState} />
          <div className="mt-3 flex justify-end">
            <NoteSubmit
              disabled={!permissions.canCreateNote || note.trim().length === 0}
            />
          </div>
        </form>
      </section>

      {review.source === 'DIRECT' && (
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

function MutationSubmit({
  label,
  disabled,
}: {
  label: string;
  disabled: boolean;
}) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      variant="secondary"
      size="sm"
      loading={pending}
      disabled={disabled || pending}
    >
      {label}
    </Button>
  );
}

function ReplySubmit({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      variant="secondary"
      loading={pending}
      disabled={disabled || pending}
    >
      <FilePenLine className="h-4 w-4" />
      Enregistrer
    </Button>
  );
}

function NoteSubmit({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      variant="secondary"
      size="sm"
      loading={pending}
      disabled={disabled || pending}
    >
      Ajouter la note
    </Button>
  );
}

function ActionMessage({ state }: { state: ReputationActionState }) {
  if (state.error) {
    return (
      <p className="mt-2 text-xs font-medium text-status-danger" role="alert">
        {state.error}
      </p>
    );
  }
  if (state.success) {
    return (
      <p className="mt-2 text-xs font-medium text-status-success" role="status">
        {state.success}
      </p>
    );
  }
  return null;
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
  return `Il y a ${Math.round(hours / 24)} j`;
}

function formatAbsoluteDate(value: string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function urgencyTone(
  urgency: FeedbackUrgency,
): 'danger' | 'warning' | 'neutral' {
  if (urgency === 'CRITICAL' || urgency === 'HIGH') return 'danger';
  if (urgency === 'MEDIUM') return 'warning';
  return 'neutral';
}
