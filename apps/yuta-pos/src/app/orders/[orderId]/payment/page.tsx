import { createComboService } from '@yuta/core';
import { db } from '@yuta/db/client';
import { orders } from '@yuta/db/schema';
import { Badge, Button, Card, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Separator } from '@yuta/ui';
import { eq } from 'drizzle-orm';
import { ArrowLeft, Banknote, CreditCard, ListChecks, Split } from 'lucide-react';
import Link from 'next/link';
import { payCheckAction, payFullOrderAction, splitOrderEquallyAction } from '../../../actions';

type PaymentPageProps = {
  params: Promise<{
    orderId: string;
  }>;
};

export default async function PaymentPage({ params }: PaymentPageProps) {
  const { orderId } = await params;
  const comboService = createComboService(db);

  await comboService.optimizeOrderCombos(orderId);

  const order = await db.query.orders.findFirst({
    where: eq(orders.id, orderId),
    with: {
      checks: true,
      items: true,
      discounts: true,
      payments: true,
    },
  });

  if (!order) {
    throw new Error('Order not found.');
  }

  const paidCents = order.payments
    .filter((payment) => payment.status === 'paid')
    .reduce((total, payment) => total + payment.amountCents, 0);
  const remainingCents = Math.max(0, order.totalCents - paidCents);
  const equalChecks = order.checks.filter((check) => check.splitMode === 'equal');
  const itemChecks = order.checks.filter((check) => check.splitMode === 'items');
  const splitChecks = [...equalChecks, ...itemChecks];

  return (
    <main className="min-h-screen bg-yuta-paper px-4 py-5 text-yuta-ink md:px-8 md:py-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-5">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-yuta-line pb-5">
          <div>
            <Link href={`/orders/${order.id}`} className="mb-2 inline-flex items-center gap-2 text-sm font-semibold text-yuta-ink/60 hover:text-yuta-ink">
              <ArrowLeft className="h-4 w-4" />
              Retour commande
            </Link>
            <h1 className="text-2xl font-black tracking-tight md:text-3xl">Paiement - {order.tableLabel}</h1>
            <p className="mt-1 text-sm text-yuta-ink/55">{order.orderNumber}</p>
          </div>
          <Badge variant={order.status === 'paid' ? 'active' : 'neutral'}>{order.status === 'paid' ? 'Payee' : 'A encaisser'}</Badge>
        </header>

        <section className="grid gap-5 lg:grid-cols-[1fr_360px]">
          <Card className="p-0">
            <div className="p-5">
              <h2 className="text-lg font-bold">Recapitulatif</h2>
              <p className="mt-1 text-sm text-yuta-ink/55">Combos appliques automatiquement</p>
            </div>
            <Separator />
            <div className="grid gap-3 p-5">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold">{item.quantity} x {item.itemNameSnapshot}</p>
                    {item.status === 'cancelled' && <p className="text-sm text-yuta-ink/45">Annule</p>}
                  </div>
                  <p className="font-bold">{formatEuros(item.unitPriceCentsSnapshot * item.quantity)}</p>
                </div>
              ))}
            </div>

            {order.discounts.length > 0 && (
              <>
                <Separator />
                <div className="grid gap-3 p-5">
                  <h3 className="text-sm font-bold text-yuta-ink/60">Remises</h3>
                  {order.discounts.map((discount) => (
                    <div key={discount.id} className="flex items-center justify-between gap-3">
                      <p className="font-semibold">{discount.nameSnapshot}</p>
                      <p className="font-bold">-{formatEuros(discount.discountCents)}</p>
                    </div>
                  ))}
                </div>
              </>
            )}

            <Separator />
            <div className="grid gap-2 p-5">
              <AmountRow label="Sous-total" value={order.subtotalCents} />
              <AmountRow label="Remises" value={-order.discountCents} />
              <AmountRow label="Deja paye" value={-paidCents} />
              <div className="mt-2 flex items-center justify-between border-t border-yuta-line pt-4">
                <span className="text-lg font-black">Reste a payer</span>
                <span className="text-2xl font-black">{formatEuros(remainingCents)}</span>
              </div>
            </div>
          </Card>

          <div className="grid gap-5">
            <Card>
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-2xl bg-yuta-accent">
                  <CreditCard className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-bold">Payer tout</h2>
                  <p className="text-sm text-yuta-ink/55">Encaissement complet</p>
                </div>
              </div>

              <form action={payFullOrderAction} className="mt-5 grid gap-4">
                <input type="hidden" name="orderId" value={order.id} />
                <input type="hidden" name="amountCents" value={remainingCents} />

                <PaymentMethodSelect id="method" />

                <div className="grid gap-2">
                  <Label htmlFor="tenderedCents">Montant donne en centimes</Label>
                  <Input id="tenderedCents" name="tenderedCents" type="number" min={remainingCents} placeholder={String(remainingCents)} />
                </div>

                <Button type="submit" variant="accent" size="lg" disabled={remainingCents === 0 || splitChecks.length > 0}>
                  <Banknote className="h-4 w-4" />
                  Encaisser {formatEuros(remainingCents)}
                </Button>
              </form>
            </Card>

            <Card>
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-2xl bg-yuta-mist">
                  <Split className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-bold">Partager en parts egales</h2>
                  <p className="text-sm text-yuta-ink/55">Diviser le total optimise</p>
                </div>
              </div>

              <form action={splitOrderEquallyAction} className="mt-5 grid gap-3">
                <input type="hidden" name="orderId" value={order.id} />
                <div className="grid gap-2">
                  <Label htmlFor="parts">Nombre de parts</Label>
                  <Input id="parts" name="parts" type="number" min={2} max={99} defaultValue={2} disabled={order.status === 'paid'} />
                </div>
                <Button type="submit" variant="secondary" disabled={order.status === 'paid'}>
                  Creer les tickets
                </Button>
              </form>

              {equalChecks.length > 0 && (
                <>
                  <Separator className="my-5" />
                  <CheckPaymentList checks={equalChecks} orderId={order.id} />
                </>
              )}
            </Card>

            <Card>
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-2xl bg-yuta-mist">
                  <ListChecks className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-bold">Separer par articles</h2>
                  <p className="text-sm text-yuta-ink/55">Creer des tickets par client</p>
                </div>
              </div>

              <Button asChild variant="secondary" className="mt-5 w-full" disabled={order.status === 'paid'}>
                <Link href={`/orders/${order.id}/payment/items`}>Choisir les articles</Link>
              </Button>

              {itemChecks.length > 0 && (
                <>
                  <Separator className="my-5" />
                  <CheckPaymentList checks={itemChecks} orderId={order.id} />
                </>
              )}
            </Card>
          </div>
        </section>
      </div>
    </main>
  );
}

function CheckPaymentList({ checks, orderId }: { checks: Array<{ id: string; checkLabel: string; status: string; totalCents: number }>; orderId: string }) {
  return (
    <div className="grid gap-3">
      {checks.map((check) => (
        <div key={check.id} className="rounded-xl border border-yuta-line bg-yuta-paper p-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-bold">{check.checkLabel}</p>
              <p className="text-sm text-yuta-ink/55">{formatEuros(check.totalCents)}</p>
            </div>
            <Badge variant={check.status === 'paid' ? 'active' : 'outline'}>
              {check.status === 'paid' ? 'Payee' : 'Ouverte'}
            </Badge>
          </div>
          {check.status !== 'paid' && (
            <form action={payCheckAction} className="mt-3 grid gap-3">
              <input type="hidden" name="orderId" value={orderId} />
              <input type="hidden" name="checkId" value={check.id} />
              <input type="hidden" name="amountCents" value={check.totalCents} />
              <PaymentMethodSelect id={`method-${check.id}`} />
              <Button type="submit" variant="accent" className="w-full">
                Encaisser {formatEuros(check.totalCents)}
              </Button>
            </form>
          )}
        </div>
      ))}
    </div>
  );
}

function PaymentMethodSelect({ id }: { id: string }) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>Moyen de paiement</Label>
      <Select name="method" defaultValue="card" required>
        <SelectTrigger id={id}>
          <SelectValue placeholder="Choisir" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="card">Carte</SelectItem>
          <SelectItem value="cash">Especes</SelectItem>
          <SelectItem value="ticket_resto">Ticket resto</SelectItem>
          <SelectItem value="other">Autre</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

function AmountRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="font-semibold text-yuta-ink/65">{label}</span>
      <span className="font-bold">{value < 0 ? '-' : ''}{formatEuros(Math.abs(value))}</span>
    </div>
  );
}

function formatEuros(cents: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(cents / 100);
}
