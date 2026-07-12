import { formatEuros, startOfToday } from '@yuta/core';
import { db } from '@yuta/db/client';
import { orders, payments } from '@yuta/db/schema';
import { Badge, Button, Card, Separator, StatCard } from '@yuta/ui';
import { and, desc, eq, gte, sql } from 'drizzle-orm';
import { BarChart3, CreditCard, ReceiptText, Utensils } from 'lucide-react';
import Link from 'next/link';
import { AdminPosPage } from '../../../components/admin-pos-page';

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
    <AdminPosPage
      title="POS rapports"
      description="Commandes et revenus du jour"
      actions={
        <>
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
        </>
      }
    >

        <section className="grid gap-4 md:grid-cols-3">
          <StatCard icon={<CreditCard className="h-4 w-4" />} label="Revenu encaisse" value={formatEuros(paidRevenueCents)} />
          <StatCard icon={<ReceiptText className="h-4 w-4" />} label="Commandes payees" value={String(paidOrders)} />
          <StatCard icon={<ReceiptText className="h-4 w-4" />} label="Commandes ouvertes" value={String(openOrders)} />
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
    </AdminPosPage>
  );
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
