import { db } from '@yuta/db/client';
import { orders, payments } from '@yuta/db/schema';
import { Badge, Button, Card, Separator } from '@yuta/ui';
import { and, desc, eq, gte, sql } from 'drizzle-orm';
import { ArrowLeft, BarChart3, CreditCard, ReceiptText, Utensils } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function PosReportsPage() {
  const today = startOfToday();
  const posBaseUrl = process.env.NEXT_PUBLIC_POS_URL ?? 'http://localhost:3003';
  const [orderRows, paidRevenueRows, paidOrderRows, openOrderRows] = await Promise.all([
    db.query.orders.findMany({
      where: gte(orders.createdAt, today),
      orderBy: [desc(orders.createdAt)],
      with: {
        payments: true,
      },
    }),
    db
      .select({ total: sql<number>`coalesce(sum(${payments.amountCents}), 0)` })
      .from(payments)
      .where(and(eq(payments.status, 'paid'), gte(payments.createdAt, today))),
    db
      .select({ count: sql<number>`count(*)` })
      .from(orders)
      .where(and(eq(orders.status, 'paid'), gte(orders.createdAt, today))),
    db
      .select({ count: sql<number>`count(*)` })
      .from(orders)
      .where(and(gte(orders.createdAt, today), sql`${orders.status} not in ('paid', 'cancelled')`)),
  ]);
  const paidRevenueCents = Number(paidRevenueRows[0]?.total ?? 0);
  const paidOrders = Number(paidOrderRows[0]?.count ?? 0);
  const openOrders = Number(openOrderRows[0]?.count ?? 0);

  return (
    <main className="min-h-screen bg-yuta-paper px-4 py-6 text-yuta-ink md:px-8 md:py-10">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-yuta-line pb-5">
          <div>
            <Link href="/" className="mb-2 inline-flex items-center gap-2 text-sm font-semibold text-yuta-ink/60 hover:text-yuta-ink">
              <ArrowLeft className="h-4 w-4" />
              Retour admin
            </Link>
            <h1 className="text-3xl font-black tracking-tight">POS rapports</h1>
            <p className="mt-1 text-sm text-yuta-ink/55">Commandes et revenus du jour</p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="secondary">
              <Link href="/pos/menu">
                <Utensils className="h-4 w-4" />
                Menu
              </Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/pos/combos">
                <BarChart3 className="h-4 w-4" />
                Combos
              </Link>
            </Button>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          <MetricCard icon={CreditCard} label="Revenu encaisse" value={formatEuros(paidRevenueCents)} />
          <MetricCard icon={ReceiptText} label="Commandes payees" value={String(paidOrders)} />
          <MetricCard icon={ReceiptText} label="Commandes ouvertes" value={String(openOrders)} />
        </section>

        <Card className="overflow-hidden p-0">
          <div className="px-5 py-4">
            <h2 className="text-lg font-bold">Commandes aujourd hui</h2>
            <p className="mt-1 text-sm text-yuta-ink/55">{orderRows.length} commande(s)</p>
          </div>
          <Separator />
          {orderRows.length === 0 ? (
            <div className="grid min-h-64 place-items-center p-8 text-center">
              <div>
                <ReceiptText className="mx-auto h-10 w-10 text-yuta-ink/35" />
                <h3 className="mt-4 font-bold">Aucune commande</h3>
                <p className="mt-1 text-sm text-yuta-ink/55">Les commandes du jour apparaitront ici.</p>
              </div>
            </div>
          ) : (
            <div>
              {orderRows.map((order, index) => {
                const paidCents = order.payments
                  .filter((payment) => payment.status === 'paid')
                  .reduce((total, payment) => total + payment.amountCents, 0);

                return (
                  <div key={order.id}>
                    <div className="grid gap-3 px-5 py-4 md:grid-cols-[1.1fr_1fr_0.7fr_0.7fr_auto] md:items-center">
                      <div>
                        <p className="font-black">{order.tableLabel}</p>
                        <p className="mt-1 text-sm text-yuta-ink/55">{formatTime(order.createdAt)}</p>
                      </div>
                      <p className="text-sm font-semibold">{order.orderNumber}</p>
                      <Badge variant={statusBadgeVariant(order.status)}>{statusLabel(order.status)}</Badge>
                      <div>
                        <p className="font-black">{formatEuros(order.totalCents)}</p>
                        {paidCents > 0 && <p className="text-xs font-semibold text-yuta-ink/45">Paye {formatEuros(paidCents)}</p>}
                      </div>
                      <Button asChild variant="secondary" size="sm">
                        <Link href={`${posBaseUrl}/orders/${order.id}`}>Ouvrir POS</Link>
                      </Button>
                    </div>
                    {index < orderRows.length - 1 && <Separator />}
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </main>
  );
}

function MetricCard({ icon: Icon, label, value }: { icon: typeof CreditCard; label: string; value: string }) {
  return (
    <Card>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-yuta-ink/55">{label}</p>
          <p className="mt-2 text-3xl font-black tracking-tight">{value}</p>
        </div>
        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-yuta-accent">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Card>
  );
}

function startOfToday(): Date {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    draft: 'Brouillon',
    sent: 'Envoyee',
    preparing: 'Preparation',
    ready: 'Prete',
    served: 'Servie',
    paid: 'Payee',
    cancelled: 'Annulee',
  };

  return labels[status] ?? status;
}

function statusBadgeVariant(status: string): 'active' | 'inactive' | 'neutral' | 'destructive' | 'outline' {
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
