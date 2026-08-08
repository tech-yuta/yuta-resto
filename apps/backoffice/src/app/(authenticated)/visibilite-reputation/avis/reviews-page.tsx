'use client';

import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  MetricCard,
  PageHeader,
} from '@yuta/ui';
import { MessageCircle, RefreshCw, Settings } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ReviewDetail } from './review-detail';
import { ReviewsListPanel } from './reviews-list-panel';
import type {
  ReviewsPageData,
  ReviewsPageMode,
  UpdateReviewsQuery,
} from './reviews-model';

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
  const directOnly = mode === 'direct';
  const updateQuery: UpdateReviewsQuery = (updates, options) => {
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
  };

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
          <ReviewsMetrics data={data} directOnly={directOnly} />

          <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(420px,0.85fr)]">
            <ReviewsListPanel
              data={data}
              directOnly={directOnly}
              updateQuery={updateQuery}
            />

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

function ReviewsMetrics({
  data,
  directOnly,
}: {
  data: ReviewsPageData;
  directOnly: boolean;
}) {
  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      <MetricCard
        label="Total"
        value={data.counters.total}
        helper={directOnly ? 'Retours directs' : 'Google et retours directs'}
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
  );
}
