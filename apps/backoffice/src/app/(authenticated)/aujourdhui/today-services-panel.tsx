import { Badge, Button, EmptyState, Panel } from '@yuta/ui';
import { Clock3 } from 'lucide-react';
import Link from 'next/link';
import type { TodaySection, TodayServiceItem } from './today-data';
import { TodaySectionUnavailable } from './today-section-unavailable';

export function TodayServicesPanel({
  section,
  canManageSettings,
}: {
  section: TodaySection<{ count: number; items: TodayServiceItem[] }>;
  canManageSettings: boolean;
}) {
  return (
    <Panel
      title="Services aujourd’hui"
      action={
        canManageSettings ? (
          <Button asChild variant="secondary" size="sm">
            <Link href="/etablissement/informations-generales#horaires-hebdomadaires">
              Gérer
            </Link>
          </Button>
        ) : undefined
      }
    >
      {section.state === 'ready' && (
        <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-1">
          {section.data.items.map((service) => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </div>
      )}
      {section.state === 'empty' && (
        <EmptyState
          icon={<Clock3 className="mx-auto h-8 w-8" aria-hidden />}
          title="Aucun service aujourd’hui"
          description="Aucun service de réservation actif n’est configuré pour ce jour."
          className="min-h-48"
        />
      )}
      {section.state === 'unavailable' && <TodaySectionUnavailable />}
    </Panel>
  );
}

function ServiceCard({ service }: { service: TodayServiceItem }) {
  const tone =
    service.state === 'current'
      ? 'success'
      : service.state === 'upcoming'
        ? 'info'
        : 'neutral';
  return (
    <article className="rounded-xl border border-border-default bg-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-bold">{service.name}</h3>
          <p className="mt-1 text-sm tabular-nums text-muted">
            {service.timeRange}
          </p>
        </div>
        <Badge tone={tone} size="sm">
          {service.stateLabel}
        </Badge>
      </div>
      <p className="mt-3 text-xs text-muted">
        Capacité : {service.capacity} couvert(s)
      </p>
    </article>
  );
}
