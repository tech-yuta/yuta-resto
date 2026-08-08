import { Card, IconTile, Separator } from '@yuta/ui';
import {
  ArrowRight,
  CalendarCheck,
  MessageSquareText,
  Utensils,
} from 'lucide-react';
import Link from 'next/link';
import type { TodayDashboardData } from './today-data';

type TodaySummary = {
  label: string;
  value: string;
  helper: string;
  href: string;
  linkLabel: string;
  icon: typeof CalendarCheck;
  tone: 'success' | 'warning' | 'info';
};

export function TodaySummaryCards({ data }: { data: TodayDashboardData }) {
  const summaries = buildSummaries(data);

  if (summaries.length === 0) {
    return (
      <Card padding="lg">
        <p className="text-sm text-muted">
          Aucun module opérationnel n’est disponible pour cet établissement.
        </p>
      </Card>
    );
  }

  return (
    <section
      aria-label="Points d’attention"
      className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
    >
      {summaries.map((summary) => (
        <SummaryCard key={summary.label} {...summary} />
      ))}
    </section>
  );
}

function buildSummaries(data: TodayDashboardData): TodaySummary[] {
  const summaries: TodaySummary[] = [];
  if (data.bookingEnabled) {
    summaries.push({
      label: 'Réservations aujourd’hui',
      value:
        data.reservations.state === 'ready'
          ? String(data.reservations.data.count)
          : data.reservations.state === 'empty'
            ? '0'
            : '—',
      helper:
        data.reservations.state === 'ready'
          ? `${data.reservations.data.confirmedCount} confirmée(s) · ${data.reservations.data.pendingCount} en attente`
          : stateHelper(data.reservations.state, 'Aucune réservation prévue'),
      href: `/reservations?date=${data.localDate}`,
      linkLabel: 'Voir le planning',
      icon: CalendarCheck,
      tone: 'success',
    });
    summaries.push({
      label: 'Services aujourd’hui',
      value:
        data.services.state === 'ready'
          ? String(data.services.data.count)
          : data.services.state === 'empty'
            ? '0'
            : '—',
      helper:
        data.services.state === 'ready'
          ? 'Service(s) configuré(s)'
          : stateHelper(data.services.state, 'Aucun service configuré'),
      href: data.canManageBookingSettings
        ? '/etablissement/informations-generales#horaires-hebdomadaires'
        : `/reservations?date=${data.localDate}`,
      linkLabel: data.canManageBookingSettings
        ? 'Gérer les horaires'
        : 'Voir le planning',
      icon: Utensils,
      tone: 'info',
    });
  }
  if (data.reviews.state !== 'hidden') {
    summaries.push({
      label: 'Avis à traiter',
      value:
        data.reviews.state === 'ready'
          ? String(data.reviews.data.attentionCount)
          : data.reviews.state === 'empty'
            ? '0'
            : '—',
      helper:
        data.reviews.state === 'ready'
          ? 'Sans réponse publiée'
          : stateHelper(data.reviews.state, 'Aucun avis à traiter'),
      href: '/visibilite-reputation/avis?sort=unanswered',
      linkLabel: 'Voir les avis',
      icon: MessageSquareText,
      tone: 'warning',
    });
  }
  return summaries;
}

function stateHelper(
  state: 'empty' | 'unavailable',
  emptyLabel: string,
): string {
  return state === 'empty' ? emptyLabel : 'Données indisponibles';
}

function SummaryCard({
  label,
  value,
  helper,
  href,
  linkLabel,
  icon: Icon,
  tone,
}: TodaySummary) {
  return (
    <Card padding="none" className="flex min-h-44 flex-col overflow-hidden">
      <div className="flex flex-1 flex-col gap-4 p-5">
        <div className="flex items-center gap-3">
          <IconTile tone={tone} size="sm">
            <Icon className="h-4 w-4" aria-hidden />
          </IconTile>
          <h2 className="text-sm font-semibold">{label}</h2>
        </div>
        <div>
          <p className="text-3xl font-black tabular-nums">{value}</p>
          <p className="mt-1 text-xs text-muted">{helper}</p>
        </div>
      </div>
      <Separator />
      <Link
        href={href}
        className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold text-action-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus-ring"
      >
        {linkLabel}
        <ArrowRight className="h-4 w-4" aria-hidden />
      </Link>
    </Card>
  );
}
