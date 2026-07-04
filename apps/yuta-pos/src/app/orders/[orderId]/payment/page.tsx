import { createComboService } from '@yuta/core';
import { db } from '@yuta/db/client';
import { orders } from '@yuta/db/schema';
import { ActionPanel, Badge, Button, Card, Separator } from '@yuta/ui';
import { eq } from 'drizzle-orm';
import { CreditCard, ListChecks, Split, Tags } from 'lucide-react';
import Link from 'next/link';
import {
  cancelOrderSplitAction,
  payCheckAction,
  payFullOrderAction,
  splitOrderEquallyAction,
} from '../../../actions';
import { PosHeader } from '../../../components/PosHeader';
import { PaymentCaptureForm } from './PaymentCaptureForm';

type PaymentPageProps = {
  params: Promise<{
    orderId: string;
  }>;
  searchParams: Promise<{
    error?: string;
  }>;
};

const equalPartOptions = [2, 3, 4, 5, 6];

export default async function PaymentPage({
  params,
  searchParams,
}: PaymentPageProps) {
  const { orderId } = await params;
  const { error } = await searchParams;
  const comboService = createComboService(db);
  const existingOrder = await db.query.orders.findFirst({
    where: eq(orders.id, orderId),
    with: {
      checks: true,
    },
  });

  if (!existingOrder) {
    throw new Error('Order not found.');
  }

  const hasActiveItemSplitChecks = existingOrder.checks.some(
    (check) => check.splitMode === 'items' && check.status !== 'void',
  );

  if (hasActiveItemSplitChecks) {
    await comboService.clearOrderComboDiscounts(orderId);
  } else {
    await comboService.optimizeOrderCombos(orderId);
  }

  const order = await db.query.orders.findFirst({
    where: eq(orders.id, orderId),
    with: {
      checks: {
        with: {
          items: {
            with: {
              orderItem: true,
            },
          },
          discounts: {
            with: {
              items: {
                with: {
                  checkItem: {
                    with: {
                      orderItem: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
      items: true,
      discounts: {
        with: {
          items: {
            with: {
              orderItem: true,
            },
          },
        },
      },
      payments: true,
    },
  });

  if (!order) {
    throw new Error('Order not found.');
  }

  const paidCents = order.payments
    .filter((payment) => payment.status === 'paid')
    .reduce((total, payment) => total + payment.amountCents, 0);
  const activeOrderItems = order.items.filter(
    (item) => item.status !== 'cancelled',
  );
  const cancelledOrderItems = order.items.filter(
    (item) => item.status === 'cancelled',
  );
  const remainingCents = Math.max(0, order.totalCents - paidCents);
  const equalChecks = order.checks.filter(
    (check) => check.splitMode === 'equal' && check.status !== 'void',
  );
  const itemChecks = order.checks.filter(
    (check) => check.splitMode === 'items' && check.status !== 'void',
  );
  const splitChecks = [...equalChecks, ...itemChecks];
  const hasPaidSplitCheck = splitChecks.some(
    (check) => check.status === 'paid',
  );

  return (
    <main className="min-h-screen bg-yuta-paper px-4 py-5 text-yuta-ink md:px-6 md:py-6">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-5">
        <PosHeader
          title={`Paiement - ${order.tableLabel}`}
          description={order.orderNumber}
          actions={
            <>
              <Badge
                variant={order.status === 'paid' ? 'success' : 'warning'}
                size="lg"
              >
                {order.status === 'paid' ? 'Payée' : 'À encaisser'}
              </Badge>
              <Button asChild variant="secondary" size="touch">
                <Link href={`/orders/${order.id}`}>Retour commande</Link>
              </Button>
            </>
          }
        />

        {error && (
          <div className="rounded-xl border border-yuta-line bg-yuta-mist p-3 text-sm font-semibold text-yuta-ink">
            {paymentErrorMessage(error)}
          </div>
        )}

        <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
          <Card className="rounded-lg p-0">
            <div className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold">Récapitulatif</h2>
                  <p className="mt-1 text-sm text-yuta-ink/55">
                    Les combos sont calcules au paiement.
                  </p>
                </div>
                {order.discountCents > 0 ? (
                  <Badge variant="active" className="gap-1">
                    <Tags className="h-3.5 w-3.5" />
                    Combo actif
                  </Badge>
                ) : (
                  <Badge variant="outline">Aucune remise</Badge>
                )}
              </div>
            </div>
            <Separator />
            <div className="grid gap-3 p-5">
              {activeOrderItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-3"
                >
                  <div>
                    <p className="font-semibold">
                      {item.quantity} x {item.itemNameSnapshot}
                    </p>
                  </div>
                  <p className="font-bold">
                    {formatEuros(item.unitPriceCentsSnapshot * item.quantity)}
                  </p>
                </div>
              ))}
              {cancelledOrderItems.length > 0 && (
                <div className="mt-2 grid gap-2 rounded-xl border border-yuta-line bg-yuta-paper p-3">
                  <p className="text-xs font-black uppercase text-yuta-ink/45">
                    Articles annulés
                  </p>
                  {cancelledOrderItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-start justify-between gap-3 text-yuta-ink/55"
                    >
                      <div>
                        <p className="font-semibold line-through">
                          {item.quantity} x {item.itemNameSnapshot}
                        </p>
                        <p className="mt-0.5 text-xs font-bold">
                          Annulé - non facturé
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold line-through">
                          {formatEuros(
                            item.unitPriceCentsSnapshot * item.quantity,
                          )}
                        </p>
                        <p className="mt-0.5 text-xs font-black">0,00 €</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {order.discounts.length > 0 && (
              <>
                <Separator />
                <div className="grid gap-3 bg-yuta-mist p-5">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="inline-flex items-center gap-2 text-sm font-black text-yuta-ink">
                      <Tags className="h-4 w-4" />
                      Remises combos
                    </h3>
                    <span className="text-sm font-black text-yuta-ink">
                      -{formatEuros(order.discountCents)}
                    </span>
                  </div>
                  {order.discounts.map((discount) => (
                    <div
                      key={discount.id}
                      className="rounded-xl border border-yuta-line bg-white px-3 py-2"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold">
                            {discount.nameSnapshot}
                          </p>
                          <p className="mt-1 text-xs font-semibold text-yuta-ink/55">
                            {formatDiscountItems(discount.items)}
                          </p>
                        </div>
                        <p className="font-black">
                          -{formatEuros(discount.discountCents)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            <Separator />
            <div className="grid gap-2 p-5">
              <AmountRow
                label="Sous-total articles"
                value={order.subtotalCents}
              />
              <AmountRow label="Remises combos" value={-order.discountCents} />
              <div className="flex items-center justify-between gap-3 rounded-xl border border-yuta-line bg-yuta-paper px-3 py-2">
                <span className="font-black">Total après combos</span>
                <span className="text-lg font-black">
                  {formatEuros(order.totalCents)}
                </span>
              </div>
              <AmountRow label="Déjà payé" value={paidCents} />
              <div className="mt-2 flex items-center justify-between border-t border-yuta-line pt-4">
                <span className="text-lg font-black">Reste a payer</span>
                <span className="text-2xl font-black">
                  {formatEuros(remainingCents)}
                </span>
              </div>
            </div>
          </Card>

          <div className="grid gap-5">
            <ActionPanel
              title="Payer tout"
              description="Encaissement complet"
              icon={<CreditCard className="h-5 w-5" />}
            >
              <PaymentCaptureForm
                action={payFullOrderAction}
                orderId={order.id}
                remainingCents={remainingCents}
                disabled={splitChecks.length > 0}
                submitSize="lg"
              />
              {splitChecks.length > 0 && (
                <div className="mt-4 rounded-xl border border-yuta-line bg-yuta-mist p-3">
                  <p className="text-sm font-semibold text-yuta-ink/70">
                    Paiement complet bloque car un partage est actif.
                  </p>
                  <form action={cancelOrderSplitAction} className="mt-3">
                    <input type="hidden" name="orderId" value={order.id} />
                    <Button
                      type="submit"
                      variant="secondary"
                      className="w-full"
                      disabled={hasPaidSplitCheck}
                    >
                      Annuler le partage
                    </Button>
                  </form>
                  {hasPaidSplitCheck && (
                    <p className="mt-2 text-xs font-semibold text-yuta-ink/55">
                      Impossible après encaissement d’un ticket.
                    </p>
                  )}
                </div>
              )}
            </ActionPanel>

            <ActionPanel
              title="Partager en parts égales"
              description="Diviser le total optimisé"
              icon={<Split className="h-5 w-5" />}
            >
              <form
                action={splitOrderEquallyAction}
                className="mt-5 grid gap-3"
              >
                <input type="hidden" name="orderId" value={order.id} />
                <p className="text-sm font-semibold text-yuta-ink/55">
                  Nombre de parts
                </p>
                <div className="grid grid-cols-5 gap-2">
                  {equalPartOptions.map((parts) => (
                    <Button
                      key={parts}
                      type="submit"
                      name="parts"
                      value={parts}
                      variant="secondary"
                      className="h-11 rounded-lg"
                      disabled={order.status === 'paid'}
                    >
                      {parts}
                    </Button>
                  ))}
                </div>
                <div className="rounded-lg border border-yuta-line bg-yuta-paper p-3">
                  <p className="text-xs font-black uppercase text-yuta-ink/45">
                    Montant par part
                  </p>
                  <p className="mt-1 text-2xl font-black">
                    {formatEuros(Math.ceil(order.totalCents / 2))}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-yuta-ink/55">
                    Aperçu pour 2 parts. Choisir un bouton pour créer les
                    tickets.
                  </p>
                </div>
              </form>

              {equalChecks.length > 0 && (
                <>
                  <Separator className="my-5" />
                  <CheckPaymentList
                    checks={equalChecks}
                    payments={order.payments}
                    orderId={order.id}
                  />
                </>
              )}
            </ActionPanel>

            <ActionPanel
              title="Séparer par articles"
              description="Créer des tickets par client"
              icon={<ListChecks className="h-5 w-5" />}
            >
              <Button
                asChild
                variant="secondary"
                className="mt-5 w-full"
                disabled={order.status === 'paid'}
              >
                <Link href={`/orders/${order.id}/payment/items`}>
                  Choisir les articles
                </Link>
              </Button>

              {itemChecks.length > 0 && (
                <>
                  <Separator className="my-5" />
                  <CheckPaymentList
                    checks={itemChecks}
                    payments={order.payments}
                    orderId={order.id}
                  />
                </>
              )}
            </ActionPanel>
          </div>
        </section>
      </div>
    </main>
  );
}

function CheckPaymentList({
  checks,
  payments,
  orderId,
}: {
  checks: Array<{
    id: string;
    checkLabel: string;
    splitMode: string;
    status: string;
    subtotalCents: number;
    discountCents: number;
    totalCents: number;
    items: Array<{
      quantity: number;
      amountCentsSnapshot: number;
      orderItem: {
        itemNameSnapshot: string;
        unitPriceCentsSnapshot: number;
      };
    }>;
    discounts: Array<{
      id: string;
      nameSnapshot: string;
      discountCents: number;
      items: Array<{
        quantityApplied: number;
        checkItem: {
          orderItem: {
            itemNameSnapshot: string;
          };
        };
      }>;
    }>;
  }>;
  payments: Array<{
    checkId: string | null;
    amountCents: number;
    status: string;
  }>;
  orderId: string;
}) {
  return (
    <div className="grid gap-3">
      {checks.map((check) => {
        const paidCents = payments
          .filter(
            (payment) =>
              payment.checkId === check.id && payment.status === 'paid',
          )
          .reduce((total, payment) => total + payment.amountCents, 0);
        const remainingCents = Math.max(0, check.totalCents - paidCents);

        return (
          <div
            key={check.id}
            className="rounded-xl border border-yuta-line bg-yuta-paper p-3"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-bold">{check.checkLabel}</p>
                <p className="text-sm text-yuta-ink/55">
                  {check.splitMode === 'equal'
                    ? 'Part egale'
                    : 'Articles assignes'}
                </p>
              </div>
              <Badge variant={check.status === 'paid' ? 'active' : 'outline'}>
                {check.status === 'paid' ? 'Payée' : 'Ouverte'}
              </Badge>
            </div>

            <div className="mt-3 grid gap-2 rounded-xl border border-yuta-line bg-white p-3">
              {check.items.length > 0 ? (
                <div className="grid gap-1.5">
                  {check.items.map((item) => (
                    <div
                      key={`${check.id}-${item.orderItem.itemNameSnapshot}-${item.quantity}`}
                      className="flex items-center justify-between gap-3 text-sm"
                    >
                      <span className="font-semibold text-yuta-ink/70">
                        {item.quantity} x {item.orderItem.itemNameSnapshot}
                      </span>
                      <span className="font-bold">
                        {formatEuros(item.amountCentsSnapshot)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="font-semibold text-yuta-ink/70">
                    Part egale
                  </span>
                  <span className="font-bold">
                    {formatEuros(check.subtotalCents)}
                  </span>
                </div>
              )}

              {check.discounts.length > 0 && (
                <div className="grid gap-1.5 rounded-lg bg-yuta-mist p-2">
                  <div className="flex items-center justify-between gap-3 text-xs font-black">
                    <span className="inline-flex items-center gap-1">
                      <Tags className="h-3.5 w-3.5" />
                      Combos de ce ticket
                    </span>
                    <span>-{formatEuros(check.discountCents)}</span>
                  </div>
                  {check.discounts.map((discount) => (
                    <div
                      key={discount.id}
                      className="flex items-start justify-between gap-3 rounded-lg bg-white px-2 py-1.5 text-xs"
                    >
                      <div>
                        <p className="font-bold">{discount.nameSnapshot}</p>
                        <p className="mt-0.5 font-semibold text-yuta-ink/55">
                          {formatCheckDiscountItems(discount.items)}
                        </p>
                      </div>
                      <span className="font-black">
                        -{formatEuros(discount.discountCents)}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <div className="grid gap-1 border-t border-yuta-line pt-2">
                <AmountRow
                  label="Sous-total ticket"
                  value={check.subtotalCents}
                />
                <AmountRow
                  label="Remises ticket"
                  value={-check.discountCents}
                />
                <AmountRow label="Total ticket" value={check.totalCents} />
                <AmountRow label="Déjà payé" value={paidCents} />
                <div className="flex items-center justify-between gap-3 pt-1">
                  <span className="font-black">Reste ticket</span>
                  <span className="text-lg font-black">
                    {formatEuros(remainingCents)}
                  </span>
                </div>
              </div>
            </div>

            {check.status !== 'paid' && (
              <PaymentCaptureForm
                action={payCheckAction}
                orderId={orderId}
                checkId={check.id}
                remainingCents={remainingCents}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function AmountRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="font-semibold text-yuta-ink/65">{label}</span>
      <span className="font-bold">
        {value < 0 ? '-' : ''}
        {formatEuros(Math.abs(value))}
      </span>
    </div>
  );
}

function paymentErrorMessage(error: string): string {
  const messages: Record<string, string> = {
    invalid_amount: 'Saisir un montant valide, par exemple 31 ou 31,00.',
    invalid_input: 'Le montant donné doit couvrir le montant encaissé.',
    invalid_status: 'Cette commande ou ce ticket ne peut pas etre encaisse.',
    invalid_split: 'La repartition des tickets est invalide.',
    overpayment: 'Le montant encaissé dépasse le reste à payer.',
    not_found: 'Commande ou ticket introuvable.',
  };

  return messages[error] ?? 'Impossible d enregistrer le paiement.';
}

function formatDiscountItems(
  items: Array<{
    quantityApplied: number;
    orderItem: {
      itemNameSnapshot: string;
    };
  }>,
): string {
  if (items.length === 0) {
    return 'Articles combo non disponibles';
  }

  return items
    .map(
      (item) => `${item.quantityApplied} x ${item.orderItem.itemNameSnapshot}`,
    )
    .join(' + ');
}

function formatCheckDiscountItems(
  items: Array<{
    quantityApplied: number;
    checkItem: {
      orderItem: {
        itemNameSnapshot: string;
      };
    };
  }>,
): string {
  if (items.length === 0) {
    return 'Articles combo non disponibles';
  }

  return items
    .map(
      (item) =>
        `${item.quantityApplied} x ${item.checkItem.orderItem.itemNameSnapshot}`,
    )
    .join(' + ');
}

function formatEuros(cents: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(cents / 100);
}
