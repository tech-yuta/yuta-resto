'use client';

import { Card, cn } from '@yuta/ui';
import { ImagePlus } from 'lucide-react';
import { CreativeStudioHome } from './creative-studio-home';
import {
  creativeStudioTabs,
  type CreativeStudioTab,
} from './creative-studio-model';

export function CreativeStudioContent({
  activeTab,
  activeFilter,
  onTabChange,
  onFilterChange,
}: {
  activeTab: CreativeStudioTab;
  activeFilter: string;
  onTabChange(tab: CreativeStudioTab): void;
  onFilterChange(filter: string): void;
}) {
  return (
    <Card padding="none" className="min-w-0 overflow-hidden">
      <nav
        className="flex overflow-x-auto border-b border-border-default px-3"
        aria-label="Sections création visuelle"
      >
        {creativeStudioTabs.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => onTabChange(tab)}
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
        <CreativeStudioHome
          activeFilter={activeFilter}
          onFilterChange={onFilterChange}
        />
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
  );
}
