import { createPaymentService, formatEuros } from '@yuta/core';
import { db } from '@yuta/db/client';
import { Badge, Button, Card, Separator } from '@yuta/ui';
import { Tags } from 'lucide-react';
import {
  cancelOrderSplitAction,
  createChecksByItemsAction,
  payCheckAction,
  payFullOrderAction,
  splitOrderEquallyAction,
} from '../../../actions';
import { PosPageShell } from '../../../components/PosPageShell';
import { EqualSplitDialogContent } from './EqualSplitDialogContent';
import { ItemSplitDialogContent } from './ItemSplitDialogContent';
import { PaymentCaptureForm } from './PaymentCaptureForm';
import { PaymentChoiceDialogs } from './PaymentChoiceDialogs';

type PaymentPageProps = {
  params: Promise<{
    orderId: string;
  }>;
  searchParams: Promise<{
    error?: string;
    itemSplitError?: string;
    paymentDialog?: string;
  }>;
};

export default async function PaymentPage({
  params,
  searchParams,
}: PaymentPageProps) {
  const { orderId } = await params;
  const { error, itemSplitError, paymentDialog } = await searchParams;
  const paymentService = createPaymentService(db);
  const { order, activeComboRules } = await paymentService.getPaymentViewData(orderId);

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
  const initialItemSplitState = getInitialItemSplitState(itemChecks);

  const fullPaymentContent = (
    <>
      <PaymentCaptureForm
        action={payFullOrderAction}
        orderId={order.id}
        remainingCents={remainingCents}
        disabled={splitChecks.length > 0}
        submitSize="lg"
      />

      {splitChecks.length > 0 && (
        <div className="mt-4 rounded-lg border border-border-default bg-surface-muted p-3">
          <p className="text-sm font-semibold text-primary/70">
            Paiement complet bloqué car un partage est actif.
          </p>
        </div>
      )}
    </>
  );

  const itemSplitContent = (
    <>
      <ItemSplitDialogContent
        action={createChecksByItemsAction}
        orderId={order.id}
        items={activeOrderItems.map((item) => ({
          id: item.id,
          menuItemId: item.menuItemId,
          name: item.itemNameSnapshot,
          quantity: item.quantity,
          unitPriceCents: item.unitPriceCentsSnapshot,
          createdAt: item.createdAt.toISOString(),
        }))}
        comboRules={activeComboRules.map((rule) => ({
          id: rule.id,
          name: rule.name,
          pricingMode: rule.pricingMode,
          comboPriceCents: rule.comboPriceCents,
          priceDeltaCents: rule.priceDeltaCents,
          basePricingGroupName: rule.basePricingGroupName,
          priority: rule.priority,
          maxApplications: rule.maxApplications,
          isActive: rule.isActive,
          groups: rule.groups.map((group) => ({
            id: group.id,
            name: group.name,
            minQuantity: group.minQuantity,
            maxQuantity: group.maxQuantity,
            sortOrder: group.sortOrder,
            items: group.items.map((item) => ({
              id: item.id,
              menuItemId: item.menuItemId,
              extraPriceCents: item.extraPriceCents,
            })),
          })),
        }))}
        initialClientCount={initialItemSplitState.clientCount}
        initialQuantities={initialItemSplitState.quantities}
        disabled={order.status === 'paid'}
        error={itemSplitError}
      />

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
    </>
  );

  const equalSplitContent = (
    <>
      <EqualSplitDialogContent
        action={splitOrderEquallyAction}
        orderId={order.id}
        totalCents={order.totalCents}
        initialParts={equalChecks.length > 0 ? equalChecks.length : undefined}
        disabled={order.status === 'paid'}
      />

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
    </>
  );

  return (
    <PosPageShell
      backHref={`/orders/${order.id}`}
      backLabel="Retour commande"
      title={`Paiement - ${order.tableLabel}`}
      description={order.orderNumber}
      actions={
        <Badge
          tone={order.status === 'paid' ? 'success' : 'warning'}
          variant="solid"
        >
          {order.status === 'paid' ? 'Payée' : 'À encaisser'}
        </Badge>
      }
    >
      {error && (
        <div className="rounded-lg border border-border-default bg-surface-muted p-3 text-sm font-semibold text-primary">
          {paymentErrorMessage(error)}
        </div>
      )}

      <section className="grid gap-5">
        <Card className="rounded-lg p-0">
          <div className="p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold">Récapitulatif</h2>
                <p className="mt-1 text-sm text-primary/55">
                  Les combos sont calculés au paiement.
                </p>
              </div>
              {order.discountCents > 0 ? (
                <Badge tone="success" variant="soft" className="gap-1">
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
              <div className="mt-2 grid gap-2 rounded-lg border border-border-default bg-canvas p-3">
                <p className="text-xs font-black uppercase text-primary/45">
                  Articles annulés
                </p>
                {cancelledOrderItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start justify-between gap-3 text-primary/55"
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
              <div className="grid gap-3 bg-surface-muted p-5">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="inline-flex items-center gap-2 text-sm font-black text-primary">
                    <Tags className="h-4 w-4" />
                    Remises combos
                  </h3>
                  <span className="text-sm font-black text-primary">
                    -{formatEuros(order.discountCents)}
                  </span>
                </div>
                {order.discounts.map((discount) => (
                  <div
                    key={discount.id}
                    className="rounded-lg border border-border-default bg-white px-3 py-2"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold">{discount.nameSnapshot}</p>
                        <p className="mt-1 text-xs font-semibold text-primary/55">
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
            <div className="flex items-center justify-between gap-3 rounded-lg border border-border-default bg-canvas px-3 py-2">
              <span className="font-black">Total après combos</span>
              <span className="text-lg font-black">
                {formatEuros(order.totalCents)}
              </span>
            </div>
            <AmountRow label="Déjà payé" value={paidCents} />
            <div className="mt-2 flex items-center justify-between border-t border-border-default pt-4">
              <span className="text-lg font-black">Reste à payer</span>
              <span className="text-2xl font-black">
                {formatEuros(remainingCents)}
              </span>
            </div>
          </div>
        </Card>

        <PaymentChoiceDialogs
          fullPaymentContent={fullPaymentContent}
          itemSplitContent={itemSplitContent}
          equalSplitContent={equalSplitContent}
          fullPaymentLabel={formatEuros(remainingCents)}
          itemSplitLabel="Par articles"
          equalSplitLabel="Parts égales"
          itemSplitDefaultOpen={
            Boolean(itemSplitError) || paymentDialog === 'item-split'
          }
          equalSplitDefaultOpen={paymentDialog === 'equal-split'}
        />

        {splitChecks.length > 0 && (
          <Card className="rounded-lg p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-black">Partage actif</p>
                <p className="mt-1 text-sm font-semibold text-primary/55">
                  Annuler le partage pour revenir au paiement complet.
                </p>
                {hasPaidSplitCheck && (
                  <p className="mt-1 text-xs font-semibold text-primary/45">
                    Impossible après encaissement d'un ticket.
                  </p>
                )}
              </div>
              <form action={cancelOrderSplitAction}>
                <input type="hidden" name="orderId" value={order.id} />
                <Button
                  type="submit"
                  variant="secondary"
                  className="w-full sm:w-auto"
                  disabled={hasPaidSplitCheck}
                >
                  Annuler le partage
                </Button>
              </form>
            </div>
          </Card>
        )}
      </section>
    </PosPageShell>
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
            className="rounded-lg border border-border-default bg-canvas p-3"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-bold">{check.checkLabel}</p>
                <p className="text-sm text-primary/55">
                  {check.splitMode === 'equal'
                    ? 'Part égale'
                    : 'Articles assignés'}
                </p>
              </div>
              <Badge
                tone={check.status === 'paid' ? 'success' : 'neutral'}
                variant={check.status === 'paid' ? 'soft' : 'outline'}
              >
                {check.status === 'paid' ? 'Payée' : 'Ouverte'}
              </Badge>
            </div>

            <div className="mt-3 grid gap-2 rounded-lg border border-border-default bg-white p-3">
              {check.items.length > 0 ? (
                <div className="grid gap-1.5">
                  {check.items.map((item) => (
                    <div
                      key={`${check.id}-${item.orderItem.itemNameSnapshot}-${item.quantity}`}
                      className="flex items-center justify-between gap-3 text-sm"
                    >
                      <span className="font-semibold text-primary/70">
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
                  <span className="font-semibold text-primary/70">
                    Part égale
                  </span>
                  <span className="font-bold">
                    {formatEuros(check.subtotalCents)}
                  </span>
                </div>
              )}

              {check.discounts.length > 0 && (
                <div className="grid gap-1.5 rounded-lg bg-surface-muted p-2">
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
                        <p className="mt-0.5 font-semibold text-primary/55">
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

              <div className="grid gap-1 border-t border-border-default pt-2">
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

function getInitialItemSplitState(
  itemChecks: Array<{
    checkLabel: string;
    items: Array<{
      quantity: number;
      orderItem: {
        id: string;
      };
    }>;
  }>,
): {
  clientCount: number | undefined;
  quantities: Record<string, number>;
} {
  if (itemChecks.length === 0) {
    return {
      clientCount: undefined,
      quantities: {},
    };
  }

  const quantities: Record<string, number> = {};
  let maxClientIndex = itemChecks.length;

  itemChecks.forEach((check, index) => {
    const clientIndex = parseClientIndex(check.checkLabel) ?? index + 1;
    maxClientIndex = Math.max(maxClientIndex, clientIndex);

    check.items.forEach((item) => {
      quantities[`client${clientIndex}:${item.orderItem.id}`] = item.quantity;
    });
  });

  return {
    clientCount: maxClientIndex,
    quantities,
  };
}

function parseClientIndex(label: string): number | null {
  const match = /^Client\s+(\d+)$/i.exec(label.trim());
  const parsedIndex = match ? Number(match[1]) : null;

  if (
    !Number.isInteger(parsedIndex) ||
    parsedIndex === null ||
    parsedIndex < 1
  ) {
    return null;
  }

  return parsedIndex;
}

function AmountRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="font-semibold text-primary/65">{label}</span>
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
    invalid_status: 'Cette commande ou ce ticket ne peut pas être encaissé.',
    invalid_split: 'La répartition des tickets est invalide.',
    overpayment: 'Le montant encaissé dépasse le reste à payer.',
    not_found: 'Commande ou ticket introuvable.',
  };

  return messages[error] ?? "Impossible d'enregistrer le paiement.";
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
