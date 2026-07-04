import { db } from '@yuta/db/client';
import { orderItems, orders } from '@yuta/db/schema';
import { Badge, Button, Card, Separator } from '@yuta/ui';
import { and, asc, desc, eq, inArray } from 'drizzle-orm';
import {
  ArrowLeft,
  ChefHat,
  Check,
  Clock,
  Flame,
  History,
  ListChecks,
  Martini,
  Menu,
  RotateCcw,
  Soup,
  Wifi,
} from 'lucide-react';
import Link from 'next/link';
import {
  markOrderItemPreparingAction,
  markOrderItemReadyAction,
  markOrderItemSentAction,
} from '../actions';

type KitchenPageProps = {
  searchParams: Promise<{
    station?: string;
    status?: string;
  }>;
};

type Station = 'kitchen' | 'bar' | 'dessert';
type KitchenStatusFilter = 'all' | 'sent' | 'preparing' | 'ready';
type OrderItemStatus = typeof orderItems.$inferSelect.status;
type OrderStatus = typeof orders.$inferSelect.status;

const stations: Array<{ value: Station; label: string; icon: typeof Soup }> = [
  { value: 'kitchen', label: 'Cuisine', icon: Soup },
  { value: 'bar', label: 'Bar', icon: Martini },
  { value: 'dessert', label: 'Desserts', icon: ChefHat },
];

const statusFilters: Array<{
  value: KitchenStatusFilter;
  label: string;
  icon: typeof ListChecks;
}> = [
  { value: 'all', label: 'Tous', icon: ListChecks },
  { value: 'sent', label: 'À préparer', icon: Flame },
  { value: 'preparing', label: 'En préparation', icon: History },
  { value: 'ready', label: 'Prêt', icon: Check },
];

export default async function KitchenPage({ searchParams }: KitchenPageProps) {
  const { station, status } = await searchParams;
  const selectedStation = parseStation(station);
  const selectedStatus = parseStatusFilter(status);
  const visibleStatuses = statusesForFilter(selectedStatus);
  const [items, stationItems] = await Promise.all([
    db.query.orderItems.findMany({
      where: and(
        inArray(orderItems.status, visibleStatuses),
        eq(orderItems.kitchenStationSnapshot, selectedStation),
      ),
      with: {
        order: true,
      },
      orderBy:
        selectedStatus === 'ready'
          ? [desc(orderItems.readyAt), desc(orderItems.createdAt)]
          : [asc(orderItems.sentAt), asc(orderItems.createdAt)],
    }),
    db.query.orderItems.findMany({
      where: and(
        inArray(orderItems.status, ['sent', 'preparing', 'ready']),
        eq(orderItems.kitchenStationSnapshot, selectedStation),
      ),
    }),
  ]);
  const groups = groupItemsByOrder(items);
  const counts = countItemsByStatus(stationItems);

  return (
    <main className="min-h-screen bg-yuta-paper text-yuta-ink">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 py-5 md:px-6 md:py-6">
        <header className="overflow-hidden rounded-lg border border-yuta-line bg-white shadow-card">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-yuta-ink px-4 py-3 text-white">
            <div className="flex min-w-0 items-center gap-3">
              <Button
                asChild
                variant="ghost"
                size="icon"
                className="shrink-0 text-white hover:bg-white/10"
              >
                <Link href="/pos" aria-label="Retour POS">
                  <ArrowLeft className="h-5 w-5" />
                </Link>
              </Button>
              <div>
                <h1 className="text-xl font-black tracking-normal md:text-2xl">
                  Cuisine
                </h1>
                <p className="mt-0.5 text-xs font-semibold text-white/60">
                  {stationLabel(selectedStation)} -{' '}
                  {statusFilterLabel(selectedStatus)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="active">{items.length} article(s)</Badge>
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/10"
                aria-label="Menu cuisine"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </div>
          </div>

          <div className="grid gap-3 p-4">
            <nav className="flex gap-2 overflow-x-auto pb-1">
              {stations.map(({ value, label, icon: Icon }) => (
                <Button
                  key={value}
                  asChild
                  variant={value === selectedStation ? 'primary' : 'secondary'}
                  size="sm"
                  className="shrink-0 rounded-lg"
                >
                  <Link href={kitchenUrl(value, selectedStatus)}>
                    <Icon className="h-4 w-4" />
                    {label}
                  </Link>
                </Button>
              ))}
            </nav>

            <nav className="flex gap-2 overflow-x-auto pb-1">
              {statusFilters.map(({ value, label, icon: Icon }) => (
                <Button
                  key={value}
                  asChild
                  variant={value === selectedStatus ? 'primary' : 'secondary'}
                  size="sm"
                  className="shrink-0 rounded-lg"
                >
                  <Link href={kitchenUrl(selectedStation, value)}>
                    <Icon className="h-4 w-4" />
                    {label}
                    <span className="rounded-full bg-yuta-mist px-1.5 py-0.5 text-[10px] font-black text-yuta-ink">
                      {countForFilter(value, counts, stationItems.length)}
                    </span>
                  </Link>
                </Button>
              ))}
            </nav>
          </div>
        </header>

        {groups.length === 0 ? (
          <Card className="grid min-h-80 place-items-center rounded-lg text-center">
            <div>
              <ChefHat className="mx-auto h-10 w-10 text-yuta-ink/35" />
              <h2 className="mt-4 text-lg font-black">Aucun article</h2>
              <p className="mt-1 text-sm font-semibold text-yuta-ink/55">
                Rien a afficher pour ce poste et ce statut.
              </p>
            </div>
          </Card>
        ) : (
          <section className="grid gap-4">
            {groups.map((group) => (
              <Card
                key={group.order.id}
                className="overflow-hidden rounded-lg p-0"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-xl font-black">
                        {group.order.tableLabel}
                      </h2>
                      <Badge variant="outline">
                        {orderTypeLabel(group.order.orderType)}
                      </Badge>
                      {renderOrderStatusBadge(group.order.status)}
                    </div>
                    <p className="mt-1 text-xs font-semibold text-yuta-ink/45">
                      {group.order.orderNumber}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="neutral">
                      {group.items.length} article(s)
                    </Badge>
                    <span className="inline-flex items-center gap-1 text-xs font-black text-yuta-ink/45">
                      <Clock className="h-3.5 w-3.5" />
                      {groupTimeLabel(group.items)}
                    </span>
                  </div>
                </div>
                <Separator />
                <div className="grid gap-2 p-3">
                  {group.items.map((item) => (
                    <article
                      key={item.id}
                      className="grid gap-3 rounded-lg border border-yuta-line bg-yuta-paper p-3 md:grid-cols-[1fr_auto] md:items-center"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="grid h-8 min-w-8 place-items-center rounded-lg bg-white px-2 text-sm font-black">
                            {item.quantity}
                          </span>
                          <p className="text-base font-black">
                            {item.itemNameSnapshot}
                          </p>
                          {renderStatusBadge(item.status)}
                        </div>
                        {item.note && (
                          <p className="mt-2 text-sm font-semibold text-yuta-ink/65">
                            Note: {item.note}
                          </p>
                        )}
                      </div>

                      {renderKitchenActions(item, group.order.status)}
                    </article>
                  ))}
                </div>
              </Card>
            ))}
          </section>
        )}

        <footer className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-yuta-line bg-white px-4 py-3 text-xs font-bold text-yuta-ink/55 shadow-card">
          <span>Dernière mise à jour : {formatTime(new Date())}</span>
          <span className="inline-flex items-center gap-1 text-yuta-ink">
            <Wifi className="h-3.5 w-3.5 text-green-600" />
            Connecté
          </span>
        </footer>
      </div>
    </main>
  );
}

function parseStation(value: string | undefined): Station {
  if (value === 'bar' || value === 'dessert') {
    return value;
  }

  return 'kitchen';
}

function parseStatusFilter(value: string | undefined): KitchenStatusFilter {
  if (value === 'sent' || value === 'preparing' || value === 'ready') {
    return value;
  }

  return 'all';
}

function statusesForFilter(filter: KitchenStatusFilter): OrderItemStatus[] {
  if (filter === 'sent') {
    return ['sent'];
  }

  if (filter === 'preparing') {
    return ['preparing'];
  }

  if (filter === 'ready') {
    return ['ready'];
  }

  return ['sent', 'preparing', 'ready'];
}

function kitchenUrl(station: Station, status: KitchenStatusFilter): string {
  return `/kitchen?station=${station}&status=${status}`;
}

function groupItemsByOrder<T extends { order: typeof orders.$inferSelect }>(
  items: T[],
) {
  const groups = new Map<
    string,
    { order: typeof orders.$inferSelect; items: T[] }
  >();

  for (const item of items) {
    const group = groups.get(item.order.id);
    if (group) {
      group.items.push(item);
    } else {
      groups.set(item.order.id, { order: item.order, items: [item] });
    }
  }

  return Array.from(groups.values());
}

function countItemsByStatus(items: Array<typeof orderItems.$inferSelect>) {
  return {
    sent: items.filter((item) => item.status === 'sent').length,
    preparing: items.filter((item) => item.status === 'preparing').length,
    ready: items.filter((item) => item.status === 'ready').length,
  };
}

function countForFilter(
  filter: KitchenStatusFilter,
  counts: ReturnType<typeof countItemsByStatus>,
  total: number,
): number {
  if (filter === 'all') {
    return total;
  }

  return counts[filter];
}

function renderStatusBadge(status: typeof orderItems.$inferSelect.status) {
  if (status === 'preparing') {
    return <Badge variant="neutral">En préparation</Badge>;
  }

  if (status === 'ready') {
    return <Badge variant="active">Prêt</Badge>;
  }

  return <Badge variant="outline">À préparer</Badge>;
}

function renderOrderStatusBadge(status: OrderStatus) {
  if (status === 'paid') {
    return <Badge variant="active">Payée</Badge>;
  }

  if (status === 'cancelled') {
    return <Badge variant="destructive">Annulée</Badge>;
  }

  return null;
}

function renderKitchenActions(
  item: typeof orderItems.$inferSelect,
  orderStatus: OrderStatus,
) {
  if (orderStatus === 'cancelled') {
    return (
      <div className="rounded-lg border border-yuta-line bg-yuta-mist px-3 py-2 text-sm font-semibold text-yuta-ink/60">
        Commande annulée
      </div>
    );
  }

  if (item.status === 'ready') {
    return (
      <div className="grid grid-cols-2 gap-2 md:w-64">
        <form action={markOrderItemPreparingAction}>
          <input type="hidden" name="orderItemId" value={item.id} />
          <Button
            type="submit"
            variant="secondary"
            className="w-full rounded-lg"
          >
            <RotateCcw className="h-4 w-4" />
            Réouvrir
          </Button>
        </form>
        <form action={markOrderItemSentAction}>
          <input type="hidden" name="orderItemId" value={item.id} />
          <Button type="submit" variant="ghost" className="w-full rounded-lg">
            Envoye
          </Button>
        </form>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2 md:w-64">
      <form
        action={
          item.status === 'preparing'
            ? markOrderItemSentAction
            : markOrderItemPreparingAction
        }
      >
        <input type="hidden" name="orderItemId" value={item.id} />
        <Button type="submit" variant="secondary" className="w-full rounded-lg">
          {item.status === 'preparing' ? (
            <RotateCcw className="h-4 w-4" />
          ) : (
            <Flame className="h-4 w-4" />
          )}
          {item.status === 'preparing' ? 'Retour' : 'Préparer'}
        </Button>
      </form>
      <form action={markOrderItemReadyAction}>
        <input type="hidden" name="orderItemId" value={item.id} />
        <Button type="submit" variant="accent" className="w-full rounded-lg">
          Prêt
        </Button>
      </form>
    </div>
  );
}

function groupTimeLabel(items: Array<typeof orderItems.$inferSelect>): string {
  const firstDate = items
    .map((item) => item.sentAt ?? item.readyAt ?? item.createdAt)
    .toSorted((left, right) => left.getTime() - right.getTime())[0];

  return firstDate ? elapsedLabel(firstDate) : '';
}

function elapsedLabel(date: Date): string {
  const minutes = Math.max(
    0,
    Math.floor((Date.now() - date.getTime()) / 60000),
  );

  if (minutes < 1) {
    return "a l'instant";
  }

  return `${minutes} min`;
}

function stationLabel(station: Station): string {
  const labels: Record<Station, string> = {
    kitchen: 'Cuisine',
    bar: 'Bar',
    dessert: 'Desserts',
  };

  return labels[station];
}

function statusFilterLabel(status: KitchenStatusFilter): string {
  const labels: Record<KitchenStatusFilter, string> = {
    all: 'Tous',
    sent: 'À préparer',
    preparing: 'En préparation',
    ready: 'Prêt',
  };

  return labels[status];
}

function orderTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    dine_in: 'Sur place',
    takeaway: 'À emporter',
    delivery: 'Livraison',
  };

  return labels[type] ?? type;
}

function formatTime(date: Date): string {
  return new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(date);
}
