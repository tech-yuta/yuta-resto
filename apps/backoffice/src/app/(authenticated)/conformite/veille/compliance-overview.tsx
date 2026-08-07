'use client';

import { Avatar, Badge, Button, cn } from '@yuta/ui';
import { ChevronRight } from 'lucide-react';
import {
  complianceDomainFixtures,
  priorityActionFixtures,
} from './compliance-fixtures';
import {
  getComplianceDomainBorder,
  getComplianceDueClass,
  type ComplianceDomain,
} from './compliance-model';

export function ComplianceOverview({
  selectedId,
  onSelect,
}: {
  selectedId: string;
  onSelect(id: string): void;
}) {
  return (
    <div className="space-y-5 p-4">
      <section className="overflow-hidden rounded-lg border border-border-default">
        <div className="flex items-center justify-between border-b border-border-default px-4 py-3">
          <h2 className="font-bold">Priorités à traiter</h2>
          <Button variant="secondary" size="sm" disabled>
            Voir toutes les actions
          </Button>
        </div>
        <div className="divide-y divide-border-default">
          {priorityActionFixtures.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.id}
                type="button"
                onClick={() => onSelect(action.id)}
                className={cn(
                  'grid w-full items-center gap-3 p-4 text-left hover:bg-surface-muted md:grid-cols-[auto_minmax(0,1fr)_110px_120px_auto]',
                  selectedId === action.id && 'bg-surface-selected',
                )}
              >
                <span
                  className={cn(
                    'grid h-10 w-10 place-items-center rounded-full',
                    action.iconTone,
                  )}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-bold">{action.description}</p>
                    <Badge tone={action.categoryTone} size="sm">
                      {action.category}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted">{action.title}</p>
                </div>
                <div>
                  <p className="text-xs text-muted">Échéance</p>
                  <p
                    className={cn(
                      'mt-1 text-sm font-semibold',
                      getComplianceDueClass(action.dueTone),
                    )}
                  >
                    {action.due}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted">Responsable</p>
                  <div className="mt-1 flex items-center gap-2">
                    <Avatar
                      fallback={action.initials}
                      size="sm"
                      className="h-6 w-6 text-[9px]"
                    />
                    <span className="text-sm">{action.responsible}</span>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted" />
              </button>
            );
          })}
        </div>
      </section>
      <section className="rounded-lg border border-border-default">
        <div className="flex items-center justify-between border-b border-border-default px-4 py-3">
          <h2 className="font-bold">Conformité par domaine</h2>
          <Button variant="secondary" size="sm" disabled>
            Voir tous les domaines
          </Button>
        </div>
        <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
          {complianceDomainFixtures.map((domain) => (
            <DomainCard key={domain.label} domain={domain} />
          ))}
        </div>
      </section>
    </div>
  );
}

function DomainCard({ domain }: { domain: ComplianceDomain }) {
  return (
    <div className="rounded-lg border border-border-default p-3 text-center">
      <p className="min-h-10 text-xs font-semibold leading-5">{domain.label}</p>
      <div
        className={cn(
          'mx-auto mt-2 grid h-20 w-20 place-items-center rounded-full border-[5px] bg-surface text-lg font-black',
          getComplianceDomainBorder(domain.tone),
        )}
      >
        {domain.score} %
      </div>
      <p className="mt-2 text-xs text-muted">
        {domain.obligations} obligations
      </p>
      <p
        className={cn(
          'mt-1 text-xs font-semibold',
          domain.actions === 0 ? 'text-status-success' : 'text-status-danger',
        )}
      >
        {domain.actions} action{domain.actions > 1 ? 's' : ''}
      </p>
    </div>
  );
}
