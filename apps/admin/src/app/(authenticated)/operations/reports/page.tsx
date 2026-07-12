import { formatEuros, startOfToday } from '@yuta/core';
import { db } from '@yuta/db/client';
import { orders, payments } from '@yuta/db/schema';
import { Badge, Button, DataTable, StatCard } from '@yuta/ui';
import { and, desc, eq, gte, sql } from 'drizzle-orm';
import { BarChart3, CreditCard, ReceiptText, Utensils } from 'lucide-react';
import Link from 'next/link';
import { AdminPosPage } from '../../../../components/admin-pos-page';

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
            <Link href="/menu/menus">
              <Utensils className="h-4 w-4" />
              Menu
            </Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/menu/combos">
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

        <section className="grid gap-3">
          <div>
            <h2 className="text-lg font-bold">Commandes aujourd hui</h2>
            <p className="mt-1 text-sm text-primary/55">{orderRows.length} commande(s)</p>
          </div>
          <DataTable
            rows={orderRows}
            getRowId={(order) => order.id}
            emptyTitle="Aucune commande"
            emptyDescription="Les commandes du jour apparaitront ici."
            columns={[
              {
                id: 'table',
                header: 'Table',
                cell: (order) => (
                  <div>
                    <p className="font-black">{order.tableLabel}</p>
                    <p className="mt-1 text-sm text-primary/55">{formatTime(order.createdAt)}</p>
                  </div>
                ),
              },
              {
                id: 'number',
                header: 'Commande',
                cell: (order) => <p className="text-sm font-semibold">{order.orderNumber}</p>,
              },
              {
                id: 'status',
                header: 'Statut',
                cell: (order) => (
                  <Badge {...statusBadgeProps(order.status)}>{statusLabel(order.status)}</Badge>
                ),
              },
              {
                id: 'total',
                header: 'Total',
                cell: (order) => {
                  const paidCents = order.payments
                    .filter((payment) => payment.status === 'paid')
                    .reduce((total, payment) => total + payment.amountCents, 0);

                  return (
                    <div>
                      <p className="font-black">{formatEuros(order.totalCents)}</p>
                      {paidCents > 0 && (
                        <p className="text-xs font-semibold text-primary/45">
                          Paye {formatEuros(paidCents)}
                        </p>
                      )}
                    </div>
                  );
                },
              },
              {
                id: 'action',
                header: '',
                cell: (order) => (
                  <Button asChild variant="secondary" size="sm">
                    <Link href={`${posBaseUrl}/orders/${order.id}`}>Ouvrir POS</Link>
                  </Button>
                ),
              },
            ]}
          />
        </section>
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

function statusBadgeProps(status: string) {
  if (status === 'paid' || status === 'ready') {
    return { tone: 'success', variant: 'soft' } as const;
  }

  if (status === 'cancelled') {
    return { tone: 'danger', variant: 'solid' } as const;
  }

  if (status === 'draft') {
    return { tone: 'neutral', variant: 'outline' } as const;
  }

  return { tone: 'neutral', variant: 'soft' } as const;
}

function formatTime(date: Date): string {
  return new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}
