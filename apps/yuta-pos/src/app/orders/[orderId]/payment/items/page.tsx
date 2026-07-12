import { createComboService, formatEuros } from '@yuta/core';
import { db } from '@yuta/db/client';
import { orders } from '@yuta/db/schema';
import { Badge, Button, Card, Input, Label } from '@yuta/ui';
import { eq } from 'drizzle-orm';
import { Users } from 'lucide-react';
import Link from 'next/link';
import { createChecksByItemsAction } from '../../../../actions';
import { PosPageShell } from '../../../../components/PosPageShell';

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

export default async function SplitItemsPage({
  params,
  searchParams,
}: SplitItemsPageProps) {
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
  const itemSplitChecks = activeChecks.filter(
    (check) => check.splitMode === 'items',
  );
  const requestedClientCount = parseClientCount(clients);
  const clientCount =
    requestedClientCount ??
    (itemSplitChecks.length > 0 ? itemSplitChecks.length : 2);
  const splitClients = Array.from({ length: clientCount }, (_, index) => ({
    key: `client${index + 1}`,
    label: `Client ${index + 1}`,
  }));
  const gridTemplateColumns = `minmax(180px, 1fr) repeat(${splitClients.length}, 82px)`;

  return (
    <PosPageShell
      backHref={`/orders/${order.id}/payment`}
      backLabel="Retour paiement"
      title="Séparer par articles"
      description={order.tableLabel}
      actions={
        <Badge variant="success" size="lg">
          {activeItems.length} article(s)
        </Badge>
      }
    >
      <Card className="rounded-lg p-0">
        <div className="flex items-center gap-3">
          <div className="ml-5 mt-5 grid h-10 w-10 place-items-center rounded-lg bg-yuta-accent">
            <Users className="h-5 w-5" />
          </div>
          <div className="mt-5">
            <h2 className="font-bold">Clients</h2>
            <p className="text-sm text-yuta-ink/55">
              {splitClients.length} client(s)
            </p>
          </div>
        </div>

        {error && (
          <div className="mx-5 mt-5 rounded-lg border border-yuta-line bg-yuta-mist p-3 text-sm font-semibold text-yuta-ink">
            {errorMessage(error)}
          </div>
        )}

        <div className="mt-5 flex flex-wrap items-center gap-2 px-5">
          <span className="text-sm font-semibold text-yuta-ink/55">
            Nombre de clients
          </span>
          {clientCountOptions.map((option) => (
            <Button
              key={option}
              asChild
              variant={option === splitClients.length ? 'primary' : 'secondary'}
              size="sm"
              className="rounded-lg"
            >
              <Link
                href={`/orders/${order.id}/payment/items?clients=${option}`}
              >
                {option}
              </Link>
            </Button>
          ))}
        </div>

        <form
          action={createChecksByItemsAction}
          className="mt-5 grid gap-4 px-5 pb-5"
        >
          <input type="hidden" name="orderId" value={order.id} />
          <input type="hidden" name="clientCount" value={splitClients.length} />
          <div className="overflow-x-auto rounded-lg border border-yuta-line bg-white pb-2">
            <div className="min-w-max">
              <div
                className="grid gap-3 bg-yuta-mist px-3 py-3 text-xs font-bold uppercase text-yuta-ink/45"
                style={{ gridTemplateColumns }}
              >
                <span>Article</span>
                {splitClients.map((client) => (
                  <span key={client.key}>{client.label}</span>
                ))}
              </div>
              <div className="grid gap-2 p-3">
                {activeItems.map((item) => (
                  <div
                    key={item.id}
                    className="grid items-center gap-3 rounded-lg border border-yuta-line bg-yuta-paper p-3"
                    style={{ gridTemplateColumns }}
                  >
                    <div>
                      <p className="font-bold">
                        {item.quantity} x {item.itemNameSnapshot}
                      </p>
                      <p className="text-sm text-yuta-ink/55">
                        {formatEuros(item.unitPriceCentsSnapshot)} / unité
                      </p>
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
          <Button
            type="submit"
            variant="accent"
            size="lg"
            disabled={activeItems.length === 0 || order.status === 'paid'}
          >
            Créer les tickets
          </Button>
        </form>
      </Card>
    </PosPageShell>
  );
}

function QuantityInput({
  label,
  name,
  max,
}: {
  label: string;
  name: string;
  max: number;
}) {
  return (
    <div className="grid gap-1">
      <Label htmlFor={name} className="sr-only">
        {label}
      </Label>
      <Input
        id={name}
        name={name}
        type="number"
        min={0}
        max={max}
        defaultValue={0}
        inputMode="numeric"
        className="h-11 rounded-lg text-center text-base font-black"
      />
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
    empty: 'Sélectionnez au moins un article pour créer les tickets.',
    quantity:
      'La quantite repartie depasse la quantite disponible pour au moins un article.',
  };

  return (
    messages[error] ?? 'Impossible de créer les tickets avec cette sélection.'
  );
}
