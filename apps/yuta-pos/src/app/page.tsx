import { db } from '@yuta/db/client';
import { orders } from '@yuta/db/schema';
import { Badge, Button, Card, Input, SegmentedNav, Separator } from '@yuta/ui';
import { and, desc, eq, gte, inArray, or } from 'drizzle-orm';
import {
  ChefHat,
  Clock,
  CreditCard,
  ExternalLink,
  Eye,
  MoreHorizontal,
  Plus,
  ReceiptText,
  Search,
  Send,
  SlidersHorizontal,
  User,
} from 'lucide-react';
import Link from 'next/link';
import { PosMobileFab, PosPageShell } from './components/PosPageShell';

type OrdersHomePageProps = {
  searchParams: Promise<{
    view?: string;
    q?: string;
  }>;
};

type OrderView = 'open' | 'paid_today' | 'all_today';

type OrderRow = Awaited<ReturnType<typeof getOrders>>[number];

const views: Array<{ value: OrderView; label: string; shortLabel: string }> = [
  { value: 'open', label: 'Ouvertes', shortLabel: 'Ouvertes' },
  {
    value: 'paid_today',
    label: "Payees aujourd'hui",
    shortLabel: 'Payees',
  },
  {
    value: 'all_today',
    label: "Activite aujourd'hui",
    shortLabel: 'Activite',
  },
];

export default async function OrdersHomePage({
  searchParams,
}: OrdersHomePageProps) {
  const { view, q } = await searchParams;
  const selectedView = parseView(view);
  const searchQuery = q?.trim() ?? '';
  const today = startOfToday();
  const [openOrders, paidTodayOrders, todayOrders] = await Promise.all([
    getOrders('open', today),
    getOrders('paid_today', today),
    getOrders('all_today', today),
  ]);
  const sourceRows =
    selectedView === 'open'
      ? openOrders
      : selectedView === 'paid_today'
        ? paidTodayOrders
        : todayOrders;
  const orderRows = filterOrders(sourceRows, searchQuery);
  return (
    <PosPageShell
      title="Commandes"
      description="Suivi des commandes du service"
      actions={
        <>
          <Button asChild variant="primary" size="touch">
            <Link href="/pos">
              <Plus className="h-4 w-4" />
              Nouvelle commande
            </Link>
          </Button>
          <Button asChild variant="secondary" size="touch">
            <Link href="/kitchen">
              <ChefHat className="h-4 w-4" />
              Cuisine
            </Link>
          </Button>
        </>
      }
      subHeader={
        <div className="grid gap-4 px-4 py-4">
          <div className="flex items-center gap-3">
            <SegmentedNav className="[scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {views.map((item) => (
                <Button
                  key={item.value}
                  asChild
                  variant={
                    item.value === selectedView ? 'primary' : 'secondary'
                  }
                  className="shrink-0 px-3 text-xs sm:px-4 sm:text-sm"
                >
                  <Link href={homeUrl(item.value, searchQuery)}>
                    <span className="sm:hidden">{item.shortLabel}</span>
                    <span className="hidden sm:inline">{item.label}</span>
                    {item.value !== 'all_today' && (
                      <span className="rounded-full bg-yuta-mist px-1.5 py-0.5 text-[10px] font-black text-yuta-ink">
                        {item.value === 'open'
                          ? openOrders.length
                          : paidTodayOrders.length}
                      </span>
                    )}
                  </Link>
                </Button>
              ))}
            </SegmentedNav>
          </div>

          <form action="/" className="flex gap-3">
            <input type="hidden" name="view" value={selectedView} />
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-yuta-ink/45" />
              <Input
                name="q"
                defaultValue={searchQuery}
                placeholder="Rechercher (table, n commande...)"
                className="pl-10"
              />
            </div>
            <Button variant="secondary" className="shrink-0">
              <SlidersHorizontal className="h-4 w-4" />
              <span className="hidden xl:inline">Filtres</span>
            </Button>
          </form>
        </div>
      }
      floatingAction={
        <PosMobileFab
          href="/pos"
          label="Nouvelle commande"
          icon={<Plus className="h-6 w-6" />}
        />
      }
      contentClassName="px-4 py-4"
      maxWidthClassName="max-w-7xl"
    >
      {orderRows.length === 0 ? (
        <EmptyOrders />
      ) : (
        <>
          <MobileOrderList orders={orderRows} />
          <TabletOrderList orders={orderRows} />
          <DesktopOrderTable orders={orderRows} />
        </>
      )}
    </PosPageShell>
  );
}

async function getOrders(selectedView: OrderView, today: Date) {
  return db.query.orders.findMany({
    where:
      selectedView === 'open'
        ? inArray(orders.status, [
            'draft',
            'sent',
            'preparing',
            'ready',
            'served',
          ])
        : selectedView === 'paid_today'
          ? and(eq(orders.status, 'paid'), gte(orders.paidAt, today))
          : or(gte(orders.createdAt, today), gte(orders.paidAt, today)),
    orderBy: [
      desc(selectedView === 'paid_today' ? orders.paidAt : orders.createdAt),
    ],
    with: {
      items: true,
    },
  });
}

function MobileOrderList({ orders: orderRows }: { orders: OrderRow[] }) {
  return (
    <section className="grid gap-3 md:hidden">
      {orderRows.map((order) => (
        <OrderCard key={order.id} order={order} />
      ))}
    </section>
  );
}

function TabletOrderList({ orders: orderRows }: { orders: OrderRow[] }) {
  return (
    <section className="hidden overflow-hidden rounded-lg border border-yuta-line bg-white md:block xl:hidden">
      {orderRows.map((order, index) => (
        <div key={order.id}>
          <TabletOrderRow order={order} />
          {index < orderRows.length - 1 && <Separator />}
        </div>
      ))}
    </section>
  );
}

function DesktopOrderTable({ orders: orderRows }: { orders: OrderRow[] }) {
  return (
    <Card
      padding="none"
      className="hidden overflow-hidden rounded-lg shadow-none xl:block"
    >
      <div className="grid grid-cols-[1fr_1.65fr_0.85fr_0.65fr_0.75fr_0.75fr_1.25fr] gap-4 px-8 py-4 text-xs font-bold uppercase text-yuta-ink/45">
        <span>Repere</span>
        <span>Commande</span>
        <span>Statut</span>
        <span>Heure</span>
        <span>Articles</span>
        <span>Total</span>
        <span className="text-right">Actions</span>
      </div>
      <Separator />
      <div>
        {orderRows.map((order, index) => (
          <div key={order.id}>
            <div
              className={`grid grid-cols-[1fr_1.65fr_0.85fr_0.65fr_0.75fr_0.75fr_1.25fr] gap-4 border-l-4 px-6 py-4 ${statusAccentClass(order.status)}`}
            >
              <div>
                <p className="font-black">{order.tableLabel}</p>
                <p className="mt-1 text-xs font-semibold text-yuta-ink/50">
                  {orderTypeLabel(order.orderType)}
                </p>
              </div>
              <p className="self-center font-black">{order.orderNumber}</p>
              <div className="self-center">
                <StatusBadge status={order.status} />
              </div>
              <p className="self-center text-sm text-yuta-ink/65">
                {formatTime(order.createdAt)}
              </p>
              <p className="self-center text-sm text-yuta-ink/65">
                {order.items.length} article(s)
              </p>
              <p className="self-center font-black">
                {formatEuros(order.totalCents)}
              </p>
              <div className="flex items-center justify-end gap-2">
                <Button asChild variant="secondary" size="sm">
                  <Link href={`/orders/${order.id}`}>
                    {order.status === 'paid' ? (
                      <Eye className="h-4 w-4" />
                    ) : (
                      <ExternalLink className="h-4 w-4" />
                    )}
                    {order.status === 'paid' ? 'Voir le detail' : 'Ouvrir'}
                  </Link>
                </Button>
                {renderPrimaryOrderAction(order)}
                <Button variant="ghost" size="icon" aria-label="Options">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
            </div>
            {index < orderRows.length - 1 && <Separator />}
          </div>
        ))}
      </div>
    </Card>
  );
}

function OrderCard({ order }: { order: OrderRow }) {
  return (
    <article
      className={`overflow-hidden rounded-lg border-l-4 bg-white ${statusAccentClass(order.status)} ${order.status === 'sent' ? 'bg-yuta-mist' : ''}`}
    >
      <div className="grid gap-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="truncate text-lg font-black">{order.tableLabel}</h2>
            <p className="mt-2 truncate text-sm font-semibold text-yuta-ink/55">
              {order.orderNumber}
            </p>
          </div>
          <StatusBadge status={order.status} />
        </div>
        <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-yuta-ink/55">
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {formatTime(order.createdAt)}
          </span>
          <span className="inline-flex items-center gap-1">
            <User className="h-3.5 w-3.5" />
            {order.items.length} article(s)
          </span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <p className="text-xl font-black">{formatEuros(order.totalCents)}</p>
          <div className="flex gap-2">
            <Button asChild variant="secondary" size="sm">
              <Link href={`/orders/${order.id}`}>
                <ExternalLink className="h-4 w-4" />
                Ouvrir
              </Link>
            </Button>
            {renderPrimaryOrderAction(order)}
          </div>
        </div>
      </div>
    </article>
  );
}

function TabletOrderRow({ order }: { order: OrderRow }) {
  return (
    <div
      className={`grid grid-cols-[minmax(130px,0.8fr)_minmax(220px,1fr)_auto] items-center gap-4 border-l-4 bg-white px-4 py-3 ${statusAccentClass(order.status)}`}
    >
      <div>
        <p className="font-black">{order.tableLabel}</p>
        <p className="mt-1 text-xs font-semibold text-yuta-ink/55">
          {orderTypeLabel(order.orderType)}
        </p>
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-3">
          <p className="truncate text-xs font-semibold text-yuta-ink/65">
            {order.orderNumber}
          </p>
          <StatusBadge status={order.status} />
        </div>
        <div className="mt-2 flex items-center gap-4 text-xs font-semibold text-yuta-ink/55">
          <span>{formatTime(order.createdAt)}</span>
          <span>{order.items.length} article(s)</span>
        </div>
      </div>
      <div className="grid justify-items-end gap-2">
        <p className="font-black">{formatEuros(order.totalCents)}</p>
        <div className="flex gap-2">
          <Button asChild variant="secondary" size="sm">
            <Link href={`/orders/${order.id}`}>
              <ExternalLink className="h-4 w-4" />
              Ouvrir
            </Link>
          </Button>
          {renderPrimaryOrderAction(order)}
        </div>
      </div>
    </div>
  );
}

function EmptyOrders() {
  return (
    <div className="grid min-h-[60vh] place-items-center text-center">
      <div>
        <ReceiptText className="mx-auto h-10 w-10 text-yuta-ink/35" />
        <h2 className="mt-4 text-lg font-bold">Aucune commande</h2>
        <p className="mt-1 text-sm text-yuta-ink/55">
          Cette vue est vide pour le moment.
        </p>
        <Button asChild variant="primary" className="mt-4">
          <Link href="/pos">
            <Plus className="h-4 w-4" />
            Nouvelle commande
          </Link>
        </Button>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  return (
    <Badge variant={statusBadgeVariant(status)}>{statusLabel(status)}</Badge>
  );
}

function renderPrimaryOrderAction(order: OrderRow) {
  if (order.status === 'paid' || order.status === 'cancelled') {
    return null;
  }

  if (order.status === 'draft') {
    return (
      <Button asChild variant="primary" size="sm">
        <Link href={`/orders/${order.id}`}>
          <Send className="h-4 w-4" />
          Envoyer
        </Link>
      </Button>
    );
  }

  return (
    <Button asChild variant="accent" size="sm">
      <Link href={`/orders/${order.id}/payment`}>
        <CreditCard className="h-4 w-4" />
        Payer
      </Link>
    </Button>
  );
}

function filterOrders(orderRows: OrderRow[], searchQuery: string): OrderRow[] {
  if (searchQuery.length === 0) {
    return orderRows;
  }

  const normalizedQuery = searchQuery.toLocaleLowerCase('fr-FR');

  return orderRows.filter(
    (order) =>
      order.tableLabel.toLocaleLowerCase('fr-FR').includes(normalizedQuery) ||
      order.orderNumber.toLocaleLowerCase('fr-FR').includes(normalizedQuery),
  );
}

function homeUrl(view: OrderView, searchQuery: string): string {
  const params = new URLSearchParams({ view });

  if (searchQuery.length > 0) {
    params.set('q', searchQuery);
  }

  return `/?${params.toString()}`;
}

function parseView(value: string | undefined): OrderView {
  if (value === 'paid_today' || value === 'all_today') {
    return value;
  }

  return 'open';
}

function startOfToday(): Date {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    draft: 'Non envoyee',
    sent: 'Envoyee',
    preparing: 'En preparation',
    ready: 'Prete',
    served: 'Servie',
    paid: 'Payee',
    cancelled: 'Annulee',
  };

  return labels[status] ?? status;
}

function statusBadgeVariant(
  status: string,
):
  | 'active'
  | 'inactive'
  | 'neutral'
  | 'destructive'
  | 'outline'
  | 'info'
  | 'warning'
  | 'success' {
  if (status === 'sent') {
    return 'success';
  }

  if (status === 'preparing') {
    return 'info';
  }

  if (status === 'draft') {
    return 'warning';
  }

  if (status === 'ready') {
    return 'success';
  }

  if (status === 'paid') {
    return 'neutral';
  }

  if (status === 'cancelled') {
    return 'destructive';
  }

  return 'outline';
}

function statusAccentClass(status: string): string {
  const classes: Record<string, string> = {
    draft: 'border-yuta-warning',
    sent: 'border-yuta-success',
    preparing: 'border-yuta-info',
    ready: 'border-yuta-success',
    served: 'border-yuta-line',
    paid: 'border-yuta-line',
    cancelled: 'border-yuta-danger',
  };

  return classes[status] ?? 'border-yuta-line';
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
  }).format(date);
}

function formatEuros(cents: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(cents / 100);
}
