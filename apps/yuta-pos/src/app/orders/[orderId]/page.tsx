import { createOrderService, formatEuros } from '@yuta/core';
import { db } from '@yuta/db/client';
import { payments } from '@yuta/db/schema';
import { Badge, Button, Card, Separator, cn } from '@yuta/ui';
import { and, eq } from 'drizzle-orm';
import {
  Clock,
  CreditCard,
  Printer,
  Plus,
  Send,
  ShieldCheck,
  StickyNote,
  Table2,
  Trash2,
  User,
} from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { cancelOrderAction, sendOrderToKitchenAction } from '../../actions';
import { PosPageShell } from '../../components/PosPageShell';

type OrderPageProps = {
  params: Promise<{
    orderId: string;
  }>;
};

type OrderDetail = Awaited<
  ReturnType<ReturnType<typeof createOrderService>['getOrderDetail']>
>;

export default async function OrderPage({ params }: OrderPageProps) {
  const { orderId } = await params;
  const orderService = createOrderService(db);
  const order = await orderService.getOrderDetail(orderId);
  const paidPayments = await db.query.payments.findMany({
    where: and(eq(payments.orderId, order.id), eq(payments.status, 'paid')),
  });
  const activeItems = order.items.filter((item) => item.status !== 'cancelled');
  const pendingItemCount = order.items.filter(
    (item) => item.status === 'pending',
  ).length;
  const canSendToKitchen =
    pendingItemCount > 0 &&
    order.status !== 'paid' &&
    order.status !== 'cancelled';
  const canPay = order.status !== 'paid' && order.status !== 'cancelled';
  const canCancel = canPay && paidPayments.length === 0;
  const canEditItems =
    canPay && paidPayments.length === 0 && order.paymentMode === 'single';

  return (
    <PosPageShell
      title={order.tableLabel}
      description={order.orderNumber}
      actions={
        <>
          <SendOrderButton
            orderId={order.id}
            disabled={!canSendToKitchen}
            className="border-white/15 bg-primary text-white hover:bg-white/10"
            fullWidth={false}
          />
          <PaymentButton
            orderId={order.id}
            disabled={!canPay}
            className="border border-white/10"
            fullWidth={false}
          />
        </>
      }
      contentClassName="px-4 py-4 md:px-6 md:py-5"
      maxWidthClassName="max-w-7xl"
    >
      <div className="grid gap-4">
        <OrderSummaryHeader
          order={order}
          canPay={canPay}
          canSendToKitchen={canSendToKitchen}
        />

        <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(260px,0.8fr)_minmax(260px,0.8fr)_minmax(300px,0.9fr)]">
          <ArticlesPanel
            order={order}
            items={activeItems}
            canEdit={canEditItems}
          />
          <TotalsPanel order={order} />
          <HistoryPanel order={order} />
          <InfoPanel order={order} />
        </section>

        <form action={cancelOrderAction}>
          <input type="hidden" name="orderId" value={order.id} />
          <Button
            type="submit"
            variant="danger"
            className="min-h-12 w-full justify-center border border-status-danger bg-white text-action-danger hover:bg-surface-muted"
            disabled={!canCancel}
          >
            <Trash2 className="h-4 w-4" />
            Annuler la commande
          </Button>
        </form>
      </div>
    </PosPageShell>
  );
}

function OrderSummaryHeader({
  order,
  canPay,
  canSendToKitchen,
}: {
  order: OrderDetail;
  canPay: boolean;
  canSendToKitchen: boolean;
}) {
  return (
    <section className="grid gap-3 bg-white md:grid-cols-[minmax(0,1fr)_auto] md:items-start">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-2xl font-black">{order.tableLabel}</h2>
          <StatusBadge status={order.status} />
        </div>
        <p className="mt-2 text-sm font-semibold text-primary/55">
          {order.orderNumber}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-4 text-sm font-semibold text-primary/55">
          <span className="inline-flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {formatTime(order.createdAt)}
          </span>
          <span className="inline-flex items-center gap-1">
            <User className="h-4 w-4" />
            {activeItemCount(order)} article(s)
          </span>
          <span className="hidden items-center gap-1 md:inline-flex">
            <Table2 className="h-4 w-4" />
            {orderTypeLabel(order.orderType)}
          </span>
          <span className="hidden items-center gap-1 md:inline-flex">
            <User className="h-4 w-4" />
            Creee par Utilisateur
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 md:hidden">
        <SendOrderButton orderId={order.id} disabled={!canSendToKitchen} />
        <PaymentButton orderId={order.id} disabled={!canPay} />
      </div>
    </section>
  );
}

function SendOrderButton({
  orderId,
  disabled,
  className,
  fullWidth = true,
}: {
  orderId: string;
  disabled: boolean;
  className?: string;
  fullWidth?: boolean;
}) {
  return (
    <form action={sendOrderToKitchenAction}>
      <input type="hidden" name="orderId" value={orderId} />
      <Button
        type="submit"
        variant="secondary"
        disabled={disabled}
        className={cn(fullWidth && 'w-full', className)}
      >
        <Send className="h-4 w-4" />
        Envoyer
      </Button>
    </form>
  );
}

function PaymentButton({
  orderId,
  disabled,
  className,
  fullWidth = true,
}: {
  orderId: string;
  disabled: boolean;
  className?: string;
  fullWidth?: boolean;
}) {
  if (disabled) {
    return (
      <Button
        variant="primary"
        disabled
        className={cn(fullWidth && 'w-full', className)}
      >
        <CreditCard className="h-4 w-4" />
        Payer
      </Button>
    );
  }

  return (
    <Button
      asChild
      variant="primary"
      className={cn(fullWidth && 'w-full', className)}
    >
      <Link href={`/orders/${orderId}/payment`}>
        <CreditCard className="h-4 w-4" />
        Payer
      </Link>
    </Button>
  );
}

function ArticlesPanel({
  order,
  items,
  canEdit,
}: {
  order: OrderDetail;
  items: OrderDetail['items'];
  canEdit: boolean;
}) {
  return (
    <Card padding="none" className="rounded-lg shadow-none">
      <div className="p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-black">Articles</h3>
            <Badge tone="neutral" variant="soft" size="sm">
              {items.length}
            </Badge>
          </div>
          {canEdit && (
            <Button asChild variant="secondary" size="sm">
              <Link href={`/orders/${order.id}/items`}>
                <Plus className="h-4 w-4" />
                Ajouter
              </Link>
            </Button>
          )}
        </div>
      </div>
      <Separator />
      <div className="grid gap-3 p-4">
        {items.length === 0 ? (
          <p className="rounded-lg bg-canvas p-3 text-sm font-semibold text-primary/55">
            Aucun article pour le moment.
          </p>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className={cn(
                'grid grid-cols-[24px_minmax(0,1fr)_auto] gap-3 text-sm',
                item.status === 'cancelled' && 'opacity-60',
              )}
            >
              <span className="font-black">{item.quantity}</span>
              <div className="min-w-0">
                <p className="truncate font-black">{item.itemNameSnapshot}</p>
                {item.note && (
                  <p className="mt-1 text-xs font-semibold text-primary/55">
                    Note: {item.note}
                  </p>
                )}
              </div>
              <span className="font-black">
                {formatEuros(item.unitPriceCentsSnapshot * item.quantity)}
              </span>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}

function TotalsPanel({ order }: { order: OrderDetail }) {
  return (
    <Card padding="none" className="rounded-lg shadow-none">
      <div className="grid gap-3 p-4">
        <AmountRow label="Sous-total" value={order.subtotalCents} />
        <AmountRow label="Remise" value={-order.discountCents} />
        <Separator />
        <div className="flex items-center justify-between gap-3 pt-1">
          <span className="text-lg font-black">Total</span>
          <span className="text-xl font-black text-status-success">
            {formatEuros(order.totalCents)}
          </span>
        </div>
      </div>
    </Card>
  );
}

function HistoryPanel({ order }: { order: OrderDetail }) {
  const events = buildHistoryEvents(order);

  return (
    <Card padding="none" className="rounded-lg shadow-none">
      <div className="p-4">
        <h3 className="text-base font-black">Historique</h3>
      </div>
      <Separator />
      <div className="grid gap-3 p-4">
        {events.map((event, index) => (
          <div
            key={`${event.label}-${index}`}
            className="grid grid-cols-[12px_48px_minmax(0,1fr)] gap-3 text-sm"
          >
            <span
              className={cn(
                'mt-1.5 h-2 w-2 rounded-full',
                event.done ? 'bg-status-success' : 'bg-border-default',
              )}
            />
            <span className="font-semibold text-primary/55">{event.time}</span>
            <span
              className={cn(
                'font-semibold',
                event.done && event.highlight && 'text-status-success',
                !event.done && 'text-primary/55',
              )}
            >
              {event.label}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}

function InfoPanel({ order }: { order: OrderDetail }) {
  const note = order.note?.trim();

  return (
    <Card padding="none" className="rounded-lg shadow-none">
      <div className="p-4">
        <h3 className="text-base font-black">Informations</h3>
      </div>
      <Separator />
      <div className="grid gap-4 p-4">
        <InfoRow
          icon={<ShieldCheck className="h-4 w-4 text-status-success" />}
          label="Type de commande"
          value={orderTypeLabel(order.orderType)}
        />
        <InfoRow
          icon={<Table2 className="h-4 w-4 text-status-success" />}
          label="Repere / Table"
          value={order.tableLabel}
        />
        <InfoRow
          icon={<Printer className="h-4 w-4 text-primary/55" />}
          label="Imprimante cuisine"
          value="Cuisine"
        />
        {note && (
          <InfoRow
            icon={<StickyNote className="h-4 w-4 text-primary/55" />}
            label="Note"
            value={note}
          />
        )}
      </div>
    </Card>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="grid grid-cols-[20px_minmax(0,1fr)_minmax(0,auto)] items-center gap-3 text-sm">
      {icon}
      <span className="font-semibold text-primary/55">{label}</span>
      <span className="min-w-0 text-right font-black">{value}</span>
    </div>
  );
}

function AmountRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="font-semibold text-primary/60">{label}</span>
      <span className="font-black">
        {value < 0 ? '-' : ''}
        {formatEuros(Math.abs(value))}
      </span>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  return <Badge {...statusBadgeProps(status)}>{statusLabel(status)}</Badge>;
}

function buildHistoryEvents(order: OrderDetail) {
  const sentAt =
    order.sentAt ??
    firstItemDate(order, ['sent', 'preparing', 'ready', 'served']);
  const preparingAt = firstItemDate(order, ['preparing', 'ready', 'served']);
  const readyAt = firstItemReadyDate(order);
  const servedAt = firstItemServedDate(order);
  const hasActiveItems = activeItemCount(order) > 0;

  return [
    {
      done: true,
      highlight: false,
      label: 'Commande créée',
      time: formatTime(order.createdAt),
    },
    {
      done: Boolean(sentAt),
      highlight: true,
      label: 'Commande envoyée en cuisine',
      time: sentAt ? formatTime(sentAt) : '-',
    },
    {
      done: Boolean(preparingAt),
      highlight: order.status === 'preparing',
      label: preparingAt ? 'Préparation en cours' : 'En attente de préparation',
      time: preparingAt ? formatTime(preparingAt) : '-',
    },
    {
      done: Boolean(readyAt),
      highlight: order.status === 'ready',
      label: 'Prête',
      time: readyAt ? formatTime(readyAt) : '-',
    },
    {
      done: Boolean(servedAt),
      highlight: order.status === 'served',
      label: 'Servie',
      time: servedAt ? formatTime(servedAt) : '-',
    },
    {
      done: Boolean(order.paidAt),
      highlight: order.status === 'paid',
      label: 'Payée',
      time: order.paidAt ? formatTime(order.paidAt) : '-',
    },
    {
      done: Boolean(order.cancelledAt),
      highlight: order.status === 'cancelled',
      label:
        order.status === 'cancelled' || !hasActiveItems
          ? 'Annulée'
          : 'Annulation partielle',
      time: order.cancelledAt
        ? formatTime(order.cancelledAt)
        : firstItemCancelledTime(order),
    },
  ].filter((event) => event.done || isNextHistoryEvent(event.label, order));
}

function isNextHistoryEvent(label: string, order: OrderDetail): boolean {
  if (order.status === 'cancelled' || order.status === 'paid') {
    return false;
  }

  if (label === 'Commande envoyée en cuisine') {
    return order.status === 'draft';
  }

  if (label === 'En attente de préparation') {
    return order.status === 'sent';
  }

  if (label === 'Prête') {
    return order.status === 'preparing';
  }

  if (label === 'Servie') {
    return order.status === 'ready';
  }

  if (label === 'Payée') {
    return order.status === 'served';
  }

  return false;
}

function firstItemDate(order: OrderDetail, statuses: string[]): Date | null {
  const dates = order.items
    .filter((item) => statuses.includes(item.status))
    .map((item) => item.readyAt ?? item.sentAt ?? item.createdAt)
    .sort((left, right) => left.getTime() - right.getTime());

  return dates[0] ?? null;
}

function firstItemReadyDate(order: OrderDetail): Date | null {
  const dates = order.items
    .filter((item) => item.readyAt)
    .map((item) => item.readyAt as Date)
    .sort((left, right) => left.getTime() - right.getTime());

  return dates[0] ?? null;
}

function firstItemServedDate(order: OrderDetail): Date | null {
  const dates = order.items
    .filter((item) => item.servedAt)
    .map((item) => item.servedAt as Date)
    .sort((left, right) => left.getTime() - right.getTime());

  return dates[0] ?? null;
}

function firstItemCancelledTime(order: OrderDetail): string {
  const dates = order.items
    .filter((item) => item.cancelledAt)
    .map((item) => item.cancelledAt as Date)
    .sort((left, right) => left.getTime() - right.getTime());

  return dates[0] ? formatTime(dates[0]) : '-';
}

function activeItemCount(order: OrderDetail): number {
  return order.items.filter((item) => item.status !== 'cancelled').length;
}

function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    draft: 'Non envoyee',
    sent: 'Envoyee',
    preparing: 'En preparation',
    ready: 'Prete',
    served: 'Servie',
    paid: 'Payee',
    cancelled: 'Annulee',
  };

  return labels[status] ?? status;
}

function statusBadgeProps(status: string) {
  if (status === 'sent' || status === 'ready') {
    return { tone: 'success', variant: 'soft' } as const;
  }

  if (status === 'preparing') {
    return { tone: 'info', variant: 'soft' } as const;
  }

  if (status === 'draft') {
    return { tone: 'warning', variant: 'soft' } as const;
  }

  if (status === 'paid') {
    return { tone: 'neutral', variant: 'soft' } as const;
  }

  if (status === 'cancelled') {
    return { tone: 'danger', variant: 'solid' } as const;
  }

  return { tone: 'neutral', variant: 'outline' } as const;
}

function orderTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    dine_in: 'Sur place',
    takeaway: 'A emporter',
    delivery: 'Livraison',
  };

  return labels[type] ?? type;
}

function formatTime(date: Date): string {
  return new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}
