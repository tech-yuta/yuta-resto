'use client';

import { Button, cn } from '@yuta/ui';
import {
  creativeFormatCards,
  popularCreativeTemplates,
  recentCreativeCreations,
} from './creative-studio-fixtures';
import { creativeStudioFilters } from './creative-studio-model';
import { CreativeTemplateCard } from './creative-template-card';
import { RecentCreationCard } from './recent-creation-card';

export function CreativeStudioHome({
  activeFilter,
  onFilterChange,
}: {
  activeFilter: string;
  onFilterChange(filter: string): void;
}) {
  return (
    <div className="space-y-6 p-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 min-[1400px]:grid-cols-5">
        {creativeFormatCards.map((item) => {
          const Icon = item.icon;
          return (
            <article
              key={item.title}
              className="flex min-h-24 gap-3 rounded-lg border border-border-default bg-surface p-3 text-left"
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
                <span className="block text-sm font-bold">{item.title}</span>
                <span className="mt-1 block text-xs leading-5 text-muted">
                  {item.description}
                </span>
              </span>
            </article>
          );
        })}
      </div>
      <section>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-black">Modèles populaires</h2>
            <button
              type="button"
              disabled
              className="text-sm font-semibold text-brand-800"
            >
              Voir tous les modèles
            </button>
          </div>
          <Button variant="secondary" size="sm" disabled>
            Trier par : Populaires
          </Button>
        </div>
        <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
          {creativeStudioFilters.map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => onFilterChange(filter)}
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
          {popularCreativeTemplates.map((template, index) => (
            <CreativeTemplateCard
              key={`${template.title}-${index}`}
              template={template}
            />
          ))}
        </div>
      </section>
      <section>
        <div className="mb-4 flex items-center gap-3">
          <h2 className="text-lg font-black">Mes créations récentes</h2>
          <button
            type="button"
            disabled
            className="text-sm font-semibold text-brand-800"
          >
            Voir toutes mes créations
          </button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 min-[1400px]:grid-cols-5">
          {recentCreativeCreations.map((creation) => (
            <RecentCreationCard key={creation.title} creation={creation} />
          ))}
        </div>
      </section>
    </div>
  );
}
