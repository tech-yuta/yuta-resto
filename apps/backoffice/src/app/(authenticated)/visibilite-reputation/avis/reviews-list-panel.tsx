'use client';

import {
  Avatar,
  Badge,
  Button,
  Card,
  EmptyState,
  Input,
  Pagination,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  cn,
} from '@yuta/ui';
import { Inbox, Search } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { ReviewRating, ReviewSourceMark } from './review-presentation';
import {
  formatRelativeDate,
  getInitials,
  sentimentLabels,
  sentimentTones,
  statusLabels,
  statusTones,
  type ReviewsPageData,
  type UpdateReviewsQuery,
} from './reviews-model';

export function ReviewsListPanel({
  data,
  directOnly,
  updateQuery,
}: {
  data: ReviewsPageData;
  directOnly: boolean;
  updateQuery: UpdateReviewsQuery;
}) {
  const [search, setSearch] = useState(data.query.search);
  const userNames = new Map(
    data.assignableUsers.map((user) => [user.id, user.name]),
  );

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    updateQuery({ search });
  }

  return (
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
            <SelectItem value="rating_asc">Notes croissantes</SelectItem>
            <SelectItem value="rating_desc">Notes décroissantes</SelectItem>
            <SelectItem value="urgency_desc">Urgence prioritaire</SelectItem>
            <SelectItem value="unanswered">Sans réponse d'abord</SelectItem>
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
            directOnly ? 'Aucun retour direct trouvé' : 'Aucun avis trouvé'
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
                updateQuery({ selected: item.id }, { keepSelected: true })
              }
              className={cn(
                'grid w-full gap-3 p-4 text-left transition-colors hover:bg-surface-muted sm:grid-cols-[auto_minmax(0,1fr)_auto]',
                data.detail?.id === item.id && 'bg-surface-selected',
              )}
            >
              <div className="flex items-start gap-3">
                <ReviewSourceMark source={item.source} />
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
                  {item.rating && <ReviewRating value={item.rating} />}
                </div>
                <p className="mt-1 line-clamp-2 text-sm leading-5 text-secondary">
                  {item.content || 'Aucun commentaire.'}
                </p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {item.sentiment && (
                    <Badge size="sm" tone={sentimentTones[item.sentiment]}>
                      {sentimentLabels[item.sentiment]}
                    </Badge>
                  )}
                  {item.assignedToUserId && (
                    <Badge size="sm" tone="info" variant="outline">
                      {userNames.get(item.assignedToUserId) ?? 'Assigné'}
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
          pageLabel={(page, pageCount) => `Page ${page} sur ${pageCount}`}
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
  );
}
