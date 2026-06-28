import { createComboService } from '@yuta/core';
import { db } from '@yuta/db/client';
import { orders } from '@yuta/db/schema';
import { Badge, Button, Card, Input, Label, Separator } from '@yuta/ui';
import { eq } from 'drizzle-orm';
import { ArrowLeft, Users } from 'lucide-react';
import Link from 'next/link';
import { createChecksByItemsAction } from '../../../../actions';

type SplitItemsPageProps = {
  params: Promise<{
    orderId: string;
  }>;
};

export default async function SplitItemsPage({ params }: SplitItemsPageProps) {
  const { orderId } = await params;
  const comboService = createComboService(db);

  await comboService.optimizeOrderCombos(orderId);

  const order = await db.query.orders.findFirst({
    where: eq(orders.id, orderId),
    with: {
      items: true,
      checks: true,
    },
  });

  if (!order) {
    throw new Error('Order not found.');
  }

  const activeItems = order.items.filter((item) => item.status !== 'cancelled');

  return (
    <main className="min-h-screen bg-yuta-paper px-4 py-5 text-yuta-ink md:px-8 md:py-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-5">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-yuta-line pb-5">
          <div>
            <Link href={`/orders/${order.id}/payment`} className="mb-2 inline-flex items-center gap-2 text-sm font-semibold text-yuta-ink/60 hover:text-yuta-ink">
              <ArrowLeft className="h-4 w-4" />
              Retour paiement
            </Link>
            <h1 className="text-2xl font-black tracking-tight md:text-3xl">Separer par articles</h1>
            <p className="mt-1 text-sm text-yuta-ink/55">{order.tableLabel}</p>
          </div>
          <Badge variant="neutral">{activeItems.length} article(s)</Badge>
        </header>

        <Card>
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-yuta-accent">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-bold">Clients</h2>
              <p className="text-sm text-yuta-ink/55">MVP: deux clients fixes</p>
            </div>
          </div>

          <form action={createChecksByItemsAction} className="mt-5 grid gap-4">
            <input type="hidden" name="orderId" value={order.id} />
            <div className="grid grid-cols-[1fr_90px_90px] gap-3 px-1 text-xs font-bold uppercase text-yuta-ink/45">
              <span>Article</span>
              <span>Client 1</span>
              <span>Client 2</span>
            </div>
            <Separator />
            <div className="grid gap-3">
              {activeItems.map((item) => (
                <div key={item.id} className="grid grid-cols-[1fr_90px_90px] items-center gap-3 rounded-xl border border-yuta-line bg-yuta-paper p-3">
                  <div>
                    <p className="font-bold">{item.quantity} x {item.itemNameSnapshot}</p>
                    <p className="text-sm text-yuta-ink/55">{formatEuros(item.unitPriceCentsSnapshot)} / unite</p>
                  </div>
                  <QuantityInput label={`Client 1 ${item.itemNameSnapshot}`} name={`client1:${item.id}`} max={item.quantity} />
                  <QuantityInput label={`Client 2 ${item.itemNameSnapshot}`} name={`client2:${item.id}`} max={item.quantity} />
                </div>
              ))}
            </div>
            <Button type="submit" variant="accent" size="lg" disabled={activeItems.length === 0 || order.status === 'paid'}>
              Creer les tickets
            </Button>
          </form>
        </Card>
      </div>
    </main>
  );
}

function QuantityInput({ label, name, max }: { label: string; name: string; max: number }) {
  return (
    <div className="grid gap-1">
      <Label htmlFor={name} className="sr-only">{label}</Label>
      <Input id={name} name={name} type="number" min={0} max={max} defaultValue={0} inputMode="numeric" />
    </div>
  );
}

function formatEuros(cents: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(cents / 100);
}
