'use client';

import { Card, cn } from '@yuta/ui';
import { ClipboardCheck } from 'lucide-react';
import { ComplianceOverview } from './compliance-overview';
import { complianceTabs, type ComplianceTab } from './compliance-model';

export function ComplianceContent({
  activeTab,
  selectedId,
  onTabChange,
  onSelect,
}: {
  activeTab: ComplianceTab;
  selectedId: string | null;
  onTabChange(tab: ComplianceTab): void;
  onSelect(id: string): void;
}) {
  return (
    <Card padding="none" className="overflow-hidden">
      <nav
        className="flex overflow-x-auto border-b border-border-default px-3"
        aria-label="Sections conformité"
      >
        {complianceTabs.map((tab) => (
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
              <span className="absolute inset-x-2 bottom-0 h-0.5 bg-action-primary" />
            )}
          </button>
        ))}
      </nav>
      {activeTab === 'Vue d’ensemble' ? (
        <ComplianceOverview selectedId={selectedId} onSelect={onSelect} />
      ) : (
        <div className="grid min-h-[520px] place-items-center p-8 text-center">
          <div>
            <ClipboardCheck className="mx-auto h-10 w-10 text-muted" />
            <h2 className="mt-4 text-xl font-bold">{activeTab}</h2>
            <p className="mt-1 text-sm text-muted">
              Cette vue est prête à recevoir les données de conformité.
            </p>
          </div>
        </div>
      )}
    </Card>
  );
}
