import { getServiceDayWindow } from '@yuta/core';
import { db } from '@yuta/db/client';
import { orderItems, orders } from '@yuta/db/schema';
import { Badge, Button, Card, SegmentedNav, Separator } from '@yuta/ui';
import { and, asc, desc, eq, gte, inArray, lt } from 'drizzle-orm';
import {
  ChefHat,
  Check,
  Clock,
  Flame,
  History,
  Martini,
  Plus,
  RotateCcw,
  Soup,
  StickyNote,
  Wifi,
} from 'lucide-react';
import Link from 'next/link';
import {
  markOrderItemPreparingAction,
  markOrderItemReadyAction,
  markOrderItemSentAction,
} from '../actions';
import { PosPageShell } from '../components/PosPageShell';
import { KitchenAutoRefresh } from './KitchenAutoRefresh';

type KitchenPageProps = {
  searchParams: Promise<{
    station?: string;
    status?: string;
  }>;
};

type Station = 'kitchen' | 'bar' | 'dessert';
type KitchenStatusFilter = 'sent' | 'preparing' | 'ready';
type OrderStatus = typeof orders.$inferSelect.status;

const kitchenQueueLimit = 100;

const stations: Array<{ value: Station; label: string; icon: typeof Soup }> = [
  { value: 'kitchen', label: 'Cuisine', icon: Soup },
  { value: 'bar', label: 'Bar', icon: Martini },
  { value: 'dessert', label: 'Desserts', icon: ChefHat },
];

const statusFilters: Array<{
  value: KitchenStatusFilter;
  label: string;
  icon: typeof Flame;
}> = [
  { value: 'sent', label: 'A preparer', icon: Flame },
  { value: 'preparing', label: 'En preparation', icon: History },
  { value: 'ready', label: 'Pret', icon: Check },
];

export default async function KitchenPage({ searchParams }: KitchenPageProps) {
  const { station, status } = await searchParams;
  const selectedStation = parseStation(station);
  const selectedStatus = parseStatusFilter(status);
  const serviceDay = getServiceDayWindow(new Date());
  const [itemRows, stationItemRows, allStationItemRows] = await Promise.all([
    db
      .select({
        item: orderItems,
        order: orders,
      })
      .from(orderItems)
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .where(
        and(
          eq(orderItems.status, selectedStatus),
          eq(orderItems.kitchenStationSnapshot, selectedStation),
          gte(orders.createdAt, serviceDay.start),
          lt(orders.createdAt, serviceDay.end),
        ),
      )
      .orderBy(
        ...(selectedStatus === 'ready'
          ? [desc(orderItems.readyAt), desc(orderItems.createdAt)]
          : [asc(orderItems.sentAt), asc(orderItems.createdAt)]),
      )
      .limit(kitchenQueueLimit),
    db
      .select({
        item: orderItems,
      })
      .from(orderItems)
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .where(
        and(
          inArray(orderItems.status, ['sent', 'preparing', 'ready']),
          eq(orderItems.kitchenStationSnapshot, selectedStation),
          gte(orders.createdAt, serviceDay.start),
          lt(orders.createdAt, serviceDay.end),
        ),
      ),
    db
      .select({
        item: orderItems,
      })
      .from(orderItems)
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .where(
        and(
          inArray(orderItems.status, ['sent', 'preparing', 'ready']),
          inArray(orderItems.kitchenStationSnapshot, ['kitchen', 'bar', 'dessert']),
          gte(orders.createdAt, serviceDay.start),
          lt(orders.createdAt, serviceDay.end),
        ),
      ),
  ]);
  const items = itemRows.map((row) => ({ ...row.item, order: row.order }));
  const stationItems = stationItemRows.map((row) => row.item);
  const allStationItems = allStationItemRows.map((row) => row.item);
  const groups = groupItemsByOrder(items);
  const counts = countItemsByStatus(stationItems);
  const stationStatusCounts = countItemsByStationAndStatus(allStationItems);
  const stationCounts = countOpenWorkItemsByStation(stationStatusCounts);

  return (
    <PosPageShell
      title="Cuisine"
      description="Suivi des preparations du service"
      actions={
        <>
          <Badge
            variant="outline"
            className="hidden border-white/25 text-white md:flex"
          >
            {items.length} article(s)
          </Badge>
          <Button asChild variant="primary" size="lg">
            <Link href="/pos">
              <Plus className="h-4 w-4" />
              Nouvelle commande
            </Link>
          </Button>
          <Button asChild variant="secondary" size="lg">
            <Link href="/">Commandes</Link>
          </Button>
        </>
      }
      subHeader={
        <div className="grid gap-3 px-4 py-4">
          <SegmentedNav>
            {stations.map(({ value, label, icon: Icon }) => (
              <Button
                key={value}
                asChild
                variant={value === selectedStation ? 'primary' : 'secondary'}
                size="sm"
                className="shrink-0 rounded-lg"
              >
                <Link
                  href={stationKitchenUrl(
                    value,
                    selectedStatus,
                    stationStatusCounts,
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                  <span className="rounded-full bg-surface-muted px-1.5 py-0.5 text-[10px] font-black text-primary">
                    {stationCounts[value]}
                  </span>
                </Link>
              </Button>
            ))}
          </SegmentedNav>

          <SegmentedNav>
            {statusFilters.map(({ value, label, icon: Icon }) => (
              <Button
                key={value}
                asChild
                variant={value === selectedStatus ? 'primary' : 'secondary'}
                size="sm"
                className={`shrink-0 rounded-lg ${statusFilterButtonClass(
                  value,
                  selectedStatus,
                )}`}
              >
                <Link href={kitchenUrl(selectedStation, value)}>
                  <Icon className="h-4 w-4" />
                  {label}
                  <span className="rounded-full bg-surface-muted px-1.5 py-0.5 text-[10px] font-black text-primary">
                    {counts[value]}
                  </span>
                </Link>
              </Button>
            ))}
          </SegmentedNav>
        </div>
      }
    >
      <KitchenAutoRefresh />
      <div className="grid gap-4">
        {groups.length === 0 ? (
          <Card className="grid min-h-80 place-items-center text-center shadow-none">
            <div>
              <ChefHat className="mx-auto h-10 w-10 text-primary/35" />
              <h2 className="mt-4 text-lg font-black">Aucun article</h2>
              <p className="mt-1 text-sm font-semibold text-primary/55">
                Rien a afficher pour ce poste et ce statut.
              </p>
            </div>
          </Card>
        ) : (
          <section className="grid gap-4">
            {groups.map((group) => (
              <Card
                key={group.order.id}
                padding="none"
                className="overflow-hidden shadow-none"
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
                    <p className="mt-1 text-xs font-semibold text-primary/45">
                      {group.order.orderNumber}
                    </p>
                    {group.order.note?.trim() && (
                      <p className="mt-2 inline-flex max-w-full items-start gap-2 rounded-lg bg-status-info-soft px-3 py-2 text-sm font-semibold text-primary">
                        <StickyNote className="mt-0.5 h-4 w-4 shrink-0 text-status-success" />
                        <span className="min-w-0 break-words">
                          Note commande: {group.order.note.trim()}
                        </span>
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge tone="neutral" variant="soft">
                      {group.items.length} article(s)
                    </Badge>
                    <span className="inline-flex items-center gap-1 text-xs font-black text-primary/45">
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
                      className="grid gap-3 rounded-lg border border-border-default bg-canvas p-3 md:grid-cols-[1fr_auto] md:items-center"
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
                          <p className="mt-2 text-sm font-semibold text-primary/65">
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

        <footer className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border-default bg-white px-4 py-3 text-xs font-bold text-primary/55">
          <span>Derniere mise a jour : {formatTime(new Date())}</span>
          <span className="inline-flex items-center gap-1 text-primary">
            <Wifi className="h-3.5 w-3.5 text-status-success" />
            Connecte
          </span>
        </footer>
      </div>
    </PosPageShell>
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

  return 'sent';
}

function kitchenUrl(station: Station, status: KitchenStatusFilter): string {
  return `/kitchen?station=${station}&status=${status}`;
}

function stationKitchenUrl(
  station: Station,
  selectedStatus: KitchenStatusFilter,
  counts: Record<Station, Record<KitchenStatusFilter, number>>,
): string {
  return kitchenUrl(station, nextStatusForStation(station, selectedStatus, counts));
}

function nextStatusForStation(
  station: Station,
  selectedStatus: KitchenStatusFilter,
  counts: Record<Station, Record<KitchenStatusFilter, number>>,
): KitchenStatusFilter {
  const stationCounts = counts[station];

  if (stationCounts[selectedStatus] > 0) {
    return selectedStatus;
  }

  if (stationCounts.sent > 0) {
    return 'sent';
  }

  if (stationCounts.preparing > 0) {
    return 'preparing';
  }

  return selectedStatus;
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

function countOpenWorkItemsByStation(
  counts: Record<Station, Record<KitchenStatusFilter, number>>,
) {
  return {
    kitchen: counts.kitchen.sent + counts.kitchen.preparing,
    bar: counts.bar.sent + counts.bar.preparing,
    dessert: counts.dessert.sent + counts.dessert.preparing,
  } satisfies Record<Station, number>;
}

function countItemsByStationAndStatus(
  items: Array<typeof orderItems.$inferSelect>,
) {
  const counts = {
    kitchen: { sent: 0, preparing: 0, ready: 0 },
    bar: { sent: 0, preparing: 0, ready: 0 },
    dessert: { sent: 0, preparing: 0, ready: 0 },
  } satisfies Record<Station, Record<KitchenStatusFilter, number>>;

  for (const item of items) {
    const station = item.kitchenStationSnapshot;

    if (station !== 'kitchen' && station !== 'bar' && station !== 'dessert') {
      continue;
    }

    if (
      item.status !== 'sent' &&
      item.status !== 'preparing' &&
      item.status !== 'ready'
    ) {
      continue;
    }

    counts[station][item.status] += 1;
  }

  return counts;
}

function renderStatusBadge(status: typeof orderItems.$inferSelect.status) {
  if (status === 'preparing') {
    return <Badge tone="warning" variant="soft">En preparation</Badge>;
  }

  if (status === 'ready') {
    return <Badge tone="success" variant="solid">Pret</Badge>;
  }

  return <Badge tone="warning" variant="soft">A preparer</Badge>;
}

function statusFilterButtonClass(
  status: KitchenStatusFilter,
  selectedStatus: KitchenStatusFilter,
): string {
  if (status !== selectedStatus) {
    return '';
  }

  if (status === 'sent') {
    return 'bg-status-warning text-inverse hover:bg-status-warning/90';
  }

  if (status === 'preparing') {
    return 'bg-status-info text-inverse hover:bg-status-info/90';
  }

  return 'bg-status-success text-inverse hover:bg-status-success/90';
}

function renderOrderStatusBadge(status: OrderStatus) {
  if (status === 'paid') {
    return <Badge tone="success" variant="solid">Payee</Badge>;
  }

  if (status === 'cancelled') {
    return <Badge tone="danger" variant="solid">Annulee</Badge>;
  }

  return null;
}

function renderKitchenActions(
  item: typeof orderItems.$inferSelect,
  orderStatus: OrderStatus,
) {
  if (orderStatus === 'cancelled') {
    return (
      <div className="rounded-lg border border-border-default bg-surface-muted px-3 py-2 text-sm font-semibold text-primary/60">
        Commande annulee
      </div>
    );
  }

  if (item.status === 'ready') {
    return (
      <div className="grid grid-cols-2 gap-2 md:w-64">
        <form action={markOrderItemPreparingAction}>
          <input type="hidden" name="orderItemId" value={item.id} />
          <Button type="submit" variant="secondary" className="w-full">
            <RotateCcw className="h-4 w-4" />
            Reouvrir
          </Button>
        </form>
        <form action={markOrderItemSentAction}>
          <input type="hidden" name="orderItemId" value={item.id} />
          <Button type="submit" variant="ghost" className="w-full">
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
        <Button
          type="submit"
          variant={item.status === 'preparing' ? 'secondary' : 'primary'}
          className={`w-full ${prepareActionButtonClass(item.status)}`}
        >
          {item.status === 'preparing' ? (
            <RotateCcw className="h-4 w-4" />
          ) : (
            <Flame className="h-4 w-4" />
          )}
          {item.status === 'preparing' ? 'Retour' : 'Preparer'}
        </Button>
      </form>
      <form action={markOrderItemReadyAction}>
        <input type="hidden" name="orderItemId" value={item.id} />
        <Button type="submit" variant="success" className="w-full">
          Pret
        </Button>
      </form>
    </div>
  );
}

function prepareActionButtonClass(
  status: typeof orderItems.$inferSelect.status,
): string {
  if (status === 'preparing') {
    return 'border-status-info-border bg-status-info-soft text-status-info hover:bg-status-info-soft/80';
  }

  return 'bg-status-warning text-inverse hover:bg-status-warning/90';
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

function orderTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    dine_in: 'Sur place',
    takeaway: 'A emporter',
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
