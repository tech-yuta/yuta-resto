import { db } from '@yuta/db/client';
import { orders } from '@yuta/db/schema';
import { Badge, Button, Card, Separator } from '@yuta/ui';
import { and, desc, eq, gte, inArray, or } from 'drizzle-orm';
import {
  ChefHat,
  CreditCard,
  ExternalLink,
  Plus,
  ReceiptText,
} from 'lucide-react';
import Link from 'next/link';

type OrdersHomePageProps = {
  searchParams: Promise<{
    view?: string;
  }>;
};

type OrderView = 'open' | 'paid_today' | 'all_today';

const views: Array<{ value: OrderView; label: string }> = [
  { value: 'open', label: 'Ouvertes' },
  { value: 'paid_today', label: 'Payées aujourd’hui' },
  { value: 'all_today', label: 'Activité aujourd’hui' },
];

export default async function OrdersHomePage({
  searchParams,
}: OrdersHomePageProps) {
  const { view } = await searchParams;
  const selectedView = parseView(view);
  const today = startOfToday();
  const orderRows = await db.query.orders.findMany({
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

  return (
    <main className="min-h-screen bg-yuta-paper px-4 py-5 text-yuta-ink md:px-8 md:py-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-5">
        <header className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-yuta-line bg-white px-4 py-3 shadow-card">
          <div>
            <p className="text-xs font-black uppercase tracking-normal text-yuta-ink/45">
              YuTa POS
            </p>
            <h1 className="text-2xl font-black tracking-normal md:text-3xl">
              Commandes
            </h1>
            <p className="mt-1 text-sm font-semibold text-yuta-ink/55">
              Suivi des commandes du service
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="primary">
              <Link href="/pos">
                <Plus className="h-4 w-4" />
                Nouvelle commande
              </Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/kitchen">
                <ChefHat className="h-4 w-4" />
                Cuisine
              </Link>
            </Button>
          </div>
        </header>

        <nav className="flex gap-2 overflow-x-auto pb-1">
          {views.map((item) => (
            <Button
              key={item.value}
              asChild
              variant={item.value === selectedView ? 'primary' : 'secondary'}
              className="shrink-0"
            >
              <Link href={`/?view=${item.value}`}>{item.label}</Link>
            </Button>
          ))}
        </nav>

        {orderRows.length === 0 ? (
          <Card className="grid min-h-80 place-items-center text-center">
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
          </Card>
        ) : (
          <Card className="overflow-hidden p-0">
            <div className="hidden grid-cols-[1.2fr_1fr_0.8fr_0.8fr_0.8fr] gap-4 px-5 py-3 text-xs font-bold uppercase text-yuta-ink/45 md:grid">
              <span>Repère</span>
              <span>Commande</span>
              <span>Statut</span>
              <span>Total</span>
              <span className="text-right">Actions</span>
            </div>
            <Separator />
            <div>
              {orderRows.map((order, index) => (
                <div key={order.id}>
                  <div className="grid gap-4 px-5 py-4 md:grid-cols-[1.2fr_1fr_0.8fr_0.8fr_0.8fr] md:items-center">
                    <div>
                      <p className="text-lg font-black md:text-base">
                        {order.tableLabel}
                      </p>
                      <p className="mt-1 text-sm text-yuta-ink/55">
                        {order.items.length} article(s)
                      </p>
                    </div>
                    <div>
                      <p className="font-semibold">{order.orderNumber}</p>
                      <p className="mt-1 text-sm text-yuta-ink/55">
                        {formatTime(order.createdAt)}
                      </p>
                    </div>
                    <div>
                      <Badge variant={statusBadgeVariant(order.status)}>
                        {statusLabel(order.status)}
                      </Badge>
                    </div>
                    <p className="font-black">
                      {formatEuros(order.totalCents)}
                    </p>
                    <div className="flex gap-2 md:justify-end">
                      <Button asChild variant="secondary" size="sm">
                        <Link href={`/orders/${order.id}`}>
                          <ExternalLink className="h-4 w-4" />
                          Ouvrir
                        </Link>
                      </Button>
                      {order.status !== 'paid' &&
                        order.status !== 'cancelled' && (
                          <Button asChild variant="accent" size="sm">
                            <Link href={`/orders/${order.id}/payment`}>
                              <CreditCard className="h-4 w-4" />
                              Payer
                            </Link>
                          </Button>
                        )}
                    </div>
                  </div>
                  {index < orderRows.length - 1 && <Separator />}
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </main>
  );
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
    draft: 'Brouillon',
    sent: 'Envoyée',
    preparing: 'Préparation',
    ready: 'Prête',
    served: 'Servie',
    paid: 'Payée',
    cancelled: 'Annulée',
  };

  return labels[status] ?? status;
}

function statusBadgeVariant(
  status: string,
): 'active' | 'inactive' | 'neutral' | 'destructive' | 'outline' {
  if (status === 'paid' || status === 'ready') {
    return 'active';
  }

  if (status === 'cancelled') {
    return 'destructive';
  }

  if (status === 'draft') {
    return 'outline';
  }

  return 'neutral';
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
