import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  IconTile,
  Panel,
  Separator,
} from '@yuta/ui';
import {
  ArrowRight,
  CalendarCheck,
  CalendarPlus,
  Clock3,
  MessageSquareText,
  RefreshCw,
  Star,
  Utensils,
} from 'lucide-react';
import Link from 'next/link';
import {
  loadTodayDashboard,
  type TodayDashboardData,
  type TodayReservationItem,
  type TodayReviewItem,
  type TodayServiceItem,
  type TodaySection,
} from './today-data';
import { formatLocalDateHeading } from './today-view-model';

export default async function TodayPage() {
  const data = await loadTodayDashboard();
  const summaries = buildSummaries(data);

  return (
    <div className="flex w-full flex-col gap-6">
      <header className="flex flex-col gap-4 border-b border-border-default pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold text-muted">
            {formatLocalDateHeading(data.localDate, data.locale)}
          </p>
          <h1 className="mt-1 text-3xl font-black tracking-tight">
            Bonjour, {data.displayName}.
          </h1>
          <p className="mt-1 text-sm text-secondary">
            Voici votre plan d’action pour aujourd’hui.
          </p>
        </div>
        {data.bookingEnabled && (
          <Button asChild variant="success" className="self-start lg:self-end">
            <Link
              href={`/operations/reservations?date=${data.localDate}`}
              aria-label="Ajouter une réservation"
            >
              <CalendarPlus className="h-4 w-4" aria-hidden />
              Ajouter une réservation
            </Link>
          </Button>
        )}
      </header>

      {summaries.length > 0 ? (
        <section
          aria-label="Points d’attention"
          className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
        >
          {summaries.map((summary) => (
            <SummaryCard key={summary.label} {...summary} />
          ))}
        </section>
      ) : (
        <Card padding="lg">
          <p className="text-sm text-muted">
            Aucun module opérationnel n’est disponible pour cet établissement.
          </p>
        </Card>
      )}

      <section className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(19rem,0.75fr)]">
        {data.bookingEnabled && (
          <ReservationsPanel
            section={data.reservations}
            localDate={data.localDate}
          />
        )}

        <aside className="grid gap-5">
          {data.bookingEnabled && (
            <ServicesPanel
              section={data.services}
              canManageSettings={data.canManageBookingSettings}
            />
          )}
          {data.reviews.state !== 'hidden' && (
            <ReviewsPanel section={data.reviews} />
          )}
        </aside>
      </section>
    </div>
  );
}

type Summary = {
  label: string;
  value: string;
  helper: string;
  href: string;
  linkLabel: string;
  icon: typeof CalendarCheck;
  tone: 'success' | 'warning' | 'info';
};

function buildSummaries(data: TodayDashboardData): Summary[] {
  const summaries: Summary[] = [];
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
      href: `/operations/reservations?date=${data.localDate}`,
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
        : `/operations/reservations?date=${data.localDate}`,
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
      href: '/clients/avis?sort=unanswered',
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
}: Summary) {
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

function ReservationsPanel({
  section,
  localDate,
}: {
  section: TodaySection<{
    count: number;
    confirmedCount: number;
    pendingCount: number;
    items: TodayReservationItem[];
  }>;
  localDate: string;
}) {
  return (
    <Panel
      title="Réservations aujourd’hui"
      description="Les prochaines arrivées de l’établissement."
      action={
        <Button asChild variant="secondary" size="sm">
          <Link href={`/operations/reservations?date=${localDate}`}>
            Voir tout
          </Link>
        </Button>
      }
    >
      {section.state === 'ready' && (
        <div className="divide-y divide-border-default">
          {section.data.items.map((reservation) => (
            <ReservationRow key={reservation.id} reservation={reservation} />
          ))}
        </div>
      )}
      {section.state === 'empty' && (
        <EmptyState
          icon={<CalendarCheck className="mx-auto h-8 w-8" aria-hidden />}
          title="Aucune réservation prévue aujourd’hui"
          description="Les nouvelles réservations apparaîtront ici."
        />
      )}
      {section.state === 'unavailable' && <SectionUnavailable />}
    </Panel>
  );
}

function ReservationRow({
  reservation,
}: {
  reservation: TodayReservationItem;
}) {
  return (
    <Link
      href={`/operations/reservations/${reservation.id}`}
      className="grid gap-3 px-5 py-4 transition-colors hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus-ring sm:grid-cols-[4rem_minmax(0,1fr)_auto_auto] sm:items-center"
    >
      <span className="font-bold tabular-nums">{reservation.localTime}</span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-semibold">
          {reservation.guestName}
        </span>
        <span className="text-xs text-muted">
          {reservation.partySize} personne(s)
        </span>
      </span>
      <Badge tone={reservation.statusTone} size="sm">
        {reservation.statusLabel}
      </Badge>
      <ArrowRight className="hidden h-4 w-4 text-muted sm:block" aria-hidden />
    </Link>
  );
}

function ServicesPanel({
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
      {section.state === 'unavailable' && <SectionUnavailable />}
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

function ReviewsPanel({
  section,
}: {
  section: TodaySection<{
    attentionCount: number;
    items: TodayReviewItem[];
  }>;
}) {
  return (
    <Panel
      title="Avis à traiter"
      action={
        <Button asChild variant="secondary" size="sm">
          <Link href="/clients/avis?sort=unanswered">Voir tout</Link>
        </Button>
      }
    >
      {section.state === 'ready' && section.data.items.length > 0 && (
        <div className="divide-y divide-border-default">
          {section.data.items.map((review) => (
            <ReviewRow key={review.id} review={review} />
          ))}
        </div>
      )}
      {section.state === 'ready' && section.data.items.length === 0 && (
        <EmptyState
          title="Avis à ouvrir dans la boîte de réception"
          description="Le compteur indique des avis sans réponse, mais aucun aperçu n’est disponible."
          className="min-h-48"
        />
      )}
      {section.state === 'empty' && (
        <EmptyState
          icon={<MessageSquareText className="mx-auto h-8 w-8" aria-hidden />}
          title="Aucun avis à traiter"
          description="Les nouveaux avis apparaîtront ici."
          className="min-h-48"
        />
      )}
      {section.state === 'unavailable' && <SectionUnavailable />}
    </Panel>
  );
}

function ReviewRow({ review }: { review: TodayReviewItem }) {
  return (
    <Link
      href={`/clients/avis?selected=${review.id}`}
      className="block px-5 py-4 transition-colors hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus-ring"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <Badge tone={review.source === 'GOOGLE' ? 'info' : 'brand'} size="sm">
            {review.source === 'GOOGLE' ? 'Google' : 'Retour direct'}
          </Badge>
          <span className="truncate text-sm font-semibold">
            {review.authorName}
          </span>
        </div>
        <span className="shrink-0 text-xs text-muted">
          {review.receivedLabel}
        </span>
      </div>
      {review.rating !== null && (
        <span
          className="mt-2 inline-flex items-center gap-1 text-xs font-bold"
          aria-label={`${review.rating} sur 5`}
        >
          {review.rating.toFixed(1)}
          <Star
            className="h-3.5 w-3.5 fill-status-rating text-status-rating"
            aria-hidden
          />
        </span>
      )}
      <p className="mt-2 line-clamp-2 text-sm leading-5 text-secondary">
        {review.excerpt}
      </p>
    </Link>
  );
}

function SectionUnavailable() {
  return (
    <ErrorState
      title="Données temporairement indisponibles"
      description="Réessayez dans quelques instants."
      action={
        <Button asChild variant="secondary" size="sm">
          <Link href="/aujourdhui">
            <RefreshCw className="h-4 w-4" aria-hidden />
            Réessayer
          </Link>
        </Button>
      }
      className="min-h-48"
    />
  );
}
