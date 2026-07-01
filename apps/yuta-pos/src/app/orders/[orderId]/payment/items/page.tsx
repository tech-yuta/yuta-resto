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
  searchParams: Promise<{
    clients?: string;
    error?: string;
  }>;
};

const clientCountOptions = [2, 3, 4, 5, 6, 8, 10, 12];

export default async function SplitItemsPage({ params, searchParams }: SplitItemsPageProps) {
  const { orderId } = await params;
  const { clients, error } = await searchParams;
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
  const activeChecks = order.checks.filter((check) => check.status !== 'void');
  const itemSplitChecks = activeChecks.filter((check) => check.splitMode === 'items');
  const requestedClientCount = parseClientCount(clients);
  const clientCount = requestedClientCount ?? (itemSplitChecks.length > 0 ? itemSplitChecks.length : 2);
  const splitClients = Array.from({ length: clientCount }, (_, index) => ({
    key: `client${index + 1}`,
    label: `Client ${index + 1}`,
  }));
  const gridTemplateColumns = `minmax(180px, 1fr) repeat(${splitClients.length}, 82px)`;

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
              <p className="text-sm text-yuta-ink/55">{splitClients.length} client(s)</p>
            </div>
          </div>

          {error && (
            <div className="mt-5 rounded-xl border border-yuta-line bg-yuta-mist p-3 text-sm font-semibold text-yuta-ink">
              {errorMessage(error)}
            </div>
          )}

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-yuta-ink/55">Nombre de clients</span>
            {clientCountOptions.map((option) => (
              <Button
                key={option}
                asChild
                variant={option === splitClients.length ? 'primary' : 'secondary'}
                size="sm"
              >
                <Link href={`/orders/${order.id}/payment/items?clients=${option}`}>{option}</Link>
              </Button>
            ))}
          </div>

          <form action={createChecksByItemsAction} className="mt-5 grid gap-4">
            <input type="hidden" name="orderId" value={order.id} />
            <input type="hidden" name="clientCount" value={splitClients.length} />
            <div className="overflow-x-auto pb-2">
              <div className="min-w-max">
                <div className="grid gap-3 px-1 text-xs font-bold uppercase text-yuta-ink/45" style={{ gridTemplateColumns }}>
                  <span>Article</span>
                  {splitClients.map((client) => (
                    <span key={client.key}>{client.label}</span>
                  ))}
                </div>
                <Separator className="my-3" />
                <div className="grid gap-3">
                  {activeItems.map((item) => (
                    <div
                      key={item.id}
                      className="grid items-center gap-3 rounded-xl border border-yuta-line bg-yuta-paper p-3"
                      style={{ gridTemplateColumns }}
                    >
                      <div>
                        <p className="font-bold">{item.quantity} x {item.itemNameSnapshot}</p>
                        <p className="text-sm text-yuta-ink/55">{formatEuros(item.unitPriceCentsSnapshot)} / unite</p>
                      </div>
                      {splitClients.map((client) => (
                        <QuantityInput
                          key={client.key}
                          label={`${client.label} ${item.itemNameSnapshot}`}
                          name={`${client.key}:${item.id}`}
                          max={item.quantity}
                        />
                      ))}
                    </div>
                  ))}
                </div>
              </div>
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

function parseClientCount(value: string | undefined): number | null {
  const parsedValue = Number(value);

  if (!Number.isInteger(parsedValue) || parsedValue < 2 || parsedValue > 12) {
    return null;
  }

  return parsedValue;
}

function errorMessage(error: string): string {
  const messages: Record<string, string> = {
    empty: 'Selectionnez au moins un article pour creer les tickets.',
    quantity: 'La quantite repartie depasse la quantite disponible pour au moins un article.',
  };

  return messages[error] ?? 'Impossible de creer les tickets avec cette selection.';
}

function formatEuros(cents: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(cents / 100);
}
